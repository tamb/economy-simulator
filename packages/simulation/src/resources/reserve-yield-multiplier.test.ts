import { describe, expect, it } from "vitest";
import {
	computeFiniteYieldMultiplier,
	computeRenewableYieldMultiplier,
} from "./reserve-yield-multiplier";

describe("computeFiniteYieldMultiplier", () => {
	it("returns 1 at full reserves", () => {
		expect(computeFiniteYieldMultiplier(1)).toBe(1);
	});

	it("returns exactly 0 at true exhaustion", () => {
		expect(computeFiniteYieldMultiplier(0)).toBe(0);
	});

	it("tapers toward the floor as reserves approach exhaustion, without hitting it", () => {
		const nearExhaustion = computeFiniteYieldMultiplier(0.01);
		expect(nearExhaustion).toBeGreaterThan(0);
		expect(nearExhaustion).toBeLessThan(0.2);
	});

	it("decreases monotonically as reserves decrease", () => {
		const high = computeFiniteYieldMultiplier(0.8);
		const mid = computeFiniteYieldMultiplier(0.5);
		const low = computeFiniteYieldMultiplier(0.2);
		expect(high).toBeGreaterThan(mid);
		expect(mid).toBeGreaterThan(low);
	});

	it("clamps out-of-range input", () => {
		expect(computeFiniteYieldMultiplier(1.5)).toBe(1);
		expect(computeFiniteYieldMultiplier(-1)).toBe(0);
	});
});

describe("computeRenewableYieldMultiplier", () => {
	it("returns the capacity fraction directly within 0-1", () => {
		expect(computeRenewableYieldMultiplier(0.75)).toBe(0.75);
	});

	it("clamps out-of-range input", () => {
		expect(computeRenewableYieldMultiplier(1.2)).toBe(1);
		expect(computeRenewableYieldMultiplier(-0.2)).toBe(0);
	});
});
