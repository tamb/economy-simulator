import {
	appConfig,
	type GameSettings,
	gameSettings,
	getEconomicSystemEffect,
} from "economy-simulator-data";
import {
	computeAnnualOutcomeForCitizen,
	computeExpectedImmigrantCount,
	getEnvironmentalQualityModifier,
} from "economy-simulator-simulation";
import localforage from "localforage";
import { getFacePoolIds, isFaceId } from "../data/faces";
import {
	formatChunkKey,
	getChunkCount,
	getChunkIndex,
	getChunkOffset,
	getCohortForGameDay,
	getCohortForIndex,
	getCohortPosition,
	getCohortSize,
	getGlobalIndex,
} from "../data/population-cohorts";
import type { RegionId } from "../data/regions";
import {
	generateImmigrantPerson,
	generateNewbornPerson,
} from "../models/generatePopulationChange";
import { Person, type PersonSnapshot } from "../models/Person";
import { updatePersonStats } from "../models/updatePersonStats";
import { loadNationalLedger, saveNationalLedger } from "./national-ledger";
import { runAnnualResourceExtraction } from "./resource-extraction";
import {
	getSectorAssignment,
	loadSectorAssignments,
} from "./sector-assignments";
import {
	ensureRegionResourceStates,
	ensureWorld,
	loadRegionResourceStates,
	saveRegionResourceStates,
	saveWorldRegions,
} from "./world";

const META_KEY = "population-meta";
const LEGACY_KEY = "population";

const store = localforage.createInstance({
	name: "economy-simulator",
	storeName: "population",
});

/** Aggregate outcome of one game year's population-dynamics cycle. */
interface AnnualCycleStats {
	year: number;
	populationBefore: number;
	populationAfter: number;
	births: number;
	deaths: number;
	emigrations: number;
	immigrations: number;
	averageQualityOfLife: number;
}

interface PopulationMeta {
	version: typeof appConfig.population.storageVersion;
	size: number;
	cohortCount: number;
	chunkSize: number;
	cohortSizes: number[];
	gameDay: number;
	/** Most recent years first isn't required; appended chronologically, capped at `appConfig.population.yearlyStatsHistoryLimit`. */
	yearlyStats?: AnnualCycleStats[];
}

function buildCohortSizes(size: number): number[] {
	return Array.from({ length: appConfig.population.cohortCount }, (_, cohort) =>
		getCohortSize(cohort, size),
	);
}

function isPersonSnapshot(value: unknown): value is PersonSnapshot {
	if (!value || typeof value !== "object") return false;

	const person = value as PersonSnapshot;
	return isFaceId(person.faceId);
}

function hydratePerson(value: PersonSnapshot): Person {
	return Person.fromSnapshot(value);
}

function isPopulationMeta(value: unknown): value is PopulationMeta {
	if (!value || typeof value !== "object") return false;

	const meta = value as PopulationMeta;
	return (
		meta.version === appConfig.population.storageVersion &&
		typeof meta.size === "number" &&
		meta.size > 0 &&
		meta.cohortCount === appConfig.population.cohortCount &&
		meta.chunkSize === appConfig.population.chunkSize &&
		Array.isArray(meta.cohortSizes) &&
		meta.cohortSizes.length === appConfig.population.cohortCount &&
		meta.cohortSizes.reduce((sum, count) => sum + count, 0) === meta.size &&
		typeof meta.gameDay === "number" &&
		meta.gameDay >= 0
	);
}

async function loadMeta(): Promise<PopulationMeta | null> {
	const saved = await store.getItem<unknown>(META_KEY);
	return isPopulationMeta(saved) ? saved : null;
}

async function saveMeta(meta: PopulationMeta): Promise<void> {
	await store.setItem(META_KEY, meta);
}

async function loadCohortChunk(
	cohort: number,
	chunkIndex: number,
): Promise<Person[] | null> {
	const saved = await store.getItem<unknown>(
		formatChunkKey(cohort, chunkIndex),
	);
	if (!Array.isArray(saved) || !saved.every(isPersonSnapshot)) {
		return null;
	}

	return saved.map(hydratePerson);
}

