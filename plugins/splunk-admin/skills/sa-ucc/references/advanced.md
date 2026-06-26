# Advanced Patterns Reference

---

## Dependent Dropdowns

Populate a dropdown based on the value of another field.

```jsonc
{
  "field": "region",
  "label": "Region",
  "type": "singleSelect",
  "options": {
    "endpointUrl": "splunk_ta_example/regions",
    "dependencies": ["cloud_provider"],   // re-fetch when this field changes
    "labelField": "title",
    "valueField": "name"
  }
}
```

The REST endpoint receives the dependency value as a query parameter:
`GET /splunk_ta_example/regions?cloud_provider=aws`

Your custom REST handler must filter results based on the query parameter.

---

## Proxy Configuration Tab

Built-in proxy support. Add to `configuration.tabs`:

```jsonc
{
  "name": "proxy",
  "title": "Proxy",
  "entity": [
    {"field": "proxy_enabled",   "label": "Enable",       "type": "checkbox"},
    {"field": "proxy_type",      "label": "Proxy Type",   "type": "singleSelect",
     "options": {"disableSearch": true, "autoCompleteFields": [
       {"value": "http",   "label": "http"},
       {"value": "socks5", "label": "socks5"}
     ]}, "defaultValue": "http"},
    {"field": "proxy_url",       "label": "Host",         "type": "text"},
    {"field": "proxy_port",      "label": "Port",         "type": "text",
     "validators": [{"type": "number", "range": [1, 65535]}]},
    {"field": "proxy_username",  "label": "Username",     "type": "text"},
    {"field": "proxy_password",  "label": "Password",     "type": "text", "encrypted": true},
    {"field": "proxy_rdns",      "label": "Remote DNS resolution", "type": "checkbox"}
  ]
}
```

In Python, read proxy via `solnlib`:

```python
from solnlib import conf_manager, utils

def get_proxy_settings(session_key, addon_name):
    cfm = conf_manager.ConfManager(session_key, addon_name)
    conf = cfm.get_conf("ta_my_addon_settings")
    proxy = conf.get("proxy")
    return proxy
```

---

## Groups Feature

Visually group related fields in the form dialog.

```jsonc
// In a service entity, add "groups" alongside "entity":
{
  "name": "my_input",
  "entity": [ ... ],
  "groups": [
    {
      "label": "Connection Settings",
      "fields": ["host", "port", "protocol"],
      "options": {"isExpandable": false}
    },
    {
      "label": "Advanced Options",
      "fields": ["timeout", "retries"],
      "options": {"isExpandable": true, "expand": false}
    }
  ]
}
```

Each `fields` entry must match a `field` value in the `entity` array.

---

## Save Validator

Client-side JavaScript validation run when the user clicks Save.

```jsonc
// In a tab or service:
{
  "options": {
    "saveValidator": "validateMyInput"
  }
}
```

```javascript
// package/appserver/static/js/build/custom/validateMyInput.js
function validateMyInput(formData, displayErrorMsg) {
  const host = formData.host;
  const port = formData.port;

  if (!host && !port) {
    displayErrorMsg("Either Host or Port must be provided.");
    return false;
  }
  return true;
}

export default validateMyInput;
```

---

## Custom REST Handler

Override the generated REST handler for a configuration tab.

```jsonc
// In a configuration tab:
{
  "name": "account",
  "restHandlerName": "ta_my_addon_account_handler",
  "entity": [ ... ]
}
```

```python
# package/bin/ta_my_addon_account_handler.py
from splunktaucclib.rest_handler import admin_external, util
from splunktaucclib.rest_handler.admin_external import AdminExternalHandler
import logging

logger = logging.getLogger()

class AccountRestHandler(AdminExternalHandler):
    def handleEdit(self, confInfo):
        # Custom logic before save
        super().handleEdit(confInfo)

    def handleCreate(self, confInfo):
        # Validate on create
        super().handleCreate(confInfo)
```

Register it in `restmap.conf` (or let UCC generate it and then place your handler in `package/bin/`).

---

## Custom REST Endpoint

