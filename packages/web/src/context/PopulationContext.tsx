import type {
	AideProposalChoiceKind,
	CategoryId,
} from "economy-simulator-data";
import { getWeeklyDecisionTree } from "economy-simulator-data";
import type {
	CalamityPlayerResponse,
	GameRunState,
} from "economy-simulator-persistence";
import {
	loadGameRunState,
	saveGameRunState,
} from "economy-simulator-persistence";
import type { LaborEdictTarget } from "economy-simulator-simulation";
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";
import { playSfx } from "../audio/sfx";
import type {
	AdvanceGameDayResult,
	AideProposalSummary,
	CalamityOnsetSummary,
	WeeklyReportSummary,
	YearReviewSummary,
} from "../game/advance-day-result";
import {
	applyAideProposalChoice,
	assignInnerCircle,
} from "../game/aide-proposals";
import { applyCalamityResponses } from "../game/calamity-responses";
import {
	autoAssignAllSectors,
	beginNationFounding,
	startGame,
} from "../game/nation-setup";
import { startNewNation } from "../game/new-game";
import { applyWeeklyChoiceEffects } from "../game/weekly-report-effects";
import { daysUntilYearEnd } from "../lib/calendar";
import type { PopulationDirectoryEntry } from "../lib/population-directory";
import {
	getPopulationSize,
	getPopulationSizeOverride,
} from "../lib/runtime-config";
import type { Person } from "../models/Person";
import {
	buildPopulationDirectory,
	getPeopleByIndices,
	getPersonRangeBatched,
	hasPopulation,
	loadPopulationMeta,
} from "../repos/population";
import { ensureWorld } from "../repos/world";
import type {
	PopulationMutationResult,
	PopulationWorkerRequest,
	PopulationWorkerResponse,
} from "../workers/population-worker-protocol";
import { useFacePool } from "./FacePoolContext";
import { useRegions } from "./RegionContext";

type GameInterrupt =
	| { type: "calamity"; onsets: CalamityOnsetSummary[] }
	| { type: "weekly_report"; report: WeeklyReportSummary }
	| { type: "aide_proposal"; proposal: AideProposalSummary }
	| { type: "year_review"; review: YearReviewSummary };

interface DayAdvanceProgress {
	phase: "daily" | "annual" | "mutation";
	processed: number;
	total: number;
	/** Days completed / planned when advancing more than one day. */
	daysCompleted?: number;
	daysTotal?: number;
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
	advanceWeek: () => Promise<void>;
	advanceYear: () => Promise<void>;
	pendingCalamityOnsets: CalamityOnsetSummary[];
	respondToCalamityOnsets: (response: CalamityPlayerResponse) => Promise<void>;
	pendingWeeklyReport: WeeklyReportSummary | null;
	respondToWeeklyReport: (choiceId: string) => Promise<void>;
	pendingAideProposal: AideProposalSummary | null;
	respondToAideProposal: (choice: AideProposalChoiceKind) => Promise<void>;
	pendingYearReview: YearReviewSummary | null;
	dismissYearReview: () => void;
	applyLaborEdict: (
		source: LaborEdictTarget,
		target: LaborEdictTarget,
		percent: number,
	) => Promise<PopulationMutationResult>;
	applyRoleReform: (
		categoryId: CategoryId,
		subSectorId: string,
	) => Promise<PopulationMutationResult>;
	dismissCoachMarks: () => Promise<void>;
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
	const [pendingCalamityOnsets, setPendingCalamityOnsets] = useState<
		CalamityOnsetSummary[]
	>([]);
	const [pendingWeeklyReport, setPendingWeeklyReport] =
		useState<WeeklyReportSummary | null>(null);
	const [pendingAideProposal, setPendingAideProposal] =
		useState<AideProposalSummary | null>(null);
	const [pendingYearReview, setPendingYearReview] =
		useState<YearReviewSummary | null>(null);
	const workerRef = useRef<Worker | null>(null);
	const interruptAckRef = useRef<(() => void) | null>(null);
	const gameDayRef = useRef(0);
	const gameRunRef = useRef<GameRunState | null>(null);

	useEffect(() => {
		gameDayRef.current = gameDay;
	}, [gameDay]);

	useEffect(() => {
		gameRunRef.current = gameRun;
	}, [gameRun]);

