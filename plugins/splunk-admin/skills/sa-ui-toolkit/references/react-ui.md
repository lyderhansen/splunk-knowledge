# @splunk/react-ui — Reference

## Import convention

Always import components individually (enables tree-shaking):
```js
import Button    from '@splunk/react-ui/Button';
import Card      from '@splunk/react-ui/Card';
import Table     from '@splunk/react-ui/Table';
```

---

## Component catalogue (commonly used)

### Button

```jsx
import Button from '@splunk/react-ui/Button';

<Button label="Save" appearance="primary" onClick={handleSave} />
<Button label="Cancel" appearance="secondary" onClick={handleCancel} />
<Button label="Delete" appearance="destructive" onClick={handleDelete} />
<Button label="Loading" disabled />
```

appearances: `primary`, `secondary`, `destructive`, `pill`, `toggle`, `flat`

### Card

```jsx
import Card from '@splunk/react-ui/Card';

<Card>
  <Card.Header title="System Health" subtitleText="Last 24 hours" />
  <Card.Body>
    <P>99.9% uptime</P>
  </Card.Body>
  <Card.Footer>
    <Button label="Details" />
  </Card.Footer>
</Card>
```

### ColumnLayout (responsive grid)

```jsx
import ColumnLayout from '@splunk/react-ui/ColumnLayout';

<ColumnLayout>
  <ColumnLayout.Row>
    <ColumnLayout.Column span={4}>Left</ColumnLayout.Column>
    <ColumnLayout.Column span={4}>Middle</ColumnLayout.Column>
    <ColumnLayout.Column span={4}>Right</ColumnLayout.Column>
  </ColumnLayout.Row>
</ColumnLayout>
```

`span` is 1–12 (12-column grid).

### Table

```jsx
import Table from '@splunk/react-ui/Table';

const columns = [
  { key: 'host',   name: 'Host'  },
  { key: 'status', name: 'Status'},
  { key: 'count',  name: 'Count' },
];

const rows = [
  { host: 'web01', status: '200', count: 1500 },
  { host: 'web02', status: '404', count: 23   },
];

<Table stripeRows>
  <Table.Head>
    {columns.map(col => (
      <Table.HeadCell key={col.key}>{col.name}</Table.HeadCell>
    ))}
  </Table.Head>
  <Table.Body>
    {rows.map((row, i) => (
      <Table.Row key={i}>
        {columns.map(col => (
          <Table.Cell key={col.key}>{row[col.key]}</Table.Cell>
        ))}
      </Table.Row>
    ))}
  </Table.Body>
</Table>
```

### Modal

```jsx
import Modal  from '@splunk/react-ui/Modal';
import Button from '@splunk/react-ui/Button';
import { useState } from 'react';

const [open, setOpen] = useState(false);

<>
  <Button label="Open" onClick={() => setOpen(true)} />
  <Modal open={open} onRequestClose={() => setOpen(false)}>
    <Modal.Header title="Confirm action" />
    <Modal.Body>
      <P>Are you sure?</P>
    </Modal.Body>
    <Modal.Footer>
      <Button label="Cancel" onClick={() => setOpen(false)} />
      <Button label="Confirm" appearance="primary" onClick={handleConfirm} />
    </Modal.Footer>
  </Modal>
</>
```

### Select / Dropdown

```jsx
import Select from '@splunk/react-ui/Select';

const [value, setValue] = useState('prod');

<Select value={value} onChange={(e, { value }) => setValue(value)}>
  <Select.Option label="Production" value="prod" />
  <Select.Option label="Staging"    value="staging" />
  <Select.Option label="Dev"        value="dev" />
</Select>
```

### Multiselect

```jsx
import Multiselect from '@splunk/react-ui/Multiselect';

const [values, setValues] = useState(['200']);

<Multiselect values={values} onChange={(e, { values }) => setValues(values)}>
  <Multiselect.Option label="200" value="200" />
  <Multiselect.Option label="404" value="404" />
  <Multiselect.Option label="500" value="500" />
</Multiselect>
```

### Text / Heading / P

```jsx
import Heading from '@splunk/react-ui/Heading';
import P       from '@splunk/react-ui/P';

<Heading level={1}>Dashboard Title</Heading>
<Heading level={2}>Section</Heading>
<P>Paragraph text styled to Splunk theme.</P>
```

