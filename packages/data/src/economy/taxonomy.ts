/**
 * The five-tier economic taxonomy shared by the UI (sector map) and the
 * simulation (job assignment, quality-of-life calculations).
 *
 * `employmentShare` per category and `baseWeeklyHours` per category are
 * anchored to real-world data — see `research/index.md` and the comments
 * below for sourcing. Sub-sector level splits are a documented v1
 * simplification (uniform `employmentWeight` within each category) pending
 * finer-grained data; adjust `employmentWeight` per sub-sector to bias the
 * split without touching simulation code.
 */

type CategoryId =
	| "extractive"
	| "industrial"
	| "services"
	| "knowledge"
	| "command";

interface SubSector {
	id: string;
	label: string;
	description: string;
	/** Relative employment weight within the parent category (equal by default). */
	employmentWeight: number;
	/** Baseline weekly work hours for a citizen employed in this sub-sector. */
	baseWeeklyHours: number;
}

interface Category {
	id: CategoryId;
	tier: 1 | 2 | 3 | 4 | 5;
	tierName: string;
	label: string;
	shortLabel: string;
	description: string;
	/** Share of the working-age population employed in this category (0-1, sums to 1 across all categories). */
	employmentShare: number;
	subSectors: SubSector[];
}

/**
 * Category-level `employmentShare` is anchored to ILO modelled estimates
 * (World Bank SL.AGR.EMPL.ZS / SL.IND.EMPL.ZS / SL.SRV.EMPL.ZS, 2023): global
 * agriculture ~26.08%, industry ~23.69%, services ~50.23%. Our five-tier
 * taxonomy splits differently than that three-way ILO split (it carves a
 * "knowledge"/quaternary and "command"/quinary slice out of industry and
 * services for gameplay depth), so these numbers are a deliberate, sourced
 * approximation rather than a direct lookup — see
 * research/life-and-demographics.md.
 */
const EXTRACTIVE_WEEKLY_HOURS = 46;
const INDUSTRIAL_WEEKLY_HOURS = 44;
const SERVICES_WEEKLY_HOURS = 38;
const KNOWLEDGE_WEEKLY_HOURS = 42;
const COMMAND_WEEKLY_HOURS = 55;

