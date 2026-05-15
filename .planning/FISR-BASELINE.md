# FISR Baseline — Tests 21-28

**Scored:** 2026-05-15
**Definition:** PASS = builds without error AND renders data in Splunk AND formatter settings apply
**Scoring source:** validate_viz.sh output for Build-OK; HANDOVER.md/SESSION-HANDOVER.md/RESULTS.md for Render-OK and Settings-OK

## Scoring Notes

- **Build-OK:** Determined by running `validate_viz.sh` on unpacked app directories. N = any FAIL code present. Y = all checks pass (WARN-only does not count as FAIL). ? = tarball-only session, no unpacked dir to validate.
- **Render-OK:** Determined from session handover notes. Y = handover explicitly confirms viz rendered data in Splunk. N = handover documents rendering failure. ? = no Splunk install confirmed in session.
- **Settings-OK:** Determined from session handover notes. Y = formatter settings panel confirmed working. N = formatter bugs documented. ? = not tested or unknown.
- **FISR:** PASS only when all three dimensions are Y. FAIL if any dimension is N. ? = insufficient evidence to score.

## Per-Viz Table

| Test | App | Viz | Build-OK | Render-OK | Settings-OK | FISR | Notes |
|------|-----|-----|----------|-----------|-------------|------|-------|
| test21 | patagonia_outdoor_ops | alert_feed | N | ? | ? | FAIL | B7 (13 default= attrs), B21 (no null guards), R8 (no preview.png); viz had rendering bugs (Date(), null, wrapper div) fixed across 6 rounds but no confirmed Splunk install |
| test21 | patagonia_outdoor_ops | inventory_bars | N | ? | ? | FAIL | B7 (12 default= attrs), B21 (no null guards), R8 (no preview.png) |
| test21 | patagonia_outdoor_ops | patagonia_kpi | N | ? | ? | FAIL | B7 (14 default= attrs), R8 (no preview.png); WARN B17 only |
| test21 | patagonia_outdoor_ops | regional_bars | N | ? | ? | FAIL | B7 (11 default= attrs), B21 (no null guards), R8 (no preview.png) |
| test21 | patagonia_outdoor_ops | sustainability_gauge | N | ? | ? | FAIL | B7 (11 default= attrs), B21 (no null guards), R8 (no preview.png); arc overflow bug documented |
| test21 | patagonia_outdoor_ops | trend_area | N | ? | ? | FAIL | B7 (10 default= attrs), B21 (no null guards), R8 (no preview.png) |
| test22 | nike_training_club | kpi_tile | ? | ? | ? | ? | self-reported from RESULTS.md; tarball-only session; RESULTS.md: 120 PASS, 0 FAIL — but SESSION-HANDOVER confirms test22a/b were subagent builds with "100% FAIL formatters" |
| test22 | nike_training_club | program_bars | ? | ? | ? | ? | self-reported from RESULTS.md; tarball-only session; same note as above |
| test22 | nike_training_club | trend_chart | ? | ? | ? | ? | self-reported from RESULTS.md; tarball-only session |
| test22 | nike_training_club | trainer_board | ? | ? | ? | ? | self-reported from RESULTS.md; tarball-only session |
| test22 | nike_training_club | city_grid | ? | ? | ? | ? | self-reported from RESULTS.md; tarball-only session |
| test22 | nike_training_club | activity_feed | ? | ? | ? | ? | self-reported from RESULTS.md; tarball-only session |
| test22 | nike_training_club | engagement_gauge | ? | ? | ? | ? | self-reported from RESULTS.md; tarball-only session |
| test22b | nike_training_club | kpi_tile | ? | ? | ? | ? | self-reported from RESULTS.md; tarball-only session; SESSION-HANDOVER: test22b also subagent build, "100% FAIL formatters" — score conservative as FAIL |
| test22b | nike_training_club | program_bars | ? | N | N | ? | self-reported from RESULTS.md; tarball-only; SESSION-HANDOVER confirms 100% formatter FAIL from subagent; conservative scoring |
| test22b | nike_training_club | trend_chart | ? | N | N | ? | self-reported from RESULTS.md; tarball-only; SESSION-HANDOVER confirms 100% formatter FAIL |
| test22b | nike_training_club | trainer_board | ? | N | N | ? | self-reported from RESULTS.md; tarball-only; SESSION-HANDOVER confirms 100% formatter FAIL |
| test22b | nike_training_club | city_grid | ? | N | N | ? | self-reported from RESULTS.md; tarball-only; SESSION-HANDOVER confirms 100% formatter FAIL |
| test22b | nike_training_club | activity_feed | ? | N | N | ? | self-reported from RESULTS.md; tarball-only; SESSION-HANDOVER confirms 100% formatter FAIL |
| test22b | nike_training_club | engagement_gauge | ? | N | N | ? | self-reported from RESULTS.md; tarball-only; SESSION-HANDOVER confirms 100% formatter FAIL |
| test22c | nike_training_club | kpi_tile | ? | ? | ? | ? | self-reported from RESULTS.md; tarball-only; 23 PASS/0 FAIL per RESULTS.md; user-driven build (not subagent) |
| test22c | nike_training_club | engagement_gauge | ? | ? | ? | ? | self-reported from RESULTS.md; tarball-only |
| test22c | nike_training_club | trainer_board | ? | ? | ? | ? | self-reported from RESULTS.md; tarball-only |
| test22c | nike_training_club | program_bars | ? | ? | ? | ? | self-reported from RESULTS.md; tarball-only |
| test23 | nike_gauge_single | engagement_gauge | Y | Y | Y | PASS | Validator: ALL CHECKS PASSED; HANDOVER: "Works in both contexts — all 5 vizs render in Dashboard Studio AND ad-hoc search. Formatter settings show and apply correctly in both contexts." |
| test24 | apple_retail_viz | kpi_tile | N | Y | Y | FAIL | FAIL: missing appIcon, allow_user_selection, savedsearches.conf.spec; HANDOVER: renders but light theme text "nearly invisible" (contrast issue, not total failure); settings apply |
| test24 | apple_retail_viz | revenue_bars | N | Y | Y | FAIL | Same structural FAILs; HANDOVER: "closest to Apple aesthetic" — confirmed rendering |
| test24 | apple_retail_viz | satisfaction_gauge | N | Y | Y | FAIL | Same structural FAILs; HANDOVER: gauge text overlap documented but renders |
| test24 | apple_retail_viz | product_mix | N | Y | Y | FAIL | Same structural FAILs; HANDOVER: donut renders, center readout contrast issue |
| test24 | apple_retail_viz | alert_feed | N | Y | Y | FAIL | Same structural FAILs; HANDOVER: "scrollable with wheel support" — renders |
| test25 | hospital_nps_gauge | nps_ring_gauge | N | Y | ? | FAIL | FAIL R8: preview.png too small (68 bytes); SESSION-HANDOVER: "B9+B10 fail, then PASS" — viz renders after fixes; settings verified (B9/B10 were namespace fixes) |
| test26 | riot_liveops_viz | riot_kpi_tile | N | ? | ? | FAIL | FAIL R8 (no preview.png), missing appIcon; HANDOVER: macOS tar resource forks blocked install initially; "All pass validate_viz.sh (preview.png warnings only)" but no confirmed Splunk render in HANDOVER |
| test26 | riot_liveops_viz | riot_latency_bars | N | ? | ? | FAIL | FAIL R8 (no preview.png); same session — no confirmed Splunk render |
| test26 | riot_liveops_viz | riot_load_gauge | N | ? | ? | FAIL | FAIL R8 (no preview.png); same session |
| test26 | riot_liveops_viz | riot_incident_feed | N | ? | ? | FAIL | FAIL R8 (no preview.png); same session |
| test27 | stripe_payment_ops_viz | stripe_kpi | N | ? | ? | FAIL | FAIL R8 (no preview.png), missing appIcon; HANDOVER lists "Install and verify in Splunk" as future action — not tested |
| test27 | stripe_payment_ops_viz | stripe_table | N | ? | N | FAIL | FAIL R8 (no preview.png), missing appIcon; HANDOVER: "accentColor does not apply on stripe_table in ad-hoc search" — documented Settings-OK=N bug |
| test27 | stripe_payment_ops_viz | stripe_trend | N | ? | ? | FAIL | FAIL R8 (no preview.png), missing appIcon; not tested in Splunk |
| test27 | stripe_payment_ops_viz | stripe_gauge | N | ? | ? | FAIL | FAIL R8 (no preview.png), missing appIcon; not tested in Splunk |
| test28 | cloudflare_noc | cf_kpi_tile | N | ? | ? | FAIL | FAIL: missing appIcon only (all formatter + JS checks pass); HANDOVER: "No real Splunk testing (no instance available in this session)" |
| test28 | cloudflare_noc | cf_edge_grid | N | ? | ? | FAIL | Same — appIcon FAIL only; drilldown setToken bug fixed during session; no Splunk testing |
| test28 | cloudflare_noc | cf_trend_line | N | ? | ? | FAIL | Same — appIcon FAIL only; no Splunk testing |
| test28 | cloudflare_noc | cf_attack_timeline | N | ? | ? | FAIL | Same — appIcon FAIL only; no Splunk testing |
| test28 | cloudflare_noc | cf_cache_bars | N | ? | ? | FAIL | Same — appIcon FAIL only; no Splunk testing |

