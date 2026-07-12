import { useEffect, useState } from "react";
import { Bar, Line } from "react-chartjs-2";
import { usePopulation } from "../../context/PopulationContext";
import {
	buildAgeSexPyramidData,
	buildHistogramData,
	buildPopulationTrendData,
} from "../../data/population-dashboard";
import { themeColors } from "../../data/theme-colors";
import {
	type AnnualCycleStats,
	computeDemographicStats,
	type DemographicStats,
	loadPopulationMeta,
} from "../../storage/population";
import { ChartCard } from "./ChartCard";

const EMPTY_STATS: DemographicStats = {
	ageSexPyramid: [],
	happinessHistogram: [],
	healthHistogram: [],
};

function PopulationDashboard() {
	const { isReady, gameDay } = usePopulation();
	const [stats, setStats] = useState<DemographicStats>(EMPTY_STATS);
	const [yearlyStats, setYearlyStats] = useState<AnnualCycleStats[]>([]);
	const [isComputing, setIsComputing] = useState(false);

	// biome-ignore lint/correctness/useExhaustiveDependencies: recompute whenever the game day advances
	useEffect(() => {
		if (!isReady) return;

		let cancelled = false;
		setIsComputing(true);

		Promise.all([computeDemographicStats(), loadPopulationMeta()])
			.then(([demographics, meta]) => {
				if (cancelled) return;
				setStats(demographics);
				setYearlyStats(meta?.yearlyStats ?? []);
			})
			.finally(() => {
				if (!cancelled) setIsComputing(false);
			});

		return () => {
			cancelled = true;
		};
	}, [isReady, gameDay]);

	if (!isReady) {
		return (
			<p className="text-sm text-muted-foreground">Generating citizens…</p>
		);
	}

	return (
		<div className="space-y-4">
			{isComputing && (
				<p className="font-label text-[10px] text-muted-foreground tracking-overline">
					Recalculating…
				</p>
			)}

			<ChartCard
				variant="briefing"
				title="Age-Sex Pyramid"
				description="Living citizens by 10-year age band and sex."
				height={320}
			>
				<Bar
					data={buildAgeSexPyramidData(stats.ageSexPyramid)}
					options={{
						responsive: true,
						maintainAspectRatio: false,
						indexAxis: "y",
						scales: {
							x: {
								stacked: false,
								ticks: {
									callback: (value) => Math.abs(Number(value)).toLocaleString(),
								},
							},
							y: { stacked: false },
						},
						plugins: {
							tooltip: {
								callbacks: {
									label: (context) =>
										`${context.dataset.label}: ${Math.abs(
											Number(context.raw),
										).toLocaleString()}`,
								},
							},
						},
					}}
				/>
			</ChartCard>

			<div className="grid gap-4 sm:grid-cols-2">
				<ChartCard
					variant="briefing"
					title="Happiness Distribution"
					description="Living citizens grouped by overall happiness."
				>
					<Bar
						data={buildHistogramData(
							stats.happinessHistogram,
							"Citizens",
							themeColors.green,
						)}
						options={{ responsive: true, maintainAspectRatio: false }}
					/>
				</ChartCard>

				<ChartCard
					variant="briefing"
					title="Health Distribution"
					description="Living citizens grouped by overall health."
				>
					<Bar
						data={buildHistogramData(
							stats.healthHistogram,
							"Citizens",
							themeColors.blue,
						)}
						options={{ responsive: true, maintainAspectRatio: false }}
					/>
				</ChartCard>
			</div>

			<ChartCard
				variant="briefing"
				title="Births, Deaths & Migration"
				description="Recorded outcomes from each completed game year's annual cycle."
			>
				{yearlyStats.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						No completed game years yet — advance the calendar past one full
						year to record trend data.
					</p>
				) : (
					<Line
						data={buildPopulationTrendData(yearlyStats)}
						options={{ responsive: true, maintainAspectRatio: false }}
					/>
				)}
			</ChartCard>
		</div>
	);
}

export { PopulationDashboard };
