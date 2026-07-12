import { saveSectorAssignmentsRaw } from "economy-simulator-persistence";
import { beforeEach, describe, expect, it } from "vitest";
import { setupMemoryStorage } from "../test/storage-driver";
import {
	getSectorAssignment,
	loadSectorAssignments,
	setSectorAssignment,
} from "./sector-assignments";

describe("sector-assignments", () => {
	beforeEach(() => {
		setupMemoryStorage();
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
		await saveSectorAssignmentsRaw({
			"services/healthcare": "socialism",
			"services/education": "invalid-system",
			"not-a-sector": 42,
		});

		await expect(loadSectorAssignments()).resolves.toEqual({
			"services/healthcare": "socialism",
		});
	});
});
