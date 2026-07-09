import { getStorageDriver } from "../driver/registry";

const STORE = "regions" as const;

async function loadRegionName(id: string): Promise<string | null> {
	const saved = await getStorageDriver().get<unknown>(STORE, id);
	return typeof saved === "string" ? saved : null;
}

async function saveRegionName(id: string, name: string): Promise<void> {
	await getStorageDriver().set(STORE, id, name);
}

async function removeRegionName(id: string): Promise<void> {
	await getStorageDriver().remove(STORE, id);
}

async function clearRegionNamesStore(): Promise<void> {
	await getStorageDriver().clear(STORE);
}

export {
	clearRegionNamesStore,
	loadRegionName,
	removeRegionName,
	saveRegionName,
};
