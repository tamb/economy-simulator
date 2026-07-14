import { createInitialNationEconomyState } from "economy-simulator-simulation";
import { beforeEach, describe, expect, it } from "vitest";
import { MemoryDriver, setStorageDriver } from "../driver/registry";
import {
	clearNationEconomy,
	ensureNationEconomy,
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
});
