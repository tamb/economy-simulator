/// <reference lib="webworker" />

import { appConfig } from "economy-simulator-data";
import {
	createStorageDriver,
	setStorageDriver,
} from "economy-simulator-persistence";
import { advanceGameDay } from "../game/population-cycle";
import type {
	PopulationWorkerRequest,
	PopulationWorkerResponse,
} from "./population-worker-protocol";

declare const self: DedicatedWorkerGlobalScope;

setStorageDriver(createStorageDriver(appConfig.storage));

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
