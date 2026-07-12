import { loadPopulationChunkRaw } from "economy-simulator-persistence";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { setupMemoryStorage } from "../test/storage-driver";

vi.mock("economy-simulator-simulation", async (importOriginal) => {
	const actual =
		await importOriginal<typeof import("economy-simulator-simulation")>();
	return {
		...actual,
		computeAnnualOutcomeForCitizen: vi.fn(
			actual.computeAnnualOutcomeForCitizen,
		),
		computeExpectedImmigrantCount: vi.fn(actual.computeExpectedImmigrantCount),
	};
});

import { gameSettings } from "economy-simulator-data";
import {
	createInitialGameRunState,
	saveGameRunState,
} from "economy-simulator-persistence";
import {
	computeAnnualOutcomeForCitizen,
	computeExpectedImmigrantCount,
} from "economy-simulator-simulation";
import { getFacePoolIds } from "../data/faces";
import { formatChunkKey } from "../data/population-cohorts";
import { buildWorldRegions } from "../data/world";
import {
	generateAndSavePopulation,
	loadEntirePopulationForTests,
} from "../models/generatePopulation";
import { Person, type PersonSnapshot } from "../models/Person";
import {
	advanceGameDay,
	buildPopulationDirectory,
	computeDemographicStats,
	computeRegionStats,
	computeSectorStats,
	getPeopleByIndices,
	getPerson,
	getPersonRangeBatched,
	hasPopulation,
	loadPopulationMeta,
	runAnnualCycle,
} from "./population";

const faceIds = getFacePoolIds();
const testRegions = buildWorldRegions(42_001);
const TEST_SIZE = 14;

beforeEach(() => {
	setupMemoryStorage();
	vi.clearAllMocks();
});

describe("population storage", () => {
	it("generates, stores, and reads citizens by cohort chunks", async () => {
		await generateAndSavePopulation(faceIds, testRegions, TEST_SIZE, undefined);

		expect(await hasPopulation()).toBe(true);

		const meta = await loadPopulationMeta();
		expect(meta?.size).toBe(TEST_SIZE);
		expect(meta?.gameDay).toBe(0);

		const first = await getPerson(0);
		const last = await getPerson(TEST_SIZE - 1);
		expect(first?.getFaceId()).toBeTypeOf("string");
		expect(first?.getIndex()).toBe(0);
		expect(first?.getAge()).toBeGreaterThanOrEqual(
			gameSettings.demographics.minAge,
		);
		expect(first?.getAge()).toBeLessThanOrEqual(
			gameSettings.demographics.maxAge,
		);
		expect(first?.isLiving()).toBe(true);
		expect(last?.getIndex()).toBe(TEST_SIZE - 1);

		const range = await getPersonRangeBatched(0, TEST_SIZE);
		expect(range).toHaveLength(TEST_SIZE);
	});

	it("persists citizens as snapshots and hydrates them on read", async () => {
		await generateAndSavePopulation(faceIds, testRegions, TEST_SIZE, undefined);

		const chunkKey = formatChunkKey(0, 0);
		const storedChunk = await loadPopulationChunkRaw(chunkKey);
		expect(Array.isArray(storedChunk)).toBe(true);
		expect(storedChunk?.[0]).not.toHaveProperty("getAge");

		const person = await getPerson(0);
		expect(person?.getAge).toBeTypeOf("function");
	});

	it("updates one cohort per game day", async () => {
		await generateAndSavePopulation(faceIds, testRegions, TEST_SIZE, undefined);

		const cohortOneBefore = await getPerson(1);

		const meta = await advanceGameDay();
		expect(meta?.meta?.gameDay).toBe(1);

		const cohortOneAfter = await getPerson(1);
		expect(cohortOneAfter?.getOverallHealth()).toBe(
			cohortOneBefore?.getOverallHealth(),
		);
		expect(cohortOneAfter?.getOverallHappiness()).toBe(
			cohortOneBefore?.getOverallHappiness(),
		);
	});

	it("does not change age during a daily cohort tick", async () => {
		await generateAndSavePopulation(faceIds, testRegions, TEST_SIZE, undefined);

		const before = await getPerson(1);
		const beforeAge = before?.getAge();

		await advanceGameDay();

		const after = await getPerson(1);
		expect(after?.getAge()).toBe(beforeAge);
	});

	it("loads the full population for tests via chunk walking", async () => {
		await generateAndSavePopulation(faceIds, testRegions, TEST_SIZE, undefined);

		const people = await loadEntirePopulationForTests(
			async (cohort, chunkIndex) => {
				const saved = await loadPopulationChunkRaw(
					formatChunkKey(cohort, chunkIndex),
				);
				if (!saved) return null;

				return saved.map((item) => Person.fromSnapshot(item as PersonSnapshot));
			},
			TEST_SIZE,
		);

		expect(people).toHaveLength(TEST_SIZE);
		expect(people[0]?.getIndex()).toBe(0);
	});

	it("builds a compact directory covering every citizen", async () => {
		await generateAndSavePopulation(faceIds, testRegions, TEST_SIZE, undefined);

		const directory = await buildPopulationDirectory();
		expect(directory).toHaveLength(TEST_SIZE);
		expect(directory.every((entry) => entry.name.length > 0)).toBe(true);
		expect(new Set(directory.map((entry) => entry.index)).size).toBe(TEST_SIZE);
	});

	it("hydrates people by arbitrary indices in request order", async () => {
		await generateAndSavePopulation(faceIds, testRegions, TEST_SIZE, undefined);

		const people = await getPeopleByIndices([3, 0, 3, 99]);
		expect(people).toHaveLength(4);
		expect(people[0]?.getIndex()).toBe(3);
		expect(people[1]?.getIndex()).toBe(0);
		expect(people[2]?.getIndex()).toBe(3);
		expect(people[3]).toBeNull();
	});
});

