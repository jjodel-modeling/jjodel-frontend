/**
 * run.ts — visual smoke (docs/PROTOCOL.md P8).
 *
 * Opens each state in states.ts, runs the applicable assertions, prints one
 * line per assertion plus a summary. Exit code is non-zero if at least one
 * assertion failed.
 *
 * Run: npm run smoke   (dev server must already be up)
 *
 * The smoke does not replace Alfonso's check, which is about proportion,
 * visual hierarchy and perceived behaviour.
 */

import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import {
    BASE_URL,
    FIXED_ALLOWLIST,
    NOT_COVERED,
    STATES,
    STATUSBAR_INTERSECT_TOLERANCE_PX,
    VIEWPORT_HEIGHT,
    VIEWPORT_WIDTH,
    openState,
} from './states.ts';
import type { AssertionId, SmokeState } from './states.ts';
import {
    assertCanvasGeometry,
    assertConsoleAgainstBaseline,
    assertNoStatusbarOverlay,
    assertStructureMounted,
    measure,
    tallyConsole,
} from './assertions.ts';
import type { AssertionResult, ConsoleBaseline } from './assertions.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const BASELINE_PATH = resolve(HERE, 'console-baseline.json');

interface StateReport {
    state: SmokeState;
    reached: boolean;
    results: AssertionResult[];
    improvements: string[];
    pageErrors: string[];
}

function icon(status: string): string {
    if (status === 'passed') return 'PASS';
    if (status === 'failed') return 'FAIL';
    return 'SKIP';
}

function skipReason(state: SmokeState, id: AssertionId): string | null {
    const s = state.skip.find((x) => x.assertion === id);
    return s ? s.reason : null;
}

async function runState(
    browser: Awaited<ReturnType<typeof chromium.launch>>,
    state: SmokeState,
    baseline: ConsoleBaseline,
): Promise<StateReport> {
    const opened = await openState(browser, state);
    const results: AssertionResult[] = [];
    let improvements: string[] = [];

    if (!opened.reached) {
        await opened.ctx.close();
        return {
            state,
            reached: false,
            results: [],
            improvements: [],
            pageErrors: opened.pageErrors,
        };
    }

    const m = await measure(opened.page, FIXED_ALLOWLIST, STATUSBAR_INTERSECT_TOLERANCE_PX);

    const a1Skip = skipReason(state, 'A1');
    results.push(
        a1Skip
            ? { id: 'A1', title: 'editor structure mounted', status: 'skipped', detail: a1Skip }
            : assertStructureMounted(m),
    );

    const a2Skip = skipReason(state, 'A2');
    results.push(
        a2Skip
            ? { id: 'A2', title: 'canvas geometry', status: 'skipped', detail: a2Skip }
            : assertCanvasGeometry(m),
    );

    const a3Skip = skipReason(state, 'A3');
    results.push(
        a3Skip
            ? { id: 'A3', title: 'no overlay on the status bar', status: 'skipped', detail: a3Skip }
            : assertNoStatusbarOverlay(m),
    );

    const a4Skip = skipReason(state, 'A4');
    if (a4Skip) {
        results.push({
            id: 'A4',
            title: 'no console regression vs baseline',
            status: 'skipped',
            detail: a4Skip,
        });
    } else {
        const cmp = assertConsoleAgainstBaseline(state.id, tallyConsole(opened.logs), baseline);
        results.push(cmp.result);
        improvements = cmp.improvements;
    }

    await opened.ctx.close();
    return { state, reached: true, results, improvements, pageErrors: opened.pageErrors };
}

function report(r: StateReport): void {
    console.log('');
    console.log('-'.repeat(78));
    console.log(`STATE: ${r.state.id}`);
    console.log(`  ${r.state.note}`);
    console.log('-'.repeat(78));

    if (!r.reached) {
        console.log('  FAIL  setup did not complete — state not reached');
        for (const e of r.pageErrors) console.log(`        pageerror: ${e}`);
        return;
    }

    for (const a of r.results) {
        console.log(`  ${icon(a.status)}  ${a.id} ${a.title}`);
        const label = a.status === 'skipped' ? 'skipped' : 'measured';
        const [first, ...rest] = a.detail.split('\n');
        console.log(`        ${label}: ${first}`);
        for (const line of rest) console.log(line);
    }

    for (const imp of r.improvements) console.log(imp);

    if (r.pageErrors.length > 0) {
        console.log(`        note: ${r.pageErrors.length} uncaught page error(s) (not an assertion):`);
        for (const e of r.pageErrors) console.log(`        [pageerror] ${e}`);
    }
}

async function main(): Promise<void> {
    let baseline: ConsoleBaseline;
    try {
        baseline = JSON.parse(readFileSync(BASELINE_PATH, 'utf8')) as ConsoleBaseline;
    } catch (err) {
        console.error(`smoke: cannot read ${BASELINE_PATH}`);
        console.error('smoke: generate it with `npm run smoke:calibrate -- --write-baseline`');
        console.error(String(err));
        process.exit(2);
        return;
    }

    console.log('visual smoke — docs/PROTOCOL.md P8');
    console.log(`base url : ${BASE_URL}`);
    console.log(`viewport : ${VIEWPORT_WIDTH}x${VIEWPORT_HEIGHT}`);
    console.log(`baseline : console-baseline.json generated ${baseline.generatedAt} @ ${baseline.commit}`);

    console.log('');
    console.log('NOT COVERED by this smoke — stated on every run, never silently omitted:');
    for (const n of NOT_COVERED) {
        console.log(`  - ${n.what}`);
        console.log(`    ${n.why}`);
    }

    const browser = await chromium.launch();
    const reports: StateReport[] = [];
    try {
        for (const state of STATES) {
            reports.push(await runState(browser, state, baseline));
        }
    } finally {
        await browser.close();
    }

    for (const r of reports) report(r);

    let passed = 0;
    let failed = 0;
    let skipped = 0;
    for (const r of reports) {
        if (!r.reached) {
            failed++;
            continue;
        }
        for (const a of r.results) {
            if (a.status === 'passed') passed++;
            else if (a.status === 'failed') failed++;
            else skipped++;
        }
    }

    console.log('');
    console.log('='.repeat(78));
    console.log('SUMMARY');
    console.log('='.repeat(78));
    for (const r of reports) {
        if (!r.reached) {
            console.log(`  ${r.state.id.padEnd(22)} NOT REACHED`);
            continue;
        }
        const line = r.results.map((a) => `${a.id}:${icon(a.status)}`).join('  ');
        console.log(`  ${r.state.id.padEnd(22)} ${line}`);
    }
    console.log('');
    console.log(`  ${passed} passed, ${failed} failed, ${skipped} skipped`);
    console.log(`  ${NOT_COVERED.length} coverage gaps declared above.`);

    if (failed > 0) {
        console.log('');
        console.log('  Smoke red. Do not soften a threshold and do not patch the app by eye:');
        console.log('  report the failure at the top of the closing report (docs/PROTOCOL.md P8).');
    }

    process.exit(failed > 0 ? 1 : 0);
}

await main();
