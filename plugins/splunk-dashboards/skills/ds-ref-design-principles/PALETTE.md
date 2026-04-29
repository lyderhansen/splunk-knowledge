# Palette, canvas, spacing reference

Verified against Splunk's official design language (splunkui.splunk.com)
and `@splunk/themes` conventions.

## Semantic status palette

Use these EXACT hex values — operators rely on instant recognition.

| Status | Dark theme | Light theme | Use for |
|---|---|---|---|
| Critical / Error | `#DC4E41` | `#C0392B` | Alarms, failures, threshold breaches. |
| High / Elevated | `#F1813F` | `#C05C00` | Exceeding soft limit. |
| Warning | `#F8BE34` | `#D4820A` | Approaching limits, degraded. |
| OK / Healthy | `#53A051` | `#2B9E44` | Normal operating state. |
| Info / Neutral | `#006D9C` | `#2066C0` | Informational counts, no health semantics. |
| Unknown / No data | `#B0B0BE` | `#9B99A0` | Missing or unavailable data. |

## Canvas & chrome tokens

| Element | Dark (default) | Dark (NOC / wall) | Light |
|---|---|---|---|
| Canvas background | `#0b0c0e` | `#000000` | `#FAFAF7` |
| Panel / card fill | `#15161a` | `#0F1117` | `#ffffff` |
| Panel stroke | `#2C2C3A` | `#1FBAD6` (accent) | `#E5E5E0` |
| Primary text | `#FFFFFF` | `#FFFFFF` | `#1A1A1A` |
| Secondary text | `#B0B0BE` | `#B0B0BE` | `#6B7C85` |
| Gridline | `#23262b` | `#23262b` | `#ebedef` |
| Axis line | `#2c3036` | `#2c3036` | `#d9dce0` |

## Series palettes

Pick one per dashboard and stick to it. Limit charts to 6–8 series;
above that, aggregate to Top N + "Other" or split into multiple
charts.

### `SERIES_CATEGORICAL_10` — default for dark dashboards

Executive, ops, analytical.

```
#006D9C  #4FA484  #EC9960  #AF575A  #B6C75A
#62B3B2  #294E70  #738795  #EDD051  #BD9872
```

### `SERIES_CATEGORICAL_10_LIGHT` — default for light dashboards

Executive print / PDF.

```
#2066C0  #2B9E44  #C05C00  #C0392B  #7A873D
#3D8B8B  #294E70  #4A5A64  #B39A1F  #8A6B4A
```

### `SERIES_SOC_8` — status-semantic palette (SOC / NOC ONLY)

Use only when first four colours align with severity. Do NOT use
elsewhere (semantic colours leak).

```
#DC4E41  #F1813F  #F8BE34  #53A051   ← critical / high / warning / ok
#006D9C  #1FBAD6  #826AF9  #9B59B6
```

### `SERIES_STUDIO_20` — Splunk Studio extended palette

Dense analytical charts with many categories. Use first 8–10 entries.

```
#7B56DB  #009CEB  #00CDAF  #DD9900  #FF677B
#CB2196  #813193  #0051B5  #008C80  #99B100
#FFA476  #FF6ACE  #AE8CFF  #00689D  #00490A
#465D00  #9D6300  #F6540B  #FF969E  #E47BFE
```

## Semantic colouring for `majorColor` (singlevalues)

Status KPIs use semantic palette with explicit thresholds. Do NOT use
series-palette blues / greens for status metrics.

| Metric kind | Polarity | Typical `majorColor` |
|---|---|---|
| Failure count, error count, critical alerts | up-is-bad | `#DC4E41` (static) or DOS threshold red above threshold |
| Latency, response time | up-is-bad | `#F1813F` warm / `#DC4E41` if SLA-critical |
| Success rate, uptime | down-is-bad | `#53A051` above → `#F8BE34` → `#DC4E41` |
| Capacity / utilisation | up-is-bad-above-cap | `#53A051` <80 → `#F8BE34` 80–90 → `#DC4E41` >90 |
| Informational counts (events, volume) | neutral | `#006D9C` (static) |

DOS example for SLA-critical latency:

