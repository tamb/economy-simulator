import type { GameRunState } from "economy-simulator-persistence";
import { loadGameRunState } from "economy-simulator-persistence";
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";
import type { PopulationDirectoryEntry } from "../data/population-directory";
import {
	getPopulationSize,
	getPopulationSizeOverride,
} from "../data/runtime-config";
import {
	autoAssignAllSectors,
	beginNationFounding,
	startGame,
} from "../game/nation-setup";
import { startNewNation } from "../game/new-game";
import type { Person } from "../models/Person";
import {
	buildPopulationDirectory,
	getPeopleByIndices,
	getPersonRangeBatched,
	hasPopulation,
	loadPopulationMeta,
	type PopulationMeta,
} from "../storage/population";
import { ensureWorld } from "../storage/world";
import type {
	PopulationWorkerRequest,
	PopulationWorkerResponse,
} from "../workers/population-worker-protocol";
import { useFacePool } from "./FacePoolContext";
import { useRegions } from "./RegionContext";

interface DayAdvanceProgress {
	phase: "daily" | "annual";
	processed: number;
	total: number;
}

interface PopulationContextValue {
	total: number;
	isReady: boolean;
	isGenerating: boolean;
	needsSetup: boolean;
	needsConfiguration: boolean;
	startGeneration: (size: number) => Promise<void>;
	restartNation: (size: number) => Promise<void>;
	autoAssignAll: () => Promise<void>;
	startConfiguredGame: () => Promise<void>;
	isAdvancingDay: boolean;
	dayAdvanceProgress: DayAdvanceProgress | null;
	loadProgress: number;
	gameDay: number;
	gameRun: GameRunState | null;
	isGameActive: boolean;
	advanceDay: () => Promise<void>;
	getPersonRange: (start: number, count: number) => Promise<Person[]>;
	getPeopleByIndices: (indices: number[]) => Promise<(Person | null)[]>;
	buildDirectory: (
		onProgress?: (processed: number, total: number) => void,
	) => Promise<PopulationDirectoryEntry[]>;
	refreshGameRun: () => Promise<GameRunState | null>;
}

const PopulationContext = createContext<PopulationContextValue | null>(null);

