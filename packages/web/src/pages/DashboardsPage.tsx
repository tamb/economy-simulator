import { useState } from "react";
import { CountryDashboard } from "../components/dashboards/CountryDashboard";
import { PopulationDashboard } from "../components/dashboards/PopulationDashboard";
import { ResourceLedgerDashboard } from "../components/dashboards/ResourceLedgerDashboard";
import { ScoreDashboard } from "../components/dashboards/ScoreDashboard";
import { SectorDashboard } from "../components/dashboards/SectorDashboard";
import { usePopulation } from "../context/PopulationContext";

type DashboardTab =
	| "population"
	| "sectors"
	| "country"
	| "resources"
	| "score";

const TABS: { id: DashboardTab; label: string }[] = [
	{ id: "population", label: "Population" },
	{ id: "sectors", label: "Economic Sectors" },
	{ id: "country", label: "Country Overview" },
	{ id: "resources", label: "Resource Ledger" },
	{ id: "score", label: "Nation Score" },
];

function renderTab(
	tab: DashboardTab,
	gameRun: ReturnType<typeof usePopulation>["gameRun"],
) {
	switch (tab) {
		case "population":
			return <PopulationDashboard />;
		case "sectors":
			return <SectorDashboard />;
		case "country":
			return <CountryDashboard />;
		case "resources":
			return <ResourceLedgerDashboard />;
		case "score":
			return <ScoreDashboard gameRun={gameRun} />;
	}
}

function DashboardsPage() {
	const [tab, setTab] = useState<DashboardTab>("population");
	const { gameRun } = usePopulation();

	return (
		<div className="space-y-6">
			<header className="space-y-2">
				<h2 className="text-xs sm:text-sm">Dashboards</h2>
				<p className="text-sm leading-relaxed text-muted-foreground">
					Charts and tables summarizing population, economic sectors, national
					quality-of-life trends, and the monarchy-orchestrated resource ledger.
				</p>
			</header>

			<nav
				className="flex flex-wrap gap-2 font-label text-[10px] tracking-overline"
				aria-label="Dashboard navigation"
			>
				{TABS.map((item) => (
					<button
						key={item.id}
						type="button"
						onClick={() => setTab(item.id)}
						className={`cursor-pointer border-2 px-3 py-1.5 transition-colors ${
							tab === item.id
								? "border-primary bg-primary text-primary-foreground"
								: "border-primary/30 bg-surface-muted text-muted-foreground hover:border-primary"
						}`}
					>
						{item.label}
					</button>
				))}
			</nav>

			{renderTab(tab, gameRun)}
		</div>
	);
}

export { DashboardsPage };
