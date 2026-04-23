# Aurora Sub-plan 12: Skill updates + flagship templates

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update `ds-create`, `ds-design-principles`, and `ds-review` SKILL.md files to surface Aurora concepts (themes, patterns, polish). Add two flagship templates (`aurora-exec-hero.json`, `aurora-noc-wall.json`) that demonstrate the framework end-to-end. Verify templates load via `ds-template list`.

**Architecture:** Pure markdown + JSON. No new Python modules. Templates are plain Dashboard Studio JSON that `ds-template load` already knows how to handle; they just need to live in `templates/` with valid content.

**Tech Stack:** Markdown, JSON. Pytest for the template load roundtrip test.

**Depends on:** Sub-plan 10 (theme names) and sub-plan 11 (pattern names).

---

## File structure

```
plugins/splunk-dashboards/
├── skills/
│   ├── ds-create/SKILL.md             # MODIFIED — --theme/--pattern section
│   ├── ds-design-principles/SKILL.md  # MODIFIED — Aurora themes + depth + patterns reference
│   └── ds-review/SKILL.md             # MODIFIED — polish scorecard intro (details in plan 13)
├── templates/
│   ├── aurora-exec-hero.json          # NEW — flagship for exec theme
│   └── aurora-noc-wall.json           # NEW — flagship for noc theme
└── tests/
    └── test_templates.py              # MODIFIED — assert aurora-* templates load
```

Test count after sub-plan 12: ~150 + 3–5 = ~155.

---

### Task T12-1: Update `ds-create/SKILL.md`

**Files:**
- Modify: `plugins/splunk-dashboards/skills/ds-create/SKILL.md`

- [ ] **Step 1: Read the existing file to know what to append to**

```bash
head -40 plugins/splunk-dashboards/skills/ds-create/SKILL.md
```

Note where the "Theme" section currently is. We will replace/extend it.

- [ ] **Step 2: Update the Theme section**

Find the existing section starting with `## Theme` (around line 90 based on earlier Read). Replace it with:

```markdown
## Aurora themes

Pass `--theme {pro|glass|exec|noc}` to apply one of four Aurora design themes. Default is `pro`.

- **pro** — Splunk clean professional (dark). Default for executive, ops, analytical. Splunk categorical-10 palette, flat cards, 1px strokes. Legacy alias: `clean`.
- **glass** — Linear-inspired premium (dark, hero). For landing dashboards with ≤ 8 panels. Radial-gradient canvas (faked via stacked rectangles), translucent cards, hero-KPI sparkline.
- **exec** — Editorial light. For board decks, PDF reports, leadership distribution. Warm off-white, Georgia/Splunk Data Sans for values, thin divider lines (no cards).
- **noc** — Mission-control. For 24/7 wall displays, SOC. Pure black canvas, SOC semantic-ordered palette, Roboto Mono on values. Legacy aliases: `ops`, `soc`.

Each theme ships with a **default pattern package** that auto-applies. Override explicitly with `--pattern`.

| Theme | Default patterns |
|---|---|
| `pro` | `card-kpi`, `sparkline-in-kpi`, `compare-prev` |
| `glass` | `hero-kpi`, `card-kpi`, `sparkline-in-kpi` |
| `exec` | `compare-prev`, `section-zones`, `sparkline-in-kpi` |
| `noc` | `card-kpi`, `annotations`, built-in status-tile |

## Composition patterns

Pass `--pattern <name>` (repeatable) to apply a composition pattern. If no `--pattern` is passed, the theme's defaults apply.

| Pattern | Does |
|---|---|
| `card-kpi` | Inserts a `splunk.rectangle` behind a KPI row (depth via layered rectangles, rx 8). |
| `hero-kpi` | Promotes one singlevalue to 2.5× width, 1.5× height, with oversized font, sparkline-below, trend delta. |
| `sparkline-in-kpi` | Adds sparkline-below + theme-accent fill on every singlevalue backed by a time-series SPL. |
| `compare-prev` | Appends `| timewrap 1d` and configures dashed previous-period overlay on line/area charts. |
| `annotations` | Adds a secondary data source + binds annotationX/Label/Color on line/area/column charts. |
| `section-zones` | Groups panels tagged with `section: <name>` into labeled zones with `### Section` headers and background rectangles. |

