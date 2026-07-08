import { getResource } from "economy-simulator-data";
import type { NationalLedger } from "economy-simulator-simulation";
import { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import { usePopulation } from "../../context/PopulationContext";
import {
	buildResourceProductionDemandData,
	buildResourceSufficiencyData,
} from "../../data/resource-ledger-dashboard";
import { loadNationalLedger } from "../../storage/national-ledger";
import { ChartCard } from "./ChartCard";

function ResourceLedgerDashboard() {
	const { isReady, gameDay } = usePopulation();
	const [ledger, setLedger] = useState<NationalLedger | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	// biome-ignore lint/correctness/useExhaustiveDependencies: reload whenever the game day advances
	useEffect(() => {
		if (!isReady) return;

		let cancelled = false;
		setIsLoading(true);

		loadNationalLedger()
			.then((result) => {
				if (!cancelled) setLedger(result);
			})
			.finally(() => {
				if (!cancelled) setIsLoading(false);
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
			{isLoading && (
				<p className="font-label text-[10px] text-muted-foreground tracking-overline">
					Loading ledger…
				</p>
			)}

			{!ledger || ledger.resources.length === 0 ? (
				<p className="text-sm text-muted-foreground">
					No resource ledger yet — advance the calendar past one full game year
					to run the annual extraction and industrial-demand pass.
				</p>
			) : (
				<>
					<ChartCard
						title="National Production vs. Demand"
						description="Total extraction output compared to what industrial sub-sectors consumed this year."
					>
						<Bar
							data={buildResourceProductionDemandData(ledger)}
							options={{
								responsive: true,
								maintainAspectRatio: false,
								scales: { y: { beginAtZero: true } },
							}}
						/>
					</ChartCard>

					<ChartCard
						title="Resource Sufficiency"
						description="Production as a percentage of demand (100% = balanced; below 100% triggers industrial shortfall penalties)."
					>
						<Bar
							data={buildResourceSufficiencyData(ledger)}
							options={{
								indexAxis: "y",
								responsive: true,
								maintainAspectRatio: false,
								scales: {
									x: { min: 0, max: 200, ticks: { callback: (v) => `${v}%` } },
								},
							}}
						/>
					</ChartCard>

					<div className="border-2 border-primary bg-surface px-4 py-3">
						<h3 className="text-[10px] leading-relaxed sm:text-xs">
							Resource Ledger Detail
						</h3>
						<p className="mt-1 text-xs leading-relaxed text-muted-foreground">
							Per-resource production, demand, and sufficiency for the most
							recent completed game year.
						</p>

						<table className="mt-3 w-full text-left text-sm">
							<thead>
								<tr className="border-b-2 border-primary/30 font-label text-[10px] text-muted-foreground tracking-overline">
									<th className="py-1.5 pr-2">Resource</th>
									<th className="py-1.5 pr-2 text-right">Production</th>
									<th className="py-1.5 pr-2 text-right">Demand</th>
									<th className="py-1.5 text-right">Sufficiency</th>
								</tr>
							</thead>
							<tbody>
								{[...ledger.resources]
									.sort((a, b) =>
										(
											getResource(a.resourceId)?.label ?? a.resourceId
										).localeCompare(
											getResource(b.resourceId)?.label ?? b.resourceId,
										),
									)
									.map((entry) => (
										<tr
											key={entry.resourceId}
											className="border-b border-primary/10"
										>
											<td className="py-1.5 pr-2">
												{getResource(entry.resourceId)?.label ??
													entry.resourceId}
											</td>
											<td className="py-1.5 pr-2 text-right">
												{entry.production.toFixed(1)}
											</td>
											<td className="py-1.5 pr-2 text-right">
												{entry.demand.toFixed(1)}
											</td>
											<td className="py-1.5 text-right">
												{entry.demand <= 0
													? "—"
													: `${Math.round(entry.sufficiency * 100)}%`}
											</td>
										</tr>
									))}
							</tbody>
						</table>
					</div>
				</>
			)}
		</div>
	);
}

export { ResourceLedgerDashboard };
