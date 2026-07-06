# economy-simulator

Monorepo desktop app: **vite + React** wrapped in **neutralino**.

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

## Constitution

Project intent and layout: **[constitution/index.md](constitution/index.md)**.

## Packages

| Package | Path | Purpose |
| --- | --- | --- |
| Web | `packages/web` | React UI (vite) |
| Desktop | `packages/desktop` | Neutralino wrapper |

Bootstrapped with [bootstrap-desktop-app](../bootstrap-desktop-app).
