import { describe, expect, it } from "vitest";
import { createSeededRandom } from "./seeded-random";
import { shuffle, weightedPick } from "./weighted-pick";

describe("weightedPick", () => {
	it("always picks the only option with a positive weight", () => {
		const random = createSeededRandom(1);
		for (let i = 0; i < 20; i++) {
			expect(weightedPick({ a: 1 }, random)).toBe("a");
		}
	});

	it("never picks an option with a zero or missing weight", () => {
		const random = createSeededRandom(2);
		for (let i = 0; i < 200; i++) {
			expect(weightedPick({ a: 1, b: 0 }, random)).toBe("a");
		}
	});

	it("distributes picks roughly proportional to weight over many draws", () => {
		const random = createSeededRandom(3);
		const counts = { a: 0, b: 0 };
		const trials = 5000;
		for (let i = 0; i < trials; i++) {
			const pick = weightedPick({ a: 3, b: 1 }, random);
			counts[pick] += 1;
		}
		const ratio = counts.a / trials;
		expect(ratio).toBeGreaterThan(0.65);
		expect(ratio).toBeLessThan(0.85);
	});

	it("throws when given no positive weights", () => {
		const random = createSeededRandom(4);
		expect(() => weightedPick({}, random)).toThrow();
		expect(() => weightedPick({ a: 0 }, random)).toThrow();
	});

	it("is deterministic for a given seed", () => {
		const weights = { a: 1, b: 2, c: 3 };
		const randomA = createSeededRandom(99);
		const randomB = createSeededRandom(99);
		const picksA = Array.from({ length: 30 }, () =>
			weightedPick(weights, randomA),
		);
		const picksB = Array.from({ length: 30 }, () =>
			weightedPick(weights, randomB),
		);
		expect(picksA).toEqual(picksB);
	});
});

describe("shuffle", () => {
	it("returns all the same elements, in some order", () => {
		const random = createSeededRandom(5);
		const items = [1, 2, 3, 4, 5, 6, 7, 8];
		const shuffled = shuffle(items, random);
		expect([...shuffled].sort((a, b) => a - b)).toEqual(items);
	});

	it("does not mutate the input array", () => {
		const random = createSeededRandom(6);
		const items = [1, 2, 3, 4, 5];
		const original = [...items];
		shuffle(items, random);
		expect(items).toEqual(original);
	});

	it("is deterministic for a given seed", () => {
		const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
		const shuffledA = shuffle(items, createSeededRandom(123));
		const shuffledB = shuffle(items, createSeededRandom(123));
		expect(shuffledA).toEqual(shuffledB);
	});

	it("produces a different order for a different seed (statistically, not guaranteed)", () => {
		const items = Array.from({ length: 20 }, (_, i) => i);
		const shuffledA = shuffle(items, createSeededRandom(1));
		const shuffledB = shuffle(items, createSeededRandom(2));
		expect(shuffledA).not.toEqual(shuffledB);
	});
});
