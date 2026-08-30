/**
 * run.ts — visual smoke (docs/PROTOCOL.md P8).
 *
 * Opens each state in states.ts, runs the applicable assertions, prints one
 * line per assertion plus a summary.
 *
 * The verdict has three values, not two:
 *
 *   GREEN  every assertion passed on a run that measured what it declares.
 *   RED    an assertion failed. This is a statement about the application.
 *   VOID   the run did not measure what it declares — somebody saved a file
 *          the dev server serves (`src/`, `public/`, `vite.config.ts`,
 *          `index.html`) while it was in flight, or the page booted more
 *          than once. This is a statement about the machine, and the only
 *          correct response is to run again. A void run is NOT a pass.
 *
 * Exit codes: 0 green, 1 red, 2 harness error (no baseline), 3 void.
 *
 * The two guards behind VOID are quiescence.ts (what moved on disk) and
 * countBoots (how many times the document loaded). They exist because the smoke
 * shares one dev server with every other session on this machine: measured
 * 2026-08-30, ten still runs gave byte-identical tallies and the two runs a
 * concurrent save fell into went red on whichever state was open at that
 * instant. See docs/discovery/discovery_2026-08-30_6_smoke_flaky.md.
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
    MAX_BOOTS_PER_STATE,
    assertCanvasGeometry,
    assertChromeStackContiguous,
    assertConsoleAgainstBaseline,
    assertNoStatusbarOverlay,
    assertStructureMounted,
    countBoots,
    measure,
    tallyConsole,
} from './assertions.ts';
import type { AssertionResult, ConsoleBaseline } from './assertions.ts';
import { describeChanges, describeWatched, diffSnapshots, snapshotSrc } from './quiescence.ts';
import type { SrcChange, SrcSnapshot } from './quiescence.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const BASELINE_PATH = resolve(HERE, 'console-baseline.json');

interface StateReport {
    state: SmokeState;
    reached: boolean;
    results: AssertionResult[];
    improvements: string[];
    pageErrors: string[];
    /** Document loads observed for this state. Above MAX_BOOTS_PER_STATE the tally is void. */
    boots: number;
}

/** What moved in the watched tree while one state was open. */
interface QuiescenceWindow {
    stateId: string;
    changes: SrcChange[];
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
            boots: countBoots(opened.logs),
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

    const a5Skip = skipReason(state, 'A5');
    results.push(
        a5Skip
            ? {
                  id: 'A5',
                  title: 'chrome stack contiguo: nessun vuoto fra app bar, toolbar, rail e status bar',
                  status: 'skipped',
                  detail: a5Skip,
              }
            : assertChromeStackContiguous(m),
    );

    await opened.ctx.close();
    return {
        state,
        reached: true,
        results,
        improvements,
        pageErrors: opened.pageErrors,
        boots: countBoots(opened.logs),
    };
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

    console.log(
        `  BOOT  ${r.boots} document load(s) (ceiling ${MAX_BOOTS_PER_STATE})` +
        (r.boots > MAX_BOOTS_PER_STATE ? '  <-- the tally above is that tally repeated' : ''),
    );

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

    // Taken before the launch, so the first window covers the browser start-up
    // too: a save that lands there reaches state one exactly like any other.
    const beforeAll = snapshotSrc();

    const browser = await chromium.launch();
    const reports: StateReport[] = [];
    const windows: QuiescenceWindow[] = [];
    try {
        let prev: SrcSnapshot = beforeAll;
        for (const state of STATES) {
            reports.push(await runState(browser, state, baseline));
            const after = snapshotSrc();
            windows.push({ stateId: state.id, changes: diffSnapshots(prev, after) });
            prev = after;
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

    const movedWindows = windows.filter((w) => w.changes.length > 0);
    const noisyStates = reports.filter((r) => r.boots > MAX_BOOTS_PER_STATE);
    const isVoid = movedWindows.length > 0 || noisyStates.length > 0;

    console.log('');
    console.log('-'.repeat(78));
    console.log('RUN VALIDITY — did this run measure the tree it declares?');
    console.log('-'.repeat(78));
    console.log(`  watched : ${describeWatched().join('  ')}`);
    console.log(`            ${beforeAll.files.size} file(s) at start`);
    console.log(
        `  boots   : ${reports.map((r) => `${r.state.id}=${r.boots}`).join('  ')}` +
        `  (ceiling ${MAX_BOOTS_PER_STATE} per state)`,
    );
    if (movedWindows.length === 0) {
        console.log('  moved   : nothing the dev server serves moved while the run was in flight');
    }
    for (const w of movedWindows) {
        console.log(`  moved   : ${w.changes.length} change(s) while '${w.stateId}' was open:`);
        for (const line of describeChanges(w.changes)) console.log(line);
    }
    for (const r of noisyStates) {
        console.log(
            `  reboot  : '${r.state.id}' loaded the document ${r.boots} times — every console ` +
            `pattern above is that pattern counted ${r.boots} times, not a regression`,
        );
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
    console.log('');

    // Void outranks red on purpose: on a run that booted three times the
    // assertions above are arithmetic on a repeated tally, so calling it red
    // would name the application for something the machine did.
    if (isVoid) {
        console.log('  VERDICT: VOID — the tree moved under the run, or the page booted twice.');
        console.log('  Nothing above is certified: a void run is not a pass and not a failure.');
        console.log('  Run it again on a still tree, and report the void with its cause');
        console.log('  (docs/PROTOCOL.md P8). Do not read the assertions as a result.');
        process.exit(3);
    }

    if (failed > 0) {
        console.log('  VERDICT: RED — quiescent run, and an assertion failed.');
        console.log('  Do not soften a threshold and do not patch the app by eye:');
        console.log('  report the failure at the top of the closing report (docs/PROTOCOL.md P8).');
        process.exit(1);
    }

    console.log('  VERDICT: GREEN — quiescent run, single boot per state, every assertion passed.');
    process.exit(0);
}

await main();
