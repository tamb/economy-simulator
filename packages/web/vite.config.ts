import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import packageJson from "./package.json";

export default defineConfig({
	define: {
		__APP_VERSION__: JSON.stringify(packageJson.version),
	},
	plugins: [react(), tailwindcss()],
	server: {
		// No strictPort: prefer 5173, but if a stale process (leftover from a
		// previous session, another workspace, etc.) is still holding it, just
		// take the next free port instead of hard-failing `bun run dev`. The
		// e2e preview servers (playwright.config.ts) pass their own
		// `--port --strictPort` CLI flags and are unaffected by this — they
		// need deterministic ports since Playwright waits on a specific URL.
		port: 5173,
	},
	build: {
		outDir: "dist",
		emptyOutDir: true,
	},
	resolve: {
		// Force a single instance of these across every chunk. Without this,
		// Rollup can duplicate a package into more than one output chunk,
		// which breaks anything relying on module-level singleton state:
		// react-chartjs-2's copy of React got an uninitialized hooks
		// dispatcher ("Cannot read properties of null (reading 'useRef')"),
		// and a duplicated chart.js meant `ChartJS.register(...)` populated
		// one copy's registry while chart rendering read from another
		// ("X is not a registered scale/element").
		dedupe: ["react", "react-dom", "chart.js"],
	},
	optimizeDeps: {
		// Pre-bundle up front instead of letting Vite discover them lazily on
		// first use — a lazy mid-session re-optimize forces a dependency
		// reload that can transiently double-load React and break hooks
		// (surfaces as "Cannot read properties of null (reading 'useRef')"
		// inside chart.js consumers on a cold dev server).
		include: ["chart.js", "react-chartjs-2", "honeycomb-grid", "facesjs"],
	},
});
