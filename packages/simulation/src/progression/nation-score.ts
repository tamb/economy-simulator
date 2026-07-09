import type { GameSettings } from "economy-simulator-data";
import type { NationalLedger } from "../resources/national-ledger";

interface NationScoreInput {
	year: number;
	populationBefore: number;
	populationAfter: number;
	births: number;
	deaths: number;
	emigrations: number;
	immigrations: number;
	averageQualityOfLife: number;
	ledger: NationalLedger | null;
	averageEnvironmentQuality: number;
	settings: GameSettings;
}

interface NationScoreBreakdown {
	year: number;
	total: number;
	populationGrowth: number;
	averageQualityOfLife: number;
	netMigration: number;
	resourceSufficiency: number;
	environmentHealth: number;
}

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

function normalizeRatioToScore(ratio: number): number {
	if (!Number.isFinite(ratio)) return 100;
	return clamp(ratio * 100, 0, 100);
}

function computeAverageResourceSufficiency(
	ledger: NationalLedger | null,
): number {
	if (!ledger || ledger.resources.length === 0) return 50;

	const sufficiencyScores = ledger.resources.map((entry) => {
		if (entry.demand <= 0) return 100;
		return clamp((entry.sufficiency / 1) * 100, 0, 100);
	});

	return (
		sufficiencyScores.reduce((sum, score) => sum + score, 0) /
		sufficiencyScores.length
	);
}

function computeNationScore(input: NationScoreInput): NationScoreBreakdown {
	const { settings } = input;
	const weights = settings.progression.scoreWeights;
	const populationBefore = Math.max(input.populationBefore, 1);

	const populationGrowth =
		((input.populationAfter - input.populationBefore) / populationBefore) * 100;
	const netMigration =
		((input.immigrations - input.emigrations) / populationBefore) * 100;
	const resourceSufficiency = computeAverageResourceSufficiency(input.ledger);
	const environmentHealth = clamp(input.averageEnvironmentQuality, 0, 100);
	const averageQualityOfLife = clamp(input.averageQualityOfLife, 0, 100);

	const qolScore = averageQualityOfLife;
	const growthScore = normalizeRatioToScore((populationGrowth + 100) / 200);
	const migrationScore = normalizeRatioToScore((netMigration + 20) / 40);

	const total =
		qolScore * weights.qualityOfLife +
		growthScore * weights.populationGrowth +
		migrationScore * weights.netMigration +
		resourceSufficiency * weights.resourceSufficiency +
		environmentHealth * weights.environmentHealth;

	return {
		year: input.year,
		total: clamp(total, 0, 100),
		populationGrowth,
		averageQualityOfLife,
		netMigration,
		resourceSufficiency,
		environmentHealth,
	};
}

export type { NationScoreBreakdown, NationScoreInput };
export { computeNationScore };
