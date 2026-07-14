import {
	type CategoryId,
	type GameSettings,
	gameSettings,
	type Terrain,
} from "economy-simulator-data";

interface RegionalCapacityInput {
	/** Living population in this region (0 if uninhabited). */
	regionPopulation: number;
	/** Mean living population across land regions (fallback 1). */
	averageLandPopulation: number;
	isCoastal: boolean;
	terrain: Terrain;
}

/**
 * Terrain affinity for non-extractive agglomeration (designed Phase 0b).
 * Extractive jobs stay biome/overlay-gated and are not scaled here.
 */
function terrainAffinity(
	terrain: Terrain,
	categoryId: Exclude<CategoryId, "extractive">,
): number {
	if (terrain === "ocean") return 0.2;

	const industrial: Record<string, number> = {
		plains: 1.15,
		hills: 1.05,
		pasture: 0.95,
		forest: 0.85,
		wetland: 0.8,
		clearedLand: 1.1,
		mountains: 0.55,
		desert: 0.5,
	};
	const services: Record<string, number> = {
		plains: 1.1,
		hills: 1.0,
		pasture: 0.9,
		forest: 0.85,
		wetland: 0.85,
		clearedLand: 1.05,
		mountains: 0.7,
		desert: 0.65,
	};
	const knowledge: Record<string, number> = {
		plains: 1.05,
		hills: 1.1,
		pasture: 0.9,
		forest: 0.95,
		wetland: 0.85,
		clearedLand: 1.0,
		mountains: 0.8,
		desert: 0.75,
	};
	const command: Record<string, number> = {
		plains: 1.05,
		hills: 1.0,
		pasture: 0.95,
		forest: 0.9,
		wetland: 0.9,
		clearedLand: 1.0,
		mountains: 0.85,
		desert: 0.8,
	};

	const table =
		categoryId === "industrial"
			? industrial
			: categoryId === "services"
				? services
				: categoryId === "knowledge"
					? knowledge
					: command;
	return table[terrain] ?? 1;
}

/**
 * Category employment-share multipliers for a province. Values near 1 keep
 * national shares; coastal / dense / favorable terrain raise industrial and
 * services (Krugman-style agglomeration, designed magnitudes).
 */
function computeRegionalCategoryMultipliers(
	input: RegionalCapacityInput,
	settings: GameSettings = gameSettings,
): Partial<Record<CategoryId, number>> {
	const cfg = settings.employment.regional;
	const average = Math.max(1, input.averageLandPopulation);
	const densityRatio = input.regionPopulation / average;
	const densityFactor = 1 + cfg.densityWeight * (densityRatio - 1);

	const clamp = (value: number) =>
		Math.min(
			cfg.maxCapacityMultiplier,
			Math.max(cfg.minCapacityMultiplier, value),
		);

	const industrial =
		terrainAffinity(input.terrain, "industrial") *
		densityFactor *
		(input.isCoastal ? 1 + cfg.coastalIndustrialBonus : 1);

	const services =
		terrainAffinity(input.terrain, "services") *
		densityFactor *
		(input.isCoastal ? 1 + cfg.coastalServicesBonus : 1);

	const knowledge =
		terrainAffinity(input.terrain, "knowledge") *
		(1 +
			(densityRatio > 1 ? cfg.densityKnowledgeBonus * (densityRatio - 1) : 0));

	const command =
		terrainAffinity(input.terrain, "command") * (0.85 + 0.15 * densityFactor);

	return {
		industrial: clamp(industrial),
		services: clamp(services),
		knowledge: clamp(knowledge),
		command: clamp(command),
	};
}

export type { RegionalCapacityInput };
export { computeRegionalCategoryMultipliers, terrainAffinity };
