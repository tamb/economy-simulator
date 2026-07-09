import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Person } from "../models/Person";

vi.mock("@tanstack/react-virtual", () => ({
	useVirtualizer: ({ count }: { count: number }) => ({
		getTotalSize: () => Math.max(count, 0) * 176,
		getVirtualItems: () =>
			Array.from({ length: count }, (_, index) => ({
				key: index,
				index,
				start: index * 176,
				size: 176,
			})),
	}),
}));

const alice = Person.fromSnapshot({
	index: 0,
	name: "Alice Smith",
	age: 40,
	sex: "F",
	isAlive: true,
	overallHealth: 72.1,
	overallHappiness: 55,
	regionId: "R00",
	openness: 50,
	conscientiousness: 50,
	extraversion: 50,
	agreeableness: 50,
	neuroticism: 50,
});

const bob = Person.fromSnapshot({
	index: 1,
	name: "Bob Jones",
	age: 25,
	sex: "M",
	isAlive: false,
	overallHealth: 20,
	overallHappiness: 10,
	regionId: "R01",
	openness: 40,
	conscientiousness: 40,
	extraversion: 40,
	agreeableness: 40,
	neuroticism: 40,
});

const directory = [
	{
		index: 0,
		name: "Alice Smith",
		age: 40,
		sex: "F" as const,
		isAlive: true,
		overallHealth: 72.1,
		overallHappiness: 55,
		regionId: "R00" as const,
	},
	{
		index: 1,
		name: "Bob Jones",
		age: 25,
		sex: "M" as const,
		isAlive: false,
		overallHealth: 20,
		overallHappiness: 10,
		regionId: "R01" as const,
	},
];

const buildDirectory = vi.fn(async () => directory);
const getPeopleByIndices = vi.fn(async (indices: number[]) =>
	indices.map((index) => {
		if (index === 0) return alice;
		if (index === 1) return bob;
		return null;
	}),
);
const advanceDay = vi.fn();

vi.mock("../context/PopulationContext", () => ({
	usePopulation: () => ({
		total: 2,
		isReady: true,
		isGenerating: false,
		isAdvancingDay: false,
		loadProgress: 2,
		gameDay: 0,
		advanceDay,
		getPersonRange: vi.fn(),
		getPeopleByIndices,
		buildDirectory,
		isGameActive: true,
		gameRun: null,
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
					environmentQuality: 80,
				},
			},
			{
				id: "R01",
				q: 1,
				r: 0,
				name: "Beta",
				terrain: "forest",
				isCoastal: false,
				resourceState: {
					reserveOrCapacityByResource: {},
					environmentQuality: 70,
				},
			},
			{
				id: "R02",
				q: 2,
				r: 0,
				name: "Ocean",
				terrain: "ocean",
				isCoastal: false,
				resourceState: {
					reserveOrCapacityByResource: {},
					environmentQuality: 100,
				},
			},
		],
		regionIds: ["R00", "R01", "R02"],
		getRegion: () => undefined,
		isReady: true,
	}),
}));

vi.mock("../context/FacePoolContext", () => ({
	useFacePool: () => ({
		getFace: () => undefined,
		faceIds: [],
		isReady: true,
	}),
}));

vi.mock("facesjs/react", () => ({
	Face: () => null,
}));

import { PopulationPage } from "./PopulationPage";

describe("PopulationPage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		buildDirectory.mockResolvedValue(directory);
		vi.useFakeTimers({ shouldAdvanceTime: true });
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("indexes citizens and shows search controls", async () => {
		render(<PopulationPage />);

		expect(
			await screen.findByText("2 of 2 citizens match", { exact: false }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("searchbox", { name: "Search citizens by name" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", {
				name: "What do these stats mean?",
				exact: true,
			}),
		).toBeInTheDocument();
		expect(await screen.findByText("Alice Smith")).toBeInTheDocument();
		expect(screen.getByText("73%")).toBeInTheDocument();
	});

	it("filters by living status", async () => {
		render(<PopulationPage />);
		await screen.findByText("Alice Smith");

		fireEvent.click(screen.getByRole("button", { name: "Deceased" }));

		await waitFor(() => {
			expect(screen.queryByText("Alice Smith")).not.toBeInTheDocument();
		});
		expect(await screen.findByText("Bob Jones")).toBeInTheDocument();
		expect(
			screen.getByText("1 of 2 citizens match", { exact: false }),
		).toBeInTheDocument();
	});

	it("opens the stats glossary modal", async () => {
		render(<PopulationPage />);
		await screen.findByText("Alice Smith");

		fireEvent.click(screen.getByText("What do these stats mean?"));

		expect(
			screen.getByRole("dialog", { name: "What do these stats mean?" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("heading", { name: "Happiness" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("heading", { name: "Openness (O)" }),
		).toBeInTheDocument();
	});

	it("shows an empty state when nothing matches", async () => {
		render(<PopulationPage />);
		await screen.findByText("Alice Smith");

		fireEvent.change(
			screen.getByRole("searchbox", { name: "Search citizens by name" }),
			{ target: { value: "zzzz-no-match" } },
		);
		await vi.advanceTimersByTimeAsync(250);

		expect(
			await screen.findByText("No citizens match these filters."),
		).toBeInTheDocument();
	});
});
