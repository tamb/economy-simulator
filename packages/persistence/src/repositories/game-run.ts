import { getStorageDriver } from "../driver/registry";
import type { GameRunState } from "../types/progression";
import { createInitialGameRunState } from "../types/progression";

const GAME_RUN_KEY = "game-run";
const STORE = "population" as const;

function isGameRunState(value: unknown): value is GameRunState {
	if (!value || typeof value !== "object") return false;
	const state = value as GameRunState;
	return (
		typeof state.status === "string" &&
		(typeof state.phase === "string" || state.phase === undefined) &&
		typeof state.startingPopulation === "number" &&
		typeof state.startedAt === "number" &&
		Array.isArray(state.scoreHistory) &&
		Array.isArray(state.unlockedThisRun) &&
		typeof state.streaks === "object"
	);
}

function withDefaults(state: GameRunState): GameRunState {
	return {
		...withCalamityDefaults(state),
		phase: state.phase ?? "active",
		eventLog: state.eventLog ?? [],
		activeMandate: state.activeMandate ?? null,
		mandateCompletions: state.mandateCompletions ?? 0,
		coachMarksDismissed: state.coachMarksDismissed ?? false,
		innerCircle: state.innerCircle ?? [],
		temporaryModifiers: state.temporaryModifiers ?? [],
		pendingScoreBonus: state.pendingScoreBonus ?? 0,
		lastWeeklyReportGameDay: state.lastWeeklyReportGameDay ?? null,
		lastAideProposalGameDay: state.lastAideProposalGameDay ?? null,
	};
}

function withCalamityDefaults(state: GameRunState): GameRunState {
	return {
		...state,
		activeCalamities: state.activeCalamities ?? [],
		calamityHistory: state.calamityHistory ?? [],
		lastCalamityOnsetGameDay: state.lastCalamityOnsetGameDay ?? null,
		lastSevereCalamityOnsetGameDay:
			state.lastSevereCalamityOnsetGameDay ?? null,
	};
}

async function loadGameRunState(): Promise<GameRunState | null> {
	const saved = await getStorageDriver().get<unknown>(STORE, GAME_RUN_KEY);
	return isGameRunState(saved) ? withDefaults(saved) : null;
}

async function saveGameRunState(state: GameRunState): Promise<void> {
	await getStorageDriver().set(STORE, GAME_RUN_KEY, state);
}

async function clearGameRunState(): Promise<void> {
	await getStorageDriver().remove(STORE, GAME_RUN_KEY);
}

async function ensureGameRunState(
	startingPopulation: number,
): Promise<GameRunState> {
	const existing = await loadGameRunState();
	if (existing) return existing;

	const initial = createInitialGameRunState(startingPopulation);
	await saveGameRunState(initial);
	return initial;
}

export {
	clearGameRunState,
	ensureGameRunState,
	loadGameRunState,
	saveGameRunState,
};
