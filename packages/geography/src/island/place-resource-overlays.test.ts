import {
	getEligibleOverlaysForBiome,
	resourceOverlays,
} from "economy-simulator-data";
import { describe, expect, it } from "vitest";
import { createSeededRandom } from "../rng/seeded-random";
import { assignBiomes } from "./assign-biomes";
import { generateIslandShape } from "./generate-island-shape";
import { placeResourceOverlays } from "./place-resource-overlays";

function generateTestBiomes(seed: number, boundingRadius = 5) {
	const { land } = generateIslandShape({
		boundingRadius,
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

	it("places at least one of every catalog overlay", () => {
		for (const seed of [1, 2, 3, 7, 11, 42]) {
			for (const radius of [3, 4, 5]) {
				const tileBiomes = generateTestBiomes(seed, radius);
				const overlays = placeResourceOverlays({
					biomes: tileBiomes,
					resourceOverlayRatio: 0.15,
					random: createSeededRandom(seed + radius),
				});
				const placed = new Set(overlays.values());
				for (const overlay of resourceOverlays) {
					expect(placed.has(overlay.id)).toBe(true);
				}
			}
		}
	});

	it("places at least the catalog guarantees and roughly the configured ratio", () => {
		const tileBiomes = generateTestBiomes(3);
		const eligibleCount = [...tileBiomes.values()].filter(
			(biomeId) => getEligibleOverlaysForBiome(biomeId).length > 0,
		).length;

		const overlays = placeResourceOverlays({
			biomes: tileBiomes,
			resourceOverlayRatio: 0.15,
			random: createSeededRandom(3),
		});

		const ratioTarget = Math.round(eligibleCount * 0.15);
		expect(overlays.size).toBeGreaterThanOrEqual(resourceOverlays.length);
		expect(overlays.size).toBe(Math.max(ratioTarget, resourceOverlays.length));
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
		const tileBiomesA = generateTestBiomes(5);
		const tileBiomesB = new Map(tileBiomesA);
		const a = placeResourceOverlays({
			biomes: tileBiomesA,
			resourceOverlayRatio: 0.2,
			random: createSeededRandom(555),
		});
		const b = placeResourceOverlays({
			biomes: tileBiomesB,
			resourceOverlayRatio: 0.2,
			random: createSeededRandom(555),
		});
		expect([...a.entries()].sort()).toEqual([...b.entries()].sort());
		expect([...tileBiomesA.entries()].sort()).toEqual(
			[...tileBiomesB.entries()].sort(),
		);
	});
});
