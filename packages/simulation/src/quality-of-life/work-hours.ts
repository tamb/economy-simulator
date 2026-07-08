import { type GameSettings, gameSettings } from "economy-simulator-data";

/**
 * Daily happiness delta from weekly work hours, following a "dosage" curve
 * rather than a straight line (see research/quality-of-life-rules.md,
 * citing Chandola et al. 2019): going from no paid work to any paid work
 * carries the single biggest benefit; a wide neutral zone from minimal
 * hours up to a standard full-time week carries no further penalty or
 * bonus; hours beyond that neutral zone escalate an overwork penalty.
 */
function getWorkHoursHappinessDelta(
	weeklyHours: number | undefined,
	settings: GameSettings = gameSettings,
): number {
	const { work } = settings;

	if (weeklyHours === undefined || weeklyHours <= 0) {
		return -work.idlePenaltyPerDay;
	}

	if (weeklyHours <= work.neutralZoneMaxHours) {
		return 0;
	}

	const excessHours = weeklyHours - work.neutralZoneMaxHours;
	const penalty = excessHours * work.overworkPenaltyPerExcessHour;
	return -Math.min(penalty, work.maxOverworkPenaltyPerDay);
}

export { getWorkHoursHappinessDelta };
