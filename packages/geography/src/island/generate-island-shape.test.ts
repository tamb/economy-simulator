import { describe, expect, it } from "vitest";
import {
	coordinateKey,
	generateBoundingGridCoordinates,
	getAxialNeighbors,
	parseCoordinateKey,
} from "../hex/coordinates";
import { createSeededRandom } from "../rng/seeded-random";
import { generateIslandShape } from "./generate-island-shape";

function isConnected(land: Set<string>): boolean {
	if (land.size === 0) return true;
	const start = [...land][0];
	if (!start) return true;

	const visited = new Set<string>([start]);
	const stack = [start];

	while (stack.length > 0) {
		const key = stack.pop();
		if (!key) continue;
		const coordinate = parseCoordinateKey(key);
		for (const neighbor of getAxialNeighbors(coordinate)) {
			const neighborKey = coordinateKey(neighbor);
			if (land.has(neighborKey) && !visited.has(neighborKey)) {
				visited.add(neighborKey);
				stack.push(neighborKey);
			}
		}
	}

	return visited.size === land.size;
}

describe("generateIslandShape", () => {
	it("produces a single contiguous landmass", () => {
		for (const seed of [1, 2, 3, 4, 5]) {
			const { land } = generateIslandShape({
				boundingRadius: 6,
				targetLandRatio: 0.5,
				random: createSeededRandom(seed),
			});
			expect(isConnected(land)).toBe(true);
		}
	});

	it("always includes the origin", () => {
		const { land } = generateIslandShape({
			boundingRadius: 5,
			targetLandRatio: 0.4,
			random: createSeededRandom(42),
		});
		expect(land.has(coordinateKey({ q: 0, r: 0 }))).toBe(true);
	});

	it("hits the target land ratio within the bounding grid (within rounding)", () => {
		const boundingRadius = 6;
		const targetLandRatio = 0.55;
		const { boundingGrid, land } = generateIslandShape({
			boundingRadius,
			targetLandRatio,
			random: createSeededRandom(7),
		});
		const expected = Math.round(boundingGrid.length * targetLandRatio);
		expect(land.size).toBe(expected);
	});

	it("never claims land outside the bounding grid", () => {
		const boundingRadius = 4;
		const { boundingGrid, land } = generateIslandShape({
			boundingRadius,
			targetLandRatio: 0.6,
			random: createSeededRandom(11),
		});
		const boundingKeys = new Set(boundingGrid.map(coordinateKey));
		for (const key of land) {
			expect(boundingKeys.has(key)).toBe(true);
		}
	});

	it("is deterministic for a given seed", () => {
		const options = {
			boundingRadius: 5,
			targetLandRatio: 0.5,
		};
		const a = generateIslandShape({
			...options,
			random: createSeededRandom(999),
		});
		const b = generateIslandShape({
			...options,
			random: createSeededRandom(999),
		});
		expect([...a.land].sort()).toEqual([...b.land].sort());
	});

	it("produces different shapes for different seeds", () => {
		const options = { boundingRadius: 5, targetLandRatio: 0.5 };
		const a = generateIslandShape({
			...options,
			random: createSeededRandom(1),
		});
		const b = generateIslandShape({
			...options,
			random: createSeededRandom(2),
		});
		expect([...a.land].sort()).not.toEqual([...b.land].sort());
	});

	it("caps land at the full bounding grid size when the ratio is 1", () => {
		const boundingRadius = 3;
		const { boundingGrid, land } = generateIslandShape({
			boundingRadius,
			targetLandRatio: 1,
			random: createSeededRandom(3),
		});
		expect(land.size).toBe(boundingGrid.length);
	});

	it("always claims at least one tile even for a tiny ratio", () => {
		const { land } = generateIslandShape({
			boundingRadius: 4,
			targetLandRatio: 0.001,
			random: createSeededRandom(3),
		});
		expect(land.size).toBeGreaterThanOrEqual(1);
	});

	it("matches the expected bounding grid size for a given radius", () => {
		const boundingRadius = 6;
		const { boundingGrid } = generateIslandShape({
			boundingRadius,
			targetLandRatio: 0.5,
			random: createSeededRandom(1),
		});
		expect(boundingGrid).toEqual(
			generateBoundingGridCoordinates(boundingRadius),
		);
	});
});
