import { describe, expect, it } from "vitest";
import {
	getChunkIndex,
	getChunkOffset,
	getCohortForGameDay,
	getCohortForIndex,
	getCohortPosition,
	getCohortSize,
	getGlobalIndex,
} from "./population-cohorts";

describe("population cohorts", () => {
	it("maps global indices to cohorts across a week cycle", () => {
		expect(getCohortForIndex(0)).toBe(0);
		expect(getCohortForIndex(6)).toBe(6);
		expect(getCohortForIndex(7)).toBe(0);
		expect(getCohortForIndex(8)).toBe(1);
	});

	it("round-trips cohort positions", () => {
		for (const globalIndex of [0, 1, 8, 99, 1_000_000 - 1]) {
			const cohort = getCohortForIndex(globalIndex);
			const position = getCohortPosition(globalIndex);
			expect(getGlobalIndex(cohort, position)).toBe(globalIndex);
		}
	});

	it("splits one million people into seven cohorts", () => {
		const total = 1_000_000;
		const sizes = Array.from({ length: 7 }, (_, cohort) =>
			getCohortSize(cohort, total),
		);

		expect(sizes.reduce((sum, count) => sum + count, 0)).toBe(total);
		expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThanOrEqual(1);
	});

	it("maps game days to cohort update groups", () => {
		expect(getCohortForGameDay(0)).toBe(0);
		expect(getCohortForGameDay(7)).toBe(0);
		expect(getCohortForGameDay(3)).toBe(3);
	});

	it("locates a person within a chunk", () => {
		expect(getChunkIndex(0)).toBe(0);
		expect(getChunkOffset(0)).toBe(0);
		expect(getChunkIndex(5000)).toBe(1);
		expect(getChunkOffset(5000)).toBe(0);
		expect(getChunkIndex(5001)).toBe(1);
		expect(getChunkOffset(5001)).toBe(1);
	});
});
