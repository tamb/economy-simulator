import chancellorProposalsCopy from "../copy/aides/chancellor-proposals.json" with {
	type: "json",
};
import marshalProposalsCopy from "../copy/aides/marshal-proposals.json" with {
	type: "json",
};
import aidesCopy from "../copy/aides/roster.json" with { type: "json" };
import stewardProposalsCopy from "../copy/aides/steward-proposals.json" with {
	type: "json",
};
import vizierProposalsCopy from "../copy/aides/vizier-proposals.json" with {
	type: "json",
};

type AideRole = "steward" | "marshal" | "chancellor" | "vizier";

type AideProposalChoiceKind = "approve" | "compromise" | "reject";

interface AideProposalChoiceEffect {
	/** Mini labor edict percent toward a shortfall sector (0 = none). */
	laborEdictPercent?: number;
	/** Role reform sample rate 0–1 (1 = full sector). */
	roleReformFraction?: number;
	/** Next calamity happiness penalty multiplier while buff is active. */
	nextCalamityHappinessScale?: number;
	/** Days the calamity-prep buff lasts. */
	modifierDurationDays?: number;
	/** Regional happiness / health / environment deltas. */
	happinessDelta?: number;
	healthDelta?: number;
	environmentDelta?: number;
	/** Temporary extraction efficiency factor. */
	extractionEfficiencyFactor?: number;
	/** Tiny nation-score bump applied to the next yearly total (stored as pending). */
	pendingScoreBonus?: number;
	/** Temporary QoL happiness bump aligned to mandate focus. */
	mandateFocusHappiness?: number;
}

interface AideProposalChoice {
	kind: AideProposalChoiceKind;
	label: string;
	hint: string;
	effects: AideProposalChoiceEffect;
}

interface AideProposalDefinition {
	id: string;
	aideRole: AideRole;
	title: string;
	dialog: string;
	weight: number;
	/** Skip when no active royal mandate. */
	requiresActiveMandate?: boolean;
	choices: AideProposalChoice[];
}

/** Game logic only — titles/dialog/hints come from `copy/aides/*-proposals.json`. */
interface AideProposalChoiceLogic {
	kind: AideProposalChoiceKind;
	effects: AideProposalChoiceEffect;
}

interface AideProposalLogic {
	id: string;
	aideRole: AideRole;
	weight: number;
	requiresActiveMandate?: boolean;
	choices: AideProposalChoiceLogic[];
}

const aideProposalsLogic: AideProposalLogic[] = [
	{
		id: "steward_labor_shift",
		aideRole: "steward",
		weight: 10,
		choices: [
			{ kind: "approve", effects: { laborEdictPercent: 10 } },
			{ kind: "compromise", effects: { laborEdictPercent: 5 } },
			{ kind: "reject", effects: {} },
		],
	},
	{
		id: "steward_role_reshuffle",
		aideRole: "steward",
		weight: 8,
		choices: [
			{ kind: "approve", effects: { roleReformFraction: 1 } },
			{ kind: "compromise", effects: { roleReformFraction: 0.5 } },
			{ kind: "reject", effects: {} },
		],
	},
	{
		id: "steward_granary_draft",
		aideRole: "steward",
		weight: 7,
		choices: [
			{ kind: "approve", effects: { laborEdictPercent: 8 } },
			{ kind: "compromise", effects: { laborEdictPercent: 4 } },
			{ kind: "reject", effects: {} },
		],
	},
	{
		id: "marshal_hardening",
		aideRole: "marshal",
		weight: 10,
		choices: [
			{
				kind: "approve",
				effects: {
					nextCalamityHappinessScale: 0.85,
					modifierDurationDays: 28,
				},
			},
			{
				kind: "compromise",
				effects: {
					nextCalamityHappinessScale: 0.92,
					modifierDurationDays: 28,
				},
			},
			{ kind: "reject", effects: {} },
		],
	},
	{
		id: "marshal_martial_order",
		aideRole: "marshal",
		weight: 7,
		choices: [
			{ kind: "approve", effects: { healthDelta: 6, happinessDelta: -5 } },
			{ kind: "compromise", effects: { healthDelta: 3, happinessDelta: -2 } },
			{ kind: "reject", effects: {} },
		],
	},
	{
		id: "marshal_morale_patrol",
		aideRole: "marshal",
		weight: 6,
		choices: [
			{ kind: "approve", effects: { happinessDelta: 5, healthDelta: -2 } },
			{ kind: "compromise", effects: { happinessDelta: 2, healthDelta: -1 } },
			{ kind: "reject", effects: {} },
		],
	},
	{
		id: "chancellor_restoration_levy",
		aideRole: "chancellor",
		weight: 9,
		choices: [
			{
				kind: "approve",
				effects: {
					environmentDelta: 10,
					extractionEfficiencyFactor: 0.9,
					modifierDurationDays: 14,
				},
			},
			{
				kind: "compromise",
				effects: {
					environmentDelta: 5,
					extractionEfficiencyFactor: 0.95,
					modifierDurationDays: 14,
				},
			},
			{ kind: "reject", effects: {} },
		],
	},
	{
		id: "chancellor_extraction_surge",
		aideRole: "chancellor",
		weight: 8,
		choices: [
			{
				kind: "approve",
				effects: {
					extractionEfficiencyFactor: 1.15,
					modifierDurationDays: 14,
					environmentDelta: -5,
				},
			},
			{
				kind: "compromise",
				effects: {
					extractionEfficiencyFactor: 1.08,
					modifierDurationDays: 14,
					environmentDelta: -2,
				},
			},
			{ kind: "reject", effects: {} },
		],
	},
	{
		id: "chancellor_selective_fallow",
		aideRole: "chancellor",
		weight: 7,
		choices: [
			{
				kind: "approve",
				effects: {
					environmentDelta: 7,
					extractionEfficiencyFactor: 0.92,
					modifierDurationDays: 14,
				},
			},
			{
				kind: "compromise",
				effects: {
					environmentDelta: 3,
					extractionEfficiencyFactor: 0.96,
					modifierDurationDays: 14,
				},
			},
			{ kind: "reject", effects: {} },
		],
	},
	{
		id: "vizier_mandate_focus",
		aideRole: "vizier",
		weight: 9,
		requiresActiveMandate: true,
		choices: [
			{ kind: "approve", effects: { mandateFocusHappiness: 4 } },
			{ kind: "compromise", effects: { mandateFocusHappiness: 2 } },
			{ kind: "reject", effects: {} },
		],
	},
	{
		id: "vizier_public_triumph",
		aideRole: "vizier",
		weight: 6,
		choices: [
			{
				kind: "approve",
				effects: { happinessDelta: 3, pendingScoreBonus: 1 },
			},
			{
				kind: "compromise",
				effects: { happinessDelta: 1, pendingScoreBonus: 0.5 },
			},
			{ kind: "reject", effects: {} },
		],
	},
	{
		id: "vizier_court_survey",
		aideRole: "vizier",
		weight: 7,
		choices: [
			{
				kind: "approve",
				effects: { happinessDelta: 2, pendingScoreBonus: 1.5 },
			},
			{
				kind: "compromise",
				effects: { happinessDelta: 1, pendingScoreBonus: 0.75 },
			},
			{ kind: "reject", effects: {} },
		],
	},
];

