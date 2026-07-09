import localforage from "localforage";
import type { StorageDriver, StorageStoreName } from "./types";

const DB_NAME = "economy-simulator";

class IndexedDbDriver implements StorageDriver {
	private readonly instances = new Map<StorageStoreName, LocalForage>();

	private instance(store: StorageStoreName): LocalForage {
		let instance = this.instances.get(store);
		if (!instance) {
			instance = localforage.createInstance({
				name: DB_NAME,
				storeName: store,
			});
			this.instances.set(store, instance);
		}
		return instance;
	}

	async get<T>(store: StorageStoreName, key: string): Promise<T | null> {
		const value = await this.instance(store).getItem<unknown>(key);
		return value === null ? null : (value as T);
	}

	async set<T>(store: StorageStoreName, key: string, value: T): Promise<void> {
		await this.instance(store).setItem(key, value);
	}

	async remove(store: StorageStoreName, key: string): Promise<void> {
		await this.instance(store).removeItem(key);
	}

	async clear(store: StorageStoreName): Promise<void> {
		await this.instance(store).clear();
	}
}

export { IndexedDbDriver };
