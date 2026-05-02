# fields — keep or remove fields from search results

Source: Splunk Search Reference 8.2.12, page 305.

## Syntax

    | fields [+|-] <wc-field-list>

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `+\|-` | no | `+` | `+` keeps only the listed fields; `-` removes the listed fields and keeps everything else. |
| `<wc-field-list>` | yes | — | Space- or comma-delimited list of field names. Accepts `*` wildcard (e.g. `value*`). |

## Usage

`fields` is a **distributable streaming command**. It is more efficient than `table` because it
runs on indexers and reduces data transferred to the search head. Use `fields` early in a pipeline
to drop unneeded fields and reduce memory pressure.

Internal fields `_raw` and `_time` are included in Splunk Web output by default. The `fields`
command does NOT remove them unless you explicitly list them. Other internal fields (leading
underscore) are not shown in Splunk Web even if explicitly kept.

To display an internal field in results, copy it to a non-underscore name first:

    | eval bkt = _bkt | table bkt

### Wildcard note

The asterisk `*` is a wildcard in `fields` searches, but you cannot escape it with `\`. A
backslash + asterisk `\*` matches the literal characters `\*`, not an escaped wildcard.
To match field names containing backslashes, double the backslashes:

    | fields http:\\\\*

## Examples

### Keep only specific fields

    ... | fields src_ip, dest_ip, action, _time

### Remove noisy internal fields before export

    ... | fields - _raw _indextime _sourcetype _serial
    ... | outputcsv MyReport

### Performance: drop unneeded fields early

    index=access_* | fields src, action, bytes, status
    | stats sum(bytes) AS total_bytes by src

### Keep a wildcard group of fields

    ... | fields value*          -- keeps value1, value2, value_total, etc.

### Remove all internal fields

    ... | fields - _*

## Gotchas

- **Removing `_time` breaks `timechart` and `chart`** — statistical commands that require date
  or time information cannot operate without `_time`. Only remove it at the very end of the
  pipeline when no further time-based commands follow.

- **`fields` vs `table`** — `fields` is streaming (runs on indexers, efficient mid-pipeline).
  `table` is a transforming command (runs on the search head, good for final column selection
  and ordering). Use `fields` for filtering, `table` for final presentation.

- **Wildcard `*` alone removes all fields** — `| fields - *` removes all fields including
  `_raw` and `_time`. Use `| fields - _*` to remove only internal fields.

## See also

- `table.md` — select and order final output columns (transforming)
- `rename.md` — rename fields
- `eval.md` — create or transform field values
