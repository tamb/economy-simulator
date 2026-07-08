import { beforeEach, describe, expect, it, vi } from "vitest";

const memory = new Map<string, unknown>();

vi.mock("localforage", () => ({
	default: {
		createInstance: vi.fn(() => ({
			getItem: vi.fn(async (key: string) => memory.get(key) ?? null),
			setItem: vi.fn(async (key: string, value: unknown) => {
				memory.set(key, value);
			}),
		})),
	},
}));

import {
	getSectorAssignment,
	loadSectorAssignments,
	setSectorAssignment,
} from "./sector-assignments";

describe("sector-assignments", () => {
	beforeEach(() => {
		memory.clear();
	});

	it("returns an empty object when nothing is stored", async () => {
		await expect(loadSectorAssignments()).resolves.toEqual({});
	});

	it("persists and loads sector assignments", async () => {
		const next = await setSectorAssignment(
			{},
			"services",
			"healthcare",
			"socialism",
		);

		expect(next).toEqual({ "services/healthcare": "socialism" });
		await expect(loadSectorAssignments()).resolves.toEqual({
			"services/healthcare": "socialism",
		});
	});

	it("removes assignments when system is cleared", async () => {
		const assigned = await setSectorAssignment(
			{},
			"extractive",
			"agriculture",
			"capitalism",
		);
		const cleared = await setSectorAssignment(
			assigned,
			"extractive",
			"agriculture",
			null,
		);

		expect(cleared).toEqual({});
	});

	it("reads assignments from an in-memory map", () => {
		const assignments = {
			"knowledge/information-technology": "mixed-economy" as const,
		};

		expect(
			getSectorAssignment(assignments, "knowledge", "information-technology"),
		).toBe("mixed-economy");
		expect(
			getSectorAssignment(assignments, "knowledge", "biotechnology"),
		).toBeNull();
	});

	it("ignores invalid values when loading from storage", async () => {
		memory.set("sector-assignments", {
			"services/healthcare": "socialism",
			"services/education": "invalid-system",
			"not-a-sector": 42,
		});

		await expect(loadSectorAssignments()).resolves.toEqual({
			"services/healthcare": "socialism",
		});
	});
});
