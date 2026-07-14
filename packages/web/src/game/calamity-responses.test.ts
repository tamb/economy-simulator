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

		const result = applyCalamityResponses(run, ["c1"], "relief", 10);
		const calamity = result.gameRun.activeCalamities[0];
		expect(calamity?.playerResponse).toBe("relief");
		expect(calamity?.happinessPenaltyScale).toBe(0.55);
		expect(calamity?.midTermEndsOnGameDay).toBeLessThan(50);
		expect(
			result.gameRun.eventLog.some(
				(event) => event.type === "calamity_response",
			),
		).toBe(true);
		expect(result.didSpendStockpile).toBe(false);
	});

	it("reduces extraction hit for rebuild", () => {
		const run = createInitialGameRunState(1000);
		run.phase = "active";
		run.activeCalamities = [sampleCalamity()];

		const result = applyCalamityResponses(run, ["c1"], "rebuild", 10);
		expect(result.gameRun.activeCalamities[0]?.extractionHitScale).toBe(0.45);
		expect(result.gameRun.activeCalamities[0]?.happinessPenaltyScale).toBe(
			1.15,
		);
	});

	it("spends stockpile on relief and further blunts happiness scale", () => {
		const run = createInitialGameRunState(1000);
		run.phase = "active";
		run.activeCalamities = [sampleCalamity()];

		const result = applyCalamityResponses(run, ["c1"], "relief", 10, {
			stockpileByResource: { crops: 100, timber: 50 },
		});
		expect(result.didSpendStockpile).toBe(true);
		expect(result.totalStockpileSpent).toBeGreaterThan(0);
		expect(result.remainingStockpileByResource.crops).toBeLessThan(100);
		expect(
			result.gameRun.activeCalamities[0]?.happinessPenaltyScale,
		).toBeLessThan(0.55);
	});

	it("spends treasury on rebuild and further blunts extraction hit", () => {
		const run = createInitialGameRunState(1000);
		run.phase = "active";
		run.activeCalamities = [sampleCalamity()];

		const result = applyCalamityResponses(run, ["c1"], "rebuild", 10, {
			treasury: 200,
		});
		expect(result.didSpendTreasury).toBe(true);
		expect(result.totalTreasurySpent).toBeGreaterThan(0);
		expect(result.remainingTreasury).toBeLessThan(200);
		expect(
			result.gameRun.activeCalamities[0]?.extractionHitScale,
		).toBeLessThan(0.45);
	});
});
