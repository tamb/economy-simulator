import type { Page } from "@playwright/test";

/** Waits for the once-per-session async stats recalculation (map/dashboards) to settle. */
async function waitForRecalculationToSettle(page: Page): Promise<void> {
	await page.waitForFunction(
		() => !document.body.innerText.includes("Recalculating"),
		undefined,
		{ timeout: 15_000 },
	);
}

/** Waits for the population to finish generating/loading (fast at the e2e test population size). */
async function waitForPopulationReady(page: Page): Promise<void> {
	await page.waitForFunction(
		() => document.body.innerText.includes("citizens stored on disk"),
		undefined,
		{ timeout: 30_000 },
	);
}

export { waitForPopulationReady, waitForRecalculationToSettle };
