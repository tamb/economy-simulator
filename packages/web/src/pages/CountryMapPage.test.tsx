import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
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
		gameRun: null,
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

vi.mock("../repos/population", () => ({
	computeRegionStats: vi.fn(
		async () =>
			new Map([
				["R00", { population: 10, averageHappiness: 60, averageHealth: 70 }],
			]),
	),
}));

import { CountryMapPage } from "./CountryMapPage";

function renderPage() {
	return render(
		<MemoryRouter>
			<CountryMapPage />
		</MemoryRouter>,
	);
}

describe("CountryMapPage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders the map and a hint before a region is selected", async () => {
		renderPage();

		expect(await screen.findByRole("img")).toBeInTheDocument();
		expect(
			screen.getByText(/Hover a land tile for a quick summary/),
		).toBeInTheDocument();
		expect(screen.getByText("Land regions")).toBeInTheDocument();
		expect(screen.getByText("Map key")).toBeInTheDocument();
		expect(screen.getByText("Active calamity")).toBeInTheDocument();
		expect(screen.getByText("Fresh Water Spring")).toBeInTheDocument();
	});

	it("updates the legend when switching map metrics", async () => {
		renderPage();

		await screen.findByRole("img");
		expect(screen.getByText("Map key")).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "Population" }));
		expect(screen.getByText("Empty")).toBeInTheDocument();
		expect(screen.getByText("10 citizens")).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "Environment" }));
		expect(screen.getByText("75")).toBeInTheDocument();
		expect(screen.getByText("88")).toBeInTheDocument();
	});

	it("shows region details after selecting a populated region", async () => {
		renderPage();

		fireEvent.click(await screen.findByRole("button", { name: /Alpha/ }));

		const aside = screen.getByRole("complementary");
		expect(aside).toHaveTextContent("Alpha");
		expect(aside).toHaveTextContent("10");
		expect(aside).toHaveTextContent("Plains");
	});

	it("shows a no-citizens message for an empty selected region", async () => {
		renderPage();

		fireEvent.click(await screen.findByRole("button", { name: /Beta/ }));

		expect(
			await screen.findByText("No citizens currently call this region home."),
		).toBeInTheDocument();
	});

	it("recolors land tiles when switching map metrics", async () => {
		renderPage();

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
