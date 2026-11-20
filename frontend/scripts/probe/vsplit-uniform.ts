/**
 * vsplit-uniform probe (P-2026-11-19-2200, D-UI-17): every reachable vertical splitter draws the one contract of
 * frontend/src/styles/components/_vsplit.scss, measured from the DOM in fresh browser contexts, Advanced mode,
 * DemoESM imported (fixtures/scene_3_DemoESM.jjodel).
 *
 * For each splitter:
 *   - the four tokens resolve at the site (panel border, slate-400, canvas accent, focus border);
 *   - at rest: a 1px hairline in --color-panel-border, or none where the seam has its own border; no pill, grip,
 *     tint, filled bar or border of the handle's own;
 *   - the hit strip is 8px (the rail's documented 6px), and elementFromPoint finds the handle over all of it;
 *   - `col-resize` on the handle (and on its strip pseudo-element);
 *   - hover: still at rest before the 150ms delay (checked when the read lands inside 120ms), then after 200ms a 2px
 *     line in --color-slate-400;
 *   - keyboard focus, where the handle is focusable: a 2px line in --color-border-focus, no outline;
 *   - a real pointer drag: mid-drag a 2px line in --color-canvas-accent, no glow, the computed cursor of body
 *     `col-resize`; after it the handle and its pane have moved; back at rest once the pointer is away;
 *   - rc-dock: also grabbable from 3px each side of the seam; the rail handle and the dock divider do not overlap.
 *
 * Scenarios, one fresh context each: A 1600px M1 canvas, rail, split of canvases, Instance Manager, JjTL, Jjodie;
 * B 2000px generator beside the canvas; C 2000px generator tab alone, then the Text tab in Syntax mode; D 2000px the
 * plain rc-dock divider (a split with a Script-beside marker, as Phase 1); E 1060px Script tab in the pane layout.
 *
 * Crops 120x200 at rest and on hover, same names as Phase 1's `before/` set, in ~/.jjodel-lanes/P-2026-11-19-2200/
 * crops/after/ (VSPLIT_CROPS).
 *
 * Run:  node frontend/scripts/lane-run.mjs probe ~/jjodel-w-vsplit scripts/probe/vsplit-uniform.ts --port 3006 --id P-2026-11-19-2200
 * Env:  VSPLIT_OUT    JSON output (default frontend/scripts/smoke/_tmp_vsplit-uniform.json, gitignored)
 *       VSPLIT_CROPS  the folder of the crops
 *       VSPLIT_ONLY   comma list of scenarios to run (default A,B,C,D,E)
 */
import { chromium, type Browser, type Page } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { seed } from '../smoke/states.ts';

const URL = (process.env.PROBE_URL || 'http://localhost:3006/').replace(/\/$/, '');
if (/:(3000|3001|3003)$/.test(URL)) throw new Error('never 3000, 3001 or 3003');
const OUT = process.env.VSPLIT_OUT || new globalThis.URL('../smoke/_tmp_vsplit-uniform.json', import.meta.url).pathname;
const CROPS = process.env.VSPLIT_CROPS || `${homedir()}/.jjodel-lanes/P-2026-11-19-2200/crops/after`;
const FIXTURE = new globalThis.URL('./fixtures/scene_3_DemoESM.jjodel', import.meta.url).pathname;
const ONLY = (process.env.VSPLIT_ONLY || 'A,B,C,D,E').split(',').map((s) => s.trim()).filter(Boolean);
const MM = 'DemoESM', M1 = 'demoESM';
const TRANSPARENT = 'rgba(0, 0, 0, 0)';
mkdirSync(CROPS, { recursive: true });

