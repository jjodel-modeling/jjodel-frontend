/**
 * codegen-runner probe (P-2026-10-10-0950): the runner of the JavaScript target profile in a real
 * browser, with a real module worker (R-GEN-6, discovery 2026-10-10 §F.4 and §I.4).
 *
 * The vitest bench runs in node, with no `Worker`; this probe runs `runInWorker` itself, imported
 * from the dev server by a dynamic import in the page, on a blank page that Playwright serves on
 * the dev server's origin (a route of the probe's own context, none of the app's). Checks:
 *   - a run returns one result per call;
 *   - `typeof` of every network global inside the worker is 'undefined', with two controls: the
 *     page's own `fetch` is a function, and `Blob` inside the worker is one;
 *   - a `while (true) {}` is terminated at the timeout, and the next run works;
 *   - a thrown error reports the line and column of the generated code;
 *   - the printer's `JS_RUNTIME` loads as a module in the worker: `/` by zero is null, and `and`
 *     evaluates a throwing right operand.
 * A syntax error's position is measured and printed, not asserted. A first run with a long timeout
 * warms the dev server's transform of the worker module, which a cold server takes seconds to do.
 *
 * Run:  ~/.local/bin/node frontend/scripts/lane-run.mjs probe <worktree> \
 *         frontend/scripts/probe/codegen-runner.ts --port 3087 [--id <Prompt-ID>]
 */
import { chromium } from '@playwright/test';

const URL = (process.env.PROBE_URL || 'http://localhost:3087/').replace(/\/$/, '');
if (/:3001$/.test(URL)) throw new Error('never 3001');
const BLANK = `${URL}/__codegen_runner_probe`;

