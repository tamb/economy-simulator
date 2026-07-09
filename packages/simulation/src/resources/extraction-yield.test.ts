import { describe, expect, it } from "vitest";
import {
	computeExtractionIntensity,
	computeExtractionYield,
} from "./extraction-yield";

describe("computeExtractionYield", () => {
	it("multiplies base yield, workers, and the reserve/capacity multiplier", () => {
		const result = computeExtractionYield({
			baseYieldPerWorker: 1.2,
			workers: 10,
			reserveOrCapacityYieldMultiplier: 1,
		});
		expect(result).toBe(12);
	});

	it("scales down with a reduced reserve/capacity multiplier", () => {
		const full = computeExtractionYield({
			baseYieldPerWorker: 1,
			workers: 10,
			reserveOrCapacityYieldMultiplier: 1,
		});
		const half = computeExtractionYield({
			baseYieldPerWorker: 1,
			workers: 10,
			reserveOrCapacityYieldMultiplier: 0.5,
		});
		expect(half).toBe(full / 2);
	});

	it("applies the economic-system efficiency multiplier", () => {
		const baseline = computeExtractionYield({
			baseYieldPerWorker: 1,
			workers: 10,
			reserveOrCapacityYieldMultiplier: 1,
		});
		const boosted = computeExtractionYield({
			baseYieldPerWorker: 1,
			workers: 10,
			reserveOrCapacityYieldMultiplier: 1,
			economicSystemEfficiencyMultiplier: 1.15,
		});
		expect(boosted).toBeCloseTo(baseline * 1.15, 10);
	});

	it("applies the role efficiency multiplier", () => {
		const baseline = computeExtractionYield({
			baseYieldPerWorker: 1,
			workers: 10,
			reserveOrCapacityYieldMultiplier: 1,
		});
		const boosted = computeExtractionYield({
			baseYieldPerWorker: 1,
			workers: 10,
			reserveOrCapacityYieldMultiplier: 1,
			roleEfficiencyMultiplier: 1.2,
		});
		expect(boosted).toBeCloseTo(baseline * 1.2, 10);
	});

	it("returns 0 when there are no workers", () => {
		expect(
			computeExtractionYield({
				baseYieldPerWorker: 1,
				workers: 0,
				reserveOrCapacityYieldMultiplier: 1,
			}),
		).toBe(0);
	});

	it("returns 0 when the base yield is 0 (biome can't produce this resource)", () => {
		expect(
			computeExtractionYield({
				baseYieldPerWorker: 0,
				workers: 100,
				reserveOrCapacityYieldMultiplier: 1,
			}),
		).toBe(0);
	});
});

describe("computeExtractionIntensity", () => {
	it("returns 1 when workers exactly match sustainable capacity", () => {
		expect(computeExtractionIntensity(8, 8)).toBe(1);
	});

	it("returns above 1 when workers exceed sustainable capacity (over-extraction)", () => {
		expect(computeExtractionIntensity(16, 8)).toBe(2);
	});

	it("returns 0 for a non-positive capacity baseline", () => {
		expect(computeExtractionIntensity(10, 0)).toBe(0);
	});

	it("never returns a negative value for negative worker counts", () => {
		expect(computeExtractionIntensity(-5, 8)).toBe(0);
	});
});