Add entirely new REST endpoints (not tied to a configuration tab):

```jsonc
// Top-level in globalConfig:
{
  "meta": { ... },
  "pages": { ... },
  "options": {
    "restHandlers": [
      {
        "name": "ta_my_addon_custom",
        "endpoint": "ta_my_addon_custom",
        "handlerType": "EAI"
      }
    ]
  }
}
```

---

## OS-Dependent Libraries

Some packages (e.g. `google-cloud-bigquery`) include `.so` files tied to the build OS. UCC cannot automatically handle cross-platform installs.

**Workaround:** Pre-build the libraries for each target OS and include them in the package under OS-specific subdirectories. See: https://splunk.github.io/addonfactory-ucc-generator/advanced/os-dependent_libraries/

---

## Conf-only TAs (No UI)

Omit the `pages` key entirely from `globalConfig.json`. UCC generates:
- `app.conf` in `default/`
- Metadata files

No Python or JavaScript is created. Useful for lookup-only or props/transforms add-ons.

---

## Additional Packaging Script

Run custom Python code after the main UCC build:

```python
# package/additional_packaging.py
def additional_packaging(ta_name):
    """Called by ucc-gen after the main build completes."""
    import shutil, os
    # Example: copy an extra file
    shutil.copy("package/extra_file.txt", f"output/{ta_name}/")
```

UCC automatically calls this if the file exists in `package/`.

---

## Tabbed Inputs (Multi-level Menu)

For add-ons with multiple distinct input types, use the tab layout:

```jsonc
"inputs": {
  "title": "Inputs",
  "menu": {
    "src": "CustomMenu",    // optional: custom menu component
    "type": "external"
  },
  "services": [
    {"name": "input_type_a", "title": "Type A", "entity": [ ... ]},
    {"name": "input_type_b", "title": "Type B", "entity": [ ... ]}
  ]
}
```

The Inputs page shows a multi-level menu to choose input type before the create dialog opens.

---

## Sub Description

Add supplementary text beneath an entity label in the UI:

```jsonc
{
  "field": "api_key",
  "label": "API Key",
  "type": "text",
  "subDescription": {
    "text": "You can find your API key at [example.com/settings](https://example.com/settings).",
    "links": [
      {"text": "example.com/settings", "link": "https://example.com/settings"}
    ]
  }
}
```

---

## Custom Warning Banner

Display a warning at the top of a Configuration tab:

```jsonc
{
  "name": "account",
  "title": "Account",
  "warning": {
    "create": {"message": "Changing accounts may affect running inputs."},
    "edit":   {"message": "Editing credentials will restart active inputs."}
  },
  "entity": [ ... ]
}
```

---

## modifyFieldsOnValue

Dynamically show/hide or enable/disable fields when another field changes (declarative, no JS needed):

```jsonc
{
  "field": "auth_type",
  "label": "Auth Type",
  "type": "radio",
  "modifyFieldsOnValue": [
    {
      "fieldValue": "oauth",
      "fieldsToModify": [
        {"fieldId": "client_id",     "display": true},
        {"fieldId": "client_secret", "display": true},
        {"fieldId": "username",      "display": false},
        {"fieldId": "password",      "display": false}
      ]
    },
    {
      "fieldValue": "basic",
      "fieldsToModify": [
        {"fieldId": "client_id",     "display": false},
        {"fieldId": "client_secret", "display": false},
        {"fieldId": "username",      "display": true},
        {"fieldId": "password",      "display": true}
      ]
    }
  ]
}
```

---

## Import from Add-on Builder (AoB)

Migrate an existing AoB-based add-on to UCC (experimental):

```bash
# Unarchive the AoB export, then:
ucc-gen import-from-aob --addon-name <folder-name>
```

Note: Does not support Windows. May require manual corrections after import.

---

## Publish to Splunkbase

```bash
ucc-gen publish \
  --path output/ta_my_addon/ta_my_addon-1.0.0.tar.gz \
  --splunkbase-username myuser \
  --splunkbase-password mypass
```

Requires a Splunkbase account with upload permissions for the app.
