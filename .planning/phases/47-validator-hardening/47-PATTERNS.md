# Phase 47 — Implementation Patterns

In-repo grep patterns to mirror when adding `check_k1b` / `check_k5` / `check_k6` / `check_k7` to `plugins/splunk-custom-viz/scripts/validate.sh`.

---

## Pattern A — K1 loop (the closest analog for K1b and K5)

**Where:** `plugins/splunk-custom-viz/scripts/validate.sh` lines 163–182.

**What to copy:**

- Iteration over `"$APP_DIR"/appserver/static/visualizations/*/formatter.html`
- `[ -f "$f" ] || continue` defensive skip
- `VIZ_DIR=$(dirname "$f")`, `VIZ=$(basename "$VIZ_DIR")`
- Dual source-file lookup: `SRC="$VIZ_DIR/src/visualization_source.js"; [ -f "$SRC" ] || SRC="$VIZ_DIR/visualization_source.js"; [ -f "$SRC" ] || continue`
- `grep -oE '...name="\{\{VIZ_NAMESPACE\}\}\.[a-zA-Z0-9_]+' | sed -E 's/.*\{\{VIZ_NAMESPACE\}\}\.//' | sort -u` to extract the formatter key
- `fail K# "$VIZ: <message>. See KNOWN-CORRECTIONS.md #<N>."` for the FAIL emission

**What changes per check:**

- K1b: element selector becomes `splunk-color-picker` (same as K1) PLUS the second-stage variable-name reach check
- K5: element selector becomes `splunk-text-input` and `splunk-number-input`, plus the `*Field$` suffix exemption

## Pattern B — K2 awk window (reference for ANY future window-based reach check)

**Where:** `plugins/splunk-custom-viz/scripts/validate.sh` lines 193–205.

**What to copy:** awk with `inWindow` + `window--` counter for line-distance heuristics.

**Why we do NOT use it for K1b/K5:** Research A1 — pure line-distance produces false positives on cross-function reach (`mos_health_gauge` `_resolveTheme` → `_drawShared`). Variable-name tracking (Pattern C) is the correct primary strategy; the K2 awk window is documented here for completeness only.

## Pattern C — Variable-name tracking (NEW, K1b and K5)

**Why:** The opt value can be assigned to `c.<lhs>` in `_resolveTheme` and read 100+ lines later as `t.<lhs>` in `_drawShared`. Line-distance fails; name presence succeeds.

**Sketch (refer to 47-RESEARCH lines 331–369 for the worked example):**

1. Defensive `grep -qE "opt\(['\"]${K}['\"]" "$SRC" || continue` — K1 already FAILed if it wasn't called
2. Capture LHS of the assignment:
   `LHS_NAMES=$(grep -oE "(var\s+|c\.|t\.)[a-zA-Z_][a-zA-Z0-9_]*\s*=\s*[^;]*opt\(['\"]${K}['\"]" "$SRC" | grep -oE "(var\s+|c\.|t\.)[a-zA-Z_][a-zA-Z0-9_]*" | sed -E 's/^(var\s+|c\.|t\.)//' | sort -u)`
3. For each LHS name: check `grep -E "ctx\." "$SRC" | grep -qE "[.[:space:]]${LHS}\b"`
4. If no LHS name passes (3), FAIL — confirmation (not exclusion) gate

## Pattern D — Built-in prefix exemption list (K7)

**Where to inherit from:** Empirically verified in test51 `app_build/cucm_communications_pulse/default/data/ui/views/*.xml` and test52 `app_build/asus_rog_command_center/default/data/ui/views/*.xml`.

**Exempt prefixes:** `splunk`, `ds`, `input`. These are Splunk built-in viz/data-source/input types and never match a custom-app `[package] id`.

**Implementation:** `case "$PREFIX" in splunk|ds|input) continue;; esac`

## Pattern E — Common font fallback exemption list (K6)

**Authoritative list (matches CONTEXT.md `specifics` block + research source):**
`sans-serif`, `monospace`, `serif`, `system-ui`, `Inter`, `Arial`, `Helvetica`

**Why these:** `sans-serif`/`monospace`/`serif`/`system-ui` are CSS generic families; `Inter` is the bundled Plugin font (`plugins/splunk-custom-viz/scripts/fonts/Inter-Regular.ttf`); `Arial`/`Helvetica` are universal system fonts.

## Pattern F — macOS BSD grep compatibility

**Always use `-oE` (ERE). Never `-oP` (PCRE).**

Already enforced by existing K1/K2/K3. The Phase 47 author must NOT introduce `-P` features (lookaround, `\d`, named groups) — macOS BSD `grep` will fail silently or error.

## Pattern G — Plugin version bump

**Where:** `plugins/splunk-custom-viz/.claude-plugin/plugin.json` `version` field.

**Current:** `6.0.8`
**Target:** `6.0.9` (patch bump — per repo memory `feedback_plugin_version_bump.md`, default to patch)

**Rule:** Always bump before pushing new features to main. Don't worry about going to 6.0.34+.
