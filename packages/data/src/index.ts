export type {
	CalamityCascadeRule,
	CalamityCategory,
	CalamityDefinition,
	CalamityImmediateEffects,
	CalamityPhaseModifiers,
	CalamityScope,
	CalamitySeverity,
	CalamityTargetFilter,
	CalamityTier,
	SeverityNumberMap,
	SeverityRangeMap,
	SeverityResourceFactorMap,
} from "./calamities";
export {
	calamityDefinitions,
	getCalamityDefinition,
	getCalamityDefinitions,
} from "./calamities";
export type { AppConfig } from "./config/app-config";
export { appConfig } from "./config/app-config";
export type { GameSettings } from "./config/game-settings";
export { gameSettings } from "./config/game-settings";
export type { LifeTableRow, Sex } from "./demographics/life-tables";
export {
	femaleLifeTable,
	GLOBAL_BASELINE_TOTAL_FERTILITY_RATE,
	getAnnualMortalityProbability,
	getLifeTable,
	getRemainingLifeExpectancy,
	maleLifeTable,
	REPLACEMENT_TOTAL_FERTILITY_RATE,
} from "./demographics/life-tables";
export {
	defaultSystemBySubSector,
	getAllSubSectorKeys,
	getDefaultSystemForSubSector,
} from "./economy/default-sector-systems";
export type {
	EconomicRole,
	RoleEligibility,
	RoleQuota,
} from "./economy/economic-roles";
export {
	defaultRoleQuotasBySystem,
	economicRoles,
	getDefaultRoleQuotasForSystem,
	getEconomicRole,
	getRolesForSystem,
	isEconomicRoleId,
} from "./economy/economic-roles";
export type { EconomicSystemEffect } from "./economy/economic-system-effects";
export {
	economicSystemEffects,
	getEconomicSystemEffect,
} from "./economy/economic-system-effects";
export type {
	EconomicSystem,
	EconomicSystemId,
} from "./economy/economic-systems";
export {
	economicSystems,
	getEconomicSystem,
	isEconomicSystemId,
} from "./economy/economic-systems";
export type {
	NationSetupValidationIssue,
	NationSetupValidationResult,
	SectorRoleConfig,
	SectorRoleConfigs,
} from "./economy/nation-setup-validation";
export {
	buildAutoAssignments,
	buildAutoRoleConfigs,
	isSectorFullyConfigured,
	isSectorRoleConfigValid,
	quotasSumToOne,
	validateNationSetup,
} from "./economy/nation-setup-validation";
export type { RoleEffect } from "./economy/role-effects";
export {
	getRoleEffect,
	getRoleEffectOrDefault,
	roleBelongsToSystem,
	roleEffects,
} from "./economy/role-effects";
export type {
	Category,
	CategoryId,
	SubSector,
	WeightedSubSector,
} from "./economy/taxonomy";
export {
	categories,
	getAllSubSectorEmploymentShares,
	getCategory,
	getSubSector,
	sectorKey,
} from "./economy/taxonomy";
export type { BiomeDefinition, BiomeId, Terrain } from "./geography/biomes";
export { biomes, getBiome, isLand } from "./geography/biomes";
export type {
	ResourceOverlayDefinition,
	ResourceOverlayId,
} from "./geography/resource-overlays";
export {
	getEligibleOverlaysForBiome,
	getResourceOverlay,
	resourceOverlays,
} from "./geography/resource-overlays";
export type { ResourceRequirement } from "./geography/resource-requirements";
export {
	getResourceRequirement,
	resourceRequirements,
} from "./geography/resource-requirements";
export type { ResourceDefinition, ResourceId } from "./geography/resources";
export {
	getResource,
	getResourceForSubSector,
	resources,
} from "./geography/resources";
export { getViableExtractiveSubSectorIds } from "./geography/viable-sub-sectors";
export type { BadgeDefinition, BadgeScope } from "./progression/badges";
export { badgeDefinitions, getBadgeDefinition } from "./progression/badges";
