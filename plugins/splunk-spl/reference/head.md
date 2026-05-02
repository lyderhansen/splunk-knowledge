# head — return the first N events from the pipeline

Source: Splunk Search Reference 8.2.12, page 343.

## Syntax

    | head [<N>] [limit=<int>] [null=<bool>] [keeplast=<bool>] [while <eval-expression>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `<N>` | No | 10 | Number of events to return from the top of the result set |
| `limit=<int>` | No | 0 (no limit) | Maximum number of events to process before stopping (alternative syntax to positional `<N>`) |
| `null=<bool>` | No | `false` | Used with `while`; if `true`, events where the `while` expression is null are kept |
| `keeplast=<bool>` | No | `false` | Used with `while`; if `true`, the last event (the one that caused the `while` condition to fail) is included |
| `while <eval-expression>` | No | (none) | Keep returning events as long as the expression is true; stop at the first false event |

## Variants

### Simple count

    | head 10

### Conditional: while a field value holds

Stop returning events as soon as cumulative bytes exceed 1 MB:

    | sort 0 -bytes
    | head while bytes > 0

### Conditional with keeplast

Include the event that broke the condition:

    | sort 0 _time
    | head keeplast=true while _time < relative_time(now(), "-1h")

## Examples

### Basic: top 5 events by count

    index=web sourcetype=access_combined
    | stats count by clientip
    | sort 0 -count
    | head 5

### Subsearch limiter (performance pattern)

    index=firewall action=deny
        [search index=firewall demo_id=exfil
         | head 1
         | return 1 $src_ip]

`head 1` inside a subsearch prevents runaway result sets.

### Paginate: rows 11-20 via tail + head

    index=web
    | stats count by uri
    | sort 0 -count
    | head 20
    | tail 10

## Gotchas

- **`head` is a centralized streaming command** — it runs on the search head, not on indexers. All events must travel to the search head before `head` can truncate them. Use time range, index, and sourcetype filters early to reduce data volume.

- **Default is 10, not unlimited** — a bare `| head` without a number keeps only 10 events, which can silently truncate results in dashboards that omit an explicit limit.

- **Event order is pipeline order, not time order** — `head 10` keeps the first 10 events as delivered by the indexers, which may not be time-ordered. If you need the 10 earliest or latest, `sort` first.

## See also

- `tail.md` — return the last N events
- `sort.md` — order events before slicing with `head`
- `reverse.md` — flip result order without resorting
