import {
	gameSettings,
	getCategory,
	getSubSector,
} from "economy-simulator-data";
import { describe, expect, it } from "vitest";
import {
	assignJobSector,
	isWorkingAge,
	syncEmploymentWithAge,
} from "./job-assignment";

describe("assignJobSector", () => {
	it("always returns a valid category/sub-sector pair", () => {
		for (const roll of [0, 0.1, 0.27, 0.5, 0.75, 0.99, 0.999999]) {
			const assignment = assignJobSector(() => roll);
			expect(getCategory(assignment.categoryId)).toBeDefined();
			expect(
				getSubSector(assignment.categoryId, assignment.subSectorId),
			).toBeDefined();
		}
	});

	it("assigns the first category when the random roll is 0", () => {
		const assignment = assignJobSector(() => 0);
		expect(assignment.categoryId).toBe("extractive");
	});

	it("assigns the last category when the random roll is just under 1", () => {
		const assignment = assignJobSector(() => 0.999999);
		expect(assignment.categoryId).toBe("command");
	});

	it("distributes across categories roughly matching employment share over many samples", () => {
		const counts: Record<string, number> = {};
		const samples = 6000;

		for (let index = 0; index < samples; index++) {
			const assignment = assignJobSector(Math.random);
			counts[assignment.categoryId] = (counts[assignment.categoryId] ?? 0) + 1;
		}

		const extractiveShare = (counts.extractive ?? 0) / samples;
		expect(extractiveShare).toBeGreaterThan(0.2);
		expect(extractiveShare).toBeLessThan(0.34);

		const commandShare = (counts.command ?? 0) / samples;
		expect(commandShare).toBeLessThan(0.05);
	});

	it("only assigns an extractive sub-sector on the viable list when provided", () => {
		for (let index = 0; index < 500; index++) {
			const assignment = assignJobSector(Math.random, ["agriculture"]);
			if (assignment.categoryId === "extractive") {
				expect(assignment.subSectorId).toBe("agriculture");
			}
		}
	});

	it("never assigns the extractive category at all when no extractive sub-sector is viable", () => {
		for (let index = 0; index < 500; index++) {
			const assignment = assignJobSector(Math.random, []);
			expect(assignment.categoryId).not.toBe("extractive");
		}
	});

	it("leaves non-extractive categories unaffected by the viable-sub-sector filter", () => {
		const withFilter = assignJobSector(() => 0.999999, ["agriculture"]);
		const withoutFilter = assignJobSector(() => 0.999999);
		expect(withFilter).toEqual(withoutFilter);
		expect(withFilter.categoryId).toBe("command");
	});

	it("behaves exactly as before when no viable-sub-sector filter is passed", () => {
		const withFilter = assignJobSector(() => 0);
		const withoutFilter = assignJobSector(() => 0, undefined);
		expect(withFilter).toEqual(withoutFilter);
	});

	it("shifts non-extractive odds when category multipliers are supplied", () => {
		const industrialHeavy = assignJobSector(() => 0.35, undefined, {
			industrial: 5,
			services: 0.1,
			knowledge: 0.1,
			command: 0.1,
		});
		expect(industrialHeavy.categoryId).toBe("industrial");
	});
});

describe("isWorkingAge", () => {
	it("excludes ages below the configured minimum", () => {
		expect(isWorkingAge(gameSettings.demographics.workingAgeMin - 1)).toBe(
			false,
		);
	});

	it("includes ages within the configured range", () => {
		expect(isWorkingAge(gameSettings.demographics.workingAgeMin)).toBe(true);
		expect(isWorkingAge(gameSettings.demographics.workingAgeMax)).toBe(true);
	});

	it("excludes ages above the configured maximum", () => {
		expect(isWorkingAge(gameSettings.demographics.workingAgeMax + 1)).toBe(
			false,
		);
	});
});

describe("syncEmploymentWithAge", () => {
	it("clears a job for a child below working age", () => {
		const next = syncEmploymentWithAge(
			gameSettings.demographics.workingAgeMin - 1,
			{ categoryId: "services", subSectorId: "healthcare" },
			() => 0,
		);
		expect(next).toEqual({ categoryId: undefined, subSectorId: undefined });
	});

	it("clears a job for a retiree above working age", () => {
		const next = syncEmploymentWithAge(
			gameSettings.demographics.workingAgeMax + 1,
			{ categoryId: "services", subSectorId: "healthcare" },
			() => 0,
		);
		expect(next).toEqual({ categoryId: undefined, subSectorId: undefined });
	});

	it("assigns a job when entering working age without one", () => {
		const next = syncEmploymentWithAge(
			gameSettings.demographics.workingAgeMin,
			{ categoryId: undefined, subSectorId: undefined },
			() => 0,
		);
		expect(next.categoryId).toBe("extractive");
		expect(next.subSectorId).toBeTypeOf("string");
	});

	it("preserves an existing job while still working age", () => {
		const current = {
			categoryId: "services" as const,
			subSectorId: "healthcare",
		};
		const next = syncEmploymentWithAge(40, current, () => 0);
		expect(next).toEqual(current);
	});
});
