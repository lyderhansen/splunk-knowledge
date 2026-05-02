# uniq — remove consecutive duplicate events

Source: Splunk Search Reference 8.2.12, page 637.

## Syntax

    | uniq

## Parameters

No parameters. `uniq` takes no arguments.

`uniq` compares the complete set of field values for each event. Two adjacent events are considered duplicates only if every field has the same value. The comparison is case-sensitive.

## Variants

`uniq` is equivalent to:

    | dedup consecutive=true <all fields>

For non-consecutive deduplication (remove duplicates regardless of position), use `dedup` without `consecutive=true`.

## Examples

### Basic: remove repeated status lines from a sorted log stream

    index=app sourcetype=app_logs
    | sort 0 _time
    | table _time, host, level, message
    | uniq

### Deduplicate repeated alert notifications

    index=alerts
    | sort 0 alert_id, _time
    | table alert_id, severity, description
    | uniq

### Combination with stats to count unique transitions

    index=workflow
    | sort 0 session_id, _time
    | table session_id, state
    | uniq
    | stats count by session_id

## Gotchas

- **Only removes consecutive duplicates** — if the same field-value combination appears in rows 1, 3, and 5 (non-consecutive), all three are kept. Sort first if you want global deduplication across non-adjacent rows.

- **Compares all fields** — a single field difference (including `_time`) prevents dedup. Use `| dedup <field>` or `| table` to narrow the comparison to the fields you care about before running `uniq`.

- **Not the same as `dedup`** — `dedup` with no `consecutive` flag removes all duplicates globally; `uniq` only removes adjacent ones. Choose based on whether event order and non-adjacent occurrences matter.

## See also

- `dedup.md` — full deduplication by field values, with `keepevents`, `sortby`, and keep-N options
- `sort.md` — sort before `uniq` to make identical events adjacent
