# Test 26 — Full viz pack (v4.0.0)

## Prompt (copy-paste to fresh session)

---

Build me a Splunk Dashboard Studio dashboard + custom viz pack for **Riot Games Live Ops** (League of Legends game operations).

**Brand:** Riot Games — bold, dark, cinematic. Think hextech blue (#0AC8B9) and gold (#C89B3C) on deep black (#010A13). Sharp angles, glowing edges, fantasy-tech aesthetic. The brand is epic, competitive, immersive.

**Audience:** Live ops engineers monitoring game server health, match quality, player experience metrics across 12 regions.

**Job to be done:** Detect degraded game experience before players complain — high latency regions, match quality drops, queue time spikes, and service incidents.

**Tone words:** Epic, vigilant, immersive

**Panels I want:**
1. KPI strip — active players online, avg match latency, queue time, incident count
2. Regional latency comparison — horizontal bars showing latency per region (NA, EUW, EUNE, KR, etc)
3. Match quality trend — 24-hour trend line showing match quality score
4. Incident feed — recent service incidents with severity and affected region
5. Player load gauge — circular gauge showing current load vs capacity

**Custom vizs (4 in the pack):**
- KPI tile with hextech styling
- Regional latency bars
- Player load gauge (ring gauge with glow effects)
- Incident feed (scrolling event list)

**Requirements:**
- Use lookups for demo data
- Dark theme primary, should work in light
- Nav bar in the Splunk app
- Must work in both Dashboard Studio AND ad-hoc search
- 4 custom vizs

Use the splunk-viz-packs plugin: load vp-couture for design, then vp-viz and vp-create. Write all viz code inline — do not dispatch subagents for code generation.

---
