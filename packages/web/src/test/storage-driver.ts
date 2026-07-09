import {
	MemoryDriver,
	resetStorageDriver,
	setStorageDriver,
} from "economy-simulator-persistence";

function setupMemoryStorage(): void {
	resetStorageDriver();
	setStorageDriver(new MemoryDriver());
}

export { setupMemoryStorage };
