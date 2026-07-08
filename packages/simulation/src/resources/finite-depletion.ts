import type { GameSettings } from "economy-simulator-data";
import { gameSettings } from "economy-simulator-data";

interface FiniteDepletionResult {
	reserveFraction: number;
	/** True once remaining reserves fall to/below `finite.depletionTerrainShiftThreshold` — the caller (region persistence, stage 4) decides whether to actually flip the tile's biome. */
	eligibleForDegradation: boolean;
}

/**
 * One year's reserve depletion for a finite resource (metal ore, fossil
 * fuels, stone). Reserves only ever shrink — there is no regeneration path,
 * unlike renewable resources (`renewable-regeneration.ts`).
 */
function applyFiniteDepletion(
	reserveFraction: number,
	extractionIntensity: number,
	settings: GameSettings = gameSettings,
): FiniteDepletionResult {
	const { extractionToDepletionRatio, depletionTerrainShiftThreshold } =
		settings.resources.finite;

	const nextReserveFraction = Math.max(
		0,
		Math.min(
			1,
			reserveFraction -
				extractionToDepletionRatio * Math.max(0, extractionIntensity),
		),
	);

	return {
		reserveFraction: nextReserveFraction,
		eligibleForDegradation:
			nextReserveFraction <= depletionTerrainShiftThreshold,
	};
}

export type { FiniteDepletionResult };
export { applyFiniteDepletion };
