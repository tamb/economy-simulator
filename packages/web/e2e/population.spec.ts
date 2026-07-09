import { expect, test } from "@playwright/test";
import { waitForPopulationReady } from "./utils";

test.describe("Population registry", () => {
	test("generates citizens and advances a day via the worker", async ({
		page,
	}) => {
		await page.goto("/");
		await page.getByRole("link", { name: "Population" }).click();

		await waitForPopulationReady(page);
		await expect(page.getByText("Game day 0")).toBeVisible();
		await expect(page.locator("article").first()).toBeVisible();
		await expect(page.getByText("Big Five Traits").first()).toBeVisible();
		await expect(
			page.getByRole("searchbox", { name: "Search citizens by name" }),
		).toBeVisible();

		await page.getByText("What do these stats mean?", { exact: true }).click();
		await expect(
			page.getByRole("dialog", { name: "What do these stats mean?" }),
		).toBeVisible();
		await page.getByRole("button", { name: "Close" }).click();

		const advanceButton = page.getByRole("button", { name: /Advance day/ });
		await advanceButton.click();

		await expect(page.getByText("Advancing day…")).toBeVisible();
		await expect(page.getByText("Advancing day…")).toBeHidden({
			timeout: 30_000,
		});

		await expect(page.getByText("Game day 1")).toBeVisible();
	});
});
