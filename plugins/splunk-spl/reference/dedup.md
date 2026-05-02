# dedup — remove duplicate events based on field values

Source: Splunk Search Reference 8.2.12, page 263.

## Syntax

    | dedup [<N>] <field> [<field>...] [keepevents=<bool>] [keepempty=<bool>] [consecutive=<bool>] [sortby [+|-]<sort-field>...]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `<N>` | No | 1 | Number of events to keep per unique field combination |
| `<field>` | Yes | — | One or more fields that define the duplicate key |
| `keepevents` | No | `false` | If `true`, duplicate events are kept but a field `isDuplicate` is added (value `1` for dupes) |
| `keepempty` | No | `false` | If `true`, events where any key field is null/empty are kept rather than discarded |
| `consecutive` | No | `false` | If `true`, only removes consecutive duplicates (like Unix `uniq`); non-consecutive duplicates are kept |
| `sortby` | No | (none) | Sort events within each duplicate group before applying the keep-N rule; prefix with `-` to sort descending |

## Examples

### Basic: keep the first event per source IP

    index=firewall
    | dedup src_ip
    | table src_ip, dest_ip, action, _time

### Keep first N: keep three most recent events per user

    index=auth
    | sort 0 -_time
    | dedup 3 user
    | table _time, user, action, src_ip

### Keep latest event per key (pattern)

    index=inventory
    | dedup host sortby -_time
    | table host, version, status

### Multi-field dedup

    index=network
    | dedup src_ip dest_port
    | stats count by src_ip

## Gotchas

- **Order matters — `dedup` keeps whichever event arrives first in the pipeline** — if you want the latest or specific event, `sort` before `dedup` or use `sortby`. Without pre-sorting, which event is "first" is undefined in distributed searches.

- **`dedup` is a dataset-processing command** — it requires a full pass over the result set and runs on the search head, not on indexers. Placing it early in a large pipeline forces all events to the search head before filtering. Prefer `stats` when you only need aggregated counts rather than the raw events.

- **Null handling with `keepempty=false` (default)** — events where the dedup key field is null or empty are silently dropped. Set `keepempty=true` or pre-fill with `fillnull` to retain them.

## See also

- `uniq.md` — remove consecutive duplicate lines (equivalent to `dedup consecutive=true`)
- `stats.md` — aggregate rather than deduplicate when raw events are not needed
- `sort.md` — sort before `dedup` to control which event is kept
