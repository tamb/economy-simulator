import { beforeEach, describe, expect, it, vi } from "vitest";

const memory = new Map<string, unknown>();

vi.mock("localforage", () => ({
	default: {
		createInstance: vi.fn(() => ({
			getItem: vi.fn(async (key: string) => memory.get(key) ?? null),
			setItem: vi.fn(async (key: string, value: unknown) => {
				memory.set(key, value);
			}),
			removeItem: vi.fn(async (key: string) => {
				memory.delete(key);
			}),
		})),
	},
}));

const mockFaces = Array.from({ length: 100 }, (_, index) => ({
	body: { id: `body-${index}` },
}));

let generateCount = 0;

vi.mock("facesjs", () => ({
	generate: vi.fn(() => {
		const face = mockFaces[generateCount % mockFaces.length];
		generateCount += 1;
		return face;
	}),
}));

import { FACE_POOL_SIZE, getFacePoolIds } from "../data/faces";
import {
	clearFacePool,
	ensureFacePool,
	loadFace,
	loadFacePool,
	saveFace,
} from "./faces";

describe("face storage", () => {
	beforeEach(() => {
		memory.clear();
		generateCount = 0;
	});

	it("creates and loads the full face pool on first startup", async () => {
		const ids = await ensureFacePool();

		expect(ids).toHaveLength(FACE_POOL_SIZE);
		expect(ids).toEqual(getFacePoolIds());

		const pool = await loadFacePool();
		expect(pool.size).toBe(FACE_POOL_SIZE);
		expect(pool.get("00")).toEqual({ body: { id: "body-0" } });
	});

	it("reuses existing faces without regenerating them", async () => {
		await saveFace("00", { body: { id: "saved-face" } });
		await ensureFacePool();

		await expect(loadFace("00")).resolves.toEqual({
			body: { id: "saved-face" },
		});
	});

	it("clears all stored faces", async () => {
		await ensureFacePool();
		await clearFacePool();

		await expect(loadFacePool()).resolves.toEqual(new Map());
	});
});
