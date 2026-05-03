# sitop — summary-indexing version of top

Source: Splunk Search Reference 10.2.0

## Syntax

    | sitop [<N>] [<top-options>...] <field-list> [BY <field-list>]

Syntax is identical to `top`. See `top.md` for full parameter descriptions.

### Options (same as top)

| Option | Default | Description |
|---|---|---|
| `<N>` | 10 | Number of most-frequent values to return; `0` = all |
| `countfield=<string>` | `count` | Name of the output count field |
| `limit=<int>` | 10 | Same as `<N>`; alternative way to specify result count |
| `otherstr=<string>` | `OTHER` | Label for the catch-all "other" row (when `useother=true`) |
| `percentfield=<string>` | `percent` | Name of the output percentage field |
| `showcount=<bool>` | true | Whether to include the count field |
| `showperc=<bool>` | true | Whether to include the percent field |
| `useother=<bool>` | false | Whether to add a row representing all values not in the top N |

## Description

`sitop` is the summary-indexing version of `top`. Use it in scheduled searches to populate a summary index with pre-aggregated top-N statistics. Report against the summary index later with the regular `top` command using the **exact same search string**, substituting `top` for `sitop`.

**Use in scheduled searches for summary indexing** — not useful in ad hoc searches.

## Examples

### Scheduled: top source IPs (firewall summary)

    eventtype=firewall | sitop src_ip | collect index=summary_firewall

### Report against the summary index (over the past year)

    index=summary search_name="summary - firewall top src_ip" | top src_ip

### Top user-agent strings by host (scheduled daily)

    index=web sourcetype=access_combined
    | sitop 20 useragent BY host
    | collect index=summary_web

## Gotchas

- **Use si* vs standard**: use `sitop` only in scheduled searches writing to a summary index. Use `top` for immediate results.
- **`collect` must follow** — `sitop` alone does not write to the summary index.
- **Filter by search_name when reporting** — if a summary index contains data from multiple searches, always filter by `search_name="..."` to avoid mixing statistics from different summaries.
- **Exact same string when reporting** — the downstream `top` search must use the identical field list and options as the `sitop` population search.

## Tips

- Specify the search name explicitly in the reporting search (`search_name="..."`) to isolate the relevant summary data — the summary index often contains results from many different scheduled searches.

## See also

- `top.md` — the standard version; full parameter reference
- `sichart.md`, `sistats.md`, `sitimechart.md`, `sirare.md` — other si* commands
- `collect.md` — write si* results to a summary index
- `overlap.md` — audit summary index coverage
