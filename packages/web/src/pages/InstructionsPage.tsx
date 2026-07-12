import { CollapsibleSection } from "../components/CollapsibleSection";
import { HOW_TO_RULE_STEPS } from "../lib/how-to-rule";

function InstructionsPage() {
	return (
		<div className="space-y-4">
			<header className="space-y-2">
				<h2 className="text-xs sm:text-sm">How to Play</h2>
				<p className="text-sm leading-relaxed text-muted-foreground">
					You are the monarch of a procedurally generated island nation. Steer
					the economy, watch citizens live and die, and try to grow the
					population instead of losing it to emigration. During an active run,
					use the <strong>How to rule</strong> button fixed to the bottom-right
					of the screen for a quick slide-up briefing.
				</p>
			</header>

			<CollapsibleSection title="Getting started" defaultOpen>
				<ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed">
					<li>
						Pick a starting population size (10k / 100k / 1M) on first launch.
					</li>
					<li>
						Configure every sub-sector's economic system and role mix on the
						Nation Setup screen (or use Auto-assign all), then press Start game.
					</li>
					<li>
						The game generates a unique island (biomes, resource deposits,
						ocean) and assigns every citizen a home region, job, and economic
						role. Working-age citizens (18–65) are employed; children and
						retirees are not.
					</li>
					<li>
						The default landing page is the <strong>Country Map</strong> — your
						command view for regional health and calamity scars.
					</li>
				</ul>
			</CollapsibleSection>

			<CollapsibleSection title="How to rule">
				<p className="text-sm leading-relaxed text-muted-foreground">
					Once your nation is active, the bottom-right{" "}
					<strong>How to rule</strong> button opens a slide-up panel you can
					reopen any time. It covers the essentials below; this page goes
					deeper.
				</p>
				<ul className="mt-3 space-y-3 text-sm leading-relaxed">
					{HOW_TO_RULE_STEPS.map((step) => (
						<li key={step.title}>
							<p className="font-label text-[10px] tracking-overline text-muted-foreground">
								{step.title}
							</p>
							<p className="mt-1">{step.body}</p>
						</li>
					))}
				</ul>
			</CollapsibleSection>

			<CollapsibleSection title="Your levers">
				<ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed">
					<li>
						<strong>Throne controls</strong> — Advance day, week, or year from
						the header on every play screen. The strip shows day, year,
						population, nation score, the active royal mandate, and win/lose
						streak progress.
					</li>
					<li>
						<strong>Sector Atlas (setup)</strong> — assign an economic system
						and role mix to each sub-sector before the run begins. Systems
						affect extraction efficiency, environmental impact, and worker
						morale; roles further modulate QoL and labor effectiveness.
					</li>
					<li>
						<strong>Labor edicts (mid-game)</strong> — during play, pick a
						sub-sector in the Sector Atlas and move a share of its workers
						(5–50%) to another sector. Citizens lose a little happiness from the
						disruption.
					</li>
					<li>
						<strong>Role reforms (mid-game)</strong> — re-roll roles for living
						workers in a sector using your current role mix quotas. Useful when
						you change systems but need the workforce to catch up.
					</li>
					<li>
						<strong>Population</strong> — browse the citizen registry and filter
						by region from the map. Each day updates one cohort's quality of
						life; once a full year passes, the annual cycle runs (births,
						deaths, migration, resource extraction, national ledger).
					</li>
				</ul>
			</CollapsibleSection>

			<CollapsibleSection title="Reading the world">
				<ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed">
					<li>
						<strong>Country Map</strong> — color by terrain, population,
						happiness, health, or environment. Click a land tile to see its
						biome, overlays, reserves, and regional stats. Regions under active
						calamities pulse red; use the link to open that region in the
						population registry.
					</li>
					<li>
						<strong>Dispatch log</strong> — stamped event cards under the throne
						bar (and a fuller log on Records) track calamities, edicts, reforms,
						mandates, emigration spikes, and resource shortfalls.
					</li>
					<li>
						<strong>Citizen dossier</strong> — click any person card on the
						Population page to see a happiness and health breakdown (work hours,
						job fit, environment, shortfalls, calamity pressure).
					</li>
					<li>
						<strong>Dashboards</strong> — cabinet-briefing charts for population
						demographics, sector employment, national quality-of-life trends,
						nation score, and (after the first completed game year) the Resource
						Ledger tab showing production vs. demand per resource.
					</li>
				</ul>
			</CollapsibleSection>

			<CollapsibleSection title="What to watch">
				<ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed">
					<li>
						Citizens care about happiness (work hours, job fit, resource
						shortfalls, calamity pressure) and health (which follows happiness).
						Low quality of life drives emigration and raises mortality.
					</li>
					<li>
						Extractive jobs only exist where a region's terrain supports them.
						Over-extraction degrades the land and local environment, which feeds
						back into citizen quality of life.
					</li>
					<li>
						Industrial sectors need resource inputs. If national production
						falls short of demand, workers in those sectors take a happiness
						penalty.
					</li>
					<li>
						Sector detail panels preview how the assigned economic system will
						scale extraction efficiency, environmental impact, and morale before
						you commit workers there.
					</li>
				</ul>
			</CollapsibleSection>

			<CollapsibleSection title="Calamities">
				<ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed">
					<li>
						Fires, storms, quakes, disease, and other shocks can strike regions
						during a run. New calamities interrupt time advances — choose{" "}
						<strong>Relief</strong>, <strong>Rebuild</strong>, or{" "}
						<strong>Endure</strong>. Active ones appear as nation debuffs and
						pulse on the map.
					</li>
					<li>
						Expect at least one primary calamity every{" "}
						<strong>28-day month</strong>, with more frequent rolls than early
						builds.
					</li>
					<li>
						Each calamity has an immediate hit (reserves, environment), a
						mid-term drag on production and happiness, and a quieter long-term
						scar after the banner clears.
					</li>
					<li>
						Score still comes from QoL, growth, resources, and environment —
						calamities pressure those channels rather than subtracting arbitrary
						industry points.
					</li>
				</ul>
			</CollapsibleSection>

			<CollapsibleSection title="Weekly reports and inner circle">
				<ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed">
					<li>
						Every <strong>7 days</strong> a weekly region report lists the
						worst-performing provinces. Choose an investment, compromise, or
						endure option for the primary region.
					</li>
					<li>
						Twice per <strong>28-day month</strong> (days 14 and 28) an
						inner-circle aide (Steward, Marshal, Chancellor, or Vizier) proposes
						an executive order. Approve, compromise, or reject — with a facesJS
						portrait and dialog.
					</li>
					<li>
						These interrupts pause day/week/year advances until you decide, same
						as calamities and the Year in Review.
					</li>
				</ul>
			</CollapsibleSection>

			<CollapsibleSection title="Royal mandates">
				<ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed">
					<li>
						When a run begins you receive a <strong>royal mandate</strong> for
						the current year — secure the ledger, stem emigration, lift QoL, or
						heal the land.
					</li>
					<li>
						The active mandate appears in the throne bar. Meet its target before
						the annual cycle closes to earn bonus nation score and the Royal
						Mandate badge.
					</li>
					<li>
						The <strong>Year in Review</strong> modal reports whether you
						fulfilled or missed the mandate, alongside population change, score
						delta, and calamities that struck that year.
					</li>
				</ul>
			</CollapsibleSection>

			<CollapsibleSection title="Win, lose, and records">
				<ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed">
					<li>
						Every nation run ends in <strong>victory</strong> or{" "}
						<strong>defeat</strong> — grow population, keep quality of life
						high, balance the resource ledger, and protect the environment.
					</li>
					<li>
						Each completed game year updates your <strong>nation score</strong>{" "}
						(Dashboards → Nation Score) from QoL, growth, migration, resources,
						and environment health.
					</li>
					<li>
						<strong>Records</strong> tracks career wins/losses, best score,
						badge unlocks, dispatch history, and run history across every nation
						you found.
					</li>
				</ul>
			</CollapsibleSection>
		</div>
	);
}

export { InstructionsPage };