async function saveCohortChunk(
	cohort: number,
	chunkIndex: number,
	people: Person[],
): Promise<void> {
	await store.setItem(
		formatChunkKey(cohort, chunkIndex),
		people.map((person) => person.toSnapshot()),
	);
}

async function clearLegacyPopulation(): Promise<void> {
	await store.removeItem(LEGACY_KEY);
}

async function clearPopulationData(): Promise<void> {
	const meta = await loadMeta();
	if (meta) {
		for (let cohort = 0; cohort < meta.cohortCount; cohort++) {
			const chunkCount = getChunkCount(meta.cohortSizes[cohort] ?? 0);
			for (let chunkIndex = 0; chunkIndex < chunkCount; chunkIndex++) {
				await store.removeItem(formatChunkKey(cohort, chunkIndex));
			}
		}
	}

	await store.removeItem(META_KEY);
	await clearLegacyPopulation();
}

async function hasPopulation(): Promise<boolean> {
	const meta = await loadMeta();
	if (!meta) return false;

	for (let cohort = 0; cohort < meta.cohortCount; cohort++) {
		const chunk = await loadCohortChunk(cohort, 0);
		if (!chunk) return false;
	}

	return true;
}

async function loadPopulationMeta(): Promise<PopulationMeta | null> {
	return loadMeta();
}

async function getPerson(globalIndex: number): Promise<Person | null> {
	const meta = await loadMeta();
	if (!meta || globalIndex < 0 || globalIndex >= meta.size) {
		return null;
	}

	const cohort = getCohortForIndex(globalIndex);
	const cohortPosition = getCohortPosition(globalIndex);
	const chunkIndex = getChunkIndex(cohortPosition);
	const chunkOffset = getChunkOffset(cohortPosition);
	const chunk = await loadCohortChunk(cohort, chunkIndex);

	return chunk?.[chunkOffset] ?? null;
}

async function getPersonRange(start: number, count: number): Promise<Person[]> {
	const meta = await loadMeta();
	if (!meta || count <= 0 || start >= meta.size) {
		return [];
	}

	const end = Math.min(start + count, meta.size);
	const results: Person[] = [];

	for (let globalIndex = start; globalIndex < end; globalIndex++) {
		const person = await getPerson(globalIndex);
		if (person) {
			results.push(person);
		}
	}

	return results;
}

/** Load contiguous persons efficiently by reading whole chunks when possible. */
async function getPersonRangeBatched(
	start: number,
	count: number,
): Promise<Person[]> {
	const meta = await loadMeta();
	if (!meta || count <= 0 || start >= meta.size) {
		return [];
	}

	const end = Math.min(start + count, meta.size);
	const results: Person[] = new Array(end - start);
	let writeIndex = 0;

	for (let globalIndex = start; globalIndex < end; ) {
		const cohort = getCohortForIndex(globalIndex);
		const cohortPosition = getCohortPosition(globalIndex);
		const chunkIndex = getChunkIndex(cohortPosition);
		const chunkOffset = getChunkOffset(cohortPosition);
		const chunk = await loadCohortChunk(cohort, chunkIndex);

		if (!chunk) break;

		const availableInChunk = chunk.length - chunkOffset;
		const remaining = end - globalIndex;
		const take = Math.min(availableInChunk, remaining);

		for (let offset = 0; offset < take; offset++) {
			results[writeIndex] = chunk[chunkOffset + offset] as Person;
			writeIndex += 1;
		}

		globalIndex += take;
	}

	return results.slice(0, writeIndex);
}

async function savePopulationChunk(
	cohort: number,
	chunkIndex: number,
	people: Person[],
): Promise<void> {
	await saveCohortChunk(cohort, chunkIndex, people);
}

