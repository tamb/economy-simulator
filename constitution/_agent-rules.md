# Rules for AI agents

## First steps on ambiguous tasks

1. Read [constitution/index.md](./index.md) and the relevant `_*.md` topic.
2. Apply existing package conventions before introducing new patterns.

## Coding expectations

- **Minimize scope** — smallest correct change; match existing style.
- **Do not edit generated desktop assets** — run `copy-web-to-desktop` after web builds.
- **Update docs** when changing product behavior.

## Quality gates

```bash
bun run lint:fix
bun run typecheck
```
