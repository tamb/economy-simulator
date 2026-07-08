import {
	getEligibleOverlaysForBiome,
	type ResourceOverlayId,
} from "economy-simulator-data";
import type { RandomFn } from "../rng/seeded-random";
import { shuffle } from "../rng/weighted-pick";
import type { GeneratableBiomeId } from "./assign-biomes";

interface PlaceResourceOverlaysOptions {
	biomes: Map<string, GeneratableBiomeId>;
	/** Target fraction of *eligible* land tiles that receive an overlay (see `AppConfig.regions.resourceOverlayRatio`). */
	resourceOverlayRatio: number;
	random: RandomFn;
}

/**
 * Scatters at most one bonus resource overlay per tile, capped at
 * `resourceOverlayRatio` of the tiles eligible for *any* overlay (deserts
 * without an eligible overlay, or biomes no overlay lists, never receive
 * one). Tiles are shuffled with the seeded random source before taking the
 * target count, so which specific eligible tiles get an overlay varies by
 * seed while the overall density stays close to the configured ratio.
 */
function placeResourceOverlays(
	options: PlaceResourceOverlaysOptions,
): Map<string, ResourceOverlayId> {
	const { biomes: tileBiomes, resourceOverlayRatio, random } = options;

	const eligibleKeys = [...tileBiomes.entries()]
		.filter(([, biomeId]) => getEligibleOverlaysForBiome(biomeId).length > 0)
		.map(([key]) => key);

	const targetCount = Math.round(eligibleKeys.length * resourceOverlayRatio);
	const chosenKeys = shuffle(eligibleKeys, random).slice(0, targetCount);

	const overlays = new Map<string, ResourceOverlayId>();
	for (const key of chosenKeys) {
		const biomeId = tileBiomes.get(key);
		if (!biomeId) continue;
		const eligible = getEligibleOverlaysForBiome(biomeId);
		const choice = eligible[Math.floor(random() * eligible.length)];
		if (choice) {
			overlays.set(key, choice.id);
		}
	}

	return overlays;
}

export type { PlaceResourceOverlaysOptions };
export { placeResourceOverlays };
