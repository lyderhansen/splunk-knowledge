# Phase 51 Patterns — splunk-spl Reference Debt

Reusable conventions for appending harvested traps to the splunk-spl plugin. Use these whenever a future HANDOFF surfaces a new SPL trap.

## Where a trap lands

| Trap shape | Destination | Format |
|---|---|---|
| Cross-command silent-fail trap | `spl-gotchas/SKILL.md` `## Silent-fail traps` | Numbered `### N. <symptom>` continuing the sequence; Wrong/Right/Why triad |
| Category-level warning (not a single syntax slip) | `spl-gotchas/SKILL.md` new `##` section near `## Search performance hierarchy` | Prose + Rule + canonical instance reference |
| Positive how-to recipe (longer than ~15 lines) | new `reference/<name>.md` + a 3-line pointer in spl-gotchas | Per-command file convention (see below) |
| Command-specific gotcha | `reference/<command>.md` `## Gotchas` list | Bold-lead-in + em-dash bullet matching existing bullets |

## spl-gotchas/SKILL.md line budget

The file is ALREADY over the 500-line soft limit (529 before this phase). Hard rule for future harvests: put any recipe longer than ~15 lines in `reference/` and leave only a pointer + one-line summary in spl-gotchas. Never grow spl-gotchas by a full recipe.

## Per-command reference file header convention

New `reference/*.md` files start with:
```
# <name> — <one-line description>

Source: Splunk Search Reference 10.2.0
```
splunk-spl content is version-pinned to Splunk 10.2 — keep all new content consistent. English only.

## Trap numbering

`## Silent-fail traps (ranked by frequency)` is a continuous numbered list. New traps continue the sequence (Phase 51 added #27). Do not renumber existing traps.

## Cross-reference discipline

- A category section (e.g. token-safety) names its canonical numbered-trap instance.
- A reshape/recipe reference distinguishes itself from any adjacent existing trap it could be confused with (Phase 51: reshape vs trap #19 sparkline typing).
- SPL-language traps that have a dashboard-side counterpart link to that phase's requirement by name (Phase 51 SPL-01 → Phase 52 DS-04) without duplicating dashboard content.

## Version bump

Additive reference entries = patch bump (`feedback_plugin_version_bump`). Phase 51: splunk-spl 1.2.0 → 1.2.1.
