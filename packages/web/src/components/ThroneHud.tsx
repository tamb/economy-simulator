import { useEffect, useRef } from "react";
import { usePopulation } from "../context/PopulationContext";
import { getGameYear } from "../data/calendar";
import { getThreatsAndGoals } from "../data/threats-and-goals";

/**
 * Persistent throne controls: time, score, threats/goals, and advance actions.
 */
function ThroneHud() {
	const {
		gameDay,
		total,
		gameRun,
		isGameActive,
		isAdvancingDay,
		advanceDay,
		advanceWeek,
		advanceYear,
	} = usePopulation();

	const year = getGameYear(gameDay);
	const nationScore = gameRun?.scoreHistory.at(-1)?.total;
	const previousScore = gameRun?.scoreHistory.at(-2)?.total;
	const scoreRef = useRef<HTMLSpanElement>(null);
	const threatsAndGoals = getThreatsAndGoals(gameRun);
	const disabled = isAdvancingDay || !isGameActive;
	const activeMandate = gameRun?.activeMandate;

	useEffect(() => {
		if (scoreRef.current && nationScore != null) {
			scoreRef.current.classList.remove("animate-score-tick");
			void scoreRef.current.offsetWidth;
			scoreRef.current.classList.add("animate-score-tick");
		}
	}, [nationScore]);

	return (
		<section
			className="border-b-2 border-primary bg-surface-muted px-4 py-3 sm:px-6"
			aria-label="Throne controls"
		>
			<div className="flex flex-wrap items-end justify-between gap-3">
				<dl className="flex flex-wrap gap-4 text-sm">
					<div>
						<dt className="font-label text-[10px] tracking-overline text-muted-foreground">
							Day
						</dt>
						<dd>{gameDay.toLocaleString()}</dd>
					</div>
					<div>
						<dt className="font-label text-[10px] tracking-overline text-muted-foreground">
							Year
						</dt>
						<dd>{year.toLocaleString()}</dd>
					</div>
					<div>
						<dt className="font-label text-[10px] tracking-overline text-muted-foreground">
							Population
						</dt>
						<dd>{total.toLocaleString()}</dd>
					</div>
					<div>
						<dt className="font-label text-[10px] tracking-overline text-muted-foreground">
							Nation score
						</dt>
						<dd>
							<span ref={scoreRef}>
								{nationScore == null ? "—" : Math.round(nationScore).toString()}
							</span>
							{previousScore != null && nationScore != null && (
								<span className="ml-1 text-xs text-muted-foreground">
									({Math.round(nationScore - previousScore) >= 0 ? "+" : ""}
									{Math.round(nationScore - previousScore)})
								</span>
							)}
						</dd>
					</div>
				</dl>

				<div className="flex flex-wrap gap-2">
					<button
						type="button"
						disabled={disabled}
						onClick={() => {
							advanceDay().catch(() => undefined);
						}}
						className="cursor-pointer border-2 border-primary bg-primary px-3 py-1.5 font-label text-[10px] tracking-overline text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
					>
						Advance day
					</button>
					<button
						type="button"
						disabled={disabled}
						onClick={() => {
							advanceWeek().catch(() => undefined);
						}}
						className="cursor-pointer border-2 border-primary bg-surface px-3 py-1.5 font-label text-[10px] tracking-overline text-foreground hover:border-primary disabled:cursor-not-allowed disabled:opacity-50"
					>
						Advance week
					</button>
					<button
						type="button"
						disabled={disabled}
						onClick={() => {
							advanceYear().catch(() => undefined);
						}}
						className="cursor-pointer border-2 border-primary bg-surface px-3 py-1.5 font-label text-[10px] tracking-overline text-foreground hover:border-primary disabled:cursor-not-allowed disabled:opacity-50"
					>
						Advance year
					</button>
				</div>
			</div>

			{!isGameActive && gameRun && (
				<p className="mt-2 font-label text-[10px] tracking-overline text-destructive">
					Run ended — {gameRun.status}
				</p>
			)}

			{activeMandate && (
				<section
					className="mt-3 border-2 border-highlight/60 bg-highlight/10 px-3 py-2"
					aria-label="Royal mandate"
				>
					<p className="font-label text-[10px] tracking-overline text-muted-foreground">
						Royal mandate · Year {activeMandate.yearIssued}
					</p>
					<p className="mt-1 text-xs">{activeMandate.label}</p>
					<p className="mt-1 text-xs text-muted-foreground">
						{activeMandate.description}
					</p>
				</section>
			)}

			{threatsAndGoals.length > 0 && (
				<ul
					className="mt-3 flex flex-wrap gap-2"
					aria-label="Threats and goals"
				>
					{threatsAndGoals.map((item) => (
						<li
							key={item.id}
							className={`border-2 px-2 py-1 font-label text-[10px] tracking-overline ${
								item.kind === "threat"
									? "border-destructive/50 bg-destructive/10 text-destructive"
									: "border-success/50 bg-success/10 text-foreground"
							}`}
						>
							{item.label} {item.progress}/{item.target}
						</li>
					))}
				</ul>
			)}
		</section>
	);
}

export { ThroneHud };
