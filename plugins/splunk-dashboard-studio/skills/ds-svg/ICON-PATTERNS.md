# Icon patterns for Splunk Dashboard Studio

Style guide and exemplar SVGs for ds-svg icon mode. Follow the six rules below for every
icon; the thirty exemplar SVGs demonstrate the rules across the most common dashboard
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

Thirty icons demonstrating the rules. Each has a light theme SVG, dark theme variant, and
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

### 9. Lock (Security)

Padlock body with filled accent rectangle and a keyhole inside. Represents access control, authentication gates, or encrypted data.

**Light theme**
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <path d="M22,28 A10,10 0 0,1 42,28" stroke="#1a1a1a" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <rect x="18" y="28" width="28" height="24" rx="4" fill="#10b981" stroke="#1a1a1a" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="32" cy="37" r="3" fill="#1a1a1a"/>
  <line x1="32" y1="40" x2="32" y2="45" stroke="#1a1a1a" stroke-width="3" stroke-linecap="round"/>
</svg>
```

**Dark theme:** swap `#1a1a1a` → `#e5e5e5` in all stroke/fill attributes.

**Inline data-URI**
```
data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64' fill='none'><path d='M22,28 A10,10 0 0,1 42,28' stroke='%231a1a1a' stroke-width='4' stroke-linecap='round' stroke-linejoin='round' fill='none'/><rect x='18' y='28' width='28' height='24' rx='4' fill='%2310b981' stroke='%231a1a1a' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'/><circle cx='32' cy='37' r='3' fill='%231a1a1a'/><line x1='32' y1='40' x2='32' y2='45' stroke='%231a1a1a' stroke-width='3' stroke-linecap='round'/></svg>
```

### 10. Bell (Alerting)

Bell silhouette with accent fill and a small clapper circle below. Represents notification alerts, threshold triggers, or scheduled event reminders.

**Light theme**
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <path d="M18,38 Q18,14 32,14 Q46,14 46,38 Z" fill="#10b981" stroke="#1a1a1a" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  <line x1="18" y1="38" x2="46" y2="38" stroke="#1a1a1a" stroke-width="4" stroke-linecap="round"/>
  <circle cx="32" cy="44" r="3" fill="#1a1a1a"/>
  <circle cx="32" cy="12" r="2" fill="#1a1a1a"/>
</svg>
```

**Dark theme:** swap `#1a1a1a` → `#e5e5e5` in all stroke/fill attributes.

**Inline data-URI**
```
data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64' fill='none'><path d='M18,38 Q18,14 32,14 Q46,14 46,38 Z' fill='%2310b981' stroke='%231a1a1a' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'/><line x1='18' y1='38' x2='46' y2='38' stroke='%231a1a1a' stroke-width='4' stroke-linecap='round'/><circle cx='32' cy='44' r='3' fill='%231a1a1a'/><circle cx='32' cy='12' r='2' fill='%231a1a1a'/></svg>
```

### 11. Gear (Configuration)

Large circle with six radial teeth and a small accent dot at center. Represents system configuration, settings, or automation workflows.

**Light theme**
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <circle cx="32" cy="32" r="18" stroke="#1a1a1a" stroke-width="4" fill="none"/>
  <line x1="32" y1="14" x2="32" y2="8" stroke="#1a1a1a" stroke-width="4" stroke-linecap="round"/>
  <line x1="47.6" y1="23" x2="53.2" y2="20" stroke="#1a1a1a" stroke-width="4" stroke-linecap="round"/>
  <line x1="47.6" y1="41" x2="53.2" y2="44" stroke="#1a1a1a" stroke-width="4" stroke-linecap="round"/>
  <line x1="32" y1="50" x2="32" y2="56" stroke="#1a1a1a" stroke-width="4" stroke-linecap="round"/>
  <line x1="16.4" y1="41" x2="10.8" y2="44" stroke="#1a1a1a" stroke-width="4" stroke-linecap="round"/>
  <line x1="16.4" y1="23" x2="10.8" y2="20" stroke="#1a1a1a" stroke-width="4" stroke-linecap="round"/>
  <circle cx="32" cy="32" r="6" fill="#10b981"/>
</svg>
```

**Dark theme:** swap `#1a1a1a` → `#e5e5e5` in all stroke/fill attributes.

