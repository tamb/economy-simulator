# Research

Sourced, real-world data and design rules backing the simulation. When a
number in the game needs a citation, it should trace back to a document
here — and the typed, code-consumable versions of these tables live in
[`packages/data`](../packages/data).

| Doc | Covers |
| --- | --- |
| [life-and-demographics.md](./life-and-demographics.md) | Life-expectancy-by-age-and-sex tables, baseline fertility rate, and how quality of life modulates mortality, fertility, emigration, and immigration |
| [quality-of-life-rules.md](./quality-of-life-rules.md) | Work-hours happiness penalty curve, OCEAN personality-to-sector affinity model, and the happiness→health lag |
| [resources-and-geography.md](./resources-and-geography.md) | Island/biome/resource-overlay generation, extraction/depletion/environment model, the national resource ledger, and economic-system effects on extraction |
| [economic-roles.md](./economic-roles.md) | Per-system economic roles, role quotas at nation setup, roleId on citizens, and role effects on QoL and extraction |

## Product roadmap

Staged plan to close documented v1 economy gaps, then grow domestic and
external **nation-management** systems (infrastructure, fiscal, public
services, housing, order, politics, trade, diplomacy, defense):

- **Product staging (todos, package ownership, UI surfaces):**
  [Nation Management Roadmap](../.cursor/plans/nation_management_roadmap_a1b2c3d4.plan.md)
- **Sourced research to read before implementing each phase** (same citation
  style as the docs above):

| Phase | Research doc | Covers |
| --- | --- | --- |
| 0 — Close v1 gaps | [stockpiles-flows-and-regional-employment.md](./stockpiles-flows-and-regional-employment.md) | Strategic/buffer stockpiles (IEA, FAO), gravity-style domestic flows, agglomeration for regional employment, calamity spend hooks |
| 1 — Domestic foundations | [infrastructure-fiscal-services.md](./infrastructure-fiscal-services.md) | Public capital multipliers (Aschauer→IMF/WB), tax-to-GDP bands (OECD, ~15% threshold), UHC coverage (WHO), education quality (Hanushek–Woessmann) |
| 2 — Internal order | [housing-order-politics.md](./housing-order-politics.md) | Housing affordability/crowding (UN-Habitat, OECD), order via WGI Rule of Law, monarchy-compatible legitimacy (Weber, procedural justice) |
| 3 — External layer | [trade-diplomacy-defense.md](./trade-diplomacy-defense.md) | Trade openness caveats, Nye soft power, NATO/SIPRI defense-burden heuristics, abstract partners |
| 4 — Macro metrics | [macro-metrics.md](./macro-metrics.md) | GDP-like output, Gini-like inequality, UNDP HDI geometric-mean construction, policy coherence |

When implementing any roadmap todo, **cite and extend the matching research
doc** (and put tunables in `GameSettings`) rather than inventing curves from
scratch. Update the relevant doc if implementation choices change the
sourced-vs-designed boundary.

## Authority

1. Cited public datasets (SSA, UN, peer-reviewed studies) are the source of
   truth for baseline real-world figures.
2. `GameSettings` (`packages/data`) is the source of truth for the tunable
   in-game curves derived from that research — expect the exact numbers
   there to diverge from real-world baselines as the game gets balanced.
3. Update this index and the relevant doc whenever a new sourced dataset or
   design rule is added.
4. Roadmap **product staging** lives in `.cursor/plans/`; roadmap **research
   baselines** live in the Phase 0–4 docs above. Implementation PRs should
   reference both.
