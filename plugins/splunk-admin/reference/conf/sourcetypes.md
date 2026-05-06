# sourcetypes.conf

Machine-generated repository of sourcetype classification models (term-frequency signatures and linkage metadata). Administrators normally avoid editing this file except for two explicitly supported relocation attributes.

**Source version:** Splunk Enterprise 10.2

## File details

| Property | Value |
|----------|-------|
| Location | `$SPLUNK_HOME/etc/system/local/` (overrides) plus learned bundles under apps |
| Pipeline phase | Parsing |
| Restart required | No |
| Related files | `source-classifier.conf`, `props.conf`, classifier artifacts under `etc/apps/learned/` |

## Stanzas and settings

### `[default]` (global defaults)

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *standard merge semantics* | — | — | Use at most one stanza; duplicates merge with last-wins behavior. |

### `[<machine_generated_model_key>]`

Each stanza name is an internal fingerprint (often resembling an absolute path signature) produced by the classifier.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `_sourcetype` | `<string>` | Model-derived | Overrides the sourcetype label associated with this learned model so newly classified files adopt the desired sourcetype string. |
| `_source` | `<string>` | Model-derived | Overrides the remembered source string tied to the model for bookkeeping and UI display. |
| `L-*` / lexical keys | `<float>` | Machine-generated | Numerous `L...` entries store learned token weights; altering them manually is unsupported and typically overwritten by the classifier. |
