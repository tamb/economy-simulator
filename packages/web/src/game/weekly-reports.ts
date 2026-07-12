import {
	getWeeklyDecisionTree,
	type RegionDistressKind,
} from "economy-simulator-data";
import type { ActiveCalamity } from "economy-simulator-persistence";
import type { RegionStats } from "../storage/population";
import type { Region } from "../storage/regions";
import type {
	WeeklyReportRegionSummary,
	WeeklyReportSummary,
} from "./advance-day-result";

interface BuildWeeklyReportInput {
	gameDay: number;
	stats: Map<string, RegionStats>;
	regions: Region[];
	activeCalamities: ActiveCalamity[];
}

function classifyDistress(input: {
	averageHappiness: number;
	averageHealth: number;
	environmentQuality: number;
	underCalamity: boolean;
}): { distress: RegionDistressKind; score: number } {
	if (input.underCalamity) {
		return {
			distress: "calamity_hit",
			score:
				100 -
				(input.averageHappiness + input.averageHealth) / 2 +
				(100 - input.environmentQuality) * 0.25 +
				40,
		};
	}

	const happinessGap = 100 - input.averageHappiness;
	const healthGap = 100 - input.averageHealth;
	const envGap = 100 - input.environmentQuality;

	if (happinessGap >= healthGap && happinessGap >= envGap) {
		return { distress: "low_happiness", score: happinessGap };
	}
	if (healthGap >= envGap) {
		return { distress: "low_health", score: healthGap };
	}
	return { distress: "low_environment", score: envGap };
}

function buildWeeklyReport(
	input: BuildWeeklyReportInput,
): WeeklyReportSummary | null {
	const calamityRegions = new Set(
		input.activeCalamities.flatMap((calamity) => calamity.regionIds),
	);

	const scored: WeeklyReportRegionSummary[] = [];

	for (const region of input.regions) {
		if (region.terrain === "ocean") continue;
		const stats = input.stats.get(region.id);
		if (!stats || stats.population <= 0) continue;

		const classified = classifyDistress({
			averageHappiness: stats.averageHappiness,
			averageHealth: stats.averageHealth,
			environmentQuality: region.resourceState.environmentQuality,
			underCalamity: calamityRegions.has(region.id),
		});

		scored.push({
			regionId: region.id,
			name: region.name,
			population: stats.population,
			averageHappiness: stats.averageHappiness,
			averageHealth: stats.averageHealth,
			environmentQuality: region.resourceState.environmentQuality,
			distress: classified.distress,
			distressScore: classified.score,
		});
	}

	if (scored.length === 0) return null;

	scored.sort((a, b) => b.distressScore - a.distressScore);
	const top = scored.slice(0, 3);
	const primary = top[0];
	if (!primary) return null;

	const tree = getWeeklyDecisionTree(primary.distress);
	if (!tree) return null;

	return {
		gameDay: input.gameDay,
		regions: top,
		primaryRegionId: primary.regionId,
		distress: primary.distress,
		prompt: tree.prompt,
	};
}

export { buildWeeklyReport, classifyDistress };
