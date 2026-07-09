import { getStorageDriver } from "../driver/registry";
import type { PlayerProfile } from "../types/player-profile";
import {
	createInitialPlayerProfile,
	PLAYER_PROFILE_VERSION,
	RUN_HISTORY_LIMIT,
} from "../types/player-profile";

const PLAYER_PROFILE_KEY = "player-profile";
const STORE = "player-progress" as const;

function isPlayerProfile(value: unknown): value is PlayerProfile {
	if (!value || typeof value !== "object") return false;
	const profile = value as PlayerProfile;
	return (
		profile.version === PLAYER_PROFILE_VERSION &&
		typeof profile.wins === "number" &&
		typeof profile.losses === "number" &&
		Array.isArray(profile.unlockedBadges) &&
		Array.isArray(profile.runHistory)
	);
}

async function loadPlayerProfile(): Promise<PlayerProfile | null> {
	const saved = await getStorageDriver().get<unknown>(
		STORE,
		PLAYER_PROFILE_KEY,
	);
	return isPlayerProfile(saved) ? saved : null;
}

async function savePlayerProfile(profile: PlayerProfile): Promise<void> {
	await getStorageDriver().set(STORE, PLAYER_PROFILE_KEY, profile);
}

async function ensurePlayerProfile(): Promise<PlayerProfile> {
	const existing = await loadPlayerProfile();
	if (existing) return existing;

	const initial = createInitialPlayerProfile();
	await savePlayerProfile(initial);
	return initial;
}

function appendRunHistory(
	profile: PlayerProfile,
	summary: PlayerProfile["runHistory"][number],
): PlayerProfile {
	return {
		...profile,
		runHistory: [summary, ...profile.runHistory].slice(0, RUN_HISTORY_LIMIT),
	};
}

export {
	appendRunHistory,
	ensurePlayerProfile,
	loadPlayerProfile,
	savePlayerProfile,
};
