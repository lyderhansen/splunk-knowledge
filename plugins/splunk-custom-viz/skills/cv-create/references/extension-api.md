# Extension API branch — ESM patterns

When `DESIGN-LOCK.md.project.format` is `extension` or `both`, cv-create generates an additional Extension API version of each viz alongside the Classic AMD version. This file documents the ESM-specific patterns.

## When this branch fires

- `project.format == "extension"` → ONLY emit Extension API output (no Classic)
- `project.format == "both"` → emit BOTH Classic and Extension API outputs side by side
- `project.format == "classic"` → skip this branch entirely

## Output files (per viz)

In addition to (or instead of) the Classic files:

```
<app_id>/
└── appserver/static/visualizations/<viz_name>/
    ├── src/visualization.js     ← ESM source (NOT visualization_source.js)
    ├── config.json              ← optionsSchema + editorConfig
    └── package.json             ← scaffolded for yarn build
```

## ESM viz template

```javascript
// visualization.js — Extension API ESM source
// Imports from Splunk's Extension API runtime.

import {
    addDataSourcesListener,
    addThemeListener,
    addDrilldownListener,
    triggerDrilldown
} from '@splunk/visualizations-shared';

import { getTheme, FONTS } from '../../../shared/theme.js';

// (helpers safeStr, safeNum, getOption — copied from boilerplate)

export default class <PascalCaseVizName> {
    constructor(el, options) {
        this.el = el;
        this.options = options;
        this._setupCanvas();
        this._wireListeners();
    }

    _setupCanvas() {
        // (same as Classic initialize)
    }

    _wireListeners() {
        addDataSourcesListener((dataSources) => {
            this._dataSources = dataSources;
            this._render();
        });
        addThemeListener((mode) => {
            this._themeMode = mode;
            this._render();
        });
    }

    _render() {
        // Columnar data access — DIFFERENT from Classic row-major.
        const ds = this._dataSources?.primary;
        if (!ds || ds.loading || !ds.data) return;
        const { fields, columns } = ds.data;
        // ...
        const isDark = this._themeMode === 'dark';
        if (isDark) { this._renderDark(ctx, ...); }
        else        { this._renderLight(ctx, ...); }
    }

    // _renderDark, _renderLight — IDENTICAL CONTENT to Classic version
    // (same visual_reference_html → same Canvas calls)
    _renderDark(ctx, /* ... */) { /* ... */ }
    _renderLight(ctx, /* ... */) { /* ... */ }

    _onClick(e) {
        // Extension API drilldown:
        triggerDrilldown({
            payload: { /* field-value mapping */ },
            event: e
        });
    }
}
```

## config.json template

```json
{
  "name": "<viz_name>",
  "displayName": "<Human Readable Name>",
  "version": "1.0.0",
  "optionsSchema": {
    "themeMode": {
      "type": "string",
      "enum": ["auto", "dark", "light"],
      "default": "auto"
    },
    "title": {
      "type": "string",
      "default": ""
    },
    "<key>": {
      "type": "<string|number|boolean>",
      "default": "<default>",
      "description": "<help text>"
    }
    // ... one entry per formatter control
  },
  "editorConfig": {
    "groups": [
      {
        "label": "Data display",
        "fields": ["title", "<other keys>"]
      },
      {
        "label": "Color and style",
        "fields": ["themeMode", "<color keys>"]
      },
      {
        "label": "Effects",
        "fields": ["<effect toggle keys>"]
      }
    ]
  },
  "dataContract": {
    "primary": {
      "required": ["<field1>"],
      "optional": ["<field2>"]
    }
  },
  "showDrilldown": true,
  "hasEventHandlers": true,
  "canSetTokens": true
}
```

Every key in `optionsSchema` MUST appear in `editorConfig.groups[].fields` — otherwise it's invisible in the Dashboard Studio editor.

## package.json template (scaffold for yarn build)

```json
{
  "name": "<app_id>-<viz_name>",
  "version": "1.0.0",
  "main": "src/visualization.js",
  "type": "module",
  "scripts": {
    "build": "echo 'ESM source is the build output — no bundler step needed'",
    "package": "echo 'Run yarn package at app root, not per-viz'"
  }
}
```

## Critical differences from Classic

| Aspect | Classic | Extension API |
|---|---|---|
| Module syntax | AMD `define([...], function(...) {})` | ESM `import` / `export default class` |
| Source filename | `src/visualization_source.js` | `src/visualization.js` |
| Build step | `build_flat.js` inlines theme.js | `yarn build` (per-viz package.json) |
| Data access | `formatData(data)` row-major | `addDataSourcesListener` columnar (values are strings, parse with `Number()`) |
| Theme detection | `SplunkVisualizationUtils.getCurrentTheme()` | `addThemeListener(callback)` |
| Drilldown | `this.drilldown({ action, data })` | `triggerDrilldown({ payload, event })` |
| Formatter | `formatter.html` with `<splunk-*>` Web Components | `config.json` with `optionsSchema` + `editorConfig` |
| Namespace | `{{VIZ_NAMESPACE}}.<key>` in formatter, namespaced keys in dashboard JSON | Bare key names in config.json AND dashboard JSON |
| Package output | `.tar.gz` via `tar` | `.spl` via `yarn package` |

## Same content, different syntax

The most important insight: `_renderDark` and `_renderLight` functions have IDENTICAL CONTENT in both formats. The CSS-to-Canvas translation is the same. Only the module wrapper, data access, and drilldown wiring differ.

This is why `project.format == "both"` works: cv-create writes the same render functions twice, once with AMD glue, once with ESM glue.

## When to recommend "both" vs single-format

- Single-tenant Splunk Cloud, modern (10.4+) → recommend `extension` for future-proofing
- Older Splunk Enterprise, mixed environments → recommend `classic`
- App is shared across multiple environments → recommend `both`

In the cv-scope question 3, the default is `classic` because it works everywhere. Users on bleeding-edge Splunk can opt into `extension` or `both`.

## What NOT to do

- ❌ Do not invent visuals for Extension API. The visual contract is the same — only the glue differs.
- ❌ Do not skip the columnar data parsing — Extension API delivers all values as strings; `parseFloat` / `Number()` is required for numerics.
- ❌ Do not omit `showDrilldown` / `hasEventHandlers` / `canSetTokens` in config.json if the viz supports them — Dashboard Studio uses these flags to decide whether to wire interaction.
