export type CategoryId =
	| "extractive"
	| "industrial"
	| "services"
	| "knowledge"
	| "command";

export interface SubSector {
	id: string;
	label: string;
	description: string;
}

export interface Category {
	id: CategoryId;
	tier: 1 | 2 | 3 | 4 | 5;
	tierName: string;
	label: string;
	shortLabel: string;
	description: string;
	color: string;
	subSectors: SubSector[];
}

export const categories: Category[] = [
	{
		id: "extractive",
		tier: 1,
		tierName: "Primary",
		label: "Primary (Extractive)",
		shortLabel: "Extractive",
		description:
			"Extracts raw materials directly from nature — the base of the economic pyramid.",
		color: "green",
		subSectors: [
			{
				id: "agriculture",
				label: "Agriculture",
				description: "Food crops, fiber, and biofuels from cultivated land.",
			},
			{
				id: "livestock",
				label: "Livestock & Dairy",
				description: "Meat, milk, eggs, and wool from ranching and farms.",
			},
			{
				id: "forestry",
				label: "Forestry",
				description: "Timber, pulp, and non-timber forest products.",
			},
			{
				id: "fishing",
				label: "Fishing & Aquaculture",
				description: "Wild catch and farmed seafood, algae, and marine products.",
			},
			{
				id: "mining",
				label: "Mining — Metals",
				description: "Iron, copper, gold, and rare earths from open and underground mines.",
			},
			{
				id: "energy",
				label: "Mining — Energy",
				description: "Coal, oil, and natural gas from wells, strip mines, and offshore rigs.",
			},
			{
				id: "quarrying",
				label: "Quarrying",
				description: "Stone, sand, gravel, and clay for construction aggregates.",
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
		color: "orange",
		subSectors: [
			{
				id: "heavy-industry",
				label: "Heavy Industry",
				description: "Steel, chemicals, shipbuilding, and large-scale industrial plant.",
			},
			{
				id: "light-manufacturing",
				label: "Light Manufacturing",
				description: "Consumer goods, textiles, furniture, and assembly-line products.",
			},
			{
				id: "electronics-machinery",
				label: "Electronics & Machinery",
				description: "Semiconductors, industrial equipment, and precision instruments.",
			},
			{
				id: "automotive",
				label: "Automotive & Transport Equipment",
				description: "Vehicles, rolling stock, aircraft, and related components.",
			},
			{
				id: "food-processing",
				label: "Food Processing",
				description: "Packaged foods, beverages, and agricultural product refinement.",
			},
			{
				id: "construction",
				label: "Construction",
				description: "Buildings, infrastructure, and civil engineering projects.",
			},
			{
				id: "utilities",
				label: "Utilities",
				description: "Electricity, gas, water, and waste management networks.",
			},
			{
				id: "pharmaceuticals",
				label: "Pharmaceuticals",
				description: "Drug manufacturing, vaccines, and medical chemical production.",
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
		color: "cyan",
		subSectors: [
			{
				id: "wholesale-retail",
				label: "Wholesale & Retail Trade",
				description: "Distribution and sale of goods to businesses and consumers.",
			},
			{
				id: "transport-logistics",
				label: "Transport & Logistics",
				description: "Moving people and freight by road, rail, air, and sea.",
			},
			{
				id: "financial-services",
				label: "Financial Services",
				description: "Banking, insurance, investment, and capital markets.",
			},
			{
				id: "real-estate",
				label: "Real Estate",
				description: "Property development, leasing, brokerage, and asset management.",
			},
			{
				id: "healthcare",
				label: "Healthcare",
				description: "Hospitals, clinics, diagnostics, and medical care delivery.",
			},
			{
				id: "education",
				label: "Education",
				description: "Schools, training programs, and workforce skill development.",
			},
			{
				id: "hospitality-tourism",
				label: "Hospitality & Tourism",
				description: "Hotels, restaurants, travel, and leisure experiences.",
			},
			{
				id: "public-administration",
				label: "Public Administration",
				description: "Civil service, local government, and public program delivery.",
			},
			{
				id: "professional-services",
				label: "Professional Services",
				description: "Legal, accounting, consulting, and specialized advisory work.",
			},
			{
				id: "telecommunications",
				label: "Telecommunications",
				description: "Voice, data, and broadband network infrastructure and services.",
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
		color: "blue",
		subSectors: [
			{
				id: "research-development",
				label: "Research & Development",
				description: "Scientific discovery, lab research, and applied innovation.",
			},
			{
				id: "information-technology",
				label: "Information Technology",
				description: "Software, cloud services, and digital platform development.",
			},
			{
				id: "data-analytics",
				label: "Data & Analytics",
				description: "Data science, business intelligence, and predictive modeling.",
			},
			{
				id: "higher-education",
				label: "Higher Education",
				description: "Universities, research institutes, and advanced academic training.",
			},
			{
				id: "media-publishing",
				label: "Media & Publishing",
				description: "News, entertainment, books, and digital content production.",
			},
			{
				id: "biotechnology",
				label: "Biotechnology",
				description: "Genetic engineering, biopharma research, and life-science tools.",
			},
			{
				id: "telecom-rd",
				label: "Telecom R&D",
				description: "Next-generation network research and communications innovation.",
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
		color: "red",
		subSectors: [
			{
				id: "executive-government",
				label: "Executive Government",
				description: "Presidential cabinets, ministries, and senior policy leadership.",
			},
			{
				id: "central-banking",
				label: "Central Banking",
				description: "Monetary policy, currency issuance, and financial system oversight.",
			},
			{
				id: "legislature-judiciary",
				label: "Legislature & Judiciary",
				description: "Lawmaking, constitutional interpretation, and legal authority.",
			},
			{
				id: "corporate-headquarters",
				label: "Corporate Headquarters",
				description: "Multinational strategy, board governance, and capital allocation.",
			},
			{
				id: "international-bodies",
				label: "International Bodies",
				description: "Treaties, global standards, and cross-border economic coordination.",
			},
			{
				id: "strategic-advisory",
				label: "Strategic Advisory",
				description: "Elite think tanks, policy councils, and strategic counsel.",
			},
		],
	},
];

export function getCategory(id: CategoryId): Category | undefined {
	return categories.find((category) => category.id === id);
}

export function getSubSector(
	categoryId: CategoryId,
	sectorId: string,
): SubSector | undefined {
	return getCategory(categoryId)?.subSectors.find(
		(sector) => sector.id === sectorId,
	);
}

export function sectorKey(categoryId: CategoryId, sectorId: string): string {
	return `${categoryId}/${sectorId}`;
}

export const categoryColorClasses: Record<
	string,
	{ bg: string; border: string; text: string; muted: string; mutedText: string }
> = {
	green: {
		bg: "bg-green",
		border: "border-green-muted",
		text: "text-neutral-950",
		muted: "bg-green-muted",
		mutedText: "text-on-dark",
	},
	orange: {
		bg: "bg-orange",
		border: "border-orange-light",
		text: "text-neutral-950",
		muted: "bg-orange-light",
		mutedText: "text-neutral-950",
	},
	cyan: {
		bg: "bg-cyan",
		border: "border-cyan-dark",
		text: "text-neutral-950",
		muted: "bg-cyan-light",
		mutedText: "text-neutral-950",
	},
	blue: {
		bg: "bg-blue",
		border: "border-blue",
		text: "text-on-dark",
		muted: "bg-blue/20",
		mutedText: "text-foreground",
	},
	red: {
		bg: "bg-red",
		border: "border-red-dark",
		text: "text-on-dark",
		muted: "bg-red-dark",
		mutedText: "text-on-dark-muted",
	},
};
