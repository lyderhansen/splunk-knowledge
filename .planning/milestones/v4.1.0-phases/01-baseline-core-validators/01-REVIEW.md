---
phase: 01-baseline-core-validators
reviewed: 2026-05-15T00:00:00Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - plugins/splunk-viz-packs/skills/vp-viz/scripts/validate_ast.js
  - plugins/splunk-viz-packs/skills/vp-viz/scripts/validate_viz.sh
  - plugins/splunk-viz-packs/skills/vp-create/scripts/validate_viz.sh
findings:
  critical: 5
  warning: 5
  info: 2
  total: 12
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-05-15
**Depth:** standard
**Files Reviewed:** 3
**Status:** issues_found

## Summary

Three files were reviewed: the core AST/DOM validator (`validate_ast.js`), the main shell pipeline (`vp-viz/validate_viz.sh`), and the delegation shim (`vp-create/validate_viz.sh`). The delegation shim is clean. The main shell script is mostly sound but has three critical issues in the grep-based fallback path and one structural issue in the JS check. The AST validator has the most problems: four ES6+ node types are missing from the `walk()` switch, meaning real ES6 code can pass the ES5 check; the B21 null-guard grep misses the common `!== null` pattern; and the `existsSync` guard does not reject directories.

The fallback path (when `node` or vendor deps are unavailable) is substantially weaker than the AST path — this is acceptable for a "zero user deps" constraint, but two of the fallback checks produce actively wrong results (B20 fires on any dark option, B5 section-label count is global). These must be fixed because they break clean formatters.

---

## Critical Issues

### CR-01: Three ES6+ node types missing from walk() — spread, rest, default params, for-of pass silently

**File:** `plugins/splunk-viz-packs/skills/vp-viz/scripts/validate_ast.js:110-137`

**Issue:** The `walk()` switch handles `const`/`let`, arrow functions, template literals, classes, and destructuring patterns — but misses four commonly-used ES6+ constructs. Code containing any of these will pass the `--js` check and be silently allowed into a Splunk viz bundle that will break at runtime under RequireJS:

- **`SpreadElement`** — `foo(...args)` or `[...arr]` or `{...obj}` — the node IS traversed (its children are visited) but the spread element itself is never flagged.
- **`RestElement`** — `function foo(...args) {}` — rest parameters are wrapped in a `RestElement` child of the function params array; not checked.
- **`AssignmentPattern`** — `function foo(x = 0) {}` — default function parameters produce `AssignmentPattern` nodes in the params array; not checked. (Destructuring defaults are already caught via `ObjectPattern`/`ArrayPattern`, but standalone default params are not.)
- **`ForOfStatement`** — `for (var x of arr) {}` — ES6 iteration protocol; not flagged.

Generator functions (`function* foo() {}`) are a fifth gap: acorn represents them as `FunctionDeclaration { generator: true }` with no separate node type, so they also slip through.

**Fix:** Add cases to the switch:

```javascript
case 'SpreadElement':
    report(node, 'spread syntax');
    break;
case 'RestElement':
    report(node, 'rest parameter');
    break;
case 'AssignmentPattern':
    // Only flag as ES6 when it is a function parameter default,
    // not when it is a destructuring default (those are caught via ObjectPattern/ArrayPattern)
    // The simplest safe approach: flag all AssignmentPattern nodes.
    report(node, 'default parameter / destructuring default');
    break;
case 'ForOfStatement':
    report(node, 'for-of statement');
    break;
```

For generators, add a check inside the `FunctionDeclaration` / `FunctionExpression` cases (or add those cases):

```javascript
case 'FunctionDeclaration':
case 'FunctionExpression':
    if (node.generator) {
        report(node, 'generator function');
    }
    break;
```

---

### CR-02: B20 grep fallback fires on any dark option, not just dark default — breaks valid formatters

**File:** `plugins/splunk-viz-packs/skills/vp-viz/scripts/validate_viz.sh:69-70`

**Issue:** The grep fallback B20 check is:

```bash
THEME_DARK=$(grep -c 'themeMode.*value="dark"' "$f" 2>/dev/null || true)
[ "$THEME_DARK" -gt 0 ] && { echo "  FAIL B20: themeMode defaults to dark (must be auto)"; FAIL=1; }
```

This fires whenever `dark` appears as *any* option in a `themeMode` radio group, even when the correct `auto` option is also present and selected. A perfectly valid formatter with three theme options (`auto`, `dark`, `light`) will FAIL B20 because the string `themeMode.*value="dark"` matches the dark option row. This is an **incorrect FAIL** that blocks packaging of clean code.

