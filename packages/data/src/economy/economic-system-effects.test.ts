import { describe, expect, it } from "vitest";
import {
	economicSystemEffects,
	getEconomicSystemEffect,
} from "./economic-system-effects";
import { economicSystems } from "./economic-systems";

describe("economicSystemEffects", () => {
	it("defines an effect entry for every economic system", () => {
		expect(economicSystemEffects).toHaveLength(economicSystems.length);
		for (const system of economicSystems) {
			expect(getEconomicSystemEffect(system.id)).toBeDefined();
		}
	});

	it("keeps every multiplier positive", () => {
		for (const effect of economicSystemEffects) {
			expect(effect.efficiencyMultiplier).toBeGreaterThan(0);
			expect(effect.environmentalImpactMultiplier).toBeGreaterThan(0);
			expect(effect.moraleMultiplier).toBeGreaterThan(0);
		}
	});

	it("looks up an effect by system id", () => {
		expect(getEconomicSystemEffect("capitalism")?.efficiencyMultiplier).toBe(
			1.15,
		);
	});

	it("returns undefined for an id with no defined effect", () => {
		expect(getEconomicSystemEffect("not-a-system" as never)).toBeUndefined();
	});
});
