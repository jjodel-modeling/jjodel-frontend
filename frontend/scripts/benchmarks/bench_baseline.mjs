/**
 * Fase 0 — benchmark baseline (classic still alive), pre-removal.
 *
 * Reproducible harness. Drives the production build (vite preview) with
 * Playwright over the synthetic model produced by generate_synthetic_model.py
 * (default: 500 Task objects, 1000 next-links).
 *
 * Measures, on a fresh offline project per run:
 *   - t_import_ecore_ms / t_import_xmi_ms  (file chosen -> success dialog)
 *   - t_mount_flow_nodes_ms   (model open click -> 500 RF nodes in DOM)
 *   - t_edges_settle_ms       (model open click -> RF edge count stable 30s)
 *   - t_responsive_after_open_ms (model open click -> main thread answers a 50ms probe)
 *   - t_edit_flow_ms          (single DValue mutation -> DOM label updated)
 *   - react_commits_*         (React commit counts per window, DevTools hook)
 *   - t_mount_classic_ms      (switch to classic -> classic DOM populated), when the toggle exists
 *
 * Usage:
 *   node scripts/benchmarks/bench_baseline.mjs [appUrl] [outJson]
 * Prereqs: app served (npx vite preview --port 3001), playwright-core resolvable,
 * chromium at /opt/pw-browsers/chromium or PLAYWRIGHT_CHROMIUM env.
 */
import { chromium } from 'playwright-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP = process.argv[2] ?? 'http://localhost:3001/';
const OUT = process.argv[3] ?? path.join(HERE, `results_${new Date().toISOString().slice(0, 10)}.json`);
const ECORE = path.join(HERE, 'bench.ecore');
const XMI = path.join(HERE, 'bench.xmi');
const CHROMIUM = process.env.PLAYWRIGHT_CHROMIUM ?? '/opt/pw-browsers/chromium';

const R = { date: new Date().toISOString(), app: APP, model: path.basename(XMI) };
const log = (m) => console.log(`[bench] ${m}`);

async function dismissModals(page) {
    for (let i = 0; i < 3; i++) {
        const b = page.locator('.wm-backdrop button:has-text("Close"), .wm-backdrop button:has-text("✕")').first();
        if (await b.count() > 0 && await b.isVisible().catch(() => false)) {
            await b.click().catch(() => {});
            await page.waitForTimeout(500);
        } else break;
    }
}

/** Tolerant evaluate: resolves {blocked:true} if the main thread does not answer in `ms`. */
function probe(page, fn, ms = 20000) {
    return Promise.race([
        page.evaluate(fn).catch(err => ({ err: String(err).slice(0, 120) })),
        new Promise(r => setTimeout(() => r({ blocked: true }), ms)),
    ]);
}

