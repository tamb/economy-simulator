import {
	createStorageDriver,
	MemoryDriver,
	resetStorageDriver,
	setStorageDriver,
} from "economy-simulator-persistence";
import { beforeEach, describe, expect, it } from "vitest";

describe("storage driver", () => {
	beforeEach(() => {
		resetStorageDriver();
		setStorageDriver(new MemoryDriver());
	});

	it("stores and retrieves values by store and key", async () => {
		const driver = new MemoryDriver();
		await driver.set("population", "test-key", { value: 42 });
		const loaded = await driver.get<{ value: number }>(
			"population",
			"test-key",
		);
		expect(loaded).toEqual({ value: 42 });
	});

	it("createStorageDriver returns indexeddb driver by default config", () => {
		const driver = createStorageDriver({ driver: "indexeddb" });
		expect(driver).toBeDefined();
	});
});
