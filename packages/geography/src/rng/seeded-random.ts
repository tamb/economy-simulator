/**
 * A `Math.random`-compatible random source. Matches
 * `economy-simulator-simulation`'s `RandomFn` convention (kept as a
 * separate local type rather than a cross-package import, since
 * `packages/geography` has no dependency on `packages/simulation` — see
 * `constitution/_monorepo.md`'s package dependency diagram).
 */
type RandomFn = () => number;

/**
 * Deterministic PRNG (mulberry32) so the same numeric seed always produces
 * the same island — this is what makes world generation heavily
 * unit-testable (same seed in, same world out) while still looking random
 * to the player from game to game (a fresh seed is drawn per new game).
 */
function createSeededRandom(seed: number): RandomFn {
	let state = seed >>> 0;

	return () => {
		state = (state + 0x6d2b79f5) >>> 0;
		let t = state;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

export type { RandomFn };
export { createSeededRandom };
