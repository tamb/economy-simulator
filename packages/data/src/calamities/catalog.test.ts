import { describe, expect, it } from "vitest";
import {
	calamityDefinitions,
	getCalamityDefinition,
	getCalamityDefinitions,
} from "./index";

describe("calamity catalog", () => {
	it("loads all JSON catalogs", () => {
		expect(calamityDefinitions.length).toBe(41);
		expect(new Set(calamityDefinitions.map((c) => c.id)).size).toBe(41);
	});

	it("looks up by id", () => {
		expect(getCalamityDefinition("forest_fire")?.name).toBe("Forest Fire");
		expect(getCalamityDefinition("missing")).toBeUndefined();
	});

	it("filters by tier", () => {
		const v1 = getCalamityDefinitions({ tiers: ["v1"] });
		expect(v1.every((c) => c.tier === "v1")).toBe(true);
		expect(v1.length).toBeGreaterThan(10);
	});

	it("has valid severity maps and durations", () => {
		for (const calamity of calamityDefinitions) {
			expect(calamity.weight).toBeGreaterThan(0);
			expect(calamity.target.maxRegions).toBeGreaterThan(0);
			for (const severity of ["minor", "moderate", "severe"] as const) {
				const [min, max] = calamity.midTermDurationDays[severity];
				expect(min).toBeLessThanOrEqual(max);
				expect(min).toBeGreaterThan(0);
				expect(calamity.immediate.environmentDelta[severity]).toBeTypeOf(
					"number",
				);
				expect(
					calamity.midTerm.extractionEfficiencyFactor[severity],
				).toBeGreaterThan(0);
				expect(
					calamity.midTerm.extractionEfficiencyFactor[severity],
				).toBeLessThanOrEqual(1);
			}
		}
	});

	it("cascade targets exist in the catalog", () => {
		for (const calamity of calamityDefinitions) {
			for (const cascade of calamity.cascades ?? []) {
				expect(getCalamityDefinition(cascade.calamityId)).toBeDefined();
			}
		}
	});
});
