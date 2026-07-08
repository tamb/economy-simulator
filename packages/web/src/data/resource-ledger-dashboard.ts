import type { ChartData } from "chart.js";
import { getResource } from "economy-simulator-data";
import type { NationalLedger } from "economy-simulator-simulation";
import { themeColors } from "./theme-colors";

/** Grouped bar chart: national production vs. industrial demand per resource. */
function buildResourceProductionDemandData(
	ledger: NationalLedger,
): ChartData<"bar"> {
	const entries = [...ledger.resources].sort((a, b) =>
		(getResource(a.resourceId)?.label ?? a.resourceId).localeCompare(
			getResource(b.resourceId)?.label ?? b.resourceId,
		),
	);

	return {
		labels: entries.map(
			(entry) => getResource(entry.resourceId)?.label ?? entry.resourceId,
		),
		datasets: [
			{
				label: "Production",
				data: entries.map((entry) => Math.round(entry.production * 10) / 10),
				backgroundColor: themeColors.cyanDark,
			},
			{
				label: "Demand",
				data: entries.map((entry) => Math.round(entry.demand * 10) / 10),
				backgroundColor: themeColors.orange,
			},
		],
	};
}

/** Horizontal sufficiency ratios (capped at 200% for readability). */
function buildResourceSufficiencyData(
	ledger: NationalLedger,
): ChartData<"bar"> {
	const entries = [...ledger.resources]
		.filter((entry) => entry.demand > 0)
		.sort((a, b) => a.sufficiency - b.sufficiency);

	return {
		labels: entries.map(
			(entry) => getResource(entry.resourceId)?.label ?? entry.resourceId,
		),
		datasets: [
			{
				label: "Sufficiency (%)",
				data: entries.map((entry) =>
					Math.min(200, Math.round(entry.sufficiency * 100)),
				),
				backgroundColor: entries.map((entry) =>
					entry.sufficiency >= 1 ? themeColors.green : themeColors.red,
				),
			},
		],
	};
}

export { buildResourceProductionDemandData, buildResourceSufficiencyData };
