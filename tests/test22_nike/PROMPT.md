# Test 22 — Nike Training Club Operations Dashboard

## The prompt (copy-paste to a fresh Claude session with splunk-viz-packs + splunk-dashboard-studio installed)

---

Build me a Splunk Dashboard Studio dashboard + custom viz pack for **Nike Training Club**.

**Brand:** Nike — bold, kinetic, empowering. Think the swoosh energy, high-contrast black/white with volt accents, dynamic motion feel. The brand is confident, athletic, and action-oriented. Not corporate, not safe.

**Audience:** Regional training program managers viewing on desktop. They track athlete engagement, workout completion rates, trainer performance, and program growth across cities.

**Job to be done:** Identify which training programs are thriving and which need intervention — low engagement, dropping completion rates, or underperforming trainers.

**Tone words:** Bold, kinetic, empowering

**Anti-references:** NOT a pastel wellness app. NOT a generic Splunk dashboard with rainbow charts. NOT a dark SOC wall.

**Panels I want:**
1. KPI strip — total active members, workouts completed this week, avg completion rate, new signups
2. Program performance comparison — show top 10 programs side by side with engagement scores
3. Weekly workout trend — show completion trend over 12 weeks with target line
4. Trainer leaderboard — ranked list of trainers by avg session rating
5. City heatmap or comparison — which cities have the highest engagement
6. Live activity feed — recent workout completions, new member joins, program milestones

**Custom vizs I need (in the viz pack):**
- An engagement gauge — circular progress showing weekly active rate vs target with Nike energy styling
- A trainer leaderboard — ranked horizontal bars or cards showing trainer scores with dynamic accent colors

**Requirements:**
- Use lookups for demo data (no real Splunk indexes needed)
- Dark theme primary, but should work in light too
- Nav bar in the Splunk app
- Must work in both Dashboard Studio AND ad-hoc search (for the custom vizs)

---

## What we're validating (post-build checklist — do NOT share with agent)

### TIER 1: FATAL / BROKEN (from test20 + test21)
- [ ] `{{VIZ_NAMESPACE}}` in all formatter.html name= attributes (B10 CRITICAL)
- [ ] `value=` not `default=` on formatter inputs (B7)
- [ ] `type="custom"` on color pickers (B5)
- [ ] `allow_user_selection = true` + `disabled = 0` in visualizations.conf
- [ ] `savedsearches.conf.spec` in README/
- [ ] Dashboard JSON uses `tabs` + `layoutDefinitions` wrapper
- [ ] No `backgroundColor` in `layout.options`
- [ ] Background via `splunk.rectangle` as first structure element
- [ ] `fontFamily` uses only valid enum values

### TIER 2: NEW from test21 (Patagonia failures)
- [ ] setupCanvas uses `this.el` — no wrapper div (B17 rewrite)
- [ ] No `getBoundingClientRect` — uses clientWidth/clientHeight (B17)
- [ ] No `width/height` set on `this.el` (B17)
- [ ] No `new Date(string)` — regex parse for timestamps (B19)
- [ ] Theme formatter default is `'auto'` with detectTheme() (B20)
- [ ] All row field reads null-guarded before String() (B21)
- [ ] Gauge arc: cy - radius >= pad (coupled constraint) (B8)
- [ ] Font scaling: floor only, no upper pixel cap (B8)
- [ ] Every formatter has `class="splunk-formatter-section" section-label="..."` (B5)
- [ ] Minimum 10 formatter controls per viz
- [ ] All field names configurable via formatter (not hardcoded)
- [ ] preview.png exists in each viz directory (R8)

### TIER 3: Build pipeline
- [ ] build_flat.js regex without m flag
- [ ] Post-build validation passed (syntax, AMD, ES5, theme, null guards)
- [ ] Tarball > 1KB (not empty)
- [ ] No nested .tar.gz in archive
- [ ] Nav bar (default.xml) included

### TIER 4: Design quality
- [ ] Bold/kinetic feel (not generic AI dashboard)
- [ ] High contrast black/white with volt/accent pops
- [ ] NOT pastel, NOT rainbow Splunk defaults
- [ ] Lookup filenames prefixed with pack ID
