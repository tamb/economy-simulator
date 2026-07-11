import { createInitialGameRunState } from "economy-simulator-persistence";
import { describe, expect, it } from "vitest";
import {
	applyCalamityMutations,
	buildCalamityRegionInputs,
	getYearCalamityBumps,
} from "./calamity-effects";

describe("calamity-effects", () => {
	it("builds region inputs with biome and coastal resources", () => {
		const inputs = buildCalamityRegionInputs(
			[
				{
					id: "R00",
					q: 0,
					r: 0,
					terrain: "forest",
					isCoastal: false,
				},
				{
					id: "R01",
					q: 1,
					r: 0,
					terrain: "plains",
					isCoastal: true,
				},
			],
			{
				R00: {
					reserveOrCapacityByResource: { timber: 0.8 },
					environmentQuality: 90,
				},
			},
		);

		expect(inputs).toHaveLength(2);
		expect(inputs[0]?.resourceIds).toContain("timber");
		expect(inputs[1]?.resourceIds).toContain("fish");
		expect(inputs[1]?.resourceIds).toContain("crops");
	});

	it("applies capacity factors, env delta, and terrain degrade", () => {
		const result = applyCalamityMutations({
			regions: [
				{
					id: "R00",
					q: 0,
					r: 0,
					terrain: "forest",
					isCoastal: false,
				},
			],
			resourceStates: {
				R00: {
					reserveOrCapacityByResource: { timber: 1 },
					environmentQuality: 80,
				},
			},
			mutations: [
				{
					regionId: "R00",
					reserveOrCapacityByResource: { timber: 0.5 },
					environmentDelta: -20,
					degradeTerrain: true,
				},
			],
		});

		expect(result.resourceStates.R00?.reserveOrCapacityByResource.timber).toBe(
			0.5,
		);
		expect(result.resourceStates.R00?.environmentQuality).toBe(60);
		expect(result.regions[0]?.terrain).toBe("clearedLand");
	});
});

describe("getYearCalamityBumps", () => {
	it("sums mortality and emigration bumps for calamities that started during the year", () => {
		const gameRun = {
			...createInitialGameRunState(100),
			phase: "active" as const,
			activeCalamities: [
				{
					instanceId: "active-1",
					calamityId: "earthquake",
					name: "Earthquake",
					severity: "moderate" as const,
					regionIds: ["R00"],
					startedOnGameDay: 50,
					midTermEndsOnGameDay: 150,
					longTermEndsOnGameDay: 290,
					fromCascade: false,
				},
			],
			calamityHistory: [
				{
					instanceId: "history-1",
					calamityId: "earthquake",
					name: "Earthquake",
					severity: "severe" as const,
					regionIds: ["R01"],
					startedOnGameDay: 200,
					endedOnGameDay: 350,
					year: 0,
				},
				{
					instanceId: "history-2",
					calamityId: "earthquake",
					name: "Earthquake",
					severity: "minor" as const,
					regionIds: ["R02"],
					startedOnGameDay: 400,
					endedOnGameDay: 500,
					year: 1,
				},
			],
		};

		const bumps = getYearCalamityBumps(gameRun, 0, 364);

		expect(bumps.mortalityBump).toBeCloseTo(0.003 + 0.012);
		expect(bumps.emigrationBump).toBeCloseTo(0.02 + 0.05);
	});

	it("ignores calamities that started before the completed year window", () => {
		const gameRun = {
			...createInitialGameRunState(100),
			phase: "active" as const,
			activeCalamities: [
				{
					instanceId: "active-1",
					calamityId: "earthquake",
					name: "Earthquake",
					severity: "severe" as const,
					regionIds: ["R00"],
					startedOnGameDay: 364,
					midTermEndsOnGameDay: 500,
					longTermEndsOnGameDay: 700,
					fromCascade: false,
				},
			],
			calamityHistory: [],
		};

		const bumps = getYearCalamityBumps(gameRun, 0, 364);

		expect(bumps.mortalityBump).toBe(0);
		expect(bumps.emigrationBump).toBe(0);
	});
});
