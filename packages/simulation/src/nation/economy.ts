import {
	type FiscalBudgetLine,
	type GameSettings,
	gameSettings,
	type InfrastructureIndexId,
} from "economy-simulator-data";
import type {
	FiscalBudgetShares,
	FiscalPolicy,
	FiscalYearSummary,
	InfrastructureIndices,
	NationEconomyState,
	PublicServicesState,
	ServiceMetrics,
} from "./types";

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

function normalizeBudgetShares(shares: FiscalBudgetShares): FiscalBudgetShares {
	const total =
		shares.infrastructure +
		shares.healthcare +
		shares.education +
		shares.reliefReserve;
	if (total <= 1e-9) {
		return { ...gameSettings.fiscal.defaultBudgetShares };
	}
	return {
		infrastructure: shares.infrastructure / total,
		healthcare: shares.healthcare / total,
		education: shares.education / total,
		reliefReserve: shares.reliefReserve / total,
	};
}

function createInitialNationEconomyState(
	settings: GameSettings = gameSettings,
	policyOverrides?: Partial<FiscalPolicy>,
): NationEconomyState {
	const fiscal = settings.fiscal;
	const infra = settings.infrastructure;
	const services = settings.publicServices;
	const taxRate = clamp(
		policyOverrides?.taxRate ?? fiscal.defaultTaxRate,
		fiscal.taxRateMin,
		fiscal.taxRateMax,
	);
	const budgetShares = normalizeBudgetShares(
		policyOverrides?.budgetShares ?? { ...fiscal.defaultBudgetShares },
	);
	return {
		year: 0,
		treasury: fiscal.startingTreasury,
		debt: fiscal.startingDebt,
		policy: { taxRate, budgetShares },
		infrastructure: { ...infra.starting },
		services: {
			healthcare: {
				coverage: services.healthcare.startingCoverage,
				quality: services.healthcare.startingQuality,
			},
			education: {
				coverage: services.education.startingCoverage,
				quality: services.education.startingQuality,
			},
		},
		lastYear: null,
	};
}

/**
 * Apply economic-system fiscal bias deltas to default policy (Phase 1b).
 * Used once at new-game / first ensure when seeding Realm defaults.
 */
function applyEconomicSystemFiscalBias(
	systemId: string | undefined,
	settings: GameSettings = gameSettings,
): FiscalPolicy {
	const fiscal = settings.fiscal;
	const bias = systemId ? fiscal.economicSystemBias[systemId] : undefined;
	const taxRate = clamp(
		fiscal.defaultTaxRate + (bias?.taxRateDelta ?? 0),
		fiscal.taxRateMin,
		fiscal.taxRateMax,
	);
	const shares: FiscalBudgetShares = {
		infrastructure:
			fiscal.defaultBudgetShares.infrastructure +
			(bias?.infrastructureShareDelta ?? 0),
		healthcare:
			fiscal.defaultBudgetShares.healthcare +
			(bias?.healthcareShareDelta ?? 0),
		education:
			fiscal.defaultBudgetShares.education + (bias?.educationShareDelta ?? 0),
		reliefReserve:
			fiscal.defaultBudgetShares.reliefReserve +
			(bias?.reliefReserveShareDelta ?? 0),
	};
	return { taxRate, budgetShares: normalizeBudgetShares(shares) };
}

function meanInfrastructure(indices: InfrastructureIndices): number {
	return (indices.transport + indices.powerWater + indices.digital) / 3;
}

interface InfrastructureMultipliers {
	/** Multiplier on extraction yield (1 = neutral at starting mean). */
	extraction: number;
	/** Multiplier on inter-region flow arrivals. */
	flowCapacity: number;
	/** 0–1 delivery factor blended into public services. */
	serviceDelivery: number;
}

function computeInfrastructureMultipliers(
	indices: InfrastructureIndices,
	settings: GameSettings = gameSettings,
): InfrastructureMultipliers {
	const cfg = settings.infrastructure;
	const mean = meanInfrastructure(indices);
	const delta = (mean - cfg.neutralMeanIndex) / 100;
	const transportDelta = (indices.transport - cfg.neutralMeanIndex) / 100;
	return {
		extraction: 1 + cfg.extractionElasticity * delta,
		flowCapacity: Math.max(
			0.25,
			1 + cfg.flowCapacityElasticity * transportDelta,
		),
		serviceDelivery: clamp(
			0.55 +
				cfg.serviceDeliveryElasticity *
					(mean / 100 - cfg.neutralMeanIndex / 100),
			0.35,
			1.25,
		),
	};
}

