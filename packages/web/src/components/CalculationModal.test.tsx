import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CalculationModal } from "./CalculationModal";

describe("CalculationModal", () => {
	it("renders nothing when closed", () => {
		const { container } = render(
			<CalculationModal
				isOpen={false}
				title="Advancing year"
				processed={0}
				total={100}
			/>,
		);

		expect(container).toBeEmptyDOMElement();
	});

	it("shows the title, subtitle, and rounded percentage when open", () => {
		render(
			<CalculationModal
				isOpen
				title="Running annual cycle"
				subtitle="Processing 1,000,000 citizens"
				processed={250}
				total={1000}
			/>,
		);

		expect(
			screen.getByRole("dialog", { name: "Running annual cycle" }),
		).toBeInTheDocument();
		expect(
			screen.getByText("Processing 1,000,000 citizens"),
		).toBeInTheDocument();
		expect(screen.getByText("250 / 1,000 (25%)")).toBeInTheDocument();
	});

	it("does not divide by zero when total is 0", () => {
		render(
			<CalculationModal isOpen title="Starting up" processed={0} total={0} />,
		);

		expect(screen.getByText("0 / 0 (0%)")).toBeInTheDocument();
	});
});
