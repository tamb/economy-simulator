import { describe, expect, it } from "vitest";
import { biomes } from "./biomes";
import {
	getEligibleOverlaysForBiome,
	getResourceOverlay,
	resourceOverlays,
} from "./resource-overlays";
import { resources } from "./resources";

describe("resourceOverlays", () => {
	it("only references known biome ids as eligible biomes", () => {
		const knownBiomeIds = new Set(biomes.map((biome) => biome.id));
		for (const overlay of resourceOverlays) {
			expect(overlay.eligibleBiomes.length).toBeGreaterThan(0);
			for (const biomeId of overlay.eligibleBiomes) {
				expect(knownBiomeIds.has(biomeId)).toBe(true);
			}
		}
	});

	it("only references known resource ids in resourceYieldBonus", () => {
		const knownResourceIds = new Set(resources.map((resource) => resource.id));
		for (const overlay of resourceOverlays) {
			for (const resourceId of Object.keys(overlay.resourceYieldBonus ?? {})) {
				expect(knownResourceIds.has(resourceId as never)).toBe(true);
			}
		}
	});

	it("gives every overlay either a resource bonus or an environment bonus", () => {
		for (const overlay of resourceOverlays) {
			const hasResourceBonus =
				Object.keys(overlay.resourceYieldBonus ?? {}).length > 0;
			const hasEnvironmentBonus = overlay.environmentQualityBonus != null;
			expect(hasResourceBonus || hasEnvironmentBonus).toBe(true);
		}
	});

	it("only lets fresh water spring grant an environment quality bonus", () => {
		for (const overlay of resourceOverlays) {
			if (overlay.id === "freshWaterSpring") {
				expect(overlay.environmentQualityBonus).toBeGreaterThan(0);
			} else {
				expect(overlay.environmentQualityBonus).toBeUndefined();
			}
		}
	});

	it("looks up an overlay by id", () => {
		expect(getResourceOverlay("richOreVein")?.label).toBe("Rich Ore Vein");
	});

	describe("getEligibleOverlaysForBiome", () => {
		it("returns fossil fuel field and rich ore vein for mountains", () => {
			const eligible = getEligibleOverlaysForBiome("mountains").map(
				(overlay) => overlay.id,
			);
			expect(eligible).toContain("richOreVein");
			expect(eligible).toContain("fossilFuelField");
		});

		it("allows fossil fuel field on desert despite desert having no base yields", () => {
			const eligible = getEligibleOverlaysForBiome("desert").map(
				(overlay) => overlay.id,
			);
			expect(eligible).toEqual(["fossilFuelField"]);
		});

		it("returns an empty list for a biome no overlay is eligible on", () => {
			expect(getEligibleOverlaysForBiome("barrenRock")).toEqual([]);
		});
	});
});