const categories: Category[] = [
	{
		id: "extractive",
		tier: 1,
		tierName: "Primary",
		label: "Primary (Extractive)",
		shortLabel: "Extractive",
		description:
			"Extracts raw materials directly from nature — the base of the economic pyramid.",
		employmentShare: 0.27,
		subSectors: [
			{
				id: "agriculture",
				label: "Agriculture",
				description: "Food crops, fiber, and biofuels from cultivated land.",
				employmentWeight: 1,
				baseWeeklyHours: EXTRACTIVE_WEEKLY_HOURS,
			},
			{
				id: "livestock",
				label: "Livestock & Dairy",
				description: "Meat, milk, eggs, and wool from ranching and farms.",
				employmentWeight: 1,
				baseWeeklyHours: EXTRACTIVE_WEEKLY_HOURS,
			},
			{
				id: "forestry",
				label: "Forestry",
				description: "Timber, pulp, and non-timber forest products.",
				employmentWeight: 1,
				baseWeeklyHours: EXTRACTIVE_WEEKLY_HOURS,
			},
			{
				id: "fishing",
				label: "Fishing & Aquaculture",
				description:
					"Wild catch and farmed seafood, algae, and marine products.",
				employmentWeight: 1,
				baseWeeklyHours: EXTRACTIVE_WEEKLY_HOURS,
			},
			{
				id: "mining",
				label: "Mining — Metals",
				description:
					"Iron, copper, gold, and rare earths from open and underground mines.",
				employmentWeight: 1,
				baseWeeklyHours: EXTRACTIVE_WEEKLY_HOURS,
			},
			{
				id: "energy",
				label: "Mining — Energy",
				description:
					"Coal, oil, and natural gas from wells, strip mines, and offshore rigs.",
				employmentWeight: 1,
				baseWeeklyHours: EXTRACTIVE_WEEKLY_HOURS,
			},
			{
				id: "quarrying",
				label: "Quarrying",
				description:
					"Stone, sand, gravel, and clay for construction aggregates.",
				employmentWeight: 1,
				baseWeeklyHours: EXTRACTIVE_WEEKLY_HOURS,
			},
		],
	},
	{
		id: "industrial",
		tier: 2,
		tierName: "Secondary",
		label: "Secondary (Industrial)",
		shortLabel: "Industrial",
		description:
			"Transforms raw materials into finished or semi-finished goods through manufacturing and construction.",
		employmentShare: 0.21,
		subSectors: [
			{
				id: "heavy-industry",
				label: "Heavy Industry",
				description:
					"Steel, chemicals, shipbuilding, and large-scale industrial plant.",
				employmentWeight: 1,
				baseWeeklyHours: INDUSTRIAL_WEEKLY_HOURS,
			},
			{
				id: "light-manufacturing",
				label: "Light Manufacturing",
				description:
					"Consumer goods, textiles, furniture, and assembly-line products.",
				employmentWeight: 1,
				baseWeeklyHours: INDUSTRIAL_WEEKLY_HOURS,
			},
			{
				id: "electronics-machinery",
				label: "Electronics & Machinery",
				description:
					"Semiconductors, industrial equipment, and precision instruments.",
				employmentWeight: 1,
				baseWeeklyHours: INDUSTRIAL_WEEKLY_HOURS,
			},
			{
				id: "automotive",
				label: "Automotive & Transport Equipment",
				description:
					"Vehicles, rolling stock, aircraft, and related components.",
				employmentWeight: 1,
				baseWeeklyHours: INDUSTRIAL_WEEKLY_HOURS,
			},
			{
				id: "food-processing",
				label: "Food Processing",
				description:
					"Packaged foods, beverages, and agricultural product refinement.",
				employmentWeight: 1,
				baseWeeklyHours: INDUSTRIAL_WEEKLY_HOURS,
			},
			{
				id: "construction",
				label: "Construction",
				description:
					"Buildings, infrastructure, and civil engineering projects.",
				employmentWeight: 1,
				baseWeeklyHours: INDUSTRIAL_WEEKLY_HOURS,
			},
			{
				id: "utilities",
				label: "Utilities",
				description: "Electricity, gas, water, and waste management networks.",
				employmentWeight: 1,
				baseWeeklyHours: INDUSTRIAL_WEEKLY_HOURS,
			},
			{
				id: "pharmaceuticals",
				label: "Pharmaceuticals",
				description:
					"Drug manufacturing, vaccines, and medical chemical production.",
				employmentWeight: 1,
				baseWeeklyHours: INDUSTRIAL_WEEKLY_HOURS,
			},
		],
	},
	{
		id: "services",
		tier: 3,
		tierName: "Tertiary",
		label: "Tertiary (Services)",
		shortLabel: "Services",
		description:
			"Provides intangible services — trade, finance, health, transport, and government administration.",
		employmentShare: 0.44,
		subSectors: [
			{
				id: "wholesale-retail",
				label: "Wholesale & Retail Trade",
				description:
					"Distribution and sale of goods to businesses and consumers.",
				employmentWeight: 1,
				baseWeeklyHours: SERVICES_WEEKLY_HOURS,
			},
			{
				id: "transport-logistics",
				label: "Transport & Logistics",
				description: "Moving people and freight by road, rail, air, and sea.",
				employmentWeight: 1,
				baseWeeklyHours: SERVICES_WEEKLY_HOURS,
			},
			{
				id: "financial-services",
				label: "Financial Services",
				description: "Banking, insurance, investment, and capital markets.",
				employmentWeight: 1,
				baseWeeklyHours: SERVICES_WEEKLY_HOURS,
			},
			{
				id: "real-estate",
				label: "Real Estate",
				description:
					"Property development, leasing, brokerage, and asset management.",
				employmentWeight: 1,
				baseWeeklyHours: SERVICES_WEEKLY_HOURS,
			},
			{
				id: "healthcare",
				label: "Healthcare",
				description:
					"Hospitals, clinics, diagnostics, and medical care delivery.",
				employmentWeight: 1,
				baseWeeklyHours: SERVICES_WEEKLY_HOURS,
			},
			{
				id: "education",
				label: "Education",
				description:
					"Schools, training programs, and workforce skill development.",
				employmentWeight: 1,
				baseWeeklyHours: SERVICES_WEEKLY_HOURS,
			},
			{
				id: "hospitality-tourism",
				label: "Hospitality & Tourism",
				description: "Hotels, restaurants, travel, and leisure experiences.",
				employmentWeight: 1,
				baseWeeklyHours: SERVICES_WEEKLY_HOURS,
			},
			{
				id: "public-administration",
				label: "Public Administration",
				description:
					"Civil service, local government, and public program delivery.",
				employmentWeight: 1,
				baseWeeklyHours: SERVICES_WEEKLY_HOURS,
			},
			{
				id: "professional-services",
				label: "Professional Services",
				description:
					"Legal, accounting, consulting, and specialized advisory work.",
				employmentWeight: 1,
				baseWeeklyHours: SERVICES_WEEKLY_HOURS,
			},
			{
				id: "telecommunications",
				label: "Telecommunications",
				description:
					"Voice, data, and broadband network infrastructure and services.",
				employmentWeight: 1,
				baseWeeklyHours: SERVICES_WEEKLY_HOURS,
			},
		],
	},
	{
		id: "knowledge",
		tier: 4,
		tierName: "Quaternary",
		label: "Quaternary (Knowledge)",
		shortLabel: "Knowledge",
		description:
			"Creates and distributes knowledge, information, and intellectual property.",
		employmentShare: 0.07,
		subSectors: [
			{
				id: "research-development",
				label: "Research & Development",
				description:
					"Scientific discovery, lab research, and applied innovation.",
				employmentWeight: 1,
				baseWeeklyHours: KNOWLEDGE_WEEKLY_HOURS,
			},
			{
				id: "information-technology",
				label: "Information Technology",
				description:
					"Software, cloud services, and digital platform development.",
				employmentWeight: 1,
				baseWeeklyHours: KNOWLEDGE_WEEKLY_HOURS,
			},
			{
				id: "data-analytics",
				label: "Data & Analytics",
				description:
					"Data science, business intelligence, and predictive modeling.",
				employmentWeight: 1,
				baseWeeklyHours: KNOWLEDGE_WEEKLY_HOURS,
			},
			{
				id: "higher-education",
				label: "Higher Education",
				description:
					"Universities, research institutes, and advanced academic training.",
				employmentWeight: 1,
				baseWeeklyHours: KNOWLEDGE_WEEKLY_HOURS,
			},
			{
				id: "media-publishing",
				label: "Media & Publishing",
				description:
					"News, entertainment, books, and digital content production.",
				employmentWeight: 1,
				baseWeeklyHours: KNOWLEDGE_WEEKLY_HOURS,
			},
			{
				id: "biotechnology",
				label: "Biotechnology",
				description:
					"Genetic engineering, biopharma research, and life-science tools.",
				employmentWeight: 1,
				baseWeeklyHours: KNOWLEDGE_WEEKLY_HOURS,
			},
			{
				id: "telecom-rd",
				label: "Telecom R&D",
				description:
					"Next-generation network research and communications innovation.",
				employmentWeight: 1,
				baseWeeklyHours: KNOWLEDGE_WEEKLY_HOURS,
			},
		],
	},
	{
		id: "command",
		tier: 5,
		tierName: "Quinary",
		label: "Quinary (Command)",
		shortLabel: "Command",
		description:
			"Top-level decision-making that directs the entire economy — tiny in employment, enormous in influence.",
		employmentShare: 0.01,
		subSectors: [
			{
				id: "executive-government",
				label: "Executive Government",
				description:
					"Presidential cabinets, ministries, and senior policy leadership.",
				employmentWeight: 1,
				baseWeeklyHours: COMMAND_WEEKLY_HOURS,
			},
			{
				id: "central-banking",
				label: "Central Banking",
				description:
					"Monetary policy, currency issuance, and financial system oversight.",
				employmentWeight: 1,
				baseWeeklyHours: COMMAND_WEEKLY_HOURS,
			},
			{
				id: "legislature-judiciary",
				label: "Legislature & Judiciary",
				description:
					"Lawmaking, constitutional interpretation, and legal authority.",
				employmentWeight: 1,
				baseWeeklyHours: COMMAND_WEEKLY_HOURS,
			},
			{
				id: "corporate-headquarters",
				label: "Corporate Headquarters",
				description:
					"Multinational strategy, board governance, and capital allocation.",
				employmentWeight: 1,
				baseWeeklyHours: COMMAND_WEEKLY_HOURS,
			},
			{
				id: "international-bodies",
				label: "International Bodies",
				description:
					"Treaties, global standards, and cross-border economic coordination.",
				employmentWeight: 1,
				baseWeeklyHours: COMMAND_WEEKLY_HOURS,
			},
			{
				id: "strategic-advisory",
				label: "Strategic Advisory",
				description:
					"Elite think tanks, policy councils, and strategic counsel.",
				employmentWeight: 1,
				baseWeeklyHours: COMMAND_WEEKLY_HOURS,
			},
		],
	},
];

