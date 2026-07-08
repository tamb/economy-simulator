# economy-simulator Constitution

Human- and AI-readable project charter. When product intent, architecture, or repo layout is unclear, **start here** before guessing from code alone.

## Topic index

| File | Contents |
| --- | --- |
| [_intent.md](./_intent.md) | What we are building and why |
| [_tech-stack.md](./_tech-stack.md) | Languages, frameworks, tooling, build pipeline |
| [_monorepo.md](./_monorepo.md) | Packages, ownership, common commands |
| [_agent-rules.md](./_agent-rules.md) | How agents should work |

## Design & research

Simulation rules, sourcing, and model diagrams live in **[research/index.md](../research/index.md)**. For the island, biomes, resource ledger, and extraction economy, read **[resources-and-geography.md](../research/resources-and-geography.md)**.

In-app player guidance: **Instructions** screen (`packages/web/src/pages/InstructionsPage.tsx`).

## Authority

1. **Constitution** — product intent and monorepo shape.
2. **Code** — source of truth for behavior; update constitution when decisions change.

**Bootstrapped:** 2026-07-06
