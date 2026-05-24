# package.mjs Template (Extension API)

This is the canonical Splunk app packaging script for Extension API viz packs. It generates: `app.conf` (5 required stanzas), `visualizations.conf` (with bare stanzas per EF-03), `metadata/default.meta`, `static/appIcon.png`, per-viz `preview.png`, `README/savedsearches.conf.spec`, `default/data/ui/nav/default.xml`, and the final `.spl` tarball. Claude copies this template, fills `{{APP_ID}}`, `{{PACK_DESCRIPTION}}`, `{{PACK_LABEL}}`, and the brand-palette hex placeholders, then writes the result as `package.mjs` at the app root during vp-create Step 1 (Extension API). The template is proven working in the Red Bull live build (Phase 36 / test42).

## WRONG / RIGHT — EF-03 (bare stanza names)

| Finding | WRONG | RIGHT |
|---------|-------|-------|
| **EF-03** | `` vizConf += `[${APP_ID}.${vizName}]\n`; `` | `` vizConf += `[${vizName}]\n`; `` |

**EF-03 — Bare stanza names:** Splunk resolves app context automatically when a `visualizations.conf` stanza is read from inside an app's `default/` directory. Prefixing the stanza name with `${APP_ID}.` produces stanza names like `[acme_sports_ext.kpi_tile]` that Splunk does not match against the viz type sent from Dashboard Studio, causing "unknown visualization type" errors at render time. Bare `[${vizName}]` is the only working form.

Aligns with the bare `[{{VIZ_NAME}}]` stanza pattern documented in [conf-templates.md](conf-templates.md) — Classic and Extension paths use the same bare-stanza convention.

## Placeholders

| Placeholder | Source | Location in template |
|-------------|--------|----------------------|
| `{{APP_ID}}` | Viz pack app id set during vp-init (e.g., `acme_sports_ext`) | `const APP_ID` declaration near the top |
| `{{PACK_DESCRIPTION}}` | Short pack description from visual language | `description =` line in the `[launcher]` stanza of `app.conf` |
| `{{PACK_LABEL}}` | Human-readable pack name from visual language | `label =` line in the `[ui]` stanza of `app.conf` |
| `{{ACCENT_HEX}}` | Primary brand hex (e.g., `#DB0032`) for the 36x36 `appIcon.png` | `hexToRgb('{{ACCENT_HEX}}')` call for `iconColor` |
| `{{PRIMARY_HEX}}` | First brand palette color — used for viz 0 preview.png | First entry in `brandPalette` array |
| `{{SECONDARY_HEX}}` | Second brand palette color — used for viz 1 preview.png | Second entry in `brandPalette` array |
| `{{TERTIARY_HEX}}` | Third brand palette color — used for viz 2 preview.png | Third entry in `brandPalette` array |
| `${PREVIEW_SCRIPT_PATH}` | Absolute path to generate_previews.py — typically `<plugin-root>/skills/vp-create/scripts/generate_previews.py` | Set during vp-create Step 1 (Extension API) when scaffolding package.mjs |

Add more `hexToRgb()` entries if the pack has more than three vizs. The modulo `i % brandPalette.length` recycles colors if vizs exceed palette length.

## Template

