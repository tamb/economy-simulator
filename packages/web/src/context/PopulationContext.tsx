import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";
import {
	getPopulationSize,
	getPopulationSizeOverride,
} from "../data/runtime-config";
import { generateAndSavePopulation } from "../models/generatePopulation";
import type { Person } from "../models/Person";
import {
	getPersonRangeBatched,
	hasPopulation,
	loadPopulationMeta,
	type PopulationMeta,
} from "../storage/population";
import type {
	PopulationWorkerRequest,
	PopulationWorkerResponse,
} from "../workers/population-worker-protocol";
import { useFacePool } from "./FacePoolContext";
import { useRegions } from "./RegionContext";

/** Progress of the day-advance calculation currently running in the population worker. */
interface DayAdvanceProgress {
	/** `daily` = today's cohort QoL tick; `annual` = the once-a-year population-dynamics cycle. */
	phase: "daily" | "annual";
	processed: number;
	total: number;
}

interface PopulationContextValue {
	total: number;
	isReady: boolean;
	isGenerating: boolean;
	/**
	 * True when no population exists yet and the player must choose a
	 * starting size on the new-game setup screen before generation begins.
	 * Clears as soon as `startGeneration` is called; generation progress
	 * from then on is reflected via `isGenerating`/`loadProgress` in the
	 * normal app UI (see `PopulationPage`).
	 */
	needsSetup: boolean;
	/** Kicks off generation for a brand-new population at the chosen size. */
	startGeneration: (size: number) => Promise<void>;
	isAdvancingDay: boolean;
	dayAdvanceProgress: DayAdvanceProgress | null;
	loadProgress: number;
	gameDay: number;
	advanceDay: () => Promise<void>;
	getPersonRange: (start: number, count: number) => Promise<Person[]>;
}

const PopulationContext = createContext<PopulationContextValue | null>(null);

function PopulationProvider({ children }: { children: ReactNode }) {
	const { faceIds, isReady: isFacePoolReady } = useFacePool();
	const { regions, isReady: isRegionsReady } = useRegions();
	const [isReady, setIsReady] = useState(false);
	const [isGenerating, setIsGenerating] = useState(false);
	const [needsSetup, setNeedsSetup] = useState(false);
	const [isAdvancingDay, setIsAdvancingDay] = useState(false);
	const [dayAdvanceProgress, setDayAdvanceProgress] =
		useState<DayAdvanceProgress | null>(null);
	const [loadProgress, setLoadProgress] = useState(0);
	const [gameDay, setGameDay] = useState(0);
	const [total, setTotal] = useState<number>(getPopulationSize());
	const workerRef = useRef<Worker | null>(null);

	const getWorker = useCallback((): Worker => {
		if (!workerRef.current) {
			workerRef.current = new Worker(
				new URL("../workers/population.worker.ts", import.meta.url),
				{ type: "module" },
			);
		}
		return workerRef.current;
	}, []);

	useEffect(() => {
		return () => {
			workerRef.current?.terminate();
			workerRef.current = null;
		};
	}, []);

	const runGeneration = useCallback(
		async (size: number, isCancelled: () => boolean) => {
			setIsGenerating(true);
			setIsReady(false);
			setLoadProgress(0);
			setTotal(size);

			await generateAndSavePopulation(faceIds, regions, size, (loaded) => {
				if (!isCancelled()) setLoadProgress(loaded);
			});

			if (isCancelled()) return;

			const meta = await loadPopulationMeta();
			setGameDay(meta?.gameDay ?? 0);
			setTotal(meta?.size ?? size);
			setLoadProgress(size);
			setIsGenerating(false);
			setIsReady(true);
		},
		[faceIds, regions],
	);

	useEffect(() => {
		if (!isFacePoolReady || faceIds.length === 0) return;
		if (!isRegionsReady || regions.length === 0) return;

		let cancelled = false;
		const isCancelled = () => cancelled;

		async function initializePopulation() {
			const exists = await hasPopulation();
			if (exists) {
				const populationSize = getPopulationSize();
				const meta = await loadPopulationMeta();
				if (!cancelled) {
					setGameDay(meta?.gameDay ?? 0);
					setTotal(meta?.size ?? populationSize);
					setLoadProgress(populationSize);
					setIsReady(true);
				}
				return;
			}

			// A configured override (e2e tests, local debugging) skips the
			// new-game setup screen entirely and generates immediately.
			const override = getPopulationSizeOverride();
			if (override != null) {
				await runGeneration(override, isCancelled);
				return;
			}

			if (!cancelled) setNeedsSetup(true);
		}

		initializePopulation().catch(() => {
			if (!cancelled) {
				setIsGenerating(false);
				setNeedsSetup(false);
				setIsReady(true);
			}
		});

		return () => {
			cancelled = true;
		};
	}, [faceIds, isFacePoolReady, regions, isRegionsReady, runGeneration]);

	const startGeneration = useCallback(
		async (size: number) => {
			setNeedsSetup(false);
			await runGeneration(size, () => false);
		},
		[runGeneration],
	);

	const advanceDay = useCallback(async () => {
		if (isAdvancingDay) return;

		setIsAdvancingDay(true);
		setDayAdvanceProgress({ phase: "daily", processed: 0, total: 0 });

		try {
			const meta = await new Promise<PopulationMeta | null>(
				(resolve, reject) => {
					const worker = getWorker();

					function handleMessage(
						event: MessageEvent<PopulationWorkerResponse>,
					): void {
						const message = event.data;
						if (message.type === "progress") {
							setDayAdvanceProgress({
								phase: message.phase,
								processed: message.processed,
								total: message.total,
							});
						} else if (message.type === "done") {
							cleanup();
							resolve(message.meta);
						} else if (message.type === "error") {
							cleanup();
							reject(new Error(message.message));
						}
					}

					function cleanup(): void {
						worker.removeEventListener("message", handleMessage);
					}

					worker.addEventListener("message", handleMessage);
					worker.postMessage({
						type: "advance-day",
					} satisfies PopulationWorkerRequest);
				},
			);

			if (meta) {
				setGameDay(meta.gameDay);
				setTotal(meta.size);
			}
		} finally {
			setIsAdvancingDay(false);
			setDayAdvanceProgress(null);
		}
	}, [isAdvancingDay, getWorker]);

	const getPersonRange = useCallback(async (start: number, count: number) => {
		return getPersonRangeBatched(start, count);
	}, []);

	return (
		<PopulationContext.Provider
			value={{
				total,
				isReady,
				isGenerating,
				needsSetup,
				startGeneration,
				isAdvancingDay,
				dayAdvanceProgress,
				loadProgress,
				gameDay,
				advanceDay,
				getPersonRange,
			}}
		>
			{children}
		</PopulationContext.Provider>
	);
}

function usePopulation() {
	const context = useContext(PopulationContext);
	if (!context) {
		throw new Error("usePopulation must be used within PopulationProvider");
	}
	return context;
}

export { PopulationProvider, usePopulation };
