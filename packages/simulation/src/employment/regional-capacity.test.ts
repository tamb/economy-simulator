import { describe, expect, it } from "vitest";
import { computeRegionalCategoryMultipliers } from "./regional-capacity";

describe("computeRegionalCategoryMultipliers", () => {
	it("boosts industrial capacity on coastal plains vs interior desert", () => {
		const coastal = computeRegionalCategoryMultipliers({
			regionPopulation: 100,
			averageLandPopulation: 100,
			isCoastal: true,
			terrain: "plains",
		});
		const desert = computeRegionalCategoryMultipliers({
			regionPopulation: 100,
			averageLandPopulation: 100,
			isCoastal: false,
			terrain: "desert",
		});

		expect(coastal.industrial ?? 1).toBeGreaterThan(desert.industrial ?? 1);
		expect(coastal.services ?? 1).toBeGreaterThan(desert.services ?? 1);
	});

	it("raises knowledge capacity in denser regions", () => {
		const dense = computeRegionalCategoryMultipliers({
			regionPopulation: 200,
			averageLandPopulation: 100,
			isCoastal: false,
			terrain: "hills",
		});
		const sparse = computeRegionalCategoryMultipliers({
			regionPopulation: 40,
			averageLandPopulation: 100,
			isCoastal: false,
			terrain: "hills",
		});

		expect(dense.knowledge ?? 1).toBeGreaterThan(sparse.knowledge ?? 1);
	});
});
