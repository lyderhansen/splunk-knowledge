# Phase 26: Multi-Channel Archetype - Context

**Gathered:** 2026-05-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Pure documentation/reference work: add a "Multi-Channel Composite" archetype entry to viz-blueprints.md with full Canvas rendering guidance, and update domain-templates.md entries for F1/motorsport, healthcare monitoring, and network ops to reference it with concrete channel configurations. No code changes — this is blueprint and template content only.

</domain>

<decisions>
## Implementation Decisions

### D-01: F1 telemetry-style stacked layout (MC-01)

Multi-Channel Composite uses stacked horizontal strips with a shared time x-axis. Each channel gets its own independent y-scale. All channels have fixed equal height. Hover on one channel shows a vertical cursor line across ALL channels at the same x position (synchronized crosshair).

### D-02: 3-6 channels with left-side labels (MC-01)

Minimum 3 channels, maximum 6. Each channel displays a small label on the left edge showing channel name + current value at cursor position. Y-axis ticks render inside the channel strip (not on a separate axis area). More than 6 would make each strip too thin to read at standard panel sizes.

### D-03: Full entry with Canvas guidance, ~60 lines (MC-01)

viz-blueprints.md gets a full archetype entry (~60 lines) including Canvas rendering notes: how to divide the canvas into equal-height strips, how to draw the synchronized crosshair line across all channels, and how to scale y-axes independently per channel. File will reach ~570 lines — acceptable given the complexity of the pattern.

### D-04: F1/motorsport channels — 5 channels (MC-02)

F1 domain entry specifies these 5 channels:
1. Throttle % (0-100, line fill)
2. Brake % (0-100, line fill)
3. Speed km/h (0-350, line)
4. Gear (discrete 1-8, step line)
5. ERS charge % (0-100, area fill)

### D-05: Healthcare monitoring channels — 4 channels (MC-02)

Healthcare domain entry specifies these 4 standard patient vitals:
1. Heart Rate (bpm, line)
2. SpO2 (%, line with threshold band)
3. Respiration Rate (breaths/min, line)
4. Blood Pressure (mmHg systolic/diastolic, dual line)

### D-06: Network ops channels — 4 channels (MC-02)

Network ops domain entry specifies these 4 standard NOC metrics:
1. Throughput (Mbps, area fill)
2. Latency (ms, line with threshold)
3. Error Rate (%, bar/line)
4. CPU Utilization (%, area fill)

### Claude's Discretion

- Exact pixel dimensions for channel strip dividers and label areas
- Color assignment strategy for channels (use brand series colors s1-s6 or generate from accent)
- Crosshair line styling (solid vs dashed, color, thickness)
- Whether to include a mini time-axis label at the bottom or rely on hover tooltip for time values
- Channel rendering style per data type (line, area fill, step line) — the domain entries suggest defaults but Claude can adapt per brand

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Viz blueprints
- `plugins/splunk-viz-packs/skills/vp-viz/references/viz-blueprints.md` — current archetype entries and animation settings; new Multi-Channel entry goes here

### Domain templates
- `plugins/splunk-viz-packs/skills/vp-design/references/domain-templates.md` — domain viz inventories (F1, Healthcare, Network/NOC sections need multi-channel references)

### Animation recipes
- `plugins/splunk-viz-packs/skills/vp-viz/references/animation-recipes.md` — entrance and LED pulse boilerplates; multi-channel archetype should reference the generic entrance boilerplate

### Theme and consistency
- `plugins/splunk-viz-packs/skills/vp-viz/references/consistency-grid.md` — cross-viz consistency contract (spacing, colors, typography rules that apply to multi-channel)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- viz-blueprints.md animation settings block (lines 34-90): established pattern for documenting per-viz-type animation controls — multi-channel entry should follow same format
- domain-templates.md F1 Racing section: already has 6 domain-specific viz types — multi-channel composite adds a 7th that cross-references channels

### Established Patterns
- Each viz-blueprints.md entry includes: description, data contract (fields), settings list, animation notes
- Each domain-templates.md entry includes: domain visual language paragraph, viz table with purpose column, optional data format notes
- viz-blueprints.md is at 506 lines — the ~60 line addition brings it to ~570, still within reasonable reference file size

### Integration Points
- viz-blueprints.md archetype entry will be referenced by Claude during vp-viz code generation
- domain-templates.md channel configurations will be used during vp-design brand research step
- No code changes needed — generate_assets.js, validate_viz.sh, and formatters are unaffected

</code_context>

<specifics>
## Specific Ideas

- F1 telemetry is the canonical reference: stacked throttle/brake/speed/gear/ERS strips with synchronized time cursor — this is what real F1 data analysis tools look like
- Healthcare monitoring should feel like a bedside patient monitor — continuous waveforms with alarm thresholds
- Network ops should feel like a NOC dashboard — throughput and latency as the primary visual, errors as alert overlay

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 26-multi-channel-archetype*
*Context gathered: 2026-05-21*