let failures = 0;
const result: any = { url: URL, only: ONLY, sites: {}, errors: [] as string[] };
const note = (label: string, d: unknown) => console.log(`MEAS  ${label}  ${typeof d === 'string' ? d : JSON.stringify(d)}`);
const check = (label: string, ok: boolean, detail: unknown) => {
    if (!ok) failures++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${ok ? '' : '  ' + (typeof detail === 'string' ? detail : JSON.stringify(detail))}`);
};
const near = (a: number, b: number, tol = 0.5) => Math.abs(a - b) <= tol;
const wait = (page: Page, ms: number) => page.waitForTimeout(ms);

// In-page helpers: window.__vu.
const H = String.raw`(() => {
  const r2 = (v) => Math.round(v * 100) / 100;
  const vis = (el) => { if (!el || !el.isConnected) return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.x < innerWidth && (el.checkVisibility ? el.checkVisibility({ checkVisibilityCSS: true }) : true); };
  const desc = (el) => el ? el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.') : '') : null;
  const pick = (sel, i) => [...document.querySelectorAll(sel)].filter(vis)[i || 0] || null;
  const tok = (el, name) => { const p = document.createElement('div'); p.style.cssText = 'position:absolute;width:0;height:0;pointer-events:none;background-color:var(' + name + ')'; (el.parentElement || document.body).appendChild(p); const c = getComputedStyle(p).backgroundColor; p.remove(); return c; };
  const line = (el) => { const cs = getComputedStyle(el, '::before'); return { content: cs.content, w: cs.width, bg: cs.backgroundColor, shadow: cs.boxShadow, left: cs.left, right: cs.right, transform: cs.transform }; };
  const after = (el) => { const cs = getComputedStyle(el, '::after'); return { content: cs.content, w: cs.width, bg: cs.backgroundColor, pe: cs.pointerEvents, cursor: cs.cursor }; };
  const box = (el) => { const r = el.getBoundingClientRect(); return { x: r2(r.x), y: r2(r.y), w: r2(r.width), h: r2(r.height), right: r2(r.right) }; };
  const midY = (el) => { const r = el.getBoundingClientRect(); const top = Math.max(0, r.y), bottom = Math.min(innerHeight, r.bottom); return r2((top + bottom) / 2); };
  const scan = (el) => { const r = el.getBoundingClientRect(); const y = midY(el); const xs = []; const tops = {};
    for (let x = Math.floor(r.x) - 10; x <= Math.ceil(r.right) + 10; x++) { const t = document.elementFromPoint(x + 0.5, y); if (t && (t === el || el.contains(t))) xs.push(x); else tops[x] = desc(t); }
    return { y, from: xs[0] ?? null, to: xs[xs.length - 1] ?? null, n: xs.length, around: Object.fromEntries(Object.entries(tops).filter(([x]) => +x >= r.x - 6 && +x <= r.right + 6)) }; };
  const pane = (el, how) => { const p = how === 'parent' ? el.parentElement : how === 'prev' ? el.previousElementSibling : how ? document.querySelector(how) : null; return p ? r2(p.getBoundingClientRect().width) : null; };
  const m = (el) => { const cs = getComputedStyle(el); return { cls: String(el.className), box: box(el), cursor: cs.cursor, bg: cs.backgroundColor, bl: cs.borderLeftWidth, br: cs.borderRightWidth, outline: cs.outlineStyle, z: cs.zIndex,
    line: line(el), after: after(el), grip: !!el.querySelector('.bi-grip-vertical, .resize-grip-icon-vertical'), focusable: el.tabIndex >= 0, scan: scan(el),
    tokens: { rest: tok(el, '--color-panel-border'), hover: tok(el, '--color-slate-400'), drag: tok(el, '--color-canvas-accent'), focus: tok(el, '--color-border-focus') } }; };
  const watch = (el) => { window.__vu.enteredAt = null; el.addEventListener('pointerenter', () => { window.__vu.enteredAt = performance.now(); }, { once: true }); };
  window.__vu = { r2, vis, desc, pick, tok, line, after, box, midY, scan, pane, m, watch, enteredAt: null };
  return true;
})()`;
const P = (sel: string, i = 0) => `window.__vu.pick(${JSON.stringify(sel)}, ${i})`;

async function poll(page: Page, expr: string, ms: number): Promise<any> {
    const end = Date.now() + ms;
    while (Date.now() < end) { const v = await page.evaluate(expr).catch(() => null); if (v) return v; await wait(page, 250); }
    return null;
}

type Env = Awaited<ReturnType<typeof boot>>;
async function boot(browser: Browser, viewport: { width: number; height: number }) {
    const ctx = await browser.newContext({ viewport });
    await ctx.addInitScript(() => { (globalThis as any).__name = (f: any) => f; });
    await seed(ctx, true);
    const page = await ctx.newPage();
    page.on('pageerror', (e: Error) => result.errors.push('pageerror: ' + e.message.slice(0, 200)));
    await page.goto(`${URL}/#/allProjects`, { waitUntil: 'domcontentloaded', timeout: 300000 });
    await poll(page, `!!(window.windoww && window.windoww.store && window.LPointerTargetable)`, 180000);
    await wait(page, 2000);
    const text = readFileSync(FIXTURE, 'utf8');
    const pid = await page.evaluate(String.raw`(async () => { const api = await import('/src/api/persistance/projects.ts'); const c = () => JSON.parse(localStorage.getItem('projects') || '[]').length; const b = c(); await api.ProjectsApi.importFromText(${JSON.stringify(text)}); for (let i = 0; i < 75 && c() <= b; i++) await new Promise(r => setTimeout(r, 200)); const a = JSON.parse(localStorage.getItem('projects') || '[]'); return a.length > b ? a[a.length - 1].id : null; })()`);
    if (!pid) throw new Error('import failed');
    await page.goto(`${URL}/?open=${encodeURIComponent(pid as string)}#/project?id=${pid}`, { waitUntil: 'domcontentloaded', timeout: 300000 });
    const ids = await poll(page, String.raw`(() => { try { const all = Object.values(window.windoww.store.getState().idlookup).filter((d) => d && typeof d === 'object'); const a = all.find((d) => d.className === 'DModel' && d.isMetamodel && d.name === ${JSON.stringify(MM)}); const b = all.find((d) => d.className === 'DModel' && !d.isMetamodel && d.name === ${JSON.stringify(M1)}); return a && b && document.querySelectorAll('.dock-tab').length ? { mm: a.id, m1: b.id } : null; } catch { return null; } })()`, 120000) as { mm: string; m1: string } | null;
    if (!ids) throw new Error('project did not load');
    await wait(page, 3000);
    await page.evaluate(H);
    const away = async () => { await page.mouse.move(viewport.width / 2, viewport.height - 6); await wait(page, 350); };
    const crop = async (name: string, b: { x: number; y: number; w: number; h: number }, y?: number) => {
        const cy = y ?? b.y + b.h / 2;
        const x = Math.max(0, Math.min(viewport.width - 120, Math.round(b.x + b.w / 2 - 60)));
        const top = Math.max(0, Math.min(viewport.height - 200, Math.round(cy - 100)));
        await page.screenshot({ path: `${CROPS}/${name}.png`, clip: { x, y: top, width: 120, height: 200 } });
        console.log(`CROP  ${CROPS}/${name}.png`);
    };
    const dm = (body: string) => page.evaluate(String.raw`(async () => { const dm = (await import('/src/components/abstract/DockManager.tsx')).default; ${body} })()`);
    return { ctx, page, ids, viewport, away, crop, dm };
}

