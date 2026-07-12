import {
	AIDE_DEFAULT_NAMES,
	AIDE_ROLE_LABELS,
	type AideProposalChoiceKind,
	type AideRole,
	aideProposalDefinitions,
	pickAideProposal,
} from "economy-simulator-data";
import type {
	GameRunState,
	InnerCircleAide,
} from "economy-simulator-persistence";
import {
	appendGameEvents,
	loadGameRunState,
	saveGameRunState,
} from "economy-simulator-persistence";
import type { FaceId } from "../data/faces";
import { categories } from "../data/taxonomy";
import { loadNationalLedger } from "../storage/national-ledger";
import { computeRegionStats } from "../storage/population";
import { ensureRegionResourceStates, ensureWorld } from "../storage/world";
import type { AideProposalSummary } from "./advance-day-result";
import { applyLaborEdict, applyRoleReform } from "./population-mutations";
import {
	applyEnvironmentDelta,
	applyRegionalCitizenDeltas,
	pushTemporaryModifier,
} from "./weekly-report-effects";

const AIDE_ROLES: AideRole[] = ["steward", "marshal", "chancellor", "vizier"];

function assignInnerCircle(faceIds: readonly FaceId[]): InnerCircleAide[] {
	const pool = [...faceIds];
	const aides: InnerCircleAide[] = [];
	for (const role of AIDE_ROLES) {
		const index = pool.length > 0 ? Math.floor(Math.random() * pool.length) : 0;
		const faceId = pool.splice(index, 1)[0] ?? faceIds[0] ?? "00";
		aides.push({
			role,
			name: AIDE_DEFAULT_NAMES[role],
			faceId,
		});
	}
	return aides;
}

function buildAideProposalSummary(
	gameRun: GameRunState,
	gameDay: number,
	random: () => number = Math.random,
): AideProposalSummary | null {
	if (gameRun.innerCircle.length === 0) return null;

	const eligible = aideProposalDefinitions.filter((proposal) => {
		if (proposal.requiresActiveMandate && !gameRun.activeMandate) return false;
		return true;
	});
	const picked = pickAideProposal(eligible, random);
	if (!picked) return null;

	const aide =
		gameRun.innerCircle.find((member) => member.role === picked.aideRole) ??
		gameRun.innerCircle[0];
	if (!aide) return null;

	return {
		gameDay,
		proposalId: picked.id,
		aideRole: aide.role,
		aideName: aide.name,
		faceId: aide.faceId,
		title: picked.title,
		dialog: picked.dialog,
		choices: picked.choices.map((choice) => ({
			kind: choice.kind,
			label: choice.label,
			hint: choice.hint,
		})),
	};
}

async function findWorstEnvironmentRegionId(): Promise<string | null> {
	const regions = await ensureWorld();
	const states = await ensureRegionResourceStates(regions);
	const land = regions.filter((region) => region.terrain !== "ocean");
	if (land.length === 0) return null;
	land.sort(
		(a, b) =>
			(states[a.id]?.environmentQuality ?? 100) -
			(states[b.id]?.environmentQuality ?? 100),
	);
	return land[0]?.id ?? null;
}

async function findWorstHappinessRegionId(): Promise<string | null> {
	const stats = await computeRegionStats();
	let worstId: string | null = null;
	let worstHappiness = Number.POSITIVE_INFINITY;
	for (const [regionId, entry] of stats) {
		if (entry.population <= 0) continue;
		if (entry.averageHappiness < worstHappiness) {
			worstHappiness = entry.averageHappiness;
			worstId = regionId;
		}
	}
	return worstId;
}

