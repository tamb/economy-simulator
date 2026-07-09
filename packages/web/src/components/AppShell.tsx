import { appConfig } from "economy-simulator-data";
import { NavLink, Outlet, useLocation } from "react-router";
import { usePopulation } from "../context/PopulationContext";
import { appVersion } from "../data/app-version";
import { CalamityDebuffStrip } from "./CalamityDebuffStrip";
import { CalculationModal } from "./CalculationModal";
import { GameEndModal } from "./GameEndModal";

const pages: { path: string; label: string; subtitle: string }[] = [
	{
		path: "/atlas",
		label: "Sector Atlas",
		subtitle: "Economic Sector Atlas",
	},
	{
		path: "/population",
		label: "Population",
		subtitle: "Population Registry",
	},
	{
		path: "/map",
		label: "Country Map",
		subtitle: "Regional Atlas",
	},
	{
		path: "/dashboards",
		label: "Dashboards",
		subtitle: "Charts & Reports",
	},
	{
		path: "/records",
		label: "Records",
		subtitle: "Scores & Badges",
	},
	{
		path: "/instructions",
		label: "Instructions",
		subtitle: "How to Play",
	},
	{
		path: "/credits",
		label: "Credits",
		subtitle: "Credits & Attribution",
	},
];

const PHASE_LABELS: Record<"daily" | "annual", string> = {
	daily: "Updating today's cohort",
	annual: "Running the annual population cycle",
};

/**
 * Persistent chrome (nav, header, footer) around every routed page, plus the
 * day-advance progress overlay — both live here since they're independent of
 * which page is currently active.
 */
function AppShell() {
	const location = useLocation();
	const { isAdvancingDay, dayAdvanceProgress, gameRun, restartNation, total } =
		usePopulation();
	const activePage =
		pages.find((item) => location.pathname.startsWith(item.path)) ?? pages[0];
	const showGameEndModal =
		gameRun != null && (gameRun.status === "won" || gameRun.status === "lost");

	return (
		<main className="min-h-screen bg-surface p-4 font-sans sm:p-6">
			<div className="mx-auto flex max-w-6xl gap-4">
				<nav
					className="w-44 shrink-0 border-2 border-primary bg-surface-muted sm:w-52"
					aria-label="Main navigation"
				>
					<div className="border-b-2 border-primary bg-neutral-950 px-4 py-4 text-on-dark">
						<p className="font-label text-[10px] tracking-overline">
							Navigation
						</p>
						<p className="mt-1 text-[10px] leading-relaxed sm:text-xs">
							economy-simulator
						</p>
					</div>
					<ul className="p-2">
						{pages.map((item) => (
							<li key={item.path}>
								<NavLink
									to={item.path}
									className={({ isActive }) =>
										`block w-full cursor-pointer border-2 px-3 py-2 text-left transition-colors ${
											isActive
												? "border-primary bg-primary text-primary-foreground"
												: "border-transparent bg-surface text-foreground hover:border-primary/30"
										}`
									}
								>
									<span className="font-label text-[10px] tracking-overline">
										{item.label}
									</span>
								</NavLink>
							</li>
						))}
					</ul>
				</nav>

				<div className="min-w-0 flex-1 border-2 border-primary bg-surface shadow-lg shadow-surface-shadow">
					<header className="border-b-4 border-accent bg-neutral-950 px-6 py-5 text-center text-on-dark sm:px-8">
						<p className="font-label text-sm text-on-dark-muted tracking-overline">
							Executive Office of the President
						</p>
						<h1 className="mt-2 text-base text-highlight sm:text-lg">
							economy-simulator
						</h1>
						<p className="mt-1 font-label text-xs text-on-dark-muted tracking-overline">
							{activePage.subtitle}
						</p>
					</header>

					<div className="border-b border-primary px-6 py-1 sm:px-8" />

					<CalamityDebuffStrip />

					<section className="px-6 py-8 sm:px-8">
						<Outlet />
					</section>

					<footer className="border-t-2 border-primary bg-surface-muted px-6 py-3 sm:px-8">
						<p className="font-label text-center text-xs text-muted-foreground tracking-overline">
							Reference: economic-sectors.md · {new Date().getFullYear()}
						</p>
						<p className="mt-1 text-center text-[10px] text-muted-foreground/70">
							v{appVersion}
						</p>
					</footer>
				</div>
			</div>

			<CalculationModal
				isOpen={isAdvancingDay}
				title={
					dayAdvanceProgress
						? PHASE_LABELS[dayAdvanceProgress.phase]
						: "Advancing the game day"
				}
				subtitle={
					dayAdvanceProgress?.phase === "annual"
						? "Recalculating births, deaths, emigration, and immigration across the whole population — this can take a moment for large populations."
						: undefined
				}
				processed={dayAdvanceProgress?.processed ?? 0}
				total={dayAdvanceProgress?.total ?? 0}
			/>

			{showGameEndModal && gameRun && (
				<GameEndModal
					gameRun={gameRun}
					onStartNewNation={() => {
						const nextSize =
							appConfig.population.sizeOptions.find((size) => size === total) ??
							gameRun.startingPopulation;
						restartNation(nextSize).catch(() => undefined);
					}}
				/>
			)}
		</main>
	);
}

export { AppShell };
