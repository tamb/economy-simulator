import {
	type GameSettings,
	gameSettings,
	type ResourceId,
} from "economy-simulator-data";
import { axialDistance } from "./hex-distance";

interface FlowRegion {
	id: string;
	q: number;
	r: number;
	/** Living population used to allocate local demand share. */
	population: number;
}

interface RegionalResourceAmount {
	regionId: string;
	resourceId: ResourceId;
	amount: number;
}

interface InterRegionFlowInput {
	regions: FlowRegion[];
	/** Per-region extraction this year. */
	production: RegionalResourceAmount[];
	/** National industrial demand by resource. */
	demandByResource: Partial<Record<ResourceId, number>>;
	/**
	 * National employment share in transport-logistics (0–1). Reduces
	 * friction — first real mechanic for that sub-sector.
	 */
	logisticsEmploymentShare: number;
	settings?: GameSettings;
}

interface RegionalFlowBalance {
	regionId: string;
	resourceId: ResourceId;
	localDemand: number;
	production: number;
	/** Net after shipping (can be below localDemand when friction wastes flow). */
	afterFlow: number;
	/** Scarcity / shadow-price signal: localDemand / max(afterFlow, epsilon). */
	shadowPrice: number;
}

interface InterRegionFlowResult {
	/** Effective national production after friction losses on transfers. */
	effectiveProductionByResource: Partial<Record<ResourceId, number>>;
	balances: RegionalFlowBalance[];
	/** Total units lost to transport friction this year. */
	frictionLossByResource: Partial<Record<ResourceId, number>>;
	/** Aggregate units successfully moved surplus → deficit. */
	transferredByResource: Partial<Record<ResourceId, number>>;
}

/**
 * Domestic surplus→deficit rebalancing with distance + logistics friction.
 * Allocates national demand to regions by population share, then greedily
 * ships from surplus provinces to deficit ones. See
 * research/stockpiles-flows-and-regional-employment.md §2.
 */
function computeInterRegionFlows(
	input: InterRegionFlowInput,
): InterRegionFlowResult {
	const settings = input.settings ?? gameSettings;
	const flowCfg = settings.resources.flows;
	const landRegions = input.regions.filter((region) => region.population > 0);
	const totalPopulation = landRegions.reduce(
		(sum, region) => sum + region.population,
		0,
	);

	const logisticsRelief = Math.min(
		1,
		input.logisticsEmploymentShare /
			Math.max(1e-9, flowCfg.logisticsSaturationShare),
	);
	const logisticsFactor =
		1 - flowCfg.logisticsFrictionReduction * logisticsRelief;
	const infra = flowCfg.infrastructureCapacityMultiplier;

	const productionByRegionResource = new Map<string, number>();
	const resourceIds = new Set<ResourceId>();
	for (const entry of input.production) {
		resourceIds.add(entry.resourceId);
		const key = `${entry.regionId}:${entry.resourceId}`;
		productionByRegionResource.set(
			key,
			(productionByRegionResource.get(key) ?? 0) + entry.amount,
		);
	}
	for (const resourceId of Object.keys(
		input.demandByResource,
	) as ResourceId[]) {
		resourceIds.add(resourceId);
	}

	const regionById = new Map(
		input.regions.map((region) => [region.id, region]),
	);
	const balances: RegionalFlowBalance[] = [];
	const effectiveProductionByResource: Partial<Record<ResourceId, number>> = {};
	const frictionLossByResource: Partial<Record<ResourceId, number>> = {};
	const transferredByResource: Partial<Record<ResourceId, number>> = {};

	for (const resourceId of resourceIds) {
		const nationalDemand = input.demandByResource[resourceId] ?? 0;
		const surplus: Array<{ regionId: string; amount: number }> = [];
		const deficit: Array<{ regionId: string; amount: number }> = [];
		const localAfter = new Map<
			string,
			{ localDemand: number; production: number; after: number }
		>();

		for (const region of landRegions.length > 0 ? landRegions : input.regions) {
			const production =
				productionByRegionResource.get(`${region.id}:${resourceId}`) ?? 0;
			const popShare =
				totalPopulation > 0 ? region.population / totalPopulation : 0;
			const localDemand = nationalDemand * popShare;
			const net = production - localDemand;
			if (net > 1e-9) {
				surplus.push({ regionId: region.id, amount: net });
			} else if (net < -1e-9) {
				deficit.push({ regionId: region.id, amount: -net });
			}
			localAfter.set(region.id, {
				localDemand,
				production,
				after: production,
			});
		}

		// Also account for uninhabited producer regions (pop 0) as pure surplus.
		for (const region of input.regions) {
			if (region.population > 0) continue;
			const production =
				productionByRegionResource.get(`${region.id}:${resourceId}`) ?? 0;
			if (production <= 0) continue;
			surplus.push({ regionId: region.id, amount: production });
			localAfter.set(region.id, {
				localDemand: 0,
				production,
				after: production,
			});
		}

		let frictionLoss = 0;
		let transferred = 0;

		for (const sink of deficit) {
			let need = sink.amount;
			const sinkRegion = regionById.get(sink.regionId);
			if (!sinkRegion || need <= 0) continue;

			// Prefer nearer surplus (gravity / distance cost).
			const ranked = [...surplus]
				.filter((entry) => entry.amount > 1e-9)
				.map((entry) => {
					const source = regionById.get(entry.regionId);
					const distance = source ? axialDistance(source, sinkRegion) : 99;
					return { ...entry, distance };
				})
				.sort((a, b) => a.distance - b.distance);

			for (const source of ranked) {
				if (need <= 1e-9) break;
				const ship = Math.min(source.amount, need);
				if (ship <= 0) continue;

				const friction = Math.min(
					flowCfg.maxFriction,
					flowCfg.baseFrictionPerHex * source.distance * logisticsFactor,
				);
				const arrives = ship * (1 - friction) * infra;
				const lost = ship - arrives;

				source.amount -= ship;
				need -= ship;
				frictionLoss += lost;
				transferred += arrives;

				const sinkState = localAfter.get(sink.regionId);
				if (sinkState) sinkState.after += arrives;
				const sourceState = localAfter.get(source.regionId);
				if (sourceState) sourceState.after -= ship;
			}
		}

		let effective = 0;
		for (const [regionId, state] of localAfter) {
			effective += Math.max(0, state.after);
			balances.push({
				regionId,
				resourceId,
				localDemand: state.localDemand,
				production: state.production,
				afterFlow: Math.max(0, state.after),
				shadowPrice:
					state.localDemand <= 0
						? 1
						: state.localDemand / Math.max(1e-6, state.after),
			});
		}

		// Surplus left in surplus regions still counts nationally.
		effectiveProductionByResource[resourceId] = effective;
		frictionLossByResource[resourceId] = frictionLoss;
		transferredByResource[resourceId] = transferred;
	}

	return {
		effectiveProductionByResource,
		balances,
		frictionLossByResource,
		transferredByResource,
	};
}

export type {
	FlowRegion,
	InterRegionFlowInput,
	InterRegionFlowResult,
	RegionalFlowBalance,
	RegionalResourceAmount,
};
export { computeInterRegionFlows };
