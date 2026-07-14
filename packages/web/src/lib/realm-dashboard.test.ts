import { createInitialNationEconomyState } from "economy-simulator-simulation";
import { describe, expect, it } from "vitest";
import { clampTaxRate, updateNationFiscalPolicy } from "./realm-dashboard";

describe("realm-dashboard helpers", () => {
	it("clamps tax rate to GameSettings bounds", () => {
		expect(clampTaxRate(-1)).toBeGreaterThan(0);
		expect(clampTaxRate(1)).toBeLessThan(1);
	});

	it("normalizes budget shares after a partial update", () => {
		const state = createInitialNationEconomyState();
		const next = updateNationFiscalPolicy(state, {
			taxRate: 0.25,
			budgetShares: { healthcare: 0.5 },
		});
		expect(next.policy.taxRate).toBe(0.25);
		const shares = next.policy.budgetShares;
		const sum =
			shares.infrastructure +
			shares.healthcare +
			shares.education +
			shares.reliefReserve;
		expect(sum).toBeCloseTo(1, 5);
		expect(shares.healthcare).toBeGreaterThan(
			state.policy.budgetShares.healthcare,
		);
	});
});
