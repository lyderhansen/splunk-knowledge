# abstract — produce a summary snippet from event text

Source: Splunk Search Reference 10.2.0.

## Syntax

    | abstract [maxlines=<int>] [maxterms=<int>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `maxlines` | No | 10 | Maximum lines of event text to include in the summary (1–500) |
| `maxterms` | No | 1000 | Maximum number of matched terms to consider when scoring lines (1–1000) |

## Output

The command replaces the original event text (in `_raw`) with the summary text and stores it in a field called `_abstract`. Events with fewer lines than `maxlines` are returned unchanged.

## How scoring works

- Lines that contain more search terms score higher.
- Lines adjacent to high-scoring lines receive partial credit (context).
- Gaps between selected lines are represented by an ellipsis (`...`).

## Examples

### Show a 5-line summary for each result

    ... | abstract maxlines=5 | table _time, _abstract

### Full pipeline: search, abstract, display

    index=main error
    | abstract maxlines=3 maxterms=20
    | table _time, host, _abstract

### Use with highlight for annotated previews

    index=main "login failed"
    | abstract maxlines=4
    | highlight "login failed"

## Gotchas

- **Replaces `_raw` content** — the original full event text is replaced by the summary; if you need the original, save it first with `eval original_raw = _raw`.
- **Short events are not modified** — if the event already has ≤ `maxlines` lines, no change occurs; don't expect all events to get shorter.
- **`_abstract` vs `_raw`** — the summary is in `_abstract`; use `table _abstract` not `table _raw` to see summarized output.
- **Scoring is heuristic** — the algorithm favors events with more text and more search terms on adjacent lines; results may vary depending on the query.
- **`maxterms` capped at 1000** — values above 1000 are silently clamped.

## See also

- `highlight.md` — highlight matching terms in event text
- `head.md` — limit number of events before abstracting
