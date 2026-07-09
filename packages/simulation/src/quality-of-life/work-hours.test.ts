import { gameSettings } from "economy-simulator-data";
import { describe, expect, it } from "vitest";
import { getWorkHoursHappinessDelta } from "./work-hours";

describe("getWorkHoursHappinessDelta", () => {
	it("applies the idle penalty for zero hours", () => {
		expect(getWorkHoursHappinessDelta(0)).toBe(
			-gameSettings.work.idlePenaltyPerDay,
		);
	});

	it("applies the idle penalty for undefined hours (working-age unemployed)", () => {
		expect(getWorkHoursHappinessDelta(undefined)).toBe(
			-gameSettings.work.idlePenaltyPerDay,
		);
	});

	it("does not apply the idle penalty for non-working-age citizens", () => {
		expect(
			getWorkHoursHappinessDelta(undefined, gameSettings, {
				isWorkingAge: false,
			}),
		).toBe(0);
		expect(
			getWorkHoursHappinessDelta(0, gameSettings, { isWorkingAge: false }),
		).toBe(0);
	});

	it("applies no penalty across the neutral dosage zone", () => {
		expect(getWorkHoursHappinessDelta(1)).toBe(0);
		expect(getWorkHoursHappinessDelta(8)).toBe(0);
		expect(getWorkHoursHappinessDelta(40)).toBe(0);
		expect(
			getWorkHoursHappinessDelta(gameSettings.work.neutralZoneMaxHours),
		).toBe(0);
	});

	it("escalates a penalty proportionally once hours exceed the neutral zone", () => {
		const hours = gameSettings.work.neutralZoneMaxHours + 8;
		const expected = -(8 * gameSettings.work.overworkPenaltyPerExcessHour);
		expect(getWorkHoursHappinessDelta(hours)).toBeCloseTo(expected, 6);
	});

	it("caps the overwork penalty at the configured maximum", () => {
		const hours = gameSettings.work.neutralZoneMaxHours + 1000;
		expect(getWorkHoursHappinessDelta(hours)).toBe(
			-gameSettings.work.maxOverworkPenaltyPerDay,
		);
	});

	it("respects custom settings", () => {
		const customSettings = {
			...gameSettings,
			work: {
				...gameSettings.work,
				idlePenaltyPerDay: 10,
				neutralZoneMaxHours: 20,
			},
		};

		expect(getWorkHoursHappinessDelta(0, customSettings)).toBe(-10);
		expect(getWorkHoursHappinessDelta(20, customSettings)).toBe(0);
	});
});
