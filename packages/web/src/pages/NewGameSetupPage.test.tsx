import { fireEvent, render, screen } from "@testing-library/react";
import { appConfig } from "economy-simulator-data";
import { describe, expect, it, vi } from "vitest";
import { NewGameSetupPage } from "./NewGameSetupPage";

describe("NewGameSetupPage", () => {
	it("renders every configured population size option", () => {
		render(<NewGameSetupPage onStart={vi.fn()} />);

		for (const size of appConfig.population.sizeOptions) {
			expect(
				screen.getByRole("radio", {
					name: new RegExp(`${size.toLocaleString()} citizens`),
				}),
			).toBeInTheDocument();
		}
	});

	it("defaults to appConfig.population.size and starts generation with it", () => {
		const onStart = vi.fn();
		render(<NewGameSetupPage onStart={onStart} />);

		const defaultOption = screen.getByRole("radio", {
			name: new RegExp(
				`${appConfig.population.size.toLocaleString()} citizens`,
			),
		});
		expect(defaultOption).toBeChecked();

		fireEvent.click(screen.getByRole("button", { name: "Begin" }));

		expect(onStart).toHaveBeenCalledWith(appConfig.population.size);
	});

	it("starts generation with the size the player selects", () => {
		const onStart = vi.fn();
		render(<NewGameSetupPage onStart={onStart} />);

		const nonDefaultSize = appConfig.population.sizeOptions.find(
			(size) => size !== appConfig.population.size,
		);
		expect(nonDefaultSize).toBeDefined();

		fireEvent.click(
			screen.getByRole("radio", {
				name: new RegExp(`${nonDefaultSize?.toLocaleString()} citizens`),
			}),
		);
		fireEvent.click(screen.getByRole("button", { name: "Begin" }));

		expect(onStart).toHaveBeenCalledWith(nonDefaultSize);
	});
});
