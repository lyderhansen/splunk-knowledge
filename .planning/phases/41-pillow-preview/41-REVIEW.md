---
phase: 41-pillow-preview
reviewed: 2026-05-24T00:00:00Z
depth: standard
files_reviewed: 5
files_reviewed_list:
  - plugins/splunk-viz-packs/skills/vp-create/scripts/generate_previews.py
  - plugins/splunk-viz-packs/skills/vp-create/scripts/generate_assets.js
  - plugins/splunk-viz-packs/skills/vp-viz/references/package-mjs-template.md
  - plugins/splunk-viz-packs/skills/vp-create/SKILL.md
  - plugins/splunk-viz-packs/.claude-plugin/plugin.json
findings:
  critical: 1
  warning: 6
  info: 5
  total: 12
status: issues_found
---

# Phase 41: Code Review Report

**Reviewed:** 2026-05-24
**Depth:** standard
**Files Reviewed:** 5
**Status:** issues_found

## Summary

Phase 41 introduces a Pillow-based Python preview generator (`generate_previews.py`) that
takes over preview.png generation from the JS silhouette path, with the JS path preserved
behind a `--legacy-previews` flag. The Python script implements a 3-tier viz-type cascade
(annotation → Canvas pattern → branded generic), bundles Inter-Regular.ttf for reproducible
text rendering, and is wired into vp-create Step 3b. The Extension API `package.mjs`
template is upgraded to invoke the same script.

Threat-model items called out in the context (T-41-01 hex validation, T-41-02 no shell=True
pip invocation, T-41-03 app_dir validation) are all properly mitigated. Security posture is
sound — no `eval`, no shell injection on the Python side, hex validation regex correctly
restricts to `[0-9A-Fa-f]`.

However, one CRITICAL correctness bug invalidates a stated design property (reproducibility
across runs), and several WARNING-level issues exist around silently-degraded fallback paths,
template-quoting fragility, and validation inconsistency.

## Critical Issues

### CR-01: `hash()` is non-deterministic across process runs — breaks reproducibility claim

**File:** `plugins/splunk-viz-packs/skills/vp-create/scripts/generate_previews.py:333, 374`
**Issue:** `drawLine` uses `abs(hash(viz_name or "line"))` to seed its LCG, and `drawKpi`
uses `abs(hash(viz_name or "kpi")) % len(candidates)` to pick a hero number. CPython's
built-in `hash()` for strings is randomized per-process by default (PEP 456 / `PYTHONHASHSEED`
defaults to "random" since Python 3.3). The docstring on `drawLine` explicitly claims
"Y values reproducible from viz_name", and the phase context (D-03) says "Previews look
identical on every build". Both claims are false as written.

Every invocation of `generate_previews.py` will produce a DIFFERENT sparkline shape for
the same viz, and the KPI hero may flip between "42" / "99%" / "1.2K" between builds.
This defeats the purpose of bundling Inter for reproducibility and will produce churn in
committed preview.png files when nothing else changed.

**Fix:**
```python
import hashlib

def _seed_from_name(name: str) -> int:
    """Deterministic 32-bit seed from a string, stable across runs."""
    h = hashlib.md5((name or "").encode("utf-8")).digest()
    return int.from_bytes(h[:4], "big")

# in drawLine:
seed = _seed_from_name(viz_name or "line")

# in drawKpi:
hero = candidates[_seed_from_name(viz_name or "kpi") % len(candidates)]
```

## Warnings

### WR-01: Extension API path silently uses DEFAULT_THEME instead of brand colors

**File:** `plugins/splunk-viz-packs/skills/vp-viz/references/package-mjs-template.md:220-223`
**Issue:** The template invokes `generate_previews.py "${previewStageDir}"` where
`previewStageDir = STAGE_DIR`. `generate_previews.py`'s `_find_theme_js()` searches
`<app_dir>/shared/theme.js` then `<app_dir>/../shared/theme.js`. Nothing in the template
(or its documented "must run after build.mjs" prerequisite) guarantees `shared/theme.js`
is present under `STAGE_DIR`. The script will silently fall back to `DEFAULT_THEME`
(red/blue/gold) and the preview will show wrong colors against the rest of the brand.

