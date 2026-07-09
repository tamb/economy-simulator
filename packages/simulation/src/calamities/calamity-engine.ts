import {
	type BiomeId,
	type CalamityDefinition,
	type CalamitySeverity,
	type CalamityTier,
	type GameSettings,
	gameSettings,
	getBiome,
	getCalamityDefinition,
	getCalamityDefinitions,
	type ResourceId,
	type Terrain,
} from "economy-simulator-data";

type RandomFn = () => number;

interface CalamityRegionInput {
	id: string;
	terrain: Terrain;
	isCoastal: boolean;
	/** Resource ids present as yields/reserves on this region. */
	resourceIds: ResourceId[];
}

interface ActiveCalamityState {
	instanceId: string;
	calamityId: string;
	name: string;
	severity: CalamitySeverity;
	regionIds: string[];
	startedOnGameDay: number;
	midTermEndsOnGameDay: number;
	longTermEndsOnGameDay: number;
	fromCascade: boolean;
}

interface CalamityHistoryEntryState {
	instanceId: string;
	calamityId: string;
	name: string;
	severity: CalamitySeverity;
	regionIds: string[];
	startedOnGameDay: number;
	endedOnGameDay: number;
	year: number;
}

interface CalamityRunSlice {
	activeCalamities: ActiveCalamityState[];
	calamityHistory: CalamityHistoryEntryState[];
	lastCalamityOnsetGameDay: number | null;
	lastSevereCalamityOnsetGameDay: number | null;
}

interface RegionResourceMutation {
	regionId: string;
	reserveOrCapacityByResource: Partial<Record<ResourceId, number>>;
	environmentDelta: number;
	degradeTerrain: boolean;
}

interface CalamityOnsetResult {
	calamity: ActiveCalamityState;
	mutations: RegionResourceMutation[];
	mortalityBump: number;
	emigrationBump: number;
}

interface ProcessCalamitiesResult {
	run: CalamityRunSlice;
	onsets: CalamityOnsetResult[];
	expired: CalamityHistoryEntryState[];
}

interface MidTermModifiers {
	/** Multiplier on extraction yield for a region×sub-sector (1 = none). */
	extractionEfficiencyFactor: number;
	/** Daily happiness penalty to subtract (0 = none). */
	happinessPenaltyPerDay: number;
}

const SEVERITY_ORDER: Record<CalamitySeverity, number> = {
	minor: 0,
	moderate: 1,
	severe: 2,
};

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

function pickWeighted<T>(
	items: T[],
	weightOf: (item: T) => number,
	random: RandomFn,
): T | null {
	const total = items.reduce(
		(sum, item) => sum + Math.max(0, weightOf(item)),
		0,
	);
	if (total <= 0 || items.length === 0) return null;
	let roll = random() * total;
	for (const item of items) {
		roll -= Math.max(0, weightOf(item));
		if (roll <= 0) return item;
	}
	return items[items.length - 1] ?? null;
}

function pickSeverity(
	weights: CalamityDefinition["severityWeights"],
	random: RandomFn,
): CalamitySeverity {
	const picked = pickWeighted(
		[
			{ id: "minor" as const, weight: weights.minor },
			{ id: "moderate" as const, weight: weights.moderate },
			{ id: "severe" as const, weight: weights.severe },
		],
		(entry) => entry.weight,
		random,
	);
	return picked?.id ?? "minor";
}

function randomIntInclusive(
	min: number,
	max: number,
	random: RandomFn,
): number {
	const lo = Math.ceil(min);
	const hi = Math.floor(max);
	if (hi <= lo) return lo;
	return lo + Math.floor(random() * (hi - lo + 1));
}

function regionMatchesFilter(
	region: CalamityRegionInput,
	definition: CalamityDefinition,
): boolean {
	if (region.terrain === "ocean") return false;
	const filter = definition.target;
	if (filter.requireCoastal && !region.isCoastal) return false;
	if (filter.forbidCoastal && region.isCoastal) return false;
	if (filter.terrains && filter.terrains.length > 0) {
		if (!filter.terrains.includes(region.terrain as BiomeId)) return false;
	}
	if (filter.requireResources && filter.requireResources.length > 0) {
		const hasAny = filter.requireResources.some((resourceId) =>
			region.resourceIds.includes(resourceId),
		);
		if (!hasAny) return false;
	}
	return true;
}

