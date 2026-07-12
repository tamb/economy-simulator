import { describe, expect, it } from "vitest";
import type { WorldRegion } from "../lib/world";
import { runAnnualResourceExtraction } from "./resource-extraction";
import type { RegionResourceState } from "./world";

function region(overrides: Partial<WorldRegion> & { id: string }): WorldRegion {
	return {
		q: 0,
		r: 0,
		terrain: "plains",
		isCoastal: false,
		...overrides,
	};
}

function freshResourceState(): RegionResourceState {
	return { reserveOrCapacityByResource: {}, environmentQuality: 100 };
}

describe("runAnnualResourceExtraction", () => {
	it("produces zero output and no environment change for a region with no workers", () => {
		const regions = [region({ id: "R00", terrain: "forest" })];
		const result = runAnnualResourceExtraction({
			regions,
			resourceStates: { R00: freshResourceState() },
			extractiveWorkersByRegionAndSubSector: {},
			industrialWorkersBySubSector: {},
			sectorAssignments: {},
		});

		expect(result.ledger.resources).toHaveLength(0);
		expect(result.resourceStates.R00?.environmentQuality).toBe(100);
		expect(result.regions[0]?.terrain).toBe("forest");
	});

	it("produces timber output for a worked forest region and depletes environment quality", () => {
		const regions = [region({ id: "R00", terrain: "forest" })];
		const result = runAnnualResourceExtraction({
			regions,
			resourceStates: { R00: freshResourceState() },
			extractiveWorkersByRegionAndSubSector: {
				R00: { forestry: 10 },
			},
			industrialWorkersBySubSector: {},
			sectorAssignments: {},
		});

		const timberEntry = result.ledger.resources.find(
			(entry) => entry.resourceId === "timber",
		);
		expect(timberEntry?.production).toBeGreaterThan(0);
		expect(result.resourceStates.R00?.environmentQuality).toBeLessThan(100);
	});

	it("recovers environment quality for a region that goes unworked", () => {
		const regions = [region({ id: "R00", terrain: "forest" })];
		const result = runAnnualResourceExtraction({
			regions,
			resourceStates: {
				R00: { reserveOrCapacityByResource: {}, environmentQuality: 50 },
			},
			extractiveWorkersByRegionAndSubSector: {},
			industrialWorkersBySubSector: {},
			sectorAssignments: {},
		});

		expect(result.resourceStates.R00?.environmentQuality).toBeGreaterThan(50);
	});

	it("depletes a finite resource's reserve fraction under heavy extraction", () => {
		const regions = [region({ id: "R00", terrain: "mountains" })];
		const result = runAnnualResourceExtraction({
			regions,
			resourceStates: { R00: freshResourceState() },
			extractiveWorkersByRegionAndSubSector: {
				R00: { mining: 20 },
			},
			industrialWorkersBySubSector: {},
			sectorAssignments: {},
		});

		expect(
			result.resourceStates.R00?.reserveOrCapacityByResource.metalOre,
		).toBeLessThan(1);
	});

	it("degrades terrain once a finite resource is driven to exhaustion over many years", () => {
		let regions = [region({ id: "R00", terrain: "mountains" })];
		let resourceStates: Record<string, RegionResourceState> = {
			R00: freshResourceState(),
		};

		for (let year = 0; year < 200; year++) {
			const result = runAnnualResourceExtraction({
				regions,
				resourceStates,
				extractiveWorkersByRegionAndSubSector: { R00: { mining: 40 } },
				industrialWorkersBySubSector: {},
				sectorAssignments: {},
			});
			regions = result.regions;
			resourceStates = result.resourceStates;
			if (regions[0]?.terrain === "barrenRock") break;
		}

		expect(regions[0]?.terrain).toBe("barrenRock");
	});

	it("applies an economic system's efficiency multiplier to extraction output", () => {
		const regions = [region({ id: "R00", terrain: "forest" })];

		const withoutSystem = runAnnualResourceExtraction({
			regions,
			resourceStates: { R00: freshResourceState() },
			extractiveWorkersByRegionAndSubSector: { R00: { forestry: 10 } },
			industrialWorkersBySubSector: {},
			sectorAssignments: {},
		});

		const withCapitalism = runAnnualResourceExtraction({
			regions,
			resourceStates: { R00: freshResourceState() },
			extractiveWorkersByRegionAndSubSector: { R00: { forestry: 10 } },
			industrialWorkersBySubSector: {},
			sectorAssignments: { "extractive/forestry": "capitalism" },
		});

		const baseline = withoutSystem.ledger.resources.find(
			(entry) => entry.resourceId === "timber",
		)?.production;
		const boosted = withCapitalism.ledger.resources.find(
			(entry) => entry.resourceId === "timber",
		)?.production;

		expect(boosted).toBeGreaterThan(baseline ?? 0);
	});

	it("computes ledger sufficiency for industrial demand against national production", () => {
		const regions = [region({ id: "R00", terrain: "mountains" })];
		const result = runAnnualResourceExtraction({
			regions,
			resourceStates: { R00: freshResourceState() },
			extractiveWorkersByRegionAndSubSector: { R00: { mining: 10 } },
			industrialWorkersBySubSector: { "heavy-industry": 100 },
			sectorAssignments: {},
		});

		const metalOreEntry = result.ledger.resources.find(
			(entry) => entry.resourceId === "metalOre",
		);
		expect(metalOreEntry?.demand).toBeGreaterThan(0);
		expect(
			result.ledger.shortfallHappinessPenaltyBySubSector["heavy-industry"],
		).toBeGreaterThan(0);
	});

	it("gives fishing yield to a coastal region regardless of biome", () => {
		const regions = [region({ id: "R00", terrain: "desert", isCoastal: true })];
		const result = runAnnualResourceExtraction({
			regions,
			resourceStates: { R00: freshResourceState() },
			extractiveWorkersByRegionAndSubSector: { R00: { fishing: 5 } },
			industrialWorkersBySubSector: {},
			sectorAssignments: {},
		});

		const fishEntry = result.ledger.resources.find(
			(entry) => entry.resourceId === "fish",
		);
		expect(fishEntry?.production).toBeGreaterThan(0);
	});

	it("leaves an ocean region with no viable extraction at all", () => {
		const regions = [region({ id: "R00", terrain: "ocean" })];
		const result = runAnnualResourceExtraction({
			regions,
			resourceStates: { R00: freshResourceState() },
			extractiveWorkersByRegionAndSubSector: { R00: { fishing: 5 } },
			industrialWorkersBySubSector: {},
			sectorAssignments: {},
		});

		expect(result.ledger.resources).toHaveLength(0);
	});
});