describe("runAnnualCycle", () => {
	it("keeps population size unchanged when no one dies, emigrates, is born, or immigrates", async () => {
		await generateAndSavePopulation(faceIds, testRegions, TEST_SIZE, undefined);

		vi.mocked(computeAnnualOutcomeForCitizen).mockReturnValue({
			died: false,
			emigrated: false,
			gaveBirth: false,
		});
		vi.mocked(computeExpectedImmigrantCount).mockReturnValue(0);

		const stats = await runAnnualCycle();

		expect(stats?.births).toBe(0);
		expect(stats?.deaths).toBe(0);
		expect(stats?.emigrations).toBe(0);
		expect(stats?.immigrations).toBe(0);
		expect(stats?.populationBefore).toBe(TEST_SIZE);
		expect(stats?.populationAfter).toBe(TEST_SIZE);

		const meta = await loadPopulationMeta();
		expect(meta?.size).toBe(TEST_SIZE);
	});

	it("removes citizens who die or emigrate and adds a newborn for a citizen who gives birth", async () => {
		await generateAndSavePopulation(faceIds, testRegions, TEST_SIZE, undefined);

		let callCount = 0;
		vi.mocked(computeAnnualOutcomeForCitizen).mockImplementation(() => {
			callCount += 1;
			if (callCount === 1)
				return { died: true, emigrated: false, gaveBirth: false };
			if (callCount === 2)
				return { died: false, emigrated: true, gaveBirth: false };
			if (callCount === 3)
				return { died: false, emigrated: false, gaveBirth: true };
			return { died: false, emigrated: false, gaveBirth: false };
		});
		vi.mocked(computeExpectedImmigrantCount).mockReturnValue(0);

		const stats = await runAnnualCycle();

		expect(stats?.deaths).toBe(1);
		expect(stats?.emigrations).toBe(1);
		expect(stats?.births).toBe(1);
		expect(stats?.populationBefore).toBe(TEST_SIZE);
		expect(stats?.populationAfter).toBe(TEST_SIZE - 1);

		const meta = await loadPopulationMeta();
		expect(meta?.size).toBe(TEST_SIZE - 1);

		// Global indices are reassigned 0..N-1 after the rewrite.
		const last = await getPerson(TEST_SIZE - 2);
		expect(last?.getIndex()).toBe(TEST_SIZE - 2);
		expect(await getPerson(TEST_SIZE - 1)).toBeNull();
	});

	it("adds immigrants based on the computed expected immigrant count", async () => {
		await generateAndSavePopulation(faceIds, testRegions, TEST_SIZE, undefined);

		vi.mocked(computeAnnualOutcomeForCitizen).mockReturnValue({
			died: false,
			emigrated: false,
			gaveBirth: false,
		});
		vi.mocked(computeExpectedImmigrantCount).mockReturnValue(3);

		const stats = await runAnnualCycle();

		expect(stats?.immigrations).toBe(3);
		expect(stats?.populationAfter).toBe(TEST_SIZE + 3);

		const meta = await loadPopulationMeta();
		expect(meta?.size).toBe(TEST_SIZE + 3);
	});

	it("records the cycle's stats in PopulationMeta.yearlyStats", async () => {
		await generateAndSavePopulation(faceIds, testRegions, TEST_SIZE, undefined);

		vi.mocked(computeAnnualOutcomeForCitizen).mockReturnValue({
			died: false,
			emigrated: false,
			gaveBirth: false,
		});
		vi.mocked(computeExpectedImmigrantCount).mockReturnValue(0);

		const stats = await runAnnualCycle();
		const meta = await loadPopulationMeta();

		expect(meta?.yearlyStats).toHaveLength(1);
		expect(meta?.yearlyStats?.[0]).toEqual(stats);
	});

	it("returns null when there is no stored population", async () => {
		const stats = await runAnnualCycle();
		expect(stats).toBeNull();
	});
});

