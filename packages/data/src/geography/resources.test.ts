import { describe, expect, it } from "vitest";
import { getCategory } from "../economy/taxonomy";
import { getResource, getResourceForSubSector, resources } from "./resources";

describe("resources", () => {
	it("defines exactly one resource per extractive sub-sector", () => {
		const extractive = getCategory("extractive");
		expect(extractive).toBeDefined();
		expect(resources).toHaveLength(extractive?.subSectors.length ?? 0);

		for (const subSector of extractive?.subSectors ?? []) {
			expect(getResourceForSubSector(subSector.id)).toBeDefined();
		}
	});

	it("has a unique id and subSectorId per resource", () => {
		const ids = resources.map((resource) => resource.id);
		const subSectorIds = resources.map((resource) => resource.subSectorId);
		expect(new Set(ids).size).toBe(ids.length);
		expect(new Set(subSectorIds).size).toBe(subSectorIds.length);
	});

	it("keeps environmentalImpact within 0-1", () => {
		for (const resource of resources) {
			expect(resource.environmentalImpact).toBeGreaterThan(0);
			expect(resource.environmentalImpact).toBeLessThanOrEqual(1);
		}
	});

	it("marks the finite minerals/fuels as non-renewable and the rest as renewable", () => {
		const finite = ["metalOre", "fossilFuels", "stone"];
		for (const resource of resources) {
			expect(resource.renewable).toBe(!finite.includes(resource.id));
		}
	});

	it("looks up a resource by id", () => {
		expect(getResource("crops")?.subSectorId).toBe("agriculture");
	});

	it("looks up a resource by sub-sector id", () => {
		expect(getResourceForSubSector("fishing")?.id).toBe("fish");
	});

	it("returns undefined for an unknown sub-sector", () => {
		expect(getResourceForSubSector("not-a-sub-sector")).toBeUndefined();
	});
});
