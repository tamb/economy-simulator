import { appConfig } from "economy-simulator-data";

const { cohortCount, chunkSize } = appConfig.population;

function getCohortForIndex(globalIndex: number): number {
	return globalIndex % cohortCount;
}

function getCohortPosition(globalIndex: number): number {
	return Math.floor(globalIndex / cohortCount);
}

function getGlobalIndex(cohort: number, position: number): number {
	return position * cohortCount + cohort;
}

function getCohortSize(cohort: number, totalSize: number): number {
	return Math.ceil((totalSize - cohort) / cohortCount);
}

function getChunkCount(cohortSize: number): number {
	return Math.ceil(cohortSize / chunkSize);
}

function getChunkIndex(cohortPosition: number): number {
	return Math.floor(cohortPosition / chunkSize);
}

function getChunkOffset(cohortPosition: number): number {
	return cohortPosition % chunkSize;
}

function formatChunkKey(cohort: number, chunkIndex: number): string {
	return `population-cohort-${cohort}-chunk-${chunkIndex.toString().padStart(4, "0")}`;
}

function getCohortForGameDay(gameDay: number): number {
	return gameDay % cohortCount;
}

export {
	formatChunkKey,
	getChunkCount,
	getChunkIndex,
	getChunkOffset,
	getCohortForGameDay,
	getCohortForIndex,
	getCohortPosition,
	getCohortSize,
	getGlobalIndex,
};
