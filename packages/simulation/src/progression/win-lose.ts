import type { GameSettings } from "economy-simulator-data";
import type { NationScoreBreakdown } from "./nation-score";

type GameRunStatus = "active" | "won" | "lost";

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

interface WinLoseYearContext {
	year: number;
	populationAfter: number;
	startingPopulation: number;
	averageQualityOfLife: number;
	emigrations: number;
	immigrations: number;
	score: NationScoreBreakdown;
	streaks: WinLoseStreaks;
	settings: GameSettings;
}

interface WinLoseEvaluation {
	status: GameRunStatus;
	reason?: string;
	streaks: WinLoseStreaks;
}

function evaluateWinLose(context: WinLoseYearContext): WinLoseEvaluation {
	const { settings, score } = context;
	const thresholds = settings.progression;
	let streaks = { ...context.streaks };

	if (context.populationAfter === 0) {
		return { status: "lost", reason: "extinction", streaks };
	}

	const populationRatio =
		context.populationAfter / Math.max(context.startingPopulation, 1);

	streaks = {
		...streaks,
		populationCollapse:
			populationRatio < thresholds.lose.populationCollapseRatio
				? streaks.populationCollapse + 1
				: 0,
		massExodus:
			context.emigrations / Math.max(context.populationAfter, 1) >
			thresholds.lose.massExodusRate
				? streaks.massExodus + 1
				: 0,
		qolCrisis:
			context.averageQualityOfLife < thresholds.lose.qolCrisisThreshold
				? streaks.qolCrisis + 1
				: 0,
		resourceFamine:
			score.resourceSufficiency < thresholds.lose.resourceFamineSufficiency
				? streaks.resourceFamine + 1
				: 0,
		environmentalRuin:
			score.environmentHealth < thresholds.lose.environmentRuinThreshold
				? streaks.environmentalRuin + 1
				: 0,
		netImmigrationPositive:
			context.immigrations > context.emigrations
				? streaks.netImmigrationPositive + 1
				: 0,
	};

	if (streaks.populationCollapse >= thresholds.lose.populationCollapseYears) {
		return {
			status: "lost",
			reason: "population_collapse",
			streaks,
		};
	}
	if (streaks.massExodus >= thresholds.lose.massExodusYears) {
		return { status: "lost", reason: "mass_exodus", streaks };
	}
	if (streaks.qolCrisis >= thresholds.lose.qolCrisisYears) {
		return { status: "lost", reason: "qol_crisis", streaks };
	}
	if (streaks.resourceFamine >= thresholds.lose.resourceFamineYears) {
		return { status: "lost", reason: "resource_famine", streaks };
	}
	if (streaks.environmentalRuin >= thresholds.lose.environmentRuinYears) {
		return { status: "lost", reason: "environmental_ruin", streaks };
	}

	const prosperityMet =
		context.averageQualityOfLife >= thresholds.win.prosperityQol &&
		context.populationAfter >= context.startingPopulation;
	streaks = {
		...streaks,
		prosperity: prosperityMet ? streaks.prosperity + 1 : 0,
	};

	const growthMet =
		populationRatio >= thresholds.win.growthPopulationRatio &&
		context.averageQualityOfLife >= thresholds.win.growthQol;
	streaks = {
		...streaks,
		growthMilestone: growthMet ? streaks.growthMilestone + 1 : 0,
	};

	streaks = {
		...streaks,
		highScore:
			score.total >= thresholds.win.highScoreThreshold
				? streaks.highScore + 1
				: 0,
	};

	if (streaks.prosperity >= thresholds.win.prosperityYears) {
		return { status: "won", reason: "prosperity_sustained", streaks };
	}
	if (streaks.growthMilestone >= thresholds.win.growthYears) {
		return { status: "won", reason: "growth_milestone", streaks };
	}
	if (streaks.highScore >= thresholds.win.highScoreYears) {
		return { status: "won", reason: "high_score_sustained", streaks };
	}
	if (context.year >= thresholds.win.longReignYears) {
		return { status: "won", reason: "long_reign", streaks };
	}

	return { status: "active", streaks };
}

export type { WinLoseEvaluation, WinLoseStreaks, WinLoseYearContext };
export { evaluateWinLose };