function PopulationProvider({ children }: { children: ReactNode }) {
	const { faceIds, isReady: isFacePoolReady } = useFacePool();
	const { regions, isReady: isRegionsReady } = useRegions();
	const [isReady, setIsReady] = useState(false);
	const [isGenerating, setIsGenerating] = useState(false);
	const [needsSetup, setNeedsSetup] = useState(false);
	const [needsConfiguration, setNeedsConfiguration] = useState(false);
	const [isAdvancingDay, setIsAdvancingDay] = useState(false);
	const [dayAdvanceProgress, setDayAdvanceProgress] =
		useState<DayAdvanceProgress | null>(null);
	const [loadProgress, setLoadProgress] = useState(0);
	const [gameDay, setGameDay] = useState(0);
	const [total, setTotal] = useState<number>(getPopulationSize());
	const [gameRun, setGameRun] = useState<GameRunState | null>(null);
	const workerRef = useRef<Worker | null>(null);

	const refreshGameRun = useCallback(async () => {
		const run = await loadGameRunState();
		setGameRun(run);
		return run;
	}, []);

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

	const enterConfigurationPhase = useCallback(
		async (size: number) => {
			await beginNationFounding(size);
			await ensureWorld();
			await refreshGameRun();
			setTotal(size);
			setNeedsSetup(false);
			setNeedsConfiguration(true);
			setIsReady(true);
		},
		[refreshGameRun],
	);

	useEffect(() => {
		if (!isFacePoolReady || faceIds.length === 0) return;
		if (!isRegionsReady || regions.length === 0) return;

		let cancelled = false;

		async function initializePopulation() {
			const exists = await hasPopulation();
			const run = await loadGameRunState();

			if (exists && run?.phase === "active") {
				const populationSize = getPopulationSize();
				const meta = await loadPopulationMeta();
				if (!cancelled) {
					setGameRun(run);
					setGameDay(meta?.gameDay ?? 0);
					setTotal(meta?.size ?? populationSize);
					setLoadProgress(meta?.size ?? populationSize);
					setNeedsSetup(false);
					setNeedsConfiguration(false);
					setIsReady(true);
				}
				return;
			}

			if (run?.phase === "setup") {
				if (!cancelled) {
					setGameRun(run);
					setTotal(run.startingPopulation);
					setNeedsSetup(false);
					setNeedsConfiguration(true);
					setIsReady(true);
				}
				return;
			}

			const override = getPopulationSizeOverride();
			if (override != null) {
				await enterConfigurationPhase(override);
				await autoAssignAllSectors();
				const worldRegions = await ensureWorld();
				await startGame(override, faceIds, worldRegions, (loaded) => {
					if (!cancelled) setLoadProgress(loaded);
				});
				const meta = await loadPopulationMeta();
				const activeRun = await refreshGameRun();
				if (!cancelled) {
					setGameDay(meta?.gameDay ?? 0);
					setTotal(meta?.size ?? override);
					setLoadProgress(meta?.size ?? override);
					setNeedsConfiguration(false);
					setIsReady(true);
					setGameRun(activeRun);
				}
				return;
			}

			if (!cancelled) setNeedsSetup(true);
		}

		initializePopulation().catch(() => {
			if (!cancelled) {
				setIsGenerating(false);
				setNeedsSetup(false);
				setNeedsConfiguration(false);
				setIsReady(true);
			}
		});

		return () => {
			cancelled = true;
		};
	}, [
		faceIds,
		isFacePoolReady,
		regions,
		isRegionsReady,
		enterConfigurationPhase,
		refreshGameRun,
	]);

	const startGeneration = useCallback(
		async (size: number) => {
			setIsGenerating(true);
			try {
				await enterConfigurationPhase(size);
			} finally {
				setIsGenerating(false);
			}
		},
		[enterConfigurationPhase],
	);

	const restartNation = useCallback(
		async (size: number) => {
			await startNewNation(size);
			setGameRun(null);
			setNeedsSetup(false);
			await enterConfigurationPhase(size);
		},
		[enterConfigurationPhase],
	);

	const autoAssignAll = useCallback(async () => {
		await autoAssignAllSectors();
	}, []);

	const startConfiguredGame = useCallback(async () => {
		setIsGenerating(true);
		setLoadProgress(0);

		try {
			const worldRegions = await ensureWorld();
			await startGame(total, faceIds, worldRegions, (loaded, size) => {
				setLoadProgress(loaded);
				setTotal(size);
			});
			const meta = await loadPopulationMeta();
			const run = await refreshGameRun();
			setGameDay(meta?.gameDay ?? 0);
			setTotal(meta?.size ?? total);
			setLoadProgress(meta?.size ?? total);
			setNeedsConfiguration(false);
			setIsReady(true);
			if (run?.phase !== "active") {
				throw new Error("Game failed to enter active phase");
			}
		} finally {
			setIsGenerating(false);
		}
	}, [faceIds, total, refreshGameRun]);

	const advanceDay = useCallback(async () => {
		if (isAdvancingDay || (gameRun && gameRun.status !== "active")) return;
		if (gameRun && gameRun.phase !== "active") return;

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
			await refreshGameRun();
		} finally {
			setIsAdvancingDay(false);
			setDayAdvanceProgress(null);
		}
	}, [gameRun, isAdvancingDay, getWorker, refreshGameRun]);

	const getPersonRange = useCallback(async (start: number, count: number) => {
		return getPersonRangeBatched(start, count);
	}, []);

	const getPeopleByIndicesFn = useCallback(async (indices: number[]) => {
		return getPeopleByIndices(indices);
	}, []);

	const buildDirectory = useCallback(
		async (onProgress?: (processed: number, total: number) => void) => {
			return buildPopulationDirectory(onProgress);
		},
		[],
	);

	const isGameActive =
		gameRun?.status === "active" && gameRun.phase === "active";

	return (
		<PopulationContext.Provider
			value={{
				total,
				isReady,
				isGenerating,
				needsSetup,
				needsConfiguration,
				startGeneration,
				restartNation,
				autoAssignAll,
				startConfiguredGame,
				isAdvancingDay,
				dayAdvanceProgress,
				loadProgress,
				gameDay,
				gameRun,
				isGameActive,
				advanceDay,
				getPersonRange,
				getPeopleByIndices: getPeopleByIndicesFn,
				buildDirectory,
				refreshGameRun,
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
