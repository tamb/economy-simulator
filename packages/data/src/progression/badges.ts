type BadgeScope = "run" | "career";

interface BadgeDefinition {
	id: string;
	title: string;
	description: string;
	scope: BadgeScope;
}

const badgeDefinitions: BadgeDefinition[] = [
	{
		id: "first_census",
		title: "First Census",
		description: "Complete your first game year.",
		scope: "run",
	},
	{
		id: "baby_boom",
		title: "Baby Boom",
		description: "Births more than double deaths in a single year.",
		scope: "run",
	},
	{
		id: "open_doors",
		title: "Open Doors",
		description: "Net immigration stays positive for five years in a row.",
		scope: "run",
	},
	{
		id: "golden_age",
		title: "Golden Age",
		description: "Reach a nation score of 80 or higher in a year.",
		scope: "run",
	},
	{
		id: "steward",
		title: "Steward of the Land",
		description: "Maintain environment health of 90+ by year 25.",
		scope: "run",
	},
	{
		id: "monarch_emeritus",
		title: "Monarch Emeritus",
		description: "Win a nation run.",
		scope: "run",
	},
	{
		id: "exodus",
		title: "Great Exodus",
		description: "Lose your nation to mass emigration.",
		scope: "run",
	},
	{
		id: "royal_mandate",
		title: "Royal Mandate",
		description: "Complete a yearly royal mandate.",
		scope: "run",
	},
	{
		id: "career_10_wins",
		title: "Dynasty",
		description: "Win 10 nation runs across your career.",
		scope: "career",
	},
];

function getBadgeDefinition(id: string): BadgeDefinition | undefined {
	return badgeDefinitions.find((badge) => badge.id === id);
}

export type { BadgeDefinition, BadgeScope };
export { badgeDefinitions, getBadgeDefinition };
