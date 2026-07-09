import type { EconomicSystemId } from "./economic-systems";

type RoleEligibility = "working-age" | "any-age" | "non-working";

interface EconomicRole {
	id: number;
	systemId: EconomicSystemId;
	slug: string;
	label: string;
	description: string;
	eligibility: RoleEligibility;
}

interface RoleQuota {
	roleId: number;
	share: number;
}

const economicRoles: EconomicRole[] = [
	// Capitalism (10–19)
	{
		id: 10,
		systemId: "capitalism",
		slug: "worker",
		label: "Worker",
		description: "Sells labor for wages in a privately owned enterprise.",
		eligibility: "working-age",
	},
	{
		id: 11,
		systemId: "capitalism",
		slug: "manager",
		label: "Manager",
		description: "Supervises production and coordinates wage labor.",
		eligibility: "working-age",
	},
	{
		id: 12,
		systemId: "capitalism",
		slug: "owner",
		label: "Owner",
		description: "Controls capital and profits from enterprise ownership.",
		eligibility: "working-age",
	},
	{
		id: 13,
		systemId: "capitalism",
		slug: "entrepreneur",
		label: "Entrepreneur",
		description: "Founder or risk-taker launching new ventures.",
		eligibility: "working-age",
	},
	// Socialism (20–29)
	{
		id: 20,
		systemId: "socialism",
		slug: "collective-worker",
		label: "Collective Worker",
		description:
			"Member of socially owned production with democratic workplace rights.",
		eligibility: "working-age",
	},
	{
		id: 21,
		systemId: "socialism",
		slug: "planner",
		label: "Planner",
		description: "Coordinates equitable allocation of social output.",
		eligibility: "working-age",
	},
	{
		id: 22,
		systemId: "socialism",
		slug: "party-cadre",
		label: "Party Cadre",
		description:
			"Political organizer ensuring socialist policy in the workplace.",
		eligibility: "working-age",
	},
	// Tripartism (30–39)
	{
		id: 30,
		systemId: "tripartism",
		slug: "union-worker",
		label: "Union Worker",
		description: "Organized labor represented in tripartite negotiations.",
		eligibility: "working-age",
	},
	{
		id: 31,
		systemId: "tripartism",
		slug: "employer-rep",
		label: "Employer Representative",
		description: "Management voice in corporatist bargaining.",
		eligibility: "working-age",
	},
	{
		id: 32,
		systemId: "tripartism",
		slug: "government-mediator",
		label: "Government Mediator",
		description: "State arbiter balancing labor and capital interests.",
		eligibility: "working-age",
	},
	// Communism (40–49)
	{
		id: 40,
		systemId: "communism",
		slug: "state-worker",
		label: "State Worker",
		description: "Laborer in centrally directed state enterprise.",
		eligibility: "working-age",
	},
	{
		id: 41,
		systemId: "communism",
		slug: "party-official",
		label: "Party Official",
		description: "Cadre enforcing ideological and production targets.",
		eligibility: "working-age",
	},
	{
		id: 42,
		systemId: "communism",
		slug: "collective-chair",
		label: "Collective Chair",
		description: "Local administrator of a production collective.",
		eligibility: "working-age",
	},
	// Mixed economy (50–59)
	{
		id: 50,
		systemId: "mixed-economy",
		slug: "private-worker",
		label: "Private-Sector Worker",
		description: "Employed in market firms subject to regulation.",
		eligibility: "working-age",
	},
	{
		id: 51,
		systemId: "mixed-economy",
		slug: "public-worker",
		label: "Public-Sector Worker",
		description: "State or municipal employee delivering public services.",
		eligibility: "working-age",
	},
	{
		id: 52,
		systemId: "mixed-economy",
		slug: "regulator",
		label: "Regulator",
		description: "Oversight role balancing market freedom and public interest.",
		eligibility: "working-age",
	},
	// Feudalism (60–69)
	{
		id: 65,
		systemId: "feudalism",
		slug: "serf",
		label: "Serf",
		description: "Bound peasant laboring on a lord's land for protection.",
		eligibility: "working-age",
	},
	{
		id: 66,
		systemId: "feudalism",
		slug: "knight",
		label: "Knight",
		description: "Mounted warrior sworn to a lord's military service.",
		eligibility: "working-age",
	},
	{
		id: 67,
		systemId: "feudalism",
		slug: "lord",
		label: "Lord",
		description: "Landholding noble extracting surplus from vassals and serfs.",
		eligibility: "working-age",
	},
	{
		id: 68,
		systemId: "feudalism",
		slug: "clergy",
		label: "Clergy",
		description: "Religious authority mediating moral order and tithes.",
		eligibility: "working-age",
	},
	// Mercantilism (70–79)
	{
		id: 70,
		systemId: "mercantilism",
		slug: "merchant",
		label: "Merchant",
		description: "Trader pursuing national trade surplus under crown license.",
		eligibility: "working-age",
	},
	{
		id: 71,
		systemId: "mercantilism",
		slug: "artisan",
		label: "Artisan",
		description: "Guild craftsman producing for regulated domestic markets.",
		eligibility: "working-age",
	},
	{
		id: 72,
		systemId: "mercantilism",
		slug: "crown-agent",
		label: "Crown Agent",
		description: "State official directing commerce and colonial extraction.",
		eligibility: "working-age",
	},
	// Market socialism (80–89)
	{
		id: 80,
		systemId: "market-socialism",
		slug: "cooperative-worker",
		label: "Cooperative Worker",
		description:
			"Member-owner of a socially held enterprise using market prices.",
		eligibility: "working-age",
	},
	{
		id: 81,
		systemId: "market-socialism",
		slug: "market-manager",
		label: "Market Manager",
		description: "Coordinates cooperative output against market signals.",
		eligibility: "working-age",
	},
	{
		id: 82,
		systemId: "market-socialism",
		slug: "social-planner",
		label: "Social Planner",
		description: "Sets social targets within a market-socialist framework.",
		eligibility: "working-age",
	},
	// State capitalism (90–99)
	{
		id: 90,
		systemId: "state-capitalism",
		slug: "state-enterprise-worker",
		label: "State Enterprise Worker",
		description: "Employee of state-owned firms using capitalist methods.",
		eligibility: "working-age",
	},
	{
		id: 91,
		systemId: "state-capitalism",
		slug: "bureaucrat",
		label: "Bureaucrat",
		description: "Administrative official steering state-led industry.",
		eligibility: "working-age",
	},
	{
		id: 92,
		systemId: "state-capitalism",
		slug: "party-executive",
		label: "Party Executive",
		description: "Political leadership linking party authority to enterprise.",
		eligibility: "working-age",
	},
	// Anarcho-capitalism (100–109)
	{
		id: 100,
		systemId: "anarcho-capitalism",
		slug: "contractor",
		label: "Contractor",
		description: "Freelance labor bound only by voluntary contract.",
		eligibility: "working-age",
	},
	{
		id: 101,
		systemId: "anarcho-capitalism",
		slug: "proprietor",
		label: "Proprietor",
		description: "Sole owner of a private business without state interference.",
		eligibility: "working-age",
	},
	{
		id: 102,
		systemId: "anarcho-capitalism",
		slug: "investor",
		label: "Investor",
		description: "Capital allocator seeking return in unregulated markets.",
		eligibility: "working-age",
	},
	// Subsistence (110–119)
	{
		id: 110,
		systemId: "subsistence",
		slug: "subsistence-farmer",
		label: "Subsistence Farmer",
		description: "Produces primarily for household consumption.",
		eligibility: "working-age",
	},
	{
		id: 111,
		systemId: "subsistence",
		slug: "hunter-gatherer",
		label: "Hunter-Gatherer",
		description: "Forages and hunts within kinship-based exchange.",
		eligibility: "working-age",
	},
	{
		id: 112,
		systemId: "subsistence",
		slug: "elder",
		label: "Elder",
		description: "Custodian of tradition and informal community leadership.",
		eligibility: "working-age",
	},
];

