# Phase 26: Multi-Channel Archetype - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-21
**Phase:** 26-multi-channel-archetype
**Areas discussed:** Channel layout & synchronization, Domain channel configurations, Archetype scope in viz-blueprints.md

---

## Channel Layout & Synchronization

| Option | Description | Selected |
|--------|-------------|----------|
| F1 telemetry style | Stacked horizontal strips, shared time x-axis, equal height, synchronized crosshair | ✓ |
| Variable height channels | Same stacked layout but channels can have different heights | |
| Tabbed channels | Only one channel visible at a time with tab switching | |

**User's choice:** F1 telemetry style
**Notes:** None

### Channel Count & Labels

| Option | Description | Selected |
|--------|-------------|----------|
| 3-6 channels, left-side labels | Min 3, max 6, label on left edge with channel name + value at cursor | ✓ |
| 2-8 channels, no labels | Wider range, color coding only, tooltip on hover | |
| Fixed 4 channels | Always exactly 4, optimized for common case | |

**User's choice:** 3-6 channels, left-side labels
**Notes:** None

---

## Domain Channel Configurations

### F1/Motorsport Channels

| Option | Description | Selected |
|--------|-------------|----------|
| Throttle, Brake, Speed, Gear, ERS | 5 channels covering core F1 telemetry suite | ✓ |
| Throttle, Brake, Speed, RPM | 4 channels, more generic motorsport | |
| Speed, G-Force, Steering Angle, Throttle | 4 channels focused on driver input analysis | |

**User's choice:** Throttle, Brake, Speed, Gear, ERS (5 channels)
**Notes:** None

### Healthcare & Network Ops Channels

| Option | Description | Selected |
|--------|-------------|----------|
| HC: HR, SpO2, Resp, BP / Net: Throughput, Latency, Errors, CPU | 4 standard channels each, well-recognized by practitioners | ✓ |
| HC: HR, SpO2, Resp, Temp, EtCO2 / Net: In/Out Bps, Latency, Packet Loss, Memory | 5 channels each, ICU/detailed level | |
| 3 channels each (minimal) | HC: HR, SpO2, Resp / Net: Throughput, Latency, Errors | |

**User's choice:** 4 standard channels each
**Notes:** None

---

## Archetype Scope in viz-blueprints.md

| Option | Description | Selected |
|--------|-------------|----------|
| Compact entry, ~30 lines | Pattern description, data contract, settings list only | |
| Full entry with Canvas guidance, ~60 lines | Includes Canvas rendering notes for strip division, crosshair, y-scale | ✓ |
| Separate file | New reference file with one-line pointer from viz-blueprints.md | |

**User's choice:** Full entry with Canvas guidance (~60 lines)
**Notes:** File will reach ~570 lines, acceptable given pattern complexity

---

## Claude's Discretion

- Exact pixel dimensions for channel dividers and labels
- Color assignment for channels (series colors vs accent-derived)
- Crosshair line styling
- Mini time-axis vs hover-only time display
- Channel rendering style adaptation per brand

## Deferred Ideas

None
