/**
 * package.mjs — packages ext_api_test_pack into a Splunk .spl archive
 *
 * Usage: node package.mjs
 *
 * Steps:
 *   1. Copy app.conf to stage/ext_api_test_pack/default/app.conf (with full stanzas)
 *   2. Generate default/visualizations.conf (framework_type=studio_visualization per viz)
 *   3. Generate metadata/default.meta
 *   4. Generate static/appIcon.png placeholder (1x1 PNG — satisfies structure; replace with real asset)
 *   5. Generate preview.png placeholder per viz (116x76 PNG)
 *   6. Generate README/savedsearches.conf.spec (required by validator)
 *   7. Create dist/ext_api_test_pack.spl as a tar.gz of the staged app
 *
 * Uses COPYFILE_DISABLE=1 on macOS to prevent resource fork corruption.
 */

import { readdir, mkdir, writeFile, copyFile, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));

const APP_ID     = 'ext_api_test_pack';
const STAGE_DIR  = resolve(__dirname, 'stage', APP_ID);
const DIST_DIR   = resolve(__dirname, 'dist');
const VIZ_BASE   = resolve(__dirname, 'visualizations');
const SPL_OUT    = join(DIST_DIR, `${APP_ID}.spl`);

// --- Minimal valid 116x76 PNG (brand-colored, not 1x1) ---
// This is a valid PNG header + IHDR + IDAT (flat teal fill) + IEND
// Generated as a small placeholder — replace with proper asset for production
function makePlaceholderPng116x76(hexColor) {
    // Build a minimal 116x76 solid-color PNG using raw Buffer
    // Use Node.js built-ins only — no PNG library
    const width  = 116;
    const height = 76;
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);

    // Build raw image data: each row = filter byte (0x00) + RGB triplets
    const rowSize = 1 + width * 3;
    const rawData = Buffer.alloc(height * rowSize);
    for (var row = 0; row < height; row++) {
        var offset = row * rowSize;
        rawData[offset] = 0; // filter type: None
        for (var col = 0; col < width; col++) {
            rawData[offset + 1 + col * 3 + 0] = r;
            rawData[offset + 1 + col * 3 + 1] = g;
            rawData[offset + 1 + col * 3 + 2] = b;
        }
    }

    // zlib-compress the raw data using Node's built-in zlib
    const zlib = await import('zlib');
    const compressed = zlib.deflateSync(rawData, { level: 6 });

    // PNG signature
    const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

    // IHDR chunk
    const ihdrData = Buffer.alloc(13);
    ihdrData.writeUInt32BE(width,  0);
    ihdrData.writeUInt32BE(height, 4);
    ihdrData[8]  = 8;  // bit depth
    ihdrData[9]  = 2;  // color type: RGB
    ihdrData[10] = 0;  // compression
    ihdrData[11] = 0;  // filter
    ihdrData[12] = 0;  // interlace
    const ihdrChunk = makeChunk('IHDR', ihdrData);

    // IDAT chunk
    const idatChunk = makeChunk('IDAT', compressed);

    // IEND chunk
    const iendChunk = makeChunk('IEND', Buffer.alloc(0));

    return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
    const { createHash } = await import('crypto');
    const len   = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeB = Buffer.from(type, 'ascii');
    // CRC32 of type + data
    const crc   = crc32(Buffer.concat([typeB, data]));
    const crcB  = Buffer.alloc(4);
    crcB.writeInt32BE(crc, 0);
    return Buffer.concat([len, typeB, data, crcB]);
}

// Simple CRC32 (PNG spec)
function crc32(buf) {
    var table = crc32.table;
    if (!table) {
        table = crc32.table = new Int32Array(256);
        for (var i = 0; i < 256; i++) {
            var c = i;
            for (var k = 0; k < 8; k++) {
                c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
            }
            table[i] = c;
        }
    }
    var crc = -1;
    for (var j = 0; j < buf.length; j++) {
        crc = (crc >>> 8) ^ table[(crc ^ buf[j]) & 0xFF];
    }
    return (crc ^ -1) >>> 0;
}

