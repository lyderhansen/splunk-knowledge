---
name: ds-polish
description: Use this skill to lift a Splunk Dashboard Studio dashboard from "functional AI output" to "deliberate, operator-ready." Takes a dashboard.json (inside a workspace or any file path) and applies the fix catalog derived from ds-design-principles — canvas background, KPI card rectangles, semantic polarity on status KPIs, unit inference, default values on inputs, drilldown stubs, and the other Slop-Test criteria. Writes polish-report.md documenting every change. Run after ds-create, before ds-validate.
---

# ds-polish — Lift a dashboard out of AI-slop territory

## When to use

- **After `ds-create`** — the JSON is correct but generic. `ds-polish` is the deliberate-intent pass before `ds-validate`.
- **After `ds-review`** — review flags problems; polish applies the fixes review identified.
- **On any legacy dashboard** — point it at a `dashboard.json` or `dashboard.xml` outside a workspace to bring an older dashboard up to the current principles.

## What ds-polish is (and what it is not)

`ds-polish` is NOT a visual linter. `ds-validate` is the linter.

`ds-polish` is a **deliberate-intent pass** that applies the catalog of fixes derived from the `ds-design-principles` reflex-defaults, absolute-bans, and Slop-Test sections. It modifies the dashboard in place and writes a `polish-report.md` that records exactly what changed and why.

## Input / output contract

**Input** (one of):
- A workspace path containing a `build/dashboard.json` (preserves workspace state).
- A direct file path to `dashboard.json` or `dashboard.xml` (edits the file in place; writes report alongside).

**Output**:
- The dashboard file, mutated with polish fixes applied.
- `polish-report.md` in the same directory, listing every fix under three buckets:
  - **Applied** — Claude auto-applied the fix with high confidence.
  - **Suggested** — Claude proposed a fix but could not apply without user confirmation (e.g., choosing semantic polarity for an ambiguous metric name).
  - **Flagged** — Claude detected a problem that needs human judgment (e.g., picking drilldown targets).

## Two modes

### Inside a workspace
- Read `build/dashboard.json`.
- Write polish-report to the workspace root.
- Do NOT advance the workspace state (polish does not own a pipeline transition). The next call — `ds-validate` — owns the transition from `built` to `validated`.

### Outside a workspace
- Accept any file path.
- Edit the file in place (preserve a `.bak` copy on first run).
- Write `polish-report.md` alongside the edited file.

## Required context before polishing

Polish choices depend on archetype and audience. Before applying fixes:

1. **Read `ds-design-principles`** — the fix catalog below is derived from it; confirm the reflex-defaults, absolute-bans, and Slop-Test sections are loaded.
2. **Identify the archetype** — from the dashboard title, panel mix, or by asking the user. Archetype drives theme and KPI-hierarchy decisions.
3. **Confirm the theme** — dark, dark-NOC, or light. Derived from archetype + viewing context.

If any of these is unknown, ask the user before running the fix catalog.

## The fix catalog

See sections below:

- **Fix catalog** — 12 named fixes with DETECT / FIX / CONFIRMATION format.
- **Run order** — the sequence ds-polish applies fixes in and why.
- **Integration** — how ds-polish interacts with ds-review, ds-validate, ds-update, and the pipeline.

*(These sections are filled in the subsequent chunks.)*