```javascript
/**
 * package.mjs — packages {{APP_ID}} into a Splunk .spl archive
 *
 * Usage: node package.mjs
 *
 * Steps:
 *   1. Copy app.conf to stage/{{APP_ID}}/default/app.conf (with full stanzas)
 *   2. Generate default/visualizations.conf (framework_type=studio_visualization per viz)
 *   3. Generate metadata/default.meta
 *   4. Generate static/appIcon.png (36x36, Red Bull red)
 *   5. Generate preview.png per viz (116x76, Red Bull brand palette)
 *   6. Generate README/savedsearches.conf.spec
 *   7. Generate default/data/ui/nav/default.xml
 *   8. Create dist/{{APP_ID}}.spl as a tar.gz of the staged app
 *
 * Uses COPYFILE_DISABLE=1 on macOS to prevent resource fork corruption.
 */

import { readdir, mkdir, writeFile, stat } from 'fs/promises';
import { existsSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import zlib from 'zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));

const APP_ID    = '{{APP_ID}}';
const STAGE_DIR = resolve(__dirname, 'stage', APP_ID);
const DIST_DIR  = resolve(__dirname, 'dist');
const VIZ_BASE  = resolve(__dirname, 'visualizations');
const SPL_OUT   = join(DIST_DIR, `${APP_ID}.spl`);

// --- CRC32 table (PNG spec) ---
var CRC_TABLE = null;
function initCrcTable() {
    if (CRC_TABLE) return;
    CRC_TABLE = new Uint32Array(256);
    for (var i = 0; i < 256; i++) {
        var c = i;
        for (var k = 0; k < 8; k++) {
            c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        }
        CRC_TABLE[i] = c;
    }
}

function computeCrc32(buf) {
    initCrcTable();
    var crc = 0xFFFFFFFF;
    for (var i = 0; i < buf.length; i++) {
        crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ buf[i]) & 0xFF];
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
}

function pngChunk(type, data) {
    var len   = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    var typeB = Buffer.from(type, 'ascii');
    var combined = Buffer.concat([typeB, data]);
    var crc   = computeCrc32(combined);
    var crcB  = Buffer.alloc(4);
    crcB.writeUInt32BE(crc, 0);
    return Buffer.concat([len, typeB, data, crcB]);
}

function buildSolidPng(width, height, r, g, b) {
    // Build raw image data rows: filter-byte (0=None) + RGB triplets
    var rowSize = 1 + width * 3;
    var rawData = Buffer.alloc(height * rowSize);
    for (var row = 0; row < height; row++) {
        var offset = row * rowSize;
        rawData[offset] = 0; // filter: None
        for (var col = 0; col < width; col++) {
            rawData[offset + 1 + col * 3 + 0] = r;
            rawData[offset + 1 + col * 3 + 1] = g;
            rawData[offset + 1 + col * 3 + 2] = b;
        }
    }
    var compressed = zlib.deflateSync(rawData, { level: 6 });

    var ihdrData = Buffer.alloc(13);
    ihdrData.writeUInt32BE(width, 0);
    ihdrData.writeUInt32BE(height, 4);
    ihdrData[8]  = 8; // bit depth
    ihdrData[9]  = 2; // color type: truecolor RGB
    ihdrData[10] = 0; // compression method
    ihdrData[11] = 0; // filter method
    ihdrData[12] = 0; // interlace method

    var signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    return Buffer.concat([
        signature,
        pngChunk('IHDR', ihdrData),
        pngChunk('IDAT', compressed),
        pngChunk('IEND', Buffer.alloc(0))
    ]);
}

function hexToRgb(hex) {
    return {
        r: parseInt(hex.slice(1, 3), 16),
        g: parseInt(hex.slice(3, 5), 16),
        b: parseInt(hex.slice(5, 7), 16)
    };
}

async function getVizDirs() {
    const entries = await readdir(VIZ_BASE, { withFileTypes: true });
    return entries.filter(e => e.isDirectory()).map(e => e.name);
}

async function main() {
    const vizDirs = await getVizDirs();
    console.log(`[package] Packaging ${vizDirs.length} viz(s): ${vizDirs.join(', ')}`);

    // Check stage/visualizations exists (must run build first)
    const stageVizBase = join(STAGE_DIR, 'appserver', 'static', 'visualizations');
    if (!existsSync(stageVizBase)) {
        console.error('[package] ERROR: stage/ directory missing — run "node build.mjs" first');
        process.exit(1);
    }

    // 1. Write default/app.conf with 5 required stanzas
    const defaultDir = join(STAGE_DIR, 'default');
    await mkdir(defaultDir, { recursive: true });

    const fullAppConf = [
        '[package]',
        `id = ${APP_ID}`,
        'version = 1.0.0',
        '',
        '[launcher]',
        'version = 1.0.0',
        'author = Claude',
        'description = {{PACK_DESCRIPTION}}',
        '',
        '[ui]',
        'label = {{PACK_LABEL}}',
        'is_visible = true',
        '',
        '[install]',
        'build = 1',
        'is_configured = true',
        '',
        '[triggers]',
        'reload.visualizations = simple',
        ''
    ].join('\n');
    await writeFile(join(defaultDir, 'app.conf'), fullAppConf, 'utf8');
    console.log('[package] Wrote default/app.conf (5 stanzas)');

    // 2. Generate visualizations.conf with framework_type=studio_visualization + allow_user_selection
    let vizConf = '';
    for (const vizName of vizDirs) {
        const label = vizName.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        vizConf += `[${vizName}]\n`;
        vizConf += `framework_type = studio_visualization\n`;
        vizConf += `allow_user_selection = true\n`;
        vizConf += `label = ${label}\n\n`;
    }
    await writeFile(join(defaultDir, 'visualizations.conf'), vizConf, 'utf8');
    console.log('[package] Wrote default/visualizations.conf');

    // 3. Generate metadata/default.meta
    const metaDir = join(STAGE_DIR, 'metadata');
    await mkdir(metaDir, { recursive: true });
    const metaContent = `[]
