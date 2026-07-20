import { describe, expect, it } from "vitest";
import {
	evaluateCareerBadges,
	evaluateEndRunBadges,
	evaluateRunBadges,
} from "./badge-evaluator";

function baseScore(
	overrides: Partial<{ total: number; environmentHealth: number }> = {},
) {
	return {
		year: 1,
		total: 50,
		populationGrowth: 50,
		averageQualityOfLife: 50,
		netMigration: 50,
		resourceSufficiency: 50,
		environmentHealth: 70,
		...overrides,
	};
}

describe("evaluateRunBadges", () => {
	it("unlocks first census after year one", () => {
		expect(
			evaluateRunBadges({
				year: 1,
				births: 0,
				deaths: 0,
				immigrations: 0,
				emigrations: 0,
				score: baseScore(),
				netImmigrationPositiveStreak: 0,
			}),
		).toContain("first_census");
	});

	it("unlocks baby boom when births dominate deaths", () => {
		expect(
			evaluateRunBadges({
				year: 5,
				births: 100,
				deaths: 40,
				immigrations: 0,
				emigrations: 0,
				score: baseScore(),
				netImmigrationPositiveStreak: 0,
			}),
		).toContain("baby_boom");
	});

	it("unlocks golden age when the nation score is high enough", () => {
		expect(
			evaluateRunBadges({
				year: 10,
				births: 0,
				deaths: 0,
				immigrations: 0,
				emigrations: 0,
				score: baseScore({ total: 80 }),
				netImmigrationPositiveStreak: 0,
			}),
		).toContain("golden_age");
	});

	it("unlocks royal mandate only when a mandate completed this year", () => {
		expect(
			evaluateRunBadges({
				year: 3,
				births: 0,
				deaths: 0,
				immigrations: 0,
				emigrations: 0,
				score: baseScore(),
				netImmigrationPositiveStreak: 0,
				mandateCompletedThisYear: true,
			}),
		).toContain("royal_mandate");
	});
});

describe("evaluateCareerBadges", () => {
	it("unlocks the ten-win career badge at the threshold", () => {
		expect(evaluateCareerBadges({ wins: 9 })).not.toContain("career_10_wins");
		expect(evaluateCareerBadges({ wins: 10 })).toContain("career_10_wins");
	});
});

describe("evaluateEndRunBadges", () => {
	it("maps win and mass exodus end reasons to badges", () => {
		expect(evaluateEndRunBadges(undefined, "won")).toEqual(["monarch_emeritus"]);
		expect(evaluateEndRunBadges("mass_exodus", "lost")).toEqual(["exodus"]);
		expect(evaluateEndRunBadges(undefined, "lost")).toEqual([]);
	});
});
