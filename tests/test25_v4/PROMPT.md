# Test 25 — v4.0.0 validation

## Prompt (copy-paste to fresh session)

---

Build me a single custom Splunk visualization: an engagement ring gauge for a hospital patient satisfaction dashboard.

**App name:** `hospital_nps_gauge`

**What it does:** A 270-degree arc gauge showing Net Promoter Score (0-100). Three zones: red (0-30 detractors), amber (31-60 passive), green (61-100 promoters). Center shows the score as a large number with "NPS" label below. Subtle pulse animation on the arc when score is in promoter zone.

**Visual style:** Clinical, trustworthy. Soft blue (#0077B6) accent on light warm-white (#F8F7F4). Clean, generous spacing. Think Apple Health app meets hospital information system.

**Expected SPL:** `| inputlookup hospital_nps_gauge_demo.csv`
Columns: `score` (number 0-100), `label` (string), `target` (number)

**Formatter settings:**
- scoreField, labelField, targetField (configurable field names)
- maxValue (default "100")
- showTarget (radio: Show/Hide, default "true")
- accentColor (color picker, default #0077B6)
- themeMode (radio: Auto/Dark/Light, default "auto")
- accentIntensity (default "50")
- showAnimation (radio: On/Off, default "true")

**Requirements:**
- Use lookups for demo data
- Light theme primary, works in dark too
- Include nav bar
- Build flat AMD and package as tarball
- Must work in ad-hoc search

Use the splunk-viz-packs plugin skills: load vp-viz and vp-create.

---
