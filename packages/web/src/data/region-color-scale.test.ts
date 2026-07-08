import { describe, expect, it } from "vitest";
import { getRegionColor } from "./region-color-scale";

describe("getRegionColor", () => {
	it("returns the surface-muted color for an unknown region", () => {
		expect(getRegionColor("population", undefined, 100)).toBe("#ebe4d6");
	});

	it("scales quality metrics from red at 0 to green at 100", () => {
		expect(getRegionColor("happiness", 0, 100)).toBe("#f00000");
		expect(getRegionColor("happiness", 100, 100)).toBe("#20d000");
		expect(getRegionColor("health", 50, 100)).toBe("#ffff00");
	});

	it("scales population from surface-muted at 0 to primary at the max", () => {
		expect(getRegionColor("population", 0, 1000)).toBe("#ebe4d6");
		expect(getRegionColor("population", 1000, 1000)).toBe("#109080");
	});

	it("does not divide by zero when the max population is 0", () => {
		expect(getRegionColor("population", 0, 0)).toBe("#ebe4d6");
	});

	it("returns terrain colors for the terrain metric", () => {
		expect(getRegionColor("terrain", undefined, 100, "ocean")).toBe("#1a6088");
		expect(getRegionColor("terrain", undefined, 100, "plains")).toBe("#7cb342");
	});
});
