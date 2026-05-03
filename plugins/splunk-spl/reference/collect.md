# collect — write results to a summary index

Source: Splunk Search Reference 10.2.0

Adds the results of a search to a summary index. Used to pre-aggregate expensive searches
so that dashboards and reports can query the much smaller summary index instead of raw data.
The summary index must be created before `collect` is called.

**Caution:** `collect` is flagged as a risky SPL command. It triggers SPL safeguards in
Splunk and requires the `schedule_search` capability. Incorrect use can silently duplicate
data into the summary index.

## Syntax

    | collect index=<index-name>
              [addinfo=<bool>] [addtime=<bool>] [file=<string>] [spool=<bool>]
              [marker=<string>] [output_format=raw|hec] [testmode=<bool>]
              [run_in_preview=<bool>] [host=<string>] [source=<string>]
              [sourcetype=<string>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `index` | No* | `summary` | Target summary index. Required for metrics indexes; optional for event indexes |
| `marker` | No | — | String (usually key=value pairs) appended to each collected event for identification |
| `testmode` | No | false | Preview what would be collected without writing; safe for testing |
| `addtime` | No | true (events) | Prefix `_time` field onto each event; uses `info_min_time` or `_time` |
| `addinfo` | No | true (events) | Prefix `info_min_time`, `info_max_time`, `info_search_time` onto each event |
| `output_format` | No | `raw` | `raw` = traditional stash format; `hec` = HEC JSON format (all fields auto-indexed) |
| `run_in_preview` | No | false | Allow collection during search preview (not just on completion) |
| `host` | No | — | Override host metadata for collected events |
| `source` | No | — | Override source metadata for collected events |
| `sourcetype` | No | — | Override sourcetype metadata for collected events |

## Examples

### Scheduled daily collection with a marker

    index=main sourcetype=access_combined
    | stats count AS requests, sum(bytes) AS total_bytes by host
    | collect index=summary marker="report=daily_web,version=1"

### Test before writing

    index=main sourcetype=syslog
    | stats count by src, action
    | collect index=summary testmode=true

### Collect with HEC format (all fields indexed)

    index=main | stats avg(response_time) AS avg_rt by app
    | collect index=summary output_format=hec sourcetype=perf_summary

## Gotchas

- **Summary index must exist first** — `collect` does not create the index. If the target
  index does not exist, the command fails silently or errors depending on version.
- **Data is written with original `_time`, not collection time** — collected events keep
  their `_time` from the source search. A search run at 23:00 collecting hourly stats for
  08:00–09:00 stores events with `_time` in that hour. This is correct for analytics but
  surprises users who expect collection time.
- **Use `marker` for identification** — without a marker, collected summary events are
  indistinguishable from other data in the same index. Always include at minimum
  `marker="report=<name>"`.
- **Avoid duplicate collection** — if a scheduled search runs late or is retried, `collect`
  will write duplicate rows. Use `overlap.md` to detect and `delete` to clean up.
- **`addinfo=true` / `addtime=true` are incompatible with `output_format=hec`** — if you
  set HEC format, those options are ignored or cause an error.
- **License impact** — HEC format with a non-stash sourcetype counts against your license.
  Default raw format with sourcetype `stash` does not.

## Tips

- Schedule the `collect` search to run slightly after the time bucket closes
  (e.g., a daily search at 00:05) so it captures all events for the previous day.
- Use `overlap` searches on the summary index to detect gaps and duplicates after
  collection jobs run.

## See also

- `overlap.md` — detect missed or overlapping summary index collections
- `mcollect.md` — write to a metrics index
- `tscollect.md` — write tsidx files for `tstats`
- `sistats.md` — summary indexing variant of `stats`
