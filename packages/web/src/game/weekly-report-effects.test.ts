import { describe, expect, it, vi } from "vitest";
import { applyWeeklyChoiceEffects } from "./weekly-report-effects";

vi.mock("economy-simulator-persistence", async () => {
	const actual = await vi.importActual<
		typeof import("economy-simulator-persistence")
	>("economy-simulator-persistence");
	let run = actual.createInitialGameRunState(100);
	run.phase = "active";
	return {
		...actual,
		loadGameRunState: vi.fn(async () => run),
		saveGameRunState: vi.fn(async (next) => {
			run = next;
		}),
		loadPopulationMeta: vi.fn(async () => null),
		loadPopulationChunkRaw: vi.fn(async () => null),
		savePopulationChunkRaw: vi.fn(async () => undefined),
	};
});

vi.mock("../repos/world", () => ({
	ensureWorld: vi.fn(async () => []),
	ensureRegionResourceStates: vi.fn(async () => ({})),
	saveRegionResourceStates: vi.fn(async () => undefined),
	saveWorldRegions: vi.fn(async () => undefined),
}));

describe("applyWeeklyChoiceEffects", () => {
	it("pushes an emigration-risk temporary modifier for Endure-style picks", async () => {
		const next = await applyWeeklyChoiceEffects({
			gameDay: 14,
			regionId: "R00",
			regionName: "Harbor",
			choiceId: "let_them_endure",
			choiceLabel: "Let them endure",
			effects: { emigrationRisk: true },
		});

		expect(next).not.toBeNull();
		const modifier = next?.temporaryModifiers.find((entry) =>
			entry.id.includes("weekly-emigration"),
		);
		expect(modifier?.emigrationProbabilityBump).toBeGreaterThan(0);
		expect(modifier?.regionId).toBe("R00");
		expect(modifier?.expiresOnGameDay).toBeGreaterThan(14);
	});
});
