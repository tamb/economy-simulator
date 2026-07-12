import {
	type CategoryId,
	type GameSettings,
	gameSettings,
	getEconomicSystemEffect,
	getSubSector,
} from "economy-simulator-data";
import type { ActiveCalamity } from "economy-simulator-persistence";
import type { NationalLedger } from "economy-simulator-simulation";
import {
	getCalamityModifiersForCitizen,
	getEnvironmentalQualityModifier,
	getPersonalitySectorAffinity,
	getRoleModifiersForCitizen,
	getWorkHoursHappinessDelta,
	isWorkingAge,
} from "economy-simulator-simulation";
import type { Person } from "../models/Person";
import type { Region } from "../repos/regions";
import {
	getSectorAssignment,
	type SectorAssignments,
} from "../repos/sector-assignments";

interface QolFactorLine {
	id: string;
	label: string;
	delta: number;
	note?: string;
}

interface CitizenQolBreakdown {
	factors: QolFactorLine[];
	happiness: number;
	health: number;
	jobLabel: string;
	roleLabel: string;
	regionName: string;
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

function buildCitizenQolBreakdown(input: {
	person: Person;
	gameDay: number;
	activeCalamities: ActiveCalamity[];
	sectorAssignments: SectorAssignments;
	nationalLedger: NationalLedger | null;
	region: Region | undefined;
	settings?: GameSettings;
}): CitizenQolBreakdown {
	const settings = input.settings ?? gameSettings;
	const person = input.person;
	const happiness = person.getOverallHappiness() ?? 50;
	const health = person.getOverallHealth() ?? 50;
	const age = person.getAge() ?? settings.demographics.minAge;
	const categoryId = person.getCategoryId();
	const subSectorId = person.getSubSectorId();
	const weeklyHours = getWeeklyHoursForPerson(person);
	const roleModifiers = getRoleModifiersForCitizen(person.getRoleId());

	const economicSystemId =
		categoryId && subSectorId
			? getSectorAssignment(input.sectorAssignments, categoryId, subSectorId)
			: null;
	const systemEffect = economicSystemId
		? getEconomicSystemEffect(economicSystemId)
		: undefined;
	const systemMorale = systemEffect?.moraleMultiplier ?? 1;
	const roleMorale = roleModifiers.moraleMultiplier;

	const workHoursDelta = getWorkHoursHappinessDelta(weeklyHours, settings, {
		isWorkingAge: isWorkingAge(age, settings),
	});

	const affinity =
		categoryId != null
			? getPersonalitySectorAffinity(
					{
						openness: person.getOpenness() ?? 0,
						conscientiousness: person.getConscientiousness() ?? 0,
						extraversion: person.getExtraversion() ?? 0,
						agreeableness: person.getAgreeableness() ?? 0,
						neuroticism: person.getNeuroticism() ?? 0,
					},
					categoryId as CategoryId,
				)
			: 0;
	const affinityDelta =
		affinity *
		settings.work.sectorAffinityMaxDailyDelta *
		systemMorale *
		roleMorale;

	const environmentDelta = input.region
		? getEnvironmentalQualityModifier(
				input.region.resourceState.environmentQuality,
				settings,
			)
		: 0;

	const shortfall =
		subSectorId != null
			? (input.nationalLedger?.shortfallHappinessPenaltyBySubSector[
					subSectorId
				] ?? 0)
			: 0;

	const calamity = getCalamityModifiersForCitizen({
		activeCalamities: input.activeCalamities,
		gameDay: input.gameDay,
		regionId: person.getRegionId(),
		subSectorId,
	});

	const subSector =
		categoryId && subSectorId
			? getSubSector(categoryId, subSectorId)
			: undefined;

	const factors: QolFactorLine[] = [
		{
			id: "work",
			label: "Work hours",
			delta: workHoursDelta,
			note:
				weeklyHours == null
					? "No job / not working"
					: `${weeklyHours} hrs/week`,
		},
		{
			id: "fit",
			label: "Job fit & morale",
			delta: affinityDelta,
			note:
				economicSystemId != null
					? `System ×${systemMorale.toFixed(2)} · role ×${roleMorale.toFixed(2)}`
					: undefined,
		},
		{
			id: "environment",
			label: "Environment",
			delta: environmentDelta,
			note: input.region
				? `Quality ${input.region.resourceState.environmentQuality.toFixed(0)}/100`
				: undefined,
		},
		{
			id: "shortfall",
			label: "Resource shortfall",
			delta: -shortfall,
			note: shortfall > 0 ? "Industrial demand unmet" : "None",
		},
		{
			id: "calamity",
			label: "Calamity drag",
			delta: -calamity.happinessPenaltyPerDay,
			note:
				calamity.happinessPenaltyPerDay > 0
					? "Active regional/national debuff"
					: "None",
		},
	];

	return {
		factors,
		happiness,
		health,
		jobLabel: subSector?.label ?? (categoryId ? String(categoryId) : "None"),
		roleLabel:
			person.getRoleId() != null ? `Role #${person.getRoleId()}` : "None",
		regionName: input.region?.name ?? person.getRegionId() ?? "Unknown",
	};
}

export type { CitizenQolBreakdown, QolFactorLine };
export { buildCitizenQolBreakdown };
