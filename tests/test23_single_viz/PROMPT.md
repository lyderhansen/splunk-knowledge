# Test 23 — Single viz with vp-* skills

## Prompt (copy-paste to fresh session)

---

Build me ONE custom Splunk visualization app. Use the splunk-viz-packs plugin — load vp-ref-gotchas, vp-viz, and vp-create before writing any code.

**App name:** `nike_gauge`

**What it does:** A circular engagement gauge. Arc from 0% to 100% showing a metric vs a target. When the value exceeds the target, the arc turns green. Below target = amber accent.

**Visual style:** Nike-inspired — volt (#CDFF00) accent on near-black (#0A0A0A). Bold, high-contrast. System fonts only.

**Expected SPL:**
```
| inputlookup nike_gauge_demo.csv
```
Columns: `value` (number 0-100), `target` (number 0-100), `label` (string)

**Formatter settings:**
- valueField, targetField, labelField (text inputs — configurable field names)
- maxValue (text input, default "100")
- showTarget (radio: Show/Hide, default "true")
- accentColor (color picker, default #CDFF00)
- themeMode (radio: Auto/Dark/Light, default "auto")
- accentIntensity (text input, default "50")

**Requirements:**
- Include a CSV lookup with demo data
- Include nav bar (default.xml)
- Build flat AMD and package as tarball
- Must work in ad-hoc search

After building, run the validate_viz.sh script from vp-create on the app directory and fix any failures before packaging.

---

## Validation checklist (for me, not the agent)

### Formatter (formatter.html)
- [ ] `name="{{VIZ_NAMESPACE}}.valueField"` — NOT hardcoded namespace
- [ ] `value="value"` — NOT `default="value"`
- [ ] `type="custom"` on accentColor color picker
- [ ] `value="auto"` on themeMode
- [ ] Every `<form>` has `class="splunk-formatter-section" section-label="..."`
- [ ] At least 8 controls total

### JS (visualization.js)
- [ ] No `getBoundingClientRect` — uses `clientWidth`/`clientHeight`
- [ ] `detectTheme()` or `getCurrentTheme()` present
- [ ] `safeStr()` or `!= null` guards
- [ ] No `new Date(string)`
- [ ] Pure ES5 (no const/let/arrow)
- [ ] `require()`/`module.exports` pattern (not `define()`)
- [ ] `clearRect` for background (not fillRect)

### Structure
- [ ] `allow_user_selection = true` + `disabled = 0`
- [ ] `savedsearches.conf.spec` exists
- [ ] Nav bar exists
- [ ] Tarball > 1KB
