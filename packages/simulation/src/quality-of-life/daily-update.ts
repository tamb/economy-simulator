import {
	type CategoryId,
	type GameSettings,
	gameSettings,
} from "economy-simulator-data";
import {
	getPersonalitySectorAffinity,
	type PersonalityProfile,
} from "./personality-affinity";
import { getWorkHoursHappinessDelta } from "./work-hours";

type RandomFn = () => number;

interface QualityOfLifeState {
	happiness: number;
	health: number;
}

interface QualityOfLifeInput extends QualityOfLifeState {
	personality: PersonalityProfile;
	/** Weekly work hours, or `undefined` if the citizen has no job. */
	weeklyHours: number | undefined;
	/** Assigned job category, or `undefined` if the citizen has no job. */
	categoryId: CategoryId | undefined;
	/**
	 * Multiplier on the personality-sector affinity delta, from the
	 * economic system assigned to the citizen's sub-sector (see
	 * `economy-simulator-data`'s `getEconomicSystemEffect(...).moraleMultiplier`).
	 * Defaults to 1 (no change) so existing callers are unaffected.
	 */
	economicSystemMoraleMultiplier?: number;
	/**
	 * Daily happiness delta from the citizen's home region's environmental
	 * quality (see `../resources/environment.ts`'s
	 * `getEnvironmentalQualityModifier`). Defaults to 0 (no effect).
	 */
	environmentalQualityModifier?: number;
	/**
	 * Daily happiness penalty from a national resource shortfall affecting
	 * the citizen's sub-sector (see
	 * `../resources/national-ledger.ts`'s `shortfallHappinessPenaltyBySubSector`).
	 * Defaults to 0 (no effect).
	 */
	resourceShortfallHappinessPenalty?: number;
}

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

/**
 * One in-game day's happiness/health update for a single citizen. Pure and
 * side-effect free — callers (e.g. `packages/web`'s cohort tick) are
 * responsible for reading the citizen's current state and writing the
 * result back. See research/quality-of-life-rules.md for the full model.
 */
function computeDailyQualityOfLifeUpdate(
	input: QualityOfLifeInput,
	random: RandomFn = Math.random,
	settings: GameSettings = gameSettings,
): QualityOfLifeState {
	const workHoursDelta = getWorkHoursHappinessDelta(
		input.weeklyHours,
		settings,
	);

	const affinity = input.categoryId
		? getPersonalitySectorAffinity(input.personality, input.categoryId)
		: 0;
	const affinityDelta =
		affinity *
		settings.work.sectorAffinityMaxDailyDelta *
		(input.economicSystemMoraleMultiplier ?? 1);

	const noise = (random() * 2 - 1) * settings.work.dailyHappinessNoise;

	const nextHappiness = clamp(
		input.happiness +
			workHoursDelta +
			affinityDelta +
			noise +
			(input.environmentalQualityModifier ?? 0) -
			(input.resourceShortfallHappinessPenalty ?? 0),
		0,
		100,
	);

	// Health drifts toward the new happiness level rather than snapping to
	// it — a sustained happiness change takes several days to show up in
	// health (see research doc, citing Diener & Chan 2011).
	const healthTarget = nextHappiness;
	const nextHealth = clamp(
		input.health + settings.work.healthLagRate * (healthTarget - input.health),
		0,
		100,
	);

	return { happiness: nextHappiness, health: nextHealth };
}

export type { QualityOfLifeInput, QualityOfLifeState, RandomFn };
export { computeDailyQualityOfLifeUpdate };