// --- Synchronous minimal 36x36 PNG for appIcon ---
function makePlaceholderPng36x36(hexColor) {
    const width  = 36;
    const height = 36;
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const zlib = require('zlib');
    const crypto = require('crypto');

    const rowSize = 1 + width * 3;
    const rawData = Buffer.alloc(height * rowSize);
    for (var row = 0; row < height; row++) {
        var offset = row * rowSize;
        rawData[offset] = 0;
        for (var col = 0; col < width; col++) {
            rawData[offset + 1 + col * 3 + 0] = r;
            rawData[offset + 1 + col * 3 + 1] = g;
            rawData[offset + 1 + col * 3 + 2] = b;
        }
    }
    const compressed = zlib.deflateSync(rawData, { level: 6 });
    const signature  = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

    function chunk(type, data) {
        var len  = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
        var typeB = Buffer.from(type, 'ascii');
        var c = -1;
        var combined = Buffer.concat([typeB, data]);
        for (var i = 0; i < combined.length; i++) {
            c = (c >>> 8) ^ crc32.table[(c ^ combined[i]) & 0xFF];
        }
        c = (c ^ -1) >>> 0;
        var crcB = Buffer.alloc(4); crcB.writeUInt32BE(c, 0);
        return Buffer.concat([len, typeB, data, crcB]);
    }

    // Init CRC table
    if (!crc32.table) {
        crc32.table = new Int32Array(256);
        for (var i = 0; i < 256; i++) {
            var cv = i;
            for (var k = 0; k < 8; k++) cv = (cv & 1) ? (0xEDB88320 ^ (cv >>> 1)) : (cv >>> 1);
            crc32.table[i] = cv;
        }
    }

    var ihdrData = Buffer.alloc(13);
    ihdrData.writeUInt32BE(width, 0); ihdrData.writeUInt32BE(height, 4);
    ihdrData[8] = 8; ihdrData[9] = 2;

    return Buffer.concat([signature, chunk('IHDR', ihdrData), chunk('IDAT', compressed), chunk('IEND', Buffer.alloc(0))]);
}

async function getVizDirs() {
    const entries = await readdir(VIZ_BASE, { withFileTypes: true });
    return entries.filter(e => e.isDirectory()).map(e => e.name);
}

async function main() {
    const vizDirs = await getVizDirs();
    console.log(`[package] Packaging ${vizDirs.length} viz(s): ${vizDirs.join(', ')}`);

    // Check stage exists (must run build first)
    const stageVizBase = join(STAGE_DIR, 'appserver', 'static', 'visualizations');
    if (!existsSync(stageVizBase)) {
        console.error('[package] ERROR: stage/ directory missing — run "node build.mjs" first');
        process.exit(1);
    }

    // 1. Copy and enhance app.conf into stage/default/app.conf
    const defaultDir = join(STAGE_DIR, 'default');
    await mkdir(defaultDir, { recursive: true });

    // Read source app.conf
    const srcAppConf = resolve(__dirname, 'package', 'app', 'app.conf');
    const srcConfTxt = existsSync(srcAppConf) ? await readFile(srcAppConf, 'utf8') : '';

    // Validator requires 5+ stanzas in app.conf
    const fullAppConf = `[package]
id = ${APP_ID}
version = 1.0.0

[launcher]
version = 1.0.0
author = Claude
description = Extension API Test Pack — 3 Canvas 2D vizs using Splunk Dashboard Studio Extension API

[ui]
label = Extension API Test Pack
is_visible = true

[install]
build = 1
is_configured = true

[triggers]
reload.visualizations = simple
`;
    await writeFile(join(defaultDir, 'app.conf'), fullAppConf, 'utf8');
    console.log('[package] Wrote default/app.conf');

    // 2. Generate visualizations.conf
    let vizConf = '';
    for (const vizName of vizDirs) {
        vizConf += `[${APP_ID}.${vizName}]\n`;
        vizConf += `framework_type = studio_visualization\n`;
        vizConf += `allow_user_selection = true\n`;
        vizConf += `label = ${vizName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}\n\n`;
    }
    await writeFile(join(defaultDir, 'visualizations.conf'), vizConf, 'utf8');
    console.log('[package] Wrote default/visualizations.conf');

    // 3. Generate metadata/default.meta
    const metaDir = join(STAGE_DIR, 'metadata');
    await mkdir(metaDir, { recursive: true });
    await writeFile(join(metaDir, 'default.meta'), '[]\\ndefault\\nexport = system\n', 'utf8');
    console.log('[package] Wrote metadata/default.meta');

    // 4. Generate static/appIcon.png (36x36 placeholder with brand teal)
    const staticDir = join(STAGE_DIR, 'static');
    await mkdir(staticDir, { recursive: true });
    const iconBuf = makePlaceholderPng36x36('#4ECDC4');
    await writeFile(join(staticDir, 'appIcon.png'), iconBuf);
    console.log('[package] Wrote static/appIcon.png (36x36 placeholder)');

    // 5. Generate preview.png (116x76 placeholder) per viz in appserver/static/visualizations/{viz}/
    for (const vizName of vizDirs) {
        const vizStageDir = join(stageVizBase, vizName);
        await mkdir(vizStageDir, { recursive: true });
        // Use alternating brand colors for visual variety
        const colors = ['#4ECDC4', '#45B7D1', '#96CEB4'];
        const colorIdx = vizDirs.indexOf(vizName) % colors.length;
        const previewBuf = makePlaceholderPng36x36('#4ECDC4'); // reuse 36x36 logic — swap dims below
        // Build a proper 116x76 PNG inline
        const preview = buildPreviewPng116x76(colors[colorIdx]);
        await writeFile(join(vizStageDir, 'preview.png'), preview);
        console.log(`[package] Wrote preview.png for ${vizName}`);
    }

    // 6. Generate README/savedsearches.conf.spec
    const readmeDir = join(STAGE_DIR, 'README');
    await mkdir(readmeDir, { recursive: true });
    await writeFile(join(readmeDir, 'savedsearches.conf.spec'), `# savedsearches.conf.spec\n# Auto-generated by package.mjs for ${APP_ID}\n`, 'utf8');
    console.log('[package] Wrote README/savedsearches.conf.spec');

    // 7. Generate default/data/ui/nav/default.xml
    const navDir = join(STAGE_DIR, 'default', 'data', 'ui', 'nav');
    await mkdir(navDir, { recursive: true });
    await writeFile(join(navDir, 'default.xml'), `<nav>\n  <view name="search" default="true" />\n</nav>\n`, 'utf8');
    console.log('[package] Wrote default/data/ui/nav/default.xml');

    // 8. Create dist directory and package .spl
    await mkdir(DIST_DIR, { recursive: true });

    // Use COPYFILE_DISABLE=1 to prevent macOS resource fork corruption
    const stageParent = resolve(__dirname, 'stage');
    const tarCmd = `COPYFILE_DISABLE=1 tar czf "${SPL_OUT}" -C "${stageParent}" "${APP_ID}"`;
    console.log(`[package] Running: ${tarCmd}`);
    execSync(tarCmd, { stdio: 'inherit' });

    // Verify output
    const { statSync } = await import('fs');
    const stats = statSync(SPL_OUT);
    console.log(`[package] Created ${SPL_OUT} (${stats.size} bytes)`);
    console.log('[package] Done.');
}

