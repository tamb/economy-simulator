export type EconomicSystemId =
	| "capitalism"
	| "socialism"
	| "tripartism"
	| "communism"
	| "mixed-economy"
	| "mercantilism"
	| "feudalism"
	| "market-socialism"
	| "state-capitalism"
	| "anarcho-capitalism"
	| "subsistence";

export interface EconomicSystem {
	id: EconomicSystemId;
	label: string;
	description: string;
}

export const economicSystems: EconomicSystem[] = [
	{
		id: "capitalism",
		label: "Capitalism",
		description:
			"Private ownership, market allocation, and profit as the primary incentive.",
	},
	{
		id: "socialism",
		label: "Socialism",
		description:
			"Social ownership or democratic control of production, prioritizing equity and human need.",
	},
	{
		id: "tripartism",
		label: "Tripartism",
		description:
			"Structured cooperation among government, employers, and trade unions on economic policy.",
	},
	{
		id: "communism",
		label: "Communism (Marxist-Leninist / Command)",
		description:
			"Collective ownership with state or party direction through central planning.",
	},
	{
		id: "mixed-economy",
		label: "Mixed Economy",
		description:
			"Markets combined with regulation, public ownership, and redistribution.",
	},
	{
		id: "mercantilism",
		label: "Mercantilism",
		description:
			"National accumulation of wealth through trade surpluses and state-directed commerce.",
	},
	{
		id: "feudalism",
		label: "Feudalism",
		description:
			"Land-based hierarchy with obligation-based agrarian production and localized exchange.",
	},
	{
		id: "market-socialism",
		label: "Market Socialism",
		description:
			"Social ownership of enterprises with market pricing and competitive allocation.",
	},
	{
		id: "state-capitalism",
		label: "State Capitalism",
		description:
			"State-led industry using market tools, linking political authority and commercial power.",
	},
	{
		id: "anarcho-capitalism",
		label: "Anarcho-Capitalism",
		description:
			"No state; all property private and coordination fully voluntary and contractual.",
	},
	{
		id: "subsistence",
		label: "Subsistence / Traditional Economy",
		description:
			"Production for direct consumption via kinship, custom, barter, or gift exchange.",
	},
];

export function getEconomicSystem(
	id: EconomicSystemId,
): EconomicSystem | undefined {
	return economicSystems.find((system) => system.id === id);
}

export function isEconomicSystemId(value: string): value is EconomicSystemId {
	return economicSystems.some((system) => system.id === value);
}
