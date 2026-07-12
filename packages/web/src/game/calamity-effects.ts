import {
	type BiomeId,
	getBiome,
	getCalamityDefinition,
	type ResourceId,
	type Terrain,
} from "economy-simulator-data";
import type {
	ActiveCalamity,
	CalamityHistoryEntry,
	GameRunState,
	RegionResourceState,
} from "economy-simulator-persistence";
import type {
	CalamityOnsetResult,
	CalamityRegionInput,
	CalamityRunSlice,
	RegionResourceMutation,
} from "economy-simulator-simulation";
import type { WorldRegion } from "../lib/world";

function toCalamityRunSlice(gameRun: GameRunState): CalamityRunSlice {
	return {
		activeCalamities: gameRun.activeCalamities,
		calamityHistory: gameRun.calamityHistory,
		lastCalamityOnsetGameDay: gameRun.lastCalamityOnsetGameDay,
		lastSevereCalamityOnsetGameDay: gameRun.lastSevereCalamityOnsetGameDay,
	};
}

function mergeCalamityRunSlice(
	gameRun: GameRunState,
	slice: CalamityRunSlice,
): GameRunState {
	return {
		...gameRun,
		activeCalamities: slice.activeCalamities as ActiveCalamity[],
		calamityHistory: slice.calamityHistory as CalamityHistoryEntry[],
		lastCalamityOnsetGameDay: slice.lastCalamityOnsetGameDay,
		lastSevereCalamityOnsetGameDay: slice.lastSevereCalamityOnsetGameDay,
	};
}

function buildCalamityRegionInputs(
	regions: WorldRegion[],
	resourceStates: Record<string, RegionResourceState>,
): CalamityRegionInput[] {
	return regions
		.filter((region) => region.terrain !== "ocean")
		.map((region) => {
			const state = resourceStates[region.id];
			const fromReserves = Object.keys(
				state?.reserveOrCapacityByResource ?? {},
			) as ResourceId[];
			const fromBiome = Object.keys(
				getBiome(region.terrain as BiomeId)?.resourceYields ?? {},
			) as ResourceId[];
			const resourceIds = [
				...new Set([
					...fromReserves,
					...fromBiome,
					...(region.isCoastal ? (["fish"] as ResourceId[]) : []),
				]),
			];
			return {
				id: region.id,
				terrain: region.terrain,
				isCoastal: region.isCoastal,
				resourceIds,
			};
		});
}

function clampEnv(value: number): number {
	return Math.min(100, Math.max(0, value));
}

function applyCalamityMutations(input: {
	regions: WorldRegion[];
	resourceStates: Record<string, RegionResourceState>;
	mutations: RegionResourceMutation[];
}): {
	regions: WorldRegion[];
	resourceStates: Record<string, RegionResourceState>;
} {
	const nextRegions = input.regions.map((region) => ({ ...region }));
	const regionIndex = new Map(
		nextRegions.map((region, index) => [region.id, index]),
	);
	const nextResourceStates: Record<string, RegionResourceState> = {
		...input.resourceStates,
	};

	for (const mutation of input.mutations) {
		const index = regionIndex.get(mutation.regionId);
		if (index == null) continue;
		const region = nextRegions[index];
		if (!region) continue;

		const current = nextResourceStates[mutation.regionId] ?? {
			reserveOrCapacityByResource: {},
			environmentQuality: 100,
		};
		const nextReserves = { ...current.reserveOrCapacityByResource };
		for (const [resourceId, factor] of Object.entries(
			mutation.reserveOrCapacityByResource,
		)) {
			if (factor == null) continue;
			const currentValue = nextReserves[resourceId as ResourceId] ?? 1;
			nextReserves[resourceId as ResourceId] = Math.max(
				0,
				currentValue * factor,
			);
		}

		nextResourceStates[mutation.regionId] = {
			reserveOrCapacityByResource: nextReserves,
			environmentQuality: clampEnv(
				current.environmentQuality + mutation.environmentDelta,
			),
		};

		if (mutation.degradeTerrain && region.terrain !== "ocean") {
			const degradesTo = getBiome(region.terrain as BiomeId)?.degradesTo;
			if (degradesTo) {
				nextRegions[index] = {
					...region,
					terrain: degradesTo as Terrain,
				};
			}
		}
	}

	return { regions: nextRegions, resourceStates: nextResourceStates };
}

function sumOnsetBumps(onsets: CalamityOnsetResult[]): {
	mortalityBump: number;
	emigrationBump: number;
} {
	return onsets.reduce(
		(acc, onset) => ({
			mortalityBump: acc.mortalityBump + onset.mortalityBump,
			emigrationBump: acc.emigrationBump + onset.emigrationBump,
		}),
		{ mortalityBump: 0, emigrationBump: 0 },
	);
}

/** Sum mortality/emigration bumps for calamities that began during the completed year. */
function getYearCalamityBumps(
	gameRun: GameRunState,
	yearStartDay: number,
	yearEndDay: number,
): { mortalityBump: number; emigrationBump: number } {
	const startedThisYear = [
		...gameRun.activeCalamities.filter(
			(calamity) =>
				calamity.startedOnGameDay >= yearStartDay &&
				calamity.startedOnGameDay < yearEndDay,
		),
		...gameRun.calamityHistory.filter(
			(entry) =>
				entry.startedOnGameDay >= yearStartDay &&
				entry.startedOnGameDay < yearEndDay,
		),
	];

	let mortalityBump = 0;
	let emigrationBump = 0;
	for (const entry of startedThisYear) {
		const definition = getCalamityDefinition(entry.calamityId);
		if (!definition) continue;
		mortalityBump += definition.immediate.mortalityBump[entry.severity];
		emigrationBump += definition.immediate.emigrationBump[entry.severity];
	}
	return { mortalityBump, emigrationBump };
}

export {
	applyCalamityMutations,
	buildCalamityRegionInputs,
	getYearCalamityBumps,
	mergeCalamityRunSlice,
	sumOnsetBumps,
	toCalamityRunSlice,
};
