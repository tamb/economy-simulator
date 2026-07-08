import type { BiomeId } from "./biomes";
import type { ResourceId } from "./resources";

/**
 * Rarer bonus resource deposits layered on top of a tile's base biome (at
 * most one overlay per tile). Distinct from biomes: a biome determines which
 * sub-sectors *can* work a tile at all; an overlay boosts yield further, or
 * (fresh water) grants an effect outside the national ledger entirely. See
 * research/resources-and-geography.md.
 */
type ResourceOverlayId =
	| "freshWaterSpring"
	| "richOreVein"
	| "fossilFuelField"
	| "fertileSoil";

interface ResourceOverlayDefinition {
	id: ResourceOverlayId;
	label: string;
	description: string;
	/** Biomes the world generator may place this overlay on. */
	eligibleBiomes: BiomeId[];
	/**
	 * Added on top of the tile's biome `resourceYields` for the listed
	 * resources, if the tile's assigned sub-sector matches.
	 */
	resourceYieldBonus?: Partial<Record<ResourceId, number>>;
	/**
	 * Flat regional environment-quality bonus (0-100 scale), applied
	 * regardless of which sub-sector (if any) is worked there. Represents
	 * fresh water's foundational role in habitability, not just farm yield.
	 */
	environmentQualityBonus?: number;
}

const resourceOverlays: ResourceOverlayDefinition[] = [
	{
		id: "freshWaterSpring",
		label: "Fresh Water Spring",
		description:
			"A year-round spring or aquifer outlet — boosts nearby farming and raises regional livability regardless of what's worked there.",
		eligibleBiomes: ["plains", "pasture", "forest", "wetland", "hills"],
		resourceYieldBonus: { crops: 0.3, livestock: 0.2 },
		environmentQualityBonus: 10,
	},
	{
		id: "richOreVein",
		label: "Rich Ore Vein",
		description: "A concentrated metal deposit, well beyond background ore.",
		eligibleBiomes: ["hills", "mountains"],
		resourceYieldBonus: { metalOre: 0.8 },
	},
	{
		id: "fossilFuelField",
		label: "Fossil Fuel Field",
		description:
			"A coal seam or oil/gas pocket — can occur even under barren desert.",
		eligibleBiomes: ["mountains", "hills", "desert"],
		resourceYieldBonus: { fossilFuels: 0.9 },
	},
	{
		id: "fertileSoil",
		label: "Fertile Soil",
		description:
			"Unusually rich topsoil (volcanic or alluvial) — a strong farming bonus independent of water access.",
		eligibleBiomes: ["plains", "wetland", "pasture"],
		resourceYieldBonus: { crops: 0.4, livestock: 0.2 },
	},
];

function getResourceOverlay(
	id: ResourceOverlayId,
): ResourceOverlayDefinition | undefined {
	return resourceOverlays.find((overlay) => overlay.id === id);
}

function getEligibleOverlaysForBiome(
	biomeId: BiomeId,
): ResourceOverlayDefinition[] {
	return resourceOverlays.filter((overlay) =>
		overlay.eligibleBiomes.includes(biomeId),
	);
}

export type { ResourceOverlayDefinition, ResourceOverlayId };
export { getEligibleOverlaysForBiome, getResourceOverlay, resourceOverlays };
