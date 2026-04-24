---
name: ds-critique
description: Use this skill to run the Splunk Dashboard Slop Test against an existing dashboard.json or dashboard.xml and write critique.md with a blunt verdict (PASS / MIXED / SLOP) and a per-criterion scorecard. Narrower and more opinionated than ds-review — it only checks the design-principles Slop Test, reflex defaults, and absolute bans. Use when the user asks "is this dashboard AI slop?", "does this pass the Slop Test?", or wants a design-principles-only audit before ds-polish.
---

# ds-critique — Run the Slop Test against a dashboard

## When to use

- The user asks: *"is this dashboard AI slop?"*, *"does this pass the Slop Test?"*, *"critique this dashboard"*.
- Before `ds-polish` — to get a verdict on how much work polish will have to do.
- After `ds-create` on a dashboard you suspect hit a template default — to confirm the suspicion before changing anything.

## The stance

This skill does not review accessibility, performance, or schema correctness. It answers one question:

> *If someone said "an AI made this" — would an SRE, SOC analyst, or VP believe them immediately?*

If yes → the dashboard is slop, and the report says so in those words. No euphemism, no diplomatic hedging. The design principles in `ds-design-principles` are the scoring rubric.

## How ds-critique differs from ds-review and ds-polish

Three skills operate on an existing dashboard. They are not interchangeable:

| Skill | Lens | Mutates? | Output |
|---|---|---|---|
| `ds-review` | Broad audit — panel count, viz appropriateness, drilldowns, tokens, accessibility, SPL perf | No | `review.md` (findings, fixes suggested) |
| `ds-critique` | Narrow — Slop Test, reflex defaults, absolute bans | No | `critique.md` (verdict + scorecard) |
| `ds-polish` | Narrow — same rubric as critique, but applies fixes | Yes | mutated dashboard + `polish-report.md` |

**Typical routing**:
- User asks *"is this good?"* → `ds-review` (general audit).
- User asks *"is this AI slop?"* → `ds-critique` (Slop Test only).
- User says *"fix it"* or *"apply design principles"* → `ds-polish`.

`ds-critique` and `ds-polish` share the same rubric — both are derived from `ds-design-principles`. Critique is the read-only variant; polish is the write variant.

## Input / output contract

**Input** (one of):
- A workspace path containing `build/dashboard.json`.
- A direct file path to `dashboard.json` or `dashboard.xml`.

**Output**:
- `critique.md` written alongside the dashboard (or in the workspace root if inside a workspace).
- No mutation of the dashboard.
- A one-line verdict echoed to the user: `Verdict: SLOP (4/13 passed).`

## Required context

Critique is interpretive. Before scoring, confirm:

1. **Archetype** — a dashboard criticised for "no hero KPI" must be one where a hero is expected. Exec summaries expect heroes; dense NOC grids do not.
2. **Theme** — several criteria depend on whether the dashboard is dark, dark-NOC, or light.

If either is unknown, ask the user before running the scorecard. Do not guess — guessing produces a dishonest verdict.

## What ds-critique scores

See sections below:

- **Scorecard** — the 13 Slop Test criteria, each with DETECT / EVIDENCE / VERDICT format.
- **Verdict system** — PASS / MIXED / SLOP thresholds and what each means.
- **critique.md format** — the exact structure the report writes.
- **Integration** — when to hand off to ds-polish, ds-update, or ds-review.

*(These sections are filled in the subsequent chunks.)*
