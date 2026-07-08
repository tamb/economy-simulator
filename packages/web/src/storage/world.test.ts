import { isLand } from "economy-simulator-data";
import { beforeEach, describe, expect, it, vi } from "vitest";

const memory = new Map<string, unknown>();

vi.mock("localforage", () => ({
	default: {
		createInstance: vi.fn(() => ({
			getItem: vi.fn(async (key: string) => memory.get(key) ?? null),
			setItem: vi.fn(async (key: string, value: unknown) => {
				memory.set(key, value);
				return value;
			}),
			removeItem: vi.fn(async (key: string) => {
				memory.delete(key);
			}),
		})),
	},
}));

import {
	clearWorld,
	ensureRegionResourceStates,
	ensureWorld,
	loadRegionResourceStates,
	loadWorldMeta,
	loadWorldRegions,
} from "./world";

describe("ensureWorld", () => {
	beforeEach(() => {
		memory.clear();
	});

	it("generates and persists a world on first call", async () => {
		const regions = await ensureWorld(() => 0.5);
		expect(regions.length).toBeGreaterThan(0);
		expect(await loadWorldMeta()).not.toBeNull();
		expect(await loadWorldRegions()).toEqual(regions);
	});

	it("returns the same persisted world on a second call, ignoring the random source", async () => {
		const first = await ensureWorld(() => 0.1);
		const second = await ensureWorld(() => 0.9);
		expect(second).toEqual(first);
	});

	it("has land and ocean regions", async () => {
		const regions = await ensureWorld(() => 0.42);
		expect(regions.some((region) => isLand(region.terrain))).toBe(true);
		expect(regions.some((region) => region.terrain === "ocean")).toBe(true);
	});

	it("clears the persisted world so a subsequent call regenerates it", async () => {
		const first = await ensureWorld(() => 0.2);
		await clearWorld();
		expect(await loadWorldMeta()).toBeNull();

		const second = await ensureWorld(() => 0.8);
		// Not guaranteed to differ (different random seed doesn't guarantee a
		// different island), but meta/regions must have been freshly written.
		expect(second.length).toBe(first.length);
		expect(await loadWorldRegions()).toEqual(second);
	});
});

describe("ensureRegionResourceStates", () => {
	beforeEach(() => {
		memory.clear();
	});

	it("initializes a resource state for every land region with a viable resource", async () => {
		const regions = await ensureWorld(() => 0.33);
		const states = await ensureRegionResourceStates(regions);

		for (const region of regions) {
			expect(states[region.id]).toBeDefined();
			expect(states[region.id]?.environmentQuality).toBe(100);
		}
	});

	it("persists the initialized states for reuse", async () => {
		const regions = await ensureWorld(() => 0.33);
		await ensureRegionResourceStates(regions);

		const saved = await loadRegionResourceStates();
		expect(saved).not.toBeNull();
		expect(Object.keys(saved ?? {})).toHaveLength(regions.length);
	});

	it("does not overwrite an already-initialized state on a second call", async () => {
		const regions = await ensureWorld(() => 0.33);
		const first = await ensureRegionResourceStates(regions);

		const someRegionId = regions[0]?.id;
		if (someRegionId && first[someRegionId]) {
			first[someRegionId].environmentQuality = 42;
		}

		// Persist the mutated state directly (simulating an annual-cycle update).
		const { saveRegionResourceStates } = await import("./world");
		await saveRegionResourceStates(first);

		const second = await ensureRegionResourceStates(regions);
		if (someRegionId) {
			expect(second[someRegionId]?.environmentQuality).toBe(42);
		}
	});

	it("gives a land region with no viable extractive resource an empty reserve map", async () => {
		const regions = await ensureWorld(() => 0.33);
		const states = await ensureRegionResourceStates(regions);

		const barren = regions.find(
			(region) =>
				isLand(region.terrain) &&
				!region.isCoastal &&
				region.terrain === "desert" &&
				!region.resourceOverlay,
		);
		if (barren) {
			expect(states[barren.id]?.reserveOrCapacityByResource).toEqual({});
		}
	});
});
