import localforage from "localforage";
import { POPULATION_SIZE } from "../data/population";
import type { Person } from "../models/Person";

const STORAGE_KEY = "population";

const store = localforage.createInstance({
	name: "economy-simulator",
	storeName: "sector-data",
});

export async function loadPopulation(): Promise<Person[] | null> {
	const saved = await store.getItem<unknown>(STORAGE_KEY);
	if (!Array.isArray(saved) || saved.length !== POPULATION_SIZE) {
		return null;
	}

	return saved as Person[];
}

export async function savePopulation(population: Person[]): Promise<void> {
	await store.setItem(STORAGE_KEY, population);
}

export async function clearPopulation(): Promise<void> {
	await store.removeItem(STORAGE_KEY);
}
