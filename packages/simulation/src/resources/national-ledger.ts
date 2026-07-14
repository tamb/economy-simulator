import {
	type GameSettings,
	gameSettings,
	getResourceRequirement,
	type ResourceId,
} from "economy-simulator-data";

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

interface RegionalProduction {
	resourceId: ResourceId;
	/** Region that produced this amount (optional for legacy flat totals). */
	regionId?: string;
	/** This region-year's extraction yield for this resource (see `computeExtractionYield`). */
	amount: number;
}

interface NationalLedgerInput {
	/** Every region's extraction output for the year, flattened (one entry per region-resource pair with nonzero production). */
	production: RegionalProduction[];
	/** Industrial sub-sector id -> assigned worker count. */
	industrialWorkersBySubSector: Record<string, number>;
	/**
	 * Prior-year national stockpile by resource (Phase 0c). Missing keys
	 * start at 0. After demand is met from production + stock, surplus
	 * carries forward into `ResourceLedgerEntry.stockpile`.
	 */
	priorStockpileByResource?: Partial<Record<ResourceId, number>>;
	/**
	 * Optional post-flow effective production by resource (Phase 0d). When
	 * set, replaces raw production totals for sufficiency / stockpile fill.
	 */
	effectiveProductionByResource?: Partial<Record<ResourceId, number>>;
}

interface ResourceLedgerEntry {
	resourceId: ResourceId;
	production: number;
	demand: number;
	/** `available / demand` where available = production + stock drawn; Infinity when demand is 0. */
	sufficiency: number;
	/** Carry-over stock after this year's fill/draw. */
	stockpile?: number;
	/** Units drawn from prior stockpile to cover demand this year. */
	stockpileDrawn?: number;
	/** Units added to stock from surplus production this year. */
	stockpileAdded?: number;
	/**
	 * Soft coverage signal: `stockpile / (demand / daysPerYear)`.
	 * Null when demand is 0.
	 */
	coverageDays?: number | null;
}

interface NationalLedger {
	resources: ResourceLedgerEntry[];
	/** Industrial sub-sector id -> daily happiness penalty for its workers, driven by its most-constrained required resource (Liebig's-law-style bottleneck). 0 when every required resource is sufficient. */
	shortfallHappinessPenaltyBySubSector: Record<string, number>;
	/** Snapshot of ending stockpile levels for persistence into the next year. */
	stockpileByResource?: Partial<Record<ResourceId, number>>;
}

/**
 * Aggregates regional extraction into national production, compares it
 * against industrial demand (sub-sector worker count x
 * `economy-simulator-data`'s `resource-requirements`), draws/fills national
 * stockpiles, and derives a per-sub-sector shortfall happiness penalty. See
 * research/resources-and-geography.md §5.2 and
 * research/stockpiles-flows-and-regional-employment.md §1.
 */
function computeNationalLedger(
	input: NationalLedgerInput,
	settings: GameSettings = gameSettings,
): NationalLedger {
	const productionByResource = new Map<ResourceId, number>();
	for (const entry of input.production) {
		productionByResource.set(
			entry.resourceId,
			(productionByResource.get(entry.resourceId) ?? 0) + entry.amount,
		);
	}

	if (input.effectiveProductionByResource) {
		for (const [resourceId, amount] of Object.entries(
			input.effectiveProductionByResource,
		) as [ResourceId, number][]) {
			productionByResource.set(resourceId, amount);
		}
	}

	const demandByResource = new Map<ResourceId, number>();
	const demandBySubSectorAndResource = new Map<
		string,
		Partial<Record<ResourceId, number>>
	>();

	for (const [subSectorId, workers] of Object.entries(
		input.industrialWorkersBySubSector,
	)) {
		const requirement = getResourceRequirement(subSectorId);
		if (!requirement || workers <= 0) continue;

		const perResource: Partial<Record<ResourceId, number>> = {};
		for (const [resourceId, perWorkerAmount] of Object.entries(
			requirement.inputs,
		) as [ResourceId, number][]) {
			const amount = perWorkerAmount * workers;
			demandByResource.set(
				resourceId,
				(demandByResource.get(resourceId) ?? 0) + amount,
			);
			perResource[resourceId] = amount;
		}
		demandBySubSectorAndResource.set(subSectorId, perResource);
	}

	const resourceIds = new Set([
		...productionByResource.keys(),
		...demandByResource.keys(),
		...Object.keys(input.priorStockpileByResource ?? {}),
	]) as Set<ResourceId>;

	const sufficiencyByResource = new Map<ResourceId, number>();
	const stockpileByResource: Partial<Record<ResourceId, number>> = {};
	const daysPerYear = settings.calendar.daysPerYear;

	const resources: ResourceLedgerEntry[] = [...resourceIds].map(
		(resourceId) => {
			const production = productionByResource.get(resourceId) ?? 0;
			const demand = demandByResource.get(resourceId) ?? 0;
			const prior = Math.max(
				0,
				input.priorStockpileByResource?.[resourceId] ?? 0,
			);

			const fromProduction = Math.min(production, demand);
			const remainingDemand = Math.max(0, demand - fromProduction);
			const stockpileDrawn = Math.min(prior, remainingDemand);
			const available = production + stockpileDrawn;
			const surplus = Math.max(0, production - demand);
			const stockpile = prior - stockpileDrawn + surplus;
			const stockpileAdded = surplus;

			const sufficiency =
				demand <= 0 ? Number.POSITIVE_INFINITY : available / demand;
			sufficiencyByResource.set(resourceId, sufficiency);
			stockpileByResource[resourceId] = stockpile;

			const coverageDays =
				demand <= 0 ? null : stockpile / (demand / daysPerYear);

			return {
				resourceId,
				production,
				demand,
				sufficiency,
				stockpile,
				stockpileDrawn,
				stockpileAdded,
				coverageDays,
			};
		},
	);

	const { sufficiencyThreshold, maxShortfallHappinessPenaltyPerDay } =
		settings.resources.ledger;

	const shortfallHappinessPenaltyBySubSector: Record<string, number> = {};
	for (const [subSectorId, perResource] of demandBySubSectorAndResource) {
		const requiredResourceIds = Object.keys(perResource) as ResourceId[];
		const worstSufficiency = requiredResourceIds.reduce((worst, resourceId) => {
			const sufficiency =
				sufficiencyByResource.get(resourceId) ?? Number.POSITIVE_INFINITY;
			return Math.min(worst, sufficiency);
		}, Number.POSITIVE_INFINITY);

		const shortfallShare =
			worstSufficiency >= sufficiencyThreshold
				? 0
				: clamp(1 - worstSufficiency / sufficiencyThreshold, 0, 1);

		shortfallHappinessPenaltyBySubSector[subSectorId] =
			shortfallShare * maxShortfallHappinessPenaltyPerDay;
	}

	return {
		resources,
		shortfallHappinessPenaltyBySubSector,
		stockpileByResource,
	};
}

