import { getEligibleOverlaysForBiome } from "economy-simulator-data";
import { describe, expect, it } from "vitest";
import { createSeededRandom } from "../rng/seeded-random";
import { assignBiomes } from "./assign-biomes";
import { generateIslandShape } from "./generate-island-shape";
import { placeResourceOverlays } from "./place-resource-overlays";

function generateTestBiomes(seed: number) {
	const { land } = generateIslandShape({
		boundingRadius: 7,
		targetLandRatio: 0.55,
		random: createSeededRandom(seed),
	});
	return assignBiomes(land, createSeededRandom(seed));
}

describe("placeResourceOverlays", () => {
	it("only places an overlay on a tile whose biome is eligible for it", () => {
		const tileBiomes = generateTestBiomes(1);
		const overlays = placeResourceOverlays({
			biomes: tileBiomes,
			resourceOverlayRatio: 0.15,
			random: createSeededRandom(1),
		});

		for (const [key, overlayId] of overlays) {
			const biomeId = tileBiomes.get(key);
			expect(biomeId).toBeDefined();
			const eligible = getEligibleOverlaysForBiome(biomeId ?? "desert").map(
				(overlay) => overlay.id,
			);
			expect(eligible).toContain(overlayId);
		}
	});

	it("places at most one overlay per tile", () => {
		const tileBiomes = generateTestBiomes(2);
		const overlays = placeResourceOverlays({
			biomes: tileBiomes,
			resourceOverlayRatio: 0.3,
			random: createSeededRandom(2),
		});
		const keys = [...overlays.keys()];
		expect(new Set(keys).size).toBe(keys.length);
	});

	it("places roughly resourceOverlayRatio of the eligible tiles", () => {
		const tileBiomes = generateTestBiomes(3);
		const eligibleCount = [...tileBiomes.values()].filter(
			(biomeId) => getEligibleOverlaysForBiome(biomeId).length > 0,
		).length;

		const overlays = placeResourceOverlays({
			biomes: tileBiomes,
			resourceOverlayRatio: 0.15,
			random: createSeededRandom(3),
		});

		expect(overlays.size).toBe(Math.round(eligibleCount * 0.15));
	});

	it("places no overlays when the ratio is 0", () => {
		const tileBiomes = generateTestBiomes(4);
		const overlays = placeResourceOverlays({
			biomes: tileBiomes,
			resourceOverlayRatio: 0,
			random: createSeededRandom(4),
		});
		expect(overlays.size).toBe(0);
	});

	it("is deterministic for a given seed", () => {
		const tileBiomes = generateTestBiomes(5);
		const a = placeResourceOverlays({
			biomes: tileBiomes,
			resourceOverlayRatio: 0.2,
			random: createSeededRandom(555),
		});
		const b = placeResourceOverlays({
			biomes: tileBiomes,
			resourceOverlayRatio: 0.2,
			random: createSeededRandom(555),
		});
		expect([...a.entries()].sort()).toEqual([...b.entries()].sort());
	});
});
