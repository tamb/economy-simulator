import { expect, test } from "@playwright/test";
import { waitForPopulationReady, waitForRecalculationToSettle } from "./utils";

test.beforeEach(async ({ page }) => {
	await page.goto("/");
	await page.getByRole("link", { name: "Population" }).click();
	await waitForPopulationReady(page);
});

test.describe("Country map", () => {
	test("renders land regions and shows terrain stats for a selected region", async ({
		page,
	}) => {
		await page.getByRole("link", { name: "Country Map" }).click();
		await waitForRecalculationToSettle(page);

		await expect(page.getByRole("button", { name: "Terrain" })).toBeVisible();

		const landHex = page
			.locator("svg g[role='button'], svg g[tabindex]")
			.first();
		await expect(landHex).toBeVisible();
		const regionLabel = (await landHex.getAttribute("aria-label")) ?? "";
		await landHex.click();

		await expect(page.locator("aside")).toContainText("Environment");
		await expect(page.locator("aside")).toContainText("/100");
		if (regionLabel.includes(",")) {
			const terrainHint = regionLabel.split(",")[1]?.trim() ?? "";
			if (terrainHint) {
				await expect(page.locator("aside")).toContainText(terrainHint);
			}
		}
	});
});

test.describe("Dashboards", () => {
	test("switches between population, sector, country, and resource ledger tabs", async ({
		page,
	}) => {
		await page.getByRole("link", { name: "Dashboards" }).click();
		await waitForRecalculationToSettle(page);

		await expect(
			page.getByRole("heading", { name: "Age-Sex Pyramid" }),
		).toBeVisible();

		await page.getByRole("button", { name: "Economic Sectors" }).click();
		await expect(
			page.getByText(
				"No employed citizens yet — advance a game day to assign working-age citizens to sectors.",
			),
		).toBeVisible();

		await page.getByRole("button", { name: "Country Overview" }).click();
		await expect(
			page.getByRole("heading", { name: "National Quality of Life Trend" }),
		).toBeVisible();
		await expect(
			page.getByRole("heading", { name: "Region Leaderboard" }),
		).toBeVisible();

		await page.getByRole("button", { name: "Resource Ledger" }).click();
		await expect(
			page.getByText(
				"No resource ledger yet — advance the calendar past one full game year",
			),
		).toBeVisible();
	});
});
