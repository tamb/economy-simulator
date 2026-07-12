import {
	type GameSettings,
	gameSettings,
	getSubSector,
} from "economy-simulator-data";
import {
	computeDailyQualityOfLifeUpdate,
	getRoleModifiersForCitizen,
} from "economy-simulator-simulation";
import type { Person } from "./Person";

type RandomFn = () => number;

/** Per-day resource-economy context for one person's home region/sub-sector, sourced from the last annual cycle's resource extraction and national ledger (see `repos/resource-extraction.ts`, `repos/national-ledger.ts`). */
interface UpdatePersonStatsContext {
	/** `getEconomicSystemEffect(...).moraleMultiplier` for the person's assigned sub-sector, if any. */
	economicSystemMoraleMultiplier?: number;
	/** `getEnvironmentalQualityModifier(...)` for the person's home region. */
	environmentalQualityModifier?: number;
	/** The national ledger's `shortfallHappinessPenaltyBySubSector` entry for the person's sub-sector, if it's an industrial one with unmet resource demand. */
	resourceShortfallHappinessPenalty?: number;
	/** Daily happiness penalty from active calamity debuffs. */
	calamityHappinessPenalty?: number;
}

function getWeeklyHoursForPerson(person: Person): number | undefined {
	const roleModifiers = getRoleModifiersForCitizen(person.getRoleId());
	if (roleModifiers.weeklyHoursOverride != null) {
		return roleModifiers.weeklyHoursOverride;
	}

	const categoryId = person.getCategoryId();
	const subSectorId = person.getSubSectorId();
	if (!categoryId || !subSectorId) return undefined;

	return getSubSector(categoryId, subSectorId)?.baseWeeklyHours;
}

/**
 * Apply one in-game day's quality-of-life update to a person. Aging,
 * mortality, fertility, and migration are handled once per game year by the
 * annual population-dynamics cycle (see `runAnnualCycle` in
 * `repos/population.ts`), not here.
 */
function updatePersonStats(
	person: Person,
	random: RandomFn = Math.random,
	settings: GameSettings = gameSettings,
	context: UpdatePersonStatsContext = {},
): void {
	if (!person.isLiving()) return;

	const { happiness, health } = computeDailyQualityOfLifeUpdate(
		{
			happiness: person.getOverallHappiness() ?? 50,
			health: person.getOverallHealth() ?? 50,
			age: person.getAge() ?? settings.demographics.minAge,
			weeklyHours: getWeeklyHoursForPerson(person),
			categoryId: person.getCategoryId(),
			personality: {
				openness: person.getOpenness() ?? 0,
				conscientiousness: person.getConscientiousness() ?? 0,
				extraversion: person.getExtraversion() ?? 0,
				agreeableness: person.getAgreeableness() ?? 0,
				neuroticism: person.getNeuroticism() ?? 0,
			},
			economicSystemMoraleMultiplier: context.economicSystemMoraleMultiplier,
			environmentalQualityModifier: context.environmentalQualityModifier,
			resourceShortfallHappinessPenalty:
				context.resourceShortfallHappinessPenalty,
			calamityHappinessPenalty: context.calamityHappinessPenalty,
			roleMoraleMultiplier: getRoleModifiersForCitizen(person.getRoleId())
				.moraleMultiplier,
		},
		random,
		settings,
	);

	person.setOverallHappiness(happiness);
	person.setOverallHealth(health);
}

export { type RandomFn, type UpdatePersonStatsContext, updatePersonStats };
