import { statGlossary } from "../lib/stat-glossary";

interface StatGlossaryModalProps {
	isOpen: boolean;
	onClose: () => void;
}

function StatGlossaryModal({ isOpen, onClose }: StatGlossaryModalProps) {
	if (!isOpen) return null;

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-neutral-950/70 p-4"
			role="dialog"
			aria-modal="true"
			aria-labelledby="stat-glossary-title"
		>
			<div className="my-auto flex max-h-[min(90vh,36rem)] w-full max-w-lg flex-col overflow-hidden border-2 border-primary bg-surface shadow-lg shadow-surface-shadow">
				<header className="flex shrink-0 items-start justify-between gap-4 border-b-2 border-primary/30 px-5 py-4">
					<div>
						<p className="font-label text-[10px] tracking-overline text-muted-foreground">
							Citizen stats
						</p>
						<h2 id="stat-glossary-title" className="mt-1 text-xs sm:text-sm">
							What do these stats mean?
						</h2>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="border-2 border-primary/30 bg-surface-muted px-3 py-1.5 text-xs hover:border-primary"
					>
						Close
					</button>
				</header>

				<div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
					{statGlossary.map((entry) => (
						<section key={entry.id} className="space-y-1">
							<h3 className="text-[10px] sm:text-xs">{entry.title}</h3>
							<p className="text-sm leading-relaxed text-muted-foreground">
								{entry.summary}
							</p>
						</section>
					))}
				</div>
			</div>
		</div>
	);
}

export { StatGlossaryModal };
