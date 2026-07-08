import { describe, expect, it } from "vitest";
import type {
	AgeSexBucket,
	AnnualCycleStats,
	HistogramBucket,
} from "../storage/population";
import {
	buildAgeSexPyramidData,
	buildHistogramData,
	buildPopulationTrendData,
} from "./population-dashboard";

const pyramidBuckets: AgeSexBucket[] = [
	{ label: "0-9", male: 10, female: 8 },
	{ label: "10-19", male: 5, female: 6 },
];

describe("buildAgeSexPyramidData", () => {
	it("mirrors male counts as negative values so bars diverge left/right", () => {
		const data = buildAgeSexPyramidData(pyramidBuckets);

		expect(data.labels).toEqual(["0-9", "10-19"]);
		expect(data.datasets[0]?.label).toBe("Male");
		expect(data.datasets[0]?.data).toEqual([-10, -5]);
		expect(data.datasets[1]?.label).toBe("Female");
		expect(data.datasets[1]?.data).toEqual([8, 6]);
	});
});

describe("buildHistogramData", () => {
	it("maps histogram buckets to a single labeled dataset", () => {
		const buckets: HistogramBucket[] = [
			{ label: "0-9", count: 3 },
			{ label: "10-19", count: 7 },
		];

		const data = buildHistogramData(buckets, "Happiness", "#30e0c0");

		expect(data.labels).toEqual(["0-9", "10-19"]);
		expect(data.datasets).toHaveLength(1);
		expect(data.datasets[0]?.label).toBe("Happiness");
		expect(data.datasets[0]?.data).toEqual([3, 7]);
		expect(data.datasets[0]?.backgroundColor).toBe("#30e0c0");
	});
});

describe("buildPopulationTrendData", () => {
	it("builds one dataset per demographic event, labeled by year", () => {
		const yearlyStats: AnnualCycleStats[] = [
			{
				year: 1,
				populationBefore: 100,
				populationAfter: 102,
				births: 5,
				deaths: 3,
				emigrations: 1,
				immigrations: 1,
				averageQualityOfLife: 55,
			},
		];

		const data = buildPopulationTrendData(yearlyStats);

		expect(data.labels).toEqual(["Y1"]);
		expect(data.datasets).toHaveLength(4);
		expect(data.datasets.map((dataset) => dataset.label)).toEqual([
			"Births",
			"Deaths",
			"Emigrations",
			"Immigrations",
		]);
		expect(data.datasets[0]?.data).toEqual([5]);
	});

	it("returns empty datasets when there is no yearly history yet", () => {
		const data = buildPopulationTrendData([]);
		expect(data.labels).toEqual([]);
		expect(data.datasets[0]?.data).toEqual([]);
	});
});
