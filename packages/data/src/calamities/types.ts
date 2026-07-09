import type { BiomeId } from "../geography/biomes";
import type { ResourceId } from "../geography/resources";

type CalamitySeverity = "minor" | "moderate" | "severe";
type CalamityCategory =
	| "weather"
	| "geological"
	| "biological"
	| "human"
	| "social";
type CalamityTier = "v1" | "v1.5" | "v2";
type CalamityScope = "regional" | "national";

type SeverityNumberMap = Record<CalamitySeverity, number>;
type SeverityRangeMap = Record<CalamitySeverity, [number, number]>;
type SeverityResourceFactorMap = Partial<Record<ResourceId, SeverityNumberMap>>;

interface CalamityTargetFilter {
	/** Empty/omitted = any land biome. */
	terrains?: BiomeId[];
	requireCoastal?: boolean;
	forbidCoastal?: boolean;
	/** Prefer regions that have these resources in yield/reserves. */
	requireResources?: ResourceId[];
	maxRegions: number;
}

interface CalamityImmediateEffects {
	/** Multiply current reserve/capacity by this factor (e.g. 0.7 = −30%). */
	resourceCapacityFactors?: SeverityResourceFactorMap;
	environmentDelta: SeverityNumberMap;
	/** Chance to flip terrain via biome.degradesTo. */
	degradeTerrainChance: SeverityNumberMap;
	/** Extra annual mortality probability added on onset year (disease/tsunami). */
	mortalityBump: SeverityNumberMap;
	/** Extra annual emigration probability added on onset year. */
	emigrationBump: SeverityNumberMap;
}

interface CalamityPhaseModifiers {
	extractionEfficiencyFactor: SeverityNumberMap;
	affectedSubSectors: string[];
	happinessPenaltyPerDay: SeverityNumberMap;
	scope: CalamityScope;
}

interface CalamityCascadeRule {
	calamityId: string;
	chance: number;
	minSeverity: CalamitySeverity;
}

interface CalamityDefinition {
	id: string;
	name: string;
	description: string;
	category: CalamityCategory;
	tier: CalamityTier;
	/** Relative roll weight among eligible calamities. */
	weight: number;
	severityWeights: SeverityNumberMap;
	target: CalamityTargetFilter;
	/** Inclusive day-duration ranges [min, max] for the mid-term (visible) debuff. */
	midTermDurationDays: SeverityRangeMap;
	/** Extra days after mid-term for quieter long-term recovery modifiers. */
	longTermExtraDays: SeverityNumberMap;
	immediate: CalamityImmediateEffects;
	midTerm: CalamityPhaseModifiers;
	longTerm: CalamityPhaseModifiers;
	cascades?: CalamityCascadeRule[];
}

export type {
	CalamityCascadeRule,
	CalamityCategory,
	CalamityDefinition,
	CalamityImmediateEffects,
	CalamityPhaseModifiers,
	CalamityScope,
	CalamitySeverity,
	CalamityTargetFilter,
	CalamityTier,
	SeverityNumberMap,
	SeverityRangeMap,
	SeverityResourceFactorMap,
};
