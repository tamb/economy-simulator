import {
	clearGameRunState,
	ensureGameRunState,
	ensurePlayerProfile,
	loadGameRunState,
	loadPopulationMeta,
	saveGameRunState,
} from "economy-simulator-persistence";
import { clearNationalLedger } from "../storage/national-ledger";
import { clearPopulation } from "../storage/population";
import { clearRegionPool } from "../storage/regions";
import { clearSectorAssignments } from "../storage/sector-assignments";
import { clearSectorRoleConfigs } from "../storage/sector-role-config";
import { clearWorld } from "../storage/world";
import { archiveRunToProfile } from "./progression";

async function resetNationStores(): Promise<void> {
	await clearPopulation();
	await clearWorld();
	await clearNationalLedger();
	await clearSectorAssignments();
	await clearSectorRoleConfigs();
	await clearRegionPool();
}

async function abandonActiveRun(): Promise<void> {
	const meta = await loadPopulationMeta();
	const gameRun = await loadGameRunState();
	if (gameRun?.status === "active") {
		const abandoned = {
			...gameRun,
			status: "abandoned" as const,
			endedAt: Date.now(),
			endReason: "abandoned",
		};
		await saveGameRunState(abandoned);
		await archiveRunToProfile(abandoned, meta?.size ?? 0);
	}
}

async function startNewNation(size: number): Promise<void> {
	await abandonActiveRun();
	await resetNationStores();
	await clearGameRunState();
	await ensurePlayerProfile();
	await ensureGameRunState(size);
}

export { abandonActiveRun, resetNationStores, startNewNation };
