import type { GameRunState } from "economy-simulator-persistence";

/** Whether the main thread may post an advance-day message to the worker. */
function canAdvancePopulationWorker(
	run: GameRunState | null,
	isWorkerBusy: boolean,
): boolean {
	if (isWorkerBusy) return false;
	if (run && run.status !== "active") return false;
	if (run && run.phase !== "active") return false;
	return true;
}

/** Whether labor edict / role reform may be posted to the worker. */
function canMutatePopulationWorker(
	run: GameRunState | null,
	isWorkerBusy: boolean,
): boolean {
	if (isWorkerBusy) return false;
	if (!run || run.status !== "active" || run.phase !== "active") return false;
	return true;
}

/** Whether boot should restore an in-progress active game from persistence. */
function shouldResumeActivePopulationRun(
	hasPersistedPopulation: boolean,
	run: GameRunState | null | undefined,
): boolean {
	return (
		hasPersistedPopulation &&
		run?.phase === "active" &&
		run?.status === "active"
	);
}

export {
	canAdvancePopulationWorker,
	canMutatePopulationWorker,
	shouldResumeActivePopulationRun,
};
