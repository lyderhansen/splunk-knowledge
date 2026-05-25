# splunk-custom-viz plugin references

Plugin-root reference docs. Authoritative material that any cv-* skill may load on demand.

## Files

### `splunk-viz-canon.md`

**Source:** `~/.claude/skills/splunk-viz/SKILL.md` (verbatim copy, 1047 lines, 26 rules + Canvas recipes + viz type guidance + verification checklist).

This is the canonical knowledge base for Splunk Canvas 2D visualization development — independently iterated on the standalone `splunk-viz` skill over many production builds. Treated here as the **source of truth** for:

- ES5 / AMD module rules (Rules 1-13)
- Real-time search handling, no-data state, data caching (Rule 20)
- `VisualizationError` for the only Dashboard Studio v2 no-data message that works
- `formatData` must NOT read `config` (Rule 21) — causes Splunk caching inconsistency
- Formatter `value="..."` defaults MUST exactly match JS `||` fallbacks (Rule 19)
- Canvas state leaks — reset `ctx.shadowBlur` and `ctx.globalAlpha` after use (Rules 5/6)
- XSS prevention via `SplunkVisualizationUtils.escapeHtml` (Rule 14) — required for Splunk certification
- Configurable field names for shared searches (Rule 18)
- Custom font loading via base64 embedding in `visualization.css` (Rule 10) — the only reliable mechanism for Splunk Canvas
- Drilldown from Canvas: hit-rect pattern + cursor management + Dashboard Studio config caveat (Rule 25)
- Use original ingested field names, never require `as` aliases (Rule 26)
- Build / install / `/_bump` reload conventions
- Reusable Canvas recipes — `lerpColor`, `valueToColor`, `roundRect`, `drawArc`, `drawLegend`, `gridLayout`, `fitText`, `findHitRect`

When `KNOWN-CORRECTIONS.md` references a rule by number (e.g., "see Rule 21"), the number maps to this file.

**Maintenance:** copied verbatim from the standalone skill. To refresh after upstream changes:

```bash
cp ~/.claude/skills/splunk-viz/SKILL.md plugins/splunk-custom-viz/references/splunk-viz-canon.md
```

Do not edit `splunk-viz-canon.md` directly — edit the upstream and re-copy. Plugin-specific extensions live in skill reference docs (`skills/cv-*/references/`) and reference rules from canon by number.
