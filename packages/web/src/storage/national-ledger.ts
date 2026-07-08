import type { NationalLedger } from "economy-simulator-simulation";
import localforage from "localforage";

const LEDGER_KEY = "national-ledger";

const store = localforage.createInstance({
	name: "economy-simulator",
	storeName: "world",
});

function isNationalLedger(value: unknown): value is NationalLedger {
	if (!value || typeof value !== "object") return false;
	const ledger = value as NationalLedger;
	return (
		Array.isArray(ledger.resources) &&
		typeof ledger.shortfallHappinessPenaltyBySubSector === "object"
	);
}

/**
 * The most recently computed national resource ledger (production/demand/
 * sufficiency + per-sub-sector shortfall happiness penalties), recomputed
 * once a year by `runAnnualCycle` in `./population.ts`. Read by the daily
 * QoL pipeline (`models/updatePersonStats.ts`) and the Resource Ledger
 * dashboard tab.
 */
async function loadNationalLedger(): Promise<NationalLedger | null> {
	const saved = await store.getItem<unknown>(LEDGER_KEY);
	return isNationalLedger(saved) ? saved : null;
}

async function saveNationalLedger(ledger: NationalLedger): Promise<void> {
	await store.setItem(LEDGER_KEY, ledger);
}

async function clearNationalLedger(): Promise<void> {
	await store.removeItem(LEDGER_KEY);
}

export { clearNationalLedger, loadNationalLedger, saveNationalLedger };
