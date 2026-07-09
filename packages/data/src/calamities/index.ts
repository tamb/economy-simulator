import biological from "./catalog/biological.json" with { type: "json" };
import geological from "./catalog/geological.json" with { type: "json" };
import human from "./catalog/human.json" with { type: "json" };
import social from "./catalog/social.json" with { type: "json" };
import weather from "./catalog/weather.json" with { type: "json" };
import type { CalamityDefinition, CalamityTier } from "./types";

const calamityDefinitions = [
	...(weather as unknown as CalamityDefinition[]),
	...(geological as unknown as CalamityDefinition[]),
	...(biological as unknown as CalamityDefinition[]),
	...(human as unknown as CalamityDefinition[]),
	...(social as unknown as CalamityDefinition[]),
];

const byId = new Map(
	calamityDefinitions.map((definition) => [definition.id, definition]),
);

function getCalamityDefinition(id: string): CalamityDefinition | undefined {
	return byId.get(id);
}

function getCalamityDefinitions(options?: {
	tiers?: CalamityTier[];
}): CalamityDefinition[] {
	const tiers = options?.tiers;
	if (!tiers || tiers.length === 0) return [...calamityDefinitions];
	const allowed = new Set(tiers);
	return calamityDefinitions.filter((definition) =>
		allowed.has(definition.tier),
	);
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
} from "./types";
export { calamityDefinitions, getCalamityDefinition, getCalamityDefinitions };
