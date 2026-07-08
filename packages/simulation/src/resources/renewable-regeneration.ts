import type { GameSettings } from "economy-simulator-data";
import { gameSettings } from "economy-simulator-data";

interface RenewableRegenerationResult {
	capacityFraction: number;
	overExtracted: boolean;
	/** True once cumulative capacity loss reaches `renewable.degradationTerrainShiftThreshold` — the caller (region persistence, stage 4) decides whether to actually flip the tile's biome. */
	eligibleForDegradation: boolean;
}

/**
 * One year's carrying-capacity update for a renewable resource (crops,
 * livestock, timber, fish). Extraction at or below the sustainable
 * threshold lets capacity regenerate toward full; extraction above it
 * damages future capacity instead — a simplified stand-in for real
 * overfishing/overgrazing/overlogging dynamics (see
 * research/resources-and-geography.md §3).
 */
function applyRenewableYear(
	capacityFraction: number,
	extractionIntensity: number,
	settings: GameSettings = gameSettings,
): RenewableRegenerationResult {
	const {
		overExtractionThreshold,
		overExtractionDamageRate,
		annualRegenRate,
		degradationTerrainShiftThreshold,
	} = settings.resources.renewable;

	const clampedCapacity = Math.max(0, Math.min(1, capacityFraction));
	const overExtracted = extractionIntensity > overExtractionThreshold;

	const nextCapacityFraction = overExtracted
		? Math.max(
				0,
				clampedCapacity -
					overExtractionDamageRate *
						(extractionIntensity - overExtractionThreshold),
			)
		: Math.min(1, clampedCapacity + annualRegenRate * (1 - clampedCapacity));

	const cumulativeLoss = 1 - nextCapacityFraction;

	return {
		capacityFraction: nextCapacityFraction,
		overExtracted,
		eligibleForDegradation: cumulativeLoss >= degradationTerrainShiftThreshold,
	};
}

export type { RenewableRegenerationResult };
export { applyRenewableYear };
