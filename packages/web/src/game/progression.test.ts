import {
	createInitialGameRunState,
	createInitialWinLoseStreaks,
	loadGameRunState,
	loadPlayerProfile,
} from "economy-simulator-persistence";
import { beforeEach, describe, expect, it } from "vitest";
import { setupMemoryStorage } from "../test/storage-driver";
import {
	appendYearlyScore,
	archiveRunToProfile,
	finalizeGameRun,
	mergeUniqueBadges,
} from "./progression";

beforeEach(() => {
	setupMemoryStorage();
});

describe("mergeUniqueBadges", () => {
	it("deduplicates badge ids while preserving order", () => {
		expect(mergeUniqueBadges(["a", "b"], ["b", "c"])).toEqual(["a", "b", "c"]);
	});
});

describe("appendYearlyScore", () => {
	it("appends score history and merges run badges", () => {
		const gameRun = createInitialGameRunState(100);
		const next = appendYearlyScore(
			gameRun,
			{
				year: 1,
				total: 42,
				populationGrowth: 1,
				averageQualityOfLife: 60,
				netMigration: 0,
				resourceSufficiency: 70,
				environmentHealth: 80,
			},
			["first_census", "first_census"],
		);

		expect(next.scoreHistory).toHaveLength(1);
		expect(next.scoreHistory[0]?.total).toBe(42);
		expect(next.unlockedThisRun).toEqual(["first_census"]);
	});
});

describe("archiveRunToProfile", () => {
	it("no-ops while the run is still active", async () => {
		const active = createInitialGameRunState(50);
		const result = await archiveRunToProfile(active, 50);

		expect(result).toBe(active);
		expect(await loadPlayerProfile()).toBeNull();
	});

	it("records a won run, score totals, and end-run badges on the profile", async () => {
		const won = {
			...createInitialGameRunState(100),
			status: "won" as const,
			endReason: "prosperity_sustained",
			endedAt: 1_700_000_000_000,
			scoreHistory: [
				{
					year: 1,
					total: 88,
					populationGrowth: 2,
					averageQualityOfLife: 75,
					netMigration: 1,
					resourceSufficiency: 80,
					environmentHealth: 85,
				},
			],
			unlockedThisRun: ["first_census"],
			streaks: createInitialWinLoseStreaks(),
		};

		await archiveRunToProfile(won, 120);

		const profile = await loadPlayerProfile();
		expect(profile?.wins).toBe(1);
		expect(profile?.losses).toBe(0);
		expect(profile?.bestScore).toBe(88);
		expect(profile?.totalYearsRuled).toBe(1);
		expect(profile?.runHistory[0]).toMatchObject({
			status: "won",
			startingPopulation: 100,
			endingPopulation: 120,
			yearsPlayed: 1,
			finalScore: 88,
			endReason: "prosperity_sustained",
		});
		expect(profile?.unlockedBadges.map((badge) => badge.id)).toEqual(
			expect.arrayContaining(["monarch_emeritus", "first_census"]),
		);
	});

	it("records a lost run with the mass-exodus badge when applicable", async () => {
		const lost = {
			...createInitialGameRunState(80),
			status: "lost" as const,
			endReason: "mass_exodus",
			endedAt: 1_700_000_000_001,
			scoreHistory: [
				{
					year: 3,
					total: 12,
					populationGrowth: -5,
					averageQualityOfLife: 30,
					netMigration: -4,
					resourceSufficiency: 20,
					environmentHealth: 25,
				},
			],
			unlockedThisRun: [],
			streaks: createInitialWinLoseStreaks(),
		};

		await archiveRunToProfile(lost, 10);

		const profile = await loadPlayerProfile();
		expect(profile?.losses).toBe(1);
		expect(profile?.runHistory[0]?.status).toBe("lost");
		expect(profile?.unlockedBadges.map((badge) => badge.id)).toContain(
			"exodus",
		);
	});
});

describe("finalizeGameRun", () => {
	it("persists the run and archives it when the run has ended", async () => {
		const ended = {
			...createInitialGameRunState(60),
			status: "won" as const,
			endReason: "long_reign",
			endedAt: 1_700_000_000_002,
			scoreHistory: [
				{
					year: 10,
					total: 95,
					populationGrowth: 0,
					averageQualityOfLife: 80,
					netMigration: 0,
					resourceSufficiency: 90,
					environmentHealth: 92,
				},
			],
			unlockedThisRun: [],
			streaks: createInitialWinLoseStreaks(),
		};

		await finalizeGameRun(ended, 65);

		const saved = await loadGameRunState();
		expect(saved?.status).toBe("won");
		expect((await loadPlayerProfile())?.wins).toBe(1);
	});

	it("persists an active run without touching the player profile", async () => {
		const active = createInitialGameRunState(40);

		await finalizeGameRun(active, 40);

		expect((await loadGameRunState())?.status).toBe("active");
		expect(await loadPlayerProfile()).toBeNull();
	});
});
