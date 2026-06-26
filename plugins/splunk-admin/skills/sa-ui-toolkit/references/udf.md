# Unified Dashboard Framework (UDF) — Reference

## Dashboard JSON schema

```json
{
  "title": "string",
  "description": "string",
  "inputs":               {},  // interactive controls
  "defaults":             {},  // global options applied to all dataSources / vizs
  "dataSources":          {},  // SPL searches and chain searches
  "visualizations":       {},  // chart/viz instances
  "layout":               {},  // canvas layout (absolute or grid)
  "expressions":          {},  // panel visibility conditions
  "applicationProperties":{}   // theme, background
}
```

---

## dataSources

### ds.search — run a SPL query

```json
"ds_search_1": {
  "type": "ds.search",
  "name": "Search 1",
  "options": {
    "query": "index=_internal | stats count by sourcetype",
    "queryParameters": {
      "earliest": "$global_time.earliest$",
      "latest": "$global_time.latest$"
    }
  }
}
```

### ds.chain — chain off an existing search result

```json
"ds_chain_1": {
  "type": "ds.chain",
  "options": {
    "extend": "ds_search_1",
    "query": "| head 10"
  }
}
```

### ds.test — static mock data (good for dev/testing)

```json
"ds_test_1": {
  "type": "ds.test",
  "options": {
    "data": {
      "fields": [{"name": "host"}, {"name": "count"}],
      "columns": [["web01","web02"], ["120","85"]]
    }
  }
}
```

---

## visualizations

Each viz has a `type`, a `dataSources` map, and `options`.

Built-in viz types: `splunk.line`, `splunk.column`, `splunk.bar`, `splunk.area`,
`splunk.pie`, `splunk.scatter`, `splunk.bubble`, `splunk.singlevalue`,
`splunk.singlevalueradial`, `splunk.table`, `splunk.choropleth`,
`splunk.punchcard`, `splunk.fillerGauge`, `splunk.markerGauge`, `splunk.parallelcoordinates`

```json
"viz_line_1": {
  "type": "splunk.line",
  "title": "Events over time",
  "dataSources": { "primary": "ds_search_1" },
  "options": {
    "xAxisTitleText": "Time",
    "yAxisTitleText": "Count",
    "legendDisplay": "bottom",
    "showProgressBar": false,
    "showLastUpdated": false
  }
}
```

### containerOptions — visibility conditions

```json
"viz_line_1": {
  "type": "splunk.line",
  "dataSources": { "primary": "ds_search_1" },
  "containerOptions": {
    "visibility": {
      "showConditions": ["condition_spike"],
      "hideConditions": ["condition_empty"]
    }
  },
  "options": {}
}
```

---

## inputs

### Time range picker

```json
"input_time": {
  "type": "input.timerange",
  "title": "Global Time Range",
  "options": {
    "token": "global_time",
    "defaultValue": "-24h@h,now"
  }
}
```

### Dropdown (static)

```json
"input_env": {
  "type": "input.dropdown",
  "title": "Environment",
  "options": {
    "token": "env",
    "defaultValue": "prod",
    "items": [
      {"label": "Production", "value": "prod"},
      {"label": "Staging",    "value": "staging"}
    ]
  }
}
```

### Dropdown (dynamic — populated from a search)

```json
"input_host": {
  "type": "input.dropdown",
  "title": "Host",
  "options": {
    "token": "selected_host",
    "defaultValue": "*"
  },
  "dataSources": { "primary": "ds_hosts" },
  "encoding": {
    "label": "primary[0]",
    "value": "primary[0]"
  }
}
```

### Multiselect

```json
"input_status": {
  "type": "input.multiselect",
  "title": "Status",
  "options": {
    "token": "status",
    "defaultValue": ["200"],
    "delimiter": ",",
    "items": [
      {"label": "200 OK",       "value": "200"},
      {"label": "404 Not Found","value": "404"},
      {"label": "500 Error",    "value": "500"}
    ]
  }
}
```

### Text input

```json
"input_search": {
  "type": "input.text",
  "title": "Search term",
  "options": {
    "token": "search_term",
    "defaultValue": "*"
  }
}
```

Register inputs in layout under `globalInputs`:
```json
"layout": {
  "type": "absolute",
  "options": {},
  "globalInputs": ["input_time", "input_env"],
  "structure": [...]
}
```

---

## Tokens

Tokens use `$tokenName$` syntax in strings:

```json
"query": "index=web env=$env$ | stats count by status"
```

Sub-fields for structured tokens (e.g. time range):
```json
"queryParameters": {
  "earliest": "$global_time.earliest$",
  "latest":   "$global_time.latest$"
}
```

