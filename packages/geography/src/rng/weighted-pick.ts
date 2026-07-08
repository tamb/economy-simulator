import type { RandomFn } from "./seeded-random";

/** Weighted-random pick from a `{ value: weight }` record (weights need not sum to 1). */
function weightedPick<T extends string>(
	weights: Partial<Record<T, number>>,
	random: RandomFn,
): T {
	const entries = Object.entries(weights) as [T, number][];
	const total = entries.reduce((sum, [, weight]) => sum + weight, 0);

	if (entries.length === 0 || total <= 0) {
		throw new Error("weightedPick requires at least one positive weight");
	}

	let roll = random() * total;
	for (const [value, weight] of entries) {
		roll -= weight;
		if (roll <= 0) {
			return value;
		}
	}

	const fallback = entries[entries.length - 1];
	if (!fallback) {
		throw new Error("Unreachable: weighted entry list was non-empty");
	}
	return fallback[0];
}

/** Fisher-Yates shuffle using a seeded random source; does not mutate the input. */
function shuffle<T>(items: T[], random: RandomFn): T[] {
	const result = [...items];
	for (let i = result.length - 1; i > 0; i--) {
		const j = Math.floor(random() * (i + 1));
		const temp = result[i];
		const swapped = result[j];
		if (temp === undefined || swapped === undefined) continue;
		result[i] = swapped;
		result[j] = temp;
	}
	return result;
}

export { shuffle, weightedPick };
