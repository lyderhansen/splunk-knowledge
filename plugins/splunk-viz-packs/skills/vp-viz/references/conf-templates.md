# Conf File Templates

Copy these exactly, replacing `{{PLACEHOLDER}}` values.

## app.conf

```ini
[install]
is_configured = 0
build = 1

[id]
name = {{PACK_ID}}

[package]
id = {{PACK_ID}}
check_for_updates = false

[ui]
is_visible = true
label = {{PACK_LABEL}}

[launcher]
author = {{AUTHOR}}
description = {{DESCRIPTION}}
version = 1.0.0
```

## visualizations.conf

One stanza per viz. `allow_user_selection` and `disabled = 0` are CRITICAL for ad-hoc search.

```ini
[{{VIZ_NAME}}]
label = {{LABEL_30}}
description = {{DESC_80}}
default_height = {{HEIGHT}}
allow_user_selection = true
disabled = 0
search_fragment = {{FRAGMENT_80}}

> **Data contract:** `search_fragment` MUST contain a realistic SPL shape showing the expected
> columns by name — e.g. `| table rank, driver, team, points, delta` or
> `| stats count by host status`. This is the user-facing contract: users know exactly what
> columns to provide from their search. Do NOT leave `{{FRAGMENT_80}}` as a bare placeholder;
> replace it with an example `| table ...` or `| stats ...` matching the viz's Expected columns
> (see viz-blueprints.md).

supports_drilldown = true
supports_trellis = true
```

> **supports_trellis note:** Setting this flag makes the Trellis UI option appear in Splunk.
> Trellis internal rendering in Canvas vizs is deferred — users enabling trellis will see
> repeated panels, not field-split panels. Flag is set for future compatibility only.

## default.meta

```ini
[]
access = read : [ * ], write : [ admin, sc_admin ]
export = system

[visualizations/{{VIZ_1}}]
export = system

[lookups]
export = system
```

One `[visualizations/name]` stanza per viz.

## transforms.conf

```ini
[{{PACK_ID}}_demo_kpis]
filename = {{PACK_ID}}_demo_kpis.csv

[{{PACK_ID}}_demo_table]
filename = {{PACK_ID}}_demo_table.csv
```

CRITICAL: `inputlookup` uses the FILENAME, not the stanza name. Prefix all filenames with `{{PACK_ID}}_`.

## savedsearches.conf

```ini
[{{DISPLAY_LABEL}} - Demo]
search = | inputlookup {{PACK_ID}}_demo_kpis.csv
dispatch.earliest_time = -24h
dispatch.latest_time = now
display.general.type = visualizations
display.visualizations.type = custom
display.visualizations.custom.type = {{PACK_ID}}.{{VIZ_NAME}}
```

**CRITICAL: Dashboard/saved search type format:**
```
WRONG: custom.myapp.myviz
WRONG: splunk.custom.myapp.myviz
WRONG: visualizations.custom.myapp.myviz
RIGHT: myapp.myviz
```

The format is EXACTLY `{app_id}.{viz_name}`. No prefix.

```ini
display.visualizations.custom.type = {{PACK_ID}}.{{VIZ_NAME}}
display.visualizations.custom.{{PACK_ID}}.{{VIZ_NAME}}.{{SETTING}} = {{DEFAULT}}
```

## Dashboard Studio JSON — viz options

When embedding a custom viz in a Dashboard Studio v2 dashboard JSON, ALL option keys MUST be namespaced:

```json
{
    "type": "{{PACK_ID}}.{{VIZ_NAME}}",
    "dataSources": { "primary": "ds_demo" },
    "options": {
        "{{PACK_ID}}.{{VIZ_NAME}}.scoreField": "score",
        "{{PACK_ID}}.{{VIZ_NAME}}.labelField": "label",
        "{{PACK_ID}}.{{VIZ_NAME}}.accentColor": "#0077B6",
        "{{PACK_ID}}.{{VIZ_NAME}}.themeMode": "auto"
    }
}
```

```
WRONG — bare keys (never reach the viz):
"options": { "scoreField": "score" }

WRONG — custom.* prefix on type:
"type": "custom.{{PACK_ID}}.{{VIZ_NAME}}"

RIGHT — namespaced keys + bare type:
"type": "{{PACK_ID}}.{{VIZ_NAME}}",
"options": { "{{PACK_ID}}.{{VIZ_NAME}}.scoreField": "score" }
```

**Dashboard options = ONLY overrides.** The formatter `value=` attribute
is the single source of truth for defaults. The JS `opt()` fallback
matches those defaults. Dashboard JSON should NEVER repeat them.

```json
WRONG — duplicates every formatter default (cluttered, fragile):
"options": {
    "myapp.myviz.field": "value",
    "myapp.myviz.themeMode": "auto",
    "myapp.myviz.accentIntensity": "50",
    "myapp.myviz.showTarget": "true"
}

RIGHT — only settings that differ from formatter defaults:
"options": {
    "myapp.myviz.accentColor": "#FF6600"
}

RIGHT — all defaults, nothing to override:
"options": {}
```

If a setting matches the formatter `value=` default, omit it from
dashboard JSON. This keeps the JSON clean and ensures the formatter
is the single source of truth.

Dashboard data sources MUST have a `"name"` field:
```json
WRONG: { "type": "ds.search", "options": { "query": "..." } }
RIGHT: { "type": "ds.search", "options": { "query": "..." }, "name": "NPS Demo Data" }
```

## Dashboard Studio XML wrapper

Dashboard JSON is embedded in XML CDATA. Save to `default/data/ui/views/`:

```xml
<dashboard version="2" theme="dark">
  <label>{{DASHBOARD_TITLE}}</label>
  <description>{{DESCRIPTION}}</description>
  <definition><![CDATA[
{
  "dataSources": { ... },
  "visualizations": { ... },
  "defaults": { ... },
  "inputs": { ... },
  "layout": { ... }
}
  ]]></definition>
</dashboard>
```

Use `theme="dark"` or `theme="light"`. The JSON inside CDATA is the full Dashboard Studio v2 definition.

## README/savedsearches.conf.spec

Document every custom setting:
```
display.visualizations.custom.{{PACK_ID}}.{{VIZ_NAME}}.{{SETTING}} = <type>
```

Valid types: `<integer>`, `<float>`, `<string>`, `<boolean>`

## Directory structure

```
{{PACK_ID}}/
  default/
    app.conf
    visualizations.conf
    transforms.conf
    savedsearches.conf
    data/ui/nav/default.xml
    data/ui/views/
  lookups/
    {{PACK_ID}}_demo_kpis.csv
  metadata/
    default.meta
  README/
    savedsearches.conf.spec
  static/
    appIcon.png (36x36)
    appIcon_2x.png (72x72)
  shared/
    theme.js
  appserver/static/
    images/
    visualizations/
      {{VIZ_1}}/
        src/visualization_source.js
        formatter.html
        visualization.css
        preview.png
```
