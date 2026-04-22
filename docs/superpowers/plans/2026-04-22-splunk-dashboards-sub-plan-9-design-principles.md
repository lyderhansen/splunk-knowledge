# splunk-dashboards Sub-plan 9: Design principles skill

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new standalone reference skill `ds-design-principles` that distills Splunk dashboard design best practices — dashboard archetypes, layout principles, KPI sizing, chart-selection decision tables, color semantics, and common antipatterns — so Claude can choose *what* to build, not just *how*. Cross-reference it from the action skills (`ds-design`, `ds-create`, `ds-review`) so it surfaces at the right moments.

**Architecture:** Pure documentation — one new SKILL.md file plus small cross-reference edits in three existing SKILL.md files. No Python code, no tests. The source of truth is `/Users/joehanse/Library/CloudStorage/OneDrive-Cisco/Documents/03_Funny_Projects/splunk-forge/Splunk-Vista-main/methodology/skills/splunk-dashboard-design/SKILL.md` (598 lines) plus the Color Conventions and SOC Dashboard Pattern sections in `~/.claude/skills/splunk-dashboard-studio/SKILL.md` (§9.2, §9.3).

**Tech Stack:** Markdown only.

---

## File structure

```
plugins/splunk-dashboards/skills/
├── ds-design-principles/SKILL.md   # NEW
├── ds-design/SKILL.md              # MODIFIED — cross-ref added
├── ds-create/SKILL.md              # MODIFIED — cross-ref added
└── ds-review/SKILL.md              # MODIFIED — cross-ref added
```

Test count unchanged: 105 (this is documentation-only).

---

### Task T1: Write `ds-design-principles/SKILL.md`

**Files:**
- Create: `plugins/splunk-dashboards/skills/ds-design-principles/SKILL.md`

**Source references (READ-ONLY):**
- `/Users/joehanse/Library/CloudStorage/OneDrive-Cisco/Documents/03_Funny_Projects/splunk-forge/Splunk-Vista-main/methodology/skills/splunk-dashboard-design/SKILL.md`
- `~/.claude/skills/splunk-dashboard-studio/SKILL.md` (sections 9.2, 9.3, 10)

**Target sections (in this order):**

1. **YAML frontmatter** — `name: ds-design-principles`, description explaining: standalone reference for dashboard design decisions (archetypes, layout, chart selection, color, antipatterns), invoked by `ds-design` / `ds-create` / `ds-review` or directly when user asks "what should my dashboard look like?".

2. **`## When to use`** — three scenarios:
   - Before `ds-design` to decide the overall archetype and panel count.
   - During `ds-create` when the builder needs to pick a viz type that the layout didn't specify.
   - Standalone when the user asks open-ended design questions ("how should I structure this?", "what chart for X?").

3. **`## Dashboard archetypes`** — four canonical layouts, each with: audience / density / typical panels / example layout sketch as ASCII grid. Archetypes:
   - **Executive summary** — hero KPI row (3–5 big singlevalues), one trend line, one top-N bar/table. Audience: leadership. Glance-readable in 5 seconds.
   - **Operational monitoring** — status tiles on top, active incidents timeline, metric time-series, alert table. Audience: on-call / NOC.
   - **Analytical deep-dive** — prominent filters, detailed tables, drilldown paths, multi-series charts. Audience: analyst.
   - **SOC overview** — geo-map of attacks, alert severity breakdown, top attacker IPs, recent events timeline. Audience: SOC analyst.

