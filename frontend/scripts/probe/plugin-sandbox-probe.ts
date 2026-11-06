/**
 * plugin-sandbox probe (P-2026-10-31-1800, discovery only): does a sandboxed iframe with no
 * `allow-same-origin`, under a CSP that forbids egress, hosting a Web Worker, block every network egress and
 * every read of the host's storage from plugin code, while a postMessage channel to the host still works (H2)?
 *
 * Needs no dev server: it starts the harness's own throwaway server
 * (docs/discovery/harness/plugin-sandbox/server.mjs) on PROBE_PORT (default 3061), PROBE_PORT+1 standing for
 * an external origin and PROBE_PORT+2 a UDP socket standing for a STUN server. Egress is measured where it
 * lands: a vector leaks when its `/hit/<tag>` request reached a server (or a UDP packet arrived, for WebRTC),
 * or when a storage read returned a host secret; what the plugin's JS saw is printed beside it.
 *
 * Three CSP modes (none = positive control, header, meta) x two threads (iframe main thread, worker from a
 * blob: URL and from a same-server URL), then the frame-replacing vectors one fresh frame each, then the
 * postMessage round trip host -> plugin -> worker -> plugin -> host on a ~1.2 MB payload.
 *
 * Run (from frontend/):  node scripts/run-quiet.mjs plugin-sandbox -- node --experimental-strip-types \
 *                          scripts/probe/plugin-sandbox-probe.ts
 */
import { chromium } from '@playwright/test';
// @ts-ignore: a plain .mjs module of the harness, outside the frontend's tsconfig.
import { startHarness, CSP } from '../../../docs/discovery/harness/plugin-sandbox/server.mjs';

const PORT = Number(process.env.PROBE_PORT || 3061);
const MODES = ['none', 'header', 'meta'] as const;
const KILLERS = ['selfNav', 'formSubmit', 'metaRefresh', 'topNav', 'windowOpen'];
const SECRETS = ['ls-secret', 'cookie-secret', 'stores=secrets'];

