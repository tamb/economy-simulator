import { describe, expect, it } from "vitest";
import { buildNationScoreTrendData, formatEndReason } from "./score-dashboard";

describe("formatEndReason", () => {
	it("maps known win and lose reasons to player-facing labels", () => {
		expect(formatEndReason("extinction")).toBe("Nation extinct");
		expect(formatEndReason("population_collapse")).toBe("Population collapse");
		expect(formatEndReason("mass_exodus")).toBe("Mass exodus");
		expect(formatEndReason("qol_crisis")).toBe("Quality-of-life crisis");
		expect(formatEndReason("resource_famine")).toBe("Resource famine");
		expect(formatEndReason("environmental_ruin")).toBe("Environmental ruin");
		expect(formatEndReason("prosperity_sustained")).toBe(
			"Prosperity sustained",
		);
		expect(formatEndReason("growth_milestone")).toBe(
			"Growth milestone reached",
		);
		expect(formatEndReason("high_score_sustained")).toBe(
			"High score sustained",
		);
		expect(formatEndReason("long_reign")).toBe("Long reign completed");
		expect(formatEndReason("abandoned")).toBe("Nation abandoned");
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