**Inline data-URI**
```
data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64' fill='none'><circle cx='32' cy='32' r='18' stroke='%231a1a1a' stroke-width='4' fill='none'/><line x1='32' y1='14' x2='32' y2='8' stroke='%231a1a1a' stroke-width='4' stroke-linecap='round'/><line x1='47.6' y1='23' x2='53.2' y2='20' stroke='%231a1a1a' stroke-width='4' stroke-linecap='round'/><line x1='47.6' y1='41' x2='53.2' y2='44' stroke='%231a1a1a' stroke-width='4' stroke-linecap='round'/><line x1='32' y1='50' x2='32' y2='56' stroke='%231a1a1a' stroke-width='4' stroke-linecap='round'/><line x1='16.4' y1='41' x2='10.8' y2='44' stroke='%231a1a1a' stroke-width='4' stroke-linecap='round'/><line x1='16.4' y1='23' x2='10.8' y2='20' stroke='%231a1a1a' stroke-width='4' stroke-linecap='round'/><circle cx='32' cy='32' r='6' fill='%2310b981'/></svg>
```

### 12. Users (Identity)

Two overlapping person silhouettes — back figure outlined, front figure accent-filled. Represents user accounts, identity management, or team/group metrics.

**Light theme**
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <circle cx="40" cy="20" r="6" stroke="#1a1a1a" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M32,44 Q40,34 48,44" stroke="#1a1a1a" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <circle cx="28" cy="22" r="7" stroke="#1a1a1a" stroke-width="4" fill="#10b981" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M16,46 Q28,36 40,46" stroke="#1a1a1a" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="#10b981"/>
</svg>
```

**Dark theme:** swap `#1a1a1a` → `#e5e5e5` in all stroke/fill attributes.

**Inline data-URI**
```
data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64' fill='none'><circle cx='40' cy='20' r='6' stroke='%231a1a1a' stroke-width='4' fill='none' stroke-linecap='round' stroke-linejoin='round'/><path d='M32,44 Q40,34 48,44' stroke='%231a1a1a' stroke-width='4' stroke-linecap='round' stroke-linejoin='round' fill='none'/><circle cx='28' cy='22' r='7' stroke='%231a1a1a' stroke-width='4' fill='%2310b981' stroke-linecap='round' stroke-linejoin='round'/><path d='M16,46 Q28,36 40,46' stroke='%231a1a1a' stroke-width='4' stroke-linecap='round' stroke-linejoin='round' fill='%2310b981'/></svg>
```

### 13. Wifi (Network)

Three concentric arcs rising from a central dot, middle arc drawn in accent color. Represents wireless connectivity, signal strength, or network availability.

**Light theme**
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <circle cx="32" cy="48" r="4" fill="#10b981"/>
  <path d="M26,40 Q32,34 38,40" stroke="#1a1a1a" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <path d="M20,36 Q32,26 44,36" stroke="#10b981" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <path d="M14,32 Q32,18 50,32" stroke="#1a1a1a" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</svg>
```

**Dark theme:** swap `#1a1a1a` → `#e5e5e5` in all stroke/fill attributes.

**Inline data-URI**
```
data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64' fill='none'><circle cx='32' cy='48' r='4' fill='%2310b981'/><path d='M26,40 Q32,34 38,40' stroke='%231a1a1a' stroke-width='4' stroke-linecap='round' stroke-linejoin='round' fill='none'/><path d='M20,36 Q32,26 44,36' stroke='%2310b981' stroke-width='4' stroke-linecap='round' stroke-linejoin='round' fill='none'/><path d='M14,32 Q32,18 50,32' stroke='%231a1a1a' stroke-width='4' stroke-linecap='round' stroke-linejoin='round' fill='none'/></svg>
```

### 14. Key (Security)

Filled accent circle head with inner hole, long shaft, and two downward teeth. Represents cryptographic keys, API tokens, or secret management.

**Light theme**
```xml
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" fill="none">
  <circle cx="20" cy="24" r="10" fill="#10b981" stroke="#1a1a1a" stroke-width="4"/>
  <circle cx="20" cy="24" r="4" fill="none" stroke="#1a1a1a" stroke-width="3"/>
  <line x1="30" y1="24" x2="52" y2="24" stroke="#1a1a1a" stroke-width="4" stroke-linecap="round"/>
  <line x1="44" y1="24" x2="44" y2="32" stroke="#1a1a1a" stroke-width="4" stroke-linecap="round"/>
  <line x1="50" y1="24" x2="50" y2="30" stroke="#1a1a1a" stroke-width="4" stroke-linecap="round"/>
</svg>
```

**Dark theme:** swap `#1a1a1a` → `#e5e5e5` in all stroke/fill attributes.