async function finalizePopulationMeta(
	size: number,
	gameDay = 0,
): Promise<PopulationMeta> {
	const meta: PopulationMeta = {
		version: appConfig.population.storageVersion,
		size,
		cohortCount: appConfig.population.cohortCount,
		chunkSize: appConfig.population.chunkSize,
		cohortSizes: buildCohortSizes(size),
		gameDay,
	};

	await saveMeta(meta);
	await clearLegacyPopulation();
	return meta;
}

type RandomFn = () => number;

/** Rewrite the entire population into fresh cohort chunks, assigning new global indices by array order. */
async function rewritePopulationChunks(people: Person[]): Promise<void> {
	const { cohortCount, chunkSize } = appConfig.population;
	const cohortBuffers: Person[][] = Array.from(
		{ length: cohortCount },
		() => [],
	);
	const cohortChunkIndexes: number[] = Array.from(
		{ length: cohortCount },
		() => 0,
	);

	async function flushCohort(cohort: number): Promise<void> {
		const buffer = cohortBuffers[cohort];
		if (!buffer || buffer.length === 0) return;

		await saveCohortChunk(cohort, cohortChunkIndexes[cohort] ?? 0, buffer);
		cohortBuffers[cohort] = [];
		cohortChunkIndexes[cohort] = (cohortChunkIndexes[cohort] ?? 0) + 1;
	}

	for (let index = 0; index < people.length; index++) {
		const person = people[index];
		if (!person) continue;

		const cohort = index % cohortCount;
		person.setIndex(index);
		cohortBuffers[cohort]?.push(person);

		if ((cohortBuffers[cohort]?.length ?? 0) >= chunkSize) {
			await flushCohort(cohort);
		}
	}

	for (let cohort = 0; cohort < cohortCount; cohort++) {
		await flushCohort(cohort);
	}
}

/** Remove chunk records left over from a previous, larger population size. */
async function clearStaleChunks(
	previousMeta: PopulationMeta,
	nextCohortSizes: number[],
): Promise<void> {
	for (let cohort = 0; cohort < previousMeta.cohortCount; cohort++) {
		const previousChunkCount = getChunkCount(
			previousMeta.cohortSizes[cohort] ?? 0,
		);
		const nextChunkCount = getChunkCount(nextCohortSizes[cohort] ?? 0);

		for (
			let chunkIndex = nextChunkCount;
			chunkIndex < previousChunkCount;
			chunkIndex++
		) {
			await store.removeItem(formatChunkKey(cohort, chunkIndex));
		}
	}
}

/**
 * Runs one game year's population-dynamics cycle across the entire stored
 * population: age-and-sex mortality (modulated by health), fertility for
 * childbearing-age women (modulated by happiness), emigration for
 * sustained-low-QoL citizens, and immigration scaled to national average
 * QoL. See `research/life-and-demographics.md` for the sourced baselines.
 */
