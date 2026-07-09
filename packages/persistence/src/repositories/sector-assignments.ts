import { getStorageDriver } from "../driver/registry";

const STORAGE_KEY = "sector-assignments";
const STORE = "sector-data" as const;

async function loadSectorAssignmentsRaw(): Promise<unknown> {
	const saved = await getStorageDriver().get<unknown>(STORE, STORAGE_KEY);
	return saved ?? {};
}

async function saveSectorAssignmentsRaw(assignments: unknown): Promise<void> {
	await getStorageDriver().set(STORE, STORAGE_KEY, assignments);
}

async function clearSectorAssignmentsStore(): Promise<void> {
	await getStorageDriver().remove(STORE, STORAGE_KEY);
}

export {
	clearSectorAssignmentsStore,
	loadSectorAssignmentsRaw,
	saveSectorAssignmentsRaw,
};
