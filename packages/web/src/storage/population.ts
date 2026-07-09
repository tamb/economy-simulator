export type {
	AgeSexBucket,
	AnnualCycleStats,
	DemographicStats,
	HistogramBucket,
	PopulationMeta,
	RegionStats,
	SectorStats,
} from "../game/population-cycle";
export {
	advanceGameDay,
	clearPopulation,
	computeDemographicStats,
	computeRegionStats,
	computeSectorStats,
	finalizePopulationMeta,
	getPerson,
	getPersonRange,
	getPersonRangeBatched,
	hasPopulation,
	loadPopulationMeta,
	runAnnualCycle,
	savePopulationChunk,
} from "../game/population-cycle";
