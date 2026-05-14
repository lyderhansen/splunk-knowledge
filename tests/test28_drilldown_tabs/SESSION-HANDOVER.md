# Session Handover — 2026-05-13/14

## What happened this session

### Tests run

| Test | Brand | Vizs | Result | Key finding |
|---|---|---|---|---|
| test21 | Patagonia | 6 | 16 failures, 6 rounds | Wrapper div, Date(), null guards, theme, build regex |
| test22a | Nike (subagent) | 7 | 100% FAIL formatters | Subagent context dilution |
| test22b | Nike (subagent+templates) | 7 | 100% FAIL same | Templates don't help subagents |
| test22c | Nike (user-driven) | 1 | PASS | Proves skills work when user drives |
| test23 | Nike (user-driven) | 1 | PASS | Single viz, validator false positives found |
| test24 | Apple (user-driven) | 5 | PASS (contrast issues) | Light theme too faint, fontFamily enum |
| test25 | Hospital (v4) | 1 | B9+B10 fail, then PASS | Type format + namespace |
| test26 | Riot Games (v4) | 4+dash | B9 fail, then PASS | Type format still fails first try |
| test27 | Stripe (v4) | 4+table | PASS first-try (B9 fixed!) | hexFromSplunk, overrides-only, table features |
| test28 | Cloudflare (v4) | 5+tabs+drilldowns | PASS | Event handler fields, token consumption |

### Major restructure: v3.10.0 → v4.0.0

Rewrote all skills following official Claude Code skill best practices:
- Progressive disclosure (SKILL.md < 500 lines, references/, scripts/)
- Enhanced frontmatter (when_to_use, effort, allowed-tools, paths, model)
- Executable scripts (validate_viz.sh, build_flat.js)
- LOW freedom content (formatter/JS templates) kept in SKILL.md
- HIGH freedom content (blueprints, recipes, gotchas) moved to references/

Line count changes:
- vp-viz: 1473 → 417
- vp-couture: 1292 → 135
- vp-create: 1357 → 170
- vp-ref-gotchas: 1501 → 121
- vp-ref-patterns: 921 → 53
- Total: 5753 → 972

### Key discoveries

1. **Subagents lose code-level rules** — 100% failure in test22a/b/c. Inline execution mandatory.
2. **B9 type format** fails every test until placed as FIRST section ("STOP — read this first").
3. **Dashboard JSON options must be namespaced** — `app.viz.key` not bare `key`.
4. **hexFromSplunk()** needed — Splunk color pickers return integers.
5. **Dashboard options = only overrides** — don't duplicate formatter defaults.
6. **Progressive disclosure works** — 500-line limit respected, references loaded on demand.
7. **validate_viz.sh catches real errors** but has false positives (color picker close tags, comments).

### Rules added this session

| Rule | Description |
|---|---|
| B19 | new Date() fails in sandboxed iframe — use regex |
| B20 | Theme MUST default to 'auto' with detectTheme() DOM fallback |
| B21 | Null-guard String() conversion — safeStr() |
| R8 | preview.png required for every viz |
| #11 | Dashboard type = {app_id}.{viz_name} |
| #12 | Tarball = ONE top-level directory |
| #13 | hexFromSplunk() for color picker integers |
| #14 | Dashboard options = only overrides |
| #15 | preview.png with viz silhouette |
| #16 | Event handler fields from config |
| #17 | Drilldown tokens must be consumed |

### Current plugin versions

- splunk-viz-packs: v4.0.0 (on main, pushed)
- splunk-dashboard-studio: v3.3.1
- splunk-spl: v1.2.0

### Git state

Branch: main. Clean working tree. All pushed.
Latest commit: 6f000a6 (independent review fixes)

### Pending improvements (not done)

1. vp-init should ask all 5 design context questions (not just 2)
2. No Splunk test of v4 tabs+drilldowns (test28 built but not installed)
3. preview.png still bad in every test — needs scripts/generate_preview.py
4. appIcon.png missing in every test
5. Light theme never tested in Splunk
6. hexFromSplunk unverified in ad-hoc for tables
7. vp-ref-patterns too thin (53 lines)

### Memory files created/updated

- feedback_subagent_context_loss.md
- feedback_inline_not_subagent.md
- feedback_ds_fontfamily_enum.md
- feedback_light_theme_contrast.md
- feedback_download_real_logos.md
- feedback_viz_dynamic_sizing.md
