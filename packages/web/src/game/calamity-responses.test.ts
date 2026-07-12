import {
	type ActiveCalamity,
	createInitialGameRunState,
} from "economy-simulator-persistence";
import { describe, expect, it } from "vitest";
import { applyCalamityResponses } from "./calamity-responses";

function sampleCalamity(overrides?: Partial<ActiveCalamity>): ActiveCalamity {
	return {
		instanceId: "c1",
		calamityId: "forest_fire",
		name: "Forest Fire",
		severity: "moderate",
		regionIds: ["R00"],
		startedOnGameDay: 10,
		midTermEndsOnGameDay: 50,
		longTermEndsOnGameDay: 80,
		fromCascade: false,
		...overrides,
	};
}

describe("applyCalamityResponses", () => {
	it("shortens mid-term and softens happiness for relief", () => {
		const run = createInitialGameRunState(1000);
		run.phase = "active";
		run.activeCalamities = [sampleCalamity()];

		const next = applyCalamityResponses(run, ["c1"], "relief", 10);
		const calamity = next.activeCalamities[0];
		expect(calamity?.playerResponse).toBe("relief");
		expect(calamity?.happinessPenaltyScale).toBe(0.55);
		expect(calamity?.midTermEndsOnGameDay).toBeLessThan(50);
		expect(
			next.eventLog.some((event) => event.type === "calamity_response"),
		).toBe(true);
	});

	it("reduces extraction hit for rebuild", () => {
		const run = createInitialGameRunState(1000);
		run.phase = "active";
		run.activeCalamities = [sampleCalamity()];

		const next = applyCalamityResponses(run, ["c1"], "rebuild", 10);
		expect(next.activeCalamities[0]?.extractionHitScale).toBe(0.45);
		expect(next.activeCalamities[0]?.happinessPenaltyScale).toBe(1.15);
	});
});