interface InfrastructureTickInput {
	prior: InfrastructureIndices;
	/** National employment shares (0–1) by sub-sector id. */
	employmentShareBySubSector: Record<string, number>;
	/** Infrastructure budget spend this year (same units as output proxy). */
	infrastructureSpend: number;
	outputProxy: number;
	/** Calamity catalog ids that onset this year. */
	calamityIdsThisYear: string[];
	/** True when the player chose Rebuild on at least one capital-hitting onset. */
	rebuildResponseThisYear?: boolean;
	settings?: GameSettings;
}

interface InfrastructureTickResult {
	indices: InfrastructureIndices;
	calamityDamage: InfrastructureIndices;
	laborGain: InfrastructureIndices;
	investmentGain: InfrastructureIndices;
}

function diminishingFactor(index: number, settings: GameSettings): number {
	const cfg = settings.infrastructure;
	const ratio = clamp(index / cfg.max, 0, 1);
	return (1 - ratio) ** cfg.diminishingReturnsExponent;
}

function computeInfrastructureTick(
	input: InfrastructureTickInput,
): InfrastructureTickResult {
	const settings = input.settings ?? gameSettings;
	const cfg = settings.infrastructure;
	const constructionShare =
		input.employmentShareBySubSector.construction ?? 0;
	const utilitiesShare = input.employmentShareBySubSector.utilities ?? 0;
	const telecomShare =
		input.employmentShareBySubSector.telecommunications ?? 0;

	const laborGain: InfrastructureIndices = {
		transport:
			cfg.laborGainAtSaturation.constructionToTransport *
			Math.min(
				1,
				constructionShare /
					Math.max(1e-9, cfg.laborSaturationShare.construction),
			),
		powerWater:
			cfg.laborGainAtSaturation.utilitiesToPowerWater *
			Math.min(
				1,
				utilitiesShare / Math.max(1e-9, cfg.laborSaturationShare.utilities),
			),
		digital:
			cfg.laborGainAtSaturation.telecomToDigital *
			Math.min(
				1,
				telecomShare /
					Math.max(1e-9, cfg.laborSaturationShare.telecommunications),
			),
	};

	const investPctOfOutput =
		input.outputProxy > 1e-9
			? (input.infrastructureSpend / input.outputProxy) * 100
			: 0;
	const rawInvest =
		investPctOfOutput * cfg.investmentGainPerOutputPercent;
	const investmentGain: InfrastructureIndices = {
		transport: rawInvest * 0.45,
		powerWater: rawInvest * 0.35,
		digital: rawInvest * 0.2,
	};

	const calamityDamage: InfrastructureIndices = {
		transport: 0,
		powerWater: 0,
		digital: 0,
	};
	for (const calamityId of input.calamityIdsThisYear) {
		const hits = cfg.calamityIndexHits[calamityId];
		if (!hits) continue;
		for (const key of Object.keys(hits) as InfrastructureIndexId[]) {
			calamityDamage[key] += hits[key] ?? 0;
		}
	}
	if (input.rebuildResponseThisYear) {
		for (const key of Object.keys(calamityDamage) as InfrastructureIndexId[]) {
			calamityDamage[key] *= 1 - cfg.rebuildRecoveryFraction;
		}
	}

	const indices = { ...input.prior };
	for (const key of Object.keys(indices) as InfrastructureIndexId[]) {
		const decayed = indices[key] * (1 - cfg.annualDepreciation);
		const gain =
			(laborGain[key] + investmentGain[key]) *
			diminishingFactor(indices[key], settings);
		indices[key] = clamp(
			decayed + gain + calamityDamage[key],
			cfg.min,
			cfg.max,
		);
	}

	return { indices, calamityDamage, laborGain, investmentGain };
}

interface FiscalTickInput {
	priorTreasury: number;
	priorDebt: number;
	policy: FiscalPolicy;
	outputProxy: number;
	/** Extra treasury spent mid-year on calamity Relief/Rebuild. */
	calamityTreasurySpent?: number;
	settings?: GameSettings;
}

