import type { ChartData } from "chart.js";
import type {
	AgeSexBucket,
	AnnualCycleStats,
	HistogramBucket,
} from "../repos/population";
import { themeColors } from "./theme-colors";

/** Age-sex pyramid: female bars extend right (positive), male bars extend left (negative). */
function buildAgeSexPyramidData(
	buckets: readonly AgeSexBucket[],
): ChartData<"bar"> {
	return {
		labels: buckets.map((bucket) => bucket.label),
		datasets: [
			{
				label: "Male",
				data: buckets.map((bucket) => -bucket.male),
				backgroundColor: themeColors.cyanDark,
			},
			{
				label: "Female",
				data: buckets.map((bucket) => bucket.female),
				backgroundColor: themeColors.orange,
			},
		],
	};
}

function buildHistogramData(
	buckets: readonly HistogramBucket[],
	label: string,
	color: string,
): ChartData<"bar"> {
	return {
		labels: buckets.map((bucket) => bucket.label),
		datasets: [
			{
				label,
				data: buckets.map((bucket) => bucket.count),
				backgroundColor: color,
			},
		],
	};
}

/** Births/deaths/emigrations/immigrations per recorded game year, oldest first. */
function buildPopulationTrendData(
	yearlyStats: readonly AnnualCycleStats[],
): ChartData<"line"> {
	return {
		labels: yearlyStats.map((stat) => `Y${stat.year}`),
		datasets: [
			{
				label: "Births",
				data: yearlyStats.map((stat) => stat.births),
				borderColor: themeColors.green,
				backgroundColor: themeColors.green,
			},
			{
				label: "Deaths",
				data: yearlyStats.map((stat) => stat.deaths),
				borderColor: themeColors.red,
				backgroundColor: themeColors.red,
			},
			{
				label: "Emigrations",
				data: yearlyStats.map((stat) => stat.emigrations),
				borderColor: themeColors.orange,
				backgroundColor: themeColors.orange,
			},
			{
				label: "Immigrations",
				data: yearlyStats.map((stat) => stat.immigrations),
				borderColor: themeColors.cyanDark,
				backgroundColor: themeColors.cyanDark,
			},
		],
	};
}

export { buildAgeSexPyramidData, buildHistogramData, buildPopulationTrendData };
