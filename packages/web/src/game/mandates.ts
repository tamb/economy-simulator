import {
	getMandateDefinition,
	type MandateId,
	pickMandateForYear,
} from "economy-simulator-data";
import type {
	ActiveMandate,
	AnnualCycleStats,
	GameRunState,
} from "economy-simulator-persistence";
import { appendGameEvents } from "economy-simulator-persistence";
import type { NationScoreBreakdown } from "economy-simulator-simulation";

interface MandateEvaluationInput {
	stats: AnnualCycleStats;
	score: NationScoreBreakdown;
}

function issueMandateForYear(
	gameRun: GameRunState,
	year: number,
): GameRunState {
	const mandateId = pickMandateForYear(year) as MandateId;
	const definition = getMandateDefinition(mandateId);
	if (!definition) return gameRun;

	const activeMandate: ActiveMandate = {
		id: mandateId,
		label: definition.label,
		description: definition.description,
		yearIssued: year,
		scoreBonus: definition.scoreBonus,
	};

	return appendGameEvents({ ...gameRun, activeMandate }, [
		{
			id: `mandate-${year}-${mandateId}`,
			gameDay: year * 364,
			type: "mandate_issued",
			title: `Royal mandate: ${definition.label}`,
			detail: definition.description,
		},
	]);
}

function evaluateMandate(
	mandate: ActiveMandate,
	input: MandateEvaluationInput,
): boolean {
	switch (mandate.id) {
		case "resource_security":
			return input.score.resourceSufficiency >= 70;
		case "stem_emigration":
			return input.stats.immigrations >= input.stats.emigrations;
		case "raise_qol":
			return input.stats.averageQualityOfLife >= 55;
		case "heal_land":
			return input.score.environmentHealth >= 60;
		default:
			return false;
	}
}

function resolveMandateAfterYear(
	gameRun: GameRunState,
	input: MandateEvaluationInput,
	gameDay: number,
): {
	gameRun: GameRunState;
	mandateCompleted: boolean;
	scoreBonus: number;
} {
	const mandate = gameRun.activeMandate;
	if (!mandate || mandate.yearIssued !== input.stats.year) {
		return { gameRun, mandateCompleted: false, scoreBonus: 0 };
	}

	const fulfilled = evaluateMandate(mandate, input);
	const eventType = fulfilled ? "mandate_completed" : "mandate_failed";
	const next = appendGameEvents(
		{
			...gameRun,
			activeMandate: null,
			mandateCompletions: fulfilled
				? gameRun.mandateCompletions + 1
				: gameRun.mandateCompletions,
		},
		[
			{
				id: `mandate-${input.stats.year}-${eventType}`,
				gameDay,
				type: eventType,
				title: fulfilled
					? `Mandate fulfilled: ${mandate.label}`
					: `Mandate missed: ${mandate.label}`,
				detail: fulfilled
					? `+${mandate.scoreBonus} nation score next tally.`
					: mandate.description,
			},
		],
	);

	return {
		gameRun: next,
		mandateCompleted: fulfilled,
		scoreBonus: fulfilled ? mandate.scoreBonus : 0,
	};
}

export type { MandateEvaluationInput };
export { issueMandateForYear, resolveMandateAfterYear };
