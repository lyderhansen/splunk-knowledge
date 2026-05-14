# Skill Patches — Tab Layout Schema Gap

Root cause: the Dashboard Studio v2 tab layout schema is unintuitive.
The wrong structure (`layout.tabs: [array]`) looks plausible but fails
with 4+ validation errors. The correct structure requires `tabs.items`
+ `layoutDefinitions` with named IDs, and the root layout must NOT
have a `type` property.

## Patch 1: vp-couture — MUST-LOAD list

**File:** `skills/vp-couture/SKILL.md`
**Section:** `### Subagent enforcement` → Step 7 MUST-LOAD block

**Current text:**
```
**Step 7 MUST-LOAD — cross-plugin rules:**
Before building, the agent (or subagent) MUST load:
- `vp-ref-gotchas` — viz code rules (ES5, outputMode, file paths)
- `ds-create` from `splunk-dashboard-studio` — dashboard hard defaults
  (canvas 1920×1080, fontFamily, fontSize, markdown sizing)
- `spl-gotchas` from `splunk-spl` — SPL traps for data source queries
```

**Add after the `ds-create` bullet:**
```
- `ds-int-tabs` from `splunk-dashboard-studio` — REQUIRED when the
  dashboard uses tabs. The tab schema is NOT an array on `layout.tabs`.
  It requires `layout.tabs.items` + `layout.layoutDefinitions` with
  named layout IDs, and the root `layout` must NOT have a `type`
  property. Getting this wrong produces 4+ silent validation errors.
```

---

## Patch 2: vp-couture — conditional load trigger

**File:** `skills/vp-couture/SKILL.md`
**Section:** After the MUST-LOAD block, add a new paragraph:

```
**Conditional loads — triggered by brief content:**
- If the design brief or user requirements mention "tabs",
  "layoutDefinitions", "multi-view", or "tab bar": MUST also load
  `ds-int-tabs` before writing any layout JSON.
- If the dashboard uses drilldowns between tabs: MUST also load
  `ds-int-drilldowns`.
```

---

## Patch 3: vp-create — tab layout recipe

**File:** `skills/vp-create/SKILL.md`
**Section:** Add to the dashboard generation section (wherever the
dashboard XML/JSON template lives)

**Add a recipe block:**
```
### Tabbed dashboard layout recipe

When the dashboard uses tabs, the `layout` block must follow this
exact structure — no `type` at root, named layoutDefinitions:

​```json
"layout": {
    "globalInputs": [],
    "tabs": {
        "items": [
            {"layoutId": "tab_overview", "label": "Overview"},
            {"layoutId": "tab_detail", "label": "Detail"}
        ],
        "options": {"barPosition": "top", "showTabBar": true}
    },
    "layoutDefinitions": {
        "tab_overview": {
            "type": "absolute",
            "options": {"width": 1920, "height": 1080, "display": "auto-scale"},
            "structure": [
                {"item": "viz_bg", "type": "block", "position": {"x": 0, "y": 0, "w": 1920, "h": 1080}},
                ...
            ]
        },
        "tab_detail": {
            "type": "absolute",
            "options": {"width": 1920, "height": 1080, "display": "auto-scale"},
            "structure": [...]
        }
    }
}
​```

**Common mistakes that produce silent validation errors:**
- `layout.tabs: [{label, layout}]` (array) — WRONG, must be object
  with `items` + `options`
- `layout.type: "absolute"` alongside `layout.tabs` — WRONG, root
  layout must NOT have `type` when using tabs
- `layout.options: {width, height}` at root — WRONG, those go inside
  each `layoutDefinitions` entry
- Missing `layoutDefinitions` — WRONG, tabs.items reference layoutIds
  that must exist in layoutDefinitions

**Global elements (banners, backgrounds):** There is no shared
structure area across tabs. Repeat global elements (canvas bg, banner,
accent line, title) in each tab's structure array.
```

---

## Why this matters

Every viz pack with 5+ vizs will want tabs. This is not an edge case —
it's the default. The schema is counterintuitive enough that even with
ds-int-tabs loaded, agents can still get it wrong if they write from
memory instead of copying the recipe. The vp-create recipe gives a
copy-pasteable template that eliminates the failure mode entirely.
