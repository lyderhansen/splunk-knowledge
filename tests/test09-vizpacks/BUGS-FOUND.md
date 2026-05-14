# Bugs Found During Porsche GT3 Viz Pack Test

## 1. SPL: `tostring()` format string `"0.000"` is invalid

**Where:** Dashboard data source `ds_positions` — inline SPL query  
**Symptom:** "Error in 'EvalCommand': The arguments to the..." in Splunk  
**Root cause:** `tostring(round(x, 3), "0.000")` — the second argument to `tostring()` only accepts `"hex"`, `"commas"`, or `"duration"`. Numeric format patterns like `"0.000"` are not valid.  
**Fix:** Remove the format arg: `tostring(round(x, 3))`. Let `round()` handle decimal places directly.  
**Skill to update:** `splunk-spl:spl-gotchas` — add a gotcha: "`tostring()` format arg is NOT a number format pattern. Only `hex`, `commas`, `duration` are valid. For decimal precision, use `round(x, N)` before `tostring()`."

## 2. Dashboard Studio: data sources missing `"name"` property

**Where:** All `ds.search` entries in the dashboard JSON  
**Symptom:** Data source list in Studio UI shows only key names (e.g., `ds_current_lap`) instead of human-readable labels  
**Root cause:** `"name"` property was omitted from data source definitions  
**Fix:** Add `"name": "Human Readable Label"` to every `ds.search` block  
**Skill to update:** `splunk-dashboards:ds-ref-syntax` or `ds-create` — add rule: "Every `ds.search` MUST include a `name` property for readability in Studio's data source panel."

## 3. KPI tile: label clips into value at small panel heights

**Where:** `lap_time_tile` visualization — `_render()` layout math  
**Symptom:** At 120px panel height, the uppercase label ("CURRENT LAP") overlaps with the top of the large number  
**Root cause:** Label Y was set to `contentH * 0.28` and value Y to `contentH * 0.55` — percentage-based positioning puts them too close when the panel is short. With h=120px: labelY=27px, valY=53px, only 26px gap for a ~48px number.  
**Fix:** Anchor label to `pad + labelSize/2` (top-pinned) and value to `pad + labelSize + 8 + valSize/2` (stacked below label with explicit gap). This guarantees separation regardless of panel height.  
**Skill to update:** `splunk-viz-packs:vp-viz` or `vp-ref-patterns` — add layout rule: "For KPI tiles, NEVER use percentage-of-height for label+value stacking. Use additive positioning: `labelY = pad + labelSize/2`, `valueY = labelY + labelSize/2 + gap + valueSize/2`. Percentage-based positioning collapses at small panel heights (100-150px)."

## 4. KPI tile: trend delta overlaps with value text

**Where:** `lap_time_tile` visualization — trend rendering in `_render()`  
**Symptom:** At 360x120px panel size, the trend text (e.g., "-0.342") and arrow are drawn at the same Y-coordinate as the large lap time value, right-aligned. The big monospace number fills most of the panel width, so the trend text overlaps/clips into the rightmost digits.  
**Root cause:** Trend was positioned at `trendY = valY` (same vertical line as the value) with `textAlign = 'right'` at `w - pad`. The value is centered and spans most of the width at ~48px font size, leaving no room for trend text at the same height.  
**Fix:** Move the trend below the value instead of beside it. New positioning: `trendY = valY + valSize/2 + trendSize/2 + 6`. Arrow and text are horizontally centered as a group: `trendStartX = (w - totalTrendW) / 2`. This stacks label → value → trend vertically with no overlap.  
**Skill to update:** `splunk-viz-packs:vp-viz` — in the Single Value Tile blueprint, change the trend positioning guidance from "right-aligned at same Y as value" to: "Trend delta MUST be positioned BELOW the value, not beside it. At typical KPI tile widths (300-400px), a large monospace value leaves no horizontal room for trend text at the same line. Stack vertically: label → value → trend+arrow."

## 5. Subagent: wrong `require()` path for webpack alias

**Where:** All `visualization_source.js` files written by subagents  
**Symptom:** Would fail at build time (caught before build in this session)  
**Root cause:** Agents wrote `require('../../shared/theme')` or `require('../../../shared/theme')` — relative paths that don't resolve correctly from the deep `viz/src/` directory. The webpack config uses an alias: `'shared' → pack_root/shared/`.  
**Fix:** All imports must use `require('shared/theme')` — the bare module name caught by the webpack alias, NOT a relative path.  
**Skill to update:** `splunk-viz-packs:vp-viz` — the source skeleton template should use `require('shared/theme')` and add a note: "The `shared` alias is defined in `webpack.config.js`. Use `require('shared/theme')`, NOT relative paths. Relative paths from `viz/src/` do not resolve to the pack root."
