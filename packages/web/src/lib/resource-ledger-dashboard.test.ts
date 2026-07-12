import { describe, expect, it } from "vitest";
import {
	buildResourceProductionDemandData,
	buildResourceSufficiencyData,
} from "./resource-ledger-dashboard";

describe("resource-ledger-dashboard", () => {
	it("builds production vs demand chart data from a ledger", () => {
		const data = buildResourceProductionDemandData({
			resources: [
				{
					resourceId: "crops",
					production: 120,
					demand: 80,
					sufficiency: 1.5,
				},
				{
					resourceId: "metalOre",
					production: 10,
					demand: 50,
					sufficiency: 0.2,
				},
			],
			shortfallHappinessPenaltyBySubSector: {},
		});

		expect(data.labels).toEqual(["Crops", "Metal Ore"]);
		expect(data.datasets).toHaveLength(2);
		expect(data.datasets[0]?.data).toEqual([120, 10]);
		expect(data.datasets[1]?.data).toEqual([80, 50]);
	});

	it("builds sufficiency chart data only for resources with demand", () => {
		const data = buildResourceSufficiencyData({
			resources: [
				{
					resourceId: "crops",
					production: 50,
					demand: 100,
					sufficiency: 0.5,
				},
				{
					resourceId: "fish",
					production: 20,
					demand: 0,
					sufficiency: Number.POSITIVE_INFINITY,
				},
			],
			shortfallHappinessPenaltyBySubSector: {},
		});

		expect(data.labels).toEqual(["Crops"]);
		expect(data.datasets[0]?.data).toEqual([50]);
	});
});
