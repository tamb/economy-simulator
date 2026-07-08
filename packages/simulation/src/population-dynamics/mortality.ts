import {
	getAnnualMortalityProbability,
	type Sex,
} from "economy-simulator-data";

type RandomFn = () => number;

interface MortalityInput {
	age: number;
	sex: Sex;
	/** 0-100 overall health; modulates the sourced baseline mortality curve. */
	health: number;
}

/**
 * Quality-of-life mortality multiplier applied to the sourced life-table
 * baseline. Health 50 is neutral (1x baseline). Health trends toward 100
 * roughly halve the risk; health trending toward 0 doubles it. See
 * research/life-and-demographics.md for the rationale.
 */
function getQualityOfLifeMortalityMultiplier(health: number): number {
	const clampedHealth = Math.min(100, Math.max(0, health));
	if (clampedHealth >= 50) {
		return 1 - ((clampedHealth - 50) / 50) * 0.5;
	}
	return 1 + ((50 - clampedHealth) / 50) * 1;
}

/** Rolls whether a citizen dies this year, given sourced baseline mortality modulated by health. */
function rollMortality(
	input: MortalityInput,
	random: RandomFn = Math.random,
): boolean {
	const baseline = getAnnualMortalityProbability(input.age, input.sex);
	const multiplier = getQualityOfLifeMortalityMultiplier(input.health);
	const probability = Math.min(1, Math.max(0, baseline * multiplier));
	return random() < probability;
}

export type { MortalityInput };
export { getQualityOfLifeMortalityMultiplier, rollMortality };