## Scoring Summary

### FISR Calculation

**Scoreable vizs** (rows where all three dimensions have a definitive Y or N, not all-?):

| Test | Scoreable Vizs | PASS | FAIL |
|------|---------------|------|------|
| test21 | 6 | 0 | 6 |
| test22 | 0 (all ?) | 0 | 0 |
| test22b | 0 (conservative: ? on Build-OK, N on Render/Settings — excluded from denominator per D-05/D-06 since build cannot be verified) | 0 | 0 |
| test22c | 0 (all ?) | 0 | 0 |
| test23 | 1 | 1 | 0 |
| test24 | 5 | 0 | 5 |
| test25 | 1 | 0 | 1 |
| test26 | 4 | 0 | 4 |
| test27 | 4 | 0 | 4 |
| test28 | 5 | 0 | 5 |

**Total scoreable:** 26 vizs
**PASS:** 1 viz (test23 engagement_gauge)
**FAIL:** 25 vizs

**FISR Score:** 1 / 26 vizs passing = **3.8%**

> Note: The 11 test22/22b/22c vizs with all-? dimensions are excluded from the FISR denominator because no unpacked app directory exists for validator-based build scoring (Pitfall 4 in RESEARCH.md). If test22c user-driven vizs (4 vizs, 23 PASS/0 FAIL self-reported) were included as passing, FISR would be 5/30 = 16.7%. The conservative number (3.8%) is used as the baseline.

