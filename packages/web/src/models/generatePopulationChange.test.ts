import { gameSettings } from "economy-simulator-data";
import { describe, expect, it } from "vitest";
import { getFacePoolIds } from "../lib/faces";
import type { WorldRegion } from "../lib/world";
import {
	generateImmigrantPerson,
	generateNewbornPerson,
} from "./generatePopulationChange";

const faceIds = getFacePoolIds();
const regions: WorldRegion[] = [
	{ id: "R00", q: 0, r: 0, terrain: "plains", isCoastal: false },
	{ id: "R01", q: 1, r: 0, terrain: "mountains", isCoastal: true },
];
const regionIds = regions.map((region) => region.id);

function sequenceRandom(values: number[]): () => number {
	let index = 0;
	return () => values[index++] ?? values.at(-1) ?? 0;
}

describe("generateNewbornPerson", () => {
	it("is created at minAge with no job sector", () => {
		const newborn = generateNewbornPerson(
			faceIds,
			regions,
			undefined,
			sequenceRandom([0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]),
		);

		expect(newborn.getAge()).toBe(gameSettings.demographics.minAge);
		expect(newborn.getCategoryId()).toBeUndefined();
		expect(newborn.getSubSectorId()).toBeUndefined();
		expect(newborn.getIsAlive()).toBe(true);
		expect(regionIds).toContain(newborn.getRegionId());
	});
});

describe("generateImmigrantPerson", () => {
	it("is a working-age adult assigned to a job sector", () => {
		const immigrant = generateImmigrantPerson(
			faceIds,
			regions,
			undefined,
			sequenceRandom(Array(15).fill(0.5)),
		);

		expect(immigrant.getAge()).toBeGreaterThanOrEqual(
			gameSettings.demographics.workingAgeMin,
		);
		expect(immigrant.getAge()).toBeLessThanOrEqual(
			gameSettings.demographics.workingAgeMax,
		);
		expect(immigrant.getCategoryId()).toBeTypeOf("string");
		expect(immigrant.getSubSectorId()).toBeTypeOf("string");
		expect(immigrant.getIsAlive()).toBe(true);
		expect(regionIds).toContain(immigrant.getRegionId());
	});

	it("only assigns an extractive sub-sector viable for the immigrant's assigned region", () => {
		const onlyMountain: WorldRegion[] = [
			{ id: "R00", q: 0, r: 0, terrain: "mountains", isCoastal: false },
		];

		for (let attempt = 0; attempt < 20; attempt++) {
			const immigrant = generateImmigrantPerson(
				faceIds,
				onlyMountain,
				undefined,
				sequenceRandom([0.5, 0.5, 0.5, 0.5, 0.5, 0.5, attempt / 20]),
			);

			if (immigrant.getCategoryId() === "extractive") {
				expect(["mining", "energy", "quarrying"]).toContain(
					immigrant.getSubSectorId(),
				);
			}
		}
	});
});
