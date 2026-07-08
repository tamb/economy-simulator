import { describe, expect, it } from "vitest";
import { computeAnnualOutcomeForCitizen } from "./annual-cycle";

function sequenceRandom(values: number[]): () => number {
	let index = 0;
	return () => values[index++] ?? values.at(-1) ?? 0;
}

describe("computeAnnualOutcomeForCitizen", () => {
	it("reports death and skips emigration/fertility rolls when the citizen dies", () => {
		const outcome = computeAnnualOutcomeForCitizen(
			{ age: 95, sex: "F", happiness: 0, health: 0 },
			() => 0,
		);

		expect(outcome).toEqual({ died: true, emigrated: false, gaveBirth: false });
	});

	it("dies when the mortality roll is favorable at high risk", () => {
		const outcome = computeAnnualOutcomeForCitizen(
			{ age: 100, sex: "M", happiness: 0, health: 0 },
			sequenceRandom([0]),
		);

		expect(outcome.died).toBe(true);
		expect(outcome.emigrated).toBe(false);
		expect(outcome.gaveBirth).toBe(false);
	});

	it("can emigrate when it survives mortality but QoL is very low", () => {
		// First random() call is the mortality roll (must fail to survive),
		// second is the emigration roll (must succeed).
		const outcome = computeAnnualOutcomeForCitizen(
			{ age: 30, sex: "M", happiness: 0, health: 0 },
			sequenceRandom([0.999999, 0]),
		);

		expect(outcome.died).toBe(false);
		expect(outcome.emigrated).toBe(true);
		expect(outcome.gaveBirth).toBe(false);
	});

	it("can give birth for a surviving, non-emigrating woman of childbearing age", () => {
		// mortality roll fails, emigration roll fails (QoL above threshold), fertility roll succeeds
		const outcome = computeAnnualOutcomeForCitizen(
			{ age: 28, sex: "F", happiness: 80, health: 80 },
			sequenceRandom([0.999999, 0.999999, 0]),
		);

		expect(outcome.died).toBe(false);
		expect(outcome.emigrated).toBe(false);
		expect(outcome.gaveBirth).toBe(true);
	});

	it("is deterministic for a fixed random source", () => {
		const random = sequenceRandom([0.4, 0.4, 0.4]);
		const first = computeAnnualOutcomeForCitizen(
			{ age: 40, sex: "F", happiness: 60, health: 60 },
			random,
		);
		const second = computeAnnualOutcomeForCitizen(
			{ age: 40, sex: "F", happiness: 60, health: 60 },
			sequenceRandom([0.4, 0.4, 0.4]),
		);

		expect(first).toEqual(second);
	});
});
