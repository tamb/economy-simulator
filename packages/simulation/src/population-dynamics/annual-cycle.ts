import type { GameSettings, Sex } from "economy-simulator-data";
import { gameSettings } from "economy-simulator-data";
import { rollFertility } from "./fertility";
import { rollEmigration } from "./migration";
import { rollMortality } from "./mortality";

type RandomFn = () => number;

interface AnnualCitizenInput {
	age: number;
	sex: Sex;
	/** 0-100 overall happiness. */
	happiness: number;
	/** 0-100 overall health. */
	health: number;
	/** Extra absolute annual mortality probability from active calamities. */
	calamityMortalityBump?: number;
	/** Extra absolute annual emigration probability from active calamities. */
	calamityEmigrationBump?: number;
}

interface AnnualCitizenOutcome {
	died: boolean;
	emigrated: boolean;
	gaveBirth: boolean;
}

/**
 * Applies one year's mortality, emigration, and fertility rolls to a single
 * living citizen. A citizen who dies this year is checked first and cannot
 * also emigrate or give birth; an emigrant cannot give birth in the country
 * they are leaving. See research/life-and-demographics.md for the sourced
 * baselines behind each roll.
 */
function computeAnnualOutcomeForCitizen(
	input: AnnualCitizenInput,
	random: RandomFn = Math.random,
	settings: GameSettings = gameSettings,
): AnnualCitizenOutcome {
	const died =
		rollMortality(input, random) ||
		random() < Math.max(0, input.calamityMortalityBump ?? 0);
	if (died) {
		return { died: true, emigrated: false, gaveBirth: false };
	}

	const emigrated =
		rollEmigration(input, random, settings) ||
		random() < Math.max(0, input.calamityEmigrationBump ?? 0);
	if (emigrated) {
		return { died: false, emigrated: true, gaveBirth: false };
	}

	const gaveBirth = rollFertility(input, random, settings);
	return { died: false, emigrated: false, gaveBirth };
}

export type { AnnualCitizenInput, AnnualCitizenOutcome };
export { computeAnnualOutcomeForCitizen };
