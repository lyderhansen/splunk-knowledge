# rex — extract fields with regex named groups or rewrite fields with sed

Source: Splunk Search Reference 8.2.12, page 481.

## Syntax

    | rex [field=<field>] "<regex-expression>" [max_match=<int>] [offset_field=<string>]
    | rex [field=<field>] mode=sed "<sed-expression>"

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `field` | No | `_raw` | Source field to match against |
| `<regex-expression>` | Yes* | — | PCRE regex with named capture groups; mutually exclusive with `mode=sed` |
| `mode=sed` | Yes* | — | Activates sed replacement mode; mutually exclusive with regex-expression |
| `<sed-expression>` | Yes (sed mode) | — | `s/<regex>/<replacement>/<flags>` or `y/<str1>/<str2>/` |
| `max_match` | No | `1` | Number of times to match; `0` = unlimited (produces multivalue field) |
| `offset_field` | No | (none) | Name of a new field to record match position within the source field |

\* One of `<regex-expression>` or `mode=sed <sed-expression>` is required.

## Variants

### Extract mode (named capture groups)

`rex` applies the unanchored PCRE pattern to the field value and extracts each named group
`(?P<name>...)` or `(?<name>...)` as a new field. Multiple `rex` stages can be chained to
extract several fields from the same event.

    | rex field=_raw "src=(?<src_ip>\d+\.\d+\.\d+\.\d+):(?<src_port>\d+)"
    | rex field=_raw "dst=(?<dst_ip>\d+\.\d+\.\d+\.\d+):(?<dst_port>\d+)"

### Sed mode (replacement / masking)

`mode=sed` applies a sed `s` (replace) or `y` (character substitution) expression
**in-place** on the field. The field value is rewritten; no new field is created.
Supported flags: `g` (global, all matches), or `N` (Nth occurrence).

    | rex field=msg mode=sed "s/\d{3}-\d{2}-\d{4}/XXX-XX-XXXX/g"

## Examples

### Extract email sender and recipient

    source="cisco_esa.txt"
    | rex field=_raw "From: <(?P<from>.*)> To: <(?P<to>.*)>"
    | dedup from to
    | table from to

### Extract all IP addresses into a multivalue field

Use `max_match=0` to collect every match in the event:

    index=firewall
    | rex field=_raw max_match=0 "(?<all_ips>\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})"
    | mvexpand all_ips
    | stats count by all_ips

### Mask sensitive data (sed mode)

    index=app_logs
    | rex field=_raw mode=sed "s/(\d+\.\d+\.\d+\.)\d+/\1xxx/g"
    | table _time, _raw

## Gotchas

- **Default field is `_raw` — and it is slow** — running `rex` against `_raw` requires
  reading the full raw event. Add `field=<extracted_field>` whenever possible to scope
  the match to a smaller, already-extracted field.

- **`max_match=1` (default) only captures the first match** — if you need all occurrences
  (e.g., all IP addresses in a log line), set `max_match=0`. The result is a multivalue
  field; use `mvexpand` or `mvindex` to process individual values.

- **Sed mode rewrites the field in place** — `mode=sed` modifies the field value directly;
  it does not create a new field. If you need to preserve the original, `eval` a copy first:
  `| eval orig_msg = msg | rex field=msg mode=sed "s/secret/REDACTED/g"`.

- **`rex` is distributable streaming** — it runs on indexers, so it is efficient placed
  early in the pipeline before transforming commands.

## See also

- `erex.md` — auto-generate a regex from example values when the pattern is unknown
- `extract.md` — apply field extractions defined in `transforms.conf`
- `spath.md` — structured extraction for JSON and XML fields
