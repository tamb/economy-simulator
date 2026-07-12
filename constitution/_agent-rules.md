# Rules for AI agents

## First steps on ambiguous tasks

1. Read [constitution/index.md](./index.md) and the relevant `_*.md` topic.
2. Apply existing package conventions before introducing new patterns.

## Coding expectations

- **Minimize scope** — smallest correct change; match existing style.
- **Do not edit generated desktop assets** — run `copy-web-to-desktop` after web builds.
- **Update docs** when changing product behavior.
- **Creative copy** — edit player-facing dialogue/labels under
  [`packages/data/src/copy/`](../packages/data/src/copy/README.md), not
  inline in React or briefing logic files. Keep effects/weights/ids in TypeScript.
  Do not rename stable ids without updating both JSON and logic.

## Quality gates

```bash
bun run lint:fix
bun run typecheck
```
