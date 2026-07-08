import { describe, expect, it } from "vitest";
import { Person } from "./Person";
import { updatePersonStats } from "./updatePersonStats";

function sequenceRandom(values: number[]): () => number {
	let index = 0;
	return () => values[index++] ?? values.at(-1) ?? 0;
}

describe("updatePersonStats", () => {
	it("keeps health and happiness within bounds", () => {
		const person = new Person();
		person.setOverallHealth(0);
		person.setOverallHappiness(100);
		person.setAge(30);
		person.setIsAlive(true);

		updatePersonStats(person, sequenceRandom([0, 0, 0, 0]));

		expect(person.getOverallHealth()).toBeGreaterThanOrEqual(0);
		expect(person.getOverallHealth()).toBeLessThanOrEqual(100);
		expect(person.getOverallHappiness()).toBeGreaterThanOrEqual(0);
		expect(person.getOverallHappiness()).toBeLessThanOrEqual(100);
	});

	it("does not change age or living status", () => {
		const person = new Person();
		person.setAge(40);
		person.setIsAlive(true);

		updatePersonStats(person, sequenceRandom([0, 0, 0, 0]));

		expect(person.getAge()).toBe(40);
		expect(person.getIsAlive()).toBe(true);
	});

	it("does not update a person who is already dead", () => {
		const person = new Person();
		person.setAge(80);
		person.setOverallHealth(10);
		person.setOverallHappiness(20);
		person.setIsAlive(false);

		updatePersonStats(person, sequenceRandom([0, 0, 0, 0]));

		expect(person.getAge()).toBe(80);
		expect(person.getOverallHealth()).toBe(10);
		expect(person.getOverallHappiness()).toBe(20);
		expect(person.getIsAlive()).toBe(false);
	});

	it("applies the work-hours and personality-affinity model for an employed citizen", () => {
		const person = new Person();
		person.setAge(30);
		person.setIsAlive(true);
		person.setOverallHappiness(50);
		person.setOverallHealth(50);
		person.setCategoryId("services");
		person.setSubSectorId("healthcare");
		person.setTrait("extraversion", 11);
		person.setTrait("agreeableness", 11);
		person.setTrait("openness", 0);
		person.setTrait("conscientiousness", 0);
		person.setTrait("neuroticism", 0);

		updatePersonStats(person, () => 0.5);

		expect(person.getOverallHappiness()).toBeGreaterThan(50);
	});

	it("penalizes an unemployed working-age citizen relative to a busy neutral-hours one", () => {
		const idle = new Person();
		idle.setAge(30);
		idle.setIsAlive(true);
		idle.setOverallHappiness(50);
		idle.setOverallHealth(50);

		const employed = new Person();
		employed.setAge(30);
		employed.setIsAlive(true);
		employed.setOverallHappiness(50);
		employed.setOverallHealth(50);
		employed.setCategoryId("services");
		employed.setSubSectorId("healthcare");

		updatePersonStats(idle, () => 0.5);
		updatePersonStats(employed, () => 0.5);

		expect(idle.getOverallHappiness() ?? 0).toBeLessThan(
			employed.getOverallHappiness() ?? 0,
		);
	});

	it("applies a resource shortfall happiness penalty from context", () => {
		const withoutPenalty = new Person();
		withoutPenalty.setAge(30);
		withoutPenalty.setIsAlive(true);
		withoutPenalty.setOverallHappiness(50);
		withoutPenalty.setOverallHealth(50);

		const withPenalty = new Person();
		withPenalty.setAge(30);
		withPenalty.setIsAlive(true);
		withPenalty.setOverallHappiness(50);
		withPenalty.setOverallHealth(50);

		updatePersonStats(withoutPenalty, () => 0.5);
		updatePersonStats(withPenalty, () => 0.5, undefined, {
			resourceShortfallHappinessPenalty: 2,
		});

		expect(withPenalty.getOverallHappiness() ?? 0).toBeLessThan(
			withoutPenalty.getOverallHappiness() ?? 0,
		);
	});

	it("applies an environmental quality modifier from context", () => {
		const pristine = new Person();
		pristine.setAge(30);
		pristine.setIsAlive(true);
		pristine.setOverallHappiness(50);
		pristine.setOverallHealth(50);

		const polluted = new Person();
		polluted.setAge(30);
		polluted.setIsAlive(true);
		polluted.setOverallHappiness(50);
		polluted.setOverallHealth(50);

		updatePersonStats(pristine, () => 0.5);
		updatePersonStats(polluted, () => 0.5, undefined, {
			environmentalQualityModifier: -3,
		});

		expect(polluted.getOverallHappiness() ?? 0).toBeLessThan(
			pristine.getOverallHappiness() ?? 0,
		);
	});
});
