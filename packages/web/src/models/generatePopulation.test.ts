import { beforeEach, describe, expect, it } from "vitest";
import { getFacePoolIds } from "../lib/faces";
import { buildWorldRegions } from "../lib/world";
import { hasPopulation } from "../repos/population";
import { setupMemoryStorage } from "../test/storage-driver";
import { generateAndSavePopulation } from "./generatePopulation";

const faceIds = getFacePoolIds();
const regions = buildWorldRegions(42_003);
const TEST_SIZE = 14;

beforeEach(() => {
	setupMemoryStorage();
});

describe("generateAndSavePopulation", () => {
	it("returns true when it generates a new population", async () => {
		const generated = await generateAndSavePopulation(
			faceIds,
			regions,
			TEST_SIZE,
		);
		expect(generated).toBe(true);
		expect(await hasPopulation()).toBe(true);
	});

	it("returns false without regenerating when population already exists", async () => {
		await generateAndSavePopulation(faceIds, regions, TEST_SIZE);
		expect(await hasPopulation()).toBe(true);

		const generated = await generateAndSavePopulation(
			faceIds,
			regions,
			TEST_SIZE,
		);
		expect(generated).toBe(false);
	});
});
