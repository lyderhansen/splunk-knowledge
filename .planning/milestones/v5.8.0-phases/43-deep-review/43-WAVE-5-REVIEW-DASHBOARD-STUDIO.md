# Wave 5 Review — splunk-dashboard-studio Plugin (Bounded Set)

**Reviewed:** 2026-05-24
**Reviewer:** gsd-code-reviewer (executor agent)
**Scope:** 8 skills bounded by RESEARCH §Wave 5 — 5 cross-referenced from vp-* skills + 3 touched by Phase 38 JSONata work
**Out of scope:** Remaining 56+ ds-* skills (not touched by v5.5-5.8, not referenced from vp-* skills)

---

## Cross-referenced Skills

These 5 skills are cited from `splunk-viz-packs` SKILL.md files. The review verifies each skill exists, its content matches cross-referencing assumptions, and the cited line numbers resolve.

### ds-create

**Path:** `plugins/splunk-dashboard-studio/skills/ds-create/SKILL.md`
**Cross-referenced from:** vp-init/SKILL.md:120, vp-design/SKILL.md:84

**vp-* citation verification:**

- `vp-init/SKILL.md:120`: "Dashboard JSON | splunk-dashboard-studio | ds-create" — RESOLVES. ds-create exists and owns dashboard JSON authoring as expected.
- `vp-design/SKILL.md:84`: "Load ds-create from splunk-dashboard-studio — dashboard JSON has strict rules..." — RESOLVES. ds-create documents the exact rules cited (fontFamily enum, fontSize enum, canvas min 1920px).

**Content review:**

ds-create is substantive and comprehensive. It owns dashboard JSON authoring (step 3 of vp-create pipeline), handles dataSources, visualizations, and layout generation. The MUST LOAD section references ds-int-tabs and ds-int-drilldowns by name before interactivity, matching vp-design lines 86-87. Phase 23 accent architecture handoff: ds-create's "Visual finishing" checklist cites `ds-ref-color` for semantic palette — indirect reference matches expected Phase 23 cross-plugin handoff. Phase 26 multi-channel archetype: not directly cited but `ds-ref-archetypes` and `ds-ref-design-principles` are in the MUST LOAD chain.

**BLOCKER:**

**1. [BLOCKER — schema/deprecated] ds-create generates deprecated drilldown format**

- File: `plugins/splunk-dashboard-studio/skills/ds-create/SKILL.md:87`
- Issue: "ds-create translates this into `options.drilldown = "all"` and `options.drilldownAction = <drilldown value>`". However, `ds-ref-syntax:349` explicitly says "Use `eventHandlers` array (legacy `options.drilldown` / `options.drilldownAction` deprecated)". ds-create is instructing generation of deprecated format.
- Recommendation: Update the "Panel drilldowns" section in ds-create to use `eventHandlers` array format (as documented in ds-int-drilldowns), not `options.drilldown + options.drilldownAction`.

**WARNING:**

None.

**NIT:**

**1. [NIT — clarity] MUST LOAD table "ds-create reads" — reads its own name**

- File: `plugins/splunk-dashboard-studio/skills/ds-create/SKILL.md:309`
- Issue: `ds-ref-pitfalls` and `ds-couture` are listed in "After writing JSON" self-check but their `ds-` prefix is used inconsistently (some citations omit the full path).
- Recommendation: No action needed — minor style inconsistency, not misleading.

---

### ds-int-tabs

**Path:** `plugins/splunk-dashboard-studio/skills/ds-int-tabs/SKILL.md`
**Cross-referenced from:** vp-create/SKILL.md:98, vp-create/SKILL.md:260, vp-design/SKILL.md:86

**vp-* citation verification:**

- `vp-create/SKILL.md:98`: "ds-int-tabs (`plugins/splunk-dashboard-studio/skills/ds-int-tabs/SKILL.md`)" — full path cited. RESOLVES. File exists at exact cited path.
- `vp-create/SKILL.md:260`: "ds-int-tabs loaded before dashboard JSON if pack has 7+ vizs or tabs requested" — RESOLVES. ds-int-tabs is the correct skill for this.
- `vp-design/SKILL.md:86`: "If dashboard uses tabs: load ds-int-tabs from splunk-dashboard-studio" — RESOLVES.

