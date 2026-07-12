# The Benevolent Monarch

You are the monarch of a procedurally generated island nation. Manage the
economy, steer up to 1,000,000 simulated citizens across economic sectors,
and keep quality of life high enough to grow your population instead of losing
it to unrest or emigration. Monorepo desktop app: **vite + React** wrapped in
**neutralino**.

## Screens

| Screen | What it does |
| --- | --- |
| New Game Setup | First-run screen; choose starting population — 10,000 / 100,000 (default) / 1,000,000 |
| Nation Setup | Assign economic systems and role mixes to every sub-sector (or auto-assign), then start |
| Country Map | Home command view — hex island; terrain / population / happiness / health / environment; calamity glow |
| Sector Atlas | Five-tier taxonomy; systems/roles at setup; mid-game labor edicts and role reforms |
| Population | Virtualized citizen registry; dossiers; region deep-links from the map |
| Dashboards | Population, sectors, country overview, resource ledger, nation score |
| Records | Career wins/losses, run score, badges, dispatches, calamity log |
| Instructions | How to play + How to rule (collapsible); mirrors in-game tip copy |
| Credits | Third-party attribution |

**Throne HUD** (on play screens): advance day / week / year, population, nation
score, active royal mandate, win/lose streak chips. Time advances pause for
blocking interrupts in order: calamity onset → weekly region report → aide
executive proposal → year in review.

Advancing a game day (and the annual population-dynamics cycle) runs in a Web
Worker so large populations don't freeze the UI; a retro `CalculationModal`
shows live progress.

## Quick start

```bash
bun install
bun run dev
```

## Full desktop build

```bash
bun run build
```

This runs: web build → `copy-web-to-desktop` → desktop package build.

## Quality gates

```bash
bun run lint:fix
bun run typecheck
bun run test
```

## End-to-end tests

`packages/web` also has a small Playwright suite that drives the real
production build in a browser (sector assignment + persistence, population
generation + the worker-driven day advance, the country map, and the
dashboards). Most specs run against a small population (`VITE_POPULATION_SIZE`
override, baked in at build time) so they finish in seconds instead of the
~70s a full 1,000,000 citizens takes to generate. `new-game-setup.spec.ts` is
the exception — it needs a second build with no override so it can exercise
the real first-run population-size picker (see `playwright.config.ts`).

```bash
cd packages/web
bun run test:e2e
```

## Documentation

| Doc | Purpose |
| --- | --- |
| [constitution/index.md](constitution/index.md) | Product intent, monorepo layout, agent rules |
| [packages/data/src/copy/README.md](packages/data/src/copy/README.md) | Editable creative copy (dialogue, tips, mandate labels) |
| [research/index.md](research/index.md) | Sourced simulation rules and model diagrams |
| [research/resources-and-geography.md](research/resources-and-geography.md) | Island generation, biomes, resource ledger, extraction economy |

## Packages

| Package | Path | Purpose |
| --- | --- | --- |
| Web | `packages/web` | React UI (vite), game orchestration, workers, screens |
| Simulation | `packages/simulation` | Pure TypeScript engine (QoL, population, resources, calamities, progression) |
| Geography | `packages/geography` | Pure, deterministic world generation |
| Data | `packages/data` | `AppConfig` / `GameSettings`, catalogs, briefing logic, copy JSON |
| Persistence | `packages/persistence` | Storage drivers and typed repositories |
| Desktop | `packages/desktop` | Neutralino wrapper |

Bootstrapped with [bootstrap-desktop-app](../bootstrap-desktop-app).