async function applyAideProposalChoice(input: {
	gameDay: number;
	proposalId: string;
	choiceKind: AideProposalChoiceKind;
}): Promise<GameRunState | null> {
	const definition = aideProposalDefinitions.find(
		(entry) => entry.id === input.proposalId,
	);
	if (!definition) return null;
	const choice = definition.choices.find(
		(entry) => entry.kind === input.choiceKind,
	);
	if (!choice) return null;

	let gameRun = await loadGameRunState();
	if (!gameRun) return null;

	const effects = choice.effects;
	const worstEnvRegionId = await findWorstEnvironmentRegionId();
	const worstHappyRegionId = await findWorstHappinessRegionId();

	if (effects.laborEdictPercent && effects.laborEdictPercent > 0) {
		const ledger = await loadNationalLedger();
		const shortfall =
			ledger &&
			Object.entries(ledger.shortfallHappinessPenaltyBySubSector).find(
				([, penalty]) => penalty > 0,
			);
		const targetSubSectorId = shortfall?.[0] ?? "light-manufacturing";
		const source = categories
			.flatMap((category) =>
				category.subSectors.map((sub) => ({
					categoryId: category.id,
					subSectorId: sub.id,
				})),
			)
			.find((entry) => entry.subSectorId !== targetSubSectorId) ?? {
			categoryId: "services" as const,
			subSectorId: "wholesale-retail",
		};
		await applyLaborEdict({
			source,
			target: {
				categoryId: "industrial",
				subSectorId: targetSubSectorId,
			},
			percent: effects.laborEdictPercent,
			gameDay: input.gameDay,
		});
		gameRun = (await loadGameRunState()) ?? gameRun;
	}

	if (effects.roleReformFraction && effects.roleReformFraction > 0) {
		const target = categories
			.flatMap((category) =>
				category.subSectors.map((sub) => ({
					categoryId: category.id,
					subSectorId: sub.id,
				})),
			)
			.find((entry) => entry.categoryId === "industrial") ?? {
			categoryId: "services" as const,
			subSectorId: "wholesale-retail",
		};
		// Full reform; fraction < 1 still runs full reform for simplicity in v1 when > 0.
		if (effects.roleReformFraction >= 0.5) {
			await applyRoleReform({
				categoryId: target.categoryId,
				subSectorId: target.subSectorId,
				gameDay: input.gameDay,
			});
			gameRun = (await loadGameRunState()) ?? gameRun;
		}
	}

	if (
		effects.nextCalamityHappinessScale != null &&
		effects.modifierDurationDays != null
	) {
		gameRun = pushTemporaryModifier(gameRun, {
			id: `aide-harden-${input.gameDay}`,
			expiresOnGameDay: input.gameDay + effects.modifierDurationDays,
			nextCalamityHappinessScale: effects.nextCalamityHappinessScale,
		});
	}

	const regionForLocal =
		definition.aideRole === "chancellor"
			? worstEnvRegionId
			: worstHappyRegionId;

	if (regionForLocal) {
		if (
			effects.happinessDelta != null ||
			effects.healthDelta != null ||
			effects.mandateFocusHappiness != null
		) {
			await applyRegionalCitizenDeltas({
				regionId: regionForLocal,
				happinessDelta:
					(effects.happinessDelta ?? 0) + (effects.mandateFocusHappiness ?? 0),
				healthDelta: effects.healthDelta,
			});
		}
		if (effects.environmentDelta) {
			await applyEnvironmentDelta(regionForLocal, effects.environmentDelta);
		}
		if (
			effects.extractionEfficiencyFactor != null &&
			effects.modifierDurationDays != null
		) {
			gameRun = pushTemporaryModifier(gameRun, {
				id: `aide-extract-${input.gameDay}-${regionForLocal}`,
				regionId: regionForLocal,
				expiresOnGameDay: input.gameDay + effects.modifierDurationDays,
				extractionEfficiencyFactor: effects.extractionEfficiencyFactor,
			});
		}
	}

	if (effects.mandateFocusHappiness && !regionForLocal) {
		// Nationwide-ish: apply to first land region as a stand-in when no stats yet.
		const regions = await ensureWorld();
		const land = regions.find((region) => region.terrain !== "ocean");
		if (land) {
			await applyRegionalCitizenDeltas({
				regionId: land.id,
				happinessDelta: effects.mandateFocusHappiness,
			});
		}
	}

	if (effects.pendingScoreBonus) {
		gameRun = {
			...gameRun,
			pendingScoreBonus:
				(gameRun.pendingScoreBonus ?? 0) + effects.pendingScoreBonus,
		};
	}

	const aide =
		gameRun.innerCircle.find((member) => member.role === definition.aideRole) ??
		gameRun.innerCircle[0];

	gameRun = appendGameEvents(gameRun, [
		{
			id: `executive-${input.gameDay}-${input.proposalId}-${input.choiceKind}`,
			gameDay: input.gameDay,
			type: "executive_order",
			title: `${choice.label}: ${definition.title}`,
			detail: `${aide?.name ?? AIDE_ROLE_LABELS[definition.aideRole]} — ${choice.hint}`,
		},
	]);
	gameRun = {
		...gameRun,
		lastAideProposalGameDay: input.gameDay,
	};

	await saveGameRunState(gameRun);
	return gameRun;
}

export { applyAideProposalChoice, assignInnerCircle, buildAideProposalSummary };
