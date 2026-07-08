import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { RegionStats } from "../storage/population";
import type { Region } from "../storage/regions";
import { CountryMap } from "./CountryMap";

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
];

const stats: Map<string, RegionStats> = new Map([
	["R00", { population: 100, averageHappiness: 60, averageHealth: 70 }],
]);

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

		expect(screen.getAllByRole("button")).toHaveLength(1);
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
});
