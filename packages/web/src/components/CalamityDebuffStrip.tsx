import {
	daysRemainingOnMidTerm,
	getVisibleActiveCalamities,
} from "economy-simulator-simulation";
import { usePopulation } from "../context/PopulationContext";

/**
 * Persistent strip of active mid-term calamity debuffs with days remaining.
 */
function CalamityDebuffStrip() {
	const { gameDay, gameRun } = usePopulation();
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
					return (
						<li
							key={calamity.instanceId}
							className="border-2 border-primary/40 bg-surface px-3 py-2"
						>
							<p className="text-sm text-foreground">{calamity.name}</p>
							<p className="mt-0.5 font-label text-[10px] tracking-overline text-muted-foreground">
								{calamity.severity} · {calamity.regionIds.join(", ")} ·{" "}
								{daysLeft}d left
							</p>
						</li>
					);
				})}
			</ul>
		</section>
	);
}

export { CalamityDebuffStrip };