4. **`## Layout principles`** — five short bullets: F-pattern reading (important → top-left), visual hierarchy (size = importance), grouping (related panels adjacent), whitespace (don't fill every cell), consistent column widths.

5. **`## KPI sizing rules`** — bullets: singlevalue minimum 3×3 grid cells to be readable; max 6 KPIs per row; group KPIs in semantic rows (not mixed metrics); prefer `splunk.singlevalueicon` for status (red/green with icon) over bare numbers; use `splunk.markergauge` when a threshold exists.

6. **`## Chart selection — decision table`** — 12–15 rows. Columns: "Question shape" / "Recommended viz" / "Why not". Examples:
   - "What is the current value?" → `splunk.singlevalue` + threshold coloring → (why not bar: values aren't comparable over time)
   - "How has X changed over time?" → `splunk.line` → (why not bar: bars suggest discrete categories, not continuous time)
   - "How does a metric break down?" → `splunk.bar` if > 6 cats, `splunk.pie` only if ≤ 6
   - "What are the top N?" → sorted `splunk.bar` (horizontal)
   - "Geographic distribution?" → `splunk.choropleth.map` or `splunk.map`
   - "Flow between sources and targets?" → `splunk.sankey`
   - "Correlation between two measures?" → `splunk.scatter`
   - "Event frequency by hour×weekday?" → `splunk.punchcard`
   - "Dense tabular detail?" → `splunk.table` with drilldowns
   - "Timeline of events?" → `splunk.timeline`
   - "Gauge against SLA?" → `splunk.markergauge`
   - "Text / instructions / context?" → `splunk.markdown`
   - "Multi-dimensional comparison across categories?" → `splunk.parallelcoordinates`

7. **`## Color principles`** — bullets + small table:
   - Maximum one or two accent colors per dashboard; everything else neutral.
   - Semantic colors: red = failure/critical, green = success/healthy, amber = warning, blue = info/neutral.
   - Avoid red/green only (colorblind — add shape/icon).
   - Ordered data uses sequential gradient, not rainbow.
   - Dark theme default palette (20 colors from SDS §9.3).

8. **`## Typography & text`** — bullets: panel titles ≤ 40 chars; descriptions only when non-obvious; `splunk.markdown` panels for section headers in long dashboards; consistent capitalization.

9. **`## Common antipatterns`** — 10 numbered bullets:
   1. **> 12 panels** — cognitive overload; split into multiple dashboards.
   2. **Pie chart with many slices** — unreadable above 6 categories.
   3. **Time series as stacked area** — hides individual series; use line instead.
   4. **Red/green only** — excludes colorblind users.
   5. **Rainbow palette on ordered data** — obscures ordering.
   6. **Tiny singlevalues** (< 3×3 cells) — unreadable from a distance.
   7. **Dropdowns without default values** — empty initial state.
   8. **Queries without earliest/latest** — unbounded full-index scan.
   9. **Panels without drilldowns on tables** — dead ends.
   10. **Raw timestamps in tables** — format with `strftime`.

10. **`## Working with the action skills`** — short pointers:
    - `ds-init` asks about audience → lets you pick the archetype.
    - `ds-design` wireframes — apply the layout principles here.
    - `ds-create` builds — apply the `--theme` flag for semantic colors.
    - `ds-review` audits — flags many of the antipatterns above.

Full file size target: 300–500 lines. Compact tables, short bullets, minimal prose.

- [ ] **Step 1: Draft the skill file**

Dispatch a subagent to read the two sources and write the new SKILL.md following the structure above. The subagent should:
- Keep the file compact (≤ 500 lines).
- Ensure every section has concrete examples or tables.
- Preserve standard triple-backtick fences (no nested or exotic fencing).
- Check `head -5` shows valid YAML frontmatter.

- [ ] **Step 2: Verify structure**

```bash
grep -c '^## ' plugins/splunk-dashboards/skills/ds-design-principles/SKILL.md
```
Expected: 9 or 10 top-level sections.

- [ ] **Step 3: Commit**

```bash
git add plugins/splunk-dashboards/skills/ds-design-principles/SKILL.md
git commit -m "feat(splunk-dashboards): add ds-design-principles reference skill"
```

---

### Task T2: Cross-references in action skills

**Files:**
- Modify: `plugins/splunk-dashboards/skills/ds-design/SKILL.md`
- Modify: `plugins/splunk-dashboards/skills/ds-create/SKILL.md`
- Modify: `plugins/splunk-dashboards/skills/ds-review/SKILL.md`

- [ ] **Step 1: Add cross-ref to `ds-design/SKILL.md`**

Append a short section at the end (before any existing "Next step" or final section):

```markdown
## See also

Before wireframing, invoke **`ds-design-principles`** for:
- The four dashboard archetypes (executive / operational / analytical / SOC) — pick one based on `requirements.md` audience.
- Layout principles (F-pattern, visual hierarchy, grouping).
- KPI sizing rules and chart-selection decision table.
```

- [ ] **Step 2: Add cross-ref to `ds-create/SKILL.md`**

Append (or insert before "After building"):

```markdown
## Design considerations

If the layout from `ds-design` picked viz types that don't fit the data shape, consult **`ds-design-principles`** — specifically the "Chart selection" decision table. Then invoke `ds-update` to swap the viz types before building the final JSON.

The `--theme {soc|ops|exec}` flags apply the color semantics described in the design-principles skill automatically.
```

- [ ] **Step 3: Add cross-ref to `ds-review/SKILL.md`**

Append to the existing "Review dimensions" intro:

```markdown
**See `ds-design-principles`** for the canonical dashboard archetypes and the "Common antipatterns" list — many of the checks below are direct applications of those principles.
```

- [ ] **Step 4: Commit**

```bash
git add plugins/splunk-dashboards/skills/ds-design/SKILL.md plugins/splunk-dashboards/skills/ds-create/SKILL.md plugins/splunk-dashboards/skills/ds-review/SKILL.md
git commit -m "docs(splunk-dashboards): cross-reference ds-design-principles from action skills"
```

---

### Task Z: Version bump + push

- [ ] **Step 1: Bump version to 0.9.0**

Update `plugins/splunk-dashboards/.claude-plugin/plugin.json`:

```json
  "version": "0.9.0",
```

- [ ] **Step 2: Commit version bump**

```bash
git add plugins/splunk-dashboards/.claude-plugin/plugin.json
git commit -m "chore(splunk-dashboards): bump version to 0.9.0 (design principles)"
```

- [ ] **Step 3: Run full test suite (sanity)**

```bash
cd plugins/splunk-dashboards
python3 -m pytest -q
```

Expected: 105 passed (unchanged — this sub-plan is docs-only).

- [ ] **Step 4: Push + fast-forward main**

```bash
git push
git checkout main
git merge --ff-only splunk-dashboards-foundation
git push origin main
git checkout splunk-dashboards-foundation
```

---

## What this sub-plan delivers

- A new standalone reference skill `ds-design-principles` covering four dashboard archetypes, layout principles, KPI sizing, a chart-selection decision table, color semantics, typography, and 10 common antipatterns.
- Cross-references from `ds-design`, `ds-create`, and `ds-review` to surface the new skill at the right moments in the pipeline.
- Plugin version bumped to 0.9.0.
- No code changes; 105 tests remain passing.
