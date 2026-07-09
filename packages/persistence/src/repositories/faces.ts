import { getStorageDriver } from "../driver/registry";

const STORE = "faces" as const;

async function loadFace(id: string): Promise<unknown | null> {
	return getStorageDriver().get<unknown>(STORE, id);
}

async function saveFace(id: string, config: unknown): Promise<void> {
	await getStorageDriver().set(STORE, id, config);
}

async function removeFace(id: string): Promise<void> {
	await getStorageDriver().remove(STORE, id);
}

async function clearFacesStore(): Promise<void> {
	await getStorageDriver().clear(STORE);
}

export { clearFacesStore, loadFace, removeFace, saveFace };
