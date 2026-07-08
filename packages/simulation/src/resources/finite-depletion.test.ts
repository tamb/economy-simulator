import { describe, expect, it } from "vitest";
import { applyFiniteDepletion } from "./finite-depletion";

describe("applyFiniteDepletion", () => {
	it("reduces reserves proportional to extraction intensity", () => {
		const light = applyFiniteDepletion(1, 1);
		const heavy = applyFiniteDepletion(1, 5);
		expect(heavy.reserveFraction).toBeLessThan(light.reserveFraction);
	});

	it("never reduces reserves for zero extraction intensity", () => {
		const result = applyFiniteDepletion(0.5, 0);
		expect(result.reserveFraction).toBe(0.5);
	});

	it("never lets reserves go below 0", () => {
		const result = applyFiniteDepletion(0.01, 1000);
		expect(result.reserveFraction).toBe(0);
	});

	it("never lets reserves exceed 1 even with a negative intensity", () => {
		const result = applyFiniteDepletion(1, -100);
		expect(result.reserveFraction).toBeLessThanOrEqual(1);
	});

	it("flags eligibility for degradation once reserves fall at/below the configured threshold", () => {
		const stillHealthy = applyFiniteDepletion(0.5, 1);
		expect(stillHealthy.eligibleForDegradation).toBe(false);

		const nearlyExhausted = applyFiniteDepletion(0.06, 100);
		expect(nearlyExhausted.reserveFraction).toBe(0);
		expect(nearlyExhausted.eligibleForDegradation).toBe(true);
	});

	it("is a pure function (same input -> same output)", () => {
		expect(applyFiniteDepletion(0.7, 2)).toEqual(applyFiniteDepletion(0.7, 2));
	});
});
