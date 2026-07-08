import { type BiomeId, biomes } from "economy-simulator-data";
import {
	coordinateKey,
	getAxialNeighbors,
	parseCoordinateKey,
} from "../hex/coordinates";
import type { RandomFn } from "../rng/seeded-random";
import { weightedPick } from "../rng/weighted-pick";
import { computeCoastalTiles } from "./coastal";

/** Only biomes the world generator places directly — the two degraded end-states are a runtime effect of extraction, never generated. */
type GeneratableBiomeId = Exclude<BiomeId, "clearedLand" | "barrenRock">;

/**
 * Biome weight tables per distance-from-coast bucket (0 = coastal, 1 = one
 * tile inland, 2+ = deep interior). Weights are relative, not normalized —
 * `weightedPick` handles that. This is a designed v1 approximation of real
 * coastal-to-interior terrain gradients (wetlands/plains near the shore,
 * hills/mountains inland), not a physically simulated elevation model — see
 * research/resources-and-geography.md.
 */
const BIOME_WEIGHTS_BY_COAST_DISTANCE: Record<
	number,
	Partial<Record<GeneratableBiomeId, number>>
> = {
	0: { wetland: 3, plains: 3, forest: 2, desert: 1 },
	1: { plains: 3, pasture: 2.5, forest: 2.5, hills: 1, desert: 1 },
};
const INTERIOR_BIOME_WEIGHTS: Partial<Record<GeneratableBiomeId, number>> = {
	hills: 3,
	mountains: 3,
	forest: 2,
	pasture: 1,
	desert: 1,
};

function getBiomeWeightsForDistance(
	distance: number,
): Partial<Record<GeneratableBiomeId, number>> {
	return BIOME_WEIGHTS_BY_COAST_DISTANCE[distance] ?? INTERIOR_BIOME_WEIGHTS;
}

/** Multi-source BFS distance (in hex steps) from the nearest coastal tile, for every land tile. */
function computeCoastDistances(land: Set<string>): Map<string, number> {
	const coastal = computeCoastalTiles(land);
	const distances = new Map<string, number>();
	let frontier = [...coastal];

	for (const key of frontier) {
		distances.set(key, 0);
	}

	let distance = 0;
	while (frontier.length > 0) {
		const next: string[] = [];
		for (const key of frontier) {
			const coordinate = parseCoordinateKey(key);
			for (const neighbor of getAxialNeighbors(coordinate)) {
				const neighborKey = coordinateKey(neighbor);
				if (land.has(neighborKey) && !distances.has(neighborKey)) {
					distances.set(neighborKey, distance + 1);
					next.push(neighborKey);
				}
			}
		}
		frontier = next;
		distance += 1;
	}

	return distances;
}

/**
 * Assigns every land tile a biome, biased by its distance from the coast
 * (see `BIOME_WEIGHTS_BY_COAST_DISTANCE`) and perturbed by the supplied
 * seeded random source.
 */
function assignBiomes(
	land: Set<string>,
	random: RandomFn,
): Map<string, GeneratableBiomeId> {
	const knownBiomeIds = new Set(biomes.map((biome) => biome.id));
	const distances = computeCoastDistances(land);
	const assignments = new Map<string, GeneratableBiomeId>();

	for (const key of land) {
		const distance = distances.get(key) ?? 0;
		const weights = getBiomeWeightsForDistance(distance);
		const biomeId = weightedPick(weights, random);
		if (!knownBiomeIds.has(biomeId)) {
			throw new Error(`assignBiomes produced an unknown biome id: ${biomeId}`);
		}
		assignments.set(key, biomeId);
	}

	return assignments;
}

export type { GeneratableBiomeId };
export { assignBiomes, computeCoastDistances };
