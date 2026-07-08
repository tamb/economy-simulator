import {
	appConfig,
	getResourceForSubSector,
	getViableExtractiveSubSectorIds,
	type ResourceId,
} from "economy-simulator-data";
import localforage from "localforage";
import type { RegionId } from "../data/regions";
import { buildWorldRegions, type WorldRegion } from "../data/world";

type RandomFn = () => number;

const WORLD_META_KEY = "world-meta";
const WORLD_REGIONS_KEY = "world-regions";
const RESOURCE_STATE_KEY = "region-resource-state";

interface WorldMeta {
	version: typeof appConfig.regions.worldVersion;
}

/** A region's mutable resource economy state — see research/resources-and-geography.md §5.4. */
interface RegionResourceState {
	/** Reserve fraction (finite resources) or carrying-capacity fraction (renewable resources), 1 = full/pristine. */
	reserveOrCapacityByResource: Partial<Record<ResourceId, number>>;
	/** 0-100, 100 = pristine. */
	environmentQuality: number;
}

const store = localforage.createInstance({
	name: "economy-simulator",
	storeName: "world",
});

function isWorldMeta(value: unknown): value is WorldMeta {
	if (!value || typeof value !== "object") return false;
	return (value as WorldMeta).version === appConfig.regions.worldVersion;
}

function isWorldRegionArray(value: unknown): value is WorldRegion[] {
	return (
		Array.isArray(value) &&
		value.every(
			(entry) =>
				entry &&
				typeof entry === "object" &&
				typeof (entry as WorldRegion).id === "string" &&
				typeof (entry as WorldRegion).terrain === "string",
		)
	);
}

async function loadWorldMeta(): Promise<WorldMeta | null> {
	const saved = await store.getItem<unknown>(WORLD_META_KEY);
	return isWorldMeta(saved) ? saved : null;
}

async function loadWorldRegions(): Promise<WorldRegion[] | null> {
	const saved = await store.getItem<unknown>(WORLD_REGIONS_KEY);
	return isWorldRegionArray(saved) ? saved : null;
}

/** Every viable resource (extractive-sub-sector-linked) a region's terrain can produce, at a fresh, undepleted 100%. */
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

/**
 * Loads the persisted world (terrain + resource overlays), generating a
 * fresh island and persisting it if none exists yet or `AppConfig.regions.worldVersion`
 * has been bumped since — the same "regenerate on version mismatch" pattern
 * `storage/population.ts` uses for `population.storageVersion`.
 */
async function ensureWorld(
	random: RandomFn = Math.random,
): Promise<WorldRegion[]> {
	const meta = await loadWorldMeta();
	const existing = meta ? await loadWorldRegions() : null;

	if (meta && existing) {
		return existing;
	}

	const seed = Math.floor(random() * 2_147_483_647);
	const regions = buildWorldRegions(seed);

	await store.setItem(WORLD_REGIONS_KEY, regions);
	await store.setItem(WORLD_META_KEY, {
		version: appConfig.regions.worldVersion,
	} satisfies WorldMeta);
	// A freshly (re)generated world invalidates any previously persisted
	// resource state (region ids may now map to different terrain).
	await store.removeItem(RESOURCE_STATE_KEY);

	return regions;
}

async function loadRegionResourceStates(): Promise<Record<
	RegionId,
	RegionResourceState
> | null> {
	const saved = await store.getItem<unknown>(RESOURCE_STATE_KEY);
	return saved && typeof saved === "object"
		? (saved as Record<RegionId, RegionResourceState>)
		: null;
}

async function saveRegionResourceStates(
	states: Record<RegionId, RegionResourceState>,
): Promise<void> {
	await store.setItem(RESOURCE_STATE_KEY, states);
}

/** Ensures every region in `regions` has a resource-state entry (initializing any missing ones), and returns the full map. */
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

/** Persists an updated region list in place (e.g. after terrain degradation from sustained over-extraction) without touching `WorldMeta` or resource state. */
async function saveWorldRegions(regions: WorldRegion[]): Promise<void> {
	await store.setItem(WORLD_REGIONS_KEY, regions);
}

async function clearWorld(): Promise<void> {
	await store.removeItem(WORLD_META_KEY);
	await store.removeItem(WORLD_REGIONS_KEY);
	await store.removeItem(RESOURCE_STATE_KEY);
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
