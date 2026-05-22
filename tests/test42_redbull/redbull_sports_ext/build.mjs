/**
 * build.mjs — esbuild bundler for redbull_sports_ext Extension API vizs
 *
 * Usage:
 *   node build.mjs           — one-shot build
 *   node build.mjs --watch   — watch mode (rebuilds on source change)
 *
 * Output: stage/redbull_sports_ext/appserver/static/visualizations/{viz}/
 *   - visualization.js   (ESM bundle, @splunk/dashboard-studio-extension kept as external)
 *   - config.json        (copied from source)
 */

import { build, context } from 'esbuild';
import { readdir, copyFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const APP_ID      = 'redbull_sports_ext';
const VIZ_BASE    = resolve(__dirname, 'visualizations');
const STAGE_BASE  = resolve(__dirname, 'stage', APP_ID, 'appserver', 'static', 'visualizations');
const IS_WATCH    = process.argv.includes('--watch');

async function getVizDirs() {
    const entries = await readdir(VIZ_BASE, { withFileTypes: true });
    return entries
        .filter(e => e.isDirectory())
        .map(e => e.name);
}

async function buildViz(vizName) {
    const srcFile   = join(VIZ_BASE, vizName, 'src', 'visualization.js');
    const configSrc = join(VIZ_BASE, vizName, 'config.json');
    const outDir    = join(STAGE_BASE, vizName);
    const outFile   = join(outDir, 'visualization.js');
    const configOut = join(outDir, 'config.json');

    if (!existsSync(srcFile)) {
        console.warn(`[build] SKIP ${vizName}: src/visualization.js not found`);
        return;
    }

    await mkdir(outDir, { recursive: true });

    const buildOpts = {
        entryPoints: [srcFile],
        outfile:     outFile,
        bundle:      true,
        format:      'iife',
        platform:    'browser',
        target:      ['es2020'],
        // Bundle @splunk/dashboard-studio-extension INTO the viz (it uses postMessage to talk to parent)
        logLevel:    'info'
    };

    if (IS_WATCH) {
        const ctx = await context(buildOpts);
        await ctx.watch();
        console.log(`[build] Watching ${vizName}...`);
    } else {
        await build(buildOpts);
        console.log(`[build] Built ${vizName} -> ${outFile}`);
    }

    // Copy config.json alongside built viz
    if (existsSync(configSrc)) {
        await copyFile(configSrc, configOut);
        console.log(`[build] Copied config.json for ${vizName}`);
    } else {
        console.warn(`[build] WARN: no config.json found for ${vizName}`);
    }
}

async function main() {
    const vizDirs = await getVizDirs();
    console.log(`[build] Building ${vizDirs.length} viz(s): ${vizDirs.join(', ')}`);

    await Promise.all(vizDirs.map(buildViz));

    if (!IS_WATCH) {
        console.log('[build] All vizs built successfully.');
    }
}

main().catch(err => {
    console.error('[build] ERROR:', err.message || err);
    process.exit(1);
});
