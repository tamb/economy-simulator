import { describe, expect, it } from "vitest";
import { axialDistance } from "./hex-distance";
import { computeInterRegionFlows } from "./inter-region-flows";

describe("axialDistance", () => {
	it("returns 0 for the same hex", () => {
		expect(axialDistance({ q: 1, r: -1 }, { q: 1, r: -1 })).toBe(0);
	});

	it("returns 1 for neighbors", () => {
		expect(axialDistance({ q: 0, r: 0 }, { q: 1, r: 0 })).toBe(1);
	});
});

describe("computeInterRegionFlows", () => {
	it("moves surplus toward deficit with distance friction", () => {
		const result = computeInterRegionFlows({
			regions: [
				{ id: "A", q: 0, r: 0, population: 100 },
				{ id: "B", q: 3, r: 0, population: 100 },
			],
			production: [
				{ regionId: "A", resourceId: "crops", amount: 100 },
				{ regionId: "B", resourceId: "crops", amount: 0 },
			],
			demandByResource: { crops: 80 },
			logisticsEmploymentShare: 0,
		});

		expect(result.transferredByResource.crops).toBeGreaterThan(0);
		expect(result.frictionLossByResource.crops).toBeGreaterThan(0);
		const deficit = result.balances.find(
			(entry) => entry.regionId === "B" && entry.resourceId === "crops",
		);
		expect(deficit?.afterFlow).toBeGreaterThan(0);
		expect(deficit?.shadowPrice).toBeGreaterThan(1);
	});

	it("reduces friction when logistics employment is high", () => {
		const lowLogistics = computeInterRegionFlows({
			regions: [
				{ id: "A", q: 0, r: 0, population: 50 },
				{ id: "B", q: 4, r: 0, population: 50 },
			],
			production: [
				{ regionId: "A", resourceId: "timber", amount: 60 },
				{ regionId: "B", resourceId: "timber", amount: 0 },
			],
			demandByResource: { timber: 40 },
			logisticsEmploymentShare: 0,
		});
		const highLogistics = computeInterRegionFlows({
			regions: [
				{ id: "A", q: 0, r: 0, population: 50 },
				{ id: "B", q: 4, r: 0, population: 50 },
			],
			production: [
				{ regionId: "A", resourceId: "timber", amount: 60 },
				{ regionId: "B", resourceId: "timber", amount: 0 },
			],
			demandByResource: { timber: 40 },
			logisticsEmploymentShare: 0.05,
		});

		expect(highLogistics.frictionLossByResource.timber ?? 0).toBeLessThan(
			lowLogistics.frictionLossByResource.timber ?? 0,
		);
	});
});
