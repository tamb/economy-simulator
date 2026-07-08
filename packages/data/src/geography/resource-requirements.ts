import type { ResourceId } from "./resources";

/**
 * Per-worker-year resource inputs consumed by each industrial sub-sector
 * (`../economy/taxonomy.ts`'s "industrial" category), in the same abstract
 * "resource units" as `BiomeDefinition.resourceYields` — so a national
 * sufficiency ratio (production / demand) is directly comparable. Which
 * inputs feed which industry is a designed, plausibility-driven simplification
 * (real input-output tables run to hundreds of commodities); it is not
 * empirically sourced. See research/resources-and-geography.md, and the
 * existing "v1 simplification" note on `taxonomy.ts`'s `employmentWeight`
 * for the same spirit of documented, tunable approximation.
 */
interface ResourceRequirement {
	subSectorId: string;
	inputs: Partial<Record<ResourceId, number>>;
}

const resourceRequirements: ResourceRequirement[] = [
	{
		subSectorId: "heavy-industry",
		inputs: { metalOre: 0.8, fossilFuels: 0.4, stone: 0.2 },
	},
	{
		subSectorId: "light-manufacturing",
		inputs: { timber: 0.3, livestock: 0.2, crops: 0.1 },
	},
	{
		subSectorId: "electronics-machinery",
		inputs: { metalOre: 0.5, fossilFuels: 0.2 },
	},
	{
		subSectorId: "automotive",
		inputs: { metalOre: 0.6, fossilFuels: 0.3, stone: 0.1 },
	},
	{
		subSectorId: "food-processing",
		inputs: { crops: 0.7, livestock: 0.5, fish: 0.3 },
	},
	{
		subSectorId: "construction",
		inputs: { stone: 0.8, timber: 0.6 },
	},
	{
		subSectorId: "utilities",
		inputs: { fossilFuels: 0.7 },
	},
	{
		subSectorId: "pharmaceuticals",
		inputs: { crops: 0.3, livestock: 0.1 },
	},
];

function getResourceRequirement(
	subSectorId: string,
): ResourceRequirement | undefined {
	return resourceRequirements.find(
		(requirement) => requirement.subSectorId === subSectorId,
	);
}

export type { ResourceRequirement };
export { getResourceRequirement, resourceRequirements };