The fallback message goes to stderr only as `WARNING: no shared/theme.js found - using
DEFAULT_THEME`, which `execSync({stdio: 'inherit'})` will surface, but the user has no
forcing function to act on it because the script still exits 0 — Step 5 reports success.

**Fix:** Either (a) make `package.mjs` copy `shared/theme.js` into STAGE_DIR before
invoking the Python script, or (b) have `package.mjs` pass the project-root path
(where `shared/theme.js` lives) rather than `STAGE_DIR`. Option (b) is simpler:
```javascript
const previewSourceDir = __dirname; // app source root, where shared/theme.js lives
execSync(`python3 "${previewScript}" "${previewSourceDir}"`, { stdio: 'inherit' });
// then copy generated previews from visualizations/<viz>/preview.png into stageVizBase
```
Or document explicitly that build.mjs MUST stage `shared/theme.js` to `STAGE_DIR/shared/theme.js`
before package.mjs runs, and add a verification check.

### WR-02: Shell injection / path-quoting fragility in package.mjs execSync

**File:** `plugins/splunk-viz-packs/skills/vp-viz/references/package-mjs-template.md:223`
**Issue:** The template literal `execSync(\`python3 "${previewScript}" "${previewStageDir}"\`, ...)`
wraps paths in double quotes but does not escape `$`, `` ` ``, `\`, or `"` characters that
may appear in the path. The `${PREVIEW_SCRIPT_PATH}` placeholder is filled at scaffolding
time and `STAGE_DIR` is derived from `__dirname` — both are unlikely to contain shell
metacharacters in practice, but a project path containing `"` or `$(...)` would either
break execution or, in the worst case, execute arbitrary shell.

Also at line 261-263 the tar `execSync(\`COPYFILE_DISABLE=1 tar czf "${SPL_OUT}"
-C "${stageParent}" "${APP_ID}"\`)` shares the same fragility — `APP_ID` is
template-substituted but if a user ever supplied an APP_ID containing `"` or `$()`,
it would inject. Pre-existing issue, but the new preview-script invocation extends the
attack surface.

**Fix:** Use `execFileSync` with an argv array instead of `execSync` with shell
interpolation:
```javascript
import { execFileSync } from 'child_process';
execFileSync('python3', [previewScript, previewStageDir], { stdio: 'inherit' });
```
Same for the tar command — pass args as array elements; set `COPYFILE_DISABLE=1` via
`env: { ...process.env, COPYFILE_DISABLE: '1' }`.

### WR-03: HEX_COLOR_RE accepts strings that hex_to_rgb silently rejects

**File:** `plugins/splunk-viz-packs/skills/vp-create/scripts/generate_previews.py:57, 93-103`
**Issue:** `HEX_COLOR_RE = re.compile(r"^#[0-9A-Fa-f]{3,8}$")` accepts hex strings of length
3, 4, 5, 6, 7, or 8. `hex_to_rgb()` handles only length-3 (shorthand) and length≥6 (takes
first 6 chars); lengths 4, 5, and 7 fall through to the final `return (128, 128, 128)`
mid-grey. A theme.js with a typo like `accent: '#FF000'` (5 chars) would pass validation
and silently render previews in grey instead of warning. This conflicts with the T-41-01
mitigation goal — the validator's job is to catch these.

**Fix:** Tighten the regex to only canonical lengths:
```python
HEX_COLOR_RE = re.compile(r"^#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$")
```
And add an explicit log when a value fails validation so the user sees something happened.

### WR-04: `_BLOCK_RE` cannot parse a `DARK` object containing nested braces

**File:** `plugins/splunk-viz-packs/skills/vp-create/scripts/generate_previews.py:142`
**Issue:** `_BLOCK_RE = re.compile(r"var\s+DARK\s*=\s*\{([^}]*)\}", re.DOTALL)` uses
`[^}]*` which stops at the FIRST closing brace. If any pack ever introduces a nested
object inside `DARK` (e.g., `chrome: { glow: '#fff' }`, or the existing `series` array
becomes `series: { primary: [...] }`), the regex stops at the first `}` and parses only
the partial block. Current theme.js files are flat, but the parser is fragile to a
plausible refactor — the failure mode is silent (defaults are used).

