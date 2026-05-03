# Choropleth canvas templates for Splunk Dashboard Studio

Five starter templates for `splunk.choropleth.svg`. Each template includes a complete SVG canvas, an SPL binding query, and the threshold block for the dashboard JSON snippet. The four binding options (`areaIds`, `areaValues`, `areaColors`, `context.thresholds`) follow the generic recipe in the last section — only the threshold values differ per template.

**When to use this file:** You have a physical or logical topology you want to visualise in Studio and need a ready-made SVG + SPL pair to start from. Pick the template whose shape most closely matches your environment, swap the `id` attributes to match your SPL field values, adjust threshold ranges, and inline the escaped SVG string into the `"svg"` option.

**SVG size budget:** Keep inline SVG strings under 8 KB. All five canvases here are under 3 KB before escaping.

---

## 1. Server rack — front view

`viewBox="0 0 200 800"` — 10 addressable U-slots coloured by temperature.

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 800">
  <rect x="5" y="5" width="190" height="790"
        fill="none" stroke="#555555" stroke-width="4"/>
  <rect id="u01" x="10" y="10"  width="180" height="76" fill="#2a2a2a"/>
  <rect id="u02" x="10" y="88"  width="180" height="76" fill="#2a2a2a"/>
  <rect id="u03" x="10" y="166" width="180" height="76" fill="#2a2a2a"/>
  <rect id="u04" x="10" y="244" width="180" height="76" fill="#2a2a2a"/>
  <rect id="u05" x="10" y="322" width="180" height="76" fill="#2a2a2a"/>
  <rect id="u06" x="10" y="400" width="180" height="76" fill="#2a2a2a"/>
  <rect id="u07" x="10" y="478" width="180" height="76" fill="#2a2a2a"/>
  <rect id="u08" x="10" y="556" width="180" height="76" fill="#2a2a2a"/>
  <rect id="u09" x="10" y="634" width="180" height="76" fill="#2a2a2a"/>
  <rect id="u10" x="10" y="712" width="180" height="76" fill="#2a2a2a"/>
</svg>
```

**SPL:** `index=infrastructure sourcetype=hardware | stats avg(temperature) AS value BY rack_unit | rename rack_unit AS region`

**Thresholds:** OK `#36a44a` at 0 — Warning `#f4c51c` at 60 — Critical `#dc3333` at 80

**Customization:** Each slot is 76 px tall with a 2 px gap; slot N starts at `y = 10 + (N-1) * 78`. Extend to 42 U by repeating the pattern with IDs `u11`–`u42`.

---

## 2. Floor plan — data center room

`viewBox="0 0 1200 800"` — four temperature zones and two rack-row outlines, with a door gap in the south wall.

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800">
  <rect x="4" y="4" width="1192" height="792"
        fill="none" stroke="#777777" stroke-width="6"/>
  <!-- door gap: paint over south wall segment -->
  <rect x="540" y="791" width="120" height="10" fill="#1a1a2e"/>
  <rect id="zone_a" x="10"  y="10"  width="580" height="385" fill="#2a2a2a"/>
  <rect id="zone_b" x="610" y="10"  width="580" height="385" fill="#2a2a2a"/>
  <rect id="zone_c" x="10"  y="405" width="580" height="385" fill="#2a2a2a"/>
  <rect id="zone_d" x="610" y="405" width="580" height="385" fill="#2a2a2a"/>
  <rect id="rack_01" x="30"  y="60" width="120" height="280"
        fill="#2a2a2a" stroke="#444" stroke-width="2"/>
  <rect id="rack_02" x="630" y="60" width="120" height="280"
        fill="#2a2a2a" stroke="#444" stroke-width="2"/>
  <text x="300"  y="210" text-anchor="middle" font-family="monospace" font-size="24" fill="#555">ZONE A</text>
  <text x="900"  y="210" text-anchor="middle" font-family="monospace" font-size="24" fill="#555">ZONE B</text>
  <text x="300"  y="600" text-anchor="middle" font-family="monospace" font-size="24" fill="#555">ZONE C</text>
  <text x="900"  y="600" text-anchor="middle" font-family="monospace" font-size="24" fill="#555">ZONE D</text>
</svg>
```

**SPL:** `index=facilities sourcetype=sensors | stats latest(temp_celsius) AS value BY zone | rename zone AS region`

**Thresholds:** OK `#36a44a` at 0 — Warning `#f4c51c` at 25 — Critical `#dc3333` at 30

**Customization:** `rack_01` and `rack_02` are bound regions; include rack metrics in the same SPL using `append` or `union`. Door gaps are drawn by painting a same-background-colour `<rect>` over the wall stroke — no clip-path required.

---

## 3. Pipeline — horizontal flow

