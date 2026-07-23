import { gameSettings } from "economy-simulator-data";
import { describe, expect, it } from "vitest";
import { getFacePoolIds } from "../lib/faces";
import { personGenerationConfig } from "../lib/person-generation";
import type { WorldRegion } from "../lib/world";
import { generatePerson } from "../models/generatePerson";
import { buildCitizenQolBreakdown } from "./citizen-qol-breakdown";

const faceIds = getFacePoolIds();

const regions: WorldRegion[] = [
	{ id: "R00", q: 0, r: 0, terrain: "plains", isCoastal: false },
];

describe("buildCitizenQolBreakdown", () => {
	it("includes resource shortfall and environment factors for employed citizens", () => {
		const person = generatePerson(
			faceIds,
			regions,
			personGenerationConfig,
			() => 0.5,
		);
		person.setCategoryId("extractive");
		person.setSubSectorId("crops");
		person.setRoleId(1);

		const breakdown = buildCitizenQolBreakdown({
			person,
			gameDay: 1,
			activeCalamities: [],
			sectorAssignments: {},
			nationalLedger: {
				resources: [],
				shortfallHappinessPenaltyBySubSector: { crops: 4 },
			},
			region: {
				id: "R00",
				name: "Heartland",
				q: 0,
				r: 0,
				terrain: "plains",
				isCoastal: false,
				resourceState: {
					reserveOrCapacityByResource: {},
					environmentQuality: 40,
				},
			},
			settings: gameSettings,
		});

		expect(breakdown.regionName).toBe("Heartland");
		expect(breakdown.factors.map((factor) => factor.id)).toEqual([
			"work",
			"fit",
			"environment",
			"shortfall",
			"calamity",
		]);
		const shortfall = breakdown.factors.find(
			(factor) => factor.id === "shortfall",
		);
		expect(shortfall?.delta).toBe(-4);
		expect(shortfall?.note).toBe("Industrial demand unmet");
	});

	it("defaults happiness and health when person stats are unset", () => {
		const person = generatePerson(
			faceIds,
			regions,
			personGenerationConfig,
			() => 0.5,
		);
		person.setOverallHappiness(undefined);
		person.setOverallHealth(undefined);
		person.setCategoryId(undefined);
		person.setSubSectorId(undefined);

		const breakdown = buildCitizenQolBreakdown({
			person,
			gameDay: 1,
			activeCalamities: [],
			sectorAssignments: {},
			nationalLedger: null,
			region: undefined,
		});

		expect(breakdown.happiness).toBe(50);
		expect(breakdown.health).toBe(50);
		expect(breakdown.jobLabel).toBe("None");
	});
});
