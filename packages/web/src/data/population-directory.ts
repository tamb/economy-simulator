import type { RegionId } from "./regions";

interface PopulationDirectoryEntry {
	index: number;
	name: string;
	age: number;
	sex: "M" | "F" | undefined;
	isAlive: boolean;
	overallHealth: number;
	overallHappiness: number;
	regionId: RegionId | undefined;
}

type LivingStatusFilter = "all" | "living" | "deceased";

type PopulationSortKey = "index" | "name" | "age" | "health" | "happiness";

type SortDirection = "asc" | "desc";

interface PopulationDirectoryFilters {
	livingStatus?: LivingStatusFilter;
	regionId?: RegionId | "";
}

function searchDirectory(
	entries: readonly PopulationDirectoryEntry[],
	query: string,
): PopulationDirectoryEntry[] {
	const normalized = query.trim().toLowerCase();
	if (!normalized) return [...entries];
	return entries.filter((entry) =>
		entry.name.toLowerCase().includes(normalized),
	);
}

function filterDirectory(
	entries: readonly PopulationDirectoryEntry[],
	filters: PopulationDirectoryFilters = {},
): PopulationDirectoryEntry[] {
	const livingStatus = filters.livingStatus ?? "all";
	const regionId = filters.regionId ?? "";

	return entries.filter((entry) => {
		if (livingStatus === "living" && !entry.isAlive) return false;
		if (livingStatus === "deceased" && entry.isAlive) return false;
		if (regionId && entry.regionId !== regionId) return false;
		return true;
	});
}

function compareEntries(
	a: PopulationDirectoryEntry,
	b: PopulationDirectoryEntry,
	sortKey: PopulationSortKey,
): number {
	switch (sortKey) {
		case "index":
			return a.index - b.index;
		case "name":
			return a.name.localeCompare(b.name);
		case "age":
			return a.age - b.age;
		case "health":
			return a.overallHealth - b.overallHealth;
		case "happiness":
			return a.overallHappiness - b.overallHappiness;
	}
}

function sortDirectory(
	entries: readonly PopulationDirectoryEntry[],
	sortKey: PopulationSortKey,
	direction: SortDirection = "asc",
): PopulationDirectoryEntry[] {
	const sorted = [...entries].sort((a, b) => compareEntries(a, b, sortKey));
	if (direction === "desc") sorted.reverse();
	return sorted;
}

/** Apply search → filter → sort and return the resulting directory slice. */
function queryDirectory(
	entries: readonly PopulationDirectoryEntry[],
	options: {
		query?: string;
		filters?: PopulationDirectoryFilters;
		sortKey?: PopulationSortKey;
		direction?: SortDirection;
	} = {},
): PopulationDirectoryEntry[] {
	const searched = searchDirectory(entries, options.query ?? "");
	const filtered = filterDirectory(searched, options.filters);
	return sortDirectory(
		filtered,
		options.sortKey ?? "index",
		options.direction ?? "asc",
	);
}

export type {
	LivingStatusFilter,
	PopulationDirectoryEntry,
	PopulationDirectoryFilters,
	PopulationSortKey,
	SortDirection,
};
export { filterDirectory, queryDirectory, searchDirectory, sortDirectory };
