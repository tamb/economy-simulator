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
 * "extractive" entries whose sub-sector is in that list remain eligible.
 * Optional `categoryMultipliers` (Phase 0b) scale non-extractive category
 * shares by province capacity (density / coast / terrain). A region whose
 * terrain supports no extractive sub-sector at all simply removes
 * "extractive" from the pool.
 */
function assignJobSector(
	random: RandomFn = Math.random,
	viableExtractiveSubSectorIds?: readonly string[],
	categoryMultipliers?: Partial<Record<CategoryId, number>>,
): JobAssignment {
	const weighted = getAllSubSectorEmploymentShares()
		.filter((entry) => {
			if (entry.categoryId !== "extractive" || !viableExtractiveSubSectorIds) {
				return true;
			}
			return viableExtractiveSubSectorIds.includes(entry.subSectorId);
		})
		.map((entry) => {
			const multiplier =
				entry.categoryId === "extractive"
					? 1
					: (categoryMultipliers?.[entry.categoryId] ?? 1);
			return {
				...entry,
				employmentShare: entry.employmentShare * Math.max(0, multiplier),
			};
		})
		.filter((entry) => entry.employmentShare > 0);

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

interface EmploymentState {
	categoryId: CategoryId | undefined;
	subSectorId: string | undefined;
}

/**
 * Keep a citizen's job in sync with their age: assign a sector when they
 * enter working age without one, and clear it when they leave (childhood
 * or retirement). Existing jobs are preserved across working-age years.
 */
function syncEmploymentWithAge(
	age: number,
	current: EmploymentState,
	random: RandomFn = Math.random,
	viableExtractiveSubSectorIds?: readonly string[],
	settings: GameSettings = gameSettings,
	categoryMultipliers?: Partial<Record<CategoryId, number>>,
): EmploymentState {
	if (!isWorkingAge(age, settings)) {
		return { categoryId: undefined, subSectorId: undefined };
	}

	if (current.categoryId && current.subSectorId) {
		return current;
	}

	const job = assignJobSector(
		random,
		viableExtractiveSubSectorIds,
		categoryMultipliers,
	);
	return { categoryId: job.categoryId, subSectorId: job.subSectorId };
}

export type { EmploymentState, JobAssignment, RandomFn };
export { assignJobSector, isWorkingAge, syncEmploymentWithAge };
