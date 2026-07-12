import {
	type CategoryId,
	type GameSettings,
	gameSettings,
	sectorKey,
} from "economy-simulator-data";
import {
	appendGameEvents,
	type GameEvent,
	loadGameRunState,
	loadPopulationChunkRaw,
	loadPopulationMeta as loadPopulationMetaRepo,
	saveGameRunState,
	savePopulationChunkRaw,
} from "economy-simulator-persistence";
import type {
	LaborEdictCandidate,
	LaborEdictTarget,
} from "economy-simulator-simulation";
import {
	isEligibleLaborEdictWorker,
	rerollRoleForCitizen,
	selectLaborEdictCandidates,
} from "economy-simulator-simulation";
import { formatChunkKey, getChunkCount } from "../data/population-cohorts";
import { getViableExtractiveSubSectorIdsForRegion } from "../models/generatePerson";
import { Person, type PersonSnapshot } from "../models/Person";
import { loadSectorRoleConfigs } from "../storage/sector-role-config";
import { ensureWorld } from "../storage/world";

const LABOR_EDICT_HAPPINESS_PENALTY = 8;
const ROLE_REFORM_HAPPINESS_PENALTY = 5;

function isPersonSnapshot(value: unknown): value is PersonSnapshot {
	if (!value || typeof value !== "object") return false;
	const person = value as PersonSnapshot;
	return typeof person.faceId === "string";
}

async function loadMeta() {
	return loadPopulationMetaRepo();
}

async function loadCohortChunk(
	cohort: number,
	chunkIndex: number,
): Promise<Person[] | null> {
	const saved = await loadPopulationChunkRaw(
		formatChunkKey(cohort, chunkIndex),
	);
	if (!saved?.every(isPersonSnapshot)) return null;
	return saved.map((item) => Person.fromSnapshot(item));
}

async function saveCohortChunk(
	cohort: number,
	chunkIndex: number,
	people: Person[],
): Promise<void> {
	await savePopulationChunkRaw(
		formatChunkKey(cohort, chunkIndex),
		people.map((person) => person.toSnapshot()),
	);
}

function canAssignExtractiveTarget(
	targetSubSectorId: string,
	regionId: string | undefined,
	regions: Awaited<ReturnType<typeof ensureWorld>>,
): boolean {
	if (!regionId) return false;
	const viable =
		getViableExtractiveSubSectorIdsForRegion(regions, regionId) ?? [];
	return viable.includes(targetSubSectorId);
}

async function applyLaborEdict(input: {
	source: LaborEdictTarget;
	target: LaborEdictTarget;
	percent: number;
	gameDay: number;
	onProgress?: (processed: number, total: number) => void;
	random?: () => number;
	settings?: GameSettings;
}): Promise<{ affected: number }> {
	const settings = input.settings ?? gameSettings;
	const random = input.random ?? Math.random;
	const meta = await loadMeta();
	if (!meta) return { affected: 0 };

	const regions = await ensureWorld(random);
	const candidates: LaborEdictCandidate[] = [];
	let processed = 0;

	for (let cohort = 0; cohort < meta.cohortCount; cohort++) {
		const chunkCount = getChunkCount(meta.cohortSizes[cohort] ?? 0);
		for (let chunkIndex = 0; chunkIndex < chunkCount; chunkIndex++) {
			const chunk = await loadCohortChunk(cohort, chunkIndex);
			if (!chunk) continue;
			for (let offset = 0; offset < chunk.length; offset++) {
				const person = chunk[offset];
				if (!person) continue;
				processed += 1;
				input.onProgress?.(processed, meta.size);
				if (
					isEligibleLaborEdictWorker(
						person.getAge(),
						person.isLiving(),
						person.getCategoryId(),
						person.getSubSectorId(),
						input.source,
						settings,
					)
				) {
					candidates.push({
						cohort,
						chunkIndex,
						offset,
						regionId: person.getRegionId(),
					});
				}
			}
		}
	}

	const selected = selectLaborEdictCandidates(
		candidates,
		input.percent,
		random,
	);
	let affected = 0;

	for (let cohort = 0; cohort < meta.cohortCount; cohort++) {
		const chunkCount = getChunkCount(meta.cohortSizes[cohort] ?? 0);
		for (let chunkIndex = 0; chunkIndex < chunkCount; chunkIndex++) {
			const chunk = await loadCohortChunk(cohort, chunkIndex);
			if (!chunk) continue;
			let dirty = false;

			for (let offset = 0; offset < chunk.length; offset++) {
				const key = `${cohort}:${chunkIndex}:${offset}`;
				if (!selected.has(key)) continue;
				const person = chunk[offset];
				if (!person) continue;

				if (
					input.target.categoryId === "extractive" &&
					!canAssignExtractiveTarget(
						input.target.subSectorId,
						person.getRegionId(),
						regions,
					)
				) {
					continue;
				}

				person.setCategoryId(input.target.categoryId);
				person.setSubSectorId(input.target.subSectorId);
				person.setRoleId(undefined);
				const happiness = person.getOverallHappiness() ?? 50;
				person.setOverallHappiness(
					Math.max(0, happiness - LABOR_EDICT_HAPPINESS_PENALTY),
				);
				affected += 1;
				dirty = true;
			}

			if (dirty) {
				await saveCohortChunk(cohort, chunkIndex, chunk);
			}
		}
	}

	let gameRun = await loadGameRunState();
	if (gameRun && affected > 0) {
		const event: GameEvent = {
			id: `edict-${input.gameDay}-${input.source.subSectorId}-${input.target.subSectorId}`,
			gameDay: input.gameDay,
			type: "labor_edict",
			title: `Labor edict: ${input.percent}% reassigned`,
			detail: `${affected.toLocaleString()} workers moved from ${input.source.subSectorId} to ${input.target.subSectorId}.`,
		};
		gameRun = appendGameEvents(gameRun, [event]);
		await saveGameRunState(gameRun);
	}

	return { affected };
}