async function runAnnualCycle(
	onProgress?: (processed: number, total: number) => void,
	random: RandomFn = Math.random,
	settings: GameSettings = gameSettings,
): Promise<AnnualCycleStats | null> {
	const meta = await loadMeta();
	if (!meta) return null;

	const regions = await ensureWorld(random);
	const resourceStates = await ensureRegionResourceStates(regions);
	const sectorAssignments = await loadSectorAssignments();

	const survivors: Person[] = [];
	let births = 0;
	let deaths = 0;
	let emigrations = 0;
	let happinessTotal = 0;
	let healthTotal = 0;
	let livingCount = 0;
	let processed = 0;
	const extractiveWorkersByRegionAndSubSector: Record<
		RegionId,
		Record<string, number>
	> = {};
	const industrialWorkersBySubSector: Record<string, number> = {};

	function trackWorker(person: Person): void {
		const categoryId = person.getCategoryId();
		const subSectorId = person.getSubSectorId();
		if (!subSectorId) return;

		if (categoryId === "extractive") {
			const regionId = person.getRegionId();
			if (!regionId) return;
			if (!extractiveWorkersByRegionAndSubSector[regionId]) {
				extractiveWorkersByRegionAndSubSector[regionId] = {};
			}
			const bySubSector = extractiveWorkersByRegionAndSubSector[regionId];
			bySubSector[subSectorId] = (bySubSector[subSectorId] ?? 0) + 1;
		} else if (categoryId === "industrial") {
			industrialWorkersBySubSector[subSectorId] =
				(industrialWorkersBySubSector[subSectorId] ?? 0) + 1;
		}
	}

	for (let cohort = 0; cohort < meta.cohortCount; cohort++) {
		const chunkCount = getChunkCount(meta.cohortSizes[cohort] ?? 0);

		for (let chunkIndex = 0; chunkIndex < chunkCount; chunkIndex++) {
			const chunk = await loadCohortChunk(cohort, chunkIndex);
			if (!chunk) continue;

			for (const person of chunk) {
				if (!person?.isLiving()) continue;

				const happiness = person.getOverallHappiness() ?? 50;
				const health = person.getOverallHealth() ?? 50;
				happinessTotal += happiness;
				healthTotal += health;
				livingCount += 1;
				trackWorker(person);

				const age = Math.min(
					settings.demographics.maxAge,
					(person.getAge() ?? settings.demographics.minAge) + 1,
				);
				const sex = person.getSex() ?? "F";

				const outcome = computeAnnualOutcomeForCitizen(
					{ age, sex, happiness, health },
					random,
					settings,
				);

				processed += 1;
				onProgress?.(processed, meta.size);

				if (outcome.died) {
					deaths += 1;
					continue;
				}

				if (outcome.emigrated) {
					emigrations += 1;
					continue;
				}

				person.setAge(age);
				survivors.push(person);
				if (outcome.gaveBirth) {
					births += 1;
				}
			}
		}
	}

	const averageQualityOfLife =
		livingCount > 0 ? (happinessTotal + healthTotal) / (livingCount * 2) : 50;

	const immigrations = computeExpectedImmigrantCount(
		{
			currentPopulationSize: survivors.length,
			nationalAverageQualityOfLife: averageQualityOfLife,
		},
		random,
		settings,
	);

	const faceIds = getFacePoolIds();
	const newborns = Array.from({ length: births }, () =>
		generateNewbornPerson(faceIds, regions, undefined, random),
	);
	const immigrants = Array.from({ length: immigrations }, () =>
		generateImmigrantPerson(faceIds, regions, undefined, random),
	);

	const finalPopulation = [...survivors, ...newborns, ...immigrants];
	const nextCohortSizes = buildCohortSizes(finalPopulation.length);

	await rewritePopulationChunks(finalPopulation);
	await clearStaleChunks(meta, nextCohortSizes);

	const extraction = runAnnualResourceExtraction({
		regions,
		resourceStates,
		extractiveWorkersByRegionAndSubSector,
		industrialWorkersBySubSector,
		sectorAssignments,
		settings,
	});
	await saveWorldRegions(extraction.regions);
	await saveRegionResourceStates(extraction.resourceStates);
	await saveNationalLedger(extraction.ledger);

	const stats: AnnualCycleStats = {
		year: Math.floor(meta.gameDay / settings.calendar.daysPerYear),
		populationBefore: meta.size,
		populationAfter: finalPopulation.length,
		births,
		deaths,
		emigrations,
		immigrations,
		averageQualityOfLife,
	};

	const yearlyStats = [...(meta.yearlyStats ?? []), stats].slice(
		-appConfig.population.yearlyStatsHistoryLimit,
	);

	const nextMeta: PopulationMeta = {
		version: appConfig.population.storageVersion,
		size: finalPopulation.length,
		cohortCount: appConfig.population.cohortCount,
		chunkSize: appConfig.population.chunkSize,
		cohortSizes: nextCohortSizes,
		gameDay: meta.gameDay,
		yearlyStats,
	};
	await saveMeta(nextMeta);

	return stats;
}

