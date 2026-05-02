# setfields — set multiple fields to values from a stats-like aggregation

Source: Splunk Search Reference 8.2.12, page 516.

## Syntax

    | setfields <field>=<value> [, <field>=<value>]...

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `<field>` | yes | — | The name of the field to set or create. |
| `<value>` | yes | — | A literal string or number to assign to the field. Does not evaluate expressions — use `eval` for dynamic values. |

## Usage

`setfields` is a **streaming command**. It assigns literal values to one or more fields on every
event in the result set. Unlike `eval`, it does not evaluate expressions — the value must be a
static literal.

`setfields` is primarily useful for annotating result sets with a constant label or metadata
value, such as marking a batch of results with a pipeline stage identifier or adding a static
category column.

For dynamic computation, use `eval` instead.

## Examples

### Annotate results with a static category label

    index=access_* status>=400
    | stats count by src
    | setfields category="errors"

### Add a constant version tag for join operations

    index=network sourcetype=firewall
    | stats sum(bytes) AS total_bytes by src
    | setfields report_type="firewall_summary", version="1.0"

### Tag two different search branches before union

    [search index=web action=purchase | stats count by user | setfields source="web"]
    [search index=mobile action=purchase | stats count by user | setfields source="mobile"]
    | stats sum(count) AS total by user, source

## Gotchas

- **Literal values only** — `setfields status=if(count>0,"active","inactive")` does not work.
  Expressions must use `eval`: `| eval status = if(count > 0, "active", "inactive")`.

- **Overwrites existing field values** — if a field with the given name already exists,
  `setfields` replaces its value with the literal for every event.

- **No wildcards** — field names in `setfields` must be exact; wildcard patterns are not supported.

## See also

- `eval.md` — compute dynamic field values from expressions
- `fillnull.md` — replace NULL values with a fill value
- `replace.md` — replace specific field values matching a pattern
