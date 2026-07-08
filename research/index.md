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

## Authority

1. Cited public datasets (SSA, UN, peer-reviewed studies) are the source of
   truth for baseline real-world figures.
2. `GameSettings` (`packages/data`) is the source of truth for the tunable
   in-game curves derived from that research — expect the exact numbers
   there to diverge from real-world baselines as the game gets balanced.
3. Update this index and the relevant doc whenever a new sourced dataset or
   design rule is added.
