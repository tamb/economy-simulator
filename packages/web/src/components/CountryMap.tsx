import { getResourceOverlay } from "economy-simulator-data";
import { useMemo, useState } from "react";
import type { MapMetric, QualityRange } from "../data/region-color-scale";
import { getRegionColor } from "../data/region-color-scale";
import { getHexLayout, HEX_DIMENSIONS } from "../data/regions";
import { getTerrainLabel } from "../data/terrain-color-scale";
import type { RegionStats } from "../storage/population";
import type { Region } from "../storage/regions";

interface CountryMapProps {
	regions: Region[];
	stats: Map<string, RegionStats>;
	metric: MapMetric;
	selectedRegionId: string | null;
	onSelect: (regionId: string) => void;
}

const OVERLAY_ABBREVIATIONS: Record<string, string> = {
	freshWaterSpring: "H₂O",
	richOreVein: "Ore",
	fossilFuelField: "Fuel",
	fertileSoil: "Soil",
};

function metricValue(
	metric: MapMetric,
	region: Region,
	regionStats: RegionStats | undefined,
): number | undefined {
	if (metric === "terrain") return undefined;
	if (region.terrain === "ocean") return undefined;
	if (metric === "environment") return region.resourceState.environmentQuality;
	if (!regionStats) return undefined;
	if (metric === "population") return regionStats.population;
	if (metric === "happiness") return regionStats.averageHappiness;
	return regionStats.averageHealth;
}

function tileLayer(
	regionId: string,
	selectedId: string | null,
	hoveredId: string | null,
): number {
	if (regionId === selectedId) return 2;
	if (regionId === hoveredId) return 1;
	return 0;
}

/** Stable back-to-front paint order so neighboring hexes don't flicker when selection/hover changes. */
function comparePaintOrder(
	a: { region: Region; isLand: boolean },
	b: { region: Region; isLand: boolean },
	selectedRegionId: string | null,
	hoveredRegionId: string | null,
): number {
	const layerA = tileLayer(a.region.id, selectedRegionId, hoveredRegionId);
	const layerB = tileLayer(b.region.id, selectedRegionId, hoveredRegionId);
	if (layerA !== layerB) return layerA - layerB;
	// Ocean under land so land edges always win shared borders.
	if (a.isLand !== b.isLand) return a.isLand ? 1 : -1;
	if (a.region.r !== b.region.r) return a.region.r - b.region.r;
	return a.region.q - b.region.q;
}

function qualityRangeForMetric(
	metric: MapMetric,
	regions: Region[],
	stats: Map<string, RegionStats>,
): QualityRange | undefined {
	if (
		metric !== "happiness" &&
		metric !== "health" &&
		metric !== "environment"
	) {
		return undefined;
	}

	let min = Number.POSITIVE_INFINITY;
	let max = Number.NEGATIVE_INFINITY;

	for (const region of regions) {
		if (region.terrain === "ocean") continue;
		const value = metricValue(metric, region, stats.get(region.id));
		if (value === undefined) continue;
		min = Math.min(min, value);
		max = Math.max(max, value);
	}

	if (!Number.isFinite(min) || !Number.isFinite(max)) return undefined;
	return { min, max };
}

function formatMetricTooltip(
	metric: MapMetric,
	value: number | undefined,
): string | null {
	if (value === undefined || metric === "terrain") return null;
	if (metric === "population") return `${value.toLocaleString()} citizens`;
	if (metric === "happiness") return `Happiness ${value.toFixed(1)}`;
	if (metric === "health") return `Health ${value.toFixed(1)}`;
	return `Environment ${value.toFixed(0)}/100`;
}

