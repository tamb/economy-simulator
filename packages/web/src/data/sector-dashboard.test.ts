import { describe, expect, it } from "vitest";
import type { SectorStats } from "../storage/population";
import {
	buildAvgHappinessBySectorData,
	buildEconomicSystemMixData,
	buildEmploymentShareData,
	buildSectorEmploymentEntries,
} from "./sector-dashboard";
import { categories } from "./taxonomy";

const stats: Map<string, SectorStats> = new Map([
	[
		"extractive/agriculture",
		{
			categoryId: "extractive",
			subSectorId: "agriculture",
			population: 10,
			averageHappiness: 40,
		},
	],
	[
		"services/healthcare",
		{
			categoryId: "services",
			subSectorId: "healthcare",
			population: 25,
			averageHappiness: 65,
		},
	],
]);

describe("buildSectorEmploymentEntries", () => {
	it("resolves sub-sector labels and sorts by population descending", () => {
		const entries = buildSectorEmploymentEntries(stats, categories);

		expect(entries).toHaveLength(2);
		expect(entries[0]?.subSectorId).toBe("healthcare");
		expect(entries[0]?.label).toBe("Healthcare");
		expect(entries[0]?.population).toBe(25);
		expect(entries[1]?.subSectorId).toBe("agriculture");
	});

	it("falls back to the raw id when a sub-sector can't be resolved", () => {
		const unknownStats: Map<string, SectorStats> = new Map([
			[
				"extractive/mystery",
				{
					categoryId: "extractive",
					subSectorId: "mystery",
					population: 1,
					averageHappiness: 50,
				},
			],
		]);

		const entries = buildSectorEmploymentEntries(unknownStats, categories);
		expect(entries[0]?.label).toBe("mystery");
	});
});

describe("buildEmploymentShareData", () => {
	it("maps entries to a single population-per-sector dataset", () => {
		const entries = buildSectorEmploymentEntries(stats, categories);
		const data = buildEmploymentShareData(entries);

		expect(data.labels).toEqual(["Healthcare", "Agriculture"]);
		expect(data.datasets[0]?.data).toEqual([25, 10]);
	});
});

describe("buildAvgHappinessBySectorData", () => {
	it("rounds average happiness to one decimal place", () => {
		const entries = buildSectorEmploymentEntries(stats, categories);
		const data = buildAvgHappinessBySectorData(entries);

		expect(data.datasets[0]?.data).toEqual([65, 40]);
	});
});

describe("buildEconomicSystemMixData", () => {
	it("groups population by the assigned economic system, defaulting to Unassigned", () => {
		const entries = buildSectorEmploymentEntries(stats, categories);
		const data = buildEconomicSystemMixData(entries, (categoryId) =>
			categoryId === "services" ? "socialism" : null,
		);

		expect(data.labels).toContain("Socialism");
		expect(data.labels).toContain("Unassigned");

		const socialismIndex = data.labels?.indexOf("Socialism") ?? -1;
		const unassignedIndex = data.labels?.indexOf("Unassigned") ?? -1;
		expect(data.datasets[0]?.data[socialismIndex]).toBe(25);
		expect(data.datasets[0]?.data[unassignedIndex]).toBe(10);
	});
});
