import { describe, expect, it } from "vitest";
import type { Region } from "../repos/regions";
import { buildWeeklyReport, classifyDistress } from "./weekly-reports";

describe("weekly reports", () => {
	it("classifies calamity-hit regions first", () => {
		const result = classifyDistress({
			averageHappiness: 20,
			averageHealth: 20,
			environmentQuality: 20,
			underCalamity: true,
		});
		expect(result.distress).toBe("calamity_hit");
	});

	it("picks the lowest gap among happiness, health, and environment", () => {
		expect(
			classifyDistress({
				averageHappiness: 10,
				averageHealth: 50,
				environmentQuality: 50,
				underCalamity: false,
			}).distress,
		).toBe("low_happiness");
		expect(
			classifyDistress({
				averageHappiness: 50,
				averageHealth: 10,
				environmentQuality: 50,
				underCalamity: false,
			}).distress,
		).toBe("low_health");
		expect(
			classifyDistress({
				averageHappiness: 50,
				averageHealth: 50,
				environmentQuality: 10,
				underCalamity: false,
			}).distress,
		).toBe("low_environment");
	});

	it("builds a report for the worst populated land regions", () => {
		const stats = new Map([
			["R01", { population: 100, averageHappiness: 20, averageHealth: 40 }],
			["R02", { population: 80, averageHappiness: 70, averageHealth: 70 }],
			["R03", { population: 0, averageHappiness: 5, averageHealth: 5 }],
		]);
		const regions = [
			{
				id: "R01",
				name: "Ashvale",
				terrain: "plains",
				isCoastal: false,
				q: 0,
				r: 0,
				resourceOverlay: undefined,
				resourceState: {
					reserveOrCapacityByResource: {},
					environmentQuality: 55,
				},
			},
			{
				id: "R02",
				name: "Greenreach",
				terrain: "forest",
				isCoastal: false,
				q: 1,
				r: 0,
				resourceOverlay: undefined,
				resourceState: {
					reserveOrCapacityByResource: {},
					environmentQuality: 80,
				},
			},
			{
				id: "ocean",
				name: "Sea",
				terrain: "ocean",
				isCoastal: false,
				q: 2,
				r: 0,
				resourceOverlay: undefined,
				resourceState: {
					reserveOrCapacityByResource: {},
					environmentQuality: 100,
				},
			},
		] as Region[];

		const report = buildWeeklyReport({
			gameDay: 7,
			stats,
			regions,
			activeCalamities: [],
		});

		expect(report).not.toBeNull();
		expect(report?.primaryRegionId).toBe("R01");
		expect(report?.distress).toBe("low_happiness");
		expect(report?.regions[0]?.name).toBe("Ashvale");
		expect(report?.prompt.length).toBeGreaterThan(0);
	});
});
