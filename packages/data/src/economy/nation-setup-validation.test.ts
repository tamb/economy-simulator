import { describe, expect, it } from "vitest";
import {
	buildAutoAssignments,
	buildAutoRoleConfigs,
	validateNationSetup,
} from "./nation-setup-validation";
import { getAllSubSectorEmploymentShares, sectorKey } from "./taxonomy";

describe("nation-setup-validation", () => {
	it("reports not ready when assignments are empty", () => {
		const result = validateNationSetup({}, {});
		expect(result.ready).toBe(false);
		expect(result.configuredCount).toBe(0);
		expect(result.totalCount).toBe(getAllSubSectorEmploymentShares().length);
	});

	it("passes when auto assignments and role configs are complete", () => {
		const assignments = buildAutoAssignments();
		const roleConfigs = buildAutoRoleConfigs(assignments);
		const result = validateNationSetup(assignments, roleConfigs);
		expect(result.ready).toBe(true);
		expect(result.configuredCount).toBe(result.totalCount);
		expect(result.issues).toHaveLength(0);
	});

	it("fails when role quotas do not sum to 100%", () => {
		const assignments = buildAutoAssignments();
		const roleConfigs = buildAutoRoleConfigs(assignments);
		const first = getAllSubSectorEmploymentShares()[0];
		if (!first) throw new Error("expected sub-sector");
		const key = sectorKey(first.categoryId, first.subSectorId);
		roleConfigs[key] = { quotas: [{ roleId: 10, share: 0.5 }] };
		const result = validateNationSetup(assignments, roleConfigs);
		expect(result.ready).toBe(false);
		expect(result.issues.some((issue) => issue.sectorKey === key)).toBe(true);
	});
});
