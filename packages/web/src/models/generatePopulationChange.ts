import { gameSettings, isLand, sectorKey } from "economy-simulator-data";
import {
	assignJobSector,
	assignRoleForCitizen,
	computeRegionalCategoryMultipliers,
	isWorkingAge,
} from "economy-simulator-simulation";
import type { FaceId } from "../lib/faces";
import { personGenerationConfig } from "../lib/person-generation";
import type { WorldRegion } from "../lib/world";
import type { SectorRoleConfigs } from "../repos/sector-role-config";
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
	roleConfigs?: SectorRoleConfigs,
): Person {
	const immigrant = generatePerson(
		faceIds,
		regions,
		config,
		random,
		roleConfigs,
	);
	const age = randomInt(
		gameSettings.demographics.workingAgeMin,
		gameSettings.demographics.workingAgeMax,
		random,
	);
	immigrant.setAge(age);

	if (isWorkingAge(age)) {
		const home = regions.find(
			(region) =>
				region.id === immigrant.getRegionId() && isLand(region.terrain),
		);
		const multipliers = home
			? computeRegionalCategoryMultipliers({
					regionPopulation: 1,
					averageLandPopulation: 1,
					isCoastal: home.isCoastal,
					terrain: home.terrain,
				})
			: undefined;
		const job = assignJobSector(
			random,
			getViableExtractiveSubSectorIdsForRegion(
				regions,
				immigrant.getRegionId(),
			),
			multipliers,
		);
		immigrant.setCategoryId(job.categoryId);
		immigrant.setSubSectorId(job.subSectorId);

		if (roleConfigs) {
			const key = sectorKey(job.categoryId, job.subSectorId);
			const quotas = roleConfigs[key]?.quotas;
			if (quotas?.length) {
				const roleId = assignRoleForCitizen(quotas, random);
				if (roleId != null) immigrant.setRoleId(roleId);
			}
		}
	} else {
		immigrant.setCategoryId(undefined);
		immigrant.setSubSectorId(undefined);
	}

	return immigrant;
}

export { generateImmigrantPerson, generateNewbornPerson };
