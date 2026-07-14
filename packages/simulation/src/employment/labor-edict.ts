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
 * When `crossRegionShareCap` is set (Phase 0b), at most that fraction of
 * selected movers may come from outside the modal (most common) source
 * region — labor is sticky across provinces.
 */
function selectLaborEdictCandidates(
	candidates: LaborEdictCandidate[],
	percent: number,
	random: () => number,
	crossRegionShareCap?: number,
): Set<string> {
	const count = Math.floor((candidates.length * Math.max(0, percent)) / 100);
	if (count <= 0) return new Set();

	const shuffled = [...candidates];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}

	if (crossRegionShareCap == null || crossRegionShareCap >= 1) {
		return new Set(
			shuffled
				.slice(0, count)
				.map((entry) => `${entry.cohort}:${entry.chunkIndex}:${entry.offset}`),
		);
	}

	const regionCounts = new Map<string, number>();
	for (const entry of candidates) {
		const key = entry.regionId ?? "";
		regionCounts.set(key, (regionCounts.get(key) ?? 0) + 1);
	}
	let homeRegionId = "";
	let homeCount = -1;
	for (const [regionId, regionCount] of regionCounts) {
		if (regionCount > homeCount) {
			homeRegionId = regionId;
			homeCount = regionCount;
		}
	}

	const maxCross = Math.floor(count * Math.max(0, crossRegionShareCap));
	const selected: LaborEdictCandidate[] = [];
	let crossCount = 0;
	for (const entry of shuffled) {
		if (selected.length >= count) break;
		const isCross = (entry.regionId ?? "") !== homeRegionId;
		if (isCross && crossCount >= maxCross) continue;
		selected.push(entry);
		if (isCross) crossCount += 1;
	}

	return new Set(
		selected.map(
			(entry) => `${entry.cohort}:${entry.chunkIndex}:${entry.offset}`,
		),
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
