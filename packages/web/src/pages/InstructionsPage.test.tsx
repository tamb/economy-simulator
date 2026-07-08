import { render, screen } from "@testing-library/react";
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
	});
});
