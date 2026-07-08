/**
 * The seven tradeable natural resources produced by the extractive sub-sectors
 * of `../economy/taxonomy.ts` (one resource per extractive sub-sector — every
 * extractive sub-sector maps to exactly one resource). Fresh water is
 * deliberately *not* one of these: it is modeled as a per-region overlay
 * effect (see `resource-overlays.ts`) rather than a national commodity,
 * because unlike ore or timber it isn't stockpiled/traded — it acts locally,
 * boosting nearby agriculture/livestock yield and regional environment
 * quality directly. See research/resources-and-geography.md.
 */

type ResourceId =
	| "crops"
	| "livestock"
	| "timber"
	| "fish"
	| "metalOre"
	| "fossilFuels"
	| "stone";

interface ResourceDefinition {
	id: ResourceId;
	label: string;
	description: string;
	/** The one extractive sub-sector (see `../economy/taxonomy.ts`) that produces this resource. */
	subSectorId: string;
	/**
	 * Renewable resources (crops/livestock/timber/fish) regenerate annually
	 * and can be over-extracted (yield degrades, recovers when eased). Finite
	 * resources (metalOre/fossilFuels/stone) have a fixed regional reserve
	 * that permanently depletes with extraction.
	 */
	renewable: boolean;
	/**
	 * Relative environmental-impact severity per unit extracted (0-1,
	 * illustrative, not measured) — feeds regional environment-quality
	 * degradation. Ordering reflects real-world extraction literature (fossil
	 * fuels and hard-rock mining are consistently the most locally damaging;
	 * fishing/agriculture the least, absent over-extraction).
	 */
	environmentalImpact: number;
}

const resources: ResourceDefinition[] = [
	{
		id: "crops",
		label: "Crops",
		description: "Food, fiber, and biofuel harvests from cultivated land.",
		subSectorId: "agriculture",
		renewable: true,
		environmentalImpact: 0.3,
	},
	{
		id: "livestock",
		label: "Livestock",
		description: "Meat, milk, eggs, and wool from ranching and pasture.",
		subSectorId: "livestock",
		renewable: true,
		environmentalImpact: 0.4,
	},
	{
		id: "timber",
		label: "Timber",
		description: "Wood and pulp harvested from forest stands.",
		subSectorId: "forestry",
		renewable: true,
		environmentalImpact: 0.35,
	},
	{
		id: "fish",
		label: "Fish",
		description: "Wild catch and farmed seafood from coastal waters.",
		subSectorId: "fishing",
		renewable: true,
		environmentalImpact: 0.25,
	},
	{
		id: "metalOre",
		label: "Metal Ore",
		description: "Iron, copper, and other ores from mines.",
		subSectorId: "mining",
		renewable: false,
		environmentalImpact: 0.75,
	},
	{
		id: "fossilFuels",
		label: "Fossil Fuels",
		description: "Coal, oil, and natural gas from wells and strip mines.",
		subSectorId: "energy",
		renewable: false,
		environmentalImpact: 0.9,
	},
	{
		id: "stone",
		label: "Stone",
		description: "Quarried stone, sand, gravel, and clay.",
		subSectorId: "quarrying",
		renewable: false,
		environmentalImpact: 0.6,
	},
];

function getResource(id: ResourceId): ResourceDefinition | undefined {
	return resources.find((resource) => resource.id === id);
}

function getResourceForSubSector(
	subSectorId: string,
): ResourceDefinition | undefined {
	return resources.find((resource) => resource.subSectorId === subSectorId);
}

export type { ResourceDefinition, ResourceId };
export { getResource, getResourceForSubSector, resources };
