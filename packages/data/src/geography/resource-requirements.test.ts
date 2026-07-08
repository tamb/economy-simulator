import { describe, expect, it } from "vitest";
import { getCategory } from "../economy/taxonomy";
import {
	getResourceRequirement,
	resourceRequirements,
} from "./resource-requirements";
import { resources } from "./resources";

describe("resourceRequirements", () => {
	it("defines a requirement for every industrial sub-sector", () => {
		const industrial = getCategory("industrial");
		expect(industrial).toBeDefined();
		expect(resourceRequirements).toHaveLength(
			industrial?.subSectors.length ?? 0,
		);

		for (const subSector of industrial?.subSectors ?? []) {
			expect(getResourceRequirement(subSector.id)).toBeDefined();
		}
	});

	it("only references known resource ids as inputs", () => {
		const knownResourceIds = new Set(resources.map((resource) => resource.id));
		for (const requirement of resourceRequirements) {
			expect(Object.keys(requirement.inputs).length).toBeGreaterThan(0);
			for (const resourceId of Object.keys(requirement.inputs)) {
				expect(knownResourceIds.has(resourceId as never)).toBe(true);
			}
		}
	});

	it("keeps every input amount positive", () => {
		for (const requirement of resourceRequirements) {
			for (const amount of Object.values(requirement.inputs)) {
				expect(amount).toBeGreaterThan(0);
			}
		}
	});

	it("looks up a requirement by sub-sector id", () => {
		expect(getResourceRequirement("construction")?.inputs.stone).toBe(0.8);
	});

	it("returns undefined for a non-industrial sub-sector", () => {
		expect(getResourceRequirement("agriculture")).toBeUndefined();
	});
});