interface FiscalTickResult {
	treasury: number;
	debt: number;
	summary: FiscalYearSummary;
	/** Absolute spend amounts used by infrastructure / services ticks. */
	spendingByLine: Record<FiscalBudgetLine, number>;
}

function computeFiscalYear(input: FiscalTickInput): FiscalTickResult {
	const settings = input.settings ?? gameSettings;
	const fiscal = settings.fiscal;
	const taxRate = clamp(
		input.policy.taxRate,
		fiscal.taxRateMin,
		fiscal.taxRateMax,
	);
	const shares = normalizeBudgetShares(input.policy.budgetShares);
	const outputProxy = Math.max(0, input.outputProxy);
	const taxRevenue = outputProxy * taxRate;
	const debtService = input.priorDebt * fiscal.debtServiceRate;

	const spendingByLine: Record<FiscalBudgetLine, number> = {
		infrastructure: taxRevenue * shares.infrastructure,
		healthcare: taxRevenue * shares.healthcare,
		education: taxRevenue * shares.education,
		reliefReserve: taxRevenue * shares.reliefReserve,
	};
	let totalSpending =
		spendingByLine.infrastructure +
		spendingByLine.healthcare +
		spendingByLine.education +
		spendingByLine.reliefReserve;

	const calamitySpend = Math.max(0, input.calamityTreasurySpent ?? 0);
	let deficit =
		totalSpending + debtService + calamitySpend - taxRevenue;
	let treasury = input.priorTreasury - deficit;

	const softFloor = -fiscal.softDeficitCapFractionOfOutput * outputProxy;
	let insolvent = false;
	if (treasury < softFloor) {
		insolvent = true;
		const overshoot = softFloor - treasury;
		const scalable =
			spendingByLine.infrastructure +
			spendingByLine.healthcare +
			spendingByLine.education +
			spendingByLine.reliefReserve;
		if (scalable > 1e-9 && overshoot > 0) {
			const cutRatio = clamp(1 - overshoot / scalable, 0.25, 1);
			for (const line of Object.keys(spendingByLine) as FiscalBudgetLine[]) {
				spendingByLine[line] *= cutRatio;
			}
			totalSpending =
				spendingByLine.infrastructure +
				spendingByLine.healthcare +
				spendingByLine.education +
				spendingByLine.reliefReserve;
			deficit = totalSpending + debtService + calamitySpend - taxRevenue;
			treasury = input.priorTreasury - deficit;
		}
		treasury = Math.max(softFloor, treasury);
	}
	if (treasury <= fiscal.insolvencyTreasuryThreshold) {
		insolvent = true;
	}

	let debt = input.priorDebt;
	if (deficit > 0) {
		debt += deficit * fiscal.deficitToDebtFraction;
	}
	debt = Math.max(
		0,
		debt * (1 - fiscal.debtPrincipalRepaymentRate) - Math.max(0, -deficit) * 0.5,
	);

	return {
		treasury,
		debt,
		spendingByLine,
		summary: {
			outputProxy,
			taxRevenue,
			spendingByLine: { ...spendingByLine },
			totalSpending: totalSpending + calamitySpend,
			debtService,
			deficit,
			insolvent,
		},
	};
}

function spendTreasuryForCalamityResponse(
	treasury: number,
	response: "relief" | "rebuild" | "endure",
	settings: GameSettings = gameSettings,
): { didSpend: boolean; spent: number; remainingTreasury: number } {
	if (response === "endure") {
		return { didSpend: false, spent: 0, remainingTreasury: treasury };
	}
	const fiscal = settings.fiscal;
	if (treasury < fiscal.minSpendableTreasury) {
		return { didSpend: false, spent: 0, remainingTreasury: treasury };
	}
	const fraction =
		response === "relief"
			? fiscal.reliefTreasurySpendFraction
			: fiscal.rebuildTreasurySpendFraction;
	const spent = treasury * fraction;
	return {
		didSpend: spent > 0,
		spent,
		remainingTreasury: Math.max(0, treasury - spent),
	};
}