/**
 * Apply calamity onset stockpile losses. Returns the next stockpile map.
 */
function applyCalamityStockpileLoss(
	stockpileByResource: Partial<Record<ResourceId, number>>,
	severity: "minor" | "moderate" | "severe",
	settings: GameSettings = gameSettings,
): Partial<Record<ResourceId, number>> {
	const fraction =
		settings.resources.stockpile.calamityLossFractionBySeverity[severity];
	const next: Partial<Record<ResourceId, number>> = {};
	for (const [resourceId, amount] of Object.entries(stockpileByResource) as [
		ResourceId,
		number,
	][]) {
		next[resourceId] = Math.max(0, (amount ?? 0) * (1 - fraction));
	}
	return next;
}

/**
 * Spend a fraction of total stockpile across resources (pro-rata) for
 * Relief/Rebuild. Returns spent amounts and remaining stock.
 */
function spendStockpileForCalamityResponse(
	stockpileByResource: Partial<Record<ResourceId, number>>,
	response: "relief" | "rebuild" | "endure",
	settings: GameSettings = gameSettings,
): {
	didSpend: boolean;
	spentByResource: Partial<Record<ResourceId, number>>;
	remainingByResource: Partial<Record<ResourceId, number>>;
	totalSpent: number;
} {
	if (response === "endure") {
		return {
			didSpend: false,
			spentByResource: {},
			remainingByResource: { ...stockpileByResource },
			totalSpent: 0,
		};
	}

	const fraction =
		response === "relief"
			? settings.resources.stockpile.reliefSpendFraction
			: settings.resources.stockpile.rebuildSpendFraction;

	const total = Object.values(stockpileByResource).reduce(
		(sum, amount) => sum + (amount ?? 0),
		0,
	);
	if (total < settings.resources.stockpile.minSpendableTotal) {
		return {
			didSpend: false,
			spentByResource: {},
			remainingByResource: { ...stockpileByResource },
			totalSpent: 0,
		};
	}

	const spentByResource: Partial<Record<ResourceId, number>> = {};
	const remainingByResource: Partial<Record<ResourceId, number>> = {};
	let totalSpent = 0;

	for (const [resourceId, amount] of Object.entries(stockpileByResource) as [
		ResourceId,
		number,
	][]) {
		const current = amount ?? 0;
		const spent = current * fraction;
		spentByResource[resourceId] = spent;
		remainingByResource[resourceId] = current - spent;
		totalSpent += spent;
	}

	return {
		didSpend: totalSpent > 0,
		spentByResource,
		remainingByResource,
		totalSpent,
	};
}

export type {
	NationalLedger,
	NationalLedgerInput,
	RegionalProduction,
	ResourceLedgerEntry,
};
export {
	applyCalamityStockpileLoss,
	computeNationalLedger,
	spendStockpileForCalamityResponse,
};
