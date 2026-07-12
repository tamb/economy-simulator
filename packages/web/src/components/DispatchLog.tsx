import type { GameEvent } from "economy-simulator-persistence";
import { usePopulation } from "../context/PopulationContext";

const TYPE_LABEL: Record<GameEvent["type"], string> = {
	calamity_onset: "Calamity",
	calamity_response: "Response",
	year_end: "Year end",
	emigration_spike: "Exodus",
	resource_shortfall: "Shortfall",
	labor_edict: "Labor edict",
	role_reform: "Role reform",
	mandate_issued: "Mandate",
	mandate_completed: "Mandate met",
	mandate_failed: "Mandate missed",
	weekly_report: "Weekly report",
	weekly_decision: "Weekly decision",
	aide_proposal: "Aide counsel",
	executive_order: "Executive order",
};

/**
 * Compact stamped dispatch cards from the current run's event log.
 */
function DispatchLog({ limit = 6 }: { limit?: number }) {
	const { gameRun } = usePopulation();
	const events = [...(gameRun?.eventLog ?? [])].reverse().slice(0, limit);

	if (events.length === 0) {
		return (
			<p className="text-sm text-muted-foreground">
				No dispatches yet — advance time to hear from the provinces.
			</p>
		);
	}

	return (
		<ul className="space-y-2" aria-label="Recent dispatches">
			{events.map((event) => (
				<li
					key={event.id}
					className="border-2 border-primary/30 bg-surface-muted px-3 py-2"
				>
					<div className="flex flex-wrap items-baseline justify-between gap-2">
						<p className="font-label text-[10px] tracking-overline text-muted-foreground">
							Day {event.gameDay.toLocaleString()} · {TYPE_LABEL[event.type]}
						</p>
					</div>
					<p className="mt-1 text-sm text-foreground">{event.title}</p>
					<p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
						{event.detail}
					</p>
				</li>
			))}
		</ul>
	);
}

export { DispatchLog };
