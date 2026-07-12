import { describe, expect, it } from "vitest";
import { categories, getCategory, getSubSector, sectorKey } from "./taxonomy";

describe("taxonomy", () => {
	it("defines five top-level categories", () => {
		expect(categories).toHaveLength(5);
	});

	it("contains 38 sub-sectors total", () => {
		const total = categories.reduce(
			(sum, category) => sum + category.subSectors.length,
			0,
		);
		expect(total).toBe(38);
	});

	it("looks up categories and sub-sectors by id", () => {
		const category = getCategory("services");
		expect(category?.label).toBe("Tertiary (Services)");

		const sector = getSubSector("services", "healthcare");
		expect(sector?.label).toBe("Healthcare");
	});

	it("builds stable sector keys", () => {
		expect(sectorKey("extractive", "agriculture")).toBe(
			"extractive/agriculture",
		);
	});

	it("returns undefined for unknown ids", () => {
		expect(getCategory("invalid" as "extractive")).toBeUndefined();
		expect(getSubSector("services", "unknown-sector")).toBeUndefined();
	});
});
