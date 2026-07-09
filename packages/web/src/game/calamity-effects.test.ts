import { describe, expect, it } from "vitest";
import {
	applyCalamityMutations,
	buildCalamityRegionInputs,
} from "./calamity-effects";

describe("calamity-effects", () => {
	it("builds region inputs with biome and coastal resources", () => {
		const inputs = buildCalamityRegionInputs(
			[
				{
					id: "R00",
					q: 0,
					r: 0,
					terrain: "forest",
					isCoastal: false,
				},
				{
					id: "R01",
					q: 1,
					r: 0,
					terrain: "plains",
					isCoastal: true,
				},
			],
			{
				R00: {
					reserveOrCapacityByResource: { timber: 0.8 },
					environmentQuality: 90,
				},
			},
		);

		expect(inputs).toHaveLength(2);
		expect(inputs[0]?.resourceIds).toContain("timber");
		expect(inputs[1]?.resourceIds).toContain("fish");
		expect(inputs[1]?.resourceIds).toContain("crops");
	});

	it("applies capacity factors, env delta, and terrain degrade", () => {
		const result = applyCalamityMutations({
			regions: [
				{
					id: "R00",
					q: 0,
					r: 0,
					terrain: "forest",
					isCoastal: false,
				},
			],
			resourceStates: {
				R00: {
					reserveOrCapacityByResource: { timber: 1 },
					environmentQuality: 80,
				},
			},
			mutations: [
				{
					regionId: "R00",
					reserveOrCapacityByResource: { timber: 0.5 },
					environmentDelta: -20,
					degradeTerrain: true,
				},
			],
		});

		expect(result.resourceStates.R00?.reserveOrCapacityByResource.timber).toBe(
			0.5,
		);
		expect(result.resourceStates.R00?.environmentQuality).toBe(60);
		expect(result.regions[0]?.terrain).toBe("clearedLand");
	});
});
