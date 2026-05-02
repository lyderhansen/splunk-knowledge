# outputcsv — write search results to a CSV file on the search head

Source: Splunk Search Reference 10.2.0

## Syntax

    | outputcsv [append=<bool>] [create_empty=<bool>] [override_if_empty=<bool>]
               [dispatch=<bool>] [usexml=<bool>] [singlefile=<bool>]
               [<filename>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `filename` | No | auto-generated | CSV file name to write. Saved to `$SPLUNK_HOME/var/run/splunk/csv/` |
| `append` | No | `false` | If `true`, appends to an existing file (cannot append to `.gz` files). Creates the file if it does not exist |
| `create_empty` | No | `false` | If `true`, creates a zero-length file even when there are no results; if `false` and no results, an existing file is deleted |
| `override_if_empty` | No | `true` | Whether to overwrite an existing file when result set is empty |
| `dispatch` | No | `false` | If `true`, writes the file to the search job dispatch directory instead of the CSV directory |
| `singlefile` | No | `true` | If `false`, splits output across multiple files |
| `usexml` | No | `false` | If `true`, writes in Splunk XML results format instead of CSV |

## Usage

`outputcsv` writes results to `$SPLUNK_HOME/var/run/splunk/csv/<filename>` on the **local search head**. It is a streaming command — results pass through unchanged to the next command in the pipeline.

**Splunk Cloud Platform:** `outputcsv` is not available. Use scheduled alert email attachments, REST API export, or `outputlookup` instead.

**Security note:** This command is flagged as risky by SPL safeguards because it writes to the filesystem. Users need appropriate permissions.

## Examples

### Write a daily count summary to CSV

    index=web sourcetype=access_combined
    | stats count by status
    | outputcsv daily_status_counts.csv

### Append today's results to a rolling log file

    index=firewall
    | stats count by src_ip
    | sort -count
    | head 100
    | outputcsv append=true top_sources.csv

### Write and continue pipeline processing

    index=main | stats sum(bytes) AS total_bytes by host
    | outputcsv host_bytes.csv
    | sort -total_bytes
    | head 10

## Gotchas

- **Splunk Cloud Platform does not support this command** — `outputcsv` only works in Splunk Enterprise. On Cloud, use `outputlookup` for persistent data or schedule an alert with an email attachment.
- **File is not replicated in a search head cluster** — the CSV is written only to the local search head that executed the search. Other cluster members will not have the file.
- **`create_empty=false` deletes existing files** — if your search returns zero results with `create_empty=false`, any previously written file of the same name is deleted. Set `create_empty=true` to preserve files when no results are found.
- **Appending respects the existing header** — when `append=true`, only fields matching the existing file's header are written. New fields introduced by a changed search will be silently dropped.
- **Risky command safeguards** — `outputcsv` may trigger an acknowledgment prompt in Splunk Web for users who have not been granted the `run_risk_cmd` capability.

## See also

- `outputlookup.md` — writes to a persistent KV store or CSV lookup (preferred for shared or replicated data)
- `inputcsv.md` — reads a CSV file back into a search pipeline
- `collect.md` — writes events to a summary index
