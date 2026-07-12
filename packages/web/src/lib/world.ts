import {
	appConfig,
	type ResourceOverlayId,
	type Terrain,
} from "economy-simulator-data";
import { generateWorld } from "economy-simulator-geography";
import { generateRegionCoordinates, type RegionId } from "./regions";

/** One region's terrain (land biome or ocean), independent of its player-facing name or mutable resource state — see `../repos/world.ts` for persistence. */
interface WorldRegion {
	id: RegionId;
	q: number;
	r: number;
	terrain: Terrain;
	resourceOverlay?: ResourceOverlayId;
	isCoastal: boolean;
}

/**
 * Builds the full terrain map for a new game: `economy-simulator-geography`
 * generates the island (keyed by axial coordinate) using the given seed;
 * this zips that onto the existing `RegionId <-> (q, r)` assignment from
 * `generateRegionCoordinates` (matched by coordinate, not array position, so
 * this doesn't depend on the two libraries traversing hexes in the same
 * order) so every existing `RegionId` keeps working unchanged everywhere
 * else in the app (storage, job assignment, dashboards).
 */
function buildWorldRegions(seed: number): WorldRegion[] {
	const coordinates = generateRegionCoordinates(
		appConfig.regions.boundingRadius,
	);
	const generated = generateWorld({
		seed,
		boundingRadius: appConfig.regions.boundingRadius,
		targetLandRatio: appConfig.regions.targetLandRatio,
		resourceOverlayRatio: appConfig.regions.resourceOverlayRatio,
	});
	const terrainByCoordinate = new Map(
		generated.map((region) => [`${region.q},${region.r}`, region]),
	);

	return coordinates.map((coordinate) => {
		const match = terrainByCoordinate.get(`${coordinate.q},${coordinate.r}`);
		return {
			id: coordinate.id,
			q: coordinate.q,
			r: coordinate.r,
			terrain: match?.terrain ?? "ocean",
			resourceOverlay: match?.resourceOverlay,
			isCoastal: match?.isCoastal ?? false,
		};
	});
}

export type { WorldRegion };
export { buildWorldRegions };
