# Intent

## What economy-simulator is

A **desktop-first** application: a React web UI (vite) wrapped for native distribution via **neutralino**.

## Product shape

| Layer | Description |
| --- | --- |
| **Web** | `packages/web` — primary UI, dev server, production build |
| **Desktop** | `packages/desktop` — neutralino wrapper around the static web build |

## Principles

1. **Web builds first** — desktop packages consume the web build output; do not hand-edit generated assets under `packages/desktop/resources/`.
2. **Monorepo clarity** — shared tooling at the root; app code in packages.
3. **Document decisions** — update constitution when product or architecture changes.