Set default token values in `defaults`:
```json
"defaults": {
  "tokens": {
    "default": {
      "env": { "value": "prod" }
    }
  }
}
```

### Drilldown — set token on click

```json
"viz_column_1": {
  "type": "splunk.column",
  "dataSources": { "primary": "ds_search_1" },
  "eventHandlers": [
    {
      "type": "drilldown.setToken",
      "options": {
        "tokens": [
          { "token": "selected_host", "key": "row.host.value" }
        ]
      }
    }
  ]
}
```

Available drilldown keys: `row.<field>.value`, `name`, `value`, `x`, `y`.

### Drilldown — navigate to URL

```json
"eventHandlers": [
  {
    "type": "drilldown.linkTo",
    "options": {
      "link": {
        "type": "url",
        "url": "https://example.com?host=$selected_host$"
      }
    }
  }
]
```

---

## Layout

### Absolute layout

```json
"layout": {
  "type": "absolute",
  "options": {
    "width": 1440,
    "height": 960,
    "display": "auto-scale"
  },
  "globalInputs": ["input_time"],
  "structure": [
    {
      "item": "viz_line_1",
      "position": { "x": 0, "y": 0, "w": 720, "h": 300 }
    },
    {
      "item": "viz_pie_1",
      "position": { "x": 720, "y": 0, "w": 720, "h": 300 }
    }
  ]
}
```

### Grid layout

```json
"layout": {
  "type": "grid",
  "options": {},
  "globalInputs": ["input_time"],
  "structure": [
    {
      "item": "viz_line_1",
      "position": { "x": 0, "y": 0, "w": 6, "h": 4 }
    }
  ]
}
```

Grid columns: 0–11 (12-column grid). Height is in grid rows.

---

## defaults

Apply settings to all data sources or vizs of a given type:

```json
"defaults": {
  "dataSources": {
    "ds.search": {
      "options": {
        "queryParameters": {
          "earliest": "$global_time.earliest$",
          "latest":   "$global_time.latest$"
        }
      }
    }
  },
  "visualizations": {
    "splunk.line": {
      "options": {
        "showProgressBar": false,
        "showLastUpdated": false
      }
    }
  }
}
```

---

## expressions — conditional visibility

```json
"expressions": {
  "conditions": {
    "condition_has_results": {
      "name": "Has results",
      "value": "$ds_search_1:result.count$ > 0"
    },
    "condition_prod": {
      "name": "Is production",
      "value": "$env$ == \"prod\""
    }
  }
}
```

Then reference in `containerOptions.visibility` on the viz.

---

## applicationProperties — theming

```json
"applicationProperties": {
  "background": {
    "type": "solid",
    "color": "#1a1a2e"
  },
  "theme": "dark"
}
```

---

## Handling events in React (outside JSON)

When using `DashboardCore` in React you can intercept dashboard events:

```jsx
const handleEvent = ({ type, targetId, originalEvent }) => {
  if (type === 'value.click') {
    originalEvent.preventDefault();
    // do something custom
  }
};

<DashboardCore
  width="100%"
  height="100%"
  onEventTrigger={handleEvent}
/>
```

---

## Full worked example — line chart with time range and drilldown

```json
{
  "title": "HTTP Request Monitor",
  "description": "Monitor request methods and status codes",
  "inputs": {
    "input_time": {
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
    "ds_methods": {
      "type": "ds.search",
      "name": "Request Methods",
      "options": {
        "query": "index=_internal | stats count by method"
      }
    },
    "ds_status": {
      "type": "ds.search",
      "name": "Status Codes",
      "options": {
        "query": "index=_internal method=$selected_method$ | stats count by status"
      }
    }
  },
  "visualizations": {
    "viz_methods": {
      "type": "splunk.column",
      "title": "Request Methods",
      "dataSources": { "primary": "ds_methods" },
      "eventHandlers": [
        {
          "type": "drilldown.setToken",
          "options": {
            "tokens": [
              { "token": "selected_method", "key": "row.method.value" }
            ]
          }
        }
      ]
    },
    "viz_status": {
      "type": "splunk.pie",
      "title": "Status Codes for $selected_method$",
      "dataSources": { "primary": "ds_status" }
    }
  },
  "layout": {
    "type": "absolute",
    "options": { "width": 1440, "height": 600 },
    "globalInputs": ["input_time"],
    "structure": [
      { "item": "viz_methods", "position": { "x": 0,   "y": 0, "w": 720, "h": 400 } },
      { "item": "viz_status",  "position": { "x": 720, "y": 0, "w": 720, "h": 400 } }
    ]
  }
}
```
