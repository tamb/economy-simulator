import { getWeeklyDecisionTree } from "economy-simulator-data";
import { Link } from "react-router";
import type { WeeklyReportSummary } from "../game/advance-day-result";

interface WeeklyReportModalProps {
	report: WeeklyReportSummary;
	onRespond: (choiceId: string) => void;
}

const DISTRESS_LABEL: Record<string, string> = {
	low_happiness: "Low morale",
	low_health: "Poor health",
	low_environment: "Land stress",
	calamity_hit: "Under calamity",
};

/**
 * Weekly cabinet briefing for the worst-performing regions.
 */
function WeeklyReportModal({ report, onRespond }: WeeklyReportModalProps) {
	const tree = getWeeklyDecisionTree(report.distress);
	const primary = report.regions.find(
		(region) => region.regionId === report.primaryRegionId,
	);

	if (!tree || !primary) return null;

	return (
		<div
			className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-neutral-950/80 p-4"
			role="dialog"
			aria-modal="true"
			aria-labelledby="weekly-report-title"
		>
			<div className="my-auto flex max-h-[min(90vh,42rem)] w-full max-w-lg flex-col overflow-hidden border-4 border-primary bg-surface shadow-lg shadow-surface-shadow">
				<header className="shrink-0 border-b-4 border-primary bg-neutral-950 px-6 py-5 text-center text-on-dark">
					<p className="font-label text-[10px] tracking-overline text-on-dark-muted">
						Cabinet briefing · Day {report.gameDay.toLocaleString()}
					</p>
					<h2 id="weekly-report-title" className="mt-2 text-sm text-highlight">
						Weekly region report
					</h2>
				</header>

				<div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
					<ul className="space-y-2">
						{report.regions.map((region, index) => (
							<li
								key={region.regionId}
								className={`border-2 px-3 py-2 text-sm ${
									index === 0
										? "border-accent bg-accent/5"
										: "border-primary/30 bg-surface-muted"
								}`}
							>
								<div className="flex flex-wrap items-baseline justify-between gap-2">
									<p className="font-medium">{region.name}</p>
									<span className="font-label text-[10px] tracking-overline text-muted-foreground">
										{DISTRESS_LABEL[region.distress] ?? region.distress}
									</span>
								</div>
								<p className="mt-1 text-xs text-muted-foreground">
									Pop {region.population.toLocaleString()} · Happiness{" "}
									{region.averageHappiness.toFixed(0)} · Health{" "}
									{region.averageHealth.toFixed(0)} · Env{" "}
									{region.environmentQuality.toFixed(0)}
								</p>
							</li>
						))}
					</ul>

					<p className="text-sm leading-relaxed">{report.prompt}</p>
					<p className="text-xs text-muted-foreground">
						Decide for <strong>{primary.name}</strong>.{" "}
						<Link
							to={`/map?region=${encodeURIComponent(primary.regionId)}`}
							className="underline"
						>
							Open on map
						</Link>
					</p>

					<div className="space-y-2 border-t-2 border-primary pt-4">
						{tree.choices.map((choice) => (
							<button
								key={choice.id}
								type="button"
								onClick={() => onRespond(choice.id)}
								className="w-full cursor-pointer border-2 border-primary bg-surface px-4 py-3 text-left transition-colors hover:bg-primary hover:text-primary-foreground"
							>
								<p className="text-sm">{choice.label}</p>
								<p className="mt-1 text-xs opacity-80">{choice.hint}</p>
							</button>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}

export { WeeklyReportModal };
