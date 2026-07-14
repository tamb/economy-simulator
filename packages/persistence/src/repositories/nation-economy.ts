import type { NationEconomyState } from "economy-simulator-simulation";
import { createInitialNationEconomyState } from "economy-simulator-simulation";
import { getStorageDriver } from "../driver/registry";

const NATION_ECONOMY_KEY = "nation-economy";
const STORE = "world" as const;

function isNationEconomyState(value: unknown): value is NationEconomyState {
	if (!value || typeof value !== "object") return false;
	const state = value as NationEconomyState;
	return (
		typeof state.treasury === "number" &&
		typeof state.debt === "number" &&
		typeof state.policy?.taxRate === "number" &&
		typeof state.infrastructure?.transport === "number" &&
		typeof state.services?.healthcare?.coverage === "number" &&
		typeof state.services?.education?.coverage === "number"
	);
}

async function loadNationEconomy(): Promise<NationEconomyState | null> {
	const saved = await getStorageDriver().get<unknown>(
		STORE,
		NATION_ECONOMY_KEY,
	);
	return isNationEconomyState(saved) ? saved : null;
}

async function saveNationEconomy(state: NationEconomyState): Promise<void> {
	await getStorageDriver().set(STORE, NATION_ECONOMY_KEY, state);
}

async function clearNationEconomy(): Promise<void> {
	await getStorageDriver().remove(STORE, NATION_ECONOMY_KEY);
}

async function ensureNationEconomy(
	policyOverrides?: Parameters<typeof createInitialNationEconomyState>[1],
): Promise<NationEconomyState> {
	const existing = await loadNationEconomy();
	if (existing) return existing;
	const initial = createInitialNationEconomyState(undefined, policyOverrides);
	await saveNationEconomy(initial);
	return initial;
}

export {
	clearNationEconomy,
	ensureNationEconomy,
	isNationEconomyState,
	loadNationEconomy,
	saveNationEconomy,
};
