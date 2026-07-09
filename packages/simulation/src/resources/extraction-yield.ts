interface ExtractionYieldInput {
	/** From `getBaseYieldPerWorker` — 0 means this resource can't be worked here at all. */
	baseYieldPerWorker: number;
	workers: number;
	/** From `computeFiniteYieldMultiplier`/`computeRenewableYieldMultiplier`, depending on the resource. */
	reserveOrCapacityYieldMultiplier: number;
	/** From `economy-simulator-data`'s `getEconomicSystemEffect(...).efficiencyMultiplier`; 1 = no change. */
	economicSystemEfficiencyMultiplier?: number;
	/** Average role efficiency across workers in this tile/sub-sector; 1 = no change. */
	roleEfficiencyMultiplier?: number;
	/** From active calamity mid/long-term modifiers; 1 = no change. */
	calamityEfficiencyMultiplier?: number;
}

/**
 * A single tile-resource-year's extraction output. Kept as a plain multiply
 * (no lookups) so it composes cleanly with whichever reserve/capacity and
 * economic-system inputs the caller assembled — see
 * `national-ledger.ts` for how many of these get aggregated nationally.
 */
function computeExtractionYield(input: ExtractionYieldInput): number {
	if (input.workers <= 0 || input.baseYieldPerWorker <= 0) return 0;

	return (
		input.baseYieldPerWorker *
		input.workers *
		Math.max(0, input.reserveOrCapacityYieldMultiplier) *
		(input.economicSystemEfficiencyMultiplier ?? 1) *
		(input.roleEfficiencyMultiplier ?? 1) *
		(input.calamityEfficiencyMultiplier ?? 1)
	);
}

/**
 * How hard a tile's resource is being worked relative to the shared
 * sustainable-capacity baseline (`GameSettings.resources.extraction.sustainableWorkerCapacity`).
 * Used to pace both finite depletion and renewable over-extraction — see
 * `finite-depletion.ts` and `renewable-regeneration.ts`.
 */
function computeExtractionIntensity(
	workers: number,
	sustainableWorkerCapacity: number,
): number {
	if (sustainableWorkerCapacity <= 0) return 0;
	return Math.max(0, workers) / sustainableWorkerCapacity;
}

export type { ExtractionYieldInput };
export { computeExtractionIntensity, computeExtractionYield };
