import { describe, expect, it } from "vitest";
import {
	CATEGORY_AFFINITY_WEIGHTS,
	getPersonalitySectorAffinity,
	type PersonalityProfile,
} from "./personality-affinity";

const neutral: PersonalityProfile = {
	openness: 1,
	conscientiousness: 1,
	extraversion: 1,
	agreeableness: 1,
	neuroticism: 1,
};

const highConscientiousnessOnly: PersonalityProfile = {
	openness: 0,
	conscientiousness: 22,
	extraversion: 0,
	agreeableness: 0,
	neuroticism: 0,
};

const highExtraversionAgreeableness: PersonalityProfile = {
	openness: 0,
	conscientiousness: 0,
	extraversion: 11,
	agreeableness: 11,
	neuroticism: 0,
};

describe("getPersonalitySectorAffinity", () => {
	it("defines weights for every category", () => {
		for (const categoryId of Object.keys(
			CATEGORY_AFFINITY_WEIGHTS,
		) as (keyof typeof CATEGORY_AFFINITY_WEIGHTS)[]) {
			expect(CATEGORY_AFFINITY_WEIGHTS[categoryId]).toBeDefined();
		}
	});

	it("scores a perfectly average personality as neutral for every category", () => {
		for (const categoryId of Object.keys(
			CATEGORY_AFFINITY_WEIGHTS,
		) as (keyof typeof CATEGORY_AFFINITY_WEIGHTS)[]) {
			expect(getPersonalitySectorAffinity(neutral, categoryId)).toBeCloseTo(
				0,
				10,
			);
		}
	});

	it("returns 0 when the personality has no trait points at all", () => {
		const empty: PersonalityProfile = {
			openness: 0,
			conscientiousness: 0,
			extraversion: 0,
			agreeableness: 0,
			neuroticism: 0,
		};
		expect(getPersonalitySectorAffinity(empty, "extractive")).toBe(0);
	});

	it("rewards a highly conscientious, non-neurotic personality in extractive/industrial/knowledge/command", () => {
		for (const categoryId of [
			"extractive",
			"industrial",
			"knowledge",
			"command",
		] as const) {
			expect(
				getPersonalitySectorAffinity(highConscientiousnessOnly, categoryId),
			).toBeGreaterThan(0);
		}
	});

	it("penalizes a highly conscientious-only personality for a services role", () => {
		expect(
			getPersonalitySectorAffinity(highConscientiousnessOnly, "services"),
		).toBeLessThan(0);
	});

	it("rewards an extraverted, agreeable personality in services", () => {
		expect(
			getPersonalitySectorAffinity(highExtraversionAgreeableness, "services"),
		).toBeGreaterThan(0);
	});

	it("stays within the -1..1 range", () => {
		const extreme: PersonalityProfile = {
			openness: 0,
			conscientiousness: 0,
			extraversion: 0,
			agreeableness: 0,
			neuroticism: 22,
		};

		for (const categoryId of Object.keys(
			CATEGORY_AFFINITY_WEIGHTS,
		) as (keyof typeof CATEGORY_AFFINITY_WEIGHTS)[]) {
			const affinity = getPersonalitySectorAffinity(extreme, categoryId);
			expect(affinity).toBeGreaterThanOrEqual(-1);
			expect(affinity).toBeLessThanOrEqual(1);
		}
	});
});
