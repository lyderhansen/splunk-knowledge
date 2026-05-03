# outputtext — copy raw event text to the _xml field

Source: Splunk Search Reference 10.2.0.

## Syntax

    | outputtext [usexml=<bool>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `usexml` | No | `true` | If `true`, copy `_raw` to `_xml` as XML-escaped text. If `false`, copy `_raw` verbatim |

## Usage

- `outputtext` is an internal mechanism, originally created to render event text for Splunk's output pipeline.
- It is a reporting command — all search results are written to the search head; output appears in the Statistics tab.
- The `_xml` field produced is consumed by Splunk's UI and export layers; it is rarely useful in user-constructed searches.
- `usexml=true` (default) HTML/XML-escapes special characters (`<`, `>`, `&`, `"`) in the copied text.
- `usexml=false` makes `_xml` an exact duplicate of `_raw`.

## Examples

### Output events as XML-escaped text (default)

    index=main | head 5 | outputtext

### Output events as plain text (no XML escaping)

    index=main | head 5 | outputtext usexml=false

### Inspect the _xml field alongside _raw

    index=main sourcetype=syslog | head 3
    | outputtext
    | table _time, _raw, _xml

## Gotchas

- **Internal command** — `outputtext` is documented as an internally used component; prefer `tojson`, `outputcsv`, or `table` for standard export use cases.
- **Reporting command** — all results are pulled to the search head before writing; avoid on very large result sets.
- **`_xml` is overwritten** — if `_xml` already exists in your events, `outputtext` will replace its value.
- **Not for JSON export** — use `tojson` or `spath` for JSON handling; `outputtext` produces XML-escaped plain text only.

## See also

- `outputcsv.md` — export results as CSV
- `tojson.md` — export results as JSON
- `table.md` — display selected fields in tabular form
