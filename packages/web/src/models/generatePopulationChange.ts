import { gameSettings } from "economy-simulator-data";
import { assignJobSector, isWorkingAge } from "economy-simulator-simulation";
import type { FaceId } from "../data/faces";
import { personGenerationConfig } from "../data/person-generation";
import type { WorldRegion } from "../data/world";
import {
	generatePerson,
	getViableExtractiveSubSectorIdsForRegion,
	type RandomFn,
	randomInt,
} from "./generatePerson";
import type { Person } from "./Person";

/**
 * A citizen born this year: minimum age, no job sector yet, home region
 * assigned uniformly at random (mother's region isn't tracked yet — a
 * reasonable v1 simplification).
 */
function generateNewbornPerson(
	faceIds: readonly FaceId[],
	regions: readonly WorldRegion[],
	config = personGenerationConfig,
	random: RandomFn = Math.random,
): Person {
	const newborn = generatePerson(faceIds, regions, config, random);
	newborn.setAge(gameSettings.demographics.minAge);
	newborn.setCategoryId(undefined);
	newborn.setSubSectorId(undefined);
	return newborn;
}

/** A citizen who immigrated this year: working-age adult, assigned a job sector. */
function generateImmigrantPerson(
	faceIds: readonly FaceId[],
	regions: readonly WorldRegion[],
	config = personGenerationConfig,
	random: RandomFn = Math.random,
): Person {
	const immigrant = generatePerson(faceIds, regions, config, random);
	const age = randomInt(
		gameSettings.demographics.workingAgeMin,
		gameSettings.demographics.workingAgeMax,
		random,
	);
	immigrant.setAge(age);

	if (isWorkingAge(age)) {
		const job = assignJobSector(
			random,
			getViableExtractiveSubSectorIdsForRegion(
				regions,
				immigrant.getRegionId(),
			),
		);
		immigrant.setCategoryId(job.categoryId);
		immigrant.setSubSectorId(job.subSectorId);
	} else {
		immigrant.setCategoryId(undefined);
		immigrant.setSubSectorId(undefined);
	}

	return immigrant;
}

export { generateImmigrantPerson, generateNewbornPerson };
