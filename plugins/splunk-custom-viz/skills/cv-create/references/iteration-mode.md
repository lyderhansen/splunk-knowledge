# Iteration mode — single-viz updates with natural language

cv-create supports iterating on a single viz inside an existing pack. Two trigger forms:

1. Explicit flag: `cv-create --viz <name> [instruction]`
2. Natural language: user says *"update the ERS gauge"* or *"make the gauge segments wider and add a glow"* — cv-create parses out the viz name and the instruction

## Workflow

```
Step 1: Detect iteration mode
Step 2: Locate the target viz in DESIGN-LOCK.md
Step 3: Parse the instruction into atomic deltas against the lock
Step 4: State the interpretation back to the user
Step 5: Wait for confirmation (unless --no-confirm)
Step 6: Apply deltas to DESIGN-LOCK.md
Step 7: Re-render only the affected viz's source files
Step 8: Report what changed; tell user to run cv-build if repackaging needed
```

## Step 1: Detect iteration mode

cv-create is in iteration mode when ALL of these are true:

- A `DESIGN-LOCK.md` exists at `.cv/<app_id>/`
- The app directory `<app_id>/` already exists with at least one viz under `appserver/static/visualizations/`
- The user's instruction names a specific viz (or `--viz` was passed)

If only the lock exists but the app dir doesn't, that's first-time generation — run full pipeline.

## Step 2: Locate the target viz

Parse the user's instruction for the viz name. Match against `DESIGN-LOCK.md.vizs[].name`. If the user says *"ERS gauge"*, match against viz names that contain `ers` and `gauge` (substring match, case-insensitive). If multiple match, ask the user which.

If no match, list the available viz names and ask.

## Step 3: Parse the instruction into atomic deltas

This is the hardest step. The user's natural language must be translated into specific YAML field changes in DESIGN-LOCK.md. Each delta is one (field path, old value, new value) triple.

Example parse:

```
User: "make the gauge segments wider and add a green glow"

Deltas:
  1. ers_charge_gauge.visual_spec.geometry.segment_gap
     OLD: "2px"
     NEW: "3px"
  2. ers_charge_gauge.visual_spec.geometry.terminals  (interpretation:
     "wider" likely means substantially more visual weight, not just gap)
     OLD: top_and_bottom (8% height)
     NEW: top_and_bottom (12% height)
  3. ers_charge_gauge.visual_spec.effects.glow  (new entry)
     ADD:
       property: shadow
       color: "#00D26A"
       blur: 16
       apply_on: "segment.is_full"
```

When the user's language is ambiguous, prefer the interpretation that matches `global.commitments.anti_references` (anti-slop). When still ambiguous, ask in Step 4.

## Step 4: State the interpretation back

This is a CONFIRMATION GATE. Without it, the agent silently misinterprets 30% of natural-language instructions and the user has to undo. With it, iterations converge cheaply.

Format:

```
I'm reading this as N changes to <viz_name>:

  1. <change description in plain English>
     <yaml.path>: <old> → <new>

  2. <change description>
     <yaml.path>: <old> → <new>

  3. <new entry added>
     <yaml.path>: + <new value>

Proceed? (reply 'yes' to apply, or describe what I got wrong)
```

If the user says yes, proceed. If the user corrects, redo Step 3 with the correction in mind and state back again.

## Step 5: --no-confirm flag

If `cv-create --no-confirm <instruction>` was used, skip the state-back and apply immediately. This is for power users who want pure speed and accept the risk of misinterpretation.

## Step 6: Apply deltas to DESIGN-LOCK.md

Use direct YAML editing. Preserve formatting and comments where possible. Each delta is a single edit:

- Modify in place: change the value of an existing key
- Add: insert a new key in the right structural position
- Delete: remove the key (rare; only if user explicitly says "remove the breathe animation")

After editing, verify the YAML still parses. If parsing fails, report and stop.

## Step 7: Re-render the viz

Regenerate ONLY the affected viz's files:

- `<app_id>/appserver/static/visualizations/<viz_name>/src/visualization_source.js` (re-emit from boilerplate + new render functions):

```bash
node ${CLAUDE_SKILL_PLUGIN_DIR}/../../scripts/boilerplate_emit.js <viz_name> <app_id>.<viz_name> \
    > <app_id>/appserver/static/visualizations/<viz_name>/src/visualization_source.js
```
- `<app_id>/appserver/static/visualizations/<viz_name>/formatter.html` (re-emit if visual_spec changed)
- Theme.js — only re-emit if `global` tokens changed (unlikely in iteration)

PRESERVE:
- Other vizs' source files (untouched)
- Existing formatter VALUES (the user may have tweaked them in Splunk; don't overwrite)
- Demo CSV data (unless data_contract changed)

## Step 8: Report

```
Updated <viz_name> per your changes.

Files modified:
  - .cv/<app_id>/DESIGN-LOCK.md
  - <app_id>/appserver/static/visualizations/<viz_name>/src/visualization_source.js
  - <app_id>/appserver/static/visualizations/<viz_name>/formatter.html

Next steps:
  - To repackage: run cv-build
  - To iterate further: cv-create --viz <viz_name> "<next instruction>"
```

## Iteration discipline

- ALWAYS update DESIGN-LOCK.md as part of the iteration. The lock is the source of truth — letting it drift would make future iterations work from a stale contract.
- ALWAYS re-read `global.commitments` before applying the delta. The user's instruction might inadvertently violate a commitment (e.g., "add purple glow" when the palette doesn't include purple). Flag this in the state-back step.
- NEVER iterate without confirmation unless `--no-confirm` was explicit.

## Multi-delta instructions

If the user gives several instructions at once ("widen the gauge, lighten the background, add a glow"), parse each into its own delta and present them all in the state-back. Don't try to merge multiple ambiguous instructions into one super-edit.

## When to recommend a full re-sketch

If the user's iteration request is so large it's essentially a redesign ("make the whole viz feel completely different"), recommend re-running cv-sketch on this viz instead of iterating. Threshold: if 5+ deltas would be required, suggest a fresh sketch.
