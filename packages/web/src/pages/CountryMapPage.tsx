import {
	getBiome,
	getResource,
	getResourceOverlay,
	isLand,
} from "economy-simulator-data";
import { useEffect, useState } from "react";
import { CountryMap } from "../components/CountryMap";
import { usePopulation } from "../context/PopulationContext";
import { useRegions } from "../context/RegionContext";
import type { MapMetric } from "../data/region-color-scale";
import { getTerrainLabel } from "../data/terrain-color-scale";
import { computeRegionStats, type RegionStats } from "../storage/population";

const METRICS: { id: MapMetric; label: string }[] = [
	{ id: "terrain", label: "Terrain" },
	{ id: "population", label: "Population" },
	{ id: "happiness", label: "Happiness" },
	{ id: "health", label: "Health" },
	{ id: "environment", label: "Environment" },
];

function formatReservePercent(fraction: number | undefined): string {
	if (fraction === undefined) return "—";
	return `${Math.round(fraction * 100)}%`;
}

function CountryMapPage() {
	const { isReady: isPopulationReady, gameDay, total } = usePopulation();
	const { regions, isReady: isRegionsReady } = useRegions();
	const [stats, setStats] = useState<Map<string, RegionStats>>(new Map());
	const [isComputing, setIsComputing] = useState(false);
	const [metric, setMetric] = useState<MapMetric>("terrain");
	const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);

	// biome-ignore lint/correctness/useExhaustiveDependencies: recompute region stats whenever the game day advances
	useEffect(() => {
		if (!isPopulationReady) return;

		let cancelled = false;
		setIsComputing(true);

		computeRegionStats()
			.then((result) => {
				if (!cancelled) setStats(result);
			})
			.finally(() => {
				if (!cancelled) setIsComputing(false);
			});

		return () => {
			cancelled = true;
		};
	}, [isPopulationReady, gameDay]);

	const isReady = isPopulationReady && isRegionsReady;
	const selectedRegion = regions.find(
		(region) => region.id === selectedRegionId,
	);
	const selectedStats = selectedRegionId
		? stats.get(selectedRegionId)
		: undefined;
	const landRegionCount = regions.filter((region) =>
		isLand(region.terrain),
	).length;

	if (!isReady) {
		return (
			<div className="space-y-4">
				<h2 className="text-xs sm:text-sm">Country Map</h2>
				<p className="text-sm text-muted-foreground">
					Generating island and citizens…
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<header className="space-y-2">
				<h2 className="text-xs sm:text-sm">Country Map</h2>
				<p className="text-sm leading-relaxed text-muted-foreground">
					A procedurally generated island with{" "}
					{landRegionCount.toLocaleString()} land regions and{" "}
					{total.toLocaleString()} citizens across{" "}
					{regions.length.toLocaleString()} hex tiles (including ocean). Select
					a metric to color the map, then click a land tile to inspect it.
				</p>
			</header>

			<fieldset className="flex flex-wrap items-center gap-2 border-0 p-0">
				<legend className="sr-only">Map metric</legend>
				{METRICS.map((item) => (
					<button
						key={item.id}
						type="button"
						onClick={() => setMetric(item.id)}
						className={`cursor-pointer border-2 px-3 py-1.5 font-label text-[10px] tracking-overline transition-colors ${
							metric === item.id
								? "border-primary bg-primary text-primary-foreground"
								: "border-primary/30 bg-surface text-muted-foreground hover:border-primary"
						}`}
					>
						{item.label}
					</button>
				))}
				{isComputing && (
					<span className="font-label text-[10px] text-muted-foreground tracking-overline">
						Recalculating…
					</span>
				)}
			</fieldset>

			<div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
				<CountryMap
					regions={regions}
					stats={stats}
					metric={metric}
					selectedRegionId={selectedRegionId}
					onSelect={setSelectedRegionId}
				/>

				<aside className="border-2 border-primary bg-surface-muted px-4 py-3">
					{selectedRegion ? (
						<div className="space-y-3">
							<p className="font-label text-[10px] text-muted-foreground tracking-overline">
								Region {selectedRegion.id}
							</p>
							<h3 className="text-xs sm:text-sm">{selectedRegion.name}</h3>

							<dl className="space-y-2 text-sm">
								<div className="flex items-center justify-between gap-4">
									<dt className="text-muted-foreground">Terrain</dt>
									<dd>{getTerrainLabel(selectedRegion.terrain)}</dd>
								</div>
								{selectedRegion.isCoastal && (
									<div className="flex items-center justify-between gap-4">
										<dt className="text-muted-foreground">Coastal</dt>
										<dd>Yes — fishing viable</dd>
									</div>
								)}
								{selectedRegion.resourceOverlay && (
									<div className="flex items-center justify-between gap-4">
										<dt className="text-muted-foreground">Resource overlay</dt>
										<dd>
											{
												getResourceOverlay(selectedRegion.resourceOverlay)
													?.label
											}
										</dd>
									</div>
								)}
								<div className="flex items-center justify-between gap-4">
									<dt className="text-muted-foreground">Environment</dt>
									<dd>
										{selectedRegion.resourceState.environmentQuality.toFixed(0)}
										/100
									</dd>
								</div>
							</dl>

							{isLand(selectedRegion.terrain) &&
								Object.keys(
									selectedRegion.resourceState.reserveOrCapacityByResource,
								).length > 0 && (
									<div className="space-y-2">
										<h4 className="font-label text-[10px] text-muted-foreground tracking-overline">
											Reserves / capacity
										</h4>
										<dl className="space-y-1 text-sm">
											{Object.entries(
												selectedRegion.resourceState
													.reserveOrCapacityByResource,
											).map(([resourceId, fraction]) => (
												<div
													key={resourceId}
													className="flex items-center justify-between gap-4"
												>
													<dt className="text-muted-foreground">
														{getResource(
															resourceId as Parameters<typeof getResource>[0],
														)?.label ?? resourceId}
													</dt>
													<dd>{formatReservePercent(fraction)}</dd>
												</div>
											))}
										</dl>
									</div>
								)}

							{selectedRegion.terrain !== "ocean" && (
								<div className="border-t border-primary/20 pt-3">
									{selectedStats ? (
										<dl className="space-y-2 text-sm">
											<div className="flex items-center justify-between gap-4">
												<dt className="text-muted-foreground">Population</dt>
												<dd>{selectedStats.population.toLocaleString()}</dd>
											</div>
											<div className="flex items-center justify-between gap-4">
												<dt className="text-muted-foreground">
													Avg. happiness
												</dt>
												<dd>{selectedStats.averageHappiness.toFixed(1)}</dd>
											</div>
											<div className="flex items-center justify-between gap-4">
												<dt className="text-muted-foreground">Avg. health</dt>
												<dd>{selectedStats.averageHealth.toFixed(1)}</dd>
											</div>
										</dl>
									) : (
										<p className="text-sm text-muted-foreground">
											No citizens currently call this region home.
										</p>
									)}
								</div>
							)}

							{selectedRegion.terrain !== "ocean" &&
								isLand(selectedRegion.terrain) && (
									<p className="text-xs text-muted-foreground">
										{getBiome(selectedRegion.terrain)?.description}
									</p>
								)}
						</div>
					) : (
						<p className="text-sm text-muted-foreground">
							Hover a land tile for a quick summary, or click one to inspect its
							terrain, resources, reserves, and population stats.
						</p>
					)}
				</aside>
			</div>
		</div>
	);
}

export { CountryMapPage };
