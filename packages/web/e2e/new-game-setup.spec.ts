import { expect, test } from "@playwright/test";
import { waitForPopulationReady } from "./utils";

test.describe("New game setup", () => {
	test("shows the population picker before any population exists, defaulting to 100,000", async ({
		page,
	}) => {
		await page.goto("/");

		await expect(
			page.getByRole("heading", { name: "The Benevolent Monarch" }),
		).toBeVisible();
		await expect(page.getByText("Found a New Nation")).toBeVisible();

		const defaultOption = page.getByRole("radio", {
			name: /100,000 citizens/,
		});
		await expect(defaultOption).toBeChecked();

		const defaultProvinces = page.getByRole("radio", { name: /More/ });
		await expect(defaultProvinces).toBeChecked();
	});

	test("requires nation configuration before the game starts", async ({
		page,
	}) => {
		await page.goto("/");

		await page.getByText("10,000 citizens", { exact: true }).click();
		await page
			.getByRole("button", { name: "Continue to nation setup" })
			.click();

		await expect(page.getByText("Configure Your Nation")).toBeVisible();
		await expect(
			page.getByRole("button", { name: "Start game" }),
		).toBeDisabled();

		await page.getByRole("button", { name: "Auto-assign all" }).click();
		await expect(
			page.getByText(/38 \/ 38 sub-sectors configured/),
		).toBeVisible();

		await page.getByRole("button", { name: "Start game" }).click();

		await expect(page.getByRole("link", { name: "Population" })).toBeVisible();
		await page.getByRole("link", { name: "Population" }).click();
		await waitForPopulationReady(page);
		await expect(
			page.getByText("10,000 citizens stored on disk"),
		).toBeVisible();
	});
});
