import type { WeeklyChoiceEffect } from "economy-simulator-data";
import {
	appendGameEvents,
	type GameRunState,
	loadGameRunState,
	loadPopulationChunkRaw,
	loadPopulationMeta as loadPopulationMetaRepo,
	saveGameRunState,
	savePopulationChunkRaw,
	type TemporaryRunModifier,
} from "economy-simulator-persistence";
import { formatChunkKey, getChunkCount } from "../data/population-cohorts";
import { Person, type PersonSnapshot } from "../models/Person";
import {
	ensureRegionResourceStates,
	ensureWorld,
	saveRegionResourceStates,
	saveWorldRegions,
} from "../storage/world";

function isPersonSnapshot(value: unknown): value is PersonSnapshot {
	if (!value || typeof value !== "object") return false;
	const person = value as PersonSnapshot;
	return typeof person.faceId === "string";
}

async function applyRegionalCitizenDeltas(input: {
	regionId: string;
	happinessDelta?: number;
	healthDelta?: number;
	evacuateLaborPercent?: number;
}): Promise<number> {
	const meta = await loadPopulationMetaRepo();
	if (!meta) return 0;

	const happinessDelta = input.happinessDelta ?? 0;
	const healthDelta = input.healthDelta ?? 0;
	const evacuatePercent = input.evacuateLaborPercent ?? 0;
	let affected = 0;
	const extractiveCandidates: Array<{
		cohort: number;
		chunkIndex: number;
		offset: number;
	}> = [];

	for (let cohort = 0; cohort < meta.cohortCount; cohort++) {
		const chunkCount = getChunkCount(meta.cohortSizes[cohort] ?? 0);
		for (let chunkIndex = 0; chunkIndex < chunkCount; chunkIndex++) {
			const raw = await loadPopulationChunkRaw(
				formatChunkKey(cohort, chunkIndex),
			);
			if (!raw?.every(isPersonSnapshot)) continue;
			const chunk = raw.map((item) => Person.fromSnapshot(item));
			let dirty = false;

			for (let offset = 0; offset < chunk.length; offset++) {
				const person = chunk[offset];
				if (!person?.isLiving() || person.getRegionId() !== input.regionId) {
					continue;
				}

				if (happinessDelta !== 0) {
					const happiness = person.getOverallHappiness() ?? 50;
					person.setOverallHappiness(
						Math.max(0, Math.min(100, happiness + happinessDelta)),
					);
					dirty = true;
				}
				if (healthDelta !== 0) {
					const health = person.getOverallHealth() ?? 50;
					person.setOverallHealth(
						Math.max(0, Math.min(100, health + healthDelta)),
					);
					dirty = true;
				}

				if (
					evacuatePercent > 0 &&
					person.getCategoryId() === "extractive" &&
					person.getSubSectorId()
				) {
					extractiveCandidates.push({ cohort, chunkIndex, offset });
				}

				if (dirty) affected += 1;
			}

			if (dirty) {
				await savePopulationChunkRaw(
					formatChunkKey(cohort, chunkIndex),
					chunk.map((person) => person.toSnapshot()),
				);
			}
		}
	}

	if (evacuatePercent > 0 && extractiveCandidates.length > 0) {
		const count = Math.floor(
			(extractiveCandidates.length * evacuatePercent) / 100,
		);
		const selected = extractiveCandidates.slice(0, count);
		const byChunk = new Map<string, typeof selected>();
		for (const entry of selected) {
			const key = `${entry.cohort}:${entry.chunkIndex}`;
			const list = byChunk.get(key) ?? [];
			list.push(entry);
			byChunk.set(key, list);
		}

		for (const [key, entries] of byChunk) {
			const [cohortText, chunkText] = key.split(":");
			const cohort = Number(cohortText);
			const chunkIndex = Number(chunkText);
			const raw = await loadPopulationChunkRaw(
				formatChunkKey(cohort, chunkIndex),
			);
			if (!raw?.every(isPersonSnapshot)) continue;
			const chunk = raw.map((item) => Person.fromSnapshot(item));
			for (const entry of entries) {
				const person = chunk[entry.offset];
				if (!person) continue;
				person.setCategoryId("services");
				person.setSubSectorId("wholesale-retail");
				person.setRoleId(undefined);
				affected += 1;
			}
			await savePopulationChunkRaw(
				formatChunkKey(cohort, chunkIndex),
				chunk.map((person) => person.toSnapshot()),
			);
		}
	}

	return affected;
}

async function applyEnvironmentDelta(
	regionId: string,
	delta: number,
): Promise<void> {
	if (delta === 0) return;
	const regions = await ensureWorld();
	const resourceStates = await ensureRegionResourceStates(regions);
	const state = resourceStates[regionId];
	if (!state) return;
	resourceStates[regionId] = {
		...state,
		environmentQuality: Math.max(
			0,
			Math.min(100, state.environmentQuality + delta),
		),
	};
	await saveRegionResourceStates(resourceStates);
	await saveWorldRegions(regions);
}

function pushTemporaryModifier(
	gameRun: GameRunState,
	modifier: TemporaryRunModifier,
): GameRunState {
	return {
		...gameRun,
		temporaryModifiers: [...(gameRun.temporaryModifiers ?? []), modifier],
	};
}

async function applyWeeklyChoiceEffects(input: {
	gameDay: number;
	regionId: string;
	regionName: string;
	choiceId: string;
	choiceLabel: string;
	effects: WeeklyChoiceEffect;
}): Promise<GameRunState | null> {
	let gameRun = await loadGameRunState();
	if (!gameRun) return null;

	await applyRegionalCitizenDeltas({
		regionId: input.regionId,
		happinessDelta: input.effects.happinessDelta,
		healthDelta: input.effects.healthDelta,
		evacuateLaborPercent: input.effects.evacuateLaborPercent,
	});

	if (input.effects.environmentDelta) {
		await applyEnvironmentDelta(input.regionId, input.effects.environmentDelta);
	}

	if (
		input.effects.extractionEfficiencyFactor != null &&
		input.effects.modifierDurationDays != null
	) {
		gameRun = pushTemporaryModifier(gameRun, {
			id: `weekly-extract-${input.gameDay}-${input.regionId}`,
			regionId: input.regionId,
			expiresOnGameDay: input.gameDay + input.effects.modifierDurationDays,
			extractionEfficiencyFactor: input.effects.extractionEfficiencyFactor,
		});
	}

	if (input.effects.calamityHappinessScale != null) {
		const scale = input.effects.calamityHappinessScale;
		gameRun = {
			...gameRun,
			activeCalamities: gameRun.activeCalamities.map((calamity) => {
				if (!calamity.regionIds.includes(input.regionId)) return calamity;
				return {
					...calamity,
					happinessPenaltyScale: (calamity.happinessPenaltyScale ?? 1) * scale,
				};
			}),
		};
	}

	gameRun = appendGameEvents(gameRun, [
		{
			id: `weekly-decision-${input.gameDay}-${input.choiceId}`,
			gameDay: input.gameDay,
			type: "weekly_decision",
			title: `${input.choiceLabel} · ${input.regionName}`,
			detail: `Weekly briefing decision for ${input.regionName}.`,
		},
	]);

	await saveGameRunState(gameRun);
	return gameRun;
}

export {
	applyEnvironmentDelta,
	applyRegionalCitizenDeltas,
	applyWeeklyChoiceEffects,
	pushTemporaryModifier,
};
