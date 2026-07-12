import { en, Faker } from "@faker-js/faker";
import {
	clearRegionNamesStore,
	loadRegionName as loadRegionNameRepo,
	removeRegionName,
	saveRegionName as saveRegionNameRepo,
} from "economy-simulator-persistence";
import type { RegionId } from "../lib/regions";
import type { WorldRegion } from "../lib/world";
import { randomInt } from "../models/generatePerson";
import {
	ensureRegionResourceStates,
	ensureWorld,
	loadWorldRegions,
	type RegionResourceState,
} from "./world";

type RandomFn = () => number;

interface Region extends WorldRegion {
	name: string;
	resourceState: RegionResourceState;
}

function generateRegionName(random: RandomFn = Math.random): string {
	const faker = new Faker({
		locale: [en],
		seed: randomInt(0, 2_147_483_647, random),
	});
	return faker.location.county();
}

async function loadRegionName(id: RegionId): Promise<string | null> {
	return loadRegionNameRepo(id);
}

async function saveRegionName(id: RegionId, name: string): Promise<void> {
	await saveRegionNameRepo(id, name);
}

async function ensureRegionPool(
	random: RandomFn = Math.random,
): Promise<Region[]> {
	const worldRegions = await ensureWorld(random);
	const resourceStates = await ensureRegionResourceStates(worldRegions);
	const regions: Region[] = [];

	for (const worldRegion of worldRegions) {
		let name = await loadRegionName(worldRegion.id);
		if (!name) {
			name = generateRegionName(random);
			await saveRegionName(worldRegion.id, name);
		}
		regions.push({
			...worldRegion,
			name,
			resourceState: resourceStates[worldRegion.id] ?? {
				reserveOrCapacityByResource: {},
				environmentQuality: 100,
			},
		});
	}

	return regions;
}

async function loadRegionPool(): Promise<Region[]> {
	const worldRegions = (await loadWorldRegions()) ?? [];
	if (worldRegions.length === 0) {
		return [];
	}

	const resourceStates = await ensureRegionResourceStates(worldRegions);
	const regions: Region[] = [];

	for (const worldRegion of worldRegions) {
		const name = await loadRegionName(worldRegion.id);
		if (name) {
			regions.push({
				...worldRegion,
				name,
				resourceState: resourceStates[worldRegion.id] ?? {
					reserveOrCapacityByResource: {},
					environmentQuality: 100,
				},
			});
		}
	}

	return regions;
}

async function clearRegionPool(): Promise<void> {
	const worldRegions = (await loadWorldRegions()) ?? [];
	await Promise.all(worldRegions.map((region) => removeRegionName(region.id)));
	await clearRegionNamesStore();
}

export type { Region };
export {
	clearRegionPool,
	ensureRegionPool,
	generateRegionName,
	loadRegionName,
	loadRegionPool,
	saveRegionName,
};
