import { describe, expect, it } from "vitest";
import { getViableExtractiveSubSectorIds } from "./viable-sub-sectors";

describe("getViableExtractiveSubSectorIds", () => {
	it("returns the sub-sectors for every resource a biome yields", () => {
		const ids = getViableExtractiveSubSectorIds("plains", false);
		expect(ids).toContain("agriculture");
		expect(ids).toContain("livestock");
	});

	it("includes multiple sub-sectors for a rich biome", () => {
		const ids = getViableExtractiveSubSectorIds("mountains", false);
		expect(ids).toContain("mining");
		expect(ids).toContain("energy");
		expect(ids).toContain("quarrying");
	});

	it("returns an empty list for barren desert with no coastal access", () => {
		expect(getViableExtractiveSubSectorIds("desert", false)).toEqual([]);
	});

	it("adds fishing on a coastal land tile regardless of biome", () => {
		expect(getViableExtractiveSubSectorIds("desert", true)).toEqual([
			"fishing",
		]);
		expect(getViableExtractiveSubSectorIds("mountains", true)).toContain(
			"fishing",
		);
	});

	it("never adds fishing on a non-coastal tile", () => {
		expect(getViableExtractiveSubSectorIds("plains", false)).not.toContain(
			"fishing",
		);
	});

	it("returns an empty list for ocean terrain", () => {
		expect(getViableExtractiveSubSectorIds("ocean", false)).toEqual([]);
	});

	it("returns no sub-sectors for a fully degraded barren rock tile", () => {
		expect(getViableExtractiveSubSectorIds("barrenRock", false)).toEqual([]);
	});

	it("returns crops only for cleared land", () => {
		expect(getViableExtractiveSubSectorIds("clearedLand", false)).toEqual([
			"agriculture",
		]);
	});
});
