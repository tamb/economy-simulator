import { describe, expect, it } from "vitest";
import {
	formatRegionId,
	generateRegionCoordinates,
	getHexLayout,
	getRegionCount,
	getRegionIds,
	isRegionId,
} from "./regions";

describe("formatRegionId / isRegionId", () => {
	it("formats zero-padded ids", () => {
		expect(formatRegionId(0)).toBe("R00");
		expect(formatRegionId(7)).toBe("R07");
		expect(formatRegionId(42)).toBe("R42");
	});

	it("recognizes valid region ids and rejects invalid ones", () => {
		expect(isRegionId("R00")).toBe(true);
		expect(isRegionId("R123")).toBe(true);
		expect(isRegionId("00")).toBe(false);
		expect(isRegionId("Rxx")).toBe(false);
		expect(isRegionId(42)).toBe(false);
	});
});

describe("getRegionCount", () => {
	it("matches the hexagon-number formula for a given radius", () => {
		expect(getRegionCount(0)).toBe(1);
		expect(getRegionCount(1)).toBe(7);
		expect(getRegionCount(2)).toBe(19);
		expect(getRegionCount(4)).toBe(61);
	});
});

describe("getRegionIds", () => {
	it("returns exactly getRegionCount() unique, well-formed ids", () => {
		const ids = getRegionIds(3);
		expect(ids).toHaveLength(getRegionCount(3));
		expect(new Set(ids).size).toBe(ids.length);
		expect(ids.every(isRegionId)).toBe(true);
	});
});

describe("generateRegionCoordinates", () => {
	it("produces exactly getRegionCount() coordinates for a radius", () => {
		const coordinates = generateRegionCoordinates(2);
		expect(coordinates).toHaveLength(getRegionCount(2));
	});

	it("includes the origin region at axial coordinates (0, 0)", () => {
		const coordinates = generateRegionCoordinates(2);
		expect(coordinates[0]).toEqual({ id: "R00", q: 0, r: 0 });
	});

	it("produces unique axial coordinates for every region", () => {
		const coordinates = generateRegionCoordinates(3);
		const keys = coordinates.map(
			(coordinate) => `${coordinate.q},${coordinate.r}`,
		);
		expect(new Set(keys).size).toBe(coordinates.length);
	});

	it("is deterministic across calls for the same radius", () => {
		const first = generateRegionCoordinates(2);
		const second = generateRegionCoordinates(2);
		expect(first).toEqual(second);
	});
});

describe("getHexLayout", () => {
	it("places the origin hex at pixel (0, 0)", () => {
		const layout = getHexLayout(0, 0);
		expect(layout.x).toBe(0);
		expect(layout.y).toBe(0);
	});

	it("returns exactly six corner points", () => {
		const layout = getHexLayout(1, -1);
		expect(layout.corners).toHaveLength(6);
	});

	it("gives neighboring axial coordinates distinct pixel centers", () => {
		const origin = getHexLayout(0, 0);
		const neighbor = getHexLayout(1, 0);
		expect(neighbor.x).not.toBe(origin.x);
	});
});
