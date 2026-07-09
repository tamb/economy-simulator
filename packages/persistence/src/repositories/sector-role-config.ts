import { getStorageDriver } from "../driver/registry";

const STORAGE_KEY = "sector-role-config";
const STORE = "sector-data" as const;

async function loadSectorRoleConfigRaw(): Promise<unknown> {
	const saved = await getStorageDriver().get<unknown>(STORE, STORAGE_KEY);
	return saved ?? {};
}

async function saveSectorRoleConfigRaw(config: unknown): Promise<void> {
	await getStorageDriver().set(STORE, STORAGE_KEY, config);
}

async function clearSectorRoleConfigStore(): Promise<void> {
	await getStorageDriver().remove(STORE, STORAGE_KEY);
}

export {
	clearSectorRoleConfigStore,
	loadSectorRoleConfigRaw,
	saveSectorRoleConfigRaw,
};
