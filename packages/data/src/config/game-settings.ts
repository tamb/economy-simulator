/**
 * Tunable simulation rules — adjust before release. Unlike `app-config.ts`,
 * every value here can change balance/outcomes for the player.
 */
const gameSettings = {
	demographics: {
		/** Newborns and minimum citizen age. */
		minAge: 0,
		/**
		 * Absolute safety cap matching the oldest sourced life-table age
		 * (see `research/life-and-demographics.md`). Real death timing comes
		 * from the annual, age-and-sex mortality roll in
		 * `economy-simulator-simulation`'s population-dynamics module; this
		 * cutoff only guards against the (statistically tiny) chance a
		 * citizen keeps surviving indefinitely.
		 */
		maxAge: 110,
		/**
		 * Inclusive working-age range. Citizens enter the workforce at
		 * `workingAgeMin` and leave after `workingAgeMax` (children and
		 * retirees are never assigned a job sector). A designed gameplay
		 * band, not the World Bank/ILO 15–64 convention.
		 */
		workingAgeMin: 18,
		workingAgeMax: 65,
	},

	calendar: {
		/**
		 * In-game days per year. Kept divisible by
		 * `appConfig.population.cohortCount` so every year ends on a full
		 * quality-of-life refresh cycle boundary.
		 */
		daysPerYear: 364,
	},

	/**
	 * Daily quality-of-life tunables. See
	 * research/quality-of-life-rules.md for the sourcing and model behind
	 * each of these.
	 */
	work: {
		/** Upper bound of the "no penalty" work-hours dosage zone. */
		neutralZoneMaxHours: 48,
		/** Happiness lost per day for a working-age citizen with 0 weekly hours. Children and retirees are exempt. */
		idlePenaltyPerDay: 3,
		/** Happiness lost per day, per hour worked beyond `neutralZoneMaxHours`. */
		overworkPenaltyPerExcessHour: 0.15,
		/** Cap on the total daily overwork penalty, however far past the neutral zone. */
		maxOverworkPenaltyPerDay: 5,
		/** Max daily happiness swing (+/-) from personality-sector affinity alone. */
		sectorAffinityMaxDailyDelta: 2,
		/** Small +/- day-to-day happiness noise, independent of work/affinity. */
		dailyHappinessNoise: 1,
		/** Fraction of the happiness/health gap closed per day (health lags happiness). */
		healthLagRate: 0.03,
	},

	/**
	 * Starting-value tunables applied when a new citizen (initial
	 * population, newborn, or immigrant) is generated. The five OCEAN trait
	 * ids themselves are defined alongside the web `Person` model since
	 * they're part of its class shape; only the balance numbers live here.
	 */
	personGeneration: {
		/** Total personality trait points distributed across the five OCEAN dimensions at generation time. */
		traitPointBudget: 22,
		happiness: { min: 0, max: 100 },
		health: { min: 0, max: 100 },
	},

	/**
	 * Annual population-dynamics tunables (mortality/fertility QoL
	 * modulation, emigration, immigration). Runs once per game year across
	 * the whole population. See research/life-and-demographics.md for the
	 * sourced baselines these modulate.
	 */
	population: {
		fertility: {
			/** Childbearing age range used to spread the baseline TFR into an annual per-woman probability. */
			minAge: 15,
			maxAge: 49,
		},
		emigration: {
			/** Average of happiness+health below which emigration risk exists at all. */
			qolThreshold: 35,
			/** Emigration probability a citizen approaches as QoL nears zero. */
			maxAnnualProbability: 0.15,
			/**
			 * Absolute annual emigration probability added when the player
			 * chooses an Endure-style weekly option (`emigrationRisk`).
			 * Applied via a temporary run modifier until expiry.
			 */
			weeklyRiskProbabilityBump: 0.04,
			/** How long the weekly emigration-risk modifier lasts (game days). */
			weeklyRiskDurationDays: 21,
		},
		immigration: {
			/** National average QoL at which immigration sits at the baseline rate (no bonus/penalty). */
			neutralQualityOfLife: 50,
			/** Fraction of current population that immigrates annually at neutral national QoL. */
			baselineAnnualRate: 0.01,
			/** Extra annual immigration rate added/removed per 100 points of QoL above/below neutral. */
			qolSensitivity: 0.05,
		},
	},

	/**
	 * Annual resource-extraction, depletion, and environment tunables. Runs
	 * once per game year alongside the population dynamics above (same
	 * annual cycle). See research/resources-and-geography.md for the model
	 * behind each of these; values are a designed v1 balance, not measured.
	 */
	resources: {
		extraction: {
			/**
			 * Workers a single tile's resource can sustainably support at
			 * full (1.0) reserve/capacity before extraction intensity
			 * exceeds 1 — the shared baseline both finite depletion pacing
			 * and renewable over-extraction pacing scale against. A
			 * designed abstraction, not a modeled carrying capacity.
			 */
			sustainableWorkerCapacity: 8,
			/** Flat fish yield-per-worker granted to any coastal land tile, regardless of biome (fishing is adjacency-, not biome-, gated). */
			coastalFishYieldPerWorker: 1.0,
		},
		finite: {
			/** Fraction of a tile's remaining reserves consumed per unit extracted. */
			extractionToDepletionRatio: 0.02,
			/** Yield multiplier floor applied as reserves approach exhaustion (diminishing returns, never hits exactly 0 until reserves do). */
			lowReserveYieldFloor: 0.1,
			/** Remaining-reserve fraction below which a finite-resource tile's terrain can flip to its degraded variant. */
			depletionTerrainShiftThreshold: 0.05,
		},
		renewable: {
			/** Fraction of the gap to full carrying capacity a renewable resource regenerates per year when not over-extracted. */
			annualRegenRate: 0.1,
			/** Extraction-to-capacity ratio above which a renewable resource is considered over-extracted. */
			overExtractionThreshold: 1.2,
			/** Fraction of remaining carrying capacity lost per year of sustained over-extraction. */
			overExtractionDamageRate: 0.05,
			/** Cumulative capacity-loss fraction beyond which an over-extracted renewable tile's terrain can flip to its degraded variant. */
			degradationTerrainShiftThreshold: 0.6,
		},
		environment: {
			/** Environment-quality (0-100) lost per unit of extraction intensity, scaled by the resource's `environmentalImpact`. */
			degradationPerExtractionIntensity: 4,
			/** Fraction of the gap back to 100 that regional environment quality recovers per year when extraction eases. */
			annualRecoveryRate: 0.05,
			/** Weight of a region's environment quality (0-100) in its residents' daily QoL environmental modifier. */
			qualityOfLifeWeight: 0.15,
		},
		ledger: {
			/** Max daily happiness penalty applied to a sub-sector's workers when its national resource inputs are fully unmet (0% sufficiency). */
			maxShortfallHappinessPenaltyPerDay: 2,
			/** Sufficiency ratio (production / demand) at or above which a resource is considered fully sufficient (no shortfall penalty). */
			sufficiencyThreshold: 1.0,
		},
		/**
		 * National buffer / strategic stockpiles (Phase 0c). See
		 * research/stockpiles-flows-and-regional-employment.md. Magnitudes
		 * are designed balance informed by IEA/FAO order-of-magnitude
		 * coverage heuristics — not hard win conditions.
		 */
		stockpile: {
			/** Soft UI / mandate target: days of demand coverage by resource family. */
			targetCoverageDays: {
				crops: 60,
				livestock: 60,
				fish: 45,
				fossilFuels: 90,
				metalOre: 30,
				stone: 30,
				timber: 30,
			},
			/** Fraction of national stock destroyed on calamity onset by severity. */
			calamityLossFractionBySeverity: {
				minor: 0.05,
				moderate: 0.12,
				severe: 0.22,
			},
			/** Share of current stockpile spent when choosing Relief (per onset). */
			reliefSpendFraction: 0.08,
			/** Share of current stockpile spent when choosing Rebuild (per onset). */
			rebuildSpendFraction: 0.12,
			/**
			 * Extra multiplicative blunt to happinessPenaltyScale when Relief
			 * successfully spends stock (stacked on the base response scale).
			 */
			reliefStockpileBlunt: 0.85,
			/** Extra multiplicative blunt to extractionHitScale when Rebuild spends stock. */
			rebuildStockpileBlunt: 0.85,
			/** Minimum total stockpile units required before Relief/Rebuild spend applies. */
			minSpendableTotal: 1,
		},
		/**
		 * Domestic inter-region resource flows (Phase 0d). Gravity-style
		 * friction from hex distance; logistics employment reduces friction.
		 * Infrastructure capacity hook reserved for Phase 1a (defaults to 1).
		 */
		flows: {
			/** Ad-valorem-like friction added per hex step between surplus and deficit. */
			baseFrictionPerHex: 0.07,
			/** Cap on transfer friction (1 = nothing arrives). */
			maxFriction: 0.85,
			/**
			 * How much national transport-logistics employment share (0–1)
			 * reduces effective friction (1 = full reduction of the logistics term).
			 */
			logisticsFrictionReduction: 0.45,
			/** Employment share of transport-logistics at which logistics relief saturates. */
			logisticsSaturationShare: 0.04,
			/** Phase 1a infrastructure throughput multiplier hook (1 = no effect yet). */
			infrastructureCapacityMultiplier: 1,
		},
	},

	/**
	 * Regional employment capacity for non-extractive categories (Phase 0b).
	 * Extractive work remains biome/overlay-gated; industrial/services/
	 * knowledge/command shares vary by density, coast, and terrain.
	 */
	employment: {
		regional: {
			/** How strongly relative population density shifts non-extractive shares. */
			densityWeight: 0.45,
			/** Industrial share bonus for coastal land tiles. */
			coastalIndustrialBonus: 0.3,
			/** Services share bonus for coastal land tiles. */
			coastalServicesBonus: 0.12,
			/** Knowledge share bonus in denser-than-average regions. */
			densityKnowledgeBonus: 0.2,
			/** Floor / ceiling on category employment-share multipliers. */
			minCapacityMultiplier: 0.35,
			maxCapacityMultiplier: 2.25,
			/**
			 * Max fraction of a labor edict's movers that may come from
			 * outside the densest source regions when reassigning into
			 * industrial/services/knowledge/command (sticky labor).
			 */
			laborEdictCrossRegionShareCap: 0.45,
		},
	},

	/**
	 * Calamity (nation debuff) tunables. Catalog definitions live in
	 * `packages/data/src/calamities/catalog/*.json`; this block only
	 * controls frequency, stacking, bias, and which tiers are eligible.
	 */
	calamities: {
		/**
		 * Average expected primary calamity onsets per game year (before
		 * cooldowns/caps). Tuned for ~1.5 random pressure events per 28-day
		 * month (364-day year / 13 months).
		 */
		expectedPerYear: 18,
		/** Soft cooldown in days after any onset before another primary roll. */
		cooldownDaysAfterOnset: 14,
		/** Extra cooldown after a severe onset. */
		cooldownDaysAfterSevere: 28,
		/**
		 * If no primary onset has occurred within this many days, force one
		 * when the mid-term cap allows (guarantees at least one per month).
		 * A game month is 28 days (13 months per 364-day year).
		 */
		guaranteedOnsetIntervalDays: 28,
		/** Max concurrent mid-term (visible) debuffs. */
		maxActiveMidTerm: 4,
		/** Inclusive tiers eligible for primary rolls (cascades may still fire). */
		enabledTiers: ["v1", "v1.5", "v2"] as const,
		/** Cap cascade spawns from a single primary onset. */
		maxCascadesPerOnset: 2,
		/**
		 * World-state weight bias (Phase 0e). Multipliers apply on top of
		 * static catalog weights. Social/political calamities remain QoL
		 * debuffs until Phase 2 politics — bias only changes onset odds.
		 */
		bias: {
			/** Timber capacity fraction at or below which fire weights rise. */
			timberStressCapacityThreshold: 0.55,
			/** Max multiplier on forest_fire / accidental_fire when timber is stressed. */
			timberFireWeightMultiplier: 2.4,
			/** National average QoL at or below which food_riot / labor_strike rise. */
			lowQolThreshold: 40,
			/** Max multiplier on social unrest calamities under low QoL. */
			lowQolSocialWeightMultiplier: 2.2,
			/** Staple (crops/livestock/fish) sufficiency at or below which food_riot rises. */
			foodSufficiencyThreshold: 0.75,
			foodRiotWeightMultiplier: 2.0,
			/** Environment quality (0–100 national mean) at or below which disease rises. */
			lowEnvironmentThreshold: 45,
			diseaseWeightMultiplier: 1.7,
			/** Fossil-fuel reserve stress → well_blowout / oil_spill weight. */
			fossilStressReserveThreshold: 0.5,
			fossilAccidentWeightMultiplier: 1.8,
		},
	},

	/** Nation scoring, win/lose thresholds, and badge-related balance. */
	progression: {
		scoreWeights: {
			qualityOfLife: 0.3,
			populationGrowth: 0.25,
			netMigration: 0.15,
			resourceSufficiency: 0.2,
			environmentHealth: 0.1,
		},
		lose: {
			populationCollapseRatio: 0.1,
			populationCollapseYears: 3,
			massExodusRate: 0.05,
			massExodusYears: 3,
			qolCrisisThreshold: 30,
			qolCrisisYears: 5,
			resourceFamineSufficiency: 50,
			resourceFamineYears: 3,
			environmentRuinThreshold: 25,
			environmentRuinYears: 3,
		},
		win: {
			prosperityQol: 65,
			prosperityYears: 10,
			growthPopulationRatio: 2,
			growthQol: 55,
			growthYears: 3,
			highScoreThreshold: 75,
			highScoreYears: 5,
			longReignYears: 50,
		},
	},
} as const;

type GameSettings = typeof gameSettings;

export type { GameSettings };
export { gameSettings };
