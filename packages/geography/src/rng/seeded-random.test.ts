import { describe, expect, it } from "vitest";
import { createSeededRandom } from "./seeded-random";

describe("createSeededRandom", () => {
	it("produces the same sequence for the same seed", () => {
		const a = createSeededRandom(42);
		const b = createSeededRandom(42);

		const sequenceA = Array.from({ length: 20 }, () => a());
		const sequenceB = Array.from({ length: 20 }, () => b());

		expect(sequenceA).toEqual(sequenceB);
	});

	it("produces a different sequence for a different seed", () => {
		const a = createSeededRandom(1);
		const b = createSeededRandom(2);

		const sequenceA = Array.from({ length: 20 }, () => a());
		const sequenceB = Array.from({ length: 20 }, () => b());

		expect(sequenceA).not.toEqual(sequenceB);
	});

	it("always returns a float in [0, 1)", () => {
		const random = createSeededRandom(12345);
		for (let i = 0; i < 1000; i++) {
			const value = random();
			expect(value).toBeGreaterThanOrEqual(0);
			expect(value).toBeLessThan(1);
		}
	});

	it("does not repeat within a long run (basic sanity, not a rigorous PRNG audit)", () => {
		const random = createSeededRandom(7);
		const values = Array.from({ length: 500 }, () => random());
		expect(new Set(values).size).toBe(values.length);
	});
});