The correct check is whether `dark` is the **default/selected value** on the control element itself, not whether it appears as a child option.

**Fix:**

```bash
# Check if the themeMode control itself has value="dark" as its default
# (the control-level value= attribute, not a child <option> element)
THEME_DARK=$(grep -cE '<splunk-radio-input[^>]*themeMode[^>]*value="dark"' "$f" 2>/dev/null || true)
[ "$THEME_DARK" -gt 0 ] && { echo "  FAIL B20: themeMode defaults to dark (must be auto)"; FAIL=1; }
```

---

### CR-03: B5 grep fallback counts section-label= globally, not per-form — false negatives

**File:** `plugins/splunk-viz-packs/skills/vp-viz/scripts/validate_viz.sh:64-66`

**Issue:** The grep fallback section-label check:

```bash
FORMS=$(grep -c '<form' "$f" 2>/dev/null || true)
LABELS=$(grep -c 'section-label=' "$f" 2>/dev/null || true)
[ "$FORMS" -gt "$LABELS" ] && { echo "  FAIL B5: $((FORMS-LABELS)) <form> without section-label"; FAIL=1; }
```

This compares a global count of `<form` occurrences against a global count of `section-label=` occurrences. If a formatter has two `<form>` elements and two `section-label=` attributes — but both attributes are on `<splunk-control-group>` elements rather than on `<form>` elements — the counts will be equal (2 == 2) and the check passes, producing a **false negative**. The violation silently slips through.

**Fix:** Use a pattern that requires `section-label=` to appear on the same line as `<form`:

```bash
FORMS=$(grep -c '<form' "$f" 2>/dev/null || true)
FORMS_WITH_LABEL=$(grep -cE '<form[^>]*section-label=' "$f" 2>/dev/null || true)
[ "$FORMS" -gt "$FORMS_WITH_LABEL" ] && { echo "  FAIL B5: $((FORMS-FORMS_WITH_LABEL)) <form> without section-label"; FAIL=1; }
```

---

### CR-04: B10 AST and grep fallback check different patterns — 2-part hardcoded namespace passes grep

**File:** `plugins/splunk-viz-packs/skills/vp-viz/scripts/validate_viz.sh:49`

**Issue:** The AST validator (`validate_ast.js` line 191) flags any name value matching `/^[a-zA-Z0-9_]+\.[a-zA-Z0-9_]+/` — i.e., two or more dot-separated parts. The grep fallback at line 49 uses:

```bash
grep -cE 'name="[a-zA-Z0-9_]+\.[a-zA-Z0-9_]+\.'
```

The trailing dot in the grep pattern requires **three** dot-separated parts (`word.word.word`). A two-part hardcoded namespace like `name="myapp.value"` is caught by the AST path but passes the grep fallback undetected. When `validate_ast.js` is unavailable, this is a silent false negative that allows a B10 violation to ship.

**Fix:** Remove the trailing dot from the grep pattern to match the AST rule:

```bash
HARDCODED=$(grep -cE 'name="[a-zA-Z0-9_]+\.[a-zA-Z0-9_]+' "$f" 2>/dev/null || true)
```

---

### CR-05: B21 null-guard check misses `!== null` — any viz using triple-equals null check fails

**File:** `plugins/splunk-viz-packs/skills/vp-viz/scripts/validate_viz.sh:125`

**Issue:**

```bash
grep -qE '!= null|safeStr|safeNum' "$f" || { echo "  FAIL B21: no null guards"; FAIL=1; }
```

The pattern `!= null` (double-equals) does not match `!== null` (triple-equals). A viz file that correctly uses strict equality (`if (val !== null)`) without also using `safeStr`/`safeNum` will trigger a false FAIL B21, blocking packaging. This is especially likely for viz files that implement custom null guards rather than using the project helpers.

The project convention recommends `safeStr`/`safeNum` as the canonical null-guard mechanism, so in practice this false positive may be rare — but the check is incorrect as written and will fail valid code.

**Fix:**

```bash
grep -qE '!== null|!= null|safeStr|safeNum' "$f" || { echo "  FAIL B21: no null guards"; FAIL=1; }
```

---

## Warnings

### WR-01: validate_ast.js does not verify the file is a regular file — directory input causes uncaught exception

**File:** `plugins/splunk-viz-packs/skills/vp-viz/scripts/validate_ast.js:47-50`

**Issue:** The guard `if (!fs.existsSync(filePath))` returns `true` for directories. If a directory path is passed, `fs.readFileSync` on line 64/169 throws an uncaught `EISDIR: illegal operation on a directory` exception. The process exits non-zero (unhandled exception = exit 1) but dumps a full Node.js stack trace to stderr, which is captured by `validate_viz.sh`'s `2>&1` redirection and appears in the FAIL output stream as unformatted noise.

