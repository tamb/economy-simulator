import { appConfig } from "economy-simulator-data";
import { getStorageDriver } from "../driver/registry";
import type {
	RegionResourceState,
	StoredWorldRegion,
	WorldMeta,
} from "../types/world";

const WORLD_META_KEY = "world-meta";
const WORLD_REGIONS_KEY = "world-regions";
const RESOURCE_STATE_KEY = "region-resource-state";
const STORE = "world" as const;

function isWorldMeta(value: unknown): value is WorldMeta {
	if (!value || typeof value !== "object") return false;
	return (value as WorldMeta).version === appConfig.regions.worldVersion;
}

function isWorldRegionArray(value: unknown): value is StoredWorldRegion[] {
	return (
		Array.isArray(value) &&
		value.every(
			(entry) =>
				entry &&
				typeof entry === "object" &&
				typeof (entry as StoredWorldRegion).id === "string" &&
				typeof (entry as StoredWorldRegion).terrain === "string",
		)
	);
}

async function loadWorldMeta(): Promise<WorldMeta | null> {
	const saved = await getStorageDriver().get<unknown>(STORE, WORLD_META_KEY);
	return isWorldMeta(saved) ? saved : null;
}

async function loadWorldRegions(): Promise<StoredWorldRegion[] | null> {
	const saved = await getStorageDriver().get<unknown>(STORE, WORLD_REGIONS_KEY);
	return isWorldRegionArray(saved) ? saved : null;
}

async function saveWorldMeta(meta: WorldMeta): Promise<void> {
	await getStorageDriver().set(STORE, WORLD_META_KEY, meta);
}

async function saveWorldRegions(regions: StoredWorldRegion[]): Promise<void> {
	await getStorageDriver().set(STORE, WORLD_REGIONS_KEY, regions);
}

async function loadRegionResourceStates(): Promise<Record<
	string,
	RegionResourceState
> | null> {
	const saved = await getStorageDriver().get<unknown>(
		STORE,
		RESOURCE_STATE_KEY,
	);
	return saved && typeof saved === "object"
		? (saved as Record<string, RegionResourceState>)
		: null;
}

async function saveRegionResourceStates(
	states: Record<string, RegionResourceState>,
): Promise<void> {
	await getStorageDriver().set(STORE, RESOURCE_STATE_KEY, states);
}

async function removeRegionResourceStates(): Promise<void> {
	await getStorageDriver().remove(STORE, RESOURCE_STATE_KEY);
}

async function clearWorldStore(): Promise<void> {
	const driver = getStorageDriver();
	await driver.remove(STORE, WORLD_META_KEY);
	await driver.remove(STORE, WORLD_REGIONS_KEY);
	await driver.remove(STORE, RESOURCE_STATE_KEY);
}

export {
	clearWorldStore,
	loadRegionResourceStates,
	loadWorldMeta,
	loadWorldRegions,
	removeRegionResourceStates,
	saveRegionResourceStates,
	saveWorldMeta,
	saveWorldRegions,
};
