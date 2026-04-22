# splunk-dashboards Sub-plan 6: Reference enrichment (ds-syntax + ds-viz depth)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the gap between our `ds-syntax` / `ds-viz` reference skills and the two source references (`~/.claude/skills/splunk-dashboard-studio/SKILL.md` + `/Users/joehanse/Library/CloudStorage/OneDrive-Cisco/Documents/03_Funny_Projects/splunk-forge/Splunk-Vista-main/methodology/skills/splunk-dashboard-viz/SKILL.md`). Expand `ds-viz` from 10 to 26 visualization types with per-viz options. Add missing syntax sections to `ds-syntax`: `ds.test`, base-search pattern, multi-input types, 5 drilldown patterns, tabbed layout, Dynamic Options Syntax (DOS), token filters, conditional visibility, default color palette, and a common-mistakes section.

**Architecture:** Documentation-only expansion. No Python changes. Both files are rewritten in place. Subagents read the two source files directly and produce compact, accurate merged references — not verbatim copies.

**Tech Stack:** Markdown only. Two SKILL.md files.

---

## Source references (READ-ONLY)

- **SDS:** `~/.claude/skills/splunk-dashboard-studio/SKILL.md` (1196 lines)
- **Vista:** `/Users/joehanse/Library/CloudStorage/OneDrive-Cisco/Documents/03_Funny_Projects/splunk-forge/Splunk-Vista-main/methodology/skills/splunk-dashboard-viz/SKILL.md` (681 lines)

## File structure

```
plugins/splunk-dashboards/skills/
├── ds-syntax/SKILL.md          # EXPANDED
└── ds-viz/SKILL.md             # EXPANDED
```

---

### Task 1: Expand `ds-viz` to 26 visualization types

**Files:**
- Modify: `plugins/splunk-dashboards/skills/ds-viz/SKILL.md`

The current file covers 10 types. Keep everything we already have. Add:

**Shared-options library section** (before the per-type sections), pulled from Vista's "SHARED OPTIONS LIBRARY" with groups:
- `[AXES]` (used by line/area/bar/column/scatter)
- `[TICKS]`, `[GRIDLINES]`, `[LEGEND]`, `[SERIES]`
- `[DATASOURCE]`, `[OVERLAY]`, `[ANNOTATIONS]`, `[SPLIT]`

Each tagged with which viz types use it. Keep the tables compact — just property name, type, default, one-line description.

**Per-type sections** — keep the existing 10, add these 16 new ones with tags indicating which shared groups they consume:
- `splunk.bubble` — [LEGEND] [SERIES] [SPLIT] + specific options (`xField`, `yField`, `radiusField`, `radiusRange`)
- `splunk.scatter` — [AXES] [LEGEND] [SERIES] + `xField`, `yField`
- `splunk.punchcard` — `xField`, `yField`, `cellSize`, color options
- `splunk.events` — `allowRowExpansion`, `formatter` per column
- `splunk.fillergauge` — `min`, `max`, `orientation`, `valueDisplay`
- `splunk.map` — tile layer, marker layer, bubble layer nesting
- `splunk.choropleth.map` (geographic) — `map`, `featureIdField`, `colorMode`, `bounds`
- `splunk.choropleth.svg` — `svg` (required), `featureIdField`, `colorMode`
- `splunk.linkgraph` — `nodeKey`, `sourceField`, `targetField`, `nodeColors`
- `splunk.sankey` — `sourceField`, `targetField`, `valueField`
- `splunk.parallelcoordinates` — `dimensions`, `lineColor`
- `splunk.singlevalueicon` — variant of singlevalue with icon
- `splunk.singlevalueradial` — variant with circular visual
- `splunk.markdown` — `markdown` (content), `backgroundColor`
- `splunk.image` — `src` (data URI or URL), `sizing`
- `splunk.rectangle` / `splunk.ellipse` — decoration shapes with `fill`, `stroke`, `strokeWidth`, `strokeDashArray`

Each per-type section follows this template (short and consistent):

```
## splunk.<type>

Brief one-line purpose.

**Data shape:** <describe expected columns/rows>.

**Shared groups:** [AXES] [LEGEND] [SERIES]  (only when applicable)

**Specific options:**

| Property | Type | Default | Description |
|---|---|---|---|
| ... | ... | ... | ... |

```json
{
  "type": "splunk.<type>",
  "title": "Example",
  "dataSources": { "primary": "ds_1" },
  "options": { /* minimal correct example */ }
}
```
```

**Common mistakes section** at the end — 10 items pulled from Vista's "COMMON MISTAKES & PITFALLS" (yField vs yFields, boolean quoting, missing dataSources, stackMode on wrong type, annotations on bar, xAxisLabelRotation on bar, map resultLimit, gauge ranges, single value color thresholds, SVG choropleth).

- [ ] **Step 1: Read source files and draft the expanded content**

Dispatch a subagent (model: sonnet) with:
- Read both source SKILL.md files (paths above).
- Keep existing 10 viz sections unchanged.
- Add Shared Options Library section right after `# ds-viz — Visualization reference` intro.
- Add 16 new per-type sections in a consistent order: decorations last, maps+gauges middle, advanced charts early.
- Add Common Mistakes section at the very end, before "Picking a viz type".
- Update the "Picking a viz type" decision table to include the new types.

