import type { Terrain } from "./biomes";
import { type BiomeId, getBiome, isLand } from "./biomes";
import { getResource, type ResourceId } from "./resources";

/**
 * Which extractive sub-sector ids (`../economy/taxonomy.ts`) can actually be
 * worked from a tile with this terrain — its biome's viable resources, plus
 * Fishing & Aquaculture on any coastal land tile regardless of biome. Used
 * to make job assignment region-aware: a citizen can only be assigned an
 * extractive sub-sector their home region's terrain supports (see
 * `economy-simulator-simulation`'s `assignJobSector`).
 */
function getViableExtractiveSubSectorIds(
	terrain: Terrain,
	isCoastal: boolean,
): string[] {
	const ids = new Set<string>();

	if (isLand(terrain)) {
		const biome = getBiome(terrain as BiomeId);
		for (const resourceId of Object.keys(
			biome?.resourceYields ?? {},
		) as ResourceId[]) {
			const subSectorId = getResource(resourceId)?.subSectorId;
			if (subSectorId) ids.add(subSectorId);
		}
	}

	if (isCoastal) {
		const fishSubSectorId = getResource("fish")?.subSectorId;
		if (fishSubSectorId) ids.add(fishSubSectorId);
	}

	return [...ids];
}

export { getViableExtractiveSubSectorIds };
