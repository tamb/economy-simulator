import {
	type BiomeId,
	type GameSettings,
	gameSettings,
	getBiome,
	getResourceOverlay,
	type ResourceId,
	type ResourceOverlayId,
} from "economy-simulator-data";

/**
 * A tile's yield-per-worker for a resource before economic-system efficiency
 * or reserve/capacity scaling are applied — the biome's base yield (0 if the
 * biome can't produce this resource at all), plus a flat coastal bonus for
 * fish (fishing is adjacency-, not biome-, gated — see
 * research/resources-and-geography.md), plus any bonus-overlay yield bonus
 * present on the tile.
 */
function getBaseYieldPerWorker(
	biomeId: BiomeId,
	resourceId: ResourceId,
	isCoastal: boolean,
	resourceOverlayId?: ResourceOverlayId,
	settings: GameSettings = gameSettings,
): number {
	const biomeYield = getBiome(biomeId)?.resourceYields[resourceId] ?? 0;
	const coastalFishBonus =
		resourceId === "fish" && isCoastal
			? settings.resources.extraction.coastalFishYieldPerWorker
			: 0;
	const overlayBonus = resourceOverlayId
		? (getResourceOverlay(resourceOverlayId)?.resourceYieldBonus?.[
				resourceId
			] ?? 0)
		: 0;

	return biomeYield + coastalFishBonus + overlayBonus;
}

export { getBaseYieldPerWorker };