type AideProposalCopyFile = Record<
	string,
	{
		title: string;
		dialog: string;
		choices: Record<string, { label: string; hint: string }>;
	}
>;

type AidesCopyFile = Record<string, { label: string; name: string }>;

const proposalCopy: AideProposalCopyFile = {
	...(stewardProposalsCopy as AideProposalCopyFile),
	...(marshalProposalsCopy as AideProposalCopyFile),
	...(chancellorProposalsCopy as AideProposalCopyFile),
	...(vizierProposalsCopy as AideProposalCopyFile),
};
const aideCopy = aidesCopy as AidesCopyFile;

function mergeAideProposals(): AideProposalDefinition[] {
	return aideProposalsLogic.map((proposal) => {
		const copy = proposalCopy[proposal.id];
		if (!copy) {
			throw new Error(
				`Missing copy for aide proposal "${proposal.id}" in copy/aides/*-proposals.json`,
			);
		}
		return {
			id: proposal.id,
			aideRole: proposal.aideRole,
			title: copy.title,
			dialog: copy.dialog,
			weight: proposal.weight,
			requiresActiveMandate: proposal.requiresActiveMandate,
			choices: proposal.choices.map((choice) => {
				const choiceCopy = copy.choices[choice.kind];
				if (!choiceCopy) {
					throw new Error(
						`Missing copy for choice "${choice.kind}" on "${proposal.id}" in copy/aides/*-proposals.json`,
					);
				}
				return {
					kind: choice.kind,
					label: choiceCopy.label,
					hint: choiceCopy.hint,
					effects: choice.effects,
				};
			}),
		};
	});
}

const aideProposalDefinitions = mergeAideProposals();

const AIDE_ROLE_LABELS: Record<AideRole, string> = {
	steward: aideCopy.steward?.label ?? "Steward",
	marshal: aideCopy.marshal?.label ?? "Marshal",
	chancellor: aideCopy.chancellor?.label ?? "Chancellor",
	vizier: aideCopy.vizier?.label ?? "Vizier",
};

const AIDE_DEFAULT_NAMES: Record<AideRole, string> = {
	steward: aideCopy.steward?.name ?? "Aldric",
	marshal: aideCopy.marshal?.name ?? "Brenna",
	chancellor: aideCopy.chancellor?.name ?? "Caius",
	vizier: aideCopy.vizier?.name ?? "Daria",
};

function getAideProposalDefinition(
	id: string,
): AideProposalDefinition | undefined {
	return aideProposalDefinitions.find((proposal) => proposal.id === id);
}

function pickAideProposal(
	eligible: AideProposalDefinition[],
	random: () => number,
): AideProposalDefinition | null {
	if (eligible.length === 0) return null;
	const total = eligible.reduce((sum, entry) => sum + entry.weight, 0);
	let roll = random() * total;
	for (const entry of eligible) {
		roll -= entry.weight;
		if (roll <= 0) return entry;
	}
	return eligible[eligible.length - 1] ?? null;
}

export type {
	AideProposalChoice,
	AideProposalChoiceEffect,
	AideProposalChoiceKind,
	AideProposalDefinition,
	AideRole,
};
export {
	AIDE_DEFAULT_NAMES,
	AIDE_ROLE_LABELS,
	aideProposalDefinitions,
	getAideProposalDefinition,
	pickAideProposal,
};