const defaultRoleQuotasBySystem: Record<EconomicSystemId, RoleQuota[]> = {
	capitalism: [
		{ roleId: 10, share: 0.75 },
		{ roleId: 11, share: 0.15 },
		{ roleId: 12, share: 0.07 },
		{ roleId: 13, share: 0.03 },
	],
	socialism: [
		{ roleId: 20, share: 0.8 },
		{ roleId: 21, share: 0.12 },
		{ roleId: 22, share: 0.08 },
	],
	tripartism: [
		{ roleId: 30, share: 0.7 },
		{ roleId: 31, share: 0.2 },
		{ roleId: 32, share: 0.1 },
	],
	communism: [
		{ roleId: 40, share: 0.78 },
		{ roleId: 41, share: 0.12 },
		{ roleId: 42, share: 0.1 },
	],
	"mixed-economy": [
		{ roleId: 50, share: 0.65 },
		{ roleId: 51, share: 0.25 },
		{ roleId: 52, share: 0.1 },
	],
	feudalism: [
		{ roleId: 65, share: 0.85 },
		{ roleId: 66, share: 0.1 },
		{ roleId: 67, share: 0.04 },
		{ roleId: 68, share: 0.01 },
	],
	mercantilism: [
		{ roleId: 70, share: 0.25 },
		{ roleId: 71, share: 0.6 },
		{ roleId: 72, share: 0.15 },
	],
	"market-socialism": [
		{ roleId: 80, share: 0.75 },
		{ roleId: 81, share: 0.15 },
		{ roleId: 82, share: 0.1 },
	],
	"state-capitalism": [
		{ roleId: 90, share: 0.7 },
		{ roleId: 91, share: 0.2 },
		{ roleId: 92, share: 0.1 },
	],
	"anarcho-capitalism": [
		{ roleId: 100, share: 0.6 },
		{ roleId: 101, share: 0.25 },
		{ roleId: 102, share: 0.15 },
	],
	subsistence: [
		{ roleId: 110, share: 0.7 },
		{ roleId: 111, share: 0.2 },
		{ roleId: 112, share: 0.1 },
	],
};

function getEconomicRole(id: number): EconomicRole | undefined {
	return economicRoles.find((role) => role.id === id);
}

function getRolesForSystem(systemId: EconomicSystemId): EconomicRole[] {
	return economicRoles.filter((role) => role.systemId === systemId);
}

function isEconomicRoleId(value: number): boolean {
	return economicRoles.some((role) => role.id === value);
}

function getDefaultRoleQuotasForSystem(
	systemId: EconomicSystemId,
): RoleQuota[] {
	return defaultRoleQuotasBySystem[systemId].map((quota) => ({ ...quota }));
}

export type { EconomicRole, RoleEligibility, RoleQuota };
export {
	defaultRoleQuotasBySystem,
	economicRoles,
	getDefaultRoleQuotasForSystem,
	getEconomicRole,
	getRolesForSystem,
	isEconomicRoleId,
};
