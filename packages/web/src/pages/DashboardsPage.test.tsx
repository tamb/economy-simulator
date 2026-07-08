import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("react-chartjs-2", () => ({
	Bar: () => <div data-testid="chart-bar" />,
	Line: () => <div data-testid="chart-line" />,
	Doughnut: () => <div data-testid="chart-doughnut" />,
}));

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

vi.mock("../context/RegionContext", () => ({
	useRegions: () => ({
		regions: [
			{
				id: "R00",
				q: 0,
				r: 0,
				name: "Alpha",
				terrain: "plains",
				isCoastal: false,
				resourceState: {
					reserveOrCapacityByResource: {},
					environmentQuality: 100,
				},
			},
		],
		regionIds: ["R00"],
		getRegion: () => undefined,
		isReady: true,
	}),
}));

vi.mock("../context/SectorAssignmentContext", () => ({
	useSectorAssignments: () => ({
		assignments: {},
		isReady: true,
		getAssignment: () => null,
		setAssignment: vi.fn(),
	}),
}));

vi.mock("../storage/national-ledger", () => ({
	loadNationalLedger: vi.fn(async () => ({
		resources: [
			{
				resourceId: "crops",
				production: 100,
				demand: 80,
				sufficiency: 1.25,
			},
		],
		shortfallHappinessPenaltyBySubSector: {},
	})),
}));

vi.mock("../storage/population", () => ({
	computeDemographicStats: vi.fn(async () => ({
		ageSexPyramid: [{ label: "0-9", male: 1, female: 1 }],
		happinessHistogram: [{ label: "50-59", count: 2 }],
		healthHistogram: [{ label: "50-59", count: 2 }],
	})),
	computeSectorStats: vi.fn(
		async () =>
			new Map([
				[
					"services/healthcare",
					{
						categoryId: "services",
						subSectorId: "healthcare",
						population: 2,
						averageHappiness: 55,
					},
				],
			]),
	),
	computeRegionStats: vi.fn(
		async () =>
			new Map([
				["R00", { population: 2, averageHappiness: 55, averageHealth: 60 }],
			]),
	),
	loadPopulationMeta: vi.fn(async () => ({
		version: 1,
		size: 2,
		cohortCount: 7,
		chunkSize: 500,
		cohortSizes: [2, 0, 0, 0, 0, 0, 0],
		gameDay: 364,
		yearlyStats: [
			{
				year: 0,
				populationBefore: 2,
				populationAfter: 2,
				births: 0,
				deaths: 0,
				emigrations: 0,
				immigrations: 0,
				averageQualityOfLife: 55,
			},
		],
	})),
}));

import { DashboardsPage } from "./DashboardsPage";

describe("DashboardsPage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders the population dashboard by default", async () => {
		render(<DashboardsPage />);

		expect(screen.getByText("Dashboards")).toBeInTheDocument();
		expect(await screen.findByText("Age-Sex Pyramid")).toBeInTheDocument();
	});

	it("switches to the economic sectors dashboard on tab click", async () => {
		render(<DashboardsPage />);

		fireEvent.click(screen.getByRole("button", { name: "Economic Sectors" }));

		expect(
			await screen.findByText("Employment Share by Sub-Sector"),
		).toBeInTheDocument();
	});

	it("switches to the country overview dashboard on tab click", async () => {
		render(<DashboardsPage />);

		fireEvent.click(screen.getByRole("button", { name: "Country Overview" }));

		expect(
			await screen.findByText("National Quality of Life Trend"),
		).toBeInTheDocument();
		expect(await screen.findByText("Region Leaderboard")).toBeInTheDocument();
	});

	it("switches to the resource ledger dashboard on tab click", async () => {
		render(<DashboardsPage />);

		fireEvent.click(screen.getByRole("button", { name: "Resource Ledger" }));

		expect(
			await screen.findByText("National Production vs. Demand"),
		).toBeInTheDocument();
		expect(
			await screen.findByText("Resource Ledger Detail"),
		).toBeInTheDocument();
	});
});
