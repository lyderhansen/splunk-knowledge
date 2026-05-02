# loadjob — load results from a previously completed search job

Source: Splunk Search Reference 10.2.0

## Syntax

    | loadjob (<sid> | savedsearch="<user>:<app>:<name>")
              [events=<bool>]
              [artifact_offset=<int>]
              [job_delegate=<string>]
              [ignore_running=<bool>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `sid` | Option A | — | Search job ID string (e.g., `1233886270.2`). Found in Job Inspector or `addinfo` |
| `savedsearch` | Option B | — | Saved search reference as `"user:app:name"` — all three parts are required |
| `events` | No | `false` | If `true`, load raw events instead of search results |
| `artifact_offset` | No | `0` | Select a non-latest artifact. `0` = most recent, `1` = second most recent, etc. |
| `job_delegate` | No | `scheduler` | Filter to artifacts run by a specific user. Scheduled jobs use `scheduler` |
| `ignore_running` | No | `true` | If `true`, skips artifacts from still-running searches |

## Usage

`loadjob` is a generating command (leading `|`) that replays cached artifacts from a previous search. It is efficient for dashboards — run an expensive search on a schedule and display its cached results without re-executing the underlying query.

By default, `loadjob` loads **results** (transformed output). Set `events=true` to load raw filtered events instead.

**Truncation warning:** By default, Splunk truncates output to a sample. To retrieve full results, the underlying search should end with a transforming command (like `table`) so results rather than events are stored.

## Examples

### Load results of the latest scheduled saved search run

    | loadjob savedsearch="admin:search:Daily Summary Report"

### Load raw events from a saved search

    | loadjob savedsearch="admin:network:Firewall Events" events=true
    | stats count by src_ip
    | sort - count

### Load a specific previous artifact (not the latest)

    | loadjob savedsearch="admin:search:Hourly Metrics" artifact_offset=2

### Load by job SID (useful in ad-hoc investigations)

    | loadjob 1700000000.42
    | table _time, host, status, bytes

## Gotchas

- **All three parts of `savedsearch` are required** — `savedsearch="admin:search:My Search"` must include user, app, and exact search name. There is no wildcard support. A typo in any part produces an empty result or error.
- **Time range picker is ignored** — `loadjob` returns the stored artifact as-is; the current search's time window does not re-filter the cached results.
- **Search head clusters only replicate scheduled search artifacts** — ad-hoc job SIDs may not be available on other search heads in a cluster.
- **Results may be truncated** — if the source search returned events (not results), the loadjob output may be a sample. Append `| table <fields>` to the source search to force result storage.
- **Real-time searches not supported** — `loadjob` cannot be used on real-time search artifacts.

## See also

- `savedsearch.md` — executes a saved search live (not cached)
- `addinfo.md` — retrieve the current search's SID and other metadata
- `diff.md` — compare results from two time windows