**Fix:**

```javascript
if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    process.stderr.write('Error: not a regular file: ' + filePath + '\n');
    process.exit(1);
}
```

---

### WR-02: stderr from validate_ast.js is captured into FAIL output stream — corrupts output format

**File:** `plugins/splunk-viz-packs/skills/vp-viz/scripts/validate_viz.sh:41,111`

**Issue:** Both invocations of `validate_ast.js` capture stderr into stdout:

```bash
OUTPUT=$(node "$VALIDATE_AST" --html "$f" 2>&1)
OUTPUT=$(node "$VALIDATE_AST" --js "$f" 2>&1)
```

When `validate_ast.js` prints a warning like `Warning: acorn parse error: Unexpected token (3:4)` to stderr (line 72 of validate_ast.js), that message is included in `$OUTPUT` and echoed alongside `FAIL`-prefixed lines. The warning lacks the two-space indent that all other output uses, and it does not follow the `FAIL B*/F*/R*: ...` format. This makes the output inconsistent and could confuse automated parsers of the validator's output.

**Fix:** Separate stderr from the output and print it distinctly, or redirect stderr directly to the terminal:

```bash
OUTPUT=$(node "$VALIDATE_AST" --html "$f" 2>/tmp/ast_err_$$)
AST_EXIT=$?
AST_ERR=$(cat /tmp/ast_err_$$); rm -f /tmp/ast_err_$$
[ -n "$OUTPUT" ] && echo "$OUTPUT"
[ -n "$AST_ERR" ] && echo "  WARN: AST: $AST_ERR"
```

Or, more simply, let stderr pass through to the terminal directly (only capture stdout):

```bash
OUTPUT=$(node "$VALIDATE_AST" --html "$f")
```

---

### WR-03: node --check suppresses all syntax error detail — developer sees no diagnostic information

**File:** `plugins/splunk-viz-packs/skills/vp-viz/scripts/validate_viz.sh:105`

**Issue:**

```bash
node --check "$f" 2>/dev/null || { echo "  FAIL: syntax error"; FAIL=1; }
```

The `2>/dev/null` discards the actual syntax error from Node, leaving only `"  FAIL: syntax error"` with no location or description. A developer with a syntax error in their bundle gets no information about what the error is or where.

**Fix:** Print the error to stdout so it appears in the validator output:

```bash
SYNTAX_ERR=$(node --check "$f" 2>&1); SYNTAX_EXIT=$?
if [ "$SYNTAX_EXIT" -ne 0 ]; then
    echo "  FAIL: syntax error: $SYNTAX_ERR"
    FAIL=1
fi
```

---

### WR-04: B5 grep fallback for `type="custom"` uses a global count — false negatives when type="custom" appears in unrelated elements

**File:** `plugins/splunk-viz-packs/skills/vp-viz/scripts/validate_viz.sh:59-61`

**Issue:**

```bash
PICKERS=$(grep -c '<splunk-color-picker ' "$f" 2>/dev/null || true)
CUSTOM=$(grep -c 'type="custom"' "$f" 2>/dev/null || true)
[ "$PICKERS" -gt 0 ] && [ "$CUSTOM" -lt "$PICKERS" ] && { echo "  FAIL B5: ..."; FAIL=1; }
```

`CUSTOM` counts *all* `type="custom"` occurrences in the file, not just those on `<splunk-color-picker>` elements. A formatter with two color pickers (neither having `type="custom"`) but with two other elements that happen to use `type="custom"` would yield `CUSTOM=2`, `PICKERS=2`, and the check passes — a false negative.

**Fix:**

```bash
PICKERS=$(grep -c '<splunk-color-picker ' "$f" 2>/dev/null || true)
CUSTOM=$(grep -cE '<splunk-color-picker[^>]*type="custom"' "$f" 2>/dev/null || true)
[ "$PICKERS" -gt 0 ] && [ "$CUSTOM" -lt "$PICKERS" ] && { echo "  FAIL B5: color picker without type=\"custom\""; FAIL=1; }
```

---

### WR-05: B20 AST check only covers `splunk-radio-input` — `splunk-select` and other themeMode elements are missed

**File:** `plugins/splunk-viz-packs/skills/vp-viz/scripts/validate_ast.js:232-248`

**Issue:** The B20 check in the AST path filters specifically for `<splunk-radio-input>` elements:

