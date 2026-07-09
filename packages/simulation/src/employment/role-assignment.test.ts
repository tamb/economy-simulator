import { getDefaultRoleQuotasForSystem } from "economy-simulator-data";
import { describe, expect, it } from "vitest";
import {
	assignRoleForCitizen,
	getRoleModifiersForCitizen,
} from "./role-assignment";

describe("role-assignment", () => {
	it("assignRoleForCitizen respects quotas over many draws", () => {
		const quotas = getDefaultRoleQuotasForSystem("feudalism");
		const counts = new Map<number, number>();
		const draws = 10_000;

		for (let index = 0; index < draws; index++) {
			const roleId = assignRoleForCitizen(quotas, () => index / draws);
			if (roleId == null) continue;
			counts.set(roleId, (counts.get(roleId) ?? 0) + 1);
		}

		const serfShare = (counts.get(65) ?? 0) / draws;
		expect(serfShare).toBeGreaterThan(0.8);
		expect(serfShare).toBeLessThan(0.9);
	});

	it("getRoleModifiersForCitizen returns serf penalties and bonuses", () => {
		const serf = getRoleModifiersForCitizen(65);
		expect(serf.countsAsWorker).toBe(true);
		expect(serf.efficiencyMultiplier).toBeGreaterThan(1);
		expect(serf.moraleMultiplier).toBeLessThan(1);
	});

	it("returns neutral modifiers when role is undefined", () => {
		const none = getRoleModifiersForCitizen(undefined);
		expect(none.countsAsWorker).toBe(false);
		expect(none.moraleMultiplier).toBe(1);
	});
});
