import { gameSettings } from "economy-simulator-data";
import { describe, expect, it } from "vitest";
import { computeNationScore, type NationScoreBreakdown } from "./nation-score";
import {
	evaluateWinLose,
	type WinLoseStreaks,
	type WinLoseYearContext,
} from "./win-lose";

function baseScore(
	overrides: Partial<NationScoreBreakdown> = {},
): NationScoreBreakdown {
	return {
		year: 1,
		total: 50,
		populationGrowth: 50,
		averageQualityOfLife: 50,
		netMigration: 0,
		resourceSufficiency: 80,
		environmentHealth: 80,
		...overrides,
	};
}

function emptyStreaks(): WinLoseStreaks {
	return {
		populationCollapse: 0,
		massExodus: 0,
		qolCrisis: 0,
		resourceFamine: 0,
		environmentalRuin: 0,
		prosperity: 0,
		growthMilestone: 0,
		highScore: 0,
		netImmigrationPositive: 0,
	};
}

function winLoseContext(
	overrides: Partial<WinLoseYearContext> = {},
): WinLoseYearContext {
	return {
		year: 1,
		populationAfter: 1000,
		startingPopulation: 1000,
		averageQualityOfLife: 50,
		emigrations: 0,
		immigrations: 0,
		score: baseScore(),
		streaks: emptyStreaks(),
		settings: gameSettings,
		...overrides,
	};
}

describe("computeNationScore", () => {
	it("returns a bounded composite score", () => {
		const score = computeNationScore({
			year: 1,
			populationBefore: 1000,
			populationAfter: 1100,
			births: 100,
			deaths: 20,
			emigrations: 10,
			immigrations: 30,
			averageQualityOfLife: 70,
			ledger: {
				resources: [
					{
						resourceId: "crops",
						production: 100,
						demand: 80,
						sufficiency: 1.25,
					},
				],
				shortfallHappinessPenaltyBySubSector: {},
			},
			averageEnvironmentQuality: 85,
			settings: gameSettings,
		});

		expect(score.total).toBeGreaterThan(0);
		expect(score.total).toBeLessThanOrEqual(100);
	});
});

describe("evaluateWinLose", () => {
	it("ends the run on extinction", () => {
		const result = evaluateWinLose({
			year: 5,
			populationAfter: 0,
			startingPopulation: 1000,
			averageQualityOfLife: 50,
			emigrations: 0,
			immigrations: 0,
			score: {
				year: 5,
				total: 40,
				populationGrowth: -100,
				averageQualityOfLife: 50,
				netMigration: 0,
				resourceSufficiency: 50,
				environmentHealth: 50,
			},
			streaks: {
				populationCollapse: 0,
				massExodus: 0,
				qolCrisis: 0,
				resourceFamine: 0,
				environmentalRuin: 0,
				prosperity: 0,
				growthMilestone: 0,
				highScore: 0,
				netImmigrationPositive: 0,
			},
			settings: gameSettings,
		});

		expect(result.status).toBe("lost");
		expect(result.reason).toBe("extinction");
	});

	it("loses after sustained population collapse streak", () => {
		const thresholds = gameSettings.progression.lose;
		let streaks = emptyStreaks();
		const collapsedPopulation = Math.floor(
			1000 * (thresholds.populationCollapseRatio - 0.01),
		);

		for (let year = 1; year < thresholds.populationCollapseYears; year++) {
			const step = evaluateWinLose(
				winLoseContext({
					year,
					populationAfter: collapsedPopulation,
					streaks,
				}),
			);
			expect(step.status).toBe("active");
			streaks = step.streaks;
		}

		const final = evaluateWinLose(
			winLoseContext({
				year: thresholds.populationCollapseYears,
				populationAfter: collapsedPopulation,
				streaks,
			}),
		);
		expect(final.status).toBe("lost");
		expect(final.reason).toBe("population_collapse");
	});

	it("resets population collapse streak when population recovers", () => {
		const thresholds = gameSettings.progression.lose;
		const collapsedPopulation = Math.floor(
			1000 * (thresholds.populationCollapseRatio - 0.01),
		);
		const afterCollapse = evaluateWinLose(
			winLoseContext({ populationAfter: collapsedPopulation }),
		);
		expect(afterCollapse.streaks.populationCollapse).toBe(1);

		const recovered = evaluateWinLose(
			winLoseContext({
				populationAfter: 900,
				streaks: afterCollapse.streaks,
			}),
		);
		expect(recovered.streaks.populationCollapse).toBe(0);
		expect(recovered.status).toBe("active");
	});

	it("wins on sustained prosperity", () => {
		const thresholds = gameSettings.progression.win;
		let streaks = emptyStreaks();

		for (let year = 1; year < thresholds.prosperityYears; year++) {
			const step = evaluateWinLose(
				winLoseContext({
					year,
					populationAfter: 1200,
					averageQualityOfLife: thresholds.prosperityQol,
					streaks,
				}),
			);
			expect(step.status).toBe("active");
			streaks = step.streaks;
		}

		const final = evaluateWinLose(
			winLoseContext({
				year: thresholds.prosperityYears,
				populationAfter: 1200,
				averageQualityOfLife: thresholds.prosperityQol,
				streaks,
			}),
		);
		expect(final.status).toBe("won");
		expect(final.reason).toBe("prosperity_sustained");
	});

	it("wins on long reign without other victory conditions", () => {
		const result = evaluateWinLose(
			winLoseContext({
				year: gameSettings.progression.win.longReignYears,
				averageQualityOfLife: 40,
				populationAfter: 500,
			}),
		);
		expect(result.status).toBe("won");
		expect(result.reason).toBe("long_reign");
	});
});