**Fix:** Use a brace-counting parser, or at minimum match the outermost `}` via greedy
match anchored by something like `\n};?` if theme.js convention permits:
```python
_BLOCK_RE = re.compile(r"var\s+DARK\s*=\s*(\{.*?\n\})\s*;?", re.DOTALL)
```
Better: parse braces with a small counter loop after locating `var DARK = {`.

### WR-05: `--legacy-previews` fallback re-generates icons and gradient unnecessarily

**File:** `plugins/splunk-viz-packs/skills/vp-create/SKILL.md:80`
        `plugins/splunk-viz-packs/skills/vp-create/scripts/generate_assets.js:1486-1515`
**Issue:** When Pillow install fails (exit 2 from `generate_previews.py`), SKILL.md
instructs the user to re-run `node generate_assets.js /path/to/app --legacy-previews`.
Looking at `main()` in `generate_assets.js`, that command will ALSO regenerate `appIcon.png`,
`appIcon_2x.png`, AND `bg_gradient.png` / `bg_gradient_light.png` — overwriting the just-
written icons and gradient. This is wasted work (gradients can take 10+ seconds at
1920x1080) and means appIcon.png is regenerated, possibly with slightly different
non-determinism (LCG seed is constant so probably stable, but the user's expectation is
"just give me the legacy previews").

**Fix:** Add a `--previews-only` flag (or repurpose `--legacy-previews` to mean
"only generate previews"). Update SKILL.md to use it. Alternatively guard each
generator in `main()` so `--legacy-previews` skips appIcon and gradient.

### WR-06: Pillow auto-install can be silently slow with no user feedback

**File:** `plugins/splunk-viz-packs/skills/vp-create/scripts/generate_previews.py:24-29`
**Issue:** `print("Installing Pillow (one-time)...", file=sys.stderr)` is the only feedback
before `subprocess.check_call([..., '--quiet', 'pillow'])`. With `--quiet`, pip suppresses
all progress output. Pillow is ~3MB on macOS x86_64 (wheel) up to ~30+MB on systems
needing source build (no wheel match, e.g., older ARM platforms). On a slow network this
can take 30-120 seconds with zero output — users will believe the build hung. Also,
without `--user` flag, pip will attempt a system install which can fail on:
- system Python managed by Homebrew/Apt (PEP 668 externally-managed)
- read-only system Python (Linux distros, macOS system Python 3.9)
- environments without write access to site-packages

The fallback (exit 2 → legacy previews) handles failure correctly, but the user experience
during a slow install is poor.

**Fix:** Drop `--quiet` so pip progress is visible, and consider adding `--user` as a
hedge against externally-managed envs:
```python
_PIP_ARGS = [sys.executable, "-m", "pip", "install", "--user", "pillow"]
```
Or wrap install in a clearer message:
```python
print("Pillow not found. Installing via pip (this may take 30-60 seconds)...", file=sys.stderr)
```

## Info

### IN-01: Hardcoded `var DARK` assumption locks out future LIGHT-only theme files

**File:** `plugins/splunk-viz-packs/skills/vp-create/scripts/generate_previews.py:142`
**Issue:** `_BLOCK_RE` searches only for `var DARK`. Phase context (D-06) explicitly
says LIGHT theme preview is out of scope, which is fine — but the parser hard-codes
the assumption. A theme.js that ships only `LIGHT` (no `DARK`) would silently fall
to `DEFAULT_THEME`. Worth a one-line comment that this is intentional.

**Fix:** Add a comment:
```python
# DARK-only by D-06; LIGHT theme previews deferred to a future phase.
_BLOCK_RE = re.compile(r"var\s+DARK\s*=\s*\{([^}]*)\}", re.DOTALL)
```

### IN-02: `drawGauge` always renders "84" hero value regardless of viz