`viewBox="0 0 1000 200"` — five rounded-rect stages with arrowhead connectors, coloured by latency.

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 200">
  <defs>
    <marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
      <path d="M0 0 L6 3 L0 6 Z" fill="#666"/>
    </marker>
  </defs>
  <rect id="stage_ingest"  x="10"  y="40" width="160" height="120" rx="12" fill="#2a2a2a"/>
  <rect id="stage_parse"   x="210" y="40" width="160" height="120" rx="12" fill="#2a2a2a"/>
  <rect id="stage_enrich"  x="410" y="40" width="160" height="120" rx="12" fill="#2a2a2a"/>
  <rect id="stage_index"   x="610" y="40" width="160" height="120" rx="12" fill="#2a2a2a"/>
  <rect id="stage_search"  x="810" y="40" width="160" height="120" rx="12" fill="#2a2a2a"/>
  <path d="M170 100 L210 100" stroke="#666" stroke-width="3" marker-end="url(#arr)"/>
  <path d="M370 100 L410 100" stroke="#666" stroke-width="3" marker-end="url(#arr)"/>
  <path d="M570 100 L610 100" stroke="#666" stroke-width="3" marker-end="url(#arr)"/>
  <path d="M770 100 L810 100" stroke="#666" stroke-width="3" marker-end="url(#arr)"/>
  <text x="90"  y="105" text-anchor="middle" font-family="monospace" font-size="13" fill="#aaaaaa">INGEST</text>
  <text x="290" y="105" text-anchor="middle" font-family="monospace" font-size="13" fill="#aaaaaa">PARSE</text>
  <text x="490" y="105" text-anchor="middle" font-family="monospace" font-size="13" fill="#aaaaaa">ENRICH</text>
  <text x="690" y="105" text-anchor="middle" font-family="monospace" font-size="13" fill="#aaaaaa">INDEX</text>
  <text x="890" y="105" text-anchor="middle" font-family="monospace" font-size="13" fill="#aaaaaa">SEARCH</text>
</svg>
```

**SPL:** `index=_internal sourcetype=splunkd component=Metrics | stats avg(latency_ms) AS value BY pipeline_stage | rename pipeline_stage AS region`

**Thresholds:** OK `#36a44a` at 0 — Warning `#f4c51c` at 200 — Critical `#dc3333` at 500

**Customization:** Add branch stages by inserting additional `<rect>` elements offset vertically and connecting them with angled `<path>` arrows. Each stage needs a unique `id` and a matching row in SPL.

---

## 4. Network topology — hub and spoke

`viewBox="0 0 800 600"` — central core node (r=60) with six outer nodes (r=30), connected by decorative lines.

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
  <!-- spoke lines — decorative, no id -->
  <line x1="400" y1="300" x2="400" y2="90"  stroke="#444" stroke-width="2"/>
  <line x1="400" y1="300" x2="400" y2="510" stroke="#444" stroke-width="2"/>
  <line x1="400" y1="300" x2="192" y2="195" stroke="#444" stroke-width="2"/>
  <line x1="400" y1="300" x2="608" y2="195" stroke="#444" stroke-width="2"/>
  <line x1="400" y1="300" x2="192" y2="405" stroke="#444" stroke-width="2"/>
  <line x1="400" y1="300" x2="608" y2="405" stroke="#444" stroke-width="2"/>
  <circle id="node_core" cx="400" cy="300" r="60" fill="#2a2a2a"/>
  <circle id="node_fw01" cx="400" cy="90"  r="30" fill="#2a2a2a"/>
  <circle id="node_fw02" cx="400" cy="510" r="30" fill="#2a2a2a"/>
  <circle id="node_sw01" cx="192" cy="195" r="30" fill="#2a2a2a"/>
  <circle id="node_sw02" cx="608" cy="195" r="30" fill="#2a2a2a"/>
  <circle id="node_sw03" cx="192" cy="405" r="30" fill="#2a2a2a"/>
  <circle id="node_sw04" cx="608" cy="405" r="30" fill="#2a2a2a"/>
  <text x="400" y="304" text-anchor="middle" font-family="monospace" font-size="11" fill="#aaaaaa">CORE</text>
  <text x="400" y="94"  text-anchor="middle" font-family="monospace" font-size="9"  fill="#aaaaaa">FW01</text>
  <text x="400" y="514" text-anchor="middle" font-family="monospace" font-size="9"  fill="#aaaaaa">FW02</text>
  <text x="192" y="199" text-anchor="middle" font-family="monospace" font-size="9"  fill="#aaaaaa">SW01</text>
  <text x="608" y="199" text-anchor="middle" font-family="monospace" font-size="9"  fill="#aaaaaa">SW02</text>
  <text x="192" y="409" text-anchor="middle" font-family="monospace" font-size="9"  fill="#aaaaaa">SW03</text>
  <text x="608" y="409" text-anchor="middle" font-family="monospace" font-size="9"  fill="#aaaaaa">SW04</text>
</svg>
```

**SPL:** `index=network sourcetype=snmp | stats latest(status_code) AS value BY device_id | rename device_id AS region`

**Thresholds:** OK `#36a44a` at 0 — Warning `#f4c51c` at 1 — Critical `#dc3333` at 2

**Customization:** To colour link health, give each `<line>` an `id` such as `link_core_fw01` and include those IDs in SPL. Draw lines before nodes in SVG source so nodes render on top.

