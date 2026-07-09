import { en, Faker } from "@faker-js/faker";
import {
	gameSettings,
	getViableExtractiveSubSectorIds,
	isLand,
} from "economy-simulator-data";
import { assignJobSector, isWorkingAge } from "economy-simulator-simulation";
import type { FaceId } from "../data/faces";
import { personGenerationConfig } from "../data/person-generation";
import type { WorldRegion } from "../data/world";
import { Person, type PersonalityTrait, type PersonSex } from "./Person";

/** Citizens live on land only — ocean tiles are geography, not homes. */
function landRegions(regions: readonly WorldRegion[]): WorldRegion[] {
	return regions.filter((region) => isLand(region.terrain));
}

type RandomFn = () => number;

function randomInt(min: number, max: number, random: RandomFn): number {
	return Math.floor(random() * (max - min + 1)) + min;
}

function generateSex(random: RandomFn): PersonSex {
	return random() < 0.5 ? "M" : "F";
}

function generateName(random: RandomFn, sex: PersonSex): string {
	const faker = new Faker({
		locale: [en],
		seed: randomInt(0, 2_147_483_647, random),
	});
	return faker.person.fullName({ sex: sex === "M" ? "male" : "female" });
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
		person.setTrait(traits[index], points[index]);
	}
}

/** The viable extractive sub-sectors a region's home terrain supports, or `undefined` (no filtering) if the region can't be found. */
function getViableExtractiveSubSectorIdsForRegion(
	regions: readonly WorldRegion[],
	regionId: string | undefined,
): string[] | undefined {
	const region = regions.find((candidate) => candidate.id === regionId);
	return region
		? getViableExtractiveSubSectorIds(region.terrain, region.isCoastal)
		: undefined;
}

function generatePerson(
	faceIds: readonly FaceId[],
	regions: readonly WorldRegion[],
	config = personGenerationConfig,
	random: RandomFn = Math.random,
): Person {
	const person = new Person();
	const sex = generateSex(random);

	person.setSex(sex);
	person.setName(generateName(random, sex));
	person.setAge(
		randomInt(
			gameSettings.demographics.minAge,
			gameSettings.demographics.maxAge,
			random,
		),
	);
	person.setIsAlive(true);
	person.setFaceId(faceIds[randomInt(0, faceIds.length - 1, random)]);
	const homes = landRegions(regions);
	if (homes.length > 0) {
		person.setRegionId(homes[randomInt(0, homes.length - 1, random)]?.id);
	}
	person.setOverallHealth(
		randomInt(config.health.min, config.health.max, random),
	);
	person.setOverallHappiness(
		randomInt(config.happiness.min, config.happiness.max, random),
	);

	const traitPoints = splitPoints(
		config.traitPointBudget,
		config.traits.length,
		random,
	);
	assignTraits(person, config.traits, traitPoints);

	if (isWorkingAge(person.getAge() ?? 0)) {
		const job = assignJobSector(
			random,
			getViableExtractiveSubSectorIdsForRegion(regions, person.getRegionId()),
		);
		person.setCategoryId(job.categoryId);
		person.setSubSectorId(job.subSectorId);
	}

	return person;
}

export {
	generatePerson,
	getViableExtractiveSubSectorIdsForRegion,
	type RandomFn,
	randomInt,
};
