import type { ChartData } from "chart.js";
import type { AnnualCycleStats, RegionStats } from "../storage/population";
import type { Region } from "../storage/regions";
import { themeColors } from "./theme-colors";

/** National average quality-of-life (mean of happiness and health) per recorded game year. */
function buildQualityOfLifeTrendData(
	yearlyStats: readonly AnnualCycleStats[],
): ChartData<"line"> {
	return {
		labels: yearlyStats.map((stat) => `Y${stat.year}`),
		datasets: [
			{
				label: "National quality of life",
				data: yearlyStats.map(
					(stat) => Math.round(stat.averageQualityOfLife * 10) / 10,
				),
				borderColor: themeColors.cyanDark,
				backgroundColor: themeColors.cyanDark,
			},
		],
	};
}

interface RegionLeaderboardRow {
	regionId: string;
	name: string;
	population: number;
	averageHappiness: number;
	averageHealth: number;
}

type LeaderboardSortKey = "population" | "averageHappiness" | "averageHealth";

/** Regions with at least one citizen, sorted by `sortBy` descending (best first). */
function buildRegionLeaderboard(
	stats: ReadonlyMap<string, RegionStats>,
	regions: readonly Region[],
	sortBy: LeaderboardSortKey = "population",
): RegionLeaderboardRow[] {
	const rows: RegionLeaderboardRow[] = [];

	for (const region of regions) {
		const regionStats = stats.get(region.id);
		if (!regionStats || regionStats.population === 0) continue;

		rows.push({
			regionId: region.id,
			name: region.name,
			population: regionStats.population,
			averageHappiness: regionStats.averageHappiness,
			averageHealth: regionStats.averageHealth,
		});
	}

	return rows.sort((a, b) => b[sortBy] - a[sortBy]);
}

export type { LeaderboardSortKey, RegionLeaderboardRow };
export { buildQualityOfLifeTrendData, buildRegionLeaderboard };
