import { defineHex, Grid, spiral } from "honeycomb-grid";

/** Axial hex coordinate (q, r) — no pixel/rendering info, that stays in `packages/web`. */
interface AxialCoordinate {
	q: number;
	r: number;
}

/** The 6 axial neighbor offsets for a pointy-top hex grid (matches `honeycomb-grid`'s own adjacency). */
const HEX_NEIGHBOR_OFFSETS: readonly AxialCoordinate[] = [
	{ q: 1, r: -1 },
	{ q: 1, r: 0 },
	{ q: 0, r: 1 },
	{ q: -1, r: 1 },
	{ q: -1, r: 0 },
	{ q: 0, r: -1 },
];

/** Stable string key for an axial coordinate, for use in `Set`/`Map` lookups. */
function coordinateKey(coordinate: AxialCoordinate): string {
	return `${coordinate.q},${coordinate.r}`;
}

function parseCoordinateKey(key: string): AxialCoordinate {
	const [q, r] = key.split(",").map(Number);
	if (
		q === undefined ||
		r === undefined ||
		Number.isNaN(q) ||
		Number.isNaN(r)
	) {
		throw new Error(`Invalid coordinate key: "${key}"`);
	}
	return { q, r };
}

/** The 6 axial neighbors of a coordinate, regardless of whether they fall within any particular grid. */
function getAxialNeighbors(coordinate: AxialCoordinate): AxialCoordinate[] {
	return HEX_NEIGHBOR_OFFSETS.map((offset) => ({
		q: coordinate.q + offset.q,
		r: coordinate.r + offset.r,
	}));
}

const BoundingHex = defineHex();

/**
 * Every axial coordinate in the hexagon-shaped bounding grid of the given
 * radius (total = 1 + 3 * radius * (radius + 1)), centered on the origin.
 * This is the fixed "canvas" the island is grown within — see
 * `../island/generate-island-shape.ts`.
 */
function generateBoundingGridCoordinates(radius: number): AxialCoordinate[] {
	const grid = new Grid(BoundingHex, spiral({ start: [0, 0], radius }));
	const coordinates: AxialCoordinate[] = [];
	grid.forEach((hex) => {
		coordinates.push({ q: hex.q, r: hex.r });
	});
	return coordinates;
}

export type { AxialCoordinate };
export {
	coordinateKey,
	generateBoundingGridCoordinates,
	getAxialNeighbors,
	HEX_NEIGHBOR_OFFSETS,
	parseCoordinateKey,
};
