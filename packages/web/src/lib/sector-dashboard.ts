import type { ChartData } from "chart.js";
import type { SectorStats } from "../repos/population";
import { paletteColor } from "./chart-theme";
import type { EconomicSystemId } from "./economic-systems";
import { getEconomicSystem } from "./economic-systems";
import type { Category } from "./taxonomy";

interface SectorEmploymentEntry {
	categoryId: string;
	subSectorId: string;
	label: string;
	population: number;
	averageHappiness: number;
}

/** Resolve raw per-sub-sector stats into display-ready entries, sorted by population descending. */
function buildSectorEmploymentEntries(
	stats: ReadonlyMap<string, SectorStats>,
	categories: readonly Category[],
): SectorEmploymentEntry[] {
	const entries = Array.from(stats.values(), (entry) => {
		const category = categories.find((item) => item.id === entry.categoryId);
		const subSector = category?.subSectors.find(
			(sector) => sector.id === entry.subSectorId,
		);

		return {
			categoryId: entry.categoryId,
			subSectorId: entry.subSectorId,
			label: subSector?.label ?? entry.subSectorId,
			population: entry.population,
			averageHappiness: entry.averageHappiness,
		};
	});

	return entries.sort((a, b) => b.population - a.population);
}

function buildEmploymentShareData(
	entries: readonly SectorEmploymentEntry[],
): ChartData<"bar"> {
	return {
		labels: entries.map((entry) => entry.label),
		datasets: [
			{
				label: "Employed citizens",
				data: entries.map((entry) => entry.population),
				backgroundColor: entries.map((_, index) => paletteColor(index)),
			},
		],
	};
}

function buildAvgHappinessBySectorData(
	entries: readonly SectorEmploymentEntry[],
): ChartData<"bar"> {
	return {
		labels: entries.map((entry) => entry.label),
		datasets: [
			{
				label: "Average happiness",
				data: entries.map(
					(entry) => Math.round(entry.averageHappiness * 10) / 10,
				),
				backgroundColor: entries.map((_, index) => paletteColor(index)),
			},
		],
	};
}

/** Population grouped by the economic system assigned to each employed citizen's sub-sector. */
function buildEconomicSystemMixData(
	entries: readonly SectorEmploymentEntry[],
	getAssignment: (
		categoryId: string,
		subSectorId: string,
	) => EconomicSystemId | null,
): ChartData<"doughnut"> {
	const totals = new Map<string, number>();

	for (const entry of entries) {
		const systemId = getAssignment(entry.categoryId, entry.subSectorId);
		const label = systemId
			? (getEconomicSystem(systemId)?.label ?? systemId)
			: "Unassigned";
		totals.set(label, (totals.get(label) ?? 0) + entry.population);
	}

	const labels = Array.from(totals.keys());

	return {
		labels,
		datasets: [
			{
				label: "Citizens by economic system",
				data: labels.map((label) => totals.get(label) ?? 0),
				backgroundColor: labels.map((_, index) => paletteColor(index)),
			},
		],
	};
}

export type { SectorEmploymentEntry };
export {
	buildAvgHappinessBySectorData,
	buildEconomicSystemMixData,
	buildEmploymentShareData,
	buildSectorEmploymentEntries,
};