**Inline data-URI**
```
data:image/svg+xml;utf8,<svg viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg' fill='none'><circle cx='20' cy='24' r='10' fill='%2310b981' stroke='%231a1a1a' stroke-width='4'/><circle cx='20' cy='24' r='4' fill='none' stroke='%231a1a1a' stroke-width='3'/><line x1='30' y1='24' x2='52' y2='24' stroke='%231a1a1a' stroke-width='4' stroke-linecap='round'/><line x1='44' y1='24' x2='44' y2='32' stroke='%231a1a1a' stroke-width='4' stroke-linecap='round'/><line x1='50' y1='24' x2='50' y2='30' stroke='%231a1a1a' stroke-width='4' stroke-linecap='round'/></svg>
```

### 15. CPU (Infrastructure)

Square chip with accent fill, four pins on each side. Represents compute resources, processor utilization, or hardware telemetry.

**Light theme**
```xml
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" fill="none">
  <rect x="18" y="18" width="28" height="28" rx="4" fill="#10b981" stroke="#1a1a1a" stroke-width="4"/>
  <line x1="26" y1="18" x2="26" y2="10" stroke="#1a1a1a" stroke-width="3" stroke-linecap="round"/>
  <line x1="38" y1="18" x2="38" y2="10" stroke="#1a1a1a" stroke-width="3" stroke-linecap="round"/>
  <line x1="26" y1="46" x2="26" y2="54" stroke="#1a1a1a" stroke-width="3" stroke-linecap="round"/>
  <line x1="38" y1="46" x2="38" y2="54" stroke="#1a1a1a" stroke-width="3" stroke-linecap="round"/>
  <line x1="18" y1="26" x2="10" y2="26" stroke="#1a1a1a" stroke-width="3" stroke-linecap="round"/>
  <line x1="18" y1="38" x2="10" y2="38" stroke="#1a1a1a" stroke-width="3" stroke-linecap="round"/>
  <line x1="46" y1="26" x2="54" y2="26" stroke="#1a1a1a" stroke-width="3" stroke-linecap="round"/>
  <line x1="46" y1="38" x2="54" y2="38" stroke="#1a1a1a" stroke-width="3" stroke-linecap="round"/>
</svg>
```

**Dark theme:** swap `#1a1a1a` → `#e5e5e5` in all stroke/fill attributes.

**Inline data-URI**
```
data:image/svg+xml;utf8,<svg viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg' fill='none'><rect x='18' y='18' width='28' height='28' rx='4' fill='%2310b981' stroke='%231a1a1a' stroke-width='4'/><line x1='26' y1='18' x2='26' y2='10' stroke='%231a1a1a' stroke-width='3' stroke-linecap='round'/><line x1='38' y1='18' x2='38' y2='10' stroke='%231a1a1a' stroke-width='3' stroke-linecap='round'/><line x1='26' y1='46' x2='26' y2='54' stroke='%231a1a1a' stroke-width='3' stroke-linecap='round'/><line x1='38' y1='46' x2='38' y2='54' stroke='%231a1a1a' stroke-width='3' stroke-linecap='round'/><line x1='18' y1='26' x2='10' y2='26' stroke='%231a1a1a' stroke-width='3' stroke-linecap='round'/><line x1='18' y1='38' x2='10' y2='38' stroke='%231a1a1a' stroke-width='3' stroke-linecap='round'/><line x1='46' y1='26' x2='54' y2='26' stroke='%231a1a1a' stroke-width='3' stroke-linecap='round'/><line x1='46' y1='38' x2='54' y2='38' stroke='%231a1a1a' stroke-width='3' stroke-linecap='round'/></svg>
```

### 16. Refresh (Operations)

Two opposing semicircular arcs with accent arrowheads at their tips. Represents data refresh cycles, cache invalidation, or sync status.

**Light theme**
```xml
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" fill="none">
  <path d="M42,20 A14,14 0 0,0 22,20" stroke="#1a1a1a" stroke-width="4" stroke-linecap="round"/>
  <polygon points="42,20 34,16 34,24" fill="#10b981"/>
  <path d="M22,44 A14,14 0 0,0 42,44" stroke="#1a1a1a" stroke-width="4" stroke-linecap="round"/>
  <polygon points="22,44 30,48 30,40" fill="#10b981"/>
</svg>
```

**Dark theme:** swap `#1a1a1a` → `#e5e5e5` in all stroke/fill attributes.

