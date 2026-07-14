import { gameSettings } from "economy-simulator-data";
import { describe, expect, it } from "vitest";
import {
	applyEconomicSystemFiscalBias,
	computeInfrastructureMultipliers,
	computeInfrastructureTick,
	computeNationEconomyTick,
	computePublicServiceEffects,
	createInitialNationEconomyState,
	spendTreasuryForCalamityResponse,
	taxPressureFromRate,
} from "./economy";

describe("nation economy (Phase 1)", () => {
	it("creates initial state from GameSettings baselines", () => {
		const state = createInitialNationEconomyState();
		expect(state.treasury).toBe(gameSettings.fiscal.startingTreasury);
		expect(state.infrastructure.transport).toBe(
			gameSettings.infrastructure.starting.transport,
		);
		expect(state.services.healthcare.coverage).toBe(
			gameSettings.publicServices.healthcare.startingCoverage,
		);
	});

	it("applies economic-system fiscal bias to defaults", () => {
		const socialism = applyEconomicSystemFiscalBias("socialism");
		const capitalism = applyEconomicSystemFiscalBias("capitalism");
		expect(socialism.taxRate).toBeGreaterThan(capitalism.taxRate);
		expect(socialism.budgetShares.healthcare).toBeGreaterThan(
			capitalism.budgetShares.healthcare,
		);
	});

	it("raises transport from construction labor and investment", () => {
		const prior = createInitialNationEconomyState().infrastructure;
		const result = computeInfrastructureTick({
			prior,
			employmentShareBySubSector: {
				construction: 0.06,
				utilities: 0.04,
				telecommunications: 0.03,
			},
			infrastructureSpend: 50,
			outputProxy: 1000,
			calamityIdsThisYear: [],
		});
		expect(result.indices.transport).toBeGreaterThan(prior.transport);
		expect(result.indices.powerWater).toBeGreaterThan(prior.powerWater);
		expect(result.indices.digital).toBeGreaterThan(prior.digital);
	});

	it("lowers power/water on power_outage and recovers partially on rebuild", () => {
		const prior = createInitialNationEconomyState().infrastructure;
		const hit = computeInfrastructureTick({
			prior,
			employmentShareBySubSector: {},
			infrastructureSpend: 0,
			outputProxy: 1000,
			calamityIdsThisYear: ["power_outage"],
			rebuildResponseThisYear: false,
		});
		const rebuilt = computeInfrastructureTick({
			prior,
			employmentShareBySubSector: {},
			infrastructureSpend: 0,
			outputProxy: 1000,
			calamityIdsThisYear: ["power_outage"],
			rebuildResponseThisYear: true,
		});
		expect(hit.indices.powerWater).toBeLessThan(prior.powerWater);
		expect(rebuilt.indices.powerWater).toBeGreaterThan(hit.indices.powerWater);
	});

	it("computes extraction/flow multipliers around the neutral mean", () => {
		const neutral = computeInfrastructureMultipliers({
			transport: gameSettings.infrastructure.neutralMeanIndex,
			powerWater: gameSettings.infrastructure.neutralMeanIndex,
			digital: gameSettings.infrastructure.neutralMeanIndex,
		});
		expect(neutral.extraction).toBeCloseTo(1, 5);
		const strong = computeInfrastructureMultipliers({
			transport: 80,
			powerWater: 80,
			digital: 80,
		});
		expect(strong.extraction).toBeGreaterThan(1);
		expect(strong.flowCapacity).toBeGreaterThan(1);
	});

	it("settles fiscal year with tax revenue and budget line spends", () => {
		const prior = createInitialNationEconomyState();
		const tick = computeNationEconomyTick({
			prior,
			year: 1,
			outputProxy: 1000,
			employmentShareBySubSector: {
				construction: 0.05,
				healthcare: 0.04,
				education: 0.04,
			},
			calamityIdsThisYear: [],
		});
		expect(tick.state.lastYear).not.toBeNull();
		expect(tick.state.lastYear?.taxRevenue).toBeCloseTo(
			1000 * prior.policy.taxRate,
			5,
		);
		expect(tick.state.lastYear?.spendingByLine.healthcare).toBeGreaterThan(0);
		expect(tick.state.infrastructure.transport).not.toBe(
			prior.infrastructure.transport,
		);
		expect(tick.serviceEffects.educationAffinityMultiplier).toBeGreaterThan(1);
	});

	it("spends treasury on relief/rebuild and never on endure", () => {
		const relief = spendTreasuryForCalamityResponse(100, "relief");
		const endure = spendTreasuryForCalamityResponse(100, "endure");
		expect(relief.didSpend).toBe(true);
		expect(relief.remainingTreasury).toBeLessThan(100);
		expect(endure.didSpend).toBe(false);
		expect(endure.remainingTreasury).toBe(100);
	});

	it("applies tax pressure above the neutral rate", () => {
		const low = taxPressureFromRate(gameSettings.fiscal.neutralTaxRate);
		const high = taxPressureFromRate(gameSettings.fiscal.taxRateMax);
		expect(low.happinessPenaltyPerDay).toBe(0);
		expect(high.happinessPenaltyPerDay).toBeGreaterThan(0);
		expect(high.emigrationBump).toBeGreaterThan(0);
	});

	it("derives disease blunt and education affinity from service quality", () => {
		const weak = computePublicServiceEffects({
			healthcare: { coverage: 20, quality: 20 },
			education: { coverage: 20, quality: 20 },
		});
		const strong = computePublicServiceEffects({
			healthcare: { coverage: 90, quality: 90 },
			education: { coverage: 90, quality: 90 },
		});
		expect(strong.diseaseSeverityScale).toBeLessThan(weak.diseaseSeverityScale);
		expect(strong.educationAffinityMultiplier).toBeGreaterThan(
			weak.educationAffinityMultiplier,
		);
		expect(strong.underfundingHappinessPenaltyPerDay).toBeLessThan(
			weak.underfundingHappinessPenaltyPerDay,
		);
	});
});
