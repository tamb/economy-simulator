import { describe, expect, it } from "vitest";
import { gameSettings } from "./game-settings";

describe("gameSettings", () => {
	it("defines minimum and maximum age", () => {
		expect(gameSettings.demographics.minAge).toBe(0);
		expect(gameSettings.demographics.maxAge).toBe(110);
	});

	it("keeps minAge below maxAge", () => {
		expect(gameSettings.demographics.minAge).toBeLessThan(
			gameSettings.demographics.maxAge,
		);
	});

	it("defines a positive number of days per year", () => {
		expect(gameSettings.calendar.daysPerYear).toBeGreaterThan(0);
	});

	it("keeps fertility age range within the overall demographic bounds", () => {
		expect(gameSettings.population.fertility.minAge).toBeGreaterThanOrEqual(
			gameSettings.demographics.minAge,
		);
		expect(gameSettings.population.fertility.maxAge).toBeLessThanOrEqual(
			gameSettings.demographics.maxAge,
		);
		expect(gameSettings.population.fertility.minAge).toBeLessThan(
			gameSettings.population.fertility.maxAge,
		);
	});

	it("defines emigration and immigration rates as valid probabilities", () => {
		expect(
			gameSettings.population.emigration.maxAnnualProbability,
		).toBeGreaterThan(0);
		expect(
			gameSettings.population.emigration.maxAnnualProbability,
		).toBeLessThanOrEqual(1);
		expect(
			gameSettings.population.immigration.baselineAnnualRate,
		).toBeGreaterThan(0);
	});

	it("defines a positive trait point budget and 0-100 happiness/health ranges", () => {
		expect(gameSettings.personGeneration.traitPointBudget).toBeGreaterThan(0);
		expect(gameSettings.personGeneration.happiness).toEqual({
			min: 0,
			max: 100,
		});
		expect(gameSettings.personGeneration.health).toEqual({
			min: 0,
			max: 100,
		});
	});

	it("defines a positive sustainable worker capacity and coastal fish yield", () => {
		const { extraction } = gameSettings.resources;
		expect(extraction.sustainableWorkerCapacity).toBeGreaterThan(0);
		expect(extraction.coastalFishYieldPerWorker).toBeGreaterThan(0);
	});

	it("keeps finite-resource depletion tunables within valid fraction ranges", () => {
		const { finite } = gameSettings.resources;
		expect(finite.extractionToDepletionRatio).toBeGreaterThan(0);
		expect(finite.lowReserveYieldFloor).toBeGreaterThanOrEqual(0);
		expect(finite.lowReserveYieldFloor).toBeLessThan(1);
		expect(finite.depletionTerrainShiftThreshold).toBeGreaterThan(0);
		expect(finite.depletionTerrainShiftThreshold).toBeLessThan(1);
	});

	it("keeps renewable-resource regeneration tunables within valid ranges", () => {
		const { renewable } = gameSettings.resources;
		expect(renewable.annualRegenRate).toBeGreaterThan(0);
		expect(renewable.annualRegenRate).toBeLessThanOrEqual(1);
		expect(renewable.overExtractionThreshold).toBeGreaterThan(1);
		expect(renewable.overExtractionDamageRate).toBeGreaterThan(0);
		expect(renewable.degradationTerrainShiftThreshold).toBeGreaterThan(0);
		expect(renewable.degradationTerrainShiftThreshold).toBeLessThanOrEqual(1);
	});

	it("keeps environment tunables within valid ranges", () => {
		const { environment } = gameSettings.resources;
		expect(environment.degradationPerExtractionIntensity).toBeGreaterThan(0);
		expect(environment.annualRecoveryRate).toBeGreaterThan(0);
		expect(environment.annualRecoveryRate).toBeLessThanOrEqual(1);
		expect(environment.qualityOfLifeWeight).toBeGreaterThan(0);
		expect(environment.qualityOfLifeWeight).toBeLessThanOrEqual(1);
	});

	it("keeps ledger shortfall tunables valid", () => {
		const { ledger } = gameSettings.resources;
		expect(ledger.maxShortfallHappinessPenaltyPerDay).toBeGreaterThan(0);
		expect(ledger.sufficiencyThreshold).toBeGreaterThan(0);
	});

	it("defines stockpile, flow, regional employment, and calamity bias tunables", () => {
		expect(
			gameSettings.resources.stockpile.targetCoverageDays.fossilFuels,
		).toBe(90);
		expect(gameSettings.resources.flows.baseFrictionPerHex).toBeGreaterThan(0);
		expect(
			gameSettings.employment.regional.minCapacityMultiplier,
		).toBeGreaterThan(0);
		expect(
			gameSettings.population.emigration.weeklyRiskProbabilityBump,
		).toBeGreaterThan(0);
		expect(
			gameSettings.calamities.bias.timberFireWeightMultiplier,
		).toBeGreaterThan(1);
	});
});
