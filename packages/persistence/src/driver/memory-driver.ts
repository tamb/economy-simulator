import type { StorageDriver, StorageStoreName } from "./types";

class MemoryDriver implements StorageDriver {
	private readonly stores = new Map<StorageStoreName, Map<string, unknown>>();

	private bucket(store: StorageStoreName): Map<string, unknown> {
		let bucket = this.stores.get(store);
		if (!bucket) {
			bucket = new Map();
			this.stores.set(store, bucket);
		}
		return bucket;
	}

	async get<T>(store: StorageStoreName, key: string): Promise<T | null> {
		const value = this.bucket(store).get(key);
		return value === undefined ? null : (value as T);
	}

	async set<T>(store: StorageStoreName, key: string, value: T): Promise<void> {
		this.bucket(store).set(key, value);
	}

	async remove(store: StorageStoreName, key: string): Promise<void> {
		this.bucket(store).delete(key);
	}

	async clear(store: StorageStoreName): Promise<void> {
		this.stores.set(store, new Map());
	}
}

export { MemoryDriver };
