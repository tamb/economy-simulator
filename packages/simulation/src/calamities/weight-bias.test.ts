import { getCalamityDefinition } from "economy-simulator-data";
import { describe, expect, it } from "vitest";
import {
	getCalamityWeightMultiplier,
	stapleSufficiencyFromEntries,
} from "./weight-bias";

describe("getCalamityWeightMultiplier", () => {
	it("raises forest fire weight when timber capacity is stressed", () => {
		const definition = getCalamityDefinition("forest_fire");
		expect(definition).toBeDefined();
		if (!definition) return;

		const calm = getCalamityWeightMultiplier(definition, {
			nationalAverageQualityOfLife: 60,
			nationalAverageEnvironment: 70,
			stapleSufficiency: 1,
			meanTimberCapacity: 1,
			meanFossilReserve: 1,
		});
		const stressed = getCalamityWeightMultiplier(definition, {
			nationalAverageQualityOfLife: 60,
			nationalAverageEnvironment: 70,
			stapleSufficiency: 1,
			meanTimberCapacity: 0.2,
			meanFossilReserve: 1,
		});
		expect(stressed).toBeGreaterThan(calm);
	});

	it("raises food riot weight under low QoL and food shortfall", () => {
		const definition = getCalamityDefinition("food_riot");
		expect(definition).toBeDefined();
		if (!definition) return;

		const calm = getCalamityWeightMultiplier(definition, {
			nationalAverageQualityOfLife: 70,
			nationalAverageEnvironment: 70,
			stapleSufficiency: 1.2,
			meanTimberCapacity: 1,
			meanFossilReserve: 1,
		});
		const stressed = getCalamityWeightMultiplier(definition, {
			nationalAverageQualityOfLife: 20,
			nationalAverageEnvironment: 70,
			stapleSufficiency: 0.3,
			meanTimberCapacity: 1,
			meanFossilReserve: 1,
		});
		expect(stressed).toBeGreaterThan(calm);
	});
});

describe("stapleSufficiencyFromEntries", () => {
	it("returns the worst staple sufficiency", () => {
		expect(
			stapleSufficiencyFromEntries([
				{ resourceId: "crops", sufficiency: 1.2 },
				{ resourceId: "livestock", sufficiency: 0.4 },
				{ resourceId: "fish", sufficiency: 0.9 },
			]),
		).toBeCloseTo(0.4);
	});
});
