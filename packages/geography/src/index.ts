/**
 * `economy-simulator-geography` — pure, deterministic (seeded) world
 * generation: island shape, biome assignment, resource-overlay placement,
 * and coastal/adjacency detection. No React, no I/O — mirrors
 * `economy-simulator-simulation`'s "pure engine" package rule.
 */
export type { AxialCoordinate } from "./hex/coordinates";
export {
	coordinateKey,
	generateBoundingGridCoordinates,
	getAxialNeighbors,
	HEX_NEIGHBOR_OFFSETS,
	parseCoordinateKey,
} from "./hex/coordinates";
export type { GeneratableBiomeId } from "./island/assign-biomes";
export { assignBiomes, computeCoastDistances } from "./island/assign-biomes";
export { computeCoastalTiles } from "./island/coastal";
export type {
	GenerateIslandShapeOptions,
	IslandShape,
} from "./island/generate-island-shape";
export { generateIslandShape } from "./island/generate-island-shape";
export type { PlaceResourceOverlaysOptions } from "./island/place-resource-overlays";
export { placeResourceOverlays } from "./island/place-resource-overlays";
export type { RandomFn } from "./rng/seeded-random";
export { createSeededRandom } from "./rng/seeded-random";
export { shuffle, weightedPick } from "./rng/weighted-pick";
export type { GenerateWorldOptions, WorldRegion } from "./world/generate-world";
export { generateWorld } from "./world/generate-world";
