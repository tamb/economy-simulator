import { defineConfig, devices } from "@playwright/test";

const PORT = 4173;
/**
 * Small population keeps generation-dependent tests fast (well under a
 * second, vs. ~a minute at the production 1,000,000 default), while staying
 * large enough that every one of the 61 map regions is virtually guaranteed
 * to have at least one citizen (avoids flaky "no citizens in this region"
 * assertions in the map test).
 */
const E2E_POPULATION_SIZE = "1000";

/**
 * Separate port + build with no `VITE_POPULATION_SIZE` override, used only
 * by `new-game-setup.spec.ts`. Vite env vars are inlined at build time, so
 * exercising the real "no override" first-run path (the new-game setup
 * screen) needs its own build rather than reusing the main preview server.
 */
const SETUP_PORT = 4174;
const SETUP_OUT_DIR = "dist-e2e-setup";

export default defineConfig({
	testDir: "./e2e",
	timeout: 60_000,
	fullyParallel: false,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	workers: 1,
	reporter: "list",
	use: {
		trace: "retain-on-failure",
		screenshot: "only-on-failure",
	},
	webServer: [
		{
			// Build + preview (a production server) rather than the dev server:
			// React StrictMode's double-render diagnostics (dev-only, stripped
			// from production builds) collide with react-chartjs-2's chart mount
			// and throw transient "Invalid hook call" errors that never happen in
			// the shipped app. Testing the production build is also just more
			// representative of what actually ships.
			command: `bunx vite build && bunx vite preview --port ${PORT} --strictPort`,
			url: `http://localhost:${PORT}`,
			reuseExistingServer: !process.env.CI,
			timeout: 60_000,
			env: { VITE_POPULATION_SIZE: E2E_POPULATION_SIZE },
		},
		{
			command: `bunx vite build --outDir ${SETUP_OUT_DIR} && bunx vite preview --outDir ${SETUP_OUT_DIR} --port ${SETUP_PORT} --strictPort`,
			url: `http://localhost:${SETUP_PORT}`,
			reuseExistingServer: !process.env.CI,
			timeout: 60_000,
		},
	],
	projects: [
		{
			name: "chromium",
			use: {
				...devices["Desktop Chrome"],
				baseURL: `http://localhost:${PORT}`,
			},
			testIgnore: /new-game-setup\.spec\.ts/,
		},
		{
			name: "chromium-new-game-setup",
			use: {
				...devices["Desktop Chrome"],
				baseURL: `http://localhost:${SETUP_PORT}`,
			},
			testMatch: /new-game-setup\.spec\.ts/,
		},
	],
});
