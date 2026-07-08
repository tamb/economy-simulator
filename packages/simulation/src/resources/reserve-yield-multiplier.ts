import type { GameSettings } from "economy-simulator-data";
import { gameSettings } from "economy-simulator-data";

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

/**
 * Finite resources taper yield as reserves run low rather than falling off
 * a cliff (`lowReserveYieldFloor` is the asymptote as reserves approach,
 * but don't reach, exhaustion), but hit exactly 0 once reserves truly hit 0
 * — see research/resources-and-geography.md §5.4.
 */
function computeFiniteYieldMultiplier(
	reserveFraction: number,
	settings: GameSettings = gameSettings,
): number {
	const reserve = clamp(reserveFraction, 0, 1);
	if (reserve <= 0) return 0;

	const floor = settings.resources.finite.lowReserveYieldFloor;
	return floor + (1 - floor) * reserve;
}

/**
 * Renewable resources scale yield directly with remaining carrying
 * capacity — a fully healthy tile (capacity 1) yields at 100%, a
 * fully-collapsed one (capacity 0, e.g. an overfished bank) yields nothing.
 */
function computeRenewableYieldMultiplier(capacityFraction: number): number {
	return clamp(capacityFraction, 0, 1);
}

export { computeFiniteYieldMultiplier, computeRenewableYieldMultiplier };
