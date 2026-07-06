import { generatePerson } from "../models/generatePerson";
import type { Person } from "../models/Person";
import {
	POPULATION_BATCH_SIZE,
	POPULATION_SIZE,
} from "../data/population";

export async function generatePopulation(
	size = POPULATION_SIZE,
	onProgress?: (loaded: number, total: number) => void,
): Promise<Person[]> {
	const population: Person[] = [];

	for (let index = 0; index < size; index += POPULATION_BATCH_SIZE) {
		const batchEnd = Math.min(index + POPULATION_BATCH_SIZE, size);

		for (let personIndex = index; personIndex < batchEnd; personIndex++) {
			population.push(generatePerson());
		}

		onProgress?.(batchEnd, size);
		await new Promise<void>((resolve) => {
			setTimeout(resolve, 0);
		});
	}

	return population;
}
