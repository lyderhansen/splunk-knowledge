/**
 * package.mjs — packages ext_api_test_pack into a Splunk .spl archive
 *
 * Usage: node package.mjs
 *
 * Steps:
 *   1. Copy app.conf to stage/ext_api_test_pack/default/app.conf (with full stanzas)
 *   2. Generate default/visualizations.conf (framework_type=studio_visualization per viz)
 *   3. Generate metadata/default.meta
 *   4. Generate static/appIcon.png placeholder (36x36 PNG)
 *   5. Generate preview.png placeholder per viz (116x76 PNG)
 *   6. Generate README/savedsearches.conf.spec
 *   7. Generate default/data/ui/nav/default.xml
 *   8. Create dist/ext_api_test_pack.spl as a tar.gz of the staged app
 *
 * Uses COPYFILE_DISABLE=1 on macOS to prevent resource fork corruption.
 */

import { readdir, mkdir, writeFile, readFile, stat } from 'fs/promises';
import { existsSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import zlib from 'zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));

const APP_ID    = 'ext_api_test_pack';
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
        'description = Extension API Test Pack — 3 Canvas 2D vizs using Splunk Dashboard Studio Extension API',
        '',
        '[ui]',
        `label = Extension API Test Pack`,
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
        vizConf += `[${APP_ID}.${vizName}]\n`;
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

    // 4. Generate static/appIcon.png (36x36, brand teal #4ECDC4)
    const staticDir = join(STAGE_DIR, 'static');
    await mkdir(staticDir, { recursive: true });
    const iconColor = hexToRgb('#4ECDC4');
    const iconBuf   = buildSolidPng(36, 36, iconColor.r, iconColor.g, iconColor.b);
    await writeFile(join(staticDir, 'appIcon.png'), iconBuf);
    console.log(`[package] Wrote static/appIcon.png (36x36, ${iconBuf.length} bytes)`);

    // 5. Generate preview.png per viz (116x76, alternating brand palette)
    const brandPalette = [
        hexToRgb('#4ECDC4'),
        hexToRgb('#45B7D1'),
        hexToRgb('#96CEB4')
    ];
    for (let i = 0; i < vizDirs.length; i++) {
        const vizName    = vizDirs[i];
        const vizStageDir = join(stageVizBase, vizName);
        await mkdir(vizStageDir, { recursive: true });
        const col     = brandPalette[i % brandPalette.length];
        const preview = buildSolidPng(116, 76, col.r, col.g, col.b);
        await writeFile(join(vizStageDir, 'preview.png'), preview);
        console.log(`[package] Wrote preview.png for ${vizName} (116x76, ${preview.length} bytes)`);
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