const browser = await chromium.launch({ executablePath: CHROMIUM, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
page.setDefaultTimeout(120000);

// React DevTools hook for commit counting (must precede app scripts)
await page.addInitScript(() => {
    const hook = { renderers: new Map(), supportsFiber: true, commits: 0,
        inject() { return 1; }, onCommitFiberUnmount() {},
        onCommitFiberRoot() { this.commits++; },
        checkDCE() {}, on() {}, off() {}, emit() {}, sub() {}, supportsFlight: false };
    Object.defineProperty(window, '__REACT_DEVTOOLS_GLOBAL_HOOK__', { value: hook });
    window.__benchCommits = () => hook.commits;
});
const commits = async () => { const r = await probe(page, () => window.__benchCommits?.() ?? -1, 60000); return typeof r === 'number' ? r : -1; };

await page.goto(APP, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(2500);
const offline = page.getByText('Offline mode', { exact: true });
if (await offline.count() > 0 && await offline.isVisible().catch(() => false)) {
    await offline.click();
    await page.waitForTimeout(2500);
}
await dismissModals(page);

// Fresh project per run (offline persistence across sessions is unreliable by design here)
const PNAME = 'Bench_' + Date.now().toString(36);
R.project = PNAME;
await page.locator('button:has-text("New Project")').first().click();
await page.waitForTimeout(800);
await page.locator('input[placeholder="My Metamodel Project"]').fill(PNAME);
await page.locator('button:has-text("Create Project")').click();
await page.waitForTimeout(3000);
await dismissModals(page);
await page.locator('button, [role=button], [class*=card]').filter({ hasText: PNAME }).first().click();
await page.waitForTimeout(5000);
await dismissModals(page);

// Ecore import
{
    await page.locator('button:has-text("Import")').first().click();
    await page.waitForTimeout(800);
    const t = Date.now();
    const [ch] = await Promise.all([page.waitForEvent('filechooser'), page.locator('text=Import Ecore (.ecore)').click()]);
    await ch.setFiles(ECORE);
    await page.waitForSelector('text=Import successful', { timeout: 120000 });
    R.t_import_ecore_ms = Date.now() - t;
    await page.locator('button:has-text("Close")').first().click().catch(() => {});
    await page.waitForTimeout(1500);
    log(`ecore import ${R.t_import_ecore_ms}ms`);
}
// XMI import
{
    await page.locator('button:has-text("Import")').nth(1).click();
    await page.waitForTimeout(800);
    const c = await commits();
    const t = Date.now();
    const [ch] = await Promise.all([page.waitForEvent('filechooser'), page.locator('text=Import Model (.xmi)').click()]);
    await ch.setFiles(XMI);
    await page.waitForSelector('text=Import successful', { timeout: 300000 });
    R.t_import_xmi_ms = Date.now() - t;
    R.commits_import_xmi = (await commits()) - c;
    await page.locator('button:has-text("Close")').first().click().catch(() => {});
    await page.waitForTimeout(1500);
    log(`xmi import ${R.t_import_xmi_ms}ms commits=${R.commits_import_xmi}`);
}

// ---- open model: fine-grained node mount + edge settle + responsiveness ----
const cOpen = await commits();
const t0 = Date.now();
await page.locator('.list-card__item').filter({ hasText: /Model ·/ }).first().click({ timeout: 60000 });

let nodesDoneAt = null, responsiveAt = null, lastEdgeCount = -1, edgeStableSince = null, edgesDoneAt = null;
const deadline = t0 + 20 * 60 * 1000;
while (Date.now() < deadline) {
    const res = await probe(page, () => ({
        n: document.querySelectorAll('.react-flow__node').length,
        e: document.querySelectorAll('.react-flow__edge').length,
    }), 1000);
    const now = Date.now();
    if (!res.blocked && !res.err) {
        if (responsiveAt === null) responsiveAt = now;      // first sub-1s answer
        if (res.n >= 500 && nodesDoneAt === null) { nodesDoneAt = now; log(`nodes mounted +${now - t0}ms`); }
        if (res.e !== lastEdgeCount) { lastEdgeCount = res.e; edgeStableSince = now; }
        if (nodesDoneAt !== null && edgeStableSince !== null && now - edgeStableSince > 30000) {
            edgesDoneAt = edgeStableSince;
            break;
        }
    } else {
        responsiveAt = null; // blocked again: reset first-response marker
    }
    await new Promise(r => setTimeout(r, 1000));
}
R.t_mount_flow_nodes_ms = nodesDoneAt ? nodesDoneAt - t0 : null;
R.t_edges_settle_ms = edgesDoneAt ? edgesDoneAt - t0 : null;
R.t_responsive_after_open_ms = responsiveAt ? responsiveAt - t0 : null;
R.rf_nodes = lastEdgeCount >= 0 ? (await probe(page, () => document.querySelectorAll('.react-flow__node').length, 30000)) : null;
R.rf_edges = lastEdgeCount;
R.commits_open_flow = (await commits()) - cOpen;
log(`flow: nodes=${JSON.stringify(R.rf_nodes)} in ${R.t_mount_flow_nodes_ms}ms, edges=${R.rf_edges} settle ${R.t_edges_settle_ms}ms, commits=${R.commits_open_flow}`);
fs.writeFileSync(OUT, JSON.stringify(R, null, 2));
await page.screenshot({ path: OUT.replace(/\.json$/, '_flow.png'), timeout: 60000 }).catch(() => {});

// ---- single mutation latency (console-level, DOM-observed) ----
{
    const c = await commits();
    const res = await probe(page, () => new Promise(resolve => {
        const w = window.windoww ?? {};
        const store = w.store;
        if (!store) return resolve({ error: 'no windoww.store' });
        const state = store.getState();
        let targetValueId = null;
        outer: for (const id of state.objects) {
            const o = state.idlookup[id];
            if (!o?.features) continue;
            for (const fid of o.features) {
                const dv = state.idlookup[fid];
                const feat = dv && state.idlookup[dv.instanceof];
                if (feat?.name === 'weight') { targetValueId = fid; break outer; }
            }
        }
        if (!targetValueId) return resolve({ error: 'no weight slot found on any object' });
        const SFA = w.SetFieldAction ?? w.RuntimeAccessibleClass?.get?.('SetFieldAction');
        if (!SFA) return resolve({ error: 'SetFieldAction unavailable; keys=' + Object.keys(w).slice(0, 20).join(',') });
        const t = performance.now();
        SFA.new(targetValueId, 'values', [99], '', false);
        const iv = setInterval(() => {
            const dv = store.getState().idlookup[targetValueId];
            if (dv?.values?.[0] === 99) {
                clearInterval(iv);
                requestAnimationFrame(() => requestAnimationFrame(() =>
                    resolve({ ms: Math.round(performance.now() - t) })));
            }
        }, 5);
        setTimeout(() => { clearInterval(iv); resolve({ error: 'timeout' }); }, 30000);
    }), 60000);
    R.edit_flow = res;
    R.commits_edit_flow = (await commits()) - c;
    log(`edit: ${JSON.stringify(res)} commits=${R.commits_edit_flow}`);
}
fs.writeFileSync(OUT, JSON.stringify(R, null, 2));

// ---- classic switch (only when the 3-state toggle is present) ----
{
    // activate the Default viewpoint (enables the classic/split toggle)
    const vpSelect = page.locator('.toolbar-viewpoint-selector select');
    if (await vpSelect.count() > 0) {
        const opts = await vpSelect.first().evaluate(el => Array.from(el.options).map(o => ({ v: o.value, t: o.textContent })));
        log('viewpoint options: ' + JSON.stringify(opts));
        const def = opts.find(o => /default$/i.test((o.t || '').trim())) ?? opts.find(o => o.v);
        if (def?.v) {
            await vpSelect.first().selectOption(def.v);
            // viewpoint activation triggers recompiles; wait until responsive
            for (let i = 0; i < 120; i++) {
                const r = await probe(page, () => 1, 1500);
                if (r === 1) break;
                await new Promise(rr => setTimeout(rr, 2000));
            }
            await page.waitForTimeout(2000);
        }
    }
    const toggle = page.locator('.editor-mode-toggle button[title="Concrete syntax only"]');
    R.classic_toggle_found = await toggle.count();
    if (R.classic_toggle_found > 0) {
        const c = await commits();
        const t = Date.now();
        // JS-dispatched click: queues once the main thread frees (viewpoint
        // activation can block the UI for minutes on large models — that block
        // is itself recorded via t_viewpoint_activation_block_ms below).
        const tvp = Date.now();
        await probe(page, () => {
            const btn = document.querySelector('.editor-mode-toggle button[title="Concrete syntax only"]');
            if (btn) btn.click();
            return 1;
        }, 900000);
        R.t_viewpoint_activation_block_ms = Date.now() - tvp;
        let classicNodes = 0;
        const dl = Date.now() + 15 * 60 * 1000;
        while (Date.now() < dl) {
            const res = await probe(page, () => document.querySelector('.GraphContainer')
                ? document.querySelector('.GraphContainer').querySelectorAll('[id^=Pointer]').length : -1, 1000);
            if (typeof res === 'number' && res >= 500) { classicNodes = res; break; }
            if (typeof res === 'number') classicNodes = res;
            await new Promise(r => setTimeout(r, 1000));
        }
        R.t_mount_classic_ms = Date.now() - t;
        R.classic_nodes = classicNodes;
        R.commits_mount_classic = (await commits()) - c;
        log(`classic: nodes=${classicNodes} in ${R.t_mount_classic_ms}ms commits=${R.commits_mount_classic}`);
        await page.screenshot({ path: OUT.replace(/\.json$/, '_classic.png'), timeout: 60000 }).catch(() => {});
    } else {
        log('classic toggle not found (viewpoint-less model tab renders flow only)');
    }
}

fs.writeFileSync(OUT, JSON.stringify(R, null, 2));
log('RESULTS -> ' + OUT);
log(JSON.stringify(R, null, 2));
await browser.close();