// --- Inline 116x76 PNG builder (synchronous, no external deps) ---
function buildPreviewPng116x76(hexColor) {
    const zlib   = require('zlib');
    const width  = 116;
    const height = 76;
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);

    // Init CRC table once
    if (!crc32.table) {
        crc32.table = new Int32Array(256);
        for (var i = 0; i < 256; i++) {
            var cv = i;
            for (var k = 0; k < 8; k++) cv = (cv & 1) ? (0xEDB88320 ^ (cv >>> 1)) : (cv >>> 1);
            crc32.table[i] = cv;
        }
    }

    const rowSize = 1 + width * 3;
    const rawData = Buffer.alloc(height * rowSize);
    for (var row = 0; row < height; row++) {
        var offset = row * rowSize;
        rawData[offset] = 0; // filter: None
        for (var col = 0; col < width; col++) {
            rawData[offset + 1 + col * 3 + 0] = r;
            rawData[offset + 1 + col * 3 + 1] = g;
            rawData[offset + 1 + col * 3 + 2] = b;
        }
    }
    const compressed = zlib.deflateSync(rawData, { level: 6 });

    function chunk(type, data) {
        var len   = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
        var typeB = Buffer.from(type, 'ascii');
        var combined = Buffer.concat([typeB, data]);
        var c = -1;
        for (var i = 0; i < combined.length; i++) {
            c = (c >>> 8) ^ crc32.table[(c ^ combined[i]) & 0xFF];
        }
        c = (c ^ -1) >>> 0;
        var crcB = Buffer.alloc(4); crcB.writeUInt32BE(c, 0);
        return Buffer.concat([len, typeB, data, crcB]);
    }

    var ihdrData = Buffer.alloc(13);
    ihdrData.writeUInt32BE(width, 0); ihdrData.writeUInt32BE(height, 4);
    ihdrData[8] = 8; ihdrData[9] = 2; // 8-bit RGB

    const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    return Buffer.concat([signature, chunk('IHDR', ihdrData), chunk('IDAT', compressed), chunk('IEND', Buffer.alloc(0))]);
}

main().catch(err => {
    console.error('[package] ERROR:', err.message || err);
    process.exit(1);
});
