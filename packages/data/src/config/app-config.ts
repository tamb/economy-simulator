/**
 * Non-gameplay tunables — population scale, storage chunking, and other
 * performance/engineering knobs. Adjust freely without affecting simulation
 * balance (see `game-settings.ts` for rules that affect gameplay outcomes).
 */
const appConfig = {
	/** Player-facing product title shown in chrome, setup screens, and docs. */
	productName: "The Benevolent Monarch",
	population: {
		/** Total citizens simulated, chosen by the player at new-game setup. */
		size: 100_000,
		/** Choices offered on the new-game setup screen; `size` above is the default selection. */
		sizeOptions: [10_000, 100_000, 1_000_000],
		/**
		 * In-game days per full population quality-of-life refresh cycle.
		 * Each day updates 1/cohortCount of the population.
		 */
		cohortCount: 7,
		/** Persons stored per IndexedDB record within a cohort. */
		chunkSize: 5_000,
		/** Yield to the event loop every N persons during generation. */
		batchSize: 500,
		/** Bump when the stored Person snapshot shape changes. */
		storageVersion: 2,
		/** Cap on stored per-year dashboard stats history, oldest years drop off first. */
		yearlyStatsHistoryLimit: 500,
	},

	facePool: {
		/** Distinct generated faces shared across the population. */
		size: 100,
	},

	storage: {
		/** Active persistence backend — swap to `postgres` when that driver ships. */
		driver: "indexeddb" as "indexeddb" | "postgres",
	},

	regions: {
		/**
		 * Default radius of the bounding hex grid the island is grown within
		 * (equals the "More" region-scale option). Total hexes =
		 * 1 + 3 * radius * (radius + 1); only a subset become land — see
		 * `targetLandRatio`. The rest are ocean, guaranteeing every island
		 * is fully sea-surrounded. Passed explicitly at new-game time when
		 * the player picks Few / Medium / More.
		 */
		boundingRadius: 5,
		/**
		 * Choices on the new-game setup screen for how many provinces to
		 * generate. Fewer = denser / harder; More = thinner / easier.
		 */
		regionScaleOptions: [
			{ id: "few", label: "Few", boundingRadius: 3 },
			{ id: "medium", label: "Medium", boundingRadius: 4 },
			{ id: "more", label: "More", boundingRadius: 5 },
		],
		/** Default selection on the new-game setup screen. */
		defaultRegionScale: "more",
		/**
		 * Target fraction of the bounding grid's hexes that become land.
		 * The actual island generator (`economy-simulator-geography`) grows
		 * an organic shape toward this target rather than hitting it exactly.
		 */
		targetLandRatio: 0.55,
		/** Target fraction of land tiles that receive a bonus resource overlay (see `economy-simulator-data`'s `geography/resource-overlays`). */
		resourceOverlayRatio: 0.15,
		/** Bump when the persisted world/region shape or schema changes, forcing regeneration on load. */
		worldVersion: 1,
	},
} as const;

type AppConfig = typeof appConfig;

export type { AppConfig };
export { appConfig };
