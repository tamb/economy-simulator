import { en, Faker } from "@faker-js/faker";
import { generate as generateFace } from "facesjs";
import { personGenerationConfig } from "../data/person-generation";
import { Person, type PersonalityTrait } from "./Person";

export type RandomFn = () => number;

function randomInt(min: number, max: number, random: RandomFn): number {
	return Math.floor(random() * (max - min + 1)) + min;
}

function generateName(random: RandomFn): string {
	const faker = new Faker({
		locale: [en],
		seed: randomInt(0, 2_147_483_647, random),
	});
	return faker.person.fullName();
}

/** Split `total` into `count` non-negative integers that sum to `total`. */
function splitPoints(total: number, count: number, random: RandomFn): number[] {
	if (count <= 0) return [];
	if (count === 1) return [total];

	const dividers = Array.from({ length: count - 1 }, () =>
		randomInt(0, total, random),
	).sort((a, b) => a - b);

	const points: number[] = [];
	let previous = 0;

	for (const divider of dividers) {
		points.push(divider - previous);
		previous = divider;
	}

	points.push(total - previous);
	return points;
}

function assignTraits(
	person: Person,
	traits: readonly PersonalityTrait[],
	points: number[],
): void {
	for (let index = 0; index < traits.length; index++) {
		person[traits[index]] = points[index];
	}
}

export function generatePerson(
	config = personGenerationConfig,
	random: RandomFn = Math.random,
): Person {
	const person = new Person();

	person.name = generateName(random);
	person.face = generateFace();
	person.overallHealth = randomInt(
		config.health.min,
		config.health.max,
		random,
	);
	person.overallHappiness = randomInt(
		config.happiness.min,
		config.happiness.max,
		random,
	);

	const traitPoints = splitPoints(
		config.traitPointBudget,
		config.traits.length,
		random,
	);
	assignTraits(person, config.traits, traitPoints);

	return person;
}