function CountryMap({
	regions,
	stats,
	metric,
	selectedRegionId,
	onSelect,
}: CountryMapProps) {
	const [hoveredRegionId, setHoveredRegionId] = useState<string | null>(null);
	const [tooltipPosition, setTooltipPosition] = useState<{
		x: number;
		y: number;
	} | null>(null);

	const tiles = useMemo(() => {
		const mapped = regions.map((region) => ({
			region,
			layout: getHexLayout(region.q, region.r),
			isLand: region.terrain !== "ocean",
		}));

		return mapped.sort((a, b) =>
			comparePaintOrder(a, b, selectedRegionId, hoveredRegionId),
		);
	}, [regions, selectedRegionId, hoveredRegionId]);

	const maxPopulation = useMemo(() => {
		let max = 0;
		for (const region of regions) {
			if (region.terrain === "ocean") continue;
			const population = stats.get(region.id)?.population ?? 0;
			if (population > max) max = population;
		}
		return Math.max(1, max);
	}, [regions, stats]);

	const qualityRange = useMemo(
		() => qualityRangeForMetric(metric, regions, stats),
		[metric, regions, stats],
	);

	const bounds = useMemo(() => {
		const padding = HEX_DIMENSIONS;
		let minX = 0;
		let minY = 0;
		let maxX = 0;
		let maxY = 0;

		for (const { layout } of tiles) {
			for (const corner of layout.corners) {
				minX = Math.min(minX, corner.x);
				minY = Math.min(minY, corner.y);
				maxX = Math.max(maxX, corner.x);
				maxY = Math.max(maxY, corner.y);
			}
		}

		return {
			minX: minX - padding,
			minY: minY - padding,
			width: maxX - minX + padding * 2,
			height: maxY - minY + padding * 2,
		};
	}, [tiles]);

	const hoveredRegion = regions.find((region) => region.id === hoveredRegionId);
	const hoveredValue = hoveredRegion
		? metricValue(metric, hoveredRegion, stats.get(hoveredRegion.id))
		: undefined;
	const hoveredMetricLabel = formatMetricTooltip(metric, hoveredValue);

	return (
		<div className="relative">
			<svg
				role="img"
				aria-label="Hex map of the country's island and surrounding ocean"
				viewBox={`${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}`}
				className="h-auto w-full border-2 border-primary bg-surface-muted"
				onPointerLeave={() => {
					setHoveredRegionId(null);
					setTooltipPosition(null);
				}}
			>
				<title>Country map colored by {metric}</title>
				<defs>
					<filter id="region-glow" x="-50%" y="-50%" width="200%" height="200%">
						<feDropShadow
							dx="0"
							dy="0"
							stdDeviation="3"
							floodColor="var(--color-highlight)"
						/>
					</filter>
				</defs>

				{tiles.map(({ region, layout, isLand }) => {
					const regionStats = stats.get(region.id);
					const value = metricValue(metric, region, regionStats);
					const fill = getRegionColor(
						metric,
						value,
						maxPopulation,
						region.terrain,
						qualityRange,
					);
					const isSelected = region.id === selectedRegionId;
					const isHovered = region.id === hoveredRegionId;
					const points = layout.corners
						.map((corner) => `${corner.x},${corner.y}`)
						.join(" ");
					const overlayLabel = region.resourceOverlay
						? (OVERLAY_ABBREVIATIONS[region.resourceOverlay] ??
							getResourceOverlay(region.resourceOverlay)?.label.slice(0, 3))
						: null;

					const polygon = (
						<polygon
							points={points}
							fill={fill}
							data-region-id={region.id}
							data-metric={metric}
							data-fill={fill}
							stroke={
								isSelected
									? "var(--color-highlight)"
									: isHovered
										? "var(--color-cyan-light)"
										: isLand
											? "var(--color-cyan-dark)"
											: "#145070"
							}
							strokeWidth={isSelected ? 3 : isHovered ? 2 : 1}
							filter={isSelected ? "url(#region-glow)" : undefined}
							opacity={isLand ? 1 : 0.9}
						/>
					);

					if (!isLand) {
						return <g key={region.id}>{polygon}</g>;
					}

					return (
						// biome-ignore lint/a11y/useSemanticElements: SVG <g> can't be a real <button>
						<g
							key={region.id}
							role="button"
							aria-label={`${region.name}, ${getTerrainLabel(region.terrain)}${
								regionStats
									? `, population ${regionStats.population.toLocaleString()}`
									: ""
							}`}
							tabIndex={0}
							onClick={() => onSelect(region.id)}
							onKeyDown={(event) => {
								if (event.key === "Enter" || event.key === " ") {
									event.preventDefault();
									onSelect(region.id);
								}
							}}
							onPointerEnter={(event) => {
								setHoveredRegionId(region.id);
								setTooltipPosition({ x: event.clientX, y: event.clientY });
							}}
							onPointerMove={(event) => {
								setTooltipPosition({ x: event.clientX, y: event.clientY });
							}}
							onPointerLeave={() => {
								setHoveredRegionId(null);
								setTooltipPosition(null);
							}}
							className="cursor-pointer focus-visible:outline-none"
						>
							{polygon}
							{overlayLabel && (
								<text
									x={layout.x}
									y={layout.y + 4}
									textAnchor="middle"
									className="pointer-events-none select-none font-label text-[8px] fill-neutral-950"
									style={{ fontSize: 8 }}
								>
									{overlayLabel}
								</text>
							)}
						</g>
					);
				})}
			</svg>

			{hoveredRegion && tooltipPosition && (
				<div
					role="tooltip"
					className="pointer-events-none fixed z-50 max-w-xs border-2 border-primary bg-surface px-3 py-2 text-xs shadow-lg shadow-surface-shadow"
					style={{
						left: tooltipPosition.x + 12,
						top: tooltipPosition.y + 12,
					}}
				>
					<p className="font-label text-[10px] text-muted-foreground tracking-overline">
						{hoveredRegion.name} · {hoveredRegion.id}
					</p>
					<p className="mt-1 text-sm">
						{getTerrainLabel(hoveredRegion.terrain)}
					</p>
					{hoveredRegion.resourceOverlay && (
						<p className="mt-1 text-muted-foreground">
							{getResourceOverlay(hoveredRegion.resourceOverlay)?.label}
						</p>
					)}
					{hoveredMetricLabel && (
						<p className="mt-1 text-muted-foreground">{hoveredMetricLabel}</p>
					)}
				</div>
			)}
		</div>
	);
}

export { CountryMap, comparePaintOrder, metricValue, qualityRangeForMetric };
