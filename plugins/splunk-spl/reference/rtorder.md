# rtorder — buffer real-time events for time-ordered emission

Source: Splunk Search Reference 10.2.0

## Syntax

    | rtorder [discard=<bool>] [buffer_span=<span-length>] [max_buffer_size=<int>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `buffer_span` | No | 10s | How long to hold events in the buffer before emitting them; events are held until current time exceeds `event._time + buffer_span` |
| `discard` | No | false | When `true`, out-of-order events that arrive after a later event has already been emitted are silently discarded; when `false`, they are emitted immediately out of order |
| `max_buffer_size` | No | 50000 | Maximum number of events held in buffer at any time; controlled by `max_result_rows` in `limits.conf` |

## Examples

### Buffer events for 10 seconds (default), discard stragglers

    index=network sourcetype=flow
    | rtorder discard=true

### Use a 5-minute buffer for late-arriving log events

    index=syslog sourcetype=linux_secure
    | rtorder discard=true buffer_span=5m

### Buffer without discarding — emit out-of-order events immediately

    index=app_events
    | rtorder discard=false buffer_span=30s

## Gotchas

- **Real-time searches only** — `rtorder` is designed exclusively for real-time search pipelines. Using it in a historical search provides no benefit because historical events are already delivered in order.
- **Buffer span is a lag trade-off** — a larger `buffer_span` means more correct ordering but introduces latency in visualization updates. Start at 10–30 seconds for most log sources; use minutes only when dealing with very late-arriving data.
- **Max buffer size limits protection** — when `max_buffer_size` is exceeded, the oldest buffered events are emitted regardless of order. On very high-volume streams this means ordering can still break if the buffer fills before events arrive.
- **Not persistent** — the buffer lives in memory for the duration of the search job. Search restarts reset the buffer.

## Tips

- Combine with `| sort _time` in the subsearch of a dashboard panel that drills down to ordered event lists.
- Monitor the buffer fill rate in `index=_internal` metrics if you see frequent out-of-order events after applying `rtorder`.

## See also

- `sort.md` — sort results in historical (non-real-time) searches
