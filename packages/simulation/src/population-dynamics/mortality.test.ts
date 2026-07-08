import { getAnnualMortalityProbability } from "economy-simulator-data";
import { describe, expect, it } from "vitest";
import {
	getQualityOfLifeMortalityMultiplier,
	rollMortality,
} from "./mortality";

describe("getQualityOfLifeMortalityMultiplier", () => {
	it("is neutral (1x) at health 50", () => {
		expect(getQualityOfLifeMortalityMultiplier(50)).toBe(1);
	});

	it("lowers risk as health rises above 50", () => {
		expect(getQualityOfLifeMortalityMultiplier(100)).toBeLessThan(1);
		expect(getQualityOfLifeMortalityMultiplier(75)).toBeLessThan(1);
		expect(getQualityOfLifeMortalityMultiplier(100)).toBeLessThan(
			getQualityOfLifeMortalityMultiplier(75),
		);
	});

	it("raises risk as health falls below 50", () => {
		expect(getQualityOfLifeMortalityMultiplier(0)).toBeGreaterThan(1);
		expect(getQualityOfLifeMortalityMultiplier(25)).toBeGreaterThan(1);
		expect(getQualityOfLifeMortalityMultiplier(0)).toBeGreaterThan(
			getQualityOfLifeMortalityMultiplier(25),
		);
	});

	it("clamps out-of-range health input", () => {
		expect(getQualityOfLifeMortalityMultiplier(150)).toBe(
			getQualityOfLifeMortalityMultiplier(100),
		);
		expect(getQualityOfLifeMortalityMultiplier(-10)).toBe(
			getQualityOfLifeMortalityMultiplier(0),
		);
	});
});

describe("rollMortality", () => {
	it("never kills when the random roll exceeds the modulated probability", () => {
		const died = rollMortality(
			{ age: 30, sex: "F", health: 50 },
			() => 0.999999,
		);
		expect(died).toBe(false);
	});

	it("always kills when the random roll is below the modulated probability", () => {
		const died = rollMortality({ age: 90, sex: "M", health: 0 }, () => 0);
		expect(died).toBe(true);
	});

	it("increases death likelihood for poor health versus good health at the same age/sex", () => {
		const baseline = getAnnualMortalityProbability(70, "M");
		const poorHealthProbability =
			baseline * getQualityOfLifeMortalityMultiplier(0);
		const goodHealthProbability =
			baseline * getQualityOfLifeMortalityMultiplier(100);

		expect(poorHealthProbability).toBeGreaterThan(goodHealthProbability);
	});

	it("is deterministic for a fixed random source", () => {
		const random = () => 0.0001;
		const first = rollMortality({ age: 80, sex: "F", health: 20 }, random);
		const second = rollMortality({ age: 80, sex: "F", health: 20 }, random);
		expect(first).toBe(second);
	});
});
