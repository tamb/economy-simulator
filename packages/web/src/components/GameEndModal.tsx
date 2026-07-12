import type { GameRunState } from "economy-simulator-persistence";
import { formatEndReason } from "../lib/score-dashboard";
import { badgeTitle } from "./BadgeGallery";

interface GameEndModalProps {
	gameRun: GameRunState;
	onStartNewNation: () => void;
}

function GameEndModal({ gameRun, onStartNewNation }: GameEndModalProps) {
	const finalScore = gameRun.scoreHistory.at(-1)?.total ?? 0;
	const isWin = gameRun.status === "won";

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-neutral-950/80 p-4"
			role="dialog"
			aria-modal="true"
			aria-labelledby="game-end-title"
		>
			<div className="my-auto flex max-h-[min(90vh,42rem)] w-full max-w-md flex-col overflow-hidden border-4 border-primary bg-surface shadow-lg shadow-surface-shadow">
				<header
					className={`shrink-0 border-b-4 px-6 py-5 text-center ${
						isWin
							? "border-accent bg-accent/20"
							: "border-destructive bg-destructive/10"
					}`}
				>
					<p className="font-label text-[10px] tracking-overline text-muted-foreground">
						{isWin ? "Victory" : "Defeat"}
					</p>
					<h2 id="game-end-title" className="mt-2 text-lg text-highlight">
						{formatEndReason(gameRun.endReason)}
					</h2>
				</header>

				<div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-6">
					<p className="text-center text-3xl font-bold text-primary">
						{Math.round(finalScore)}
					</p>
					<p className="text-center text-sm text-muted-foreground">
						Final nation score after {gameRun.scoreHistory.length} game{" "}
						{gameRun.scoreHistory.length === 1 ? "year" : "years"}
					</p>

					{gameRun.unlockedThisRun.length > 0 && (
						<div>
							<p className="font-label text-[10px] tracking-overline text-muted-foreground">
								Badges earned this run
							</p>
							<ul className="mt-2 space-y-1 text-sm">
								{gameRun.unlockedThisRun.map((badgeId) => (
									<li key={badgeId}>{badgeTitle(badgeId)}</li>
								))}
							</ul>
						</div>
					)}

					<button
						type="button"
						onClick={onStartNewNation}
						className="w-full cursor-pointer border-2 border-primary bg-primary px-4 py-3 text-primary-foreground transition-colors hover:bg-primary/90"
					>
						Start New Nation
					</button>
				</div>
			</div>
		</div>
	);
}

export { GameEndModal };