type Site = {
    sel: string; i?: number;
    rest: boolean;                 // a 1px hairline at rest (false: the seam has its own border)
    strip: 'self' | 'pseudo';      // the hit strip is the element, or its ::after on a 1px seam
    stripW: number;                // 8, or a documented exception
    dx: number;                    // the drag
    pane?: 'parent' | 'prev' | string;
    readout?: boolean;             // ResizeHandle: the `w NNN` chip while dragging
    seamDrags?: number[];          // drags started this far from the seam
    minHit?: number;               // a measured exception: a neighbour covers part of the strip (default stripW - 1)
    cropY?: number;                // crop centre offset from the handle's visible middle
    cropDrag?: boolean;
};

async function drag(env: Env, s: Site, dx: number, offset = 0, cropName?: string) {
    const { page } = env;
    await env.away();
    const m0 = await page.evaluate(`window.__vu.m(${P(s.sel, s.i)})`) as any;
    const w0 = await page.evaluate(`window.__vu.pane(${P(s.sel, s.i)}, ${JSON.stringify(s.pane ?? null)})`) as number | null;
    const x = stripCentre(m0) + offset, y = m0.scan.y;
    await page.mouse.move(x, y); await wait(page, 220);
    await page.mouse.down();
    await page.mouse.move(x + dx / 2, y, { steps: 6 });
    await wait(page, 60);
    const mid = await page.evaluate(`(() => { const el = ${P(s.sel, s.i)}; const r = document.querySelector('.resize-handle__readout'); return { line: window.__vu.line(el), bodyCursor: getComputedStyle(document.body).cursor, active: el.matches(':active'), readout: !!r && window.__vu.vis(r) ? r.textContent : null }; })()`) as any;
    if (cropName) await env.crop(cropName, m0.box, y + (s.cropY ?? 0));
    await page.mouse.move(x + dx, y, { steps: 6 });
    await page.mouse.up(); await wait(page, 500);
    const b1 = await page.evaluate(`window.__vu.box(${P(s.sel, s.i)})`) as any;
    const w1 = await page.evaluate(`window.__vu.pane(${P(s.sel, s.i)}, ${JSON.stringify(s.pane ?? null)})`) as number | null;
    return { dx, offset, shift: Math.round((b1.x - m0.box.x) * 100) / 100, w0, w1, mid, tokens: m0.tokens };
}

