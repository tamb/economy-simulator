import { describe, expect, it } from "vitest";
import { getRegionColor } from "./region-color-scale";
import { getTerrainColor } from "./terrain-color-scale";

describe("getRegionColor", () => {
	it("returns the surface-muted color for an unknown land region", () => {
		expect(getRegionColor("population", undefined, 100, "plains")).toBe(
			"#ebe4d6",
		);
	});

	it("keeps ocean tiles ocean-blue on every metric", () => {
		const ocean = getTerrainColor("ocean");
		expect(getRegionColor("population", 500, 1000, "ocean")).toBe(ocean);
		expect(getRegionColor("happiness", 80, 100, "ocean")).toBe(ocean);
		expect(getRegionColor("health", 20, 100, "ocean")).toBe(ocean);
		expect(getRegionColor("environment", 100, 100, "ocean")).toBe(ocean);
		expect(getRegionColor("terrain", undefined, 100, "ocean")).toBe(ocean);
	});

	it("scales quality metrics from red at 0 to green at 100", () => {
		expect(getRegionColor("happiness", 0, 100, "plains")).toBe("#f00000");
		expect(getRegionColor("happiness", 100, 100, "plains")).toBe("#20d000");
		expect(getRegionColor("health", 50, 100, "plains")).toBe("#ffff00");
	});

	it("stretches quality colors across the observed land range", () => {
		const low = getRegionColor("happiness", 70, 100, "plains", {
			min: 70,
			max: 90,
		});
		const mid = getRegionColor("happiness", 80, 100, "plains", {
			min: 70,
			max: 90,
		});
		const high = getRegionColor("happiness", 90, 100, "plains", {
			min: 70,
			max: 90,
		});

		expect(low).toBe("#f00000");
		expect(mid).toBe("#ffff00");
		expect(high).toBe("#20d000");
		expect(new Set([low, mid, high]).size).toBe(3);
	});

	it("falls back to absolute quality scaling when the range is flat", () => {
		expect(
			getRegionColor("environment", 100, 100, "plains", { min: 100, max: 100 }),
		).toBe("#20d000");
	});

	it("scales population from surface-muted at 0 to primary at the max", () => {
		expect(getRegionColor("population", 0, 1000, "plains")).toBe("#ebe4d6");
		expect(getRegionColor("population", 1000, 1000, "plains")).toBe("#109080");
	});

	it("does not divide by zero when the max population is 0", () => {
		expect(getRegionColor("population", 0, 0, "plains")).toBe("#ebe4d6");
	});

	it("returns terrain colors for the terrain metric", () => {
		expect(getRegionColor("terrain", undefined, 100, "ocean")).toBe("#1a6088");
		expect(getRegionColor("terrain", undefined, 100, "plains")).toBe("#7cb342");
	});
});