**Content review:**

Tab schema documentation is current and complete. The "Required shape" section documents both single-page and multi-page formats with the correct `tabs` + `layoutDefinitions` wrapper. The memory note "tab layout schema is unintuitive" is validated — the skill dedicates its opening section to "CRITICAL: This `tabs` + `layoutDefinitions` wrapper is mandatory for ALL Dashboard Studio dashboards" which addresses the confusion. No stale references to deprecated tab patterns found.

**BLOCKER:**

None.

**WARNING:**

**1. [WARNING — schema inconsistency] CRITICAL tabs+layoutDefinitions shape in ds-int-tabs is correct but contradicts ds-ref-layout-grid**

This is documented separately under `### ds-ref-layout-grid` since the BLOCKER is in that file, not here.

**NIT:**

**1. [NIT — missing cross-reference] No explicit link to ds-ref-jsonata for token-driven tab switching**

- File: `plugins/splunk-dashboard-studio/skills/ds-int-tabs/SKILL.md:168`
- Issue: "Token-driven tab selection is documented but beyond verified scope" — no pointer to where it IS documented.
- Recommendation: Add a "See also" entry pointing to `ds-ref-jsonata` for token expression syntax, and to `ds-int-tokens` for token binding patterns. Minor gap.

---

### ds-int-drilldowns

**Path:** `plugins/splunk-dashboard-studio/skills/ds-int-drilldowns/SKILL.md`
**Cross-referenced from:** vp-design/SKILL.md:87, vp-create/references/dashboard-interactivity.md:41

**vp-* citation verification:**

- `vp-design/SKILL.md:87`: "If dashboard uses drilldowns: load ds-int-drilldowns from splunk-dashboard-studio" — RESOLVES. Correct skill for drilldowns.
- `vp-create/references/dashboard-interactivity.md:41`: "Key rules (verified against ds-int-drilldowns SKILL.md)" — RESOLVES. File exists.

**SU-01 lock verification (linkToDashboard.tokens is array+value not object map):**

VERIFIED. ds-int-drilldowns:55-57 in the Do/Don't table:
- "linkToDashboard.tokens: array of {token, value} objects ONLY — value sets the URL parameter." DO
- "Use key in linkToDashboard — values arrive as undefined on target dashboard (live-tested)." DON'T
- "Object map { 'name': 'row.field.value' } — e.map is not a function (live-tested)." DON'T

The three states are explicitly documented with live test results. SU-01 lock is correctly implemented.

**SU-03 three-handler chain verification:**

VERIFIED. The skill has a full "Cross-dashboard ±N minute time range recipe (three-handler chain)" section (lines 205-278) explaining the exact three-handler chain pattern, why it's needed (eval doesn't recompute before navigation), and a complete JSON example.

**AC-01 drilldown payload shape verification ({data:{field:val}}):**

