import { describe, expect, it } from "vitest";
import { personGenerationConfig } from "./person-generation";

describe("personGenerationConfig", () => {
	it("defines all five Big Five traits", () => {
		expect(personGenerationConfig.traits).toEqual([
			"openness",
			"conscientiousness",
			"extraversion",
			"agreeableness",
			"neuroticism",
		]);
	});

	it("uses a 22-point trait budget", () => {
		expect(personGenerationConfig.traitPointBudget).toBe(22);
	});

	it("uses percentage ranges for happiness and health", () => {
		expect(personGenerationConfig.happiness).toEqual({ min: 0, max: 100 });
		expect(personGenerationConfig.health).toEqual({ min: 0, max: 100 });
	});
});
