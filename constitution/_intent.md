# Intent

## What economy-simulator is

A **desktop-first** application: a React web UI (vite) wrapped for native distribution via **neutralino**.

## Game premise

You are the monarch of an island nation. You control a large population (up to
1,000,000 simulated citizens) — moving people between economic sectors,
orchestrating the national resource ledger through per-sub-sector economic
system choices and role structures, and watching your choices play out over in-game years. People are born, age, and die; they flee a struggling nation and
immigrate to a thriving one. Before the simulation begins, the monarch must assign an economic system and role quotas to every sub-sector; citizens then receive a `roleId` (e.g. feudal serf = 65) that affects quality of life and extraction efficiency. Occasional **calamities** (fires, storms, quakes,
disease, and more) strike regions as timed nation debuffs with immediate,
mid-term, and long-term economic scars. All of this is driven by each citizen's
**quality of life**, which is a function of their happiness (work hours,
personality-to-job fit) and health (which follows happiness). The player
gets population, sector, country-health, and resource-ledger dashboards, an
interactive map of a procedurally generated island (biomes, resource overlays,
ocean surround), and chart-driven feedback to steer the economy — styled with
a retro, "Track and Field arcade game" aesthetic.

See [research/index.md](../research/index.md) for sourced design rules; the
island and resource economy are documented in
[resources-and-geography.md](../research/resources-and-geography.md). Player
instructions ship in the app under **Instructions** in the nav.

## Product shape

| Layer | Description |
| --- | --- |
| **Web** | `packages/web` — primary UI, dev server, production build |
| **Simulation** | `packages/simulation` — pure TypeScript calculation engine (quality-of-life, population dynamics, resource extraction/ledger); no React, no I/O |
| **Geography** | `packages/geography` — pure, deterministic world generation (island shape, biomes, resource overlays); no React, no I/O |
| **Data** | `packages/data` — shared, research-backed reference data and the `AppConfig`/`GameSettings` tunables; no React |
| **Persistence** | `packages/persistence` — storage drivers and typed repositories; no React |
| **Desktop** | `packages/desktop` — neutralino wrapper around the static web build |

## Principles

1. **Web builds first** — desktop packages consume the web build output; do not hand-edit generated assets under `packages/desktop/resources/`.
2. **Monorepo clarity** — shared tooling at the root; app code in packages.
3. **Config vs. settings** — `AppConfig` (`packages/data`) holds non-gameplay tunables (population scale, storage chunking, perf/feature flags); `GameSettings` (`packages/data`) holds simulation rules that affect gameplay balance (ages, work hours, mortality/fertility/migration, calendar). Both are single sources of truth — prefer importing them over redefining constants locally.
4. **Pure engine, impure shell** — `packages/simulation` contains no React/I/O code; `packages/persistence` owns storage drivers and repositories; `packages/web` owns UI and game-loop orchestration.
5. **Document decisions** — update constitution when product or architecture changes.
