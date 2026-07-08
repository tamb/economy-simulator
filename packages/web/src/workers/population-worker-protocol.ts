import type { PopulationMeta } from "../storage/population";

/** Messages the main thread sends to the population worker. */
type PopulationWorkerRequest = { type: "advance-day" };

/** Progress/result messages the population worker posts back to the main thread. */
type PopulationWorkerResponse =
	| {
			type: "progress";
			/** `daily` = today's cohort QoL tick; `annual` = the once-a-year population-dynamics cycle. */
			phase: "daily" | "annual";
			processed: number;
			total: number;
	  }
	| { type: "done"; meta: PopulationMeta | null }
	| { type: "error"; message: string };

export type { PopulationWorkerRequest, PopulationWorkerResponse };
