import { useVirtualizer } from "@tanstack/react-virtual";
import { useCallback, useEffect, useRef, useState } from "react";
import { PersonCard } from "../components/PersonCard";
import { usePopulation } from "../context/PopulationContext";
import type { Person } from "../models/Person";

const ROW_HEIGHT = 176;
const COLUMNS = 2;
const PAGE_SIZE = 100;

function PopulationPage() {
	const {
		total,
		isReady,
		isGenerating,
		isAdvancingDay,
		loadProgress,
		gameDay,
		advanceDay,
		getPersonRange,
		isGameActive,
		gameRun,
	} = usePopulation();
	const [personCache, setPersonCache] = useState<Map<number, Person>>(
		new Map(),
	);
	const [loadedRange, setLoadedRange] = useState({ start: -1, end: -1 });
	const listRef = useRef<HTMLDivElement>(null);

	const rowCount = Math.ceil(total / COLUMNS);

	const virtualizer = useVirtualizer({
		count: rowCount,
		getScrollElement: () => listRef.current,
		estimateSize: () => ROW_HEIGHT,
		overscan: 6,
	});

	const loadVisibleRange = useCallback(async () => {
		const virtualItems = virtualizer.getVirtualItems();
		if (virtualItems.length === 0) return;

		const firstIndex = virtualItems[0]?.index ?? 0;
		const lastIndex = virtualItems.at(-1)?.index ?? firstIndex;
		const startPerson = Math.max(0, firstIndex * COLUMNS - PAGE_SIZE / 2);
		const endPerson = Math.min(
			total,
			(lastIndex + 1) * COLUMNS + PAGE_SIZE / 2,
		);
		const count = endPerson - startPerson;

		if (
			loadedRange.start <= startPerson &&
			loadedRange.end >= endPerson &&
			count > 0
		) {
			return;
		}

		const people = await getPersonRange(startPerson, count);
		setPersonCache((current) => {
			const next = new Map(current);
			for (let offset = 0; offset < people.length; offset++) {
				const person = people[offset];
				if (person) {
					next.set(startPerson + offset, person);
				}
			}
			return next;
		});
		setLoadedRange({ start: startPerson, end: endPerson });
	}, [getPersonRange, loadedRange, total, virtualizer]);

	useEffect(() => {
		if (!isReady) return;
		loadVisibleRange().catch(() => undefined);
	}, [isReady, loadVisibleRange]);

	useEffect(() => {
		const element = listRef.current;
		if (!element || !isReady) return;

		const handleScroll = () => {
			loadVisibleRange().catch(() => undefined);
		};

		element.addEventListener("scroll", handleScroll, { passive: true });
		return () => {
			element.removeEventListener("scroll", handleScroll);
		};
	}, [isReady, loadVisibleRange]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: invalidate cache when gameDay advances
	useEffect(() => {
		setPersonCache(new Map());
		setLoadedRange({ start: -1, end: -1 });
	}, [gameDay]);

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

	return (
		<div className="space-y-6">
			<header className="space-y-2">
				<h2 className="text-xs sm:text-sm">Citizen Registry</h2>
				<p className="text-sm leading-relaxed text-muted-foreground">
					{total.toLocaleString()} citizens stored on disk. Browse by index —
					only the visible window is loaded into memory. One cohort is updated
					each in-game day.
				</p>
				<div className="flex flex-wrap items-center gap-3">
					<p className="text-sm text-muted-foreground">
						Game day {gameDay.toLocaleString()} · updating cohort {gameDay % 7}{" "}
						today
					</p>
					{!isGameActive && gameRun && (
						<p className="font-label text-[10px] tracking-overline text-destructive">
							Run ended — {gameRun.status}
						</p>
					)}
					<button
						type="button"
						onClick={() => {
							advanceDay().catch(() => undefined);
						}}
						disabled={isAdvancingDay || !isGameActive}
						className="border-2 border-primary bg-surface px-3 py-1.5 text-xs disabled:opacity-50"
					>
						{isAdvancingDay ? "Advancing day…" : "Advance day"}
					</button>
				</div>
			</header>

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
									const personIndex = startIndex + columnIndex;
									if (personIndex >= total) return null;

									const person = personCache.get(personIndex);
									if (!person) {
										return (
											<div
												key={personIndex}
												className="flex h-40 items-center justify-center border-2 border-primary/20 bg-surface-muted p-4 text-xs text-muted-foreground"
											>
												Loading #{personIndex.toLocaleString()}…
											</div>
										);
									}

									return <PersonCard key={personIndex} person={person} />;
								})}
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}

export { PopulationPage };