describe("setup phase gating", () => {
	it("does not advance the simulation while the game run is still in setup phase", async () => {
		await generateAndSavePopulation(faceIds, testRegions, TEST_SIZE, undefined);

		const setupRun = createInitialGameRunState(TEST_SIZE);
		await saveGameRunState(setupRun);

		const metaBefore = await loadPopulationMeta();
		const result = await advanceGameDay();

		expect(result?.gameDay).toBe(metaBefore?.gameDay);
		expect(result?.size).toBe(metaBefore?.size);
	});

	it("returns null from runAnnualCycle while the game run is still in setup phase", async () => {
		await generateAndSavePopulation(faceIds, testRegions, TEST_SIZE, undefined);
		await saveGameRunState(createInitialGameRunState(TEST_SIZE));

		const stats = await runAnnualCycle();

		expect(stats).toBeNull();
	});

	it("advances the simulation once the game run enters the active phase", async () => {
		await generateAndSavePopulation(faceIds, testRegions, TEST_SIZE, undefined);

		const activeRun = {
			...createInitialGameRunState(TEST_SIZE),
			phase: "active" as const,
		};
		await saveGameRunState(activeRun);

		const result = await advanceGameDay();

		expect(result?.gameDay).toBe(1);
	});
});

describe("advanceGameDay year-boundary trigger", () => {
	it("automatically runs the annual cycle once a full game year of days has elapsed", async () => {
		await generateAndSavePopulation(faceIds, testRegions, TEST_SIZE, undefined);

		vi.mocked(computeAnnualOutcomeForCitizen).mockReturnValue({
			died: false,
			emigrated: false,
			gaveBirth: false,
		});
		vi.mocked(computeExpectedImmigrantCount).mockReturnValue(2);

		const shortYearSettings = {
			...gameSettings,
			calendar: { ...gameSettings.calendar, daysPerYear: 2 },
		};

		await advanceGameDay(undefined, undefined, Math.random, shortYearSettings);
		expect(computeExpectedImmigrantCount).not.toHaveBeenCalled();

		const meta = await advanceGameDay(
			undefined,
			undefined,
			Math.random,
			shortYearSettings,
		);

		expect(computeExpectedImmigrantCount).toHaveBeenCalledTimes(1);
		expect(meta.meta?.gameDay).toBe(2);
		expect(meta.meta?.size).toBe(TEST_SIZE + 2);
		expect(meta.meta?.yearlyStats).toHaveLength(1);
	});
});

