# visualizations.conf

Registers app-supplied modular visualizations (JavaScript modules plus metadata) so they appear in Search & Reporting visualisation pickers with sizing, data-source, and capability hints.

**Source version:** Splunk Enterprise 10.2

## File details

| Property | Value |
|----------|-------|
| Location | `$SPLUNK_HOME/etc/apps/<app>/default/` |
| Pipeline phase | N/A |
| Restart required | No |
| Related files | `appserver/static/visualizations/<viz>/`, `savedsearches.conf` display settings |

## Stanzas and settings

### `[<visualization_name>]`

Stanza must match the visualization directory name under `appserver/static/visualizations/`.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `disabled` | `<boolean>` | `false` | When true, hides the visualization everywhere in Splunk Web. |
| `allow_user_selection` | `<boolean>` | `true` | Controls whether non-admin users can choose this viz from UI menus. |
| `label` | `<string>` | `<app>.<viz>` | Human-readable title shown in selectors. |
| `description` | `<string>` | `""` | Short tooltip/help copy in the picker. |
| `search_fragment` | `<string>` | — | Example trailing SPL illustrating expected data shape for the viz. |
| `default_height` | `<integer>` | `250` | Default render height in pixels when dropped onto a dashboard. |
| `default_width` | `<integer>` | `250` | Default render width in pixels. |
| `min_height` | `<integer>` | `50` | Lower bound on resizable height. |
| `min_width` | `<integer>` | `50` | Lower bound on resizable width. |
| `max_height` | `<integer>` | unbounded | Upper bound on height when developers constrain resizing. |
| `max_width` | `<integer>` | unbounded | Upper bound on width when developers constrain resizing. |
| `trellis_default_height` | `<integer>` | `400` | Default panel height when trellis layout is active. |
| `trellis_min_widths` | `<string>` | — | Specifies minimum widths for trellis columns as a comma/size DSL string. |
| `trellis_per_row` | `<string>` | — | Hint for how many trellis charts appear per row. |
| `data_sources` | `<comma-separated list>` | `primary` | Lists logical connectors (`primary`, `annotation`, etc.) the viz consumes. |
| `data_sources.<type>.params.output_mode` | `json_rows \| json_cols \| json` | — | Determines how Splunk serializes rows/columns for that connector. |
| `data_sources.<type>.params.count` | `<integer>` | `1000` | Row/page size for that connector’s preview/search job. |
| `data_sources.<type>.params.offset` | `<integer>` | `0` | Starting row index for paginated pulls. |
| `data_sources.<type>.params.sort_key` | `<field>` | — | Sort column for result previews. |
| `data_sources.<type>.params.sort_direction` | `asc \| desc` | `desc` | Sort direction for previews. |
| `data_sources.<type>.params.search` | `<string>` | — | Optional post-processing SPL appended for that connector. |
| `data_sources.<type>.mapping_filter` | `<boolean>` | — | Internal mapping-layer toggle used by geo viz bundles. |
| `data_sources.<type>.mapping_filter.center` | `<string>` | — | Default map center expression for mapping viz types. |
| `data_sources.<type>.mapping_filter.zoom` | `<string>` | — | Default zoom expression for mapping viz types. |
| `supports_trellis` | `<boolean>` | `false` | Advertises whether trellis split-by-field layout is implemented. |
| `supports_drilldown` | `<boolean>` | `false` | Advertises interactive drilldown/click handlers. |
| `supports_export` | `<boolean>` | `false` | Indicates Integrated PDF export compatibility for built-in viz wrappers (ignored for arbitrary third-party viz bundles). |
| `core.type` | `<string>` | — | Internal discriminator tying bundled viz to core renderer families. |
| `core.viz_type` | `<string>` | — | Internal alias used by classic chart bridging layers. |
| `core.charting_type` | `<string>` | — | Maps to Splunk Web charting module identifiers. |
| `core.mapping_type` | `<string>` | — | Maps to bundled choropleth/marker stack identifiers. |
| `core.order` | `<int>` | — | Sort priority when listing built-in viz tiles. |
| `core.icon` | `<string>` | — | Static icon asset reference for built-ins. |
| `core.preview_image` | `<string>` | — | Preview thumbnail asset reference for UI galleries. |
| `core.recommend_for` | `<string>` | — | Hint tying viz to data-shape recommendations in the picker. |
| `core.height_attribute` | `<string>` | — | Names the formatter attribute controlling dynamic height for bundled charts. |