function taxPressureFromRate(
	taxRate: number,
	settings: GameSettings = gameSettings,
): { happinessPenaltyPerDay: number; emigrationBump: number } {
	const fiscal = settings.fiscal;
	const pointsAbove = Math.max(0, taxRate - fiscal.neutralTaxRate) * 100;
	return {
		happinessPenaltyPerDay: Math.min(
			fiscal.maxTaxHappinessPenaltyPerDay,
			pointsAbove * fiscal.taxHappinessPenaltyPerPoint,
		),
		emigrationBump: Math.min(
			fiscal.maxTaxEmigrationBump,
			pointsAbove * fiscal.taxEmigrationBumpPerPoint,
		),
	};
}

interface ServiceTickInput {
	prior: PublicServicesState;
	employmentShareBySubSector: Record<string, number>;
	healthcareSpend: number;
	educationSpend: number;
	outputProxy: number;
	serviceDeliveryMultiplier: number;
	settings?: GameSettings;
}

function staffingShare(
	subSectorIds: readonly string[],
	employment: Record<string, number>,
): number {
	return subSectorIds.reduce(
		(sum, id) => sum + (employment[id] ?? 0),
		0,
	);
}

function computeServicePair(
	prior: ServiceMetrics,
	staffShare: number,
	spend: number,
	outputProxy: number,
	delivery: number,
	cfg: {
		staffingSaturationShare: number;
		coverageFromStaffing: number;
		coverageFromBudgetAtFivePercentOutput: number;
		qualityFromBudgetAtFivePercentOutput: number;
		qualityFromStaffing: number;
	},
): ServiceMetrics {
	const staffFactor = Math.min(
		1,
		staffShare / Math.max(1e-9, cfg.staffingSaturationShare),
	);
	const spendPctOfOutput =
		outputProxy > 1e-9 ? (spend / outputProxy) * 100 : 0;
	const budgetFactor = spendPctOfOutput / 5;

	const targetCoverage =
		(cfg.coverageFromStaffing * staffFactor +
			cfg.coverageFromBudgetAtFivePercentOutput * budgetFactor) *
		delivery;
	const targetQuality =
		(cfg.qualityFromStaffing * staffFactor +
			cfg.qualityFromBudgetAtFivePercentOutput * budgetFactor) *
		delivery;

	// Slow chase so education/health feel sticky year-to-year.
	const coverage = clamp(prior.coverage * 0.65 + targetCoverage * 0.35, 0, 100);
	const quality = clamp(prior.quality * 0.65 + targetQuality * 0.35, 0, 100);
	return { coverage, quality };
}

function computePublicServicesTick(
	input: ServiceTickInput,
): PublicServicesState {
	const settings = input.settings ?? gameSettings;
	const svc = settings.publicServices;
	const delivery = clamp(
		1 -
			svc.infrastructureDeliveryWeight +
			svc.infrastructureDeliveryWeight * input.serviceDeliveryMultiplier,
		0.4,
		1.3,
	);

	return {
		healthcare: computeServicePair(
			input.prior.healthcare,
			staffingShare(
				svc.healthcare.staffingSubSectorIds,
				input.employmentShareBySubSector,
			),
			input.healthcareSpend,
			input.outputProxy,
			delivery,
			svc.healthcare,
		),
		education: computeServicePair(
			input.prior.education,
			staffingShare(
				svc.education.staffingSubSectorIds,
				input.employmentShareBySubSector,
			),
			input.educationSpend,
			input.outputProxy,
			delivery,
			svc.education,
		),
	};
}

interface PublicServiceEffects {
	/** Scales disease calamity happiness (and related) mid-term pressure. */
	diseaseSeverityScale: number;
	/** Flat daily health bonus (added after lag toward happiness). */
	healthFloorBonus: number;
	/** Multiplier on personality–job affinity delta. */
	educationAffinityMultiplier: number;
	/** Combined daily happiness penalty from coverage gaps. */
	underfundingHappinessPenaltyPerDay: number;
}

