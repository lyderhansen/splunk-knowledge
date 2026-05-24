# Phase 3: Discussion Log

**Date:** 2026-05-15
**Areas discussed:** 2 of 4 presented

## Areas Presented
1. Repair loop scope (SELECTED)
2. Fix strategy (SELECTED)
3. WCAG contrast checker (not selected)
4. Repair log format (not selected)

## Discussion: Repair Loop Scope

### Question 1: Which failure codes should auto-fix?
**Options:** B10 only | B10 + B9 + DS1 | All fixable codes
**Selected:** All fixable codes
**Notes:** User wants maximum automation. Auto-fix covers B10 (bare keys), B9 (custom. prefix), B5 (type=custom), B7 (value= vs default=), B20 (themeMode default).

### Question 2: How to handle DS1 and XFILE?
**Options:** Report only | Best-guess fix
**Selected:** Report only
**Notes:** These need judgment about correct fix. Mechanical fixes only for the repair loop.

## Discussion: Fix Strategy

### Question 3: Orchestration approach?
**Options:** Shell loop in validate_viz.sh | Separate script | Node-only pipeline
**Selected:** Shell loop in validate_viz.sh (--repair flag)
**Notes:** Keeps single entry point pattern from Phase 1.

### Question 4: Rebuild after fixing?
**Options:** Fix + rebuild + re-validate | Fix + re-validate only
**Selected:** Fix + rebuild + re-validate
**Notes:** Full cycle ensures packaged output reflects fixes. Matches success criteria #1.

## Claude's Discretion Items
- WCAG contrast checker implementation (D-10 through D-13 in CONTEXT.md)
- Repair log format — structured and machine-parseable, exact format TBD
- check_contrast.js integration into validate_viz.sh or standalone
- repair_findings.js internal structure and per-code dispatch

---

*Phase: 3-Repair Loop & Light Theme Safety*
*Discussion: 2026-05-15*
