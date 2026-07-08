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

import { getRegionCount, getRegionIds } from "../data/regions";
import {
	clearRegionPool,
	ensureRegionPool,
	loadRegionName,
	loadRegionPool,
	saveRegionName,
} from "./regions";
import { ensureWorld } from "./world";

function sequenceRandom(values: number[]): () => number {
	let index = 0;
	return () => values[index++] ?? values.at(-1) ?? 0;
}

describe("region storage", () => {
	beforeEach(() => {
		memory.clear();
	});

	it("generates and persists a name, terrain, and resource state for every region on first startup", async () => {
		const regions = await ensureRegionPool(sequenceRandom([0.1, 0.5, 0.9]));

		expect(regions).toHaveLength(getRegionCount());
		expect(regions.every((region) => typeof region.name === "string")).toBe(
			true,
		);
		expect(regions.every((region) => region.name.length > 0)).toBe(true);
		expect(regions.every((region) => typeof region.terrain === "string")).toBe(
			true,
		);
		expect(
			regions.every((region) => typeof region.resourceState === "object"),
		).toBe(true);

		const loaded = await loadRegionPool();
		expect(loaded).toEqual(regions);
	});

	it("reuses an existing region name and terrain without regenerating either", async () => {
		const first = await ensureRegionPool(sequenceRandom([0.2, 0.4]));
		const second = await ensureRegionPool(sequenceRandom([0.9, 0.1]));

		expect(second).toEqual(first);
	});

	it("reuses an existing region name without regenerating it", async () => {
		await ensureWorld(() => 0.5);
		await saveRegionName("R00", "Kept County");
		const regions = await ensureRegionPool();

		expect(regions.find((region) => region.id === "R00")?.name).toBe(
			"Kept County",
		);
	});

	it("clears all stored region names", async () => {
		await ensureRegionPool();
		await clearRegionPool();

		await expect(loadRegionPool()).resolves.toEqual([]);
		for (const id of getRegionIds()) {
			await expect(loadRegionName(id)).resolves.toBeNull();
		}
	});

	it("only returns regions with a stored name from loadRegionPool", async () => {
		await ensureWorld(() => 0.5);
		await saveRegionName("R00", "Solo Province");

		const loaded = await loadRegionPool();
		expect(loaded).toHaveLength(1);
		expect(loaded[0]?.id).toBe("R00");
		expect(loaded[0]?.name).toBe("Solo Province");
		expect(typeof loaded[0]?.terrain).toBe("string");
	});

	it("returns an empty pool from loadRegionPool when no world has been generated yet", async () => {
		await expect(loadRegionPool()).resolves.toEqual([]);
	});
});
