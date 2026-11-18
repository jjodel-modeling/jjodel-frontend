// Shared setup of the B2 probes (P-2026-11-04-0005), copied from probe_2026-11-03_textual_language_service_app/common.mjs; paths moved to this worktree.
import { chromium } from '/Users/alfonso/jjodel-w-textb2/frontend/node_modules/@playwright/test/index.mjs';
import { readFileSync } from 'node:fs';

export const URL = process.env.PROBE_URL || 'http://localhost:3470';
export const CROPS = '/Users/alfonso/.jjodel-lanes/P-2026-11-04-0005';
const FIXTURE = '/Users/alfonso/jjodel-w-textb2/frontend/scripts/probe/fixtures/' + (process.env.FIXTURE || 'scene_3_DemoESM.jjodel');
export const MM = process.env.MM || 'DemoESM';
export const M1 = process.env.M1 || 'demoESM';
const OFFLINE_USER = { className: 'DUser', id: 'Pointer_OfflineUser', pointedBy: [], _state: {}, name: 'Offline', surname: 'User', nickname: 'Unknown', country: 'Unknown', affiliation: 'Unknown', newsletter: false, email: 'Unknown', token: 'Unknown', projects: [], project: '', autoReport: false, layout: {}, autosaveLayout: true, activeLayout: '1', __isDUser: true };

export let failures = 0;
export const check = (label, ok, detail) => { if (!ok) failures++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}  ${JSON.stringify(detail)}`); };
export const note = (label, d) => console.log(`MEAS  ${label}  ${JSON.stringify(d)}`);

export async function setup() {
    const browser = await chromium.launch();
    const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
    await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: URL }).catch(() => {});
    await ctx.addInitScript((user) => {
        localStorage.setItem('offline', 'true');
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('jjodel_welcome_3_seen', '1');
        localStorage.setItem('jjodel_welcome_3_1_seen', '1');
        localStorage.setItem('jjodel.interfaceMode', 'advanced');
        localStorage.setItem('jjodel.experimental.codegen', 'true');
        localStorage.setItem('jjodel.theme', 'light');
    }, OFFLINE_USER);
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push('pageerror: ' + e.message.slice(0, 200)));
    page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 200)); });
    const wait = (ms) => page.waitForTimeout(ms);
    const poll = async (expr, ms) => {
        const end = Date.now() + ms;
        while (Date.now() < end) { const v = await page.evaluate(expr).catch(() => null); if (v) return v; await wait(250); }
        return null;
    };
    await page.goto(`${URL}/#/allProjects`, { waitUntil: 'domcontentloaded', timeout: 300000 });
    await poll(`!!(window.windoww && window.windoww.store && window.LPointerTargetable)`, 180000);
    await wait(2000);
    const pid = await page.evaluate(`(async () => {
      const api = await import('/src/api/persistance/projects.ts');
      const count = () => JSON.parse(localStorage.getItem('projects') || '[]').length;
      const before = count();
      await api.ProjectsApi.importFromText(${JSON.stringify(readFileSync(FIXTURE, 'utf8'))});
      for (let i = 0; i < 75 && count() <= before; i++) await new Promise(r => setTimeout(r, 200));
      const a = JSON.parse(localStorage.getItem('projects') || '[]');
      return a.length > before ? a[a.length - 1].id : null;
    })()`);
    await page.goto(`${URL}/?open=${encodeURIComponent(pid)}#/project?id=${pid}`, { waitUntil: 'domcontentloaded', timeout: 300000 });
    const ids = await poll(`(() => { try {
      const all = Object.values(window.windoww.store.getState().idlookup).filter((d) => d && typeof d === 'object');
      const a = all.find((d) => d.className === 'DModel' && d.isMetamodel && d.name === ${JSON.stringify(MM)});
      const b = all.find((d) => d.className === 'DModel' && !d.isMetamodel && d.name === ${JSON.stringify(M1)});
      return a && b ? { mm: a.id, m1: b.id } : null; } catch (e) { return null; } })()`, 120000);
    if (!ids) throw new Error('models not found; models in the store: ' + JSON.stringify(await page.evaluate(`Object.values(window.windoww.store.getState().idlookup).filter(d => d && d.className === 'DModel').map(d => [d.name, d.isMetamodel])`)));
    await wait(4000);
    // The M1 canvas, then the Text tab.
    const sel = `[...document.querySelectorAll('.psb-item')].find(r => r.querySelector('.psb-item-name')?.textContent === ${JSON.stringify(M1)})`;
    await poll(`!!(${sel})`, 30000);
    await page.evaluate(`(${sel}).querySelector('.psb-item-name').click()`);
    await wait(3000);
    await page.evaluate(`import('/src/codegen/textual/ui/openTextualTab.tsx').then(m => m.openTextualTab(${JSON.stringify(ids.m1)}, ${JSON.stringify(MM)}))`);
    await poll(`document.querySelector('.textual-tab .monaco-editor textarea') ? true : null`, 60000);
    await wait(2000);
    return { browser, page, errors, wait, poll, ids };
}

/** The editable editor of the Text tab. */
export const ED = `((window.monaco?.editor?.getEditors?.() || []).find(e => document.querySelector('.textual-tab')?.contains(e.getDomNode()) && !e.getRawOptions().readOnly))`;

/** The model's print now, through the tab's own reader. */
export const PRINT = (ids) => `(async () => {
    const j = await import('/src/jjscript/index.ts');
    const sb = await import('/src/components/editor-v2/sim/simBridge.ts');
    const t = await import('/src/codegen/textual/ui/TextualTab.tsx');
    const L = window.windoww.store.getState().idlookup;
    return t.textualView(j.buildEvalContext(sb.evalContextFor(L, ${JSON.stringify(ids.m1)}, ''), { extentModelId: ${JSON.stringify(ids.m1)} }), t.storedNotation(L, ${JSON.stringify(ids.mm)})).text;
})()`;

/** The DObjects of the model: id, class, name. */
export const OBJECTS = (ids) => `(() => {
    const L = window.windoww.store.getState().idlookup;
    const inModel = (id) => { let a = L[id]; for (let i = 0; a && i < 64; i++) { if (a.className === 'DModel') return a.id === ${JSON.stringify(ids.m1)}; a = L[a.father]; } return false; };
    return Object.values(L).filter(o => o && o.className === 'DObject' && inModel(o.id)).map(o => ({ id: o.id, cls: L[o.instanceof]?.name, name: o.name }));
})()`;

export const BAR = `(() => { const t = document.querySelector('.textual-tab'); return {
    status: t.querySelector('.textual-tab__status')?.textContent ?? null,
    statusError: !!t.querySelector('.textual-tab__status--error'),
    readonly: t.querySelector('.textual-tab__readonly')?.textContent ?? null,
    stale: t.querySelector('.textual-tab__stale')?.textContent ?? null,
    panel: [...t.querySelectorAll('.textual-tab__confirm-rows tbody tr')].map(r => [...r.children].map(c => c.textContent)),
    issues: [...t.querySelectorAll('.textual-tab__issue')].map(i => i.textContent),
}; })()`;
