# Tech stack

## Runtime and tooling

| Tool | Role |
| --- | --- |
| **Bun** | Package manager and script runner |
| **TypeScript** | App logic |
| **Biome** | Lint + format |

## Web (`packages/web`)

| Layer | Choice |
| --- | --- |
| UI | **React 19.2.7** |
| Routing | **react-router** (`HashRouter`) — hash-based (not `BrowserRouter`) because the desktop build is served by Neutralino's static file server with no SPA fallback for arbitrary paths; every route still resolves to the same `index.html`. `AppShell` is the layout route (nav + throne HUD + interrupt modals + `<Outlet />`); `/atlas`, `/atlas/:categoryId`, and `/atlas/:categoryId/:sectorId` give the sector-atlas drill-down real back/forward support too |
| Build | **Vite** |
| Styling | **Tailwind CSS v4** (`@tailwindcss/vite` or PostCSS for Next.js) |
| Storage | **`economy-simulator-persistence`** (IndexedDB via localforage under the hood) — web adapters live in `src/repos/`; web does not own drivers directly |
| Map | **honeycomb-grid** for hex coordinate math, hand-rolled SVG rendering (`CountryMap`) styled with the Tailwind theme tokens |
| Charts | **chart.js** + **react-chartjs-2**, themed via `lib/chart-theme.ts` (retro, no smoothing/animation) |
| Heavy calculations | Dedicated Web Worker (`workers/population.worker.ts`, its own `tsconfig.worker.json` with the `WebWorker` lib) runs the daily cohort tick and annual population cycle off the main thread; progress renders in a reusable `CalculationModal` |
| Component tests | **Vitest** `projects` split: `.test.ts` runs under `node`, `.test.tsx` runs under `jsdom` with `@testing-library/react` |
| End-to-end tests | **Playwright** (`e2e/`, `tsconfig.e2e.json`, `bun run test:e2e`) drives the real production build (`vite build && vite preview`) rather than the dev server — see note below on why |
| New game flow | `NewGameSetupPage` gates when no population exists (`needsSetup`); after generation, `NationSetupPage` gates until every sub-sector has a system + role mix (`needsConfiguration`); then `AppShell` with Country Map as home (`/map`) |
| Code splitting | `DashboardsPage` and `CountryMapPage` are lazy-loaded (`React.lazy` + `Suspense` in `App.tsx`) so chart.js/react-chartjs-2 and honeycomb-grid live in their own chunks |

### Gotcha: `resolve.dedupe` is load-bearing

`vite.config.ts` sets `resolve.dedupe: ["react", "react-dom", "chart.js"]`.
Without it, Rollup can duplicate one of these packages into more than one
output chunk, and anything relying on that package's module-level singleton
state breaks in a way that's easy to misdiagnose:

- A duplicated **React** left `react-chartjs-2`'s copy with an uninitialized
  hooks dispatcher — `Cannot read properties of null (reading 'useRef')`,
  which crashes the whole app on first mount (no error boundary today).
- A duplicated **chart.js** meant `ChartJS.register(...)` (in
  `lib/chart-theme.ts`) populated one copy's registry while chart rendering
  read from another — `"linear" is not a registered scale`, etc.

Both reproduced deterministically on a first, cold visit to the Dashboards
page and were only caught by the Playwright suite driving a real production
build in a fresh browser profile — Vitest/jsdom component tests don't bundle
with Rollup so they never hit this class of bug. If a new chart/heavy
dependency starts throwing similarly odd "module state wasn't initialized"
errors only in the built app, suspect chunk duplication first and add it to
`dedupe`.

### Gotcha: `VITE_POPULATION_SIZE` is inlined at build time

Most e2e specs run against a production build with `VITE_POPULATION_SIZE` set
so population generation takes seconds instead of ~70s. Because Vite inlines
`import.meta.env.*` at build time, that override is baked into the bundle —
there's no way to test the real "no override" first-run path (the new-game
setup screen) against that same build. `playwright.config.ts` therefore
defines a second `webServer`/project pair (`chromium-new-game-setup`,
`dist-e2e-setup/`) built with no override, used only by
`new-game-setup.spec.ts`. If you need another env-var-dependent behavior
tested at its real default, follow the same pattern rather than trying to
reuse the main preview server.

## Data (`packages/data`)

Pure TypeScript, no framework. Holds:

- `AppConfig` / `GameSettings` (including calendar and calamity frequency)
- Research-backed catalogs (demographics, sector affinities, economic systems /
  roles, biome/resource overlays under `src/geography/`)
- Calamity definitions under `src/calamities/catalog/*.json`
- Briefing / mandate **logic** under `src/briefings/` and `src/progression/`
- Player-facing **creative copy** under `src/copy/` (folders for aides, weekly,
  mandates, calamities — see
  [`src/copy/README.md`](../packages/data/src/copy/README.md))

No build step — consumed as source via the workspace.
`packages/web/src/lib/economic-systems.ts` and
`packages/web/src/lib/taxonomy.ts` are thin re-export shims (UI-only concerns
like category accent colors are layered on in the shim, not the shared data).

### Web `src/` layout

| Folder | Role |
| --- | --- |
| `pages/` / `components/` / `context/` | UI shell |
| `game/` | Run loop, decrees, interrupt effects |
| `models/` | Citizen generate / mutate (web-local) |
| `lib/` | UI helpers, calendar, presentation adapters, thin re-exports from `economy-simulator-data` |
| `repos/` | Thin adapters over `economy-simulator-persistence` (+ a few re-exports of game orchestration) |
| `workers/` / `audio/` | Population worker; SFX |

## Geography (`packages/geography`)

Pure, deterministic (seeded) world-generation engine: organic island shape,
biome assignment, resource-overlay placement, coastal/adjacency detection.
No React, no I/O, no randomness beyond an explicit seed — mirrors
`packages/simulation`'s "pure engine" rule so world generation stays
unit-testable and safe to run inside a Web Worker. Depends on `packages/data`
for the biome/resource/overlay catalogs and `AppConfig.regions` sizing
tunables (`boundingRadius`, `regionScaleOptions` Few/Medium/More chosen at
new-game setup); uses `honeycomb-grid` for hex adjacency math (same library
`packages/web` uses for rendering). No build step.

## Simulation (`packages/simulation`)

Pure TypeScript calculation engine: quality-of-life, mortality/fertility/
migration, resource extraction/depletion/environment/national ledger,
calamity engine, employment (labor edicts / role assignment), and progression
helpers (nation score, win/lose, badges). No React, no storage, no DOM —
takes plain data in, returns plain data out. Depends on `packages/data` for
reference data; no build step.

## Persistence (`packages/persistence`)

Storage drivers (IndexedDB via **localforage** by default) and typed
repositories for population chunks, game-run / progression state (including
`innerCircle`, mandates, calamity history, dispatch events), sector role
config, and player profile. No React. Web and the population worker import
repositories from this package rather than talking to IndexedDB directly.

## Desktop (`packages/desktop`)

| Layer | Choice |
| --- | --- |
| Wrapper | **Neutralino** |

## Build flow

```bash
bun run build:web
bun run copy-web-to-desktop
bun run build:desktop
# or: bun run build
```
