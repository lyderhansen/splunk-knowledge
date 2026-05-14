# Test 27 — Full pack with table viz

## Prompt (copy-paste to fresh session)

---

Build me a Splunk Dashboard Studio dashboard + custom viz pack for **Stripe Payment Operations**.

**Brand:** Stripe — refined, precise, quiet confidence. Think indigo (#635BFF) accent on clean white (#FAFAFA), with deep navy (#0A2540) for dark mode. Minimal decoration, perfect typography, data speaks for itself. The brand is professional, trustworthy, developer-friendly.

**Audience:** Payment operations team monitoring transaction health, failure rates, dispute trends, and merchant onboarding metrics.

**Job to be done:** Spot payment processing issues fast — rising failure rates, dispute spikes, slow settlements, or merchant onboarding bottlenecks.

**Tone words:** Precise, trustworthy, minimal

**Panels I want:**
1. KPI strip — total volume processed, success rate, avg settlement time, active disputes
2. Transaction table — recent transactions with amount, status, merchant, timestamp. Must have sort on all columns, pagination, and ability to hide columns
3. Failure rate trend — 24-hour line showing failure % with threshold
4. Dispute tracker — gauge showing open disputes vs SLA limit

**Custom vizs (4 in the pack):**
- A Stripe-styled KPI tile (clean, minimal, precise typography)
- A transaction data table with sort, pagination, column hide, and column width control
- A failure trend line chart with threshold marker
- A dispute gauge (ring style, indigo gradient)

**Requirements:**
- Use lookups for demo data
- Light theme primary (Stripe aesthetic), works in dark too
- Nav bar in the Splunk app
- Must work in both Dashboard Studio AND ad-hoc search
- The table MUST support: sorting all columns, pagination with maxRows setting, hiding columns, and adjustable column widths

Use the splunk-viz-packs plugin: load vp-couture for design, then vp-viz and vp-create. Write all viz code inline.

---
