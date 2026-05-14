# Test 24 — Apple Retail Analytics (full viz pack)

## Prompt (copy-paste to fresh session)

---

Build me a Splunk Dashboard Studio dashboard + custom viz pack for **Apple Retail Analytics**.

**Brand:** Apple — refined, minimal, deliberate. Think SF Pro typography, generous whitespace, soft gradients on light backgrounds, precise spacing. The brand is quiet confidence, not flashy. Systemblue (#007AFF) as accent, warm grays, glass-like depth.

**Audience:** Apple Retail regional directors on desktop + iPad. They review store performance weekly — revenue, foot traffic, Genius Bar satisfaction, product mix. They care about trends and outliers, not raw logs.

**Job to be done:** Decide which stores need attention this week — underperforming revenue, declining NPS, Genius Bar wait times too high, or inventory imbalance.

**Tone words:** Refined, precise, quiet confidence

**Anti-references:** NOT a dark SOC wall. NOT a dense Bloomberg terminal. NOT a colorful Spotify dashboard. Think Apple's own Health app or Fitness app — clean, data-forward, restrained.

**Panels I want:**
1. KPI strip at top — total revenue, foot traffic, avg NPS score, Genius Bar avg wait time
2. Revenue by store — horizontal bars or ranking showing top 10 stores
3. Weekly revenue trend — line or area chart showing 12-week trend with target
4. Product category mix — composition viz showing revenue split across iPhone, Mac, iPad, Watch, Services
5. Genius Bar satisfaction — gauge or metric showing NPS with threshold zones
6. Store alerts feed — recent alerts for stores that crossed thresholds

**Custom vizs I need (in the viz pack):**
- A refined KPI tile — clean single-value with trend delta, Apple-style typography
- A revenue ranking viz — horizontal bars with store names, Apple's precise spacing
- A satisfaction gauge — circular or linear gauge with Apple-blue gradient
- A product mix viz — donut or treemap showing category breakdown
- An alert feed — scrolling list of store events with severity badges

**Requirements:**
- Use lookups for demo data (no real Splunk indexes needed)
- Light theme primary (Apple aesthetic), but should work in dark too
- Nav bar in the Splunk app
- Must work in both Dashboard Studio AND ad-hoc search
- 5 custom vizs in the pack

Use the splunk-viz-packs plugin: load vp-couture for design, then vp-ref-gotchas, vp-viz, and vp-create for building. Write all viz code inline — do not dispatch subagents for code generation.

---

## Validation checklist (don't share with agent)

### Formatter (per viz × 5)
- [ ] `{{VIZ_NAMESPACE}}` in all name= attributes
- [ ] `value=` not `default=`
- [ ] `type="custom"` on color pickers
- [ ] `value="auto"` on themeMode
- [ ] `section-label` on every `<form>`
- [ ] Min 7 controls per viz

### JS (per viz × 5)
- [ ] clientWidth/clientHeight (no getBoundingClientRect for sizing)
- [ ] detectTheme() or getCurrentTheme()
- [ ] safeStr() or != null guards
- [ ] No new Date(string)
- [ ] Pure ES5
- [ ] clearRect (not fillRect for bg)

### Structure
- [ ] allow_user_selection + disabled = 0
- [ ] savedsearches.conf.spec
- [ ] Nav bar
- [ ] Lookup filenames prefixed
- [ ] Tarball > 5KB
- [ ] 5 viz directories in appserver/static/visualizations/

### Design
- [ ] Light theme primary (Apple aesthetic)
- [ ] SF Pro feel (system fonts, precise spacing)
- [ ] Systemblue accent, not rainbow
- [ ] Generous whitespace
- [ ] Feels Apple, not generic AI
