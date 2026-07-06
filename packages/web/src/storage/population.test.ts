import { beforeEach, describe, expect, it, vi } from "vitest";

const memory = new Map<string, unknown>();

vi.mock("localforage", () => ({
	default: {
		createInstance: vi.fn(() => ({
			getItem: vi.fn(async (key: string) => memory.get(key) ?? null),
			setItem: vi.fn(async (key: string, value: unknown) => {
				memory.set(key, value);
			}),
			removeItem: vi.fn(async (key: string) => {
				memory.delete(key);
			}),
		})),
	},
}));

vi.mock("facesjs", () => ({
	generate: vi.fn(() => ({ body: { id: "mock-body" } })),
}));

import { POPULATION_SIZE } from "../data/population";
import { generatePopulation } from "../models/generatePopulation";
import { loadPopulation, savePopulation } from "./population";

describe("population storage", () => {
	beforeEach(() => {
		memory.clear();
	});

	it("saves and loads a full population", async () => {
		const people = await generatePopulation(5);
		await savePopulation(people as never);

		await expect(loadPopulation()).resolves.toBeNull();

		await savePopulation(
			Array.from({ length: POPULATION_SIZE }, (_, index) => ({
				name: `Citizen ${index}`,
			})),
		);

		const loaded = await loadPopulation();
		expect(loaded).toHaveLength(POPULATION_SIZE);
		expect(loaded?.[0]?.name).toBe("Citizen 0");
	});
});

describe("generatePopulation", () => {
	it("generates the requested number of citizens in batches", async () => {
		const progress: number[] = [];
		const people = await generatePopulation(120, (loaded) => {
			progress.push(loaded);
		});

		expect(people).toHaveLength(120);
		expect(people.every((person) => person.name)).toBe(true);
		expect(progress.at(-1)).toBe(120);
	});
});
