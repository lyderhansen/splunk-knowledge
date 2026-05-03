# Icon patterns for Splunk Dashboard Studio

Style guide and exemplar SVGs for ds-svg icon mode. Follow the six rules below for every
icon; the eight exemplar SVGs demonstrate the rules across the most common dashboard
categories.

## Style rules

1. **Two-tone** — dark outlines + one accent color from the dashboard palette. Outlines:
   `#1a1a1a` (light theme) / `#e5e5e5` (dark theme). Accent: dashboard's primary brand
   color. Exemplars use `#10b981` as placeholder — replace with your accent from ds-ref-color.

2. **Stroke-based geometry** — clean lines and geometric shapes only. Every stroked path
   must carry `stroke-linecap="round"` and `stroke-linejoin="round"`.

3. **Consistent stroke weight** — `stroke-width="4"` at 64×64 viewBox as default. Use
   `stroke-width="2"` only for fine internal detail lines.

4. **Flat fills** — solid accent fills for emphasis areas (LEDs, arrowheads, top faces,
   pulse segments). No gradients unless explicitly requested.

5. **Centered composition** — ~8 px padding on all sides. Effective content area: 48×48
   within the 64×64 viewBox (coordinates 8–56 on both axes).

6. **No text** — icons communicate through shape alone. Labels belong in the panel title,
   subtitle, or markdown cell — not inside the SVG.

---

## Exemplar SVGs

Eight icons demonstrating the rules. Each has a light theme SVG, dark theme variant, and
inline-ready data-URI. Replace `#10b981` with your dashboard's accent color.

### 1. Shield-check (Status/Severity)

Shield outline with a pointed bottom and flat top, containing a checkmark. Communicates verified status, compliance pass, or severity-clear.

**Light theme**
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <path d="M32 10L52 18v16c0 10-10 18-20 20C12 52 12 34 12 34V18Z"
        stroke="#1a1a1a" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M22 32l6 6 14-14"
        stroke="#10b981" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

**Dark theme**
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <path d="M32 10L52 18v16c0 10-10 18-20 20C12 52 12 34 12 34V18Z"
        stroke="#e5e5e5" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M22 32l6 6 14-14"
        stroke="#10b981" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

**Inline data-URI**
```
data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64' fill='none'><path d='M32 10L52 18v16c0 10-10 18-20 20C12 52 12 34 12 34V18Z' stroke='%231a1a1a' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'/><path d='M22 32l6 6 14-14' stroke='%2310b981' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'/></svg>
```

### 2. Server (Infrastructure)

Rectangular chassis with three horizontal drive-bay lines and a status LED in the lower-right corner. Represents a physical or virtual server node.

**Light theme**
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect x="12" y="16" width="40" height="32" rx="3"
        stroke="#1a1a1a" stroke-width="4" stroke-linejoin="round"/>
  <line x1="12" y1="26" x2="52" y2="26" stroke="#1a1a1a" stroke-width="2" stroke-linecap="round"/>
  <line x1="12" y1="34" x2="52" y2="34" stroke="#1a1a1a" stroke-width="2" stroke-linecap="round"/>
  <line x1="12" y1="42" x2="52" y2="42" stroke="#1a1a1a" stroke-width="2" stroke-linecap="round"/>
  <circle cx="46" cy="44" r="4" fill="#10b981"/>
</svg>
```

**Dark theme**
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect x="12" y="16" width="40" height="32" rx="3"
        stroke="#e5e5e5" stroke-width="4" stroke-linejoin="round"/>
  <line x1="12" y1="26" x2="52" y2="26" stroke="#e5e5e5" stroke-width="2" stroke-linecap="round"/>
  <line x1="12" y1="34" x2="52" y2="34" stroke="#e5e5e5" stroke-width="2" stroke-linecap="round"/>
  <line x1="12" y1="42" x2="52" y2="42" stroke="#e5e5e5" stroke-width="2" stroke-linecap="round"/>
  <circle cx="46" cy="44" r="4" fill="#10b981"/>
</svg>
```

**Inline data-URI**
```
data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64' fill='none'><rect x='12' y='16' width='40' height='32' rx='3' stroke='%231a1a1a' stroke-width='4' stroke-linejoin='round'/><line x1='12' y1='26' x2='52' y2='26' stroke='%231a1a1a' stroke-width='2' stroke-linecap='round'/><line x1='12' y1='34' x2='52' y2='34' stroke='%231a1a1a' stroke-width='2' stroke-linecap='round'/><line x1='12' y1='42' x2='52' y2='42' stroke='%231a1a1a' stroke-width='2' stroke-linecap='round'/><circle cx='46' cy='44' r='4' fill='%2310b981'/></svg>
```

