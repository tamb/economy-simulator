import { describe, expect, it } from "vitest";
import { statGlossary } from "./stat-glossary";

describe("statGlossary", () => {
	it("covers core citizen stats and Big Five traits", () => {
		const ids = statGlossary.map((entry) => entry.id);
		expect(ids).toEqual(
			expect.arrayContaining([
				"happiness",
				"health",
				"age",
				"region",
				"living",
				"openness",
				"conscientiousness",
				"extraversion",
				"agreeableness",
				"neuroticism",
			]),
		);
		expect(statGlossary.every((entry) => entry.title.length > 0)).toBe(true);
		expect(statGlossary.every((entry) => entry.summary.length > 20)).toBe(true);
	});
});
