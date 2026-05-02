# savedsearch — run a saved search by name

Source: Splunk Search Reference 8.2.12, page 488.

## Syntax

    | savedsearch <name>

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| name | yes | — | Name of the saved search to run |

## Examples

```spl
| savedsearch "Daily Security Report"
```

## See also

- `loadjob.md` — load results from a previous run
- `from.md` — access via dataset syntax