The skill uses `row.<field>.value` token syntax throughout, NOT `{data:{field:val}}`. For custom viz drilldowns specifically, the skill explains click context tokens (`$click.value$`, `$click.name$`) for charts and `$row.<field>.value$` for tables. The AC-01 pattern `{data:{field:val}}` is NOT documented as a drilldown payload shape here — this is the shape coming FROM the viz JS to the handler (via the viz's click dispatch), not the eventHandler shape. The eventHandler shape is correctly documented as `drilldown.setToken` with `key`/`value`.

**BLOCKER:**

None.

**WARNING:**

**1. [WARNING — cross-reference gap] No explicit back-reference from ds-create to ds-int-drilldowns for the deprecated format issue**

- File: `plugins/splunk-dashboard-studio/skills/ds-create/SKILL.md:87` (see BLOCKER in ds-create section above)
- ds-int-drilldowns itself is correct. The problem is upstream in ds-create's pipeline translation.

**NIT:**

None.

---

### ds-ref-archetypes

**Path:** `plugins/splunk-dashboard-studio/skills/ds-ref-archetypes/SKILL.md`
**Cross-referenced from:** vp-design/references/dashboard-composition.md:4, :17, :197

**vp-* citation verification:**

- `dashboard-composition.md:4`: "sits ON TOP of ds-ref-archetypes and ds-ref-layout-grid" — RESOLVES. ds-ref-archetypes exists.
- `dashboard-composition.md:17`: "viz-pack-specific adaptations of the ds-ref-layout-grid / ds-ref-archetypes foundation" — RESOLVES.
- `dashboard-composition.md:197`: "4 canonical archetypes from ds-ref-archetypes (executive, operational, analytical, SOC/wall)" — RESOLVES. All 4 archetypes are documented.

**Content review:**

ds-ref-archetypes has substantive content for all 4 archetypes — Executive Summary, Operational Monitoring, Analytical Deep-dive, and SOC Overview — with panel mix fingerprints, ASCII layout sketches, canvas dimensions, audience profiles, viewing context table, and hybrid blend guidance. The SOC wall sub-archetype includes the dual-context default rule (wall + analyst console share same dashboard) with drilldown mandatory language.

**BLOCKER:**

None.

**WARNING:**

**1. [WARNING — stale status marker] "Status: skeleton only" comment is stale**

- File: `plugins/splunk-dashboard-studio/skills/ds-ref-archetypes/SKILL.md:8`
- Issue: The file opens with `> **Status:** skeleton only. Body extracted from \`ds-ref-design-principles\` in a follow-up task.` — the body HAS been filled in. All 4 archetypes are fully documented (320 lines of content). The status marker is a misleading artifact from the skill's creation scaffold.
- Recommendation: Remove the `> **Status:** skeleton only.` line and the "Source / migration" + "Estimated size" scaffolding sections (lines 34-42) which are no longer meaningful now that the content exists.

**NIT:**

**1. [NIT — incomplete scope declaration] "Scope (what's IN)" references canvas-dimensions-per-archetype but they appear only implicitly**

- File: `plugins/splunk-dashboard-studio/skills/ds-ref-archetypes/SKILL.md:14`
- Issue: "Canvas dimensions per archetype (1440×960 exec, 1920×1080 SOC wall, etc.)" is in the Scope section, and the content IS there (executive says "Canvas: 1440×960"), but the exec canvas dimension conflicts with ds-ref-layout-grid (which says exec uses 1920px minimum). Potential silent inconsistency.
- Recommendation: Audit whether 1440×960 for exec is intentional or predates the "1920px minimum, no exceptions" rule. If 1920 is the rule, update ds-ref-archetypes exec section.

---

### ds-ref-layout-grid

**Path:** `plugins/splunk-dashboard-studio/skills/ds-ref-layout-grid/SKILL.md`
**Cross-referenced from:** vp-design/references/dashboard-composition.md:4, :17

**vp-* citation verification:**

- `dashboard-composition.md:4`: "sits ON TOP of ds-ref-archetypes and ds-ref-layout-grid" — RESOLVES.
- `dashboard-composition.md:17`: "viz-pack-specific adaptations of the ds-ref-layout-grid / ds-ref-archetypes foundation" — RESOLVES.

**Content review:**

ds-ref-layout-grid has substantive content: F-pattern reading, shadow rectangle recipe, faux glow pattern, gradient background, canvas sizes, spacing scale, KPI sizing rules, golden-ratio hero zones, gutter presets per archetype, viz rhythm zones, and scale contrast patterns. The "Mandatory: Absolute layout" section is comprehensive and explains when/why not to use grid layout.

**BLOCKER:**

**1. [BLOCKER — wrong schema] "Required wrapper structure" example uses wrong tabs format**

- File: `plugins/splunk-dashboard-studio/skills/ds-ref-layout-grid/SKILL.md:83-104`
- Issue: The "Required wrapper structure" JSON shows:
  ```json
  "tabs": [
    { "id": "tab_main", "label": "Main", "layoutDefinitionId": "layoutDef_main" }
  ],
  "showTabBar": false,
  "layoutDefinitions": [
    { "id": "layoutDef_main", "type": "absolute", ... }
  ]
  ```
  This is the WRONG format. The correct format (from ds-int-tabs and ds-ref-syntax) is:
  ```json
  "tabs": {
    "items": [{ "layoutId": "layout_main", "label": "Main" }],
    "options": { "barPosition": "top", "showTabBar": false }
  },
  "layoutDefinitions": {
    "layout_main": { "type": "absolute", ... }
  }
  ```
  Key differences: (1) `tabs` should be an object with `items` array, not a bare array; (2) `showTabBar` should be inside `tabs.options`, not at layout-root; (3) `layoutDefinitions` should be an object keyed by layoutId, not an array; (4) the linkage key is `layoutId` (not `layoutDefinitionId`); (5) `id` on the tab entry should be `layoutId`.
  
  An agent reading ds-ref-layout-grid and following the "Required wrapper structure" example will generate schema-invalid JSON that the Dashboard Studio validator rejects.
- Recommendation: Replace the "Required wrapper structure" code block with the correct format from ds-int-tabs/ds-ref-syntax. This is a cross-file format disagreement — ds-int-tabs and ds-ref-syntax are the verified authoritative sources.

**WARNING:**

**1. [WARNING — stale status marker] Same stale "skeleton only" marker as ds-ref-archetypes**

- File: `plugins/splunk-dashboard-studio/skills/ds-ref-layout-grid/SKILL.md:8`
- Issue: `> **Status:** skeleton only.` — body is fully populated (560+ lines).
- Recommendation: Remove the stale marker and "Source / migration" / "Estimated size" scaffold sections.

**2. [WARNING — archetype canvas size conflict] Exec canvas is 1440×960 in ds-ref-archetypes but all canvases must be 1920px minimum per ds-ref-layout-grid**

- File: `plugins/splunk-dashboard-studio/skills/ds-ref-layout-grid/SKILL.md:229` (canvas table row "Exec summary: 1920, 1080–1280") vs `ds-ref-archetypes:66` ("Canvas: 1440×960 (laptop, occasional projector)")
- Issue: ds-ref-layout-grid's own canvas table correctly says exec = 1920px minimum. But ds-ref-archetypes says "1440×960 (laptop)". This is an inconsistency between the two skills. ds-ref-layout-grid is the definitive source on canvas sizing per its own MANDATORY section ("1920px minimum, no exceptions").
- Recommendation: Update ds-ref-archetypes executive summary section to change "Canvas: 1440×960" to "Canvas: 1920×1080 minimum". The 1440 value predates the "1920 minimum, no exceptions" rule.

**NIT:**

None.

---

## Phase 38 Skills

These 3 skills were touched by Phase 38 (JSONata reference work). The review verifies JR-01/JR-02 deliverables landed correctly.

### ds-ref-jsonata

**Path:** `plugins/splunk-dashboard-studio/skills/ds-ref-jsonata/SKILL.md`
**Phase 38 commit:** 3f432dca (feat 38-01)

**JR-01 deliverable inventory:**

- Operators (arithmetic, comparison, boolean, ternary, string concat &, range, wildcard, descendent, parent, function chain, variable bind): PRESENT — "Operators" section with full table, [Confirmed] vs [Standard JSONata] confidence tiers.
- String functions ($substring, $uppercase, $trim, $replace, $split, $join, plus 9 others): PRESENT — complete table with signatures, descriptions, tiers.
- Numeric functions ($round, $floor, $ceil, $abs, $formatNumber): PRESENT — complete table.
- Date/time functions ($now, $millis, $toMillis, $fromMillis): PRESENT — confirmed `$now()` with XPath picture format tokens; $toMillis/$fromMillis marked [Standard JSONata].
- Array operations ($map, $filter, $reduce — plus $count, $sort, $append, etc.): PRESENT — both Array functions table and Higher-order functions table with $map/$filter/$reduce and lambda syntax.
- Path expressions: PRESENT — implied via Wildcard (`*`) and Descendent (`**`) operators; also referenced in description frontmatter ("path expressions").
- Lambdas: PRESENT — "Lambda syntax" sub-section with example and "Lambdas are JSONata expressions, not JavaScript" note.
- Common recipes (RAG thresholds, dynamic labels, toggles, time arithmetic): PRESENT — 6 recipes (Recipe 1: RAG threshold, Recipe 2: Dynamic label/title, Recipe 3: Toggle visibility, Recipe 4: Time arithmetic, Recipe 5: Conditional formatting, Recipe 6: Multi-token aggregation).

**JR-01 verdict: COMPLETE — all deliverables present.**

**SU-02 lock verification (JSONata vs SPL eval):**

VERIFIED. "Trap 1: JSONata is NOT SPL eval — HIGHEST FREQUENCY ERROR" is the first and most prominent gotcha section, with a comparison table showing correct JSONata vs wrong SPL syntax for string concat, conditional, current date, equality, substring, round, and sum. The SU-02 lock is implemented with appropriate prominence.

**BLOCKER:**

None.

**WARNING:**

None.

**NIT:**

**1. [NIT — confidence tier gap] Path expressions and lambdas not given explicit confidence tiers**

- File: `plugins/splunk-dashboard-studio/skills/ds-ref-jsonata/SKILL.md` — Higher-order functions section
- Issue: The `$map`/`$filter`/`$reduce` functions are all marked [Standard JSONata] — not confirmed in DS. The frontmatter description says "path expressions, lambdas" are covered, but the Operators table only implicitly covers path expressions via `*` / `**` / `%` wildcards.
- Recommendation: Add a brief note under the Higher-order functions table explicitly flagging that `$map`/`$filter`/`$reduce` are [Standard JSONata] and that lambda syntax for DS has not been individually confirmed — reduces risk of an agent generating complex higher-order expressions expecting them to work.

---

### ds-int-tokens

**Path:** `plugins/splunk-dashboard-studio/skills/ds-int-tokens/SKILL.md`
**Phase 38 commit:** b94da960 (docs 38-02)

**JR-02 verification — MUST LOAD cross-link to ds-ref-jsonata:**

VERIFIED. Lines 181-191 contain:

> **MUST LOAD `ds-ref-jsonata`** before writing `eval` or `conditions` expressions. JSONata is a different language from SPL eval — using SPL syntax (`.` for concat, `if()`, `strftime()`) will silently produce wrong results.

The MUST LOAD directive is present, prominently marked with bold + code formatting, and explains the reason (JSONata != SPL eval).

**Condensed JSONata section (per Phase 38 D-07):**

VERIFIED. The inline JSONata section in ds-int-tokens is now a 20-line condensed summary (lines 181-202) covering: what eval/conditions are, the MUST LOAD directive, $eval:name$ quick reference, key gotcha (JSONata not SPL eval), and the key limitation ($eval:name$ not in input.timerange defaultValue). Full syntax, operators, function tables, and recipes are delegated to ds-ref-jsonata. Phase 38 D-07 intent is implemented correctly.

**BLOCKER:**

None.

**WARNING:**

**1. [WARNING — stale entry in "5 places tokens come from"] URL params entry uses wrong token format**

- File: `plugins/splunk-dashboard-studio/skills/ds-int-tokens/SKILL.md:36`
- Issue: "URL parameters — `drilldown.linkToDashboard` passes `form.<name>` URL params that populate matching input tokens on load." However, ds-int-drilldowns explicitly says "token is the destination name on the receiving dashboard. No `form.` prefix." The description says `form.<name>` which is Classic/Simple XML format, not Dashboard Studio format.
- Recommendation: Update the "URL parameters" entry to drop the `form.` prefix mention, or clarify that this is the URL query parameter key (not the DS token name), to avoid confusion with the `form.` prefix deprecation documented in ds-int-drilldowns.

**NIT:**

None.

---

### ds-ref-syntax

**Path:** `plugins/splunk-dashboard-studio/skills/ds-ref-syntax/SKILL.md`
**Phase 38 commit:** 8562fbac (docs 38-02)

**Phase 38 cross-reference verification:**

VERIFIED. Two confirmed wiring points:

1. Under the `expressions` section "Eval" sub-heading: "JSONata expressions. Reference result as `$eval:<name>$`. See `ds-ref-jsonata` for full syntax." — direct pointer.
2. In "See also" section (last entry): "`ds-ref-jsonata` — JSONata expression language reference (eval + conditions)." — cross-reference present.

**Content review:**

ds-ref-syntax is comprehensive — covers all top-level keys, all dataSource types (ds.search, ds.savedSearch, ds.chain, ds.test), visualizations, inputs, defaults, expressions, layout (absolute + grid + tabbed), drilldowns, XML envelope, default colour palette, and token filters. The critical layout schema note is present: "CRITICAL: The `tabs` + `layoutDefinitions` wrapper is mandatory for ALL dashboards — even single-page layouts with no visible tabs."

The layout/absolute example in ds-ref-syntax uses the CORRECT schema (tabs as object, layoutId key, layoutDefinitions as object) — confirming ds-ref-layout-grid's "Required wrapper structure" is the lone outlier with wrong format.

**BLOCKER:**

None.

**WARNING:**

None.

**NIT:**

**1. [NIT — grid layout example is flat format] Grid layout example in ds-ref-syntax omits the tabs wrapper**

- File: `plugins/splunk-dashboard-studio/skills/ds-ref-syntax/SKILL.md:307-320`
- Issue: The "Grid (row-oriented)" example shows `"layout": { "type": "grid", "structure": [...] }` — the flat format without tabs wrapper. The very next sentence in ds-int-tabs says "The flat format is rejected by the current schema validator." The grid example here may mislead agents into using the flat format.
- Recommendation: Either (a) remove the flat grid example and note that grid layout also requires the tabs wrapper, or (b) add a wrapper around the grid example showing it inside `layoutDefinitions`. Low priority as grid is rarely used.

---

## Defensive grep sweep

Running `grep -rE "ds-[a-z-]+" plugins/splunk-viz-packs/skills/ --include="*.md"` against all files in the vp-* skills directories.

### All ds-* references found

| Reference | Source file:line | Target exists? | In bounded list? |
|-----------|-----------------|----------------|-----------------|
| `ds-int-drilldowns` | `vp-create/references/dashboard-interactivity.md:41` | YES | YES (Task 1) |
| `ds-int-tabs` | `vp-create/SKILL.md:98` | YES | YES (Task 1) |
| `ds-int-tabs` | `vp-create/SKILL.md:260` | YES | YES (Task 1) |
| `ds-create` | `vp-init/SKILL.md:120` | YES | YES (Task 1) |
| `ds-create` | `vp-design/SKILL.md:84` | YES | YES (Task 1) |
| `ds-int-tabs` | `vp-design/SKILL.md:86` | YES | YES (Task 1) |
| `ds-int-drilldowns` | `vp-design/SKILL.md:87` | YES | YES (Task 1) |
| `ds-ref-archetypes` | `vp-design/references/dashboard-composition.md:4` | YES | YES (Task 1) |
| `ds-ref-archetypes` | `vp-design/references/dashboard-composition.md:17` | YES | YES (Task 1) |
| `ds-ref-layout-grid` | `vp-design/references/dashboard-composition.md:4` | YES | YES (Task 1) |
| `ds-ref-layout-grid` | `vp-design/references/dashboard-composition.md:17` | YES | YES (Task 1) |
| `ds-ref-archetypes` | `vp-design/references/dashboard-composition.md:197` | YES | YES (Task 1) |

**Total unique ds-* references found:** 5 (ds-create, ds-int-tabs, ds-int-drilldowns, ds-ref-archetypes, ds-ref-layout-grid)

### Assumption A2 validation

RESEARCH Assumption A2: "The 5 cross-plugin ds-* skills listed are the complete set."

**Result: CONFIRMED.** The defensive grep found exactly 5 distinct ds-* references, all already in the bounded list. No additional ds-* skills referenced from vp-* skills were discovered.

**Note:** The grep also returned `ds-int-drilldowns` from `vp-create/references/dashboard-interactivity.md:41` (which RESEARCH noted as `:41` in their table) — this confirms the reference resolves correctly. The 3 Phase 38 skills (ds-ref-jsonata, ds-int-tokens, ds-ref-syntax) are NOT referenced from vp-* SKILL.md files, consistent with RESEARCH's finding that they are "dashboard-studio-internal" cross-references.

---

## Coverage Summary

| Skill | Cross-ref source | Phase 38 touched? | Reviewed | Findings |
|-------|-----------------|-------------------|----------|---------|
| ds-create | vp-init:120, vp-design:84 | No | Task 1 | 1 BLOCKER (deprecated drilldown generation), 1 NIT |
| ds-int-tabs | vp-create:98, vp-create:260, vp-design:86 | No | Task 1 | 1 WARNING (see ds-ref-layout-grid), 1 NIT |
| ds-int-drilldowns | vp-design:87, dashboard-interactivity.md:41 | Partially (8562fbac added cross-ref) | Task 1 | 1 WARNING (upstream in ds-create), 0 NIT |
| ds-ref-archetypes | dashboard-composition.md:4,17,197 | No | Task 1 | 1 WARNING (stale status marker), 1 NIT (canvas size conflict) |
| ds-ref-layout-grid | dashboard-composition.md:4,17 | No | Task 1 | 1 BLOCKER (wrong tabs schema), 1 WARNING (stale marker), 1 WARNING (canvas conflict) |
| ds-ref-jsonata | — | YES (3f432dca added skill) | Task 2 | 0 BLOCKER, 0 WARNING, 1 NIT |
| ds-int-tokens | — | YES (b94da960 condensed + MUST LOAD) | Task 2 | 0 BLOCKER, 1 WARNING, 0 NIT |
| ds-ref-syntax | — | YES (8562fbac wired cross-ref) | Task 2 | 0 BLOCKER, 0 WARNING, 1 NIT |

### Findings by severity

| Severity | Count | Skills affected |
|----------|-------|----------------|
| BLOCKER | 2 | ds-create (deprecated drilldown format), ds-ref-layout-grid (wrong tabs schema) |
| WARNING | 5 | ds-int-tabs (via ds-ref-layout-grid conflict), ds-ref-archetypes (stale marker + canvas), ds-ref-layout-grid (stale marker), ds-int-tokens (form. prefix) |
| NIT | 4 | ds-create, ds-int-tabs, ds-ref-jsonata, ds-ref-syntax |

### Phase 38 JR-01/JR-02 compliance

| Deliverable | Status |
|-------------|--------|
| JR-01: ds-ref-jsonata exists with all required function families | PASS |
| JR-01: Operators (arithmetic, comparison, ternary, string &) | PASS |
| JR-01: String functions ($substring, $uppercase, $trim, $replace, $split, $join) | PASS |
| JR-01: Numeric functions ($round, $floor, $ceil, $abs, $formatNumber) | PASS |
| JR-01: Date/time functions ($toMillis, $fromMillis, $now) | PASS |
| JR-01: Array operations ($map, $filter, $reduce) | PASS |
| JR-01: Path expressions | PASS (via Wildcard/Descendent operators) |
| JR-01: Lambdas | PASS |
| JR-01: Common recipes (RAG, dynamic labels, toggles, time arithmetic) | PASS (6 recipes) |
| JR-02: ds-int-tokens MUST LOAD directive for ds-ref-jsonata | PASS |
| JR-02: Inline JSONata section condensed to summary | PASS |
| SU-02: JSONata vs SPL eval distinction documented | PASS ("HIGHEST FREQUENCY ERROR" — most prominent gotcha) |
| Phase 38 cross-reference in ds-ref-syntax | PASS (two wiring points) |

### Cross-plugin reference resolution

All 5 vp-* → ds-* citations verified:

| Citation | Source | Target | Status |
|----------|--------|--------|--------|
| ds-create | vp-init:120 | plugins/splunk-dashboard-studio/skills/ds-create/SKILL.md | RESOLVES |
| ds-create | vp-design:84 | same | RESOLVES |
| ds-int-tabs | vp-create:98 (full path) | plugins/splunk-dashboard-studio/skills/ds-int-tabs/SKILL.md | RESOLVES |
| ds-int-tabs | vp-create:260 | same | RESOLVES |
| ds-int-tabs | vp-design:86 | same | RESOLVES |
| ds-int-drilldowns | vp-design:87 | plugins/splunk-dashboard-studio/skills/ds-int-drilldowns/SKILL.md | RESOLVES |
| ds-int-drilldowns | dashboard-interactivity.md:41 | same | RESOLVES |
| ds-ref-archetypes | dashboard-composition.md:4,17,197 | plugins/splunk-dashboard-studio/skills/ds-ref-archetypes/SKILL.md | RESOLVES |
| ds-ref-layout-grid | dashboard-composition.md:4,17 | plugins/splunk-dashboard-studio/skills/ds-ref-layout-grid/SKILL.md | RESOLVES |

No broken cross-plugin links found. RESEARCH Assumption (pre-flight: "all 5 distinct ds-* refs resolve to existing files") confirmed.
