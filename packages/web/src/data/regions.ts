import { appConfig } from "economy-simulator-data";
import { defineHex, Grid, spiral } from "honeycomb-grid";

type RegionId = string;

interface RegionCoordinate {
	id: RegionId;
	q: number;
	r: number;
}

interface HexPoint {
	x: number;
	y: number;
}

interface HexLayout {
	x: number;
	y: number;
	corners: HexPoint[];
}

/** Pixel size of one hex tile; hex math only, no rendering opinions here. */
const HEX_DIMENSIONS = 28;

const RegionHex = defineHex({ dimensions: HEX_DIMENSIONS });

function formatRegionId(index: number): RegionId {
	return `R${index.toString().padStart(2, "0")}`;
}

function isRegionId(value: unknown): value is RegionId {
	return typeof value === "string" && /^R\d{2,}$/.test(value);
}

/** Total regions in a hexagon-shaped grid of the configured radius. */
function getRegionCount(radius = appConfig.regions.boundingRadius): number {
	return 1 + 3 * radius * (radius + 1);
}

function getRegionIds(radius = appConfig.regions.boundingRadius): RegionId[] {
	return Array.from({ length: getRegionCount(radius) }, (_, index) =>
		formatRegionId(index),
	);
}

/**
 * Deterministic hex-grid geometry: a hexagon-shaped map of `getRegionCount()`
 * regions centered on the origin, generated via `honeycomb-grid`'s spiral
 * traverser. No randomness — the same radius always produces the same
 * layout, so only region metadata (names) needs to be generated once and
 * persisted (see `storage/regions.ts`).
 */
function generateRegionCoordinates(
	radius = appConfig.regions.boundingRadius,
): RegionCoordinate[] {
	const grid = new Grid(RegionHex, spiral({ start: [0, 0], radius }));
	const coordinates: RegionCoordinate[] = [];
	let index = 0;

	grid.forEach((hex) => {
		coordinates.push({ id: formatRegionId(index), q: hex.q, r: hex.r });
		index += 1;
	});

	return coordinates;
}

/** Pixel center and corner points for a hex at the given axial coordinates. */
function getHexLayout(q: number, r: number): HexLayout {
	const hex = new RegionHex({ q, r });
	return { x: hex.x, y: hex.y, corners: [...hex.corners] };
}

export type { HexLayout, HexPoint, RegionCoordinate, RegionId };
export {
	formatRegionId,
	generateRegionCoordinates,
	getHexLayout,
	getRegionCount,
	getRegionIds,
	HEX_DIMENSIONS,
	isRegionId,
};
