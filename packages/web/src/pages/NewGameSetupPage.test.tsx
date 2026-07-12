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

	it("renders every configured region-scale option", () => {
		render(<NewGameSetupPage onStart={vi.fn()} />);

		for (const option of appConfig.regions.regionScaleOptions) {
			expect(
				screen.getByRole("radio", {
					name: new RegExp(option.label),
				}),
			).toBeInTheDocument();
		}
	});

	it("defaults to appConfig size and region scale and starts with them", () => {
		const onStart = vi.fn();
		render(<NewGameSetupPage onStart={onStart} />);

		const defaultOption = screen.getByRole("radio", {
			name: new RegExp(
				`${appConfig.population.size.toLocaleString()} citizens`,
			),
		});
		expect(defaultOption).toBeChecked();

		const defaultScale = appConfig.regions.regionScaleOptions.find(
			(option) => option.id === appConfig.regions.defaultRegionScale,
		);
		expect(defaultScale).toBeDefined();
		expect(
			screen.getByRole("radio", {
				name: new RegExp(defaultScale?.label ?? ""),
			}),
		).toBeChecked();

		fireEvent.click(
			screen.getByRole("button", { name: "Continue to nation setup" }),
		);

		expect(onStart).toHaveBeenCalledWith({
			size: appConfig.population.size,
			boundingRadius: defaultScale?.boundingRadius,
		});
	});

	it("starts with the size and region scale the player selects", () => {
		const onStart = vi.fn();
		render(<NewGameSetupPage onStart={onStart} />);

		const nonDefaultSize = appConfig.population.sizeOptions.find(
			(size) => size !== appConfig.population.size,
		);
		expect(nonDefaultSize).toBeDefined();

		const nonDefaultScale = appConfig.regions.regionScaleOptions.find(
			(option) => option.id !== appConfig.regions.defaultRegionScale,
		);
		expect(nonDefaultScale).toBeDefined();

		fireEvent.click(
			screen.getByRole("radio", {
				name: new RegExp(`${nonDefaultSize?.toLocaleString()} citizens`),
			}),
		);
		fireEvent.click(
			screen.getByRole("radio", {
				name: new RegExp(nonDefaultScale?.label ?? ""),
			}),
		);
		fireEvent.click(
			screen.getByRole("button", { name: "Continue to nation setup" }),
		);

		expect(onStart).toHaveBeenCalledWith({
			size: nonDefaultSize,
			boundingRadius: nonDefaultScale?.boundingRadius,
		});
	});
});
