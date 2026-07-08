import type { ReactNode } from "react";
import { registerChartTheme } from "../../data/chart-theme";

registerChartTheme();

interface ChartCardProps {
	title: string;
	description?: string;
	children: ReactNode;
	/** Fixed canvas height in pixels; Chart.js needs a bounded container to size itself. */
	height?: number;
}

function ChartCard({
	title,
	description,
	children,
	height = 260,
}: ChartCardProps) {
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