### 3. Alert-triangle (Security)

Equilateral triangle with a very light accent fill and an exclamation mark inside. Represents a security alert, warning, or anomaly detection.

**Light theme**
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <path d="M32 10L54 50H10Z" stroke="#1a1a1a" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="#10b981" fill-opacity="0.15"/>
  <line x1="32" y1="26" x2="32" y2="38" stroke="#1a1a1a" stroke-width="4" stroke-linecap="round"/>
  <circle cx="32" cy="44" r="2" fill="#1a1a1a"/>
</svg>
```

**Dark theme**
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <path d="M32 10L54 50H10Z" stroke="#e5e5e5" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="#10b981" fill-opacity="0.15"/>
  <line x1="32" y1="26" x2="32" y2="38" stroke="#e5e5e5" stroke-width="4" stroke-linecap="round"/>
  <circle cx="32" cy="44" r="2" fill="#e5e5e5"/>
</svg>
```

**Inline data-URI**
```
data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64' fill='none'><path d='M32 10L54 50H10Z' stroke='%231a1a1a' stroke-width='4' stroke-linecap='round' stroke-linejoin='round' fill='%2310b981' fill-opacity='0.15'/><line x1='32' y1='26' x2='32' y2='38' stroke='%231a1a1a' stroke-width='4' stroke-linecap='round'/><circle cx='32' cy='44' r='2' fill='%231a1a1a'/></svg>
```

### 4. Heartbeat (Health)

ECG-style pulse line: flat baseline leading into a sharp up-down-up zigzag, then returning to baseline. The zigzag section is drawn in the accent color. Represents service health, uptime, and system pulse.

**Light theme**
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <polyline points="8,32 22,32 26,18 30,46 34,24 38,32 56,32"
            stroke="#1a1a1a" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  <polyline points="22,32 26,18 30,46 34,24 38,32"
            stroke="#10b981" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

**Dark theme**
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <polyline points="8,32 22,32 26,18 30,46 34,24 38,32 56,32"
            stroke="#e5e5e5" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  <polyline points="22,32 26,18 30,46 34,24 38,32"
            stroke="#10b981" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

**Inline data-URI**
```
data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64' fill='none'><polyline points='8,32 22,32 26,18 30,46 34,24 38,32 56,32' stroke='%231a1a1a' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'/><polyline points='22,32 26,18 30,46 34,24 38,32' stroke='%2310b981' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'/></svg>
```

### 5. Trend-up (Business)

Rising diagonal line from bottom-left to top-right ending in a filled arrowhead, with small dots at data points. Communicates growth, positive trend, or KPI improvement.

**Light theme**
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <polyline points="12,48 26,36 38,28 50,16"
            stroke="#1a1a1a" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  <polygon points="50,16 40,16 50,26" fill="#10b981"/>
  <circle cx="26" cy="36" r="3" fill="#1a1a1a"/>
  <circle cx="38" cy="28" r="3" fill="#1a1a1a"/>
</svg>
```

**Dark theme**
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <polyline points="12,48 26,36 38,28 50,16"
            stroke="#e5e5e5" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  <polygon points="50,16 40,16 50,26" fill="#10b981"/>
  <circle cx="26" cy="36" r="3" fill="#e5e5e5"/>
  <circle cx="38" cy="28" r="3" fill="#e5e5e5"/>
</svg>
```

**Inline data-URI**
```
data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64' fill='none'><polyline points='12,48 26,36 38,28 50,16' stroke='%231a1a1a' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'/><polygon points='50,16 40,16 50,26' fill='%2310b981'/><circle cx='26' cy='36' r='3' fill='%231a1a1a'/><circle cx='38' cy='28' r='3' fill='%231a1a1a'/></svg>
```

### 6. Cloud-nodes (Cloud)

Cloud silhouette at the top with two small filled circles below connected by vertical lines. Represents cloud services, managed nodes, or serverless deployments.

**Light theme**
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <path d="M18 36C14 36 10 33 10 28c0-5 4-8 8-8 0-5 4-9 10-9 5 0 9 3 10 7 2-1 6 0 8 3 2 3 1 7-2 9H18Z" stroke="#1a1a1a" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  <line x1="24" y1="36" x2="24" y2="46" stroke="#1a1a1a" stroke-width="3" stroke-linecap="round"/>
  <line x1="40" y1="36" x2="40" y2="46" stroke="#1a1a1a" stroke-width="3" stroke-linecap="round"/>
  <circle cx="24" cy="51" r="5" fill="#10b981"/>
  <circle cx="40" cy="51" r="5" fill="#10b981"/>
