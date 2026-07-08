import type { ResourceId } from "./resources";

/**
 * Land terrain types. `clearedLand` and `barrenRock` are degraded end-states
 * (see `degradesTo` below) rather than terrain the world generator places
 * directly — a visible, mechanical scar left by sustained over-extraction.
 * `ocean` is not a biome (it carries no resource yields) but is part of the
 * broader `Terrain` union every map tile uses.
 */
type BiomeId =
	| "plains"
	| "pasture"
	| "forest"
	| "hills"
	| "mountains"
	| "wetland"
	| "desert"
	| "clearedLand"
	| "barrenRock";

/** Every map tile's terrain is a land biome or open ocean. */
type Terrain = BiomeId | "ocean";

interface BiomeDefinition {
	id: BiomeId;
	label: string;
	description: string;
	/**
	 * Base yield-per-worker-year for each resource this biome can produce.
	 * Absent from the map (or 0) means the sub-sector for that resource
	 * cannot be worked from a tile of this biome. Fishing is handled
	 * separately (any coastal land tile is fishable regardless of biome —
	 * see `../../geography` package's adjacency helpers), so `fish` never
	 * appears here.
	 */
	resourceYields: Partial<Record<ResourceId, number>>;
	/**
	 * The degraded terrain this biome flips to after sustained
	 * over-extraction or finite-resource exhaustion (see
	 * `GameSettings.resources` tunables). `undefined` means this biome
	 * cannot degrade further (already barren, or is itself a degraded
	 * end-state).
	 */
	degradesTo?: BiomeId;
}

const biomes: BiomeDefinition[] = [
	{
		id: "plains",
		label: "Plains",
		description: "Flat, open grassland — the workhorse farmland biome.",
		resourceYields: { crops: 1.2, livestock: 0.3 },
		degradesTo: "clearedLand",
	},
	{
		id: "pasture",
		label: "Pasture",
		description: "Rolling grazing land, best suited to raising livestock.",
		resourceYields: { livestock: 1.2, crops: 0.2 },
		degradesTo: "clearedLand",
	},
	{
		id: "forest",
		label: "Forest",
		description: "Dense woodland yielding timber.",
		resourceYields: { timber: 1.2 },
		degradesTo: "clearedLand",
	},
	{
		id: "hills",
		label: "Hills",
		description: "Rocky uplands good for quarrying and shallow mining.",
		resourceYields: { stone: 1.0, metalOre: 0.6 },
		degradesTo: "barrenRock",
	},
	{
		id: "mountains",
		label: "Mountains",
		description:
			"High, mineral-rich terrain — the best ore and fuel deposits, at a steep environmental cost.",
		resourceYields: { metalOre: 1.2, fossilFuels: 0.8, stone: 0.4 },
		degradesTo: "barrenRock",
	},
	{
		id: "wetland",
		label: "Wetland",
		description:
			"Marsh and floodplain — fertile but harder to work than open plains.",
		resourceYields: { crops: 0.9 },
		degradesTo: "clearedLand",
	},
	{
		id: "desert",
		label: "Desert",
		description:
			"Arid and largely barren. The one exception: deserts sometimes sit atop rich fossil fuel fields (see resource overlays).",
		resourceYields: {},
	},
	{
		id: "clearedLand",
		label: "Cleared Land",
		description:
			"Former forest, pasture, plains, or wetland, stripped bare by over-extraction. A little regrowth persists, but it will never fully recover in-game.",
		resourceYields: { crops: 0.2 },
	},
	{
		id: "barrenRock",
		label: "Barren Rock",
		description:
			"Former hills or mountains, mined or quarried to exhaustion. Nothing left worth extracting.",
		resourceYields: {},
	},
];

function getBiome(id: BiomeId): BiomeDefinition | undefined {
	return biomes.find((biome) => biome.id === id);
}

function isLand(terrain: Terrain): terrain is BiomeId {
	return terrain !== "ocean";
}

export type { BiomeDefinition, BiomeId, Terrain };
export { biomes, getBiome, isLand };
