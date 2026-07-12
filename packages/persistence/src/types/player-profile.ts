interface BadgeUnlock {
	id: string;
	unlockedAt: number;
	runId?: string;
}

interface RunSummary {
	runId: string;
	status: "won" | "lost" | "abandoned";
	startingPopulation: number;
	/** Bounding hex radius used for this run's island; omit on older archives. */
	boundingRadius?: number;
	endingPopulation: number;
	yearsPlayed: number;
	finalScore: number;
	endReason?: string;
	startedAt: number;
	endedAt: number;
}

interface PlayerProfile {
	version: number;
	wins: number;
	losses: number;
	abandoned: number;
	bestScore: number;
	totalYearsRuled: number;
	unlockedBadges: BadgeUnlock[];
	runHistory: RunSummary[];
}

const PLAYER_PROFILE_VERSION = 1;
const RUN_HISTORY_LIMIT = 50;

function createInitialPlayerProfile(): PlayerProfile {
	return {
		version: PLAYER_PROFILE_VERSION,
		wins: 0,
		losses: 0,
		abandoned: 0,
		bestScore: 0,
		totalYearsRuled: 0,
		unlockedBadges: [],
		runHistory: [],
	};
}

export type { BadgeUnlock, PlayerProfile, RunSummary };
export {
	createInitialPlayerProfile,
	PLAYER_PROFILE_VERSION,
	RUN_HISTORY_LIMIT,
};
