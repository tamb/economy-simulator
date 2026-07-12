import type { GameRunState } from "economy-simulator-persistence";
import { Line } from "react-chartjs-2";
import { buildNationScoreTrendData } from "../../lib/score-dashboard";
import { ChartCard } from "./ChartCard";

interface ScoreDashboardProps {
	gameRun: GameRunState | null;
}

function ScoreDashboard({ gameRun }: ScoreDashboardProps) {
	if (!gameRun || gameRun.scoreHistory.length === 0) {
		return (
			<p className="text-sm text-muted-foreground">
				No nation score yet — advance the calendar past one full game year.
			</p>
		);
	}

	const latest = gameRun.scoreHistory.at(-1);

	return (
		<div className="space-y-4">
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
				<div className="border-2 border-primary/30 bg-surface-muted px-3 py-2">
					<p className="font-label text-[10px] tracking-overline text-muted-foreground">
						Current score
					</p>
					<p className="text-xl text-primary">
						{Math.round(latest?.total ?? 0)}
					</p>
				</div>
				<div className="border-2 border-primary/30 bg-surface-muted px-3 py-2">
					<p className="font-label text-[10px] tracking-overline text-muted-foreground">
						QoL
					</p>
					<p className="text-xl">
						{Math.round(latest?.averageQualityOfLife ?? 0)}
					</p>
				</div>
				<div className="border-2 border-primary/30 bg-surface-muted px-3 py-2">
					<p className="font-label text-[10px] tracking-overline text-muted-foreground">
						Resources
					</p>
					<p className="text-xl">
						{Math.round(latest?.resourceSufficiency ?? 0)}%
					</p>
				</div>
			</div>

			<ChartCard
				variant="briefing"
				title="Nation Score Trend"
				description="Composite score from quality of life, population growth, migration, resources, and environment."
			>
				<Line
					data={buildNationScoreTrendData(gameRun.scoreHistory)}
					options={{
						responsive: true,
						maintainAspectRatio: false,
						scales: { y: { min: 0, max: 100 } },
					}}
				/>
			</ChartCard>
		</div>
	);
}

export { ScoreDashboard };
