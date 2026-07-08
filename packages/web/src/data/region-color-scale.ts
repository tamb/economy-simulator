import { getTerrainColor } from "./terrain-color-scale";
import { themeColors } from "./theme-colors";

type MapMetric =
	| "population"
	| "happiness"
	| "health"
	| "terrain"
	| "environment";

interface RgbColor {
	r: number;
	g: number;
	b: number;
}

function toRgb(hex: string): RgbColor {
	return {
		r: Number.parseInt(hex.slice(1, 3), 16),
		g: Number.parseInt(hex.slice(3, 5), 16),
		b: Number.parseInt(hex.slice(5, 7), 16),
	};
}

const RED = toRgb(themeColors.red);
const YELLOW = toRgb(themeColors.yellow);
const GREEN = toRgb(themeColors.green);
const CYAN_DARK = toRgb(themeColors.cyanDark);
const SURFACE_MUTED = toRgb(themeColors.surfaceMuted);

function clamp01(value: number): number {
	if (Number.isNaN(value)) return 0;
	return Math.min(1, Math.max(0, value));
}

function lerp(from: number, to: number, t: number): number {
	return from + (to - from) * t;
}

function lerpColor(from: RgbColor, to: RgbColor, t: number): RgbColor {
	return {
		r: Math.round(lerp(from.r, to.r, t)),
		g: Math.round(lerp(from.g, to.g, t)),
		b: Math.round(lerp(from.b, to.b, t)),
	};
}

function toHex(color: RgbColor): string {
	const channel = (value: number) => value.toString(16).padStart(2, "0");
	return `#${channel(color.r)}${channel(color.g)}${channel(color.b)}`;
}

/** Red (0) -> Yellow (50) -> Green (100), for happiness/health/environment tiles. */
function qualityColor(value: number): string {
	const t = clamp01(value / 100);
	const color =
		t < 0.5
			? lerpColor(RED, YELLOW, t / 0.5)
			: lerpColor(YELLOW, GREEN, (t - 0.5) / 0.5);
	return toHex(color);
}

/** Surface-muted (empty) -> primary cyan (at or above `maxValue`), for population tiles. */
function populationColor(value: number, maxValue: number): string {
	const t = maxValue > 0 ? clamp01(value / maxValue) : 0;
	return toHex(lerpColor(SURFACE_MUTED, CYAN_DARK, t));
}

/** Fill color for a region hex tile given the active metric and its stats. */
function getRegionColor(
	metric: MapMetric,
	value: number | undefined,
	maxValue: number,
	terrain?: string,
): string {
	if (metric === "terrain" && terrain) {
		return getTerrainColor(terrain as Parameters<typeof getTerrainColor>[0]);
	}
	if (value === undefined) return toHex(SURFACE_MUTED);
	if (metric === "population") return populationColor(value, maxValue);
	return qualityColor(value);
}

export type { MapMetric };
export { getRegionColor };