### Switch / Toggle

```jsx
import Switch from '@splunk/react-ui/Switch';

const [checked, setChecked] = useState(false);

<Switch
  value={checked}
  onClick={() => setChecked(!checked)}
  appearance="toggle"
>
  Dark Mode
</Switch>
```

### TabLayout

```jsx
import TabLayout from '@splunk/react-ui/TabLayout';

const [tab, setTab] = useState('overview');

<TabLayout activePanelId={tab} onChange={(e, { activePanelId }) => setTab(activePanelId)}>
  <TabLayout.Panel label="Overview" panelId="overview">
    <P>Overview content</P>
  </TabLayout.Panel>
  <TabLayout.Panel label="Details" panelId="details">
    <P>Details content</P>
  </TabLayout.Panel>
</TabLayout>
```

### WaitSpinner (loading state)

```jsx
import WaitSpinner from '@splunk/react-ui/WaitSpinner';

{loading ? <WaitSpinner size="large" /> : <MyContent />}
```

### Tooltip

```jsx
import Tooltip from '@splunk/react-ui/Tooltip';
import Button  from '@splunk/react-ui/Button';

<Tooltip content="This action is irreversible">
  <Button label="Delete All" appearance="destructive" />
</Tooltip>
```

### Link

```jsx
import Link from '@splunk/react-ui/Link';

<Link to="https://docs.splunk.com" openInNewContext>Splunk Docs</Link>
```

### ControlGroup (form layout)

```jsx
import ControlGroup from '@splunk/react-ui/ControlGroup';
import Text         from '@splunk/react-ui/Text';

<ControlGroup label="Search Query" labelFor="query-input">
  <Text id="query-input" value={query} onChange={(e, { value }) => setQuery(value)} />
</ControlGroup>
```

### Number (formatted number display)

```jsx
import Number from '@splunk/react-ui/Number';

<Number value={1234567} format="0,0" />       // → 1,234,567
<Number value={0.9876}  format="0.0%"  />     // → 98.8%
```

---

## Full page with @splunk/react-page

Use `@splunk/react-page` to mount a React root with Splunk page chrome:

```jsx
// src/main/MyPage.jsx
import React from 'react';

const MyPage = () => (
  <div>My app content</div>
);

export default MyPage;

// src/main/index.jsx
import layout from '@splunk/react-page';
import MyPage from './MyPage';

layout(<MyPage />, {
  pageTitle: 'My App',
  hideFooter: true,
  layout: 'fixed',   // 'fixed' | 'scrolling'
});
```

---

## Fetching Splunk search results from React (outside UDF)

```jsx
import { useState, useEffect } from 'react';
import SplunkThemeProvider from '@splunk/themes/SplunkThemeProvider';

// Using the Splunk JavaScript SDK via the global splunkjs available in Splunk Web
const runSearch = async (query) => {
  return new Promise((resolve, reject) => {
    const service = new window.splunkjs.Service({ sessionKey: window.$C?.SESSION_KEY });
    const job = service.search(query, { exec_mode: 'blocking' }, (err, job) => {
      if (err) return reject(err);
      job.results({ output_mode: 'json' }, (err, results) => {
        if (err) return reject(err);
        resolve(results.results);
      });
    });
  });
};
```

For newer SUIT apps inside UDF, prefer `ds.search` data sources over manual SDK calls.

---

## Theming tokens in CSS-in-JS / inline styles

SUIT exposes CSS variables that match the active theme. You can reference them:

```jsx
const style = {
  background: 'var(--color-background)',
  color:      'var(--color-text)',
  border:     '1px solid var(--color-border)',
};
```

Common variables: `--color-background`, `--color-background-section`,
`--color-text`, `--color-text-muted`, `--color-border`, `--color-accent`,
`--color-primary`.

---

## Patterns checklist

- ✅ Wrap everything in `<SplunkThemeProvider>`
- ✅ Import components individually from their subpath
- ✅ Use `ControlGroup` for form field labels
- ✅ Use `ColumnLayout` for responsive side-by-side panels
- ✅ Handle loading with `WaitSpinner`, errors with `Message` component
- ❌ Don't import from `@splunk/react-ui` barrel — import from subpaths
- ❌ Don't use `<form>` HTML elements — use event handlers on components
