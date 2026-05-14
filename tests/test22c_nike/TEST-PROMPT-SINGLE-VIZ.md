# Test prompt — single viz (copy-paste to fresh session)

---

Build me ONE custom Splunk visualization app called `nike_gauge`.

**What it does:** A circular engagement gauge — arc from 0-100% showing weekly active member rate vs target. Nike-style: volt (#CDFF00) on black (#0A0A0A), bold, kinetic.

**Expected SPL columns:** `value` (number 0-100), `target` (number 0-100), `label` (string)

**Formatter settings I want:**
- valueField, targetField, labelField (configurable field names)
- maxValue (default 100)
- accentColor (volt by default)
- showTarget (toggle)
- themeMode (auto/dark/light)
- accentIntensity (0-100)

**Requirements:**
- Must work in ad-hoc search (not just Dashboard Studio)
- Use lookups for demo data
- Include nav bar
- Build as tarball ready to install

Use the splunk-viz-packs plugin skills to build this: load vp-ref-gotchas, vp-viz, and vp-create.

---

## What to check after build (don't share with agent)

Open formatter.html and verify:
1. `name="{{VIZ_NAMESPACE}}.valueField"` — NOT `name="nike_gauge.nike_gauge.valueField"`
2. `value="value"` — NOT `default="value"`
3. `type="custom"` on the color picker
4. `value="auto"` on themeMode — NOT `value="dark"`
5. Every `<form>` has `class="splunk-formatter-section" section-label="..."`

Open visualization.js and verify:
6. No `getBoundingClientRect` — uses `clientWidth`/`clientHeight`
7. `detectTheme()` or `getCurrentTheme()` present
8. `safeStr()` or `!= null` guards on row data
9. No `new Date(string)`
10. Pure ES5 (no const/let/arrow)
