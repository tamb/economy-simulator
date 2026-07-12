import { describe, expect, it } from "vitest";
import {
	daysUntilYearEnd,
	getGameYear,
	getMonthDay,
	isAideProposalDay,
	isWeekBoundary,
} from "./calendar";

describe("calendar helpers", () => {
	it("maps game days to years", () => {
		expect(getGameYear(0)).toBe(0);
		expect(getGameYear(363)).toBe(0);
		expect(getGameYear(364)).toBe(1);
	});

	it("counts days until the next year boundary", () => {
		expect(daysUntilYearEnd(0)).toBe(364);
		expect(daysUntilYearEnd(100)).toBe(264);
		expect(daysUntilYearEnd(364)).toBe(364);
	});

	it("maps month days within a 28-day month", () => {
		expect(getMonthDay(0)).toBe(0);
		expect(getMonthDay(13)).toBe(13);
		expect(getMonthDay(27)).toBe(27);
		expect(getMonthDay(28)).toBe(0);
	});

	it("detects week boundaries after the day advances", () => {
		expect(isWeekBoundary(0)).toBe(false);
		expect(isWeekBoundary(7)).toBe(true);
		expect(isWeekBoundary(14)).toBe(true);
		expect(isWeekBoundary(8)).toBe(false);
	});

	it("detects twice-monthly aide proposal days", () => {
		expect(isAideProposalDay(13)).toBe(true);
		expect(isAideProposalDay(27)).toBe(true);
		expect(isAideProposalDay(41)).toBe(true);
		expect(isAideProposalDay(7)).toBe(false);
		expect(isAideProposalDay(0)).toBe(false);
	});
});
