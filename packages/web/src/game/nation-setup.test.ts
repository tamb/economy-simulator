import {
	buildAutoAssignments,
	buildAutoRoleConfigs,
	validateNationSetup,
} from "economy-simulator-data";
import { MemoryDriver, setStorageDriver } from "economy-simulator-persistence";
import { describe, expect, it } from "vitest";
import { loadSectorAssignments } from "../storage/sector-assignments";
import { loadSectorRoleConfigs } from "../storage/sector-role-config";
import { autoAssignAllSectors, getNationSetupValidation } from "./nation-setup";

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
});
