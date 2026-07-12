interface CalculationModalProps {
	isOpen: boolean;
	title: string;
	subtitle?: string;
	processed: number;
	total: number;
}

/**
 * Retro-styled overlay for calculations that must run synchronously from the
 * player's point of view (day advance, annual population cycle) so they get
 * feedback instead of a frozen-looking UI. Extends the progress-bar pattern
 * already used on the population generation screen (see `PopulationPage`).
 */
function CalculationModal({
	isOpen,
	title,
	subtitle,
	processed,
	total,
}: CalculationModalProps) {
	if (!isOpen) return null;

	const percent = total === 0 ? 0 : Math.round((processed / total) * 100);

	return (
		<div
			role="dialog"
			aria-modal="true"
			aria-label={title}
			className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-neutral-950/70 p-4"
		>
			<div className="my-auto w-full max-w-sm border-2 border-primary bg-surface px-6 py-5 shadow-lg shadow-surface-shadow">
				<p className="font-label text-[10px] text-muted-foreground tracking-overline">
					Calculating
				</p>
				<h2 className="mt-1 text-xs sm:text-sm">{title}</h2>
				{subtitle && (
					<p className="mt-2 text-sm leading-relaxed text-muted-foreground">
						{subtitle}
					</p>
				)}

				<div className="mt-4 h-3 border-2 border-primary bg-surface-muted">
					<div
						className="h-full bg-primary transition-all"
						style={{ width: `${percent}%` }}
					/>
				</div>
				<p className="mt-2 text-right font-label text-[10px] text-muted-foreground tracking-overline">
					{processed.toLocaleString()} / {total.toLocaleString()} ({percent}%)
				</p>
			</div>
		</div>
	);
}

export { CalculationModal };