**Inline data-URI**
```
data:image/svg+xml;utf8,<svg viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg' fill='none'><path d='M42,20 A14,14 0 0,0 22,20' stroke='%231a1a1a' stroke-width='4' stroke-linecap='round'/><polygon points='42,20 34,16 34,24' fill='%2310b981'/><path d='M22,44 A14,14 0 0,0 42,44' stroke='%231a1a1a' stroke-width='4' stroke-linecap='round'/><polygon points='22,44 30,48 30,40' fill='%2310b981'/></svg>
```

### 17. Globe (Geographic)

Circle outline with vertical ellipse meridian, equator line, and a right-curving accent meridian arc. Represents geographic dashboards, regional data, or global network reach.

**Light theme**
```xml
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" fill="none">
  <circle cx="32" cy="32" r="22" stroke="#1a1a1a" stroke-width="4"/>
  <ellipse cx="32" cy="32" rx="10" ry="22" stroke="#1a1a1a" stroke-width="2"/>
  <line x1="10" y1="32" x2="54" y2="32" stroke="#1a1a1a" stroke-width="2"/>
  <path d="M32,10 C46,10 46,54 32,54" stroke="#10b981" stroke-width="3" stroke-linecap="round"/>
</svg>
```

**Dark theme:** swap `#1a1a1a` → `#e5e5e5` in all stroke/fill attributes.

**Inline data-URI**
```
data:image/svg+xml;utf8,<svg viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg' fill='none'><circle cx='32' cy='32' r='22' stroke='%231a1a1a' stroke-width='4'/><ellipse cx='32' cy='32' rx='10' ry='22' stroke='%231a1a1a' stroke-width='2'/><line x1='10' y1='32' x2='54' y2='32' stroke='%231a1a1a' stroke-width='2'/><path d='M32,10 C46,10 46,54 32,54' stroke='%2310b981' stroke-width='3' stroke-linecap='round'/></svg>
```

### 18. Folder (Data)

Accent-filled folder body with a tab in the upper-left corner. Represents saved searches, data collections, lookup files, or KV store namespaces.

**Light theme**
```xml
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" fill="none">
  <rect x="10" y="24" width="44" height="28" rx="3" fill="#10b981" stroke="#1a1a1a" stroke-width="4"/>
  <path d="M10,24 L10,18 L26,18 L30,24" fill="#10b981" stroke="#1a1a1a" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>
</svg>
```

**Dark theme:** swap `#1a1a1a` → `#e5e5e5` in all stroke/fill attributes.

**Inline data-URI**
```
data:image/svg+xml;utf8,<svg viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg' fill='none'><rect x='10' y='24' width='44' height='28' rx='3' fill='%2310b981' stroke='%231a1a1a' stroke-width='4'/><path d='M10,24 L10,18 L26,18 L30,24' fill='%2310b981' stroke='%231a1a1a' stroke-width='4' stroke-linejoin='round' stroke-linecap='round'/></svg>
```

### 19. Chart-bar (Business)

Three accent-filled bars of varying heights with a baseline. Represents KPI comparisons, category breakdowns, or volume metrics.

**Light theme**
```xml
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" fill="none">
  <rect x="14" y="34" width="10" height="18" rx="2" fill="#10b981" stroke="#1a1a1a" stroke-width="3"/>
  <rect x="27" y="14" width="10" height="38" rx="2" fill="#10b981" stroke="#1a1a1a" stroke-width="3"/>
  <rect x="40" y="24" width="10" height="28" rx="2" fill="#10b981" stroke="#1a1a1a" stroke-width="3"/>
  <line x1="10" y1="52" x2="54" y2="52" stroke="#1a1a1a" stroke-width="4" stroke-linecap="round"/>
</svg>
```

**Dark theme:** swap `#1a1a1a` → `#e5e5e5` in all stroke/fill attributes.

**Inline data-URI**
```
data:image/svg+xml;utf8,<svg viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg' fill='none'><rect x='14' y='34' width='10' height='18' rx='2' fill='%2310b981' stroke='%231a1a1a' stroke-width='3'/><rect x='27' y='14' width='10' height='38' rx='2' fill='%2310b981' stroke='%231a1a1a' stroke-width='3'/><rect x='40' y='24' width='10' height='28' rx='2' fill='%2310b981' stroke='%231a1a1a' stroke-width='3'/><line x1='10' y1='52' x2='54' y2='52' stroke='%231a1a1a' stroke-width='4' stroke-linecap='round'/></svg>
```

### 20. Thermometer (Health/Industrial)

Vertical tube with accent mercury fill rising from an accent bulb at the base, plus three tick marks. Represents temperature telemetry, threshold monitoring, or environmental sensor data.