default
export = system
`;
    await writeFile(join(metaDir, 'default.meta'), metaContent, 'utf8');
    console.log('[package] Wrote metadata/default.meta');

    // 4. Generate static/appIcon.png (36x36, brand accent color)
    const staticDir = join(STAGE_DIR, 'static');
    await mkdir(staticDir, { recursive: true });
    const iconColor = hexToRgb('{{ACCENT_HEX}}');
    const iconBuf   = buildSolidPng(36, 36, iconColor.r, iconColor.g, iconColor.b);
    await writeFile(join(staticDir, 'appIcon.png'), iconBuf);
    console.log(`[package] Wrote static/appIcon.png (36x36, ${iconBuf.length} bytes)`);

    // 5. Generate preview.png per viz (D-09: delegate to generate_previews.py for Pillow rendering)
    // The plugin's vp-create/scripts/generate_previews.py owns preview.png generation.
    // It produces Pillow-rendered miniatures using brand colors from shared/theme.js and bundled Inter font.
    // If python3 or Pillow are unavailable, fall back to buildSolidPng (flat-color rectangle per viz).
    const previewScript = '${PREVIEW_SCRIPT_PATH}'; // Templated to absolute path of generate_previews.py
    const previewStageDir = STAGE_DIR;
    try {
        execSync(`python3 "${previewScript}" "${previewStageDir}"`, { stdio: 'inherit' });
        console.log(`[package] preview.png per viz generated by generate_previews.py`);
    } catch (e) {
        console.warn(`[package] generate_previews.py failed (${e.message}); falling back to buildSolidPng`);
        // Fallback path (D-02): per-viz flat-color preview using brand palette
        const brandPalette = [
            hexToRgb('{{PRIMARY_HEX}}'),
            hexToRgb('{{SECONDARY_HEX}}'),
            hexToRgb('{{TERTIARY_HEX}}')
        ];
        for (let i = 0; i < vizDirs.length; i++) {
            const vizName    = vizDirs[i];
            const vizStageDir = join(stageVizBase, vizName);
            await mkdir(vizStageDir, { recursive: true });
            const col     = brandPalette[i % brandPalette.length];
            const preview = buildSolidPng(116, 76, col.r, col.g, col.b);
            await writeFile(join(vizStageDir, 'preview.png'), preview);
            console.log(`[package] (fallback) Wrote preview.png for ${vizName} (116x76, ${preview.length} bytes)`);
        }
    }

    // 6. Generate README/savedsearches.conf.spec
    const readmeDir = join(STAGE_DIR, 'README');
    await mkdir(readmeDir, { recursive: true });
    await writeFile(join(readmeDir, 'savedsearches.conf.spec'),
        `# savedsearches.conf.spec\n# Auto-generated by package.mjs for ${APP_ID}\n`, 'utf8');
    console.log('[package] Wrote README/savedsearches.conf.spec');

    // 7. Generate default/data/ui/nav/default.xml
    const navDir = join(STAGE_DIR, 'default', 'data', 'ui', 'nav');
    await mkdir(navDir, { recursive: true });
    await writeFile(join(navDir, 'default.xml'),
        `<nav>\n  <view name="search" default="true" />\n</nav>\n`, 'utf8');
    console.log('[package] Wrote default/data/ui/nav/default.xml');

    // 8. Create dist/ and package .spl with COPYFILE_DISABLE=1 (macOS resource fork protection)
    await mkdir(DIST_DIR, { recursive: true });
    const stageParent = resolve(__dirname, 'stage');
    const tarCmd = `COPYFILE_DISABLE=1 tar czf "${SPL_OUT}" -C "${stageParent}" "${APP_ID}"`;
    console.log(`[package] Running: ${tarCmd}`);
    execSync(tarCmd, { stdio: 'inherit' });

    // Verify output
    const stats = await stat(SPL_OUT);
    console.log(`[package] Created: ${SPL_OUT}`);
    console.log(`[package] Size: ${stats.size} bytes`);
    console.log('[package] Done.');
}

main().catch(err => {
    console.error('[package] ERROR:', err.message || err);
    process.exit(1);
});
```

## Notes

- Run with: `node package.mjs` — must be run AFTER `node build.mjs` (the script checks for `stage/` and exits if missing)
- Generates a `.spl` tarball at `dist/{{APP_ID}}.spl` ready for `splunk install app`
- Uses `COPYFILE_DISABLE=1` on the tar command (macOS resource fork protection — required per CLAUDE.md "macOS tar" constraint)
- The stanza-generation loop uses bare `[${vizName}]` — do NOT prefix with `${APP_ID}.` (EF-03 fix locked into place)
- Pure helper functions inside the script (CRC32, PNG chunk assembly, `buildSolidPng`) — keep verbatim, these are validated against the PNG spec
- The script auto-discovers vizs from `visualizations/` subdirectories — same auto-discovery pattern as `build.mjs`
- preview.png per viz is generated by [vp-create/scripts/generate_previews.py](../../vp-create/scripts/generate_previews.py) (Pillow + Inter font). buildSolidPng remains as a runtime fallback if python3 or Pillow are unavailable.
- The `${PREVIEW_SCRIPT_PATH}` placeholder must resolve to an absolute path at scaffolding time — relative paths break if package.mjs is run from a different cwd than the app root.
- Pairs with `build-mjs-template.md` in the same directory
