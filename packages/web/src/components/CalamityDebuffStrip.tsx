import { getCalamityDefinition } from "economy-simulator-data";
import {
	daysRemainingOnMidTerm,
	getVisibleActiveCalamities,
} from "economy-simulator-simulation";
import { usePopulation } from "../context/PopulationContext";
import { useRegions } from "../context/RegionContext";

const SEVERITY_BORDER: Record<string, string> = {
	minor: "border-warning/60",
	moderate: "border-orange/70",
	severe: "border-destructive",
};

/**
 * Persistent strip of active mid-term calamity debuffs with days remaining.
 */
function CalamityDebuffStrip() {
	const { gameDay, gameRun } = usePopulation();
	const { regions } = useRegions();
	const nameById = new Map(regions.map((region) => [region.id, region.name]));
	const active = getVisibleActiveCalamities(
		gameRun?.activeCalamities ?? [],
		gameDay,
	);

	if (active.length === 0) return null;

	return (
		<section
			className="border-b border-primary bg-surface-muted px-6 py-3 sm:px-8"
			aria-label="Active nation calamities"
		>
			<p className="font-label text-[10px] tracking-overline text-muted-foreground">
				Active calamities
			</p>
			<ul className="mt-2 flex flex-wrap gap-2">
				{active.map((calamity) => {
					const daysLeft = daysRemainingOnMidTerm(calamity, gameDay);
					const definition = getCalamityDefinition(calamity.calamityId);
					const regionLabels = calamity.regionIds.map(
						(id) => nameById.get(id) ?? id,
					);
					const effectHint =
						definition?.midTerm.happinessPenaltyPerDay[calamity.severity] !=
						null
							? `Happiness −${definition.midTerm.happinessPenaltyPerDay[calamity.severity]}/day`
							: null;

					return (
						<li
							key={calamity.instanceId}
							className={`border-2 bg-surface px-3 py-2 ${SEVERITY_BORDER[calamity.severity] ?? "border-primary/40"}`}
						>
							<p className="text-sm text-foreground">{calamity.name}</p>
							<p className="mt-0.5 font-label text-[10px] tracking-overline text-muted-foreground">
								{calamity.severity} · {regionLabels.join(", ") || "Nationwide"}{" "}
								· {daysLeft}d left
								{effectHint ? ` · ${effectHint}` : ""}
							</p>
						</li>
					);
				})}
			</ul>
		</section>
	);
}

export { CalamityDebuffStrip };
