import {
	loadGameRunState,
	loadPlayerProfile,
	loadPopulationMeta,
	MemoryDriver,
	setStorageDriver,
} from "economy-simulator-persistence";
import { beforeEach, describe, expect, it } from "vitest";
import { getFacePoolIds } from "../data/faces";
import { buildWorldRegions } from "../data/world";
import { generateAndSavePopulation } from "../models/generatePopulation";
import { hasPopulation } from "../storage/population";
import { autoAssignAllSectors, startGame } from "./nation-setup";
import { abandonActiveRun, startNewNation } from "./new-game";

const faceIds = getFacePoolIds();
const regions = buildWorldRegions(99_001);

beforeEach(() => {
	setStorageDriver(new MemoryDriver());
});

describe("new-game", () => {
	it("startNewNation clears population and creates a setup-phase game run", async () => {
		await autoAssignAllSectors();
		await generateAndSavePopulation(faceIds, regions, 8);
		await startGame(8, faceIds, regions);

		expect(await hasPopulation()).toBe(true);

		await startNewNation(12);

		expect(await hasPopulation()).toBe(false);
		const run = await loadGameRunState();
		expect(run?.phase).toBe("setup");
		expect(run?.startingPopulation).toBe(12);
		expect(run?.status).toBe("active");
	});

	it("abandonActiveRun archives an in-progress run before reset", async () => {
		await autoAssignAllSectors();
		await startGame(6, faceIds, regions);

		const meta = await loadPopulationMeta();
		await abandonActiveRun();

		const profile = await loadPlayerProfile();
		expect(profile?.abandoned).toBe(1);
		expect(profile?.runHistory[0]?.endingPopulation).toBe(meta?.size ?? 0);

		const run = await loadGameRunState();
		expect(run?.status).toBe("abandoned");
	});
});
