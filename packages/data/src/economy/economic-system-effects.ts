import type { EconomicSystemId } from "./economic-systems";

/**
 * Mechanical consequences of assigning an economic system to a sub-sector.
 * Until this table existed, the system picker
 * (`packages/web/src/lib/economic-systems.ts`) was purely descriptive —
 * this gives the player's choice real teeth on resource extraction (see
 * `../geography/resources.ts` and `economy-simulator-simulation`'s
 * `resources/` module).
 *
 * The *direction* of each multiplier is grounded in general political-economy
 * framing (market systems trading environmental externalities for output;
 * planned/command systems trading output for worker protections, but with a
 * documented historical exception for unaccountable command economies whose
 * pollution records were often worse — e.g. the Aral Sea desiccation and
 * Soviet-era industrial pollution). The exact magnitudes are a designed v1
 * balancing choice (same spirit as `taxonomy.ts`'s `employmentWeight` note),
 * not an empirical estimate — see research/resources-and-geography.md.
 */
interface EconomicSystemEffect {
	systemId: EconomicSystemId;
	/** Multiplier on a region's resource-extraction yield-per-worker (1 = no change). */
	efficiencyMultiplier: number;
	/** Multiplier on environmental degradation per unit extracted (>1 = worse). */
	environmentalImpactMultiplier: number;
	/** Multiplier applied to a worker's sector-affinity happiness delta (1 = no change). */
	moraleMultiplier: number;
}

const economicSystemEffects: EconomicSystemEffect[] = [
	{
		systemId: "capitalism",
		efficiencyMultiplier: 1.15,
		environmentalImpactMultiplier: 1.2,
		moraleMultiplier: 1.0,
	},
	{
		systemId: "socialism",
		efficiencyMultiplier: 0.95,
		environmentalImpactMultiplier: 0.85,
		moraleMultiplier: 1.1,
	},
	{
		systemId: "tripartism",
		efficiencyMultiplier: 1.05,
		environmentalImpactMultiplier: 0.9,
		moraleMultiplier: 1.1,
	},
	{
		systemId: "communism",
		efficiencyMultiplier: 0.85,
		environmentalImpactMultiplier: 1.1,
		moraleMultiplier: 0.9,
	},
	{
		systemId: "mixed-economy",
		efficiencyMultiplier: 1.05,
		environmentalImpactMultiplier: 0.95,
		moraleMultiplier: 1.05,
	},
	{
		systemId: "mercantilism",
		efficiencyMultiplier: 1.1,
		environmentalImpactMultiplier: 1.15,
		moraleMultiplier: 0.95,
	},
	{
		systemId: "feudalism",
		efficiencyMultiplier: 0.7,
		environmentalImpactMultiplier: 0.9,
		moraleMultiplier: 0.85,
	},
	{
		systemId: "market-socialism",
		efficiencyMultiplier: 1.0,
		environmentalImpactMultiplier: 0.9,
		moraleMultiplier: 1.05,
	},
	{
		systemId: "state-capitalism",
		efficiencyMultiplier: 1.1,
		environmentalImpactMultiplier: 1.05,
		moraleMultiplier: 0.95,
	},
	{
		systemId: "anarcho-capitalism",
		efficiencyMultiplier: 1.2,
		environmentalImpactMultiplier: 1.3,
		moraleMultiplier: 0.9,
	},
	{
		systemId: "subsistence",
		efficiencyMultiplier: 0.6,
		environmentalImpactMultiplier: 0.6,
		moraleMultiplier: 1.1,
	},
];

function getEconomicSystemEffect(
	id: EconomicSystemId,
): EconomicSystemEffect | undefined {
	return economicSystemEffects.find((effect) => effect.systemId === id);
}

export type { EconomicSystemEffect };
export { economicSystemEffects, getEconomicSystemEffect };
