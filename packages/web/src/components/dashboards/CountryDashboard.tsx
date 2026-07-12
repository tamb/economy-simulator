import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { usePopulation } from "../../context/PopulationContext";
import { useRegions } from "../../context/RegionContext";
import {
	buildQualityOfLifeTrendData,
	buildRegionLeaderboard,
} from "../../lib/country-dashboard";
import {
	type AnnualCycleStats,
	computeRegionStats,
	loadPopulationMeta,
	type RegionStats,
} from "../../repos/population";
import { ChartCard } from "./ChartCard";

function CountryDashboard() {
	const { isReady, gameDay } = usePopulation();
	const { regions, isReady: isRegionsReady } = useRegions();
	const [regionStats, setRegionStats] = useState<Map<string, RegionStats>>(
		new Map(),
	);
	const [yearlyStats, setYearlyStats] = useState<AnnualCycleStats[]>([]);
	const [isComputing, setIsComputing] = useState(false);

	// biome-ignore lint/correctness/useExhaustiveDependencies: recompute whenever the game day advances
	useEffect(() => {
		if (!isReady) return;

		let cancelled = false;
		setIsComputing(true);

		Promise.all([computeRegionStats(), loadPopulationMeta()])
			.then(([stats, meta]) => {
				if (cancelled) return;
				setRegionStats(stats);
				setYearlyStats(meta?.yearlyStats ?? []);
			})
			.finally(() => {
				if (!cancelled) setIsComputing(false);
			});

		return () => {
			cancelled = true;
		};
	}, [isReady, gameDay]);

	if (!isReady || !isRegionsReady) {
		return (
			<p className="text-sm text-muted-foreground">Generating citizens…</p>
		);
	}

	const leaderboard = buildRegionLeaderboard(
		regionStats,
		regions,
		"averageHappiness",
	).slice(0, 10);

	return (
		<div className="space-y-4">
			{isComputing && (
				<p className="font-label text-[10px] text-muted-foreground tracking-overline">
					Recalculating…
				</p>
			)}

			<ChartCard
				variant="briefing"
				title="National Quality of Life Trend"
				description="Mean of average happiness and health across the whole population, recorded each completed game year."
			>
				{yearlyStats.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						No completed game years yet — advance the calendar past one full
						year to record trend data.
					</p>
				) : (
					<Line
						data={buildQualityOfLifeTrendData(yearlyStats)}
						options={{
							responsive: true,
							maintainAspectRatio: false,
							scales: { y: { min: 0, max: 100 } },
						}}
					/>
				)}
			</ChartCard>

			<div className="border-2 border-primary bg-surface px-4 py-3">
				<h3 className="text-[10px] leading-relaxed sm:text-xs">
					Region Leaderboard
				</h3>
				<p className="mt-1 text-xs leading-relaxed text-muted-foreground">
					Top 10 regions by average happiness.
				</p>

				{leaderboard.length === 0 ? (
					<p className="mt-3 text-sm text-muted-foreground">
						No populated regions yet.
					</p>
				) : (
					<table className="mt-3 w-full text-left text-sm">
						<thead>
							<tr className="border-b-2 border-primary/30 font-label text-[10px] text-muted-foreground tracking-overline">
								<th className="py-1.5 pr-2">Region</th>
								<th className="py-1.5 pr-2 text-right">Population</th>
								<th className="py-1.5 pr-2 text-right">Avg. happiness</th>
								<th className="py-1.5 text-right">Avg. health</th>
							</tr>
						</thead>
						<tbody>
							{leaderboard.map((row) => (
								<tr key={row.regionId} className="border-b border-primary/10">
									<td className="py-1.5 pr-2">
										{row.name}{" "}
										<span className="text-muted-foreground">
											({row.regionId})
										</span>
									</td>
									<td className="py-1.5 pr-2 text-right">
										{row.population.toLocaleString()}
									</td>
									<td className="py-1.5 pr-2 text-right">
										{row.averageHappiness.toFixed(1)}
									</td>
									<td className="py-1.5 text-right">
										{row.averageHealth.toFixed(1)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
			</div>
		</div>
	);
}

export { CountryDashboard };
