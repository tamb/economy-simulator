import { createInitialGameRunState } from "economy-simulator-persistence";
import { describe, expect, it } from "vitest";
import { issueMandateForYear, resolveMandateAfterYear } from "./mandates";

describe("mandates", () => {
	it("issues a mandate for the requested year", () => {
		const run = createInitialGameRunState(1000);
		const next = issueMandateForYear(run, 2);

		expect(next.activeMandate?.yearIssued).toBe(2);
		expect(next.activeMandate?.label).toBeTruthy();
		expect(next.eventLog.at(-1)?.type).toBe("mandate_issued");
	});

	it("resolves a fulfilled resource mandate and grants score bonus", () => {
		let run = issueMandateForYear(createInitialGameRunState(1000), 1);
		const resolution = resolveMandateAfterYear(
			run,
			{
				stats: {
					year: 1,
					populationBefore: 1000,
					populationAfter: 1000,
					births: 10,
					deaths: 5,
					emigrations: 2,
					immigrations: 3,
					averageQualityOfLife: 50,
				},
				score: {
					year: 1,
					total: 60,
					populationGrowth: 0,
					averageQualityOfLife: 50,
					netMigration: 1,
					resourceSufficiency: 75,
					environmentHealth: 50,
				},
			},
			364,
		);

		run = resolution.gameRun;
		expect(resolution.mandateCompleted).toBe(true);
		expect(resolution.scoreBonus).toBe(3);
		expect(run.activeMandate).toBeNull();
		expect(run.mandateCompletions).toBe(1);
		expect(run.eventLog.at(-1)?.type).toBe("mandate_completed");
	});

	it("records a failed mandate without bonus", () => {
		let run = issueMandateForYear(createInitialGameRunState(1000), 1);
		const resolution = resolveMandateAfterYear(
			run,
			{
				stats: {
					year: 1,
					populationBefore: 1000,
					populationAfter: 900,
					births: 5,
					deaths: 20,
					emigrations: 50,
					immigrations: 10,
					averageQualityOfLife: 40,
				},
				score: {
					year: 1,
					total: 40,
					populationGrowth: -0.1,
					averageQualityOfLife: 40,
					netMigration: -40,
					resourceSufficiency: 40,
					environmentHealth: 40,
				},
			},
			364,
		);

		run = resolution.gameRun;
		expect(resolution.mandateCompleted).toBe(false);
		expect(resolution.scoreBonus).toBe(0);
		expect(run.mandateCompletions).toBe(0);
		expect(run.eventLog.at(-1)?.type).toBe("mandate_failed");
	});
});
