import {
	coordinateKey,
	getAxialNeighbors,
	parseCoordinateKey,
} from "../hex/coordinates";

/**
 * A land tile is coastal if at least one of its 6 neighbors is *not* land —
 * either open ocean inside the bounding grid, or off the edge of the
 * bounding grid entirely (the world always ends in ocean, so "off the
 * grid" is equivalent to ocean for this purpose). Per the confirmed scope,
 * fishing is enabled on any coastal land tile regardless of biome.
 */
function computeCoastalTiles(land: Set<string>): Set<string> {
	const coastal = new Set<string>();

	for (const key of land) {
		const coordinate = parseCoordinateKey(key);
		const isCoastal = getAxialNeighbors(coordinate).some(
			(neighbor) => !land.has(coordinateKey(neighbor)),
		);
		if (isCoastal) {
			coastal.add(key);
		}
	}

	return coastal;
}

export { computeCoastalTiles };
