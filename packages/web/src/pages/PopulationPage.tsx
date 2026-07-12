import { useVirtualizer } from "@tanstack/react-virtual";
import { isLand } from "economy-simulator-data";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { CitizenDossierModal } from "../components/CitizenDossierModal";
import { PersonCard } from "../components/PersonCard";
import { StatGlossaryModal } from "../components/StatGlossaryModal";
import { usePopulation } from "../context/PopulationContext";
import { useRegions } from "../context/RegionContext";
import {
	type LivingStatusFilter,
	type PopulationDirectoryEntry,
	type PopulationSortKey,
	queryDirectory,
	type SortDirection,
} from "../lib/population-directory";
import type { Person } from "../models/Person";

const ROW_HEIGHT = 176;
const COLUMNS = 2;
const PAGE_SIZE = 100;
const SEARCH_DEBOUNCE_MS = 200;

const SORT_OPTIONS: { id: PopulationSortKey; label: string }[] = [
	{ id: "index", label: "Index" },
	{ id: "name", label: "Name" },
	{ id: "age", label: "Age" },
	{ id: "health", label: "Health" },
	{ id: "happiness", label: "Happiness" },
];

const LIVING_OPTIONS: { id: LivingStatusFilter; label: string }[] = [
	{ id: "all", label: "All" },
	{ id: "living", label: "Living" },
	{ id: "deceased", label: "Deceased" },
];

