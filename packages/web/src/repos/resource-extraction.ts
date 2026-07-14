import {
	type BiomeId,
	type GameSettings,
	gameSettings,
	getBiome,
	getEconomicSystemEffect,
	getResourceForSubSector,
	getResourceRequirement,
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
	computeInterRegionFlows,
	computeNationalLedger,
	computeRenewableYieldMultiplier,
	type ExtractionEnvironmentEntry,
	getBaseYieldPerWorker,
	type InterRegionFlowResult,
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
	/** Region id -> living population (for domestic flow demand shares). */
	populationByRegion?: Record<RegionId, number>;
	/** National employment share in transport-logistics (0–1). */
	logisticsEmploymentShare?: number;
	/** Prior-year stockpile carry-over. */
	priorStockpileByResource?: Partial<Record<ResourceId, number>>;
	/**
	 * Phase 1a infrastructure multipliers (from prior year's indices).
	 * Extraction yield and inter-region flow capacity.
	 */
	infrastructureEfficiencyMultiplier?: number;
	infrastructureFlowCapacityMultiplier?: number;
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
	flows: InterRegionFlowResult | null;
}

/**
 * One game year's national resource-extraction pass: for every region, walks
 * its viable extractive sub-sectors, computes each one's yield, applies
 * depletion/regeneration, then runs domestic inter-region flows and the
 * national ledger with stockpile carry-over. See
 * research/resources-and-geography.md §5 and
 * research/stockpiles-flows-and-regional-employment.md.
 */
function runAnnualResourceExtraction({
	regions,
	resourceStates,
	extractiveWorkersByRegionAndSubSector,
	industrialWorkersBySubSector,
	populationByRegion = {},
	logisticsEmploymentShare = 0,
	priorStockpileByResource = {},
	infrastructureEfficiencyMultiplier = 1,
	infrastructureFlowCapacityMultiplier,
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
				infrastructureEfficiencyMultiplier,
			});
			if (amount > 0) {
				production.push({
					resourceId: resource.id,
					regionId: region.id,
					amount,
				});
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

	const demandByResource: Partial<Record<ResourceId, number>> = {};
	for (const [subSectorId, workers] of Object.entries(
		industrialWorkersBySubSector,
	)) {
		const requirement = getResourceRequirement(subSectorId);
		if (!requirement || workers <= 0) continue;
		for (const [resourceId, perWorkerAmount] of Object.entries(
			requirement.inputs,
		) as [ResourceId, number][]) {
			demandByResource[resourceId] =
				(demandByResource[resourceId] ?? 0) + perWorkerAmount * workers;
		}
	}

	const landRegions = regions.filter((region) => region.terrain !== "ocean");
	const flows =
		landRegions.length > 0 && production.length > 0
			? computeInterRegionFlows({
					regions: landRegions.map((region) => ({
						id: region.id,
						q: region.q,
						r: region.r,
						population: populationByRegion[region.id] ?? 0,
					})),
					production: production.map((entry) => ({
						regionId: entry.regionId ?? "",
						resourceId: entry.resourceId,
						amount: entry.amount,
					})),
					demandByResource,
					logisticsEmploymentShare,
					infrastructureCapacityMultiplier:
						infrastructureFlowCapacityMultiplier,
					settings,
				})
			: null;

	const ledger = computeNationalLedger(
		{
			production,
			industrialWorkersBySubSector,
			priorStockpileByResource,
			effectiveProductionByResource: flows?.effectiveProductionByResource,
		},
		settings,
	);

	return {
		regions: nextRegions,
		resourceStates: nextResourceStates,
		ledger,
		flows,
	};
}

export type {
	RunAnnualResourceExtractionInput,
	RunAnnualResourceExtractionResult,
};
export { runAnnualResourceExtraction };