function selectTargetRegions(
	definition: CalamityDefinition,
	regions: CalamityRegionInput[],
	random: RandomFn,
): string[] {
	const eligible = regions.filter((region) =>
		regionMatchesFilter(region, definition),
	);
	if (eligible.length === 0) return [];

	const shuffled = [...eligible];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(random() * (i + 1));
		const tmp = shuffled[i];
		shuffled[i] = shuffled[j] ?? shuffled[i];
		shuffled[j] = tmp ?? shuffled[j];
	}

	const count = Math.min(definition.target.maxRegions, shuffled.length);
	return shuffled.slice(0, count).map((region) => region.id);
}

function isCooldownClear(
	run: CalamityRunSlice,
	gameDay: number,
	settings: GameSettings,
): boolean {
	const { cooldownDaysAfterOnset, cooldownDaysAfterSevere } =
		settings.calamities;
	if (
		run.lastCalamityOnsetGameDay != null &&
		gameDay - run.lastCalamityOnsetGameDay < cooldownDaysAfterOnset
	) {
		return false;
	}
	if (
		run.lastSevereCalamityOnsetGameDay != null &&
		gameDay - run.lastSevereCalamityOnsetGameDay < cooldownDaysAfterSevere
	) {
		return false;
	}
	return true;
}

function countActiveMidTerm(
	active: ActiveCalamityState[],
	gameDay: number,
): number {
	return active.filter((calamity) => gameDay < calamity.midTermEndsOnGameDay)
		.length;
}

function dailyOnsetProbability(settings: GameSettings): number {
	const daysPerYear = settings.calendar.daysPerYear;
	if (daysPerYear <= 0) return 0;
	return settings.calamities.expectedPerYear / daysPerYear;
}

function buildImmediateMutations(
	definition: CalamityDefinition,
	severity: CalamitySeverity,
	regionIds: string[],
	regionsById: Map<string, CalamityRegionInput>,
	random: RandomFn,
): RegionResourceMutation[] {
	const immediate = definition.immediate;
	const envDelta = immediate.environmentDelta[severity];
	const degradeChance = immediate.degradeTerrainChance[severity];
	const resourceFactors = immediate.resourceCapacityFactors ?? {};

	return regionIds.map((regionId) => {
		const region = regionsById.get(regionId);
		const reserveOrCapacityByResource: Partial<Record<ResourceId, number>> = {};
		for (const [resourceId, factors] of Object.entries(resourceFactors)) {
			if (!factors) continue;
			reserveOrCapacityByResource[resourceId as ResourceId] = factors[severity];
		}
		const canDegrade =
			region != null &&
			region.terrain !== "ocean" &&
			getBiome(region.terrain as BiomeId)?.degradesTo != null;
		return {
			regionId,
			reserveOrCapacityByResource,
			environmentDelta: envDelta,
			degradeTerrain: canDegrade && random() < degradeChance,
		};
	});
}

function createOnset(
	definition: CalamityDefinition,
	severity: CalamitySeverity,
	regionIds: string[],
	gameDay: number,
	fromCascade: boolean,
	regionsById: Map<string, CalamityRegionInput>,
	random: RandomFn,
): CalamityOnsetResult {
	const [minDays, maxDays] = definition.midTermDurationDays[severity];
	const midTermDays = randomIntInclusive(minDays, maxDays, random);
	const longTermExtra = definition.longTermExtraDays[severity];
	const instanceId = `${definition.id}-${gameDay}-${Math.floor(random() * 1_000_000)}`;

	const calamity: ActiveCalamityState = {
		instanceId,
		calamityId: definition.id,
		name: definition.name,
		severity,
		regionIds,
		startedOnGameDay: gameDay,
		midTermEndsOnGameDay: gameDay + midTermDays,
		longTermEndsOnGameDay: gameDay + midTermDays + longTermExtra,
		fromCascade,
	};

	return {
		calamity,
		mutations: buildImmediateMutations(
			definition,
			severity,
			regionIds,
			regionsById,
			random,
		),
		mortalityBump: definition.immediate.mortalityBump[severity],
		emigrationBump: definition.immediate.emigrationBump[severity],
	};
}

