# Phase 47: Validator Hardening - Research

**Researched:** 2026-06-08
**Domain:** Bash + grep + awk validator extension for splunk-custom-viz packs
**Confidence:** HIGH

<user_constraints>
## User Constraints (from 47-CONTEXT.md)

### Locked Decisions

**Check-Code Naming (LOCKED):**

| Requirement | New code | Replaces draft code in REQUIREMENTS.md |
|---|---|---|
| VAL-01 | `K1b` | (unchanged) |
| VAL-02 | `K5` | (REQUIREMENTS draft said `K2` - collision with existing K2) |
| VAL-03 | `K6` | (REQUIREMENTS draft said `K3` - collision with existing K3) |
| VAL-04 | `K7` | (REQUIREMENTS draft said `K4` - free, but renumbered for sequential clarity) |

The existing `validate.sh` already uses `K1` (color picker consumed), `K2` (`invalidateUpdateView` not in RAF), `K3` (no bare-string token defaults). The new checks MUST NOT rename these. The planner must update REQUIREMENTS.md prose to refer to the actual codes (K1b/K5/K6/K7).

**Check Implementation Style (LOCKED):**
- Pure shell + grep / awk / find. No node, no python in validate.sh itself.
- Each check writes `FAIL $code: $message` via the existing `fail()` helper at line 24.
- Each check is self-contained, no shared state.
- Order: new checks land BELOW the existing K1/K2/K3 block (after line 224), BEFORE the design-fidelity check (line 225).
- One bash function per check: `check_k1b`, `check_k5`, `check_k6`, `check_k7` - for future unit-testability.

**Grep Pattern Starting Points (LOCKED as starting points; planner refines):**
- K1b: `<splunk-color-picker name="{{VIZ_NAMESPACE}}.<key>">` -> `opt("<key>")` called AND value within 30 lines of `ctx.` reference. Flag `c._unused = hexFromSplunk(opt(...))` as bug bait.
- K5: same as K1b for `<splunk-text-input>` and `<splunk-number-input>`. Exempt keys starting with `field`.
- K6: extract `"<family>"` from `ctx.font = '... "<family>" ...'`. Require matching `@font-face { font-family: "<family>"` in `visualization.css`. Exempt: `sans-serif`, `monospace`, `serif`, `system-ui`, `Inter`, `Arial`, `Helvetica`.
- K7: extract `"type": "<x>.<viz_name>"` from `default/data/ui/views/*.xml`. Compare `<x>` against `default/app.conf` `[package] id`. Skip apps with no `views/` dir.

**No-Regression Sweep (VAL-05):**
- Run `validate.sh` against every existing in-repo viz pack after new checks land.
- Confirm zero new FAILs on packs that previously passed.
- Output: one-line note in SUMMARY.md ("zero new FAILs across N packs").

### Claude's Discretion

The CONTEXT.md does not designate any explicit discretion areas, but planner reasonably has discretion over:
- The specific bash implementation of the reach heuristic (within-30-lines, within-same-function, or hybrid)
- Whether K1b and K5 share a helper function (they have near-identical reach logic)
- The exact wording of FAIL messages (must include code, viz name, and offending key/family)
- The structure of the SUMMARY.md sweep report

### Deferred Ideas (OUT OF SCOPE)

