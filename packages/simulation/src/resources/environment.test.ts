import { describe, expect, it } from "vitest";
import {
	computeAnnualEnvironmentQuality,
	getEnvironmentalQualityModifier,
} from "./environment";

describe("computeAnnualEnvironmentQuality", () => {
	it("degrades when there is extraction", () => {
		const result = computeAnnualEnvironmentQuality(100, [
			{ extractionIntensity: 1, environmentalImpact: 0.5 },
		]);
		expect(result).toBeLessThan(100);
	});

	it("recovers toward 100 when there is no extraction", () => {
		const result = computeAnnualEnvironmentQuality(50, []);
		expect(result).toBeGreaterThan(50);
		expect(result).toBeLessThanOrEqual(100);
	});

	it("degrades more with higher environmental-impact resources", () => {
		const low = computeAnnualEnvironmentQuality(100, [
			{ extractionIntensity: 1, environmentalImpact: 0.2 },
		]);
		const high = computeAnnualEnvironmentQuality(100, [
			{ extractionIntensity: 1, environmentalImpact: 0.9 },
		]);
		expect(high).toBeLessThan(low);
	});

	it("degrades more under a worse economic-system environmental multiplier", () => {
		const lenient = computeAnnualEnvironmentQuality(100, [
			{
				extractionIntensity: 1,
				environmentalImpact: 0.5,
				economicSystemEnvironmentalImpactMultiplier: 0.8,
			},
		]);
		const harsh = computeAnnualEnvironmentQuality(100, [
			{
				extractionIntensity: 1,
				environmentalImpact: 0.5,
				economicSystemEnvironmentalImpactMultiplier: 1.3,
			},
		]);
		expect(harsh).toBeLessThan(lenient);
	});

	it("sums degradation contributions across multiple extracted resources", () => {
		const single = computeAnnualEnvironmentQuality(100, [
			{ extractionIntensity: 1, environmentalImpact: 0.5 },
		]);
		const combined = computeAnnualEnvironmentQuality(100, [
			{ extractionIntensity: 1, environmentalImpact: 0.5 },
			{ extractionIntensity: 1, environmentalImpact: 0.5 },
		]);
		expect(combined).toBeLessThan(single);
	});

	it("clamps within 0-100", () => {
		const degraded = computeAnnualEnvironmentQuality(5, [
			{ extractionIntensity: 100, environmentalImpact: 1 },
		]);
		expect(degraded).toBeGreaterThanOrEqual(0);

		const recovered = computeAnnualEnvironmentQuality(99.9, []);
		expect(recovered).toBeLessThanOrEqual(100);
	});
});

describe("getEnvironmentalQualityModifier", () => {
	it("returns 0 for a pristine (100) region", () => {
		expect(getEnvironmentalQualityModifier(100)).toBe(0);
	});

	it("returns a negative value for a degraded region", () => {
		expect(getEnvironmentalQualityModifier(50)).toBeLessThan(0);
	});

	it("returns a larger penalty the more degraded the region", () => {
		const mild = getEnvironmentalQualityModifier(80);
		const severe = getEnvironmentalQualityModifier(10);
		expect(severe).toBeLessThan(mild);
	});

	it("clamps out-of-range quality input", () => {
		expect(getEnvironmentalQualityModifier(150)).toBe(0);
		expect(Number.isFinite(getEnvironmentalQualityModifier(-50))).toBe(true);
	});
});
