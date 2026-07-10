import {
	buildAutoAssignments,
	buildAutoRoleConfigs,
	validateNationSetup,
} from "economy-simulator-data";
import {
	loadGameRunState,
	MemoryDriver,
	setStorageDriver,
} from "economy-simulator-persistence";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getFacePoolIds } from "../data/faces";
import { buildWorldRegions } from "../data/world";
import * as generatePopulation from "../models/generatePopulation";
import { loadSectorAssignments } from "../storage/sector-assignments";
import { loadSectorRoleConfigs } from "../storage/sector-role-config";
import {
	autoAssignAllSectors,
	getNationSetupValidation,
	startGame,
} from "./nation-setup";

const faceIds = getFacePoolIds();
const regions = buildWorldRegions(42_002);

beforeEach(() => {
	setStorageDriver(new MemoryDriver());
});

describe("nation-setup", () => {
	it("autoAssignAllSectors persists complete configuration", async () => {
		setStorageDriver(new MemoryDriver());
		await autoAssignAllSectors();
		const assignments = await loadSectorAssignments();
		const roleConfigs = await loadSectorRoleConfigs();
		const validation = getNationSetupValidation(assignments, roleConfigs);
		expect(validation.ready).toBe(true);
	});

	it("validateNationSetup matches data-layer validation", async () => {
		const assignments = buildAutoAssignments();
		const roleConfigs = buildAutoRoleConfigs(assignments);
		expect(validateNationSetup(assignments, roleConfigs).ready).toBe(true);
	});

	it("startGame activates the run only after population generation succeeds", async () => {
		await autoAssignAllSectors();
		await startGame(6, faceIds, regions);

		const run = await loadGameRunState();
		expect(run?.phase).toBe("active");
	});

	it("startGame keeps setup phase when population generation fails", async () => {
		await autoAssignAllSectors();
		const generateSpy = vi
			.spyOn(generatePopulation, "generateAndSavePopulation")
			.mockRejectedValueOnce(new Error("generation failed"));

		await expect(startGame(6, faceIds, regions)).rejects.toThrow(
			"generation failed",
		);

		const run = await loadGameRunState();
		expect(run?.phase).toBe("setup");
		generateSpy.mockRestore();
	});
});
