import { describe, expect, it } from "vitest";
import {
	computeExpectedImmigrantCount,
	getEmigrationProbability,
	rollEmigration,
} from "./migration";

describe("getEmigrationProbability", () => {
	it("is zero at or above the QoL threshold", () => {
		expect(getEmigrationProbability(35)).toBe(0);
		expect(getEmigrationProbability(100)).toBe(0);
	});

	it("increases as QoL drops further below the threshold", () => {
		const mild = getEmigrationProbability(30);
		const severe = getEmigrationProbability(0);
		expect(severe).toBeGreaterThan(mild);
		expect(mild).toBeGreaterThan(0);
	});

	it("never exceeds the configured max annual probability", () => {
		expect(getEmigrationProbability(-1000)).toBeLessThanOrEqual(0.15);
	});
});

describe("rollEmigration", () => {
	it("never triggers when QoL is at or above the threshold", () => {
		const emigrated = rollEmigration({ happiness: 50, health: 50 }, () => 0);
		expect(emigrated).toBe(false);
	});

	it("can trigger when QoL is well below the threshold with a favorable roll", () => {
		const emigrated = rollEmigration({ happiness: 0, health: 0 }, () => 0);
		expect(emigrated).toBe(true);
	});

	it("is deterministic for a fixed random source", () => {
		const random = () => 0.05;
		const first = rollEmigration({ happiness: 10, health: 10 }, random);
		const second = rollEmigration({ happiness: 10, health: 10 }, random);
		expect(first).toBe(second);
	});
});

describe("computeExpectedImmigrantCount", () => {
	it("returns a higher count for above-neutral national QoL than below-neutral", () => {
		const attractive = computeExpectedImmigrantCount(
			{ currentPopulationSize: 1_000_000, nationalAverageQualityOfLife: 90 },
			() => 0,
		);
		const unattractive = computeExpectedImmigrantCount(
			{ currentPopulationSize: 1_000_000, nationalAverageQualityOfLife: 10 },
			() => 0,
		);

		expect(attractive).toBeGreaterThan(unattractive);
	});

	it("never returns a negative count", () => {
		const count = computeExpectedImmigrantCount(
			{ currentPopulationSize: 1_000_000, nationalAverageQualityOfLife: 0 },
			() => 0.999999,
		);
		expect(count).toBeGreaterThanOrEqual(0);
	});

	it("returns zero for a zero-size population", () => {
		const count = computeExpectedImmigrantCount(
			{ currentPopulationSize: 0, nationalAverageQualityOfLife: 100 },
			() => 0,
		);
		expect(count).toBe(0);
	});

	it("uses stochastic rounding for fractional expected counts", () => {
		const input = {
			currentPopulationSize: 105,
			nationalAverageQualityOfLife: 50,
		};
		// baseline rate 0.01 * 105 = 1.05 expected -> whole=1, fraction=0.05
		const roundedDown = computeExpectedImmigrantCount(input, () => 0.5);
		const roundedUp = computeExpectedImmigrantCount(input, () => 0);

		expect(roundedDown).toBe(1);
		expect(roundedUp).toBe(2);
	});
});
