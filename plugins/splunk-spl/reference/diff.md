# diff — compare two search result rows line by line

Source: Splunk Search Reference 10.2.0

## Syntax

    | diff [position1=<int>] [position2=<int>] [attribute=<field>]
           [diffheader=<bool>] [context=<bool>] [maxlen=<int>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `position1` | No | `1` | Row index of the first result to compare (1-based) |
| `position2` | No | `2` | Row index of the second result to compare. Must be greater than `position1` |
| `attribute` | No | `_raw` | Field to compare between the two rows. Defaults to the raw event text |
| `diffheader` | No | `false` | If `true`, include a traditional Unix diff header, making output valid for `patch` |
| `context` | No | `false` | If `true`, use context-mode diff format. If `false`, use unified diff format |
| `maxlen` | No | `100000` | Maximum bytes to diff from each event. `0` = no limit |

## Usage

`diff` mimics Unix `diff` output and shows the line-by-line difference between two selected rows. It is useful for comparing two configurations, two log events, or two search result snapshots to find exactly what changed.

The output contains a single field with the diff text. Lines prefixed with `-` appear only in the first event; lines prefixed with `+` appear only in the second.

## Examples

### Compare the first two raw events (default)

    index=main host=web01 sourcetype=access_combined
    | head 2
    | diff

### Compare a specific field between two rows

    index=config sourcetype=props_conf
    | diff position1=1 position2=3 attribute=_raw

### Compare the 9th and 10th rows with a diff header

    index=audit
    | sort _time
    | diff position1=9 position2=10 diffheader=true

### Compare configuration snapshots stored as fields

    index=change_mgmt sourcetype=config_snapshot
    | diff position1=1 position2=2 attribute=config_text context=true

## Gotchas

- **Only compares two rows at a time** — `diff` always compares exactly two positions. To compare more events, chain multiple `diff` calls or use `set` for set-based comparisons.
- **`position2` must be greater than `position1`** — specifying `position1=5 position2=3` raises an error. The second position must be a higher row number.
- **Row positions are based on result order** — use `| sort` before `diff` to control which events end up in positions 1 and 2. Without sorting, the order may be non-deterministic.
- **`maxlen=100000` (100 KB) limits large event comparisons** — for very large configuration blobs or log payloads, increase `maxlen` or set `maxlen=0` to avoid truncated diffs.
- **Output is not structured** — the result is a text diff, not a table of changed fields. For structured field-level comparison, process results with `rex` or a lookup after `diff`.

## See also

- `set.md` — set operations (union, intersection, difference) across entire result sets
- `loadjob.md` — load a previous search's results to compare against current results
