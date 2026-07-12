import { getCalamityDefinition } from "economy-simulator-data";
import type { CalamityPlayerResponse } from "economy-simulator-persistence";
import { useRegions } from "../context/RegionContext";
import type { CalamityOnsetSummary } from "../game/advance-day-result";
import { RESPONSE_EFFECTS } from "../game/calamity-responses";

interface CalamityOnsetModalProps {
	onsets: CalamityOnsetSummary[];
	onRespond: (response: CalamityPlayerResponse) => void;
}

const SEVERITY_CLASS: Record<string, string> = {
	minor: "border-warning text-warning",
	moderate: "border-orange text-orange",
	severe: "border-destructive text-destructive",
};

const RESPONSES: CalamityPlayerResponse[] = ["relief", "rebuild", "endure"];

/**
 * Interrupts multi-day advances when one or more calamities begin.
 * Player picks one response applied to every onset in this interrupt.
 */
function CalamityOnsetModal({ onsets, onRespond }: CalamityOnsetModalProps) {
	const { regions } = useRegions();
	const nameById = new Map(regions.map((region) => [region.id, region.name]));

	if (onsets.length === 0) return null;

	return (
		<div
			className="fixed inset-0 z-[60] flex items-center justify-center bg-neutral-950/80 p-4"
			role="dialog"
			aria-modal="true"
			aria-labelledby="calamity-onset-title"
		>
			<div className="w-full max-w-lg border-4 border-accent bg-surface shadow-lg shadow-surface-shadow">
				<header className="border-b-4 border-accent bg-destructive/10 px-6 py-5 text-center">
					<p className="font-label text-[10px] tracking-overline text-muted-foreground">
						Nation alert
					</p>
					<h2 id="calamity-onset-title" className="mt-2 text-sm text-highlight">
						{onsets.length === 1 ? "Calamity strikes" : "Calamities strike"}
					</h2>
				</header>

				<ul className="max-h-[40vh] space-y-4 overflow-y-auto px-6 py-5">
					{onsets.map((onset) => {
						const definition = getCalamityDefinition(onset.calamityId);
						const regionLabels = onset.regionIds.map(
							(id) => nameById.get(id) ?? id,
						);
						return (
							<li
								key={onset.instanceId}
								className={`border-2 bg-surface-muted px-4 py-3 ${SEVERITY_CLASS[onset.severity] ?? "border-primary"}`}
							>
								<div className="flex flex-wrap items-baseline justify-between gap-2">
									<p className="text-sm text-foreground">{onset.name}</p>
									<span className="font-label text-[10px] tracking-overline uppercase">
										{onset.severity}
										{onset.fromCascade ? " · cascade" : ""}
									</span>
								</div>
								{definition?.description && (
									<p className="mt-2 text-sm leading-relaxed text-muted-foreground">
										{definition.description}
									</p>
								)}
								<p className="mt-2 font-label text-[10px] tracking-overline text-muted-foreground">
									Regions: {regionLabels.join(", ") || "Nationwide"}
								</p>
							</li>
						);
					})}
				</ul>

				<div className="space-y-2 border-t-2 border-primary px-6 py-4">
					<p className="font-label text-[10px] tracking-overline text-muted-foreground">
						Choose a response
						{onsets.length > 1 ? " (applies to all above)" : ""}
					</p>
					{RESPONSES.map((response) => {
						const effect = RESPONSE_EFFECTS[response];
						return (
							<button
								key={response}
								type="button"
								onClick={() => onRespond(response)}
								className="w-full cursor-pointer border-2 border-primary bg-surface px-4 py-3 text-left transition-colors hover:bg-primary hover:text-primary-foreground"
							>
								<span className="font-label text-[10px] tracking-overline">
									{effect.label}
								</span>
								<span className="mt-1 block text-xs leading-relaxed opacity-90">
									{effect.detail}
								</span>
							</button>
						);
					})}
				</div>
			</div>
		</div>
	);
}

export { CalamityOnsetModal };
