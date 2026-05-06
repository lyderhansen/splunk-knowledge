# source-classifier.conf

Controls supplemental rules used while Splunk’s file classifier learns and compares sources/sourcetypes so noisy tokens (hostnames, dates, common path fragments) do not dominate sourcetype models or filename similarity checks.

**Source version:** Splunk Enterprise 10.2

## File details

| Property | Value |
|----------|-------|
| Location | `$SPLUNK_HOME/etc/system/local/` (or app `local/` / `default/`) |
| Pipeline phase | Parsing |
| Restart required | No |
| Related files | `props.conf`, `sourcetypes.conf`, `inputs.conf` |

## Stanzas and settings

### `[default]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `ignored_model_keywords` | `<space-separated list>` | Built-in example list in `default/` | Tokens Splunk ignores when building learned sourcetype lexical models so sensitive or overly common words do not appear in model bundles. |
| `ignored_filename_keywords` | `<space-separated list>` | Built-in example list in `default/` | Tokens ignored when comparing a new source path/name to an existing one during classification, reducing false matches on generic filename fragments. |