**Light theme**
```xml
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" fill="none">
  <rect x="28" y="10" width="8" height="32" rx="4" stroke="#1a1a1a" stroke-width="4" fill="none"/>
  <rect x="29" y="24" width="6" height="19" rx="3" fill="#10b981"/>
  <circle cx="32" cy="46" r="8" fill="#10b981" stroke="#1a1a1a" stroke-width="4"/>
  <line x1="38" y1="16" x2="42" y2="16" stroke="#1a1a1a" stroke-width="2" stroke-linecap="round"/>
  <line x1="38" y1="22" x2="42" y2="22" stroke="#1a1a1a" stroke-width="2" stroke-linecap="round"/>
  <line x1="38" y1="28" x2="42" y2="28" stroke="#1a1a1a" stroke-width="2" stroke-linecap="round"/>
</svg>
```

**Dark theme:** swap `#1a1a1a` → `#e5e5e5` in all stroke/fill attributes.

**Inline data-URI**
```
data:image/svg+xml;utf8,<svg viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg' fill='none'><rect x='28' y='10' width='8' height='32' rx='4' stroke='%231a1a1a' stroke-width='4' fill='none'/><rect x='29' y='24' width='6' height='19' rx='3' fill='%2310b981'/><circle cx='32' cy='46' r='8' fill='%2310b981' stroke='%231a1a1a' stroke-width='4'/><line x1='38' y1='16' x2='42' y2='16' stroke='%231a1a1a' stroke-width='2' stroke-linecap='round'/><line x1='38' y1='22' x2='42' y2='22' stroke='%231a1a1a' stroke-width='2' stroke-linecap='round'/><line x1='38' y1='28' x2='42' y2='28' stroke='%231a1a1a' stroke-width='2' stroke-linecap='round'/></svg>
```

### 21. Eye (Observability)

Almond-shaped eye outline with an accent iris and dark pupil. Represents monitoring dashboards, log visibility, threat detection, or data access auditing.

**Light theme**
```xml
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" fill="none">
  <path d="M8,32 C8,32 18,16 32,16 C46,16 56,32 56,32 C56,32 46,48 32,48 C18,48 8,32 8,32 Z" stroke="#1a1a1a" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="32" cy="32" r="10" fill="#10b981" stroke="#1a1a1a" stroke-width="3"/>
  <circle cx="32" cy="32" r="4" fill="#1a1a1a"/>
</svg>
```

**Dark theme:** swap `#1a1a1a` → `#e5e5e5` in all stroke/fill attributes.

**Inline data-URI**
```
data:image/svg+xml;utf8,<svg viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg' fill='none'><path d='M8,32 C8,32 18,16 32,16 C46,16 56,32 56,32 C56,32 46,48 32,48 C18,48 8,32 8,32 Z' stroke='%231a1a1a' stroke-width='4' fill='none' stroke-linecap='round' stroke-linejoin='round'/><circle cx='32' cy='32' r='10' fill='%2310b981' stroke='%231a1a1a' stroke-width='3'/><circle cx='32' cy='32' r='4' fill='%231a1a1a'/></svg>
```

### 22. Dollar (Financial)

Accent-filled circle with a dollar-sign vertical stroke and two curved serifs. Represents financial KPIs, revenue metrics, cost analysis, or billing dashboards.

**Light theme**
```xml
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" fill="none">
  <circle cx="32" cy="32" r="22" fill="#10b981" stroke="#1a1a1a" stroke-width="4"/>
  <line x1="32" y1="18" x2="32" y2="46" stroke="#1a1a1a" stroke-width="4" stroke-linecap="round"/>
  <path d="M24,24 C24,24 28,20 32,22 C36,24 40,26 40,28" stroke="#1a1a1a" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M24,36 C24,36 28,42 32,42 C36,42 40,38 40,40" stroke="#1a1a1a" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

**Dark theme:** swap `#1a1a1a` → `#e5e5e5` in all stroke/fill attributes.

**Inline data-URI**
```
data:image/svg+xml;utf8,<svg viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg' fill='none'><circle cx='32' cy='32' r='22' fill='%2310b981' stroke='%231a1a1a' stroke-width='4'/><line x1='32' y1='18' x2='32' y2='46' stroke='%231a1a1a' stroke-width='4' stroke-linecap='round'/><path d='M24,24 C24,24 28,20 32,22 C36,24 40,26 40,28' stroke='%231a1a1a' stroke-width='4' fill='none' stroke-linecap='round' stroke-linejoin='round'/><path d='M24,36 C24,36 28,42 32,42 C36,42 40,38 40,40' stroke='%231a1a1a' stroke-width='4' fill='none' stroke-linecap='round' stroke-linejoin='round'/></svg>
```

