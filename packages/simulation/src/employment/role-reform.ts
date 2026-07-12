import type { RoleQuota } from "economy-simulator-data";
import { assignRoleForCitizen } from "./role-assignment";

/**
 * Re-roll economic role for a working citizen using current sector quotas.
 */
function rerollRoleForCitizen(
	quotas: readonly RoleQuota[],
	random: () => number,
): number | undefined {
	return assignRoleForCitizen(quotas, random);
}

export { rerollRoleForCitizen };
