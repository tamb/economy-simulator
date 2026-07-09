import type { ResourceId, Terrain } from "economy-simulator-data";

interface StoredWorldRegion {
	id: string;
	q: number;
	r: number;
	terrain: Terrain;
	resourceOverlay?: string;
	isCoastal: boolean;
}

interface WorldMeta {
	version: number;
}

interface RegionResourceState {
	reserveOrCapacityByResource: Partial<Record<ResourceId, number>>;
	environmentQuality: number;
}

export type { RegionResourceState, StoredWorldRegion, WorldMeta };