</svg>
```

**Dark theme**
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <path d="M18 36C14 36 10 33 10 28c0-5 4-8 8-8 0-5 4-9 10-9 5 0 9 3 10 7 2-1 6 0 8 3 2 3 1 7-2 9H18Z" stroke="#e5e5e5" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  <line x1="24" y1="36" x2="24" y2="46" stroke="#e5e5e5" stroke-width="3" stroke-linecap="round"/>
  <line x1="40" y1="36" x2="40" y2="46" stroke="#e5e5e5" stroke-width="3" stroke-linecap="round"/>
  <circle cx="24" cy="51" r="5" fill="#10b981"/>
  <circle cx="40" cy="51" r="5" fill="#10b981"/>
</svg>
```

**Inline data-URI**
```
data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64' fill='none'><path d='M18 36C14 36 10 33 10 28c0-5 4-8 8-8 0-5 4-9 10-9 5 0 9 3 10 7 2-1 6 0 8 3 2 3 1 7-2 9H18Z' stroke='%231a1a1a' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'/><line x1='24' y1='36' x2='24' y2='46' stroke='%231a1a1a' stroke-width='3' stroke-linecap='round'/><line x1='40' y1='36' x2='40' y2='46' stroke='%231a1a1a' stroke-width='3' stroke-linecap='round'/><circle cx='24' cy='51' r='5' fill='%2310b981'/><circle cx='40' cy='51' r='5' fill='%2310b981'/></svg>
```

### 7. Database (Observability)

Three-tier cylinder: three stacked ellipses with vertical side lines. The top ellipse face is filled with the accent color to denote the active/write tier. Represents a database, log store, or indexed data volume.

**Light theme**
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <ellipse cx="32" cy="16" rx="18" ry="6" fill="#10b981" stroke="#1a1a1a" stroke-width="4"/>
  <line x1="14" y1="16" x2="14" y2="48" stroke="#1a1a1a" stroke-width="4" stroke-linecap="round"/>
  <line x1="50" y1="16" x2="50" y2="48" stroke="#1a1a1a" stroke-width="4" stroke-linecap="round"/>
  <ellipse cx="32" cy="32" rx="18" ry="6" stroke="#1a1a1a" stroke-width="4"/>
  <ellipse cx="32" cy="48" rx="18" ry="6" stroke="#1a1a1a" stroke-width="4"/>
</svg>
```

**Dark theme**
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <ellipse cx="32" cy="16" rx="18" ry="6" fill="#10b981" stroke="#e5e5e5" stroke-width="4"/>
  <line x1="14" y1="16" x2="14" y2="48" stroke="#e5e5e5" stroke-width="4" stroke-linecap="round"/>
  <line x1="50" y1="16" x2="50" y2="48" stroke="#e5e5e5" stroke-width="4" stroke-linecap="round"/>
  <ellipse cx="32" cy="32" rx="18" ry="6" stroke="#e5e5e5" stroke-width="4"/>
  <ellipse cx="32" cy="48" rx="18" ry="6" stroke="#e5e5e5" stroke-width="4"/>
</svg>
```

**Inline data-URI**
```
data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64' fill='none'><ellipse cx='32' cy='16' rx='18' ry='6' fill='%2310b981' stroke='%231a1a1a' stroke-width='4'/><line x1='14' y1='16' x2='14' y2='48' stroke='%231a1a1a' stroke-width='4' stroke-linecap='round'/><line x1='50' y1='16' x2='50' y2='48' stroke='%231a1a1a' stroke-width='4' stroke-linecap='round'/><ellipse cx='32' cy='32' rx='18' ry='6' stroke='%231a1a1a' stroke-width='4'/><ellipse cx='32' cy='48' rx='18' ry='6' stroke='%231a1a1a' stroke-width='4'/></svg>
```

### 8. Hub-spoke (Network)

Central filled circle with four lines radiating to smaller outline circles at top, right, bottom, and left. Represents a network hub, mesh topology, or service dependency map.

**Light theme**
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <circle cx="32" cy="32" r="8" fill="#10b981" stroke="#1a1a1a" stroke-width="4"/>
  <line x1="32" y1="24" x2="32" y2="18" stroke="#1a1a1a" stroke-width="4" stroke-linecap="round"/>
  <line x1="40" y1="32" x2="46" y2="32" stroke="#1a1a1a" stroke-width="4" stroke-linecap="round"/>
  <line x1="32" y1="40" x2="32" y2="46" stroke="#1a1a1a" stroke-width="4" stroke-linecap="round"/>
  <line x1="24" y1="32" x2="18" y2="32" stroke="#1a1a1a" stroke-width="4" stroke-linecap="round"/>
  <circle cx="32" cy="13" r="5" stroke="#1a1a1a" stroke-width="4"/>
  <circle cx="51" cy="32" r="5" stroke="#1a1a1a" stroke-width="4"/>
  <circle cx="32" cy="51" r="5" stroke="#1a1a1a" stroke-width="4"/>
  <circle cx="13" cy="32" r="5" stroke="#1a1a1a" stroke-width="4"/>
