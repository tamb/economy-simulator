import type { ChartData } from "chart.js";
import type { YearlyNationScore } from "economy-simulator-persistence";
import { themeColors } from "./theme-colors";

function buildNationScoreTrendData(
	scoreHistory: readonly YearlyNationScore[],
): ChartData<"line"> {
	return {
		labels: scoreHistory.map((entry) => `Y${entry.year}`),
		datasets: [
			{
				label: "Nation score",
				data: scoreHistory.map((entry) => Math.round(entry.total * 10) / 10),
				borderColor: themeColors.yellow,
				backgroundColor: themeColors.yellow,
			},
		],
	};
}

function formatEndReason(reason: string | undefined): string {
	if (!reason) return "Run ended";
	const labels: Record<string, string> = {
		extinction: "Nation extinct",
		population_collapse: "Population collapse",
		mass_exodus: "Mass exodus",
		qol_crisis: "Quality-of-life crisis",
		resource_famine: "Resource famine",
		environmental_ruin: "Environmental ruin",
		prosperity_sustained: "Prosperity sustained",
		growth_milestone: "Growth milestone reached",
		high_score_sustained: "High score sustained",
		long_reign: "Long reign completed",
		abandoned: "Nation abandoned",
	};
	return labels[reason] ?? reason;
}

export { buildNationScoreTrendData, formatEndReason };