function stripCentre(m: any): number {
    return m.box.x + m.box.w / 2;
}

const moved = (d: any) => Math.sign(d.shift) === Math.sign(d.dx) && Math.abs(d.shift) >= Math.abs(d.dx) / 2;

async function site(env: Env, name: string, s: Site) {
    const { page } = env;
    try {
        await env.away();
        const ok = await poll(page, `!!${P(s.sel, s.i)}`, 15000);
        if (!ok) { check(`${name}: visible`, false, s.sel); return; }
        const m0 = await page.evaluate(`window.__vu.m(${P(s.sel, s.i)})`) as any;
        const r: any = (result.sites[name] = { rest: m0 });
        const t = m0.tokens;
        check(`${name}: the four tokens resolve`, [t.rest, t.hover, t.drag, t.focus].every((c: string) => !!c && c !== TRANSPARENT), t);

        // At rest.
        const restOk = s.rest
            ? m0.line.content !== 'none' && m0.line.w === '1px' && m0.line.bg === t.rest
            : m0.line.content === 'none' || m0.line.bg === TRANSPARENT;
        check(`${name}: at rest ${s.rest ? 'a 1px panel-border hairline' : 'no hairline (the seam has its border)'}`, restOk, m0.line);
        const bare = m0.bg === TRANSPARENT && m0.bl === '0px' && m0.br === '0px' && !m0.grip && (m0.after.content === 'none' || m0.after.bg === TRANSPARENT) && m0.line.shadow === 'none';
        check(`${name}: no pill, grip, tint, bar or border of its own`, bare, { bg: m0.bg, bl: m0.bl, br: m0.br, grip: m0.grip, after: m0.after, shadow: m0.line.shadow });
        const stripW = s.strip === 'self' ? m0.box.w : parseFloat(m0.after.w);
        check(`${name}: hit strip ${s.stripW}px`, near(stripW, s.stripW) && (s.strip === 'self' || m0.after.pe === 'auto'), { stripW, after: m0.after, box: m0.box });
        const minHit = s.minHit ?? s.stripW - 1;
        check(`${name}: the strip is grabbable over ${minHit === s.stripW - 1 ? 'its width' : `at least ${minHit}px`}`, m0.scan.n >= minHit, m0.scan);
        check(`${name}: col-resize on the strip`, m0.cursor === 'col-resize' && (s.strip === 'self' || m0.after.cursor === 'col-resize'), { cursor: m0.cursor, after: m0.after.cursor });
        await env.crop(name, m0.box, m0.scan.y + (s.cropY ?? 0));

        // Hover: still at rest inside the delay, the 2px slate line after it.
        await page.evaluate(`window.__vu.watch(${P(s.sel, s.i)})`);
        await page.mouse.move(stripCentre(m0), m0.scan.y);
        const early = await page.evaluate(`(() => { const el = ${P(s.sel, s.i)}; return { since: window.__vu.enteredAt == null ? null : Math.round(performance.now() - window.__vu.enteredAt), hover: el.matches(':hover'), line: window.__vu.line(el) }; })()`) as any;
        await wait(page, 200);
        const late = await page.evaluate(`(() => { const el = ${P(s.sel, s.i)}; return { hover: el.matches(':hover'), line: window.__vu.line(el), cursor: getComputedStyle(el).cursor }; })()`) as any;
        r.hover = { early, late };
        if (early.since != null && early.since < 120 && early.hover) {
            check(`${name}: hover, still at rest at ${early.since}ms`, early.line.w === m0.line.w && early.line.bg === m0.line.bg, early);
        } else note(`${name}: hover delay not measurable`, early);
        check(`${name}: hover after 200ms, a 2px slate-400 line`, late.hover && late.line.w === '2px' && late.line.bg === t.hover, late);
        await env.crop(`${name}-hover`, m0.box, m0.scan.y + (s.cropY ?? 0));

        // Keyboard focus.
        if (m0.focusable) {
            await env.away();
            await page.keyboard.press('Shift');
            const f = await page.evaluate(`(() => { const el = ${P(s.sel, s.i)}; el.focus(); const out = { fv: el.matches(':focus-visible'), line: window.__vu.line(el), outline: getComputedStyle(el).outlineStyle }; el.blur(); return out; })()`) as any;
            r.focus = f;
            if (f.fv) check(`${name}: focus-visible, a 2px focus line and no outline`, f.line.w === '2px' && f.line.bg === t.focus && f.outline === 'none', f);
            else note(`${name}: focus-visible not reached`, f);
        }

        // The drag.
        const d = await drag(env, s, s.dx, 0, s.cropDrag ? `${name}-drag` : undefined);
        r.drag = d;
        check(`${name}: mid-drag, a 2px canvas-accent line, no glow`, d.mid.line.w === '2px' && d.mid.line.bg === t.drag && d.mid.line.shadow === 'none', d.mid);
        check(`${name}: mid-drag, body cursor col-resize`, d.mid.bodyCursor === 'col-resize', d.mid.bodyCursor);
        if (s.readout) check(`${name}: the readout chip while dragging`, !!d.mid.readout && /\d/.test(d.mid.readout), d.mid.readout);
        check(`${name}: the drag moves the seam by ${s.dx}px`, moved(d), { shift: d.shift, dx: d.dx });
        if (s.pane) check(`${name}: the drag resizes the pane`, d.w0 != null && d.w1 != null && Math.abs(d.w1 - d.w0) >= Math.abs(d.dx) / 2, { w0: d.w0, w1: d.w1 });
        await env.away();
        const after = await page.evaluate(`window.__vu.line(${P(s.sel, s.i)})`) as any;
        check(`${name}: back at rest after the drag`, after.w === m0.line.w && after.bg === m0.line.bg, after);

        for (const off of s.seamDrags ?? []) {
            const dd = await drag(env, s, off > 0 ? 40 : -40, off);
            r['seam' + off] = dd;
            check(`${name}: grabbable ${off > 0 ? '+' : ''}${off}px from the seam`, moved(dd), { shift: dd.shift, dx: dd.dx });
        }
        note(name, { box: m0.box, scan: { n: m0.scan.n, from: m0.scan.from, to: m0.scan.to }, line: m0.line, hover: late.line, drag: { shift: d.shift, w0: d.w0, w1: d.w1 } });
    } catch (e: any) {
        check(`${name}: measured`, false, e?.message ?? String(e));
    }
}

