import { appConfig } from "economy-simulator-data";
import {
	createInitialGameRunState,
	ensureGameRunState,
	loadGameRunState,
	loadPopulationMeta,
	saveGameRunState,
	savePopulationMeta,
} from "economy-simulator-persistence";
import { beforeEach, describe, expect, it } from "vitest";
import { setupMemoryStorage } from "../test/storage-driver";
import { abandonActiveRun, startNewNation } from "./new-game";

beforeEach(() => {
	setupMemoryStorage();
});

describe("abandonActiveRun", () => {
	it("archives an active run and marks it abandoned", async () => {
		const active = createInitialGameRunState(25);
		await saveGameRunState(active);
		await savePopulationMeta({
			version: 1,
			size: 25,
			cohortCount: 7,
			chunkSize: 100,
			cohortSizes: [4, 4, 4, 4, 3, 3, 3],
			gameDay: 12,
		});

		await abandonActiveRun();

		const saved = await loadGameRunState();
		expect(saved?.status).toBe("abandoned");
		expect(saved?.endReason).toBe("abandoned");
	});

	it("does nothing when there is no active run to abandon", async () => {
		await abandonActiveRun();
		expect(await loadGameRunState()).toBeNull();
	});
});

describe("startNewNation", () => {
	it("resets nation stores and creates a fresh active game run", async () => {
		await ensureGameRunState(10);
		await savePopulationMeta({
			version: 1,
			size: 10,
			cohortCount: 7,
			chunkSize: 100,
			cohortSizes: [2, 2, 2, 1, 1, 1, 1],
			gameDay: 99,
		});

		await startNewNation(50, appConfig.regions.boundingRadius);

		expect(await loadPopulationMeta()).toBeNull();
		const gameRun = await loadGameRunState();
		expect(gameRun?.status).toBe("active");
		expect(gameRun?.startingPopulation).toBe(50);
		expect(gameRun?.boundingRadius).toBe(appConfig.regions.boundingRadius);
		expect(gameRun?.scoreHistory).toEqual([]);
	});

	it("stores the chosen bounding radius on the fresh game run", async () => {
		await startNewNation(100, 3);
		const gameRun = await loadGameRunState();
		expect(gameRun?.boundingRadius).toBe(3);
		expect(gameRun?.startingPopulation).toBe(100);
	});
});
