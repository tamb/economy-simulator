/// <reference lib="webworker" />

import { appConfig } from "economy-simulator-data";
import {
	createStorageDriver,
	setStorageDriver,
} from "economy-simulator-persistence";
import { advanceGameDay } from "../game/population-cycle";
import { applyLaborEdict, applyRoleReform } from "../game/population-mutations";
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
	const request = event.data;

	if (request.type === "advance-day") {
		advanceGameDay(
			(processed, total) =>
				post({ type: "progress", phase: "daily", processed, total }),
			(processed, total) =>
				post({ type: "progress", phase: "annual", processed, total }),
		)
			.then((result) => post({ type: "done", result }))
			.catch((error: unknown) =>
				post({
					type: "error",
					message: error instanceof Error ? error.message : String(error),
				}),
			);
		return;
	}

	if (request.type === "apply-labor-edict") {
		applyLaborEdict({
			source: request.source,
			target: request.target,
			percent: request.percent,
			gameDay: request.gameDay,
			onProgress: (processed, total) =>
				post({ type: "progress", phase: "mutation", processed, total }),
		})
			.then((result) => post({ type: "mutation-done", result }))
			.catch((error: unknown) =>
				post({
					type: "error",
					message: error instanceof Error ? error.message : String(error),
				}),
			);
		return;
	}

	if (request.type === "apply-role-reform") {
		applyRoleReform({
			categoryId: request.categoryId,
			subSectorId: request.subSectorId,
			gameDay: request.gameDay,
			onProgress: (processed, total) =>
				post({ type: "progress", phase: "mutation", processed, total }),
		})
			.then((result) => post({ type: "mutation-done", result }))
			.catch((error: unknown) =>
				post({
					type: "error",
					message: error instanceof Error ? error.message : String(error),
				}),
			);
	}
};