```javascript
var themeModeRadios = $('splunk-radio-input').filter(function(i, el) {
    var nameVal = $(el).attr('name') || '';
    return nameVal.indexOf('themeMode') !== -1;
});
```

If a formatter implements the `themeMode` control as `<splunk-select name="{{VIZ_NAMESPACE}}.themeMode">` or any other element type, the B20 check is silently skipped — a false negative. The control may ship without an `auto` option.

**Fix:** Broaden the selector to any element with a `name` attribute containing `themeMode`:

```javascript
var themeModeControls = $('[name]').filter(function(i, el) {
    var nameVal = $(el).attr('name') || '';
    return nameVal.indexOf('themeMode') !== -1;
});
```

---

## Info

### IN-01: The `visited` array deduplication in walk() is dead code

**File:** `plugins/splunk-viz-packs/skills/vp-viz/scripts/validate_ast.js:79-103`

**Issue:** The `hasVisited`/`markVisited` functions exist to prevent double-reporting, but acorn ASTs are directed acyclic graphs — no node is ever visited twice during a depth-first walk of the tree. The `hasVisited` check never returns `true`. The 26 lines of machinery (and the O(n) scan per node) are entirely unused.

**Fix:** Remove the `visited`, `hasVisited`, and `markVisited` code. Simplify `report` to:

```javascript
function report(node, desc) {
    var line = node.loc && node.loc.start ? node.loc.start.line : '?';
    var snip = snippet(node.loc);
    violations.push('  FAIL F3: ' + desc + ' at line ' + line + ': ' + snip);
}
```

---

### IN-02: B7 grep fallback matches substrings — `data-default=` and `set-default=` are false positives

**File:** `plugins/splunk-viz-packs/skills/vp-viz/scripts/validate_viz.sh:55-56`

**Issue:** The grep fallback for B7:

```bash
DEFAULTS=$(grep -c 'default=' "$f" 2>/dev/null || true)
```

This matches any occurrence of the substring `default=`, including valid HTML attributes like `data-default=`, `set-default=`, `is-default=`, or CSS class names. A formatter using `data-default="..."` for other purposes would trigger a spurious FAIL B7.

**Fix:** Anchor the pattern to match `default=` as a standalone attribute (preceded by whitespace or start of line):

```bash
DEFAULTS=$(grep -cE '\bdefault=' "$f" 2>/dev/null || true)
```

Note: this is a fallback-only issue (the AST/cheerio path at line 176 checks for `[default]` attribute existence, which is correct).

---

## Findings Summary Table

| ID | Severity | File | Line | Description |
|----|----------|------|------|-------------|
| CR-01 | BLOCKER | validate_ast.js | 110-137 | SpreadElement, RestElement, AssignmentPattern (default params), ForOfStatement, and generator functions missing from ES6 walk — pass undetected |
| CR-02 | BLOCKER | validate_viz.sh | 69-70 | B20 grep fallback fires on any `dark` option in themeMode, not just when dark is the default — breaks valid formatters |
| CR-03 | BLOCKER | validate_viz.sh | 64-66 | B5 section-label grep count is global, not per-form — forms without section-label can pass if count happens to match |
| CR-04 | BLOCKER | validate_viz.sh | 49 | B10 grep fallback requires trailing dot (3-part name); AST catches 2-part — 2-part hardcoded namespaces pass grep fallback |
| CR-05 | BLOCKER | validate_viz.sh | 125 | B21 null-guard grep uses `!= null` (double-equals) — `!== null` (triple-equals) is not matched; valid code fails |
| WR-01 | WARNING | validate_ast.js | 47-50 | `existsSync` does not reject directories — directory input causes uncaught EISDIR exception with stack trace |
| WR-02 | WARNING | validate_viz.sh | 41,111 | `2>&1` captures acorn/Node stderr into FAIL output stream — corrupts output format |
| WR-03 | WARNING | validate_viz.sh | 105 | `node --check 2>/dev/null` discards all syntax error details — developer gets no diagnostic info |
| WR-04 | WARNING | validate_viz.sh | 59-61 | B5 `type="custom"` count is global — false negative if `type="custom"` appears on non-picker elements |
| WR-05 | WARNING | validate_ast.js | 232-248 | B20 only checks `splunk-radio-input` for themeMode — `splunk-select` and other element types are missed |
| IN-01 | INFO | validate_ast.js | 79-103 | `visited` array deduplication is dead code — acorn ASTs have no cycles |
| IN-02 | INFO | validate_viz.sh | 55-56 | B7 grep `'default='` matches substrings like `data-default=` — false positives in fallback path |

---

_Reviewed: 2026-05-15_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
