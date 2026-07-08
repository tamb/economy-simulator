import { expect, test } from "@playwright/test";

test.describe("Economic Sector Atlas", () => {
	test("shows the five-tier pyramid on load", async ({ page }) => {
		await page.goto("/");

		await expect(
			page.getByRole("heading", { name: "Five-Sector Economic Pyramid" }),
		).toBeVisible();
		await expect(page.getByText("Extractive", { exact: true })).toBeVisible();
		await expect(page.getByText("Command", { exact: true })).toBeVisible();
	});

	test("assigns an economic system to a sub-sector and persists it across reload", async ({
		page,
	}) => {
		await page.goto("/");

		await page.getByText("Explore →").first().click();
		await page.getByText("Agriculture", { exact: true }).click();

		const select = page.locator("select");
		await select.selectOption({ label: "Capitalism" });
		await expect(page.locator("select option:checked")).toHaveText(
			"Capitalism",
		);

		await page.reload();

		await expect(page.locator("select option:checked")).toHaveText(
			"Capitalism",
		);
	});
});
