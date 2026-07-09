import {
	appConfig,
	type GameSettings,
	gameSettings,
	getEconomicSystemEffect,
	sectorKey,
} from "economy-simulator-data";
import {
	type AnnualCycleStats,
	clearLegacyPopulationKey,
	ensureGameRunState,
	loadGameRunState,
	loadPopulationChunkRaw,
	loadPopulationMeta as loadPopulationMetaRepo,
	type PopulationMeta,
	removePopulationKey,
	saveGameRunState,
	savePopulationChunkRaw,
	savePopulationMeta as savePopulationMetaRepo,
} from "economy-simulator-persistence";
import {
	computeAnnualOutcomeForCitizen,
	computeExpectedImmigrantCount,
	computeNationScore,
	evaluateRunBadges,
	evaluateWinLose,
	getCalamityExtractionEfficiency,
	getCalamityModifiersForCitizen,
	getEnvironmentalQualityModifier,
	getRoleModifiersForCitizen,
	isWorkingAge,
	processCalamitiesForDay,
	syncEmploymentWithAge,
	syncRoleWithAge,
} from "economy-simulator-simulation";
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
import type { PopulationDirectoryEntry } from "../data/population-directory";
import type { RegionId } from "../data/regions";
import {
	applyCalamityMutations,
	buildCalamityRegionInputs,
	getYearCalamityBumps,
	mergeCalamityRunSlice,
	toCalamityRunSlice,
} from "../game/calamity-effects";
import { appendYearlyScore, finalizeGameRun } from "../game/progression";
import { getViableExtractiveSubSectorIdsForRegion } from "../models/generatePerson";
import {
	generateImmigrantPerson,
	generateNewbornPerson,
} from "../models/generatePopulationChange";
import { Person, type PersonSnapshot } from "../models/Person";
import { updatePersonStats } from "../models/updatePersonStats";
import {
	loadNationalLedger,
	saveNationalLedger,
} from "../storage/national-ledger";
import { runAnnualResourceExtraction } from "../storage/resource-extraction";
import {
	getSectorAssignment,
	loadSectorAssignments,
} from "../storage/sector-assignments";
import { loadSectorRoleConfigs } from "../storage/sector-role-config";
import {
	ensureRegionResourceStates,
	ensureWorld,
	saveRegionResourceStates,
	saveWorldRegions,
} from "../storage/world";

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

async function loadMeta(): Promise<PopulationMeta | null> {
	return loadPopulationMetaRepo();
}

async function saveMeta(meta: PopulationMeta): Promise<void> {
	await savePopulationMetaRepo(meta);
}

async function loadCohortChunk(
	cohort: number,
	chunkIndex: number,
): Promise<Person[] | null> {
	const saved = await loadPopulationChunkRaw(
		formatChunkKey(cohort, chunkIndex),
	);
	if (!saved?.every(isPersonSnapshot)) {
		return null;
	}
	return saved.map(hydratePerson);
}

async function saveCohortChunk(
	cohort: number,
	chunkIndex: number,
	people: Person[],
): Promise<void> {
	await savePopulationChunkRaw(
		formatChunkKey(cohort, chunkIndex),
		people.map((person) => person.toSnapshot()),
	);
}

async function clearPopulationData(): Promise<void> {
	const meta = await loadMeta();
	if (meta) {
		for (let cohort = 0; cohort < meta.cohortCount; cohort++) {
			const chunkCount = getChunkCount(meta.cohortSizes[cohort] ?? 0);
			for (let chunkIndex = 0; chunkIndex < chunkCount; chunkIndex++) {
				await removePopulationKey(formatChunkKey(cohort, chunkIndex));
			}
		}
	}
	await removePopulationKey("population-meta");
	await clearLegacyPopulationKey();
}

function computeAverageEnvironmentQuality(
	resourceStates: Record<string, { environmentQuality: number }>,
): number {
	const values = Object.values(resourceStates).map(
		(state) => state.environmentQuality,
	);
	if (values.length === 0) return 100;
	return values.reduce((sum, value) => sum + value, 0) / values.length;
}

type RandomFn = () => number;

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
			await removePopulationKey(formatChunkKey(cohort, chunkIndex));
		}
	}
}

