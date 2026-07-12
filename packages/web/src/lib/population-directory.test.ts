import { describe, expect, it } from "vitest";
import {
	filterDirectory,
	type PopulationDirectoryEntry,
	queryDirectory,
	searchDirectory,
	sortDirectory,
} from "./population-directory";

const fixtures: PopulationDirectoryEntry[] = [
	{
		index: 0,
		name: "Alice Smith",
		age: 40,
		sex: "F",
		isAlive: true,
		overallHealth: 70,
		overallHappiness: 55,
		regionId: "R00",
	},
	{
		index: 1,
		name: "Bob Jones",
		age: 25,
		sex: "M",
		isAlive: false,
		overallHealth: 20,
		overallHappiness: 10,
		regionId: "R01",
	},
	{
		index: 2,
		name: "alice brown",
		age: 60,
		sex: "F",
		isAlive: true,
		overallHealth: 90.2,
		overallHappiness: 80.1,
		regionId: "R00",
	},
];

describe("searchDirectory", () => {
	it("matches names case-insensitively", () => {
		const matches = searchDirectory(fixtures, "ALICE");
		expect(matches.map((entry) => entry.index)).toEqual([0, 2]);
	});

	it("returns all entries for blank query", () => {
		expect(searchDirectory(fixtures, "  ")).toHaveLength(3);
	});
});

describe("filterDirectory", () => {
	it("filters by living status", () => {
		expect(
			filterDirectory(fixtures, { livingStatus: "living" }).map((e) => e.index),
		).toEqual([0, 2]);
		expect(
			filterDirectory(fixtures, { livingStatus: "deceased" }).map(
				(e) => e.index,
			),
		).toEqual([1]);
	});

	it("filters by region", () => {
		expect(
			filterDirectory(fixtures, { regionId: "R01" }).map((e) => e.index),
		).toEqual([1]);
	});
});

describe("sortDirectory", () => {
	it("sorts by age ascending and descending", () => {
		expect(
			sortDirectory(fixtures, "age", "asc").map((entry) => entry.age),
		).toEqual([25, 40, 60]);
		expect(
			sortDirectory(fixtures, "age", "desc").map((entry) => entry.age),
		).toEqual([60, 40, 25]);
	});

	it("sorts by health", () => {
		expect(
			sortDirectory(fixtures, "health", "asc").map(
				(entry) => entry.overallHealth,
			),
		).toEqual([20, 70, 90.2]);
	});
});

describe("queryDirectory", () => {
	it("chains search, filter, and sort", () => {
		const result = queryDirectory(fixtures, {
			query: "alice",
			filters: { livingStatus: "living", regionId: "R00" },
			sortKey: "age",
			direction: "desc",
		});
		expect(result.map((entry) => entry.index)).toEqual([2, 0]);
	});
});
