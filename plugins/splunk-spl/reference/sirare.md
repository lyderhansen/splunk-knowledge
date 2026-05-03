# sirare — summary-indexing version of rare

Source: Splunk Search Reference 10.2.0

## Syntax

    | sirare [<top-options>...] <field-list> [BY <field-list>]

Syntax is identical to `rare`. See `rare.md` for full parameter descriptions.

### Options (same as rare/top)

| Option | Default | Description |
|---|---|---|
| `countfield=<string>` | `count` | Name of the output count field |
| `limit=<int>` | 10 | Number of least-frequent values to return; `0` = all |
| `percentfield=<string>` | `percent` | Name of the output percentage field |
| `showcount=<bool>` | true | Whether to include the count field |
| `showpercent=<bool>` | true | Whether to include the percent field |

## Description

`sirare` is the summary-indexing version of `rare`. Use it in scheduled searches to populate a summary index with pre-aggregated rarity statistics. Report against the summary index later with the regular `rare` command using the **exact same search string**, substituting `rare` for `sirare`.

**Use in scheduled searches for summary indexing** — not useful in ad hoc searches.

## Examples

### Track least-common user agents (scheduled search)

    index=web sourcetype=access_combined
    | sirare useragent
    | collect index=summary_web

### Report against summary index

    index=summary_web | rare useragent

### Least-common source IPs by destination port

    index=network sourcetype=firewall
    | sirare src_ip by dest_port
    | collect index=summary_network

## Gotchas

- **Use si* vs standard**: use `sirare` only in scheduled searches writing to a summary index. Use `rare` directly for immediate results.
- **`collect` must follow** — `sirare` alone does not write to the summary index.
- **Exact same string when reporting** — the downstream `rare` search must use the identical field list and options as the `sirare` population search.

## Tips

- `sirare` is useful for security use cases — schedule it to continuously track anomalous low-frequency events without re-scanning raw logs for each dashboard load.

## See also

- `rare.md` — the standard version; full parameter reference
- `sichart.md`, `sistats.md`, `sitimechart.md`, `sitop.md` — other si* commands
- `collect.md` — write si* results to a summary index
- `overlap.md` — audit summary index coverage
