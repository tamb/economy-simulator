import { gameSettings } from "economy-simulator-data";
import { describe, expect, it } from "vitest";
import { getFacePoolIds } from "../lib/faces";
import { personGenerationConfig } from "../lib/person-generation";
import type { WorldRegion } from "../lib/world";
import { generatePerson, type RandomFn } from "./generatePerson";
import { Person } from "./Person";

const faceIds = getFacePoolIds();

const regions: WorldRegion[] = [
	{ id: "R00", q: 0, r: 0, terrain: "plains", isCoastal: false },
	{ id: "R01", q: 1, r: 0, terrain: "mountains", isCoastal: true },
];

function sequenceRandom(values: number[]): RandomFn {
	let index = 0;
	return () => values[index++] ?? values.at(-1) ?? 0;
}

describe("generatePerson", () => {
	it("returns a Person instance with all generated fields", () => {
		const person = generatePerson(
			faceIds,
			regions,
			personGenerationConfig,
			sequenceRandom([0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]),
		);

		expect(person).toBeInstanceOf(Person);
		expect(person.getName()).toBeTypeOf("string");
		expect(person.getName()?.length).toBeGreaterThan(0);
		expect(person.getSex()).toMatch(/^[MF]$/);
		expect(person.getAge()).toBeTypeOf("number");
		expect(person.getIsAlive()).toBe(true);
		expect(faceIds).toContain(person.getFaceId());
		expect(regions.map((region) => region.id)).toContain(person.getRegionId());
		expect(person.getOverallHealth()).toBeTypeOf("number");
		expect(person.getOverallHappiness()).toBeTypeOf("number");
	});

	it("assigns age within configured bounds", () => {
		const person = generatePerson(
			faceIds,
			regions,
			personGenerationConfig,
			sequenceRandom(Array(10).fill(0.99)),
		);

		expect(person.getAge()).toBeGreaterThanOrEqual(
			gameSettings.demographics.minAge,
		);
		expect(person.getAge()).toBeLessThanOrEqual(
			gameSettings.demographics.maxAge,
		);
		expect(person.getIsAlive()).toBe(true);
	});

	it("can assign minAge for a newborn citizen", () => {
		const person = generatePerson(
			faceIds,
			regions,
			personGenerationConfig,
			sequenceRandom([0, 0, 0, 0, 0, 0, 0]),
		);

		expect(person.getAge()).toBe(gameSettings.demographics.minAge);
		expect(person.getIsAlive()).toBe(true);
	});

	it("can assign maxAge at generation", () => {
		const person = generatePerson(
			faceIds,
			regions,
			personGenerationConfig,
			sequenceRandom(Array(10).fill(0.999)),
		);

		expect(person.getAge()).toBe(gameSettings.demographics.maxAge);
	});

	it("assigns health and happiness within configured bounds", () => {
		const person = generatePerson(
			faceIds,
			regions,
			personGenerationConfig,
			sequenceRandom(Array(10).fill(0.99)),
		);

		expect(person.getOverallHealth()).toBeGreaterThanOrEqual(
			personGenerationConfig.health.min,
		);
		expect(person.getOverallHealth()).toBeLessThanOrEqual(
			personGenerationConfig.health.max,
		);
		expect(person.getOverallHappiness()).toBeGreaterThanOrEqual(
			personGenerationConfig.happiness.min,
		);
		expect(person.getOverallHappiness()).toBeLessThanOrEqual(
			personGenerationConfig.happiness.max,
		);
	});

	it("assigns all Big Five traits that sum to the trait point budget", () => {
		const person = generatePerson(
			faceIds,
			regions,
			personGenerationConfig,
			sequenceRandom([0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25]),
		);

		const traitValues = personGenerationConfig.traits.map((trait) =>
			person.getTrait(trait),
		);

		expect(traitValues.every((value) => typeof value === "number")).toBe(true);
		expect(traitValues.every((value) => (value ?? -1) >= 0)).toBe(true);
		expect(traitValues.reduce((sum, value) => sum + (value ?? 0), 0)).toBe(
			personGenerationConfig.traitPointBudget,
		);
	});

	it("is deterministic when the random source is deterministic", () => {
		const random = sequenceRandom([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7]);
		const first = generatePerson(
			faceIds,
			regions,
			personGenerationConfig,
			random,
		);
		const second = generatePerson(
			faceIds,
			regions,
			personGenerationConfig,
			sequenceRandom([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7]),
		);

		expect(first.getName()).toBe(second.getName());
		expect(first.getSex()).toBe(second.getSex());
		expect(first.getAge()).toBe(second.getAge());
		expect(first.getIsAlive()).toBe(second.getIsAlive());
		expect(first.getFaceId()).toBe(second.getFaceId());
		expect(first.getRegionId()).toBe(second.getRegionId());
		expect(first.getOverallHealth()).toBe(second.getOverallHealth());
		expect(first.getOverallHappiness()).toBe(second.getOverallHappiness());
		expect(first.getOpenness()).toBe(second.getOpenness());
		expect(first.getConscientiousness()).toBe(second.getConscientiousness());
		expect(first.getExtraversion()).toBe(second.getExtraversion());
		expect(first.getAgreeableness()).toBe(second.getAgreeableness());
		expect(first.getNeuroticism()).toBe(second.getNeuroticism());
	});

	it("respects a custom generation config", () => {
		const customConfig = {
			...personGenerationConfig,
			traitPointBudget: 10,
			health: { min: 50, max: 50 },
			happiness: { min: 25, max: 25 },
		};

		const person = generatePerson(
			faceIds,
			regions,
			customConfig,
			sequenceRandom([0.5, 0.5, 0.5, 0.5, 0.5, 0.5]),
		);

		expect(person.getOverallHealth()).toBe(50);
		expect(person.getOverallHappiness()).toBe(25);
		expect(
			customConfig.traits.reduce(
				(sum, trait) => sum + (person.getTrait(trait) ?? 0),
				0,
			),
		).toBe(10);
	});

	it("assigns a job sector to a working-age citizen", () => {
		const person = generatePerson(
			faceIds,
			regions,
			personGenerationConfig,
			sequenceRandom(Array(10).fill(0.5)),
		);

		expect(person.getAge()).toBeGreaterThanOrEqual(
			gameSettings.demographics.workingAgeMin,
		);
		expect(person.getCategoryId()).toBeTypeOf("string");
		expect(person.getSubSectorId()).toBeTypeOf("string");
	});

	it("does not assign a job sector to a citizen below working age", () => {
		const person = generatePerson(
			faceIds,
			regions,
			personGenerationConfig,
			sequenceRandom([0, 0, 0, 0, 0, 0, 0]),
		);

		expect(person.getAge()).toBeLessThan(
			gameSettings.demographics.workingAgeMin,
		);
		expect(person.getCategoryId()).toBeUndefined();
		expect(person.getSubSectorId()).toBeUndefined();
	});

	it("does not assign a job sector to a citizen above working age", () => {
		const person = generatePerson(
			faceIds,
			regions,
			personGenerationConfig,
			sequenceRandom([0, 0, 0.999, 0, 0, 0, 0]),
		);

		expect(person.getAge()).toBeGreaterThan(
			gameSettings.demographics.workingAgeMax,
		);
		expect(person.getCategoryId()).toBeUndefined();
		expect(person.getSubSectorId()).toBeUndefined();
	});

	it("only assigns an extractive sub-sector viable for the person's assigned region", () => {
		const onlyMountain: WorldRegion[] = [
			{ id: "R00", q: 0, r: 0, terrain: "mountains", isCoastal: false },
		];

		for (let attempt = 0; attempt < 20; attempt++) {
			const person = generatePerson(
				faceIds,
				onlyMountain,
				personGenerationConfig,
				sequenceRandom([0.5, 0.5, 0.5, 0.5, 0.5, attempt / 20]),
			);

			if (person.getCategoryId() === "extractive") {
				expect(["mining", "energy", "quarrying"]).toContain(
					person.getSubSectorId(),
				);
			}
		}
	});

	it("assigns a face id from the provided pool", () => {
		const pool = ["07", "42"] as const;
		const person = generatePerson(
			pool,
			regions,
			personGenerationConfig,
			sequenceRandom([0]),
		);
		expect(person.getFaceId()).toBe("07");
	});

	it("assigns a region id from the provided pool", () => {
		const pool: WorldRegion[] = [
			{ id: "R00", q: 0, r: 0, terrain: "plains", isCoastal: false },
			{ id: "R42", q: 1, r: 0, terrain: "plains", isCoastal: false },
		];
		// Random calls in order: sex, name seed, age, faceId, then regionId.
		const person = generatePerson(
			faceIds,
			pool,
			personGenerationConfig,
			sequenceRandom([0.5, 0.5, 0.5, 0.5, 0]),
		);
		expect(person.getRegionId()).toBe("R00");
	});

	it("only assigns land regions when the pool includes ocean", () => {
		const pool: WorldRegion[] = [
			{ id: "R00", q: 0, r: 0, terrain: "ocean", isCoastal: false },
			{ id: "R01", q: 1, r: 0, terrain: "plains", isCoastal: false },
			{ id: "R02", q: 0, r: 1, terrain: "ocean", isCoastal: false },
		];

		for (let attempt = 0; attempt < 20; attempt++) {
			const person = generatePerson(
				faceIds,
				pool,
				personGenerationConfig,
				sequenceRandom([0.5, 0.5, 0.5, 0.5, attempt / 20]),
			);
			expect(person.getRegionId()).toBe("R01");
		}
	});

	it("leaves regionId undefined when no land regions are provided", () => {
		const person = generatePerson(
			faceIds,
			[{ id: "R00", q: 0, r: 0, terrain: "ocean", isCoastal: false }],
			personGenerationConfig,
			sequenceRandom([0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]),
		);
		expect(person.getRegionId()).toBeUndefined();
	});

	it("leaves regionId undefined when no regions are provided", () => {
		const person = generatePerson(
			faceIds,
			[],
			personGenerationConfig,
			sequenceRandom([0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]),
		);
		expect(person.getRegionId()).toBeUndefined();
	});
});