	const refreshGameRun = useCallback(async () => {
		let run = await loadGameRunState();
		if (
			run &&
			run.phase === "active" &&
			run.status === "active" &&
			(run.innerCircle?.length ?? 0) === 0 &&
			faceIds.length > 0
		) {
			run = {
				...run,
				innerCircle: assignInnerCircle(faceIds),
			};
			await saveGameRunState(run);
		}
		setGameRun(run);
		return run;
	}, [faceIds]);

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
				const activeRun = await refreshGameRun();
				if (!cancelled) {
					setGameRun(activeRun);
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
			setPendingCalamityOnsets([]);
			setPendingWeeklyReport(null);
			setPendingAideProposal(null);
			setPendingYearReview(null);
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

	const runSingleDayInWorker =
		useCallback(async (): Promise<AdvanceGameDayResult> => {
			return new Promise((resolve, reject) => {
				const worker = getWorker();

				function handleMessage(
					event: MessageEvent<PopulationWorkerResponse>,
				): void {
					const message = event.data;
					if (message.type === "progress") {
						setDayAdvanceProgress((prev) => ({
							phase: message.phase,
							processed: message.processed,
							total: message.total,
							daysCompleted: prev?.daysCompleted,
							daysTotal: prev?.daysTotal,
						}));
					} else if (message.type === "done") {
						cleanup();
						resolve(message.result);
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
			});
		}, [getWorker]);

	const waitForInterruptAck = useCallback(async () => {
		await new Promise<void>((resolve) => {
			interruptAckRef.current = resolve;
		});
	}, []);

	const resolveInterrupt = useCallback(() => {
		setPendingCalamityOnsets([]);
		setPendingWeeklyReport(null);
		setPendingAideProposal(null);
		setPendingYearReview(null);
		interruptAckRef.current?.();
		interruptAckRef.current = null;
	}, []);

	const enqueueInterrupts = useCallback(
		(result: AdvanceGameDayResult): GameInterrupt[] => {
			const queue: GameInterrupt[] = [];
			if (result.onsets.length > 0) {
				queue.push({ type: "calamity", onsets: result.onsets });
			}
			if (result.weeklyReport) {
				queue.push({ type: "weekly_report", report: result.weeklyReport });
			}
			if (result.aideProposal) {
				queue.push({ type: "aide_proposal", proposal: result.aideProposal });
			}
			if (result.yearReview) {
				queue.push({ type: "year_review", review: result.yearReview });
			}
			return queue;
		},
		[],
	);

	const presentInterrupt = useCallback(
		async (interrupt: GameInterrupt) => {
			if (interrupt.type === "calamity") {
				setPendingCalamityOnsets(interrupt.onsets);
				playSfx("calamity");
			} else if (interrupt.type === "weekly_report") {
				setPendingWeeklyReport(interrupt.report);
			} else if (interrupt.type === "aide_proposal") {
				setPendingAideProposal(interrupt.proposal);
			} else {
				setPendingYearReview(interrupt.review);
				playSfx("year-end");
			}
			await waitForInterruptAck();
		},
		[waitForInterruptAck],
	);

	const respondToCalamityOnsets = useCallback(
		async (response: CalamityPlayerResponse) => {
			const onsets = pendingCalamityOnsets;
			const run = await loadGameRunState();
			if (run && onsets.length > 0) {
				const next = applyCalamityResponses(
					run,
					onsets.map((onset) => onset.instanceId),
					response,
					gameDayRef.current,
				);
				await saveGameRunState(next);
				setGameRun(next);
			}
			resolveInterrupt();
		},
		[pendingCalamityOnsets, resolveInterrupt],
	);

	const respondToWeeklyReport = useCallback(
		async (choiceId: string) => {
			const report = pendingWeeklyReport;
			if (!report) {
				resolveInterrupt();
				return;
			}
			const tree = getWeeklyDecisionTree(report.distress);
			const choice = tree?.choices.find((entry) => entry.id === choiceId);
			const primary = report.regions.find(
				(region) => region.regionId === report.primaryRegionId,
			);
			if (choice && primary) {
				const next = await applyWeeklyChoiceEffects({
					gameDay: report.gameDay,
					regionId: primary.regionId,
					regionName: primary.name,
					choiceId: choice.id,
					choiceLabel: choice.label,
					effects: choice.effects,
				});
				if (next) setGameRun(next);
			}
			resolveInterrupt();
		},
		[pendingWeeklyReport, resolveInterrupt],
	);

	const respondToAideProposal = useCallback(
		async (choice: AideProposalChoiceKind) => {
			const proposal = pendingAideProposal;
			if (!proposal) {
				resolveInterrupt();
				return;
			}
			const next = await applyAideProposalChoice({
				gameDay: proposal.gameDay,
				proposalId: proposal.proposalId,
				choiceKind: choice,
			});
			if (next) setGameRun(next);
			playSfx("edict");
			resolveInterrupt();
		},
		[pendingAideProposal, resolveInterrupt],
	);

	const dismissYearReview = useCallback(() => {
		resolveInterrupt();
	}, [resolveInterrupt]);

	const runMutationInWorker = useCallback(
		async (
			request: Exclude<PopulationWorkerRequest, { type: "advance-day" }>,
		): Promise<PopulationMutationResult> => {
			return new Promise((resolve, reject) => {
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
					} else if (message.type === "mutation-done") {
						cleanup();
						resolve(message.result);
					} else if (message.type === "error") {
						cleanup();
						reject(new Error(message.message));
					}
				}

				function cleanup(): void {
					worker.removeEventListener("message", handleMessage);
				}

				worker.addEventListener("message", handleMessage);
				worker.postMessage(request);
			});
		},
		[getWorker],
	);

	const applyLaborEdict = useCallback(
		async (
			source: LaborEdictTarget,
			target: LaborEdictTarget,
			percent: number,
		) => {
			const run = gameRunRef.current;
			if (
				isAdvancingDay ||
				!run ||
				run.status !== "active" ||
				run.phase !== "active"
			) {
				return { affected: 0 };
			}
			setIsAdvancingDay(true);
			setDayAdvanceProgress({ phase: "mutation", processed: 0, total: 0 });
			try {
				const result = await runMutationInWorker({
					type: "apply-labor-edict",
					source,
					target,
					percent,
					gameDay: gameDayRef.current,
				});
				await refreshGameRun();
				playSfx("edict");
				return result;
			} finally {
				setIsAdvancingDay(false);
				setDayAdvanceProgress(null);
			}
		},
		[isAdvancingDay, refreshGameRun, runMutationInWorker],
	);

	const applyRoleReform = useCallback(
		async (categoryId: CategoryId, subSectorId: string) => {
			const run = gameRunRef.current;
			if (
				isAdvancingDay ||
				!run ||
				run.status !== "active" ||
				run.phase !== "active"
			) {
				return { affected: 0 };
			}
			setIsAdvancingDay(true);
			setDayAdvanceProgress({ phase: "mutation", processed: 0, total: 0 });
			try {
				const result = await runMutationInWorker({
					type: "apply-role-reform",
					categoryId,
					subSectorId,
					gameDay: gameDayRef.current,
				});
				await refreshGameRun();
				playSfx("reform");
				return result;
			} finally {
				setIsAdvancingDay(false);
				setDayAdvanceProgress(null);
			}
		},
		[isAdvancingDay, refreshGameRun, runMutationInWorker],
	);

	const dismissCoachMarks = useCallback(async () => {
		const run = await loadGameRunState();
		if (!run) return;
		const next = { ...run, coachMarksDismissed: true };
		await saveGameRunState(next);
		setGameRun(next);
	}, []);

	const advanceDays = useCallback(
		async (days: number) => {
			const run = gameRunRef.current;
			if (isAdvancingDay || (run && run.status !== "active")) return;
			if (run && run.phase !== "active") return;
			if (days <= 0) return;

			setIsAdvancingDay(true);
			setDayAdvanceProgress({
				phase: "daily",
				processed: 0,
				total: 0,
				daysCompleted: 0,
				daysTotal: days,
			});

			try {
				for (let i = 0; i < days; i++) {
					const currentRun = gameRunRef.current;
					if (
						currentRun &&
						(currentRun.status !== "active" || currentRun.phase !== "active")
					) {
						break;
					}

					setDayAdvanceProgress({
						phase: "daily",
						processed: 0,
						total: 0,
						daysCompleted: i,
						daysTotal: days,
					});

					const result = await runSingleDayInWorker();
					if (result.meta) {
						setGameDay(result.meta.gameDay);
						setTotal(result.meta.size);
					}
					const refreshed = await refreshGameRun();

					const interrupts = enqueueInterrupts(result);
					for (const interrupt of interrupts) {
						await presentInterrupt(interrupt);
					}

					if (
						refreshed &&
						(refreshed.status === "won" || refreshed.status === "lost")
					) {
						break;
					}
				}
			} finally {
				setIsAdvancingDay(false);
				setDayAdvanceProgress(null);
			}
		},
		[
			enqueueInterrupts,
			isAdvancingDay,
			presentInterrupt,
			refreshGameRun,
			runSingleDayInWorker,
		],
	);

	const advanceDay = useCallback(async () => {
		await advanceDays(1);
	}, [advanceDays]);

	const advanceWeek = useCallback(async () => {
		await advanceDays(7);
	}, [advanceDays]);

	const advanceYear = useCallback(async () => {
		const days = daysUntilYearEnd(gameDayRef.current);
		await advanceDays(days);
	}, [advanceDays]);

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
				advanceWeek,
				advanceYear,
				pendingCalamityOnsets,
				respondToCalamityOnsets,
				pendingWeeklyReport,
				respondToWeeklyReport,
				pendingAideProposal,
				respondToAideProposal,
				pendingYearReview,
				dismissYearReview,
				applyLaborEdict,
				applyRoleReform,
				dismissCoachMarks,
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
