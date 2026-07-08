import { describe, expect, it } from "vitest";
import {
	categories,
	getAllSubSectorEmploymentShares,
	getCategory,
	getSubSector,
	sectorKey,
} from "./taxonomy";

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

	it("has category employment shares that sum to 1", () => {
		const total = categories.reduce(
			(sum, category) => sum + category.employmentShare,
			0,
		);
		expect(total).toBeCloseTo(1, 5);
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

describe("getAllSubSectorEmploymentShares", () => {
	it("returns one entry per sub-sector", () => {
		expect(getAllSubSectorEmploymentShares()).toHaveLength(38);
	});

	it("sums to the total of all category employment shares", () => {
		const total = getAllSubSectorEmploymentShares().reduce(
			(sum, entry) => sum + entry.employmentShare,
			0,
		);
		expect(total).toBeCloseTo(1, 5);
	});

	it("splits a category's share evenly when all sub-sectors have equal weight", () => {
		const extractiveShares = getAllSubSectorEmploymentShares().filter(
			(entry) => entry.categoryId === "extractive",
		);
		const category = getCategory("extractive");
		expect(category).toBeDefined();

		for (const entry of extractiveShares) {
			expect(entry.employmentShare).toBeCloseTo(
				(category?.employmentShare ?? 0) / extractiveShares.length,
				10,
			);
		}
	});
});
