# Dashboard transcription from DESIGN-LOCK.md

When `DESIGN-LOCK.md.dashboard.panels` is non-empty, cv-build transcribes a Dashboard Studio v2 XML file. Pure transcription — no design decisions.

## Output files

- `<app_id>/default/data/ui/views/<app_id>_overview.xml`
- `<app_id>/default/data/ui/nav/default.xml` (updated with default view)

## XML envelope template

```xml
<dashboard version="2" theme="dark">
  <label><display_name> Overview</label>
  <description>Auto-generated dashboard showcasing all vizs in the <display_name> pack.</description>
  <definition><![CDATA[
{{JSON_DEFINITION}}
  ]]></definition>
</dashboard>
```

The `theme` attribute on `<dashboard>` MUST match `applicationProperties.theme` in the JSON.

## JSON definition template

```json
{
  "title": "<display_name> Overview",
  "description": "...",
  "inputs": {
    "input_global_time": {
      "type": "input.timerange",
      "title": "Time Range",
      "options": { "token": "global_time", "defaultValue": "-24h@h,now" }
    }
  },
  "defaults": {
    "dataSources": {
      "ds.search": {
        "options": {
          "queryParameters": {
            "earliest": "$global_time.earliest$",
            "latest": "$global_time.latest$"
          }
        }
      }
    }
  },
  "dataSources": {
    "ds_<viz_name>": {
      "type": "ds.search",
      "options": {
        "query": "| inputlookup <app_id>_demo_<viz_name>.csv"
      },
      "name": "<Human Readable> demo data"
    }
    // ... one entry per viz
  },
  "visualizations": {
    "viz_bg_gradient": {
      "type": "splunk.image",
      "options": {
        "src": "/static/app/<app_id>/images/bg_gradient.png",
        "preserveAspectRatio": false
      }
    },
    "viz_<viz_name>": {
      "type": "<app_id>.<viz_name>",
      "title": "<Viz Display Name>",
      "dataSources": { "primary": "ds_<viz_name>" },
      "options": {
        "<key>": "<value>"
        // ... use SHORT KEYS only (e.g. "field": "value", NOT "<app_id>.<viz_name>.field")
        // ... only NON-DEFAULT overrides; if value matches formatter default, omit
      }
    }
    // ... one entry per viz
  },
  "layout": {
    "type": "absolute",
    "options": {
      "width": 1920,
      "height": 1080,
      "backgroundColor": "<global.palette_dark.bg>"
    },
    "globalInputs": ["input_global_time"],
    "structure": [
      {
        "item": "viz_bg_gradient",
        "type": "block",
        "position": { "x": 0, "y": 0, "w": 1920, "h": 1080 }
      },
      {
        "item": "viz_<viz_name>",
        "type": "block",
        "position": { "x": <x>, "y": <y>, "w": <w>, "h": <h> }
      }
      // ... one entry per panel from dashboard.panels
    ]
  },
  "applicationProperties": { "theme": "dark" }
}
```

## Transcription rules

| DESIGN-LOCK.md source | Dashboard JSON destination |
|---|---|
| `dashboard.canvas.width` / `.height` | `layout.options.width` / `.height` |
| `dashboard.background.gradient_spec.from` | `layout.options.backgroundColor` (fallback color before PNG loads) |
| `dashboard.panels[].viz` | `layout.structure[].item` (prefix with `viz_`) |
| `dashboard.panels[].position` | `layout.structure[].position` |
| `vizs[].name` | `visualizations.viz_<name>.type` becomes `<app_id>.<viz_name>` |
| `vizs[].data_contract` | informs the `dataSources.ds_<viz>.options.query` (inputlookup) |
| `interactions.drilldowns[]` | `visualizations.viz_<name>.eventHandlers` with `drilldown.setToken` |
| `interactions.inputs[]` | `inputs.<input_name>` |

**Custom viz options use SHORT KEYS only** (NOT namespaced). Inside `visualizations.viz_<name>.options`, use bare key names like `"field": "value"`, NEVER `"<app_id>.<viz_name>.field": "value"`. Dashboard Studio automatically prefixes the namespace when passing options to `updateView` — providing full-namespace keys breaks binding.

