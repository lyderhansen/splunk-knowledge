# transactiontypes.conf

Predefines transaction searches consumed by the `transaction` command (and `searchtxn`): temporal constraints, field-consistency rules, multivalue rendering, memory eviction controls, and optional seed searches that narrow candidate events.

**Source version:** Splunk Enterprise 10.2

## File details

| Property | Value |
|----------|-------|
| Location | `$SPLUNK_HOME/etc/system/local/` (or app context) |
| Pipeline phase | Search |
| Restart required | No |
| Related files | props.conf |

## Stanzas and settings

### `[default]`

Defines global defaults merged before named transaction stanzas override individual keys. Populate `[default]` using any keys listed under `[<TRANSACTIONTYPE>]` when you want inherited defaults—Splunk merges them using normal precedence rules.

### `[<TRANSACTIONTYPE>]`

`<TRANSACTIONTYPE>` is the transaction name invoked from SPL.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `maxspan` | `[<integer> s\|m\|h\|d\|-1]` | `-1` | Maximum elapsed window covering member events; `-1` disables the constraint; requires descending-time ordering before evaluation. |
| `maxpause` | `[<integer> s\|m\|h\|d\|-1]` | `-1` | Maximum pause between consecutive member events; `-1` disables the constraint; requires descending-time ordering before evaluation. |
| `maxevents` | `<integer>` | `1000` | Caps events per transaction; negative values disable the cap. |
| `fields` | `<comma-separated list of fields>` | `""` | Requires identical values across participating events for listed fields to belong to the same transaction. |
| `connected` | `<boolean>` | `true` | When `fields` is set, determines whether field-neutral events start new transactions (`true`) or join existing ones (`false`). |
| `startswith` | `<transam-filter-string>` | `""` | Filter (`search`, quoted search, or `eval(...)`) marking transaction starts. |
| `endswith` | `<transam-filter-string>` | `""` | Filter marking transaction ends with identical grammar options as `startswith`. |
| `maxopentxn` | `<int>` | from `limits.conf` | LRU cap on unfinished transactions kept resident before eviction policies apply. |
| `maxopenevents` | `<int>` | from `limits.conf` | Maximum events occupying open transactions before LRU eviction triggers. |
| `keepevicted` | `<bool>` | `false` | Emits evicted transactions with `evicted=1` when true. |
| `mvlist` | `<bool> \| <field-list>` | `false` | Renders multivalue fields as arrival-ordered lists (`true`), lexicographic unique sets (`false`), or restricts listing behavior to named fields. |
| `delim` | `<string>` | `" "` | Separator between serialized source-event snippets inside MV transaction fields. |
| `nullstr` | `<string>` | `NULL` | Placeholder text for missing MV entries when rendering lists. |
| `search` | `<string>` | `"*"` | Optional narrowing search used by `searchtxn` to prime candidate events—should be as selective as practical. |
