import { gameSettings } from "economy-simulator-data";

const DAYS_PER_WEEK = 7;
const DAYS_PER_MONTH = 28;

/** In-game year index for a game day (year 0 before the first annual cycle). */
function getGameYear(gameDay: number): number {
	return Math.floor(gameDay / gameSettings.calendar.daysPerYear);
}

/** Days remaining until the next year-boundary advance (inclusive of that day). */
function daysUntilYearEnd(gameDay: number): number {
	const daysPerYear = gameSettings.calendar.daysPerYear;
	const intoYear = gameDay % daysPerYear;
	return daysPerYear - intoYear;
}

/** 0-based day within the current 28-day month. */
function getMonthDay(gameDay: number): number {
	return gameDay % DAYS_PER_MONTH;
}

/** True when `nextGameDay` completes a 7-day week (end-of-week boundary). */
function isWeekBoundary(nextGameDay: number): boolean {
	return nextGameDay > 0 && nextGameDay % DAYS_PER_WEEK === 0;
}

/**
 * True when `nextGameDay` is day 14 or 28 of a 28-day month
 * (month-day indices 13 and 27 after the day increments).
 */
function isAideProposalDay(nextGameDay: number): boolean {
	if (nextGameDay <= 0) return false;
	const monthDay = getMonthDay(nextGameDay);
	return monthDay === 13 || monthDay === 27;
}

export {
	DAYS_PER_MONTH,
	DAYS_PER_WEEK,
	daysUntilYearEnd,
	getGameYear,
	getMonthDay,
	isAideProposalDay,
	isWeekBoundary,
};
