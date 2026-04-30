# Splunk Dashboard Studio — Design Inputs (Example: FAKE T-Shirt Co. Retail Pulse)

> **Third worked example** — built against real data in the
> `fake_tshrt` Splunk index. Different vertical (retail/e-commerce),
> persona (Director of Retail Ops), and aesthetic (energetic D2C
> brand) from the prior CISO and brewery examples. Brand context
> inherits The FAKE T-Shirt Company's existing design language
> (cyan/purple, dark canvas, scenario colors immutable).

---

# Section 0: Engagement Context

### 0.1 Engagement Information

| Field | Value |
|---|---|
| **Customer / org** | The FAKE T-Shirt Company (fictional D2C apparel; 175 employees; Boston / Atlanta / Austin) |
| **Project / dashboard name** | Retail Pulse |
| **Author** | Maya Chen, Director of Retail Operations |
| **Date** | 2026-04-30 |
| **Splunk app context** | `TA-FAKE-TSHRT` |
| **Dashboard ID (slug)** | `discovery_retail_pulse_v1` |

> Naming follows the project's own design language Section 3.1 — but the
> dashboard fits the "Discovery" pattern more than "Overview" because it
> spans multiple sourcetypes and has interactive filters.

### 0.2 Build Mode

- [x] **Strict** — Build only what's specified here.

> The project already has a strict design language spec
> (`docs/reference/dashboard_design_language.md`) — AI must respect it
> end-to-end. Curated/Exploratory modes would risk introducing
> off-palette colors or non-standard layouts.

---

# Section 1: Business Problem & Audience

### 1.1 What is this dashboard FOR?

> "Lets the Director of Retail Ops at FAKE T-Shirt see, at any minute
> during business hours, whether revenue is tracking, whether the
> store is healthy, and whether anything weird is happening with
> pricing or fulfilment. Designed for a desk monitor, refreshed every
> 30s during work hours, dark on. First-scan question:
> **'Is the day on track?'** Second-scan: **'If not, where do I
> drill?'**"

### 1.2 Audience

- [x] **Custom persona — Director of Retail Operations Maya Chen**

> - Where: Dual 27" desk monitors, Austin office. Right-hand monitor
>   permanently on this dashboard during work hours.
> - For how long: Continuous background presence; ~30 second focused
>   glances every 10–15 minutes; deep dives during incidents.
> - Time of day: 08:00–18:00 CT (business hours). Auto-refresh
>   pauses overnight (no actionable workflow when she's offline).
> - Decisions: "Do I page Engineering? Do I pull a campaign from
>   marketing? Do I escalate the ServiceBus DLQ to the integration
>   team?" Always action-oriented — not exec-summary contemplation.
> - Knows SPL (lightly) — wants drilldowns to open Splunk searches
>   she can pivot in.

### 1.3 Anti-personas

> - NOT for the CFO or board (different cadence — they want monthly
>   reporting, this is real-time)
> - NOT for the SOC team (they have `discovery_soc_overview`)
> - NOT for marketing (campaign performance lives elsewhere)
> - NOT for individual customer service reps (per-order detail goes
>   to ServiceNow)

### 1.4 Industry / vertical

- [x] **E-commerce / retail** (D2C apparel, IT-themed niche)

---

# Section 2: Archetype & Layout

### 2.1 Archetype

- [x] **Operational monitoring** — Dense KPI grid, status tiles, primary trend, alert log.

### 2.2 Hybrid notes

> Operational primary, but the top KPI strip is exec-summary in feel
> (4 hero tiles with sparklines). Below that becomes operational —
> dense and pivotable. NO analytical deep-dive (Maya pivots to
> Splunk search for that), NO SOC-wall density.

### 2.3 Canvas size

- [x] **1920 × content-driven** (estimated 1400px content height)

> Project's design language defaults to grid layout (no fixed canvas
> size). Setting `width: 1920` is the new v2.7.4 default.
> Height is content-driven via grid.

