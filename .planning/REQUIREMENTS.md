# Requirements: splunk-knowledge — v5.7.0 Real Brand End-to-End Validation

**Defined:** 2026-05-22
**Core Value:** Run the full /vp-init → /vp-design → /vp-viz → /vp-create pipeline with a real brand and document every issue that surfaces — the ultimate validation of all v4-v5.6 improvements.

## v1 Requirements

### Pipeline Execution (PE)

- [ ] **PE-01**: A complete Classic path test build runs from /vp-init through /vp-create producing a .tar.gz with 5+ vizs, a branded dashboard, and all assets — without any manual intervention beyond the initial brand prompt
- [ ] **PE-02**: validate_viz.sh passes with zero FAIL findings on the generated Classic pack — all B-codes, D-codes, and F-codes clean
- [ ] **PE-03**: validate_viz.sh --score produces aesthetic scores for each viz — no viz scores below 40/100
- [ ] **PE-04**: The generated dashboard opens in Splunk Dashboard Studio without errors (verified by structure inspection if no Splunk instance)

### Extension API Validation (EV)

- [ ] **EV-01**: A complete Extension API path test build runs for the same brand producing a .spl with 3+ vizs — reusing the same brand research and visual language
- [ ] **EV-02**: validate_viz.sh passes E01-E05 with zero FAIL findings on the Extension API pack
- [ ] **EV-03**: The Extension API .spl has correct internal structure (framework_type=studio_visualization, config.json + visualization.js per viz)

### Findings & Fixes (FF)

- [ ] **FF-01**: A TEST_REPORT.md documents every issue found during both builds — categorized as FIXED (resolved in-flight), KNOWN (documented for future fix), or WONTFIX
- [ ] **FF-02**: Any FIXED issues are committed as atomic fixes with clear descriptions — the test build doubles as a bug-fixing session
- [ ] **FF-03**: The test report includes a side-by-side comparison of Classic vs Extension API output quality — which worked better, which had more issues, what needs improving

## Future Requirements

- Automated regression test suite that runs the full pipeline on CI
- Multi-brand test matrix (5+ brands across different domains)
- Splunk instance integration testing (install .tar.gz / .spl, verify renders)

## Out of Scope

- Fixing the light mode backgroundColor bug (known, documented, separate fix)
- Adding new domain-specific viz types
- Modifying the Extension API templates (those ship as-is from v5.6.0)
- Performance optimization

## Traceability

| Requirement | Phase | Plan | Status |
|-------------|-------|------|--------|
| PE-01 | TBD | - | pending |
| PE-02 | TBD | - | pending |
| PE-03 | TBD | - | pending |
| PE-04 | TBD | - | pending |
| EV-01 | TBD | - | pending |
| EV-02 | TBD | - | pending |
| EV-03 | TBD | - | pending |
| FF-01 | TBD | - | pending |
| FF-02 | TBD | - | pending |
| FF-03 | TBD | - | pending |
