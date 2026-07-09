import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../context/PopulationContext", () => ({
	usePopulation: () => ({
		total: 2,
		isReady: true,
		isGenerating: false,
		isAdvancingDay: false,
		loadProgress: 2,
		gameDay: 0,
		advanceDay: vi.fn(),
		getPersonRange: vi.fn(),
	}),
}));

const mockRegions = [
	{
		id: "R00",
		q: 0,
		r: 0,
		name: "Alpha",
		terrain: "plains" as const,
		isCoastal: false,
		resourceState: {
			reserveOrCapacityByResource: { crops: 1 },
			environmentQuality: 88,
		},
	},
	{
		id: "R01",
		q: 1,
		r: 0,
		name: "Beta",
		terrain: "forest" as const,
		isCoastal: false,
		resourceState: {
			reserveOrCapacityByResource: { timber: 0.9 },
			environmentQuality: 75,
		},
	},
];

vi.mock("../context/RegionContext", () => ({
	useRegions: () => ({
		regions: mockRegions,
		regionIds: ["R00", "R01"],
		getRegion: () => undefined,
		isReady: true,
	}),
}));

vi.mock("../storage/population", () => ({
	computeRegionStats: vi.fn(
		async () =>
			new Map([
				["R00", { population: 10, averageHappiness: 60, averageHealth: 70 }],
			]),
	),
}));

import { CountryMapPage } from "./CountryMapPage";

describe("CountryMapPage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders the map and a hint before a region is selected", async () => {
		render(<CountryMapPage />);

		expect(await screen.findByRole("img")).toBeInTheDocument();
		expect(
			screen.getByText(/Hover a land tile for a quick summary/),
		).toBeInTheDocument();
	});

	it("shows region details after selecting a populated region", async () => {
		render(<CountryMapPage />);

		fireEvent.click(await screen.findByRole("button", { name: /Alpha/ }));

		expect(await screen.findByText("Alpha")).toBeInTheDocument();
		expect(screen.getByText("10")).toBeInTheDocument();
		expect(screen.getByText("Plains")).toBeInTheDocument();
	});

	it("shows a no-citizens message for an empty selected region", async () => {
		render(<CountryMapPage />);

		fireEvent.click(await screen.findByRole("button", { name: /Beta/ }));

		expect(
			await screen.findByText("No citizens currently call this region home."),
		).toBeInTheDocument();
	});

	it("recolors land tiles when switching map metrics", async () => {
		render(<CountryMapPage />);

		await screen.findByRole("img");
		const alphaFill = () =>
			document
				.querySelector('polygon[data-region-id="R00"]')
				?.getAttribute("data-fill");

		fireEvent.click(screen.getByRole("button", { name: "Population" }));
		const populationFill = alphaFill();

		fireEvent.click(screen.getByRole("button", { name: "Happiness" }));
		const happinessFill = alphaFill();

		fireEvent.click(screen.getByRole("button", { name: "Environment" }));
		const environmentFill = alphaFill();

		expect(populationFill).toBeTruthy();
		expect(happinessFill).toBeTruthy();
		expect(environmentFill).toBeTruthy();
		expect(populationFill).not.toBe(happinessFill);
		expect(happinessFill).not.toBe(environmentFill);
	});
});
