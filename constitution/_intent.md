# Intent

## What economy-simulator is

A **desktop-first** application: a React web UI (vite) wrapped for native distribution via **neutralino**.

## Game premise

You are the monarch of an island nation. You control a large population (up to
1,000,000 simulated citizens) — moving people between economic sectors,
orchestrating the national resource ledger through per-sub-sector economic
system choices and role structures, and watching your choices play out over
in-game years. People are born, age, and die; they flee a struggling nation and
immigrate to a thriving one.

At founding, the player chooses **starting population** and **province scale**
(Few / Medium / More): more provinces spread citizens thinner and ease
regional calamity and extraction pressure.

Before the simulation begins, the monarch must assign an economic system and
role quotas to every sub-sector; citizens then receive a `roleId` (e.g. feudal
serf = 65) that affects quality of life and extraction efficiency.

**Calamities** (fires, storms, quakes, disease, and more) strike regions as
timed nation debuffs with immediate, mid-term, and long-term economic scars —
the monarch chooses **Relief**, **Rebuild**, or **Endure** at onset. Primary
calamities land at least once per **28-day month** (the in-game month; a year
is 364 days = 13 months).

**Weekly regional briefings** (every 7 days) highlight the worst-performing
provinces and offer a decision tree. Twice per month the **inner circle**
(Steward, Marshal, Chancellor, Vizier) brings an executive-order proposal with
**Approve** / **Compromise** / **Reject**. Mid-game **labor edicts** and
**role reforms** let the monarch reshuffle workers or re-roll roles. Each year
brings a **royal mandate** — fulfill it for bonus score and badges.

All of this is driven by each citizen's **quality of life** (happiness from
work hours and personality-to-job fit; health follows happiness).

The player gets a persistent **throne HUD** (advance day/week/year, nation
score, mandate, win/lose streaks), a **dispatch log**, a slide-up **How to
rule** briefing, dashboards (population, sectors, country overview, resource
ledger, nation score), an interactive country map (biomes, overlays, calamity
glow), blocking interrupt modals (calamity → weekly report → aide proposal →
year review), and chart-driven feedback — styled with a retro, "Track and Field
arcade game" aesthetic.

See [research/index.md](../research/index.md) for sourced design rules; the
island and resource economy are documented in
[resources-and-geography.md](../research/resources-and-geography.md). Player
instructions ship in the app under **Instructions** in the nav. Creative
dialogue and labels live in editable JSON under
[`packages/data/src/copy/`](../packages/data/src/copy/README.md) — separate
from game logic.

**Forward roadmap:** closing v1 economy gaps (regional employment, stockpiles,
domestic flows, calamity agency) and then a domestic-first nation-management
layer (infrastructure, fiscal, public services, housing, order, politics)
before an optional external layer (trade, diplomacy, defense) is tracked in
[nation_management_roadmap_a1b2c3d4.plan.md](../.cursor/plans/nation_management_roadmap_a1b2c3d4.plan.md).
Sourced research for each phase (cite when implementing) is indexed under
[research/index.md — Product roadmap](../research/index.md#product-roadmap).

## Product shape

| Layer | Description |
| --- | --- |
| **Web** | `packages/web` — primary UI, game-loop orchestration, workers, dashboards |
| **Simulation** | `packages/simulation` — pure TypeScript calculation engine (QoL, population dynamics, resources, calamities, progression); no React, no I/O |
| **Geography** | `packages/geography` — pure, deterministic world generation; no React, no I/O |
| **Data** | `packages/data` — `AppConfig` / `GameSettings`, research-backed catalogs, briefings logic, and **creative copy JSON**; no React |
| **Persistence** | `packages/persistence` — storage drivers and typed repositories; no React |
| **Desktop** | `packages/desktop` — neutralino wrapper around the static web build |

## Principles

1. **Web builds first** — desktop packages consume the web build output; do not hand-edit generated assets under `packages/desktop/resources/`.
2. **Monorepo clarity** — shared tooling at the root; app code in packages.
3. **Config vs. settings** — `AppConfig` (`packages/data`) holds non-gameplay tunables (population scale, province-scale options / default bounding radius, storage chunking, perf/feature flags); `GameSettings` (`packages/data`) holds simulation rules that affect gameplay balance (ages, work hours, mortality/fertility/migration, calendar, calamity frequency). Both are single sources of truth — prefer importing them over redefining constants locally.
4. **Pure engine, impure shell** — `packages/simulation` contains no React/I/O code; `packages/persistence` owns storage drivers and repositories; `packages/web` owns UI and game-loop orchestration.
5. **Copy vs. logic** — player-facing dialogue, titles, hints, and tip text live under `packages/data/src/copy/` (see that folder’s README). Mechanical ids, weights, and effects stay in TypeScript. Do not mix balance numbers into copy files.
6. **Document decisions** — update constitution when product or architecture changes.
