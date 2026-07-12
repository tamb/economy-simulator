import type { ReactNode } from "react";

interface CollapsibleSectionProps {
	title: string;
	children: ReactNode;
	/** Whether the section starts expanded. */
	defaultOpen?: boolean;
}

function CollapsibleSection({
	title,
	children,
	defaultOpen = false,
}: CollapsibleSectionProps) {
	return (
		<details
			className="group border-2 border-primary/30 bg-surface-muted"
			open={defaultOpen || undefined}
		>
			<summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5 marker:content-none [&::-webkit-details-marker]:hidden">
				<h3 className="text-[10px] sm:text-xs">{title}</h3>
				<span
					aria-hidden
					className="font-label text-[10px] tracking-overline text-muted-foreground"
				>
					<span className="group-open:hidden">+</span>
					<span className="hidden group-open:inline">−</span>
				</span>
			</summary>
			<div className="space-y-2 border-t border-primary/30 px-5 pb-5 pt-4">
				{children}
			</div>
		</details>
	);
}

export { CollapsibleSection };
