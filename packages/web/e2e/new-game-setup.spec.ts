import { expect, test } from "@playwright/test";
import { waitForPopulationReady } from "./utils";

/**
 * Runs against `chromium-new-game-setup`, a build with no
 * `VITE_POPULATION_SIZE` override (see `playwright.config.ts`), so this is
 * the only spec that exercises the real first-run screen a player sees
 * before any population exists.
 */
test.describe("New game setup", () => {
	test("shows the population picker before any population exists, defaulting to 100,000", async ({
		page,
	}) => {
		await page.goto("/");

		await expect(
			page.getByRole("heading", { name: "economy-simulator" }),
		).toBeVisible();
		await expect(page.getByText("Found a New Nation")).toBeVisible();

		const defaultOption = page.getByRole("radio", {
			name: /100,000 citizens/,
		});
		await expect(defaultOption).toBeChecked();
		await expect(
			page.getByRole("radio", { name: /10,000 citizens/ }),
		).toBeVisible();
		await expect(
			page.getByRole("radio", { name: /1,000,000 citizens/ }),
		).toBeVisible();
	});

	test("generates the chosen population size and hands off to the main app", async ({
		page,
	}) => {
		await page.goto("/");

		// The radio input itself is visually hidden (styled via its wrapping
		// label), so click the visible label text rather than the input role.
		await page.getByText("10,000 citizens", { exact: true }).click();
		await page.getByRole("button", { name: "Begin" }).click();

		// The setup screen hands off immediately; the normal app shell takes
		// over and shows generation progress itself (same code path the
		// VITE_POPULATION_SIZE override exercises in the other specs).
		await expect(page.getByRole("link", { name: "Population" })).toBeVisible();
		await page.getByRole("link", { name: "Population" }).click();

		await waitForPopulationReady(page);
		await expect(
			page.getByText("10,000 citizens stored on disk"),
		).toBeVisible();
	});
});
