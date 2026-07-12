import { isLand } from "economy-simulator-data";
import { describe, expect, it } from "vitest";
import { generateRegionCoordinates, getRegionCount } from "./regions";
import { buildWorldRegions } from "./world";

describe("buildWorldRegions", () => {
	it("returns exactly one WorldRegion per grid coordinate, matching existing region ids", () => {
		const regions = buildWorldRegions(1);
		expect(regions).toHaveLength(getRegionCount());
		const expectedIds = new Set(generateRegionCoordinates().map((c) => c.id));
		expect(new Set(regions.map((r) => r.id))).toEqual(expectedIds);
	});

	it("preserves each region's existing (q, r) coordinate", () => {
		const regions = buildWorldRegions(1);
		const coordinates = generateRegionCoordinates();
		for (const coordinate of coordinates) {
			const region = regions.find((r) => r.id === coordinate.id);
			expect(region?.q).toBe(coordinate.q);
			expect(region?.r).toBe(coordinate.r);
		}
	});

	it("has both land and ocean regions", () => {
		const regions = buildWorldRegions(2);
		expect(regions.some((region) => isLand(region.terrain))).toBe(true);
		expect(regions.some((region) => region.terrain === "ocean")).toBe(true);
	});

	it("marks the origin region as land", () => {
		const regions = buildWorldRegions(3);
		const origin = regions.find((region) => region.q === 0 && region.r === 0);
		expect(origin).toBeDefined();
		expect(isLand(origin?.terrain ?? "ocean")).toBe(true);
	});

	it("is deterministic for the same seed", () => {
		expect(buildWorldRegions(42)).toEqual(buildWorldRegions(42));
	});

	it("produces a different world for a different seed", () => {
		expect(buildWorldRegions(1)).not.toEqual(buildWorldRegions(2));
	});

	it("only marks land regions as coastal or overlay-bearing", () => {
		const regions = buildWorldRegions(4);
		for (const region of regions) {
			if (region.isCoastal || region.resourceOverlay) {
				expect(isLand(region.terrain)).toBe(true);
			}
		}
	});

	it("honors an explicit bounding radius", () => {
		expect(buildWorldRegions(1, 3)).toHaveLength(getRegionCount(3));
		expect(buildWorldRegions(1, 5)).toHaveLength(getRegionCount(5));
		expect(buildWorldRegions(1, 3).length).toBeLessThan(
			buildWorldRegions(1, 5).length,
		);
	});
});
