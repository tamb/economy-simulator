import { resourceOverlays, type Terrain } from "economy-simulator-data";
import { useMemo } from "react";
import type { MapMetric, QualityRange } from "../lib/region-color-scale";
import { getRegionColor } from "../lib/region-color-scale";
import { getTerrainColor, getTerrainLabel } from "../lib/terrain-color-scale";
import { themeColors } from "../lib/theme-colors";
import type { Region } from "../repos/regions";

interface CountryMapLegendProps {
	metric: MapMetric;
	regions: Region[];
	landRegionCount: number;
	maxPopulation: number;
	qualityRange?: QualityRange;
}

const OVERLAY_ABBREVIATIONS: Record<string, string> = {
	freshWaterSpring: "H₂O",
	richOreVein: "Ore",
	fossilFuelField: "Fuel",
	fertileSoil: "Soil",
};

const TERRAIN_ORDER: Terrain[] = [
	"plains",
	"pasture",
	"forest",
	"hills",
	"mountains",
	"wetland",
	"desert",
	"clearedLand",
	"barrenRock",
	"ocean",
];

function Swatch({ color, label }: { color: string; label: string }) {
	return (
		<li className="flex items-center gap-2">
			<span
				aria-hidden="true"
				className="size-3 shrink-0 border border-primary/40"
				style={{ backgroundColor: color }}
			/>
			<span>{label}</span>
		</li>
	);
}

function GradientBar({
	from,
	mid,
	to,
	lowLabel,
	highLabel,
}: {
	from: string;
	mid?: string;
	to: string;
	lowLabel: string;
	highLabel: string;
}) {
	const gradient = mid
		? `linear-gradient(to right, ${from}, ${mid}, ${to})`
		: `linear-gradient(to right, ${from}, ${to})`;

	return (
		<div className="space-y-1">
			<div
				aria-hidden="true"
				className="h-3 w-full border border-primary/40"
				style={{ background: gradient }}
			/>
			<div className="flex justify-between gap-2 font-label text-[10px] text-muted-foreground tracking-overline">
				<span>{lowLabel}</span>
				<span>{highLabel}</span>
			</div>
		</div>
	);
}

function CountryMapLegend({
	metric,
	regions,
	landRegionCount,
	maxPopulation,
	qualityRange,
}: CountryMapLegendProps) {
	const presentTerrains = useMemo(() => {
		const seen = new Set<Terrain>();
		for (const region of regions) {
			seen.add(region.terrain);
		}
		return TERRAIN_ORDER.filter((terrain) => seen.has(terrain));
	}, [regions]);

	const metricTitle =
		metric === "terrain"
			? "Terrain"
			: metric === "population"
				? "Population"
				: metric === "happiness"
					? "Happiness"
					: metric === "health"
						? "Health"
						: "Environment";

	const qualityHasSpread =
		qualityRange !== undefined && qualityRange.max > qualityRange.min;
	const qualityDecimals = metric === "environment" ? 0 : 1;

	return (
		<div className="space-y-4 border-2 border-primary bg-surface-muted px-4 py-3">
			<div className="flex flex-wrap items-baseline justify-between gap-2">
				<p className="font-label text-[10px] text-muted-foreground tracking-overline">
					Map key
				</p>
				<p className="text-sm">
					<span className="font-label text-[10px] text-muted-foreground tracking-overline">
						Land regions{" "}
					</span>
					<span className="tabular-nums">
						{landRegionCount.toLocaleString()}
					</span>
					<span className="text-muted-foreground">
						{" "}
						/ {regions.length.toLocaleString()} tiles
					</span>
				</p>
			</div>

			<div className="space-y-2">
				<p className="font-label text-[10px] text-muted-foreground tracking-overline">
					{metricTitle}
				</p>

				{metric === "terrain" ? (
					<ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs sm:grid-cols-3">
						{presentTerrains.map((terrain) => (
							<Swatch
								key={terrain}
								color={getTerrainColor(terrain)}
								label={getTerrainLabel(terrain)}
							/>
						))}
					</ul>
				) : metric === "population" ? (
					<GradientBar
						from={getRegionColor("population", 0, maxPopulation, "plains")}
						to={getRegionColor(
							"population",
							maxPopulation,
							maxPopulation,
							"plains",
						)}
						lowLabel="Empty"
						highLabel={`${maxPopulation.toLocaleString()} citizens`}
					/>
				) : (
					<GradientBar
						from={
							qualityHasSpread
								? getRegionColor(
										metric,
										qualityRange.min,
										1,
										"plains",
										qualityRange,
									)
								: themeColors.red
						}
						mid={
							qualityHasSpread
								? getRegionColor(
										metric,
										(qualityRange.min + qualityRange.max) / 2,
										1,
										"plains",
										qualityRange,
									)
								: themeColors.yellow
						}
						to={
							qualityHasSpread
								? getRegionColor(
										metric,
										qualityRange.max,
										1,
										"plains",
										qualityRange,
									)
								: themeColors.green
						}
						lowLabel={
							qualityHasSpread
								? qualityRange.min.toFixed(qualityDecimals)
								: "Low"
						}
						highLabel={
							qualityHasSpread
								? qualityRange.max.toFixed(qualityDecimals)
								: "High"
						}
					/>
				)}
			</div>

			<div className="space-y-2 border-t border-primary/20 pt-3">
				<p className="font-label text-[10px] text-muted-foreground tracking-overline">
					Markers
				</p>
				<ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs sm:grid-cols-3">
					{resourceOverlays.map((overlay) => (
						<li key={overlay.id} className="flex items-center gap-2">
							<span className="inline-flex min-w-8 justify-center border border-primary/40 bg-surface px-1 font-label text-[9px] tracking-overline text-neutral-950">
								{OVERLAY_ABBREVIATIONS[overlay.id] ?? overlay.label.slice(0, 3)}
							</span>
							<span>{overlay.label}</span>
						</li>
					))}
					<li className="flex items-center gap-2">
						<span
							aria-hidden="true"
							className="size-3 shrink-0 border-2 border-[var(--color-red)] bg-surface"
							style={{ boxShadow: `0 0 6px ${themeColors.red}` }}
						/>
						<span>Active calamity</span>
					</li>
				</ul>
			</div>
		</div>
	);
}

export { CountryMapLegend };
