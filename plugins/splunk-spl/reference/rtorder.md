# rtorder — buffer real-time events for time-ordered emission

Source: Splunk Search Reference 10.2.0

## Syntax

    | rtorder [discard=<bool>] [buffer_span=<span-length>] [max_buffer_size=<int>]

`rtorder` is used exclusively in real-time search pipelines to compensate for
out-of-order event arrival. Events are held in an in-memory buffer sorted by `_time`
and emitted only after the current wall-clock time has advanced beyond
`event._time + buffer_span`.

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `buffer_span` | No | 10s | Hold events in the buffer for this long before emitting; accepts `s`, `m`, `h` units |
| `discard` | No | false | When `true`, out-of-order events that arrive after a later event is already emitted are silently dropped; when `false`, they are emitted immediately out of order |
| `max_buffer_size` | No | 50000 | Max events held in buffer; controlled by `max_result_rows` in `limits.conf`; when exceeded oldest events are flushed regardless of order |

## Examples

### Default 10-second buffer, discard late arrivals

```spl
index=network sourcetype=flow
| rtorder discard=true
```

### 5-minute buffer for late-arriving syslog

```spl
index=syslog sourcetype=linux_secure
| rtorder discard=true buffer_span=5m
```

### Buffer without discarding — emit out-of-order events immediately

```spl
index=app_events
| rtorder discard=false buffer_span=30s
```

### Real-time dashboard panel with ordered events

```spl
index=transactions sourcetype=app_log
| rtorder discard=true buffer_span=15s
| eval msg = host . ": " . status
| table _time, host, status, msg
```

## Gotchas

- **Real-time searches only:** `rtorder` has no effect in historical searches because
  historical events are already delivered in `_time` order by the indexers. Adding it
  to a historical search wastes buffer memory without any benefit.

- **Buffer span is a latency trade-off:** A larger `buffer_span` produces more correct
  ordering but introduces an equal amount of display lag in dashboards. For most log
  sources 10–30 seconds is sufficient; use minutes only for very late-arriving data
  sources (e.g., mobile clients with intermittent connectivity).

- **Max buffer size is a hard ceiling:** When `max_buffer_size` is hit, the oldest
  buffered events are emitted regardless of order to prevent memory exhaustion. On very
  high-volume real-time searches the buffer can fill before late events arrive, making
  ordering guarantees weaker than expected.

- **Buffer resets on search restart:** The in-memory buffer is not persistent. If the
  real-time search job is restarted (e.g., due to a search head restart or the job
  expiring), the buffer is empty and ordering resumes from scratch.

- **`discard=false` (default) can produce visible time jumps:** If a significantly
  late event arrives and is emitted out of order, chart visualizations that rely on
  sorted `_time` can show backward jumps. Use `discard=true` in dashboards where
  display consistency matters more than completeness.

## Tips

- Combine with `| table _time, ...` at the end of the pipeline so the front-end
  renders events in the correct visual order.
- Monitor real-time search buffer activity via `index=_internal` component=SearchProcessor
  if you see persistent out-of-order events.

## See also

- `sort.md` — sort results in historical (non-real-time) searches