---

## 5. Office building — multi-room

`viewBox="0 0 1000 600"` — four numbered rooms, a lobby, and a server room; coloured by occupancy count.

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 600">
  <rect x="5" y="5" width="990" height="590"
        fill="none" stroke="#777777" stroke-width="6"/>
  <!-- interior walls -->
  <line x1="5"   y1="300" x2="995"  y2="300" stroke="#777777" stroke-width="3"/>
  <line x1="250" y1="5"   x2="250"  y2="300" stroke="#777777" stroke-width="3"/>
  <line x1="500" y1="5"   x2="500"  y2="300" stroke="#777777" stroke-width="3"/>
  <line x1="750" y1="5"   x2="750"  y2="300" stroke="#777777" stroke-width="3"/>
  <line x1="600" y1="300" x2="600"  y2="595" stroke="#777777" stroke-width="3"/>
  <!-- rooms -->
  <rect id="room_101" x="10"  y="10"  width="235" height="285" fill="#2a2a2a"/>
  <rect id="room_102" x="255" y="10"  width="240" height="285" fill="#2a2a2a"/>
  <rect id="room_103" x="505" y="10"  width="240" height="285" fill="#2a2a2a"/>
  <rect id="room_104" x="755" y="10"  width="235" height="285" fill="#2a2a2a"/>
  <rect id="lobby"       x="10"  y="305" width="585" height="285" fill="#2a2a2a"/>
  <rect id="server_room" x="605" y="305" width="385" height="285" fill="#2a2a2a"/>
  <text x="127" y="155" text-anchor="middle" font-family="monospace" font-size="16" fill="#555">101</text>
  <text x="375" y="155" text-anchor="middle" font-family="monospace" font-size="16" fill="#555">102</text>
  <text x="625" y="155" text-anchor="middle" font-family="monospace" font-size="16" fill="#555">103</text>
  <text x="872" y="155" text-anchor="middle" font-family="monospace" font-size="16" fill="#555">104</text>
  <text x="302" y="450" text-anchor="middle" font-family="monospace" font-size="16" fill="#555">LOBBY</text>
  <text x="797" y="450" text-anchor="middle" font-family="monospace" font-size="16" fill="#555">SERVER</text>
</svg>
```

**SPL:** `index=physical_security sourcetype=badge_reader | stats dc(badge_id) AS value BY room | rename room AS region`

**Thresholds:** OK `#36a44a` at 0 — Warning `#f4c51c` at 10 — Critical `#dc3333` at 25

**Customization:** Add a second floor by wrapping a duplicate room set in `<g transform="translate(0, 620)">` and prefixing IDs with the floor number (`f2_room_201`).

---

## Region-ID naming conventions

- Lowercase with underscores: `zone_a`, `rack_01`, `room_101`, `node_core`
- IDs must match SPL field values exactly — case sensitive, character for character
- Avoid hyphens: some Splunk versions have inconsistent `areaIds` binding for hyphenated values
- Group related regions with a shared prefix (`node_*`, `link_*`, `stage_*`) so SPL can filter by type
- Never reuse an ID within an SVG; browsers silently ignore duplicates and binding fails without error
- IDs are case-sensitive: `Zone_A` and `zone_a` are different — pick one convention and apply it everywhere
- Prefer numeric suffixes with zero-padding for ordered sets: `rack_01` sorts correctly; `rack_1` does not

---

## SPL binding recipe (generic)

Paste these four option keys into any `splunk.choropleth.svg` definition:

```json
"areaIds":    "> primary | seriesByName('region')",
"areaValues": "> primary | seriesByName('value')",
"areaColors": "> areaValues | rangeValue(thresholds)",
"context": {
  "thresholds": { "type": "range", "ranges": [
    { "from": 0,  "to": 60, "value": "#36a44a" },
    { "from": 60, "to": 80, "value": "#f4c51c" },
    { "from": 80,           "value": "#dc3333" }
  ]}
}
```

SPL must return `region` and `value`. Any SVG `id` absent from results keeps its default `fill`. Add `| fillnull value=0` after `stats` to ensure every region receives a colour even when no events match.

Common pitfalls:
- Forgetting `| rename <field> AS region` — Studio requires the literal field name `region`
- Using `eval` instead of `stats` — `areaValues` expects one row per region, not raw events
- Threshold `from`/`to` ranges are inclusive on `from` and exclusive on `to`; the last range omits `to` to act as an open upper bound
- Inline SVG must be JSON-escaped: replace `"` with `\"` inside the `"svg"` string value
- Newlines inside the SVG string must be removed or replaced with a space; multi-line SVG strings cause JSON parse errors in some Splunk versions

---

## See also

- `SVG-CONVENTIONS.md` — coordinate system, units, and stroke conventions
- `ICON-PATTERNS.md` — reusable icon sprites and symbol definitions
- `SVG-AUTHORING.md` — inline vs. external SVG, escaping rules, size limits
- Skill `ds-viz-choropleth-svg` — Studio option reference and binding deep-dive
