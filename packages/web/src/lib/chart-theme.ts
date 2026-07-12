import {
	ArcElement,
	BarElement,
	CategoryScale,
	Chart as ChartJS,
	Legend,
	LinearScale,
	LineElement,
	PointElement,
	Tooltip,
} from "chart.js";
import { themeColors } from "./theme-colors";

let registered = false;

/**
 * Register the Chart.js elements/plugins the dashboards use and apply a
 * chunky, hard-edged retro look (square points, thick strokes, no
 * smoothing/animation) using the arcade theme's colors. Call once at app
 * startup, before any chart renders.
 */
function registerChartTheme(): void {
	if (registered) return;
	registered = true;

	ChartJS.register(
		CategoryScale,
		LinearScale,
		BarElement,
		PointElement,
		LineElement,
		ArcElement,
		Tooltip,
		Legend,
	);

	ChartJS.defaults.font.family =
		'"Public Sans", ui-sans-serif, system-ui, sans-serif';
	ChartJS.defaults.color = themeColors.neutral600;
	ChartJS.defaults.borderColor = `${themeColors.cyanDark}33`;
	ChartJS.defaults.elements.line.tension = 0;
	ChartJS.defaults.elements.line.borderWidth = 3;
	ChartJS.defaults.elements.point.pointStyle = "rect";
	ChartJS.defaults.elements.point.radius = 3;
	ChartJS.defaults.elements.bar.borderWidth = 2;
	ChartJS.defaults.plugins.legend.labels.usePointStyle = true;
	ChartJS.defaults.plugins.legend.labels.boxWidth = 12;
	ChartJS.defaults.plugins.legend.labels.boxHeight = 12;
	ChartJS.defaults.animation = false;
}

/** Ordered, high-contrast dataset palette pulled from the arcade theme. */
const chartPalette = [
	themeColors.cyanDark,
	themeColors.red,
	themeColors.orange,
	themeColors.green,
	themeColors.blue,
	themeColors.yellowMuted,
	themeColors.greenMuted,
	themeColors.redDark,
	themeColors.neutral600,
	themeColors.orangeLight,
	themeColors.cyan,
] as const;

function paletteColor(index: number): string {
	return chartPalette[index % chartPalette.length] ?? themeColors.cyanDark;
}

export { chartPalette, paletteColor, registerChartTheme };
