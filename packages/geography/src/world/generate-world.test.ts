import {
	appConfig,
	biomes,
	isLand,
	resourceOverlays,
} from "economy-simulator-data";
import { describe, expect, it } from "vitest";
import { generateBoundingGridCoordinates } from "../hex/coordinates";
import { generateWorld } from "./generate-world";

const KNOWN_BIOME_IDS = new Set(biomes.map((biome) => biome.id));

describe("generateWorld", () => {
	const baseOptions = {
		boundingRadius: appConfig.regions.boundingRadius,
		targetLandRatio: appConfig.regions.targetLandRatio,
		resourceOverlayRatio: appConfig.regions.resourceOverlayRatio,
	};

	it("returns one region for every tile in the bounding grid", () => {
		const world = generateWorld({ seed: 1, ...baseOptions });
		expect(world).toHaveLength(
			generateBoundingGridCoordinates(baseOptions.boundingRadius).length,
		);
	});

	it("gives every region a valid terrain (a known biome id, or ocean)", () => {
		const world = generateWorld({ seed: 2, ...baseOptions });
		for (const region of world) {
			expect(
				region.terrain === "ocean" || KNOWN_BIOME_IDS.has(region.terrain),
			).toBe(true);
		}
	});

	it("has both land and ocean regions", () => {
		const world = generateWorld({ seed: 3, ...baseOptions });
		expect(world.some((region) => isLand(region.terrain))).toBe(true);
		expect(world.some((region) => region.terrain === "ocean")).toBe(true);
	});

	it("hits roughly the configured land ratio", () => {
		const world = generateWorld({ seed: 4, ...baseOptions });
		const landCount = world.filter((region) => isLand(region.terrain)).length;
		const expected = Math.round(world.length * baseOptions.targetLandRatio);
		expect(landCount).toBe(expected);
	});

	it("only assigns a resourceOverlay to land tiles", () => {
		const world = generateWorld({ seed: 5, ...baseOptions });
		for (const region of world) {
			if (region.resourceOverlay) {
				expect(isLand(region.terrain)).toBe(true);
			}
		}
	});

	it("places every catalog resource overlay at least once", () => {
		for (const seed of [1, 9, 17, 42]) {
			for (const boundingRadius of [3, 4, 5]) {
				const world = generateWorld({
					seed: seed + boundingRadius,
					boundingRadius,
					targetLandRatio: baseOptions.targetLandRatio,
					resourceOverlayRatio: baseOptions.resourceOverlayRatio,
				});
				const placed = new Set(
					world
						.map((region) => region.resourceOverlay)
						.filter((overlay): overlay is NonNullable<typeof overlay> =>
							Boolean(overlay),
						),
				);
				for (const overlay of resourceOverlays) {
					expect(placed.has(overlay.id)).toBe(true);
				}
			}
		}
	});

	it("only marks land tiles as coastal", () => {
		const world = generateWorld({ seed: 6, ...baseOptions });
		for (const region of world) {
			if (region.isCoastal) {
				expect(isLand(region.terrain)).toBe(true);
			}
		}
		expect(world.some((region) => region.isCoastal)).toBe(true);
	});

	it("marks the origin as land (the island always grows from the center)", () => {
		const world = generateWorld({ seed: 7, ...baseOptions });
		const origin = world.find((region) => region.q === 0 && region.r === 0);
		expect(origin).toBeDefined();
		expect(isLand(origin?.terrain ?? "ocean")).toBe(true);
	});

	it("is deterministic for a given seed", () => {
		const a = generateWorld({ seed: 42, ...baseOptions });
		const b = generateWorld({ seed: 42, ...baseOptions });
		expect(a).toEqual(b);
	});

	it("produces a different world for a different seed", () => {
		const a = generateWorld({ seed: 1, ...baseOptions });
		const b = generateWorld({ seed: 2, ...baseOptions });
		expect(a).not.toEqual(b);
	});

	it("produces a single contiguous landmass", () => {
		const world = generateWorld({ seed: 8, ...baseOptions });
		const land = new Set(
			world
				.filter((region) => isLand(region.terrain))
				.map((region) => `${region.q},${region.r}`),
		);

		const start = [...land][0];
		expect(start).toBeDefined();
		if (!start) return;

		const visited = new Set([start]);
		const stack = [start];
		const offsets = [
			[1, -1],
			[1, 0],
			[0, 1],
			[-1, 1],
			[-1, 0],
			[0, -1],
		];

		while (stack.length > 0) {
			const key = stack.pop();
			if (!key) continue;
			const [q, r] = key.split(",").map(Number);
			for (const [dq, dr] of offsets) {
				const neighborKey = `${q + dq},${r + dr}`;
				if (land.has(neighborKey) && !visited.has(neighborKey)) {
					visited.add(neighborKey);
					stack.push(neighborKey);
				}
			}
		}

		expect(visited.size).toBe(land.size);
	});
});
