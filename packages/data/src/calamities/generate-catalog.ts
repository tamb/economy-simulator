/**
 * One-shot generator for calamity JSON catalogs. Run:
 *   bun packages/data/src/calamities/generate-catalog.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

type Sev = "minor" | "moderate" | "severe";
type SevMap = Record<Sev, number>;
type SevRange = Record<Sev, [number, number]>;

const sev = (minor: number, moderate: number, severe: number): SevMap => ({
	minor,
	moderate,
	severe,
});

const range = (
	minor: [number, number],
	moderate: [number, number],
	severe: [number, number],
): SevRange => ({ minor, moderate, severe });

const defaultSeverityWeights = sev(50, 35, 15);

function resourceFactors(
	ids: string[],
	minor: number,
	moderate: number,
	severe: number,
) {
	return Object.fromEntries(
		ids.map((id) => [id, sev(minor, moderate, severe)]),
	);
}

function midTerm(
	efficiency: SevMap,
	subSectors: string[],
	happiness: SevMap,
	scope: "regional" | "national" = "regional",
) {
	return {
		extractionEfficiencyFactor: efficiency,
		affectedSubSectors: subSectors,
		happinessPenaltyPerDay: happiness,
		scope,
	};
}

function longTerm(
	efficiency: SevMap,
	subSectors: string[],
	happiness: SevMap,
	scope: "regional" | "national" = "regional",
) {
	return midTerm(efficiency, subSectors, happiness, scope);
}

function immediate(opts: {
	resources?: Record<string, SevMap>;
	env: SevMap;
	degrade?: SevMap;
	mortality?: SevMap;
	emigration?: SevMap;
}) {
	return {
		resourceCapacityFactors: opts.resources,
		environmentDelta: opts.env,
		degradeTerrainChance: opts.degrade ?? sev(0, 0, 0),
		mortalityBump: opts.mortality ?? sev(0, 0, 0),
		emigrationBump: opts.emigration ?? sev(0, 0, 0),
	};
}

const weather = [
	{
		id: "forest_fire",
		name: "Forest Fire",
		description:
			"Wildfire sweeps through woodland, burning timber stands and fouling the air.",
		category: "weather",
		tier: "v1",
		weight: 12,
		severityWeights: defaultSeverityWeights,
		target: {
			terrains: ["forest"],
			requireResources: ["timber"],
			maxRegions: 2,
		},
		midTermDurationDays: range([45, 75], [75, 110], [100, 140]),
		longTermExtraDays: sev(60, 120, 200),
		immediate: immediate({
			resources: resourceFactors(["timber"], 0.85, 0.65, 0.4),
			env: sev(-8, -18, -30),
			degrade: sev(0.05, 0.2, 0.45),
		}),
		midTerm: midTerm(sev(0.9, 0.75, 0.55), ["forestry"], sev(0.4, 0.9, 1.6)),
		longTerm: longTerm(sev(0.95, 0.88, 0.8), ["forestry"], sev(0.1, 0.25, 0.4)),
		cascades: [
			{ calamityId: "wildfire_smoke", chance: 0.55, minSeverity: "moderate" },
			{ calamityId: "accidental_fire", chance: 0.2, minSeverity: "severe" },
		],
	},
	{
		id: "wildfire_smoke",
		name: "Wildfire Smoke",
		description:
			"Smoke from nearby fires blankets the region, irritating lungs and lowering morale.",
		category: "weather",
		tier: "v1.5",
		weight: 6,
		severityWeights: sev(60, 30, 10),
		target: {
			terrains: ["forest", "plains", "hills", "pasture"],
			maxRegions: 3,
		},
		midTermDurationDays: range([21, 35], [35, 55], [50, 70]),
		longTermExtraDays: sev(0, 14, 30),
		immediate: immediate({ env: sev(-3, -7, -12) }),
		midTerm: midTerm(sev(1, 0.97, 0.94), [], sev(0.3, 0.6, 1.0), "national"),
		longTerm: longTerm(sev(1, 1, 1), [], sev(0, 0.1, 0.2), "national"),
	},
	{
		id: "drought",
		name: "Drought",
		description:
			"Rain fails for weeks. Crops wilt and pastures brown under a hard sky.",
		category: "weather",
		tier: "v1",
		weight: 11,
		severityWeights: defaultSeverityWeights,
		target: {
			terrains: ["plains", "pasture", "desert", "clearedLand"],
			requireResources: ["crops", "livestock"],
			maxRegions: 3,
		},
		midTermDurationDays: range([60, 90], [90, 140], [140, 200]),
		longTermExtraDays: sev(90, 160, 280),
		immediate: immediate({
			resources: {
				...resourceFactors(["crops"], 0.8, 0.55, 0.35),
				...resourceFactors(["livestock"], 0.9, 0.7, 0.5),
			},
			env: sev(-6, -14, -24),
		}),
		midTerm: midTerm(
			sev(0.88, 0.7, 0.5),
			["agriculture", "livestock"],
			sev(0.5, 1.0, 1.8),
		),
		longTerm: longTerm(
			sev(0.94, 0.85, 0.75),
			["agriculture", "livestock"],
			sev(0.15, 0.35, 0.6),
		),
		cascades: [
			{ calamityId: "crop_blight", chance: 0.25, minSeverity: "moderate" },
			{ calamityId: "livestock_plague", chance: 0.15, minSeverity: "severe" },
			{ calamityId: "heatwave", chance: 0.35, minSeverity: "moderate" },
		],
	},
	{
		id: "heatwave",
		name: "Heatwave",
		description:
			"Oppressive heat saps workers and livestock across open country.",
		category: "weather",
		tier: "v1",
		weight: 10,
		severityWeights: sev(55, 35, 10),
		target: {
			terrains: ["plains", "pasture", "desert", "clearedLand"],
			maxRegions: 4,
		},
		midTermDurationDays: range([14, 28], [21, 40], [30, 50]),
		longTermExtraDays: sev(0, 7, 14),
		immediate: immediate({ env: sev(-2, -5, -9) }),
		midTerm: midTerm(
			sev(0.95, 0.9, 0.82),
			["agriculture", "livestock", "construction", "utilities"],
			sev(0.4, 0.8, 1.4),
			"national",
		),
		longTerm: longTerm(sev(1, 1, 0.98), [], sev(0, 0, 0.1), "national"),
	},
	{
		id: "flood",
		name: "Flood",
		description:
			"Rivers burst their banks, drowning fields and fouling low ground.",
		category: "weather",
		tier: "v1",
		weight: 10,
		severityWeights: defaultSeverityWeights,
		target: {
			terrains: ["plains", "wetland", "pasture"],
			maxRegions: 2,
		},
		midTermDurationDays: range([30, 60], [60, 100], [90, 140]),
		longTermExtraDays: sev(45, 90, 150),
		immediate: immediate({
			resources: {
				...resourceFactors(["crops"], 0.75, 0.5, 0.3),
				...resourceFactors(["livestock"], 0.85, 0.65, 0.45),
			},
			env: sev(-10, -20, -32),
		}),
		midTerm: midTerm(
			sev(0.85, 0.68, 0.5),
			["agriculture", "livestock", "transport-logistics"],
			sev(0.5, 1.1, 1.8),
		),
		longTerm: longTerm(
			sev(0.93, 0.85, 0.75),
			["agriculture", "livestock"],
			sev(0.1, 0.3, 0.5),
		),
	},
	{
		id: "flash_flood",
		name: "Flash Flood",
		description:
			"Sudden mountain runoff scours valleys and buries roads in debris.",
		category: "weather",
		tier: "v1.5",
		weight: 7,
		severityWeights: sev(55, 35, 10),
		target: {
			terrains: ["mountains", "hills", "plains"],
			maxRegions: 1,
		},
		midTermDurationDays: range([10, 21], [14, 30], [21, 40]),
		longTermExtraDays: sev(7, 21, 40),
		immediate: immediate({
			resources: {
				...resourceFactors(["crops"], 0.9, 0.75, 0.55),
				...resourceFactors(["stone"], 0.95, 0.85, 0.7),
			},
			env: sev(-5, -12, -20),
		}),
		midTerm: midTerm(
			sev(0.92, 0.8, 0.65),
			["agriculture", "quarrying", "transport-logistics"],
			sev(0.3, 0.7, 1.2),
		),
		longTerm: longTerm(sev(0.98, 0.94, 0.9), ["agriculture"], sev(0, 0.1, 0.2)),
	},
	{
		id: "hurricane",
		name: "Hurricane",
		description:
			"A spinning storm hammers the coast with wind, rain, and surge.",
		category: "weather",
		tier: "v1",
		weight: 8,
		severityWeights: sev(40, 40, 20),
		target: { requireCoastal: true, maxRegions: 4 },
		midTermDurationDays: range([45, 75], [75, 110], [100, 150]),
		longTermExtraDays: sev(60, 120, 200),
		immediate: immediate({
			resources: {
				...resourceFactors(["fish"], 0.8, 0.55, 0.35),
				...resourceFactors(["crops"], 0.85, 0.65, 0.45),
				...resourceFactors(["timber"], 0.9, 0.75, 0.55),
			},
			env: sev(-12, -22, -35),
			mortality: sev(0, 0.002, 0.008),
			emigration: sev(0.005, 0.015, 0.04),
		}),
		midTerm: midTerm(
			sev(0.85, 0.7, 0.5),
			["fishing", "agriculture", "transport-logistics", "construction"],
			sev(0.6, 1.2, 2.0),
		),
		longTerm: longTerm(
			sev(0.94, 0.86, 0.78),
			["fishing", "agriculture"],
			sev(0.15, 0.35, 0.55),
		),
		cascades: [
			{ calamityId: "flood", chance: 0.4, minSeverity: "moderate" },
			{ calamityId: "oil_spill", chance: 0.12, minSeverity: "severe" },
		],
	},
	{
		id: "tropical_storm",
		name: "Tropical Storm",
		description: "A lesser coastal storm lashes harbors and fishing fleets.",
		category: "weather",
		tier: "v1",
		weight: 11,
		severityWeights: sev(60, 30, 10),
		target: { requireCoastal: true, maxRegions: 2 },
		midTermDurationDays: range([21, 40], [35, 55], [50, 75]),
		longTermExtraDays: sev(14, 30, 60),
		immediate: immediate({
			resources: resourceFactors(["fish"], 0.9, 0.75, 0.55),
			env: sev(-5, -10, -16),
		}),
		midTerm: midTerm(
			sev(0.92, 0.82, 0.7),
			["fishing", "transport-logistics"],
			sev(0.3, 0.7, 1.2),
		),
		longTerm: longTerm(sev(0.98, 0.94, 0.9), ["fishing"], sev(0, 0.1, 0.2)),
	},
	{
		id: "tornado",
		name: "Tornado",
		description: "A narrow funnel tears through farmland and light structures.",
		category: "weather",
		tier: "v1",
		weight: 9,
		severityWeights: sev(50, 35, 15),
		target: {
			terrains: ["plains", "pasture", "clearedLand"],
			forbidCoastal: true,
			maxRegions: 1,
		},
		midTermDurationDays: range([14, 28], [21, 40], [30, 50]),
		longTermExtraDays: sev(7, 21, 40),
		immediate: immediate({
			resources: resourceFactors(["crops"], 0.85, 0.65, 0.4),
			env: sev(-4, -9, -15),
		}),
		midTerm: midTerm(
			sev(0.9, 0.78, 0.6),
			["agriculture", "construction", "light-manufacturing"],
			sev(0.4, 0.9, 1.5),
		),
		longTerm: longTerm(
			sev(0.98, 0.94, 0.88),
			["agriculture"],
			sev(0, 0.1, 0.25),
		),
	},
	{
		id: "blizzard",
		name: "Blizzard",
		description:
			"Heavy snow and wind shut mountain passes and freeze quarry work.",
		category: "weather",
		tier: "v1.5",
		weight: 7,
		severityWeights: sev(55, 35, 10),
		target: { terrains: ["mountains", "hills"], maxRegions: 2 },
		midTermDurationDays: range([10, 21], [14, 30], [21, 40]),
		longTermExtraDays: sev(0, 7, 14),
		immediate: immediate({ env: sev(-2, -5, -8) }),
		midTerm: midTerm(
			sev(0.88, 0.75, 0.6),
			["mining", "quarrying", "energy", "transport-logistics"],
			sev(0.3, 0.7, 1.2),
		),
		longTerm: longTerm(sev(1, 1, 0.98), [], sev(0, 0, 0.1)),
	},
	{
		id: "hailstorm",
		name: "Hailstorm",
		description: "Ice stones shred standing crops across open plains.",
		category: "weather",
		tier: "v1.5",
		weight: 8,
		severityWeights: sev(55, 35, 10),
		target: {
			terrains: ["plains", "pasture"],
			requireResources: ["crops"],
			maxRegions: 2,
		},
		midTermDurationDays: range([21, 40], [35, 55], [45, 70]),
		longTermExtraDays: sev(7, 21, 40),
		immediate: immediate({
			resources: resourceFactors(["crops"], 0.8, 0.55, 0.35),
			env: sev(-2, -5, -8),
		}),
		midTerm: midTerm(sev(0.9, 0.75, 0.58), ["agriculture"], sev(0.3, 0.7, 1.2)),
		longTerm: longTerm(sev(0.98, 0.94, 0.9), ["agriculture"], sev(0, 0.1, 0.2)),
	},
	{
		id: "landslide",
		name: "Landslide",
		description:
			"A slope gives way, burying roads, timber stands, and mine mouths.",
		category: "weather",
		tier: "v1",
		weight: 8,
		severityWeights: defaultSeverityWeights,
		target: {
			terrains: ["mountains", "hills", "forest"],
			maxRegions: 1,
		},
		midTermDurationDays: range([30, 55], [55, 90], [80, 120]),
		longTermExtraDays: sev(40, 80, 140),
		immediate: immediate({
			resources: {
				...resourceFactors(["timber"], 0.9, 0.7, 0.5),
				...resourceFactors(["metalOre"], 0.9, 0.7, 0.5),
				...resourceFactors(["stone"], 0.85, 0.65, 0.45),
			},
			env: sev(-8, -16, -26),
			degrade: sev(0.05, 0.15, 0.35),
		}),
		midTerm: midTerm(
			sev(0.85, 0.7, 0.5),
			["forestry", "mining", "quarrying", "transport-logistics"],
			sev(0.4, 0.9, 1.5),
		),
		longTerm: longTerm(
			sev(0.94, 0.86, 0.78),
			["forestry", "mining", "quarrying"],
			sev(0.1, 0.25, 0.4),
		),
	},
	{
		id: "volcanic_ash",
		name: "Volcanic Ash",
		description:
			"Ash falls from a distant eruption, smothering crops and clogging lungs.",
		category: "weather",
		tier: "v2",
		weight: 3,
		severityWeights: sev(40, 40, 20),
		target: { terrains: ["mountains", "hills", "plains"], maxRegions: 3 },
		midTermDurationDays: range([60, 100], [100, 150], [140, 200]),
		longTermExtraDays: sev(90, 160, 250),
		immediate: immediate({
			resources: resourceFactors(["crops"], 0.7, 0.45, 0.25),
			env: sev(-10, -20, -32),
		}),
		midTerm: midTerm(
			sev(0.85, 0.68, 0.48),
			["agriculture", "transport-logistics", "livestock"],
			sev(0.5, 1.1, 1.8),
			"national",
		),
		longTerm: longTerm(
			sev(0.96, 0.9, 0.85),
			["agriculture"],
			sev(0.1, 0.2, 0.35),
		),
	},
];

const geological = [
	{
		id: "earthquake",
		name: "Earthquake",
		description:
			"The ground heaves. Mines crack, quarries slide, and buildings shudder.",
		category: "geological",
		tier: "v1",
		weight: 7,
		severityWeights: sev(45, 40, 15),
		target: {
			terrains: ["mountains", "hills", "plains", "forest", "desert"],
			maxRegions: 2,
		},
		midTermDurationDays: range([60, 100], [100, 150], [140, 200]),
		longTermExtraDays: sev(80, 140, 220),
		immediate: immediate({
			resources: {
				...resourceFactors(["metalOre"], 0.9, 0.7, 0.45),
				...resourceFactors(["stone"], 0.88, 0.68, 0.45),
				...resourceFactors(["fossilFuels"], 0.92, 0.78, 0.55),
			},
			env: sev(-6, -14, -24),
			degrade: sev(0.02, 0.1, 0.28),
			mortality: sev(0, 0.003, 0.012),
			emigration: sev(0.005, 0.02, 0.05),
		}),
		midTerm: midTerm(
			sev(0.88, 0.72, 0.52),
			["mining", "quarrying", "energy", "construction"],
			sev(0.5, 1.1, 1.9),
		),
		longTerm: longTerm(
			sev(0.95, 0.88, 0.8),
			["mining", "quarrying", "energy"],
			sev(0.1, 0.3, 0.5),
		),
		cascades: [
			{
				calamityId: "aftershock_cluster",
				chance: 0.45,
				minSeverity: "moderate",
			},
			{ calamityId: "tsunami", chance: 0.25, minSeverity: "severe" },
			{ calamityId: "mine_collapse", chance: 0.3, minSeverity: "moderate" },
		],
	},
	{
		id: "aftershock_cluster",
		name: "Aftershock Cluster",
		description:
			"Repeated tremors prolong the quake's damage and keep nerves frayed.",
		category: "geological",
		tier: "v1.5",
		weight: 4,
		severityWeights: sev(50, 35, 15),
		target: {
			terrains: ["mountains", "hills", "plains"],
			maxRegions: 2,
		},
		midTermDurationDays: range([21, 40], [40, 70], [60, 100]),
		longTermExtraDays: sev(21, 45, 80),
		immediate: immediate({
			resources: resourceFactors(["metalOre", "stone"], 0.95, 0.85, 0.7),
			env: sev(-3, -7, -12),
		}),
		midTerm: midTerm(
			sev(0.92, 0.82, 0.7),
			["mining", "quarrying", "construction"],
			sev(0.4, 0.8, 1.3),
		),
		longTerm: longTerm(sev(0.98, 0.94, 0.9), ["mining"], sev(0, 0.15, 0.3)),
	},
	{
		id: "tsunami",
		name: "Tsunami",
		description:
			"A wall of water smashes the coast, wrecking fleets and shoreline works.",
		category: "geological",
		tier: "v1",
		weight: 5,
		severityWeights: sev(35, 40, 25),
		target: { requireCoastal: true, maxRegions: 3 },
		midTermDurationDays: range([75, 110], [110, 160], [150, 210]),
		longTermExtraDays: sev(100, 180, 280),
		immediate: immediate({
			resources: {
				...resourceFactors(["fish"], 0.7, 0.4, 0.2),
				...resourceFactors(["crops"], 0.85, 0.65, 0.4),
			},
			env: sev(-15, -28, -40),
			mortality: sev(0.002, 0.01, 0.03),
			emigration: sev(0.01, 0.03, 0.08),
		}),
		midTerm: midTerm(
			sev(0.8, 0.6, 0.4),
			["fishing", "transport-logistics", "construction", "agriculture"],
			sev(0.7, 1.4, 2.2),
		),
		longTerm: longTerm(
			sev(0.9, 0.8, 0.7),
			["fishing", "agriculture"],
			sev(0.2, 0.4, 0.7),
		),
	},
	{
		id: "coastal_erosion",
		name: "Coastal Erosion",
		description:
			"The sea steadily eats the shoreline, nibbling harbors and fishing grounds.",
		category: "geological",
		tier: "v2",
		weight: 6,
		severityWeights: sev(60, 30, 10),
		target: { requireCoastal: true, maxRegions: 2 },
		midTermDurationDays: range([90, 140], [140, 200], [180, 260]),
		longTermExtraDays: sev(120, 200, 320),
		immediate: immediate({
			resources: resourceFactors(["fish", "stone"], 0.95, 0.88, 0.78),
			env: sev(-4, -8, -14),
		}),
		midTerm: midTerm(
			sev(0.94, 0.88, 0.8),
			["fishing", "quarrying"],
			sev(0.2, 0.45, 0.8),
		),
		longTerm: longTerm(
			sev(0.96, 0.9, 0.84),
			["fishing", "quarrying"],
			sev(0.1, 0.2, 0.35),
		),
	},
	{
		id: "sinkhole",
		name: "Sinkhole",
		description:
			"Ground collapses into a void, swallowing quarry faces and access roads.",
		category: "geological",
		tier: "v1.5",
		weight: 5,
		severityWeights: defaultSeverityWeights,
		target: {
			terrains: ["hills", "mountains", "plains"],
			requireResources: ["stone", "metalOre"],
			maxRegions: 1,
		},
		midTermDurationDays: range([30, 55], [55, 90], [80, 120]),
		longTermExtraDays: sev(60, 120, 200),
		immediate: immediate({
			resources: {
				...resourceFactors(["stone"], 0.85, 0.6, 0.35),
				...resourceFactors(["metalOre"], 0.9, 0.7, 0.45),
			},
			env: sev(-5, -12, -20),
			degrade: sev(0.05, 0.2, 0.4),
		}),
		midTerm: midTerm(
			sev(0.85, 0.7, 0.5),
			["quarrying", "mining"],
			sev(0.4, 0.9, 1.5),
		),
		longTerm: longTerm(
			sev(0.92, 0.84, 0.75),
			["quarrying", "mining"],
			sev(0.1, 0.25, 0.4),
		),
	},
	{
		id: "mine_collapse",
		name: "Mine Collapse",
		description: "Tunnels fail. Ore access is lost and miners flee the dark.",
		category: "geological",
		tier: "v1",
		weight: 7,
		severityWeights: defaultSeverityWeights,
		target: {
			terrains: ["mountains", "hills"],
			requireResources: ["metalOre"],
			maxRegions: 1,
		},
		midTermDurationDays: range([60, 100], [100, 160], [140, 200]),
		longTermExtraDays: sev(80, 140, 220),
		immediate: immediate({
			resources: resourceFactors(["metalOre"], 0.8, 0.55, 0.3),
			env: sev(-6, -14, -22),
			mortality: sev(0.001, 0.005, 0.015),
			emigration: sev(0.005, 0.015, 0.035),
		}),
		midTerm: midTerm(sev(0.8, 0.6, 0.4), ["mining"], sev(0.5, 1.1, 1.8)),
		longTerm: longTerm(sev(0.9, 0.8, 0.7), ["mining"], sev(0.15, 0.35, 0.55)),
	},
	{
		id: "well_blowout",
		name: "Well Blowout",
		description:
			"A fuel well erupts uncontrolled, wasting reserves and poisoning ground.",
		category: "geological",
		tier: "v1",
		weight: 5,
		severityWeights: sev(40, 40, 20),
		target: {
			terrains: ["mountains", "hills", "desert", "plains"],
			requireResources: ["fossilFuels"],
			maxRegions: 1,
		},
		midTermDurationDays: range([60, 100], [100, 150], [140, 200]),
		longTermExtraDays: sev(100, 180, 280),
		immediate: immediate({
			resources: resourceFactors(["fossilFuels"], 0.75, 0.5, 0.25),
			env: sev(-14, -26, -40),
		}),
		midTerm: midTerm(
			sev(0.82, 0.65, 0.45),
			["energy", "heavy-industry"],
			sev(0.5, 1.2, 2.0),
		),
		longTerm: longTerm(sev(0.92, 0.84, 0.75), ["energy"], sev(0.2, 0.4, 0.65)),
		cascades: [
			{ calamityId: "oil_spill", chance: 0.35, minSeverity: "moderate" },
		],
	},
];

const biological = [
	{
		id: "disease",
		name: "Disease Outbreak",
		description:
			"Illness spreads through settlements, thinning labor and fraying nerves.",
		category: "biological",
		tier: "v1",
		weight: 9,
		severityWeights: sev(45, 40, 15),
		target: { maxRegions: 4 },
		midTermDurationDays: range([90, 140], [140, 210], [180, 280]),
		longTermExtraDays: sev(60, 120, 180),
		immediate: immediate({
			env: sev(-2, -5, -10),
			mortality: sev(0.005, 0.015, 0.04),
			emigration: sev(0.01, 0.03, 0.07),
		}),
		midTerm: midTerm(sev(0.95, 0.88, 0.78), [], sev(0.6, 1.3, 2.2), "national"),
		longTerm: longTerm(
			sev(0.98, 0.95, 0.9),
			[],
			sev(0.15, 0.35, 0.6),
			"national",
		),
	},
	{
		id: "livestock_plague",
		name: "Livestock Plague",
		description: "A contagion tears through herds and flocks.",
		category: "biological",
		tier: "v1",
		weight: 8,
		severityWeights: defaultSeverityWeights,
		target: {
			terrains: ["pasture", "plains"],
			requireResources: ["livestock"],
			maxRegions: 3,
		},
		midTermDurationDays: range([75, 120], [120, 180], [160, 230]),
		longTermExtraDays: sev(90, 160, 240),
		immediate: immediate({
			resources: resourceFactors(["livestock"], 0.7, 0.4, 0.2),
			env: sev(-3, -7, -12),
		}),
		midTerm: midTerm(
			sev(0.8, 0.6, 0.4),
			["livestock", "food-processing"],
			sev(0.5, 1.1, 1.8),
		),
		longTerm: longTerm(
			sev(0.9, 0.8, 0.7),
			["livestock"],
			sev(0.15, 0.35, 0.55),
		),
	},
	{
		id: "crop_blight",
		name: "Crop Blight",
		description: "Fungus and rot sweep the fields before harvest.",
		category: "biological",
		tier: "v1",
		weight: 9,
		severityWeights: defaultSeverityWeights,
		target: {
			terrains: ["plains", "wetland", "pasture"],
			requireResources: ["crops"],
			maxRegions: 3,
		},
		midTermDurationDays: range([60, 100], [100, 150], [140, 200]),
		longTermExtraDays: sev(70, 130, 200),
		immediate: immediate({
			resources: resourceFactors(["crops"], 0.7, 0.4, 0.2),
			env: sev(-3, -7, -12),
		}),
		midTerm: midTerm(
			sev(0.8, 0.6, 0.4),
			["agriculture", "food-processing"],
			sev(0.5, 1.1, 1.8),
		),
		longTerm: longTerm(
			sev(0.9, 0.8, 0.7),
			["agriculture"],
			sev(0.15, 0.35, 0.55),
		),
	},
	{
		id: "fishery_collapse",
		name: "Fishery Collapse",
		description:
			"Coastal stocks crash — empty nets and idle boats along the shore.",
		category: "biological",
		tier: "v1",
		weight: 7,
		severityWeights: defaultSeverityWeights,
		target: { requireCoastal: true, requireResources: ["fish"], maxRegions: 3 },
		midTermDurationDays: range([90, 140], [140, 200], [180, 260]),
		longTermExtraDays: sev(120, 200, 300),
		immediate: immediate({
			resources: resourceFactors(["fish"], 0.65, 0.35, 0.15),
			env: sev(-5, -12, -20),
		}),
		midTerm: midTerm(sev(0.75, 0.55, 0.35), ["fishing"], sev(0.5, 1.1, 1.8)),
		longTerm: longTerm(sev(0.88, 0.78, 0.65), ["fishing"], sev(0.2, 0.4, 0.65)),
	},
	{
		id: "insect_swarm",
		name: "Insect Swarm",
		description: "Clouds of pests strip leaves and grain from the fields.",
		category: "biological",
		tier: "v1.5",
		weight: 8,
		severityWeights: sev(55, 35, 10),
		target: {
			terrains: ["plains", "pasture", "wetland"],
			requireResources: ["crops"],
			maxRegions: 2,
		},
		midTermDurationDays: range([30, 55], [50, 80], [70, 100]),
		longTermExtraDays: sev(14, 40, 70),
		immediate: immediate({
			resources: resourceFactors(["crops"], 0.8, 0.55, 0.35),
			env: sev(-2, -5, -9),
		}),
		midTerm: midTerm(
			sev(0.88, 0.72, 0.55),
			["agriculture"],
			sev(0.3, 0.7, 1.2),
		),
		longTerm: longTerm(sev(0.98, 0.94, 0.9), ["agriculture"], sev(0, 0.1, 0.2)),
	},
	{
		id: "invasive_species",
		name: "Invasive Species",
		description:
			"An outsider species takes root, quietly taxing forests, farms, or shores.",
		category: "biological",
		tier: "v2",
		weight: 5,
		severityWeights: sev(55, 35, 10),
		target: {
			terrains: ["forest", "plains", "wetland", "pasture"],
			maxRegions: 3,
		},
		midTermDurationDays: range([120, 180], [180, 250], [220, 300]),
		longTermExtraDays: sev(150, 250, 360),
		immediate: immediate({
			resources: {
				...resourceFactors(["timber"], 0.95, 0.88, 0.8),
				...resourceFactors(["crops"], 0.95, 0.88, 0.8),
				...resourceFactors(["fish"], 0.95, 0.88, 0.8),
			},
			env: sev(-3, -7, -12),
		}),
		midTerm: midTerm(
			sev(0.94, 0.88, 0.8),
			["forestry", "agriculture", "fishing"],
			sev(0.2, 0.45, 0.8),
		),
		longTerm: longTerm(
			sev(0.96, 0.9, 0.84),
			["forestry", "agriculture", "fishing"],
			sev(0.1, 0.25, 0.4),
		),
	},
	{
		id: "red_tide",
		name: "Red Tide",
		description:
			"Toxic algal bloom stains coastal waters and kills fish in droves.",
		category: "biological",
		tier: "v1.5",
		weight: 6,
		severityWeights: defaultSeverityWeights,
		target: { requireCoastal: true, maxRegions: 2 },
		midTermDurationDays: range([45, 75], [75, 110], [100, 150]),
		longTermExtraDays: sev(40, 80, 130),
		immediate: immediate({
			resources: resourceFactors(["fish"], 0.75, 0.5, 0.3),
			env: sev(-8, -16, -26),
		}),
		midTerm: midTerm(sev(0.85, 0.7, 0.5), ["fishing"], sev(0.4, 0.9, 1.5)),
		longTerm: longTerm(sev(0.94, 0.88, 0.8), ["fishing"], sev(0.1, 0.25, 0.4)),
	},
];

const human = [
	{
		id: "accidental_fire",
		name: "Accidental Fire",
		description:
			"A careless blaze guts workshops and homes before brigades contain it.",
		category: "human",
		tier: "v1",
		weight: 14,
		severityWeights: sev(65, 28, 7),
		target: { maxRegions: 1 },
		midTermDurationDays: range([10, 21], [14, 30], [21, 40]),
		longTermExtraDays: sev(0, 7, 14),
		immediate: immediate({
			env: sev(-2, -5, -9),
		}),
		midTerm: midTerm(
			sev(0.95, 0.88, 0.78),
			["light-manufacturing", "construction", "wholesale-retail"],
			sev(0.3, 0.7, 1.2),
		),
		longTerm: longTerm(sev(1, 1, 0.98), [], sev(0, 0, 0.1)),
	},
	{
		id: "factory_fire",
		name: "Factory Fire",
		description:
			"Industrial plant burns, idling lines and scattering ash over the yard.",
		category: "human",
		tier: "v1",
		weight: 10,
		severityWeights: sev(55, 35, 10),
		target: { maxRegions: 1 },
		midTermDurationDays: range([21, 40], [40, 70], [60, 100]),
		longTermExtraDays: sev(14, 40, 70),
		immediate: immediate({ env: sev(-4, -9, -15) }),
		midTerm: midTerm(
			sev(0.9, 0.78, 0.6),
			["light-manufacturing", "food-processing", "heavy-industry"],
			sev(0.4, 0.9, 1.5),
		),
		longTerm: longTerm(
			sev(0.98, 0.94, 0.9),
			["light-manufacturing"],
			sev(0, 0.1, 0.2),
		),
	},
	{
		id: "warehouse_fire",
		name: "Warehouse Fire",
		description: "Stored goods go up in smoke, jolting trade and local supply.",
		category: "human",
		tier: "v1.5",
		weight: 9,
		severityWeights: sev(60, 30, 10),
		target: { maxRegions: 1 },
		midTermDurationDays: range([14, 28], [21, 40], [30, 55]),
		longTermExtraDays: sev(0, 14, 30),
		immediate: immediate({ env: sev(-2, -5, -8) }),
		midTerm: midTerm(
			sev(0.95, 0.9, 0.82),
			["wholesale-retail", "transport-logistics"],
			sev(0.3, 0.7, 1.2),
		),
		longTerm: longTerm(sev(1, 1, 0.98), [], sev(0, 0, 0.1)),
	},
	{
		id: "oil_spill",
		name: "Oil Spill",
		description:
			"Fuel slicks the coast, killing fish and staining the shoreline for seasons.",
		category: "human",
		tier: "v1",
		weight: 5,
		severityWeights: sev(40, 40, 20),
		target: { requireCoastal: true, maxRegions: 2 },
		midTermDurationDays: range([100, 150], [150, 220], [200, 280]),
		longTermExtraDays: sev(140, 220, 340),
		immediate: immediate({
			resources: resourceFactors(["fish"], 0.7, 0.4, 0.2),
			env: sev(-16, -30, -45),
		}),
		midTerm: midTerm(
			sev(0.8, 0.6, 0.4),
			["fishing", "energy", "transport-logistics"],
			sev(0.6, 1.3, 2.1),
		),
		longTerm: longTerm(
			sev(0.9, 0.8, 0.7),
			["fishing", "energy"],
			sev(0.25, 0.5, 0.8),
		),
	},
	{
		id: "chemical_spill",
		name: "Chemical Spill",
		description: "Industrial toxins leak into soil and water near plant yards.",
		category: "human",
		tier: "v1.5",
		weight: 6,
		severityWeights: defaultSeverityWeights,
		target: { maxRegions: 1 },
		midTermDurationDays: range([60, 100], [100, 150], [140, 200]),
		longTermExtraDays: sev(90, 160, 240),
		immediate: immediate({
			env: sev(-12, -24, -36),
			emigration: sev(0.005, 0.015, 0.04),
		}),
		midTerm: midTerm(
			sev(0.88, 0.75, 0.58),
			["heavy-industry", "pharmaceuticals", "utilities"],
			sev(0.5, 1.2, 2.0),
		),
		longTerm: longTerm(
			sev(0.94, 0.88, 0.8),
			["heavy-industry"],
			sev(0.15, 0.35, 0.55),
		),
	},
	{
		id: "dam_failure",
		name: "Dam Failure",
		description:
			"A reservoir wall fails, flooding valleys and wrecking water works.",
		category: "human",
		tier: "v2",
		weight: 3,
		severityWeights: sev(35, 40, 25),
		target: {
			terrains: ["plains", "wetland", "hills"],
			maxRegions: 2,
		},
		midTermDurationDays: range([75, 120], [120, 180], [160, 230]),
		longTermExtraDays: sev(100, 180, 280),
		immediate: immediate({
			resources: {
				...resourceFactors(["crops"], 0.7, 0.4, 0.2),
				...resourceFactors(["livestock"], 0.8, 0.55, 0.35),
			},
			env: sev(-14, -26, -38),
			mortality: sev(0.002, 0.008, 0.02),
			emigration: sev(0.01, 0.03, 0.06),
		}),
		midTerm: midTerm(
			sev(0.8, 0.6, 0.4),
			["agriculture", "livestock", "utilities", "construction"],
			sev(0.7, 1.4, 2.2),
		),
		longTerm: longTerm(
			sev(0.9, 0.8, 0.7),
			["agriculture", "utilities"],
			sev(0.2, 0.4, 0.65),
		),
	},
	{
		id: "power_outage",
		name: "Power Outage",
		description:
			"The grid falters. Factories idle and services stumble in the dark.",
		category: "human",
		tier: "v1.5",
		weight: 11,
		severityWeights: sev(60, 30, 10),
		target: { maxRegions: 3 },
		midTermDurationDays: range([7, 18], [14, 35], [28, 50]),
		longTermExtraDays: sev(0, 7, 14),
		immediate: immediate({ env: sev(0, -1, -3) }),
		midTerm: midTerm(
			sev(0.92, 0.82, 0.7),
			[
				"utilities",
				"heavy-industry",
				"light-manufacturing",
				"electronics-machinery",
				"financial-services",
			],
			sev(0.4, 0.9, 1.5),
			"national",
		),
		longTerm: longTerm(sev(1, 1, 0.98), [], sev(0, 0, 0.1), "national"),
	},
	{
		id: "bridge_collapse",
		name: "Bridge Collapse",
		description: "A key crossing fails, snarling freight and regional travel.",
		category: "human",
		tier: "v2",
		weight: 4,
		severityWeights: defaultSeverityWeights,
		target: { maxRegions: 1 },
		midTermDurationDays: range([45, 75], [75, 120], [110, 160]),
		longTermExtraDays: sev(30, 60, 100),
		immediate: immediate({ env: sev(-1, -3, -5) }),
		midTerm: midTerm(
			sev(0.9, 0.8, 0.65),
			["transport-logistics", "construction", "wholesale-retail"],
			sev(0.3, 0.7, 1.2),
		),
		longTerm: longTerm(
			sev(0.98, 0.94, 0.9),
			["transport-logistics"],
			sev(0, 0.1, 0.2),
		),
	},
	{
		id: "mining_accident",
		name: "Mining Accident",
		description:
			"A shaft disaster halts production and shakes mining communities.",
		category: "human",
		tier: "v1",
		weight: 8,
		severityWeights: sev(55, 35, 10),
		target: {
			terrains: ["mountains", "hills"],
			requireResources: ["metalOre", "fossilFuels"],
			maxRegions: 1,
		},
		midTermDurationDays: range([21, 40], [40, 70], [60, 100]),
		longTermExtraDays: sev(14, 40, 70),
		immediate: immediate({
			resources: resourceFactors(["metalOre", "fossilFuels"], 0.95, 0.88, 0.75),
			env: sev(-3, -7, -12),
			mortality: sev(0.001, 0.004, 0.01),
		}),
		midTerm: midTerm(
			sev(0.88, 0.75, 0.58),
			["mining", "energy"],
			sev(0.4, 0.9, 1.5),
		),
		longTerm: longTerm(sev(0.98, 0.94, 0.9), ["mining"], sev(0, 0.1, 0.2)),
	},
	{
		id: "overfishing_scandal",
		name: "Overfishing Scandal",
		description: "Public outrage forces a hard throttle on coastal fleets.",
		category: "human",
		tier: "v2",
		weight: 4,
		severityWeights: sev(50, 35, 15),
		target: { requireCoastal: true, requireResources: ["fish"], maxRegions: 2 },
		midTermDurationDays: range([45, 75], [75, 110], [100, 150]),
		longTermExtraDays: sev(30, 60, 100),
		immediate: immediate({
			resources: resourceFactors(["fish"], 0.9, 0.8, 0.65),
			env: sev(0, 2, 4),
			emigration: sev(0, 0.005, 0.015),
		}),
		midTerm: midTerm(sev(0.7, 0.5, 0.35), ["fishing"], sev(0.3, 0.7, 1.2)),
		longTerm: longTerm(sev(0.92, 0.85, 0.78), ["fishing"], sev(0.1, 0.2, 0.35)),
	},
];

const social = [
	{
		id: "labor_strike",
		name: "Labor Strike",
		description:
			"Workers walk out of a key sector, freezing output until tempers cool.",
		category: "social",
		tier: "v2",
		weight: 7,
		severityWeights: sev(55, 35, 10),
		target: { maxRegions: 2 },
		midTermDurationDays: range([14, 30], [21, 45], [35, 60]),
		longTermExtraDays: sev(0, 14, 30),
		immediate: immediate({ env: sev(0, 0, 0) }),
		midTerm: midTerm(
			sev(0.7, 0.45, 0.25),
			[
				"heavy-industry",
				"transport-logistics",
				"mining",
				"construction",
				"utilities",
			],
			sev(0.4, 0.9, 1.5),
			"national",
		),
		longTerm: longTerm(sev(1, 0.98, 0.95), [], sev(0, 0.1, 0.2), "national"),
	},
	{
		id: "food_riot",
		name: "Food Riot",
		description:
			"Hunger and anger spill into the streets after shortages bite.",
		category: "social",
		tier: "v2",
		weight: 5,
		severityWeights: sev(45, 40, 15),
		target: { maxRegions: 3 },
		midTermDurationDays: range([14, 30], [21, 45], [35, 60]),
		longTermExtraDays: sev(14, 30, 50),
		immediate: immediate({
			env: sev(-1, -3, -5),
			emigration: sev(0.01, 0.03, 0.06),
		}),
		midTerm: midTerm(
			sev(0.95, 0.9, 0.82),
			["wholesale-retail", "food-processing", "agriculture"],
			sev(0.8, 1.6, 2.4),
			"national",
		),
		longTerm: longTerm(sev(1, 0.98, 0.95), [], sev(0.2, 0.4, 0.7), "national"),
	},
	{
		id: "bank_panic",
		name: "Bank Panic",
		description:
			"Depositors rush the banks; credit freezes and services seize up.",
		category: "social",
		tier: "v2",
		weight: 4,
		severityWeights: sev(50, 35, 15),
		target: { maxRegions: 2 },
		midTermDurationDays: range([21, 40], [40, 70], [60, 100]),
		longTermExtraDays: sev(21, 45, 80),
		immediate: immediate({ env: sev(0, 0, 0) }),
		midTerm: midTerm(
			sev(0.95, 0.9, 0.82),
			["financial-services", "real-estate", "wholesale-retail"],
			sev(0.5, 1.1, 1.8),
			"national",
		),
		longTerm: longTerm(sev(1, 0.98, 0.95), [], sev(0.1, 0.25, 0.4), "national"),
	},
	{
		id: "plague_of_corruption",
		name: "Plague of Corruption",
		description: "Graft and favoritism sap administration and public trust.",
		category: "social",
		tier: "v2",
		weight: 4,
		severityWeights: sev(55, 35, 10),
		target: { maxRegions: 4 },
		midTermDurationDays: range([60, 100], [100, 150], [140, 200]),
		longTermExtraDays: sev(60, 120, 180),
		immediate: immediate({ env: sev(0, -1, -2) }),
		midTerm: midTerm(sev(0.94, 0.88, 0.8), [], sev(0.3, 0.7, 1.2), "national"),
		longTerm: longTerm(
			sev(0.98, 0.95, 0.9),
			[],
			sev(0.1, 0.25, 0.4),
			"national",
		),
	},
];

const catalogs = {
	weather,
	geological,
	biological,
	human,
	social,
} as const;

const root = dirname(fileURLToPath(import.meta.url));
const outDir = join(root, "catalog");
mkdirSync(outDir, { recursive: true });

for (const [name, entries] of Object.entries(catalogs)) {
	const path = join(outDir, `${name}.json`);
	writeFileSync(path, `${JSON.stringify(entries, null, "\t")}\n`, "utf8");
	console.log(`wrote ${path} (${entries.length})`);
}

const all = Object.values(catalogs).flat();
console.log(`total calamities: ${all.length}`);
