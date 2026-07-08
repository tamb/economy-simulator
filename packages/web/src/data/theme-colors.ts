/**
 * Single source of truth for the hex values behind the CSS custom properties
 * declared in `index.css`. Canvas-based rendering (Chart.js, hand-rolled SVG
 * color scales) can't resolve `var(--color-*)` the way the DOM can, so this
 * module keeps a plain-value copy in sync for those consumers.
 */
const themeColors = {
	surface: "#f7f3eb",
	surfaceMuted: "#ebe4d6",
	surfaceShadow: "#ddd4c4",
	neutral950: "#000000",
	neutral900: "#0a0a0a",
	neutral600: "#3a3a3a",
	neutral400: "#909090",
	cyan: "#30e0c0",
	cyanLight: "#30f0d0",
	cyanDark: "#109080",
	yellow: "#ffff00",
	yellowMuted: "#c9b800",
	red: "#f00000",
	redDark: "#702020",
	green: "#20d000",
	greenMuted: "#66834f",
	orange: "#d05040",
	orangeLight: "#e0b090",
	blue: "#0000ff",
} as const;

export { themeColors };