**File:** `plugins/splunk-viz-packs/skills/vp-create/scripts/generate_previews.py:308`
**Issue:** Every gauge preview will display the literal text "84" in the center. Since
the value is decorative (not data-bound) this is acceptable for a thumbnail, but it's
worth either varying the number (similar to `drawKpi`'s `candidates` list) or noting in
a comment that "84" was chosen as a visually-pleasing default for the 240° arc.

**Fix:** Either accept as documented design choice with a comment, or:
```python
candidates = ["84", "72", "91"]
hero_val = candidates[_seed_from_name(viz_name) % len(candidates)]
draw.text((cx, cy + 2), hero_val, ...)
```

### IN-03: `_HEX_IN_LIST_RE` pattern is broader than HEX_COLOR_RE

**File:** `plugins/splunk-viz-packs/skills/vp-create/scripts/generate_previews.py:145`
**Issue:** `_HEX_IN_LIST_RE = re.compile(r"['\"](#[0-9A-Fa-f]+)['\"]")` accepts hex
strings of any length ≥ 1 char after `#`. The subsequent `HEX_COLOR_RE.match(v)` filters
results, so functionally fine, but the wider regex is harder to reason about and the
two patterns should be aligned.

**Fix:** Align to the same alternation:
```python
_HEX_IN_LIST_RE = re.compile(r"['\"](#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8}))['\"]")
```

### IN-04: Two distinct dict entries for `"table"` in `VIZ_TYPE_KEYWORDS` silently merge

**File:** `plugins/splunk-viz-packs/skills/vp-create/scripts/generate_previews.py:76-85`
**Issue:** The keyword list has two entries with `type_name == "table"`:
- Line 76-78: heatmap/grid/cell keywords
- Line 82-85: timeline/feed/event/stream keywords

Both map to "table" because Phase 41 only ships 6 bespoke types (no `timeline` viz type
yet). Once a `timeline` viz lands (deferred per CONTEXT), these will need separating.
Acceptable for now, but worth a comment so the second block isn't mistaken for a typo.

**Fix:**
```python
# NOTE: timeline-class hints currently map to "table" because Phase 41 ships no
# bespoke timeline draw function. Future phase will add drawTimeline and split this.
("table", ["incident_feed", ...]),
```

### IN-05: SKILL.md checklist line is hard to read due to lack of line breaks

**File:** `plugins/splunk-viz-packs/skills/vp-create/SKILL.md:246`
**Issue:** The checklist row
> `Preview.png generated per viz (step 3b — run generate_previews.py; each viz dir has preview.png at 116x76 RGB, uses Pillow + Inter font, >100 bytes)`

is a single very long bullet that mixes "how to run", "what to verify", and "format
specifics". Readers scanning the checklist will likely skim past the specifics.

**Fix:** Split into two checklist rows: one for "run command" and one for
"verify size + format".

---

## Notes on areas that passed review

- **plugin.json version bump (5.8.0 → 5.9.0)** is a valid SemVer MINOR bump for a
  user-visible feature addition, matches the user memory `feedback_plugin_version_bump.md`,
  and matches the wave-2 chore commit (`9dd0a4fe`).
- **T-41-01 hex validation** — every hex value parsed from theme.js is run through
  `HEX_COLOR_RE.match()` before use; no dynamic eval (regex-only parsing).
- **T-41-02 pip subprocess** — argv list form, no `shell=True`, no user input in the
  argument list. Safe.
- **T-41-03 app_dir traversal** — `args.app_dir` is checked via `os.path.isdir` before
  any `os.listdir`/`os.path.join` usage. No `..`-resolution exploits possible because
  the app_dir is only used as a prefix for known-fixed paths (`appserver/static/visualizations`,
  `shared/theme.js`).
- **ES5 compliance in `generate_assets.js`** — the new `--legacy-previews` argv parsing
  block (lines 38-47) uses only `var`, traditional `function`, and `for` loops. No
  `const`/`let`/arrow functions/template literals introduced. The wiring guard around
  the legacy preview call (lines 1498-1508) is also ES5-clean.
- **`SKILL.md` Step 3b** correctly documents both commands, the fallback path, and the
  exit-code-2 contract from `generate_previews.py`.
- **OFL.txt** is bundled alongside Inter-Regular.ttf as required by SIL Open Font
  License v1.1 redistribution terms.
- **Bundled font path resolution** uses `os.path.dirname(__file__)` which is robust to
  any cwd.

---

_Reviewed: 2026-05-24_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
