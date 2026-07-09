import type { ActiveCalamity, CalamityHistoryEntry } from "./calamities";
import { createEmptyCalamityState } from "./calamities";

type GameRunStatus = "active" | "won" | "lost" | "abandoned";
type GameRunPhase = "setup" | "active";

interface YearlyNationScore {
	year: number;
	total: number;
	populationGrowth: number;
	averageQualityOfLife: number;
	netMigration: number;
	resourceSufficiency: number;
	environmentHealth: number;
}

interface WinLoseStreaks {
	populationCollapse: number;
	massExodus: number;
	qolCrisis: number;
	resourceFamine: number;
	environmentalRuin: number;
	prosperity: number;
	growthMilestone: number;
	highScore: number;
	netImmigrationPositive: number;
}

interface GameRunState {
	status: GameRunStatus;
	phase: GameRunPhase;
	startingPopulation: number;
	startedAt: number;
	endedAt?: number;
	endReason?: string;
	scoreHistory: YearlyNationScore[];
	streaks: WinLoseStreaks;
	unlockedThisRun: string[];
	activeCalamities: ActiveCalamity[];
	calamityHistory: CalamityHistoryEntry[];
	lastCalamityOnsetGameDay: number | null;
	lastSevereCalamityOnsetGameDay: number | null;
}

function createInitialWinLoseStreaks(): WinLoseStreaks {
	return {
		populationCollapse: 0,
		massExodus: 0,
		qolCrisis: 0,
		resourceFamine: 0,
		environmentalRuin: 0,
		prosperity: 0,
		growthMilestone: 0,
		highScore: 0,
		netImmigrationPositive: 0,
	};
}

function createInitialGameRunState(startingPopulation: number): GameRunState {
	return {
		status: "active",
		phase: "setup",
		startingPopulation,
		startedAt: Date.now(),
		scoreHistory: [],
		streaks: createInitialWinLoseStreaks(),
		unlockedThisRun: [],
		...createEmptyCalamityState(),
	};
}

export type {
	GameRunPhase,
	GameRunState,
	GameRunStatus,
	WinLoseStreaks,
	YearlyNationScore,
};
export { createInitialGameRunState, createInitialWinLoseStreaks };
