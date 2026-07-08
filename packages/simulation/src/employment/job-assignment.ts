import {
	type CategoryId,
	type GameSettings,
	gameSettings,
	getAllSubSectorEmploymentShares,
} from "economy-simulator-data";

interface JobAssignment {
	categoryId: CategoryId;
	subSectorId: string;
}

type RandomFn = () => number;

/**
 * Weighted-random pick of a job sector, weighted by each sub-sector's
 * real-world-anchored employment share (see
 * `economy-simulator-data`'s `getAllSubSectorEmploymentShares`).
 *
 * When `viableExtractiveSubSectorIds` is supplied (region-aware assignment
 * — see `economy-simulator-data`'s `getViableExtractiveSubSectorIds`), only
 * "extractive" entries whose sub-sector is in that list remain eligible;
 * every other category is unaffected (non-extractive work stays
 * country-wide, per the confirmed scope). A region whose terrain supports no
 * extractive sub-sector at all (e.g. a non-coastal, overlay-less desert)
 * simply removes "extractive" from the pool entirely — its citizens are
 * assigned one of the other four categories instead.
 */
function assignJobSector(
	random: RandomFn = Math.random,
	viableExtractiveSubSectorIds?: readonly string[],
): JobAssignment {
	const weighted = getAllSubSectorEmploymentShares().filter((entry) => {
		if (entry.categoryId !== "extractive" || !viableExtractiveSubSectorIds) {
			return true;
		}
		return viableExtractiveSubSectorIds.includes(entry.subSectorId);
	});
	const total = weighted.reduce((sum, entry) => sum + entry.employmentShare, 0);

	if (weighted.length === 0 || total <= 0) {
		throw new Error(
			"No sub-sectors with positive employment share are configured",
		);
	}

	let roll = random() * total;
	for (const entry of weighted) {
		roll -= entry.employmentShare;
		if (roll <= 0) {
			return { categoryId: entry.categoryId, subSectorId: entry.subSectorId };
		}
	}

	const fallback = weighted[weighted.length - 1];
	if (!fallback) {
		throw new Error("Unreachable: weighted sub-sector list was non-empty");
	}
	return { categoryId: fallback.categoryId, subSectorId: fallback.subSectorId };
}

/** Whether an age falls within the configured working-age population range. */
function isWorkingAge(
	age: number,
	settings: GameSettings = gameSettings,
): boolean {
	return (
		age >= settings.demographics.workingAgeMin &&
		age <= settings.demographics.workingAgeMax
	);
}

export type { JobAssignment, RandomFn };
export { assignJobSector, isWorkingAge };
