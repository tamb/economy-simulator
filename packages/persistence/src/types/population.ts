import type { appConfig } from "economy-simulator-data";

/** Aggregate outcome of one game year's population-dynamics cycle. */
interface AnnualCycleStats {
	year: number;
	populationBefore: number;
	populationAfter: number;
	births: number;
	deaths: number;
	emigrations: number;
	immigrations: number;
	averageQualityOfLife: number;
}

interface PopulationMeta {
	version: typeof appConfig.population.storageVersion;
	size: number;
	cohortCount: number;
	chunkSize: number;
	cohortSizes: number[];
	gameDay: number;
	yearlyStats?: AnnualCycleStats[];
}

export type { AnnualCycleStats, PopulationMeta };
