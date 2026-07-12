import type { CategoryId } from "economy-simulator-data";
import { isWorkingAge } from "./job-assignment";

interface LaborEdictTarget {
	categoryId: CategoryId;
	subSectorId: string;
}

interface LaborEdictCandidate {
	cohort: number;
	chunkIndex: number;
	offset: number;
	regionId: string | undefined;
}

/**
 * Pick which workers in a source sector will be reassigned by a labor edict.
 */
function selectLaborEdictCandidates(
	candidates: LaborEdictCandidate[],
	percent: number,
	random: () => number,
): Set<string> {
	const count = Math.floor((candidates.length * Math.max(0, percent)) / 100);
	if (count <= 0) return new Set();

	const shuffled = [...candidates];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}

	return new Set(
		shuffled
			.slice(0, count)
			.map((entry) => `${entry.cohort}:${entry.chunkIndex}:${entry.offset}`),
	);
}

function isEligibleLaborEdictWorker(
	age: number | undefined,
	isAlive: boolean,
	categoryId: CategoryId | undefined,
	subSectorId: string | undefined,
	source: LaborEdictTarget,
	settings: Parameters<typeof isWorkingAge>[1],
): boolean {
	if (!isAlive) return false;
	if (age == null || !isWorkingAge(age, settings)) return false;
	return categoryId === source.categoryId && subSectorId === source.subSectorId;
}

export type { LaborEdictCandidate, LaborEdictTarget };
export { isEligibleLaborEdictWorker, selectLaborEdictCandidates };
