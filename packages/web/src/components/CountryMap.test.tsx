import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { getTerrainColor } from "../data/terrain-color-scale";
import type { RegionStats } from "../storage/population";
import type { Region } from "../storage/regions";
import {
	CountryMap,
	comparePaintOrder,
	metricValue,
	qualityRangeForMetric,
} from "./CountryMap";

const regions: Region[] = [
	{
		id: "R00",
		q: 0,
		r: 0,
		name: "Alpha",
		terrain: "plains",
		isCoastal: true,
		resourceState: {
			reserveOrCapacityByResource: { crops: 1 },
			environmentQuality: 90,
		},
	},
	{
		id: "R01",
		q: 1,
		r: 0,
		name: "Beta",
		terrain: "ocean",
		isCoastal: false,
		resourceState: {
			reserveOrCapacityByResource: {},
			environmentQuality: 100,
		},
	},
	{
		id: "R02",
		q: 0,
		r: 1,
		name: "Gamma",
		terrain: "forest",
		isCoastal: false,
		resourceState: {
			reserveOrCapacityByResource: { timber: 0.8 },
			environmentQuality: 40,
		},
	},
];

const stats: Map<string, RegionStats> = new Map([
	["R00", { population: 100, averageHappiness: 60, averageHealth: 70 }],
	["R02", { population: 20, averageHappiness: 30, averageHealth: 40 }],
]);

function fillFor(container: HTMLElement, regionId: string): string | null {
	return (
		container
			.querySelector(`polygon[data-region-id="${regionId}"]`)
			?.getAttribute("data-fill") ?? null
	);
}

describe("CountryMap", () => {
	it("renders one hex tile per region", () => {
		const { container } = render(
			<CountryMap
				regions={regions}
				stats={stats}
				metric="terrain"
				selectedRegionId={null}
				onSelect={() => undefined}
			/>,
		);

		expect(container.querySelectorAll("polygon")).toHaveLength(regions.length);
	});

	it("only makes land tiles interactive", () => {
		render(
			<CountryMap
				regions={regions}
				stats={stats}
				metric="terrain"
				selectedRegionId={null}
				onSelect={() => undefined}
			/>,
		);

		expect(screen.getAllByRole("button")).toHaveLength(2);
	});

	it("calls onSelect with the clicked land region's id", () => {
		const onSelect = vi.fn();
		render(
			<CountryMap
				regions={regions}
				stats={stats}
				metric="terrain"
				selectedRegionId={null}
				onSelect={onSelect}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: /Alpha/ }));
		expect(onSelect).toHaveBeenCalledWith("R00");
	});

	it("activates a land region via keyboard", () => {
		const onSelect = vi.fn();
		render(
			<CountryMap
				regions={regions}
				stats={stats}
				metric="terrain"
				selectedRegionId={null}
				onSelect={onSelect}
			/>,
		);

		fireEvent.keyDown(screen.getByRole("button", { name: /Alpha/ }), {
			key: "Enter",
		});
		expect(onSelect).toHaveBeenCalledWith("R00");
	});

	it("shows a hover tooltip for land tiles", () => {
		render(
			<CountryMap
				regions={regions}
				stats={stats}
				metric="terrain"
				selectedRegionId={null}
				onSelect={() => undefined}
			/>,
		);

		fireEvent.pointerEnter(screen.getByRole("button", { name: /Alpha/ }), {
			clientX: 100,
			clientY: 200,
		});

		expect(screen.getByRole("tooltip")).toHaveTextContent("Alpha");
		expect(screen.getByRole("tooltip")).toHaveTextContent("Plains");
	});

	it("keeps ocean tiles ocean-blue when a quality metric is active", () => {
		const { container } = render(
			<CountryMap
				regions={regions}
				stats={stats}
				metric="environment"
				selectedRegionId={null}
				onSelect={() => undefined}
			/>,
		);

		expect(fillFor(container, "R01")).toBe(getTerrainColor("ocean"));
		expect(fillFor(container, "R00")).not.toBe(getTerrainColor("ocean"));
		expect(fillFor(container, "R02")).not.toBe(getTerrainColor("ocean"));
		expect(fillFor(container, "R00")).not.toBe(fillFor(container, "R02"));
	});

	it("colors land tiles differently for population density", () => {
		const { container } = render(
			<CountryMap
				regions={regions}
				stats={stats}
				metric="population"
				selectedRegionId={null}
				onSelect={() => undefined}
			/>,
		);

		expect(fillFor(container, "R00")).not.toBe(fillFor(container, "R02"));
		expect(fillFor(container, "R01")).toBe(getTerrainColor("ocean"));
	});

	it("shows the active metric value in the hover tooltip", () => {
		render(
			<CountryMap
				regions={regions}
				stats={stats}
				metric="happiness"
				selectedRegionId={null}
				onSelect={() => undefined}
			/>,
		);

		fireEvent.pointerEnter(screen.getByRole("button", { name: /Alpha/ }), {
			clientX: 100,
			clientY: 200,
		});

		expect(screen.getByRole("tooltip")).toHaveTextContent("Happiness 60.0");
	});
});

describe("metricValue / qualityRangeForMetric", () => {
	it("ignores ocean tiles for metric values and quality ranges", () => {
		expect(metricValue("environment", regions[1], undefined)).toBeUndefined();
		expect(qualityRangeForMetric("environment", regions, stats)).toEqual({
			min: 40,
			max: 90,
		});
		expect(qualityRangeForMetric("happiness", regions, stats)).toEqual({
			min: 30,
			max: 60,
		});
	});
});

describe("comparePaintOrder", () => {
	it("paints ocean under land and selected tiles last", () => {
		const ocean = { region: regions[1], isLand: false };
		const land = { region: regions[0], isLand: true };
		const otherLand = { region: regions[2], isLand: true };

		expect(comparePaintOrder(ocean, land, null, null)).toBeLessThan(0);
		expect(comparePaintOrder(land, otherLand, "R00", null)).toBeGreaterThan(0);
		expect(comparePaintOrder(land, otherLand, null, "R00")).toBeGreaterThan(0);
	});
});
