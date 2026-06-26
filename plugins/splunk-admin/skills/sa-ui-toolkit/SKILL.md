---
name: sa-ui-toolkit
description: >
  Use this skill whenever the user wants to build, customise, or extend Splunk
  visualisations and dashboards using the Splunk UI Toolkit (SUIT). Triggers
  include: creating a Splunk React app with @splunk/create, building custom
  visualisations or chart types for Dashboard Studio or the Unified Dashboard
  Framework (UDF), editing Dashboard JSON definitions (dataSources,
  visualizations, layout, inputs, tokens, expressions), wiring up tokens and
  drilldown interactivity, adding @splunk/react-ui components (Button, Card,
  Table, Layout, etc.) to a Splunk page, theming with SplunkThemeProvider, and
  packaging Splunk apps as .spl files. Also trigger for any question about when
  to choose Dashboard Studio vs the Dashboard Framework vs Classic Simple XML,
  or how to migrate between them. Always use this skill for SUIT topics even if
  the user only mentions "Splunk dashboard", "splunk.column", "DashboardCore",
  "preset", "drilldown token", "@splunk/react-ui", or "splunk app React".
---

# Splunk UI Toolkit (SUIT) Skill

## What SUIT is

SUIT is a collection of npm packages that lets developers build production-grade
Splunk apps and dashboards using React. It is the same frontend stack that
powers Dashboard Studio, Splunk Observability Cloud, and Mission Control. Key
packages:

| Package | Purpose |
|---|---|
| `@splunk/create` | Scaffold apps and components (replaces SplunkJS) |
| `@splunk/react-ui` | UI primitives: Button, Card, Table, Layout, Modal, etc. |
| `@splunk/dashboard-core` | Renders a dashboard from a JSON definition |
| `@splunk/dashboard-context` | Providers, contexts, and registries required by DashboardCore |
| `@splunk/dashboard-presets` | Built-in preset configs (EnterprisePreset, EnterpriseViewOnlyPreset) |
| `@splunk/visualizations` | React wrappers for all built-in chart types |
| `@splunk/themes` | `SplunkThemeProvider` — always wrap apps in this |
| `@splunk/search-job` | Run SPL searches from React |

Official docs: https://splunkui.splunk.com  
GitHub examples: https://github.com/splunk (search "dashboard-")

---

## Choosing the right approach

```
Need          | Recommendation
--------------|-------------------------------------------------
Quick dashboard with editors + PDF/PNG export | Dashboard Studio (JSON source editor)
Complex custom interactions, 3rd-party viz, programmatic control | SUIT + Dashboard Framework (React page)
Simple form-based layout from legacy | Classic Simple XML (only for maintenance)
Extend Dashboard Studio with ONE custom viz | @splunk/create --mode=dashboard-studio-extension
```

**Key trade-off**: The Dashboard Framework gives full React control but loses
the Studio visual editor and PDF/PNG export. Both can coexist in one Splunk app.

---

## Prerequisites

- Node.js ≥ 16, Yarn ≥ 1.7  
- React knowledge (hooks, props, state)  
- Splunk Enterprise or Cloud instance for final testing

---

## 1. Scaffolding an app

```bash
# Full React Splunk app
npx @splunk/create

# Custom visualization for Dashboard Studio (packaged as .spl)
npx @splunk/create --mode=dashboard-studio-extension
```

`@splunk/create` prompts for app/component names and generates a ready-to-run
project with webpack config, jest setup, and Splunk-compatible folder layout.

Generated structure:
```
my-app/
├── packages/
│   └── my-app/          ← the Splunk app
│       ├── src/
│       │   ├── main/    ← page entry points
│       │   └── components/
│       └── package.json
└── package.json         ← monorepo root
```

---

## 2. Unified Dashboard Framework (UDF)

See `references/udf.md` for detailed API, JSON schema examples, and advanced
patterns. Summary below.

### Minimal React page with a dashboard

```jsx
import React from 'react';
import { DashboardCore } from '@splunk/dashboard-core';
import { DashboardContextProvider } from '@splunk/dashboard-context';
import EnterpriseViewOnlyPreset from '@splunk/dashboard-presets/EnterpriseViewOnlyPreset';
import SplunkThemeProvider from '@splunk/themes/SplunkThemeProvider';
import definition from './definition.json';

const Dashboard = () => (
  <SplunkThemeProvider family="enterprise" colorScheme="light">
    <DashboardContextProvider
      preset={EnterpriseViewOnlyPreset}
      initialDefinition={definition}
    >
      <DashboardCore width="100%" height="100%" />
    </DashboardContextProvider>
  </SplunkThemeProvider>
);

export default Dashboard;
```

> **Version note**: DashboardCore ≥ 25.x passes `preset` to
> `DashboardContextProvider`. Older versions pass it directly to `DashboardCore`.

### Dashboard JSON definition structure

