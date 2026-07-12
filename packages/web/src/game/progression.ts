import {
	appendRunHistory,
	ensurePlayerProfile,
	type GameRunState,
	loadGameRunState,
	type RunSummary,
	saveGameRunState,
	savePlayerProfile,
	type YearlyNationScore,
} from "economy-simulator-persistence";
import {
	evaluateCareerBadges,
	evaluateEndRunBadges,
} from "economy-simulator-simulation";

async function archiveRunToProfile(
	gameRun: GameRunState,
	endingPopulation: number,
): Promise<GameRunState> {
	if (gameRun.status === "active") return gameRun;

	const profile = await ensurePlayerProfile();

	const finalScore =
		gameRun.scoreHistory.at(-1)?.total ??
		gameRun.scoreHistory.reduce(
			(best, entry) => Math.max(best, entry.total),
			0,
		);

	const runId = `${gameRun.startedAt}`;
	const endedAt = gameRun.endedAt ?? Date.now();

	const summary: RunSummary = {
		runId,
		status:
			gameRun.status === "won" || gameRun.status === "lost"
				? gameRun.status
				: "abandoned",
		startingPopulation: gameRun.startingPopulation,
		boundingRadius: gameRun.boundingRadius,
		endingPopulation,
		yearsPlayed: gameRun.scoreHistory.length,
		finalScore,
		endReason: gameRun.endReason,
		startedAt: gameRun.startedAt,
		endedAt,
	};

	let nextProfile = appendRunHistory(profile, summary);
	nextProfile = {
		...nextProfile,
		totalYearsRuled: nextProfile.totalYearsRuled + gameRun.scoreHistory.length,
		bestScore: Math.max(nextProfile.bestScore, finalScore),
		wins: gameRun.status === "won" ? nextProfile.wins + 1 : nextProfile.wins,
		losses:
			gameRun.status === "lost" ? nextProfile.losses + 1 : nextProfile.losses,
		abandoned:
			gameRun.status === "abandoned"
				? nextProfile.abandoned + 1
				: nextProfile.abandoned,
	};

	const endBadges = evaluateEndRunBadges(
		gameRun.endReason,
		gameRun.status === "won" ? "won" : "lost",
	);
	const careerBadges = evaluateCareerBadges({ wins: nextProfile.wins });
	const newBadgeIds = [...endBadges, ...careerBadges];

	for (const badgeId of newBadgeIds) {
		if (nextProfile.unlockedBadges.some((badge) => badge.id === badgeId)) {
			continue;
		}
		nextProfile = {
			...nextProfile,
			unlockedBadges: [
				...nextProfile.unlockedBadges,
				{ id: badgeId, unlockedAt: Date.now(), runId },
			],
		};
	}

	for (const badgeId of gameRun.unlockedThisRun) {
		if (nextProfile.unlockedBadges.some((badge) => badge.id === badgeId)) {
			continue;
		}
		nextProfile = {
			...nextProfile,
			unlockedBadges: [
				...nextProfile.unlockedBadges,
				{ id: badgeId, unlockedAt: Date.now(), runId },
			],
		};
	}

	await savePlayerProfile(nextProfile);
	return gameRun;
}

async function loadActiveGameRun(): Promise<GameRunState | null> {
	return loadGameRunState();
}

function mergeUniqueBadges(existing: string[], next: string[]): string[] {
	const merged = new Set([...existing, ...next]);
	return [...merged];
}

function appendYearlyScore(
	gameRun: GameRunState,
	score: YearlyNationScore,
	newBadges: string[],
): GameRunState {
	return {
		...gameRun,
		scoreHistory: [...gameRun.scoreHistory, score],
		unlockedThisRun: mergeUniqueBadges(gameRun.unlockedThisRun, newBadges),
	};
}

async function finalizeGameRun(
	gameRun: GameRunState,
	endingPopulation: number,
): Promise<GameRunState> {
	await saveGameRunState(gameRun);
	if (gameRun.status !== "active") {
		await archiveRunToProfile(gameRun, endingPopulation);
	}
	return gameRun;
}

export {
	appendYearlyScore,
	archiveRunToProfile,
	finalizeGameRun,
	loadActiveGameRun,
	mergeUniqueBadges,
};
