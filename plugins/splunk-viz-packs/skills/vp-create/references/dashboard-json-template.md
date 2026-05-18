# Dashboard JSON Template for Viz Packs

Exact JSON structure for Dashboard Studio v2 dashboards in custom viz packs.
Use this as a skeleton — fill in dataSources, visualizations, and structure items.

## XML Wrapper (the file you write)

```xml
<dashboard version="2" theme="dark">
  <label>{{DASHBOARD_TITLE}}</label>
  <description>{{ONE_LINE_DESCRIPTION}}</description>
  <definition><![CDATA[
{{JSON_DEFINITION}}
]]></definition>
</dashboard>
```

Save to: `default/data/ui/views/{{view_name}}.xml`

## JSON Definition (the content inside CDATA)

### Simple layout (no tabs) — use for 4-6 vizs

```json
{
  "dataSources": {
    "ds_viz_name": {
      "type": "ds.search",
      "options": {
        "query": "| inputlookup {{app_id}}_demo_data.csv"
      },
      "name": "Descriptive Name"
    }
  },
  "visualizations": {
    "viz_bg_gradient": {
      "type": "splunk.image",
      "options": { "src": "/static/app/{{APP_ID}}/images/bg_gradient.png", "preserveAspectRatio": false }
    },
    "viz_depth_overlay": {
      "type": "splunk.rectangle",
      "options": { "fillColor": "rgba(0,0,0,0.35)" }
    },
    "viz_title": {
      "type": "splunk.markdown",
      "options": { "markdown": "# {{BRAND_NAME}} Overview" }
    },
    "viz_kpi_hero": {
      "type": "{{APP_ID}}.{{viz_name}}",
      "options": {},
      "dataSources": { "primary": "ds_viz_name" }
    }
  },
  "defaults": {},
  "inputs": {},
  "layout": {
    "type": "absolute",
    "options": {
      "width": 1920,
      "height": 1080,
      "backgroundColor": "#0D0F14"
    },
    "structure": [
      { "item": "viz_bg_gradient", "type": "block", "position": { "x": 0, "y": 0, "w": 1920, "h": 1080 } },
      { "item": "viz_depth_overlay", "type": "block", "position": { "x": 0, "y": 0, "w": 1920, "h": 1080 } },
      { "item": "viz_title", "type": "block", "position": { "x": 20, "y": 20, "w": 1000, "h": 60 } },
      {
        "item": "viz_kpi_hero",
        "type": "block",
        "position": { "x": 20, "y": 100, "w": 600, "h": 200 }
      }
    ]
  }
}
```

### Tabbed layout — use for 7+ vizs

```json
{
  "dataSources": { },
  "visualizations": {
    "viz_bg_gradient": {
      "type": "splunk.image",
      "options": { "src": "/static/app/{{APP_ID}}/images/bg_gradient.png", "preserveAspectRatio": false }
    },
    "viz_depth_overlay": {
      "type": "splunk.rectangle",
      "options": { "fillColor": "rgba(0,0,0,0.35)" }
    },
    "viz_title": {
      "type": "splunk.markdown",
      "options": { "markdown": "# {{BRAND_NAME}} Overview" }
    }
  },
  "defaults": {},
  "inputs": {
    "input_time": {
      "type": "input.timerange",
      "options": { "token": "time_tok", "defaultValue": "-24h@h,now" }
    }
  },
  "layout": {
    "globalInputs": ["input_time"],
    "tabs": {
      "items": [
        { "layoutId": "tab_overview", "label": "Overview" },
        { "layoutId": "tab_detail", "label": "Detail" }
      ],
      "options": { "barPosition": "top", "showTabBar": true }
    },
    "layoutDefinitions": {
      "tab_overview": {
        "type": "absolute",
        "options": { "width": 1920, "height": 1080, "backgroundColor": "#0D0F14" },
        "structure": [
          { "item": "viz_bg_gradient", "type": "block", "position": { "x": 0, "y": 0, "w": 1920, "h": 1080 } },
          { "item": "viz_depth_overlay", "type": "block", "position": { "x": 0, "y": 0, "w": 1920, "h": 1080 } },
          { "item": "viz_title", "type": "block", "position": { "x": 20, "y": 20, "w": 1000, "h": 60 } }
        ]
      },
      "tab_detail": {
        "type": "absolute",
        "options": { "width": 1920, "height": 1080, "backgroundColor": "#0D0F14" },
        "structure": [
          { "item": "viz_bg_gradient", "type": "block", "position": { "x": 0, "y": 0, "w": 1920, "h": 1080 } },
          { "item": "viz_depth_overlay", "type": "block", "position": { "x": 0, "y": 0, "w": 1920, "h": 1080 } },
          { "item": "viz_title", "type": "block", "position": { "x": 20, "y": 20, "w": 1000, "h": 60 } }
        ]
      }
    }
  }
}
```

## WRONG patterns (cause schema errors)

```
WRONG: "layoutDefinitions": [...]         ← MUST be object, not array
WRONG: "tabs": [...]                      ← MUST be object with items + options
WRONG: "tabs": { "items": ["tab1"] }     ← items MUST be objects: [{"layoutId":"tab1","label":"Tab 1"}]
WRONG: "tabBarPosition": "top"            ← MUST be "barPosition" (no "tab" prefix) + "showTabBar": true
WRONG: "label" inside layoutDefinitions   ← labels go on tabs.items objects ONLY
WRONG: "layout": { "type": "absolute", "tabs": {...} }  ← tabs and type are SIBLINGS, not nested
WRONG: "type": "custom"                   ← use "{{app_id}}.{{viz_name}}" directly
WRONG: "options": { "valueField": "x" }   ← use "{{app_id}}.{{viz_name}}.valueField": "x"
WRONG: no splunk.image with bg_gradient in id or src  ← DS3 FAIL — mandatory background (D-03)
WRONG: background image present but no splunk.rectangle depth overlay  ← DQ-02 requires visually dramatic depth layers, not a flat background
WRONG: no splunk.markdown title panel at y <= 200  ← DS4 FAIL (D-05)
```

## Viz type format

```
RIGHT: "type": "cloudflare_soc_viz.kpi_tile"
WRONG: "type": "custom"
WRONG: "type": "custom.cloudflare_soc_viz.kpi_tile"
WRONG: "type": "splunk.custom.cloudflare_soc_viz.kpi_tile"
```

## Data sources

- Use `inputlookup` with CSV lookups (NOT makeresults — makeresults produces identical data every load)
- Every ds.search MUST have a `"name"` field
- CSV files go in `lookups/` directory, named `{{app_id}}_demo_*.csv`

## Structure items order (z-order)

Items render in array order — first item is bottom layer:

1. `splunk.image` (id: `viz_bg_gradient`) — bg_gradient.png at x:0 y:0 w:1920 h:1080 (mandatory, per D-03)
   + `splunk.rectangle` (id: `viz_depth_overlay`) — semi-transparent overlay at same canvas size, fillColor rgba(0,0,0,~0.35) (creates depth, per DQ-02)
2. `splunk.rectangle` — depth cards behind panel groups
3. `splunk.markdown` — section headers and title (viz_title at y <= 200)
4. Custom viz panels — the actual data visualizations

## Panel count rule

The dashboard MUST include one panel per viz type in the pack. A pack with 6 vizs must have at least 6 custom viz panels (KPI tiles can be reused for multiple metrics).

Verify: count of `{{app_id}}.*` types in visualizations == count of directories in `appserver/static/visualizations/`
