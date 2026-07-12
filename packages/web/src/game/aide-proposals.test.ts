import { createInitialGameRunState } from "economy-simulator-persistence";
import { describe, expect, it } from "vitest";
import { assignInnerCircle, buildAideProposalSummary } from "./aide-proposals";

describe("aide proposals", () => {
	it("assigns four distinct inner-circle aides from the face pool", () => {
		const aides = assignInnerCircle(["01", "02", "03", "04", "05"]);
		expect(aides).toHaveLength(4);
		expect(new Set(aides.map((aide) => aide.role)).size).toBe(4);
		expect(new Set(aides.map((aide) => aide.faceId)).size).toBe(4);
	});

	it("builds a proposal summary when the inner circle is present", () => {
		const run = {
			...createInitialGameRunState(1000),
			phase: "active" as const,
			innerCircle: assignInnerCircle(["10", "11", "12", "13"]),
			activeMandate: {
				id: "raise_qol" as const,
				label: "Lift the people",
				description: "Raise QoL",
				yearIssued: 1,
				scoreBonus: 2,
			},
		};

		const proposal = buildAideProposalSummary(run, 13, () => 0);
		expect(proposal).not.toBeNull();
		expect(proposal?.gameDay).toBe(13);
		expect(proposal?.choices).toHaveLength(3);
		expect(proposal?.aideName).toBeTruthy();
		expect(proposal?.dialog.length).toBeGreaterThan(0);
	});

	it("returns null without an inner circle", () => {
		const run = createInitialGameRunState(1000);
		expect(buildAideProposalSummary(run, 13, () => 0)).toBeNull();
	});
});