function PopulationPage() {
	const {
		total,
		isReady,
		isGenerating,
		loadProgress,
		gameDay,
		getPeopleByIndices,
		buildDirectory,
	} = usePopulation();
	const { regions } = useRegions();
	const [searchParams, setSearchParams] = useSearchParams();

	const [directory, setDirectory] = useState<PopulationDirectoryEntry[]>([]);
	const [directoryReady, setDirectoryReady] = useState(false);
	const [directoryProgress, setDirectoryProgress] = useState(0);
	const [personCache, setPersonCache] = useState<Map<number, Person>>(
		new Map(),
	);

	const [searchInput, setSearchInput] = useState("");
	const [debouncedQuery, setDebouncedQuery] = useState("");
	const [sortKey, setSortKey] = useState<PopulationSortKey>("index");
	const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
	const [livingStatus, setLivingStatus] = useState<LivingStatusFilter>("all");
	const [regionId, setRegionId] = useState(
		() => searchParams.get("region") ?? "",
	);
	const [glossaryOpen, setGlossaryOpen] = useState(false);
	const [dossierPerson, setDossierPerson] = useState<Person | null>(null);

	const listRef = useRef<HTMLDivElement>(null);
	const loadedMatchRangeRef = useRef({ start: -1, end: -1 });

	const landRegions = useMemo(
		() =>
			regions
				.filter((region) => isLand(region.terrain))
				.slice()
				.sort((a, b) => a.name.localeCompare(b.name)),
		[regions],
	);

	useEffect(() => {
		const timer = window.setTimeout(() => {
			setDebouncedQuery(searchInput);
		}, SEARCH_DEBOUNCE_MS);
		return () => window.clearTimeout(timer);
	}, [searchInput]);

	useEffect(() => {
		const fromUrl = searchParams.get("region") ?? "";
		setRegionId(fromUrl);
	}, [searchParams]);

	const updateRegionFilter = useCallback(
		(nextRegionId: string) => {
			setRegionId(nextRegionId);
			const next = new URLSearchParams(searchParams);
			if (nextRegionId) {
				next.set("region", nextRegionId);
			} else {
				next.delete("region");
			}
			setSearchParams(next, { replace: true });
		},
		[searchParams, setSearchParams],
	);

	// biome-ignore lint/correctness/useExhaustiveDependencies: rebuild directory when gameDay advances
	useEffect(() => {
		if (!isReady) return;

		let cancelled = false;
		setDirectoryReady(false);
		setDirectoryProgress(0);
		setPersonCache(new Map());
		loadedMatchRangeRef.current = { start: -1, end: -1 };

		buildDirectory((processed) => {
			if (!cancelled) setDirectoryProgress(processed);
		})
			.then((entries) => {
				if (cancelled) return;
				setDirectory(entries);
				setDirectoryReady(true);
			})
			.catch(() => {
				if (!cancelled) setDirectoryReady(true);
			});

		return () => {
			cancelled = true;
		};
	}, [isReady, gameDay, buildDirectory]);

	const matches = useMemo(
		() =>
			queryDirectory(directory, {
				query: debouncedQuery,
				filters: { livingStatus, regionId },
				sortKey,
				direction: sortDirection,
			}),
		[directory, debouncedQuery, livingStatus, regionId, sortKey, sortDirection],
	);

	// biome-ignore lint/correctness/useExhaustiveDependencies: clear hydrate cache when match list identity changes
	useEffect(() => {
		setPersonCache(new Map());
		loadedMatchRangeRef.current = { start: -1, end: -1 };
	}, [matches]);

	const rowCount = Math.ceil(matches.length / COLUMNS);

	const virtualizer = useVirtualizer({
		count: rowCount,
		getScrollElement: () => listRef.current,
		estimateSize: () => ROW_HEIGHT,
		overscan: 6,
	});

	const loadVisibleRange = useCallback(async () => {
		const virtualItems = virtualizer.getVirtualItems();
		if (virtualItems.length === 0 || matches.length === 0) return;

		const firstIndex = virtualItems[0]?.index ?? 0;
		const lastIndex = virtualItems.at(-1)?.index ?? firstIndex;
		const startMatch = Math.max(0, firstIndex * COLUMNS - PAGE_SIZE / 2);
		const endMatch = Math.min(
			matches.length,
			(lastIndex + 1) * COLUMNS + PAGE_SIZE / 2,
		);

		const loaded = loadedMatchRangeRef.current;
		if (loaded.start <= startMatch && loaded.end >= endMatch) {
			return;
		}

		const slice = matches.slice(startMatch, endMatch);
		const indices = slice.map((entry) => entry.index);
		const people = await getPeopleByIndices(indices);

		setPersonCache((current) => {
			const next = new Map(current);
			for (let offset = 0; offset < people.length; offset++) {
				const person = people[offset];
				const matchIndex = startMatch + offset;
				if (person) next.set(matchIndex, person);
			}
			return next;
		});
		loadedMatchRangeRef.current = { start: startMatch, end: endMatch };
	}, [getPeopleByIndices, matches, virtualizer]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: reload visible window when matches change
	useEffect(() => {
		if (!directoryReady) return;
		loadVisibleRange().catch(() => undefined);
	}, [directoryReady, matches, loadVisibleRange]);

	useEffect(() => {
		const element = listRef.current;
		if (!element || !directoryReady) return;

		const handleScroll = () => {
			loadVisibleRange().catch(() => undefined);
		};

		element.addEventListener("scroll", handleScroll, { passive: true });
		return () => {
			element.removeEventListener("scroll", handleScroll);
		};
	}, [directoryReady, loadVisibleRange]);

	const openGlossary = useCallback(() => setGlossaryOpen(true), []);

	if (!isReady) {
		const percent = total === 0 ? 0 : Math.round((loadProgress / total) * 100);
		return (
			<div className="space-y-4">
				<h2 className="text-xs sm:text-sm">Citizen Registry</h2>
				<p className="text-sm text-muted-foreground">
					{isGenerating ? "Generating" : "Loading"} {total.toLocaleString()}{" "}
					citizens… {loadProgress.toLocaleString()} ({percent}
					%)
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

	if (!directoryReady) {
		const percent =
			total === 0 ? 0 : Math.round((directoryProgress / total) * 100);
		return (
			<div className="space-y-4">
				<h2 className="text-xs sm:text-sm">Citizen Registry</h2>
				<p className="text-sm text-muted-foreground">
					Indexing {total.toLocaleString()} citizens for search…{" "}
					{directoryProgress.toLocaleString()} ({percent}%)
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
				<div className="flex flex-wrap items-start justify-between gap-3">
					<div className="space-y-2">
						<h2 className="text-xs sm:text-sm">Citizen Registry</h2>
						<p className="text-sm leading-relaxed text-muted-foreground">
							{matches.length.toLocaleString()} of {total.toLocaleString()}{" "}
							citizens match your filters.
						</p>
					</div>
					<button
						type="button"
						onClick={openGlossary}
						className="border-2 border-primary/30 bg-surface-muted px-3 py-1.5 text-xs hover:border-primary"
					>
						What do these stats mean?
					</button>
				</div>
				<p className="text-sm text-muted-foreground">
					Use the throne controls above to advance time. Today updates cohort{" "}
					{gameDay % 7}.
				</p>
			</header>

			<div className="flex flex-col gap-3 border-2 border-primary/30 bg-surface-muted p-4">
				<label className="block space-y-1">
					<span className="font-label text-[10px] tracking-overline text-muted-foreground">
						Search by name
					</span>
					<input
						type="search"
						value={searchInput}
						onChange={(event) => setSearchInput(event.target.value)}
						placeholder="e.g. Alice"
						className="w-full border-2 border-primary/30 bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
						aria-label="Search citizens by name"
					/>
				</label>

				<div className="flex flex-wrap items-end gap-3">
					<label className="space-y-1">
						<span className="font-label text-[10px] tracking-overline text-muted-foreground">
							Sort by
						</span>
						<select
							value={sortKey}
							onChange={(event) =>
								setSortKey(event.target.value as PopulationSortKey)
							}
							className="block border-2 border-primary/30 bg-surface px-3 py-1.5 text-xs"
							aria-label="Sort citizens by"
						>
							{SORT_OPTIONS.map((option) => (
								<option key={option.id} value={option.id}>
									{option.label}
								</option>
							))}
						</select>
					</label>

					<fieldset className="flex flex-wrap items-center gap-2 border-0 p-0">
						<legend className="sr-only">Sort direction</legend>
						{(
							[
								{ id: "asc", label: "Asc" },
								{ id: "desc", label: "Desc" },
							] as const
						).map((option) => (
							<button
								key={option.id}
								type="button"
								onClick={() => setSortDirection(option.id)}
								className={`cursor-pointer border-2 px-3 py-1.5 font-label text-[10px] tracking-overline transition-colors ${
									sortDirection === option.id
										? "border-primary bg-primary text-primary-foreground"
										: "border-primary/30 bg-surface text-muted-foreground hover:border-primary"
								}`}
							>
								{option.label}
							</button>
						))}
					</fieldset>

					<fieldset className="flex flex-wrap items-center gap-2 border-0 p-0">
						<legend className="sr-only">Living status</legend>
						{LIVING_OPTIONS.map((option) => (
							<button
								key={option.id}
								type="button"
								onClick={() => setLivingStatus(option.id)}
								className={`cursor-pointer border-2 px-3 py-1.5 font-label text-[10px] tracking-overline transition-colors ${
									livingStatus === option.id
										? "border-primary bg-primary text-primary-foreground"
										: "border-primary/30 bg-surface text-muted-foreground hover:border-primary"
								}`}
							>
								{option.label}
							</button>
						))}
					</fieldset>

					<label className="space-y-1">
						<span className="font-label text-[10px] tracking-overline text-muted-foreground">
							Region
						</span>
						<select
							value={regionId}
							onChange={(event) => updateRegionFilter(event.target.value)}
							className="block max-w-[14rem] border-2 border-primary/30 bg-surface px-3 py-1.5 text-xs"
							aria-label="Filter by region"
						>
							<option value="">All regions</option>
							{landRegions.map((region) => (
								<option key={region.id} value={region.id}>
									{region.name}
								</option>
							))}
						</select>
					</label>
				</div>
			</div>

			{matches.length === 0 ? (
				<p className="border-2 border-primary/20 bg-surface-muted p-6 text-sm text-muted-foreground">
					No citizens match these filters.
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

							return (
								<div
									key={virtualRow.key}
									className="absolute top-0 left-0 grid w-full gap-4 px-4 sm:grid-cols-2"
									style={{
										height: `${virtualRow.size}px`,
										transform: `translateY(${virtualRow.start}px)`,
									}}
								>
									{Array.from({ length: COLUMNS }, (_, columnIndex) => {
										const matchIndex = startIndex + columnIndex;
										if (matchIndex >= matches.length) return null;

										const person = personCache.get(matchIndex);
										if (!person) {
											return (
												<div
													key={matchIndex}
													className="flex h-40 items-center justify-center border-2 border-primary/20 bg-surface-muted p-4 text-xs text-muted-foreground"
												>
													Loading…
												</div>
											);
										}

										return (
											<PersonCard
												key={matchIndex}
												person={person}
												onOpenGlossary={openGlossary}
												onOpenDossier={setDossierPerson}
											/>
										);
									})}
								</div>
							);
						})}
					</div>
				</div>
			)}

			<StatGlossaryModal
				isOpen={glossaryOpen}
				onClose={() => setGlossaryOpen(false)}
			/>
			{dossierPerson && (
				<CitizenDossierModal
					person={dossierPerson}
					onClose={() => setDossierPerson(null)}
				/>
			)}
		</div>
	);
}

export { PopulationPage };