function severityAtLeast(
	actual: CalamitySeverity,
	minimum: CalamitySeverity,
): boolean {
	return SEVERITY_ORDER[actual] >= SEVERITY_ORDER[minimum];
}

function tickExpiredCalamities(
	run: CalamityRunSlice,
	gameDay: number,
	daysPerYear: number,
): { run: CalamityRunSlice; expired: CalamityHistoryEntryState[] } {
	const expired: CalamityHistoryEntryState[] = [];
	const stillActive: ActiveCalamityState[] = [];

	for (const calamity of run.activeCalamities) {
		if (gameDay >= calamity.longTermEndsOnGameDay) {
			expired.push({
				instanceId: calamity.instanceId,
				calamityId: calamity.calamityId,
				name: calamity.name,
				severity: calamity.severity,
				regionIds: calamity.regionIds,
				startedOnGameDay: calamity.startedOnGameDay,
				endedOnGameDay: gameDay,
				year: Math.floor(calamity.startedOnGameDay / daysPerYear),
			});
		} else {
			stillActive.push(calamity);
		}
	}

	return {
		run: {
			...run,
			activeCalamities: stillActive,
			calamityHistory: [...run.calamityHistory, ...expired],
		},
		expired,
	};
}

function processCalamitiesForDay(input: {
	run: CalamityRunSlice;
	gameDay: number;
	regions: CalamityRegionInput[];
	random?: RandomFn;
	settings?: GameSettings;
	/** Force a specific calamity id (tests / debug). */
	forceCalamityId?: string;
}): ProcessCalamitiesResult {
	const random = input.random ?? Math.random;
	const settings = input.settings ?? gameSettings;
	const regionsById = new Map(
		input.regions.map((region) => [region.id, region]),
	);

	const ticked = tickExpiredCalamities(
		input.run,
		input.gameDay,
		settings.calendar.daysPerYear,
	);
	let run = ticked.run;
	const onsets: CalamityOnsetResult[] = [];

	const midTermCount = countActiveMidTerm(run.activeCalamities, input.gameDay);
	const canRollPrimary =
		midTermCount < settings.calamities.maxActiveMidTerm &&
		isCooldownClear(run, input.gameDay, settings);

	const shouldRoll =
		canRollPrimary &&
		(input.forceCalamityId != null ||
			random() < dailyOnsetProbability(settings));

	if (shouldRoll) {
		const enabledTiers = settings.calamities
			.enabledTiers as readonly CalamityTier[];
		const catalog = getCalamityDefinitions({ tiers: [...enabledTiers] });
		const eligible = catalog.filter((definition) =>
			input.regions.some((region) => regionMatchesFilter(region, definition)),
		);

		const definition =
			input.forceCalamityId != null
				? getCalamityDefinition(input.forceCalamityId)
				: pickWeighted(eligible, (entry) => entry.weight, random);

		if (definition) {
			const regionIds = selectTargetRegions(definition, input.regions, random);
			if (regionIds.length > 0) {
				const severity = pickSeverity(definition.severityWeights, random);
				const onset = createOnset(
					definition,
					severity,
					regionIds,
					input.gameDay,
					false,
					regionsById,
					random,
				);
				onsets.push(onset);
				run = {
					...run,
					activeCalamities: [...run.activeCalamities, onset.calamity],
					lastCalamityOnsetGameDay: input.gameDay,
					lastSevereCalamityOnsetGameDay:
						severity === "severe"
							? input.gameDay
							: run.lastSevereCalamityOnsetGameDay,
				};

				let cascadesSpawned = 0;
				for (const cascade of definition.cascades ?? []) {
					if (cascadesSpawned >= settings.calamities.maxCascadesPerOnset) break;
					if (!severityAtLeast(severity, cascade.minSeverity)) continue;
					if (random() >= cascade.chance) continue;
					if (
						countActiveMidTerm(run.activeCalamities, input.gameDay) >=
						settings.calamities.maxActiveMidTerm
					) {
						break;
					}

					const cascadeDefinition = getCalamityDefinition(cascade.calamityId);
					if (!cascadeDefinition) continue;
					const cascadeRegions = selectTargetRegions(
						cascadeDefinition,
						input.regions,
						random,
					);
					if (cascadeRegions.length === 0) continue;

					const cascadeSeverity = pickSeverity(
						cascadeDefinition.severityWeights,
						random,
					);
					const cascadeOnset = createOnset(
						cascadeDefinition,
						cascadeSeverity,
						cascadeRegions,
						input.gameDay,
						true,
						regionsById,
						random,
					);
					onsets.push(cascadeOnset);
					run = {
						...run,
						activeCalamities: [...run.activeCalamities, cascadeOnset.calamity],
					};
					cascadesSpawned += 1;
				}
			}
		}
	}

	return { run, onsets, expired: ticked.expired };
}

