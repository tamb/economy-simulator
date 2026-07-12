# Creative copy

Edit these JSON files to change dialogue, titles, hints, and briefing text.
**Do not put numbers, weights, or gameplay effects here** — those live in the TypeScript briefings/progression modules.

| File | What you edit |
| --- | --- |
| [`weekly-reports.json`](weekly-reports.json) | Weekly region briefing prompts and choice labels/hints (keyed by distress + choice id) |
| [`aide-proposals.json`](aide-proposals.json) | Aide proposal titles, spoken dialog, and Approve/Compromise/Reject labels/hints |
| [`aides.json`](aides.json) | Inner-circle display titles and default first names |
| [`how-to-rule.json`](how-to-rule.json) | Slide-up / Instructions “How to rule” tip list |
| [`mandates.json`](mandates.json) | Royal mandate labels and descriptions |

## Rules of thumb

1. Keep the **same ids** (`relief_convoy`, `steward_labor_shift`, `approve`, …). Renaming an id breaks the link to game logic.
2. You can freely rewrite any string value: tone, length, voice, flavor.
3. Choice `hint` text is player-facing — it can describe effects in plain language without matching the exact numbers in code.
4. After editing, the web app picks up changes on the next Vite/dev reload (JSON is imported at build time).

## Adding a new line of copy

1. Add the mechanical id + effects in the matching TypeScript file under `src/briefings/` or `src/progression/`.
2. Add the matching strings in the JSON file here under the same id.
