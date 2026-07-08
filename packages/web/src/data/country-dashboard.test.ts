import { describe, expect, it } from "vitest";
import type { AnnualCycleStats, RegionStats } from "../storage/population";
import type { Region } from "../storage/regions";
import {
	buildQualityOfLifeTrendData,
	buildRegionLeaderboard,
} from "./country-dashboard";

describe("buildQualityOfLifeTrendData", () => {
	it("plots the rounded national average QoL per year", () => {
		const yearlyStats: AnnualCycleStats[] = [
			{
				year: 1,
				populationBefore: 100,
				populationAfter: 100,
				births: 0,
				deaths: 0,
				emigrations: 0,
				immigrations: 0,
				averageQualityOfLife: 54.36,
			},
		];

		const data = buildQualityOfLifeTrendData(yearlyStats);

		expect(data.labels).toEqual(["Y1"]);
		expect(data.datasets).toHaveLength(1);
		expect(data.datasets[0]?.data).toEqual([54.4]);
	});
});

describe("buildRegionLeaderboard", () => {
	const regions: Region[] = [
		{ id: "R00", q: 0, r: 0, name: "Alpha" },
		{ id: "R01", q: 1, r: 0, name: "Beta" },
		{ id: "R02", q: 0, r: 1, name: "Gamma" },
	];

	const stats: Map<string, RegionStats> = new Map([
		["R00", { population: 100, averageHappiness: 40, averageHealth: 60 }],
		["R01", { population: 50, averageHappiness: 80, averageHealth: 30 }],
	]);

	it("excludes regions with no citizens and sorts by population by default", () => {
		const rows = buildRegionLeaderboard(stats, regions);

		expect(rows).toHaveLength(2);
		expect(rows.map((row) => row.regionId)).toEqual(["R00", "R01"]);
	});

	it("sorts by the requested metric", () => {
		const rows = buildRegionLeaderboard(stats, regions, "averageHappiness");
		expect(rows.map((row) => row.regionId)).toEqual(["R01", "R00"]);
	});
});
