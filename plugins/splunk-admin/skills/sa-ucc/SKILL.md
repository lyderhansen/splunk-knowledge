---
name: sa-ucc
description: >
  Expert guidance for building, customising, and packaging Splunk add-ons using the UCC (Universal
  Configuration Console) Framework. Use this skill whenever the user mentions: UCC, splunk add-on,
  TA (Technology Add-on), globalConfig, ucc-gen, modular inputs, Splunk add-on development,
  addonfactory, splunktaucclib, or needs to create/edit/build/package/validate a Splunk add-on.
  Also trigger for tasks involving inputs pages, configuration pages, alert actions, OAuth in
  Splunk, custom REST handlers, or any work with globalConfig.json / globalConfig.yaml files.
---

# Splunk UCC Framework Skill

Universal Configuration Console (UCC) is Splunk's official framework for building UI-based
add-ons. It generates UI (React), REST handlers, modular inputs, `.conf` files, and packaging
artifacts from a single `globalConfig.json` (or `.yaml`) descriptor.

**Key libraries:**
- `splunktaucclib` – REST handler base classes: https://github.com/splunk/addonfactory-ucc-library
- `solnlib` – Splunk solution utilities: https://github.com/splunk/addonfactory-solutions-library-python
- Example TA: https://github.com/splunk/splunk-example-ta

---

## Quick Reference — Common Tasks

