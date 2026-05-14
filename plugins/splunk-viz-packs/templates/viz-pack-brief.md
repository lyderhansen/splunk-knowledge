# Viz Pack Brief — fill this out and paste to start building

## 1. Brand & Identity

**Brand name:** _e.g., Red Bull Racing, NASA, Porsche_

**Brand tone (3 words):** _e.g., aggressive/precise/carbon, calm/clinical/trustworthy_

**Visual references (URLs or descriptions):**
- _e.g., https://artstation.com/... or "Bloomberg terminal meets Tesla dashboard"_
- _..._

**Hero image URL (optional):** _Full-width background image for the dashboard_

**Color direction:** _e.g., "dark navy + red accents" or "light, clean, pastel blues"_

**Theme:** dark / light / both

## 2. Domain & Data

**What does this dashboard monitor?**
_e.g., "F1 telemetry — speed, throttle, tyres, lap times" or "hospital patient flow across departments"_

**Key metrics (list 5-10):**
1. _e.g., Speed (numeric, 0-370 km/h)_
2. _e.g., Lap time (string, "1:21.584")_
3. _e.g., Position (integer, 1-20)_
4. _..._

**Data format:** Real Splunk data / Demo data (CSV lookups) / Both

**Audience:** _e.g., "Race engineer on pit wall" or "Hospital administrator on 27" monitor"_

## 3. Viz Preferences (optional — leave blank for AI to decide)

**Viz types you want:**
_e.g., "heat grid for sensor temps, needle gauge for speed, status matrix for systems"_
_Or leave blank: "Surprise me — pick what fits the data best"_

**Viz types to avoid:**
_e.g., "No donuts, no ring gauges" or leave blank_

**Effects/mood:**
_e.g., "Ambient light, glass panels, data glow" or "Clean and minimal, no effects"_

## 4. Interaction

**Drilldown needed?** yes / no
_If yes, what should clicking do? e.g., "Click a sensor → show detail panel"_

**Hover tooltips:** yes (default) / minimal / no

## 5. Constraints

**Must work with these Splunk apps:**
- [ ] icon_library (Material Symbols icons)
- [ ] infographic_shapes (gradient shapes, progress bars)
- [ ] Neither — standalone viz pack

**Font preference:** _e.g., "System fonts (free)" or "Embed JetBrains Mono" or "Match brand: use Söhne"_

**Delivery:** Just the viz pack / Viz pack + bundled dashboard / Viz pack + dashboard + CSV demo data

---

## How to use this template

1. Copy this template
2. Fill in sections 1-2 (required) and 3-5 (optional)
3. Paste into Claude Code or Cursor with: "Build this viz pack using the splunk-viz-packs plugin"
4. The AI will invoke vp-design → vp-viz → vp-create and deliver a .tar.gz

**Minimal version** — if you just want to get started fast:

```
Build a viz pack for [BRAND NAME].
Theme: [dark/light].
Data: [what the dashboard shows].
Key metrics: [list 3-5 metrics with types].
Style: [3 tone words].
```
