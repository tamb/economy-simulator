import { describe, expect, it } from "vitest";
import {
	computeDailyQualityOfLifeUpdate,
	type QualityOfLifeInput,
} from "./daily-update";

const neutralPersonality = {
	openness: 1,
	conscientiousness: 1,
	extraversion: 1,
	agreeableness: 1,
	neuroticism: 1,
};

function noRandomNoise(): number {
	return 0.5; // (0.5 * 2 - 1) === 0, so no noise contribution
}

describe("computeDailyQualityOfLifeUpdate", () => {
	it("applies the idle penalty for an unemployed citizen with a neutral personality", () => {
		const input: QualityOfLifeInput = {
			happiness: 50,
			health: 50,
			age: 30,
			personality: neutralPersonality,
			weeklyHours: undefined,
			categoryId: undefined,
		};

		const result = computeDailyQualityOfLifeUpdate(input, noRandomNoise);
		expect(result.happiness).toBeLessThan(50);
	});

	it("does not apply the idle penalty to children or retirees", () => {
		for (const age of [10, 80]) {
			const input: QualityOfLifeInput = {
				happiness: 50,
				health: 50,
				age,
				personality: neutralPersonality,
				weeklyHours: undefined,
				categoryId: undefined,
			};

			const result = computeDailyQualityOfLifeUpdate(input, noRandomNoise);
			expect(result.happiness).toBe(50);
		}
	});

	it("does not penalize a citizen working within the neutral hours zone with neutral personality", () => {
		const input: QualityOfLifeInput = {
			happiness: 50,
			health: 50,
			age: 30,
			personality: neutralPersonality,
			weeklyHours: 40,
			categoryId: "services",
		};

		const result = computeDailyQualityOfLifeUpdate(input, noRandomNoise);
		expect(result.happiness).toBe(50);
	});

	it("boosts happiness for a well-aligned worker", () => {
		const extraverted = {
			openness: 0,
			conscientiousness: 0,
			extraversion: 11,
			agreeableness: 11,
			neuroticism: 0,
		};

		const input: QualityOfLifeInput = {
			happiness: 50,
			health: 50,
			age: 30,
			personality: extraverted,
			weeklyHours: 38,
			categoryId: "services",
		};

		const result = computeDailyQualityOfLifeUpdate(input, noRandomNoise);
		expect(result.happiness).toBeGreaterThan(50);
	});

	it("compounds overwork penalty with poor personality fit", () => {
		const introvertedIntrospective = {
			openness: 11,
			conscientiousness: 0,
			extraversion: 0,
			agreeableness: 0,
			neuroticism: 11,
		};

		const input: QualityOfLifeInput = {
			happiness: 50,
			health: 50,
			age: 30,
			personality: introvertedIntrospective,
			weeklyHours: 70,
			categoryId: "command",
		};

		const result = computeDailyQualityOfLifeUpdate(input, noRandomNoise);
		expect(result.happiness).toBeLessThan(50 - 1);
	});

	it("clamps happiness within 0-100", () => {
		const input: QualityOfLifeInput = {
			happiness: 1,
			health: 50,
			age: 30,
			personality: neutralPersonality,
			weeklyHours: undefined,
			categoryId: undefined,
		};

		const result = computeDailyQualityOfLifeUpdate(
			input,
			() => 0, // maximum negative noise
		);
		expect(result.happiness).toBeGreaterThanOrEqual(0);
	});

	it("clamps health within 0-100", () => {
		const input: QualityOfLifeInput = {
			happiness: 100,
			health: 99,
			age: 30,
			personality: neutralPersonality,
			weeklyHours: 40,
			categoryId: "services",
		};

		const result = computeDailyQualityOfLifeUpdate(input, () => 1);
		expect(result.health).toBeLessThanOrEqual(100);
	});

	it("lags health behind a happiness jump rather than snapping to it", () => {
		const input: QualityOfLifeInput = {
			happiness: 20,
			health: 80,
			age: 30,
			personality: neutralPersonality,
			weeklyHours: 40,
			categoryId: "services",
		};

		const result = computeDailyQualityOfLifeUpdate(input, noRandomNoise);
		// Happiness stays at 20 (neutral zone, no delta); health should move
		// toward 20 but only by a small fraction in a single day.
		expect(result.health).toBeLessThan(80);
		expect(result.health).toBeGreaterThan(70);
	});

	it("stacks role morale multiplier with economic system morale", () => {
		const extraverted = {
			openness: 0,
			conscientiousness: 0,
			extraversion: 11,
			agreeableness: 11,
			neuroticism: 0,
		};

		const baseline = computeDailyQualityOfLifeUpdate(
			{
				happiness: 50,
				health: 50,
				age: 30,
				personality: extraverted,
				weeklyHours: 38,
				categoryId: "services",
			},
			noRandomNoise,
		);
		const withRole = computeDailyQualityOfLifeUpdate(
			{
				happiness: 50,
				health: 50,
				age: 30,
				personality: extraverted,
				weeklyHours: 38,
				categoryId: "services",
				roleMoraleMultiplier: 0.75,
			},
			noRandomNoise,
		);

		expect(withRole.happiness).toBeLessThan(baseline.happiness);
	});

	it("scales the personality-affinity delta by economicSystemMoraleMultiplier", () => {
		const extraverted = {
			openness: 0,
			conscientiousness: 0,
			extraversion: 11,
			agreeableness: 11,
			neuroticism: 0,
		};

		const baseline = computeDailyQualityOfLifeUpdate(
			{
				happiness: 50,
				health: 50,
				age: 30,
				personality: extraverted,
				weeklyHours: 38,
				categoryId: "services",
			},
			noRandomNoise,
		);
		const boosted = computeDailyQualityOfLifeUpdate(
			{
				happiness: 50,
				health: 50,
				age: 30,
				personality: extraverted,
				weeklyHours: 38,
				categoryId: "services",
				economicSystemMoraleMultiplier: 1.1,
			},
			noRandomNoise,
		);

		expect(boosted.happiness).toBeGreaterThan(baseline.happiness);
	});

	it("applies environmentalQualityModifier directly to the happiness delta", () => {
		const input: QualityOfLifeInput = {
			happiness: 50,
			health: 50,
			age: 30,
			personality: neutralPersonality,
			weeklyHours: 40,
			categoryId: "services",
			environmentalQualityModifier: -2,
		};

		const result = computeDailyQualityOfLifeUpdate(input, noRandomNoise);
		expect(result.happiness).toBe(48);
	});

	it("subtracts resourceShortfallHappinessPenalty from happiness", () => {
		const input: QualityOfLifeInput = {
			happiness: 50,
			health: 50,
			age: 30,
			personality: neutralPersonality,
			weeklyHours: 40,
			categoryId: "services",
			resourceShortfallHappinessPenalty: 1.5,
		};

		const result = computeDailyQualityOfLifeUpdate(input, noRandomNoise);
		expect(result.happiness).toBe(48.5);
	});

	it("subtracts tax and service underfunding penalties from happiness (Phase 1b/1c)", () => {
		const baseline: QualityOfLifeInput = {
			happiness: 50,
			health: 50,
			age: 30,
			personality: neutralPersonality,
			weeklyHours: 40,
			categoryId: "services",
		};

		const pressured = computeDailyQualityOfLifeUpdate(
			{
				...baseline,
				taxHappinessPenalty: 1.25,
				serviceUnderfundingHappinessPenalty: 0.75,
			},
			noRandomNoise,
		);

		expect(pressured.happiness).toBe(48);
	});

	it("scales personality affinity by education quality (Phase 1c)", () => {
		const extraverted = {
			openness: 0,
			conscientiousness: 0,
			extraversion: 11,
			agreeableness: 11,
			neuroticism: 0,
		};

		const baseline = computeDailyQualityOfLifeUpdate(
			{
				happiness: 50,
				health: 50,
				age: 30,
				personality: extraverted,
				weeklyHours: 38,
				categoryId: "services",
			},
			noRandomNoise,
		);
		const boosted = computeDailyQualityOfLifeUpdate(
			{
				happiness: 50,
				health: 50,
				age: 30,
				personality: extraverted,
				weeklyHours: 38,
				categoryId: "services",
				educationAffinityMultiplier: 1.2,
			},
			noRandomNoise,
		);

		expect(boosted.happiness).toBeGreaterThan(baseline.happiness);
	});

	it("applies healthcare quality as a daily health floor bonus (Phase 1c)", () => {
		const input: QualityOfLifeInput = {
			happiness: 50,
			health: 50,
			age: 30,
			personality: neutralPersonality,
			weeklyHours: 40,
			categoryId: "services",
			healthFloorBonus: 0.4,
		};

		const result = computeDailyQualityOfLifeUpdate(input, noRandomNoise);
		expect(result.health).toBeGreaterThan(50);
	});

	it("defaults the new resource-related modifiers to no effect when omitted", () => {
		const withDefaults = computeDailyQualityOfLifeUpdate(
			{
				happiness: 50,
				health: 50,
				age: 30,
				personality: neutralPersonality,
				weeklyHours: 40,
				categoryId: "services",
			},
			noRandomNoise,
		);
		const withExplicitNeutrals = computeDailyQualityOfLifeUpdate(
			{
				happiness: 50,
				health: 50,
				age: 30,
				personality: neutralPersonality,
				weeklyHours: 40,
				categoryId: "services",
				economicSystemMoraleMultiplier: 1,
				environmentalQualityModifier: 0,
				resourceShortfallHappinessPenalty: 0,
			},
			noRandomNoise,
		);
		expect(withDefaults).toEqual(withExplicitNeutrals);
	});

	it("is deterministic for a fixed random source", () => {
		const input: QualityOfLifeInput = {
			happiness: 50,
			health: 50,
			age: 30,
			personality: neutralPersonality,
			weeklyHours: 40,
			categoryId: "services",
		};

		const first = computeDailyQualityOfLifeUpdate(input, () => 0.3);
		const second = computeDailyQualityOfLifeUpdate(input, () => 0.3);
		expect(first).toEqual(second);
	});
});
