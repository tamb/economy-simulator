import { appConfig } from "economy-simulator-data";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getPopulationSize, getPopulationSizeOverride } from "./runtime-config";

describe("getPopulationSize", () => {
	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it("falls back to appConfig.population.size when no override is set", () => {
		vi.stubEnv("VITE_POPULATION_SIZE", "");
		expect(getPopulationSize()).toBe(appConfig.population.size);
	});

	it("uses VITE_POPULATION_SIZE when it is a valid positive number", () => {
		vi.stubEnv("VITE_POPULATION_SIZE", "300");
		expect(getPopulationSize()).toBe(300);
	});

	it("floors non-integer overrides", () => {
		vi.stubEnv("VITE_POPULATION_SIZE", "300.9");
		expect(getPopulationSize()).toBe(300);
	});

	it("ignores invalid overrides", () => {
		vi.stubEnv("VITE_POPULATION_SIZE", "not-a-number");
		expect(getPopulationSize()).toBe(appConfig.population.size);
	});

	it("ignores non-positive overrides", () => {
		vi.stubEnv("VITE_POPULATION_SIZE", "0");
		expect(getPopulationSize()).toBe(appConfig.population.size);
	});
});

describe("getPopulationSizeOverride", () => {
	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it("returns null when no override is set", () => {
		vi.stubEnv("VITE_POPULATION_SIZE", "");
		expect(getPopulationSizeOverride()).toBeNull();
	});

	it("returns the parsed override when valid", () => {
		vi.stubEnv("VITE_POPULATION_SIZE", "300");
		expect(getPopulationSizeOverride()).toBe(300);
	});

	it("returns null for invalid overrides", () => {
		vi.stubEnv("VITE_POPULATION_SIZE", "not-a-number");
		expect(getPopulationSizeOverride()).toBeNull();
	});
});
