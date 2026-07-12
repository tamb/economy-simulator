import { gameSettings } from "economy-simulator-data";
import type { GameRunState } from "economy-simulator-persistence";

interface ThreatOrGoal {
	id: string;
	kind: "threat" | "goal";
	label: string;
	progress: number;
	target: number;
}

function getThreatsAndGoals(gameRun: GameRunState | null): ThreatOrGoal[] {
	if (gameRun == null || gameRun.phase !== "active") return [];

	const { streaks } = gameRun;
	const lose = gameSettings.progression.lose;
	const win = gameSettings.progression.win;
	const items: ThreatOrGoal[] = [];

	const threats: {
		id: string;
		streak: number;
		target: number;
		label: string;
	}[] = [
		{
			id: "population_collapse",
			streak: streaks.populationCollapse,
			target: lose.populationCollapseYears,
			label: "Population collapse",
		},
		{
			id: "mass_exodus",
			streak: streaks.massExodus,
			target: lose.massExodusYears,
			label: "Mass exodus",
		},
		{
			id: "qol_crisis",
			streak: streaks.qolCrisis,
			target: lose.qolCrisisYears,
			label: "QoL crisis",
		},
		{
			id: "resource_famine",
			streak: streaks.resourceFamine,
			target: lose.resourceFamineYears,
			label: "Resource famine",
		},
		{
			id: "environmental_ruin",
			streak: streaks.environmentalRuin,
			target: lose.environmentRuinYears,
			label: "Environmental ruin",
		},
	];

	for (const threat of threats) {
		if (threat.streak <= 0) continue;
		items.push({
			id: threat.id,
			kind: "threat",
			label: threat.label,
			progress: threat.streak,
			target: threat.target,
		});
	}

	const goals: {
		id: string;
		streak: number;
		target: number;
		label: string;
	}[] = [
		{
			id: "prosperity",
			streak: streaks.prosperity,
			target: win.prosperityYears,
			label: "Prosperity",
		},
		{
			id: "growth",
			streak: streaks.growthMilestone,
			target: win.growthYears,
			label: "Growth",
		},
		{
			id: "high_score",
			streak: streaks.highScore,
			target: win.highScoreYears,
			label: "High score",
		},
	];

	for (const goal of goals) {
		if (goal.streak <= 0) continue;
		items.push({
			id: goal.id,
			kind: "goal",
			label: goal.label,
			progress: goal.streak,
			target: goal.target,
		});
	}

	const yearsSurvived = gameRun.scoreHistory.length;
	if (yearsSurvived > 0) {
		items.push({
			id: "long_reign",
			kind: "goal",
			label: "Long reign",
			progress: yearsSurvived,
			target: win.longReignYears,
		});
	}

	return items;
}

export type { ThreatOrGoal };
export { getThreatsAndGoals };
