import { getDefaultSystemForSubSector } from "./default-sector-systems";
import { getDefaultRoleQuotasForSystem } from "./economic-roles";
import type { EconomicSystemId } from "./economic-systems";
import { isEconomicSystemId } from "./economic-systems";
import { roleBelongsToSystem } from "./role-effects";
import {
	categories,
	getAllSubSectorEmploymentShares,
	sectorKey,
} from "./taxonomy";

interface RoleQuota {
	roleId: number;
	share: number;
}

interface SectorRoleConfig {
	quotas: RoleQuota[];
}

type SectorAssignments = Record<string, EconomicSystemId>;
type SectorRoleConfigs = Record<string, SectorRoleConfig>;

interface NationSetupValidationIssue {
	sectorKey: string;
	categoryLabel: string;
	subSectorLabel: string;
	reason: string;
}

interface NationSetupValidationResult {
	ready: boolean;
	configuredCount: number;
	totalCount: number;
	issues: NationSetupValidationIssue[];
}

const QUOTA_SUM_TOLERANCE = 0.001;

function quotasSumToOne(quotas: RoleQuota[]): boolean {
	const total = quotas.reduce((sum, quota) => sum + quota.share, 0);
	return Math.abs(total - 1) <= QUOTA_SUM_TOLERANCE;
}

function isSectorRoleConfigValid(
	systemId: EconomicSystemId,
	config: SectorRoleConfig | undefined,
): boolean {
	if (!config?.quotas?.length) return false;
	if (!quotasSumToOne(config.quotas)) return false;
	return config.quotas.every(
		(quota) => quota.share > 0 && roleBelongsToSystem(quota.roleId, systemId),
	);
}

function isSectorFullyConfigured(
	categoryId: string,
	subSectorId: string,
	assignments: SectorAssignments,
	roleConfigs: SectorRoleConfigs,
): boolean {
	const key = sectorKey(categoryId as never, subSectorId);
	const systemId = assignments[key];
	if (!systemId || !isEconomicSystemId(systemId)) return false;
	return isSectorRoleConfigValid(systemId, roleConfigs[key]);
}

function validateNationSetup(
	assignments: SectorAssignments,
	roleConfigs: SectorRoleConfigs,
): NationSetupValidationResult {
	const issues: NationSetupValidationIssue[] = [];
	let configuredCount = 0;
	const totalCount = getAllSubSectorEmploymentShares().length;

	for (const category of categories) {
		for (const subSector of category.subSectors) {
			const key = sectorKey(category.id, subSector.id);
			const systemId = assignments[key];

			if (!systemId || !isEconomicSystemId(systemId)) {
				issues.push({
					sectorKey: key,
					categoryLabel: category.shortLabel,
					subSectorLabel: subSector.label,
					reason: "Economic system not assigned",
				});
				continue;
			}

			const roleConfig = roleConfigs[key];
			if (!roleConfig?.quotas?.length) {
				issues.push({
					sectorKey: key,
					categoryLabel: category.shortLabel,
					subSectorLabel: subSector.label,
					reason: "Role quotas not configured",
				});
				continue;
			}

			if (!quotasSumToOne(roleConfig.quotas)) {
				issues.push({
					sectorKey: key,
					categoryLabel: category.shortLabel,
					subSectorLabel: subSector.label,
					reason: "Role quotas must sum to 100%",
				});
				continue;
			}

			const invalidRole = roleConfig.quotas.find(
				(quota) =>
					quota.share <= 0 || !roleBelongsToSystem(quota.roleId, systemId),
			);
			if (invalidRole) {
				issues.push({
					sectorKey: key,
					categoryLabel: category.shortLabel,
					subSectorLabel: subSector.label,
					reason: "Role quota includes invalid role for assigned system",
				});
				continue;
			}

			configuredCount += 1;
		}
	}

	return {
		ready: issues.length === 0,
		configuredCount,
		totalCount,
		issues,
	};
}

function buildAutoAssignments(): SectorAssignments {
	const assignments: SectorAssignments = {};
	for (const { categoryId, subSectorId } of getAllSubSectorEmploymentShares()) {
		assignments[sectorKey(categoryId, subSectorId)] =
			getDefaultSystemForSubSector(categoryId, subSectorId);
	}
	return assignments;
}

function buildAutoRoleConfigs(
	assignments: SectorAssignments,
): SectorRoleConfigs {
	const configs: SectorRoleConfigs = {};
	for (const [key, systemId] of Object.entries(assignments)) {
		if (!isEconomicSystemId(systemId)) continue;
		configs[key] = {
			quotas: getDefaultRoleQuotasForSystem(systemId),
		};
	}
	return configs;
}

export type {
	NationSetupValidationIssue,
	NationSetupValidationResult,
	SectorRoleConfig,
	SectorRoleConfigs,
};
export {
	buildAutoAssignments,
	buildAutoRoleConfigs,
	isSectorFullyConfigured,
	isSectorRoleConfigValid,
	quotasSumToOne,
	validateNationSetup,
};
