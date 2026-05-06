# splunk.linkgraph — gotchas

## 1. Links only render between ADJACENT columns

There is no rendering of Column 1 → Column 3 unless you reorder via
`fieldOrder` or build a chain search to get them adjacent.

## 2. All columns must be string-valued

Numeric fields are coerced to strings. If your numeric values share
digits (e.g. `1`, `10`, `100`) they collapse into separate nodes —
usually fine but verify.

## 3. No per-column palette

All columns share `nodeColor`. If you need column-level colour cues,
switch to `splunk.sankey` with `colorMode: categorical`.

## 4. No dynamic link colouring

`linkColor` is one value. For severity-weighted links use
`splunk.sankey` with `linkColors: "> primary | seriesByName(...)
| rangeValue(linkColorRangeConfig)"`.

## 5. Truncation is silent

With `resultLimit` defaulting to `50` and `showNodeCounts` showing
the **true** total, a viewer can read "73" in the column header but
only see 50 nodes. Make this explicit in the panel description, or
raise `resultLimit` deliberately.

## 6. `nodeSpacingY` interacts with panel height

With many distinct values per column the rendering can clip the
column. Either:

- widen the column (`nodeWidth`)
- shorten the rows (`nodeHeight`)
- raise the panel height in `layout.structure`

## 7. Light theme readability

Dark `linkColor` on a light background reads fine; brand purple
(`#7B56DB`) nodes on white sometimes feel washed out — bump
`linkWidth` or pick a deeper node colour (e.g. `#5C4ECC`).

## 8. Click target is always a NODE, never a LINK

`eventHandlers` fire on node click only. Payload contains every
column value for that row plus a `name` indicating which column was
clicked.

```json
"eventHandlers": [
  {
    "type": "drilldown.setToken",
    "options": {
      "tokens": [
        { "token": "selected_node",  "key": "row.Actor.value" },
        { "token": "selected_field", "key": "name" }
      ]
    }
  }
]
```

Branch downstream search on `$selected_field$` and filter by
`$selected_node$`.

## 9. 4+ columns demands a full-row layout

Half-width panels with kill chains crush labels; links cross
illegibly. See SKILL.md "Layout: when a linkgraph deserves a full
row".

## 10. Hero sizing without proportional spacing

When you bump `nodeWidth` to 280, you must also bump `nodeSpacingX`
to 60–80 and `nodeSpacingY` to 12–16. Wide nodes with default
spacing render small in a wide canvas.