describe("computeRegionStats", () => {
	it("aggregates population, happiness, and health per region", async () => {
		await generateAndSavePopulation(faceIds, testRegions, TEST_SIZE, undefined);

		const stats = await computeRegionStats();

		let totalFromRegions = 0;
		for (const regionStats of stats.values()) {
			expect(regionStats.population).toBeGreaterThan(0);
			expect(regionStats.averageHappiness).toBeGreaterThanOrEqual(0);
			expect(regionStats.averageHealth).toBeGreaterThanOrEqual(0);
			totalFromRegions += regionStats.population;
		}

		expect(totalFromRegions).toBe(TEST_SIZE);
	});

	it("reports progress and returns an empty map when there is no population", async () => {
		const stats = await computeRegionStats();
		expect(stats.size).toBe(0);
	});
});

describe("computeDemographicStats", () => {
	it("aggregates the age-sex pyramid and happiness/health histograms", async () => {
		await generateAndSavePopulation(faceIds, testRegions, TEST_SIZE, undefined);

		const stats = await computeDemographicStats();

		const pyramidTotal = stats.ageSexPyramid.reduce(
			(sum, bucket) => sum + bucket.male + bucket.female,
			0,
		);
		const happinessTotal = stats.happinessHistogram.reduce(
			(sum, bucket) => sum + bucket.count,
			0,
		);
		const healthTotal = stats.healthHistogram.reduce(
			(sum, bucket) => sum + bucket.count,
			0,
		);

		expect(pyramidTotal).toBe(TEST_SIZE);
		expect(happinessTotal).toBe(TEST_SIZE);
		expect(healthTotal).toBe(TEST_SIZE);
		expect(stats.ageSexPyramid.length).toBeGreaterThan(0);
		expect(stats.happinessHistogram.length).toBe(10);
		expect(stats.healthHistogram.length).toBe(10);
	});

	it("returns zeroed buckets when there is no stored population", async () => {
		const stats = await computeDemographicStats();

		expect(stats.happinessHistogram.every((bucket) => bucket.count === 0)).toBe(
			true,
		);
		expect(
			stats.ageSexPyramid.every((b) => b.male === 0 && b.female === 0),
		).toBe(true);
	});
});

describe("computeSectorStats", () => {
	it("aggregates population and average happiness per assigned sub-sector", async () => {
		await generateAndSavePopulation(faceIds, testRegions, TEST_SIZE, undefined);

		const stats = await computeSectorStats();

		let totalEmployed = 0;
		for (const entry of stats.values()) {
			expect(entry.population).toBeGreaterThan(0);
			expect(entry.averageHappiness).toBeGreaterThanOrEqual(0);
			totalEmployed += entry.population;
		}

		expect(totalEmployed).toBeGreaterThan(0);
		expect(totalEmployed).toBeLessThanOrEqual(TEST_SIZE);
	});

	it("returns an empty map when there is no stored population", async () => {
		const stats = await computeSectorStats();
		expect(stats.size).toBe(0);
	});
});

describe("generateAndSavePopulation", () => {
	it("reports generation progress", async () => {
		const progress: number[] = [];

		await generateAndSavePopulation(faceIds, testRegions, 120, (loaded) => {
			progress.push(loaded);
		});

		expect(progress.at(-1)).toBe(120);
		expect(await hasPopulation()).toBe(true);
	});
});