> **vs. Classic Simple XML:** SXML `<option name>` uses the LONG form `display.visualizations.custom.<app_id>.<viz_name>.<key>` (see splunk-viz-canon.md), while DS dashboard JSON uses the SHORT bare key here. A viz that must run under both reads all three forms via the `getOption` 3-way probe (diagnostic-rules.md B3).

## Critical Dashboard Studio v2 rules

- Visualization types use `<app_id>.<viz_name>` format — NEVER `viz.custom.*`, NEVER `splunk.custom.*`, NEVER `"custom"` + `customVizId`
- Every panel item in `layout.structure` MUST have a matching key in `visualizations`
- Every `dataSources.primary` in a viz MUST reference an existing dataSource
- Tokens use `$token_name$` syntax
- `type: "block"` for all items in `structure`
- Inputs go in `layout.globalInputs` (array of input IDs), NOT in `layout.structure`
- XML wrapper's `theme` attribute MUST match `applicationProperties.theme`

## Drilldown wiring (REQUIRED for every interactive viz)

For each viz with clickable elements, add BOTH:

1. `"drilldown": "all"` inside the viz's `options` block
2. An `eventHandlers` array with `drilldown.setToken` mapping `click.value` to a named token
3. A corresponding `defaults.tokens.default` entry with value `"*"` so the dashboard works before any click

```json
"viz_lap_delta_board": {
  "type": "redbull_racing_viz.lap_delta_board",
  "options": {
    "drilldown": "all"
  },
  "eventHandlers": [
    {
      "type": "drilldown.setToken",
      "options": {
        "tokens": [
          { "token": "selected_driver", "key": "row.driver.value" }
        ]
      }
    }
  ]
},
```

Add to `defaults`:
```json
"defaults": {
  "tokens": {
    "default": {
      "selected_driver": { "value": "*" }
    }
  }
}
```

### CRITICAL — token default MUST be an object, not a bare string

Dashboard Studio v2's schema requires every entry in `defaults.tokens.default` to be a JSON object with at least a `value` field. The bare-string form (`"selected_driver": "*"`) is rejected with a schema error visible only in the browser console:

```
/defaults/tokens/default/selected_driver: must be object
```

Symptoms in production: dashboard either fails to load entirely, shows a Splunk fallback error, or silently clamps tokens depending on Splunk version. Users report "the drilldowns don't seem to work" with no clear failure mode.

The bare-string form has shipped in multiple test packs (WWF Field Ops, 2026-05-25). `validate.sh` now FAILS any dashboard XML containing `"selected_*":"*"` or similar bare-string token defaults. Always use the object form: `{ "value": "*" }`.

## Tabbed layout (if `dashboard.tabs` is non-empty)

For packs with 7+ vizs OR explicit tab configuration:

```json
"layout": {
  "type": "tabs",
  "options": {
    "tabBar": { "position": "top" }
  },
  "tabs": [
    {
      "label": "RACE CONTROL",
      "layoutId": "layout_race_control"
    },
    {
      "label": "PIT WALL",
      "layoutId": "layout_pit_wall"
    }
  ],
  "layoutDefinitions": [
    {
      "id": "layout_race_control",
      "type": "absolute",
      "options": { "width": 1920, "height": 1080 },
      "structure": [ /* panels for tab 1 */ ]
    },
    {
      "id": "layout_pit_wall",
      "type": "absolute",
      "options": { "width": 1920, "height": 1080 },
      "structure": [ /* panels for tab 2 */ ]
    }
  ]
}
```

## Nav bar update

After writing the dashboard XML, update `default/data/ui/nav/default.xml`:

```xml
<nav search_view="search" color="<global.brand.accent>">
  <view name="<app_id>_overview" default="true" />
  <view name="search" />
</nav>
```

## Validation after writing

- Parse the XML to confirm it's well-formed
- Extract the JSON from CDATA and parse it
- Verify panel count == viz directory count (every viz dir has a panel; no missing references)
- Verify every panel's `item` is in `visualizations`
- Verify every dataSource referenced by a viz exists in `dataSources`

If any check fails, report and stop. Do not package an invalid dashboard.