- [ ] **Step 2: Verify fence count**

The final file should have ~30+ JSON code fences (one minimal example per viz type). Run:
```bash
grep -c '^```' plugins/splunk-dashboards/skills/ds-viz/SKILL.md
```
Expected: even number (opening fences count equals closing fences).

- [ ] **Step 3: Commit**

```bash
git add plugins/splunk-dashboards/skills/ds-viz/SKILL.md
git commit -m "docs(splunk-dashboards): expand ds-viz to 26 viz types + shared options"
```

---

### Task 2: Expand `ds-syntax`

**Files:**
- Modify: `plugins/splunk-dashboards/skills/ds-syntax/SKILL.md`

Keep existing sections. Add:

**New dataSources subsections:**
- `ds.test` — inline mock data with `fields` + `columns` schema (example from SDS §2.3).
- `Base Search + Chain pattern` — one search dispatched with `allowNoResults=true`, multiple `ds.chain` post-processes (example from SDS §2.5).

**New inputs subsections:**
- Multiselect — `input.multiselect` example with `items`, `token`, `defaultValue` array.
- Text input — `input.text` with `token`, `defaultValue`.
- Dynamic dropdown — populated from a `dataSource` via `options.items = "> primary | frame(labelField, valueField)"`.

**Expanded drilldowns section** — replace current thin coverage with 5 distinct patterns from SDS §8:
- `setToken` on click
- `link.url`
- `link.dashboard`
- `link.search`
- Conditional visibility (`"visibility": "$token$=\"value\""`)

**New layout subsection:**
- Tabbed layout — `"type": "tabs"`, tab objects with `label` and nested structure (from SDS §6.3).
- Line connections — absolute layout's line entries with `source`/`target` viz ids (from SDS §6.4).

**New top-level section: Dynamic Options Syntax (DOS)**

A compact section documenting:
- Structure: `"> <dataSource> | <selector> | <formatter>"`
- Selector table (from SDS §7.2): `seriesByName`, `seriesByIndex`, `seriesByPrioritizedTypes`, `firstPoint`, `lastPoint`, `pointByIndex`, `delta`, `getField`, `getType`, `getValue`, `pick`, `frame`.
- Formatter table (from SDS §7.3): `rangeValue`, `matchValue` (**BROKEN — use rangeValue with numeric rank instead**), `formatByType`, `prefix`, `suffix`, `prepend`, `multiFormat`, `type`.
- `context` configuration store — short example showing how to declare `colorConfig` and reference it.
- Escaping rules.

**New section: Token filters**

Short reference: `$token|h$` (HTML escape), `$token|u$` (URL encode), `$token|s$` (raw string).

**New section: Default color palette**

20-color dark-theme palette listed from SDS §9.3, plus common semantic colors (green=healthy, red=critical, orange=warning, blue=info).

**Keep existing "When to use this skill standalone" as the closing section.**

- [ ] **Step 1: Draft expanded content**

Dispatch a subagent (model: sonnet) with:
- Read SDS `SKILL.md` sections 2.3, 2.5, 4.3, 4.4, 4.5, 4.6, 6.3, 6.4, 7.*, 8.*, 9.3.
- Produce merged, compact markdown following the structure above.
- Keep existing sections intact — only add new ones.

- [ ] **Step 2: Verify structure**

```bash
grep -c '^## ' plugins/splunk-dashboards/skills/ds-syntax/SKILL.md
```
Expected: 11+ top-level sections (Top-level keys, dataSources, visualizations, inputs, defaults, layout, drilldowns, XML envelope, DOS, Token filters, Color palette, When to use standalone).

- [ ] **Step 3: Commit**

```bash
git add plugins/splunk-dashboards/skills/ds-syntax/SKILL.md
git commit -m "docs(splunk-dashboards): expand ds-syntax with ds.test, inputs, DOS, drilldowns, palette"
```

---

### Task 3: Final verification + push

- [ ] **Step 1: Confirm both files parse as valid markdown**

Claude Code's skill loader tolerates broken frontmatter poorly. Verify YAML frontmatter is intact:

```bash
head -5 plugins/splunk-dashboards/skills/ds-viz/SKILL.md
head -5 plugins/splunk-dashboards/skills/ds-syntax/SKILL.md
```

Both must open with `---` / `name:` / `description:` / `---`.

- [ ] **Step 2: Run full test suite (sanity — no tests should have broken)**

```bash
cd plugins/splunk-dashboards
python3 -m pytest -q
```

Expected: **85 passed**.

- [ ] **Step 3: Push + fast-forward main**

```bash
git push
git checkout main
git merge --ff-only splunk-dashboards-foundation
git push origin main
git checkout splunk-dashboards-foundation
```

---

## What this sub-plan delivers

- `ds-viz` covers all 26 Dashboard Studio visualization types with per-type option tables and a shared-options library that prevents duplication.
- `ds-syntax` covers every datasource type, every input type, 5 drilldown patterns, tabbed + line-connection layouts, DOS (the expression language), token filters, the default color palette, and common pitfalls.
- No code changes — just documentation reaching parity with the best existing references.
