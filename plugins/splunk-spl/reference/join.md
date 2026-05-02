# join — combine results with subsearch (SQL-style join)

Source: Splunk Search Reference 8.2.12, page 362.

## Syntax

    | join [type=inner|outer|left] [usetime=<bool>] [earlier=<bool>] [overwrite=<bool>] [max=<int>] <field-list> [<subsearch>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| field-list | yes | — | Fields to join on (comma-separated) |
| subsearch | yes | — | Search enclosed in square brackets |
| type | no | inner | Join type: `inner`, `outer`, or `left` |
| max | no | 1 | Max subsearch results per join key. Use `max=0` for unlimited |
| overwrite | no | true | If true, subsearch fields overwrite main search fields |

## Examples

### Inner join

```spl
index=main sourcetype=access_combined
| join src [search index=main sourcetype=syslog | stats count AS syslog_count by src]
```

### Left join — keep all main results

```spl
index=main sourcetype=firewall
| join type=left src [search index=main sourcetype=auth | stats values(user) AS users by src]
```

## Gotchas

- **Default max=1:** Only the first matching subsearch result is joined per key. Use `max=0` for all matches — this is trap #6.
- **Subsearch 50K limit:** The subsearch silently truncates at 50,000 results. For large datasets, prefer `stats` + `eventstats` pattern over `join`.
- **Prefer stats-based correlation:** `join` is expensive. Often replaceable with: `| stats values(field) by key` across combined searches.

## See also

- `selfjoin.md` — join results with themselves
- `lookup.md` — enrichment from lookup tables (often better than join)
- `append.md` — stack results instead of merging
- `stats.md` — stats-based correlation alternative
