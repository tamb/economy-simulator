import type { FaceConfig } from "facesjs";
import { generate as generateFace } from "facesjs";
import localforage from "localforage";
import {
	FACE_POOL_SIZE,
	type FaceId,
	formatFaceId,
	getFacePoolIds,
} from "../data/faces";

const store = localforage.createInstance({
	name: "economy-simulator",
	storeName: "faces",
});

async function loadFace(id: FaceId): Promise<FaceConfig | null> {
	const saved = await store.getItem<unknown>(id);
	if (!saved || typeof saved !== "object") {
		return null;
	}

	return saved as FaceConfig;
}

async function saveFace(id: FaceId, config: FaceConfig): Promise<void> {
	await store.setItem(id, config);
}

async function ensureFacePool(): Promise<FaceId[]> {
	const ids = getFacePoolIds();

	for (let index = 0; index < FACE_POOL_SIZE; index++) {
		const id = formatFaceId(index);
		const existing = await loadFace(id);
		if (existing) continue;

		await saveFace(id, generateFace());
	}

	return ids;
}

async function loadFacePool(): Promise<Map<FaceId, FaceConfig>> {
	const pool = new Map<FaceId, FaceConfig>();

	await Promise.all(
		getFacePoolIds().map(async (id) => {
			const config = await loadFace(id);
			if (config) {
				pool.set(id, config);
			}
		}),
	);

	return pool;
}

async function clearFacePool(): Promise<void> {
	await Promise.all(getFacePoolIds().map((id) => store.removeItem(id)));
}

export { clearFacePool, ensureFacePool, loadFace, loadFacePool, saveFace };