```json
{
  "title": "My Dashboard",
  "description": "",
  "inputs": {},
  "defaults": {},
  "dataSources": {},
  "visualizations": {},
  "layout": {},
  "expressions": {},
  "applicationProperties": {}
}
```

Full schema patterns → `references/udf.md`

---

## 3. Custom visualizations

See `references/custom-viz.md` for full patterns. Quick summary:

```jsx
// MyViz.jsx — skeleton of a custom viz component
import React from 'react';
import { useDataSource } from '@splunk/dashboard-context';

const MyViz = ({ dataSources, options }) => {
  const [data, requestParams, dataSourceError] = useDataSource(dataSources.primary);
  // data.columns / data.fields contain SPL result rows
  return <div>{/* render something */}</div>;
};

MyViz.config = {
  optionsSchema: {},      // JSON Schema for options the dashboard JSON can pass
  dataContract: {
    requiredDataSources: [{ name: 'primary', description: 'Main data' }],
    initialRequestParams: { count: 10000, output_mode: 'json_cols' },
  },
  size: { defaultWidth: 300, defaultHeight: 200 },
  events: {},
};

export default MyViz;
```

Register in a custom preset:
```js
const customPreset = {
  ...EnterpriseViewOnlyPreset,
  visualizations: {
    ...EnterpriseViewOnlyPreset.visualizations,
    'splunk.MyViz': MyViz,  // key must start with 'splunk.'
  },
};
```

Reference in dashboard JSON:
```json
"visualizations": {
  "viz_custom_1": {
    "type": "splunk.MyViz",
    "dataSources": { "primary": "ds_search_1" },
    "options": {}
  }
}
```

---

## 4. @splunk/react-ui components

See `references/react-ui.md` for component catalogue and patterns.

Key components: `Button`, `Card`, `ColumnLayout`, `Table`, `Modal`, `WaitSpinner`,
`Heading`, `P`, `Link`, `Select`, `Multiselect`, `Switch`, `TabLayout`, `Tooltip`.

```jsx
import Button from '@splunk/react-ui/Button';
import Card from '@splunk/react-ui/Card';
import ColumnLayout from '@splunk/react-ui/ColumnLayout';

const MyPage = () => (
  <ColumnLayout>
    <ColumnLayout.Row>
      <ColumnLayout.Column span={6}>
        <Card>
          <Card.Header title="Status" />
          <Card.Body><P>All systems go</P></Card.Body>
        </Card>
      </ColumnLayout.Column>
    </ColumnLayout.Row>
  </ColumnLayout>
);
```

Always import individual components (tree-shakeable), not the whole package:
```js
// ✅ correct
import Button from '@splunk/react-ui/Button';
// ❌ avoid
import { Button } from '@splunk/react-ui';
```

---

## 5. Theming

```jsx
import SplunkThemeProvider from '@splunk/themes/SplunkThemeProvider';

// families: 'enterprise' | 'prisma'
// colorScheme: 'light' | 'dark'
<SplunkThemeProvider family="enterprise" colorScheme="light">
  {/* all SUIT components here */}
</SplunkThemeProvider>
```

Prisma is the newer dark-first theme used in Splunk Observability Cloud.
Enterprise is the default for Splunk Enterprise/Cloud.

---

## 6. Packaging and deployment

```bash
# Build the app
cd packages/my-app && yarn run build

# Package as .spl (tar.gz under the hood)
yarn run package

# Install via Splunk Web → Apps → Manage Apps → Install from file
# OR copy to $SPLUNK_HOME/etc/apps/ and restart Splunk
```

For dashboard-studio-extension mode, the CLI handles packaging:
```bash
npx @splunk/create --mode=dashboard-studio-extension build
npx @splunk/create --mode=dashboard-studio-extension package
```

---

## Reference files

Read these when handling a detailed task in that area:

| File | Read when… |
|---|---|
| `references/udf.md` | Writing or debugging dashboard JSON, tokens, data sources, layout, event handlers, expressions |
| `references/custom-viz.md` | Building or registering a custom visualization component |
| `references/react-ui.md` | Using @splunk/react-ui components in a page or custom viz |

---

## Common pitfalls

- **Missing `SplunkThemeProvider`**: components render unstyled without it.
- **Wrong preset prop location**: ≥ v25 preset goes on `DashboardContextProvider`, not `DashboardCore`.
- **Viz key must start with `splunk.`**: e.g. `'splunk.MyChart'`, not `'MyChart'`.
- **Token syntax**: `$tokenName$` in JSON strings, `$tokenName.field$` for sub-fields (e.g. `$trp.earliest$`).
- **`ds.chain` not `ds.search`** when chaining search results from another data source.
- **No visual editor** when using SUIT directly; Dashboard Studio has the editor but not SUIT's full flexibility.
- **PDF/PNG export** is only available in Dashboard Studio dashboards, not custom React pages.
