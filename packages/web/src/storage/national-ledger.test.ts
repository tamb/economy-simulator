import type { NationalLedger } from "economy-simulator-simulation";
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

import {
	clearNationalLedger,
	loadNationalLedger,
	saveNationalLedger,
} from "./national-ledger";

const sampleLedger: NationalLedger = {
	resources: [
		{ resourceId: "crops", production: 100, demand: 50, sufficiency: 2 },
	],
	shortfallHappinessPenaltyBySubSector: { "heavy-industry": 0 },
};

describe("national ledger storage", () => {
	beforeEach(() => {
		memory.clear();
	});

	it("returns null when no ledger has been saved yet", async () => {
		await expect(loadNationalLedger()).resolves.toBeNull();
	});

	it("persists and reloads a national ledger", async () => {
		await saveNationalLedger(sampleLedger);
		await expect(loadNationalLedger()).resolves.toEqual(sampleLedger);
	});

	it("clears a persisted ledger", async () => {
		await saveNationalLedger(sampleLedger);
		await clearNationalLedger();
		await expect(loadNationalLedger()).resolves.toBeNull();
	});
});
