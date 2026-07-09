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
export type { JobAssignment, RandomFn } from "./employment/job-assignment";
export { assignJobSector, isWorkingAge } from "./employment/job-assignment";
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
export type {
	NationalLedger,
	NationalLedgerInput,
	RegionalProduction,
	ResourceLedgerEntry,
} from "./resources/national-ledger";
export { computeNationalLedger } from "./resources/national-ledger";
export type { RenewableRegenerationResult } from "./resources/renewable-regeneration";
export { applyRenewableYear } from "./resources/renewable-regeneration";
export {
	computeFiniteYieldMultiplier,
	computeRenewableYieldMultiplier,
} from "./resources/reserve-yield-multiplier";
