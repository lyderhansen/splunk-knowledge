# erex — learn a field extraction regex from example values

Source: Splunk Search Reference 8.2.12, page 274.

## Syntax

    | erex <field> examples=<string> [counterexamples=<string>] [fromfield=<field>] [maxtrainers=<integer>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `<field>` | Yes | — | Name of the new field that will receive the extracted values |
| `examples` | Yes | — | Comma-separated list of example values to extract; use quotes if the list contains spaces: `"port 3351, port 3768"` |
| `counterexamples` | No | — | Comma-separated list of values that represent patterns NOT to extract |
| `fromfield` | No | `_raw` | Existing field to extract information from |
| `maxtrainers` | No | `100` | Maximum number of event values to use when learning the regex; must be between 1 and 1000 |

## Examples

### Extract values matching a date-like pattern

Extract month/day values like `7/01` into the `monthday` field:

    index=web_logs
    | erex monthday examples="7/01"
    | table _time, monthday

### Use counterexamples to exclude false matches

Extract month/day values like `7/01` and `7/02` but exclude patterns like `99/2`:

    index=web_logs
    | erex monthday examples="7/01, 07/02" counterexamples="99/2"
    | stats count by monthday

### Find common port values from failed login events

    sourcetype=secure* port "failed password"
    | erex port examples="port 3351, port 3768"
    | top port

After running, click the **Job** menu in Splunk Web to see the generated regular
expression. You can then replace `erex` with `rex` using that expression for better
performance:

    sourcetype=secure* port "failed password"
    | rex "(?i)^(?:[^\.\]*\.){3}\d+\s+(?P<port>\w+\s+\d+)"
    | top port

## Gotchas

- **Example values must exist in the events being searched** — `erex` learns from the
  actual event data piped into it. If the example values are not present in those events,
  the command fails. Run the base search first to confirm the values appear before adding
  `erex`.

- **`erex` is expensive compared to `rex`** — the command runs a machine-learning
  algorithm to infer the regex. Use it to discover the pattern, then replace it with a
  hard-coded `rex` expression in production queries. The generated regex is visible in
  the Splunk Web **Job** menu after the search runs.

- **The generated regex is for `rex`, not `erex`** — once you have the regex from the
  Job menu, use `| rex "(?P<fieldname>...)"` instead. The `rex` command is orders of
  magnitude faster.

## See also

- `rex.md` — regex-based extraction using explicit PCRE patterns
- `extract.md` — apply `transforms.conf` field extractions
- `multikv.md` — tabular event extraction
- `xmlkv.md` — XML element extraction
