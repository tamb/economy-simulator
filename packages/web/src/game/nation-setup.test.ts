import {
	buildAutoAssignments,
	buildAutoRoleConfigs,
	getCategory,
	sectorKey,
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
	autoAssignCategory,
	autoAssignSector,
	beginNationFounding,
	getNationSetupValidation,
	isNationInSetupPhase,
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

	it("startGame rejects incomplete nation setup before generating population", async () => {
		await expect(startGame(6, faceIds, regions)).rejects.toThrow(
			"Nation setup is incomplete",
		);

		const run = await loadGameRunState();
		expect(run).toBeNull();
	});

	it("autoAssignCategory configures only the requested category", async () => {
		const category = getCategory("extractive");
		expect(category).toBeDefined();

		await autoAssignCategory("extractive");

		const assignments = await loadSectorAssignments();
		const roleConfigs = await loadSectorRoleConfigs();

		for (const subSector of category?.subSectors ?? []) {
			const key = sectorKey("extractive", subSector.id);
			expect(assignments[key]).toBeTypeOf("string");
			expect(roleConfigs[key]?.quotas.length).toBeGreaterThan(0);
		}

		const validation = getNationSetupValidation(assignments, roleConfigs);
		expect(validation.ready).toBe(false);
		expect(validation.configuredCount).toBe(category?.subSectors.length);
	});

	it("autoAssignSector configures a single sector with an optional system override", async () => {
		await autoAssignSector("services", "healthcare", "socialism");

		const assignments = await loadSectorAssignments();
		const roleConfigs = await loadSectorRoleConfigs();
		const key = sectorKey("services", "healthcare");

		expect(assignments[key]).toBe("socialism");
		expect(roleConfigs[key]?.quotas.length).toBeGreaterThan(0);
	});

	it("beginNationFounding creates a setup-phase run and isNationInSetupPhase reflects it", async () => {
		await beginNationFounding(42);

		const run = await loadGameRunState();
		expect(run?.phase).toBe("setup");
		expect(run?.startingPopulation).toBe(42);
		expect(await isNationInSetupPhase()).toBe(true);
	});
});
