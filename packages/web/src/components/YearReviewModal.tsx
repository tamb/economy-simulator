import type { YearReviewSummary } from "../game/advance-day-result";

interface YearReviewModalProps {
	review: YearReviewSummary;
	onContinue: () => void;
}

/**
 * Short year-end digest shown after each annual cycle.
 */
function YearReviewModal({ review, onContinue }: YearReviewModalProps) {
	const {
		stats,
		nationScore,
		previousNationScore,
		calamitiesThisYear,
		mandateResult,
	} = review;
	const popDelta = stats.populationAfter - stats.populationBefore;
	const scoreDelta =
		previousNationScore == null
			? null
			: Math.round(nationScore - previousNationScore);

	return (
		<div
			className="fixed inset-0 z-[60] flex items-center justify-center bg-neutral-950/80 p-4"
			role="dialog"
			aria-modal="true"
			aria-labelledby="year-review-title"
		>
			<div className="w-full max-w-md border-4 border-primary bg-surface shadow-lg shadow-surface-shadow">
				<header className="border-b-4 border-primary bg-neutral-950 px-6 py-5 text-center text-on-dark">
					<p className="font-label text-[10px] tracking-overline text-on-dark-muted">
						Cabinet briefing
					</p>
					<h2 id="year-review-title" className="mt-2 text-sm text-highlight">
						Year {stats.year} in review
					</h2>
				</header>

				<div className="space-y-4 px-6 py-6">
					<dl className="grid grid-cols-2 gap-3 text-sm">
						<div className="border-2 border-primary/30 bg-surface-muted px-3 py-2">
							<dt className="font-label text-[10px] tracking-overline text-muted-foreground">
								Population
							</dt>
							<dd className="mt-1">
								{stats.populationAfter.toLocaleString()}{" "}
								<span className="text-muted-foreground">
									({popDelta >= 0 ? "+" : ""}
									{popDelta.toLocaleString()})
								</span>
							</dd>
						</div>
						<div className="border-2 border-primary/30 bg-surface-muted px-3 py-2">
							<dt className="font-label text-[10px] tracking-overline text-muted-foreground">
								Nation score
							</dt>
							<dd className="mt-1">
								{Math.round(nationScore)}
								{scoreDelta != null && (
									<span className="text-muted-foreground">
										{" "}
										({scoreDelta >= 0 ? "+" : ""}
										{scoreDelta})
									</span>
								)}
							</dd>
						</div>
						<div className="border-2 border-primary/30 bg-surface-muted px-3 py-2">
							<dt className="font-label text-[10px] tracking-overline text-muted-foreground">
								Avg. QoL
							</dt>
							<dd className="mt-1">{stats.averageQualityOfLife.toFixed(1)}</dd>
						</div>
						<div className="border-2 border-primary/30 bg-surface-muted px-3 py-2">
							<dt className="font-label text-[10px] tracking-overline text-muted-foreground">
								Net migration
							</dt>
							<dd className="mt-1">
								+{stats.immigrations.toLocaleString()} / −
								{stats.emigrations.toLocaleString()}
							</dd>
						</div>
					</dl>

					<div className="text-sm text-muted-foreground">
						Births {stats.births.toLocaleString()} · Deaths{" "}
						{stats.deaths.toLocaleString()}
					</div>

					{mandateResult ? (
						<div
							className={`border-2 px-3 py-2 text-sm ${
								mandateResult.fulfilled
									? "border-success/50 bg-success/10"
									: "border-destructive/40 bg-destructive/10"
							}`}
						>
							<p className="font-label text-[10px] tracking-overline text-muted-foreground">
								Royal mandate
							</p>
							<p className="mt-1">{mandateResult.label}</p>
							<p className="mt-1 text-muted-foreground">
								{mandateResult.fulfilled
									? `Fulfilled · +${mandateResult.scoreBonus} score bonus`
									: "Missed this year"}
							</p>
						</div>
					) : null}

					{calamitiesThisYear.length > 0 ? (
						<div>
							<p className="font-label text-[10px] tracking-overline text-muted-foreground">
								Calamities this year
							</p>
							<ul className="mt-2 space-y-1 text-sm">
								{calamitiesThisYear.map((calamity) => (
									<li key={calamity.instanceId}>
										{calamity.name}{" "}
										<span className="text-muted-foreground">
											({calamity.severity})
										</span>
									</li>
								))}
							</ul>
						</div>
					) : (
						<p className="text-sm text-muted-foreground">
							No lasting calamities recorded this year.
						</p>
					)}

					<button
						type="button"
						onClick={onContinue}
						className="w-full cursor-pointer border-2 border-primary bg-primary px-4 py-3 text-primary-foreground transition-colors hover:bg-primary/90"
					>
						Continue reign
					</button>
				</div>
			</div>
		</div>
	);
}

export { YearReviewModal };
