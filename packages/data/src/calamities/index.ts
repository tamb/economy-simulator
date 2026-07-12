import biologicalCopy from "../copy/calamities/biological.json" with {
	type: "json",
};
import geologicalCopy from "../copy/calamities/geological.json" with {
	type: "json",
};
import humanCopy from "../copy/calamities/human.json" with { type: "json" };
import socialCopy from "../copy/calamities/social.json" with { type: "json" };
import weatherCopy from "../copy/calamities/weather.json" with { type: "json" };
import biological from "./catalog/biological.json" with { type: "json" };
import geological from "./catalog/geological.json" with { type: "json" };
import human from "./catalog/human.json" with { type: "json" };
import social from "./catalog/social.json" with { type: "json" };
import weather from "./catalog/weather.json" with { type: "json" };
import type { CalamityDefinition, CalamityTier } from "./types";

type CalamityFlavorCopy = Record<string, { name: string; description: string }>;

type CalamityMechanics = Omit<CalamityDefinition, "name" | "description">;

const flavorById: CalamityFlavorCopy = {
	...(weatherCopy as CalamityFlavorCopy),
	...(geologicalCopy as CalamityFlavorCopy),
	...(biologicalCopy as CalamityFlavorCopy),
	...(humanCopy as CalamityFlavorCopy),
	...(socialCopy as CalamityFlavorCopy),
};

function mergeCatalog(
	mechanics: CalamityMechanics[],
	sourceLabel: string,
): CalamityDefinition[] {
	return mechanics.map((entry) => {
		const flavor = flavorById[entry.id];
		if (!flavor) {
			throw new Error(
				`Missing copy for calamity "${entry.id}" (${sourceLabel}) in copy/calamities/`,
			);
		}
		return {
			...entry,
			name: flavor.name,
			description: flavor.description,
		};
	});
}

const calamityDefinitions = [
	...mergeCatalog(weather as unknown as CalamityMechanics[], "weather"),
	...mergeCatalog(geological as unknown as CalamityMechanics[], "geological"),
	...mergeCatalog(biological as unknown as CalamityMechanics[], "biological"),
	...mergeCatalog(human as unknown as CalamityMechanics[], "human"),
	...mergeCatalog(social as unknown as CalamityMechanics[], "social"),
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
