import { gameSettings } from "economy-simulator-data";
import { describe, expect, it } from "vitest";
import {
	isEligibleLaborEdictWorker,
	selectLaborEdictCandidates,
	type LaborEdictCandidate,
} from "./labor-edict";

function candidate(
	regionId: string | undefined,
	cohort = 0,
	chunkIndex = 0,
	offset = 0,
): LaborEdictCandidate {
	return { cohort, chunkIndex, offset, regionId };
}

function key(entry: LaborEdictCandidate): string {
	return `${entry.cohort}:${entry.chunkIndex}:${entry.offset}`;
}

describe("selectLaborEdictCandidates", () => {
	it("returns an empty set when percent is zero or candidates are empty", () => {
		const pool = [candidate("r-home", 0, 0, 1)];
		expect(selectLaborEdictCandidates(pool, 0, () => 0)).toEqual(new Set());
		expect(selectLaborEdictCandidates([], 50, () => 0)).toEqual(new Set());
		expect(selectLaborEdictCandidates(pool, -10, () => 0)).toEqual(new Set());
	});

	it("selects every candidate when percent is 100", () => {
		const pool = [
			candidate("r-home", 0, 0, 0),
			candidate("r-away", 0, 0, 1),
			candidate("r-home", 0, 1, 0),
		];
		const selected = selectLaborEdictCandidates(pool, 100, () => 0);
		expect(selected.size).toBe(3);
		expect(selected).toEqual(new Set(pool.map(key)));
	});

	it("respects the cross-region share cap and may select fewer than the percent quota", () => {
		const home = "r-home";
		const away = "r-away";
		const pool = [
			candidate(home, 0, 0, 0),
			candidate(home, 0, 0, 1),
			candidate(home, 0, 0, 2),
			candidate(away, 0, 0, 3),
			candidate(away, 0, 0, 4),
		];
		const selected = selectLaborEdictCandidates(pool, 100, () => 0, 0);
		expect(selected.size).toBe(3);
		for (const id of selected) {
			const entry = pool.find((item) => key(item) === id);
			expect(entry?.regionId).toBe(home);
		}
	});

	it("allows cross-region movers up to the capped fraction", () => {
		const home = "r-home";
		const away = "r-away";
		const pool = [
			...Array.from({ length: 8 }, (_, offset) => candidate(home, 0, 0, offset)),
			candidate(away, 0, 1, 0),
			candidate(away, 0, 1, 1),
		];
		const targetCount = Math.floor((pool.length * 50) / 100);
		const maxCross = Math.floor(targetCount * 0.2);
		const selected = selectLaborEdictCandidates(pool, 50, Math.random, 0.2);
		expect(selected.size).toBe(targetCount);
		let cross = 0;
		for (const id of selected) {
			const entry = pool.find((item) => key(item) === id);
			if (entry?.regionId === away) cross += 1;
		}
		expect(cross).toBeLessThanOrEqual(maxCross);
	});
});

describe("isEligibleLaborEdictWorker", () => {
	const source = {
		categoryId: "industrial" as const,
		subSectorId: "light-manufacturing",
	};
	const settings = gameSettings;

	it("requires a living worker in the source sector at working age", () => {
		expect(
			isEligibleLaborEdictWorker(30, true, "industrial", "light-manufacturing", source, settings),
		).toBe(true);
		expect(
			isEligibleLaborEdictWorker(30, false, "industrial", "light-manufacturing", source, settings),
		).toBe(false);
		expect(
			isEligibleLaborEdictWorker(5, true, "industrial", "light-manufacturing", source, settings),
		).toBe(false);
		expect(
			isEligibleLaborEdictWorker(30, true, "services", "light-manufacturing", source, settings),
		).toBe(false);
		expect(
			isEligibleLaborEdictWorker(30, true, "industrial", "other-sector", source, settings),
		).toBe(false);
	});
});
