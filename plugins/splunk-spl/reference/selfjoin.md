# selfjoin — join results with themselves

Source: Splunk Search Reference 10.2.0

## Syntax

    | selfjoin [overwrite=<bool>] [max=<int>] [keepsingle=<bool>] <field-list>

Each result row is treated as both the "left" and "right" side of a join.
Results are matched against other results that share the same values in the
specified `field-list`.

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `field-list` | Yes | — | One or more fields to join on; events with identical values in these fields are paired |
| `overwrite` | No | true | When `true`, fields from the matched ("other") result overwrite same-named fields in the main result |
| `max` | No | 1 | Max "other" results to join with each main result; `0` = unlimited (dangerous — see Gotchas) |
| `keepsingle` | No | false | When `true`, results with no matching partner are preserved in output; when `false`, unmatched results are dropped |

## Examples

### Correlate processes with their parent processes

```spl
index=endpoint sourcetype=sysmon EventCode=1
| table ProcessId, ParentProcessId, Image, CommandLine
| selfjoin ProcessId=ParentProcessId
```

### Self-join with keepsingle — keep unmatched rows

```spl
index=tickets | stats count by ticket_id, assigned_to
| selfjoin keepsingle=true ticket_id
```

### Alternative stats pattern (usually preferred over selfjoin)

Find IPs appearing in both allow and deny actions — `stats` is cleaner:

```spl
index=firewall | stats values(action) AS actions by src
| where mvcount(actions) > 1
```

## Gotchas

- **Combinatorial explosion:** `selfjoin` pairs every matching event with every other
  matching event. For N events sharing the same key value, this produces up to N×N
  rows. Always apply strict filtering (`where`, `dedup`, or `head`) before the join to
  limit the input set. With `max=0` and high-cardinality data, this can exhaust search
  head memory.

- **`overwrite=true` by default — fields are silently clobbered:** The "other" result's
  fields replace the main result's fields for any field with the same name. If you need
  to distinguish main vs. other values, rename one side with `eval` or `rename` before
  the `selfjoin`.

- **`keepsingle=false` (default) silently drops unmatched rows:** Any result that has no
  matching partner disappears from the output. Use `keepsingle=true` when you need to
  preserve rows that may not have a match (e.g., hierarchical data where the root node
  has no parent).

- **Max 100,000 "main" results:** Regardless of the `max` argument, the maximum number
  of main results processed is 100,000. Results beyond this limit are silently ignored.

- **Rarely the right tool for event data:** `selfjoin` was designed for relational
  database scenarios. For most Splunk use cases, the `stats values()` or `join` patterns
  are clearer and more performant.

## Tips

- The classic use case for `selfjoin` in Splunk is process-tree correlation: joining
  `ProcessId` to `ParentProcessId` to link child processes to their parent.
- Benchmark against a `stats` or `join` equivalent before using `selfjoin` in a
  production search — the stats equivalent is almost always faster.

## See also

- `join.md` — join with a separate subsearch dataset
- `stats.md` — often a better alternative for self-correlation
