/**
 * Sourced demographic reference data. See
 * `research/life-and-demographics.md` for full citations, methodology, and
 * how quality of life is meant to modulate these baselines.
 *
 * Mortality source: U.S. Social Security Administration, Office of the
 * Chief Actuary, Period Life Table (Alternative II / intermediate
 * assumptions), 2024 Trustees Report, calendar year 2022.
 * Fertility source: UN DESA Population Division, World Population
 * Prospects 2024: Summary of Results (global total fertility rate).
 */

type Sex = "M" | "F";

interface LifeTableRow {
	/** Exact age in years this row describes. */
	readonly age: number;
	/** Probability of death before the next birthday, at this exact age. */
	readonly probabilityOfDeath: number;
	/** Average remaining years of life expected at this exact age. */
	readonly remainingLifeExpectancy: number;
}

const maleLifeTable: readonly LifeTableRow[] = [
	{ age: 0, probabilityOfDeath: 0.00595, remainingLifeExpectancy: 74.78 },
	{ age: 10, probabilityOfDeath: 0.000129, remainingLifeExpectancy: 65.37 },
	{ age: 20, probabilityOfDeath: 0.001256, remainingLifeExpectancy: 55.67 },
	{ age: 30, probabilityOfDeath: 0.002323, remainingLifeExpectancy: 46.53 },
	{ age: 40, probabilityOfDeath: 0.00335, remainingLifeExpectancy: 37.68 },
	{ age: 50, probabilityOfDeath: 0.005644, remainingLifeExpectancy: 29.06 },
	{ age: 60, probabilityOfDeath: 0.012489, remainingLifeExpectancy: 21.09 },
	{ age: 70, probabilityOfDeath: 0.024643, remainingLifeExpectancy: 14.1 },
	{ age: 80, probabilityOfDeath: 0.06063, remainingLifeExpectancy: 8.1 },
	{ age: 90, probabilityOfDeath: 0.170715, remainingLifeExpectancy: 3.91 },
	{ age: 100, probabilityOfDeath: 0.372512, remainingLifeExpectancy: 2.0 },
	{ age: 110, probabilityOfDeath: 0.606782, remainingLifeExpectancy: 1.1 },
] as const;

const femaleLifeTable: readonly LifeTableRow[] = [
	{ age: 0, probabilityOfDeath: 0.005047, remainingLifeExpectancy: 80.18 },
	{ age: 10, probabilityOfDeath: 0.000112, remainingLifeExpectancy: 70.71 },
	{ age: 20, probabilityOfDeath: 0.000477, remainingLifeExpectancy: 60.86 },
	{ age: 30, probabilityOfDeath: 0.000996, remainingLifeExpectancy: 51.24 },
	{ age: 40, probabilityOfDeath: 0.001819, remainingLifeExpectancy: 41.85 },
	{ age: 50, probabilityOfDeath: 0.003431, remainingLifeExpectancy: 32.73 },
	{ age: 60, probabilityOfDeath: 0.007717, remainingLifeExpectancy: 24.13 },
	{ age: 70, probabilityOfDeath: 0.015836, remainingLifeExpectancy: 16.29 },
	{ age: 80, probabilityOfDeath: 0.044227, remainingLifeExpectancy: 9.48 },
	{ age: 90, probabilityOfDeath: 0.137011, remainingLifeExpectancy: 4.66 },
	{ age: 100, probabilityOfDeath: 0.314247, remainingLifeExpectancy: 2.37 },
	{ age: 110, probabilityOfDeath: 0.562768, remainingLifeExpectancy: 1.21 },
] as const;

/** Global baseline total fertility rate (live births per woman), UN WPP 2024. */
const GLOBAL_BASELINE_TOTAL_FERTILITY_RATE = 2.25;

/** TFR below which a population shrinks long-term without migration. */
const REPLACEMENT_TOTAL_FERTILITY_RATE = 2.1;

function getLifeTable(sex: Sex): readonly LifeTableRow[] {
	return sex === "M" ? maleLifeTable : femaleLifeTable;
}

/** Linearly interpolate between the sourced decade rows for an arbitrary age. */
function interpolateLifeTable(
	age: number,
	sex: Sex,
	select: (row: LifeTableRow) => number,
): number {
	const table = getLifeTable(sex);
	const firstRow = table[0];
	const lastRow = table[table.length - 1];
	if (!firstRow || !lastRow) {
		throw new Error("Life table must have at least one row");
	}

	const clampedAge = Math.min(Math.max(age, firstRow.age), lastRow.age);

	for (let index = 0; index < table.length - 1; index++) {
		const current = table[index];
		const next = table[index + 1];
		if (!current || !next) continue;
		if (clampedAge < current.age || clampedAge > next.age) continue;

		const span = next.age - current.age;
		if (span === 0) return select(current);

		const progress = (clampedAge - current.age) / span;
		return select(current) + progress * (select(next) - select(current));
	}

	return select(lastRow);
}

/** Baseline annual probability of death at an arbitrary age, before QoL modulation. */
function getAnnualMortalityProbability(age: number, sex: Sex): number {
	return interpolateLifeTable(age, sex, (row) => row.probabilityOfDeath);
}

/** Baseline remaining life expectancy in years at an arbitrary age. */
function getRemainingLifeExpectancy(age: number, sex: Sex): number {
	return interpolateLifeTable(age, sex, (row) => row.remainingLifeExpectancy);
}

export type { LifeTableRow, Sex };
export {
	femaleLifeTable,
	GLOBAL_BASELINE_TOTAL_FERTILITY_RATE,
	getAnnualMortalityProbability,
	getLifeTable,
	getRemainingLifeExpectancy,
	maleLifeTable,
	REPLACEMENT_TOTAL_FERTILITY_RATE,
};
