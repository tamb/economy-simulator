function InstructionsPage() {
	return (
		<div className="space-y-6">
			<header className="space-y-2">
				<h2 className="text-xs sm:text-sm">How to Play</h2>
				<p className="text-sm leading-relaxed text-muted-foreground">
					You are the monarch of a procedurally generated island nation. Steer
					the economy, watch citizens live and die, and try to grow the
					population instead of losing it to emigration.
				</p>
			</header>

			<section className="space-y-2 border-2 border-primary/30 bg-surface-muted p-5">
				<h3 className="text-[10px] sm:text-xs">Getting started</h3>
				<ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed">
					<li>
						Pick a starting population size (10k / 100k / 1M) on first launch.
					</li>
					<li>
						The game generates a unique island (biomes, resource deposits,
						ocean) and assigns every citizen a home region. Working-age citizens
						(18–65) also get a job; children and retirees do not.
					</li>
				</ul>
			</section>

			<section className="space-y-2 border-2 border-primary/30 bg-surface-muted p-5">
				<h3 className="text-[10px] sm:text-xs">Your levers</h3>
				<ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed">
					<li>
						<strong>Sector Atlas</strong> — assign an economic system to each
						sub-sector. This now affects extraction efficiency, environmental
						impact, and worker morale.
					</li>
					<li>
						<strong>Population</strong> — advance one in-game day at a time.
						Each day updates one cohort's quality of life; once a full year
						passes, the annual cycle runs (births, deaths, migration, resource
						extraction, national ledger).
					</li>
				</ul>
			</section>

			<section className="space-y-2 border-2 border-primary/30 bg-surface-muted p-5">
				<h3 className="text-[10px] sm:text-xs">Reading the world</h3>
				<ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed">
					<li>
						<strong>Country Map</strong> — color by terrain, population,
						happiness, health, or environment. Click a land tile to see its
						biome, overlays, reserves, and regional stats.
					</li>
					<li>
						<strong>Dashboards</strong> — population demographics, sector
						employment, national quality-of-life trends, and (after the first
						completed game year) the Resource Ledger tab showing production vs.
						demand per resource.
					</li>
				</ul>
			</section>

			<section className="space-y-2 border-2 border-primary/30 bg-surface-muted p-5">
				<h3 className="text-[10px] sm:text-xs">What to watch</h3>
				<ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed">
					<li>
						Citizens care about happiness (work hours, job fit, resource
						shortfalls) and health (which follows happiness). Low quality of
						life drives emigration and raises mortality.
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
				</ul>
			</section>
			<section className="space-y-2 border-2 border-primary/30 bg-surface-muted p-5">
				<h3 className="text-[10px] sm:text-xs">Calamities</h3>
				<ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed">
					<li>
						Fires, storms, quakes, disease, and other shocks can strike regions
						during a run. Active ones appear as <strong>nation debuffs</strong>{" "}
						under the header with days remaining.
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
			</section>

			<section className="space-y-2 border-2 border-primary/30 bg-surface-muted p-5">
				<h3 className="text-[10px] sm:text-xs">Win, lose, and records</h3>
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
						badge unlocks, and run history across every nation you found.
					</li>
				</ul>
			</section>
		</div>
	);
}

export { InstructionsPage };
