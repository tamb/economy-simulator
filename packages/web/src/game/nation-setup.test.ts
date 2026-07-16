import {
	buildAutoAssignments,
	buildAutoRoleConfigs,
	sectorKey,
	validateNationSetup,
} from "economy-simulator-data";
import {
	loadGameRunState,
	MemoryDriver,
	setStorageDriver,
} from "economy-simulator-persistence";
import {
	applyEconomicSystemFiscalBias,
	createInitialNationEconomyState,
} from "economy-simulator-simulation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getFacePoolIds } from "../lib/faces";
import { buildWorldRegions } from "../lib/world";
import * as generatePopulation from "../models/generatePopulation";
import { loadNationEconomy } from "../repos/nation-economy";
import { loadSectorAssignments } from "../repos/sector-assignments";
import { loadSectorRoleConfigs } from "../repos/sector-role-config";
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

	it("startGame seeds nation economy with dominant economic-system fiscal bias", async () => {
		await autoAssignAllSectors();
		await startGame(6, faceIds, regions);

		const assignments = await loadSectorAssignments();
		const counts = new Map<string, number>();
		for (const systemId of Object.values(assignments)) {
			if (!systemId) continue;
			counts.set(systemId, (counts.get(systemId) ?? 0) + 1);
		}
		let dominant: string | undefined;
		let dominantCount = 0;
		for (const [systemId, count] of counts) {
			if (count > dominantCount) {
				dominant = systemId;
				dominantCount = count;
			}
		}

		const expected = createInitialNationEconomyState(
			undefined,
			applyEconomicSystemFiscalBias(dominant),
		);
		const economy = await loadNationEconomy();
		expect(economy?.policy.taxRate).toBe(expected.policy.taxRate);
		expect(economy?.policy.budgetShares).toEqual(expected.policy.budgetShares);
		expect(economy?.treasury).toBe(expected.treasury);
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

	it("startGame rejects incomplete nation setup", async () => {
		await expect(startGame(6, faceIds, regions)).rejects.toThrow(
			"Nation setup is incomplete",
		);
	});

	it("beginNationFounding creates a setup-phase run with the chosen scale", async () => {
		await beginNationFounding(250_000, 3);

		const run = await loadGameRunState();
		expect(run?.phase).toBe("setup");
		expect(run?.startingPopulation).toBe(250_000);
		expect(run?.boundingRadius).toBe(3);
	});

	it("isNationInSetupPhase reflects the persisted game run phase", async () => {
		expect(await isNationInSetupPhase()).toBe(false);

		await beginNationFounding(10_000, 4);
		expect(await isNationInSetupPhase()).toBe(true);
	});

	it("autoAssignCategory configures every sub-sector in the category", async () => {
		await autoAssignCategory("extractive");

		const assignments = await loadSectorAssignments();
		const roleConfigs = await loadSectorRoleConfigs();
		const validation = getNationSetupValidation(assignments, roleConfigs);

		expect(assignments[sectorKey("extractive", "mining")]).toBeDefined();
		expect(
			roleConfigs[sectorKey("extractive", "mining")]?.quotas.length,
		).toBeGreaterThan(0);
		expect(validation.configuredCount).toBeGreaterThan(0);
	});

	it("autoAssignSector configures a single sub-sector", async () => {
		await autoAssignSector("industrial", "light-manufacturing");

		const assignments = await loadSectorAssignments();
		const roleConfigs = await loadSectorRoleConfigs();
		const key = sectorKey("industrial", "light-manufacturing");

		expect(assignments[key]).toBeDefined();
		expect(roleConfigs[key]?.quotas.length).toBeGreaterThan(0);
	});
});