See also: **`ds-design-principles`** for the decision rules that guide when to apply each pattern.

### Examples

```bash
# Default pro theme with its default pattern package (card-kpi + sparkline-in-kpi + compare-prev)
PYTHONPATH=.../src python3 -m splunk_dashboards.create build my-dash --title "Platform Health"

# Glass hero view with only hero-kpi (no card-kpi)
PYTHONPATH=.../src python3 -m splunk_dashboards.create build my-dash --theme glass --pattern hero-kpi

# Exec PDF-style report, no patterns (pure theme only)
PYTHONPATH=.../src python3 -m splunk_dashboards.create build my-dash --theme exec --pattern ""

# NOC wall with explicit patterns
PYTHONPATH=.../src python3 -m splunk_dashboards.create build my-dash --theme noc --pattern card-kpi --pattern annotations
```

### Splunk Enterprise and Cloud compatibility

All Aurora themes and patterns emit **native Dashboard Studio v2 JSON only** — no custom CSS, no JavaScript, no app dependencies. Output runs unmodified on Splunk Enterprise (9.x+) and Splunk Cloud.
```

If the file already had a `## Theme` section, replace it. Otherwise insert this before the "After building" section.

- [ ] **Step 3: Commit**

```bash
git add plugins/splunk-dashboards/skills/ds-create/SKILL.md
git commit -m "$(cat <<'EOF'
docs(ds-create): add Aurora themes + patterns sections

Documents --theme (pro/glass/exec/noc with legacy aliases) and
--pattern flag with all six patterns and their behaviors. Includes
theme→default-pattern table and four worked example invocations.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task T12-2: Extend `ds-design-principles/SKILL.md`

**Files:**
- Modify: `plugins/splunk-dashboards/skills/ds-design-principles/SKILL.md`

- [ ] **Step 1: Read the existing file to know what to append to**

```bash
wc -l plugins/splunk-dashboards/skills/ds-design-principles/SKILL.md
```

Note current length. We will APPEND new sections before the "Working with the action skills" table at the very bottom.

- [ ] **Step 2: Append Aurora sections**

Insert these sections immediately BEFORE the final `## Working with the action skills` section (read the file first to find the correct line):

```markdown
## Aurora themes

Four canonical themes ship with the plugin. Use this table to pick one when `ds-init` asks about audience and use case.

| Theme | Mode | Archetype fit | When |
|---|---|---|---|
| `pro` | dark | Executive summary, Operational monitoring, Analytical deep-dive | Default choice. Splunk categorical-10 palette. |
| `glass` | dark (hero) | Executive summary with ≤ 8 panels | When the dashboard is a landing / pitch view. |
| `exec` | light | Executive summary for print / PDF distribution | Monthly reports, board decks, leadership updates. |
| `noc` | dark (intense) | Operational monitoring, SOC overview | 24/7 wall displays, on-call rotations. |

### Canvas tokens (verified against splunkui.splunk.com)

| Theme | Canvas | Panel | Stroke | Accent |
|---|---|---|---|---|
| `pro` | `#0b0c0e` | `#15161a` | `#2C2C3A` | `#006D9C` |
| `glass` | gradient `#1a1538 → #0b0c0e` | `rgba(255,255,255,0.03)` | `rgba(255,255,255,0.08)` | `#009CEB` |
| `exec` | `#FAFAF7` | `#ffffff` | `#E5E5E0` | `#2066C0` |
| `noc` | `#000000` | `#0F1117` | `#1FBAD6 @ 0.4` | `#1FBAD6` |

## Depth and layering

Dashboard Studio has no box-shadow, no backdrop-blur, no gradient primitive. Depth comes from **layered rectangles**:

- **Card behind KPIs** — `splunk.rectangle` placed first in `layout.structure` (earlier = renders behind) with `fillColor: PANEL`, `strokeColor: PANEL_STROKE`, `rx: 8`. KPI panels layered on top.
- **Zone background** — a second rectangle at `fillOpacity: 0.04` wrapping a section of panels, combined with a `splunk.markdown` header.
- **Two-tone highlight** — stack two rectangles at the same position: base at `fillOpacity: 1`, overlay at `fillOpacity: 0.3` with an accent color, to fake a subtle gradient.

