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
| Build | **Vite** |
| Styling | **Tailwind CSS v4** (`@tailwindcss/vite` or PostCSS for Next.js) |

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
