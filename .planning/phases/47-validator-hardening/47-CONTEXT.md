# Phase 47: Validator Hardening — Context

**Gathered:** 2026-06-06
**Status:** Ready for planning
**Source:** Locked from v6.1 milestone setup + test51/test52 HANDOFFs (no discuss-phase needed — scope is concrete)

<domain>
## Phase Boundary

Harvest four validator gaps surfaced by two real-brand v6.0.8 builds (test51_cucm Cisco UC, test52_asus_rog Asus ROG) into `plugins/splunk-custom-viz/scripts/validate.sh`. The new checks must catch the same failure modes those builds hit — dead UI controls and silently-dropped brand fonts — before the next pack ships.

**In scope:**
- Adding new grep-based checks to `validate.sh` (extending the existing FAIL pattern)
- One new check per requirement (VAL-01..04)
- A no-regression sweep across every in-repo viz pack (VAL-05)

**Out of scope:**
- AST-based validation (validator stays grep-based — that's the v6.0.x discipline)
- Repair loops (no `--repair` flag work in this phase)
- Any change to formatter/source emission — that's Phase 48 (FONT) and Phase 49 (MERGE)
- Renaming or removing existing K1/K2/K3 checks

</domain>

<decisions>
## Implementation Decisions

### Check-Code Naming (LOCKED)

The existing `validate.sh` already uses `K1`, `K2`, `K3` for unrelated checks:

| Existing code | Enforces | Source |
|---|---|---|
| `K1` | Color picker consumed by source (`opt("<key>")` called) | KNOWN-CORRECTIONS.md #2 |
| `K2` | `invalidateUpdateView()` NOT inside `requestAnimationFrame` callback | KNOWN-CORRECTIONS.md #4 |
| `K3` | Dashboard XML / JSON CDATA NOT containing bare-string token defaults | KNOWN-CORRECTIONS.md #1 |

To avoid renaming working checks and regressing in-repo packs that already pass, the new checks **must** use the next free codes:

| Requirement | New code | Replaces draft code in REQUIREMENTS.md |
|---|---|---|
| VAL-01 | `K1b` | (unchanged — already `K1b`, extends K1) |
| VAL-02 | `K5` | (REQUIREMENTS draft said `K2` — collision) |
| VAL-03 | `K6` | (REQUIREMENTS draft said `K3` — collision) |
| VAL-04 | `K7` | (REQUIREMENTS draft said `K4` — free, but renumbered for sequential clarity) |

The planner MUST update REQUIREMENTS.md user-facing text to refer to the actual codes (`K1b/K5/K6/K7`), so the success-criteria FAIL output matches reality. This is a doc fix, not a scope change.

### Check Implementation Style (LOCKED)

All new checks follow the existing `validate.sh` pattern (lines 153+):
- Pure shell + grep / awk / find (no node, no python in `validate.sh` itself)
- Each check writes `FAIL $code: $message` via the existing `fail()` helper at line 24
- Each check is self-contained — no shared state across checks
- Order: new checks land BELOW the existing K1/K2/K3 block, BEFORE the design-fidelity check (line 225)
- One bash function per check (`check_k1b`, `check_k5`, `check_k6`, `check_k7`) so they can be unit-tested individually if needed later

### Grep Patterns (DRAFT — planner to confirm against actual files)

These are starting points for the planner. Each will need refinement during research.

**K1b (picker → Canvas reach)**
- Parse formatter.html for `<splunk-color-picker name="{{VIZ_NAMESPACE}}.<key>">` entries
- For each `<key>`: confirm `opt("<key>"` is called AND the variable assigned from that call appears within 30 lines of a `ctx.` reference in the same file
- Heuristic: if the only use site is a stub like `c._unused = hexFromSplunk(opt(...))`, FAIL — the underscore-prefix alias is bug bait

**K5 (text-input → Canvas reach)**
- Parse formatter.html for `<splunk-text-input name="{{VIZ_NAMESPACE}}.<key>">` entries (and `<splunk-number-input>` if present)
- Same 30-line ctx.* reach check as K1b
- Exemptions: text-inputs whose key starts with `field` (those are field-name overrides, not visual params)

**K6 (declared font has @font-face)**
- For each viz source: extract every `"<family>"` from `ctx.font = '... "<family>" ...'` lines via regex
- For each family: require a `@font-face { font-family: "<family>"` block in the same viz's `visualization.css`
- Exempt families: `sans-serif`, `monospace`, `serif`, `system-ui`, `Inter` (bundled), `Arial`, `Helvetica`

**K7 (cross-app type consistency in merged dashboards)**
- For each dashboard XML in `default/data/ui/views/*.xml`: extract every `"type": "<x>.<viz_name>"` value
- Compare `<x>` against the parent app's `[package] id` in `default/app.conf`
- FAIL if any `<x>` does not match — symptom of an incomplete viz-pack → parent-app merge (test52 Correction #24)
- Skip viz pack apps with no `views/` dir (validator no-ops, not fails)

### No-Regression Sweep (VAL-05)

After the new checks land, run `validate.sh` against every existing in-repo viz pack and confirm zero new FAILs. Expected packs to sweep:
- `tests/test*/` — local sandbox builds (gitignored but present)
- Any reference packs the planner finds during research

The sweep is a verification gate — its output is a one-line note in the SUMMARY.md ("zero new FAILs across N packs").

</decisions>

<canonical_refs>
## Canonical References

Downstream agents MUST read these before planning or implementing.

### Validator source (the file being modified)
- `plugins/splunk-custom-viz/scripts/validate.sh` (324 lines) — current state. New checks land between line 224 (end of existing K3) and line 225 (start of design-fidelity check).
- `plugins/splunk-custom-viz/KNOWN-CORRECTIONS.md` — existing corrections #1–#14 plus the in-repo correction numbering convention. New entries #15–#17 (test51) and #22–#26 (test52) reference the failure modes K5/K6/K7 catch.

### Source HANDOFFs (failure-mode evidence)
- `tests/test51_cucm/HANDOFF.md` — Cisco UC build, 21 items. Correction #15 (dead text-input controls) drives K5.
- `tests/test52_asus_rog/HANDOFF.md` — Asus ROG build, ~12 items. Correction #23 (picker K1 blind spot) drives K1b. Correction #24 (cross-app viz namespacing) drives K7. Correction #26 (fonts never embedded) drives K6.

### Boilerplate / template (what viz source looks like)
- `plugins/splunk-custom-viz/scripts/boilerplate_emit.js` — emits the viz source template that K1b/K5 grep over. The `_resolveTheme(t, opt)` line and `c._xxx = hexFromSplunk(opt("<key>", ...))` pattern come from here.

### Project rules
- `CLAUDE.md` — plugin language is English-only; zero user deps for end users; ES5-only viz JS (does not apply to validate.sh which is bash).

</canonical_refs>

<specifics>
## Specific Ideas

- The "30 lines of ctx.*" heuristic in K1b / K5 is a starting point. If real packs show that helpers commonly assign `opt(...)` results 100+ lines from any `ctx.` call (e.g., into a config object consumed by a `_render<X>` helper later in the file), widen the window or switch to "same-function scope" detection using brace-depth counting.
- K7 should distinguish "viz pack standalone" (no `views/` dir, no parent-app merge to check) from "merged parent app" (has `views/` dir AND `app.conf` with a `[package] id`). The viz-pack-standalone case is a no-op pass, not a fail.
- The K6 family exemption list (`Inter`, `Arial`, etc.) is the same list as the `theme.js.FONTS` allowlist. Phase 48 will produce real `@font-face` embeddings, but until then K6 must not regress packs that legitimately use bundled families.

</specifics>

<deferred>
## Deferred Ideas

- AST-based validation (cheerio HTML DOM parsing, acorn JS AST) — would catch K1b / K5 more reliably than grep but conflicts with the v6.0.x zero-user-deps rule. Defer to v6.x.
- A `validate.sh --repair` flag for the new checks (the way K1 has). Out of scope for v6.1; track separately.
- Validator unit tests (a `tests/validate/` harness with fixture vizs that intentionally trigger each FAIL code). Useful but out of scope; flag as a v6.2 follow-up.
- Splunk MCP tool to auto-run validate.sh during cv-build. Out of scope.

</deferred>

---

*Phase: 47-validator-hardening*
*Context gathered: 2026-06-06 via locked v6.1 milestone scope*
