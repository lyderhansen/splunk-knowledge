# build.mjs Template (Extension API)

This is the canonical esbuild configuration for bundling Extension API viz `src/visualization.js` files into IIFE output. Claude copies this entire template, fills `{{APP_ID}}`, and writes the result as `build.mjs` at the app root during vp-create Step 1 (Extension API). The template is proven working in the Red Bull live build (Phase 36 / test42) and produces compact IIFE bundles (~3KB overhead per viz) that Splunk loads correctly via `<script>` injection.

## WRONG / RIGHT — EF-01 (IIFE format) and EF-02 (bundled extension)

| Finding | WRONG | RIGHT |
|---------|-------|-------|
| **EF-01** | `format: 'esm'` | `format: 'iife'` |
| **EF-02** | `external: ['@splunk/dashboard-studio-extension']` | No `external` clause |

**EF-01 — ESM vs IIFE:** Splunk loads `visualization.js` with a plain `<script>` tag, not `<script type="module">`. An ESM bundle fails immediately with `Cannot use import statement outside a module`. The IIFE format wraps the output in an immediately-invoked function expression that runs in any script context.

**EF-02 — Bundled extension package:** The iframe sandbox that hosts Extension API vizs does not expose `@splunk/dashboard-studio-extension` as a global. Marking it `external` leaves it as a bare `require('@splunk/dashboard-studio-extension')` call that fails at runtime with `require is not defined`. Bundle it into the viz output instead — the postMessage protocol it uses works fine inside the IIFE.

## Placeholders

| Placeholder | Source |
|-------------|--------|
| `{{APP_ID}}` | Viz pack app id set during vp-init (e.g., `acme_sports_ext`); also present in the visual language file |

## Template

```javascript
/**
 * build.mjs — esbuild bundler for {{APP_ID}} Extension API vizs
 *
 * Usage:
 *   node build.mjs           — one-shot build
 *   node build.mjs --watch   — watch mode (rebuilds on source change)
 *
 * Output: stage/{{APP_ID}}/appserver/static/visualizations/{viz}/
 *   - visualization.js   (IIFE bundle, @splunk/dashboard-studio-extension bundled into output)
 *   - config.json        (copied from source)
 */

import { build, context } from 'esbuild';
import { readdir, copyFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const APP_ID      = '{{APP_ID}}';
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
```

## Notes

- Node.js 22.0.0+ required (matches the `package.json` template requirement in `visualization-js-template.md`)
- Run modes: `node build.mjs` (one-shot) and `node build.mjs --watch` (rebuilds on source change)
- The script auto-discovers all subdirectories under `visualizations/` — Claude does not list viz names anywhere in this file
- Output goes to `stage/{{APP_ID}}/appserver/static/visualizations/{viz}/visualization.js` ready for `package.mjs` to tarball
- Pairs with `package-mjs-template.md` in the same directory — run `node build.mjs` first, then `node package.mjs`
