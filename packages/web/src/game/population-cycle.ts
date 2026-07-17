import {
	appConfig,
	type GameSettings,
	gameSettings,
	getEconomicSystemEffect,
	sectorKey,
} from "economy-simulator-data";
import {
	type AnnualCycleStats,
	appendGameEvents,
	clearLegacyPopulationKey,
	ensureGameRunState,
	type GameEvent,
	loadGameRunState,
	loadPopulationChunkRaw,
	loadPopulationMeta as loadPopulationMetaRepo,
	type PopulationMeta,
	pruneExpiredModifiers,
	removePopulationKey,
	saveGameRunState,
	savePopulationChunkRaw,
	savePopulationMeta as savePopulationMetaRepo,
} from "economy-simulator-persistence";
import {
	applyCalamityStockpileLoss,
	type CalamityWeightBiasSnapshot,
	computeAnnualOutcomeForCitizen,
	computeExpectedImmigrantCount,
	computeInfrastructureMultipliers,
	computeNationEconomyTick,
	computeNationScore,
	computePublicServiceEffects,
	computeRegionalCategoryMultipliers,
	evaluateRunBadges,
	evaluateWinLose,
	getCalamityExtractionEfficiency,
	getCalamityModifiersForCitizen,
	getEnvironmentalQualityModifier,
	getRoleModifiersForCitizen,
	isWorkingAge,
	processCalamitiesForDay,
	stapleSufficiencyFromEntries,
	syncEmploymentWithAge,
	syncRoleWithAge,
	taxPressureFromRate,
} from "economy-simulator-simulation";
import type {
	AdvanceGameDayResult,
	AideProposalSummary,
	CalamityOnsetSummary,
	WeeklyReportSummary,
	YearReviewSummary,
} from "../game/advance-day-result";
import { buildAideProposalSummary } from "../game/aide-proposals";
import {
	applyCalamityMutations,
	buildCalamityRegionInputs,
	getYearCalamityBumps,
	mergeCalamityRunSlice,
	toCalamityRunSlice,
} from "../game/calamity-effects";
import { issueMandateForYear, resolveMandateAfterYear } from "../game/mandates";
import { appendYearlyScore, finalizeGameRun } from "../game/progression";
import { buildWeeklyReport } from "../game/weekly-reports";
import { isAideProposalDay, isWeekBoundary } from "../lib/calendar";
import { getFacePoolIds, isFaceId } from "../lib/faces";
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
} from "../lib/population-cohorts";
import type { PopulationDirectoryEntry } from "../lib/population-directory";
import type { RegionId } from "../lib/regions";
import { getViableExtractiveSubSectorIdsForRegion } from "../models/generatePerson";
import {
	generateImmigrantPerson,
	generateNewbornPerson,
} from "../models/generatePopulationChange";
import { Person, type PersonSnapshot } from "../models/Person";
import { updatePersonStats } from "../models/updatePersonStats";
import {
	ensureNationEconomy,
	loadNationEconomy,
	saveNationEconomy,
} from "../repos/nation-economy";
import {
	loadNationalLedger,
	saveNationalLedger,
} from "../repos/national-ledger";
import { ensureRegionPool } from "../repos/regions";
import { runAnnualResourceExtraction } from "../repos/resource-extraction";
import {
	getSectorAssignment,
	loadSectorAssignments,
} from "../repos/sector-assignments";
import { loadSectorRoleConfigs } from "../repos/sector-role-config";
import {
	ensureRegionResourceStates,
	ensureWorld,
	saveRegionResourceStates,
	saveWorldRegions,
} from "../repos/world";

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
	landRegionIds: ReadonlySet<string>,
): number {
	const values: number[] = [];
	for (const [regionId, state] of Object.entries(resourceStates)) {
		if (!landRegionIds.has(regionId)) continue;
		values.push(state.environmentQuality);
	}
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
	landRegionIds: ReadonlySet<string>,
	settings: GameSettings,
	fiscalInsolvent = false,
): Promise<void> {
	const meta = await loadMeta();
	if (!meta) return;

	let gameRun = await ensureGameRunState(meta.size);
	if (gameRun.status !== "active") return;

	const averageEnvironmentQuality = computeAverageEnvironmentQuality(
		resourceStates,
		landRegionIds,
	);

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

	const mandateResolution = resolveMandateAfterYear(
		gameRun,
		{ stats, score: scoreBreakdown },
		stats.year * settings.calendar.daysPerYear,
	);
	gameRun = mandateResolution.gameRun;
	const pendingBonus = gameRun.pendingScoreBonus ?? 0;
	const insolvencyPenalty = fiscalInsolvent
		? settings.fiscal.insolvencyScorePenalty
		: 0;
	const scoredBreakdown = {
		...scoreBreakdown,
		total: Math.max(
			0,
			scoreBreakdown.total +
				mandateResolution.scoreBonus +
				pendingBonus -
				insolvencyPenalty,
		),
	};
	gameRun = { ...gameRun, pendingScoreBonus: 0 };

	const runBadges = evaluateRunBadges({
		year: stats.year,
		births: stats.births,
		deaths: stats.deaths,
		immigrations: stats.immigrations,
		emigrations: stats.emigrations,
		score: scoredBreakdown,
		netImmigrationPositiveStreak: gameRun.streaks.netImmigrationPositive,
		mandateCompletedThisYear: mandateResolution.mandateCompleted,
	});

	gameRun = appendYearlyScore(
		gameRun,
		{
			year: scoredBreakdown.year,
			total: scoredBreakdown.total,
			populationGrowth: scoredBreakdown.populationGrowth,
			averageQualityOfLife: scoredBreakdown.averageQualityOfLife,
			netMigration: scoredBreakdown.netMigration,
			resourceSufficiency: scoredBreakdown.resourceSufficiency,
			environmentHealth: scoredBreakdown.environmentHealth,
		},
		runBadges,
	);

	gameRun = issueMandateForYear(gameRun, stats.year + 1);

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

	const priorNationEconomy = await ensureNationEconomy();
	const taxEmigrationBump = taxPressureFromRate(
		priorNationEconomy.policy.taxRate,
		settings,
	).emigrationBump;
	const priorInfraMultipliers = computeInfrastructureMultipliers(
		priorNationEconomy.infrastructure,
		settings,
	);

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
	const employmentWeightBySubSector: Record<string, number> = {};
	const populationByRegion: Record<RegionId, number> = {};
	let logisticsWorkers = 0;
	let totalWorkers = 0;

	// First pass: population counts for regional employment capacity.
	for (let cohort = 0; cohort < meta.cohortCount; cohort++) {
		const chunkCount = getChunkCount(meta.cohortSizes[cohort] ?? 0);
		for (let chunkIndex = 0; chunkIndex < chunkCount; chunkIndex++) {
			const chunk = await loadCohortChunk(cohort, chunkIndex);
			if (!chunk) continue;
			for (const person of chunk) {
				if (!person?.isLiving()) continue;
				const regionId = person.getRegionId();
				if (!regionId) continue;
				populationByRegion[regionId] = (populationByRegion[regionId] ?? 0) + 1;
			}
		}
	}
	const landRegions = regions.filter((region) => region.terrain !== "ocean");
	const averageLandPopulation =
		landRegions.length > 0
			? landRegions.reduce(
					(sum, region) => sum + (populationByRegion[region.id] ?? 0),
					0,
				) / landRegions.length
			: 1;

	function regionalMultipliersFor(regionId: string | undefined) {
		if (!regionId) return undefined;
		const region = regions.find((entry) => entry.id === regionId);
		if (!region || region.terrain === "ocean") return undefined;
		return computeRegionalCategoryMultipliers({
			regionPopulation: populationByRegion[regionId] ?? 0,
			averageLandPopulation,
			isCoastal: region.isCoastal,
			terrain: region.terrain,
		});
	}

	function temporaryEmigrationBump(regionId: string | undefined): number {
		let bump = 0;
		for (const modifier of gameRun?.temporaryModifiers ?? []) {
			if (modifier.expiresOnGameDay <= yearEndDay) continue;
			if (modifier.emigrationProbabilityBump == null) continue;
			if (modifier.regionId && modifier.regionId !== regionId) continue;
			bump += modifier.emigrationProbabilityBump;
		}
		return bump;
	}

	function trackWorker(person: Person): void {
		const categoryId = person.getCategoryId();
		const subSectorId = person.getSubSectorId();
		if (!subSectorId) return;

		const roleModifiers = getRoleModifiersForCitizen(person.getRoleId());
		if (!roleModifiers.countsAsWorker) return;

		const weight = roleModifiers.efficiencyMultiplier;
		totalWorkers += weight;
		employmentWeightBySubSector[subSectorId] =
			(employmentWeightBySubSector[subSectorId] ?? 0) + weight;
		const regionId = person.getRegionId();

		if (categoryId === "services" && subSectorId === "transport-logistics") {
			logisticsWorkers += weight;
		}

		if (categoryId === "extractive") {
			if (!regionId) return;
			if (!extractiveWorkersByRegionAndSubSector[regionId]) {
				extractiveWorkersByRegionAndSubSector[regionId] = {};
			}
			const bySubSector = extractiveWorkersByRegionAndSubSector[regionId];
			bySubSector[subSectorId] = (bySubSector[subSectorId] ?? 0) + weight;
		} else if (categoryId === "industrial") {
			industrialWorkersBySubSector[subSectorId] =
				(industrialWorkersBySubSector[subSectorId] ?? 0) + weight;
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
					regionalMultipliersFor(person.getRegionId()),
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
						calamityEmigrationBump:
							yearBumps.emigrationBump +
							temporaryEmigrationBump(person.getRegionId()) +
							taxEmigrationBump,
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

	const priorLedger = await loadNationalLedger();
	const extraction = runAnnualResourceExtraction({
		regions,
		resourceStates,
		extractiveWorkersByRegionAndSubSector,
		industrialWorkersBySubSector,
		populationByRegion,
		logisticsEmploymentShare:
			totalWorkers > 0 ? logisticsWorkers / totalWorkers : 0,
		priorStockpileByResource: priorLedger?.stockpileByResource ?? {},
		infrastructureEfficiencyMultiplier: priorInfraMultipliers.extraction,
		infrastructureFlowCapacityMultiplier: priorInfraMultipliers.flowCapacity,
		sectorAssignments,
		settings,
		getCalamityEfficiency: (regionId, subSectorId) => {
			let factor = getCalamityExtractionEfficiency({
				activeCalamities: gameRun?.activeCalamities ?? [],
				gameDay: meta.gameDay,
				regionId,
				subSectorId,
			});
			for (const modifier of gameRun?.temporaryModifiers ?? []) {
				if (modifier.expiresOnGameDay <= meta.gameDay) continue;
				if (
					modifier.extractionEfficiencyFactor != null &&
					(!modifier.regionId || modifier.regionId === regionId)
				) {
					factor *= modifier.extractionEfficiencyFactor;
				}
			}
			return factor;
		},
	});
	await saveWorldRegions(extraction.regions);
	await saveRegionResourceStates(extraction.resourceStates);
	await saveNationalLedger(extraction.ledger);

	const employmentShareBySubSector: Record<string, number> = {};
	for (const [subSectorId, weight] of Object.entries(
		employmentWeightBySubSector,
	)) {
		employmentShareBySubSector[subSectorId] =
			totalWorkers > 0 ? weight / totalWorkers : 0;
	}

	const outputProxy = extraction.ledger.resources.reduce(
		(sum, entry) => sum + entry.production,
		0,
	);
	const calamityIdsThisYear = (gameRun?.calamityHistory ?? [])
		.filter(
			(entry) =>
				entry.startedOnGameDay > yearStartDay &&
				entry.startedOnGameDay <= yearEndDay,
		)
		.map((entry) => entry.calamityId);
	// Also include still-active onsets started this year.
	for (const calamity of gameRun?.activeCalamities ?? []) {
		if (
			calamity.startedOnGameDay > yearStartDay &&
			calamity.startedOnGameDay <= yearEndDay
		) {
			calamityIdsThisYear.push(calamity.calamityId);
		}
	}
	const rebuildResponseThisYear = (gameRun?.activeCalamities ?? []).some(
		(calamity) =>
			calamity.playerResponse === "rebuild" &&
			calamity.startedOnGameDay > yearStartDay &&
			calamity.startedOnGameDay <= yearEndDay,
	);

	const nationTick = computeNationEconomyTick({
		prior: priorNationEconomy,
		year: Math.floor(meta.gameDay / settings.calendar.daysPerYear),
		outputProxy,
		employmentShareBySubSector,
		calamityIdsThisYear: [...new Set(calamityIdsThisYear)],
		rebuildResponseThisYear,
		settings,
	});
	await saveNationEconomy(nationTick.state);

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
		new Set(
			regions
				.filter((region) => region.terrain !== "ocean")
				.map((region) => region.id),
		),
		settings,
		nationTick.state.lastYear?.insolvent ?? false,
	);

	let runAfterYear = await loadGameRunState();
	if (runAfterYear) {
		const yearEvents: GameEvent[] = [
			{
				id: `year-${stats.year}-${meta.gameDay}`,
				gameDay: meta.gameDay,
				type: "year_end",
				title: `Year ${stats.year} closed`,
				detail: `Pop ${stats.populationBefore.toLocaleString()} → ${stats.populationAfter.toLocaleString()} · QoL ${stats.averageQualityOfLife.toFixed(1)}`,
			},
		];
		const emigrationRate =
			stats.emigrations / Math.max(stats.populationAfter, 1);
		if (emigrationRate > settings.progression.lose.massExodusRate) {
			yearEvents.push({
				id: `exodus-${stats.year}-${meta.gameDay}`,
				gameDay: meta.gameDay,
				type: "emigration_spike",
				title: "Mass emigration warning",
				detail: `${stats.emigrations.toLocaleString()} citizens left (${(emigrationRate * 100).toFixed(1)}% of the living).`,
			});
		}
		const shortfallSectors = Object.entries(
			extraction.ledger.shortfallHappinessPenaltyBySubSector,
		).filter(([, penalty]) => penalty > 0);
		if (shortfallSectors.length > 0) {
			yearEvents.push({
				id: `shortfall-${stats.year}-${meta.gameDay}`,
				gameDay: meta.gameDay,
				type: "resource_shortfall",
				title: "Resource shortfalls",
				detail: `${shortfallSectors.length} industrial sub-sector(s) face unmet demand.`,
			});
		}
		if (nationTick.state.lastYear?.insolvent) {
			yearEvents.push({
				id: `insolvent-${stats.year}-${meta.gameDay}`,
				gameDay: meta.gameDay,
				type: "year_end",
				title: "Treasury under strain",
				detail: `Fiscal accounts closed insolvent (treasury ${nationTick.state.treasury.toFixed(0)}, debt ${nationTick.state.debt.toFixed(0)}).`,
			});
		}
		runAfterYear = appendGameEvents(runAfterYear, yearEvents);
		await saveGameRunState(runAfterYear);
	}

	return stats;
}

async function advanceGameDay(
	onProgress?: (updated: number, total: number) => void,
	onAnnualProgress?: (processed: number, total: number) => void,
	random: RandomFn = Math.random,
	settings: GameSettings = gameSettings,
): Promise<AdvanceGameDayResult> {
	const emptyResult = (meta: PopulationMeta | null): AdvanceGameDayResult => ({
		meta,
		onsets: [],
		weeklyReport: null,
		aideProposal: null,
		yearReview: null,
	});

	const meta = await loadMeta();
	if (!meta) return emptyResult(null);

	let gameRun = await loadGameRunState();
	if (gameRun && (gameRun.status !== "active" || gameRun.phase !== "active")) {
		return emptyResult(meta);
	}

	const regions = await ensureWorld(random);
	let resourceStates = await ensureRegionResourceStates(regions);
	let onsets: CalamityOnsetSummary[] = [];

	if (gameRun) {
		gameRun = pruneExpiredModifiers(gameRun, meta.gameDay);

		const nationalLedgerForBias = await loadNationalLedger();
		let envTotal = 0;
		let envCount = 0;
		let timberTotal = 0;
		let timberCount = 0;
		let fossilTotal = 0;
		let fossilCount = 0;
		for (const region of regions) {
			if (region.terrain === "ocean") continue;
			const state = resourceStates[region.id];
			if (!state) continue;
			envTotal += state.environmentQuality;
			envCount += 1;
			if (state.reserveOrCapacityByResource.timber != null) {
				timberTotal += state.reserveOrCapacityByResource.timber;
				timberCount += 1;
			}
			if (state.reserveOrCapacityByResource.fossilFuels != null) {
				fossilTotal += state.reserveOrCapacityByResource.fossilFuels;
				fossilCount += 1;
			}
		}
		const lastYear = meta.yearlyStats?.[meta.yearlyStats.length - 1];
		const weightBiasSnapshot: CalamityWeightBiasSnapshot = {
			nationalAverageQualityOfLife: lastYear?.averageQualityOfLife ?? 50,
			nationalAverageEnvironment: envCount > 0 ? envTotal / envCount : 100,
			stapleSufficiency: stapleSufficiencyFromEntries(
				nationalLedgerForBias?.resources ?? [],
			),
			meanTimberCapacity: timberCount > 0 ? timberTotal / timberCount : 1,
			meanFossilReserve: fossilCount > 0 ? fossilTotal / fossilCount : 1,
		};

		const calamityResult = processCalamitiesForDay({
			run: toCalamityRunSlice(gameRun),
			gameDay: meta.gameDay,
			regions: buildCalamityRegionInputs(regions, resourceStates),
			random,
			settings,
			weightBiasSnapshot,
		});
		gameRun = mergeCalamityRunSlice(gameRun, calamityResult.run);

		// Apply prep buff to newly started calamities' happiness scales.
		const prepScale = (gameRun.temporaryModifiers ?? [])
			.filter(
				(modifier) =>
					modifier.nextCalamityHappinessScale != null &&
					modifier.expiresOnGameDay > meta.gameDay,
			)
			.reduce(
				(scale, modifier) => scale * (modifier.nextCalamityHappinessScale ?? 1),
				1,
			);
		if (prepScale !== 1 && calamityResult.onsets.length > 0) {
			const onsetIds = new Set(
				calamityResult.onsets.map((onset) => onset.calamity.instanceId),
			);
			gameRun = {
				...gameRun,
				activeCalamities: gameRun.activeCalamities.map((calamity) =>
					onsetIds.has(calamity.instanceId)
						? {
								...calamity,
								happinessPenaltyScale:
									(calamity.happinessPenaltyScale ?? 1) * prepScale,
							}
						: calamity,
				),
			};
		}

		onsets = calamityResult.onsets.map((onset) => ({
			instanceId: onset.calamity.instanceId,
			calamityId: onset.calamity.calamityId,
			name: onset.calamity.name,
			severity: onset.calamity.severity,
			regionIds: onset.calamity.regionIds,
			midTermEndsOnGameDay: onset.calamity.midTermEndsOnGameDay,
			fromCascade: onset.calamity.fromCascade,
		}));
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

			if (nationalLedgerForBias) {
				let stock = { ...(nationalLedgerForBias.stockpileByResource ?? {}) };
				for (const onset of calamityResult.onsets) {
					stock = applyCalamityStockpileLoss(stock, onset.calamity.severity);
				}
				await saveNationalLedger({
					...nationalLedgerForBias,
					stockpileByResource: stock,
					resources: nationalLedgerForBias.resources.map((entry) => ({
						...entry,
						stockpile: stock[entry.resourceId] ?? entry.stockpile ?? 0,
					})),
				});
			}

			const onsetEvents: GameEvent[] = onsets.map((onset) => ({
				id: `onset-${onset.instanceId}`,
				gameDay: meta.gameDay,
				type: "calamity_onset",
				title: onset.name,
				detail: `${onset.severity} · ${onset.regionIds.length} region(s) struck`,
			}));
			gameRun = appendGameEvents(gameRun, onsetEvents);
		}
		await saveGameRunState(gameRun);
	}

	const cohort = getCohortForGameDay(meta.gameDay);
	const cohortSize = meta.cohortSizes[cohort] ?? 0;
	const chunkCount = getChunkCount(cohortSize);
	let updated = 0;

	const sectorAssignments = await loadSectorAssignments();
	const nationalLedger = await loadNationalLedger();
	const nationEconomy = await loadNationEconomy();
	const serviceEffects = nationEconomy
		? computePublicServiceEffects(nationEconomy.services, settings)
		: null;
	const taxPressure = nationEconomy
		? taxPressureFromRate(nationEconomy.policy.taxRate, settings)
		: null;
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
				diseaseSeverityScale: serviceEffects?.diseaseSeverityScale,
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
				taxHappinessPenalty: taxPressure?.happinessPenaltyPerDay,
				serviceUnderfundingHappinessPenalty:
					serviceEffects?.underfundingHappinessPenaltyPerDay,
				educationAffinityMultiplier:
					serviceEffects?.educationAffinityMultiplier,
				healthFloorBonus: serviceEffects?.healthFloorBonus,
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

	let weeklyReport: WeeklyReportSummary | null = null;
	let aideProposal: AideProposalSummary | null = null;

	if (gameRun && isWeekBoundary(nextGameDay)) {
		const namedRegions = await ensureRegionPool(random);
		const stats = await computeRegionStats();
		weeklyReport = buildWeeklyReport({
			gameDay: nextGameDay,
			stats,
			regions: namedRegions,
			activeCalamities: gameRun.activeCalamities,
		});
		if (weeklyReport) {
			gameRun = appendGameEvents(gameRun, [
				{
					id: `weekly-${nextGameDay}`,
					gameDay: nextGameDay,
					type: "weekly_report",
					title: `Weekly briefing: ${weeklyReport.regions[0]?.name ?? "provinces"}`,
					detail: weeklyReport.prompt,
				},
			]);
			gameRun = {
				...gameRun,
				lastWeeklyReportGameDay: nextGameDay,
			};
			await saveGameRunState(gameRun);
		}
	}

	if (gameRun && isAideProposalDay(nextGameDay)) {
		aideProposal = buildAideProposalSummary(gameRun, nextGameDay, random);
		if (aideProposal) {
			gameRun = appendGameEvents(gameRun, [
				{
					id: `aide-${nextGameDay}-${aideProposal.proposalId}`,
					gameDay: nextGameDay,
					type: "aide_proposal",
					title: `${aideProposal.aideName}: ${aideProposal.title}`,
					detail: aideProposal.dialog,
				},
			]);
			gameRun = {
				...gameRun,
				lastAideProposalGameDay: nextGameDay,
			};
			await saveGameRunState(gameRun);
		}
	}

	if (completedFullYear) {
		const yearStartDay = nextGameDay - settings.calendar.daysPerYear;
		await saveMeta({ ...meta, gameDay: nextGameDay });
		const yearStats = await runAnnualCycle(onAnnualProgress, random, settings);
		const nextMeta = await loadMeta();
		const runAfter = await loadGameRunState();
		let yearReview: YearReviewSummary | null = null;
		if (yearStats && runAfter) {
			const latestScore = runAfter.scoreHistory.at(-1)?.total ?? 0;
			const previousScore = runAfter.scoreHistory.at(-2)?.total ?? null;
			const calamitiesThisYear = runAfter.calamityHistory
				.filter(
					(entry) =>
						entry.startedOnGameDay >= yearStartDay &&
						entry.startedOnGameDay < nextGameDay,
				)
				.map((entry) => ({
					name: entry.name,
					severity: entry.severity,
					instanceId: entry.instanceId,
				}));
			const activeStartedThisYear = runAfter.activeCalamities
				.filter(
					(entry) =>
						entry.startedOnGameDay >= yearStartDay &&
						entry.startedOnGameDay < nextGameDay,
				)
				.map((entry) => ({
					name: entry.name,
					severity: entry.severity,
					instanceId: entry.instanceId,
				}));
			const mandateEvent = [...runAfter.eventLog]
				.reverse()
				.find(
					(event) =>
						event.type === "mandate_completed" ||
						event.type === "mandate_failed",
				);
			yearReview = {
				stats: yearStats,
				nationScore: latestScore,
				previousNationScore: previousScore,
				calamitiesThisYear: [...calamitiesThisYear, ...activeStartedThisYear],
				mandateResult: mandateEvent
					? {
							label: mandateEvent.title.replace(
								/^(Mandate fulfilled|Mandate missed): /,
								"",
							),
							fulfilled: mandateEvent.type === "mandate_completed",
							scoreBonus: (() => {
								const match = mandateEvent.detail.match(/\+(\d+)/);
								return match ? Number(match[1]) : 0;
							})(),
						}
					: null,
			};
		}
		return {
			meta: nextMeta,
			onsets,
			weeklyReport,
			aideProposal,
			yearReview,
		};
	}

	const nextMeta: PopulationMeta = {
		...meta,
		gameDay: nextGameDay,
	};
	await saveMeta(nextMeta);
	return {
		meta: nextMeta,
		onsets,
		weeklyReport,
		aideProposal,
		yearReview: null,
	};
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
	/** Working citizens by economic category (Phase 0b regional job mix). */
	workersByCategory?: Record<string, number>;
}

async function computeRegionStats(
	onProgress?: (processed: number, total: number) => void,
): Promise<Map<string, RegionStats>> {
	const meta = await loadMeta();
	const totals = new Map<
		string,
		{
			population: number;
			happiness: number;
			health: number;
			workersByCategory: Record<string, number>;
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
				const regionId = person.getRegionId();
				processed += 1;
				onProgress?.(processed, meta.size);
				if (!regionId) continue;
				const entry = totals.get(regionId) ?? {
					population: 0,
					happiness: 0,
					health: 0,
					workersByCategory: {},
				};
				entry.population += 1;
				entry.happiness += person.getOverallHappiness() ?? 50;
				entry.health += person.getOverallHealth() ?? 50;
				const categoryId = person.getCategoryId();
				if (categoryId && person.getSubSectorId()) {
					entry.workersByCategory[categoryId] =
						(entry.workersByCategory[categoryId] ?? 0) + 1;
				}
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
			workersByCategory: entry.workersByCategory,
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
	AdvanceGameDayResult,
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
