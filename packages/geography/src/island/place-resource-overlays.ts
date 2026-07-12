import {
	getEligibleOverlaysForBiome,
	type ResourceOverlayId,
	resourceOverlays,
} from "economy-simulator-data";
import type { RandomFn } from "../rng/seeded-random";
import { shuffle } from "../rng/weighted-pick";
import type { GeneratableBiomeId } from "./assign-biomes";

interface PlaceResourceOverlaysOptions {
	biomes: Map<string, GeneratableBiomeId>;
	/** Target fraction of *eligible* land tiles that receive an overlay (see `AppConfig.regions.resourceOverlayRatio`). */
	resourceOverlayRatio: number;
	random: RandomFn;
}

function asGeneratableBiome(biomeId: string): GeneratableBiomeId | undefined {
	if (biomeId === "clearedLand" || biomeId === "barrenRock") return undefined;
	return biomeId as GeneratableBiomeId;
}

function tileKeysForOverlay(
	tileBiomes: Map<string, GeneratableBiomeId>,
	overlayId: ResourceOverlayId,
	exclude: ReadonlySet<string> = new Set(),
): string[] {
	const definition = resourceOverlays.find(
		(overlay) => overlay.id === overlayId,
	);
	if (!definition) return [];
	return [...tileBiomes.entries()]
		.filter(
			([key, biomeId]) =>
				!exclude.has(key) && definition.eligibleBiomes.includes(biomeId),
		)
		.map(([key]) => key);
}

/**
 * Scatters at most one bonus resource overlay per tile. When
 * `resourceOverlayRatio` > 0, every catalog overlay is placed at least once
 * on its own tile (nudging that tile's biome into eligibility if needed —
 * important when tiny islands share a single hills tile between ore and
 * fuel). Remaining slots fill up toward `resourceOverlayRatio` of eligible
 * tiles. Deterministic for a given seeded `random`.
 */
function placeResourceOverlays(
	options: PlaceResourceOverlaysOptions,
): Map<string, ResourceOverlayId> {
	const { biomes: tileBiomes, resourceOverlayRatio, random } = options;
	const overlays = new Map<string, ResourceOverlayId>();

	if (resourceOverlayRatio <= 0 || tileBiomes.size === 0) {
		return overlays;
	}

	// Phase 1 — guarantee one of each catalog overlay on distinct tiles.
	for (const overlay of resourceOverlays) {
		let candidates = shuffle(
			tileKeysForOverlay(tileBiomes, overlay.id, new Set(overlays.keys())),
			random,
		);

		if (candidates.length === 0) {
			const freeKeys = shuffle(
				[...tileBiomes.keys()].filter((key) => !overlays.has(key)),
				random,
			);
			const key = freeKeys[0];
			const biomeId = asGeneratableBiome(overlay.eligibleBiomes[0] ?? "");
			if (key && biomeId) {
				tileBiomes.set(key, biomeId);
				candidates = [key];
			}
		}

		const chosen = candidates[0];
		if (chosen) {
			overlays.set(chosen, overlay.id);
		}
	}

	const eligibleKeys = [...tileBiomes.entries()]
		.filter(([, biomeId]) => getEligibleOverlaysForBiome(biomeId).length > 0)
		.map(([key]) => key);

	const targetCount = Math.max(
		Math.round(eligibleKeys.length * resourceOverlayRatio),
		overlays.size,
	);

	// Phase 2 — fill remaining density budget with random eligible overlays.
	const remainingSlots = targetCount - overlays.size;
	if (remainingSlots > 0) {
		const freeKeys = shuffle(
			eligibleKeys.filter((key) => !overlays.has(key)),
			random,
		).slice(0, remainingSlots);

		for (const key of freeKeys) {
			const biomeId = tileBiomes.get(key);
			if (!biomeId) continue;
			const eligible = getEligibleOverlaysForBiome(biomeId);
			const choice = eligible[Math.floor(random() * eligible.length)];
			if (choice) {
				overlays.set(key, choice.id);
			}
		}
	}

	return overlays;
}

export type { PlaceResourceOverlaysOptions };
export { placeResourceOverlays };
