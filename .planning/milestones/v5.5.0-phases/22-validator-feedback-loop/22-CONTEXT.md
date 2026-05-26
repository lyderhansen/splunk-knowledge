# Phase 22: Validator Feedback Loop — Context

## Domain Boundary

Fix validator output to label which viz failed, and add a self-correction loop so XFILE/D08 failures are fixed before handing off to vp-create.

## Requirements

- VI-01: check_design.js findings include viz name
- VI-02: vp-viz pipeline loops on failures before vp-create handoff

## Decisions

### D-01: Both shell header + JS finding include viz name (VI-01)

Two changes:

1. **validate_viz.sh** (line 315-331): Before each `node check_design.js` call, print the viz name:
   ```bash
   echo "  $(basename "$vizdir"):"
   ```

2. **check_design.js**: Accept viz name as 4th CLI argument (after formatter, JS source, theme.js). Include viz name in ALL `emitFail` and `emitWarn` output:
   - `emitFail` message: `"[viz_name] D01: ..."` (prefix the existing message)
   - `emitWarn` message: `"[viz_name] D01: ..."` (same prefix)
   - NDJSON FINDING: add `vizName` field to the JSON object

**Files:** validate_viz.sh (lines 315-331), check_design.js (emitFail/emitWarn functions + argv parsing), test_check_design.js (update to pass viz name arg)

### D-02: SKILL.md instruction loop in vp-viz step 6 (VI-02)

Update vp-viz SKILL.md step 6 (validate) with an explicit loop instruction:

```
Step 6: Validate and fix (max 2 iterations)
1. Run validate_viz.sh on the app directory
2. If XFILE or D08 failures: read the error output, identify which viz + which control is missing
3. Edit the failing viz's visualization_source.js to add the missing opt() call
4. Run build_flat.js to rebuild the fixed viz
5. Re-run validate_viz.sh
6. If still failing after 2 iterations, report the remaining failures and continue to vp-create
```

This is a SKILL.md instruction change, not a script change. Claude reads the instruction and performs the loop inline.

**File:** vp-viz SKILL.md (step 6 section)

## Canonical References

- `plugins/splunk-viz-packs/skills/vp-viz/scripts/validate_viz.sh` — shell loop calling check_design.js per viz
- `plugins/splunk-viz-packs/skills/vp-viz/scripts/check_design.js` — emitFail/emitWarn functions
- `plugins/splunk-viz-packs/skills/vp-viz/scripts/test_check_design.js` — test fixtures
- `plugins/splunk-viz-packs/skills/vp-viz/SKILL.md` — step 6 validate section

## Deferred Ideas

None.
