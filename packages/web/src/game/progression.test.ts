import {
	createInitialGameRunState,
	ensurePlayerProfile,
	loadGameRunState,
	loadPlayerProfile,
	MemoryDriver,
	setStorageDriver,
} from "economy-simulator-persistence";
import { beforeEach, describe, expect, it } from "vitest";
import {
	appendYearlyScore,
	archiveRunToProfile,
	finalizeGameRun,
	mergeUniqueBadges,
} from "./progression";

beforeEach(() => {
	setStorageDriver(new MemoryDriver());
});

describe("progression", () => {
	it("appendYearlyScore appends score history and merges badges", () => {
		const gameRun = createInitialGameRunState(1000);
		const score = {
			year: 1,
			total: 42,
			populationGrowth: 1,
			averageQualityOfLife: 50,
			netMigration: 0,
			resourceSufficiency: 1,
			environmentHealth: 1,
		};

		const next = appendYearlyScore(gameRun, score, ["badge_a", "badge_b"]);
		expect(next.scoreHistory).toHaveLength(1);
		expect(next.scoreHistory[0]?.total).toBe(42);
		expect(next.unlockedThisRun).toEqual(["badge_a", "badge_b"]);
	});

	it("mergeUniqueBadges deduplicates badge ids", () => {
		expect(mergeUniqueBadges(["a", "b"], ["b", "c"])).toEqual(["a", "b", "c"]);
	});

	it("archiveRunToProfile records a completed run on the player profile", async () => {
		const gameRun = {
			...createInitialGameRunState(500),
			status: "won" as const,
			phase: "active" as const,
			endedAt: 1_700_000_000_000,
			endReason: "prosperity",
			scoreHistory: [
				{
					year: 1,
					total: 80,
					populationGrowth: 1,
					averageQualityOfLife: 60,
					netMigration: 0,
					resourceSufficiency: 1,
					environmentHealth: 1,
				},
			],
		};

		await archiveRunToProfile(gameRun, 520);

		const profile = await loadPlayerProfile();
		expect(profile?.wins).toBe(1);
		expect(profile?.runHistory).toHaveLength(1);
		expect(profile?.runHistory[0]?.endingPopulation).toBe(520);
		expect(profile?.runHistory[0]?.finalScore).toBe(80);
	});

	it("archiveRunToProfile is a no-op for active runs", async () => {
		const gameRun = createInitialGameRunState(500);
		await ensurePlayerProfile();

		await archiveRunToProfile(gameRun, 500);

		const profile = await loadPlayerProfile();
		expect(profile?.runHistory).toHaveLength(0);
		expect(profile?.wins).toBe(0);
	});

	it("finalizeGameRun archives ended runs but not active ones", async () => {
		const activeRun = createInitialGameRunState(300);
		await ensurePlayerProfile();
		await finalizeGameRun(activeRun, 300);

		let profile = await loadPlayerProfile();
		expect(profile?.runHistory).toHaveLength(0);

		const lostRun = {
			...activeRun,
			status: "lost" as const,
			endedAt: Date.now(),
			endReason: "collapse",
		};
		await finalizeGameRun(lostRun, 100);

		profile = await loadPlayerProfile();
		expect(profile?.losses).toBe(1);
		expect(profile?.runHistory[0]?.status).toBe("lost");

		const saved = await loadGameRunState();
		expect(saved?.status).toBe("lost");
	});
});
