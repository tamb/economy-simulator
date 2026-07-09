import { appConfig } from "economy-simulator-data";
import { getStorageDriver } from "../driver/registry";
import type { PopulationMeta } from "../types/population";

const META_KEY = "population-meta";
const LEGACY_KEY = "population";
const STORE = "population" as const;

function isPopulationMeta(value: unknown): value is PopulationMeta {
	if (!value || typeof value !== "object") return false;

	const meta = value as PopulationMeta;
	return (
		meta.version === appConfig.population.storageVersion &&
		typeof meta.size === "number" &&
		meta.size > 0 &&
		meta.cohortCount === appConfig.population.cohortCount &&
		meta.chunkSize === appConfig.population.chunkSize &&
		Array.isArray(meta.cohortSizes) &&
		meta.cohortSizes.length === appConfig.population.cohortCount &&
		meta.cohortSizes.reduce((sum, count) => sum + count, 0) === meta.size &&
		typeof meta.gameDay === "number" &&
		meta.gameDay >= 0
	);
}

async function loadPopulationMeta(): Promise<PopulationMeta | null> {
	const saved = await getStorageDriver().get<unknown>(STORE, META_KEY);
	return isPopulationMeta(saved) ? saved : null;
}

async function savePopulationMeta(meta: PopulationMeta): Promise<void> {
	await getStorageDriver().set(STORE, META_KEY, meta);
}

async function loadPopulationChunkRaw(
	chunkKey: string,
): Promise<unknown[] | null> {
	const saved = await getStorageDriver().get<unknown>(STORE, chunkKey);
	if (!Array.isArray(saved)) return null;
	return saved;
}

async function savePopulationChunkRaw(
	chunkKey: string,
	snapshots: unknown[],
): Promise<void> {
	await getStorageDriver().set(STORE, chunkKey, snapshots);
}

async function removePopulationKey(key: string): Promise<void> {
	await getStorageDriver().remove(STORE, key);
}

async function clearPopulationStore(): Promise<void> {
	await getStorageDriver().clear(STORE);
}

async function clearLegacyPopulationKey(): Promise<void> {
	await removePopulationKey(LEGACY_KEY);
}

export {
	clearLegacyPopulationKey,
	clearPopulationStore,
	isPopulationMeta,
	loadPopulationChunkRaw,
	loadPopulationMeta,
	removePopulationKey,
	savePopulationChunkRaw,
	savePopulationMeta,
};
