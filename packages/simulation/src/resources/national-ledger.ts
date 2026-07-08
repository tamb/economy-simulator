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
	/** This region-year's extraction yield for this resource (see `computeExtractionYield`). */
	amount: number;
}

interface NationalLedgerInput {
	/** Every region's extraction output for the year, flattened (one entry per region-resource pair with nonzero production). */
	production: RegionalProduction[];
	/** Industrial sub-sector id -> assigned worker count. */
	industrialWorkersBySubSector: Record<string, number>;
}

interface ResourceLedgerEntry {
	resourceId: ResourceId;
	production: number;
	demand: number;
	/** `production / demand`; `Number.POSITIVE_INFINITY` when demand is 0 (trivially sufficient). */
	sufficiency: number;
}

interface NationalLedger {
	resources: ResourceLedgerEntry[];
	/** Industrial sub-sector id -> daily happiness penalty for its workers, driven by its most-constrained required resource (Liebig's-law-style bottleneck). 0 when every required resource is sufficient. */
	shortfallHappinessPenaltyBySubSector: Record<string, number>;
}

/**
 * Aggregates regional extraction into national production, compares it
 * against industrial demand (sub-sector worker count x
 * `economy-simulator-data`'s `resource-requirements`), and derives a
 * per-sub-sector shortfall happiness penalty. See
 * research/resources-and-geography.md §5.2 for the resource-curse framing
 * behind this single-country ledger.
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
	]);

	const sufficiencyByResource = new Map<ResourceId, number>();
	const resources: ResourceLedgerEntry[] = [...resourceIds].map(
		(resourceId) => {
			const production = productionByResource.get(resourceId) ?? 0;
			const demand = demandByResource.get(resourceId) ?? 0;
			const sufficiency =
				demand <= 0 ? Number.POSITIVE_INFINITY : production / demand;
			sufficiencyByResource.set(resourceId, sufficiency);
			return { resourceId, production, demand, sufficiency };
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

	return { resources, shortfallHappinessPenaltyBySubSector };
}

export type {
	NationalLedger,
	NationalLedgerInput,
	RegionalProduction,
	ResourceLedgerEntry,
};
export { computeNationalLedger };
