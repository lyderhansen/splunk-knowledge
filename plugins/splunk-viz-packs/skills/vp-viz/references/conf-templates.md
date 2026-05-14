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
```

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
display.visualizations.custom.{{PACK_ID}}.{{VIZ_NAME}}.{{SETTING}} = {{DEFAULT}}
```

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
