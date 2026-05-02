# multikv — extract fields from tabular (multi-row) formatted events

Source: Splunk Search Reference 8.2.12, page 428.

## Syntax

    | multikv [conf=<stanza_name>] [<multikv-option>...]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `conf` | No | — | Stanza name in `multikv.conf` defining custom extraction rules for this source |
| `copyattrs` | No | `true` | Copy all fields from the original event to each generated event; set `false` to suppress (events will have no `_time` field) |
| `fields` | No | — | Space-separated list of field names to extract; fields not in this list are ignored |
| `filter` | No | — | Space-separated list of terms; rows not containing at least one term are skipped |
| `forceheader` | No | auto-detect | 1-based line number to use as the table header; does not count empty lines |
| `multitable` | No | `true` | Allow multiple tables in a single `_raw` event |
| `noheader` | No | `false` | Handle a table with no header row; fields are named `Column_1`, `Column_2`, ...; implies `multitable=false` |
| `rmorig` | No | `true` | Remove the original event from output; set `false` to retain the original alongside generated rows |

`multikv` is a distributable streaming command.

## Examples

### Extract a specific field, filtered to rows containing a keyword

Extract the `COMMAND` field from rows in events that contain the word `splunkd`:

    index=os_logs sourcetype=ps_output
    | multikv fields COMMAND filter splunkd

### Extract multiple fields

    index=os_logs sourcetype=ps_output
    | multikv fields pid command
    | table _time, pid, command

### Extract all fields, keeping the original event

    index=os_logs
    | multikv rmorig=false
    | table _time, _raw, PID, COMMAND, %CPU

## Gotchas

- **Auto-detection of the header row can fail** — `multikv` attempts to identify the
  header line automatically. If the source format is unusual (e.g., leading blank lines
  or banner text), use `forceheader=<line_number>` to pin the header explicitly.

- **`copyattrs=false` drops `_time`** — generated rows will have no timestamp and
  will not display correctly in the UI. Only set `copyattrs=false` if you are
  immediately overwriting `_time` with a subsequent `eval` or `rename`.

- **`multikv` is not for key=value logs** — use `extract` or `rex` for `key=value`
  formatted events. `multikv` is specifically for events that contain an embedded
  table with a header row and data rows (e.g., the output of `ps`, `netstat`,
  or `df`).

## See also

- `extract.md` — key-value pair extraction from `_raw`
- `kvform.md` — form-file based extraction
- `rex.md` — regex-based extraction
- `xmlkv.md` — XML element-based extraction
- `spath.md` — JSON and XML structured extraction
