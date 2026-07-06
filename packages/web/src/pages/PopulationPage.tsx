import { useVirtualizer } from "@tanstack/react-virtual";
import { useMemo, useRef, useState } from "react";
import { PersonCard } from "../components/PersonCard";
import { usePopulation } from "../context/PopulationContext";
import type { Person } from "../models/Person";

const ROW_HEIGHT = 176;
const COLUMNS = 2;

interface PopulationFilters {
	query: string;
	minHealth: string;
	minHappiness: string;
}

function filterPopulation(population: Person[], filters: PopulationFilters) {
	const query = filters.query.trim().toLowerCase();
	const minHealth =
		filters.minHealth === "" ? null : Number.parseInt(filters.minHealth, 10);
	const minHappiness =
		filters.minHappiness === ""
			? null
			: Number.parseInt(filters.minHappiness, 10);

	return population.filter((person) => {
		if (query && !person.name?.toLowerCase().includes(query)) {
			return false;
		}

		if (minHealth !== null && !Number.isNaN(minHealth)) {
			if ((person.overallHealth ?? 0) < minHealth) return false;
		}

		if (minHappiness !== null && !Number.isNaN(minHappiness)) {
			if ((person.overallHappiness ?? 0) < minHappiness) return false;
		}

		return true;
	});
}

export function PopulationPage() {
	const { population, isReady, loadProgress, total } = usePopulation();
	const [filters, setFilters] = useState<PopulationFilters>({
		query: "",
		minHealth: "",
		minHappiness: "",
	});
	const listRef = useRef<HTMLDivElement>(null);

	const filtered = useMemo(
		() => filterPopulation(population, filters),
		[population, filters],
	);

	const rowCount = Math.ceil(filtered.length / COLUMNS);

	const virtualizer = useVirtualizer({
		count: rowCount,
		getScrollElement: () => listRef.current,
		estimateSize: () => ROW_HEIGHT,
		overscan: 4,
	});

	if (!isReady) {
		const percent = total === 0 ? 0 : Math.round((loadProgress / total) * 100);
		return (
			<div className="space-y-4">
				<h2 className="text-xs sm:text-sm">Citizen Registry</h2>
				<p className="text-sm text-muted-foreground">
					Generating {total.toLocaleString()} citizens… {loadProgress.toLocaleString()}{" "}
					({percent}%)
				</p>
				<div className="h-2 border border-primary bg-surface-muted">
					<div
						className="h-full bg-primary transition-all"
						style={{ width: `${percent}%` }}
					/>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<header className="space-y-2">
				<h2 className="text-xs sm:text-sm">Citizen Registry</h2>
				<p className="text-sm leading-relaxed text-muted-foreground">
					{filtered.length.toLocaleString()} of {population.length.toLocaleString()}{" "}
					citizens shown. Faces render on scroll for performance.
				</p>
			</header>

			<div className="grid gap-3 border-2 border-primary/30 bg-surface-muted p-4 sm:grid-cols-3">
				<label className="space-y-1 sm:col-span-1">
					<span className="font-label text-[10px] tracking-overline text-muted-foreground">
						Search by name
					</span>
					<input
						type="search"
						value={filters.query}
						onChange={(event) =>
							setFilters((current) => ({ ...current, query: event.target.value }))
						}
						placeholder="e.g. Smith"
						className="w-full border-2 border-primary bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight"
					/>
				</label>

				<label className="space-y-1">
					<span className="font-label text-[10px] tracking-overline text-muted-foreground">
						Min health %
					</span>
					<input
						type="number"
						min={0}
						max={100}
						value={filters.minHealth}
						onChange={(event) =>
							setFilters((current) => ({
								...current,
								minHealth: event.target.value,
							}))
						}
						placeholder="0"
						className="w-full border-2 border-primary bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight"
					/>
				</label>

				<label className="space-y-1">
					<span className="font-label text-[10px] tracking-overline text-muted-foreground">
						Min happiness %
					</span>
					<input
						type="number"
						min={0}
						max={100}
						value={filters.minHappiness}
						onChange={(event) =>
							setFilters((current) => ({
								...current,
								minHappiness: event.target.value,
							}))
						}
						placeholder="0"
						className="w-full border-2 border-primary bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight"
					/>
				</label>
			</div>

			{filtered.length === 0 ? (
				<p className="text-sm text-muted-foreground">
					No citizens match the current filters.
				</p>
			) : (
				<div
					ref={listRef}
					className="h-[32rem] overflow-auto border-2 border-primary/30 bg-surface"
				>
					<div
						className="relative w-full"
						style={{ height: `${virtualizer.getTotalSize()}px` }}
					>
						{virtualizer.getVirtualItems().map((virtualRow) => {
							const startIndex = virtualRow.index * COLUMNS;
							const rowPeople = filtered.slice(startIndex, startIndex + COLUMNS);

							return (
								<div
									key={virtualRow.key}
									className="absolute top-0 left-0 grid w-full gap-4 px-4 sm:grid-cols-2"
									style={{
										height: `${virtualRow.size}px`,
										transform: `translateY(${virtualRow.start}px)`,
									}}
								>
									{rowPeople.map((person, columnIndex) => (
										<PersonCard
											key={`${person.name}-${startIndex + columnIndex}`}
											person={person}
										/>
									))}
								</div>
							);
						})}
					</div>
				</div>
			)}
		</div>
	);
}