function computePublicServiceEffects(
	services: PublicServicesState,
	settings: GameSettings = gameSettings,
): PublicServiceEffects {
	const health = settings.publicServices.healthcare;
	const edu = settings.publicServices.education;
	const healthQuality = services.healthcare.quality / 100;
	const eduQuality = services.education.quality / 100;

	const healthGap = Math.max(
		0,
		(health.coveragePenaltyThreshold - services.healthcare.coverage) /
			health.coveragePenaltyThreshold,
	);
	const eduGap = Math.max(
		0,
		(edu.coveragePenaltyThreshold - services.education.coverage) /
			edu.coveragePenaltyThreshold,
	);

	return {
		diseaseSeverityScale: 1 - healthQuality * health.diseaseSeverityReductionMax,
		healthFloorBonus: healthQuality * health.healthFloorBonusMax,
		educationAffinityMultiplier: 1 + eduQuality * edu.affinityBoostMax,
		underfundingHappinessPenaltyPerDay:
			healthGap * health.underfundingHappinessPenaltyMax +
			eduGap * edu.underfundingHappinessPenaltyMax,
	};
}

interface NationEconomyTickInput {
	prior: NationEconomyState;
	year: number;
	/** Sum of national resource production (ledger throughput proxy). */
	outputProxy: number;
	employmentShareBySubSector: Record<string, number>;
	calamityIdsThisYear: string[];
	rebuildResponseThisYear?: boolean;
	calamityTreasurySpent?: number;
	settings?: GameSettings;
}

interface NationEconomyTickResult {
	state: NationEconomyState;
	multipliers: InfrastructureMultipliers;
	serviceEffects: PublicServiceEffects;
	taxPressure: ReturnType<typeof taxPressureFromRate>;
}

/**
 * Annual domestic-foundations tick (Phase 1). Settles fiscal accounts from
 * this year's output, then updates infrastructure and public services for
 * the closing state (multipliers for *next* year's extraction should use
 * the returned indices; callers that need mid-year multipliers should pass
 * prior indices into extraction first).
 */
function computeNationEconomyTick(
	input: NationEconomyTickInput,
): NationEconomyTickResult {
	const settings = input.settings ?? gameSettings;
	const fiscal = computeFiscalYear({
		priorTreasury: input.prior.treasury,
		priorDebt: input.prior.debt,
		policy: input.prior.policy,
		outputProxy: input.outputProxy,
		calamityTreasurySpent: input.calamityTreasurySpent,
		settings,
	});

	const infra = computeInfrastructureTick({
		prior: input.prior.infrastructure,
		employmentShareBySubSector: input.employmentShareBySubSector,
		infrastructureSpend: fiscal.spendingByLine.infrastructure,
		outputProxy: input.outputProxy,
		calamityIdsThisYear: input.calamityIdsThisYear,
		rebuildResponseThisYear: input.rebuildResponseThisYear,
		settings,
	});

	const multipliers = computeInfrastructureMultipliers(
		infra.indices,
		settings,
	);

	const services = computePublicServicesTick({
		prior: input.prior.services,
		employmentShareBySubSector: input.employmentShareBySubSector,
		healthcareSpend: fiscal.spendingByLine.healthcare,
		educationSpend: fiscal.spendingByLine.education,
		outputProxy: input.outputProxy,
		serviceDeliveryMultiplier: multipliers.serviceDelivery,
		settings,
	});

	const state: NationEconomyState = {
		year: input.year,
		treasury: fiscal.treasury,
		debt: fiscal.debt,
		policy: {
			taxRate: clamp(
				input.prior.policy.taxRate,
				settings.fiscal.taxRateMin,
				settings.fiscal.taxRateMax,
			),
			budgetShares: normalizeBudgetShares(input.prior.policy.budgetShares),
		},
		infrastructure: infra.indices,
		services,
		lastYear: fiscal.summary,
	};

	return {
		state,
		multipliers,
		serviceEffects: computePublicServiceEffects(services, settings),
		taxPressure: taxPressureFromRate(state.policy.taxRate, settings),
	};
}

export type {
	FiscalTickInput,
	FiscalTickResult,
	InfrastructureMultipliers,
	InfrastructureTickInput,
	InfrastructureTickResult,
	NationEconomyTickInput,
	NationEconomyTickResult,
	PublicServiceEffects,
	ServiceTickInput,
};
export {
	applyEconomicSystemFiscalBias,
	computeFiscalYear,
	computeInfrastructureMultipliers,
	computeInfrastructureTick,
	computeNationEconomyTick,
	computePublicServiceEffects,
	computePublicServicesTick,
	createInitialNationEconomyState,
	meanInfrastructure,
	normalizeBudgetShares,
	spendTreasuryForCalamityResponse,
	taxPressureFromRate,
};
