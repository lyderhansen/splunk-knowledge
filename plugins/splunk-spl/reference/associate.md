# associate — identify correlations between fields

Source: Splunk Search Reference 8.2.12, page 207.

## Syntax

    | associate [supcnt=<int>] [supfreq=<float>] [improv=<float>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| supcnt | no | — | Min support count for a pair |
| supfreq | no | — | Min support frequency (0-1) |
| improv | no | — | Min improvement factor |

## Examples

```spl
index=main | fields src, dest, action | associate
```

## See also

- `correlate.md` — correlation matrix
- `contingency.md` — co-occurrence counts
- `arules.md` — association rules