### 23. Flame (Energy/Industrial)

Teardrop flame outline with accent fill and a smaller inner flame detail. Represents energy consumption, critical hotspots, burn-rate alerts, or high-severity conditions.

**Light theme**
```xml
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" fill="none">
  <path d="M32,8 C32,8 16,24 16,38 C16,44 20,50 24,50 C28,54 32,54 32,54 C32,54 36,54 40,50 C44,50 48,44 48,38 C48,24 32,8 32,8 Z" fill="#10b981" stroke="#1a1a1a" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M32,22 C32,22 26,32 26,40 C26,44 28,46 30,47 C31,48 32,48 32,48 C32,48 33,48 34,47 C36,46 38,44 38,40 C38,32 32,22 32,22 Z" fill="#1a1a1a" opacity="0.15" stroke="#1a1a1a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

**Dark theme:** swap `#1a1a1a` → `#e5e5e5` in all stroke/fill attributes.

**Inline data-URI**
```
data:image/svg+xml;utf8,<svg viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg' fill='none'><path d='M32,8 C32,8 16,24 16,38 C16,44 20,50 24,50 C28,54 32,54 32,54 C32,54 36,54 40,50 C44,50 48,44 48,38 C48,24 32,8 32,8 Z' fill='%2310b981' stroke='%231a1a1a' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'/><path d='M32,22 C32,22 26,32 26,40 C26,44 28,46 30,47 C31,48 32,48 32,48 C32,48 33,48 34,47 C36,46 38,44 38,40 C38,32 32,22 32,22 Z' fill='%231a1a1a' opacity='0.15' stroke='%231a1a1a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/></svg>
```

### 24. Truck (Transportation)

Accent-filled cargo box with a cab outline, cab window, two wheels, and a ground line. Represents fleet tracking, logistics, delivery pipelines, or supply chain dashboards.

**Light theme**
```xml
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" fill="none">
  <rect x="8" y="20" width="30" height="22" rx="2" fill="#10b981" stroke="#1a1a1a" stroke-width="4"/>
  <path d="M38,26 L52,26 L52,42 L38,42 Z" stroke="#1a1a1a" stroke-width="4" fill="none" stroke-linejoin="round"/>
  <rect x="42" y="28" width="8" height="8" rx="1" stroke="#1a1a1a" stroke-width="2" fill="none"/>
  <circle cx="20" cy="46" r="5" fill="#1a1a1a" stroke="#1a1a1a"/>
  <circle cx="46" cy="46" r="5" fill="#1a1a1a" stroke="#1a1a1a"/>
  <line x1="8" y1="51" x2="56" y2="51" stroke="#1a1a1a" stroke-width="2"/>
</svg>
```

**Dark theme:** swap `#1a1a1a` → `#e5e5e5` in all stroke/fill attributes.

**Inline data-URI**
```
data:image/svg+xml;utf8,<svg viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg' fill='none'><rect x='8' y='20' width='30' height='22' rx='2' fill='%2310b981' stroke='%231a1a1a' stroke-width='4'/><path d='M38,26 L52,26 L52,42 L38,42 Z' stroke='%231a1a1a' stroke-width='4' fill='none' stroke-linejoin='round'/><rect x='42' y='28' width='8' height='8' rx='1' stroke='%231a1a1a' stroke-width='2' fill='none'/><circle cx='20' cy='46' r='5' fill='%231a1a1a' stroke='%231a1a1a'/><circle cx='46' cy='46' r='5' fill='%231a1a1a' stroke='%231a1a1a'/><line x1='8' y1='51' x2='56' y2='51' stroke='%231a1a1a' stroke-width='2'/></svg>
```

### 25. Building (Government/Enterprise)

Accent-filled building rectangle with rows of window outlines and a filled door. Represents government agencies, enterprise entities, facility management, or organizational hierarchy.