### 2.4 Tabs / sections

- [x] **Single pane** — single grid layout, no tabs

> Project design language Section 2 supports tabs but they require
> `layoutDefinitions` + absolute layout. Grid is simpler and matches
> the operational use case (continuous presence; clicks go to Splunk
> search drilldowns, not tab switches).

---

# Section 3: Tone, Brand & Anti-References

### 3.1 Three tone words

| # | Word | What it implies |
|---|---|---|
| 1 | **Energetic** | Cyan as primary accent (high-saturation, almost neon); sparklines on every KPI; live-feel via 30s refresh; small color shifts when something needs attention |
| 2 | **Focused** | Dark canvas (`#0B0C10` per design language); aggressive hierarchy via font size; no decoration that doesn't earn its place |
| 3 | **Playful** | Allows category-named columns ("developer", "sysadmin", "nerd" — the actual product categories); NOT corporate; donut charts allowed (project's design language explicitly permits them) |

### 3.2 Anti-references

- [x] **AI-generic Splunk demo** — 4 same-size KPIs, default rainbow palette
- [x] **Splunk default Studio template** — pastel cards, sample-data labels
- [x] **Custom anti-references**:

> - **Shopify admin dashboard** — too utilitarian, treats all stores
>   the same; FAKE T-Shirt is a niche brand and the dashboard should
>   feel like ITS dashboard, not "any e-commerce dashboard".
> - **Tableau exec deck** — too gradient-y, too quarterly-revenue-feel;
>   we want minute-by-minute operational, not boardroom recap.
> - **Datadog APM dashboard** — too SREish for retail ops; engineering
>   has their own dashboard.

### 3.3 Positive references

| Reference | URL or path | What you like |
|---|---|---|
| Stripe dashboard | dashboard.stripe.com | KPI strip rhythm, subtle sparklines, dark theme done well |
| Linear (linear.app) | (mental model) | Cyan accent on dark; energetic but focused; modern |
| Vercel dashboard | vercel.com/dashboard | Real-time pulse; "is the deploy healthy?" idiom |
| Project's existing dashboards | `TA-FAKE-TSHRT/default/data/ui/views/` | Inherit color palette, ID conventions, scenario filter pattern |

### 3.4 Brand context

| Field | Value |
|---|---|
| **Brand name** | The FAKE T-Shirt Company |
| **Brand primary color** | `#00D2FF` (cyan — primary accent per project design language) |
| **Brand secondary color** | `#7B56DB` (purple — secondary accent) |
| **Brand neutral / background** | `#0B0C10` (canvas), `#13141A` (card surfaces), `#1A1B24` (elevated) |
| **Brand font** | `Splunk Platform Sans` (default; project design language doesn't override) |
| **Logo file** | `TA-FAKE-TSHRT/static/appIcon_2x.png` (provided in app); embed via `splunk.image` |

> **Color collision NOTE:** `#00D2FF` is both the brand primary AND
> Boston's location color. The location color usage is restricted to
> location-specific charts; brand cyan is used for headline KPI
> values, primary chart series, and links. Both can coexist because
> location-colored charts are explicit ("Orders by Office") and
> brand cyan is implicit (default accent). See design language
> Section 1.

> **Scenario colors are IMMUTABLE per design language Section 1.4:**
> Any chart that segments by `demo_id` MUST use the exact mapping
> (exfil = `#DC4E41`, ransomware = `#F1813F`, memory_leak = `#F8BE34`,
> cpu_runaway = `#FF677B`, disk_filling = `#7B56DB`, fw_misconfig =
> `#009CEB`, cert_expiry = `#00CDAF`, dead_letter_pricing inherits
> the warning palette `#F1813F`). NO exceptions.

### 3.5 Theme

- [x] **Dark only**

> Project design language is dark-first. No light variant requested
> for v1. Maya's office has dim lighting (warehouse loft) — dark is
> easier on the eyes during continuous use.

---

# Section 4: Data Sources & SPL

### 4.1 Data sources

> All searches use `index=fake_tshrt` and inherit the global time range
> token via `defaults.dataSources.ds.search.options.queryParameters`.
> January 2026 baseline: 42,776 orders / $5.36M revenue / 1,707
> unique customers / $125 AOV / 5 product categories.

| Source label | Sourcetype / pattern | Calculation | SPL |
|---|---|---|---|
| `ds_kpi_revenue` | `FAKE:online:order` | Total revenue current period | `index=fake_tshrt sourcetype="FAKE:online:order" \| timechart span=1h sum(pricing.total) as revenue` |
| `ds_kpi_orders` | `FAKE:online:order` | Order count current period | `index=fake_tshrt sourcetype="FAKE:online:order" \| timechart span=1h count as orders` |
| `ds_kpi_aov` | `FAKE:online:order` | Average order value (rolling) | `index=fake_tshrt sourcetype="FAKE:online:order" \| timechart span=1h avg(pricing.total) as aov` |
| `ds_kpi_pricing_errors` | `FAKE:online:order` filtered | Wrong-priced orders + revenue impact | `index=fake_tshrt sourcetype="FAKE:online:order" wrong_price=true \| stats count as wrong_orders, sum(revenue_impact) as impact` |
| `ds_orders_by_category` | `FAKE:online:order` | Orders by product category (developer / sysadmin / modern / security / nerd) | `index=fake_tshrt sourcetype="FAKE:online:order" \| spath items{}.category as category \| stats count by category` |
| `ds_orders_by_office` | `FAKE:online:order` | Orders by shipping origin / office | `index=fake_tshrt sourcetype="FAKE:online:order" \| stats count by office` (joined to identity lookup) |
| `ds_revenue_trend` | `FAKE:online:order` | 24h revenue trend | `index=fake_tshrt sourcetype="FAKE:online:order" \| timechart span=15m sum(pricing.total) as revenue` |
| `ds_servicebus_health` | `FAKE:azure:servicebus` | DLQ + healthy queue depth | `index=fake_tshrt sourcetype="FAKE:azure:servicebus" \| stats count by status` |
| `ds_site_health` | `FAKE:access_combined` | 5xx error rate from Apache | `index=fake_tshrt sourcetype="FAKE:access_combined" \| eval is_5xx=if(status>=500,1,0) \| timechart span=5m sum(is_5xx) as errors, count as requests \| eval error_rate=round(100*errors/requests,2)` |
| `ds_top_products` | `FAKE:online:order` | Top 10 SKUs by revenue | `index=fake_tshrt sourcetype="FAKE:online:order" \| spath items{} output=item \| mvexpand item \| spath input=item \| stats sum(lineTotal) as revenue, count as units by name \| sort -revenue \| head 10` |
| `ds_recent_pricing_errors` | `FAKE:online:order` filtered | Last-N wrong-price orders for the table panel | `index=fake_tshrt sourcetype="FAKE:online:order" wrong_price=true \| sort -_time \| table _time orderId customerId priceErrorType originalPrice pricing.total revenue_impact \| head 20` |

### 4.2 Mock data acceptable?

- [x] **No — must run against real indexes**

> The index has 7M events live; mock data would be a regression.

### 4.3 Time range

| Concern | Value |
|---|---|
| **Default time range** | `1767225600,1769904000` (epochs for Jan 1 – Feb 1 2026 — per project design language Section 4.11) |
| **User-adjustable?** | Yes — `input.timerange` with token `global_time` |
| **Per-panel overrides?** | Site-health panel uses last 1h via inline `earliest=-1h@h` for live-feel; revenue-trend uses last 24h |

---

# Section 5: KPIs & Panels

### 5.1 Hero KPIs

> Maya's first-scan questions: "Revenue tracking? Orders today? Anything
> wrong with pricing? Site healthy?"

| # | KPI label | Source | Number format | Threshold | Drilldown to |
|---|---|---|---|---|---|
| 1 | Revenue (period) | `ds_kpi_revenue` | currency `$1,234,567` | (no threshold — informational; sparkline carries trend) | search by `sourcetype="FAKE:online:order"` |
| 2 | Orders (period) | `ds_kpi_orders` | integer with `,` separator | (no threshold) | search same sourcetype |
| 3 | Wrong-Priced Orders | `ds_kpi_pricing_errors` | integer + `(-$X.X K impact)` underLabel | =0 success / 1-50 warning / >50 danger | search `wrong_price=true demo_id=dead_letter_pricing` |
| 4 | Site Error Rate | `ds_site_health` | percent (2 dp) `+ %` | <0.5 success / 0.5-2 warning / >2 danger | search `sourcetype="FAKE:access_combined" status>=500` |

> KPI #3 is the operational hero — when the dead_letter_pricing
> scenario fires, this is the metric that catches it. Threshold is
> sized around the January 2026 baseline (585 wrong orders / $19K
> impact during the 5-hour scenario window).

### 5.2 Secondary tiles (Sales pulse — 6 tiles)

| # | Tile label | Source | Threshold | Drilldown |
|---|---|---|---|---|
| 1 | Orders / hour | `ds_kpi_orders` (last 1h) | <50 warn / ≥50 success | search last 1h orders |
| 2 | Avg Order Value | `ds_kpi_aov` | (informational, no threshold) | search aov breakdown |
| 3 | Unique Customers | derive `dc(customerId)` | (informational) | identity drilldown |
| 4 | DLQ depth | `ds_servicebus_health` filtered `status="dead_letter"` | =0 green / 1-10 amber / >10 red | search DLQ |
| 5 | Failed Orders 24h | `ds_servicebus_health` filtered `status="failed"` | =0 green / 1-5 amber / >5 red | search failures |
| 6 | Apache reqs / sec | derive from `ds_site_health` | (informational) | site traffic |

### 5.3 Trend / chart panels

| # | Title | Viz type | Source | Notes |
|---|---|---|---|---|
| 1 | Revenue Trend (15m buckets) | `splunk.area` (stackMode: `none`) | `ds_revenue_trend` | Single series, cyan stroke, area fill at 30% opacity per design language Section 4.4 |
| 2 | Orders by Product Category | `splunk.pie` (donut, `showDonutHole: true`) | `ds_orders_by_category` | Per project design language: donut chart EXPLICITLY allowed for categorical breakdown. 5 slices, palette = chart series array |
| 3 | Orders by Office | `splunk.column` | `ds_orders_by_office` | Vertical bars, location colors immutable: BOS=cyan, ATL=green, AUS=yellow per design language |
| 4 | Site Error Rate (1h live) | `splunk.line` | `ds_site_health` | `lineSmoothing: linear`, `lineWidth: 2`, danger threshold band overlay |

### 5.4 Detail / table panels

| # | Title | Source | Columns | Status column? |
|---|---|---|---|---|
| 1 | Top 10 Products by Revenue (30d) | `ds_top_products` | Product Name (200), Units (90), Revenue (130) | No — data is informational |
| 2 | Recent Pricing Errors | `ds_recent_pricing_errors` | Time (130), Order ID (130), Customer (110), Error Type (130), Original Price (90), Charged (90), Impact (90) | Yes — Error Type column color-coded via `_color_rank` (per project design language Section 4.9: must use `rangeValue` with `_color_rank`, NOT `matchValue`) |

> **Important deviation from CISO/brewery examples:** Project design
> language explicitly forbids `matchValue` on tables (warns it causes
> `e.map is not a function` error). Must use `rangeValue` against an
> `_color_rank` numeric field. SPL adds:
> `\| eval _color_rank=case(priceErrorType=="price_doubled", 1, priceErrorType=="price_halved", 2)`

### 5.5 Markdown / narrative panels

| # | Position | Content |
|---|---|---|
| 1 | top header | "Retail Pulse" + FAKE T-Shirt Co. logomark |
| 2 | section divider 1 | `### Today's Pulse` |
| 3 | section divider 2 | `### Sales Activity` |
| 4 | section divider 3 | `### Pricing Integrity & Site Health` |
| 5 | section divider 4 | `### Top Products & Recent Pricing Errors` |
| 6 | footer | Quick links: ServiceNow incidents, Stripe dashboard, drilldown to discovery_orders |

> **No middle dots / em-dashes** in markdown content per design
> language Section 2 — use ASCII `--` and `|`.

### 5.6 Drilldowns

- [x] All panels drilldown by default

> Maya pivots heavily — every KPI, chart, and table row drills to
> Splunk search. Use `drilldown.linkToSearch` per ds-int-drilldowns.
> Per-row drilldown on tables uses `$row.<field>$`.

---

# Section 6: Visualization Preferences

### 6.1 Must-include viz types

- [x] `splunk.singlevalue` — KPIs + tiles
- [x] `splunk.area` — revenue trend (per design language 4.4 pattern)
- [x] `splunk.pie` — donut chart for product category breakdown (project design language 4.6 EXPLICITLY allows this; we don't override their permission)
- [x] `splunk.column` — orders by office
- [x] `splunk.line` — site error rate
- [x] `splunk.table` — top products, pricing errors
- [x] `splunk.markdown` — section headers, footer

### 6.2 Must-NOT-include viz types

- [x] `splunk.fillergauge` / `splunk.markergauge` — banned (not in project design language patterns)
- [x] `splunk.choropleth.svg` — out of scope for v1 (project has floor plans for that on the security dashboards)

> Unlike the CISO/brewery examples, `splunk.pie` is NOT banned —
> project design language explicitly defines a donut chart pattern.
> Skill rules ("avoid pie for >4 segments") yield to project design
> language.

### 6.3 Specific encoding rules

> - Sparklines on EVERY KPI tile (`showSparklineAreaGraph: true`,
>   `sparklineDisplay: "below"`, `sparklineStrokeColor: "#00D2FF"`)
> - All status indicators pair color with text glyph
> - Number format: thousand-separator on; revenue uses `$` prefix
>   (`unit: "$"`, `unitPosition: "before"`)
> - `cornerRadius: [12,12,12,12]` at TOP-LEVEL on every chart panel
>   (NOT inside `options`)
> - Table row coloring: `_color_rank` numeric field in SPL +
>   `tableFormat.rowBackgroundColors` with `rangeValue` + half-step
>   thresholds. NEVER `matchValue` on tables.
> - Donut chart: `showDonutHole: true`, `labelDisplay:
>   "valuesAndPercentage"`, palette uses chart series array from
>   design language Section 1.5
> - Series colors for office breakdown: BOS=`#00D2FF`,
>   ATL=`#53A051`, AUS=`#F8BE34` (immutable per design language)
> - NO emoji in panel titles per project design language Section 2
>   (allowed in markdown body, not titles — Splunk parser issues)

---

# Section 7: Constraints & Compliance

### 7.1 Splunk version

- [x] **Splunk Cloud** (10.4.x) — primary target
- [x] **Splunk Enterprise 10.2.x** (project also supports on-prem)

### 7.2 Accessibility

- [x] **Colorblind-safe palette only** — color always paired with glyph or shape
- [x] **WCAG AA** (4.5:1 contrast)

### 7.3 Performance constraints

| Concern | Limit |
|---|---|
| **Max search result count** | 50000 (Splunk default) — January 2026 has 42K orders, fits comfortably |
| **Max concurrent searches** | Use base+chain pattern: one base search on `sourcetype="FAKE:online:order"`, chain post-process for KPIs / tiles / charts that share the order data |
| **Refresh rate** | KPIs + tiles: `30s`; charts: `60s`; tables: `5m` |
| **Auto-refresh enabled?** | Yes — business hours only (Maya is always at desk) |

### 7.4 Export / sharing

- [ ] PDF export not required — operational, real-time
- [x] **Embed in another app** — Maya's team also accesses via the FAKE T-Shirt project's `discovery_overview.xml` as a featured tile

---

# Section 8: References & Assets

### 8.1 Existing dashboards to inherit from

| Dashboard / app | What to copy |
|---|---|
| Project's existing `discovery_*.xml` dashboards in `TA-FAKE-TSHRT/default/data/ui/views/` | KPI strip layout, scenario filter pattern, color palette adherence |
| `dashboard_design_language.md` (project's reference) | EVERY component pattern (4.1–4.13). Authoritative — overrides ds-couture defaults where they conflict |

### 8.2 Asset files

| File | Purpose |
|---|---|
| `TA-FAKE-TSHRT/static/appIcon_2x.png` | Brand mark in header |
| `docs/graphic/` (project) | Floor plans + scenario diagrams (referenced in scenario dashboards, not Retail Pulse) |

### 8.3 Reference material

- [x] `docs/reference/dashboard_design_language.md` — **AUTHORITATIVE** for all design decisions on this project
- [x] `docs/reference/splunk_queries.md` — pre-validated SPL patterns
- [x] `docs/scenarios/dead_letter_pricing.md` — context on the central operational risk this dashboard catches
- [x] `docs/datasource_docs/orders.md` + `servicebus.md` + `access.md` — data shapes for the SPL

---

# Section 9: Iteration & Hand-off

### 9.1 Deployment target

| Field | Value |
|---|---|
| **Splunk instance URL** | (local docker — credential via MCP) |
| **App** | `TA-FAKE-TSHRT` (the project's own app — dashboard ships AS PART OF the TA) |
| **Dashboard slug** | `discovery_retail_pulse_v1` |
| **Auto-deploy after build?** | Yes — use `splunk_create_dashboard` MCP tool |

### 9.2 Review iterations expected

- [x] **2-3 review rounds**

> Maya will validate against actual ops scenarios:
> 1. Day-of with no incident — does the dashboard feel calm and
>    informative?
> 2. Replay the dead_letter_pricing scenario (Day 16, 08:00–13:00
>    range) — does the wrong-price KPI fire correctly? Is impact
>    visible?
> 3. Replay the ddos_attack scenario (Days 18–19) — does the site
>    error rate jump and is it obvious where to drill?

### 9.3 Sign-off

- [x] Skip Q&A and proceed straight to build
- [x] User wants AI to confirm Sections 1.1, 2.1, and 3.1 verbally before starting

> One-line confirmations:
> 1. "Operational dashboard for Director of Retail Ops Maya Chen at
>    FAKE T-Shirt — single-pane, real-time, decision-oriented."
> 2. "Tone: energetic / focused / playful. Inherits project design
>    language (cyan/purple, dark canvas, scenario colors immutable)."
> 3. "Real data — January 2026 retail orders + ServiceBus + Apache
>    access. Dead-letter pricing is the central operational risk to
>    surface."

---

*Hand-off prompt to AI:*

> "Use the inputs in `templates/ds-inputs-EXAMPLE-faketshirt-retail.md`
> to design and build the dashboard. The project's
> `dashboard_design_language.md` is AUTHORITATIVE — read it first,
> respect every component pattern, color, and naming convention. Skip
> the Design Context Protocol Q&A. Build against real data in
> `index=fake_tshrt` (default time range epochs 1767225600 to
> 1769904000 per design language). Deploy to `TA-FAKE-TSHRT` as
> `discovery_retail_pulse_v1`. Surface the rendered URL when done."
