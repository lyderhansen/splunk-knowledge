# Test 21 — Patagonia Outdoor Operations Dashboard

## The prompt (copy-paste this to a fresh Claude session with splunk-viz-packs + splunk-dashboard-studio installed)

---

Build me a Splunk Dashboard Studio dashboard + custom viz pack for **Patagonia Outdoor Operations**.

**Brand:** Patagonia — outdoor adventure, sustainability, earth tones, organic feel. Think mountain ridgelines, forest greens, warm sandstone, glacier blues. The brand is understated, purposeful, not flashy.

**Audience:** Regional operations managers viewing on desktop monitors during business hours. They need to understand supply chain health, sustainability metrics, and retail performance at a glance.

**Job to be done:** Decide which regions need operational attention this week — inventory shortfalls, sustainability targets off track, or retail underperformance.

**Tone words:** Grounded, purposeful, organic

**Anti-references:** NOT a generic Splunk rainbow dashboard. NOT a dark SOC wall. NOT a neon tech-bro aesthetic.

**Panels I want:**
1. KPI strip at top — total revenue, units sold, return rate, carbon offset score
2. Regional performance heatmap or comparison — show all 5 regions side by side
3. Sustainability tracker — carbon offset progress vs target (monthly trend)
4. Inventory health by product category — show which categories are low
5. Recent alerts feed — stock warnings, sustainability threshold breaches

**Custom vizs I need (in the viz pack):**
- A sustainability gauge — shows progress toward annual carbon offset goal with organic/earth-tone styling
- A regional comparison chart — horizontal bars or similar showing each region's composite score

**Requirements:**
- Use lookups for demo data (no real Splunk indexes needed)
- Dark theme primary, but should work in light too
- Nav bar in the Splunk app
- Must work in both Dashboard Studio AND ad-hoc search (for the custom vizs)

---

## What we're validating

- [ ] Dashboard JSON uses `tabs` + `layoutDefinitions` wrapper (even single page)
- [ ] No `backgroundColor` in `layout.options`
- [ ] Background done with `splunk.rectangle` as first structure element
- [ ] `fontFamily` uses only valid enum values (not "monospace")
- [ ] All custom vizs use `{{VIZ_NAMESPACE}}` in formatter.html (CRITICAL)
- [ ] `value=` not `default=` on formatter inputs
- [ ] `type="custom"` on color pickers
- [ ] `allow_user_selection = true` + `disabled = 0` in visualizations.conf
- [ ] `savedsearches.conf.spec` present in README/
- [ ] Lookup filenames prefixed with pack ID
- [ ] preview.png is real PNG (not renamed SVG)
- [ ] Nav bar (default.xml) included
- [ ] Theme auto-detect via `getCurrentTheme()` (no theme radio in formatter)
- [ ] No hardcoded fonts in visualization_source.js skeleton
- [ ] Earth-tone palette (not generic Splunk rainbow)
- [ ] Design feels organic/purposeful (not AI-generic)
