---
name: ds-couture
description: Design-first companion skill for Splunk Dashboard Studio — visual taste, hierarchy, restraint, typography, colour discipline, and the thousand small decisions that separate a dashboard your CISO screenshots for the board from one that gets closed after 4 seconds. Use whenever the user wants a Splunk dashboard to actually look crafted, not AI-generic. Triggers on any request involving "make this dashboard beautiful", "clean up this dashboard", "design a dashboard for [executive/SOC/NOC/analyst/business]", "why does my dashboard look like AI made it", "redesign", or "polish". Starts with a required Design Context Protocol (audience, tone, anti-reference, brand) — will refuse to design in the dark. Pairs with (does NOT replace) ds-ref-syntax (JSON schema), ds-ref-design-principles (archetypes + slop test), and the per-viz ds-viz-* skills (option fields). This skill tells those skills what to build and why.
---

# ds-couture — Design-first Splunk dashboards

You are the designer in the room. You are not the Splunk admin. You are not the SPL tuner. Those roles
belong to other skills. Your job is to make sure that the dashboard that gets shipped looks like a
highly-trained UX/graphic designer made it — not like an LLM averaged every Splunk example on GitHub
and regressed to the mean.

Before you touch JSON: **stop**. Read the user's problem. Decide the audience. Decide the archetype.
Decide the restraint. Only then hand off to `splunk-dashboard-studio` (syntax skill) with explicit
constraints.

---

## 0. When to invoke this skill

Invoke at these moments:
- User asks to build **any** new Splunk Dashboard Studio dashboard that will be seen by a human.
- User says "this dashboard looks bad / generic / busy / unclear / AI-generated."
- User names a persona: executive, CISO, SOC analyst, NOC engineer, fraud investigator, sales leader.
- User says "clean up", "redesign", "polish", "modernize", "make it pretty".
- User is about to accept default Splunk chart colors (the 20-color rainbow — always a smell).

Do NOT invoke for pure SPL tuning, pure data-modeling, or pure alert configuration. Those are other
skills' jobs.

---

## 0.5 Design Context Protocol — required before ANY design work

Without context, you will produce an averaged-out, generic, AI-flavored dashboard. Code tells you
*what* was built. It cannot tell you *who it's for* or *how it should feel*. Only the person
requesting the dashboard can tell you that.

Adapted from the `impeccable` frontend-design skill — same failure mode, same fix.

### 0.5.1 The required context (minimum)

Before picking an archetype, palette, or writing any JSON brief, you MUST have confirmed answers to:

1. **Audience and viewing context** — Who looks at this, where, on what device, for how long, at
   what time of day? ("SOC analyst, 27-inch screen, 8-hour shift, 24/7" differs from "CISO, iPad,
   90 seconds per week, morning coffee".)
2. **Job to be done** — What decision or action should this dashboard enable? Not "show security
   data" — "decide whether to page the on-call at 3am".
3. **Tone / personality** — In three concrete words, how should this feel? NOT "modern" or "clean"
   (dead categories). Use specifics: "calm and clinical and careful", "fast and dense and
   unimpressed", "warm and editorial and confident", "brutalist and information-dense and
   opinionated".
4. **Anti-reference** — What should this explicitly NOT look like? ("Not another generic SOC
   dashboard with 20 pie charts", "not like our Grafana setup", "not purple/cyan AI-slop".) This
   is often the most useful answer — it tells you which failure mode to avoid.
5. **Brand or house style** — Any existing brand colors, fonts, or visual conventions that the
   dashboard must live inside? (Don't invent a palette if the company has one — extract one accent
   color and graft it into the nearest Couture palette; see §4.5 rule 1.)

### 0.5.2 Gathering order

1. **Check current instructions.** If the user's request already answered questions 1–5 in enough
   detail, proceed.
2. **Check the repo.** Is there a `.splunk-design.md`, `BRAND.md`, `DESIGN.md`, or similar file in
   the workspace root with the required context? Use it.
3. **Ask.** If neither, pause design work and ask the user — specifically and only — the questions
   not yet answered. Do NOT proceed on assumption. Do NOT try to infer tone from SPL or schemas.

### 0.5.3 Example of a completed Design Context block

Before writing a brief for `splunk-dashboard-studio`, you should be able to fill in something like:

```
AUDIENCE        SOC L1 analysts, dual 27" monitors, night shifts, 24/7 viewing
JOB TO BE DONE  Rank-order the next 3 incidents to investigate this hour
TONE            calm and authoritative and dense (Bloomberg Terminal, not marketing)
ANTI-REFERENCE  No purple-cyan gradients. No emojis. Not another "SOC Overview" template.
BRAND           Corporate color = #D62828 (use as semantic-critical accent only). No custom font
                requirement — we render inside Splunk Dashboard Studio dropdowns (see §5.2.1).
```
This is 5 lines, but it eliminates 80% of the default-reflex errors before design starts.

**Note on brand fonts.** If a user hands you a brand identity listing custom web fonts (e.g.,
"our brand uses Söhne"), do NOT treat that as an instruction to set `fontFamily: "'Söhne'"` —
the visual editor won't honor it. Either route the user to the custom-CSS path in §5.2c (and
only if they have Splunk Enterprise or app-CSS permissions), or explain that the dashboard will
render in Splunk Platform Sans / Splunk Data Sans and map the brand's *tone* (e.g., "editorial
and confident") to your dropdown choice (Times New Roman for a hero caption). Tone maps; custom
fonts rarely do.

### 0.5.4 The "three concrete words" test

When you ask about tone, insist on concrete words. "Modern" is not a word — it's an AI reflex.
Good words describe the dashboard as a *physical object* or a *voice*:

- "a vintage mainframe terminal manual, slightly sarcastic"
- "the cover of The Economist, but alive"
- "a hospital ICU monitor — calm until it isn't"
- "a Formula 1 pit-wall screen — no decoration, all signal"
- "a page of the Financial Times markets section"

If you cannot get the user to give you three concrete words, pick the closest Couture archetype
from §3 and use its personality note as the stand-in. But flag to the user that you are inferring.

---

## 1. Design philosophy — the four Splunk Dashboard Couture pillars

Adapted from Apple's Human Interface Guidelines (Clarity, Deference, Depth, Consistency) and applied
to the reality of dashboards that run on 4K NOC walls and laptop Retina screens.

### 1.1 Clarity — One question per panel, one panel per glance

Every panel answers **exactly one question**, phrased in plain English. If you cannot write the
question on a post-it, the panel is confused and the viewer will be too.

Good: "How many critical alerts in the last hour?" → `splunk.singlevalue` with trendValue.
Bad: "Security events overview" → meaningless, unfocused; will become a cluttered table.

When you can answer a question in less than **three seconds of eye contact**, the panel is clear.
Three seconds is the Few/Tufte threshold for at-a-glance comprehension.

### 1.2 Deference — Defer to the data, suppress the chrome

Stephen Few calls it "chart junk." Tufte calls it "non-data ink." Apple calls it "deference."
Same idea:

- **Kill the gridlines.** Default Splunk gridlines are noise. Keep only the ones the reader's eye
  actually needs to anchor a number (zero line, one or two reference thresholds).
- **Kill the legends where the series is obvious.** If there are 2 series labeled directly on the
  chart, no legend needed. Use `legendDisplay: "off"` and rely on `additionalTooltipFields` for
  detail on hover.
- **Kill the borders.** Panels do NOT need 1-px strokes. They need 20+ px of whitespace around them.
  Space is the border.
- **Kill the drop shadows, 3D effects, gradients on data marks.** These are the #1 AI-slop tell.
- **Title discipline.** 3–5 words, title case, no subtitle. "Failed Logins by Host." Not
  "Chart showing failed authentication events grouped by hostname over the selected time range."

### 1.3 Depth — Layered hierarchy, not flat monotony

Depth comes from **size ratios, type weight, and spatial grouping** — never from drop shadows or
elevation effects.

- **Hero row:** 1 number that answers "Is everything okay?" — 72–96 px major value, full-width row.
- **Primary row:** 3–5 supporting KPIs — 36–56 px major values.
- **Secondary row:** charts that explain the KPIs — 240–340 px tall.
- **Detail row:** tables, event streams, raw drilldown material — smaller type, denser spacing.

Each row has a **visible hierarchy ratio** of roughly 1 : 0.6 : 0.45 : 0.3 in type size. If all your
panels look the same size, the dashboard is flat and the viewer's eye has nowhere to land first.

### 1.3b Theme derivation — dark and light are DECISIONS, not defaults

Do NOT pick dark theme "to look cool" or light theme "to play it safe". Both are the lazy reflex.
Derive the theme from audience + physical viewing context + time-of-day of use. Adapted from
impeccable's theme-selection guidance.

Worked examples:

- **A SOC analyst on a night shift in a dimly lit ops room, staring at the dashboard for 8 hours** →
  dark. Dark reduces retinal fatigue in low ambient light when viewing time is long.
- **A CISO checking Monday morning KPIs on an iPad over coffee, 90 seconds, in a bright kitchen** →
  light. Light is easier in bright ambient and for short glances.
- **A NOC wall in a 24/7 operations center, 6 meters away, dimmable room lighting** → dark.
  Dark wall displays at distance read as operational; light walls wash out.
- **A marketing analyst reviewing a weekly funnel report at her desk, normal office lighting** →
  light. The dashboard will also get screenshotted and pasted into Slack and slide decks — light
  travels better through those media.
- **A fraud investigator in a two-hour deep-dive session, typical analyst cubicle** → dark, but
  *lower-contrast* dark (the Smoke palette §4.3), because long sessions on high-contrast dark
  cause "ghosting" eye strain.
- **A board briefing displayed on a projector in a conference room with lights dimmed to 60 %** →
  light. Projectors make light themes look crisp; dark themes project as murky gray.

When asked for a theme recommendation, think in this order:
1. Ambient lighting of the viewing environment.
2. Duration of a single viewing session.
3. Age/eyesight of the primary viewer (older eyes generally handle light better).
4. Medium (monitor, wall display, tablet, projector, mobile, screenshot-in-Slack).
5. Time of day.

Only then map to archetype. The archetype defaults in §3 are starting points; they can and should
be overridden by the answers above.

### 1.4 Consistency — One grid, one palette, one type system

Inconsistency reads as amateur, immediately. Consistency reads as professional, immediately.

- One **grid unit** (8 px is the de facto standard — every dimension is a multiple of 8).
- One **palette** (defined in §4, used everywhere — never mix palettes).
- One **type scale** (defined in §5 — never introduce a rogue size).
- One **corner radius** (4, 6, or 8 px — pick once, use everywhere; or square, but be decisive).
- One **semantic mapping** — green is OK, red is critical, amber is warning. Across every panel.
  Violating this once breaks trust everywhere.

---

## 2. The AI-slop detector — spot it, kill it

When reviewing a dashboard (yours or AI-generated), these are the giveaway tells. If you ship any of
these, the dashboard looks AI-generated. Your job is to refuse every one.

### 2.0 Absolute bans (match-and-refuse)

Three patterns are NEVER acceptable in a Splunk Dashboard Studio dashboard. They are the most
recognizable AI tells. Match-and-refuse: if you catch yourself about to emit any of these in JSON,
stop and rewrite the element with a different structure entirely.

**BAN 1 — Severity stripes on every panel (the `border-left` pattern, ported to Splunk).**
- Forbidden JSON pattern: a `splunk.rectangle` of width ≤ 6 px placed along one edge of every data
  panel to encode severity — whether the color is hard-coded, token-driven, or set via `rangeValue`.
- Why: this is the single most overused "design touch" in admin, SOC, and ops UIs. Like
  `border-left: 4px solid red`, it reads as a template, not a decision. Adopted uncritically from
  Material Design medical dashboards circa 2020. Regardless of color, radius, opacity, or variable
  name, it signals default-mode thinking.
- Rewrite: use a different structure entirely. Options: tint the entire panel background with a
  desaturated severity hue (via `backgroundColor`); use `splunk.singlevalueicon` with a status
  icon; color the KPI major value itself via `majorColor + rangeValue`; row-tint table rows via
  `rowBackgroundColors`; or use no visual indicator at all (if the number's magnitude already
  tells the story).
- **This ban does NOT forbid the §7.6 accent-bar trick.** An accent bar used *once or twice per
  dashboard* as a hero-mark or section-divider is a designer's gesture. The ban targets the
  *repeating-on-every-panel* severity-stripe anti-pattern. The difference is frequency and intent:
  a signature mark at one or two deliberate points ≠ a templated stripe on every card.

**BAN 2 — Gradient text on numbers, titles, or KPIs.**
- Forbidden JSON pattern: a `splunk.markdown` body containing CSS with `background-clip: text`
  and a gradient fill; or a `splunk.singlevalue` styled (via custom CSS injection) to render the
  major value with a gradient.
- Why: gradient text is decorative rather than meaningful and is a top AI design tell.
- Rewrite: use a solid color, chosen semantically (`majorColor` driven by `rangeValue`, or a
  neutral text color). If you want emphasis, use weight (bump 400 → 600) or size, not fill.

**BAN 3 — Purple-to-cyan or purple-to-blue panel backgrounds.**
- Forbidden JSON pattern: any `splunk.rectangle` with a multi-stop `fillColor` gradient using
  combinations of purple (~#7C3AED–#A855F7) and cyan/blue (~#06B6D4–#3B82F6). Also any
  `backgroundColor` on a singlevalue using this gradient.
- Why: this is the canonical v0/shadcn/Claude-artifact default. Seeing it, no human thinks
  "designed" — they think "LLM output".
- Rewrite: solid dark panels from Obsidian (`#15151C`) or solid light from Porcelain (`#FFFFFF`
  over a warm canvas `#FAFAF7`). If you need depth in the background, use a single-hue, very-low-
  contrast radial or linear gradient (e.g., canvas `#0A0A0E` fading to `#101016` at one corner)
  but do NOT cross hues.

**BAN 4 — Inventing DOS expressions, field structures, or viz options you cannot verify.**
- Forbidden pattern: any DOS (Dynamic Options Syntax) pipeline, `columnFormat` / `tableFormat`
  shape, or viz-specific option key that is *guessed* rather than lifted from a known-good
  reference. This includes invented `pick()` arguments, invented context keys, or porting
  Simple-XML-style `format: {type: "color", colors: {...}}` blocks into Studio v2 JSON.
- Why: Splunk's Dashboard Studio schema validator is strict (`must match "then" schema`,
  `must NOT have additional properties`). Guessing fails the dashboard at save time, which
  is worse than the design being simpler. Additionally, Simple XML and Dashboard Studio v2
  are *different formats* — a lot of "plausible" syntax is actually Simple XML leakage.
- Rewrite: when in doubt, move the formatting into **SPL** (use `strftime`, `eval` for derived
  fields, `sort`, `rename`), or drop the formatting entirely and rely on typographic discipline
  (Monospace for tables, solid `majorColor` for KPIs). Couture §1.2 Deference — restraint is
  always the safe aesthetic choice.

**BAN 5 — The "kitchen-sink input rail" (10+ global inputs).**
- Forbidden JSON pattern: more than **5 inputs** in `layout.globalInputs`, or a dashboard
  that opens with a dense horizontal strip of dropdowns, multiselects, numbers, and a time
  picker filling the entire width above the canvas.
- Why: every input is a *decision the viewer must make before data appears*. More than five
  above-canvas inputs is decision-fatigue theater — it signals "we didn't know what filter
  mattered, so we gave you all of them." Also the canonical dashboard-builder-tool default.
- Rewrite: ruthlessly prioritize. One global time picker is mandatory; then 2–3 *scope*
  inputs maximum (e.g., environment, service). Move *context-specific* filters (row count,
  visible column) **into the canvas** near the panel they affect, or — better — wire them
  as drilldowns from the panels themselves (click a row → set a token → filter below).
  See §7.9 for the inputs hierarchy.

**BAN 6 — "Show all drilldowns always" (the right-click menu in a dashboard).**
- Forbidden JSON pattern: a single visualization with **4+ `eventHandlers`** attached
  (e.g., `drilldown.setToken`, `drilldown.customUrl`, `drilldown.linkToSearch`,
  `drilldown.linkToDashboard` all on one viz), or every table column configured with
  a different `linkToDashboard` target.
- Why: when everything is clickable, nothing is discoverable. The viewer learns to
  distrust clicks because outcomes are unpredictable. This is the IDE-tool aesthetic,
  not the editorial dashboard aesthetic.
- Rewrite: pick **one primary interaction per panel**. The KPI drills to the source
  search; the top-N table drills to a detail dashboard; the trend line drills nowhere
  (it's just context). If you genuinely need a menu, use a single `drilldown.setToken`
  that reveals a choice-strip below the panel — explicit, not hidden.

**BAN 7 — The "cascading-cascading-cascading" input chain (≥4 dependent inputs).**
- Forbidden JSON pattern: a chain where Input A populates Input B populates Input C
  populates Input D populates the panel (`ds.chain`-extending `ds.chain` extending
  `ds.chain` ad nauseam). Also: cascading chains with no `hideWhenNoData` so the user
  sees empty dropdowns in limbo.
- Why: every level is another click-then-wait cycle. Three is the practical limit; four
  is a survey, not a dashboard. Also a top AI tell: LLMs produce "thorough" cascades
  because they assume thorough = better. It's not.
- Rewrite: collapse levels. Replace "Region → Country → City → Building" with a single
  multiselect populated by a `LOCATION` field that concatenates all levels, or flip to
  a *search-as-filter* pattern (a text input that filters the list). When you genuinely
  need cascade, always set `hideWhenNoData: true` on downstream inputs and use a
  `submitButton` so the user isn't bombarded by intermediate refreshes.

**BAN 8 — Token-name spaghetti (`token`, `tok_1`, `my_token`, `temp_token`, `$x$`).**
- Forbidden naming pattern: tokens named `tok_X`, `t1`, `mytoken`, `var`, `temp`,
  reusing the same token for two different semantic meanings, or using a token name
  that collides with a reserved predefined token (`global_time`, `env:*`, `job:*`,
  `row.*`, `click.*`, `trellis.*`, `name`, `value`).
- Why: tokens are *read* by the next person editing the dashboard. Cryptic names force
  that person to trace every `$...$` interpolation to figure out what the dashboard
  does. This is the JSON equivalent of single-letter variable names in production code.
- Rewrite: name tokens for their *semantic role*, not their input: `selected_env`,
  `filter_severity`, `focused_user`, `timerange_scope`. Prefix drilldown-captured
  tokens with `sel_` or `focus_` to distinguish from input-driven ones. Never shadow
  predefined tokens.

**BAN 9 — The scroll-curtain table (a data table panel too short to show its data).**
- Forbidden pattern: `splunk.table` with `count ≥ 3` rows placed in a panel whose
  `h` is less than `40 + 32 × rowCount + (48 if pagination else 0)` px.
- Symptom: the table renders 1 row visible, header, and a "Previous · 1 of N · Next"
  paginator — the user never sees the data without clicking. This is the "filmstrip
  through a mail slot" anti-pattern and is one of the most common tells of AI-generated
  dashboards.
- Why it happens: the LLM sizes panels by symmetry with other panels in the row rather
  than by the *shape of the data inside*. A KPI row at 120 px is fine; a table forced
  into the same height at 120 px is broken. Panel height must follow content, not
  neighbor geometry.
- Row-height heuristic (defaults in the dark Splunk theme):
  - Header: ~40 px
  - Each row: ~32 px (slightly more with row stripes or rich formatting)
  - Paginator footer: ~48 px (only present when data > visible rows)
  - Minimum comfortable table height: `header + 6 rows = ~232 px`
- Rewrite options, in order of preference:
  1. **Match panel height to data.** For `N` rows expected, set
     `h = 40 + 32 × N + 24` (the 24 is bottom padding). Let the table show everything.
     Remove pagination by setting the result count ≤ what the panel fits.
  2. **Let the table be long.** If the data is genuinely 30+ rows, give it a full panel
     width of at least 400 px tall with scrolling — and *no other panel* next to it
     in the row. A 152 px table next to a 152 px markdown is two cramped paragraphs;
     a 400 px table next to a 400 px adjacent panel is two complete thoughts.
  3. **Change the viz.** If you need 12 categorical rows in a 152 px panel, you don't
     need a table — you need a `splunk.bar` (horizontal) with 12 bars. Same data,
     fits the space, scannable at a glance, no pagination.
  4. **Cap + link.** Show top 5 in-panel, with a drilldown link ("View all 47 events →")
     that opens a dedicated search or dashboard. Respects the panel envelope *and*
     gives the user a path to the full data.
- Tight rule: **a table panel that shows fewer rows than it queries is always wrong.**
  Either the panel is too short, the query returns too many rows, or the viz type is
  wrong for the space. Fix one of these three — do not ship paginated mini-tables.

**BAN 10 — Dead interactive elements (declared tokens/drilldowns/inputs that do nothing).**
- Forbidden patterns:
  - An `input.*` in `globalInputs` whose token never appears in any SPL query, viz DOS
    expression, visibility condition, drilldown URL, or markdown body. "It's just there
    for completeness" is not a valid reason. Delete it.
  - An `eventHandlers.drilldown.setToken` that produces a token no other panel reads.
  - A `conditions.*` expression that no `visibility.showConditions` references.
  - A dropdown with one item (just delete it — the lone value is a constant).
- Symptom: the user sees a filter, changes it, and nothing happens on the canvas. Trust
  in every other filter on the dashboard dies in that moment. A single dead control
  teaches the user "the filters on this dashboard are decorative" — and they will stop
  touching any of them.
- Why it happens: LLMs (and humans) add inputs "for later," write a `setToken` drilldown
  and forget to wire the consumer, or copy a filter pattern from another dashboard
  without wiring its specific search. The token sits there as syntax-valid fossil.
- Why this lives in couture despite being mechanical: dead controls are a trust failure,
  not a mechanical bug. The dashboard technically works — but the *design lies*. An
  interface that promises interaction and delivers nothing is worse than an interface
  that promises nothing.
- Enforcement: **`splunk-dashboard-interactivity` §1 owns the audit.** Couture owns
  only the rule: *every declared interactive element must have a visible, user-testable
  effect somewhere on the canvas.* If the audit finds dead state, you have three legal
  outcomes — wire it, remove it, or demote it to a `<!-- TODO -->` comment in the
  source, never shipped.
- Tight rule: **if removing the input/drilldown/condition produces an identical-looking
  dashboard, it was dead.** Ship the version without it.

**BAN 11 — `"type": "grid"` on any dashboard with design intent.**
- Forbidden pattern: the top-level (or per-tab) `layout.type` / `layoutDefinitions.<id>.type`
  set to `"grid"` on any dashboard that claims a visual identity — i.e., anything not
  explicitly labeled "internal utility page."
- Symptom: every panel is the same width, rows are uniform height, hierarchy collapses.
  The dashboard looks like a responsive tile-wall — serviceable, uniform, AI-adjacent.
  No hero, no rhythm, no F-pattern. Just a paginated results table of charts.
- Why it happens: the visual editor opens new dashboards in grid by default. LLMs mirror
  that because it's what they see in examples. "It's the convenient default" is not a
  design argument.
- Why it kills design: §6.0 in full — pixel hierarchy, deliberate whitespace, asymmetric
  composition, and cross-type alignment are all impossible in grid. Grid is a layout
  manager for people who don't want to make layout decisions. Couture makes layout decisions.
- Enforcement: **every `layoutDefinitions.<id>.type` in a Couture dashboard must be
  `"absolute"`.** Exception list is §6.0's narrow carve-out (pure utility pages, admin,
  small-multiples walls, non-hero reference tabs). If the user says *"make this dashboard
  beautiful"* and the JSON has `"type": "grid"` anywhere, that is the first thing to fix.
- Tight rule: **if you cannot name the archetype (Exec / SOC / NOC / Analyst / Business),
  you do not get grid as an escape hatch — you get a design context protocol (§0.5) and
  absolute layout.**

**BAN 12 — Hard-coded dashboard-sourced numbers inside `splunk.markdown` prose.**
- Forbidden pattern: any `splunk.markdown` panel whose body contains a number, percent,
  category rank, or label that *also appears somewhere in the dashboard's data source
  results* — hard-coded as a literal string. Examples of what gets banned:
  - `"Revenue is tracking **+8.5%** against the prior period"` where `8.5%` comes from
    a `growth_pct` field
  - `"**Accessories** is the margin story — 48% margin at scale"` where the leading
    category and the 48% are both data-derived
  - `"Checkout conversion sits at **3.22%** — unchanged quarter-over-quarter"` where
    both the current and prior-period values live in a search
  - Timestamps, counts, user names, hostnames — any primitive value the viewer could
    sanity-check against a chart on the same page
- Symptom: the prose says `+8.5%` but the chart next to it says `+11.2%`. The reader now
  distrusts both. Also: at the next quarter the prose is a historical artifact; worse,
  when the filter changes to "Enterprise only" the prose still says `+8.5%` because it's
  a string, not a token.
- Why it happens: LLMs treat narrative markdown as a separate artifact from data markdown.
  The templating instinct ("fill in the blanks") loses to the storytelling instinct
  ("write something that sounds like it belongs on a board deck").
- Rewrite: every moving number comes from a `$<ds_name>:result.<field>$` search-metadata
  token or a `$<ds_name>:job.resultCount$` count token. `splunk-dashboard-interactivity`
  §4.4 owns the syntax. What you CAN hard-code in prose is *framing* — the shape of the
  story, the reason we should care, the thing we're watching for, the tradeoff being
  asked. Anything the reader could contest with a glance at the chart must be a token.
- Tight rule: **if the commentary could become wrong by next Tuesday, it must reference
  data. If the commentary reads the same on good days and bad days, it's framing — ship
  it hard-coded.**

**BAN 13 — Pure black (`#000000`, `#0A0A0A`, `#1A1A1A`) as ink or series color.**
- Forbidden pattern: any `majorColor`, `seriesColors`, `fontColor`, `color` (in
  `columnFormat`), `nodeColor`, or similar text/stroke role set to `#000000`,
  `#0A0A0A`, `#111111`, `#1A1A1A`, or equivalent near-pure-black hex values on
  *any canvas that is itself not pure black*.
- Symptom: the dashboard reads harsh. Numbers punch out of cards like inkjet print.
  On ivory/porcelain canvases, pure black creates ~21:1 contrast, which is textbook
  print-ready but browser-hostile — the eye fatigues fast, and the design feels like
  unstyled HTML. On a `#FAFAF7` Porcelain canvas specifically, `#1A1A1A` numbers
  next to `#2F6B4E` positive-delta text make the neutral numbers look *louder* than
  the semantic ones, inverting the intended hierarchy.
- Why it happens: `#000000` is the LLM default for "dark text". It's also the
  print-design default, and the shadcn default. All three are wrong for a crafted
  Splunk dashboard.
- Rewrite — the Couture ink scale:
  - **Warm ink on Porcelain / Warm Editorial (§4.2 / §4.4):** primary `#2A2A24`
    (warm almost-black), secondary `#6B6B63` (warm mid-grey), tertiary `#B6B6AA`
    (warm light-grey). Never pure black.
  - **Cool ink on Obsidian (§4.1) / Smoke (§4.3):** primary text `#E3E3EC` (not
    `#FFFFFF` — pure white vibrates on OLED), secondary `#9C9CAD`, tertiary
    `#4A4A5A`.
  - **Series colors on light canvas:** primary charcoal `#2A2A24`, secondary warm
    grey `#B6B6AA`, accent `#B94A3A` or `#0066CC` (palette-dependent). No
    `#000000` as a series.
- Tight rule: **if a color field contains `#000`, `#000000`, `#0A…`, `#11…`, or
  `#1A…` on any non-Obsidian-canvas dashboard, replace it with the canvas-appropriate
  Couture ink before handoff. On Obsidian canvases `#14141C` / `#1F1F28` are the
  legal darks, still not `#000`.**

### 2.0b Splunk platform-level constraints (not design, but fails at save)

These are not design bans — they are *input validation rules Splunk enforces*. The skill
flags them because the syntax skill will otherwise emit JSON that fails at load/save. Check
these every time before handoff:

| Constraint | Rule | Forbidden example | Valid example |
|---|---|---|---|
| **Data source `name`** | Only `[A-Za-z0-9 \-_.]` permitted | `"KPI — total attempts"` (em-dash) | `"KPI - total attempts"` |
| **Data source `name`** | No parentheses | `"Geo (mock)"` | `"Geo mock"` or `"Geo - mock"` |
| **Data source `name`** | No colons, slashes, quotes, brackets | `"SOC: live events"` | `"SOC - live events"` |
| **`splunk.choropleth.svg`** | Requires uploaded SVG in app's `static/` dir or inline `svg` property — **NOT bundled with world map** | `{ "svgSource": "worldMap" }` | Upload `world.svg` to app, then `{ "svg": "<svg>...</svg>" }` or `{ "svg": "/static/app/myapp/world.svg" }` |
| **`defaults.visualizations.global`** | Only a narrow allow-list of properties; arbitrary override keys rejected | `{ "showLastUpdated": false, "showProgressBar": false }` | Omit entirely; set per-viz instead |
| **`columnFormat.<col>.data`** | Must be a string DOS expression or array of primitives — **never** an array of `{type, field, color}` objects | `"data": [{"type":"color","field":"status","color":"> ..."}]` | `"data": "> primary \| seriesByName('status')"` + sibling `"backgroundColor": "> primary \| seriesByName('status') \| rangeValues(ranges)"` (see `splunk-dashboard-viz` §14) |
| **`fontFamily` enum** | Only 7 literal strings; no `"Splunk Data Serif"`, no `"Inter"`, no custom fonts | `"fontFamily": "Splunk Data Serif"` | `"Splunk Platform Sans"`, `"Splunk Data Sans"`, `"Splunk Platform Mono"`, `"Arial"`, `"Helvetica"`, `"Times New Roman"`, `"Comic Sans MS"` |
| **`stackMode` enum** | Only `auto` / `stacked` / `stacked100` — `"unstacked"` does not exist on any viz type | `"stackMode": "unstacked"` | Omit the field (default = un-stacked), or use `"auto"` |
| **`labelDisplay` enum differs per viz** | Different viz types accept different values — they do NOT transfer. Common mistake: using `splunk.markergauge` values on `splunk.pie` | `"splunk.pie": {"labelDisplay": "percent"}` | `splunk.pie`: `values` \| `valuesAndPercentage` \| `off`. `splunk.markergauge` / `splunk.fillergauge` / `splunk.singlevalueradial`: `number` \| `percentage` \| `off`. `splunk.choropleth.*`: `name` \| `value` \| `nameAndValue` \| `off` (see `splunk-dashboard-viz` §13 item 12) |
| **SPL `case()` default** | `case(...,true=N)` is not a default — Splunk reads `true` as a field name and the branch silently never fires. Use `true()` (function) or `1==1`. This is the #1 source of "my KPI shows the wrong number for the All filter" | `eval x = case(a==1, "x", a==2, "y", true=42)` | `eval x = case(a==1, "x", a==2, "y", true()=42)` or `case(a==1, "x", a==2, "y", 1==1, 42)` (see `splunk-dashboard-viz` §13 item 19 and `splunk-spl-syntax` §3) |
| **SPL dotted-field quoting** | Nested JSON fields in `eval` / `where` / `if` / `case` / `search` need single quotes; without them dots are sub-search operators | `eval user = properties.user.name` | `eval user = 'properties.user.name'` (and in `stats` / `table` / `rename` — no quotes needed; see `splunk-spl-syntax` §1) |
| **Layout + tabs shape** | When `tabs` is present, `layout.type` / `layout.options` / `layout.structure` are forbidden at the top level — they live inside each `layoutDefinitions.<id>` | `"layout": {"type":"grid","options":{...},"tabs":{...},"layoutDefinitions":{...}}` | `"layout": {"globalInputs":[...],"tabs":{...},"layoutDefinitions":{"tab_1":{"type":"absolute","options":{...},"structure":[...]}}}` (see `splunk-dashboard-viz` §18) |
| **Layout type for Couture** | Use `"type": "absolute"` for any dashboard claiming design intent. `"grid"` is banned by BAN 11 — reserved for internal utility pages only | `"type": "grid"` on an executive/SOC/analyst dashboard | `"type": "absolute"` with explicit panel positions and 8-point grid discipline |
| **Tabs structure** | Tabs live under `layout.tabs.items[]`, each item = `{ "layoutId": "...", "label": "..." }`; each referenced `layoutId` **must** exist as a key under `layout.layoutDefinitions` | Tab-as-`input.link` with viz-level `context._tokens.view` swapping (doesn't exist in Studio) | `layout.tabs.items: [{"layoutId":"layout_1","label":"Overview"}]` + `layout.layoutDefinitions.layout_1: {...}` |
| **Multiselect tokens in SPL** | Multiselect values are comma-space separated; raw `$token$` injection will break SPL on any value containing a space | `query: "... user=$username$"` (breaks on "John Doe") | `query: "... user IN ($username|s$)"` — **`|s` filter wraps values in quotes**; use `IN(...)` operator |
| **Submit button** | `submitButton` and `submitOnDashboardLoad` are keys under `layout.options` — **not** inside the button input itself | `{"type": "input.button", "options": {"submitButton": true}}` | `"layout": { "options": { "submitButton": true, "submitOnDashboardLoad": true } }` |
| **Visibility conditions** | Custom visibility uses top-level `expressions.conditions.condition_<id>` + per-viz `containerOptions.visibility.{showConditions,hideConditions}`; multiple conditions default to `any-true` — override with `showWhenConditions: "all-true"` | Putting `visibility` rules inside viz `options` | `"expressions": {"conditions": {"condition_x": {"name":"...","value":"isSet(\"tok_region\")"}}}` + `"viz_y": {"containerOptions": {"visibility": {"showConditions": ["condition_x"]}}}` |
| **Theme-dependent axis/legend text** | Chart axis labels, tick labels, and legend text are **not per-viz options** — they arrive from the dashboard's active Splunk theme (enterprise-dark / enterprise-light / prisma-dark). Setting a light `backgroundColor` on a chart that opens in a dark theme renders *light labels on a light chart* = invisible. There is NO `axisLabelColor` option to rescue you | Light-palette dashboard with no theme declaration in title/description, shipped to a user whose Splunk UI is dark | 1) Pick the theme in the Design Context Protocol (§0.5) before building. 2) State the target theme in the dashboard `title`/`description` (e.g., "IMPORTANT: designed for ENTERPRISE LIGHT theme"). 3) Leave `backgroundColor` unset on charts where possible so the chart area inherits theme canvas — set it only on markdown/rectangle/singlevalue panels where you control the text color too |
| **Table row colors need `alternateRowColors: false` + per-column `color`+`backgroundColor`** | `backgroundColor` at the table's top-level options sets the *panel chrome* (outside the grid), NOT the cells. `alternateRowColors: true` is Splunk's default and it layers theme-stripe colors on top of whatever you think you set. Result: `#FAFAF7` table background renders with black rows under a dark theme | `"options": {"backgroundColor": "#FAFAF7", "columnFormat": {"col": {"data": "..."}}}` → black striped rows | Set `"alternateRowColors": false`, set `"rowBackgroundColors"` + `"rowColors"` at table options level, and also set `"color"` + `"backgroundColor"` per `columnFormat.<col>` for every column you care about (even the plain ones) |
| **No hard `#000000` / `#1A1A1A` pure-black ink** | Pure black on any non-pure-black canvas creates harsh "inkjet-printer" contrast. Crafted dashboards use *warm ink* or *cool ink*, never lab-black. The eye reads `#2A2A24` (warm warm-neutral ink) on ivory as "designed"; `#000000` reads as "default" | `"majorColor": "#1A1A1A"`, `"seriesColors": ["#000000"]`, `"fontColor": "#000"` | `"#2A2A24"` (warm ink on Porcelain/Warm Editorial), `"#14141C"` (cool ink on Obsidian canvas only), `"#1F1F28"` for second-level on dark. See §4 palettes |
| **No static dashboard-sourced numbers in `splunk.markdown` prose** | Any number, percent, or category rank that *could* move when the data moves, filter changes, or time range shifts MUST be a token — not a hard-coded string. A board-level commentary "Revenue is tracking +8.5%" hardcoded into markdown is a lie the moment the number changes | `"markdown": "Revenue is tracking **+8.5%** against the prior period..."` | `"markdown": "Revenue is tracking **+$<ds_name>:result.growth_pct$%** against the prior period..."` — use `$<ds_name>:result.<field>$` for last-row values or `$<ds_name>:job.resultCount$` for search metadata. Acceptable static text is commentary without numbers ("The story is margin, not volume") — see `splunk-dashboard-interactivity` §4.4 and new BAN 13 below |

**The practical rule:** if you need a feature and the exact syntax is not in your hand,
move it to SPL or drop it. §1.2 Deference again — a table that loads beats a table with
perfect per-cell colors that fails to save.

**Choropleth-specific advice:** for most SOC/ops dashboards with ≤ 15 countries, a
horizontal `splunk.bar` sorted by value is *better information design* than a world map.
A map is fuzzy (viewer must estimate color darkness → value); a bar chart is precise
(viewer reads the number). Recommend a map only when the geographic *distribution itself*
is the insight (e.g., "is this attack regional or global?") — not when the ranking is the
insight. Tufte §1.1 Clarity.

### 2.1 The banned aesthetic patterns

| Tell | Why it screams AI | What to do instead |
|---|---|---|
| Purple→cyan or purple→blue gradient panel backgrounds | Canonical v0/shadcn default | Solid dark (`#101014`) or solid light (`#F7F7F5`) — no gradient |
| Gradient text on big numbers | "CSS showcase" tell | Solid color, semantic (green/amber/red) or neutral white/black |
| Glassmorphism / frosted-glass cards | 2022 Apple Vision Pro cliché, now AI-default | Opaque cards (`#1A1A2E` dark / `#FFFFFF` light) with subtle 1px stroke or no stroke |
| Every corner rounded to 12+ px | "SaaS rounded" vibe | 4–6 px for functional UI; 0 px (square) for data-heavy/editorial feel |
| All 20 Splunk default colors on one chart | Accepting defaults = AI tell | Max 6 series colors, or 2–3 semantic + `seriesColorsByField` |
| Drop shadows on every panel | Material Design cargo-cult | No shadows on data panels. Shadows imply physicality; dashboards are not paper |
| Emoji or cutesy icons on serious dashboards | Enterprise LLM default | Use Splunk's icon set sparingly, monochrome, same-weight |
| Bouncy/elastic easing on chart loads | "Impressive animation" reflex | Splunk doesn't do this natively — don't add it via custom CSS either |
| Rainbow palette on ordered data | Categorical treatment of sequential data | Single-hue gradient (sequential) or diverging (two-hue) for ordered |
| 3D donut charts, gauges that look like car speedometers | "Executive dashboard" stock image | Flat `splunk.pie` (if ≤5 slices), `splunk.markergauge` (flat) |
| Titles like "Security Overview" / "Key Metrics" / "Important KPIs" | LLM boilerplate | Name the question the panel answers |
| Filler lorem / "Sample" data left in production | Obvious | Use real SPL or explicit `| makeresults | eval note="mock: pending data source"` |

### 2.2 The banned layout patterns

- **Nested cards within cards within cards.** One level of grouping (a `splunk.rectangle` behind a KPI row) is max. Two levels is a tell.
- **Identical card grids.** 3×3 of same-size same-color panels = AI default. Vary the hierarchy (see §1.3).
- **12 pie charts.** Pie charts are for ≤5 slices. If you need 12 pies, you need 1 `splunk.table` or a `splunk.bar`.
- **Gauges for everything.** Gauges are for thresholded measures (percentage of capacity, latency vs SLA). Not for counts.
- **Centered everything.** Centered text in every panel + centered KPIs + centered titles → reads as a landing page, not a tool.

### 2.3 The humanity tells — what makes a dashboard feel crafted

These are the opposite-of-AI signals. Add at least three to every serious dashboard:
- **Asymmetric hierarchy.** One panel is clearly bigger/louder than the rest. AI-generated layouts tend toward symmetric grids; crafted ones have a hero.
- **Restrained color.** 1 accent color + semantic trio + 4 neutrals. Nothing else. Ever.
- **Micro-copy that sounds like a colleague.** "Jumped 12 % vs last Tuesday" beats "Value increased by 12 %."
- **A visible opinion.** The designer made a choice. Example: "We don't show blocked traffic here because we don't care — investigate at the firewall dashboard." (Delivered as a `splunk.markdown` sidebar note on an investigative dashboard.)
- **Pixel-conscious alignment.** All KPI numbers align to the same baseline. All panel tops align to the same y. All gutters are identical.
- **Editorial whitespace.** More empty space than feels comfortable on the first pass. Confident designs breathe.

---

## 3. The four Couture archetypes (expanded from ds-design-principles)

The companion `ds-design-principles` skill defines four canonical archetypes (Executive Summary,
Operational Monitoring, Analytical Deep-Dive, SOC Overview). This skill adds a **fifth**, extends
each with persona-specific taste notes, and provides Couture-level detail on hierarchy, color,
and whitespace.

For each archetype below: *audience → key question → hero pattern → layout → palette → typography
notes → antipatterns → personality*.

### 3.1 Executive / Board Briefing — The Apple Keynote aesthetic

**Audience:** CEO, CFO, CISO, board — non-operational, high-stakes, rarely looked at.
**Key question:** "Can I trust that things are running?"
**Hero pattern:** ONE giant headline number at top center, flanked by 2 supporting KPIs. Single trend chart below. Nothing else.
**Layout (absolute, 1440 × 960):**
```
y=0    [20 px margin]
y=20   [time range picker, 300 px, left] [last-updated timestamp, right, small secondary]
y=80   [big hero card: 1400 × 240 — 1 number, 72–96 px, with one-line context]
y=340  [3 supporting KPIs: 440 × 140 each, 20 px gutters]
y=500  [primary trend chart: 1400 × 360, minimal axis labels, no legend if 1 series]
y=880  [footer: small grey text with owner + last-reviewed date]
```
**Palette:** Light theme. Off-white background (`#FAFAF7`), charcoal text (`#1A1A1F`), ONE accent color drawn from the company brand. Muted everywhere else. No red unless something is actually wrong.
**Typography:** Generous. Hero number in the biggest size Splunk allows (`customFontSize: "96px"` via `splunk.singlevalue`). Panel titles in sentence case, not title case — feels less corporate.
**Antipatterns:** Multiple tabs, dropdown filters, anything requiring interaction. Executives don't click. If they need to click, email them a PDF.
**Personality:** Generous whitespace. Serif accent on the hero label for editorial gravitas — in Dashboard Studio's dropdown, this means **Times New Roman** on a single `splunk.markdown` hero caption (never body copy). See §5.2.1.

### 3.2 SOC Overview — The Bloomberg Terminal aesthetic

**Audience:** SOC analysts, 24/7 wall display + analyst workstation.
**Key question:** "Where should I look right now?"
**Hero pattern:** Threat counter strip across the top; attack geo map as anchor; severity breakdown and recent incidents flanking it.
**Layout (absolute, 1920 × 1080 for wall, 1440 × 960 for workstation):**
```
y=0   [input bar: time (auto-refresh 30s), severity, source]
y=60  [KPI strip: 5 numbers — total events, critical, high, unresolved SLA breach, top attacker]
y=220 [left 65% — attack map (choropleth or bubble)] [right 35% — severity pie, ≤5 slices]
y=620 [recent alerts table, full width, 360 px tall, row-colored by severity]
```
**Palette:** Dark theme, high-contrast. Canvas `#0A0A0E` (deeper than the ds-design-principles default — analysts stare at this for hours). Semantic colors tuned for a dark surround: critical `#FF4757`, high `#FF7A45`, medium `#FFC542`, ok `#26D07C`, info `#3B9FFF`. Neutral text `#E3E3EC` (not pure white — pure white vibrates on OLED walls).
**Typography:** Monospaced rendering for numeric density. `splunk.singlevalue` major values cannot have their font overridden from the visual editor — mitigate by keeping KPIs big (so minor misalignment is invisible) and by putting the event table below with **Font = Monospace** so columns align. Use **Splunk Data Sans** on KPI label markdowns and **Splunk Platform Mono** on markdown rows showing raw counts, IDs, or timestamps. All numbers right-aligned in tables. No ornamentation. (See §5.2.2.)
**Antipatterns:** Dark mode with red backgrounds (causes eye strain after 20 minutes). Blinking animations (analyst fatigue). More than 2 pie charts (pies don't scale in count comparison).
**Personality:** Density is the point. A Bloomberg Terminal is dense because density = authority. Don't apologize for it with whitespace. Compensate with tight, consistent grid alignment and monospaced numbers so the density reads as *precision*, not *clutter*.

### 3.3 NOC / Operational — The airport-departure-board aesthetic

**Audience:** On-call engineers, NOC staff, real-time monitoring.
**Key question:** "What is burning right now?"
**Hero pattern:** Status tiles with large readable text, one-glance green/amber/red. Secondary time-series below.
**Layout:** Grid layout works here — consistency of tile size is the virtue. 4 columns × 2 rows of service tiles, followed by a full-width incident timeline.
**Palette:** Dark theme. Green/amber/red palette at a saturation high enough to see from 6 meters away. `#00E676` (go), `#FFB300` (caution), `#F44336` (stop). Background `#0C0C10`. No info-blue here — distracts from state.
**Typography:** Big. Status labels in 24–32 px. Tile numbers in 40–56 px. Use **Splunk Platform Sans** as the default — it's the theme default and has the best x-height at large sizes. Set label sizes via `customFontSize` on the markdown panel. Do not switch to Arial "because it's bolder" — the default is strictly better.
**Antipatterns:** Small fonts (unreadable at distance). Fancy charts (engineers glance, then respond). Multi-series stacked bars (cognitive load during incident).
**Personality:** Functional, almost brutalist. Rounded corners belong here — soft 4 px corners make prolonged viewing less harsh. But no shadows, no gradients, no decoration. "Departure board" is the mental model: instantly legible, never pretty for pretty's sake.

### 3.4 Analyst / Investigation — The editorial long-read aesthetic

**Audience:** Threat hunters, SIEM analysts, fraud investigators. Use session: 15–90 minutes.
**Key question:** "What is the story this data tells?"
**Hero pattern:** Rich filter bar at top, multi-series time-series as the anchor, detail table at the bottom, distribution charts in the middle.
**Layout:** Use tabs (`input.link` with token-switched visualizations) to segment: Overview · Drilldown · Entities · Raw. Each tab follows its own internal hierarchy.
**Palette:** Dark theme preferred (long sessions), but use a *lower-contrast* variant than SOC: `#14141C` canvas, `#D5D5DE` primary text. Saturated colors only on data (series palette is deliberately muted — see §4.3 "Investigative palette").
**Typography:** Denser information, so smaller type is fine: 12–14 px body, 13 px in tables with 1.4 line height. Tabular figures mandatory. Column headers in SMALL CAPS (via markdown `## HEADER` and a uniform sans-serif) for scannability.
**Antipatterns:** Flashy KPIs at the top that steal attention from the investigation. Modal dialogs. Autoplay animations.
**Personality:** Dense but organized. Reads like a Financial Times article — lots of information, but structured so the eye knows where to go. Zero decoration. The data IS the personality.

### 3.5 Business / Sales / Marketing — The magazine cover aesthetic *(Couture-only archetype)*

**Audience:** Revenue leader, marketing ops, customer success. Usually shared in Slack or exported to slide decks.
**Key question:** "Is the business healthy and what is the narrative this quarter?"
**Hero pattern:** Single narrative panel at top (either a hero number or a hero trend), then supporting segmentation.
**Layout (absolute, 1440 × 960):**
```
y=0   [20 px margin]
y=20  [time range picker + "vs previous period" toggle]
y=80  [hero panel: 1400 × 300 — either 1 hero number with MoM/YoY deltas, or 1 full-width trend with annotated events]
y=400 [3 segment tiles — by channel, by region, by product — 440 × 180 each]
y=600 [conversion funnel OR cohort table — 1400 × 300]
y=920 [footer]
```
**Palette:** Light theme, warm. Canvas `#FAFAF7` (warm ivory, not cold `#FFFFFF`). Accent single: a confident non-neutral hue (e.g., `#0066CC`, `#E63946`, `#38A3A5` — one, not three). Semantic for deltas: `#2A9D5F` for positive, `#D62828` for negative (avoid forest-green / fire-engine-red — use slightly desaturated versions so the page feels edited, not alarming).
**Typography:** Personality allowed — but the visual editor only gives you Times New Roman as a serif option. For a marketing-facing dashboard, set **Times New Roman** on ONE `splunk.markdown` hero caption for a magazine-feel, and keep body copy in **Splunk Platform Sans**. Tables stay Proportional here; see §5.3 for the compensating disciplines when you can't afford Monospace.
**Antipatterns:** Too much motion, too many colors, treating a business dashboard like a SOC dashboard. No red flashing.
**Personality:** Confident, edited, narrative. Feels like a page from The Economist charts, not a Grafana default. Annotations (`annotationX`, `annotationLabel` on line charts) turning data points into story moments.

---

## 4. The color system — Couture palettes

The biggest single lever for anti-AI design is **color restraint**. Below are four complete,
accessibility-checked palettes. Pick ONE per dashboard. Never mix.

### 4.0 How to construct a palette (if you must build a custom one)

Splunk Dashboard Studio accepts hex colors only — there is no OKLCH in `seriesColors`,
`fillColor`, or `majorColor`. The palettes in §4.1–§4.4 are delivered as hex *outputs*, but if
you need to construct a custom palette (e.g., to graft a corporate brand hue into a Couture
system), use these perceptual rules adapted from impeccable's color principles and convert the
final values to hex before pasting into JSON.

**Principle 1 — Think in OKLCH, publish in hex.** Tools like [oklch.com](https://oklch.com) and
Culori let you design in OKLCH (perceptually uniform — equal lightness steps *look* equal) then
export hex. This produces palettes where "500" and "600" are actually one step apart visually,
unlike naive HSL scales where mid-tones collapse.

**Principle 2 — Reduce chroma at the extremes.** As a color approaches white or black, lower its
chroma. A bold blue at 55 % lightness might use chroma 0.15; the same hue as a hover-card tint at
90 % lightness wants chroma ~0.08. High chroma at high lightness looks radioactive, not refined.

**Principle 3 — Tint neutrals toward your brand hue.** This is the single most effective
anti-default trick. A "gray" UI surface that carries a chroma of 0.005–0.010 toward the brand hue
creates subconscious cohesion between brand accent and chrome. Pure neutrals (`#1A1A1F` with
zero chroma) feel generic. The Couture palettes below already apply this — note that Obsidian's
neutrals lean very slightly blue-cool (`#15151C`, `#26262F`), while Warm Editorial's neutrals
lean warm-tobacco (`#F7F5F0`, `#6F6B65`). This is deliberate.

**Principle 4 — The 60-30-10 rule is about visual weight, not pixel count.** 60 % neutral /
surface, 30 % secondary text and borders, 10 % accent and data. Accents work BECAUSE they are
rare. If every panel has an accent stripe and every number is colored, the accent is gone and
everything is noise. Count your accents and kill half of them.

**Principle 5 — Dark backgrounds want lighter text weight compensation.** Light text on dark
backgrounds reads as lighter than dark text on light backgrounds at the same weight. Add
approximately 0.05–0.1 to your line-height on dark themes, and consider bumping weight by one
step (400 → 500) for body text on dark — it reads more confidently without shouting.

**Principle 6 — Graft, don't replace.** If the company's brand red is `#D62828` and your target
palette is Obsidian, do NOT rebuild Obsidian around `#D62828`. Instead, remap Obsidian's
semantic-critical value from `#FF4757` to `#D62828` (keep everything else). The palette stays
coherent; the brand lives inside it.



### 4.1 Palette: "Obsidian" — dark, operational (SOC / NOC default)

```
Canvas background       #0A0A0E
Panel card fill         #15151C
Card stroke (if used)   #26262F    (1 px max, often omitted)
Primary text            #E3E3EC    (NOT pure white)
Secondary text          #8A8A98
Tertiary / disabled     #55555E

Semantic — critical     #FF4757
Semantic — high         #FF7A45
Semantic — warning      #FFC542
Semantic — ok           #26D07C
Semantic — info         #3B9FFF
Semantic — unknown      #8A8A98

Series palette (6, in order):
  1  #3B9FFF   blue
  2  #FFC542   amber
  3  #26D07C   green
  4  #B084FF   purple
  5  #26E0C8   teal
  6  #FF7A45   orange

Accent (pick ONE for emphasis):
  Cyber cyan             #00D4E1
  Royal violet           #7C4DFF
  Sunset                 #FF6B35
```
All combinations pass WCAG AA (4.5:1) against the canvas.

### 4.2 Palette: "Porcelain" — light, editorial (Executive / Business default)

```
Canvas background       #FAFAF7    (warm ivory, not cold white)
Panel card fill         #FFFFFF
Card stroke (if used)   #E6E4DF
Primary text            #1A1A1F
Secondary text          #6B6B70
Tertiary                #A5A5AA

Semantic — critical     #C0392B
Semantic — high         #D97706
Semantic — warning      #B08600
Semantic — ok           #2A9D5F
Semantic — info         #1E6FBD
Semantic — unknown      #9B9BA0

Series palette (6):
  1  #1E6FBD   steel blue
  2  #D97706   amber
  3  #2A9D5F   forest green
  4  #7C3AED   plum
  5  #0891A5   teal
  6  #B93660   magenta

Accent (ONE):
  Cardinal               #C0392B
  Oxford blue            #0B3D91
  Forest                 #1B5E20
```

### 4.3 Palette: "Smoke" — dark, investigative (Analyst default, muted)

Deliberately desaturated so data series never compete with UI chrome.

```
Canvas background       #14141C
Panel card fill         #1C1C26
Card stroke             #2A2A36
Primary text            #D5D5DE
Secondary text          #888894

Series palette (8, all desaturated):
  1  #7AA2CC   muted blue
  2  #D4A574   muted amber
  3  #7ABFA0   muted green
  4  #B29ED4   muted lavender
  5  #8FCAC4   muted teal
  6  #D4968F   muted coral
  7  #A3A890   muted olive
  8  #BBA6C4   muted plum

Semantic (still saturated for status, unlike the series):
  Critical               #E74C3C
  Warning                #F39C12
  OK                     #27AE60
```
The whole point of Smoke: the status colors pop against muted data, so the eye goes to severity first.

### 4.4 Palette: "Warm Editorial" — light, magazine (Business / Marketing)

```
Canvas background       #F7F5F0    (warm paper)
Panel card fill         #FFFFFF
Card stroke             none (use 24+ px gutters for separation instead)
Primary text            #1A1A17    (warm near-black, not #000)
Secondary text          #6F6B65
Accent label            #9C6B2F    (tobacco — for "live" indicators, sparingly)

Semantic (muted for editorial feel):
  Positive               #2F7A52
  Negative               #B84A3E
  Neutral/reference      #7A7570

Series palette (6):
  1  #264653   deep teal
  2  #E9C46A   mustard
  3  #E76F51   terracotta
  4  #2A9D8F   sea green
  5  #8E6C88   dusty plum
  6  #F4A261   amber
```

### 4.5 Palette discipline rules (never violate)

1. **Pick one palette. Do not mix palettes.** If the user has an existing brand palette, extract 1 accent color from it and graft it into the closest Couture palette — never replace the whole system.
2. **Semantic colors are untouchable.** Never use red for a non-critical data series, never use green for a non-OK state. Your SOC analyst will associate the color with meaning within 5 minutes and you will mislead them forever.
3. **Max 6 data series per chart.** Beyond 6, use "Top 5 + Other" or split into multiple charts.
4. **Use `seriesColorsByField`, not `seriesColors`.** The latter is positional and breaks when SPL returns series in different order; the former locks a color to a specific value. Example:
   ```json
   "seriesColorsByField": {
     "allowed": "#26D07C",
     "blocked": "#FF4757",
     "monitored": "#FFC542"
   }
   ```
5. **Accent color is used at most twice per dashboard.** Accent is for the one or two things the eye MUST land on. If everything is accented, nothing is.
6. **Verify contrast.** Minimum 4.5:1 for normal text against its background, 3:1 for large (≥18pt regular or 14pt bold) text and for essential graphical elements. Test every custom color.
7. **Never red/green alone to encode state.** Always pair with icon (`splunk.singlevalueicon`), shape, or text label. 8 % of men have red-green CVD.

---

## 5. Typography — the Couture type system

Splunk Dashboard Studio gives you narrower typography levers than a blank web canvas: a Font
family dropdown (7 options) on `splunk.markdown`, a Font dropdown (2 options: Proportional /
Monospace) on `splunk.table`, and `fontSize` / `customFontSize` / `fontColor` on markdown and
single-values. You cannot type custom `fontFamily` strings from the visual editor. Use what you
have deliberately — the constraint is clarifying, not limiting. (See §5.2 for the full option
menu and §5.2b for the selection procedure.)

### 5.1 The type scale (pick from these, do not introduce rogue sizes)

```
Display (hero KPI)      72  px   /  80 line-height   /  weight 600  /  tracking -1.5 %
Display S (hero alt)    56  px   /  64               /  600          /  -1.0 %
Title L (section)       28  px   /  36               /  600          /   0
Title (panel)           18  px   /  24               /  600          /   0
Title S (subtitle)      14  px   /  20               /  600          /   0
Body L                  15  px   /  24               /  400          /   0
Body                    13  px   /  20               /  400          /   0
Caption                 12  px   /  18               /  400          /   0
Label (small caps)      11  px   /  16               /  600          /  +8 %  TEXT-TRANSFORM: uppercase
```
Ratio across scale is roughly 1.25 (minor third) — crisp but not aggressive.

### 5.2 Font-family recipes — the Splunk reality

**Splunk Dashboard Studio is a font-constrained environment.** You cannot type arbitrary
`fontFamily` strings into the visual editor. The UI only exposes dropdowns, and the dropdowns are
surprisingly short. Design within the constraint — do not fight it.

#### 5.2.1 What you can actually choose from

**For `splunk.markdown` panels (the visual editor's "Font family" dropdown):**

> **Schema-locked list — these 7 strings are the ONLY legal values for `fontFamily`.** Splunk's JSON schema rejects anything else at save. There is no `"Splunk Data Serif"`, no `"Inter"`, no `"system-ui"`, no `"Menlo"`, no custom fonts. If you want a serif, you use Times New Roman. If the brand *requires* a specific custom font, that's an app-level CSS override — out of scope for dashboard JSON.

| Option *(exact string required)* | Category | Couture verdict |
|---|---|---|
| `Splunk Platform Sans` *(default)* | Sans-serif, UI-chrome | Safe default. Neutral. Don't fight it for most panels. |
| `Splunk Data Sans` | Sans-serif, optimized for numbers | **Preferred for data-heavy markdown** — designed for tabular readability. |
| `Splunk Platform Mono` | Monospace | Use for code, IDs, hashes, timestamps in markdown. |
| `Arial` | Sans-serif | Never. Generic lazy default. Splunk Platform Sans is strictly better. |
| `Helvetica` | Sans-serif | Acceptable but not different enough from Splunk Platform Sans to be worth the switch. |
| `Times New Roman` | Serif | **The only editorial/serif option available.** Use it deliberately for hero captions on executive or business dashboards. |
| `Comic Sans MS` | Novelty | Never. Under any circumstances. Including ironic. |

**For `splunk.table` (the "Font" dropdown):**

| Option | Couture verdict |
|---|---|
| Proportional *(default)* | Use for text-dominant tables (names, descriptions, labels). |
| Monospace | **Use for any table with numeric columns.** Delivers tabular alignment without relying on `font-feature-settings`. Non-negotiable for KPI-heavy tables. |

**For single-value components and charts:** font family is inherited from the dashboard theme and
the `splunk.singlevalue` component doesn't expose a font dropdown. You can only indirectly
influence it via custom app-level CSS (Splunk Enterprise) or the theme editor — treat this as
*not controllable from the visual editor* and plan accordingly. If you need monospaced KPI
numbers for alignment, use a `splunk.markdown` header with "Splunk Platform Mono" above a row of
single-values, and accept that the major values themselves will render in the theme's default.

#### 5.2.2 Couture recipes — built from the available options only

| Context | Markdown font | Table font | Why |
|---|---|---|---|
| Default / operational | Splunk Platform Sans | Monospace *if numeric, else Proportional* | Clean, neutral, doesn't fight the data. |
| SOC / engineering density | Splunk Data Sans *for all panels*, Splunk Platform Mono *for KPI-context headers* | Monospace *(always)* | Data Sans is tuned for scanning numbers. Mono headers reinforce the "terminal" feel. |
| Executive / board hero | Times New Roman *for the hero caption or section header*; Splunk Platform Sans *for everything else* | Proportional | Serif hero label adds editorial gravitas. Do NOT set Times New Roman on body copy — it reads as 1998 corporate memo. Hero only. |
| Analyst / investigation | Splunk Data Sans *for panel titles and markdown notes*; Splunk Platform Mono *for `_raw` columns and ID fields* | Monospace | Data Sans for scan, Mono for raw. Everything is about reading speed. |
| Business / magazine | Times New Roman *for the top narrative markdown only*; Splunk Platform Sans *for tile labels and body* | Proportional | A single serif gesture at the top reads as "edited", not "corporate". Keep everything else neutral. |

#### 5.2.3 The three hard rules

1. **Splunk Data Sans is the most under-used option.** If your dashboard is data-heavy, switch
   markdown panels containing numbers or data labels from the default (Splunk Platform Sans) to
   Splunk Data Sans. It's a free readability win and an anti-default-reflex win simultaneously.
2. **Times New Roman is your *only* serif lever.** Use it sparingly and deliberately. One markdown
   panel per dashboard, usually a hero caption or a section header. Never for body copy.
3. **Comic Sans MS and Arial are non-starters.** Comic Sans is obvious. Arial is just the lazy
   default you fell back to when nothing else was available. Since we do have other options, there
   is no excuse.

### 5.2b The font-selection procedure (Splunk-constrained)

**Context reality check.** The `impeccable` design skill tells you to browse Pangram Pangram,
Klim, and Velvetyne to escape training-data default fonts. That advice is correct for web design
and useless for Splunk Dashboard Studio. In Dashboard Studio's visual editor, your font-family
choice is a **dropdown with 7 options for markdown panels and 2 options for tables** (§5.2.1).
You cannot add fonts. You cannot type a custom string. The impeccable spirit still applies —
"do not pick the default out of reflex" — but the *mechanics* are entirely different.

**This is your full procedure. It has 3 steps, not 6.**

#### Step 1 — Write down the 3 concrete tone words (from §0.5.4)

Same step impeccable demands, still the single biggest defense against reflex choice. Before
opening the font dropdown, write down three concrete words describing how this dashboard should
feel. NOT "modern" or "clean" — use specifics:

- "calm and clinical and careful" → Splunk Platform Sans body, Times New Roman section headers, Proportional tables
- "fast and dense and unimpressed" → Splunk Data Sans everywhere, Monospace tables, no serif anywhere
- "warm and editorial and confident" → Splunk Platform Sans body, Times New Roman hero caption, Proportional tables
- "brutalist and terminal and precise" → Splunk Platform Mono for headers, Splunk Data Sans for body, Monospace tables

The three words constrain the dropdown choice. Don't open the dropdown until the words are written.

#### Step 2 — Reject the default out of reflex

The visual editor pre-selects **Splunk Platform Sans** for markdown and **Proportional** for
tables. These are safe and neutral. They are also what every untouched dashboard uses. If you
leave them selected without thinking, you're accepting the template.

**Rules for switching away from defaults:**

- **For any markdown panel containing numbers or data labels:** switch to Splunk Data Sans. It's
  the whole reason Splunk ships two sans fonts. Use it.
- **For any hero caption, section header, or editorial flourish on light-theme dashboards:**
  consider Times New Roman. Exactly once per dashboard, at the top or as a section marker.
- **For any table with a numeric column:** switch to Monospace. No exceptions. If you've ever
  tried to scan a column of currency values in a proportional font, you know why.
- **For any panel containing code, hashes, IDs, or fixed-width content:** switch to Splunk
  Platform Mono in markdown; Monospace in tables.

**Rules for NOT switching:**

- Don't switch to Arial. It's a worse Splunk Platform Sans.
- Don't switch to Helvetica. It's an alias of Arial on most systems and doesn't meaningfully
  differ from Splunk Platform Sans to the eye.
- Don't switch to Comic Sans MS. Ever. Not ironically. Not for a "fun" dashboard. Not at all.

#### Step 3 — Document the choice in the handoff brief

When handing off to `splunk-dashboard-studio`, be explicit about every font-family assignment:

```
FONT ASSIGNMENTS
  Hero markdown caption      : Times New Roman
  Section header markdowns   : Splunk Data Sans
  KPI label markdowns        : Splunk Data Sans
  Body-text markdowns        : Splunk Platform Sans
  Code / ID markdowns        : Splunk Platform Mono
  All tables                 : Monospace (KPI-heavy) or Proportional (text-heavy)
```

Five lines. Done. No Inter, no JetBrains Mono, no Georgia, no fallback chains — those are
web-design artifacts that don't apply here. If you write a handoff that says "fontFamily: 'Inter',
system-ui, ..." the syntax skill will try to set that on a component that doesn't accept custom
strings, and it will silently fall back to the theme default. Stay inside the dropdown.

#### 5.2c What about custom fonts?

**Splunk Enterprise with custom app-level CSS**, and in some Splunk Cloud setups, allow you to
inject CSS that overrides component fonts with web-hosted alternatives. If you have this level of
control and a branded need (executive dashboard rendered to PDF for a board meeting, marketing
dashboard embedded in a customer portal), you can load a custom font via CSS and override the
theme.

**But — unless you have a concrete branded reason**, don't. The reasons:

1. The rendered font must be installed on the viewer's browser or web-hosted reliably. A broken
   fallback looks worse than Splunk Platform Sans.
2. It doesn't apply inside the visual editor — you still see the default in edit mode and only
   the custom font in view mode. This surprises non-authors who edit the dashboard later.
3. Splunk Cloud has progressively restricted custom CSS. Something that works today may not work
   after a cloud upgrade.

If you do go custom, apply the impeccable font-selection procedure: 3 tone words, reject the
reflex list (Inter, IBM Plex, DM Sans, Fraunces, etc.), shop at Google Fonts / Pangram Pangram /
your brand CDN. But 95 % of Splunk dashboards should stay inside the 7 + 2 default options.
Constraints are good. They eliminate the font-picking rabbit hole and let you focus on hierarchy,
color, and layout — which are where dashboards actually win or lose.

---

### 5.3 Tabular figures — MANDATORY for numbers

Every number that appears next to another number (column total vs row total, KPI row, table) must
be tabular — meaning each digit occupies the same horizontal space so columns align. Misaligned
numbers read as amateur. Aligned numbers read as precise.

**The Splunk Dashboard Studio solution is simpler than the impeccable / web solution.** You do
not need `font-feature-settings: 'tnum'`. You do not need to hunt for fonts that ship tabular
figures by default. The platform gives you direct monospace options:

| Component | How to force tabular alignment |
|---|---|
| `splunk.table` with numeric columns | Set the **Font** dropdown to **Monospace**. Done. Every digit aligns because every glyph is fixed-width. |
| `splunk.markdown` panels displaying a number | Set the **Font family** dropdown to **Splunk Platform Mono**. Every digit aligns. |
| `splunk.markdown` displaying labels next to data | **Splunk Data Sans** — designed by Splunk for tabular number rendering inside a proportional sans. Second-best option if Mono feels too technical. |
| `splunk.singlevalue` KPI major values | Font is inherited from the theme and cannot be changed from the visual editor. You cannot force tabular. Mitigate by: (a) grouping KPIs so each gets its own column (numbers don't need to align across KPIs if there's visible space between them), (b) showing large single numbers (tabular matters less at 72 px than at 14 px), (c) using a `splunk.table` instead of a KPI row when horizontal alignment is critical. |

**When table Monospace is too aggressive.** Monospace tables look "coder-y" and can clash with
an executive or marketing palette. For those contexts, leave the Font at Proportional and
compensate by: (a) right-aligning numeric columns (so at least the ones digits line up), (b)
formatting numbers with consistent precision (always 2 decimals on currency, always 0 on counts),
(c) using the thousands separator. Three disciplines together get you 80 % of the Monospace
benefit without the aesthetic cost.

**Deep customization path (rarely worth it).** If you ship a custom Splunk app with app-level
CSS, you *can* inject `font-variant-numeric: tabular-nums` to force Splunk Platform Sans to
render tabular digits (it supports the `tnum` OpenType feature). The CSS pattern is:

```css
.dashboard-panel .splunk-number,
.single-value-panel .major-value,
.data-table td.numeric {
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'tnum' 1;
}
```

But unless you have a specific need that the Monospace / Splunk Platform Mono / Splunk Data Sans
options cannot solve, don't reach for custom CSS. The built-in options cover the 95 % case. The
last 5 % — KPI major values — is a platform limitation, not a design failure.

### 5.4 Title discipline (repeat until internalized)

- 3–5 words maximum.
- Title Case for operational / SOC / NOC dashboards (feels authoritative).
- Sentence case for executive / business dashboards (feels edited).
- No subtitles unless the metric is genuinely ambiguous.
- No emojis. Ever. (Unless the brand explicitly requires one — then ONE, consistent, on the header only.)
- Answer a question: "Failed Logins — Last Hour", not "Login Chart".
- No "Dashboard" in titles. We know it's a dashboard.

### 5.5 Number formatting rules

- Always show the unit (`%`, `ms`, `GB`, `requests/s`). Never make the viewer guess.
- Thousands separator for values > 999. Set `"thousandSeparated": true` in `columnFormat`.
- Precision: exactly as much as matters. Currency: 2 decimals. Percentage: 0–1 decimal. Counts: 0.
  Latency: 0 decimals if ms < 10000, else convert to seconds with 1 decimal. Never show `$3,848,305.93` on a dashboard.
- Big numbers: abbreviate above 10,000 with 1 decimal (`12.4K`, `3.2M`, `1.8B`). Use `"yAxisAbbreviation": "auto"` on axes.
- Deltas / trends: always include sign and unit. `+12.4 %`, not `12.4`.
- Timestamps in tables: convert from epoch to `"%b %d, %H:%M"` via `| eval _time=strftime(_time,"%b %d, %H:%M")`. Drop the year unless the time range spans it.

---

## 6. Layout & spacing — the 8-point Couture grid

### 6.0 Absolute layout is the Couture default — this is non-negotiable

**Always use `"type": "absolute"` for dashboards that claim design intent.** `"type": "grid"` is a convenience layout — it auto-stacks panels in a responsive 12-column flow. It is the *default* that the visual editor drops you into, and it is the single biggest reason Splunk dashboards look AI-generated: every panel is the same width, every row is the same height, hierarchy collapses into a uniform tile-field.

Couture dashboards live in absolute layout because:

1. **Pixel-exact hierarchy.** You cannot build an F-pattern, a hero card, an editorial asymmetric composition, or a two-column narrative in grid. You get equal-width cells and equal-height rows. Grid is designed for people who don't want to design.
2. **Deliberate whitespace.** §6.5's 24 px / 32 px / 80 px rules only hold when you place panels explicitly. Grid gives you 8 px gutters and never more.
3. **One big panel next to three small ones.** The single most effective layout gesture in dashboards — hero + supporting trio, or wide map + narrow KPI stack — is impossible in grid without hacking cell spans.
4. **Alignment across panels of different types.** Grid aligns boxes. Absolute lets you align the *value inside the box* to a neighbouring value inside a different type of box. This is where a dashboard goes from "arranged" to "composed".
5. **Reproducibility across viewers.** Absolute with `display: "auto-scale"` scales cleanly down from 4K to laptop. Grid reflows, which destroys the composition you worked on.

When grid is acceptable — the narrow exception list:

- **Pure "table of charts" utility pages** — e.g., a per-service error-rate wall where all 24 services must be shown as identical small multiples and the point is uniformity, not hierarchy. This is the only case.
- **Internal admin pages and dev tooling** where nobody claims design intent.
- **The non-hero tabs of a tabbed dashboard** if they are purely reference lookups. (The hero tab must still be absolute.)

When asked to design, always specify absolute in the brief. When reviewing an existing dashboard, the first question is *"is this grid or absolute?"* — if grid, the design work hasn't started yet. The JSON shape lives in `splunk-dashboard-viz` §18; Couture's only position is: **pick absolute**.

The one-line Couture doctrine: *grid is for prototypes, absolute is for shipping.*

### 6.1 The grid (the 8-point measurement system, not the layout type)

Every dimension is a multiple of **8 px**. Gutters, margins, panel sizes, paddings — all multiples of 8.
This is the *measurement grid* — independent of and complementary to choosing `"type": "absolute"` in the JSON. The 8-point discipline is what makes absolute layouts look intentional rather than sloppy.

Common canvas sizes that work with the grid:
- `1440 × 960` (workstation)
- `1920 × 1080` (NOC wall)
- `2560 × 1440` (4K wall)

### 6.2 Spacing system (use these values, no others)

```
2 px     hairline    (internal padding on chart borders only)
8 px     xs          (icon-to-text, label-to-value)
16 px    s           (internal panel padding, small gutters)
24 px    m           (default gutter between panels)
32 px    l           (section-to-section)
48 px    xl          (hero padding — above a hero KPI card)
80 px    xxl         (canvas margin on wall displays)
```

### 6.3 Panel minimums (smaller = unreadable)

| Panel type | Min width × height | Comment |
|---|---|---|
| Single value | 240 × 120 | Below this, major value shrinks to unreadable |
| Single value hero | 440 × 200 | For executive dashboards |
| Line / area / column | 400 × 240 | Below 240 height, axis labels crush |
| Bar (horizontal) | 400 × 200 + 24 px per bar | Height scales with count |
| Pie | 240 × 240 | Square minimum |
| Table | 480 × 200 | Below this, columns truncate |
| Map | 600 × 400 | Smaller loses detail |
| Timeline / Sankey / linkgraph | 640 × 360 | Anything less is illegible |
| Markdown header | full width × 48 | Section markers |

### 6.4 F-pattern reading order

Users scan top-left first, then drift right, then drop to next row, then right again, in an "F" shape.
Place importance accordingly:
- **Top-left:** time-range picker + the single most important KPI.
- **Top-right:** the secondary KPIs, last-updated timestamp.
- **Middle-left:** the primary chart that supports the top-left KPI.
- **Middle-right:** the secondary chart or distribution.
- **Bottom:** detail tables, event streams, logs.

### 6.5 Whitespace rules

- **Every panel edge:** 24 px minimum to any neighbor.
- **Every canvas edge:** 32 px minimum (80 px on wall displays).
- **Inside a KPI grouping card (`splunk.rectangle` background):** 16 px between the card edge and the first/last KPI edge.
- **Above section headers (markdown):** 32 px.
- **Below section headers:** 16 px.

If two panels are closer than 16 px, they read as one panel. This is sometimes desired (grouping),
but make the choice deliberate.

### 6.6 The editorial whitespace trick

Confident designs leave more empty space than feels comfortable. Specifically: on executive / business
dashboards, leave **one grid cell empty somewhere visible**. Not every inch has to be filled. Negative
space is expensive — using it signals that you had the confidence not to fill it with garbage.

---

## 7. Dashboard Studio-specific Couture tricks

These are things you can only do if you know the Splunk Dashboard Studio JSON well. They separate
pro work from default-accepted work.

### 7.1 The "hero number with context" pattern

Not just a number — a number with *comparison*, *trend*, and *qualitative color*.
```json
"viz_hero": {
  "type": "splunk.singlevalue",
  "title": "Critical Alerts",
  "dataSources": { "primary": "ds_critical_count" },
  "options": {
    "majorValue": "> primary | seriesByName('count') | lastPoint()",
    "trendValue": "> primary | seriesByName('count') | delta(-2)",
    "trendDisplay": "percent",
    "sparklineValues": "> primary | seriesByName('count')",
    "sparklineDisplay": "below",
    "unit": "",
    "majorColor": "> majorValue | rangeValue(statusColors)",
    "backgroundColor": "transparent",
    "customFontSize": "72px"
  },
  "context": {
    "statusColors": [
      {"value": "#26D07C", "to": 1},
      {"value": "#FFC542", "from": 1, "to": 10},
      {"value": "#FF4757", "from": 10}
    ]
  }
}
```
Notes: `backgroundColor: "transparent"` drops the default Splunk card chrome so the number sits on
the dashboard canvas. Combine with a `splunk.rectangle` BEHIND the value for a deliberate card, or
leave transparent for the minimalist "number on canvas" look.

### 7.2 The "card-as-rectangle" trick for grouping without chrome

Instead of letting each panel draw its own default card, disable each panel's chrome and put a
`splunk.rectangle` behind a group. This gives you one clean background for a group of related KPIs:
```json
"viz_kpi_group_bg": {
  "type": "splunk.rectangle",
  "options": {
    "fillColor": "#15151C",
    "fillOpacity": 1,
    "strokeWidth": 0,
    "cornerRadius": 6
  }
},
"layout": {
  "structure": [
    {"item": "viz_kpi_group_bg", "position": {"x":40,"y":80,"w":1360,"h":160}},
    {"item": "viz_kpi_1",       "position": {"x":64,"y":96,"w":320,"h":128}},
    {"item": "viz_kpi_2",       "position": {"x":416,"y":96,"w":320,"h":128}},
    {"item": "viz_kpi_3",       "position": {"x":768,"y":96,"w":320,"h":128}},
    {"item": "viz_kpi_4",       "position": {"x":1120,"y":96,"w":280,"h":128}}
  ]
}
```
The rectangle goes FIRST in `structure` (rendered behind). Each KPI has `backgroundColor: "transparent"`
so only the rectangle shows through.

### 7.3 Annotations — turn a chart into a story

Line / column charts support annotations. Use them to mark outages, deploys, policy changes. Feels
human, not auto-generated:
```json
"options": {
  "annotationX": "> annotations | seriesByName('time')",
  "annotationLabel": "> annotations | seriesByName('event')",
  "annotationColor": "> annotations | seriesByName('color')"
}
```
Pair with a small ds.search that returns event timestamps + label + color from a lookup.

### 7.4 Tabs — the ONE correct way to split views

> Correction: earlier drafts of this skill showed an `input.link` pattern for tabs.
> **`input.link` does not exist in Dashboard Studio.** Tabs are a first-class layout
> feature: `layout.tabs.items[]` + one `layoutDefinitions.<id>` per tab. See §7A.5.

One tall scrolling dashboard is bad. Two or three tabs sharing the same global time
picker is good. Each tab gets its own `layoutDefinitions` entry. **Per BAN 11 and §6.0,
every tab's `type` is `"absolute"`** — tabs are not an escape hatch from the grid ban.

```json
"layout": {
  "globalInputs": ["input_global_trp"],
  "tabs": {
    "items": [
      {"layoutId": "layout_overview",    "label": "Overview"},
      {"layoutId": "layout_drilldown",   "label": "Drilldown"},
      {"layoutId": "layout_entities",    "label": "Entities"}
    ]
  },
  "layoutDefinitions": {
    "layout_overview":  { "type": "absolute", "options": { "width": 1920, "height": 1080, "backgroundColor": "#0A0A0E", "display": "auto-scale" }, "structure": [ /* ... */ ] },
    "layout_drilldown": { "type": "absolute", "options": { "width": 1920, "height": 1080, "backgroundColor": "#0A0A0E", "display": "auto-scale" }, "structure": [ /* ... */ ] },
    "layout_entities":  { "type": "absolute", "options": { "width": 1920, "height": 1080, "backgroundColor": "#0A0A0E", "display": "auto-scale" }, "structure": [ /* ... */ ] }
  }
}
```

Notice the repetition of `options` — DRY is not available in Dashboard Studio's layout
definitions. The repetition is the price of per-tab shape control. Accept it.

**Design rules:**
- **Max 4 tabs.** More than four is a nav bar, not a dashboard. Convert to a real app.
- **One verb per label.** "Overview", "Investigate", "Tune" — not "Click here to see the alert details".
- **Searches run lazily:** panels on non-active tabs don't execute until the tab is opened
  (unless they power a search-based token). This is a free performance win — use it.
- **Shared inputs live in `globalInputs`**, not inside a tab's `structure`. The global
  time picker and scope filters should persist across tabs.
- **Tab-specific inputs** (the analyst-tab investigation filter) go *inside* that tab's
  `structure` as `{"type": "input", ...}` — so they don't clutter the other views.
- **Order tabs by flow:** overview → detail → action. Not alphabetical, not by creation
  date. Think of tabs as a reading order.

### 7.5 Drop the default panel title

If your `splunk.markdown` section header already labels the zone, drop the chart's `title` entirely.
Two labels for one panel is noise. Or: keep `title` but set it to a terse lowercase label like
`"trend"` or `"distribution"` — editorial minimalism.

### 7.6 `splunk.rectangle` as accent bar, not card

A 4 px tall rectangle in an accent color placed above or beside a hero panel is a tiny touch that
reads as "designer made this". Example:
```json
"viz_accent": {
  "type": "splunk.rectangle",
  "options": { "fillColor": "#00D4E1", "strokeWidth": 0, "cornerRadius": 0 }
},
"layout": {
  "structure": [
    {"item": "viz_accent", "position": {"x":40, "y":76, "w":80, "h":4}}
  ]
}
```

**Use exactly once or twice per dashboard.** As a hero mark above a headline section, or as a
divider between the KPI strip and the chart row. That's it.

**This is explicitly not the `border-left: 4px solid red` anti-pattern** — see §2.0 BAN 1. The
difference is intent and frequency: an accent bar is a deliberate signature gesture placed by a
designer at one or two points; the banned pattern is a templated stripe attached to *every*
panel to encode severity. If you find yourself writing a rectangle-per-panel to show status,
stop — you have regressed to the templated default. Use `backgroundColor` tints, icons, or
`majorColor` instead.


### 7.7 Use `ds.chain` for consistent series color locking

If you have 3 charts showing the same 5 services, one base search + 3 chain searches guarantees the
same service always gets the same position in the result set, which (combined with
`seriesColorsByField`) guarantees consistent coloring. Saves the viewer from parsing the legend
three times.

### 7.8 Refresh cadence — match to dashboard use

- Executive dashboard: `"refresh": "5m"` (they don't sit on it).
- NOC / SOC: `"refresh": "30s"` (live enough to matter).
- Analyst: NO refresh (they need stability mid-investigation).
- Business: `"refresh": "1h"` or no refresh.

Set on each `ds.search` via `"refresh": "30s", "refreshType": "delay"`.

---

## 7A. Interactivity — the design contract (syntax lives in `splunk-dashboard-interactivity`)

A dashboard is not a poster. The best dashboards pay off *over time* as viewers click,
filter, and drill. This chapter is how Dashboard Couture treats interactivity as a
**design discipline** — which filters exist, where they sit, whether a panel deserves
a drilldown, and how much state is too much. The wiring itself — input schemas, token
filters, eventHandler JSON, cascade mechanics, visibility conditions, debugging dead
tokens — lives in the sister skill `splunk-dashboard-interactivity`. If you are about
to write SPL with `$token|s$` in it or a `containerOptions.visibility.showConditions`
block, hand the brief to that skill.

The rule that ties the two skills: **interactivity should feel invisible — the viewer
reaches for it only when they need it, and it always does exactly what they expect.**

### 7A.1 The interactivity hierarchy — Information → Filter → Focus → Action

Every interactive element falls in exactly one of four layers. Keep them visually and
positionally distinct, or the dashboard turns into a kitchen drawer.

| Layer | Role | Where it lives | Typical element |
|---|---|---|---|
| **1. Time** | "When are we looking at?" — the universal scope | Always top-left, `globalInputs[0]` | `input.timerange` named `global_time` |
| **2. Filter** | "Which slice of the data?" — coarse scope that applies to most panels | `globalInputs[1..3]`, max 3 | `input.dropdown`, `input.multiselect` |
| **3. Focus** | "Which record am I investigating?" — set by the data itself | Panel-level `eventHandlers` | `drilldown.setToken` from table/chart click |
| **4. Action** | "What do I want to do with this?" — a *terminal* interaction | Buttons or drilldowns on detail panels | `drilldown.linkToDashboard`, `drilldown.customUrl`, `drilldown.linkToSearch` |

**Design cues that must be honored:**
- Layer 1 (time) is **always** above the canvas, left-aligned, with no chrome around it.
- Layer 2 (filter) sits to the right of the time picker, never inside the canvas.
- Layer 3 (focus) is triggered by *clicking the data itself* — not by a sidebar menu.
- Layer 4 (action) is where links live. They should be obvious *only* on elements
  where they exist (underline table cells, color a button, label a markdown link).

If you find yourself fighting this hierarchy — for example, putting a focus input
(single-user picker) above the canvas — stop. That filter belongs *inside* the panel
it affects, or better, as a drilldown on the summary panel.

### 7A.2 Inputs — the design rules (syntax: see interactivity skill)

Four pure-design rules for inputs. The *how* of each input type — the JSON schema, the
`items`/`statics` shape, the `clearDefaultOnSelection` flag, the `|s`/`|n`/`|u` token
filters — all live in `splunk-dashboard-interactivity`. The *what* lives here:

1. **Exactly one time picker per dashboard**, always `globalInputs[0]`, always with a
   `defaultValue` tuned to the audience (SOC: `-15m@m,now`; Exec: `-24h@h,now`; Analyst:
   `-7d@d,now`; Business: `-30d@d,now`). Never duplicate per-search time bindings —
   inherit via `defaults.dataSources`.
2. **Single-select dropdowns** are for mutually exclusive scope (env, region, severity).
   Include an "All" escape hatch. Keep item count ≤ ~50; beyond that, use multiselect.
3. **Multiselects** are for comparison across *some but not all* values. `hideWhenNoData: true`
   on anything cascading.
4. **Canvas-level inputs** (numbers, text) live *inside* the panel they affect, never
   above the canvas. Free-text inputs are injection vectors — always wrap with SPL's
   quoting operators.
5. **Buttons** are terminal actions only: reset tokens, link out, switch tab. One button
   max per investigation panel. Never above the canvas unless it's the Submit button.
6. **The Submit button** is used only when dashboards are *measurably slow*. Never as a
   default — for snappy dashboards, Submit-first feels broken.

Input styling rules (design, not syntax):
- Inputs above the canvas inherit the dashboard background — don't override.
- Inputs *inside* the canvas may take a warm tint (`#FBF6EF` on Porcelain, `#1F1F28` on
  Obsidian) to group them visually with their panel without adding a border.
- Global input labels: Title Case. Canvas input labels: lowercase with trailing colon
  ("rows:", "severity:") — editorial sidebar aesthetic.
- Align global input title baselines so the widest label (usually the time picker) sets
  the row height. Ragged label heights are a lazy-dev tell.

### 7A.3 Tokens — the design principle

Tokens are *state*. The design rules (what is a good token vs. a bad one) are here; the
six origin types, naming rules, token filters, and JSONata expression syntax all live in
`splunk-dashboard-interactivity` §4.

- **Name by role, not by number.** `selected_env`, `focus_user`, `filter_severity`. Never
  `tok_1`, `t`, `var`, `temp`, or a single letter. Token names are the closest thing a
  dashboard has to variable names — treat them with the same care.
- **One state concept, one token.** If you find yourself using `$env$` for a filter
  and also for a subtitle display, that's fine. If you find yourself using it for
  *two different meanings* (filter value in one panel, a selected row's environment in
  another), split them into `selected_env` and `focus_env`.
- **Environment tokens are the free personalization.** `$env:user_realname$` in a
  welcome markdown panel, `$env:version$` in a footer, `$env:is_cloud$` gating admin-only
  panels — all of these cost 30 seconds and make the dashboard feel bespoke.

### 7A.4 Cascading inputs — the design rule

Cascading inputs (Country → Region → City) are powerful and easy to over-use. The
*design* rule is simple:

- **Max 3 cascade levels.** Four is a survey. If you need four, that's a guided workflow
  — use tabs, not nested dropdowns.
- **Show the current scope somewhere.** A small monospaced markdown panel in the corner
  echoes the chain: `SCOPE › $selected_country$ › $selected_region$`. Without this the
  viewer loses track of what they've filtered to.

Mechanics (`ds.chain`, `hideWhenNoData`, Submit-button gating) live in interactivity §5.

### 7A.5 Tabs — the design rule

Tabs are **not inputs**. They are a layout feature — a navigation between related *views*
of the same dashboard. Design rules:

- **Max 4 tabs.** Beyond that, it's a new dashboard.
- **One verb or noun per tab.** "Overview", "Active incidents", "Hunt", "Tune". Never
  generic labels like "Tab 1" or "Data".
- **Order by viewer journey.** Summary → action → tuning. Never alphabetical.
- **Mix layout types freely.** A grid overview + an absolute-layout storytelling tab +
  a grid hunt view is a perfectly legal and often excellent shape.

Tab wiring (`layout.tabs.items[]`, `layoutDefinitions.<id>`, `drilldown.switchTab`) is
in interactivity §6. There is no `input.link` or `input.tabs` — LLMs hallucinate these;
refuse and redirect.

### 7A.6 Drilldowns — the design rule

Every drilldown type has its place. The design rule: **one drilldown per panel, and it
must be the one the viewer actually needs.**

- **Summary panels → `linkToSearch: auto`.** Click any aggregated bar/point/slice and get
  the raw events behind it. Zero config, maximum payoff.
- **Tables with an identifier column → `setToken` on the id column** + a master-detail
  panel below (§7A.7). Keeps the viewer in context.
- **Tables with a linked-entity column (user, host, IP) → `linkToDashboard`** to a
  per-entity dashboard. Always `newTab: true`.
- **Tables with an external reference (ticket id, case number) → `customUrl`** to the
  ticket system, URL-encoded.
- **Charts that support narrative → `switchTab`** to a pre-configured detail tab.

**Never make every column clickable.** Pick 2-3 columns per table that are clickable.
Splunk's default affordance (underline + cursor) handles the visual cue — don't fight it.

### 7A.7 The master-detail pattern — the single most powerful Couture move

This is the pattern that makes a dashboard feel *alive*. The viewer clicks a row, a
detail panel appears beneath the master table showing the full record. It uses:

1. A summary table with `drilldown.setToken` capturing the row identifier.
2. A data source that references the token in its SPL.
3. A `visibility.showConditions` on the detail panel that evaluates `isSet("focus_id")`.
4. The detail panel shows *only* when the condition passes.

**Why this is Couture:**
- Empty detail panels never appear — the dashboard doesn't demand attention it doesn't deserve.
- Clicking feels consequential: the page reorganizes itself.
- It's the Apple Mail three-pane pattern, ported to Splunk.

Full JSON recipe in interactivity §9.

### 7A.8 Visibility conditions — progressive disclosure

`visibility.showConditions` is how you make dashboards that *hide their own scaffolding*
until the viewer earns the data. Five design uses:

1. **Hide empty panels** — `hideWhenNoData: true` on the data source.
2. **Require a focus before showing detail** — master-detail pattern above.
3. **Progressive disclosure** — hide advanced panels behind an "Expert mode" toggle.
4. **Role-gated panels** — show admin panels only to admins via `$env:user$`.
5. **Environment-gated panels** — Cloud-only features gated on `$env:is_cloud$`.

Syntax (JSONata expressions, `all-true` vs `any-true`, environment guards) is in
interactivity §10.

### 7A.9 Interactivity anti-patterns — the design bans

Beyond the bans in §2.0, these are the interactivity-specific failures that mark an
AI-generated dashboard:

- **The "invisible state" bug.** A token is set by a click, but the dashboard gives no
  visual cue. Always echo the active selection somewhere (breadcrumb, subtitle, scope
  strip). Dashboards that don't echo state feel broken even when they work.
- **The "reset button that doesn't reset".** A reset should set *every* token to its
  default, not just the most recently changed one.
- **The "silent failure drilldown".** A custom URL with `$row.x.value$` where column `x`
  doesn't exist navigates to a broken URL. Verify column names before shipping.
- **The "input that doesn't filter anything".** Every input must demonstrably change a
  visible panel. If a filter only affects 1 of 8 panels, move it inside that panel. This
  is the *designer's* form of the dead-token rule — see interactivity §1 for the
  schema-level enforcement.
- **The "token as prop trap".** Don't set a token purely so a markdown panel can display
  it. Tokens drive data, not decoration. Use `$env:*$` or pure markdown instead.

## 8. Persona-specific recipes — applied Couture

For each persona, copy this structure into your plan before generating JSON.

### 8.1 Executive / CISO Board Briefing

```
Archetype:   Executive Briefing (§3.1)
Palette:     Porcelain (§4.2)
Typography:  Splunk Platform Sans body, Times New Roman for the hero label only,
             Proportional tables
Panels:      1 hero + 3 supporting KPIs + 1 trend + 1 annotated events
Interaction: None — this is read-only. Remove every dropdown you don't need.
Refresh:     5m
Key choice:  Less is more. If in doubt, remove a panel.
Handoff to syntax skill: "Light theme, Porcelain palette, 1 hero singlevalue at top with 72px
number, trendValue vs prior period, and a splunk.markdown caption above the number using
Times New Roman (set Font family = Times New Roman in the visual editor). 3 supporting KPIs in a
row below with a single splunk.rectangle card behind them, labels set to Splunk Platform Sans.
Single line chart at bottom with 1–2 data series, no legend, minimal axis labels, one annotation
for the last board meeting date. No grid lines on the chart. Last-updated timestamp as small
Splunk Platform Sans text, top-right."
```

### 8.2 SOC Analyst Overview

```
Archetype:   SOC Overview (§3.2)
Palette:     Obsidian (§4.1)
Typography:  Splunk Data Sans for KPI label markdowns, Splunk Platform Mono for any markdown
             showing raw numbers or timestamps, Monospace for all tables
Panels:      5-KPI strip + geo map + severity pie + recent alerts table
Interaction: Time, severity, source filters — all with defaults so the dashboard renders instantly
Refresh:     30s
Key choice:  Density is the virtue. Don't soften it with whitespace.
Handoff: "Dark theme, Obsidian palette, canvas #0A0A0E. KPI strip of 5 splunk.singlevalue with
rangeValue coloring for critical/high/medium (font inherits from theme — cannot override). Each
KPI preceded by a small splunk.markdown label in Splunk Data Sans. Geo map as
splunk.choropleth.map with world source, mercator projection, fill colored by event count using
markerColors gradient from #26D07C to #FF4757. Severity pie max 5 slices with seriesColorsByField
locking severity to semantic colors. splunk.table with Font set to Monospace, rowBackgroundColors
driven by severity (_color_rank pattern), 20 rows, _time formatted with strftime to
'%b %d %H:%M'. No gridlines, no drop shadows, no gradients. All gutters 24px."
```

### 8.3 NOC On-Call / Operational

```
Archetype:   NOC / Operational (§3.3)
Palette:     Obsidian (§4.1) but with higher-saturation semantics
Typography:  Splunk Platform Sans for tile labels (kept large: 24–32 px via customFontSize),
             Splunk Data Sans for any auxiliary markdown numbers, Monospace for the incident table
Panels:      4×2 grid of service-status tiles + full-width incident timeline
Interaction: Minimal — time range, service filter
Refresh:     30s
Key choice:  Readable from 6 meters. No subtlety.
Handoff: "Grid layout, 4 columns × 2 rows of splunk.singlevalueicon tiles each representing one
service — icon color driven by service health (green/amber/red by rangeValue). Tile label
markdowns use Splunk Platform Sans at 24–32 px (set via customFontSize). Below, full-width
splunk.timeline showing last 24h incidents, category driven by incident.type, seriesColors from
semantic palette. If the incident table is shown, set its Font to Monospace. No decoration. 4px
corner radius on tiles for prolonged-viewing comfort."
```

### 8.4 Threat Hunter / Investigator

```
Archetype:   Analytical Deep-Dive (§3.4)
Palette:     Smoke (§4.3) — muted series on dark canvas
Typography:  Splunk Data Sans for body markdowns (tuned for data reading), Splunk Platform Mono
             for any _raw or ID fields shown in markdown, SMALL CAPS markdown headers in Splunk
             Data Sans via uppercase + increased letter-spacing, Monospace for all tables
Panels:      Tabs (Overview / Drilldown / Entities / Raw) — rich filter bar at top
Interaction: Multi-filter: time, host, user, source IP, severity, attack type
Refresh:     None during investigation
Key choice:  Dense but organized. Tables are heroes here, not KPIs.
Handoff: "Dark theme, Smoke palette, #14141C canvas. input.link tab selector (Overview/Drilldown/
Entities/Raw) sharing one global time token. Overview: multi-series splunk.line with 6 muted
series, stackMode auto, annotations for IOC detections. Drilldown: splunk.scatter correlating two
fields the user picks via input.dropdown, marker color by severity. Entities: splunk.linkgraph
of user-host-source relationships, node colors by role. Raw: splunk.table with Font set to
Monospace, 30 rows, drilldown to detail, _time strftime'd. Section-header markdowns use Splunk
Data Sans uppercased."
```

### 8.5 Business / Revenue Leader

```
Archetype:   Business / Sales (§3.5)
Palette:     Warm Editorial (§4.4)
Typography:  Times New Roman for the top narrative caption only (one panel), Splunk Platform
             Sans for everything else, Proportional tables with right-aligned numeric columns
             (this archetype chooses Proportional over Monospace to preserve the warm editorial
             feel — see §5.3 for the compensating disciplines)
Panels:      1 hero narrative + 3 segment tiles + 1 funnel/cohort + 1 annotated trend
Interaction: Time range + "vs prior period" toggle + segment filter
Refresh:     1h or manual
Key choice:  Make it feel edited, not auto-generated. Annotate events on the trend.
Handoff: "Light theme, Warm Editorial palette, #F7F5F0 canvas. Top: splunk.markdown narrative
caption using Times New Roman (set Font family = Times New Roman in the visual editor) — one
paragraph, maximum. Hero: full-width splunk.line showing revenue over time, 1 accent series color
(#264653), annotations for product launches pulled from a lookup. Below, 3 splunk.singlevalue
tiles for segments (channel/region/product) each with trendValue as MoM percent delta, positive
delta in #2F7A52, negative in #B84A3E. Conversion funnel as splunk.sankey or a stacked
splunk.column. Numbers formatted with thousands separators and consistent precision (see §5.3).
Tile labels in Splunk Platform Sans. Leave one empty grid cell in the middle-right — restraint is
the luxury."
```

---

## 9. The Couture decision tree — when faced with a design question

When the user hands you a vague request or an existing ugly dashboard, walk through these
questions before touching JSON.

```
1. WHO is the audience?
   Executive / SOC / NOC / Analyst / Business → pick archetype (§3)

2. WHAT is the one question this dashboard answers?
   Write it on a post-it. If you can't, push back on the user.

3. HOW MANY panels does that question need?
   Executive: ≤8. NOC: ≤12. Analyst: ≤14 across tabs. SOC: ≤10. Business: ≤8.
   If the user asks for more, ask "which ones would you remove if you had to?"

4. LIGHT or DARK theme?
   DO NOT pick from archetype default. DERIVE from §1.3b:
   ambient lighting × session duration × viewer eyesight × medium × time of day.
   24/7 ops in a dim room → dark. Executive glance on iPad in bright kitchen → light.
   Board briefing on a projector → light. Fraud analyst 2-hour session → dark-but-lower-contrast.
   Theme is a decision, not a reflex.

5. WHICH palette from §4?
   Obsidian / Porcelain / Smoke / Warm Editorial. Pick ONE. Never mix.

6. WHICH type system from §5?
   Remember: you are choosing from a DROPDOWN, not typing fontFamily strings (§5.2.1).
   Default operational:  Splunk Platform Sans body  /  Monospace tables
   SOC / density:        Splunk Data Sans body  /  Splunk Platform Mono for numbers  /  Monospace tables
   Executive / board:    Splunk Platform Sans body  /  Times New Roman hero caption ONLY  /  Proportional tables
   Analyst:              Splunk Data Sans body  /  Splunk Platform Mono for _raw + IDs  /  Monospace tables
   Business / magazine:  Splunk Platform Sans body  /  Times New Roman top narrative ONLY  /  Proportional tables

7. HIERARCHY:
   Which ONE panel is the hero? (There must be exactly one.)
   What are the 3–5 primary supporters?
   What goes in the detail / bottom tier?

8. COLOR discipline:
   Are all series colors locked with seriesColorsByField?
   Are semantic colors reserved for status only (never as series colors)?
   Is there ONE accent color, used ≤2 places?
   Does every colored signal pair with an icon or label (CVD safety)?

9. WHITESPACE:
   Are all gutters ≥24 px?
   Is there at least one visibly empty grid cell?
   Are panel edges aligned to an 8 px grid?

10. ANTI-AI checklist (§2):
    No purple-cyan gradients. No glassmorphism. No nested cards. No 12-slice pie charts.
    No rainbow defaults. No drop shadows on data panels. No centered everything.
    No "Security Overview" titles. Titles phrased as questions.

11. HAND OFF to splunk-dashboard-studio with explicit constraints.
    Give the syntax skill the palette hex codes, the per-panel Font family dropdown choice (from
    the 7 markdown options in §5.2.1), the per-table Font dropdown choice (Proportional or
    Monospace), the position coordinates, and the seriesColorsByField map. Do NOT let it pick
    "a nice color" — it will pick the average. Do NOT write raw fontFamily CSS strings; those
    don't belong in the Dashboard Studio JSON schema paths the visual editor understands.
```

---

## 10. Pre-flight checklist — before you ship

Read this out loud. If any answer is "no" or "uh", go fix it before the dashboard is seen.

### Structure
- [ ] There is exactly ONE hero panel. The eye lands on it first.
- [ ] Panel count is within archetype range (§3).
- [ ] F-pattern reading order is respected.
- [ ] Every panel answers exactly one question, phrasable as a post-it.
- [ ] No panel is smaller than the minimums in §6.3.

### Color
- [ ] One palette from §4 is used consistently. No rogue colors.
- [ ] Semantic colors mean what they should (red = critical, green = OK) throughout.
- [ ] Max 6 series per chart. `seriesColorsByField` locks values to colors.
- [ ] Accent color used ≤2 places.
- [ ] Every color state has a non-color partner (icon / text / shape).
- [ ] WCAG AA contrast checked for every custom color.

### Typography
- [ ] Every markdown panel has a deliberate Font family choice — never left on Arial or Comic Sans MS. (§5.2.1)
- [ ] Every table with a numeric column is set to Font = Monospace, OR numeric columns are right-aligned with consistent precision (§5.3).
- [ ] Times New Roman appears at most once per dashboard, on a hero caption only. (§5.2.2)
- [ ] KPI label markdowns use Splunk Data Sans, not Splunk Platform Sans, when displayed next to numbers.
- [ ] Type sizes all in the §5.1 scale. No rogue sizes.
- [ ] Titles are 3–5 words, phrased as questions, correct case for archetype.
- [ ] Units always visible. Precision appropriate (no `$3,848,305.93`).

### Layout
- [ ] **Every `layoutDefinitions.<id>.type` is `"absolute"` (BAN 11 / §6.0).** If any tab or the top-level layout is `"grid"` on a dashboard with design intent, fix it before shipping. Exception: pure internal utility pages only.
- [ ] Canvas `width` and `height` are explicitly set in `layout.options` (or per-tab `options`), and map to a known wall/workstation size (1440×960, 1920×1080, 2560×1440).
- [ ] `display: "auto-scale"` is set so the composition survives viewport changes.
- [ ] All dimensions are multiples of 8 px.
- [ ] Gutters ≥24 px. Canvas margins ≥32 px.
- [ ] Panel tops align to the same y within a row.
- [ ] KPI baselines align across a row.
- [ ] At least one deliberately empty cell of whitespace.

### Interactivity (design checks — schema checks live in `splunk-dashboard-interactivity` §14)
- [ ] `globalInputs` ≤ 5 items total (BAN 5).
- [ ] Time range picker is first (leftmost) in `globalInputs`, defaultValue matches audience.
- [ ] Every declared token has a visible consumer — no "tok_severity"-style dead state.
- [ ] Filter labels are user-facing ("Environment", not "env_id"); Title Case above canvas, lowercase-with-colon inside canvas.
- [ ] Every `input.dropdown` has an "All" escape hatch (design check — the SPL wildcard handling is interactivity's job).
- [ ] No panel has more than 1 `eventHandlers` entry (BAN 6).
- [ ] Tables are *either* terminal, *or* have exactly one drilldown — not both, not neither.
- [ ] Table panel height matches the data shape (BAN 9): `h ≥ 40 + 32 × rowCount + (48 if paginating)` px.
- [ ] Token names are semantic (`selected_env`, `focus_user`), never `tok_N` (BAN 8).
- [ ] A "scope indicator" panel is present on dashboards with 3+ filters.
- [ ] Refresh interval matches archetype use (§7.8) — ABSENT on Analyst archetypes.
- [ ] Submit button is only used if the dashboard is measurably slow; otherwise omitted.

(Run `splunk-dashboard-interactivity` §14 for the full wiring / dead-state / cascade /
visibility audit — those are schema-level checks, not design checks.)

### SPL hygiene (design-visible checks — language-level checks live in `splunk-spl-syntax`)
- [ ] No `case(...,true=<value>)` pattern anywhere in `dataSources.<id>.options.query`. The default must be `true()=<value>` or `1==1, <value>` (see `splunk-dashboard-viz` §13 item 19 and `splunk-spl-syntax` §3). A single `,true=` character sequence in any query is a ship-blocker — the default branch is silently dead and the KPI will show the wrong number on the "All" selection.
- [ ] Every `case()` in a query that branches on a filter token (`$tok_<name>$`) has an explicit `true()` / `1==1` default — the "All" option depends on it firing.
- [ ] Every dotted field reference inside `eval` / `where` / `if` / `case` / `search` is wrapped in single quotes (e.g., `'properties.status.errorCode'`). Bare dotted names are parsed as sub-search operators and silently return the wrong data (see `splunk-spl-syntax` §1).
- [ ] Any filter token consumed as a string inside SPL uses the `|s` filter (`$tok_user|s$`) for automatic quoting — naked `$tok_user$` breaks on values containing spaces or special characters (see `splunk-dashboard-interactivity` §7).
- [ ] `| sort -count` appears nowhere — use `| sort 0 -count` so the full result set is sorted (the default 10,000-row limit silently caps Top-N tables and KPI denominators).
- [ ] `| timechart` that splits by a field specifies `limit=<N> useother=f` when more than 10 series are likely, to prevent a phantom "OTHER" series in the legend.
- [ ] Time pickers drive queries that use `earliest=$time_token.earliest$ latest=$time_token.latest$` — not hard-coded `earliest=-24h`. Hard-coded windows make the time picker a dead input (interactivity BAN 1).
- [ ] `relative_time()` expressions match the user's stated intent: `-7d@d` (7 days ago at midnight) vs `-7d` (exactly 7×24h ago) are not the same. If the user said "last week", `-7d@d` is almost always what they meant.

### Anti-AI
- [ ] No purple-cyan gradients anywhere.
- [ ] No glassmorphism.
- [ ] No drop shadows on data panels.
- [ ] No nested cards within cards.
- [ ] No "Overview / Metrics / Dashboard" generic titles.
- [ ] No 3D anything.
- [ ] No rainbow palettes on ordered data.
- [ ] No more than 5 slices on any pie chart.
- [ ] No pie charts for the core KPI (hero must be a singlevalue or a line).

### Humanity
- [ ] There is ONE element that shows opinion / personality (an accent bar, an annotation, a markdown note, a named color).
- [ ] Micro-copy sounds like a colleague, not a compliance document.
- [ ] At least one chart is annotated with a real event from the business.

If all boxes are checked, ship it. If not, fix the highest-impact miss first — usually color or
hierarchy.

---

## 11. How this skill cooperates with the three support skills

Couture is one of four Splunk Dashboard Studio skills; the other three own syntax,
interactivity mechanics, and the SPL language inside queries:

- **`splunk-dashboard-viz`** — the authoritative syntax reference for every viz type's
  options, enum values, and DOS expressions. Consult it whenever you need to know which
  option lives where, what its legal values are, or why a viz renders NaN / blank / wrong.
- **`splunk-dashboard-interactivity`** — the wiring diagram for inputs, tokens, drilldowns,
  tabs, cascading, visibility conditions, and master-detail patterns. Consult it whenever
  the dashboard needs to *respond* to something the user does.
- **`splunk-spl-syntax`** — the language reference for everything inside
  `dataSources.<id>.options.query`: `eval`, `case`, `stats`, `timechart`, time functions,
  quoting, dotted-field handling, token filter behavior in SPL, and the common-mistakes
  quick table. Consult it whenever you write or review a query — wrong SPL produces NaN,
  empty KPIs, and phantom "OTHER" series that no amount of correct JSON will fix.

Work order:

1. **Couture first.** Apply §9 decision tree, pick archetype, palette, typography, layout
   zones. Produce a written design brief listing every color (hex), every font (Splunk
   Font-dropdown name), every panel title, every refresh cadence, every interactivity
   decision (which filters, which drilldowns, which tabs).
2. **Support skills second.** For each item in the brief:
   - When you need to place a chart → consult `splunk-dashboard-viz` for the exact viz
     type, option names, and DOS expressions.
   - When you need to connect a filter, drilldown, or tab → consult
     `splunk-dashboard-interactivity` for the input schema, token binding, and
     eventHandler shape.
3. **Couture review.** Run the §10 pre-flight checklist, plus the sweeps owned by the
   two support skills (viz §12-17 common mistakes; interactivity §14 dead-state audit).
   Fix every "no" by editing the JSON or asking the relevant support skill to re-render.
4. **Ship.**

You do not write JSON. You write design briefs. The support skills write JSON. If you
find yourself tempted to write JSON, stop and instead write a bullet list of constraints.
The LLM will pick worse defaults than you would if you let it make decisions — your job
is to make every design decision for it and hand it a filled-in form.

**Precedence when skills disagree:**
- `splunk-dashboard-viz` wins on "what is legal JSON". If couture wants `stackMode:
  unstacked`, viz overrides — `unstacked` isn't a valid enum.
- Couture wins on "what is good design". If viz says `splunk.pie` accepts 50 slices,
  couture overrides — ≤ 5 ships.
- `splunk-dashboard-interactivity` mediates the connections: it knows *how* to legally
  wire a token into a viz option, *how many* cascade levels are tolerable, and *when*
  a drilldown should open a new tab vs. set an in-page token.
- `splunk-spl-syntax` wins on "what is legal SPL inside a query". If couture specifies
  `eval x = case(..., true=N)` in a design brief, spl-syntax overrides — that is not a
  default branch and the query is broken. Couture does not write SPL; it lists the
  *questions* each panel must answer, and spl-syntax ensures the query that answers each
  question is syntactically correct and behaves the way the design assumes.

### 11.1 The schema-validity sweep (delegated to `splunk-dashboard-viz`)

Before save, run the common-mistakes checklist and debug guide at the end of
`splunk-dashboard-viz` against the draft JSON. Those two sections cover the 17
platform-level traps — enum rejection, NaN on singlevalue, `columnFormat` shape,
choropleth SVG requirement, data source name regex, and the rest.

Likewise, run `splunk-dashboard-interactivity` §14 before save for the dead-state audit:
every declared token must be read somewhere, every condition must be referenced, every
input must appear in the layout.

Couture itself does not own schema validation — it owns taste. But a beautifully
designed dashboard that fails at save is still a failure. Run both sweeps.

---

## 12. Further reading (referenced when drafting this skill)

- Edward Tufte, *The Visual Display of Quantitative Information* — data-ink ratio, chartjunk.
- Stephen Few, *Information Dashboard Design* — the 13 pitfalls (§2 + §10 draw heavily from these).
- Apple Human Interface Guidelines — Clarity, Deference, Depth, Consistency (§1).
- Bloomberg Terminal design documentation — density-as-authority (§3.2).
- "Why My AI-Generated UI Looked Generic" (Alex Lavaee, 2026) — the averaging-machine insight.
- UI Craft anti-slop banned list — purple-cyan gradients, glassmorphism, bounce easing.
- Splunk Dashboard Studio docs, v10.3.2512 — all JSON syntax sourced from official docs.
- **impeccable** (Anthropic's frontend-design skill, v2.1.1, Apache 2.0) — §0.5 Design Context
  Protocol, §1.3b Theme derivation, §2.0 Absolute bans (match-and-refuse), §4.0 OKLCH palette
  construction, and §5.2b Font-selection procedure are all adapted from impeccable and tuned to
  Splunk Dashboard Studio's JSON-and-hex reality. Where impeccable targets web CSS, this skill
  targets Splunk JSON; where impeccable has full font freedom, this skill negotiates Splunk Cloud
  font constraints. Same failure modes, same fixes, different runtime.

---

*Good dashboards are noticed briefly, then disappear. Great dashboards are screenshotted and shared.
The difference is taste. Apply this skill when taste matters.*
