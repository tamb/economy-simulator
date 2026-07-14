import {
	type CalamityDefinition,
	type GameSettings,
	gameSettings,
	type ResourceId,
} from "economy-simulator-data";

interface CalamityWeightBiasSnapshot {
	/** Mean national QoL (happiness+health)/2, 0–100. */
	nationalAverageQualityOfLife: number;
	/** Mean regional environment quality, 0–100. */
	nationalAverageEnvironment: number;
	/** Lowest staple sufficiency among crops/livestock/fish (1 = ok). */
	stapleSufficiency: number;
	/** Mean timber capacity/reserve fraction across timber-bearing regions. */
	meanTimberCapacity: number;
	/** Mean fossil-fuel reserve fraction across energy-bearing regions. */
	meanFossilReserve: number;
}

/**
 * Dynamic catalog weight multiplier from world state (Phase 0e). Social
 * calamities stay mechanical debuffs — bias only changes onset odds until
 * Phase 2 politics.
 */
function getCalamityWeightMultiplier(
	definition: CalamityDefinition,
	snapshot: CalamityWeightBiasSnapshot,
	settings: GameSettings = gameSettings,
): number {
	const bias = settings.calamities.bias;
	let multiplier = 1;

	if (
		definition.id === "forest_fire" ||
		definition.id === "accidental_fire" ||
		definition.id === "wildfire_smoke"
	) {
		if (snapshot.meanTimberCapacity <= bias.timberStressCapacityThreshold) {
			const stress =
				1 - snapshot.meanTimberCapacity / bias.timberStressCapacityThreshold;
			multiplier *= 1 + (bias.timberFireWeightMultiplier - 1) * stress;
		}
	}

	if (
		definition.id === "food_riot" ||
		definition.id === "labor_strike" ||
		definition.id === "plague_of_corruption"
	) {
		if (snapshot.nationalAverageQualityOfLife <= bias.lowQolThreshold) {
			const stress =
				1 - snapshot.nationalAverageQualityOfLife / bias.lowQolThreshold;
			multiplier *= 1 + (bias.lowQolSocialWeightMultiplier - 1) * stress;
		}
	}

	if (definition.id === "food_riot") {
		if (snapshot.stapleSufficiency <= bias.foodSufficiencyThreshold) {
			const stress =
				1 - snapshot.stapleSufficiency / bias.foodSufficiencyThreshold;
			multiplier *= 1 + (bias.foodRiotWeightMultiplier - 1) * stress;
		}
	}

	if (
		definition.id === "disease" ||
		definition.id === "crop_blight" ||
		definition.id === "insect_swarm"
	) {
		if (snapshot.nationalAverageEnvironment <= bias.lowEnvironmentThreshold) {
			const stress =
				1 - snapshot.nationalAverageEnvironment / bias.lowEnvironmentThreshold;
			multiplier *= 1 + (bias.diseaseWeightMultiplier - 1) * stress;
		}
	}

	if (
		definition.id === "well_blowout" ||
		definition.id === "oil_spill" ||
		definition.id === "mining_accident"
	) {
		if (snapshot.meanFossilReserve <= bias.fossilStressReserveThreshold) {
			const stress =
				1 - snapshot.meanFossilReserve / bias.fossilStressReserveThreshold;
			multiplier *= 1 + (bias.fossilAccidentWeightMultiplier - 1) * stress;
		}
	}

	return Math.max(0.05, multiplier);
}

function biasedCalamityWeight(
	definition: CalamityDefinition,
	snapshot: CalamityWeightBiasSnapshot | undefined,
	settings: GameSettings = gameSettings,
): number {
	if (!snapshot) return definition.weight;
	return (
		definition.weight *
		getCalamityWeightMultiplier(definition, snapshot, settings)
	);
}

/** Helper to derive staple sufficiency from ledger-like entries. */
function stapleSufficiencyFromEntries(
	entries: Array<{ resourceId: ResourceId; sufficiency: number }>,
): number {
	const staples: ResourceId[] = ["crops", "livestock", "fish"];
	let worst = Number.POSITIVE_INFINITY;
	for (const resourceId of staples) {
		const entry = entries.find((item) => item.resourceId === resourceId);
		const sufficiency = entry?.sufficiency ?? Number.POSITIVE_INFINITY;
		if (Number.isFinite(sufficiency)) {
			worst = Math.min(worst, sufficiency);
		}
	}
	return worst === Number.POSITIVE_INFINITY ? 1 : worst;
}

export type { CalamityWeightBiasSnapshot };
export {
	biasedCalamityWeight,
	getCalamityWeightMultiplier,
	stapleSufficiencyFromEntries,
};