**Light theme**
```xml
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" fill="none">
  <rect x="14" y="14" width="36" height="40" rx="2" fill="#10b981" stroke="#1a1a1a" stroke-width="4"/>
  <rect x="27" y="40" width="10" height="14" rx="1" fill="#1a1a1a"/>
  <rect x="20" y="18" width="6" height="5" fill="none" stroke="#1a1a1a" stroke-width="2"/>
  <rect x="38" y="18" width="6" height="5" fill="none" stroke="#1a1a1a" stroke-width="2"/>
  <rect x="20" y="27" width="6" height="5" fill="none" stroke="#1a1a1a" stroke-width="2"/>
  <rect x="38" y="27" width="6" height="5" fill="none" stroke="#1a1a1a" stroke-width="2"/>
  <rect x="20" y="36" width="6" height="5" fill="none" stroke="#1a1a1a" stroke-width="2"/>
  <rect x="38" y="36" width="6" height="5" fill="none" stroke="#1a1a1a" stroke-width="2"/>
</svg>
```

**Dark theme:** swap `#1a1a1a` → `#e5e5e5` in all stroke/fill attributes.

**Inline data-URI**
```
data:image/svg+xml;utf8,<svg viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg' fill='none'><rect x='14' y='14' width='36' height='40' rx='2' fill='%2310b981' stroke='%231a1a1a' stroke-width='4'/><rect x='27' y='40' width='10' height='14' rx='1' fill='%231a1a1a'/><rect x='20' y='18' width='6' height='5' fill='none' stroke='%231a1a1a' stroke-width='2'/><rect x='38' y='18' width='6' height='5' fill='none' stroke='%231a1a1a' stroke-width='2'/><rect x='20' y='27' width='6' height='5' fill='none' stroke='%231a1a1a' stroke-width='2'/><rect x='38' y='27' width='6' height='5' fill='none' stroke='%231a1a1a' stroke-width='2'/><rect x='20' y='36' width='6' height='5' fill='none' stroke='%231a1a1a' stroke-width='2'/><rect x='38' y='36' width='6' height='5' fill='none' stroke='%231a1a1a' stroke-width='2'/></svg>
```

### 26. Plug (Integration)

Accent-filled plug body with two prongs and a dangling cord. Represents integrations, data connectors, input feeds, or power/connection state.

**Light theme**
```xml
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" fill="none">
  <rect x="20" y="28" width="24" height="20" rx="4" fill="#10b981" stroke="#1a1a1a" stroke-width="4"/>
  <line x1="28" y1="28" x2="28" y2="14" stroke="#1a1a1a" stroke-width="4" stroke-linecap="round"/>
  <line x1="36" y1="28" x2="36" y2="14" stroke="#1a1a1a" stroke-width="4" stroke-linecap="round"/>
  <path d="M32,48 C32,52 32,56 32,56" stroke="#1a1a1a" stroke-width="4" stroke-linecap="round"/>
</svg>
```

**Dark theme:** swap `#1a1a1a` → `#e5e5e5` in all stroke/fill attributes.

**Inline data-URI**
```
data:image/svg+xml;utf8,<svg viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg' fill='none'><rect x='20' y='28' width='24' height='20' rx='4' fill='%2310b981' stroke='%231a1a1a' stroke-width='4'/><line x1='28' y1='28' x2='28' y2='14' stroke='%231a1a1a' stroke-width='4' stroke-linecap='round'/><line x1='36' y1='28' x2='36' y2='14' stroke='%231a1a1a' stroke-width='4' stroke-linecap='round'/><path d='M32,48 C32,52 32,56 32,56' stroke='%231a1a1a' stroke-width='4' stroke-linecap='round'/></svg>
```

### 27. Calendar (Operations)

Rectangle with accent header bar, two ring lines, and two rows of three date dots. Represents scheduled jobs, daily operations reports, shift handover, or time-based filtering.

**Light theme**
```xml
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" fill="none">
  <rect x="12" y="18" width="40" height="36" rx="4" stroke="#1a1a1a" stroke-width="4" fill="none"/>
  <rect x="12" y="18" width="40" height="12" rx="4" fill="#10b981" stroke="#1a1a1a" stroke-width="4"/>
  <line x1="22" y1="12" x2="22" y2="22" stroke="#1a1a1a" stroke-width="4" stroke-linecap="round"/>
  <line x1="42" y1="12" x2="42" y2="22" stroke="#1a1a1a" stroke-width="4" stroke-linecap="round"/>
  <circle cx="22" cy="38" r="2" fill="#1a1a1a"/>
  <circle cx="32" cy="38" r="2" fill="#1a1a1a"/>
  <circle cx="42" cy="38" r="2" fill="#1a1a1a"/>
  <circle cx="22" cy="46" r="2" fill="#1a1a1a"/>
  <circle cx="32" cy="46" r="2" fill="#1a1a1a"/>
  <circle cx="42" cy="46" r="2" fill="#1a1a1a"/>
</svg>
```

**Dark theme:** swap `#1a1a1a` → `#e5e5e5` in all stroke/fill attributes.

