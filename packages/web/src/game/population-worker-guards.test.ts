import { createInitialGameRunState } from "economy-simulator-persistence";
import { describe, expect, it } from "vitest";
import {
	canAdvancePopulationWorker,
	canMutatePopulationWorker,
	shouldResumeActivePopulationRun,
} from "./population-worker-guards";

function activeRun() {
	return {
		...createInitialGameRunState(1000),
		phase: "active" as const,
		status: "active" as const,
	};
}

describe("population worker guards", () => {
	it("blocks advance and mutation while the worker is busy", () => {
		const run = activeRun();
		expect(canAdvancePopulationWorker(run, true)).toBe(false);
		expect(canMutatePopulationWorker(run, true)).toBe(false);
	});

	it("allows advance without a persisted game run when the worker is idle", () => {
		expect(canAdvancePopulationWorker(null, false)).toBe(true);
		expect(canMutatePopulationWorker(null, false)).toBe(false);
	});

	it("blocks advance and mutation for abandoned or setup runs", () => {
		const abandoned = {
			...activeRun(),
			status: "abandoned" as const,
			endReason: "abandoned" as const,
		};
		const setup = {
			...createInitialGameRunState(1000),
			phase: "setup" as const,
		};

		expect(canAdvancePopulationWorker(abandoned, false)).toBe(false);
		expect(canMutatePopulationWorker(abandoned, false)).toBe(false);
		expect(canAdvancePopulationWorker(setup, false)).toBe(false);
		expect(canMutatePopulationWorker(setup, false)).toBe(false);
	});

	it("allows advance and mutation only for active-phase active-status runs", () => {
		const run = activeRun();
		expect(canAdvancePopulationWorker(run, false)).toBe(true);
		expect(canMutatePopulationWorker(run, false)).toBe(true);
	});

	it("resumes boot only when population exists and the run is active", () => {
		const run = activeRun();
		expect(shouldResumeActivePopulationRun(true, run)).toBe(true);
		expect(shouldResumeActivePopulationRun(false, run)).toBe(false);
		expect(
			shouldResumeActivePopulationRun(true, {
				...run,
				status: "abandoned",
				endReason: "abandoned",
			}),
		).toBe(false);
		expect(
			shouldResumeActivePopulationRun(true, {
				...run,
				phase: "setup",
			}),
		).toBe(false);
	});
});
