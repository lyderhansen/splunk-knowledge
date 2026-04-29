# splunk.table — full options reference

## Global options (chrome)


| Option                  | Type    | Default        | Notes                                                             |
| ----------------------- | ------- | -------------- | ----------------------------------------------------------------- |
| `backgroundColor`       | string  | theme          | Cell-area tint (different from panel chrome).                     |
| `count`                 | number  | `10`           | Visible rows; paginator handles overflow.                         |
| `font`                  | enum    | `proportional` | `proportional` | `monospace`.                                     |
| `fontSize`              | enum    | `default`      | `extraSmall` (10) | `small` (12) | `default` (14) | `large` (16). |
| `headerVisibility`      | enum    | `inline`       | `none` | `fixed` | `inline`.                                      |
| `paginateDataSourceKey` | string  | —              | Server-side pagination key (contract with SPL backend).           |
| `showInternalFields`    | boolean | `true`         | **Set `false` when using `_color_rank`.** `_time` is exempt.      |
| `showRowNumbers`        | boolean | `false`        | Prepends 1-indexed row number.                                    |
| `headers`               | array   | —              | Custom header labels (override field names).                      |
| `table`                 | object  | —              | Reserved (advanced).                                              |


## tableFormat options (whole-table)

All take 2D arrays (row × column) when set statically, or DOS expressions:


| Option                  | Notes                                                                                    |
| ----------------------- | ---------------------------------------------------------------------------------------- |
| `align`                 | Per-cell alignment (`left` | `center` | `right`). 2D when static.                        |
| `cellTypes`             | Per-cell renderer: `TextCell` | `ArrayCell` | `SparklineCell`.                           |
| `data`                  | Per-cell formatted text override.                                                        |
| `headerBackgroundColor` | Single hex string. **Don't set if you want theme-tracking headers.**                     |
| `headerColor`           | Header text. Same theme caveat.                                                          |
| `rowBackgroundColors`   | Row tint — **the heatmap pattern** (PATTERNS.md panel 7).                                |
| `rowColors`             | Row text colour. Pair with `rowBackgroundColors` for contrast.                           |
| `sparklineAreaColors`   | Fill colour for area sparklines.                                                         |
| `sparklineColors`       | Stroke colour for sparklines. **Per-row only, not per-column.** See PATTERNS.md 8a / 8c. |
| `sparklineTypes`        | `line` | `area`. **No `bar` — render mini `splunk.column` instead.**                     |


## columnFormat options (per-column)

Keyed by field name:


| Option                              | Notes                                                                                                   |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `width`                             | Pixel width.                                                                                            |
| `align`                             | `left` | `center` | `right`. **1D, not 2D.** Not interchangeable with `tableFormat.align`.              |
| `cellTypes`                         | Force a specific renderer for this column.                                                              |
| `sparklineColors`                   | `string[]` "list of colours for sparkline stroke of each column". Single-entry `["#hex"]` is canonical. |
| `sparklineTypes`                    | Same shape as `sparklineColors`.                                                                        |
| `rowBackgroundColors` / `rowColors` | Row-tinting limited to this column.                                                                     |


## Sparkline-colour distribution (the cheatsheet)


| Pattern                                                     | Where                           | Distribution semantic                                               | Use when                                            |
| ----------------------------------------------------------- | ------------------------------- | ------------------------------------------------------------------- | --------------------------------------------------- |
| **8a** `tableFormat.sparklineColors` via DOS `pick()`       | 1D context array                | **Per row, by index.** Cycles back if array shorter than row count. | Colour tracks row identity (host, region).          |
| **8b** `columnFormat.<col>.sparklineColors`                 | One-entry `["#hex"]` per column | **Per column, single colour for all rows.**                         | Colour tracks field identity (CPU=green, MEM=blue). |
| **8c** `tableFormat.sparklineColors` via DOS `rangeValue()` | Threshold bands                 | **Per row, threshold-driven.**                                      | Colour encodes severity (heatmap-strokes).          |


There is **no** built-in pattern for "one colour per sparkline column
via `tableFormat`". Per-column colouring is `columnFormat`'s job.

For per-row AND per-column at the same time: hand-author `string[][]`
or compute via DOS — but data-driven row counts make this brittle.

## What table does NOT have

- **No automatic sort** — order from SPL.
- **No `bar` sparkline** — only `line` and `area`.
- **No way for `tableFormat.sparklineColors` to do per-column colouring.**

## Source of truth

`docs/SplunkCloud-10.4.2604-DashStudio.pdf`. Table options table.