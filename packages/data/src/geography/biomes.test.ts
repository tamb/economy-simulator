import { describe, expect, it } from "vitest";
import { biomes, getBiome, isLand } from "./biomes";
import { resources } from "./resources";

describe("biomes", () => {
	it("only references known resource ids in resourceYields", () => {
		const knownResourceIds = new Set(resources.map((resource) => resource.id));
		for (const biome of biomes) {
			for (const resourceId of Object.keys(biome.resourceYields)) {
				expect(knownResourceIds.has(resourceId as never)).toBe(true);
			}
		}
	});

	it("never lets a biome produce fish directly (fishing is coastal-adjacency driven)", () => {
		for (const biome of biomes) {
			expect(biome.resourceYields.fish).toBeUndefined();
		}
	});

	it("keeps every resource yield positive", () => {
		for (const biome of biomes) {
			for (const yieldAmount of Object.values(biome.resourceYields)) {
				expect(yieldAmount).toBeGreaterThan(0);
			}
		}
	});

	it("only points degradesTo at another defined biome id", () => {
		const biomeIds = new Set(biomes.map((biome) => biome.id));
		for (const biome of biomes) {
			if (biome.degradesTo) {
				expect(biomeIds.has(biome.degradesTo)).toBe(true);
			}
		}
	});

	it("gives the two degraded end-states no further degradesTo", () => {
		expect(getBiome("clearedLand")?.degradesTo).toBeUndefined();
		expect(getBiome("barrenRock")?.degradesTo).toBeUndefined();
	});

	it("gives desert no resource yields and no degradation path", () => {
		const desert = getBiome("desert");
		expect(desert?.resourceYields).toEqual({});
		expect(desert?.degradesTo).toBeUndefined();
	});

	it("looks up a biome by id", () => {
		expect(getBiome("mountains")?.label).toBe("Mountains");
	});

	describe("isLand", () => {
		it("treats every biome id as land and 'ocean' as not land", () => {
			for (const biome of biomes) {
				expect(isLand(biome.id)).toBe(true);
			}
			expect(isLand("ocean")).toBe(false);
		});
	});
});
