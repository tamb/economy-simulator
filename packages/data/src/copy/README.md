# Creative copy

Edit these JSON files to change dialogue, titles, hints, and briefing text.
**Do not put numbers, weights, or gameplay effects here** — those live in the
TypeScript briefings/progression modules and calamity catalog mechanics.

```text
copy/
  how-to-rule.json
  aides/
    roster.json                 # Inner-circle titles + default first names
    steward-proposals.json
    marshal-proposals.json
    chancellor-proposals.json
    vizier-proposals.json
  weekly/
    reports.json                # Distress prompts + choice labels/hints
  mandates/
    mandates.json
  calamities/
    responses.json              # Relief / Rebuild / Endure labels + details
    weather.json                # id → name + description
    geological.json
    biological.json
    human.json
    social.json
```

| Path | What you edit |
| --- | --- |
| [`aides/roster.json`](aides/roster.json) | Aide display titles and default first names |
| [`aides/*-proposals.json`](aides/) | Proposal titles, spoken dialog, Approve/Compromise/Reject labels/hints |
| [`weekly/reports.json`](weekly/reports.json) | Weekly briefing prompt variants and choice labels/hints |
| [`mandates/mandates.json`](mandates/mandates.json) | Royal mandate labels and descriptions |
| [`calamities/responses.json`](calamities/responses.json) | Onset response button labels and details |
| [`calamities/{category}.json`](calamities/) | Calamity display names and descriptions (by id) |
| [`how-to-rule.json`](how-to-rule.json) | Slide-up / Instructions “How to rule” tip list |

## Rules of thumb

1. Keep the **same ids** (`relief_convoy`, `steward_labor_shift`, `forest_fire`, `approve`, …). Renaming an id breaks the link to game logic.
2. You can freely rewrite any string value: tone, length, voice, flavor.
3. Choice `hint` text is player-facing — it can describe effects in plain language without matching the exact numbers in code.
4. Weekly distress blocks use `prompts: string[]` — the game picks one at random each week.
5. After editing, the web app picks up changes on the next Vite/dev reload (JSON is imported at build time).

## Adding a new line of copy

1. Add the mechanical id + effects in the matching TypeScript file under `src/briefings/`, `src/progression/`, or (for new calamities) `src/calamities/catalog/`.
2. Add the matching strings in the JSON file here under the same id.
3. For a new aide proposal, put copy in the matching `aides/{role}-proposals.json` file.

## Related docs

- Product intent: [`constitution/_intent.md`](../../../../constitution/_intent.md)
- Monorepo / calendar notes: [`constitution/_monorepo.md`](../../../../constitution/_monorepo.md)
