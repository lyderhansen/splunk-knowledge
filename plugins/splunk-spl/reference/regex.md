# regex — filter events by matching or excluding a regular expression

Source: Splunk Search Reference 8.2.12, page 465.

## Syntax

    | regex [<field>=]<regex-expression>
    | regex [<field>!=]<regex-expression>

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `<field>` | No | `_raw` | Field to match against; omit to match against `_raw` |
| `=` or `!=` | No | `=` (keep matches) | `=` keeps events that match; `!=` discards events that match |
| `<regex-expression>` | Yes | — | A Perl-compatible regular expression (PCRE) as a double-quoted string |

The regex is applied as a match (not a full-string anchor). To anchor use `^` and `$` explicitly.

## Variants

### Filter on `_raw` (default)

    | regex "(?i)error|exception|fatal"

### Filter on a named field

    | regex url="^/api/v\d+/"

### Exclusion filter

Keep only events that do NOT match:

    | regex _raw!="healthcheck|ping"

## Examples

### Basic: filter error-level events from raw

    index=app sourcetype=app_logs
    | regex "(?i)(ERROR|CRITICAL|FATAL)"
    | stats count by host

### Field-specific inclusion with capture hint

    index=web sourcetype=access_combined
    | regex uri="^/admin/"
    | stats count by clientip
    | sort 0 -count

### Exclusion: drop bot/scanner noise

    index=web sourcetype=access_combined
    | regex useragent!="(?i)(bot|crawler|spider|scanner|masscan)"
    | stats count by useragent
    | sort 0 -count

## Gotchas

- **`regex` is not `rex`** — `regex` filters events (keeps or discards); `rex` extracts fields. They share regex syntax but serve opposite purposes. A common mistake is writing `| regex field="(?P<name>...)"` expecting a new field — use `rex` for extraction.

- **`!=` does not mean "the field is absent"** — events where the field does not exist are kept by `regex field!=pattern` because a missing field does not match the pattern. Add an explicit `| where isnotnull(field)` if needed.

- **Performance vs `search`** — `search field=*value*` with wildcards is faster than `regex` for simple substring matches because `search` uses the index bloom filter. Use `regex` when you genuinely need regex power (anchors, alternation, quantifiers).

## See also

- `rex.md` — regex-based field extraction (named capture groups, sed mode)
- `search.md` — keyword and wildcard filtering; faster for simple substring matches
- `where.md` — `match(field, "regex")` as an inline alternative within eval expressions