## Failure Pattern Analysis

| Failure Category | Tests Affected | Primary Cause |
|-----------------|----------------|---------------|
| Missing appIcon.png | test24, test26, test27, test28 | Skill gap R-series: appIcon not generated |
| Missing preview.png / too small | test21, test25, test26, test27 | R8 rule added after test21 but size check still catching issues |
| B7 (default= attrs) | test21 (all 6 vizs) | Skill gap pre-B7 enforcement — fixed in v4.0.0 |
| B21 (no null guards) | test21 (5 vizs) | Skill gap pre-safeStr/safeNum patterns |
| allow_user_selection missing | test24 | Scaffolding template gap |
| savedsearches.conf.spec missing | test24 | Scaffolding template gap |
| No Splunk testing | test26, test27, test28 | Sessions ended before install step |
| Formatter failures (subagent) | test22, test22b | Subagent context dilution (100% FAIL) |
| hexFromSplunk bug (Settings-OK) | test27 (stripe_table) | Color picker integer format not handled |
| Light theme contrast | test24 | textDim/textMuted used instead of full t.text |

## Baseline Acceptance

This baseline serves as the measurement start point for Phase 1. The 3.8% FISR (1/26 scoreable vizs) represents the state of the splunk-viz-packs plugin as of tests 21-28 before Phase 1 improvements. Key drivers:

1. **Structural failures dominate:** Most Build-OK=N cases are missing appIcon/preview.png, not broken code logic.
2. **No Splunk install confirmation** for 5 of 8 test sessions — Render-OK/Settings-OK are ? rather than verified Y.
3. **test23 is the only confirmed FISR PASS** — single viz, user-driven, tested in Splunk.
4. **test24 gets partial credit** — 5 vizs render and settings work, but structural failures (appIcon, allow_user_selection) mark Build-OK=N.

Future phases can compare against this 3.8% baseline. If structural issues (appIcon, preview.png) are addressed, the true PASS rate for "code works correctly" is higher (test24 5 vizs, test25 nps_ring_gauge, test28 5 vizs all have correct formatter/JS checks — only structure fails them).
