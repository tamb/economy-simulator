import {
	appConfig,
	getResourceForSubSector,
	getViableExtractiveSubSectorIds,
	type ResourceId,
} from "economy-simulator-data";
import {
	clearWorldStore,
	loadRegionResourceStates as loadRegionResourceStatesRepo,
	loadWorldMeta as loadWorldMetaRepo,
	loadWorldRegions as loadWorldRegionsRepo,
	type RegionResourceState,
	removeRegionResourceStates,
	type StoredWorldRegion,
	saveRegionResourceStates as saveRegionResourceStatesRepo,
	saveWorldMeta,
	saveWorldRegions as saveWorldRegionsRepo,
	type WorldMeta,
} from "economy-simulator-persistence";
import type { RegionId } from "../data/regions";
import { buildWorldRegions, type WorldRegion } from "../data/world";

type RandomFn = () => number;

function toWorldRegion(stored: StoredWorldRegion): WorldRegion {
	return stored as WorldRegion;
}

function fromWorldRegion(region: WorldRegion): StoredWorldRegion {
	return region;
}

function initializeRegionResourceState(
	region: WorldRegion,
): RegionResourceState {
	const viableSubSectorIds = getViableExtractiveSubSectorIds(
		region.terrain,
		region.isCoastal,
	);
	const reserveOrCapacityByResource: Partial<Record<ResourceId, number>> = {};

	for (const subSectorId of viableSubSectorIds) {
		const resource = getResourceForSubSector(subSectorId);
		if (resource) {
			reserveOrCapacityByResource[resource.id] = 1;
		}
	}

	return { reserveOrCapacityByResource, environmentQuality: 100 };
}

async function ensureWorld(
	random: RandomFn = Math.random,
): Promise<WorldRegion[]> {
	const meta = await loadWorldMetaRepo();
	const existing = meta ? await loadWorldRegionsRepo() : null;

	if (meta && existing) {
		return existing.map(toWorldRegion);
	}

	const seed = Math.floor(random() * 2_147_483_647);
	const regions = buildWorldRegions(seed);

	await saveWorldRegionsRepo(regions.map(fromWorldRegion));
	await saveWorldMeta({
		version: appConfig.regions.worldVersion,
	} satisfies WorldMeta);
	await removeRegionResourceStates();

	return regions;
}

async function loadWorldRegions(): Promise<WorldRegion[] | null> {
	const saved = await loadWorldRegionsRepo();
	return saved ? saved.map(toWorldRegion) : null;
}

async function loadWorldMeta(): Promise<WorldMeta | null> {
	return loadWorldMetaRepo();
}

async function loadRegionResourceStates(): Promise<Record<
	RegionId,
	RegionResourceState
> | null> {
	return loadRegionResourceStatesRepo();
}

async function saveRegionResourceStates(
	states: Record<RegionId, RegionResourceState>,
): Promise<void> {
	await saveRegionResourceStatesRepo(states);
}

async function ensureRegionResourceStates(
	regions: WorldRegion[],
): Promise<Record<RegionId, RegionResourceState>> {
	const existing = await loadRegionResourceStates();
	const next: Record<RegionId, RegionResourceState> = {};
	let changed = false;

	for (const region of regions) {
		const current = existing?.[region.id];
		if (current) {
			next[region.id] = current;
		} else {
			next[region.id] = initializeRegionResourceState(region);
			changed = true;
		}
	}

	if (changed || !existing) {
		await saveRegionResourceStates(next);
	}

	return next;
}

async function saveWorldRegions(regions: WorldRegion[]): Promise<void> {
	await saveWorldRegionsRepo(regions.map(fromWorldRegion));
}

async function clearWorld(): Promise<void> {
	await clearWorldStore();
}

export type { RegionResourceState, WorldMeta };
export {
	clearWorld,
	ensureRegionResourceStates,
	ensureWorld,
	loadRegionResourceStates,
	loadWorldMeta,
	loadWorldRegions,
	saveRegionResourceStates,
	saveWorldRegions,
};
