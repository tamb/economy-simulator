import type { AideProposalChoiceKind } from "economy-simulator-data";
import { AIDE_ROLE_LABELS } from "economy-simulator-data";
import { Face } from "facesjs/react";
import { useFacePool } from "../context/FacePoolContext";
import type { FaceId } from "../data/faces";
import { isFaceId } from "../data/faces";
import type { AideProposalSummary } from "../game/advance-day-result";

interface AideProposalModalProps {
	proposal: AideProposalSummary;
	onRespond: (choice: AideProposalChoiceKind) => void;
}

/**
 * Inner-circle aide delivers an executive-order proposal with face + dialog.
 */
function AideProposalModal({ proposal, onRespond }: AideProposalModalProps) {
	const { getFace } = useFacePool();
	const faceId = isFaceId(proposal.faceId) ? (proposal.faceId as FaceId) : null;
	const face = faceId ? getFace(faceId) : undefined;

	return (
		<div
			className="fixed inset-0 z-[60] flex items-center justify-center bg-neutral-950/80 p-4"
			role="dialog"
			aria-modal="true"
			aria-labelledby="aide-proposal-title"
		>
			<div className="w-full max-w-lg border-4 border-primary bg-surface shadow-lg shadow-surface-shadow">
				<header className="border-b-4 border-primary bg-neutral-950 px-6 py-5 text-on-dark">
					<p className="font-label text-[10px] tracking-overline text-on-dark-muted">
						Inner circle · Day {proposal.gameDay.toLocaleString()}
					</p>
					<h2 id="aide-proposal-title" className="mt-2 text-sm text-highlight">
						{proposal.title}
					</h2>
				</header>

				<div className="flex gap-4 px-6 py-5">
					{face && (
						<div className="shrink-0 border-2 border-primary bg-surface-muted p-1">
							<Face face={face} lazy style={{ width: 72, height: 108 }} />
						</div>
					)}
					<div className="min-w-0 space-y-2">
						<p className="font-label text-[10px] tracking-overline text-muted-foreground">
							{proposal.aideName}, {AIDE_ROLE_LABELS[proposal.aideRole]}
						</p>
						<blockquote className="text-sm leading-relaxed">
							“{proposal.dialog}”
						</blockquote>
					</div>
				</div>

				<div className="space-y-2 border-t-2 border-primary px-6 py-4">
					<p className="font-label text-[10px] tracking-overline text-muted-foreground">
						Your decision
					</p>
					{proposal.choices.map((choice) => (
						<button
							key={choice.kind}
							type="button"
							onClick={() => onRespond(choice.kind)}
							className={`w-full cursor-pointer border-2 px-4 py-3 text-left transition-colors ${
								choice.kind === "approve"
									? "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
									: "border-primary bg-surface hover:bg-surface-muted"
							}`}
						>
							<p className="text-sm">{choice.label}</p>
							<p className="mt-1 text-xs opacity-80">{choice.hint}</p>
						</button>
					))}
				</div>
			</div>
		</div>
	);
}

export { AideProposalModal };
