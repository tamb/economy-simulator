import { expect, test } from "@playwright/test";

test.describe("Browser navigation", () => {
	test("back/forward move between top-level pages", async ({ page }) => {
		await page.goto("/");

		await expect(
			page.getByRole("heading", { name: "Five-Sector Economic Pyramid" }),
		).toBeVisible();

		await page.getByRole("link", { name: "Credits" }).click();
		await expect(
			page.getByRole("heading", { name: "Attribution" }),
		).toBeVisible();

		await page.goBack();
		await expect(
			page.getByRole("heading", { name: "Five-Sector Economic Pyramid" }),
		).toBeVisible();

		await page.goForward();
		await expect(
			page.getByRole("heading", { name: "Attribution" }),
		).toBeVisible();
	});

	test("back moves up one level at a time through the sector atlas drill-down", async ({
		page,
	}) => {
		await page.goto("/");

		await page.getByText("Explore →").first().click();
		await expect(
			page.getByRole("heading", { name: "Five-Sector Economic Pyramid" }),
		).toBeHidden();

		await page.getByText("Agriculture", { exact: true }).click();
		await expect(page.locator("select")).toBeVisible();

		await page.goBack();
		await expect(page.locator("select")).toBeHidden();
		await expect(page.getByText("Agriculture", { exact: true })).toBeVisible();

		await page.goBack();
		await expect(
			page.getByRole("heading", { name: "Five-Sector Economic Pyramid" }),
		).toBeVisible();
	});
});
