# segmenters.conf

Defines named segmentation schemes Splunk uses while breaking `_raw` into index/search tokens (`SEGMENTATION` setting in `props.conf` references these stanza names).

**Source version:** Splunk Enterprise 10.2

## File details

| Property | Value |
|----------|-------|
| Location | `$SPLUNK_HOME/etc/system/local/` (must remain consistent across search heads and peers) |
| Pipeline phase | Indexing / Search |
| Restart required | Yes |
| Related files | `props.conf`, clustered bundle replication |

## Stanzas and settings

### `[default]` (global defaults)

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *standard merge semantics* | — | — | Only one `[default]` stanza should exist; duplicates merge with last-wins semantics. |

### `[<segmenter_name>]`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `MAJOR` | `<space-separated breakers>` | Long default charset list | Characters/strings that delimit major tokens for inverted index segmentation. |
| `MINOR` | `<space-separated strings>` | `/ : = @ . - $ # % \\ _` | Additional breakpoints producing finer-grained tokens anchored to majors. |
| `INTERMEDIATE_MAJORS` | `true \| false` | `false` | When true, progressively expands IPv4 fragments (`a`, `a.b`, …) at noticeable indexing cost. |
| `FILTER` | `<regex>` | — | Limits segmentation to substring captured by regex group 1 when supplied. |
| `LOOKAHEAD` | `<integer>` | `-1` | Maximum characters of `_raw` examined after filters (`0` disables segmentation, `-1` processes entire event). |
| `MINOR_LEN` | `<integer>` | `-1` | Maximum minor-token length before truncation (`-1` unlimited). |
| `MAJOR_LEN` | `<integer>` | `-1` | Maximum major-token length before truncation (`-1` unlimited). |
| `MINOR_COUNT` | `<integer>` | `-1` | Caps minor segments per event (`-1` unlimited). |
| `MAJOR_COUNT` | `<integer>` | `-1` | Caps major segments per event (`-1` unlimited). |
