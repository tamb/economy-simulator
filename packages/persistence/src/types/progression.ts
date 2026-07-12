import type { ActiveCalamity, CalamityHistoryEntry } from "./calamities";
import { createEmptyCalamityState } from "./calamities";

type GameRunStatus = "active" | "won" | "lost" | "abandoned";
type GameRunPhase = "setup" | "active";

type GameEventType =
	| "calamity_onset"
	| "calamity_response"
	| "year_end"
	| "emigration_spike"
	| "resource_shortfall"
	| "labor_edict"
	| "role_reform"
	| "mandate_issued"
	| "mandate_completed"
	| "mandate_failed"
	| "weekly_report"
	| "weekly_decision"
	| "aide_proposal"
	| "executive_order";

interface GameEvent {
	id: string;
	gameDay: number;
	type: GameEventType;
	title: string;
	detail: string;
}

type MandateId =
	| "resource_security"
	| "stem_emigration"
	| "raise_qol"
	| "heal_land";

interface ActiveMandate {
	id: MandateId;
	label: string;
	description: string;
	yearIssued: number;
	scoreBonus: number;
}

type AideRole = "steward" | "marshal" | "chancellor" | "vizier";

interface InnerCircleAide {
	role: AideRole;
	name: string;
	/** Zero-padded face pool id (e.g. "07"). */
	faceId: string;
}

interface TemporaryRunModifier {
	id: string;
	/** Optional region scope; omit for nationwide. */
	regionId?: string;
	expiresOnGameDay: number;
	extractionEfficiencyFactor?: number;
	nextCalamityHappinessScale?: number;
}

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
	/** Recent dispatch cards for the throne (newest last). */
	eventLog: GameEvent[];
	/** Royal mandate for the current game year. */
	activeMandate: ActiveMandate | null;
	/** Mandates fulfilled this run. */
	mandateCompletions: number;
	/** First-run coach marks dismissed. */
	coachMarksDismissed: boolean;
	/** Persistent inner-circle aides for this run. */
	innerCircle: InnerCircleAide[];
	/** Time-boxed throne modifiers from weekly/aide decisions. */
	temporaryModifiers: TemporaryRunModifier[];
	/** Score points to fold into the next yearly nation score. */
	pendingScoreBonus: number;
	lastWeeklyReportGameDay: number | null;
	lastAideProposalGameDay: number | null;
}

const EVENT_LOG_LIMIT = 40;

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
		eventLog: [],
		activeMandate: null,
		mandateCompletions: 0,
		coachMarksDismissed: false,
		innerCircle: [],
		temporaryModifiers: [],
		pendingScoreBonus: 0,
		lastWeeklyReportGameDay: null,
		lastAideProposalGameDay: null,
		...createEmptyCalamityState(),
	};
}

function appendGameEvents(
	gameRun: GameRunState,
	events: GameEvent[],
): GameRunState {
	if (events.length === 0) return gameRun;
	return {
		...gameRun,
		eventLog: [...(gameRun.eventLog ?? []), ...events].slice(-EVENT_LOG_LIMIT),
	};
}

function pruneExpiredModifiers(
	gameRun: GameRunState,
	gameDay: number,
): GameRunState {
	const temporaryModifiers = (gameRun.temporaryModifiers ?? []).filter(
		(modifier) => modifier.expiresOnGameDay > gameDay,
	);
	if (temporaryModifiers.length === (gameRun.temporaryModifiers ?? []).length) {
		return gameRun;
	}
	return { ...gameRun, temporaryModifiers };
}

export type {
	ActiveMandate,
	AideRole,
	GameEvent,
	GameEventType,
	GameRunPhase,
	GameRunState,
	GameRunStatus,
	InnerCircleAide,
	MandateId,
	TemporaryRunModifier,
	WinLoseStreaks,
	YearlyNationScore,
};
export {
	appendGameEvents,
	createInitialGameRunState,
	createInitialWinLoseStreaks,
	EVENT_LOG_LIMIT,
	pruneExpiredModifiers,
};