**Array-order rule:** entries earlier in `layout.structure` render BEHIND entries later in the array. There is no `z-index`. Aurora's `card-kpi` and `section-zones` patterns handle this automatically.

**Shape layouts only:** `splunk.rectangle` and `splunk.ellipse` require `layout.type: "absolute"`. Patterns that use them skip silently on `grid` or `tab` layouts.

## Composition patterns

Six patterns `ds-create` can apply. Each is independently invokable via `--pattern <name>`.

| Pattern | What it does | Theme defaults that include it |
|---|---|---|
| `card-kpi` | Rectangle card behind a KPI row for depth. | pro, glass, noc |
| `hero-kpi` | Promotes one singlevalue to 2.5× size with sparkline + delta. | glass |
| `sparkline-in-kpi` | Sparkline-below on every time-series singlevalue. | pro, glass, exec |
| `compare-prev` | Dashed previous-period overlay on line/area (`timewrap`). | pro, exec |
| `annotations` | Event markers on line/area/column from a secondary ds. | noc |
| `section-zones` | Labeled zones for dashboards with > 6 panels. | exec |

See `ds-create` SKILL.md for pattern invocation examples.

## Explicit constraints (honest "not possible" list)

Aurora is native Dashboard Studio JSON. It cannot deliver:

1. **Animations** — no keyframes, no pulsing alerts, no transitions.
2. **True glassmorphism / backdrop-blur** — `glass` theme fakes the feeling; it is not identical to Linear.
3. **Gradient text on KPIs** — no gradient-text option; use a saturated color + background rectangle instead.
4. **Custom chart fonts** — only `splunk.markdown` exposes `fontFamily`.
5. **Per-region map overlays that pan/zoom with the map** — statically positioned overlays only.

For features that genuinely require these, custom Canvas 2D visualizations via `/splunk-viz` are a Phase 2 extension point (see `viz_packs/README.md`). Aurora v1 does not ship any custom viz.
```

- [ ] **Step 3: Commit**

```bash
git add plugins/splunk-dashboards/skills/ds-design-principles/SKILL.md
git commit -m "$(cat <<'EOF'
docs(ds-design-principles): add Aurora themes + depth + patterns

Three new sections:
- Aurora themes table (4 themes, archetype fit)
- Canvas tokens (hex values verified against splunkui.splunk.com)
- Depth and layering (array-order rule, shape-layout constraint)
- Composition patterns table
- Explicit non-goals (animations, glassmorphism, etc.)

Existing content preserved additively.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task T12-3: Add polish-scorecard intro stub in `ds-review/SKILL.md`

**Files:**
- Modify: `plugins/splunk-dashboards/skills/ds-review/SKILL.md`

This is a stub referencing the scorecard — the implementation + detailed docs land in sub-plan 13. We just make the skill aware.

- [ ] **Step 1: Append the Polish scorecard section**

Add this section to `plugins/splunk-dashboards/skills/ds-review/SKILL.md` immediately after the existing "Review dimensions" subsections and before the "Output" heading:

```markdown
### 7. Polish scorecard (Aurora)

`ds-review` produces a weighted **Polish score (0–10)** measuring ten dimensions:

1. Aurora theme applied (vs. unstyled Splunk default)
2. KPI row wrapped in rectangle card (`card-kpi` pattern active)
3. Hero KPI identified and sized correctly when present
4. Sparklines on every singlevalue backed by a time-series SPL
5. Compare-to-previous-period active on at least one time chart
6. Section-zones used when panel count > 6
7. No chart exceeds 8 series
8. Semantic colors used on status KPIs (red for failure, green for healthy, etc.)
9. Panel gutter minimum 20 px
10. Panel titles ≤ 40 characters

Each dimension returns pass/partial/fail and contributes to the weighted score. Findings appear in `review.md` under `## Polish scorecard` with per-dimension hits and suggested `ds-update` commands for gaps.

Implementation: `src/splunk_dashboards/aurora_score.py` (sub-plan 13).
```

- [ ] **Step 2: Commit**

```bash
git add plugins/splunk-dashboards/skills/ds-review/SKILL.md
git commit -m "$(cat <<'EOF'
docs(ds-review): add Polish scorecard section intro

