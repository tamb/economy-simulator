export type {
	ActiveCalamityState,
	CalamityHistoryEntryState,
	CalamityOnsetResult,
	CalamityRegionInput,
	CalamityRunSlice,
	MidTermModifiers,
	ProcessCalamitiesResult,
	RegionResourceMutation,
} from "./calamities/calamity-engine";
export {
	daysRemainingOnMidTerm,
	getCalamityExtractionEfficiency,
	getCalamityModifiersForCitizen,
	getVisibleActiveCalamities,
	processCalamitiesForDay,
	regionMatchesFilter,
	selectTargetRegions,
} from "./calamities/calamity-engine";
export type { CalamityWeightBiasSnapshot } from "./calamities/weight-bias";
export {
	biasedCalamityWeight,
	getCalamityWeightMultiplier,
	stapleSufficiencyFromEntries,
} from "./calamities/weight-bias";
export type { JobAssignment, RandomFn } from "./employment/job-assignment";
export {
	assignJobSector,
	isWorkingAge,
	syncEmploymentWithAge,
} from "./employment/job-assignment";
export type {
	LaborEdictCandidate,
	LaborEdictTarget,
} from "./employment/labor-edict";
export {
	isEligibleLaborEdictWorker,
	selectLaborEdictCandidates,
} from "./employment/labor-edict";
export type { RegionalCapacityInput } from "./employment/regional-capacity";
export {
	computeRegionalCategoryMultipliers,
	terrainAffinity,
} from "./employment/regional-capacity";
export {
	assignRoleForCitizen,
	getRoleModifiersForCitizen,
	syncRoleWithAge,
} from "./employment/role-assignment";
export { rerollRoleForCitizen } from "./employment/role-reform";
export type {
	FiscalBudgetShares,
	FiscalPolicy,
	FiscalTickInput,
	FiscalTickResult,
	FiscalYearSummary,
	InfrastructureIndices,
	InfrastructureMultipliers,
	InfrastructureTickInput,
	InfrastructureTickResult,
	NationEconomyState,
	NationEconomyTickInput,
	NationEconomyTickResult,
	PublicServiceEffects,
	PublicServicesState,
	ServiceMetrics,
	ServiceTickInput,
} from "./nation";
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
} from "./nation";
export type {
	AnnualCitizenInput,
	AnnualCitizenOutcome,
} from "./population-dynamics/annual-cycle";
export { computeAnnualOutcomeForCitizen } from "./population-dynamics/annual-cycle";
export type { FertilityInput } from "./population-dynamics/fertility";
export {
	getQualityOfLifeFertilityMultiplier,
	rollFertility,
} from "./population-dynamics/fertility";
export type {
	EmigrationInput,
	ImmigrationInput,
} from "./population-dynamics/migration";
export {
	computeExpectedImmigrantCount,
	getEmigrationProbability,
	rollEmigration,
} from "./population-dynamics/migration";
export type { MortalityInput } from "./population-dynamics/mortality";
export {
	getQualityOfLifeMortalityMultiplier,
	rollMortality,
} from "./population-dynamics/mortality";
export type {
	CareerBadgeContext,
	RunBadgeYearContext,
} from "./progression/badge-evaluator";
export {
	evaluateCareerBadges,
	evaluateEndRunBadges,
	evaluateRunBadges,
} from "./progression/badge-evaluator";
export type {
	NationScoreBreakdown,
	NationScoreInput,
} from "./progression/nation-score";
export { computeNationScore } from "./progression/nation-score";
export type {
	WinLoseEvaluation,
	WinLoseStreaks,
	WinLoseYearContext,
} from "./progression/win-lose";
export { evaluateWinLose } from "./progression/win-lose";
export type {
	QualityOfLifeInput,
	QualityOfLifeState,
} from "./quality-of-life/daily-update";
export { computeDailyQualityOfLifeUpdate } from "./quality-of-life/daily-update";
export type { PersonalityProfile } from "./quality-of-life/personality-affinity";
export {
	CATEGORY_AFFINITY_WEIGHTS,
	getPersonalitySectorAffinity,
} from "./quality-of-life/personality-affinity";
export { getWorkHoursHappinessDelta } from "./quality-of-life/work-hours";
export { getBaseYieldPerWorker } from "./resources/base-yield";
export type { ExtractionEnvironmentEntry } from "./resources/environment";
export {
	computeAnnualEnvironmentQuality,
	getEnvironmentalQualityModifier,
} from "./resources/environment";
export type { ExtractionYieldInput } from "./resources/extraction-yield";
export {
	computeExtractionIntensity,
	computeExtractionYield,
} from "./resources/extraction-yield";
export type { FiniteDepletionResult } from "./resources/finite-depletion";
export { applyFiniteDepletion } from "./resources/finite-depletion";
export { axialDistance } from "./resources/hex-distance";
export type {
	FlowRegion,
	InterRegionFlowInput,
	InterRegionFlowResult,
	RegionalFlowBalance,
	RegionalResourceAmount,
} from "./resources/inter-region-flows";
export { computeInterRegionFlows } from "./resources/inter-region-flows";
export type {
	NationalLedger,
	NationalLedgerInput,
	RegionalProduction,
	ResourceLedgerEntry,
} from "./resources/national-ledger";
export {
	applyCalamityStockpileLoss,
	computeNationalLedger,
	spendStockpileForCalamityResponse,
} from "./resources/national-ledger";
export type { RenewableRegenerationResult } from "./resources/renewable-regeneration";
export { applyRenewableYear } from "./resources/renewable-regeneration";
export {
	computeFiniteYieldMultiplier,
	computeRenewableYieldMultiplier,
} from "./resources/reserve-yield-multiplier";