</svg>
```

**Dark theme**
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <circle cx="32" cy="32" r="8" fill="#10b981" stroke="#e5e5e5" stroke-width="4"/>
  <line x1="32" y1="24" x2="32" y2="18" stroke="#e5e5e5" stroke-width="4" stroke-linecap="round"/>
  <line x1="40" y1="32" x2="46" y2="32" stroke="#e5e5e5" stroke-width="4" stroke-linecap="round"/>
  <line x1="32" y1="40" x2="32" y2="46" stroke="#e5e5e5" stroke-width="4" stroke-linecap="round"/>
  <line x1="24" y1="32" x2="18" y2="32" stroke="#e5e5e5" stroke-width="4" stroke-linecap="round"/>
  <circle cx="32" cy="13" r="5" stroke="#e5e5e5" stroke-width="4"/>
  <circle cx="51" cy="32" r="5" stroke="#e5e5e5" stroke-width="4"/>
  <circle cx="32" cy="51" r="5" stroke="#e5e5e5" stroke-width="4"/>
  <circle cx="13" cy="32" r="5" stroke="#e5e5e5" stroke-width="4"/>
</svg>
```

**Inline data-URI**
```
data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64' fill='none'><circle cx='32' cy='32' r='8' fill='%2310b981' stroke='%231a1a1a' stroke-width='4'/><line x1='32' y1='24' x2='32' y2='18' stroke='%231a1a1a' stroke-width='4' stroke-linecap='round'/><line x1='40' y1='32' x2='46' y2='32' stroke='%231a1a1a' stroke-width='4' stroke-linecap='round'/><line x1='32' y1='40' x2='32' y2='46' stroke='%231a1a1a' stroke-width='4' stroke-linecap='round'/><line x1='24' y1='32' x2='18' y2='32' stroke='%231a1a1a' stroke-width='4' stroke-linecap='round'/><circle cx='32' cy='13' r='5' stroke='%231a1a1a' stroke-width='4'/><circle cx='51' cy='32' r='5' stroke='%231a1a1a' stroke-width='4'/><circle cx='32' cy='51' r='5' stroke='%231a1a1a' stroke-width='4'/><circle cx='13' cy='32' r='5' stroke='%231a1a1a' stroke-width='4'/></svg>
```

## Category taxonomy

| #  | Category | Domain | Example concepts |
|---|---|---|---|
| 1 | Status/Severity | Universal | alert, check, stop, inactive, clock, readiness |
| 2 | Infrastructure | IT/Ops | server, database, container, kubernetes, router, indexer, rack |
| 3 | Security | SecOps | shield, lock, malware, vulnerability, SIEM, firewall, key |
| 4 | Cloud | DevOps | cloud services, serverless, deployment, scaling |
| 5 | Business | Executive | revenue, cost, customer success, spending, retail, growth |
| 6 | Observability | SRE | monitoring, performance, log management, APM, tracing |
| 7 | Daily/Operations | Ops | shift handover, daily report, schedule, calendar, routine check |
| 8 | Health | SRE/Ops | heartbeat, uptime, SLA, service health, system pulse |
| 9 | Healthcare | Vertical | stethoscope, hospital, medical device, patient, wellness |
| 10 | Energy/Industrial | Vertical | wind turbine, renewable energy, water, environmental, oil/gas |
| 11 | Manufacturing | Vertical | factory, predictive maintenance, IoT, sensor, assembly |
| 12 | Government/Public | Vertical | federal, state/local, military, public sector, compliance |
| 13 | Financial | Vertical | credit card, transaction, POS, ATM, debit, banking |
| 14 | Transportation | Vertical | vehicle, truck, aviation, shipping container, logistics |

## Combining categories

Build cross-category icons by taking the **dominant shape** from the primary category and
layering an **accent element** from the secondary category.

- **Server health** — server rectangle base + heartbeat pulse overlaid in accent color.
- **Cloud security** — cloud outline + small shield centered below the cloud body.
- **Database observability** — cylinder base + spark line trending up from the top ellipse.

When two shapes compete for attention, reduce one to a small filled accent element so the
icon stays legible at 32 px.

## See also

- `SVG-CONVENTIONS.md` — encoding rules, viewBox sizes, data-URI format
- `CANVAS-PATTERNS.md` — choropleth canvas templates
- `ds-ref-color` — dashboard palette colors for choosing the accent value that replaces `#10b981`
