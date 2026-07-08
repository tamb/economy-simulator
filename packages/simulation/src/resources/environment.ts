import type { GameSettings } from "economy-simulator-data";
import { gameSettings } from "economy-simulator-data";

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

interface ExtractionEnvironmentEntry {
	extractionIntensity: number;
	/** `economy-simulator-data`'s `ResourceDefinition.environmentalImpact` (0-1). */
	environmentalImpact: number;
	/** `getEconomicSystemEffect(...).environmentalImpactMultiplier`; 1 = no change. */
	economicSystemEnvironmentalImpactMultiplier?: number;
}

/**
 * One year's regional environment-quality (0-100, 100 = pristine) update.
 * Any extraction this year degrades it, proportional to intensity and each
 * resource's environmental impact; with no extraction at all, it instead
 * recovers a fraction of the gap back to pristine. See
 * research/resources-and-geography.md §5.1/§5.4.
 */
function computeAnnualEnvironmentQuality(
	currentQuality: number,
	extractionEntries: ExtractionEnvironmentEntry[],
	settings: GameSettings = gameSettings,
): number {
	const degradation =
		extractionEntries.reduce(
			(sum, entry) =>
				sum +
				Math.max(0, entry.extractionIntensity) *
					entry.environmentalImpact *
					(entry.economicSystemEnvironmentalImpactMultiplier ?? 1),
			0,
		) * settings.resources.environment.degradationPerExtractionIntensity;

	if (degradation > 0) {
		return clamp(currentQuality - degradation, 0, 100);
	}

	return clamp(
		currentQuality +
			settings.resources.environment.annualRecoveryRate *
				(100 - currentQuality),
		0,
		100,
	);
}

/** Max daily happiness swing from environment quality alone, at `qualityOfLifeWeight = 1` and a fully-ruined (quality 0) region — kept in the same ballpark as the other daily deltas in `quality-of-life/daily-update.ts` (idle penalty 3, max overwork penalty 5). */
const MAX_ENVIRONMENTAL_PENALTY_PER_DAY = 10;

/**
 * Converts a region's environment quality into the daily happiness delta
 * fed into `quality-of-life/daily-update.ts`'s `environmentalQualityModifier`.
 * A pristine region (100) contributes 0; a fully-ruined one (0) contributes
 * up to `-MAX_ENVIRONMENTAL_PENALTY_PER_DAY * qualityOfLifeWeight`.
 */
function getEnvironmentalQualityModifier(
	environmentQuality: number,
	settings: GameSettings = gameSettings,
): number {
	const degradationShare = (100 - clamp(environmentQuality, 0, 100)) / 100;
	const penalty =
		degradationShare *
		settings.resources.environment.qualityOfLifeWeight *
		MAX_ENVIRONMENTAL_PENALTY_PER_DAY;
	// Avoid returning -0 for a pristine region (degradationShare === 0).
	return penalty === 0 ? 0 : -penalty;
}

export type { ExtractionEnvironmentEntry };
export { computeAnnualEnvironmentQuality, getEnvironmentalQualityModifier };