let failures = 0;
const note = (label: string, d: unknown) => console.log(`MEAS  ${label}  ${typeof d === 'string' ? d : JSON.stringify(d)}`);
const check = (label: string, ok: boolean, detail: unknown) => {
    if (!ok) failures++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}  ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`);
};
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

type Violation = { thread: string; uri: string; dir: string };
type Attempt = { vector: string; js: string };
type Row = { mode: string; thread: string; vector: string; js: string; leaked: boolean; directive: string };

const h = await startHarness(PORT);
const rows: Row[] = [];
const browser = await chromium.launch();
let popups = 0;
try {
    const context = await browser.newContext();
    context.on('page', () => { popups++; });
    const page = await context.newPage();
    note('browser', `chromium ${browser.version()}`);
    note('csp', CSP);

    const directiveFor = (violations: Violation[], tag: string): string => {
        const v = violations.find((x) => (x.uri || '').includes(tag));
        return v ? v.dir : '-';
    };
    const hit = (tag: string) => h.hits.some((x: { tag: string }) => x.tag === tag);
    const secretRead = (js: string) => SECRETS.some((s) => js.includes(s));

    for (const mode of MODES) {
        await page.goto(`${h.origin}/host.html?mode=${mode}`);
        await page.waitForFunction(() => (window as any).hostReady === true);
        const udpBefore = h.udpPackets.length;
        const r: any = await page.evaluate((m) => (window as any).runMain(m), mode);
        await sleep(1500);
        const udpDelta = h.udpPackets.length - udpBefore;
        if (r.timeout) { check(`${mode} run replied`, false, 'timeout'); continue; }
        note(`${mode} plugin origin`, { selfOrigin: r.origin, messageEventOrigin: r.messageOrigin });
        for (const a of r.main as Attempt[]) {
            const tag = `${mode}-main-${a.vector}`;
            const leaked = a.vector === 'webrtc' ? udpDelta > 0 : secretRead(a.js) || hit(tag);
            const dir = a.vector === 'webrtc' ? `udp packets ${udpDelta}` : directiveFor(r.violations, tag);
            rows.push({ mode, thread: 'main', vector: a.vector, js: a.js, leaked, directive: dir });
        }
        for (const kind of ['blob', 'url']) {
            const w = r.worker[kind];
            note(`${mode} worker ${kind} start`, w.start);
            if (!w.start.started) continue;
            note(`${mode} worker ${kind} plugin code by postMessage+blob`, w.load);
            for (const a of w.results as Attempt[]) {
                const tag = `${mode}-w${kind}-${a.vector}`;
                rows.push({ mode, thread: `worker:${kind}`, vector: a.vector, js: a.js,
                    leaked: secretRead(a.js) || hit(tag), directive: directiveFor(w.violations, tag) });
            }
        }
        for (const v of KILLERS) {
            const popupsBefore = popups;
            const o: any = await page.evaluate(([m, x]) => (window as any).runOnly(m, x), [mode, v]);
            await sleep(500);
            const tag = `${mode}-main-${v}`;
            const hostMoved = page.url() !== `${h.origin}/host.html?mode=${mode}`;
            rows.push({ mode, thread: 'main', vector: v, js: `${o?.js ?? 'host replaced'}; frame=${o?.frameReadable ?? '?'}`,
                leaked: hit(tag) || hostMoved || popups > popupsBefore, directive: `popups+${popups - popupsBefore} hostMoved=${hostMoved}` });
            if (hostMoved) {
                await page.goto(`${h.origin}/host.html?mode=${mode}`);
                await page.waitForFunction(() => (window as any).hostReady === true);
            }
        }
    }

    console.log('ROW   mode | thread | vector | js outcome | egress | CSP violation directive');
    for (const x of rows) console.log(`ROW   ${x.mode} | ${x.thread} | ${x.vector} | ${x.js} | ${x.leaked ? 'LEAK' : 'blocked'} | ${x.directive}`);

    const leaks = (mode: string, thread?: string) =>
        rows.filter((x) => x.mode === mode && x.leaked && (!thread || x.thread === thread)).map((x) => `${x.thread}:${x.vector}`);
    check('positive control: with no CSP the main-thread fetch to the external origin lands',
        rows.some((x) => x.mode === 'none' && x.thread === 'main' && x.vector === 'fetchExt' && x.leaked), leaks('none', 'main'));
    check('positive control: with no CSP the blob worker fetch to the external origin lands',
        rows.some((x) => x.mode === 'none' && x.thread === 'worker:blob' && x.vector === 'fetchExt' && x.leaked), leaks('none', 'worker:blob'));
    for (const mode of ['header', 'meta']) {
        check(`${mode}: no egress and no host secret from the blob worker`, leaks(mode, 'worker:blob').length === 0, leaks(mode, 'worker:blob'));
        note(`${mode}: leaks from the same-server URL worker`, leaks(mode, 'worker:url'));
        note(`${mode}: leaks from the iframe main thread`, leaks(mode, 'main'));
    }
    check('no host secret read in any mode, thread or vector', !rows.some((x) => secretRead(x.js)),
        rows.filter((x) => secretRead(x.js)).map((x) => `${x.mode}:${x.thread}:${x.vector}`));

    await page.goto(`${h.origin}/host.html?mode=header`);
    await page.waitForFunction(() => (window as any).hostReady === true);
    for (const asString of [false, true]) {
        const e: any = await page.evaluate(([n, b, s]) => (window as any).runEcho('header', n, b, s), [10, 1_200_000, asString] as const);
        check(`header: postMessage round trip host->plugin->worker->plugin->host, ${asString ? 'JSON string' : 'object (structured clone)'}`,
            !e.error && e.intact === true, e);
    }
} finally {
    await browser.close();
    await h.close();
}
console.log(failures === 0 ? 'ALL GREEN' : `${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
