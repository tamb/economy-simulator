import type { CategoryId } from "economy-simulator-data";
import type { LaborEdictTarget } from "economy-simulator-simulation";
import type { AdvanceGameDayResult } from "../game/advance-day-result";
import type { PopulationMeta } from "../storage/population";

/** Messages the main thread sends to the population worker. */
type PopulationWorkerRequest =
	| { type: "advance-day" }
	| {
			type: "apply-labor-edict";
			source: LaborEdictTarget;
			target: LaborEdictTarget;
			percent: number;
			gameDay: number;
	  }
	| {
			type: "apply-role-reform";
			categoryId: CategoryId;
			subSectorId: string;
			gameDay: number;
	  };

type PopulationMutationResult = { affected: number };

/** Progress/result messages the population worker posts back to the main thread. */
type PopulationWorkerResponse =
	| {
			type: "progress";
			/** `daily` = today's cohort QoL tick; `annual` = the once-a-year population-dynamics cycle; `mutation` = edict/reform scan. */
			phase: "daily" | "annual" | "mutation";
			processed: number;
			total: number;
	  }
	| { type: "done"; result: AdvanceGameDayResult }
	| { type: "mutation-done"; result: PopulationMutationResult }
	| { type: "error"; message: string };

export type {
	PopulationMeta,
	PopulationMutationResult,
	PopulationWorkerRequest,
	PopulationWorkerResponse,
};