**Inline data-URI**
```
data:image/svg+xml;utf8,<svg viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg' fill='none'><rect x='12' y='18' width='40' height='36' rx='4' stroke='%231a1a1a' stroke-width='4' fill='none'/><rect x='12' y='18' width='40' height='12' rx='4' fill='%2310b981' stroke='%231a1a1a' stroke-width='4'/><line x1='22' y1='12' x2='22' y2='22' stroke='%231a1a1a' stroke-width='4' stroke-linecap='round'/><line x1='42' y1='12' x2='42' y2='22' stroke='%231a1a1a' stroke-width='4' stroke-linecap='round'/><circle cx='22' cy='38' r='2' fill='%231a1a1a'/><circle cx='32' cy='38' r='2' fill='%231a1a1a'/><circle cx='42' cy='38' r='2' fill='%231a1a1a'/><circle cx='22' cy='46' r='2' fill='%231a1a1a'/><circle cx='32' cy='46' r='2' fill='%231a1a1a'/><circle cx='42' cy='46' r='2' fill='%231a1a1a'/></svg>
```

### 28. Search (Observability)

Magnifying glass with a lightly tinted accent lens and a thick handle stroke. Represents search queries, SPL investigation, log exploration, or threat hunting.

**Light theme**
```xml
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" fill="none">
  <circle cx="28" cy="28" r="14" fill="#10b981" opacity="0.2"/>
  <circle cx="28" cy="28" r="14" stroke="#1a1a1a" stroke-width="4"/>
  <line x1="38" y1="38" x2="52" y2="52" stroke="#1a1a1a" stroke-width="5" stroke-linecap="round"/>
</svg>
```

**Dark theme:** swap `#1a1a1a` → `#e5e5e5` in all stroke/fill attributes.

**Inline data-URI**
```
data:image/svg+xml;utf8,<svg viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg' fill='none'><circle cx='28' cy='28' r='14' fill='%2310b981' opacity='0.2'/><circle cx='28' cy='28' r='14' stroke='%231a1a1a' stroke-width='4'/><line x1='38' y1='38' x2='52' y2='52' stroke='%231a1a1a' stroke-width='5' stroke-linecap='round'/></svg>
```

### 29. Lightning (Energy/Status)

Filled accent lightning bolt polygon with a dark outline. Represents electrical power, high-priority alerts, burst activity, or energy metrics.

**Light theme**
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <polygon points="38,8 20,34 30,34 26,56 44,30 34,30" fill="#10b981" stroke="#1a1a1a" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

**Dark theme:** swap `#1a1a1a` → `#e5e5e5` in all stroke/fill attributes.

**Inline data-URI**
```
data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64' fill='none'><polygon points='38,8 20,34 30,34 26,56 44,30 34,30' fill='%2310b981' stroke='%231a1a1a' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'/></svg>
```

### 30. Stethoscope (Healthcare)

U-shaped tube connecting two earpiece dots at the top to a large accent chest piece at the bottom. Represents healthcare dashboards, patient monitoring, medical device telemetry, or clinical operations.

**Light theme**
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <path d="M16 12 C16 22 12 30 12 38 C12 46 20 50 32 50 C44 50 52 46 52 38 C52 30 48 22 48 12" stroke="#1a1a1a" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  <line x1="32" y1="50" x2="32" y2="52" stroke="#1a1a1a" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="32" cy="52" r="7" fill="#10b981" stroke="#1a1a1a" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="16" cy="12" r="4" fill="#10b981" stroke="#1a1a1a" stroke-width="2"/>
  <circle cx="48" cy="12" r="4" fill="#10b981" stroke="#1a1a1a" stroke-width="2"/>
</svg>
```

**Dark theme:** swap `#1a1a1a` → `#e5e5e5` in all stroke/fill attributes.

**Inline data-URI**
```
data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64' fill='none'><path d='M16 12 C16 22 12 30 12 38 C12 46 20 50 32 50 C44 50 52 46 52 38 C52 30 48 22 48 12' stroke='%231a1a1a' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'/><line x1='32' y1='50' x2='32' y2='52' stroke='%231a1a1a' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'/><circle cx='32' cy='52' r='7' fill='%2310b981' stroke='%231a1a1a' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'/><circle cx='16' cy='12' r='4' fill='%2310b981' stroke='%231a1a1a' stroke-width='2'/><circle cx='48' cy='12' r='4' fill='%2310b981' stroke='%231a1a1a' stroke-width='2'/></svg>
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
