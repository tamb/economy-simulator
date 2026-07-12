import type { SectorRoleConfig } from "economy-simulator-data";
import {
	clearSectorRoleConfigStore,
	isSectorRoleConfigs,
	loadSectorRoleConfigRaw,
	saveSectorRoleConfigRaw,
} from "economy-simulator-persistence";

type SectorRoleConfigs = Record<string, SectorRoleConfig>;

async function loadSectorRoleConfigs(): Promise<SectorRoleConfigs> {
	const saved = await loadSectorRoleConfigRaw();
	if (!isSectorRoleConfigs(saved)) return {};
	return saved;
}

async function saveSectorRoleConfigs(
	configs: SectorRoleConfigs,
): Promise<void> {
	await saveSectorRoleConfigRaw(configs);
}

async function setSectorRoleConfig(
	configs: SectorRoleConfigs,
	key: string,
	config: SectorRoleConfig,
): Promise<SectorRoleConfigs> {
	const next = { ...configs, [key]: config };
	await saveSectorRoleConfigs(next);
	return next;
}

function getSectorRoleConfig(
	configs: SectorRoleConfigs,
	categoryId: string,
	subSectorId: string,
): SectorRoleConfig | null {
	return configs[`${categoryId}/${subSectorId}`] ?? null;
}

async function clearSectorRoleConfigs(): Promise<void> {
	await clearSectorRoleConfigStore();
}

export type { SectorRoleConfigs };
export {
	clearSectorRoleConfigs,
	getSectorRoleConfig,
	loadSectorRoleConfigs,
	saveSectorRoleConfigs,
	setSectorRoleConfig,
};
