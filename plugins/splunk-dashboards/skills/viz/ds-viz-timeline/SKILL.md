---
name: ds-viz-timeline
description: Splunk Dashboard Studio splunk.timeline visualization — discrete events along a horizontal time axis, optionally grouped into lanes by category, with intervals (duration), dynamic per-event colouring, and tooltip enrichment. Provides patterns for SOC incident lanes, deploy timelines, audit feeds, the canonical "Categorical Timeline" compound stripe pattern, and CI pipeline visualization. Use when the user asks about timelines, event lanes, deploy timelines, incident lanes, audit feeds, or interval bars in Splunk Dashboard Studio.
---

# splunk.timeline — discrete events on a time axis

Verified against Splunk Cloud 10.3.2512 (official docs) + Cloud 10.2.x
runtime. Live test bench: `ds_viz_timeline_dark` /
`ds_viz_timeline_light`.

> **Doc note:** `splunk.timeline` is **not in the 10.4 reference PDF**,
> but it IS fully documented at help.splunk.com under Cloud 10.3.2512.

The timeline plots discrete events along a horizontal time axis.
Events with a `duration` field render as **horizontal bars**
(intervals); events without one render as **circles**. Lanes are
derived from a `category` field via Dynamic Options Syntax (DOS).

## When to use

- Events are **discrete and sparse** (deploys, alerts, audits, batch
  jobs).
- Multiple lanes that share the same time axis.
- Story is **temporal pattern recognition** rather than counting.
- Some events have **meaningful duration** (jobs, releases, incidents).

## When NOT to use

| Story | Pick instead |
|---|---|
| "How many things happened over time?" | `splunk.column` / `splunk.line` |
| "Show me the raw events" | `splunk.events` |
| "Stack incidents on top of a metric" | `splunk.line` with annotations |

## Quick start

```json
{
  "type": "splunk.timeline",
  "title": "Deploys by environment",
  "dataSources": { "primary": "ds_deploys" },
  "options": {
    "category": "> primary | seriesByName('env')",
    "duration": "> primary | seriesByName('duration')",
    "additionalTooltipFields": ["service", "version", "status"]
  }
}
```

```spl
| ... | table _time env service version status duration
```

`_time` is mandatory. `duration` is in seconds (`0` = circle).

## Do / Don't

| ✅ Do | ❌ Don't |
|---|---|
| **DOS, not plain field names:** `category: "> primary \| seriesByName('host')"`. | `category: "host"` — validator rejects or viz picks wrong field. |
| **Fixed semantic colours:** `dataColors` + `matchValue` keyed on a status enum. | `seriesColors` array — palette maps **alphabetically** to lanes, not by lane name. |
| **Categorical Timeline pattern:** **always full-row width** (compound stripes need horizontal space). | Half-width panels with categorical timelines — bars collapse into unreadable mush. |
| **Sort upstream:** `\| sort _time` before `\| table`. | Rely on `resultLimit: N` to pick "top N" — it picks first N rows in source order. |
| **Numeric coloring:** `dataColors` + `rangeValue` for severity, percent-utilization, latency. | Use circle markers for high-density events — switch to `splunk.column` for count-over-time. |
| **`seriesColors`:** array of hex, never CSV string. | `"seriesColors": "#aaa,#bbb"` — validator rejects with `must be array / must match pattern "^>.*"`. |
| **Drilldown:** `eventHandlers` reads `row.<field>.value`. | Read `$click.value$` outside the row context — timeline events emit row events. |

## The "Categorical Timeline" pattern

The headline pattern from Splunk UI Timeline package docs (the
screenshot with `Lane 1 ... Lane 7` and bars of mixed colours touching
inside each lane) is **not a different visualization**. It's the same
`splunk.timeline` configured with three things at once:

1. **Many short-duration events per lane** (so events render as bars).
2. **A long time window** (months, not hours) so bars are pixel-narrow.
3. **`dataColors` + `matchValue`** keyed on a status / severity / action
   enum so adjacent bars in the same lane carry different colours.

When those three line up, per-event bars stop reading as individual
events and start reading as a **compound multi-colour stripe per lane**.
The visual question shifts from *"what is this one event?"* to *"how
busy was this lane and in which colours across the period?"*.

This is the dominant production pattern for SOC incident lanes, SRE
host-week views, and audit-by-user feeds.

## See also

- [PATTERNS.md](PATTERNS.md) — 18 verified patterns: 4 Categorical
  Timeline variants (canonical, tooltip-enriched, dense SRE, user
  sessions), default, lanes, intervals, range/match dataColors,
  legend variants, dense stress test, editorial tint.
- [OPTIONS.md](OPTIONS.md) — full options table from help.splunk.com.
- [GOTCHAS.md](GOTCHAS.md) — DOS-vs-string, `resultLimit` semantics,
  alphabetical lane order, full-row-width rule.
- `ds-viz-events` — raw events with field metadata.
- `ds-viz-line` — continuous time series with annotations.
- `ds-viz-column` — event counts over time.
- `ds-design-principles` — investigation/SOC patterns.