```json
"majorColor": "> primary | seriesByName('p95') | lastPoint() | rangeValue(thresholds)",
"context": {
  "thresholds": [
    { "to": 200,             "value": "#53A051" },
    { "from": 200, "to": 500,"value": "#F8BE34" },
    { "from": 500,           "value": "#DC4E41" }
  ]
}
```

## Theme / mode selection guide

| Dashboard type | Recommended mode | Rationale |
|---|---|---|
| Operational / NOC / SOC | Dark (NOC variant) | Reduces eye strain on 24/7 wall displays; status colours pop off pure-black canvas. |
| Executive summary / Report | Light | Familiar for print and PDF; professional for leadership. |
| Analytical / Investigation | Dark | Longer analyst sessions benefit from lower luminance. |
| Hero / Landing dashboard | Dark | One big KPI on rich background reads better. |

## Spacing scale (px)

| Token | px | Common use |
|---|---|---|
| `S_0_5` | 4 | Tight icon gap. |
| `S_1` | 8 | Inline label gap. |
| `S_1_5` | 12 | Panel inner padding (tight). |
| `S_2` | 16 | Section heading → first panel. |
| `S_2_5` | 20 | **Default gutter between panels.** |
| `S_3` | 24 | KPI row → primary chart zone. |
| `S_4` | 32 | Between logical sections. |
| `S_6` | 48 | Between major zones in long dashboards. |
| `S_8` | 64 | Canvas outer margin on ultrawide wall displays. |

## Corner radius (px)

| Token | px | Use |
|---|---|---|
| `R_SHARP` | 0 | Grid / table cells. |
| `R_SUBTLE` | 4 | Inputs, small chips. |
| `R_CARD` | 8 | **Default card / rectangle radius.** |
| `R_HERO` | 12 | Hero KPI background. |
| `R_PILL` | 999 | Status chips, badges. |

## Type scale (px)

| Token | px | Use |
|---|---|---|
| `FS_TICK` | 11 | Chart tick labels. |
| `FS_AXIS` | 12 | Axis titles. |
| `FS_BODY` | 14 | Markdown body, table cells. |
| `FS_LARGE` | 18 | Panel subtitles. |
| `FS_XLARGE` | 24 | Section headers. |
| `FS_KPI_MINOR` | 28 | Secondary KPI value. |
| `FS_KPI_MAJOR` | 48 | **Standard KPI majorValue.** |
| `FS_KPI_HERO` | 72 | Hero / landing KPI. |

## Canvas zones (absolute layout, 1440 × 960 px)

```
x=0                                               x=1440
y=0   +-------------------------------------------------+
      | Canvas margin (20 px)                           |
y=20  | [Input bar: time + filters]           h=40      |
y=80  | [KPI row — background rect]           h=160     |
      |  KPI1 | KPI2 | KPI3 | KPI4                      |
y=260 | [Primary chart zone]                  h=340     |
      |  Main chart (w=860) | Table (w=520)             |
y=620 | [Secondary / detail zone]             h=300     |
      |  Alert history / secondary chart                |
y=940 | [Footer / nav links]                  h=20      |
y=960 +-------------------------------------------------+
```

- Panel minimum heights: singlevalue 120, chart 240, table 200 px.
- Gutter: 20 px between every panel edge; 20 px from canvas edges.
- KPI background card: `splunk.rectangle` at `y=80, h=160` BEHIND
  KPIs (earlier in `structure` array).

## Input bar guidelines

- Time range picker first (leftmost), 300–350 px.
- Filter dropdowns 200–250 px each, broadest → narrowest (Region →
  Site → Equipment).
- Single row (h=40 px). Two rows only if 5+ filters.
- User-facing labels (`"Site"` not `"site_id"`).

## KPI grouping with background cards

```
splunk.rectangle  x=20,  y=80,  w=1400, h=160   (card behind KPIs)
KPI 1             x=30,  y=90,  w=320,  h=140
KPI 2             x=370, y=90,  w=320,  h=140
KPI 3             x=710, y=90,  w=320,  h=140
KPI 4             x=1050,y=90,  w=350,  h=140
```

Rule: card edge + 10 px = panel edge on all sides. Place rectangle
entry in `layout.structure` BEFORE the KPI entries.
