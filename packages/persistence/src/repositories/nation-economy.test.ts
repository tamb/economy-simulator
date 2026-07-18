import { createInitialNationEconomyState } from "economy-simulator-simulation";
import { beforeEach, describe, expect, it } from "vitest";
import { MemoryDriver, setStorageDriver } from "../driver/registry";
import {
	clearNationEconomy,
	ensureNationEconomy,
	isNationEconomyState,
	loadNationEconomy,
	saveNationEconomy,
} from "./nation-economy";

describe("nation-economy repository", () => {
	beforeEach(() => {
		setStorageDriver(new MemoryDriver());
	});

	it("round-trips nation economy state", async () => {
		const state = createInitialNationEconomyState();
		state.treasury = 88;
		state.infrastructure.transport = 55;
		await saveNationEconomy(state);

		const loaded = await loadNationEconomy();
		expect(loaded?.treasury).toBe(88);
		expect(loaded?.infrastructure.transport).toBe(55);
	});

	it("ensure creates defaults when empty", async () => {
		const ensured = await ensureNationEconomy();
		expect(ensured.treasury).toBeGreaterThan(0);
		expect(await loadNationEconomy()).not.toBeNull();
	});

	it("clears persisted state", async () => {
		await ensureNationEconomy();
		await clearNationEconomy();
		expect(await loadNationEconomy()).toBeNull();
	});

	it("rejects malformed persisted state on load", async () => {
		const driver = new MemoryDriver();
		setStorageDriver(driver);
		await driver.set("world", "nation-economy", {
			treasury: "not-a-number",
			debt: 0,
			policy: { taxRate: 0.2, budgetShares: {} },
			infrastructure: { transport: 50, powerWater: 50, digital: 50 },
			services: {
				healthcare: { coverage: 50, quality: 50 },
				education: { coverage: 50, quality: 50 },
			},
		});

		expect(isNationEconomyState({ treasury: "bad" })).toBe(false);
		expect(await loadNationEconomy()).toBeNull();
	});
});
