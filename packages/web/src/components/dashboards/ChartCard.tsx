import type { ReactNode } from "react";
import { registerChartTheme } from "../../lib/chart-theme";

registerChartTheme();

interface ChartCardProps {
	title: string;
	description?: string;
	children: ReactNode;
	/** Fixed canvas height in pixels; Chart.js needs a bounded container to size itself. */
	height?: number;
	/** Cabinet briefing chrome for dashboard reports. */
	variant?: "default" | "briefing";
}

function ChartCard({
	title,
	description,
	children,
	height = 260,
	variant = "default",
}: ChartCardProps) {
	if (variant === "briefing") {
		return (
			<div className="border-4 border-primary bg-surface shadow-sm shadow-surface-shadow">
				<header className="border-b-4 border-primary bg-neutral-950 px-4 py-3 text-on-dark">
					<p className="font-label text-[10px] tracking-overline text-on-dark-muted">
						Cabinet briefing
					</p>
					<h3 className="mt-1 text-xs text-highlight">{title}</h3>
					{description && (
						<p className="mt-2 text-xs leading-relaxed text-on-dark-muted">
							{description}
						</p>
					)}
				</header>
				<div className="px-4 py-3" style={{ height }}>
					{children}
				</div>
			</div>
		);
	}

	return (
		<div className="border-2 border-primary bg-surface px-4 py-3">
			<h3 className="text-[10px] leading-relaxed sm:text-xs">{title}</h3>
			{description && (
				<p className="mt-1 text-xs leading-relaxed text-muted-foreground">
					{description}
				</p>
			)}
			<div className="mt-3" style={{ height }}>
				{children}
			</div>
		</div>
	);
}

export { ChartCard };
