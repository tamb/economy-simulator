import { describe, expect, it } from "vitest";
import { computeNationalLedger } from "./national-ledger";

describe("computeNationalLedger", () => {
	it("sums production for a resource across multiple regions", () => {
		const ledger = computeNationalLedger({
			production: [
				{ resourceId: "stone", amount: 10 },
				{ resourceId: "stone", amount: 5 },
			],
			industrialWorkersBySubSector: {},
		});
		const stone = ledger.resources.find(
			(entry) => entry.resourceId === "stone",
		);
		expect(stone?.production).toBe(15);
	});

	it("computes demand from industrial worker counts and resource requirements", () => {
		const ledger = computeNationalLedger({
			production: [],
			industrialWorkersBySubSector: { construction: 100 },
		});
		const stone = ledger.resources.find(
			(entry) => entry.resourceId === "stone",
		);
		const timber = ledger.resources.find(
			(entry) => entry.resourceId === "timber",
		);
		expect(stone?.demand).toBe(80); // 0.8 stone/worker * 100 workers
		expect(timber?.demand).toBe(60); // 0.6 timber/worker * 100 workers
	});

	it("reports full sufficiency (Infinity) when a resource has no demand", () => {
		const ledger = computeNationalLedger({
			production: [{ resourceId: "crops", amount: 50 }],
			industrialWorkersBySubSector: {},
		});
		const crops = ledger.resources.find(
			(entry) => entry.resourceId === "crops",
		);
		expect(crops?.sufficiency).toBe(Number.POSITIVE_INFINITY);
	});

	it("computes sufficiency as production over demand", () => {
		const ledger = computeNationalLedger({
			production: [{ resourceId: "fossilFuels", amount: 35 }],
			industrialWorkersBySubSector: { utilities: 100 }, // demand = 0.7 * 100 = 70
		});
		const fossilFuels = ledger.resources.find(
			(entry) => entry.resourceId === "fossilFuels",
		);
		expect(fossilFuels?.sufficiency).toBeCloseTo(0.5, 10);
	});

	it("applies no shortfall penalty when every required resource is sufficient", () => {
		const ledger = computeNationalLedger({
			production: [{ resourceId: "fossilFuels", amount: 1000 }],
			industrialWorkersBySubSector: { utilities: 10 },
		});
		expect(ledger.shortfallHappinessPenaltyBySubSector.utilities).toBe(0);
	});

	it("applies a shortfall penalty when a required resource is under-supplied", () => {
		const ledger = computeNationalLedger({
			production: [{ resourceId: "fossilFuels", amount: 0 }],
			industrialWorkersBySubSector: { utilities: 100 },
		});
		expect(
			ledger.shortfallHappinessPenaltyBySubSector.utilities,
		).toBeGreaterThan(0);
	});

	it("uses the worst (bottleneck) sufficiency across a sub-sector's multiple required resources", () => {
		const ledger = computeNationalLedger({
			production: [
				{ resourceId: "crops", amount: 1000 }, // plenty
				{ resourceId: "fish", amount: 0 }, // none at all
			],
			industrialWorkersBySubSector: { "food-processing": 100 },
		});
		// food-processing needs crops, livestock, and fish — fish is the bottleneck.
		expect(
			ledger.shortfallHappinessPenaltyBySubSector["food-processing"],
		).toBeGreaterThan(0);
	});

	it("caps the shortfall penalty at maxShortfallHappinessPenaltyPerDay for total shortage", () => {
		const ledger = computeNationalLedger({
			production: [],
			industrialWorkersBySubSector: { utilities: 100 },
		});
		expect(ledger.shortfallHappinessPenaltyBySubSector.utilities).toBeCloseTo(
			2,
			10,
		); // gameSettings.resources.ledger.maxShortfallHappinessPenaltyPerDay default
	});

	it("ignores a sub-sector with no resource requirement (non-industrial or unknown)", () => {
		const ledger = computeNationalLedger({
			production: [],
			industrialWorkersBySubSector: { agriculture: 100 },
		});
		expect(
			ledger.shortfallHappinessPenaltyBySubSector.agriculture,
		).toBeUndefined();
	});

	it("ignores a sub-sector with zero workers", () => {
		const ledger = computeNationalLedger({
			production: [],
			industrialWorkersBySubSector: { construction: 0 },
		});
		expect(
			ledger.resources.find((entry) => entry.resourceId === "stone"),
		).toBeUndefined();
	});
});
