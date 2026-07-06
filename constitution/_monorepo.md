# Monorepo layout

## Root directories

| Path | Contents |
| --- | --- |
| `constitution/` | Product intent and agent guidance |
| `packages/web/` | React + vite app |
| `packages/desktop/` | neutralino desktop distribution |
| `scripts/` | Cross-package automation |

## Root scripts

| Command | Action |
| --- | --- |
| `bun install` | Install dependencies |
| `bun run dev` | Web dev server |
| `bun run build` | Web build → copy to desktop → desktop build |
| `bun run lint:fix` | Biome check --write across packages |
