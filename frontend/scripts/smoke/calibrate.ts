/**
 * calibrate.ts — smoke calibration run (docs/PROTOCOL.md P8).
 *
 * This script contains NO assertions and never fails on a measurement: it opens
 * the known states and prints the numbers used to choose the thresholds and the
 * two allowlists (modals, console noise) that states.ts encodes as constants.
 *
 * Run: npm run smoke:calibrate                    (dev server must be up)
 *      npm run smoke:calibrate -- --write-baseline
 *
 * With --write-baseline it also regenerates console-baseline.json from the
 * current run. That file records the console debt that exists today; it does
 * not absolve it. See README.md.
 */

import { chromium } from '@playwright/test';
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import { BASE_URL, FIXED_ALLOWLIST, STATES, STATUSBAR_INTERSECT_TOLERANCE_PX, VIEWPORT_HEIGHT, VIEWPORT_WIDTH, openState } from './states.ts';
import type { SmokeState } from './states.ts';
import { measure, tallyConsole } from './assertions.ts';
import type { ConsoleBaseline, Measurements, Rect } from './assertions.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const BASELINE_PATH = resolve(HERE, 'console-baseline.json');

const WRITE_BASELINE = process.argv.includes('--write-baseline');

interface StateResult {
    state: SmokeState;
    reached: boolean;
    measurements: Measurements | null;
    logs: Array<{ type: string; text: string }>;
    pageErrors: string[];
}

function pad(n: number): string {
    return String(Math.round(n)).padStart(5, ' ');
}

function fmtRect(r: Rect | null): string {
    if (!r) return 'ABSENT';
    return `x=${pad(r.x)} y=${pad(r.y)} w=${pad(r.w)} h=${pad(r.h)}  (right=${Math.round(r.x + r.w)}, bottom=${Math.round(r.y + r.h)})`;
}

function gitSha(): string {
    try {
        return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
            .toString()
            .trim();
    } catch {
        return 'unknown';
    }
}

async function runState(
    browser: Awaited<ReturnType<typeof chromium.launch>>,
    state: SmokeState,
): Promise<StateResult> {
    const opened = await openState(browser, state);
    let measurements: Measurements | null = null;
    if (opened.reached) {
        measurements = await measure(opened.page, FIXED_ALLOWLIST, STATUSBAR_INTERSECT_TOLERANCE_PX);
    }
    await opened.ctx.close();
    return {
        state,
        reached: opened.reached,
        measurements,
        logs: opened.logs,
        pageErrors: opened.pageErrors,
    };
}

function report(r: StateResult): void {
    console.log('');
    console.log('='.repeat(78));
    console.log(`STATE: ${r.state.id}`);
    console.log(r.state.note);
    console.log('='.repeat(78));

    if (!r.reached || !r.measurements) {
        console.log('  NOT REACHED — setup did not complete.');
        for (const e of r.pageErrors) console.log(`  pageerror: ${e}`);
        return;
    }

    const m = r.measurements;

    console.log('');
    console.log('-- 7. viewport --------------------------------------------------------');
    console.log(`  ${m.viewport.w} x ${m.viewport.h}  (fixed constant, not the window size)`);

    console.log('');
    console.log('-- 1. canvas vs main --------------------------------------------------');
    console.log(`  .editor-v2__canvas   ${fmtRect(m.canvas)}`);
    console.log(`  .editor-v2__main     ${fmtRect(m.main)}`);
    console.log(
        `  ratio canvas.w / main.w = ${m.canvasOverMainRatio === null ? 'N/A (one of the two is absent)' : m.canvasOverMainRatio.toFixed(4)}`,
    );

    console.log('');
    console.log('-- 2. node and edge counts --------------------------------------------');
    console.log(`  .react-flow__node    ${m.nodeCount}`);
    console.log(`  .react-flow__edge    ${m.edgeCount}`);
    console.log(`  .react-flow__minimap ${m.minimapCount}`);

    console.log('');
    console.log('-- 3. onlyRenderVisibleElements ---------------------------------------');
    console.log('  Not set on <ReactFlow> anywhere in the codebase (grep over frontend/src');
    console.log('  returns no hit; the props block is EditorV2.tsx:3791-3830). The library');
    console.log('  default is false, so every node is mounted regardless of the viewport:');
    console.log('  the count above does NOT depend on zoom or pan.');

    console.log('');
    console.log('-- 4. status bar ------------------------------------------------------');
    console.log(`  .app-statusbar       ${fmtRect(m.statusbar)}`);
    console.log(
        `  computed position    ${m.statusbarPosition ?? 'N/A'}${m.statusbarPosition === 'fixed' ? '   <-- IS fixed' : '   (not fixed)'}`,
    );

    console.log('');
    console.log('-- 5. visible position:fixed elements ---------------------------------');
    if (m.fixedElements.length === 0) {
        console.log('  none');
    } else {
        console.log(`  ${m.fixedElements.length} element(s). "HITS" = intersects the status bar rect.`);
        for (const f of m.fixedElements) {
            const flag = f.overlapW > 0 && f.overlapH > 0 ? 'HITS ' : '     ';
            const allow = f.allowlisted ? ' [allowlisted]' : '';
            console.log(`  ${flag} z=${(f.zIndex || 'auto').padStart(6)}  ${fmtRect(f.rect)}  ${f.selector}${allow}`);
        }
    }

    console.log('');
    console.log('-- 6. console output --------------------------------------------------');
    if (r.logs.length === 0) {
        console.log('  none');
    } else {
        console.log(`  ${r.logs.length} message(s), in order, full text:`);
        for (const l of r.logs) console.log(`  [${l.type}] ${l.text}`);
    }
    if (r.pageErrors.length > 0) {
        console.log(`  ${r.pageErrors.length} uncaught page error(s):`);
        for (const e of r.pageErrors) console.log(`  [pageerror] ${e}`);
    }
}

