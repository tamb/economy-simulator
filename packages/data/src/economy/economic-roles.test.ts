import { describe, expect, it } from "vitest";
import {
	defaultRoleQuotasBySystem,
	economicRoles,
	getDefaultRoleQuotasForSystem,
	getRolesForSystem,
} from "./economic-roles";
import { economicSystems } from "./economic-systems";
import { roleEffects } from "./role-effects";

describe("economic-roles", () => {
	it("defines at least three roles per economic system", () => {
		for (const system of economicSystems) {
			expect(getRolesForSystem(system.id).length).toBeGreaterThanOrEqual(3);
		}
	});

	it("uses globally unique numeric role ids", () => {
		const ids = economicRoles.map((role) => role.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it("includes serf at id 65 for feudalism", () => {
		const serf = economicRoles.find((role) => role.id === 65);
		expect(serf?.systemId).toBe("feudalism");
		expect(serf?.slug).toBe("serf");
	});

	it("has a role effect entry for every role", () => {
		for (const role of economicRoles) {
			expect(roleEffects.some((effect) => effect.roleId === role.id)).toBe(
				true,
			);
		}
	});

	it("default quotas per system sum to 1", () => {
		for (const system of economicSystems) {
			const quotas = getDefaultRoleQuotasForSystem(system.id);
			const total = quotas.reduce((sum, quota) => sum + quota.share, 0);
			expect(total).toBeCloseTo(1, 5);
		}
	});

	it("default quotas only reference roles for that system", () => {
		for (const system of economicSystems) {
			const roleIds = new Set(
				getRolesForSystem(system.id).map((role) => role.id),
			);
			for (const quota of defaultRoleQuotasBySystem[system.id]) {
				expect(roleIds.has(quota.roleId)).toBe(true);
			}
		}
	});
});