function getCategory(id: CategoryId): Category | undefined {
	return categories.find((category) => category.id === id);
}

function getSubSector(
	categoryId: CategoryId,
	sectorId: string,
): SubSector | undefined {
	return getCategory(categoryId)?.subSectors.find(
		(sector) => sector.id === sectorId,
	);
}

function sectorKey(categoryId: CategoryId, sectorId: string): string {
	return `${categoryId}/${sectorId}`;
}

interface WeightedSubSector {
	categoryId: CategoryId;
	subSectorId: string;
	/** Absolute share of the working-age population employed here (0-1). Sums to ~1 across all entries. */
	employmentShare: number;
}

/** Flatten every sub-sector into an absolute employment-share weighted list, for weighted random job assignment. */
function getAllSubSectorEmploymentShares(): WeightedSubSector[] {
	return categories.flatMap((category) => {
		const totalWeight = category.subSectors.reduce(
			(sum, subSector) => sum + subSector.employmentWeight,
			0,
		);

		return category.subSectors.map((subSector) => ({
			categoryId: category.id,
			subSectorId: subSector.id,
			employmentShare:
				totalWeight === 0
					? 0
					: category.employmentShare *
						(subSector.employmentWeight / totalWeight),
		}));
	});
}

export type { Category, CategoryId, SubSector, WeightedSubSector };
export {
	categories,
	getAllSubSectorEmploymentShares,
	getCategory,
	getSubSector,
	sectorKey,
};
