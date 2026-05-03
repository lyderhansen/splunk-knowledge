# overlap — find overlapping or missing events in a summary index

Source: Splunk Search Reference 10.2.0

## Syntax

    | overlap

No parameters. Must be used after reading from a summary index that contains `si*`-generated results.

## Description

`overlap` inspects summary index events to identify two problems:

- **Time overlaps** — events where two scheduled search runs cover the same time window (e.g. a search ran twice for the same period), causing duplicate data in the summary index.
- **Time gaps** — periods where a scheduled search missed its run window entirely, resulting in holes in the summary data.

The command invokes an external Python script (`sumindexoverlap.py`) that groups events by `info_search_name` and compares `info_min_time` / `info_max_time` boundaries across different `info_search_id` values.

**Required input fields:** `info_min_time`, `info_max_time`, `info_search_id`, `info_search_name` — these are added automatically by `collect` when writing summary index results.

## Examples

### Find overlaps and gaps in a named summary search

    index=summary search_name="Daily Network Report" | overlap

### Check all summary data for problems

    index=summary | overlap

### Identify which search has overlapping coverage

    index=summary | overlap | where isnotnull(reason) | table _time, info_search_name, reason

## Gotchas

- **Raw events break overlap** — `overlap` only works on summary index events that contain aggregated results (from `sistats`, `sichart`, etc.). If the summary index contains raw `_raw` events, the command will not work correctly.
- **Do not use overlap to backfill** — use `fill_summary_index.py` to fill gaps. `overlap` is diagnostic only.
- **Splunk Cloud backfill requires a Support ticket** — the fill script is not self-service on Splunk Cloud Platform.
- **Manually delete overlaps** — Splunk does not auto-remove duplicate summary events. After identifying overlaps you must delete them via SPL `delete` or contact Splunk Support.

## Tips

- Run `| overlap` as part of a monitoring search on a schedule to get alerted when summary indexes drift.
- Combine with `collect` in a `| overlap | where reason="gap" | ...` pipeline to trigger remediation workflows.

## See also

- `collect.md` — write results to a summary index
- `sistats.md`, `sichart.md`, `sitimechart.md`, `sitop.md`, `sirare.md` — commands that populate summary indexes
