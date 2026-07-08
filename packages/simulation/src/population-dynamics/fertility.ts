import {
	type GameSettings,
	GLOBAL_BASELINE_TOTAL_FERTILITY_RATE,
	gameSettings,
	type Sex,
} from "economy-simulator-data";

type RandomFn = () => number;

interface FertilityInput {
	age: number;
	sex: Sex;
	/** 0-100 overall happiness; modulates the baseline birth rate. */
	happiness: number;
}

/**
 * Quality-of-life fertility multiplier. Happiness 50 is neutral (1x
 * baseline). Happier populations have modestly higher birth rates; very
 * unhappy populations have meaningfully lower ones. See
 * research/life-and-demographics.md for the sourced baseline this modulates.
 */
function getQualityOfLifeFertilityMultiplier(happiness: number): number {
	const clampedHappiness = Math.min(100, Math.max(0, happiness));
	if (clampedHappiness >= 50) {
		return 1 + ((clampedHappiness - 50) / 50) * 0.3;
	}
	return 1 - ((50 - clampedHappiness) / 50) * 0.5;
}

/**
 * Rolls whether a citizen gives birth this year. Only applies to women within
 * the configured childbearing age range; the sourced global total fertility
 * rate is spread evenly across that range into an annual per-woman
 * probability, then modulated by happiness.
 */
function rollFertility(
	input: FertilityInput,
	random: RandomFn = Math.random,
	settings: GameSettings = gameSettings,
): boolean {
	const { fertility } = settings.population;
	if (input.sex !== "F") return false;
	if (input.age < fertility.minAge || input.age > fertility.maxAge) {
		return false;
	}

	const reproductiveYears = fertility.maxAge - fertility.minAge + 1;
	const baselineAnnualProbability =
		GLOBAL_BASELINE_TOTAL_FERTILITY_RATE / reproductiveYears;
	const probability = Math.min(
		1,
		Math.max(
			0,
			baselineAnnualProbability *
				getQualityOfLifeFertilityMultiplier(input.happiness),
		),
	);

	return random() < probability;
}

export type { FertilityInput };
export { getQualityOfLifeFertilityMultiplier, rollFertility };