References the 10 Aurora polish dimensions that ds-review emits in
review.md. Detailed scoring logic lands in sub-plan 13
(aurora_score.py).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task T12-4: Create flagship template `aurora-exec-hero.json`

**Files:**
- Create: `plugins/splunk-dashboards/templates/aurora-exec-hero.json`

- [ ] **Step 1: Write the template**

Create `plugins/splunk-dashboards/templates/aurora-exec-hero.json`:

```json
{
  "title": "Executive Hero",
  "description": "Aurora flagship — exec theme. 4 KPIs + primary trend with compare-to-previous. Leadership-ready.",
  "theme": "light",
  "dataSources": {
    "ds_1": {
      "type": "ds.search",
      "name": "Revenue",
      "options": {
        "query": "| makeresults | eval rev=2400000 | table rev",
        "queryParameters": {"earliest": "$global_time.earliest$", "latest": "$global_time.latest$"}
      }
    },
    "ds_2": {
      "type": "ds.search",
      "name": "Users",
      "options": {
        "query": "| makeresults | eval users=1284 | table users",
        "queryParameters": {"earliest": "$global_time.earliest$", "latest": "$global_time.latest$"}
      }
    },
    "ds_3": {
      "type": "ds.search",
      "name": "Churn",
      "options": {
        "query": "| makeresults | eval churn=2.1 | table churn",
        "queryParameters": {"earliest": "$global_time.earliest$", "latest": "$global_time.latest$"}
      }
    },
    "ds_4": {
      "type": "ds.search",
      "name": "MRR",
      "options": {
        "query": "| makeresults | eval mrr=198000 | table mrr",
        "queryParameters": {"earliest": "$global_time.earliest$", "latest": "$global_time.latest$"}
      }
    },
    "ds_5": {
      "type": "ds.search",
      "name": "Growth trajectory",
      "options": {
        "query": "| makeresults count=30 | streamstats count | eval _time=_time - (count*86400), revenue=1800000 + (count*20000)+random() % 100000 | table _time revenue",
        "queryParameters": {"earliest": "$global_time.earliest$", "latest": "$global_time.latest$"}
      }
    }
  },
  "visualizations": {
    "viz_revenue": {
      "type": "splunk.singlevalue", "title": "Monthly Revenue",
      "dataSources": {"primary": "ds_1"},
      "options": {"unit": "$", "unitPosition": "before", "majorValueSize": 48}
    },
    "viz_users": {
      "type": "splunk.singlevalue", "title": "New Users",
      "dataSources": {"primary": "ds_2"}, "options": {"majorValueSize": 28}
    },
    "viz_churn": {
      "type": "splunk.singlevalue", "title": "Churn",
      "dataSources": {"primary": "ds_3"}, "options": {"unit": "%", "majorValueSize": 28}
    },
    "viz_mrr": {
      "type": "splunk.singlevalue", "title": "MRR",
      "dataSources": {"primary": "ds_4"}, "options": {"unit": "$", "unitPosition": "before", "majorValueSize": 28}
    },
    "viz_trend": {
      "type": "splunk.line", "title": "Revenue trajectory",
      "dataSources": {"primary": "ds_5"}, "options": {}
    }
  },
  "inputs": {
    "input_global_time": {
      "type": "input.timerange", "title": "Time range",
      "options": {"token": "global_time", "defaultValue": {"earliest": "-30d@d", "latest": "now"}}
    }
  },
  "defaults": {},
  "layout": {
    "type": "absolute",
    "options": {"width": 1440, "height": 600},
    "structure": [
      {"item": "viz_revenue", "type": "block", "position": {"x": 20,   "y": 60,  "w": 420, "h": 180}},
      {"item": "viz_users",   "type": "block", "position": {"x": 460,  "y": 60,  "w": 300, "h": 180}},
      {"item": "viz_churn",   "type": "block", "position": {"x": 780,  "y": 60,  "w": 300, "h": 180}},
      {"item": "viz_mrr",     "type": "block", "position": {"x": 1100, "y": 60,  "w": 320, "h": 180}},
      {"item": "viz_trend",   "type": "block", "position": {"x": 20,   "y": 260, "w": 1400, "h": 320}}
    ]
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add plugins/splunk-dashboards/templates/aurora-exec-hero.json
git commit -m "$(cat <<'EOF'
feat(splunk-dashboards): add aurora-exec-hero flagship template

Executive hero layout — 4 KPI tiles (revenue/users/churn/MRR) + one
wide trend chart. Designed for exec theme with compare-prev and
section-zones default patterns. Uses | makeresults placeholder data
so it loads without real indexes.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task T12-5: Create flagship template `aurora-noc-wall.json`

**Files:**
- Create: `plugins/splunk-dashboards/templates/aurora-noc-wall.json`

- [ ] **Step 1: Write the template**

Create `plugins/splunk-dashboards/templates/aurora-noc-wall.json`:

```json
{
  "title": "NOC Wall",
  "description": "Aurora flagship — noc theme. 4 status tiles + live request-rate chart + top-hosts ticker. For 24/7 wall displays.",
  "theme": "dark",
  "dataSources": {
    "ds_events": {
      "type": "ds.search",
      "name": "Events",
      "options": {"query": "| makeresults | eval events=42128 | table events"}
    },
    "ds_uptime": {
      "type": "ds.search",
      "name": "Uptime",
      "options": {"query": "| makeresults | eval uptime=99.98 | table uptime"}
    },
    "ds_latency": {
      "type": "ds.search",
      "name": "p95 Latency",
      "options": {"query": "| makeresults | eval p95=148 | table p95"}
    },
    "ds_alerts": {
      "type": "ds.search",
      "name": "Critical alerts",
      "options": {"query": "| makeresults | eval alerts=3 | table alerts"}
    },
    "ds_request_rate": {
      "type": "ds.search",
      "name": "Request rate",
      "options": {"query": "| makeresults count=60 | streamstats count | eval _time=_time - (count*60), rate=random()%1000 + 500 | table _time rate"}
    },
    "ds_hosts": {
      "type": "ds.search",
      "name": "Top hosts",
      "options": {"query": "| makeresults | eval data=\"host-a,98,OK;host-b,221,WARN;host-c,412,CRIT\" | makemv delim=\";\" data | mvexpand data | rex field=data \"(?<host>[^,]+),(?<ms>\\d+),(?<status>\\w+)\" | table host ms status"}
    }
  },
  "visualizations": {
    "viz_events": {
      "type": "splunk.singlevalueicon", "title": "EVENTS",
      "dataSources": {"primary": "ds_events"},
      "options": {"majorValueSize": 32, "backgroundColor": "#53A051", "icon": "check-circle"}
    },
    "viz_uptime": {
      "type": "splunk.singlevalueicon", "title": "UPTIME",
      "dataSources": {"primary": "ds_uptime"},
      "options": {"unit": "%", "majorValueSize": 32, "backgroundColor": "#53A051", "icon": "check-circle"}
    },
    "viz_latency": {
      "type": "splunk.singlevalueicon", "title": "P95 MS",
      "dataSources": {"primary": "ds_latency"},
      "options": {"majorValueSize": 32, "backgroundColor": "#F8BE34", "icon": "warning"}
    },
    "viz_alerts": {
      "type": "splunk.singlevalueicon", "title": "ALERTS",
      "dataSources": {"primary": "ds_alerts"},
      "options": {"majorValueSize": 32, "backgroundColor": "#DC4E41", "icon": "alarm"}
    },
    "viz_rate": {
      "type": "splunk.line", "title": "REQUEST RATE · LIVE",
      "dataSources": {"primary": "ds_request_rate"},
      "options": {}
    },
    "viz_hosts": {
      "type": "splunk.table", "title": "HOSTS",
      "dataSources": {"primary": "ds_hosts"},
      "options": {"count": 10}
    }
  },
  "inputs": {},
  "defaults": {},
  "layout": {
    "type": "absolute",
    "options": {"width": 1920, "height": 1080},
    "structure": [
      {"item": "viz_events",  "type": "block", "position": {"x": 20,   "y": 40,  "w": 460, "h": 180}},
      {"item": "viz_uptime",  "type": "block", "position": {"x": 500,  "y": 40,  "w": 460, "h": 180}},
      {"item": "viz_latency", "type": "block", "position": {"x": 980,  "y": 40,  "w": 460, "h": 180}},
      {"item": "viz_alerts",  "type": "block", "position": {"x": 1460, "y": 40,  "w": 440, "h": 180}},
      {"item": "viz_rate",    "type": "block", "position": {"x": 20,   "y": 240, "w": 1880,"h": 520}},
      {"item": "viz_hosts",   "type": "block", "position": {"x": 20,   "y": 780, "w": 1880,"h": 280}}
    ]
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add plugins/splunk-dashboards/templates/aurora-noc-wall.json
git commit -m "$(cat <<'EOF'
feat(splunk-dashboards): add aurora-noc-wall flagship template

NOC wall layout for 1920×1080 displays — 4 full-color status tiles
(green/green/amber/red) + large live request-rate chart + hosts
ticker. Designed for noc theme default patterns (card-kpi +
annotations + status-tile).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task T12-6: Assert templates load via the registry

**Files:**
- Modify: `plugins/splunk-dashboards/tests/test_templates.py`

- [ ] **Step 1: Read the file to understand its structure**

```bash
head -40 plugins/splunk-dashboards/tests/test_templates.py
```

- [ ] **Step 2: Write failing test**

Append to `plugins/splunk-dashboards/tests/test_templates.py`:

```python
def test_aurora_flagship_templates_listed():
    from splunk_dashboards.templates import list_bundled_templates
    names = set(list_bundled_templates())
    assert "aurora-exec-hero" in names
    assert "aurora-noc-wall" in names


def test_aurora_exec_hero_loads_and_has_valid_structure():
    import json
    from splunk_dashboards.templates import load_bundled_template
    data = load_bundled_template("aurora-exec-hero")
    assert data["title"] == "Executive Hero"
    assert len(data["visualizations"]) >= 5
    assert data["layout"]["type"] == "absolute"
    assert len(data["layout"]["structure"]) == len(data["visualizations"])


def test_aurora_noc_wall_loads_and_has_valid_structure():
    from splunk_dashboards.templates import load_bundled_template
    data = load_bundled_template("aurora-noc-wall")
    assert data["title"] == "NOC Wall"
    # 4 status tiles + live chart + hosts = 6
    assert len(data["visualizations"]) == 6
    # Verify status-tile backgrounds are semantically colored
    alert_viz = data["visualizations"]["viz_alerts"]
    assert alert_viz["options"]["backgroundColor"] == "#DC4E41"
```

- [ ] **Step 3: Run to verify it passes**

```bash
cd plugins/splunk-dashboards
python3 -m pytest tests/test_templates.py -v -k aurora
```

Expected: 3 passed.

- [ ] **Step 4: Run full suite**

```bash
cd plugins/splunk-dashboards
python3 -m pytest -q
```

Expected: ~155 passed.

- [ ] **Step 5: Commit**

```bash
git add plugins/splunk-dashboards/tests/test_templates.py
git commit -m "$(cat <<'EOF'
test(splunk-dashboards): assert Aurora flagship templates load

Verifies aurora-exec-hero and aurora-noc-wall are listed by
list_bundled_templates and load with valid Dashboard Studio
structure (layout+visualizations count match, status-tile colors
are semantically correct).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task T12-Z: Full suite + smoke + push

- [ ] **Step 1: Run full suite**

```bash
cd plugins/splunk-dashboards
python3 -m pytest -v
```

Expected: ~155 passed.

- [ ] **Step 2: Smoke test — load a flagship template into a fresh workspace**

```bash
cd plugins/splunk-dashboards
PYTHONPATH=src python3 -m splunk_dashboards.workspace init aurora-flagship-smoke
PYTHONPATH=src python3 -m splunk_dashboards.templates load aurora-exec-hero --project aurora-flagship-smoke
# Inspect the workspace — layout.json should have the 5 panels from the template
```

- [ ] **Step 3: Push**

```bash
git push
```

---

## Deliverables when sub-plan 12 closes

- [x] `ds-create/SKILL.md` documents `--theme` (4 names) + `--pattern` flag with examples
- [x] `ds-design-principles/SKILL.md` has Aurora themes, depth/layering, composition patterns sections
- [x] `ds-review/SKILL.md` references the polish scorecard (details in sub-plan 13)
- [x] 2 flagship templates (`aurora-exec-hero.json`, `aurora-noc-wall.json`) auto-discovered by `ds-template list`
- [x] +3–5 new tests passing, total ~155 green

Next: sub-plan 13 (polish scorecard).
