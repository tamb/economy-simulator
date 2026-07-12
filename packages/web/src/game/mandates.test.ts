import { getMandateDefinition } from "economy-simulator-data";
import {
	createInitialGameRunState,
	type MandateId,
} from "economy-simulator-persistence";
import { describe, expect, it } from "vitest";
import { issueMandateForYear, resolveMandateAfterYear } from "./mandates";

function withMandate(year: number, id: MandateId) {
	const definition = getMandateDefinition(id);
	if (!definition) throw new Error(`Missing mandate ${id}`);
	const run = createInitialGameRunState(1000);
	return {
		...run,
		activeMandate: {
			id,
			label: definition.label,
			description: definition.description,
			yearIssued: year,
			scoreBonus: definition.scoreBonus,
		},
	};
}

const baseStats = {
	year: 1,
	populationBefore: 1000,
	populationAfter: 1000,
	births: 10,
	deaths: 5,
	emigrations: 2,
	immigrations: 3,
	averageQualityOfLife: 50,
};

const baseScore = {
	year: 1,
	total: 60,
	populationGrowth: 0,
	averageQualityOfLife: 50,
	netMigration: 1,
	resourceSufficiency: 75,
	environmentHealth: 50,
};

describe("mandates", () => {
	it("issues a mandate for the requested year", () => {
		const run = createInitialGameRunState(1000);
		const next = issueMandateForYear(run, 2);

		expect(next.activeMandate?.yearIssued).toBe(2);
		expect(next.activeMandate?.label).toBeTruthy();
		expect(next.eventLog.at(-1)?.type).toBe("mandate_issued");
	});

	it("resolves a fulfilled resource mandate and grants score bonus", () => {
		let run = withMandate(1, "resource_security");
		const resolution = resolveMandateAfterYear(
			run,
			{
				stats: baseStats,
				score: { ...baseScore, resourceSufficiency: 75 },
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
		let run = withMandate(1, "resource_security");
		const resolution = resolveMandateAfterYear(
			run,
			{
				stats: {
					...baseStats,
					populationAfter: 900,
					emigrations: 50,
					immigrations: 10,
					averageQualityOfLife: 40,
				},
				score: {
					...baseScore,
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

	it("fulfills grow_population when the realm expands", () => {
		const run = withMandate(1, "grow_population");
		const resolution = resolveMandateAfterYear(
			run,
			{
				stats: { ...baseStats, populationAfter: 1050 },
				score: baseScore,
			},
			364,
		);

		expect(resolution.mandateCompleted).toBe(true);
		expect(resolution.scoreBonus).toBe(3);
	});

	it("fulfills tighten_ledger only at 80% sufficiency", () => {
		const run = withMandate(1, "tighten_ledger");
		const miss = resolveMandateAfterYear(
			run,
			{
				stats: baseStats,
				score: { ...baseScore, resourceSufficiency: 75 },
			},
			364,
		);
		expect(miss.mandateCompleted).toBe(false);

		const hit = resolveMandateAfterYear(
			withMandate(1, "tighten_ledger"),
			{
				stats: baseStats,
				score: { ...baseScore, resourceSufficiency: 80 },
			},
			364,
		);
		expect(hit.mandateCompleted).toBe(true);
		expect(hit.scoreBonus).toBe(4);
	});
});