let failures = 0;
const note = (label: string, d: unknown) => console.log(`MEAS  ${label}  ${typeof d === 'string' ? d : JSON.stringify(d)}`);
const check = (label: string, ok: boolean, detail: unknown) => {
    if (!ok) failures++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}  ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`);
};

/**
 * The timeout of every run but the timeout check's own: a dev-mode worker loads the Vite client and
 * the polyfill shims at each start, which under load took more than the 2000 ms default (measured
 * 2026-10-10 at load 24); the default itself is the unit tests' (runner.test.ts, fake timers).
 */
const SLACK_MS = 30000;

/** `runInWorker` in the page, on one request; the elapsed time measured around it. Plain strings, so no compiler rewrites the import. */
const RUN = `async (request) => {
    const { runInWorker } = await import('/src/codegen/runner/runner.ts');
    const t0 = performance.now();
    const response = await runInWorker({ timeoutMs: ${SLACK_MS}, ...request });
    return { response, ms: Math.round(performance.now() - t0) };
}`;

const browser = await chromium.launch();
try {
    const context = await browser.newContext();
    await context.route(BLANK, route => route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>codegen runner probe</title>' }));
    const page = await context.newPage();
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(String(e)));
    await page.goto(BLANK, { waitUntil: 'load' });

    const run = async (request: unknown): Promise<{ response: any; ms: number }> =>
        page.evaluate(`(${RUN})(${JSON.stringify(request)})`) as Promise<{ response: any; ms: number }>;

    // 0. Warm-up: on a cold dev server the first transform of the worker module took 13-48 s
    // (measured 2026-10-10, fresh cache dir), and load time counts against a run's timeout.
    // One run with a long timeout, measured, then the timed checks.
    const warm = await run({ code: 'export function one() { return 1; }', calls: [{ fn: 'one', args: [] }], timeoutMs: 180000 });
    note('warm-up (dev server cold start)', warm);
    check('warm-up run', warm.response.ok === true, warm.response);

    // 1. Results, one per call.
    const ok = await run({
        code: 'export function inc(x) { return x + 1; }\nexport function pair(a, b) { return [a, b]; }\nexport async function later(x) { return x * 10; }',
        calls: [{ fn: 'inc', args: [1] }, { fn: 'pair', args: ['a', 2] }, { fn: 'later', args: [4] }],
    });
    note('results', ok);
    check('a run returns one result per call', JSON.stringify(ok.response) === JSON.stringify({ ok: true, results: [2, ['a', 2], 40] }), ok.response);

    // 2. The sandbox, with its controls.
    const pageFetch = await page.evaluate('typeof fetch');
    check('control: the page itself has fetch', pageFetch === 'function', pageFetch);
    const names = ['fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource', 'importScripts', 'WebTransport', 'BroadcastChannel', 'indexedDB', 'postMessage'];
    const sandbox = await run({
        code: `export function probe() {
  const out = {};
  for (const n of ${JSON.stringify(names)}) out[n] = typeof self[n];
  out.bareFetch = typeof fetch;
  out.blob = typeof Blob;
  out.document = typeof document;
  return out;
}`,
        calls: [{ fn: 'probe', args: [] }],
    });
    note('sandbox', sandbox.response);
    const seen = sandbox.response.ok ? sandbox.response.results[0] : {};
    check('control: Blob is a function inside the worker', seen.blob === 'function', seen);
    for (const n of names) check(`typeof ${n} inside the worker is 'undefined'`, seen[n] === 'undefined', seen[n]);
    check(`typeof fetch (bare name) inside the worker is 'undefined'`, seen.bareFetch === 'undefined', seen.bareFetch);
    check('no DOM inside the worker', seen.document === 'undefined', seen.document);

    // 3. The timeout, then a fresh worker.
    const spin = await run({ code: 'export function spin() { while (true) {} }', calls: [{ fn: 'spin', args: [] }], timeoutMs: 500 });
    note('timeout', spin);
    check('a while (true) {} is terminated at the timeout', spin.response.ok === false && spin.response.error.kind === 'timeout', spin.response);
    check('the timeout fires near 500 ms', spin.ms >= 480 && spin.ms < 2000, `${spin.ms} ms`);
    const after = await run({ code: 'export function one() { return 1; }', calls: [{ fn: 'one', args: [] }] });
    check('the run after a timeout works', after.response.ok === true && after.response.results[0] === 1, after.response);

    // 4. A thrown error, placed on the generated code.
    const code = [
        'export function ok() {',
        '  return 1;',
        '}',
        'export function boom(x) {',
        '  const y = x * 2;',
        '  throw new Error("boom " + y);',
        '}',
    ].join('\n');
    const boom = await run({ code, calls: [{ fn: 'ok', args: [] }, { fn: 'boom', args: [3] }] });
    note('error', boom.response);
    const e = boom.response.ok ? null : boom.response.error;
    check('a thrown error is a runtime error of call 1', e?.kind === 'runtime' && e?.call === 1 && /boom 6/.test(e?.message), e);
    check('a thrown error reports the generated line 6, column 9', e?.line === 6 && e?.column === 9, { line: e?.line, column: e?.column });

    // 5. The printer's runtime, as a module in the worker.
    const runtime = await page.evaluate(`import('/src/codegen/target/js/printer.ts').then(m => m.JS_RUNTIME)`) as string;
    const rt = await run({
        code: `${runtime}\nexport function div(a, b) { return $div(a, b); }\nexport function eager() { return $and(false, $read({ marking: {}, attrs: {} }, "M", "zzz")); }`,
        calls: [{ fn: 'div', args: [1, 0] }, { fn: 'div', args: [1, 4] }],
    });
    check('JS_RUNTIME loads in the worker: $div(1, 0) is null, $div(1, 4) is 0.25', JSON.stringify(rt.response) === JSON.stringify({ ok: true, results: [null, 0.25] }), rt.response);
    const eager = await run({ code: `${runtime}\nexport function eager() { return $and(false, $read({ marking: {}, attrs: {} }, "M", "zzz")); }`, calls: [{ fn: 'eager', args: [] }] });
    check('JS_RUNTIME in the worker: and with a throwing right operand throws', eager.response.ok === false && eager.response.error.kind === 'runtime', eager.response);

    // 6. A syntax error: measured, not asserted.
    const syntax = await run({ code: 'export function f() {\n  return 1 +;\n}', calls: [{ fn: 'f', args: [] }] });
    note('syntax error', syntax.response);
    check('code that does not parse is a load error', syntax.response.ok === false && syntax.response.error.kind === 'load', syntax.response);

    check('no page error', errors.length === 0, errors);
    await context.close();
} finally {
    await browser.close();
}
console.log(failures === 0 ? 'ALL GREEN' : `${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
