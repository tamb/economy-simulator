import { describe, expect, it } from "vitest";
import { coordinateKey } from "../hex/coordinates";
import { computeCoastalTiles } from "./coastal";

describe("computeCoastalTiles", () => {
	it("treats a single-tile island as fully coastal", () => {
		const land = new Set([coordinateKey({ q: 0, r: 0 })]);
		expect(computeCoastalTiles(land)).toEqual(land);
	});

	it("marks the center of a filled 7-tile cluster as not coastal", () => {
		const center = { q: 0, r: 0 };
		const land = new Set(
			[
				center,
				{ q: 1, r: -1 },
				{ q: 1, r: 0 },
				{ q: 0, r: 1 },
				{ q: -1, r: 1 },
				{ q: -1, r: 0 },
				{ q: 0, r: -1 },
			].map(coordinateKey),
		);

		const coastal = computeCoastalTiles(land);
		expect(coastal.has(coordinateKey(center))).toBe(false);
		expect(coastal.size).toBe(6);
	});

	it("only returns keys that are members of the input land set", () => {
		const land = new Set([
			coordinateKey({ q: 0, r: 0 }),
			coordinateKey({ q: 1, r: 0 }),
		]);
		const coastal = computeCoastalTiles(land);
		for (const key of coastal) {
			expect(land.has(key)).toBe(true);
		}
	});

	it("returns an empty set for an empty island", () => {
		expect(computeCoastalTiles(new Set())).toEqual(new Set());
	});
});
