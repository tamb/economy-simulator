import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StatGlossaryModal } from "./StatGlossaryModal";

describe("StatGlossaryModal", () => {
	it("renders nothing when closed", () => {
		const { container } = render(
			<StatGlossaryModal isOpen={false} onClose={vi.fn()} />,
		);
		expect(container).toBeEmptyDOMElement();
	});

	it("shows glossary headings and closes on request", () => {
		const onClose = vi.fn();
		render(<StatGlossaryModal isOpen onClose={onClose} />);

		expect(
			screen.getByRole("dialog", { name: "What do these stats mean?" }),
		).toBeInTheDocument();
		expect(screen.getByText("Happiness")).toBeInTheDocument();
		expect(screen.getByText("Health")).toBeInTheDocument();
		expect(screen.getByText("Openness (O)")).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "Close" }));
		expect(onClose).toHaveBeenCalledOnce();
	});
});
