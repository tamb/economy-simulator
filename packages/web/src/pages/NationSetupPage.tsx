import { categories } from "economy-simulator-data";
import { Link } from "react-router";
import { usePopulation } from "../context/PopulationContext";
import { useSectorAssignments } from "../context/SectorAssignmentContext";

function NationSetupPage() {
	const {
		total,
		isGenerating,
		loadProgress,
		autoAssignAll,
		startConfiguredGame,
	} = usePopulation();
	const { setupValidation, refresh } = useSectorAssignments();

	return (
		<div className="space-y-6">
			<header className="space-y-2">
				<h2 className="text-xs sm:text-sm">Configure Your Nation</h2>
				<p className="text-sm leading-relaxed text-muted-foreground">
					Assign an economic system and role structure to every sub-sector
					before the simulation begins. {total.toLocaleString()} citizens will
					be generated when you start the game.
				</p>
			</header>

			<div className="border-2 border-primary/30 bg-surface-muted p-5">
				<p className="font-label text-[10px] tracking-overline text-muted-foreground">
					Setup progress
				</p>
				<p className="mt-2 text-sm">
					{setupValidation.configuredCount} / {setupValidation.totalCount}{" "}
					sub-sectors configured
				</p>
				{!setupValidation.ready && setupValidation.issues.length > 0 && (
					<ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-destructive">
						{setupValidation.issues.slice(0, 5).map((issue) => (
							<li key={issue.sectorKey}>
								{issue.categoryLabel} / {issue.subSectorLabel}: {issue.reason}
							</li>
						))}
						{setupValidation.issues.length > 5 && (
							<li>…and {setupValidation.issues.length - 5} more</li>
						)}
					</ul>
				)}
			</div>

			<div className="flex flex-wrap gap-3">
				<button
					type="button"
					onClick={() => {
						autoAssignAll()
							.then(() => refresh())
							.catch(() => undefined);
					}}
					className="border-2 border-primary bg-surface px-4 py-2 text-xs text-foreground"
				>
					Auto-assign all
				</button>
				<button
					type="button"
					onClick={() => {
						startConfiguredGame().catch(() => undefined);
					}}
					disabled={!setupValidation.ready || isGenerating}
					className="border-2 border-primary bg-primary px-4 py-2 text-xs text-primary-foreground disabled:opacity-50"
				>
					{isGenerating ? "Starting game…" : "Start game"}
				</button>
			</div>

			{isGenerating && (
				<p className="text-sm text-muted-foreground">
					Generating population… {loadProgress.toLocaleString()} /{" "}
					{total.toLocaleString()}
				</p>
			)}

			<section className="space-y-3">
				<h3 className="text-[10px] sm:text-xs">Sectors by category</h3>
				<ul className="grid gap-2 sm:grid-cols-2">
					{categories.map((category) => (
						<li key={category.id}>
							<Link
								to={`/atlas/${category.id}`}
								className="block border-2 border-primary/30 bg-surface-muted px-4 py-3 text-sm hover:border-primary"
							>
								{category.shortLabel}
							</Link>
						</li>
					))}
				</ul>
			</section>
		</div>
	);
}

export { NationSetupPage };
