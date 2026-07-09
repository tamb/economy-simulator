import { IndexedDbDriver } from "./indexed-db-driver";
import { MemoryDriver } from "./memory-driver";
import type { StorageConfig, StorageDriver } from "./types";

let activeDriver: StorageDriver | null = null;

function createStorageDriver(config: StorageConfig): StorageDriver {
	switch (config.driver) {
		case "indexeddb":
			return new IndexedDbDriver();
		case "postgres":
			throw new Error(
				"Postgres storage driver is not implemented yet. Use indexeddb.",
			);
		default: {
			const exhaustive: never = config.driver;
			throw new Error(`Unknown storage driver: ${exhaustive}`);
		}
	}
}

function getStorageDriver(): StorageDriver {
	if (!activeDriver) {
		throw new Error(
			"Storage driver not initialized. Call setStorageDriver() at app startup.",
		);
	}
	return activeDriver;
}

function setStorageDriver(driver: StorageDriver): void {
	activeDriver = driver;
}

function resetStorageDriver(): void {
	activeDriver = null;
}

export {
	createStorageDriver,
	getStorageDriver,
	MemoryDriver,
	resetStorageDriver,
	setStorageDriver,
};
