import type { NationEconomyState } from "economy-simulator-simulation";
import {
	clearNationEconomy as clearPersisted,
	ensureNationEconomy as ensurePersisted,
	loadNationEconomy as loadPersisted,
	saveNationEconomy as savePersisted,
} from "economy-simulator-persistence";

async function loadNationEconomy(): Promise<NationEconomyState | null> {
	return loadPersisted();
}

async function saveNationEconomy(state: NationEconomyState): Promise<void> {
	await savePersisted(state);
}

async function clearNationEconomy(): Promise<void> {
	await clearPersisted();
}

async function ensureNationEconomy(
	policyOverrides?: Parameters<typeof ensurePersisted>[0],
): Promise<NationEconomyState> {
	return ensurePersisted(policyOverrides);
}

export {
	clearNationEconomy,
	ensureNationEconomy,
	loadNationEconomy,
	saveNationEconomy,
};