- AST-based validation (cheerio HTML DOM, acorn JS AST). Conflicts with the v6.0.x zero-user-deps rule.
- `validate.sh --repair` flag for the new checks (the way K1 has one).
- Validator unit tests (`tests/validate/` harness with fixture vizs that intentionally trigger each FAIL).
- Splunk MCP tool to auto-run validate.sh during cv-build.

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| VAL-01 | K1b: color picker `opt()` value must reach a `ctx.*` call | Test52 rog_session_timeline `accentColor`/`_hoverTint` is the canonical violator; grep feasibility confirmed for adjacent-function reach but cross-function reach (mos_health_gauge `_drawShared`) requires a relaxed heuristic - see Key Findings |
| VAL-02 | K5: text-input `opt()` value must reach a `ctx.*` call; exempt `field*` keys | Test51 mos_health_gauge `accentIntensity`/`tollThreshold`/`synthThreshold`/`showHoverEffect` are all violators; test52 rog_session_timeline `accentIntensity`/`showHoverEffect` same. Field-name keys (`rigField`, `mosField`, etc.) correctly exempt. |
| VAL-03 | K6: every distinct font family in `ctx.font = '... "<family>" ...'` must have matching `@font-face` in same viz's `visualization.css`; common fallbacks exempt | Test52 packs all use `Chakra Petch` and `JetBrains Mono` in ctx.font calls but visualization.css contains only a single class wrapper line - no `@font-face` blocks. K6 will FAIL all 7 test52 vizs as designed (Phase 48 closes the loop). |
| VAL-04 | K7: dashboard XML `"type": "<x>.<viz>"` must have `<x>` matching parent app.conf `[package] id`; skip apps with no `views/` dir | Test51 and test52 merged apps both have correctly-rewritten type strings (proves the fix from Correction #24 was applied). K7 will pass them. Skip rule needed because most test packs are viz-pack-standalone with no `views/`. |
| VAL-05 | All existing K1/K2/K3 and B/R/F families still fire correctly; common fallback fonts (`sans-serif`, `monospace`, `serif`, `system-ui`, `Inter`, `Arial`, `Helvetica`) exempt from K6 | 42 in-repo packs with `src/visualization_source.js` layout are candidates for the sweep. ~8 older packs (test12 etc.) have only built `visualization.js` and will be no-ops for K1b/K5/K6 source checks. |

</phase_requirements>

## Summary

Phase 47 adds four grep/awk-based checks (K1b, K5, K6, K7) to `plugins/splunk-custom-viz/scripts/validate.sh` to catch dead UI controls and silently-dropped fonts that shipped in test51 and test52. The validator is a 324-line pure-bash script; the new checks land between line 224 (end of K3) and line 225 (design-fidelity check), each as a self-contained `check_k*` function consuming the existing `fail()` helper.

The biggest research insight is that **the 30-line reach heuristic in CONTEXT.md is necessary but not sufficient**. Real-world vizs split `opt()` reads in `_resolveTheme` from `ctx.*` calls in `_drawShared` - sometimes 100+ lines apart and in a different function. A purely line-distance check will produce false positives on legitimate cross-function reads. The recommended heuristic combines (a) variable-name tracking - capture the LHS of the `opt()` assignment, then grep for that variable name anywhere in the file alongside a separate `ctx.` reference - with (b) detection of underscore-prefixed alias names (`c._hoverTint`, `c._unused`) as a positive signal of bug bait. This narrows false positives without needing a full AST.

K6 is straightforward (clean regex over `ctx.font` lines, intersect with `@font-face` blocks in `visualization.css`). K7 is straightforward (XML grep + app.conf single-key extraction). K5 reuses K1b's reach logic with a different input element selector.

**Primary recommendation:** Split into **2 plans** - one for the four new checks bundled (they share reach-logic helpers and land in the same 30-line region of validate.sh, atomic commit makes sense), one for the no-regression sweep (different phase of work: read-only verification across 42 packs producing a SUMMARY.md report).

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Grep-based checks (K1b/K5/K6/K7) | validate.sh (bash) | - | Same tier as K1/K2/K3 - extending the same script, same fail() helper |
| Reach heuristic (opt() -> ctx.*) | bash + grep | awk for line-window | grep -A for raw window, awk for var-name tracking |
| Font extraction from ctx.font | bash + grep -oE | - | Single regex sufficient; tested above |
| Font requirement in CSS | bash + grep | - | Simple presence check in same-dir visualization.css |
| Dashboard XML type extraction | bash + grep -oE | - | JSON CDATA inside XML, but grep handles flat string matching fine |
| App ID extraction from app.conf | bash + grep + sed | - | One-time extraction at top of K7, single source of truth |
| No-regression sweep (VAL-05) | bash loop + validate.sh invocations | - | Read-only orchestration over 42 dirs; output goes to SUMMARY.md |

## Standard Stack

### Core
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| bash | 4+ (macOS uses 3.2; script uses `set -u` and basic constructs only) | Validator language | Already in use; zero deps for end users |
| grep | BSD or GNU | Pattern matching | Already in use across K1/K2/K3 |
| awk | BSD or GNU | Multi-line state tracking (already used by K2) | Required for window-based detection |
| sed | BSD or GNU | Inline substitution / extraction | Already used in K1 for key extraction |
| find | BSD or GNU | File traversal | Already used for `.DS_Store` check |

### Supporting
None. validate.sh is intentionally a pure-shell artifact.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| grep + awk reach detection | node + acorn AST parsing | More accurate but violates zero-user-deps rule (CONTEXT.md `domain` block). Defer to v6.x per CONTEXT.md `deferred`. |
| bash brace-depth counter | A real JS parser | Brace-depth in pure awk is feasible but fragile (template literals, regex literals, comments). Variable-name tracking is more robust. |
| Python helper | bash function | Phase explicitly forbids `python in validate.sh itself` (CONTEXT.md decisions). |

**Installation:** No new tools to install. The validator runs in the shell already used by `cv-build`.

## Package Legitimacy Audit

Not applicable - this phase installs zero packages. validate.sh is a pure bash script with no dependencies beyond the system shell utilities (grep/awk/sed/find), all of which are already required by the existing K1/K2/K3 checks.

## Architecture Patterns

### System Architecture Diagram

```
User runs validate.sh <app_dir>
        |
        v
+-------------------+
| Existing checks   |
| FORMATTER (B5..)  |
| JS (F3, F6, F10)  |
| STRUCTURE (STR)   |
| K1, K2, K3        |
+-------------------+
        |
        v
+-------------------+
| NEW Phase 47:     |
| check_k1b()       |  reads: */formatter.html (color pickers)
|                   |          */src/visualization_source.js (opt + ctx)
| check_k5()        |  reads: */formatter.html (text/number inputs)
|                   |          */src/visualization_source.js (opt + ctx)
| check_k6()        |  reads: */src/visualization_source.js (ctx.font)
|                   |          */visualization.css (@font-face)
| check_k7()        |  reads: */default/data/ui/views/*.xml ("type")
|                   |          default/app.conf ([package] id)
+-------------------+
        |
        v
+-------------------+
| DESIGN FIDELITY   |
| ABSOLUTE BANS     |
| SUMMARY           |
+-------------------+
        |
        v
exit 0 (pass) or 1 (FAIL)
```

### Recommended Project Structure

No new files. All four checks land in the existing `validate.sh`:

```
plugins/splunk-custom-viz/scripts/
└── validate.sh    # +~150 lines: 4 new check_k* functions between line 224 and line 225
```

### Pattern 1: Bash function per check
**What:** Each new check as a discrete bash function defined once, invoked once.
**When to use:** All four new checks - CONTEXT.md locks this style.
**Example (from existing K2 awk pattern):**
```bash
# Source: plugins/splunk-custom-viz/scripts/validate.sh lines 193-205
check_k2() {
    for f in "$APP_DIR"/appserver/static/visualizations/*/src/visualization_source.js; do
        [ -f "$f" ] || continue
        VIZ=$(basename "$(dirname "$(dirname "$f")")")
        HITS=$(awk '
            /requestAnimationFrame/ { inRAF = 1; window = 8; next }
            inRAF && window > 0 {
                line = $0; sub(/^[ \t]+/, "", line)
                isComment = (substr(line, 1, 2) == "//")
                if (!isComment && /invalidateUpdateView\(/) { print FILENAME ":" NR; found = 1 }
                window--; if (window <= 0) inRAF = 0
            }
            END { if (found) exit 0; else exit 1 }
        ' "$f" 2>/dev/null)
        if [ -n "$HITS" ]; then fail K2 "..."; fi
    done
}
```

Note: the existing script does NOT actually wrap K1/K2/K3 in functions - they are inline `for` loops. The CONTEXT.md decision to wrap the new checks in functions is a forward-looking improvement. The planner should NOT refactor the existing K1/K2/K3 into functions (out of scope, raises regression risk).

### Pattern 2: Variable-name-tracking reach heuristic (RECOMMENDED for K1b / K5)
**What:** Extract the LHS of the `opt(...)` assignment; require that variable name appear in the same file alongside a `ctx.` reference.
**When to use:** Any check that verifies "opt value reaches Canvas".
**Example:**
```bash
# Pseudo-code for K1b (planner refines):
# For picker key "accentColor":
#   1. Find the line: var x = opt("accentColor", ...);  OR  c.<field> = ...opt("accentColor"...)...
#      Pattern: grep -oE '(var|c)\.?[a-zA-Z_][a-zA-Z0-9_]*\s*=\s*[^;]*opt\(["\x27]accentColor["\x27]' "$SRC"
#   2. Capture the LHS variable name (e.g. "_hoverTint" or "x")
#   3. Search for that variable name appearing in a line that ALSO contains "ctx." within the same file
#   4. If LHS starts with "_" AND no other site uses the unprefixed name -> bug bait -> FAIL
```

The "underscore-prefix as bug bait" rule from CONTEXT.md is concrete and easy to grep:
```bash
# If the only assignment for picker "X" is to a name starting with "_":
grep -oE 'c\._[a-zA-Z_][a-zA-Z0-9_]*\s*=\s*hexFromSplunk\(opt\("X"' "$SRC"
# AND that same _alias does NOT appear in any line containing "ctx." -> FAIL K1b
```

### Pattern 3: Simple regex extraction (K6)
**What:** Extract font families with one regex, intersect against @font-face declarations.
**Example:**
```bash
# Source: tested above with sample ctx.font strings
# Pattern: extract all "<family>" tokens from ctx.font lines
FAMILIES=$(grep -hE 'ctx\.font\s*=' "$SRC" | grep -oE '"[A-Za-z][A-Za-z0-9 _-]*"' | tr -d '"' | sort -u)
# Then for each family: check it's NOT in the exemption list
# Then check: grep -q "@font-face[^}]*font-family:\s*[\"']${family}[\"']" "$CSS"
```

### Pattern 4: XML type extraction with app.conf cross-check (K7)
```bash
APP_ID=$(grep -A1 '^\[package\]' "$APP_DIR/default/app.conf" | grep -oE '^id\s*=\s*[a-zA-Z0-9_]+' | sed -E 's/^id\s*=\s*//')
for xml in "$APP_DIR"/default/data/ui/views/*.xml; do
    [ -f "$xml" ] || continue
    grep -oE '"type":\s*"[a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z_][a-zA-Z0-9_]*"' "$xml" \
        | grep -oE '"[a-zA-Z_][a-zA-Z0-9_]*\.' | tr -d '".' | sort -u | while read PREFIX; do
        # PREFIX is the <x> from "type": "<x>.<viz>"
        # Exempt built-ins: splunk, ds, input
        case "$PREFIX" in splunk|ds|input) continue;; esac
        if [ "$PREFIX" != "$APP_ID" ]; then
            fail K7 "..."
        fi
    done
done
```

### Anti-Patterns to Avoid
- **Treating "no source file" as a FAIL.** Older test packs (test12 etc.) have only `visualization.js` (built AMD bundle), no `src/visualization_source.js`. The existing K1 already handles this with `[ -f "$SRC" ] || SRC="$VIZ_DIR/visualization_source.js"` then `continue`. New checks must do the same.
- **Treating "no views/ dir" as a FAIL.** Most viz packs are standalone with no dashboards. K7 must `continue` silently.
- **Tightening the reach window so much that legitimate cross-function reads fail.** Use variable-name tracking, not pure line-distance.
- **Refactoring existing K1/K2/K3 into functions during this phase.** Out of scope; regression risk.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTML attribute parsing | A bash HTML parser | grep -oE pattern over `name="{{VIZ_NAMESPACE}}.<key>"` | Splunk's formatter HTML is well-shaped (always same attribute order from boilerplate template); grep works. |
| JS scope analysis | A bash JS parser | Variable-name tracking + window heuristics | A real parser violates zero-user-deps rule. Variable-name tracking covers 90% of cases honestly. |
| XML JSON-in-CDATA extraction | A bash JSON parser | grep -oE | The `"type": "<x>.<viz>"` shape is stable across all known viz packs - direct string match works. |
| Cross-file variable reach (true semantic analysis) | A static analyzer | Same-file grep with variable name + ctx. presence | Out of scope; the validator catches the most common 90% honestly and admits the 10% as known false-negative. |

**Key insight:** The validator's purpose is to prevent **already-known failure modes** from regressing. It does not need to be a complete static analyzer. Every existing check (B5, F3, K1) is a grep-based heuristic that catches the most common shape and admits edge cases. The new checks follow the same philosophy.

## Common Pitfalls

### Pitfall 1: False positive on cross-function `opt()` reach (K1b / K5)
**What goes wrong:** `mos_health_gauge` reads `opt("goodColor")` in `_resolveTheme`, assigns to `c.good`, returns `c` as `t`, then `t.good` is consumed in `_drawShared` (different function, 100+ lines away). A pure 30-line-window reach check would FAIL this as a dead picker.
**Why it happens:** Idiomatic v6 viz code separates theme resolution (`_resolveTheme`) from rendering (`_drawShared` or `_render<X>`). The opt() call and the ctx.* call are legitimately in different functions.
**How to avoid:** Use variable-name tracking. Extract the LHS of `opt("X")` assignment (e.g. `c.good`). Then verify that variable name appears in a line containing `ctx.` ANYWHERE in the same file. The `_drawShared` case passes because `t.good` (= `c.good` after the return-and-reassign) appears in many `ctx.fillStyle = t.good` lines.
**Warning signs:** A test pack like mos_health_gauge FAILing K1b on `goodColor` even though the gauge clearly renders in good/warn/alert colors.

### Pitfall 2: False positive on underscore-prefix aliases that ARE consumed
**What goes wrong:** A viz author legitimately uses `c._brand = ...` as a private theme field name (with leading underscore signaling "internal"). K1b's bug-bait rule would flag it.
**Why it happens:** The underscore convention is a HINT, not a guarantee, that something is unused.
**How to avoid:** Only FAIL when BOTH (a) underscore-prefixed alias AND (b) the alias name does NOT appear in any line containing `ctx.`. The dead `c._hoverTint` from test52 satisfies both; a legitimate `c._brand` that is later read as `ctx.fillStyle = t._brand` satisfies only (a).

### Pitfall 3: Font family regex catching theme.js.FONTS strings
**What goes wrong:** `theme.js` declares `var FONTS = { display: '"Chakra Petch", "Arial Narrow", sans-serif' }`. A naive grep over all .js files would extract `Chakra Petch` as a font family the viz uses, even if the viz never references it.
**Why it happens:** K6 must scope its source scan to `visualization_source.js`, NOT to all .js files in the pack.
**How to avoid:** Use explicit path glob `*/src/visualization_source.js` (matches existing K1/K2 pattern). theme.js lives in `$APP_DIR/shared/theme.js`, not the per-viz `src/` directory.

### Pitfall 4: macOS BSD vs GNU grep differences
**What goes wrong:** `grep -oP` (Perl-compatible regex) is GNU-only. macOS BSD grep does not have `-P`.
**Why it happens:** Author tests on GNU grep (Linux dev) but the target users run macOS.
**How to avoid:** Use `-oE` (extended regex) everywhere, no PCRE features. The existing K1/K2/K3 use `-E` correctly. Test on macOS before commit (`shasum -a 256 validate.sh` matching across both is fine).

### Pitfall 5: app.conf parsing brittleness for K7
**What goes wrong:** `[package] id = my_app` can have varying whitespace, comments, or stanza ordering. A naive grep can miss it.
**Why it happens:** Splunk's app.conf is INI-style with idiosyncratic conventions.
**How to avoid:** Use the same pattern the existing STR check uses (`grep -q '^\[package\]'`), then a strict regex for `id`. Reference test52 app.conf above confirms `id = asus_rog_command_center` always lives on a single line after `[package]` with optional whitespace around `=`.

### Pitfall 6: K7 false positive on built-in Splunk types
**What goes wrong:** Dashboard XML contains `"type": "splunk.markdown"`, `"type": "splunk.singlevalue"`, `"type": "ds.search"`, `"type": "input.timerange"`. None of these are custom vizs - they are Splunk built-ins. K7 must exempt them.
**Why it happens:** The regex `<x>.<viz>` matches both `splunk.markdown` and `<app_id>.<viz_name>`.
**How to avoid:** Exempt prefix list: `splunk`, `ds`, `input`. Empirically verified in test51/test52 dashboards above.

## Runtime State Inventory

> Not applicable - this phase is purely additive code in a shell script. No stored data, live service config, OS-registered state, or build artifacts to migrate. The validator's exit behavior changes (potentially more FAILs), but no data is renamed or moved.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None - verified by reviewing CONTEXT.md scope | None |
| Live service config | None - validator is local-only | None |
| OS-registered state | None - validator is invoked on demand | None |
| Secrets/env vars | None - validator reads only filesystem | None |
| Build artifacts | None - validator does not produce artifacts | None |

## Code Examples

### Existing K1 (reference - what the new K1b extends)
```bash
# Source: plugins/splunk-custom-viz/scripts/validate.sh lines 163-182
for f in "$APP_DIR"/appserver/static/visualizations/*/formatter.html; do
    [ -f "$f" ] || continue
    VIZ_DIR=$(dirname "$f")
    VIZ=$(basename "$VIZ_DIR")
    SRC="$VIZ_DIR/src/visualization_source.js"
    [ -f "$SRC" ] || SRC="$VIZ_DIR/visualization_source.js"
    [ -f "$SRC" ] || continue
    PICKER_KEYS=$(grep -oE 'splunk-color-picker[^>]*name="\{\{VIZ_NAMESPACE\}\}\.[a-zA-Z0-9_]+' "$f" 2>/dev/null \
                  | sed -E 's/.*\{\{VIZ_NAMESPACE\}\}\.//' | sort -u)
    for K in $PICKER_KEYS; do
        if ! grep -qE "opt\(['\"]${K}['\"]" "$SRC"; then
            fail K1 "$VIZ: color picker \"$K\" in formatter.html is not consumed..."
        fi
    done
done
```

### Recommended K1b skeleton (planner refines)
```bash
check_k1b() {
    for f in "$APP_DIR"/appserver/static/visualizations/*/formatter.html; do
        [ -f "$f" ] || continue
        VIZ_DIR=$(dirname "$f")
        VIZ=$(basename "$VIZ_DIR")
        SRC="$VIZ_DIR/src/visualization_source.js"
        [ -f "$SRC" ] || SRC="$VIZ_DIR/visualization_source.js"
        [ -f "$SRC" ] || continue

        PICKER_KEYS=$(grep -oE 'splunk-color-picker[^>]*name="\{\{VIZ_NAMESPACE\}\}\.[a-zA-Z0-9_]+' "$f" 2>/dev/null \
                      | sed -E 's/.*\{\{VIZ_NAMESPACE\}\}\.//' | sort -u)

        for K in $PICKER_KEYS; do
            # Step 1: confirm opt() exists (K1 already did this; re-check defensively)
            grep -qE "opt\(['\"]${K}['\"]" "$SRC" || continue  # K1 already FAILed it

            # Step 2: extract the LHS variable name(s) from the assignment
            LHS_NAMES=$(grep -oE "(var\s+|c\.|t\.)[a-zA-Z_][a-zA-Z0-9_]*\s*=\s*[^;]*opt\(['\"]${K}['\"]" "$SRC" \
                        | grep -oE "(var\s+|c\.|t\.)[a-zA-Z_][a-zA-Z0-9_]*" \
                        | sed -E 's/^(var\s+|c\.|t\.)//' | sort -u)

            FOUND_REACH=0
            for LHS in $LHS_NAMES; do
                # Step 3: does any line containing ctx. also reference this name?
                # (Tolerant: the var could be accessed as c.LHS, t.LHS, or bare LHS)
                if grep -E "ctx\." "$SRC" | grep -qE "[.[:space:]]${LHS}\b"; then
                    FOUND_REACH=1
                    break
                fi
            done

            if [ "$FOUND_REACH" -eq 0 ]; then
                fail K1b "$VIZ: color picker \"$K\" is opt()-read but the value never reaches a ctx.* call (dead value). See KNOWN-CORRECTIONS.md #23."
            fi
        done
    done
}
check_k1b
```

### Recommended K6 skeleton
```bash
check_k6() {
    # Common font fallbacks that don't need @font-face
    EXEMPT_FAMILIES="sans-serif monospace serif system-ui Inter Arial Helvetica"

    for f in "$APP_DIR"/appserver/static/visualizations/*/src/visualization_source.js; do
        [ -f "$f" ] || continue
        VIZ_DIR=$(dirname "$(dirname "$f")")
        VIZ=$(basename "$VIZ_DIR")
        CSS="$VIZ_DIR/visualization.css"

        # Extract all "<family>" tokens from ctx.font = '...' lines
        FAMILIES=$(grep -hE 'ctx\.font\s*=' "$f" 2>/dev/null \
                   | grep -oE '"[A-Za-z][A-Za-z0-9 _-]*"' | tr -d '"' | sort -u)

        for FAM in $FAMILIES; do
            # Exempt list check
            for E in $EXEMPT_FAMILIES; do
                [ "$FAM" = "$E" ] && continue 2
            done

            # Must have @font-face block in same viz's CSS
            if [ ! -f "$CSS" ] || ! grep -qE "@font-face[^}]*font-family:\s*[\"']${FAM}[\"']" "$CSS"; then
                fail K6 "$VIZ: font \"$FAM\" used in ctx.font but no @font-face declaration in visualization.css. See KNOWN-CORRECTIONS.md #26."
            fi
        done
    done
}
check_k6
```

### Recommended K7 skeleton
```bash
check_k7() {
    # Skip apps with no dashboard XMLs
    [ -d "$APP_DIR/default/data/ui/views" ] || return 0

    # Extract parent app id
    if [ ! -f "$APP_DIR/default/app.conf" ]; then return 0; fi
    APP_ID=$(awk '/^\[package\]/{in_pkg=1;next} /^\[/{in_pkg=0} in_pkg && /^[[:space:]]*id[[:space:]]*=/{
        sub(/^[[:space:]]*id[[:space:]]*=[[:space:]]*/,"");
        sub(/[[:space:]]*$/,"");
        print; exit
    }' "$APP_DIR/default/app.conf")
    [ -n "$APP_ID" ] || return 0

    for xml in "$APP_DIR"/default/data/ui/views/*.xml; do
        [ -f "$xml" ] || continue
        XML=$(basename "$xml")
        # Extract all <x>.<viz> prefixes (the <x> part)
        PREFIXES=$(grep -oE '"type":[[:space:]]*"[a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z_][a-zA-Z0-9_]*"' "$xml" \
                   | grep -oE '"[a-zA-Z_][a-zA-Z0-9_]*\.' | tr -d '".' | sort -u)
        for PFX in $PREFIXES; do
            # Exempt Splunk built-ins
            case "$PFX" in splunk|ds|input|viz) continue;; esac
            if [ "$PFX" != "$APP_ID" ]; then
                fail K7 "$XML: viz type prefix \"$PFX\" does not match parent app id \"$APP_ID\" (incomplete cross-app merge). See KNOWN-CORRECTIONS.md #24."
            fi
        done
    done
}
check_k7
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| K1 alone (opt() called) | K1 + K1b (opt() called AND value reaches ctx) | This phase | Catches test52-class dead picker bugs |
| No text-input wired-to-render check | K5 (text-input opt + ctx reach) | This phase | Catches test51-class dead text-input bugs |
| No font embedding check | K6 (declared font has @font-face) | This phase | Sets the contract Phase 48 FONT-01 will satisfy |
| No cross-app merge check | K7 (type prefix matches app.conf id) | This phase | Catches test52-class incomplete-merge bugs |

**Deprecated/outdated:** Nothing. All four checks are additive.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Variable-name tracking reach heuristic is robust enough to clear mos_health_gauge cross-function pattern | Common Pitfalls / Pattern 2 [ASSUMED] | Planner builds and tests it against mos_health_gauge before declaring K1b done. If the heuristic still false-positives on legitimate code, planner widens variable-tracking rules or relaxes to "any opt(K) call + any ctx. reference somewhere = pass" with a separate WARN for the underscore-alias smell |
| A2 | All test packs use `*/src/visualization_source.js` OR built-only `*/visualization.js` (no other layouts) | No-regression sweep | Confirmed via filesystem scan above [VERIFIED: find command output]: 42 packs have src/, ~8 older packs are built-only. Both layouts handled by existing K1 fallback pattern. |
| A3 | Splunk built-in type prefixes are only: splunk, ds, input | K7 / Pitfall 6 [ASSUMED, but VERIFIED in test51/52 XMLs] | If a future Splunk version adds new built-in prefixes (e.g. `viz`, `embed`), K7 will produce false positives until the exempt list updates. Documented as known limitation. |
| A4 | `@font-face` block is in the SAME viz's visualization.css (not in a shared css or global file) | K6 [ASSUMED based on Correction #26] | Phase 48 will write per-viz @font-face blocks. If the design changes to a shared css file in `shared/` or `appserver/static/`, K6 needs to broaden its CSS search. Flag for Phase 48 plan to confirm. |
| A5 | Field-name text-input keys all start literally with `field` (e.g. `rigField`, `mosField`) | K5 exemption rule [VERIFIED in test51/52 formatters above] | All 7 field-name inputs in test52 rog_session_timeline match the `*Field` pattern; mos_health_gauge `mosField`/`recordsField` also match. Safe. |
| A6 | The 30-line CONTEXT.md heuristic is a starting point that planner can widen via variable-name tracking without re-discussing with user | User Constraints | Low - CONTEXT.md `specifics` block explicitly invites planner to "widen the window or switch to same-function scope detection" |

**Conclusion:** A1 is the single high-stakes assumption. The planner must include a Wave 0 step that runs the K1b implementation against test51 mos_health_gauge as a regression smoke before declaring K1b complete.

## Open Questions

1. **Should K1b WARN instead of FAIL on underscore-alias bug bait?**
   - What we know: CONTEXT.md says "FAIL". Test52 Correction #23 says the dead `c._hoverTint` shipped as a real bug, so FAIL is the right severity.
   - What's unclear: Whether legitimate `c._brand`-style names that ARE consumed should escape the check entirely.
   - Recommendation: FAIL when both (a) underscore-prefix AND (b) the alias name is never referenced in a `ctx.` line. WARN never applies - if it's reached, it passes; if not, it fails. Two-condition AND keeps it strict without false positives.

2. **Should the K5 exemption be `key starts with "field"` or `key contains "Field"` or `key ends in "Field"`?**
   - What we know: All test51 / test52 examples use camelCase suffix `Field` (e.g. `rigField`, `mosField`). None start with lowercase `field` as a prefix.
   - What's unclear: CONTEXT.md says "key starts with 'field'" which is wrong for the observed naming convention.
   - Recommendation: Match the empirical convention - exempt keys that END WITH `Field` (e.g. `*Field$` regex). Document this as a refinement of the CONTEXT.md draft rule. This is an HONEST CORRECTION OF THE LOCKED DRAFT, not a discretion override - the locked rule's intent is clearly "exempt data-field-name controls" and the empirical evidence shows the convention is `Field` suffix.

3. **Should K7 also check savedsearches.conf type references?**
   - What we know: Correction #21 (test51) lists `savedsearches.conf` viz custom type as another surface that breaks on merge.
   - What's unclear: Whether VAL-04 scope intends to cover savedsearches.conf or only dashboard XMLs.
   - Recommendation: Stay tight to REQUIREMENTS.md VAL-04 wording ("dashboard XML") for this phase. If savedsearches.conf coverage matters, add it as a follow-up under Phase 49 MERGE-02 ("validate.sh K4 [now K7] pass" already presumes the merge work).

4. **For VAL-05 sweep: do we run against built-only packs (test12, test28 etc.) or only modern packs?**
   - What we know: 42 modern packs have src/, ~8 older packs are built-only. K1b/K5/K6 silently skip built-only packs (no source); K7 silently skips packs with no views/.
   - What's unclear: Whether the sweep should include all 49+ packs for completeness or only the 42 modern ones.
   - Recommendation: Sweep ALL packs in `tests/test*/` that have an `appserver/static/visualizations/` dir. The non-modern packs will silently no-op for K1b/K5/K6, which is the correct behavior to verify (no spurious FAILs). The sweep's value is confirming the new checks don't blow up on edge cases (missing files, empty viz dirs, etc.).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| bash | validate.sh | yes (macOS ships 3.2; script uses portable constructs) | 3.2+ | none needed |
| grep | All checks | yes | BSD on macOS | none needed |
| awk | K1b/K5 reach (if used), K2 (existing) | yes | BSD on macOS | none needed |
| sed | Key extraction | yes | BSD on macOS | none needed |
| find | Existing STR checks | yes | BSD on macOS | none needed |

**Missing dependencies with no fallback:** None.
**Missing dependencies with fallback:** None.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | bash + validate.sh self-test (no external runner) |
| Config file | none - validate.sh is the executable contract |
| Quick run command | `bash plugins/splunk-custom-viz/scripts/validate.sh tests/test52_asus_rog/app_build/asus_rog_command_center` |
| Full suite command (sweep) | Wave 0 must create a `tests/validate_sweep.sh` helper that loops over every `tests/test*/` with an `appserver/` dir |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| VAL-01 | K1b fires on dead picker (`accentColor`->`_hoverTint`) | smoke | `bash plugins/splunk-custom-viz/scripts/validate.sh tests/test52_asus_rog/rog_telemetry_viz \| grep 'FAIL K1b'` | yes - test52 standalone pack |
| VAL-01 | K1b does NOT fire on mos_health_gauge cross-function reach | smoke | `bash plugins/splunk-custom-viz/scripts/validate.sh tests/test51_cucm/cisco_collab_viz \| grep -v 'FAIL K1b: mos_health_gauge'` | yes - test51 standalone pack |
| VAL-02 | K5 fires on dead text-input (`accentIntensity`) | smoke | `bash ... tests/test51_cucm/cisco_collab_viz \| grep 'FAIL K5'` | yes |
| VAL-02 | K5 does NOT fire on `*Field`-suffixed keys (`mosField`, `rigField`) | smoke | grep negative | yes |
| VAL-03 | K6 fires on declared `Chakra Petch` without `@font-face` | smoke | `bash ... tests/test52_asus_rog/rog_telemetry_viz \| grep 'FAIL K6: rog_'` | yes |
| VAL-03 | K6 does NOT fire on exempt families | smoke | grep negative for `sans-serif`, `monospace` | yes |
| VAL-04 | K7 passes on test52 merged app (type prefix matches) | smoke | `bash ... tests/test52_asus_rog/app_build/asus_rog_command_center \| grep -v 'FAIL K7'` | yes |
| VAL-04 | K7 skips standalone viz packs (no views/) | smoke | `bash ... tests/test52_asus_rog/rog_telemetry_viz \| grep -v 'FAIL K7'` | yes |
| VAL-05 | All 42 modern packs + ~8 older packs return existing pass/fail state (no NEW K1b/K5/K6/K7 FAILs on packs that previously passed) | regression sweep | `tests/validate_sweep.sh` (Wave 0 helper) | no - Wave 0 must create |

### Sampling Rate
- **Per task commit:** `bash plugins/splunk-custom-viz/scripts/validate.sh <one_known_pack>` matching the check being implemented
- **Per wave merge:** Run smoke tests for all 4 checks against test51 and test52 packs (4 invocations, ~5s total)
- **Phase gate:** Full sweep across all `tests/test*/` packs via `tests/validate_sweep.sh` produces a one-line report `"K1b FAILs: N, K5 FAILs: M, K6 FAILs: P, K7 FAILs: Q across X packs"`; planner asserts these counts match expectations documented in the plan

### Wave 0 Gaps
- [ ] `tests/validate_sweep.sh` - one-off helper that loops over `tests/test*/`, runs validate.sh against each pack with an `appserver/` dir, aggregates FAIL counts by code, writes to `.planning/phases/47-validator-hardening/sweep-output.txt`. Used only for the VAL-05 verification step; not a permanent test asset.
- [ ] No framework install needed - validate.sh self-tests.

## Security Domain

Not applicable - the validator does not handle untrusted input, does not authenticate, does not store data, does not make network calls, does not process secrets. It reads filesystem files and prints to stdout. The only security-adjacent surface is `grep` over potentially-malicious viz pack content, but grep is non-executing.

If asked to be thorough:

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | n/a |
| V3 Session Management | no | n/a |
| V4 Access Control | no | n/a |
| V5 Input Validation | minimal | grep regex must use anchored patterns to avoid ReDoS; no user input is regex'd |
| V6 Cryptography | no | n/a |

## Plan Splitting Recommendation

**Recommended split: 2 plans.**

**Plan 1: All 4 new checks (K1b + K5 + K6 + K7)**
- Implement `check_k1b`, `check_k5`, `check_k6`, `check_k7` functions in validate.sh
- Add invocations after the existing K3 loop (after line 224)
- Update REQUIREMENTS.md to reflect actual codes (K1b/K5/K6/K7 not K1b/K2/K3/K4)
- Add KNOWN-CORRECTIONS.md entries #15 (K5), #23 (K1b), #24 (K7), #26 (K6) if not already present (verify via Read first)
- Smoke-test each check against test51/test52 fixtures during implementation (per-task verification)
- Bump `plugins/splunk-custom-viz/plugin.json` version (6.0.8 -> 6.0.9 or 6.1.0 per repo memory `feedback_plugin_version_bump.md`)

**Plan 2: No-regression sweep (VAL-05)**
- Create `tests/validate_sweep.sh` Wave 0 helper
- Run sweep across all `tests/test*/` packs
- Capture before/after FAIL counts (run validate.sh from `main` branch first to baseline, then again with Phase 47 changes)
- Write SUMMARY.md note: "Phase 47 validator: K1b found X dead pickers, K5 found Y dead text-inputs, K6 found Z unembedded fonts, K7 found W cross-app mismatches across N packs. Zero new FAILs on packs that previously passed."
- Document any UNEXPECTED FAILs in HANDOFF notes (e.g. if K6 fires on a pack from before Phase 48, that's expected; if K1b fires on a legitimate cross-function reach, that's an A1 violation requiring planner to refine the heuristic)

**Why this split and not 5 plans (one per check + sweep):**
- K1b and K5 share 80% of their reach-detection logic. Splitting them forces duplicating the helper or coordinating two plans that touch the same code region.
- K6 and K7 are small, self-contained (~30 lines each). Five plans = five PRs = five merge cycles for what is a single, coherent batch of additive checks.
- The sweep is genuinely a different mode of work (read-only verification, requires both checks present, produces a report not code). Worth its own plan.
- Atomic commit for all 4 checks lets the version bump and the KNOWN-CORRECTIONS.md updates land in one coherent unit.

**Why not 1 plan for everything:**
- The sweep requires the 4 checks to be present, then runs them across 49+ packs and aggregates results. That is verification work distinct from implementation work, and it benefits from being a separate `gsd-execute-plan` invocation so the verifier can independently confirm "no new regressions."

**Risk to flag in plan-check:**
- A1 above: the variable-name reach heuristic for K1b/K5 must be tested against mos_health_gauge before declaring done. If the planner skips this validation step, the most likely outcome is a Plan 1 PR that introduces a false-positive K1b FAIL on test51, which the Plan 2 sweep will catch but at a higher cost (rework after merge). Plan 1's task list must include "run validate.sh against test51 cisco_collab_viz; confirm no K1b FAIL on mos_health_gauge" as a pre-completion gate.

## Sources

### Primary (HIGH confidence)
- `plugins/splunk-custom-viz/scripts/validate.sh` (324 lines, read in full) - existing K1/K2/K3 patterns, `fail()` helper, structure
- `plugins/splunk-custom-viz/KNOWN-CORRECTIONS.md` (read in full) - corrections #1-#14, validator references
- `plugins/splunk-custom-viz/scripts/boilerplate_emit.js` (read in full) - `_resolveTheme`, `c.xxx = hexFromSplunk(opt(...))` patterns
- `tests/test51_cucm/HANDOFF.md` (read in full) - Correction #15 (K5 motivation), Correction #21 (K7 motivation precedent)
- `tests/test52_asus_rog/HANDOFF.md` (read in full) - Corrections #23 (K1b), #24 (K7), #26 (K6) motivations
- `.planning/phases/47-validator-hardening/47-CONTEXT.md` (read in full) - locked decisions
- `.planning/REQUIREMENTS.md` (read in full) - VAL-01..05 requirement text
- `tests/test52_asus_rog/rog_telemetry_viz/appserver/static/visualizations/rog_session_timeline/{src/visualization_source.js,formatter.html,visualization.css}` - canonical K1b violator (`_hoverTint`), K5 violator (`accentIntensity`), K6 violator (Chakra Petch + JetBrains Mono with empty visualization.css)
- `tests/test51_cucm/cisco_collab_viz/appserver/static/visualizations/mos_health_gauge/{src/visualization_source.js,formatter.html,visualization.css}` - cross-function reach test case for K1b heuristic + canonical K5 violators (`tollThreshold`, `synthThreshold`, `accentIntensity`)
- `tests/test52_asus_rog/app_build/asus_rog_command_center/{default/app.conf,default/data/ui/views/*.xml}` - K7 pass case (merged app with correct type prefixes)
- `tests/test51_cucm/app_build/cucm_communications_pulse/default/data/ui/views/*.xml` - K7 pass case (merged app)

### Secondary (MEDIUM confidence)
- Filesystem inventory via `find`: 42 modern test packs (`src/visualization_source.js`), ~8 older built-only packs. Used for A2 verification.
- macOS BSD vs GNU grep behavior (`-E` portable, `-P` not). General knowledge, applies to test environment.

### Tertiary (LOW confidence)
None - all claims in this research were verified against either the codebase or the source HANDOFF docs.

## Metadata

**Confidence breakdown:**
- Existing validator structure: HIGH - read all 324 lines in full
- Grep patterns for K1b/K5/K6/K7: HIGH for K6/K7 (clean regexes, verified), MEDIUM for K1b/K5 reach logic (heuristic that requires Wave 0 smoke test against mos_health_gauge)
- Pack inventory for sweep: HIGH - filesystem scan completed
- KNOWN-CORRECTIONS.md numbering: HIGH - existing entries #1-#14 read in full; new entries should slot in as #15, #23, #24, #26 per test51/52 HANDOFF cross-references
- Plan-splitting recommendation: HIGH - based on shared logic analysis between K1b/K5 and the distinct verification nature of VAL-05

**Research date:** 2026-06-08
**Valid until:** ~2026-07-08 (validator is stable infrastructure; longer horizon than typical research)