async function advanceGameDay(
	onProgress?: (updated: number, total: number) => void,
	onAnnualProgress?: (processed: number, total: number) => void,
	random: RandomFn = Math.random,
	settings: GameSettings = gameSettings,
): Promise<PopulationMeta | null> {
	const meta = await loadMeta();
	if (!meta) return null;

	const cohort = getCohortForGameDay(meta.gameDay);
	const cohortSize = meta.cohortSizes[cohort] ?? 0;
	const chunkCount = getChunkCount(cohortSize);
	let updated = 0;

	const sectorAssignments = await loadSectorAssignments();
	const resourceStates = (await loadRegionResourceStates()) ?? {};
	const nationalLedger = await loadNationalLedger();

	for (let chunkIndex = 0; chunkIndex < chunkCount; chunkIndex++) {
		const chunk = await loadCohortChunk(cohort, chunkIndex);
		if (!chunk) continue;

		for (let offset = 0; offset < chunk.length; offset++) {
			const person = chunk[offset];
			if (!person) continue;

			const categoryId = person.getCategoryId();
			const subSectorId = person.getSubSectorId();
			const economicSystemId =
				categoryId && subSectorId
					? getSectorAssignment(sectorAssignments, categoryId, subSectorId)
					: null;
			const economicSystemEffect = economicSystemId
				? getEconomicSystemEffect(economicSystemId)
				: undefined;
			const regionId = person.getRegionId();
			const regionResourceState = regionId
				? resourceStates[regionId]
				: undefined;

			updatePersonStats(person, random, settings, {
				economicSystemMoraleMultiplier: economicSystemEffect?.moraleMultiplier,
				environmentalQualityModifier: regionResourceState
					? getEnvironmentalQualityModifier(
							regionResourceState.environmentQuality,
							settings,
						)
					: undefined,
				resourceShortfallHappinessPenalty: subSectorId
					? nationalLedger?.shortfallHappinessPenaltyBySubSector[subSectorId]
					: undefined,
			});
			person.setIndex(
				getGlobalIndex(
					cohort,
					chunkIndex * appConfig.population.chunkSize + offset,
				),
			);
			updated += 1;
			onProgress?.(updated, cohortSize);
		}

		await saveCohortChunk(cohort, chunkIndex, chunk);
	}

	const nextGameDay = meta.gameDay + 1;
	const completedFullYear = nextGameDay % settings.calendar.daysPerYear === 0;

	if (completedFullYear) {
		await saveMeta({ ...meta, gameDay: nextGameDay });
		await runAnnualCycle(onAnnualProgress, random, settings);
		return loadMeta();
	}

	const nextMeta: PopulationMeta = {
		...meta,
		gameDay: nextGameDay,
	};
	await saveMeta(nextMeta);
	return nextMeta;
}

async function clearPopulation(): Promise<void> {
	await clearPopulationData();
}

/** Per-region population aggregate for the country map. */
interface RegionStats {
	population: number;
	averageHappiness: number;
	averageHealth: number;
}

/**
 * Walk every stored chunk once and aggregate population, average happiness,
 * and average health per region for the country map. Reads chunk-by-chunk
 * (same access pattern as `runAnnualCycle`) so a 1,000,000-person population
 * doesn't need to be held in memory at once.
 */
async function computeRegionStats(
	onProgress?: (processed: number, total: number) => void,
): Promise<Map<string, RegionStats>> {
	const meta = await loadMeta();
	const totals = new Map<
		string,
		{ population: number; happiness: number; health: number }
	>();
	if (!meta) return new Map();

	let processed = 0;

	for (let cohort = 0; cohort < meta.cohortCount; cohort++) {
		const chunkCount = getChunkCount(meta.cohortSizes[cohort] ?? 0);

		for (let chunkIndex = 0; chunkIndex < chunkCount; chunkIndex++) {
			const chunk = await loadCohortChunk(cohort, chunkIndex);
			if (!chunk) continue;

			for (const person of chunk) {
				if (!person?.isLiving()) continue;

				const regionId = person.getRegionId();
				processed += 1;
				onProgress?.(processed, meta.size);
				if (!regionId) continue;

				const entry = totals.get(regionId) ?? {
					population: 0,
					happiness: 0,
					health: 0,
				};
				entry.population += 1;
				entry.happiness += person.getOverallHappiness() ?? 50;
				entry.health += person.getOverallHealth() ?? 50;
				totals.set(regionId, entry);
			}
		}
	}

	const stats = new Map<string, RegionStats>();
	for (const [regionId, entry] of totals) {
		stats.set(regionId, {
			population: entry.population,
			averageHappiness: entry.happiness / entry.population,
			averageHealth: entry.health / entry.population,
		});
	}

	return stats;
}

