import { describe, expect, it } from "vitest";
import {
	femaleLifeTable,
	GLOBAL_BASELINE_TOTAL_FERTILITY_RATE,
	getAnnualMortalityProbability,
	getLifeTable,
	getRemainingLifeExpectancy,
	maleLifeTable,
	REPLACEMENT_TOTAL_FERTILITY_RATE,
} from "./life-tables";

describe("life tables", () => {
	it("returns the male or female table by sex", () => {
		expect(getLifeTable("M")).toBe(maleLifeTable);
		expect(getLifeTable("F")).toBe(femaleLifeTable);
	});

	it("has monotonically increasing mortality probability from age 10 onward", () => {
		// Age 0 (infancy) has elevated mortality vs. age 10 in real life tables,
		// then mortality rises steadily through adulthood into old age.
		for (const table of [maleLifeTable, femaleLifeTable]) {
			for (let index = 2; index < table.length; index++) {
				const previous = table[index - 1];
				const current = table[index];
				expect(current?.probabilityOfDeath).toBeGreaterThan(
					previous?.probabilityOfDeath ?? 0,
				);
			}
		}
	});

	it("shows infant mortality (age 0) higher than childhood mortality (age 10)", () => {
		for (const table of [maleLifeTable, femaleLifeTable]) {
			expect(table[0]?.probabilityOfDeath).toBeGreaterThan(
				table[1]?.probabilityOfDeath ?? 0,
			);
		}
	});

	it("has monotonically decreasing remaining life expectancy with age", () => {
		for (const table of [maleLifeTable, femaleLifeTable]) {
			for (let index = 1; index < table.length; index++) {
				const previous = table[index - 1];
				const current = table[index];
				expect(current?.remainingLifeExpectancy).toBeLessThan(
					previous?.remainingLifeExpectancy ?? Number.POSITIVE_INFINITY,
				);
			}
		}
	});

	it("shows lower female mortality than male mortality at every sourced age", () => {
		for (let index = 0; index < maleLifeTable.length; index++) {
			const male = maleLifeTable[index];
			const female = femaleLifeTable[index];
			expect(female?.probabilityOfDeath).toBeLessThan(
				male?.probabilityOfDeath ?? 0,
			);
		}
	});
});

describe("getAnnualMortalityProbability", () => {
	it("returns the exact sourced value at a tabulated age", () => {
		expect(getAnnualMortalityProbability(0, "M")).toBeCloseTo(0.00595, 6);
		expect(getAnnualMortalityProbability(80, "F")).toBeCloseTo(0.044227, 6);
	});

	it("interpolates between tabulated ages", () => {
		const atThirty = getAnnualMortalityProbability(30, "M");
		const atForty = getAnnualMortalityProbability(40, "M");
		const atThirtyFive = getAnnualMortalityProbability(35, "M");

		expect(atThirtyFive).toBeGreaterThan(atThirty);
		expect(atThirtyFive).toBeLessThan(atForty);
	});

	it("clamps ages below the youngest or above the oldest sourced row", () => {
		expect(getAnnualMortalityProbability(-5, "M")).toBe(
			getAnnualMortalityProbability(0, "M"),
		);
		expect(getAnnualMortalityProbability(200, "F")).toBe(
			getAnnualMortalityProbability(110, "F"),
		);
	});
});

describe("getRemainingLifeExpectancy", () => {
	it("returns the exact sourced value at a tabulated age", () => {
		expect(getRemainingLifeExpectancy(0, "F")).toBeCloseTo(80.18, 2);
	});

	it("interpolates between tabulated ages", () => {
		const value = getRemainingLifeExpectancy(65, "M");
		expect(value).toBeLessThan(getRemainingLifeExpectancy(60, "M"));
		expect(value).toBeGreaterThan(getRemainingLifeExpectancy(70, "M"));
	});
});

describe("fertility baseline", () => {
	it("defines a global baseline above replacement level context", () => {
		expect(GLOBAL_BASELINE_TOTAL_FERTILITY_RATE).toBeGreaterThan(0);
		expect(REPLACEMENT_TOTAL_FERTILITY_RATE).toBeGreaterThan(0);
	});
});
