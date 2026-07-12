import {
	clearNationalLedger as clearNationalLedgerRepo,
	loadNationalLedger as loadNationalLedgerRepo,
	saveNationalLedger as saveNationalLedgerRepo,
} from "economy-simulator-persistence";
import type { NationalLedger } from "economy-simulator-simulation";

async function loadNationalLedger(): Promise<NationalLedger | null> {
	return loadNationalLedgerRepo();
}

async function saveNationalLedger(ledger: NationalLedger): Promise<void> {
	await saveNationalLedgerRepo(ledger);
}

async function clearNationalLedger(): Promise<void> {
	await clearNationalLedgerRepo();
}

export { clearNationalLedger, loadNationalLedger, saveNationalLedger };
