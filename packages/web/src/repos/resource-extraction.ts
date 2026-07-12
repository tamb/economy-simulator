import {
	type BiomeId,
	type GameSettings,
	gameSettings,
	getBiome,
	getEconomicSystemEffect,
	getResourceForSubSector,
	getViableExtractiveSubSectorIds,
	type ResourceId,
} from "economy-simulator-data";
import {
	applyFiniteDepletion,
	applyRenewableYear,
	computeAnnualEnvironmentQuality,
	computeExtractionIntensity,
	computeExtractionYield,
	computeFiniteYieldMultiplier,
	computeNationalLedger,
	computeRenewableYieldMultiplier,
	type ExtractionEnvironmentEntry,
	getBaseYieldPerWorker,
	type NationalLedger,
	type RegionalProduction,
} from "economy-simulator-simulation";
import type { RegionId } from "../lib/regions";
import type { WorldRegion } from "../lib/world";
import {
	getSectorAssignment,
	type SectorAssignments,
} from "./sector-assignments";
import type { RegionResourceState } from "./world";

interface RunAnnualResourceExtractionInput {
	regions: WorldRegion[];
	resourceStates: Record<RegionId, RegionResourceState>;
	/** Region id -> extractive sub-sector id -> assigned worker count this year. */
	extractiveWorkersByRegionAndSubSector: Record<
		RegionId,
		Record<string, number>
	>;
	/** Industrial sub-sector id -> assigned worker count this year. */
	industrialWorkersBySubSector: Record<string, number>;
	sectorAssignments: SectorAssignments;
	settings?: GameSettings;
	/** Optional calamity extraction efficiency lookup (regionId, subSectorId) -> multiplier. */
	getCalamityEfficiency?: (regionId: RegionId, subSectorId: string) => number;
}

interface RunAnnualResourceExtractionResult {
	/** Same regions passed in, with terrain flipped to its degraded biome wherever sustained over-extraction/depletion crossed the configured threshold this year. */
	regions: WorldRegion[];
	resourceStates: Record<RegionId, RegionResourceState>;
	ledger: NationalLedger;
}

/**
 * One game year's national resource-extraction pass: for every region, walks
 * its viable extractive sub-sectors, computes each one's yield (base yield x
 * reserve/capacity multiplier x economic-system efficiency), applies
 * depletion/regeneration, degrades the tile's terrain if it crossed the
 * configured threshold, and updates regional environment quality — then
 * aggregates every region's production into the national ledger. See
 * research/resources-and-geography.md §5.
 */
function runAnnualResourceExtraction({
	regions,
	resourceStates,
	extractiveWorkersByRegionAndSubSector,
	industrialWorkersBySubSector,
	sectorAssignments,
	settings = gameSettings,
	getCalamityEfficiency,
}: RunAnnualResourceExtractionInput): RunAnnualResourceExtractionResult {
	const nextRegions: WorldRegion[] = [];
	const nextResourceStates: Record<RegionId, RegionResourceState> = {};
	const production: RegionalProduction[] = [];

	for (const region of regions) {
		const resourceState: RegionResourceState = resourceStates[region.id] ?? {
			reserveOrCapacityByResource: {},
			environmentQuality: 100,
		};
		const viableSubSectorIds = getViableExtractiveSubSectorIds(
			region.terrain,
			region.isCoastal,
		);
		const workersBySubSector =
			extractiveWorkersByRegionAndSubSector[region.id] ?? {};
		const nextReserveOrCapacity: Partial<Record<ResourceId, number>> = {
			...resourceState.reserveOrCapacityByResource,
		};
		const environmentEntries: ExtractionEnvironmentEntry[] = [];
		let degradesTo: BiomeId | undefined;

		for (const subSectorId of viableSubSectorIds) {
			const resource = getResourceForSubSector(subSectorId);
			if (!resource) continue;

			const workers = workersBySubSector[subSectorId] ?? 0;
			const economicSystemId = getSectorAssignment(
				sectorAssignments,
				"extractive",
				subSectorId,
			);
			const effect = economicSystemId
				? getEconomicSystemEffect(economicSystemId)
				: undefined;

			const baseYieldPerWorker = getBaseYieldPerWorker(
				region.terrain as BiomeId,
				resource.id,
				region.isCoastal,
				region.resourceOverlay,
				settings,
			);
			const reserveOrCapacity =
				resourceState.reserveOrCapacityByResource[resource.id] ?? 1;
			const reserveOrCapacityYieldMultiplier = resource.renewable
				? computeRenewableYieldMultiplier(reserveOrCapacity)
				: computeFiniteYieldMultiplier(reserveOrCapacity, settings);

			const amount = computeExtractionYield({
				baseYieldPerWorker,
				workers,
				reserveOrCapacityYieldMultiplier,
				economicSystemEfficiencyMultiplier: effect?.efficiencyMultiplier,
				calamityEfficiencyMultiplier: getCalamityEfficiency?.(
					region.id,
					subSectorId,
				),
			});
			if (amount > 0) {
				production.push({ resourceId: resource.id, amount });
			}

			const extractionIntensity = computeExtractionIntensity(
				workers,
				settings.resources.extraction.sustainableWorkerCapacity,
			);

			if (resource.renewable) {
				const result = applyRenewableYear(
					reserveOrCapacity,
					extractionIntensity,
					settings,
				);
				nextReserveOrCapacity[resource.id] = result.capacityFraction;
				if (result.eligibleForDegradation) {
					degradesTo = getBiome(region.terrain as BiomeId)?.degradesTo;
				}
			} else {
				const result = applyFiniteDepletion(
					reserveOrCapacity,
					extractionIntensity,
					settings,
				);
				nextReserveOrCapacity[resource.id] = result.reserveFraction;
				if (result.eligibleForDegradation) {
					degradesTo = getBiome(region.terrain as BiomeId)?.degradesTo;
				}
			}

			environmentEntries.push({
				extractionIntensity,
				environmentalImpact: resource.environmentalImpact,
				economicSystemEnvironmentalImpactMultiplier:
					effect?.environmentalImpactMultiplier,
			});
		}

		nextResourceStates[region.id] = {
			reserveOrCapacityByResource: nextReserveOrCapacity,
			environmentQuality: computeAnnualEnvironmentQuality(
				resourceState.environmentQuality,
				environmentEntries,
				settings,
			),
		};
		nextRegions.push(degradesTo ? { ...region, terrain: degradesTo } : region);
	}

	const ledger = computeNationalLedger(
		{ production, industrialWorkersBySubSector },
		settings,
	);

	return { regions: nextRegions, resourceStates: nextResourceStates, ledger };
}

export type {
	RunAnnualResourceExtractionInput,
	RunAnnualResourceExtractionResult,
};
export { runAnnualResourceExtraction };
