import { describe, expect, it } from "vitest";
import {
	getQualityOfLifeFertilityMultiplier,
	rollFertility,
} from "./fertility";

describe("getQualityOfLifeFertilityMultiplier", () => {
	it("is neutral (1x) at happiness 50", () => {
		expect(getQualityOfLifeFertilityMultiplier(50)).toBe(1);
	});

	it("raises the birth rate as happiness rises above 50", () => {
		expect(getQualityOfLifeFertilityMultiplier(100)).toBeGreaterThan(1);
	});

	it("lowers the birth rate as happiness falls below 50", () => {
		expect(getQualityOfLifeFertilityMultiplier(0)).toBeLessThan(1);
	});
});

describe("rollFertility", () => {
	it("never applies to men", () => {
		const gaveBirth = rollFertility(
			{ age: 30, sex: "M", happiness: 100 },
			() => 0,
		);
		expect(gaveBirth).toBe(false);
	});

	it("never applies outside the configured childbearing age range", () => {
		expect(rollFertility({ age: 10, sex: "F", happiness: 100 }, () => 0)).toBe(
			false,
		);
		expect(rollFertility({ age: 60, sex: "F", happiness: 100 }, () => 0)).toBe(
			false,
		);
	});

	it("can give birth for a woman of childbearing age with a favorable roll", () => {
		const gaveBirth = rollFertility(
			{ age: 28, sex: "F", happiness: 100 },
			() => 0,
		);
		expect(gaveBirth).toBe(true);
	});

	it("does not give birth when the random roll exceeds the probability", () => {
		const gaveBirth = rollFertility(
			{ age: 28, sex: "F", happiness: 50 },
			() => 0.999999,
		);
		expect(gaveBirth).toBe(false);
	});

	it("is deterministic for a fixed random source", () => {
		const random = () => 0.01;
		const first = rollFertility({ age: 25, sex: "F", happiness: 60 }, random);
		const second = rollFertility({ age: 25, sex: "F", happiness: 60 }, random);
		expect(first).toBe(second);
	});
});
