# Custom Visualizations — Reference

## When to build a custom viz

- Built-in Splunk viz types don't cover the chart/diagram you need
- You want to embed a 3rd-party React chart library (Recharts, D3, Plotly, etc.)
- You need custom interaction logic (popups, drill-to-modal, animated transitions)
- You're extending Dashboard Studio via `--mode=dashboard-studio-extension`

---

## Two paths for custom viz

| Path | Use case |
|---|---|
| **SUIT React page** | Full control; custom preset; no Dashboard Studio editor |
| **Dashboard Studio Extension** | Scaffolded `.spl` package; works in Studio UI; limited to one viz type per package |

---

## Path 1 — Custom viz in a SUIT React page

### 1. Scaffold the viz package

```bash
# Inside your @splunk/create monorepo
cd packages
npx @splunk/create   # choose "React Component"
# → creates packages/my-custom-chart/
```

### 2. Write the viz component

```jsx
// packages/my-custom-chart/src/MyCustomChart.jsx
import React from 'react';

/**
 * data: { fields: [{name}], columns: [[values]] }
 * options: whatever the dashboard JSON 'options' object contains
 */
const MyCustomChart = ({ dataSources, options = {} }) => {
  // dataSources.primary is a DataSource object — subscribe to it
  const [vizData, setVizData] = React.useState(null);

  React.useEffect(() => {
    if (!dataSources?.primary) return;
    const sub = dataSources.primary.subscribe(({ data, error }) => {
      if (data) setVizData(data);
    });
    return () => sub.unsubscribe();
  }, [dataSources]);

  if (!vizData) return <div>Loading…</div>;

  const { fields, columns } = vizData;
  // columns[i] = array of values for fields[i]

  return (
    <div style={{ color: options.textColor || '#ffffff' }}>
      {/* your rendering logic */}
    </div>
  );
};

// Static config tells Dashboard Framework about this viz
MyCustomChart.config = {
  optionsSchema: {
    textColor: {
      type: 'string',
      default: '#ffffff',
      description: 'Label colour',
    },
  },
  dataContract: {
    requiredDataSources: [
      { name: 'primary', description: 'Primary data' },
    ],
    initialRequestParams: {
      count: 50000,
      output_mode: 'json_cols',
    },
  },
  size: {
    defaultWidth: 400,
    defaultHeight: 300,
    minWidth: 200,
    minHeight: 150,
  },
  events: {},
};

export default MyCustomChart;
```

### 3. Register in a custom preset

```js
// DashboardExample.jsx
import EnterpriseViewOnlyPreset from '@splunk/dashboard-presets/EnterpriseViewOnlyPreset';
import MyCustomChart from '@splunk/my-custom-chart';

const customPreset = {
  ...EnterpriseViewOnlyPreset,
  visualizations: {
    ...EnterpriseViewOnlyPreset.visualizations,
    'splunk.MyCustomChart': MyCustomChart, // must start with 'splunk.'
  },
};
```

### 4. Reference in dashboard JSON

```json
"visualizations": {
  "viz_custom_1": {
    "type": "splunk.MyCustomChart",
    "title": "My Chart",
    "dataSources": { "primary": "ds_search_1" },
    "options": {
      "textColor": "#00ff00"
    }
  }
}
```

---

## Path 2 — Dashboard Studio Extension

Produces an installable `.spl` that adds the viz to the Studio catalog.

```bash
npx @splunk/create --mode=dashboard-studio-extension
# → prompts: project name, viz name, template (table or basic)

# Build
cd my-ext-project && yarn build

# Package
yarn package   # → my-ext-project.spl
```

Install the `.spl` in Splunk → the viz appears in Studio's viz picker.

Project layout after scaffolding:
```
my-ext-project/
├── packages/
│   └── my-viz/
│       ├── src/
│       │   ├── MyViz.jsx          ← your component
│       │   ├── MyViz.config.js    ← metadata for Studio
│       │   └── index.js
│       └── package.json
└── package.json
```

`MyViz.config.js` structure:
```js
export default {
  id: 'my_org.my_viz',          // unique ID registered in Studio
  name: 'My Custom Viz',
  icon: MyVizIcon,              // SVG component
  placeholderData: { ... },     // sample data shown in empty state
  optionsSchema: { ... },       // JSON Schema describing supported options
  dataContract: {
    initialRequestParams: { count: 10000, output_mode: 'json_cols' },
    requiredDataSources: [{ name: 'primary', description: 'Primary' }],
  },
};
```

---

## Embedding 3rd-party React charts

Pattern: wrap the 3rd-party component and adapt `vizData` to its props.

```jsx
// Example: Recharts inside a Splunk custom viz
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

const RechartsBar = ({ dataSources }) => {
  const [chartData, setChartData] = React.useState([]);

  React.useEffect(() => {
    if (!dataSources?.primary) return;
    const sub = dataSources.primary.subscribe(({ data }) => {
      if (!data) return;
      const { fields, columns } = data;
      const nameIdx = fields.findIndex(f => f.name === 'category');
      const valIdx  = fields.findIndex(f => f.name === 'count');
      setChartData(
        columns[nameIdx].map((cat, i) => ({
          category: cat,
          count: Number(columns[valIdx][i]),
        }))
      );
    });
    return () => sub.unsubscribe();
  }, [dataSources]);

  return (
    <BarChart width={500} height={300} data={chartData}>
      <XAxis dataKey="category" />
      <YAxis />
      <Tooltip />
      <Bar dataKey="count" fill="#8884d8" />
    </BarChart>
  );
};

RechartsBar.config = {
  dataContract: {
    requiredDataSources: [{ name: 'primary', description: 'Category counts' }],
    initialRequestParams: { count: 1000, output_mode: 'json_cols' },
  },
  size: { defaultWidth: 500, defaultHeight: 300 },
  optionsSchema: {},
  events: {},
};

export default RechartsBar;
```

---

## Accessing data in `json_cols` format

`output_mode: 'json_cols'` (recommended) gives:
```js
{
  fields: [{ name: 'host' }, { name: 'count' }],
  columns: [
    ['web01', 'web02', 'db01'],   // values for fields[0]
    ['120',   '85',    '40'],     // values for fields[1]
  ]
}
```

Convert to row objects:
```js
const rows = columns[0].map((_, i) =>
  Object.fromEntries(fields.map((f, j) => [f.name, columns[j][i]]))
);
// → [{ host: 'web01', count: '120' }, ...]
```

---

## Emitting events (drilldown from custom viz)

```jsx
import { useDashboardApi } from '@splunk/dashboard-context';

const MyViz = ({ dataSources, options, id }) => {
  const dashboardApi = useDashboardApi();

  const handleClick = (rowData) => {
    dashboardApi.handleEvent({
      targetId: id,
      type: 'value.click',
      payload: { value: rowData.host, name: 'host' },
    });
  };

  return <button onClick={() => handleClick({ host: 'web01' })}>Click</button>;
};
```

This integrates with `drilldown.setToken` event handlers in the dashboard JSON.

---

## Common mistakes

- **Forgetting `.config`**: Dashboard Framework uses `MyViz.config` to wire data. Without it, the viz won't receive data.
- **`output_mode` mismatch**: use `json_cols` for columnar access, `json_rows` for row objects. Specify in `initialRequestParams`.
- **Not unsubscribing**: always return the unsubscribe function from `useEffect` to prevent memory leaks.
- **Viz key without `splunk.` prefix**: the preset key must be `'splunk.MyViz'`, not `'MyViz'`.
