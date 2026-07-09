import type { RoleQuota } from "economy-simulator-data";
import { getRoleEffectOrDefault } from "economy-simulator-data";

type RandomFn = () => number;

/**
 * Weighted-random pick of a role id from per-sub-sector quotas.
 */
function assignRoleForCitizen(
	quotas: readonly RoleQuota[],
	random: RandomFn = Math.random,
): number | undefined {
	if (quotas.length === 0) return undefined;

	const total = quotas.reduce((sum, quota) => sum + quota.share, 0);
	if (total <= 0) return undefined;

	let roll = random() * total;
	for (const quota of quotas) {
		roll -= quota.share;
		if (roll <= 0) return quota.roleId;
	}

	return quotas[quotas.length - 1]?.roleId;
}

interface RoleModifiers {
	moraleMultiplier: number;
	efficiencyMultiplier: number;
	weeklyHoursOverride?: number;
	countsAsWorker: boolean;
}

function getRoleModifiersForCitizen(roleId: number | undefined): RoleModifiers {
	if (roleId == null) {
		return {
			moraleMultiplier: 1,
			efficiencyMultiplier: 1,
			countsAsWorker: false,
		};
	}

	const effect = getRoleEffectOrDefault(roleId);
	return {
		moraleMultiplier: effect.moraleMultiplier,
		efficiencyMultiplier: effect.efficiencyMultiplier,
		weeklyHoursOverride: effect.weeklyHoursOverride,
		countsAsWorker: effect.countsAsWorker,
	};
}

function syncRoleWithAge(
	_isWorking: boolean,
	currentRoleId: number | undefined,
	quotas: readonly RoleQuota[],
	random: RandomFn = Math.random,
): number | undefined {
	if (!_isWorking) return undefined;
	if (currentRoleId != null) return currentRoleId;
	return assignRoleForCitizen(quotas, random);
}

export type { RandomFn, RoleModifiers };
export { assignRoleForCitizen, getRoleModifiersForCitizen, syncRoleWithAge };