/** One 10-year age band's living-population count, split by sex, for the age-sex pyramid. */
interface AgeSexBucket {
	label: string;
	male: number;
	female: number;
}

/** One value-range bucket's living-population count, for happiness/health histograms. */
interface HistogramBucket {
	label: string;
	count: number;
}

interface DemographicStats {
	ageSexPyramid: AgeSexBucket[];
	happinessHistogram: HistogramBucket[];
	healthHistogram: HistogramBucket[];
}

const AGE_BUCKET_SIZE = 10;
const VALUE_BUCKET_SIZE = 10;

function bucketStart(
	value: number,
	bucketSize: number,
	maxValue: number,
): number {
	const bounded = Math.min(Math.max(value, 0), maxValue);
	return Math.floor(bounded / bucketSize) * bucketSize;
}

function bucketLabel(start: number, bucketSize: number): string {
	return `${start}-${start + bucketSize - 1}`;
}

function buildBucketLabels(maxValue: number, bucketSize: number): string[] {
	const labels: string[] = [];
	for (let start = 0; start <= maxValue; start += bucketSize) {
		labels.push(bucketLabel(start, bucketSize));
	}
	return labels;
}

/**
 * Walk every stored chunk once and aggregate an age-sex pyramid plus
 * happiness/health histograms for the population dashboard. Same
 * chunk-by-chunk access pattern as `computeRegionStats` so it stays memory-
 * bounded for a 1,000,000-person population.
 */
async function computeDemographicStats(
	onProgress?: (processed: number, total: number) => void,
	settings: GameSettings = gameSettings,
): Promise<DemographicStats> {
	const meta = await loadMeta();
	const maxAge = settings.demographics.maxAge;

	const ageLabels = buildBucketLabels(maxAge, AGE_BUCKET_SIZE);
	const valueLabels = buildBucketLabels(
		100 - VALUE_BUCKET_SIZE,
		VALUE_BUCKET_SIZE,
	);

	const ageSexPyramid: AgeSexBucket[] = ageLabels.map((label) => ({
		label,
		male: 0,
		female: 0,
	}));
	const happinessHistogram: HistogramBucket[] = valueLabels.map((label) => ({
		label,
		count: 0,
	}));
	const healthHistogram: HistogramBucket[] = valueLabels.map((label) => ({
		label,
		count: 0,
	}));

	if (!meta) {
		return { ageSexPyramid, happinessHistogram, healthHistogram };
	}

	const ageBucketByLabel = new Map(
		ageSexPyramid.map((bucket, index) => [bucket.label, index]),
	);
	const happinessBucketByLabel = new Map(
		happinessHistogram.map((bucket, index) => [bucket.label, index]),
	);
	const healthBucketByLabel = new Map(
		healthHistogram.map((bucket, index) => [bucket.label, index]),
	);

	let processed = 0;

	for (let cohort = 0; cohort < meta.cohortCount; cohort++) {
		const chunkCount = getChunkCount(meta.cohortSizes[cohort] ?? 0);

		for (let chunkIndex = 0; chunkIndex < chunkCount; chunkIndex++) {
			const chunk = await loadCohortChunk(cohort, chunkIndex);
			if (!chunk) continue;

			for (const person of chunk) {
				if (!person?.isLiving()) continue;

				processed += 1;
				onProgress?.(processed, meta.size);

				const age = person.getAge() ?? 0;
				const ageLabel = bucketLabel(
					bucketStart(age, AGE_BUCKET_SIZE, maxAge),
					AGE_BUCKET_SIZE,
				);
				const ageIndex = ageBucketByLabel.get(ageLabel);
				if (ageIndex !== undefined) {
					const bucket = ageSexPyramid[ageIndex];
					if (bucket) {
						if (person.getSex() === "M") bucket.male += 1;
						else bucket.female += 1;
					}
				}

				const happiness = person.getOverallHappiness() ?? 50;
				const happinessLabel = bucketLabel(
					bucketStart(happiness, VALUE_BUCKET_SIZE, 100 - VALUE_BUCKET_SIZE),
					VALUE_BUCKET_SIZE,
				);
				const happinessIndex = happinessBucketByLabel.get(happinessLabel);
				if (happinessIndex !== undefined) {
					const bucket = happinessHistogram[happinessIndex];
					if (bucket) bucket.count += 1;
				}

				const health = person.getOverallHealth() ?? 50;
				const healthLabel = bucketLabel(
					bucketStart(health, VALUE_BUCKET_SIZE, 100 - VALUE_BUCKET_SIZE),
					VALUE_BUCKET_SIZE,
				);
				const healthIndex = healthBucketByLabel.get(healthLabel);
				if (healthIndex !== undefined) {
					const bucket = healthHistogram[healthIndex];
					if (bucket) bucket.count += 1;
				}
			}
		}
	}

	return { ageSexPyramid, happinessHistogram, healthHistogram };
}

