import type { NationalLedger } from "economy-simulator-simulation";
import { getStorageDriver } from "../driver/registry";

const LEDGER_KEY = "national-ledger";
const STORE = "world" as const;

function isNationalLedger(value: unknown): value is NationalLedger {
	if (!value || typeof value !== "object") return false;
	const ledger = value as NationalLedger;
	return (
		Array.isArray(ledger.resources) &&
		typeof ledger.shortfallHappinessPenaltyBySubSector === "object"
	);
}

async function loadNationalLedger(): Promise<NationalLedger | null> {
	const saved = await getStorageDriver().get<unknown>(STORE, LEDGER_KEY);
	return isNationalLedger(saved) ? saved : null;
}

async function saveNationalLedger(ledger: NationalLedger): Promise<void> {
	await getStorageDriver().set(STORE, LEDGER_KEY, ledger);
}

async function clearNationalLedger(): Promise<void> {
	await getStorageDriver().remove(STORE, LEDGER_KEY);
}

export { clearNationalLedger, loadNationalLedger, saveNationalLedger };