| Task | Go to |
|------|-------|
| Create a brand new add-on | [Setup & Init](#setup--init) |
| Build / rebuild output | [Build & Package](#build--package) |
| Edit inputs page fields | [globalConfig — Inputs](#globalconfig--inputs) |
| Edit configuration tabs | [globalConfig — Configuration](#globalconfig--configuration) |
| Add OAuth / Basic auth | [references/oauth.md](references/oauth.md) |
| Add an alert action | [references/alert-actions.md](references/alert-actions.md) |
| Custom UI (hooks, controls, etc.) | [references/custom-ui.md](references/custom-ui.md) |
| Advanced patterns (dependent dropdown, REST, groups) | [references/advanced.md](references/advanced.md) |

---

## Setup & Init

### Prerequisites
- Python 3.9+
- Git (used to derive version from tags; or pass `--ta-version`)

### Install

```bash
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate.bat
pip install splunk-add-on-ucc-framework
```

For validation support:
```bash
pip install "splunk-add-on-ucc-framework[validate]"
```

### Initialise a new add-on

```bash
ucc-gen init \
  --addon-name "ta_my_addon" \
  --addon-display-name "My Add-on for Splunk" \
  --addon-input-name my_input \
  --addon-version 1.0.0 \
  --add-license "Apache License 2.0"
```

This creates `ta_my_addon/package/` with:
- `globalConfig.json` — the master config descriptor
- `app.manifest`
- Skeleton modular input in `package/bin/`
- `package/default/` conf stubs

**Naming convention:** Follow [Splunk naming guidelines](https://dev.splunk.com/enterprise/docs/releaseapps/splunkbase/namingguidelines/). Add-on names typically use `ta_` prefix and underscores.

---

## Build & Package

```bash
# Build (output goes to ./output/ by default)
ucc-gen build --source ta_my_addon/package --ta-version 1.0.0

# Package for Splunkbase upload
ucc-gen package --path output/ta_my_addon

# Validate with AppInspect
ucc-gen validate --addon-path output/ta_my_addon

# Verbose build (shows created/copied/modified/conflict files)
ucc-gen build --source ta_my_addon/package --ta-version 1.0.0 -v
```

Key `ucc-gen build` flags:
- `--config` — explicit path to globalConfig file (default: auto-detected)
- `-o` / `--output` — custom output folder
- `--python-binary-name` — e.g. `python3.11`
- `--build-custom-ui` — also run the `./ui` custom UI build script
- `--overwrite` — allow overwriting existing output directory

**Generated output structure:**
```
output/ta_my_addon/
├── appserver/          # React UI bundle + openapi.json
├── bin/                # Python modular inputs + REST handlers
├── default/            # .conf files (inputs.conf, restmap.conf, etc.)
├── lib/                # Pip-installed Python dependencies
├── metadata/
└── app.manifest
```

After initial generation, copy the generated modular input from `output/.../bin/` to `package/bin/` and customise it. Subsequent builds will use your version instead of regenerating.

---

## globalConfig — Top-level Structure

`globalConfig.json` (or `.yaml`) is the single source of truth.

```jsonc
{
  "meta": {
    "name": "ta_my_addon",
    "restRoot": "ta_my_addon",
    "version": "1.0.0",
    "displayName": "My Add-on for Splunk",
    "schemaVersion": "0.0.3"
  },
  "pages": {
    "configuration": { ... },   // ← Configuration page tabs
    "inputs": { ... }           // ← Inputs page
  }
}
```

---

## globalConfig — Configuration

The Configuration page is a set of named tabs, each containing entities (form fields).

```jsonc
"configuration": {
  "title": "Configuration",
  "description": "Set up your add-on",
  "tabs": [
    {
      "name": "account",
      "title": "Account",
      "entity": [ /* field definitions */ ],
      "table": { /* optional: show existing accounts in a table */ }
    },
    {
      "name": "proxy",
      "title": "Proxy",
      "entity": [ /* proxy fields */ ],
      "options": { "saveValidator": "..." }   // optional save-time JS validator
    },
    {
      "name": "logging",
      "title": "Logging",
      "entity": [
        {
          "field": "loglevel",
          "label": "Log level",
          "type": "singleSelect",
          "options": {
            "disableSearch": true,
            "autoCompleteFields": [
              {"value": "DEBUG", "label": "DEBUG"},
              {"value": "INFO",  "label": "INFO"},
              {"value": "WARNING", "label": "WARNING"},
              {"value": "ERROR", "label": "ERROR"}
            ]
          },
          "defaultValue": "INFO"
        }
      ]
    }
  ]
}
```

UCC has **built-in tab templates** for common needs — just include them and they wire up automatically:
- **Logging tab**: use the `loglevel` singleSelect pattern above
- **Proxy tab**: see [references/advanced.md](references/advanced.md)

---

## globalConfig — Inputs

The Inputs page lists modular input stanzas and lets users create/edit/delete them.

```jsonc
"inputs": {
  "title": "Inputs",
  "description": "Manage your data inputs",
  "table": {
    "actions": ["edit", "delete", "clone", "enable"],
    "header": [
      {"field": "name",     "label": "Name"},
      {"field": "interval", "label": "Interval"},
      {"field": "index",    "label": "Index"},
      {"field": "disabled", "label": "Status"}
    ]
  },
  "services": [
    {
      "name": "my_input",
      "title": "My Input",
      "entity": [
        {
          "field": "name",
          "label": "Name",
          "type": "text",
          "required": true,
          "validators": [
            {"type": "string", "minLength": 1, "maxLength": 100},
            {"type": "regex", "pattern": "^[a-zA-Z]\\w*$",
             "errorMsg": "Must start with a letter; alphanumeric/underscores only."}
          ]
        },
        {
          "field": "interval",
          "label": "Interval",
          "type": "text",
          "defaultValue": "300",
          "validators": [{"type": "number", "range": [1, 86400]}]
        },
        {
          "field": "index",
          "label": "Index",
          "type": "singleSelect",
          "required": true,
          "defaultValue": "default",
          "options": {
            "endpointUrl": "data/indexes",
            "denyList": "^_.*$",
            "createSearchChoice": true
          }
        }
      ]
    }
  ]
}
```

For **tabbed inputs** (multiple input types): see [references/advanced.md](references/advanced.md).

---

## Entity Field Reference

Every entity object follows this structure:

```jsonc
{
  "field": "my_field",          // key in .conf stanza
  "label": "My Field",          // UI label
  "type": "<component>",        // see below
  "help": "Description text.",
  "required": true,
  "defaultValue": "...",
  "encrypted": false,           // store in Splunk's encrypted storage
  "validators": [],             // see Validators section
  "options": {}                 // component-specific options
}
```

### Component Types

| type | Description |
|------|-------------|
| `text` | Single-line text input |
| `textarea` | Multi-line text (`options.rowsMin`, `options.rowsMax`) |
| `singleSelect` | Dropdown — static list or dynamic from API |
| `multipleSelect` | Multi-select from static/dynamic options |
| `checkbox` | Boolean toggle |
| `checkboxGroup` | Group of related checkboxes |
| `radio` | Radio buttons |
| `file` | File upload |
| `oauth` | Auth widget (Basic / OAuth2) — see [references/oauth.md](references/oauth.md) |
| `interval` | Cron or numeric interval |
| `index` | Splunk index picker |
| `custom` | Custom React component — see [references/custom-ui.md](references/custom-ui.md) |

### singleSelect with static options

```jsonc
{
  "type": "singleSelect",
  "field": "log_level",
  "label": "Log Level",
  "options": {
    "disableSearch": true,
    "autoCompleteFields": [
      {"value": "INFO",  "label": "INFO"},
      {"value": "DEBUG", "label": "DEBUG"}
    ]
  },
  "defaultValue": "INFO"
}
```

### singleSelect from REST endpoint

```jsonc
{
  "type": "singleSelect",
  "field": "account",
  "label": "Account",
  "options": {
    "referenceName": "account"   // references configuration tab name
  },
  "required": true
}
```

### Validators

```jsonc
"validators": [
  { "type": "string",  "minLength": 1, "maxLength": 200, "errorMsg": "..." },
  { "type": "regex",   "pattern": "^https?://.*",        "errorMsg": "..." },
  { "type": "number",  "range": [0, 9999],               "errorMsg": "..." },
  { "type": "url",                                        "errorMsg": "..." },
  { "type": "email",                                      "errorMsg": "..." },
  { "type": "date",                                       "errorMsg": "..." },
  { "type": "ipv4",                                       "errorMsg": "..." }
]
```

---

## Modular Input Python Template

After first build, copy `output/ta_my_addon/bin/my_input.py` to `package/bin/my_input.py`.
Extend the `input_module` skeleton:

```python
import import_declare_test  # must be first

from splunktaucclib.modinput_wrapper import base_modinput as bmi

class MyInput(bmi.BaseModInput):

    def __init__(self):
        use_single_instance = False
        super().__init__("ta_my_addon", "my_input", use_single_instance)

    @property
    def logger_prefix(self):
        return "my_input"

    def get_scheme(self):
        # Return the scheme (auto-generated, usually leave as-is)
        ...

    def validate_input(self, definition):
        pass

    def collect_events(self, ew):
        """Main data collection logic goes here."""
        opt = self.get_input_stanza_names(definition)  # input config dict
        # Your collection code:
        # helper = self.get_input_helper(...)
        # ew.write_event(splunklib.modularinput.Event(...))

if __name__ == "__main__":
    exitcode = MyInput().run(sys.argv)
    sys.exit(exitcode)
```

---

## Python Dependencies

List third-party packages in `package/lib/requirements.txt`. UCC installs them into `output/.../lib/` during build.

For OS-specific `.so` libraries (e.g. `google-cloud-bigquery`), see [references/advanced.md](references/advanced.md).

---

## Reference Files

Read these when working on specific areas:

- **[references/oauth.md](references/oauth.md)** — Basic auth, OAuth 2.0 Authorization Code, Client Credentials flows
- **[references/alert-actions.md](references/alert-actions.md)** — Alert actions, adaptive response
- **[references/custom-ui.md](references/custom-ui.md)** — Custom hooks, controls, rows, cells, tabs; Context UI project
- **[references/advanced.md](references/advanced.md)** — Dependent dropdowns, proxy config, groups, save validator, custom REST handler, OS-dependent libs, conf-only TAs

---

## Troubleshooting

| Symptom | Likely cause |
|---------|-------------|
| Build fails: "directory already exists" | Add `--overwrite` flag |
| Input not appearing in Splunk | Check `inputs.conf` stanza and `disabled=0` |
| REST handler errors | Check `splunkd.log`; verify `restmap.conf` generated correctly |
| Python import errors at runtime | Ensure deps in `requirements.txt`; check `lib/` in build output |
| UI not refreshing after build | Hard-refresh browser; Splunk may cache JS bundles |
| Version is `0.0.0+unknown` | Add a git tag (`git tag v1.0.0`) or use `--ta-version` |

Full troubleshooting guide: https://splunk.github.io/addonfactory-ucc-generator/troubleshooting/
