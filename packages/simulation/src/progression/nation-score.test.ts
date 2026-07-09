import { gameSettings } from "economy-simulator-data";
import { describe, expect, it } from "vitest";
import { computeNationScore } from "./nation-score";
import { evaluateWinLose } from "./win-lose";

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
});