async function applyRoleReform(input: {
	categoryId: CategoryId;
	subSectorId: string;
	gameDay: number;
	onProgress?: (processed: number, total: number) => void;
	random?: () => number;
	settings?: GameSettings;
}): Promise<{ affected: number }> {
	const settings = input.settings ?? gameSettings;
	const random = input.random ?? Math.random;
	const meta = await loadMeta();
	if (!meta) return { affected: 0 };

	const sectorRoleConfigs = await loadSectorRoleConfigs();
	const quotas =
		sectorRoleConfigs[sectorKey(input.categoryId, input.subSectorId)]?.quotas ??
		[];
	if (quotas.length === 0) return { affected: 0 };

	let affected = 0;
	let processed = 0;

	for (let cohort = 0; cohort < meta.cohortCount; cohort++) {
		const chunkCount = getChunkCount(meta.cohortSizes[cohort] ?? 0);
		for (let chunkIndex = 0; chunkIndex < chunkCount; chunkIndex++) {
			const chunk = await loadCohortChunk(cohort, chunkIndex);
			if (!chunk) continue;
			let dirty = false;

			for (const person of chunk) {
				if (!person) continue;
				processed += 1;
				input.onProgress?.(processed, meta.size);

				if (
					!person.isLiving() ||
					person.getCategoryId() !== input.categoryId ||
					person.getSubSectorId() !== input.subSectorId
				) {
					continue;
				}

				const age = person.getAge();
				if (age == null || age < settings.demographics.workingAgeMin) {
					continue;
				}

				const nextRole = rerollRoleForCitizen(quotas, random);
				if (nextRole == null) continue;

				person.setRoleId(nextRole);
				const happiness = person.getOverallHappiness() ?? 50;
				person.setOverallHappiness(
					Math.max(0, happiness - ROLE_REFORM_HAPPINESS_PENALTY),
				);
				affected += 1;
				dirty = true;
			}

			if (dirty) {
				await saveCohortChunk(cohort, chunkIndex, chunk);
			}
		}
	}

	let gameRun = await loadGameRunState();
	if (gameRun && affected > 0) {
		const event: GameEvent = {
			id: `reform-${input.gameDay}-${input.subSectorId}`,
			gameDay: input.gameDay,
			type: "role_reform",
			title: `Role reform in ${input.subSectorId}`,
			detail: `${affected.toLocaleString()} workers received new roles amid brief unrest.`,
		};
		gameRun = appendGameEvents(gameRun, [event]);
		await saveGameRunState(gameRun);
	}

	return { affected };
}

export { applyLaborEdict, applyRoleReform };
