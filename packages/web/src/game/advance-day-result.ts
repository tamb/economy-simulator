import type {
	AideProposalChoiceKind,
	AideRole,
	CalamitySeverity,
	RegionDistressKind,
} from "economy-simulator-data";
import type {
	AnnualCycleStats,
	PopulationMeta,
} from "economy-simulator-persistence";

/** Calamity that began during a single day advance. */
interface CalamityOnsetSummary {
	instanceId: string;
	calamityId: string;
	name: string;
	severity: CalamitySeverity;
	regionIds: string[];
	midTermEndsOnGameDay: number;
	fromCascade: boolean;
}

/** Snapshot shown after an annual cycle completes. */
interface YearReviewSummary {
	stats: AnnualCycleStats;
	nationScore: number;
	previousNationScore: number | null;
	calamitiesThisYear: Array<{
		name: string;
		severity: CalamitySeverity;
		instanceId: string;
	}>;
	mandateResult: {
		label: string;
		fulfilled: boolean;
		scoreBonus: number;
	} | null;
}

interface WeeklyReportRegionSummary {
	regionId: string;
	name: string;
	population: number;
	averageHappiness: number;
	averageHealth: number;
	environmentQuality: number;
	distress: RegionDistressKind;
	distressScore: number;
}

interface WeeklyReportSummary {
	gameDay: number;
	regions: WeeklyReportRegionSummary[];
	/** Worst region the player must decide on. */
	primaryRegionId: string;
	distress: RegionDistressKind;
	prompt: string;
}

interface AideProposalSummary {
	gameDay: number;
	proposalId: string;
	aideRole: AideRole;
	aideName: string;
	faceId: string;
	title: string;
	dialog: string;
	choices: Array<{
		kind: AideProposalChoiceKind;
		label: string;
		hint: string;
	}>;
}

interface AdvanceGameDayResult {
	meta: PopulationMeta | null;
	onsets: CalamityOnsetSummary[];
	weeklyReport: WeeklyReportSummary | null;
	aideProposal: AideProposalSummary | null;
	yearReview: YearReviewSummary | null;
}

export type {
	AdvanceGameDayResult,
	AideProposalSummary,
	CalamityOnsetSummary,
	WeeklyReportRegionSummary,
	WeeklyReportSummary,
	YearReviewSummary,
};