async function processProgressionAfterYear(
	stats: AnnualCycleStats,
	ledger: Awaited<ReturnType<typeof loadNationalLedger>>,
	resourceStates: Record<string, { environmentQuality: number }>,
	settings: GameSettings,
): Promise<void> {
	const meta = await loadMeta();
	if (!meta) return;

	let gameRun = await ensureGameRunState(meta.size);
	if (gameRun.status !== "active") return;

	const averageEnvironmentQuality =
		computeAverageEnvironmentQuality(resourceStates);

	const scoreBreakdown = computeNationScore({
		year: stats.year,
		populationBefore: stats.populationBefore,
		populationAfter: stats.populationAfter,
		births: stats.births,
		deaths: stats.deaths,
		emigrations: stats.emigrations,
		immigrations: stats.immigrations,
		averageQualityOfLife: stats.averageQualityOfLife,
		ledger,
		averageEnvironmentQuality,
		settings,
	});

	const evaluation = evaluateWinLose({
		year: stats.year,
		populationAfter: stats.populationAfter,
		startingPopulation: gameRun.startingPopulation,
		averageQualityOfLife: stats.averageQualityOfLife,
		emigrations: stats.emigrations,
		immigrations: stats.immigrations,
		score: scoreBreakdown,
		streaks: gameRun.streaks,
		settings,
	});

	gameRun = { ...gameRun, streaks: evaluation.streaks };

	const runBadges = evaluateRunBadges({
		year: stats.year,
		births: stats.births,
		deaths: stats.deaths,
		immigrations: stats.immigrations,
		emigrations: stats.emigrations,
		score: scoreBreakdown,
		netImmigrationPositiveStreak: gameRun.streaks.netImmigrationPositive,
	});

	gameRun = appendYearlyScore(
		gameRun,
		{
			year: scoreBreakdown.year,
			total: scoreBreakdown.total,
			populationGrowth: scoreBreakdown.populationGrowth,
			averageQualityOfLife: scoreBreakdown.averageQualityOfLife,
			netMigration: scoreBreakdown.netMigration,
			resourceSufficiency: scoreBreakdown.resourceSufficiency,
			environmentHealth: scoreBreakdown.environmentHealth,
		},
		runBadges,
	);

	if (evaluation.status !== "active") {
		gameRun = {
			...gameRun,
			status: evaluation.status,
			endReason: evaluation.reason,
			endedAt: Date.now(),
		};
	}

	await finalizeGameRun(gameRun, stats.populationAfter);
}

