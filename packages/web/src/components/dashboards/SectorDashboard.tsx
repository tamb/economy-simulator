import { useEffect, useState } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import { usePopulation } from "../../context/PopulationContext";
import { useSectorAssignments } from "../../context/SectorAssignmentContext";
import {
	buildAvgHappinessBySectorData,
	buildEconomicSystemMixData,
	buildEmploymentShareData,
	buildSectorEmploymentEntries,
} from "../../data/sector-dashboard";
import { type CategoryId, categories } from "../../data/taxonomy";
import { computeSectorStats, type SectorStats } from "../../storage/population";
import { ChartCard } from "./ChartCard";

function SectorDashboard() {
	const { isReady, gameDay } = usePopulation();
	const { getAssignment, isReady: isAssignmentsReady } = useSectorAssignments();
	const [stats, setStats] = useState<Map<string, SectorStats>>(new Map());
	const [isComputing, setIsComputing] = useState(false);

	// biome-ignore lint/correctness/useExhaustiveDependencies: recompute whenever the game day advances
	useEffect(() => {
		if (!isReady) return;

		let cancelled = false;
		setIsComputing(true);

		computeSectorStats()
			.then((result) => {
				if (!cancelled) setStats(result);
			})
			.finally(() => {
				if (!cancelled) setIsComputing(false);
			});

		return () => {
			cancelled = true;
		};
	}, [isReady, gameDay]);

	if (!isReady || !isAssignmentsReady) {
		return (
			<p className="text-sm text-muted-foreground">Generating citizens…</p>
		);
	}

	const entries = buildSectorEmploymentEntries(stats, categories);

	if (entries.length === 0) {
		return (
			<p className="text-sm text-muted-foreground">
				No employed citizens yet — advance a game day to assign working-age
				citizens to sectors.
			</p>
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
				title="Employment Share by Sub-Sector"
				description="Working-age citizens currently assigned to each sub-sector."
				height={360}
			>
				<Bar
					data={buildEmploymentShareData(entries)}
					options={{
						responsive: true,
						maintainAspectRatio: false,
						indexAxis: "y",
						plugins: { legend: { display: false } },
					}}
				/>
			</ChartCard>

			<div className="grid gap-4 sm:grid-cols-2">
				<ChartCard
					title="Average Happiness by Sub-Sector"
					description="Higher bars mean citizens in that sub-sector are happier on average."
					height={320}
				>
					<Bar
						data={buildAvgHappinessBySectorData(entries)}
						options={{
							responsive: true,
							maintainAspectRatio: false,
							indexAxis: "y",
							plugins: { legend: { display: false } },
						}}
					/>
				</ChartCard>

				<ChartCard
					title="Economic System Mix"
					description="Employed citizens grouped by the economic system assigned to their sub-sector."
					height={320}
				>
					<Doughnut
						data={buildEconomicSystemMixData(
							entries,
							(categoryId, subSectorId) =>
								getAssignment(categoryId as CategoryId, subSectorId),
						)}
						options={{ responsive: true, maintainAspectRatio: false }}
					/>
				</ChartCard>
			</div>
		</div>
	);
}

export { SectorDashboard };
