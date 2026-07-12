import { getBiome, type Terrain } from "economy-simulator-data";

/** Retro palette for each land biome and open ocean — used by the Country Map "Terrain" metric. */
const terrainColors: Record<Terrain, string> = {
	ocean: "#1a6088",
	plains: "#7cb342",
	pasture: "#9ccc65",
	forest: "#2e7d32",
	hills: "#a1887f",
	mountains: "#757575",
	wetland: "#558b2f",
	desert: "#d4a574",
	clearedLand: "#bcaaa4",
	barrenRock: "#9e9e9e",
};

function getTerrainColor(terrain: Terrain): string {
	return terrainColors[terrain];
}

function getTerrainLabel(terrain: Terrain): string {
	if (terrain === "ocean") return "Ocean";
	return getBiome(terrain)?.label ?? terrain;
}

export { getTerrainColor, getTerrainLabel, terrainColors };