async function runAnnualCycle(
	onProgress?: (processed: number, total: number) => void,
	random: RandomFn = Math.random,
	settings: GameSettings = gameSettings,
): Promise<AnnualCycleStats | null> {
	const meta = await loadMeta();
	if (!meta) return null;

	const gameRun = await loadGameRunState();
	if (gameRun && (gameRun.status !== "active" || gameRun.phase !== "active")) {
		return null;
	}

	const regions = await ensureWorld(random);
	const resourceStates = await ensureRegionResourceStates(regions);
	const sectorAssignments = await loadSectorAssignments();
	const sectorRoleConfigs = await loadSectorRoleConfigs();
	const yearEndDay = meta.gameDay;
	const yearStartDay = yearEndDay - settings.calendar.daysPerYear;
	const yearBumps = gameRun
		? getYearCalamityBumps(gameRun, yearStartDay, yearEndDay)
		: { mortalityBump: 0, emigrationBump: 0 };

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

		const roleModifiers = getRoleModifiersForCitizen(person.getRoleId());
		if (!roleModifiers.countsAsWorker) return;

		const weight = roleModifiers.efficiencyMultiplier;

		if (categoryId === "extractive") {
			const regionId = person.getRegionId();
			if (!regionId) return;
			if (!extractiveWorkersByRegionAndSubSector[regionId]) {
				extractiveWorkersByRegionAndSubSector[regionId] = {};
			}
			const bySubSector = extractiveWorkersByRegionAndSubSector[regionId];
			bySubSector[subSectorId] = (bySubSector[subSectorId] ?? 0) + weight;
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

				const age = Math.min(
					settings.demographics.maxAge,
					(person.getAge() ?? settings.demographics.minAge) + 1,
				);
				const employment = syncEmploymentWithAge(
					age,
					{
						categoryId: person.getCategoryId(),
						subSectorId: person.getSubSectorId(),
					},
					random,
					getViableExtractiveSubSectorIdsForRegion(
						regions,
						person.getRegionId(),
					),
					settings,
				);
				person.setCategoryId(employment.categoryId);
				person.setSubSectorId(employment.subSectorId);

				if (employment.categoryId && employment.subSectorId) {
					const quotas =
						sectorRoleConfigs[
							sectorKey(employment.categoryId, employment.subSectorId)
						]?.quotas ?? [];
					const roleId = syncRoleWithAge(
						isWorkingAge(age, settings),
						person.getRoleId(),
						quotas,
						random,
					);
					person.setRoleId(roleId);
				} else {
					person.setRoleId(undefined);
				}

				trackWorker(person);

				const sex = person.getSex() ?? "F";

				const outcome = computeAnnualOutcomeForCitizen(
					{
						age,
						sex,
						happiness,
						health,
						calamityMortalityBump: yearBumps.mortalityBump,
						calamityEmigrationBump: yearBumps.emigrationBump,
					},
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
				if (outcome.gaveBirth) births += 1;
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
		generateImmigrantPerson(
			faceIds,
			regions,
			undefined,
			random,
			sectorRoleConfigs,
		),
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
		getCalamityEfficiency: (regionId, subSectorId) =>
			getCalamityExtractionEfficiency({
				activeCalamities: gameRun?.activeCalamities ?? [],
				gameDay: meta.gameDay,
				regionId,
				subSectorId,
			}),
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

	await processProgressionAfterYear(
		stats,
		extraction.ledger,
		extraction.resourceStates,
		settings,
	);

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

	let gameRun = await loadGameRunState();
	if (gameRun && (gameRun.status !== "active" || gameRun.phase !== "active")) {
		return meta;
	}

	const regions = await ensureWorld(random);
	let resourceStates = await ensureRegionResourceStates(regions);

	if (gameRun) {
		const calamityResult = processCalamitiesForDay({
			run: toCalamityRunSlice(gameRun),
			gameDay: meta.gameDay,
			regions: buildCalamityRegionInputs(regions, resourceStates),
			random,
			settings,
		});
		gameRun = mergeCalamityRunSlice(gameRun, calamityResult.run);
		if (calamityResult.onsets.length > 0) {
			const mutations = calamityResult.onsets.flatMap(
				(onset) => onset.mutations,
			);
			const applied = applyCalamityMutations({
				regions,
				resourceStates,
				mutations,
			});
			resourceStates = applied.resourceStates;
			await saveWorldRegions(applied.regions);
			await saveRegionResourceStates(resourceStates);
		}
		await saveGameRunState(gameRun);
	}

	const cohort = getCohortForGameDay(meta.gameDay);
	const cohortSize = meta.cohortSizes[cohort] ?? 0;
	const chunkCount = getChunkCount(cohortSize);
	let updated = 0;

	const sectorAssignments = await loadSectorAssignments();
	const nationalLedger = await loadNationalLedger();
	const activeCalamities = gameRun?.activeCalamities ?? [];

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
			const calamityModifiers = getCalamityModifiersForCitizen({
				activeCalamities,
				gameDay: meta.gameDay,
				regionId,
				subSectorId,
			});

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
				calamityHappinessPenalty: calamityModifiers.happinessPenaltyPerDay,
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
	if (!meta || globalIndex < 0 || globalIndex >= meta.size) return null;

	const cohort = getCohortForIndex(globalIndex);
	const cohortPosition = getCohortPosition(globalIndex);
	const chunkIndex = getChunkIndex(cohortPosition);
	const chunkOffset = getChunkOffset(cohortPosition);
	const chunk = await loadCohortChunk(cohort, chunkIndex);
	return chunk?.[chunkOffset] ?? null;
}

async function getPersonRange(start: number, count: number): Promise<Person[]> {
	const meta = await loadMeta();
	if (!meta || count <= 0 || start >= meta.size) return [];

	const end = Math.min(start + count, meta.size);
	const results: Person[] = [];
	for (let globalIndex = start; globalIndex < end; globalIndex++) {
		const person = await getPerson(globalIndex);
		if (person) results.push(person);
	}
	return results;
}

async function getPersonRangeBatched(
	start: number,
	count: number,
): Promise<Person[]> {
	const meta = await loadMeta();
	if (!meta || count <= 0 || start >= meta.size) return [];

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

/**
 * Compact directory of every citizen for in-memory search/sort/filter.
 * Scans cohort chunks once (same pattern as demographic stats).
 */
async function buildPopulationDirectory(
	onProgress?: (processed: number, total: number) => void,
): Promise<PopulationDirectoryEntry[]> {
	const meta = await loadMeta();
	if (!meta) return [];

	const entries: PopulationDirectoryEntry[] = [];
	let processed = 0;

	for (let cohort = 0; cohort < meta.cohortCount; cohort++) {
		const chunkCount = getChunkCount(meta.cohortSizes[cohort] ?? 0);
		for (let chunkIndex = 0; chunkIndex < chunkCount; chunkIndex++) {
			const chunk = await loadCohortChunk(cohort, chunkIndex);
			if (!chunk) continue;

			for (let offset = 0; offset < chunk.length; offset++) {
				const person = chunk[offset];
				if (!person) continue;

				const globalIndex =
					person.getIndex() ??
					getGlobalIndex(
						cohort,
						chunkIndex * appConfig.population.chunkSize + offset,
					);

				entries.push({
					index: globalIndex,
					name: person.getName() ?? "Unknown",
					age: person.getAge() ?? 0,
					sex: person.getSex(),
					isAlive: person.isLiving(),
					overallHealth: person.getOverallHealth() ?? 0,
					overallHappiness: person.getOverallHappiness() ?? 0,
					regionId: person.getRegionId(),
				});

				processed += 1;
				onProgress?.(processed, meta.size);
			}
		}
	}

	return entries;
}

/**
 * Hydrate people by arbitrary global indices, loading each cohort chunk at most once.
 * Returns one slot per requested index (null when missing / out of range).
 */
async function getPeopleByIndices(
	indices: number[],
): Promise<(Person | null)[]> {
	const meta = await loadMeta();
	if (!meta || indices.length === 0) return [];

	type ChunkGroup = {
		cohort: number;
		chunkIndex: number;
		requests: { order: number; offset: number }[];
	};
	const byChunk = new Map<string, ChunkGroup>();

	for (let order = 0; order < indices.length; order++) {
		const globalIndex = indices[order];
		if (
			globalIndex === undefined ||
			globalIndex < 0 ||
			globalIndex >= meta.size
		) {
			continue;
		}

		const cohort = getCohortForIndex(globalIndex);
		const cohortPosition = getCohortPosition(globalIndex);
		const chunkIndex = getChunkIndex(cohortPosition);
		const chunkOffset = getChunkOffset(cohortPosition);
		const key = formatChunkKey(cohort, chunkIndex);

		let group = byChunk.get(key);
		if (!group) {
			group = { cohort, chunkIndex, requests: [] };
			byChunk.set(key, group);
		}
		group.requests.push({ order, offset: chunkOffset });
	}

	const results: (Person | null)[] = Array.from(
		{ length: indices.length },
		() => null,
	);

	for (const group of byChunk.values()) {
		const chunk = await loadCohortChunk(group.cohort, group.chunkIndex);
		if (!chunk) continue;
		for (const request of group.requests) {
			results[request.order] = chunk[request.offset] ?? null;
		}
	}

	return results;
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
	await clearLegacyPopulationKey();
	return meta;
}

async function clearPopulation(): Promise<void> {
	await clearPopulationData();
}

interface RegionStats {
	population: number;
	averageHappiness: number;
	averageHealth: number;
}

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

interface AgeSexBucket {
	label: string;
	male: number;
	female: number;
}

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

interface SectorStats {
	categoryId: string;
	subSectorId: string;
	population: number;
	averageHappiness: number;
}

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
	buildPopulationDirectory,
	clearPopulation,
	computeDemographicStats,
	computeRegionStats,
	computeSectorStats,
	finalizePopulationMeta,
	getPeopleByIndices,
	getPerson,
	getPersonRange,
	getPersonRangeBatched,
	hasPopulation,
	loadPopulationMeta,
	runAnnualCycle,
	savePopulationChunk,
};
