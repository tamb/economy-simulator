type StorageStoreName =
	| "population"
	| "world"
	| "regions"
	| "faces"
	| "sector-data"
	| "player-progress";

interface StorageDriver {
	get<T>(store: StorageStoreName, key: string): Promise<T | null>;
	set<T>(store: StorageStoreName, key: string, value: T): Promise<void>;
	remove(store: StorageStoreName, key: string): Promise<void>;
	clear(store: StorageStoreName): Promise<void>;
}

type StorageDriverKind = "indexeddb" | "postgres";

interface StorageConfig {
	driver: StorageDriverKind;
}

export type {
	StorageConfig,
	StorageDriver,
	StorageDriverKind,
	StorageStoreName,
};
