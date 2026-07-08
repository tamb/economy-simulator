import { describe, expect, it } from "vitest";
import { applyRenewableYear } from "./renewable-regeneration";

describe("applyRenewableYear", () => {
	it("regenerates capacity toward 1 when extraction is within the sustainable threshold", () => {
		const result = applyRenewableYear(0.5, 0.8);
		expect(result.capacityFraction).toBeGreaterThan(0.5);
		expect(result.overExtracted).toBe(false);
	});

	it("never regenerates past full capacity", () => {
		const result = applyRenewableYear(1, 0.5);
		expect(result.capacityFraction).toBe(1);
	});

	it("damages capacity when extraction exceeds the over-extraction threshold", () => {
		const result = applyRenewableYear(1, 3);
		expect(result.overExtracted).toBe(true);
		expect(result.capacityFraction).toBeLessThan(1);
	});

	it("damages capacity more severely the further over-extraction goes", () => {
		const mild = applyRenewableYear(1, 1.5);
		const severe = applyRenewableYear(1, 5);
		expect(severe.capacityFraction).toBeLessThan(mild.capacityFraction);
	});

	it("never lets capacity go below 0", () => {
		const result = applyRenewableYear(0.02, 1000);
		expect(result.capacityFraction).toBe(0);
	});

	it("flags eligibility for degradation once cumulative capacity loss crosses the threshold", () => {
		const healthy = applyRenewableYear(1, 1.3);
		expect(healthy.eligibleForDegradation).toBe(false);

		const collapsed = applyRenewableYear(0.9, 50);
		expect(collapsed.capacityFraction).toBe(0);
		expect(collapsed.eligibleForDegradation).toBe(true);
	});

	it("is a pure function (same input -> same output)", () => {
		expect(applyRenewableYear(0.6, 1)).toEqual(applyRenewableYear(0.6, 1));
	});
});
