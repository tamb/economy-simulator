import { describe, expect, it } from "vitest";
import { appConfig } from "./app-config";
import { gameSettings } from "./game-settings";

describe("appConfig", () => {
	it("defines a positive population size divisible by the chunk size grouping", () => {
		expect(appConfig.population.size).toBeGreaterThan(0);
		expect(appConfig.population.chunkSize).toBeGreaterThan(0);
		expect(appConfig.population.batchSize).toBeGreaterThan(0);
	});

	it("offers the default population size as one of the setup screen's options", () => {
		expect(appConfig.population.sizeOptions).toContain(
			appConfig.population.size,
		);
		expect(appConfig.population.sizeOptions.length).toBeGreaterThan(0);
		for (const option of appConfig.population.sizeOptions) {
			expect(option).toBeGreaterThan(0);
		}
	});

	it("defines a cohort count that evenly divides the configured days per year", () => {
		expect(appConfig.population.cohortCount).toBeGreaterThan(0);
		expect(
			gameSettings.calendar.daysPerYear % appConfig.population.cohortCount,
		).toBe(0);
	});

	it("defines a positive face pool size", () => {
		expect(appConfig.facePool.size).toBeGreaterThan(0);
	});

	it("defines a positive yearly stats history limit", () => {
		expect(appConfig.population.yearlyStatsHistoryLimit).toBeGreaterThan(0);
	});

	it("defines a positive bounding hex-grid radius for the region map", () => {
		expect(appConfig.regions.boundingRadius).toBeGreaterThan(0);
	});

	it("keeps land ratio and resource overlay ratio valid fractions", () => {
		expect(appConfig.regions.targetLandRatio).toBeGreaterThan(0);
		expect(appConfig.regions.targetLandRatio).toBeLessThan(1);
		expect(appConfig.regions.resourceOverlayRatio).toBeGreaterThan(0);
		expect(appConfig.regions.resourceOverlayRatio).toBeLessThan(1);
	});

	it("defines a positive world version", () => {
		expect(appConfig.regions.worldVersion).toBeGreaterThan(0);
	});
});
