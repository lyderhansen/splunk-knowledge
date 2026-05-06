# ui-prefs.conf

**Deprecated.** Splunk Web now persists interactive UI state in browser storage; this file historically pinned default dispatch ranges and visualization/layout preferences per Classic XML view name.

**Source version:** Splunk Enterprise 10.2

## File details

| Property | Value |
|----------|-------|
| Location | `$SPLUNK_HOME/etc/apps/<app>/local/` (historically also system `local/`) |
| Pipeline phase | N/A |
| Restart required | No |
| Related files | Classic views (`data/ui/views/*.xml`), `nav/default.xml` |

## Stanzas and settings

### `[default]` (global defaults)

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| *standard merge semantics* | — | — | Only one `[default]` stanza should exist per Splunk `.conf` merging rules. |

### `[<view_xml_name>]`

The stanza label matches the Splunk view filename without extension.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `dispatch.earliest_time` | `<time modifier>` | — | Historical UI override for the earliest bound of searches launched from this view. |
| `dispatch.latest_time` | `<time modifier>` | — | Historical UI override for the latest bound of searches launched from this view. |
| `display.prefs.autoOpenSearchAssistant` | `0 \| 1` | — | Legacy toggle controlling automatic assistant panels (no modern effect). |
| `display.prefs.timeline.height` | `<string>` | — | Deprecated timeline height preference. |
| `display.prefs.timeline.minimized` | `0 \| 1` | — | Deprecated timeline minimized flag. |
| `display.prefs.timeline.minimalMode` | `0 \| 1` | — | Deprecated compact timeline mode. |
| `display.prefs.aclFilter` | `none \| app \| owner` | — | Deprecated results ACL filtering preference. |
| `display.prefs.appFilter` | `<string>` | — | Deprecated application filter token for listings. |
| `display.prefs.listMode` | `tiles \| table` | — | Deprecated dashboard/list rendering preference. |
| `display.prefs.searchContext` | `<string>` | — | Deprecated search context bookmark. |
| `display.prefs.events.count` | `10 \| 20 \| 50` | — | Deprecated events-per-page preference. |
| `display.prefs.statistics.count` | `10 \| 20 \| 50 \| 100` | — | Deprecated statistics tab row counts. |
| `display.prefs.fieldCoverage` | `0 \| .01 \| .50 \| .90 \| 1` | — | Deprecated field coverage slider presets. |
| `display.prefs.enableMetaData` | `0 \| 1` | — | Deprecated quick-field/metadata sidebar toggle. |
| `display.prefs.showDataSummary` | `0 \| 1` | — | Deprecated data summary pane toggle. |
| `display.prefs.customSampleRatio` | `<int>` | — | Deprecated sampling preference for events. |
| `display.prefs.showSPL` | `0 \| 1` | — | Deprecated SPL visibility toggle. |
| `display.prefs.livetail` | `0 \| 1` | — | Removed; documented as having no effect. |
| `countPerPage` | `10 \| 20 \| 50` | — | Deprecated rows-per-page for manager-style listings. |
| `display.general.enablePreview` | `0 \| 1` | — | Deprecated search preview toggle. |
| `display.events.fields` | `<string>` | — | Deprecated comma-separated Interesting Fields ordering. |
| `display.events.type` | `raw \| list \| table` | — | Deprecated events viewer layout. |
| `display.events.rowNumbers` | `0 \| 1` | — | Deprecated row-number overlay toggle. |
| `display.events.maxLines` | `0 \| 5 \| … \| 200` | — | Deprecated raw-event truncation control. |
| `display.events.raw.drilldown` | `inner \| outer \| full \| none` | — | Deprecated raw drilldown behavior. |
| `display.events.list.drilldown` | `inner \| outer \| full \| none` | — | Deprecated list drilldown behavior. |
| `display.events.list.wrap` | `0 \| 1` | — | Deprecated list wrap toggle. |
| `display.events.table.drilldown` | `0 \| 1` | — | Deprecated table drilldown toggle. |
| `display.events.table.wrap` | `0 \| 1` | — | Deprecated wrapped-column toggle. |
| `display.statistics.rowNumbers` | `0 \| 1` | — | Deprecated stats row numbers. |
| `display.statistics.wrap` | `0 \| 1` | — | Deprecated stats wrapping. |
| `display.statistics.drilldown` | `row \| cell \| none` | — | Deprecated stats drilldown mode. |
| `display.visualizations.type` | `charting \| singlevalue` | — | Deprecated visualization family toggle. |
| `display.visualizations.custom.type` | `<string>` | — | Deprecated custom viz type hint. |
| `display.visualizations.chartHeight` | `<int>` | — | Deprecated pixel height for charts. |
| `display.visualizations.charting.chart` | `<builtin chart>` | — | Deprecated chart type selector. |
| `display.visualizations.charting.chart.style` | `minimal \| shiny` | — | Deprecated chart chrome style. |
| `display.visualizations.charting.legend.labelStyle.overflowMode` | `ellipsisEnd \| ellipsisMiddle \| ellipsisStart` | — | Deprecated legend trimming behavior. |
| `display.page.search.patterns.sensitivity` | `<float>` | — | Deprecated patterns sensitivity slider. |
| `display.page.search.mode` | `fast \| smart \| verbose` | — | Deprecated search mode default. |
| `display.page.search.timeline.format` | `hidden \| compact \| full` | — | Deprecated timeline format preference. |
| `display.page.search.timeline.scale` | `linear \| log` | — | Deprecated timeline scale preference. |
| `display.page.search.showFields` | `0 \| 1` | — | Deprecated sidebar visibility for fields. |
| `display.page.home.showGettingStarted` | `0 \| 1` | — | Deprecated home-screen helper toggle. |
| `display.page.search.searchHistoryTimeFilter` | `<preset>` | — | Deprecated history time bucket filter. |
| `display.page.search.searchHistoryCount` | `10 \| 20 \| 50` | — | Deprecated retained history count. |
