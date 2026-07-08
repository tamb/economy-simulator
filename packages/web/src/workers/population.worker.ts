/// <reference lib="webworker" />

import { advanceGameDay } from "../storage/population";
import type {
	PopulationWorkerRequest,
	PopulationWorkerResponse,
} from "./population-worker-protocol";

declare const self: DedicatedWorkerGlobalScope;

function post(message: PopulationWorkerResponse): void {
	self.postMessage(message);
}

self.onmessage = (event: MessageEvent<PopulationWorkerRequest>) => {
	if (event.data.type !== "advance-day") return;

	advanceGameDay(
		(processed, total) =>
			post({ type: "progress", phase: "daily", processed, total }),
		(processed, total) =>
			post({ type: "progress", phase: "annual", processed, total }),
	)
		.then((meta) => post({ type: "done", meta }))
		.catch((error: unknown) =>
			post({
				type: "error",
				message: error instanceof Error ? error.message : String(error),
			}),
		);
};