function getActivePhaseModifiers(
	active: ActiveCalamityState[],
	gameDay: number,
): Array<{
	calamity: ActiveCalamityState;
	definition: CalamityDefinition;
	phase: "midTerm" | "longTerm";
}> {
	const result: Array<{
		calamity: ActiveCalamityState;
		definition: CalamityDefinition;
		phase: "midTerm" | "longTerm";
	}> = [];

	for (const calamity of active) {
		if (gameDay >= calamity.longTermEndsOnGameDay) continue;
		const definition = getCalamityDefinition(calamity.calamityId);
		if (!definition) continue;
		const phase: "midTerm" | "longTerm" =
			gameDay < calamity.midTermEndsOnGameDay ? "midTerm" : "longTerm";
		result.push({ calamity, definition, phase });
	}
	return result;
}

function getCalamityModifiersForCitizen(input: {
	activeCalamities: ActiveCalamityState[];
	gameDay: number;
	regionId: string | null | undefined;
	subSectorId: string | null | undefined;
}): MidTermModifiers {
	let extractionEfficiencyFactor = 1;
	let happinessPenaltyPerDay = 0;

	for (const { calamity, definition, phase } of getActivePhaseModifiers(
		input.activeCalamities,
		input.gameDay,
	)) {
		const modifiers =
			phase === "midTerm" ? definition.midTerm : definition.longTerm;
		const appliesToRegion =
			modifiers.scope === "national" ||
			(input.regionId != null && calamity.regionIds.includes(input.regionId));
		if (!appliesToRegion) continue;

		happinessPenaltyPerDay +=
			modifiers.happinessPenaltyPerDay[calamity.severity];

		const subSectors = modifiers.affectedSubSectors;
		const appliesToSector =
			subSectors.length === 0 ||
			(input.subSectorId != null && subSectors.includes(input.subSectorId));
		if (appliesToSector) {
			extractionEfficiencyFactor *=
				modifiers.extractionEfficiencyFactor[calamity.severity];
		}
	}

	return {
		extractionEfficiencyFactor: clamp(extractionEfficiencyFactor, 0, 1),
		happinessPenaltyPerDay: Math.max(0, happinessPenaltyPerDay),
	};
}

function getCalamityExtractionEfficiency(input: {
	activeCalamities: ActiveCalamityState[];
	gameDay: number;
	regionId: string;
	subSectorId: string;
}): number {
	return getCalamityModifiersForCitizen({
		activeCalamities: input.activeCalamities,
		gameDay: input.gameDay,
		regionId: input.regionId,
		subSectorId: input.subSectorId,
	}).extractionEfficiencyFactor;
}

function getVisibleActiveCalamities(
	active: ActiveCalamityState[],
	gameDay: number,
): ActiveCalamityState[] {
	return active.filter((calamity) => gameDay < calamity.midTermEndsOnGameDay);
}

function daysRemainingOnMidTerm(
	calamity: ActiveCalamityState,
	gameDay: number,
): number {
	return Math.max(0, calamity.midTermEndsOnGameDay - gameDay);
}

export type {
	ActiveCalamityState,
	CalamityHistoryEntryState,
	CalamityOnsetResult,
	CalamityRegionInput,
	CalamityRunSlice,
	MidTermModifiers,
	ProcessCalamitiesResult,
	RegionResourceMutation,
};
export {
	daysRemainingOnMidTerm,
	getCalamityExtractionEfficiency,
	getCalamityModifiersForCitizen,
	getVisibleActiveCalamities,
	processCalamitiesForDay,
	regionMatchesFilter,
	selectTargetRegions,
};
