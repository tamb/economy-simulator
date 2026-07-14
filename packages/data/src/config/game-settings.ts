/**
 * Tunable simulation rules — adjust before release. Unlike `app-config.ts`,
 * every value here can change balance/outcomes for the player.
 */

/** Nation infrastructure capital indices (Phase 1a). */
type InfrastructureIndexId = "transport" | "powerWater" | "digital";

/** Fiscal budget lines the monarch allocates (Phase 1b). */
type FiscalBudgetLine =
	| "infrastructure"
	| "healthcare"
	| "education"
	| "reliefReserve";

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
			/**
			 * Fallback inter-region throughput multiplier when no live
			 * infrastructure state is passed (Phase 1a computes this from
			 * transport index). 1 = neutral.
			 */
			infrastructureCapacityMultiplier: 1,
		},
	},

	/**
	 * Infrastructure capital stock (Phase 1a). Nation-level 0–100 indices
	 * raised by construction/utilities/telecom labor and fiscal investment,
	 * lowered by neglect and capital-hitting calamities. See
	 * research/infrastructure-fiscal-services.md §1.
	 */
	infrastructure: {
		starting: {
			transport: 45,
			powerWater: 45,
			digital: 40,
		},
		min: 0,
		max: 100,
		/** Annual decay when investment/labor are thin (neglect). */
		annualDepreciation: 0.025,
		/**
		 * Index points gained per year when employment share equals the
		 * saturation share (before diminishing returns).
		 */
		laborGainAtSaturation: {
			constructionToTransport: 4,
			utilitiesToPowerWater: 4,
			telecomToDigital: 3.5,
		},
		/** Employment share at which labor contribution saturates. */
		laborSaturationShare: {
			construction: 0.06,
			utilities: 0.04,
			telecommunications: 0.03,
		},
		/**
		 * Index points from spending 1% of output-proxy on the infrastructure
		 * budget line when the index is near zero (before diminishing returns).
		 */
		investmentGainPerOutputPercent: 2.2,
		/** Concave response: gain *= (1 - index/max)^exponent. */
		diminishingReturnsExponent: 0.55,
		/** Neutral mean index (0–100) at which production multipliers are 1.0. */
		neutralMeanIndex: 43,
		/** Output elasticity of public capital around the neutral mean (IMF-ish ~0.15). */
		extractionElasticity: 0.15,
		/** How strongly transport index lifts inter-region flow throughput. */
		flowCapacityElasticity: 0.2,
		/** How strongly mean infrastructure lifts health/education delivery. */
		serviceDeliveryElasticity: 0.25,
		/**
		 * Absolute index hits applied when a matching calamity starts this
		 * year (before Rebuild recovery). Keys are calamity catalog ids.
		 */
		calamityIndexHits: {
			power_outage: { powerWater: -8 },
			bridge_collapse: { transport: -10 },
			earthquake: { transport: -6, powerWater: -5, digital: -3 },
			volcanic_ash: { transport: -4, powerWater: -4 },
			flood: { transport: -3, powerWater: -5 },
			flash_flood: { transport: -2, powerWater: -4 },
			hurricane: { transport: -4, powerWater: -3, digital: -2 },
		} as Record<string, Partial<Record<InfrastructureIndexId, number>>>,
		/** Fraction of this year's calamity index damage restored by Rebuild. */
		rebuildRecoveryFraction: 0.55,
	},

	/**
	 * Fiscal core (Phase 1b). Annual treasury = tax − spend − debt service.
	 * Soft deficit cap; no full monetary policy. See
	 * research/infrastructure-fiscal-services.md §2.
	 */
	fiscal: {
		startingTreasury: 120,
		startingDebt: 0,
		/** Default overall tax-to-output rate (~developing-capacity band). */
		defaultTaxRate: 0.2,
		taxRateMin: 0.05,
		taxRateMax: 0.42,
		/** Tax rate at which happiness/emigration tax pressure is zero. */
		neutralTaxRate: 0.18,
		/** Daily happiness penalty per tax-rate point above neutral (0.01 = 1pp). */
		taxHappinessPenaltyPerPoint: 0.08,
		/** Cap on daily tax happiness pressure. */
		maxTaxHappinessPenaltyPerDay: 1.5,
		/** Annual emigration probability bump per tax-rate point above neutral. */
		taxEmigrationBumpPerPoint: 0.004,
		maxTaxEmigrationBump: 0.06,
		/** Soft floor: treasury may go this far negative as a fraction of output. */
		softDeficitCapFractionOfOutput: 0.08,
		/** Interest rate charged on outstanding debt each year. */
		debtServiceRate: 0.05,
		/** Share of a year's deficit that converts into debt stock. */
		deficitToDebtFraction: 1,
		/** Optional annual debt principal repayment as a fraction of debt. */
		debtPrincipalRepaymentRate: 0.05,
		/** Score points subtracted from the year total when insolvent. */
		insolvencyScorePenalty: 4,
		/** Treasury at or below this (and soft cap exhausted) counts as insolvent. */
		insolvencyTreasuryThreshold: 0,
		defaultBudgetShares: {
			infrastructure: 0.28,
			healthcare: 0.3,
			education: 0.27,
			reliefReserve: 0.15,
		},
		/**
		 * Cosmetic→mechanical priors: applied once when creating initial
		 * fiscal policy from the player's most common economic system.
		 * Player can override on the Realm dashboard.
		 */
		economicSystemBias: {
			capitalism: { taxRateDelta: -0.03, infrastructureShareDelta: 0.04 },
			socialism: { taxRateDelta: 0.05, healthcareShareDelta: 0.05 },
			tripartism: { taxRateDelta: 0.02, educationShareDelta: 0.03 },
			communism: { taxRateDelta: 0.08, infrastructureShareDelta: 0.05 },
			"mixed-economy": { taxRateDelta: 0.01 },
			mercantilism: { taxRateDelta: 0.02, infrastructureShareDelta: 0.04 },
			feudalism: { taxRateDelta: -0.06, reliefReserveShareDelta: 0.04 },
			"market-socialism": { taxRateDelta: 0.03, educationShareDelta: 0.03 },
			"state-capitalism": {
				taxRateDelta: 0.04,
				infrastructureShareDelta: 0.06,
			},
			"anarcho-capitalism": {
				taxRateDelta: -0.08,
				infrastructureShareDelta: -0.04,
			},
			subsistence: { taxRateDelta: -0.1, reliefReserveShareDelta: 0.06 },
		} as Record<
			string,
			{
				taxRateDelta?: number;
				infrastructureShareDelta?: number;
				healthcareShareDelta?: number;
				educationShareDelta?: number;
				reliefReserveShareDelta?: number;
			}
		>,
		/** Share of treasury spent when choosing Relief (alongside stockpile). */
		reliefTreasurySpendFraction: 0.06,
		/** Share of treasury spent when choosing Rebuild. */
		rebuildTreasurySpendFraction: 0.1,
		minSpendableTreasury: 1,
		/** Extra blunt when Relief successfully spends treasury. */
		reliefTreasuryBlunt: 0.9,
		/** Extra blunt when Rebuild successfully spends treasury. */
		rebuildTreasuryBlunt: 0.88,
	},

	/**
	 * Public-service policy (Phase 1c). Coverage × quality for healthcare
	 * and education, funded by budget lines + staffing, delivered through
	 * infrastructure. See research/infrastructure-fiscal-services.md §3.
	 */
	publicServices: {
		healthcare: {
			/** Sub-sector ids whose employment share funds coverage. */
			staffingSubSectorIds: ["healthcare"] as const,
			staffingSaturationShare: 0.05,
			/** Coverage points from saturated staffing (before infra). */
			coverageFromStaffing: 55,
			/** Coverage points from a full healthcare budget share of outlay/output. */
			coverageFromBudgetAtFivePercentOutput: 35,
			/** Quality points from budget intensity. */
			qualityFromBudgetAtFivePercentOutput: 40,
			/** Quality points from saturated staffing. */
			qualityFromStaffing: 30,
			startingCoverage: 48,
			startingQuality: 45,
			/** Max reduction of disease calamity happiness/mortality mid-term. */
			diseaseSeverityReductionMax: 0.4,
			/** Flat daily health floor bonus at quality 100. */
			healthFloorBonusMax: 0.35,
			/** Daily happiness penalty when coverage is at 0. */
			underfundingHappinessPenaltyMax: 1.4,
			/** Coverage at or above which underfunding penalty is 0. */
			coveragePenaltyThreshold: 55,
		},
		education: {
			staffingSubSectorIds: ["education", "higher-education"] as const,
			staffingSaturationShare: 0.06,
			coverageFromStaffing: 50,
			coverageFromBudgetAtFivePercentOutput: 35,
			qualityFromBudgetAtFivePercentOutput: 45,
			qualityFromStaffing: 25,
			startingCoverage: 46,
			startingQuality: 44,
			/**
			 * Single education gameplay channel (Phase 1c): quality slowly
			 * boosts personality–job affinity (knowledge-capital lite).
			 */
			affinityBoostMax: 0.35,
			underfundingHappinessPenaltyMax: 1.1,
			coveragePenaltyThreshold: 50,
		},
		/** Blend weight of mean infrastructure into service delivery (0–1). */
		infrastructureDeliveryWeight: 0.3,
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

export type { FiscalBudgetLine, GameSettings, InfrastructureIndexId };
export { gameSettings };
