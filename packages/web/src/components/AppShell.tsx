import { appConfig } from "economy-simulator-data";
import { getVisibleActiveCalamities } from "economy-simulator-simulation";
import { NavLink, Outlet, useLocation } from "react-router";
import { usePopulation } from "../context/PopulationContext";
import { appVersion } from "../lib/app-version";
import { AideProposalModal } from "./AideProposalModal";
import { CalamityDebuffStrip } from "./CalamityDebuffStrip";
import { CalamityOnsetModal } from "./CalamityOnsetModal";
import { CalculationModal } from "./CalculationModal";
import { DispatchLog } from "./DispatchLog";
import { GameEndModal } from "./GameEndModal";
import { HowToRulePanel } from "./HowToRulePanel";
import { ThroneHud } from "./ThroneHud";
import { WeeklyReportModal } from "./WeeklyReportModal";
import { YearReviewModal } from "./YearReviewModal";

const pages: { path: string; label: string; subtitle: string }[] = [
	{
		path: "/map",
		label: "Country Map",
		subtitle: "Regional Atlas",
	},
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

const PHASE_LABELS: Record<"daily" | "annual" | "mutation", string> = {
	daily: "Updating today's cohort",
	annual: "Running the annual population cycle",
	mutation: "Applying throne decree to the population",
};

/**
 * Persistent chrome (nav, header, footer) around every routed page, plus the
 * day-advance progress overlay — both live here since they're independent of
 * which page is currently active.
 */
function AppShell() {
	const location = useLocation();
	const {
		isAdvancingDay,
		dayAdvanceProgress,
		gameRun,
		restartNation,
		total,
		pendingCalamityOnsets,
		respondToCalamityOnsets,
		pendingWeeklyReport,
		respondToWeeklyReport,
		pendingAideProposal,
		respondToAideProposal,
		pendingYearReview,
		dismissYearReview,
		gameDay,
	} = usePopulation();
	const activePage =
		pages.find((item) => location.pathname.startsWith(item.path)) ?? pages[0];
	const showGameEndModal =
		gameRun != null && (gameRun.status === "won" || gameRun.status === "lost");
	const activeCalamityCount = getVisibleActiveCalamities(
		gameRun?.activeCalamities ?? [],
		gameDay,
	).length;

	const daysLabel =
		dayAdvanceProgress?.daysTotal != null && dayAdvanceProgress.daysTotal > 1
			? ` · day ${(dayAdvanceProgress.daysCompleted ?? 0) + 1} of ${dayAdvanceProgress.daysTotal}`
			: "";

	return (
		<main className="min-h-screen p-4 font-sans sm:p-6">
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
						{activeCalamityCount > 0 && (
							<p className="mt-2 font-label text-[10px] tracking-overline text-highlight">
								{activeCalamityCount} active calamit
								{activeCalamityCount === 1 ? "y" : "ies"}
							</p>
						)}
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

					<ThroneHud />

					<div className="border-b border-primary px-4 py-3 sm:px-6">
						<p className="font-label text-[10px] tracking-overline text-muted-foreground">
							Recent dispatches
						</p>
						<div className="mt-2">
							<DispatchLog limit={3} />
						</div>
					</div>

					<CalamityDebuffStrip />

					<section className="px-6 py-8 sm:px-8">
						<Outlet />
					</section>

					<footer className="border-t-2 border-primary bg-surface-muted px-6 py-3 sm:px-8">
						<p className="font-label text-center text-xs text-muted-foreground tracking-overline">
							Monarch command desk · {new Date().getFullYear()}
						</p>
						<p className="mt-1 text-center text-[10px] text-muted-foreground/70">
							v{appVersion}
						</p>
					</footer>
				</div>
			</div>

			<CalculationModal
				isOpen={
					isAdvancingDay &&
					pendingCalamityOnsets.length === 0 &&
					!pendingWeeklyReport &&
					!pendingAideProposal &&
					!pendingYearReview
				}
				title={
					dayAdvanceProgress
						? `${PHASE_LABELS[dayAdvanceProgress.phase]}${daysLabel}`
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

			{pendingCalamityOnsets.length > 0 && (
				<CalamityOnsetModal
					onsets={pendingCalamityOnsets}
					onRespond={(response) => {
						respondToCalamityOnsets(response).catch(() => undefined);
					}}
				/>
			)}

			{pendingWeeklyReport && pendingCalamityOnsets.length === 0 && (
				<WeeklyReportModal
					report={pendingWeeklyReport}
					onRespond={(choiceId) => {
						respondToWeeklyReport(choiceId).catch(() => undefined);
					}}
				/>
			)}

			{pendingAideProposal &&
				pendingCalamityOnsets.length === 0 &&
				!pendingWeeklyReport && (
					<AideProposalModal
						proposal={pendingAideProposal}
						onRespond={(choice) => {
							respondToAideProposal(choice).catch(() => undefined);
						}}
					/>
				)}

			{pendingYearReview &&
				pendingCalamityOnsets.length === 0 &&
				!pendingWeeklyReport &&
				!pendingAideProposal && (
					<YearReviewModal
						review={pendingYearReview}
						onContinue={dismissYearReview}
					/>
				)}

			<HowToRulePanel />

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