/** Per-sub-sector employment aggregate for the economic sectors dashboard. */
interface SectorStats {
	categoryId: string;
	subSectorId: string;
	population: number;
	averageHappiness: number;
}

/**
 * Walk every stored chunk once and aggregate population and average
 * happiness per sub-sector for the economic sectors dashboard. Citizens with
 * no assigned sector (children, retirees) are excluded.
 */
async function computeSectorStats(
	onProgress?: (processed: number, total: number) => void,
): Promise<Map<string, SectorStats>> {
	const meta = await loadMeta();
	const totals = new Map<
		string,
		{
			categoryId: string;
			subSectorId: string;
			population: number;
			happiness: number;
		}
	>();
	if (!meta) return new Map();

	let processed = 0;

	for (let cohort = 0; cohort < meta.cohortCount; cohort++) {
		const chunkCount = getChunkCount(meta.cohortSizes[cohort] ?? 0);

		for (let chunkIndex = 0; chunkIndex < chunkCount; chunkIndex++) {
			const chunk = await loadCohortChunk(cohort, chunkIndex);
			if (!chunk) continue;

			for (const person of chunk) {
				if (!person?.isLiving()) continue;

				processed += 1;
				onProgress?.(processed, meta.size);

				const categoryId = person.getCategoryId();
				const subSectorId = person.getSubSectorId();
				if (!categoryId || !subSectorId) continue;

				const key = `${categoryId}/${subSectorId}`;
				const entry = totals.get(key) ?? {
					categoryId,
					subSectorId,
					population: 0,
					happiness: 0,
				};
				entry.population += 1;
				entry.happiness += person.getOverallHappiness() ?? 50;
				totals.set(key, entry);
			}
		}
	}

	const stats = new Map<string, SectorStats>();
	for (const [key, entry] of totals) {
		stats.set(key, {
			categoryId: entry.categoryId,
			subSectorId: entry.subSectorId,
			population: entry.population,
			averageHappiness: entry.happiness / entry.population,
		});
	}

	return stats;
}

export type {
	AgeSexBucket,
	AnnualCycleStats,
	DemographicStats,
	HistogramBucket,
	PopulationMeta,
	RegionStats,
	SectorStats,
};
export {
	advanceGameDay,
	clearPopulation,
	computeDemographicStats,
	computeRegionStats,
	computeSectorStats,
	finalizePopulationMeta,
	getPerson,
	getPersonRange,
	getPersonRangeBatched,
	hasPopulation,
	loadPopulationMeta,
	runAnnualCycle,
	savePopulationChunk,
};
