import { describe, expect, it } from "vitest";
import {
	buildNationScoreTrendData,
	formatEndReason,
} from "./score-dashboard";

describe("formatEndReason", () => {
	it("maps known win and lose reasons to player-facing labels", () => {
		expect(formatEndReason("extinction")).toBe("Nation extinct");
		expect(formatEndReason("mass_exodus")).toBe("Mass exodus");
		expect(formatEndReason("prosperity_sustained")).toBe("Prosperity sustained");
		expect(formatEndReason("long_reign")).toBe("Long reign completed");
	});

	it("falls back for unknown reasons and empty input", () => {
		expect(formatEndReason(undefined)).toBe("Run ended");
		expect(formatEndReason("custom_reason")).toBe("custom_reason");
	});
});

describe("buildNationScoreTrendData", () => {
	it("builds chart labels and rounded totals from score history", () => {
		const data = buildNationScoreTrendData([
			{
				year: 1,
				total: 72.456,
				populationGrowth: 0,
				averageQualityOfLife: 0,
				netMigration: 0,
				resourceSufficiency: 0,
				environmentHealth: 0,
			},
			{
				year: 2,
				total: 80.04,
				populationGrowth: 0,
				averageQualityOfLife: 0,
				netMigration: 0,
				resourceSufficiency: 0,
				environmentHealth: 0,
			},
		]);

		expect(data.labels).toEqual(["Y1", "Y2"]);
		expect(data.datasets[0]?.data).toEqual([72.5, 80]);
	});
});
