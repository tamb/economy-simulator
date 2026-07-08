import { type GameSettings, gameSettings } from "economy-simulator-data";

type RandomFn = () => number;

interface EmigrationInput {
	/** 0-100 overall happiness. */
	happiness: number;
	/** 0-100 overall health. */
	health: number;
}

/**
 * Annual emigration probability for a given QoL. Zero at or above the
 * configured threshold, scaling linearly up to `maxAnnualProbability` as QoL
 * approaches zero.
 */
function getEmigrationProbability(
	qualityOfLife: number,
	settings: GameSettings = gameSettings,
): number {
	const { emigration } = settings.population;
	if (qualityOfLife >= emigration.qolThreshold) return 0;

	const severity =
		(emigration.qolThreshold - qualityOfLife) / emigration.qolThreshold;
	return Math.min(
		emigration.maxAnnualProbability,
		severity * emigration.maxAnnualProbability,
	);
}

/**
 * Rolls whether a citizen emigrates this year. Risk only exists below the
 * configured QoL threshold and scales linearly toward
 * `maxAnnualProbability` as QoL approaches zero.
 */
function rollEmigration(
	input: EmigrationInput,
	random: RandomFn = Math.random,
	settings: GameSettings = gameSettings,
): boolean {
	const qualityOfLife = (input.happiness + input.health) / 2;
	const probability = getEmigrationProbability(qualityOfLife, settings);
	return random() < probability;
}

interface ImmigrationInput {
	currentPopulationSize: number;
	/** 0-100 average happiness+health across the living population. */
	nationalAverageQualityOfLife: number;
}

/**
 * Expected number of immigrants for the year, scaled by how attractive the
 * country's average quality of life is relative to the configured neutral
 * point. Fractional expectations are resolved with stochastic rounding so
 * the long-run average across many years matches the expected rate exactly.
 */
function computeExpectedImmigrantCount(
	input: ImmigrationInput,
	random: RandomFn = Math.random,
	settings: GameSettings = gameSettings,
): number {
	const { immigration } = settings.population;
	const qolDelta =
		(input.nationalAverageQualityOfLife - immigration.neutralQualityOfLife) /
		100;
	const rate = Math.max(
		0,
		immigration.baselineAnnualRate + qolDelta * immigration.qolSensitivity,
	);
	const expected = Math.max(0, input.currentPopulationSize) * rate;

	const whole = Math.floor(expected);
	const fraction = expected - whole;
	return random() < fraction ? whole + 1 : whole;
}

export type { EmigrationInput, ImmigrationInput };
export {
	computeExpectedImmigrantCount,
	getEmigrationProbability,
	rollEmigration,
};
