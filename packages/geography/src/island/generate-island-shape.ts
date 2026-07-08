import {
	type AxialCoordinate,
	coordinateKey,
	generateBoundingGridCoordinates,
	getAxialNeighbors,
} from "../hex/coordinates";
import type { RandomFn } from "../rng/seeded-random";

interface GenerateIslandShapeOptions {
	/** Radius of the bounding hex grid the island grows within (see `AppConfig.regions.boundingRadius`). */
	boundingRadius: number;
	/** Target fraction of the bounding grid that becomes land (see `AppConfig.regions.targetLandRatio`). */
	targetLandRatio: number;
	random: RandomFn;
}

interface IslandShape {
	/** Every coordinate in the bounding grid (land and ocean). */
	boundingGrid: AxialCoordinate[];
	/** Coordinate keys (see `coordinateKey`) of every land tile. Always a single contiguous region by construction. */
	land: Set<string>;
}

/**
 * Grows a single, contiguous, organically-shaped island by starting at the
 * center of the bounding grid and repeatedly claiming a random tile
 * adjacent to the already-claimed landmass (a bounded percolation-style
 * flood fill), until the target land-tile count is reached. Because every
 * newly claimed tile is, by construction, adjacent to an already-claimed
 * tile, the result is always a single connected landmass — no separate
 * contiguity check is needed, though the test suite verifies this
 * invariant directly.
 *
 * Picking the next tile uniformly at random from the whole frontier (rather
 * than nearest-first, which would produce a filled circle/hexagon) is what
 * gives the coastline its irregular, organic look while remaining fully
 * deterministic for a given seed.
 */
function generateIslandShape(options: GenerateIslandShapeOptions): IslandShape {
	const { boundingRadius, targetLandRatio, random } = options;
	const boundingGrid = generateBoundingGridCoordinates(boundingRadius);
	const boundingKeys = new Set(boundingGrid.map(coordinateKey));

	const targetLandCount = Math.min(
		boundingGrid.length,
		Math.max(1, Math.round(boundingGrid.length * targetLandRatio)),
	);

	const land = new Set<string>();
	const frontier = new Map<string, AxialCoordinate>();

	const origin: AxialCoordinate = { q: 0, r: 0 };
	land.add(coordinateKey(origin));

	const addFrontierNeighbors = (coordinate: AxialCoordinate) => {
		for (const neighbor of getAxialNeighbors(coordinate)) {
			const key = coordinateKey(neighbor);
			if (boundingKeys.has(key) && !land.has(key)) {
				frontier.set(key, neighbor);
			}
		}
	};
	addFrontierNeighbors(origin);

	while (land.size < targetLandCount && frontier.size > 0) {
		const frontierKeys = [...frontier.keys()];
		const pickedKey = frontierKeys[Math.floor(random() * frontierKeys.length)];
		const picked = pickedKey ? frontier.get(pickedKey) : undefined;
		if (!pickedKey || !picked) break;

		frontier.delete(pickedKey);
		land.add(pickedKey);
		addFrontierNeighbors(picked);
	}

	return { boundingGrid, land };
}

export type { GenerateIslandShapeOptions, IslandShape };
export { generateIslandShape };
