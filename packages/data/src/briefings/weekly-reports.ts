import weeklyReportsCopy from "../copy/weekly/reports.json" with {
	type: "json",
};

type RegionDistressKind =
	| "low_happiness"
	| "low_health"
	| "low_environment"
	| "calamity_hit";

type WeeklyChoiceId = string;

interface WeeklyChoiceEffect {
	/** Happiness delta applied to living citizens in the target region. */
	happinessDelta?: number;
	/** Health delta applied to living citizens in the target region. */
	healthDelta?: number;
	/** Environment quality delta for the target region. */
	environmentDelta?: number;
	/** Temporary extraction efficiency factor for the region (1 = none). */
	extractionEfficiencyFactor?: number;
	/** Days the temporary extraction factor lasts. */
	modifierDurationDays?: number;
	/** Further scale happiness penalties on active calamities in the region. */
	calamityHappinessScale?: number;
	/** Percent of workers to evacuate from extractive jobs in the region. */
	evacuateLaborPercent?: number;
	/** Emigration risk flag for the next weekly cycle (dispatch only in v1). */
	emigrationRisk?: boolean;
}

interface WeeklyChoiceDefinition {
	id: WeeklyChoiceId;
	label: string;
	hint: string;
	effects: WeeklyChoiceEffect;
}

interface WeeklyDecisionTree {
	distress: RegionDistressKind;
	/** Default prompt (first variant) for stable tests and UI fallbacks. */
	prompt: string;
	/** All player-facing prompt variants for this distress. */
	prompts: string[];
	choices: WeeklyChoiceDefinition[];
}

/** Game logic only — player-facing strings come from `copy/weekly/reports.json`. */
interface WeeklyChoiceLogic {
	id: WeeklyChoiceId;
	effects: WeeklyChoiceEffect;
}

interface WeeklyTreeLogic {
	distress: RegionDistressKind;
	choices: WeeklyChoiceLogic[];
}

const weeklyTreesLogic: WeeklyTreeLogic[] = [
	{
		distress: "low_happiness",
		choices: [
			{ id: "relief_convoy", effects: { happinessDelta: 8 } },
			{
				id: "work_hour_reform",
				effects: {
					happinessDelta: 4,
					extractionEfficiencyFactor: 0.88,
					modifierDurationDays: 14,
				},
			},
			{ id: "festival_grant", effects: { happinessDelta: 3 } },
			{ id: "let_them_endure", effects: { emigrationRisk: true } },
		],
	},
	{
		distress: "low_health",
		choices: [
			{
				id: "medical_campaign",
				effects: { healthDelta: 8, happinessDelta: 2 },
			},
			{
				id: "quarantine_corridors",
				effects: { healthDelta: 4, happinessDelta: -3 },
			},
			{ id: "field_clinics", effects: { healthDelta: 4 } },
			{ id: "defer_health", effects: {} },
		],
	},
	{
		distress: "low_environment",
		choices: [
			{
				id: "restoration_crews",
				effects: {
					environmentDelta: 8,
					extractionEfficiencyFactor: 0.85,
					modifierDurationDays: 14,
				},
			},
			{
				id: "cap_extraction",
				effects: {
					environmentDelta: 4,
					extractionEfficiencyFactor: 0.92,
					modifierDurationDays: 14,
				},
			},
			{
				id: "seed_nurseries",
				effects: {
					environmentDelta: 3,
					extractionEfficiencyFactor: 0.95,
					modifierDurationDays: 14,
				},
			},
			{
				id: "keep_digging",
				effects: {
					environmentDelta: -4,
					extractionEfficiencyFactor: 1.1,
					modifierDurationDays: 14,
				},
			},
		],
	},
	{
		distress: "calamity_hit",
		choices: [
			{
				id: "reinforce_relief",
				effects: { calamityHappinessScale: 0.75, happinessDelta: 3 },
			},
			{
				id: "evacuate_labor",
				effects: { evacuateLaborPercent: 15, happinessDelta: -2 },
			},
			{ id: "emergency_rations", effects: { happinessDelta: 4 } },
			{ id: "hold_the_line", effects: {} },
		],
	},
];

type WeeklyCopyFile = Record<
	string,
	{
		prompts: string[];
		choices: Record<string, { label: string; hint: string }>;
	}
>;

const copy = weeklyReportsCopy as WeeklyCopyFile;

function mergeWeeklyTrees(): WeeklyDecisionTree[] {
	return weeklyTreesLogic.map((tree) => {
		const treeCopy = copy[tree.distress];
		if (!treeCopy) {
			throw new Error(
				`Missing copy for weekly distress "${tree.distress}" in copy/weekly/reports.json`,
			);
		}
		const prompts = treeCopy.prompts;
		if (!prompts || prompts.length === 0) {
			throw new Error(
				`Missing prompts for weekly distress "${tree.distress}" in copy/weekly/reports.json`,
			);
		}
		return {
			distress: tree.distress,
			prompt: prompts[0] ?? "",
			prompts,
			choices: tree.choices.map((choice) => {
				const choiceCopy = treeCopy.choices[choice.id];
				if (!choiceCopy) {
					throw new Error(
						`Missing copy for weekly choice "${choice.id}" under "${tree.distress}" in copy/weekly/reports.json`,
					);
				}
				return {
					id: choice.id,
					label: choiceCopy.label,
					hint: choiceCopy.hint,
					effects: choice.effects,
				};
			}),
		};
	});
}

const weeklyDecisionTrees = mergeWeeklyTrees();

function getWeeklyDecisionTree(
	distress: RegionDistressKind,
): WeeklyDecisionTree | undefined {
	return weeklyDecisionTrees.find((tree) => tree.distress === distress);
}

function pickWeeklyPrompt(
	tree: WeeklyDecisionTree,
	random: () => number = Math.random,
): string {
	if (tree.prompts.length === 0) return tree.prompt;
	const index = Math.floor(random() * tree.prompts.length);
	return tree.prompts[index] ?? tree.prompt;
}

export type {
	RegionDistressKind,
	WeeklyChoiceDefinition,
	WeeklyChoiceEffect,
	WeeklyChoiceId,
	WeeklyDecisionTree,
};
export { getWeeklyDecisionTree, pickWeeklyPrompt, weeklyDecisionTrees };
