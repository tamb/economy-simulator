import type { SectorRoleConfig } from "economy-simulator-data";

type SectorRoleConfigs = Record<string, SectorRoleConfig>;

function isSectorRoleConfig(value: unknown): value is SectorRoleConfig {
	if (!value || typeof value !== "object") return false;
	const config = value as SectorRoleConfig;
	return (
		Array.isArray(config.quotas) &&
		config.quotas.every(
			(quota) =>
				typeof quota.roleId === "number" && typeof quota.share === "number",
		)
	);
}

function isSectorRoleConfigs(value: unknown): value is SectorRoleConfigs {
	if (!value || typeof value !== "object") return false;
	return Object.values(value).every(isSectorRoleConfig);
}

export type { SectorRoleConfigs };
export { isSectorRoleConfig, isSectorRoleConfigs };
