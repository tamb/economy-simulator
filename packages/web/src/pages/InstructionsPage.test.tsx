import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { InstructionsPage } from "./InstructionsPage";

describe("InstructionsPage", () => {
	it("renders how-to-play sections", () => {
		render(<InstructionsPage />);

		expect(
			screen.getByRole("heading", { name: "How to Play" }),
		).toBeInTheDocument();
		expect(screen.getByText("Getting started")).toBeInTheDocument();
		expect(screen.getByText("Your levers")).toBeInTheDocument();
		expect(
			screen.getByRole("heading", { name: "How to rule" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("heading", { name: "Royal mandates" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("heading", { name: "Weekly reports and inner circle" }),
		).toBeInTheDocument();
	});

	it("expands a collapsed section when its summary is clicked", async () => {
		const user = userEvent.setup();
		render(<InstructionsPage />);

		expect(screen.queryByText(/Labor edicts \(mid-game\)/)).not.toBeVisible();

		await user.click(screen.getByText("Your levers"));

		expect(screen.getByText(/Labor edicts \(mid-game\)/)).toBeVisible();
	});
});
