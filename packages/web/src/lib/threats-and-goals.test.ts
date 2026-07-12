import type { GameRunState } from "economy-simulator-persistence";
import { createInitialGameRunState } from "economy-simulator-persistence";
import { describe, expect, it } from "vitest";
import { getThreatsAndGoals } from "./threats-and-goals";

function withStreaks(
	overrides: Partial<GameRunState["streaks"]>,
): GameRunState {
	const run = createInitialGameRunState(10_000);
	run.phase = "active";
	run.streaks = { ...run.streaks, ...overrides };
	return run;
}

describe("getThreatsAndGoals", () => {
	it("returns empty when inactive or missing", () => {
		expect(getThreatsAndGoals(null)).toEqual([]);
		expect(getThreatsAndGoals(createInitialGameRunState(1000))).toEqual([]);
	});

	it("surfaces active lose threats and win goals", () => {
		const items = getThreatsAndGoals(
			withStreaks({
				massExodus: 2,
				prosperity: 4,
			}),
		);
		expect(items).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					id: "mass_exodus",
					kind: "threat",
					progress: 2,
					target: 3,
				}),
				expect.objectContaining({
					id: "prosperity",
					kind: "goal",
					progress: 4,
					target: 10,
				}),
			]),
		);
	});
});
