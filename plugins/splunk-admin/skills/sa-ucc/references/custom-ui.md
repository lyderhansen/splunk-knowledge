# Custom UI Extensions Reference

UCC supports two approaches to custom UI: **Standard** (simple JS files) and **Context** (full React project).

---

## Standard Custom Extensions

Place JavaScript files in `package/appserver/static/js/build/custom/`.

### Custom Hook

Runs logic when a form loads or a field changes. Declared with `"hook"` in a service/tab.

```jsonc
// In globalConfig, inside a service or tab:
{
  "name": "my_input",
  "title": "My Input",
  "hook": {
    "src": "CustomHook",       // filename without .js
    "type": "external"
  },
  "entity": [ ... ]
}
```

```javascript
// package/appserver/static/js/build/custom/CustomHook.js
class CustomHook {
  /**
   * @param {Object} globalConfig  - the full globalConfig object
   * @param {string} serviceName   - current service/tab name
   * @param {Object} state         - current form state (read-only reference)
   * @param {Function} setState    - call to update form fields
   * @param {Object} util          - UCC utility methods
   */
  constructor(globalConfig, serviceName, state, setState, util) {
    this.globalConfig = globalConfig;
    this.serviceName = serviceName;
    this.util = util;
  }

  onCreate(defaultValues) {
    // Called when the dialog opens in "create" mode
  }

  onEdit(defaultValues) {
    // Called when the dialog opens in "edit" mode
  }

  onChange(field, value, dataDict) {
    // Called whenever a field value changes
    if (field === "my_toggle" && value === "1") {
      // Show/hide another field dynamically
      return { another_field: { display: true } };
    }
  }

  onSave(dataDict) {
    // Called before saving; return false to abort
    return true;
  }

  onSaveSuccess() { }
  onSaveFail() { }
}

export default CustomHook;
```

### Custom Control

Replace a field's entire rendering with a custom React component.

```jsonc
{
  "field": "my_custom_field",
  "label": "Custom Field",
  "type": "custom",
  "options": {
    "src": "CustomControl",
    "type": "external"
  }
}
```

```javascript
// package/appserver/static/js/build/custom/CustomControl.js
import React, { Component } from 'react';

class CustomControl extends Component {
  render() {
    const { value, onChange, disabled } = this.props;
    return (
      <input
        value={value || ''}
        disabled={disabled}
        onChange={e => onChange(this.props.field, e.target.value, true, true)}
      />
    );
  }
}

export default CustomControl;
```

### Custom Row

Add extra content below a table row (expanded detail view).

```jsonc
// In inputs.table:
{
  "customRow": {
    "src": "CustomRow",
    "type": "external"
  }
}
```

### Custom Cell

Replace a table cell's rendering.

```jsonc
// In inputs.table.header:
{
  "field": "status",
  "label": "Status",
  "customCell": {
    "src": "StatusCell",
    "type": "external"
  }
}
```

### Custom Tab

Add a completely custom tab to the Configuration page.

```jsonc
// In configuration.tabs:
{
  "name": "custom_tab",
  "title": "My Custom Tab",
  "customTab": {
    "src": "MyCustomTab",
    "type": "external"
  }
}
```

---

## Context UI Project (Advanced)

For more complex UI needs, initialise a full React project that compiles into the add-on.

```bash
# Initialise the custom UI project (run from add-on root)
ucc-gen custom-ui-project init

# Test/develop with hot-reload
ucc-gen custom-ui-project test

# Build custom UI as part of the main build
ucc-gen build --build-custom-ui ...
```

The context approach gives access to the full UCC React context — form state, utility methods, and event callbacks — via hooks exported from `@splunk/ucc-app-renderer`.

Context extension types follow the same categories (hook, control, row, cell, tab) but are written as React functional components using hooks:

```javascript
// Example Context Custom Hook
import { useEffect } from 'react';
import { useUCCContext } from '@splunk/ucc-app-renderer';

export function useCustomHook() {
  const { formState, setFormField } = useUCCContext();

  useEffect(() => {
    if (formState.fields.enable_feature?.value === '1') {
      setFormField('related_field', { display: true });
    }
  }, [formState.fields.enable_feature?.value]);
}
```

Full context API docs: https://splunk.github.io/addonfactory-ucc-generator/custom_ui_extensions/context/overview/
Storybook (live component demos): https://splunk.github.io/addonfactory-ucc-generator/storybook
