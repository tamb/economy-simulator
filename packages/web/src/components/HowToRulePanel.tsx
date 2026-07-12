import { useEffect, useId, useState } from "react";
import { usePopulation } from "../context/PopulationContext";
import { HOW_TO_RULE_STEPS } from "../lib/how-to-rule";

/**
 * Fixed bottom-right toggle that opens a slide-up "How to rule" briefing.
 * Auto-opens once per run until the player dismisses it.
 */
function HowToRulePanel() {
	const panelId = useId();
	const { gameRun, dismissCoachMarks, isGameActive } = usePopulation();
	const [isOpen, setIsOpen] = useState(false);

	useEffect(() => {
		if (isGameActive && gameRun && !gameRun.coachMarksDismissed) {
			setIsOpen(true);
		}
	}, [gameRun, isGameActive]);

	if (!isGameActive) {
		return null;
	}

	const isFirstBriefing = !gameRun?.coachMarksDismissed;

	function closePanel(): void {
		setIsOpen(false);
		if (isFirstBriefing) {
			dismissCoachMarks().catch(() => undefined);
		}
	}

	return (
		<div className="fixed bottom-0 right-0 z-[55] flex flex-col items-end">
			{isOpen && (
				<section
					id={panelId}
					role="dialog"
					aria-modal="false"
					aria-labelledby={`${panelId}-title`}
					className="animate-slide-up-panel w-screen max-w-md border-t-4 border-primary bg-surface shadow-2xl shadow-surface-shadow sm:border-4 sm:border-b-0"
				>
					<header className="flex items-start justify-between gap-3 border-b-2 border-primary bg-neutral-950 px-4 py-3 text-on-dark">
						<div>
							<p className="font-label text-[10px] tracking-overline text-on-dark-muted">
								{isFirstBriefing ? "First reign briefing" : "Quick reference"}
							</p>
							<h2
								id={`${panelId}-title`}
								className="mt-1 text-xs text-highlight"
							>
								How to rule
							</h2>
						</div>
						<button
							type="button"
							onClick={closePanel}
							aria-label="Close how to rule panel"
							className="cursor-pointer border border-on-dark-muted px-2 py-1 text-[10px] text-on-dark-muted hover:text-on-dark"
						>
							Close
						</button>
					</header>

					<ul className="max-h-[50vh] space-y-3 overflow-y-auto px-4 py-4 text-sm">
						{HOW_TO_RULE_STEPS.map((step) => (
							<li key={step.title}>
								<p className="font-label text-[10px] tracking-overline text-muted-foreground">
									{step.title}
								</p>
								<p className="mt-1 leading-relaxed">{step.body}</p>
							</li>
						))}
					</ul>

					<div className="border-t-2 border-primary px-4 py-3">
						<button
							type="button"
							onClick={closePanel}
							className="w-full cursor-pointer border-2 border-primary bg-primary px-4 py-2 text-primary-foreground"
						>
							{isFirstBriefing ? "Begin ruling" : "Back to the throne"}
						</button>
					</div>
				</section>
			)}

			<button
				type="button"
				aria-expanded={isOpen}
				aria-controls={isOpen ? panelId : undefined}
				onClick={() => setIsOpen((open) => !open)}
				className="cursor-pointer border-2 border-primary bg-primary px-4 py-2 font-label text-[10px] tracking-overline text-primary-foreground shadow-lg shadow-surface-shadow transition-colors hover:bg-primary/90"
			>
				How to rule
			</button>
		</div>
	);
}

export { HowToRulePanel };
