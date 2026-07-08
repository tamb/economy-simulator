import type { ResourceOverlayId, Terrain } from "economy-simulator-data";
import { type AxialCoordinate, coordinateKey } from "../hex/coordinates";
import { assignBiomes } from "../island/assign-biomes";
import { computeCoastalTiles } from "../island/coastal";
import { generateIslandShape } from "../island/generate-island-shape";
import { placeResourceOverlays } from "../island/place-resource-overlays";
import { createSeededRandom } from "../rng/seeded-random";

interface GenerateWorldOptions {
	/** Numeric seed — the same seed always produces the same world (island shape, biomes, and overlays). */
	seed: number;
	boundingRadius: number;
	targetLandRatio: number;
	resourceOverlayRatio: number;
}

/**
 * One tile of the generated world. Every coordinate in the bounding grid
 * gets an entry — including ocean tiles — so the map can render the full
 * island-surrounded-by-sea picture and adjacency/rendering code never has
 * to special-case "no tile here".
 */
interface WorldRegion extends AxialCoordinate {
	terrain: Terrain;
	/** Present only on land tiles that received a bonus resource deposit (see `economy-simulator-data`'s `resource-overlays`). */
	resourceOverlay?: ResourceOverlayId;
	/** True for land tiles adjacent to ocean (or the bounding grid's edge) — enables fishing regardless of biome. */
	isCoastal: boolean;
}

/**
 * Generates a full deterministic world: a single organic island (see
 * `../island/generate-island-shape.ts`) surrounded by ocean, with every land
 * tile assigned a biome (`../island/assign-biomes.ts`) and some fraction of
 * eligible tiles carrying a bonus resource overlay
 * (`../island/place-resource-overlays.ts`). Same `seed` + options always
 * produces the same world.
 */
function generateWorld(options: GenerateWorldOptions): WorldRegion[] {
	const { seed, boundingRadius, targetLandRatio, resourceOverlayRatio } =
		options;
	const random = createSeededRandom(seed);

	const { boundingGrid, land } = generateIslandShape({
		boundingRadius,
		targetLandRatio,
		random,
	});
	const biomeAssignments = assignBiomes(land, random);
	const coastalTiles = computeCoastalTiles(land);
	const overlays = placeResourceOverlays({
		biomes: biomeAssignments,
		resourceOverlayRatio,
		random,
	});

	return boundingGrid.map((coordinate) => {
		const key = coordinateKey(coordinate);
		const terrain: Terrain = biomeAssignments.get(key) ?? "ocean";

		return {
			q: coordinate.q,
			r: coordinate.r,
			terrain,
			resourceOverlay: overlays.get(key),
			isCoastal: coastalTiles.has(key),
		};
	});
}

export type { GenerateWorldOptions, WorldRegion };
export { generateWorld };
