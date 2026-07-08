# economy-simulator

You are the monarch of a procedurally generated island nation. Manage the
economy, steer up to 1,000,000 simulated citizens across economic sectors,
and keep quality of life high enough to grow your population instead of losing
it to unrest or emigration. Monorepo desktop app: **vite + React** wrapped in
**neutralino**.

## Screens

| Screen | What it does |
| --- | --- |
| New Game Setup | First-run screen (no population exists yet); choose a starting population size — 10,000 / 100,000 (default) / 1,000,000 — before generation begins |
| Instructions | Concise how-to-play for the island economy, day advance, and dashboards |
| Sector Atlas | Browse the five-tier economic taxonomy and assign an economic system to each sub-sector |
| Population | Virtualized registry of every stored citizen; advances one cohort per in-game day |
| Country Map | Procedurally generated island hex map — color by terrain, population, happiness, health, or environment; hover tooltip + region inspector with reserves |
| Dashboards | Chart.js dashboards for population demographics, economic sectors, national quality-of-life trends, region leaderboard, and the national resource ledger |
| Credits | Third-party attribution |

Advancing a game day (and the once-a-year population-dynamics cycle it can
trigger) runs in a dedicated Web Worker so a 1,000,000-citizen calculation
doesn't freeze the UI; a retro `CalculationModal` shows live progress.

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
| [research/index.md](research/index.md) | Sourced simulation rules and model diagrams |
| [research/resources-and-geography.md](research/resources-and-geography.md) | Island generation, biomes, resource ledger, extraction economy |

## Packages

| Package | Path | Purpose |
| --- | --- | --- |
| Web | `packages/web` | React UI (vite), IndexedDB storage, all game screens |
| Simulation | `packages/simulation` | Pure TypeScript calculation engine (quality-of-life, population dynamics, resource extraction/ledger) |
| Geography | `packages/geography` | Pure, deterministic world generation (island shape, biomes, resource overlays) |
| Data | `packages/data` | Shared `AppConfig`/`GameSettings` and research-backed reference data |
| Desktop | `packages/desktop` | Neutralino wrapper |

Bootstrapped with [bootstrap-desktop-app](../bootstrap-desktop-app).
