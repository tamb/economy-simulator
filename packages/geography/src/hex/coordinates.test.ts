import { describe, expect, it } from "vitest";
import {
	coordinateKey,
	generateBoundingGridCoordinates,
	getAxialNeighbors,
	HEX_NEIGHBOR_OFFSETS,
	parseCoordinateKey,
} from "./coordinates";

describe("coordinateKey / parseCoordinateKey", () => {
	it("round-trips a coordinate through its key", () => {
		const coordinate = { q: -3, r: 5 };
		expect(parseCoordinateKey(coordinateKey(coordinate))).toEqual(coordinate);
	});

	it("produces a unique key per distinct coordinate", () => {
		const a = coordinateKey({ q: 1, r: 2 });
		const b = coordinateKey({ q: 2, r: 1 });
		expect(a).not.toBe(b);
	});

	it("throws on a malformed key", () => {
		expect(() => parseCoordinateKey("not-a-key")).toThrow();
	});
});

describe("getAxialNeighbors", () => {
	it("returns exactly 6 neighbors", () => {
		expect(getAxialNeighbors({ q: 0, r: 0 })).toHaveLength(6);
	});

	it("matches the 6 documented neighbor offsets applied to the origin", () => {
		const neighbors = getAxialNeighbors({ q: 0, r: 0 });
		expect(neighbors).toEqual(HEX_NEIGHBOR_OFFSETS);
	});

	it("offsets correctly from a non-origin coordinate", () => {
		const neighbors = getAxialNeighbors({ q: 2, r: -1 });
		expect(neighbors).toContainEqual({ q: 3, r: -2 });
		expect(neighbors).toContainEqual({ q: 2, r: 0 });
	});
});

describe("generateBoundingGridCoordinates", () => {
	it("returns the hexagonal-number count of coordinates for a given radius", () => {
		for (const radius of [0, 1, 2, 4, 7]) {
			const coordinates = generateBoundingGridCoordinates(radius);
			expect(coordinates).toHaveLength(1 + 3 * radius * (radius + 1));
		}
	});

	it("always includes the origin", () => {
		const coordinates = generateBoundingGridCoordinates(3);
		expect(coordinates).toContainEqual({ q: 0, r: 0 });
	});

	it("produces only unique coordinates", () => {
		const coordinates = generateBoundingGridCoordinates(5);
		const keys = coordinates.map(coordinateKey);
		expect(new Set(keys).size).toBe(coordinates.length);
	});

	it("is deterministic", () => {
		expect(generateBoundingGridCoordinates(4)).toEqual(
			generateBoundingGridCoordinates(4),
		);
	});
});