async function main(): Promise<void> {
    console.log('smoke calibration — no assertions, measurements only');
    console.log(`base url : ${BASE_URL}`);
    console.log(`viewport : ${VIEWPORT_WIDTH}x${VIEWPORT_HEIGHT}`);
    if (WRITE_BASELINE) console.log('mode     : --write-baseline (console-baseline.json will be rewritten)');

    const browser = await chromium.launch();
    const results: StateResult[] = [];
    try {
        for (const state of STATES) {
            results.push(await runState(browser, state));
        }
    } finally {
        await browser.close();
    }

    for (const r of results) report(r);

    console.log('');
    console.log('='.repeat(78));
    console.log('SUMMARY');
    console.log('='.repeat(78));
    for (const r of results) {
        const m = r.measurements;
        const ratio = m?.canvasOverMainRatio;
        console.log(
            `  ${r.state.id.padEnd(22)} reached=${String(r.reached).padEnd(5)} ` +
            `canvas=${m?.canvas ? `${Math.round(m.canvas.w)}x${Math.round(m.canvas.h)}` : 'ABSENT'} ` +
            `ratio=${ratio === null || ratio === undefined ? 'N/A' : ratio.toFixed(4)} ` +
            `nodes=${m?.nodeCount ?? '-'} fixed=${m?.fixedElements.length ?? '-'} logs=${r.logs.length}`,
        );
    }

    if (WRITE_BASELINE) {
        const patterns: Record<string, Record<string, number>> = {};
        for (const r of results) {
            for (const [key, count] of Object.entries(tallyConsole(r.logs))) {
                if (!patterns[key]) patterns[key] = {};
                patterns[key][r.state.id] = count;
            }
        }
        const baseline: ConsoleBaseline = {
            generatedAt: new Date().toISOString(),
            commit: gitSha(),
            note: 'Generated by `npm run smoke:calibrate -- --write-baseline`. Never hand-edit. '
                + 'This records existing console debt, it does not absolve it: when a bug is '
                + 'fixed, regenerate so the counts go down. See README.md.',
            patterns,
        };
        writeFileSync(BASELINE_PATH, JSON.stringify(baseline, null, 2) + '\n');
        console.log('');
        console.log(`  baseline written: ${BASELINE_PATH}`);
        console.log(`  ${Object.keys(patterns).length} distinct pattern(s) across ${results.length} state(s)`);
    } else {
        console.log('');
        console.log('No thresholds are proposed here by design: they are decided from these');
        console.log('numbers and encoded as named constants in states.ts.');
    }
}

await main();
