import type { FaceConfig } from "facesjs";
import { describe, expect, it, vi } from "vitest";
import { personGenerationConfig } from "../data/person-generation";
import { Person } from "./Person";
import { generatePerson, type RandomFn } from "./generatePerson";

const mockFace = {
	body: { id: "mock-body", color: "white", size: 1 },
	head: { id: "mock-head", shave: "none" },
} as FaceConfig;

vi.mock("facesjs", () => ({
	generate: vi.fn(() => mockFace),
}));

function sequenceRandom(values: number[]): RandomFn {
	let index = 0;
	return () => values[index++] ?? values.at(-1) ?? 0;
}

describe("generatePerson", () => {
	it("returns a Person instance with all generated fields", () => {
		const person = generatePerson(
			personGenerationConfig,
			sequenceRandom([0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]),
		);

		expect(person).toBeInstanceOf(Person);
		expect(person.name).toBeTypeOf("string");
		expect(person.name?.length).toBeGreaterThan(0);
		expect(person.face).toEqual(mockFace);
		expect(person.overallHealth).toBeTypeOf("number");
		expect(person.overallHappiness).toBeTypeOf("number");
	});

	it("assigns health and happiness within configured bounds", () => {
		const person = generatePerson(
			personGenerationConfig,
			sequenceRandom(Array(10).fill(0.99)),
		);

		expect(person.overallHealth).toBeGreaterThanOrEqual(
			personGenerationConfig.health.min,
		);
		expect(person.overallHealth).toBeLessThanOrEqual(
			personGenerationConfig.health.max,
		);
		expect(person.overallHappiness).toBeGreaterThanOrEqual(
			personGenerationConfig.happiness.min,
		);
		expect(person.overallHappiness).toBeLessThanOrEqual(
			personGenerationConfig.happiness.max,
		);
	});

	it("assigns all Big Five traits that sum to the trait point budget", () => {
		const person = generatePerson(
			personGenerationConfig,
			sequenceRandom([0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25]),
		);

		const traitValues = personGenerationConfig.traits.map((trait) => person[trait]);

		expect(traitValues.every((value) => typeof value === "number")).toBe(true);
		expect(traitValues.every((value) => (value ?? -1) >= 0)).toBe(true);
		expect(traitValues.reduce((sum, value) => sum + (value ?? 0), 0)).toBe(
			personGenerationConfig.traitPointBudget,
		);
	});

	it("is deterministic when the random source is deterministic", () => {
		const random = sequenceRandom([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7]);
		const first = generatePerson(personGenerationConfig, random);
		const second = generatePerson(
			personGenerationConfig,
			sequenceRandom([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7]),
		);

		expect(first.name).toBe(second.name);
		expect(first.overallHealth).toBe(second.overallHealth);
		expect(first.overallHappiness).toBe(second.overallHappiness);
		expect(first.openness).toBe(second.openness);
		expect(first.conscientiousness).toBe(second.conscientiousness);
		expect(first.extraversion).toBe(second.extraversion);
		expect(first.agreeableness).toBe(second.agreeableness);
		expect(first.neuroticism).toBe(second.neuroticism);
	});

	it("respects a custom generation config", () => {
		const customConfig = {
			...personGenerationConfig,
			traitPointBudget: 10,
			health: { min: 50, max: 50 },
			happiness: { min: 25, max: 25 },
		};

		const person = generatePerson(customConfig, sequenceRandom([0.5, 0.5, 0.5, 0.5, 0.5, 0.5]));

		expect(person.overallHealth).toBe(50);
		expect(person.overallHappiness).toBe(25);
		expect(
			customConfig.traits.reduce((sum, trait) => sum + (person[trait] ?? 0), 0),
		).toBe(10);
	});

	it("calls facesjs generate for a random face", async () => {
		const { generate } = await import("facesjs");
		generatePerson(personGenerationConfig, sequenceRandom([0.5]));
		expect(generate).toHaveBeenCalled();
	});
});
