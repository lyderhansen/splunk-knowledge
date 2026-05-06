# fields.conf

Controls multivalue tokenization, distinguishes indexed versus extracted fields, and tunes how searches rewrite predicates against indexed values—critical for performance when combining structured extractions with indexed metadata patterns.

**Source version:** Splunk Enterprise 10.2

## File details

| Property | Value |
|----------|-------|
| Location | `$SPLUNK_HOME/etc/system/local/` (or app context) |
| Pipeline phase | Search |
| Restart required | No |
| Related files | props.conf, transforms.conf |

## Stanzas and settings

### `[default]`

Follows Splunk’s standard merge semantics for `[default]` (combine duplicates, last wins, stanza overrides global). No extra `[default]` attributes appear in the shipped spec beyond those universal precedence notes.

### `[<FIELD>|::<scope>::<pattern>]`

`<FIELD>` names can include letters, digits, `.`, `:`, `_` (not starting with digit or `_`). Scoped wildcards such as `[sourcetype::splunk_resource_usage::data*]` tie indexed fields to metadata defined in `props.conf`; requires `indexed_fields_expansion = true` in `limits.conf` for sourcetype-scoped wildcards.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `TOKENIZER` | `<regular expression>` | _(none)_ | Regex whose first capture group builds multivalue sets for search/`stats`; ignored when `INDEXED=true`; consumed by `search`, `where`, async APIs, `top`, `timeline`, and `stats`. |
| `INDEXED` | `<boolean>` | `false` | Marks fields built at index time (`true`) versus search time (`false`). |
| `INDEXED_VALUE` | `true \| false \| <sed-cmd> \| <simple-substitution-string>` | `true` | Describes whether values live in raw text; `true` expands `key=value` searches; supports `sed`-style or `<VALUE>` substitutions that may emit LISPY expressions when results start with `[`. Only meaningful when `INDEXED=false`. |
