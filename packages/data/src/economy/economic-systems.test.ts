import { describe, expect, it } from "vitest";
import {
	economicSystems,
	getEconomicSystem,
	isEconomicSystemId,
} from "./economic-systems";

describe("economic-systems", () => {
	it("lists all 11 economic systems from the reference docs", () => {
		expect(economicSystems).toHaveLength(11);
		expect(economicSystems.map((system) => system.id)).toEqual([
			"capitalism",
			"socialism",
			"tripartism",
			"communism",
			"mixed-economy",
			"mercantilism",
			"feudalism",
			"market-socialism",
			"state-capitalism",
			"anarcho-capitalism",
			"subsistence",
		]);
	});

	it("looks up systems by id", () => {
		expect(getEconomicSystem("tripartism")?.label).toBe("Tripartism");
	});

	it("validates economic system ids", () => {
		expect(isEconomicSystemId("capitalism")).toBe(true);
		expect(isEconomicSystemId("not-a-system")).toBe(false);
	});
});
