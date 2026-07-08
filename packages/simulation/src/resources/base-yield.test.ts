import { describe, expect, it } from "vitest";
import { getBaseYieldPerWorker } from "./base-yield";

describe("getBaseYieldPerWorker", () => {
	it("returns the biome's base yield for a resource it produces", () => {
		expect(getBaseYieldPerWorker("plains", "crops", false)).toBe(1.2);
	});

	it("returns 0 for a resource the biome cannot produce", () => {
		expect(getBaseYieldPerWorker("plains", "metalOre", false)).toBe(0);
	});

	it("returns 0 for desert with no overlay", () => {
		expect(getBaseYieldPerWorker("desert", "fossilFuels", false)).toBe(0);
	});

	it("grants a flat fish yield to any coastal land tile regardless of biome", () => {
		expect(getBaseYieldPerWorker("mountains", "fish", true)).toBeGreaterThan(0);
		expect(getBaseYieldPerWorker("desert", "fish", true)).toBeGreaterThan(0);
	});

	it("grants no fish yield when the tile is not coastal", () => {
		expect(getBaseYieldPerWorker("plains", "fish", false)).toBe(0);
	});

	it("adds a resource overlay's yield bonus on top of the biome base yield", () => {
		const withoutOverlay = getBaseYieldPerWorker(
			"mountains",
			"metalOre",
			false,
		);
		const withOverlay = getBaseYieldPerWorker(
			"mountains",
			"metalOre",
			false,
			"richOreVein",
		);
		expect(withOverlay).toBeGreaterThan(withoutOverlay);
	});

	it("lets a fossil fuel field overlay give barren desert a real yield", () => {
		const yieldAmount = getBaseYieldPerWorker(
			"desert",
			"fossilFuels",
			false,
			"fossilFuelField",
		);
		expect(yieldAmount).toBeGreaterThan(0);
	});

	it("ignores an overlay bonus for a resource the overlay doesn't affect", () => {
		const yieldAmount = getBaseYieldPerWorker(
			"mountains",
			"stone",
			false,
			"richOreVein",
		);
		expect(yieldAmount).toBe(0.4); // mountains base stone yield, unaffected by an ore-vein overlay
	});
});
