import { biomes } from "economy-simulator-data";
import { describe, expect, it } from "vitest";
import { coordinateKey } from "../hex/coordinates";
import { createSeededRandom } from "../rng/seeded-random";
import { assignBiomes, computeCoastDistances } from "./assign-biomes";
import { generateIslandShape } from "./generate-island-shape";

const GENERATABLE_BIOME_IDS = new Set(
	biomes
		.map((biome) => biome.id)
		.filter((id) => id !== "clearedLand" && id !== "barrenRock"),
);

describe("computeCoastDistances", () => {
	it("gives every coastal tile a distance of 0", () => {
		const land = new Set([coordinateKey({ q: 0, r: 0 })]);
		const distances = computeCoastDistances(land);
		expect(distances.get(coordinateKey({ q: 0, r: 0 }))).toBe(0);
	});

	it("gives at least one tile a distance greater than 0 on a large enough island", () => {
		const { land } = generateIslandShape({
			boundingRadius: 6,
			targetLandRatio: 0.7,
			random: createSeededRandom(1),
		});
		const distances = computeCoastDistances(land);
		expect([...distances.values()].some((distance) => distance > 0)).toBe(true);
	});

	it("returns a distance entry for every land tile", () => {
		const { land } = generateIslandShape({
			boundingRadius: 5,
			targetLandRatio: 0.5,
			random: createSeededRandom(2),
		});
		const distances = computeCoastDistances(land);
		expect(distances.size).toBe(land.size);
	});
});

describe("assignBiomes", () => {
	it("assigns exactly one known, generatable biome to every land tile", () => {
		const { land } = generateIslandShape({
			boundingRadius: 6,
			targetLandRatio: 0.5,
			random: createSeededRandom(3),
		});
		const assignments = assignBiomes(land, createSeededRandom(3));

		expect(assignments.size).toBe(land.size);
		for (const biomeId of assignments.values()) {
			expect(GENERATABLE_BIOME_IDS.has(biomeId)).toBe(true);
		}
	});

	it("never assigns a degraded end-state biome (those only appear via extraction)", () => {
		const { land } = generateIslandShape({
			boundingRadius: 6,
			targetLandRatio: 0.6,
			random: createSeededRandom(4),
		});
		const assignments = assignBiomes(land, createSeededRandom(4));
		for (const biomeId of assignments.values()) {
			expect(biomeId).not.toBe("clearedLand");
			expect(biomeId).not.toBe("barrenRock");
		}
	});

	it("is deterministic for a given seed", () => {
		const { land } = generateIslandShape({
			boundingRadius: 5,
			targetLandRatio: 0.5,
			random: createSeededRandom(5),
		});
		const a = assignBiomes(land, createSeededRandom(123));
		const b = assignBiomes(land, createSeededRandom(123));
		expect([...a.entries()].sort()).toEqual([...b.entries()].sort());
	});

	it("produces a plausible mix of biomes across a large island (not a single biome)", () => {
		const { land } = generateIslandShape({
			boundingRadius: 8,
			targetLandRatio: 0.55,
			random: createSeededRandom(6),
		});
		const assignments = assignBiomes(land, createSeededRandom(6));
		const distinctBiomes = new Set(assignments.values());
		expect(distinctBiomes.size).toBeGreaterThan(1);
	});
});
