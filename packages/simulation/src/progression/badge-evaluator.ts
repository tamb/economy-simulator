import { type BadgeDefinition, badgeDefinitions } from "economy-simulator-data";
import type { NationScoreBreakdown } from "./nation-score";

interface RunBadgeYearContext {
	year: number;
	births: number;
	deaths: number;
	immigrations: number;
	emigrations: number;
	score: NationScoreBreakdown;
	netImmigrationPositiveStreak: number;
}

interface CareerBadgeContext {
	wins: number;
}

function evaluateRunBadges(context: RunBadgeYearContext): string[] {
	const unlocked: string[] = [];

	for (const badge of badgeDefinitions) {
		if (badge.scope !== "run") continue;
		if (matchesRunBadge(badge, context)) {
			unlocked.push(badge.id);
		}
	}

	return unlocked;
}

function evaluateCareerBadges(context: CareerBadgeContext): string[] {
	const unlocked: string[] = [];

	for (const badge of badgeDefinitions) {
		if (badge.scope !== "career") continue;
		if (badge.id === "career_10_wins" && context.wins >= 10) {
			unlocked.push(badge.id);
		}
	}

	return unlocked;
}

function matchesRunBadge(
	badge: BadgeDefinition,
	context: RunBadgeYearContext,
): boolean {
	switch (badge.id) {
		case "first_census":
			return context.year >= 1;
		case "baby_boom":
			return context.births > context.deaths * 2;
		case "open_doors":
			return context.netImmigrationPositiveStreak >= 5;
		case "golden_age":
			return context.score.total >= 80;
		case "steward":
			return context.year >= 25 && context.score.environmentHealth >= 90;
		default:
			return false;
	}
}

function evaluateEndRunBadges(
	endReason: string | undefined,
	status: "won" | "lost",
): string[] {
	const unlocked: string[] = [];
	if (status === "won") unlocked.push("monarch_emeritus");
	if (endReason === "mass_exodus") unlocked.push("exodus");
	return unlocked;
}

export type { CareerBadgeContext, RunBadgeYearContext };
export { evaluateCareerBadges, evaluateEndRunBadges, evaluateRunBadges };
