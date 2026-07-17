import { appConfig } from "economy-simulator-data";
import type { FaceId } from "../lib/faces";
import { getChunkCount, getGlobalIndex } from "../lib/population-cohorts";
import type { WorldRegion } from "../lib/world";
import { generatePerson } from "../models/generatePerson";
import type { Person } from "../models/Person";
import {
	finalizePopulationMeta,
	hasPopulation,
	savePopulationChunk,
} from "../repos/population";
import type { SectorRoleConfigs } from "../repos/sector-role-config";

const { cohortCount, chunkSize, batchSize } = appConfig.population;

async function generateAndSavePopulation(
	faceIds: readonly FaceId[],
	regions: readonly WorldRegion[],
	size: number = appConfig.population.size,
	onProgress?: (loaded: number, total: number) => void,
	roleConfigs?: SectorRoleConfigs,
): Promise<boolean> {
	if (await hasPopulation()) {
		return false;
	}

	const cohortBuffers: Person[][] = Array.from(
		{ length: cohortCount },
		() => [],
	);
	const cohortChunkIndexes = Array.from({ length: cohortCount }, () => 0);

	async function flushCohort(cohort: number): Promise<void> {
		const buffer = cohortBuffers[cohort];
		if (buffer.length === 0) return;

		await savePopulationChunk(cohort, cohortChunkIndexes[cohort], buffer);
		cohortBuffers[cohort] = [];
		cohortChunkIndexes[cohort] += 1;
	}

	for (let globalIndex = 0; globalIndex < size; globalIndex++) {
		const cohort = globalIndex % cohortCount;
		const person = generatePerson(
			faceIds,
			regions,
			undefined,
			Math.random,
			roleConfigs,
		);
		person.setIndex(globalIndex);
		cohortBuffers[cohort]?.push(person);

		if ((cohortBuffers[cohort]?.length ?? 0) >= chunkSize) {
			await flushCohort(cohort);
		}

		if ((globalIndex + 1) % batchSize === 0 || globalIndex === size - 1) {
			onProgress?.(globalIndex + 1, size);
			await new Promise<void>((resolve) => {
				setTimeout(resolve, 0);
			});
		}
	}

	for (let cohort = 0; cohort < cohortCount; cohort++) {
		await flushCohort(cohort);
	}

	await finalizePopulationMeta(size);
	return true;
}

/** Test helper: load every person by walking cohort chunks (avoid in production UI). */
async function loadEntirePopulationForTests(
	loadChunk: (cohort: number, chunkIndex: number) => Promise<Person[] | null>,
	size: number,
): Promise<Person[]> {
	const people: Person[] = [];

	for (let cohort = 0; cohort < cohortCount; cohort++) {
		const cohortSize = Math.ceil((size - cohort) / cohortCount);
		const chunkCount = getChunkCount(cohortSize);

		for (let chunkIndex = 0; chunkIndex < chunkCount; chunkIndex++) {
			const chunk = await loadChunk(cohort, chunkIndex);
			if (!chunk) continue;

			for (let offset = 0; offset < chunk.length; offset++) {
				const globalIndex = getGlobalIndex(
					cohort,
					chunkIndex * chunkSize + offset,
				);
				if (globalIndex >= size) break;

				const person = chunk[offset];
				if (person) {
					people[globalIndex] = person;
				}
			}
		}
	}

	return Array.from({ length: size }, (_, index) => {
		const person = people[index];
		if (!person) {
			throw new Error(`Missing person at index ${index}`);
		}
		return person;
	});
}

export { generateAndSavePopulation, loadEntirePopulationForTests };
