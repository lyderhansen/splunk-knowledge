# Test 28 — Full pack with tabs + drilldowns

## Prompt (copy-paste to fresh session)

---

Build me a Splunk Dashboard Studio dashboard + custom viz pack for **Cloudflare Network Operations**.

**Brand:** Cloudflare — technical, fast, orange. Think Cloudflare orange (#F6821F) on dark navy (#1B1B3A), clean monospace data, developer-focused. The brand is fast, protective, transparent.

**Audience:** NOC engineers monitoring global CDN health across edge locations, attack mitigation, and cache performance.

**Job to be done:** Spot edge location degradation, detect DDoS attacks early, and track cache hit ratios across regions — all from one dashboard.

**Tone words:** Fast, vigilant, technical

**Dashboard layout — 3 tabs:**

**Tab 1: Edge Health (default)**
- KPI strip — requests/sec, avg latency, cache hit ratio, error rate
- Edge location status grid — 20+ locations with health color (green/amber/red)
- Latency trend — 1-hour trend with threshold line

**Tab 2: Security**
- KPI strip — blocked requests, active mitigations, WAF triggers, bot score avg
- Attack timeline — recent attack events with severity and target zone
- Mitigation gauge — current mitigation rate vs capacity

**Tab 3: Cache Performance**
- KPI strip — cache hit %, bandwidth saved, origin pulls, purge count
- Cache ratio by content type — horizontal bars (HTML, JS, CSS, images, video)
- Origin pull trend — 24-hour trend

**Custom vizs (5 in the pack):**
- KPI tile (Cloudflare orange accent)
- Edge status grid (health matrix — green/amber/red cells)
- Trend line chart (with threshold)
- Attack timeline (scrolling event feed)
- Cache ratio bars (horizontal ranked bars)

**Drilldowns:**
- Click an edge location in the status grid → set a `$selected_edge$` token → filter latency trend to that edge
- Click an attack event in the timeline → drilldown to Splunk search with the attack ID

**Requirements:**
- Use lookups for demo data
- Dark theme primary, works in light
- Nav bar
- 3 tabs in the dashboard (use ds-int-tabs from splunk-dashboard-studio)
- Drilldown tokens between panels (use ds-int-drilldowns from splunk-dashboard-studio)
- Must work in Dashboard Studio AND ad-hoc search
- 5 custom vizs

Use the splunk-viz-packs plugin: load vp-couture for design, then vp-viz and vp-create. For the dashboard JSON with tabs and drilldowns, also load ds-int-tabs and ds-int-drilldowns from splunk-dashboard-studio. Write all viz code inline.

---
