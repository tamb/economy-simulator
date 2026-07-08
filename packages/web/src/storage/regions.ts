import { en, Faker } from "@faker-js/faker";
import localforage from "localforage";
import type { RegionId } from "../data/regions";
import type { WorldRegion } from "../data/world";
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

const store = localforage.createInstance({
	name: "economy-simulator",
	storeName: "regions",
});

/** Retro-flavored "province" name, generated once per region and persisted. */
function generateRegionName(random: RandomFn = Math.random): string {
	const faker = new Faker({
		locale: [en],
		seed: randomInt(0, 2_147_483_647, random),
	});
	return faker.location.county();
}

async function loadRegionName(id: RegionId): Promise<string | null> {
	const saved = await store.getItem<unknown>(id);
	return typeof saved === "string" ? saved : null;
}

async function saveRegionName(id: RegionId, name: string): Promise<void> {
	await store.setItem(id, name);
}

/** Generate any missing region names, then return the full, persisted region list (terrain + name + resource state). */
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

/** Only returns regions that already have a persisted world and a stored name — does not generate either. */
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
	await Promise.all(worldRegions.map((region) => store.removeItem(region.id)));
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