const DOCK = '.not-strip > .dock-layout > .dock-hbox > .dock-divider';
const dockSite = (extra: Partial<Site> = {}): Site => ({ sel: DOCK, rest: true, strip: 'pseudo', stripW: 8, dx: -60, pane: '.not-strip > .dock-layout > .dock-hbox > .dock-panel:first-child', seamDrags: [-3, 3], ...extra });

async function scenario(browser: Browser, key: string, viewport: { width: number; height: number }, body: (env: Env) => Promise<void>) {
    if (!ONLY.includes(key)) return;
    console.log(`----  scenario ${key}  ${viewport.width}x${viewport.height}`);
    let env: Env | null = null;
    try {
        env = await boot(browser, viewport);
        await body(env);
    } catch (e: any) {
        check(`scenario ${key}`, false, e?.message ?? String(e));
    } finally {
        if (env) await env.ctx.close();
    }
}

const browser = await chromium.launch({ ignoreDefaultArgs: ['--hide-scrollbars'] });
try {
    // A. M1 canvas, split of canvases, rail, Instance Manager, JjTL, Jjodie.
    await scenario(browser, 'A', { width: 1600, height: 1000 }, async (env) => {
        const { page, ids } = env;
        await env.dm(`await dm.open2(window.LPointerTargetable.fromPointer(${JSON.stringify(ids.m1)}));`);
        await poll(page, `document.querySelectorAll('.react-flow__node').length > 0`, 60000);
        await wait(page, 1500);
        await page.evaluate(`window.dispatchEvent(new CustomEvent('jjodel:properties-show'))`);
        await poll(page, `(() => { const r = document.querySelector('.properties-tree-overlay'); return !!r && !r.classList.contains('properties-tree-overlay--collapsed'); })()`, 5000);
        await wait(page, 800);
        await env.dm(`return dm.splitRight(${JSON.stringify(ids.m1)}, null);`);
        await poll(page, `document.querySelectorAll('.not-strip > .dock-layout > .dock-hbox > .dock-panel.dock-style-models .editor-v2').length >= 2`, 20000);
        await wait(page, 2500);
        await site(env, 'dock-canvas-split', dockSite({ dx: -80, cropDrag: true }));
        // The rail handle and the dock divider's strip do not overlap.
        const gap = await page.evaluate(`(() => { const d = ${P(DOCK)}; const h = ${P('.properties-panel-resize-handle')}; if (!d || !h) return null; const a = d.getBoundingClientRect(), b = h.getBoundingClientRect(); const s = { l: a.x + a.width / 2 - 4, r: a.x + a.width / 2 + 4 }; return { strip: s, rail: { l: b.x, r: b.right }, overlap: s.l < b.right && b.x < s.r }; })()`) as any;
        result.railVsDock = gap;
        if (gap) check('rail handle and dock divider strips do not overlap', !gap.overlap, gap);
        else note('rail vs dock divider', 'one of the two not visible');
        await site(env, 'rail', { sel: '.properties-panel-resize-handle', rest: false, strip: 'self', stripW: 6, dx: -60, pane: 'parent', readout: true });

        await env.dm(`await dm.openManager(window.LPointerTargetable.fromPointer(${JSON.stringify(ids.m1)}));`);
        await poll(page, `!!${P('.instance-manager__resizer')}`, 15000);
        await wait(page, 1200);
        await site(env, 'im-outline', { sel: '.instance-manager__resizer', i: 0, rest: false, strip: 'self', stripW: 8, dx: 40, readout: true });
        await site(env, 'im-classes', { sel: '.instance-manager__resizer', i: 1, rest: false, strip: 'self', stripW: 8, dx: -40, readout: true });

        await env.dm(`const now = Date.now(); dm.openTransformation({ id: 'probe_vsplit_u', name: 'ProbeU', code: 'transformation ProbeU\\n', createdAt: now, modifiedAt: now });`);
        await poll(page, `!!${P('.jjtl-side-panel-resize-handle')}`, 20000);
        await wait(page, 2000);
        await site(env, 'jjtl-side', { sel: '.jjtl-side-panel-resize-handle', rest: false, strip: 'self', stripW: 8, dx: 60, pane: 'parent' });
        await site(env, 'jjtl-right', { sel: '.jjtl-right-panel-resize-handle', rest: false, strip: 'self', stripW: 8, dx: -60, pane: 'parent' });

        await env.dm(`await dm.open2(window.LPointerTargetable.fromPointer(${JSON.stringify(ids.m1)}));`);
        await wait(page, 1500);
        await page.evaluate(`document.querySelector('.jodie-minimized')?.click()`);
        await poll(page, `!!document.querySelector('.jodie-window.jodie-window--visible')`, 8000);
        await wait(page, 1000);
        await site(env, 'jodie-dock', { sel: '.jodie-dock-handle', rest: false, strip: 'self', stripW: 8, dx: -60, pane: 'parent' });
        await site(env, 'rail-with-jodie', { sel: '.properties-panel-resize-handle', rest: false, strip: 'self', stripW: 6, dx: -40, pane: 'parent', readout: true });
        result.grips = await page.evaluate(`document.querySelectorAll('.resize-grip-icon-vertical').length`);
    });

    // B. A generator panel beside the canvas (the former site 12 divider).
    await scenario(browser, 'B', { width: 2000, height: 1000 }, async (env) => {
        const { page, ids } = env;
        await env.dm(`await dm.open2(window.LPointerTargetable.fromPointer(${JSON.stringify(ids.m1)}));`);
        await wait(page, 2500);
        await page.evaluate(String.raw`(async () => { const o = await import('/src/codegen/ui/openTemplateEditor.ts'); o.openTemplateEditor(${JSON.stringify(ids.mm)}, ${JSON.stringify(MM)}, null, 'default'); })()`);
        await poll(page, `!!document.querySelector('.dock-panel.dock-style-codegen')`, 20000);
        await wait(page, 2000);
        // The left panel stops shrinking at a layout limit (Phase 1 §7, 1289px in pass 5): the drags go right first.
        await site(env, 'dock-divider-generator-beside', dockSite({ cropY: 18, dx: 60, seamDrags: [3, -3] }));
    });

    // C. The generator tab alone, then the Text tab in Syntax mode.
    await scenario(browser, 'C', { width: 2000, height: 1000 }, async (env) => {
        const { page, ids } = env;
        await page.evaluate(String.raw`(async () => { const o = await import('/src/codegen/ui/openTemplateEditor.ts'); o.openTemplateEditor(${JSON.stringify(ids.mm)}, ${JSON.stringify(MM)}, null, 'default'); })()`);
        await poll(page, `!!${P('.codegen-tpl__splitter')}`, 20000);
        await wait(page, 1500);
        await site(env, 'codegen-tpl-wide', { sel: '.codegen-tpl__splitter', rest: false, strip: 'pseudo', stripW: 8, dx: -80, pane: 'prev' });
        await page.evaluate(String.raw`(async () => { const o = await import('/src/codegen/textual/ui/openTextualTab.tsx'); return o.openTextualTab(${JSON.stringify(ids.m1)}, 'Text'); })()`);
        await poll(page, `[...document.querySelectorAll('.textual-tab__mode')].some((b) => window.__vu.vis(b) && /Syntax/.test(b.textContent))`, 20000);
        await page.evaluate(`[...document.querySelectorAll('.textual-tab__mode')].find((b) => window.__vu.vis(b) && /Syntax/.test(b.textContent))?.click()`);
        await poll(page, `!!${P('.syntax-form__splitter')}`, 20000);
        await wait(page, 1200);
        await site(env, 'syntax-form', { sel: '.syntax-form__splitter', rest: true, strip: 'pseudo', stripW: 8, dx: 80, pane: 'prev' });
    });

    // D. The plain rc-dock divider, as Phase 1 measured it (pass 5 A2, the `before/dock-divider-plain` crop): a split
    //    of canvases whose box holds a hidden Script-beside marker, so the rail-column rule of abstract/style.scss lets
    //    go. A real Script tab beside needs a group right of it (DockManager.openBeside never splits).
    await scenario(browser, 'D', { width: 2000, height: 1000 }, async (env) => {
        const { page, ids } = env;
        await env.dm(`await dm.open2(window.LPointerTargetable.fromPointer(${JSON.stringify(ids.m1)})); await dm.splitRight(${JSON.stringify(ids.m1)}, null);`);
        await poll(page, `document.querySelectorAll('.not-strip > .dock-layout > .dock-hbox > .dock-panel.dock-style-models .editor-v2').length >= 2`, 20000);
        await wait(page, 2500);
        await page.evaluate(`(() => { const p = document.querySelector('.not-strip > .dock-layout > .dock-hbox > .dock-panel:last-child'); const d = document.createElement('div'); d.className = 'script-tab--beside'; d.style.display = 'none'; p.appendChild(d); })()`);
        await wait(page, 600);
        // Measured on the first run: with the rail-column rule off, the floating Properties rail ends on the seam and its
        // body covers the strip's left half (n = 5 of 8; Phase 1 measured n = 1 on the same state). Drags from the seam
        // and from its right side.
        await site(env, 'dock-divider-plain', dockSite({ cropY: 18, minHit: 5, seamDrags: [3] }));
    });

    // E. The Script tab in the pane layout (window below 1100px).
    await scenario(browser, 'E', { width: 1060, height: 1000 }, async (env) => {
        const { page } = env;
        await page.evaluate(String.raw`(async () => { const sf = await import('/src/components/scripts/scriptFiles.ts'); const e = sf.openScriptAsFile('', 'probe pane'); return e ? e.id : null; })()`);
        await poll(page, `!!${P('.script-tab__handle')}`, 20000);
        await wait(page, 1500);
        await site(env, 'script-tab', { sel: '.script-tab__handle', rest: true, strip: 'pseudo', stripW: 8, dx: 60, pane: 'prev' });
    });
} catch (e: any) {
    failures++;
    console.log(`FAIL  exception  ${e?.message ?? String(e)}`);
} finally {
    result.failures = failures;
    result.errors = result.errors.slice(0, 30);
    writeFileSync(OUT, JSON.stringify(result, null, 1));
    await browser.close();
    console.log(`${failures === 0 ? 'ALL GREEN' : `${failures} FAILED`}  out ${OUT}  crops ${CROPS}`);
    process.exit(failures === 0 ? 0 : 1);
}
