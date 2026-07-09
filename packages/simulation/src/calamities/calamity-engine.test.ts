import { getCalamityDefinition } from "economy-simulator-data";
import { describe, expect, it } from "vitest";
import {
	getCalamityModifiersForCitizen,
	getVisibleActiveCalamities,
	processCalamitiesForDay,
	regionMatchesFilter,
	selectTargetRegions,
} from "./calamity-engine";

function forestRegion(id = "R00") {
	return {
		id,
		terrain: "forest" as const,
		isCoastal: false,
		resourceIds: ["timber" as const],
	};
}

function coastalRegion(id = "R01") {
	return {
		id,
		terrain: "plains" as const,
		isCoastal: true,
		resourceIds: ["fish" as const, "crops" as const],
	};
}

describe("calamity engine", () => {
	it("matches forest fire to forest timber regions only", () => {
		const definition = getCalamityDefinition("forest_fire");
		expect(definition).toBeDefined();
		if (!definition) return;
		expect(regionMatchesFilter(forestRegion(), definition)).toBe(true);
		expect(regionMatchesFilter(coastalRegion(), definition)).toBe(false);
	});

	it("selects up to maxRegions targets", () => {
		const definition = getCalamityDefinition("forest_fire");
		expect(definition).toBeDefined();
		if (!definition) return;
		const regions = [forestRegion("R00"), forestRegion("R02"), coastalRegion()];
		const selected = selectTargetRegions(definition, regions, () => 0.1);
		expect(selected.length).toBeGreaterThan(0);
		expect(selected.length).toBeLessThanOrEqual(definition.target.maxRegions);
		expect(selected.every((id) => id === "R00" || id === "R02")).toBe(true);
	});

	it("forces a forest fire onset with immediate timber damage", () => {
		const result = processCalamitiesForDay({
			run: {
				activeCalamities: [],
				calamityHistory: [],
				lastCalamityOnsetGameDay: null,
				lastSevereCalamityOnsetGameDay: null,
			},
			gameDay: 10,
			regions: [forestRegion()],
			random: () => 0.01,
			forceCalamityId: "forest_fire",
		});

		expect(result.onsets).toHaveLength(1);
		const onset = result.onsets[0];
		expect(onset?.calamity.calamityId).toBe("forest_fire");
		expect(onset?.calamity.regionIds).toContain("R00");
		expect(
			onset?.mutations[0]?.reserveOrCapacityByResource.timber,
		).toBeLessThan(1);
		expect(onset?.mutations[0]?.environmentDelta).toBeLessThan(0);
		expect(result.run.activeCalamities).toHaveLength(1);
		expect(result.run.lastCalamityOnsetGameDay).toBe(10);
	});

	it("respects mid-term stack cap", () => {
		const active = Array.from({ length: 4 }, (_, index) => ({
			instanceId: `x-${index}`,
			calamityId: "heatwave",
			name: "Heatwave",
			severity: "minor" as const,
			regionIds: ["R00"],
			startedOnGameDay: 0,
			midTermEndsOnGameDay: 100,
			longTermEndsOnGameDay: 120,
			fromCascade: false,
		}));

		const result = processCalamitiesForDay({
			run: {
				activeCalamities: active,
				calamityHistory: [],
				lastCalamityOnsetGameDay: null,
				lastSevereCalamityOnsetGameDay: null,
			},
			gameDay: 50,
			regions: [forestRegion()],
			random: () => 0,
			forceCalamityId: "forest_fire",
		});

		expect(result.onsets).toHaveLength(0);
		expect(result.run.activeCalamities).toHaveLength(4);
	});

	it("expires long-term calamities into history", () => {
		const result = processCalamitiesForDay({
			run: {
				activeCalamities: [
					{
						instanceId: "old",
						calamityId: "tornado",
						name: "Tornado",
						severity: "minor",
						regionIds: ["R00"],
						startedOnGameDay: 0,
						midTermEndsOnGameDay: 20,
						longTermEndsOnGameDay: 30,
						fromCascade: false,
					},
				],
				calamityHistory: [],
				lastCalamityOnsetGameDay: 0,
				lastSevereCalamityOnsetGameDay: null,
			},
			gameDay: 30,
			regions: [forestRegion()],
			random: () => 0.99,
		});

		expect(result.run.activeCalamities).toHaveLength(0);
		expect(result.expired).toHaveLength(1);
		expect(result.run.calamityHistory[0]?.calamityId).toBe("tornado");
	});

	it("applies regional happiness and extraction modifiers", () => {
		const active = [
			{
				instanceId: "ff",
				calamityId: "forest_fire",
				name: "Forest Fire",
				severity: "moderate" as const,
				regionIds: ["R00"],
				startedOnGameDay: 0,
				midTermEndsOnGameDay: 100,
				longTermEndsOnGameDay: 200,
				fromCascade: false,
			},
		];

		const hit = getCalamityModifiersForCitizen({
			activeCalamities: active,
			gameDay: 10,
			regionId: "R00",
			subSectorId: "forestry",
		});
		expect(hit.happinessPenaltyPerDay).toBeGreaterThan(0);
		expect(hit.extractionEfficiencyFactor).toBeLessThan(1);

		const miss = getCalamityModifiersForCitizen({
			activeCalamities: active,
			gameDay: 10,
			regionId: "R99",
			subSectorId: "forestry",
		});
		expect(miss.happinessPenaltyPerDay).toBe(0);
		expect(miss.extractionEfficiencyFactor).toBe(1);
	});

	it("hides long-term-only calamities from the visible strip", () => {
		const active = [
			{
				instanceId: "ff",
				calamityId: "forest_fire",
				name: "Forest Fire",
				severity: "minor" as const,
				regionIds: ["R00"],
				startedOnGameDay: 0,
				midTermEndsOnGameDay: 50,
				longTermEndsOnGameDay: 120,
				fromCascade: false,
			},
		];
		expect(getVisibleActiveCalamities(active, 10)).toHaveLength(1);
		expect(getVisibleActiveCalamities(active, 50)).toHaveLength(0);
	});
});
