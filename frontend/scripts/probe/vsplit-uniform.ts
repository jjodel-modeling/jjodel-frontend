/**
 * vsplit-uniform probe (P-2026-11-19-2200, D-UI-17): every reachable vertical splitter draws the one contract of
 * frontend/src/styles/components/_vsplit.scss, measured from the DOM in fresh browser contexts, Advanced mode,
 * DemoESM imported (fixtures/scene_3_DemoESM.jjodel).
 *
 * For each splitter:
 *   - the tokens resolve at the site (slate-300, slate-400, the pane surface white, canvas accent, focus border);
 *   - at rest: a 1px hairline in --color-slate-300, or none where the seam has its own border; no grip icon, tint,
 *     filled bar or border of the handle's own;
 *   - the knob (amended 2026-11-20, second rework): computed 6x28, 1px slate-300 border, fully rounded, filled with
 *     --color-panel-bg, a shadow, no pointer events; from the pixels (two shots of the seam with and without it):
 *     6px wide, about 28 tall, its centre on the seam within 0.5px at every site (amended a third time 2026-11-20:
 *     seam start / end included, half the knob beyond the handle's box), a centred one inside the hit strip, its
 *     border pixel slate-300 and its core the fill, the line hidden under it; held hover: border slate-400, 36px;
 *     mid-drag: border and fill in the canvas accent; keyboard focus: border in the focus colour; the knob's columns
 *     that take the drag (all of a centred one, the inner half of a start / end one); the drag starts on the knob;
 *   - the pane that holds a start / end handle gives the knob room (overflow clip, a 4px margin) and nothing else:
 *     with the knob hidden, the band beyond its edge and its box are the same as with `overflow: hidden`; a crop of
 *     the whole edge;
 *   - alignment: knobs visible at the same time sit at the same height, |dy| <= 1px (canvas split and rail;
 *     with Jjodie docked; the Instance Manager beside a canvas; the generator beside a canvas);
 *   - the hit strip is 8px (the rail's documented 6px), and elementFromPoint finds the handle over all of it;
 *   - `col-resize` on the handle (and on its strip pseudo-element);
 *   - hover: line and knob still at rest before the 150ms delay (checked when the read lands inside 120ms), then
 *     after 200ms a 2px line in --color-slate-400;
 *   - keyboard focus, where the handle is focusable: a 2px line in --color-border-focus, no outline;
 *   - a real pointer drag: mid-drag a 2px line in --color-canvas-accent, no glow, the computed cursor of body
 *     `col-resize`; after it the handle and its pane have moved; back at rest once the pointer is away;
 *   - rc-dock: also grabbable from 3px each side of the seam; the rail handle and the dock divider do not overlap.
 *
 * Scenarios, one fresh context each: A 1600px M1 canvas, rail, split of canvases, Instance Manager, JjTL, Jjodie;
 * B 2000px generator beside the canvas; C 2000px generator tab alone, then the Text tab in Syntax mode; D 2000px the
 * plain rc-dock divider (a split with a Script-beside marker, as Phase 1); E 1060px Script tab in the pane layout;
 * F 1600px the docked Jjodie window (the trunk's stacking) against what opens over its column, and its own overflow
 * menu (`stack`).
 *
 * Crops 120x200 at rest and on hover, same names as Phase 1's `before/` set, in ~/.jjodel-lanes/P-2026-11-19-2200/
 * crops/after/ (VSPLIT_CROPS).
 *
 * Run:  node frontend/scripts/lane-run.mjs probe ~/jjodel-w-vsplit scripts/probe/vsplit-uniform.ts --port 3007 --id P-2026-11-19-2200
 * Env:  VSPLIT_OUT    JSON output (default frontend/scripts/smoke/_tmp_vsplit-uniform.json, gitignored)
 *       VSPLIT_CROPS  the folder of the crops
 *       VSPLIT_ONLY   comma list of scenarios to run (default A,B,C,D,E,F)
 */
import { chromium, type Browser, type Page } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { seed } from '../smoke/states.ts';

const URL = (process.env.PROBE_URL || 'http://localhost:3007/').replace(/\/$/, '');
if (/:(3000|3001|3003)$/.test(URL)) throw new Error('never 3000, 3001 or 3003');
const OUT = process.env.VSPLIT_OUT || new globalThis.URL('../smoke/_tmp_vsplit-uniform.json', import.meta.url).pathname;
const CROPS = process.env.VSPLIT_CROPS || `${homedir()}/.jjodel-lanes/P-2026-11-19-2200/crops/after`;
const FIXTURE = new globalThis.URL('./fixtures/scene_3_DemoESM.jjodel', import.meta.url).pathname;
const ONLY = (process.env.VSPLIT_ONLY || 'A,B,C,D,E,F').split(',').map((s) => s.trim()).filter(Boolean);
const MM = 'DemoESM', M1 = 'demoESM';
const TRANSPARENT = 'rgba(0, 0, 0, 0)';
const KNOB_W = 6, KNOB_H = 28, KNOB_HELD = 36;     // the contract's knob, _vsplit.scss
const WHITE = [255, 255, 255];
mkdirSync(CROPS, { recursive: true });

let failures = 0;
const result: any = { url: URL, only: ONLY, sites: {}, errors: [] as string[] };
const note = (label: string, d: unknown) => console.log(`MEAS  ${label}  ${typeof d === 'string' ? d : JSON.stringify(d)}`);
const check = (label: string, ok: boolean, detail: unknown) => {
    if (!ok) failures++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${ok ? '' : '  ' + (typeof detail === 'string' ? detail : JSON.stringify(detail))}`);
};
const near = (a: number, b: number, tol = 0.5) => Math.abs(a - b) <= tol;
const rgb = (c: string) => (String(c).match(/\d+(\.\d+)?/g) || []).slice(0, 3).map(Number);
const close = (p: number[], q: number[], tol = 4) => p.length === 3 && q.length === 3 && p.every((v, i) => Math.abs(v - q[i]) <= tol);
const dist = (p: number[], q: number[]) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
const wait = (page: Page, ms: number) => page.waitForTimeout(ms);

// In-page helpers: window.__vu.
const H = String.raw`(() => {
  const r2 = (v) => Math.round(v * 100) / 100;
  const vis = (el) => { if (!el || !el.isConnected) return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.x < innerWidth && (el.checkVisibility ? el.checkVisibility({ checkVisibilityCSS: true }) : true); };
  const desc = (el) => el ? el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.') : '') : null;
  const pick = (sel, i) => [...document.querySelectorAll(sel)].filter(vis)[i || 0] || null;
  const tok = (el, name) => { const p = document.createElement('div'); p.style.cssText = 'position:absolute;width:0;height:0;pointer-events:none;background-color:var(' + name + ')'; (el.parentElement || document.body).appendChild(p); const c = getComputedStyle(p).backgroundColor; p.remove(); return c; };
  const line = (el) => { const cs = getComputedStyle(el, '::before'); return { content: cs.content, w: cs.width, pad: parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight), clip: cs.backgroundClip, bg: cs.backgroundColor, shadow: cs.boxShadow, pe: cs.pointerEvents, cursor: cs.cursor, left: cs.left, right: cs.right, transform: cs.transform }; };
  const after = (el) => { const cs = getComputedStyle(el, '::after'); return { content: cs.content, w: cs.width, h: cs.height, bg: cs.backgroundColor, image: cs.backgroundImage, border: cs.borderTopColor, bw: cs.borderTopWidth, radius: cs.borderTopLeftRadius, shadow: cs.boxShadow, pe: cs.pointerEvents, top: cs.top, transform: cs.transform }; };
  const box = (el) => { const r = el.getBoundingClientRect(); return { x: r2(r.x), y: r2(r.y), w: r2(r.width), h: r2(r.height), right: r2(r.right) }; };
  const midY = (el) => { const r = el.getBoundingClientRect(); const top = Math.max(0, r.y), bottom = Math.min(innerHeight, r.bottom); return r2((top + bottom) / 2); };
  const scan = (el) => { const r = el.getBoundingClientRect(); const y = midY(el); const xs = []; const tops = {};
    for (let x = Math.floor(r.x) - 10; x <= Math.ceil(r.right) + 10; x++) { const t = document.elementFromPoint(x + 0.5, y); if (t && (t === el || el.contains(t))) xs.push(x); else tops[x] = desc(t); }
    return { y, from: xs[0] ?? null, to: xs[xs.length - 1] ?? null, n: xs.length, around: Object.fromEntries(Object.entries(tops).filter(([x]) => +x >= r.x - 6 && +x <= r.right + 6)) }; };
  const pane = (el, how) => { const p = how === 'parent' ? el.parentElement : how === 'prev' ? el.previousElementSibling : how ? document.querySelector(how) : null; return p ? r2(p.getBoundingClientRect().width) : null; };
  const m = (el) => { const cs = getComputedStyle(el); return { cls: String(el.className), box: box(el), cursor: cs.cursor, bg: cs.backgroundColor, bl: cs.borderLeftWidth, br: cs.borderRightWidth, outline: cs.outlineStyle, z: cs.zIndex,
    line: line(el), after: after(el), grip: !!el.querySelector('.bi-grip-vertical, .resize-grip-icon-vertical'), focusable: el.tabIndex >= 0, scan: scan(el),
    tokens: { rest: tok(el, '--color-slate-300'), hover: tok(el, '--color-slate-400'), fill: tok(el, '--color-panel-bg'), drag: tok(el, '--color-canvas-accent'), focus: tok(el, '--color-border-focus') } }; };
  const watch = (el) => { window.__vu.enteredAt = null; el.addEventListener('pointerenter', () => { window.__vu.enteredAt = performance.now(); }, { once: true }); };
  if (!document.getElementById('vu-noknob')) { const st = document.createElement('style'); st.id = 'vu-noknob'; st.textContent = '[data-vu-noknob]::after { content: none !important; } [data-vu-hidden] { overflow: hidden !important; }'; document.head.appendChild(st); }
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
    seam?: 'center' | 'start' | 'end'; // where the seam lies in the handle's box (default center)
    dx: number;                    // the drag
    pane?: 'parent' | 'prev' | string;
    readout?: boolean;             // ResizeHandle: the `w NNN` chip while dragging
    seamDrags?: number[];          // drags started this far from the seam
    minHit?: number;               // a measured exception: a neighbour covers part of the strip (default stripW - 1)
    knobMinW?: number;             // a measured exception: the same neighbour covers part of the knob
    clipPane?: string;             // the pane that holds a start / end handle and clips its content
    cropY?: number;                // crop centre offset from the handle's visible middle
    cropDrag?: boolean;
};

/** A clip of the viewport decoded in the page: RGB per CSS pixel (the contexts run at device scale 1). */
async function shot(page: Page, clip: { x: number; y: number; width: number; height: number }): Promise<number[][][]> {
    const png = await page.screenshot({ clip, scale: 'css' });
    return page.evaluate(async (b64: string) => {
        const img = new Image();
        img.src = `data:image/png;base64,${b64}`;
        await img.decode();
        const cv = document.createElement('canvas');
        cv.width = img.naturalWidth; cv.height = img.naturalHeight;
        const g = cv.getContext('2d')!;
        g.drawImage(img, 0, 0);
        const d = g.getImageData(0, 0, cv.width, cv.height).data;
        const rows: number[][][] = [];
        for (let y = 0; y < cv.height; y++) { const r: number[][] = []; for (let x = 0; x < cv.width; x++) { const i = (y * cv.width + x) * 4; r.push([d[i], d[i + 1], d[i + 2]]); } rows.push(r); }
        return rows;
    }, png.toString('base64'));
}

/** Where the knob should be across the box: on the seam, its left / right edge (start / end) or its centre. Down the
 *  box: where its computed `top` puts it (the CSS centres it there); the alignment across sites is checked from pixels. */
function knobAt(box: any, after: any, seam: Site['seam'] = 'center') {
    const x = seam === 'start' ? box.x : seam === 'end' ? box.right : box.x + box.w / 2;
    return { x, y: box.y + parseFloat(after.top) };
}

/** Where the pointer goes on the knob: its centre, or the centre of its inner half (start / end: the outer half lies
 *  on the next pane, beyond the handle's box). */
const inward = (s: Pick<Site, 'seam'>) => (s.seam === 'start' ? KNOB_W / 4 : s.seam === 'end' ? -KNOB_W / 4 : 0);

/** The knob read from the pixels: what differs between a shot with it and one without it (`content: none`). Extents
 *  at a 14 threshold (anti-aliasing in, the faint shadow out sideways, one shadow row below). Its two middle columns
 *  are those of the measured extents when all 6 show, else those of the expected centre (a neighbour covers part of
 *  it); the core is those two at the middle row; the border pixel the knob pixel farthest from white among the top
 *  row's middle two and the middle row's side columns (the top of the cap is anti-aliased: on the dark focus colour
 *  it reads 11 levels light, measured 2026-11-20). */
async function knobGeom(env: Env, s: Site, at: { x: number; y: number }) {
    const { page } = env;
    const clip = { x: Math.max(0, Math.round(at.x) - 12), y: Math.max(0, Math.round(at.y) - 30), width: 24, height: 60 };
    const a = await shot(page, clip);
    await page.evaluate(`${P(s.sel, s.i)}.setAttribute('data-vu-noknob', '')`);
    await wait(page, 60);
    const b = await shot(page, clip);
    await page.evaluate(`${P(s.sel, s.i)}.removeAttribute('data-vu-noknob')`);
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    a.forEach((row, y) => row.forEach((p, x) => { if (dist(p, b[y][x]) > 14) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } }));
    const r2 = (v: number) => Math.round(v * 100) / 100;
    if (!Number.isFinite(x0)) return { expected: { x: r2(at.x), y: r2(at.y) }, w: 0, h: 0, cx: null as number | null, cy: null as number | null, x0: null, x1: null, borderPx: [] as number[], corePx: [] as number[][] };
    const ym = Math.round((y0 + y1) / 2);
    const xc = x1 - x0 + 1 === KNOB_W ? x0 + KNOB_W / 2 : Math.round(at.x) - clip.x;
    const isKnob = (y: number, x: number) => !!a[y]?.[x] && dist(a[y][x], b[y][x]) > 14;
    const cand = ([[y0, xc - 1], [y0, xc], [ym, xc - 3], [ym, xc + 2]] as [number, number][]).filter(([y, x]) => isKnob(y, x)).map(([y, x]) => a[y][x]);
    const borderPx = cand.length ? cand.reduce((m, p) => (dist(p, WHITE) > dist(m, WHITE) ? p : m), cand[0]) : [];
    return { expected: { x: r2(at.x), y: r2(at.y) }, w: x1 - x0 + 1, h: y1 - y0 + 1, cx: r2(clip.x + (x0 + x1 + 1) / 2), cy: r2(clip.y + (y0 + y1 + 1) / 2), x0: clip.x + x0, x1: clip.x + x1, borderPx, corePx: [a[ym][xc - 1], a[ym][xc]].filter(Boolean) };
}

/** The knob's computed style, named for the checks. */
const knobCss = (after: any, want: { h: number; border: string; bg: string }) =>
    after.content !== 'none' && after.w === `${KNOB_W}px` && after.h === `${want.h}px` && after.bw === '1px' && after.border === want.border && after.bg === want.bg && after.image === 'none' && after.radius === '9999px' && after.pe === 'none';

async function drag(env: Env, s: Site, dx: number, offset = 0, cropName?: string) {
    const { page } = env;
    await env.away();
    const m0 = await page.evaluate(`window.__vu.m(${P(s.sel, s.i)})`) as any;
    const w0 = await page.evaluate(`window.__vu.pane(${P(s.sel, s.i)}, ${JSON.stringify(s.pane ?? null)})`) as number | null;
    const g = knobAt(m0.box, m0.after, s.seam);
    const x = g.x + (offset === 0 ? inward(s) : offset), y = g.y;
    const onKnob = await page.evaluate(`(() => { const el = ${P(s.sel, s.i)}; const t = document.elementFromPoint(${x}, ${y}); return !!t && (t === el || el.contains(t)); })()`) as boolean;
    await page.mouse.move(x, y); await wait(page, 220);
    await page.mouse.down();
    await page.mouse.move(x + dx / 2, y, { steps: 6 });
    await wait(page, 60);
    const mid = await page.evaluate(`(() => { const el = ${P(s.sel, s.i)}; const r = document.querySelector('.resize-handle__readout'); return { line: window.__vu.line(el), knob: window.__vu.after(el), box: window.__vu.box(el), bodyCursor: getComputedStyle(document.body).cursor, active: el.matches(':active'), readout: !!r && window.__vu.vis(r) ? r.textContent : null }; })()`) as any;
    if (offset === 0) mid.px = await knobGeom(env, s, knobAt(mid.box, mid.knob, s.seam));
    if (cropName) await env.crop(cropName, m0.box, y + (s.cropY ?? 0));
    await page.mouse.move(x + dx, y, { steps: 6 });
    await page.mouse.up(); await wait(page, 500);
    const b1 = await page.evaluate(`window.__vu.box(${P(s.sel, s.i)})`) as any;
    const w1 = await page.evaluate(`window.__vu.pane(${P(s.sel, s.i)}, ${JSON.stringify(s.pane ?? null)})`) as number | null;
    return { dx, offset, onKnob, shift: Math.round((b1.x - m0.box.x) * 100) / 100, w0, w1, mid, tokens: m0.tokens };
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
        check(`${name}: the tokens resolve`, [t.rest, t.hover, t.fill, t.drag, t.focus].every((c: string) => !!c && c !== TRANSPARENT), t);
        check(`${name}: the knob's fill token paints white`, close(rgb(t.fill), WHITE, 0), t.fill);

        // At rest.
        const restOk = s.rest
            ? m0.line.content !== 'none' && m0.line.w === '1px' && m0.line.bg === t.rest
            : m0.line.content === 'none' || m0.line.bg === TRANSPARENT;
        check(`${name}: at rest ${s.rest ? 'a 1px slate-300 hairline' : 'no hairline (the seam has its border)'}`, restOk, m0.line);
        const bare = m0.bg === TRANSPARENT && m0.bl === '0px' && m0.br === '0px' && !m0.grip && m0.line.shadow === 'none';
        check(`${name}: no grip icon, tint, filled bar or border of its own`, bare, { bg: m0.bg, bl: m0.bl, br: m0.br, grip: m0.grip, shadow: m0.line.shadow });

        // The knob: computed, then from the pixels.
        const at = knobAt(m0.box, m0.after, s.seam);
        const km = await knobGeom(env, s, at);
        r.knob = km;
        check(`${name}: knob at rest, computed ${KNOB_W}x${KNOB_H}, slate-300 border, the surface fill, round, a shadow, no pointer events`, knobCss(m0.after, { h: KNOB_H, border: t.rest, bg: t.fill }) && m0.after.shadow !== 'none', m0.after);
        const wOk = km.w === KNOB_W || (s.knobMinW != null && km.w >= s.knobMinW && km.w <= KNOB_W);
        check(`${name}: knob ${s.knobMinW != null ? `${KNOB_W} (at least ${s.knobMinW} visible)` : KNOB_W}x~${KNOB_H} from the pixels`, wOk && km.h >= KNOB_H - 1 && km.h <= KNOB_H + 2, km);
        if (s.knobMinW == null) check(`${name}: knob centred on the seam (${s.seam ?? 'center'}), |dx| <= 0.5px`, km.cx != null && near(km.cx, km.expected.x, 0.5), { cx: km.cx, seam: km.expected.x, x0: km.x0, x1: km.x1 });
        check(`${name}: knob at its computed height`, km.cy != null && near(km.cy, km.expected.y + 0.5, 1), km);
        const sl = s.strip === 'self' ? m0.box.x : m0.box.x + m0.box.w / 2 - s.stripW / 2, sr = s.strip === 'self' ? m0.box.right : sl + s.stripW;
        if ((s.seam ?? 'center') === 'center') check(`${name}: knob inside the hit strip`, km.x0 != null && km.x0 >= Math.floor(sl) && km.x1! + 1 <= Math.ceil(sr), { x0: km.x0, x1: km.x1, strip: [sl, sr] });
        else note(`${name}: knob across the seam`, { x0: km.x0, x1: km.x1, strip: [sl, sr] });
        // The knob's columns where the pointer finds the handle: all of a centred knob, the inner half of a start / end one.
        const grab = km.x0 == null ? null : await page.evaluate(`(() => { const el = ${P(s.sel, s.i)}; const xs = []; for (let x = ${km.x0}; x <= ${km.x1}; x++) { const t = document.elementFromPoint(x + 0.5, ${at.y}); if (t && (t === el || el.contains(t))) xs.push(x); } return xs; })()`) as number[] | null;
        r.knobGrab = grab;
        const grabMin = (s.seam ?? 'center') === 'center' ? (s.knobMinW ?? KNOB_W) : KNOB_W / 2;
        check(`${name}: the knob takes the drag over ${(s.seam ?? 'center') === 'center' ? 'its width' : 'its inner half'} (>= ${grabMin} columns)`, !!grab && grab.length >= grabMin, { grab, x0: km.x0, x1: km.x1 });
        if (s.clipPane) await room(env, name, s);
        check(`${name}: knob at rest, border pixel slate-300`, close(km.borderPx, rgb(t.rest), 8), { px: km.borderPx, want: t.rest });
        check(`${name}: knob at rest, core pixels the fill${s.rest ? ', the line hidden under it' : ''}`, km.corePx.length === 2 && km.corePx.every((p) => close(p, rgb(t.fill), 6)), km.corePx);
        const stripW = s.strip === 'self' ? m0.box.w : parseFloat(m0.line.w) + m0.line.pad;
        check(`${name}: hit strip ${s.stripW}px`, near(stripW, s.stripW) && (s.strip === 'self' || (m0.line.pe === 'auto' && m0.line.clip === 'content-box')), { stripW, line: m0.line, box: m0.box });
        const minHit = s.minHit ?? s.stripW - 1;
        check(`${name}: the strip is grabbable over ${minHit === s.stripW - 1 ? 'its width' : `at least ${minHit}px`}`, m0.scan.n >= minHit, m0.scan);
        check(`${name}: col-resize on the strip`, m0.cursor === 'col-resize' && (s.strip === 'self' || m0.line.cursor === 'col-resize'), { cursor: m0.cursor, before: m0.line.cursor });
        await env.crop(name, m0.box, at.y + (s.cropY ?? 0));

        // Hover on the knob: still at rest inside the delay, then the 2px slate line and the held knob.
        await page.evaluate(`window.__vu.watch(${P(s.sel, s.i)})`);
        await page.mouse.move(at.x + inward(s), at.y);
        const early = await page.evaluate(`(() => { const el = ${P(s.sel, s.i)}; return { since: window.__vu.enteredAt == null ? null : Math.round(performance.now() - window.__vu.enteredAt), hover: el.matches(':hover'), line: window.__vu.line(el), knob: window.__vu.after(el) }; })()`) as any;
        await wait(page, 200);
        const late = await page.evaluate(`(() => { const el = ${P(s.sel, s.i)}; return { hover: el.matches(':hover'), line: window.__vu.line(el), knob: window.__vu.after(el), cursor: getComputedStyle(el).cursor }; })()`) as any;
        await wait(page, 150);
        const held = await page.evaluate(`(() => { const el = ${P(s.sel, s.i)}; return { hover: el.matches(':hover'), knob: window.__vu.after(el) }; })()`) as any;
        held.px = await knobGeom(env, s, at);
        r.hover = { early, late, held };
        if (early.since != null && early.since < 120 && early.hover) {
            check(`${name}: hover, line and knob still at rest at ${early.since}ms`, early.line.w === m0.line.w && early.line.bg === m0.line.bg && early.knob.border === t.rest && early.knob.h === `${KNOB_H}px`, early);
        } else note(`${name}: hover delay not measurable`, early);
        check(`${name}: hover after 200ms, a 2px slate-400 line`, late.hover && late.line.w === '2px' && late.line.bg === t.hover, late);
        check(`${name}: held hover, knob ${KNOB_W}x${KNOB_HELD} with a slate-400 border (computed)`, held.hover && knobCss(held.knob, { h: KNOB_HELD, border: t.hover, bg: t.fill }), held.knob);
        check(`${name}: held hover, knob ~${KNOB_HELD} tall, border pixel slate-400, core the fill`, held.px.h >= KNOB_HELD - 1 && held.px.h <= KNOB_HELD + 2 && close(held.px.borderPx, rgb(t.hover), 8) && held.px.corePx.every((p: number[]) => close(p, rgb(t.fill), 6)), held.px);
        await env.crop(`${name}-hover`, m0.box, at.y + (s.cropY ?? 0));

        // Keyboard focus.
        if (m0.focusable) {
            await env.away();
            await page.keyboard.press('Shift');
            const f = await page.evaluate(`(() => { const el = ${P(s.sel, s.i)}; el.focus(); return { fv: el.matches(':focus-visible'), line: window.__vu.line(el), knob: window.__vu.after(el), outline: getComputedStyle(el).outlineStyle }; })()`) as any;
            f.px = await knobGeom(env, s, at);
            await page.evaluate(`${P(s.sel, s.i)}.blur()`);
            r.focus = f;
            if (f.fv) {
                check(`${name}: focus-visible, a 2px focus line and no outline`, f.line.w === '2px' && f.line.bg === t.focus && f.outline === 'none', f);
                check(`${name}: focus-visible, the knob's border in the focus colour`, knobCss(f.knob, { h: KNOB_H, border: t.focus, bg: t.fill }) && close(f.px.borderPx, rgb(t.focus), 8), { knob: f.knob, px: f.px.borderPx, want: t.focus });
            } else note(`${name}: focus-visible not reached`, f);
        }

        // The drag, started on the knob.
        const d = await drag(env, s, s.dx, 0, s.cropDrag ? `${name}-drag` : undefined);
        r.drag = d;
        check(`${name}: the drag starts on the knob`, d.onKnob, { at });
        check(`${name}: mid-drag, a 2px canvas-accent line, no glow`, d.mid.line.w === '2px' && d.mid.line.bg === t.drag && d.mid.line.shadow === 'none', d.mid.line);
        check(`${name}: mid-drag, the knob's border and fill in the canvas accent (computed)`, knobCss(d.mid.knob, { h: KNOB_HELD, border: t.drag, bg: t.drag }), d.mid.knob);
        check(`${name}: mid-drag, the knob's border and core pixels in the canvas accent`, !!d.mid.px && close(d.mid.px.borderPx, rgb(t.drag), 8) && d.mid.px.corePx.every((p: number[]) => close(p, rgb(t.drag), 6)), d.mid.px);
        check(`${name}: mid-drag, body cursor col-resize`, d.mid.bodyCursor === 'col-resize', d.mid.bodyCursor);
        if (s.readout) check(`${name}: the readout chip while dragging`, !!d.mid.readout && /\d/.test(d.mid.readout), d.mid.readout);
        check(`${name}: the drag moves the seam by ${s.dx}px`, moved(d), { shift: d.shift, dx: d.dx });
        if (s.pane) check(`${name}: the drag resizes the pane`, d.w0 != null && d.w1 != null && Math.abs(d.w1 - d.w0) >= Math.abs(d.dx) / 2, { w0: d.w0, w1: d.w1 });
        await env.away();
        const after = await page.evaluate(`(() => { const el = ${P(s.sel, s.i)}; return { ...window.__vu.line(el), knob: window.__vu.after(el) }; })()`) as any;
        check(`${name}: back at rest after the drag`, after.w === m0.line.w && after.bg === m0.line.bg && knobCss(after.knob, { h: KNOB_H, border: t.rest, bg: t.fill }), after);

        for (const off of s.seamDrags ?? []) {
            const dd = await drag(env, s, off > 0 ? 40 : -40, off);
            r['seam' + off] = dd;
            check(`${name}: grabbable ${off > 0 ? '+' : ''}${off}px from the seam`, moved(dd), { shift: dd.shift, dx: dd.dx });
        }
        note(name, { box: m0.box, scan: { n: m0.scan.n, from: m0.scan.from, to: m0.scan.to }, line: m0.line, knob: { w: km.w, h: km.h, cx: km.cx, cy: km.cy, expected: km.expected, held: held.px.h }, hover: late.line, drag: { shift: d.shift, w0: d.w0, w1: d.w1 } });
    } catch (e: any) {
        check(`${name}: measured`, false, e?.message ?? String(e));
    }
}

/** The pane that holds a start / end handle: clipped with room for half a knob (overflow clip, a 4px margin), and the
 *  room holds nothing but the knob. With the knob hidden, a band from 6px beyond each of the pane's four edges to
 *  its border (the margin holds on every side) is shot with the pane as it is and with `overflow: hidden` forced
 *  back: the same pixels, the same box. Then a crop of
 *  the whole edge, knob shown (40px wide, the pane's visible height). */
async function room(env: Env, name: string, s: Site) {
    const { page } = env;
    await env.away();
    const q = `${P(s.sel, s.i)}.closest(${JSON.stringify(s.clipPane)})`;
    const meas = `(() => { const p = ${q}; if (!p) return null; const cs = getComputedStyle(p); return { box: window.__vu.box(p), overflow: cs.overflow, margin: cs.overflowClipMargin, bl: cs.borderLeftWidth, br: cs.borderRightWidth }; })()`;
    const m = await page.evaluate(meas) as any;
    if (!m) { check(`${name}: its pane ${s.clipPane}`, false, 'not found'); return; }
    check(`${name}: its pane clips with room for half a knob (overflow clip, margin 4px)`, m.overflow === 'clip' && m.margin === '4px', m);
    // Every ancestor of the handle that clips, with its box: one more than the pane cuts the knob again.
    const clips = await page.evaluate(`(() => { const out = []; for (let e = ${P(s.sel, s.i)}.parentElement; e && e !== document.documentElement; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.overflowX !== 'visible' || cs.contain.includes('paint')) out.push({ el: window.__vu.desc(e), x: window.__vu.box(e).x, right: window.__vu.box(e).right, overflow: cs.overflowX, margin: cs.overflowClipMargin, contain: cs.contain }); } return out; })()`) as any[];
    note(`${name}: ancestors that clip`, clips);
    const top = Math.max(0, Math.ceil(m.box.y)), bottom = Math.min(env.viewport.height, Math.floor(m.box.y + m.box.h));
    // The margin holds on all four sides: a band 7px wide across each edge (6 beyond it, 1 inside), clipped to the
    // viewport; the seam's is the one the knob crosses.
    const W = env.viewport.width, Hh = env.viewport.height;
    const L = Math.floor(m.box.x), Rt = Math.floor(m.box.right), T = Math.floor(m.box.y), B = Math.floor(m.box.y + m.box.h);
    const fit = (x: number, y: number, w: number, h: number) => { const x0 = Math.max(0, x), y0 = Math.max(0, y), x1 = Math.min(W, x + w), y1 = Math.min(Hh, y + h); return x1 - x0 >= 1 && y1 - y0 >= 1 ? { x: x0, y: y0, width: x1 - x0, height: y1 - y0 } : null; };
    const seamSide = s.seam === 'end' ? 'right' : 'left';
    const bands: Record<string, { x: number; y: number; width: number; height: number } | null> = {
        left: fit(L - 6, top, 7, bottom - top), right: fit(Rt - 1, top, 7, bottom - top),
        top: fit(L - 6, T - 6, Rt - L + 12, 7), bottom: fit(L - 6, B - 1, Rt - L + 12, 7),
    };
    const shots = async () => { const o: Record<string, number[][][]> = {}; for (const [k, bd] of Object.entries(bands)) if (bd) o[k] = await shot(page, bd); return o; };
    await page.evaluate(`${P(s.sel, s.i)}.setAttribute('data-vu-noknob', '')`);
    await wait(page, 60);
    const a = await shots();
    await page.evaluate(`${q}.setAttribute('data-vu-hidden', '')`);
    await wait(page, 300);
    const hid = await page.evaluate(meas) as any;
    const b = await shots();
    await page.evaluate(`${q}.removeAttribute('data-vu-hidden')`);
    await page.evaluate(`${P(s.sel, s.i)}.removeAttribute('data-vu-noknob')`);
    await wait(page, 300);
    const edges: Record<string, any> = {};
    for (const [k, bd] of Object.entries(bands)) {
        if (!bd) { edges[k] = { band: null }; continue; }
        let diff = 0; const at: number[][] = [];
        a[k].forEach((row, y) => row.forEach((p, i) => { if (dist(p, b[k][y][i]) > 2) { diff++; if (at.length < 8) at.push([bd.x + i, bd.y + y]); } }));
        edges[k] = { band: bd, diff, at };
    }
    (result.room ??= {})[name] = { pane: m, hidden: hid, seam: seamSide, edges };
    for (const k of ['left', 'right', 'top', 'bottom']) {
        const e = edges[k];
        if (!e.band) { note(`${name}: the pane's ${k} edge`, 'outside the viewport'); continue; }
        check(`${name}: beyond the pane's ${k} edge${k === seamSide ? ' (the seam)' : ''} nothing but the knob shows (band ${e.band.width}x${e.band.height}, same pixels as overflow hidden)`, e.diff === 0, e);
    }
    check(`${name}: the pane's box is the same as with overflow hidden`, !!hid && hid.overflow === 'hidden' && ['x', 'y', 'w', 'h'].every((k) => near(hid.box[k], m.box[k], 0.01)), { clip: m.box, hidden: hid?.box });
    const ex = Math.round(s.seam === 'end' ? m.box.right : m.box.x);
    await page.screenshot({ path: `${CROPS}/${name}-edge.png`, clip: { x: Math.max(0, ex - 20), y: top, width: 40, height: bottom - top } });
    console.log(`CROP  ${CROPS}/${name}-edge.png`);
}

/** Knobs visible at the same time sit at the same height: their pixel centres, |dy| <= 1px (a check), or only noted. */
async function align(env: Env, label: string, list: [string, Pick<Site, 'sel' | 'i' | 'seam'>][], asCheck = true) {
    await env.away();
    const ys: Record<string, number | null> = {};
    for (const [name, s] of list) {
        const m = await env.page.evaluate(`(() => { const el = ${P(s.sel, s.i)}; return el ? { box: window.__vu.box(el), after: window.__vu.after(el) } : null; })()`) as any;
        if (!m) continue;
        const g = await knobGeom(env, s as Site, knobAt(m.box, m.after, s.seam));
        ys[name] = g.cy;
    }
    const v = Object.values(ys).filter((y): y is number => y != null);
    const dy = v.length >= 2 ? Math.round((Math.max(...v) - Math.min(...v)) * 100) / 100 : null;
    (result.align ??= {})[label] = { ys, dy };
    if (asCheck) check(`align ${label}: knobs at one height, |dy| <= 1px`, v.length >= 2 && dy! <= 1, { ys, dy });
    else note(`align ${label}`, { ys, dy });
}

/** The docked Jjodie window against the stacking context it paints in. It keeps the trunk's stacking (option 3 of the
 *  chat, 2026-11-21): z auto, the resting `translateY(0)` that makes it a stacking context, its dock handle at z 10
 *  inside it, so the floating rail (z 900) and the rail's tree context menu paint, and take the pointer, over the
 *  whole window, handle included; the knob's outer half under the rail is the measured exception of the `jodie-dock`
 *  site. Option 1 (window z auto with no transform, handle z 901) put the handle over that menu: scenario F,
 *  2026-11-21, 209 of 228 points of the menu over the handle's strip hit the handle, 38 today. The census, a note: every
 *  participant of that context (an element whose nearest stacking-context ancestor it is, positioned or a stacking
 *  context itself) whose painted content reaches the window's box, with its z and its DOM order. The measure: the
 *  window's box shot with today's stacking forced back (transform translateY(0) on the window, z 10 on the handle) and
 *  as it is, the same pixels (the knob's outer half, beyond the box, is not in the shot). `over`, when given, is an
 *  overlay that must still take the pointer across the handle's strip and the knob's outer half, as it did: the
 *  elements hit there, both ways. `state` names what is open. */
async function stack(env: Env, state: string, over?: string) {
    const { page } = env;
    const census = await page.evaluate(String.raw`(() => {
      const J = document.querySelector('.jodie-window--docked');
      if (!J) return null;
      const H = J.querySelector('.jodie-dock-handle');
      const memo = new Map();
      const sc = (e) => { if (memo.has(e)) return memo.get(e); let v = e === document.documentElement;
        if (!v) { const cs = getComputedStyle(e), pos = cs.position, flexItem = e.parentElement && /flex|grid/.test(getComputedStyle(e.parentElement).display);
          v = pos === 'fixed' || pos === 'sticky' || (cs.zIndex !== 'auto' && (pos !== 'static' || flexItem)) || parseFloat(cs.opacity) < 1
            || cs.transform !== 'none' || cs.translate !== 'none' || cs.rotate !== 'none' || cs.scale !== 'none' || cs.filter !== 'none'
            || (cs.backdropFilter || 'none') !== 'none' || cs.mixBlendMode !== 'normal' || cs.isolation === 'isolate' || cs.clipPath !== 'none'
            || (cs.maskImage || 'none') !== 'none' || cs.perspective !== 'none' || /paint|layout|strict|content/.test(cs.contain)
            || /transform|opacity|filter|isolation|z-index|perspective|contain|mask|clip-path/.test(cs.willChange); }
        memo.set(e, v); return v; };
      const scOf = (e) => { for (let p = e.parentElement; p; p = p.parentElement) if (sc(p)) return p; return document.documentElement; };
      const R = scOf(J);
      const own = new Map();
      const owner = (e) => { if (own.has(e)) return own.get(e); let o = null;
        if (e && e !== R && R.contains(e)) o = scOf(e) === R && (sc(e) || getComputedStyle(e).position !== 'static') ? e : owner(e.parentElement);
        own.set(e, o); return o; };
      const jr = J.getBoundingClientRect();
      const parts = new Map();
      for (const e of R.querySelectorAll('*')) {
        if (e === J || J.contains(e) || e.contains(J)) continue;
        const r = e.getBoundingClientRect();
        if (r.width <= 0 || r.height <= 0 || !e.checkVisibility({ checkVisibilityCSS: true, checkOpacity: true })) continue;
        const l = Math.max(r.x, jr.x), t = Math.max(r.y, jr.y), rr = Math.min(r.right, jr.right), b = Math.min(r.bottom, jr.bottom);
        if (rr - l < 1 || b - t < 1) continue;
        const o = owner(e);
        if (!o) continue;
        const p = parts.get(o) || { n: 0, x: l, y: t, right: rr, bottom: b, first: [] };
        p.n++; p.x = Math.min(p.x, l); p.y = Math.min(p.y, t); p.right = Math.max(p.right, rr); p.bottom = Math.max(p.bottom, b);
        if (p.first.length < 3) p.first.push(window.__vu.desc(e));
        parts.set(o, p);
      }
      const all = [];
      for (const [o, p] of parts) {
        const cs = getComputedStyle(o);
        all.push({ el: window.__vu.desc(o), z: cs.zIndex, pos: cs.position, after: !!(J.compareDocumentPosition(o) & Node.DOCUMENT_POSITION_FOLLOWING),
          overlap: { x: Math.round(p.x), y: Math.round(p.y), w: Math.round(p.right - p.x), h: Math.round(p.bottom - p.y) }, n: p.n, first: p.first });
      }
      const js = getComputedStyle(J);
      return { ctx: window.__vu.desc(R), ctxPos: getComputedStyle(R).position, ctxZ: getComputedStyle(R).zIndex,
        jodie: { z: js.zIndex, transform: js.transform, box: window.__vu.box(J) }, handle: H ? { z: getComputedStyle(H).zIndex, ctx: window.__vu.desc(scOf(H)) } : null, parts: all };
    })()`) as any;
    if (!census) { check(`jjodie dock (${state}): the docked window`, false, 'not found'); return; }
    (result.stack ??= {})[state] = census;
    note(`jjodie dock (${state}): context ${census.ctx} (${census.ctxPos}, z ${census.ctxZ}), window ${JSON.stringify(census.jodie)}, handle ${JSON.stringify(census.handle)}`, census.parts);
    // Today's stacking, forced back inline and lifted again, with the window's transition off for the swap: an inline
    // transform would start its 220ms transform transition, and the shots would be taken mid-transition, on a
    // composited layer (measured: 1px off the settled state in every state, 2026-11-21).
    const today = (on: boolean) => page.evaluate(`(() => { const J = document.querySelector('.jodie-window--docked'); const h = J && J.querySelector('.jodie-dock-handle'); if (!J || !h) return;
      J.style.transition = 'none'; J.style.transform = ${on ? `'translateY(0)'` : `''`}; h.style.zIndex = ${on ? `'10'` : `''`};
      void getComputedStyle(J).transform; J.style.transition = ''; })()`);
    const b = census.jodie.box;
    const clip = { x: Math.ceil(b.x), y: Math.max(0, Math.ceil(b.y)), width: Math.floor(b.right) - Math.ceil(b.x), height: Math.min(env.viewport.height, Math.floor(b.y + b.h)) - Math.max(0, Math.ceil(b.y)) };
    // Two shots as it is around the one of today: if they differ, something moved meanwhile (a banner sliding in),
    // and the three are taken again, up to three times.
    const differ = (p: number[][][], q: number[][][]) => { let n = 0; const at: number[][] = []; p.forEach((row, y) => row.forEach((c, i) => { if (dist(c, q[y][i]) > 2) { n++; if (at.length < 8) at.push([clip.x + i, clip.y + y]); } })); return { n, at }; };
    let diff = 0, at: number[][] = [], unstable = 0, uat: number[][] = [];
    for (let k = 0; k < 3; k++) {
        const now0 = await shot(page, clip);
        await today(true);
        await wait(page, 120);
        const before = await shot(page, clip);
        await today(false);
        await wait(page, 120);
        const now = await shot(page, clip);
        ({ n: unstable, at: uat } = differ(now0, now));
        ({ n: diff, at } = differ(before, now));
        if (!unstable) break;
        await wait(page, 1500);
    }
    (result.stack[state] as any).diff = { clip, diff, at, unstable, uat };
    check(`jjodie dock (${state}): the column holds still while it is shot`, unstable === 0, { unstable, uat });
    check(`jjodie dock (${state}): the trunk's stacking: the window z auto with its resting translateY(0), the handle z 10`, census.jodie.z === 'auto' && census.jodie.transform === 'matrix(1, 0, 0, 1, 0, 0)' && census.handle?.z === '10', { jodie: census.jodie, handle: census.handle });
    check(`jjodie dock (${state}): the window's box, the same pixels as today's stacking`, diff === 0, { diff, at });
    if (over) {
        const hits = () => page.evaluate(`(() => { const J = document.querySelector('.jodie-window--docked'); const h = J && J.querySelector('.jodie-dock-handle');
          const m = [...document.querySelectorAll(${JSON.stringify(over)})].find(window.__vu.vis); if (!h || !m) return null;
          const a = h.getBoundingClientRect(), r = m.getBoundingClientRect();
          const x0 = Math.max(a.x - 4, r.x), x1 = Math.min(a.right, r.right), y0 = Math.max(a.y, r.y), y1 = Math.min(a.bottom, r.bottom);
          if (x1 - x0 < 1 || y1 - y0 < 1) return { n: 0, lost: 0, band: null };
          let n = 0, lost = 0; const at = [];
          for (let x = x0 + 0.5; x < x1; x += 1) for (let y = y0 + 0.5; y < y1; y += 2) { n++; const e = document.elementFromPoint(x, y);
            if (!e || !m.contains(e)) { lost++; if (at.length < 4) at.push([Math.round(x), Math.round(y), window.__vu.desc(e)]); } }
          const cx = a.x + a.width / 2, cy = (y0 + y1) / 2;
          return { n, lost, at, band: { x0: Math.round(x0), x1: Math.round(x1), y0: Math.round(y0), y1: Math.round(y1) }, handle: window.__vu.box(h),
            stackAt: { x: Math.round(cx), y: Math.round(cy), els: document.elementsFromPoint(cx, cy).slice(0, 6).map(window.__vu.desc) } }; })()`) as Promise<any>;
        await today(true);
        await wait(page, 60);
        const was = await hits();
        await today(false);
        await wait(page, 60);
        const is = await hits();
        (result.stack[state] as any).hits = { over, was, is };
        check(`jjodie dock (${state}): ${over} still takes the pointer over the handle's strip, as today`, !!was && !!is && was.n > 0 && is.lost === was.lost, { was, is });
    }
}

/** Opens an overlay and measures it against the docked window: the elements that became visible (marked before),
 *  their union box, whether it reaches the window's box (if not, this overlay cannot open over the column from
 *  there), then `stack`. Escape and the pointer away close it. */
async function opened(env: Env, state: string, open: () => Promise<void>, expect = true, over?: string) {
    const { page } = env;
    await page.evaluate(`document.querySelectorAll('*').forEach((e) => { if (window.__vu.vis(e)) e.setAttribute('data-vu-seen', ''); })`);
    await open();
    await wait(page, 900);
    const o = await page.evaluate(String.raw`(() => { const J = document.querySelector('.jodie-window--docked'); const jr = J.getBoundingClientRect();
      const fresh = [...document.querySelectorAll('*:not([data-vu-seen])')].filter((e) => !J.contains(e) && window.__vu.vis(e) && !e.closest('[data-vu-seen]:not(:has(*:not([data-vu-seen])))'));
      const top = fresh.filter((e) => !fresh.includes(e.parentElement));
      if (!top.length) return { n: 0 };
      const b = top.map((e) => e.getBoundingClientRect()); const x = Math.min(...b.map((r) => r.x)), y = Math.min(...b.map((r) => r.y)), right = Math.max(...b.map((r) => r.right)), bottom = Math.max(...b.map((r) => r.bottom));
      return { n: fresh.length, roots: top.slice(0, 4).map(window.__vu.desc), box: { x: Math.round(x), y: Math.round(y), right: Math.round(right), bottom: Math.round(bottom) }, reaches: right > jr.x + 1 && x < jr.right && bottom > jr.y && y < jr.bottom, jodieX: Math.round(jr.x) }; })()`) as any;
    (result.overlays ??= {})[state] = o;
    note(`jjodie dock (${state}): what opened`, o);
    if (expect) check(`jjodie dock (${state}): the overlay opened`, o.n > 0, o);
    await stack(env, state, over);
    await page.keyboard.press('Escape');
    await env.away();
    await page.evaluate(`document.querySelectorAll('[data-vu-seen]').forEach((e) => e.removeAttribute('data-vu-seen'))`);
}

const DOCK = '.not-strip > .dock-layout > .dock-hbox > .dock-divider';
const RAIL = '.properties-with-tree-view--rail';
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
        await site(env, 'rail', { sel: '.properties-panel-resize-handle', rest: false, strip: 'self', stripW: 6, seam: 'start', dx: -60, pane: 'parent', readout: true, clipPane: RAIL });
        // Alfonso's state: two canvases split, the Properties rail open.
        await align(env, 'canvas split + rail', [['dock-canvas-split', { sel: DOCK }], ['rail', { sel: '.properties-panel-resize-handle', seam: 'start' }]]);

        await env.dm(`await dm.openManager(window.LPointerTargetable.fromPointer(${JSON.stringify(ids.m1)}));`);
        await poll(page, `!!${P('.instance-manager__resizer')}`, 15000);
        await wait(page, 1200);
        await site(env, 'im-outline', { sel: '.instance-manager__resizer', i: 0, rest: false, strip: 'self', stripW: 8, dx: 40, readout: true });
        await site(env, 'im-classes', { sel: '.instance-manager__resizer', i: 1, rest: false, strip: 'self', stripW: 8, dx: -40, readout: true });
        await align(env, 'instance manager beside a canvas', [['dock', { sel: DOCK }], ['im-outline', { sel: '.instance-manager__resizer', i: 0 }], ['im-classes', { sel: '.instance-manager__resizer', i: 1 }]]);

        await env.dm(`const now = Date.now(); dm.openTransformation({ id: 'probe_vsplit_u', name: 'ProbeU', code: 'transformation ProbeU\\n', createdAt: now, modifiedAt: now });`);
        await poll(page, `!!${P('.jjtl-side-panel-resize-handle')}`, 20000);
        await wait(page, 2000);
        await site(env, 'jjtl-side', { sel: '.jjtl-side-panel-resize-handle', rest: false, strip: 'self', stripW: 8, seam: 'end', dx: 60, pane: 'parent', clipPane: '.jjtl-dev-env-side-panel' });
        await site(env, 'jjtl-right', { sel: '.jjtl-right-panel-resize-handle', rest: false, strip: 'self', stripW: 8, seam: 'start', dx: -60, pane: 'parent', clipPane: '.jjtl-dev-env-inferred-panel' });
        // Noted, not checked: JjTL's panes start below its own toolbar and end above a resizable bottom panel.
        await align(env, 'jjtl beside a canvas', [['dock', { sel: DOCK }], ['jjtl-side', { sel: '.jjtl-side-panel-resize-handle', seam: 'end' }], ['jjtl-right', { sel: '.jjtl-right-panel-resize-handle', seam: 'start' }]], false);

        await env.dm(`await dm.open2(window.LPointerTargetable.fromPointer(${JSON.stringify(ids.m1)}));`);
        await wait(page, 1500);
        await page.evaluate(`document.querySelector('.jodie-minimized')?.click()`);
        await poll(page, `!!document.querySelector('.jodie-window.jodie-window--visible')`, 8000);
        await wait(page, 1000);
        // The floating rail (z 900) ends on this seam and paints over the window's stacking context, so it covers the
        // knob's outer half: at least 4 of its 6px show (option 3 of the chat, 2026-11-21; scenario F has why not 901).
        await site(env, 'jodie-dock', { sel: '.jodie-dock-handle', rest: false, strip: 'self', stripW: 8, seam: 'start', dx: -60, pane: 'parent', clipPane: '.jodie-window', knobMinW: 4 });
        await site(env, 'rail-with-jodie', { sel: '.properties-panel-resize-handle', rest: false, strip: 'self', stripW: 6, seam: 'start', dx: -40, pane: 'parent', readout: true, clipPane: RAIL });
        await align(env, 'jjodie docked', [['jodie-dock', { sel: '.jodie-dock-handle', seam: 'start' }], ['rail', { sel: '.properties-panel-resize-handle', seam: 'start' }], ['dock', { sel: DOCK }]]);
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
        await align(env, 'generator beside a canvas', [['dock', { sel: DOCK }], ['codegen-tpl', { sel: '.codegen-tpl__splitter' }]]);
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
        // and from its right side, rightwards: dragged left the seam goes under that body, knob and all (knob run 1,
        // 2026-11-20). The same body covers the knob's leftmost columns (x <= 998): 4 of its 6px show (knob run 1).
        await site(env, 'dock-divider-plain', dockSite({ cropY: 18, minHit: 5, knobMinW: 4, dx: 60, seamDrags: [3] }));
    });

    // E. The Script tab in the pane layout (window below 1100px).
    await scenario(browser, 'E', { width: 1060, height: 1000 }, async (env) => {
        const { page } = env;
        await page.evaluate(String.raw`(async () => { const sf = await import('/src/components/scripts/scriptFiles.ts'); const e = sf.openScriptAsFile('', 'probe pane'); return e ? e.id : null; })()`);
        await poll(page, `!!${P('.script-tab__handle')}`, 20000);
        await wait(page, 1500);
        await site(env, 'script-tab', { sel: '.script-tab__handle', rest: true, strip: 'pseudo', stripW: 8, dx: 60, pane: 'prev' });
    });

    // F. The docked Jjodie window (the trunk's stacking) against what can open over its column, the rail open beside
    //    it; then its own overflow menu.
    await scenario(browser, 'F', { width: 1600, height: 1000 }, async (env) => {
        const { page, ids } = env;
        await env.dm(`await dm.open2(window.LPointerTargetable.fromPointer(${JSON.stringify(ids.m1)}));`);
        await poll(page, `document.querySelectorAll('.react-flow__node').length > 0`, 60000);
        await wait(page, 1500);
        await page.evaluate(`document.querySelector('.jodie-minimized')?.click()`);
        await poll(page, `!!document.querySelector('.jodie-window--docked.jodie-window--visible')`, 8000);
        await page.evaluate(`(async () => { const { JjodelEvents } = await import('/src/events/registry.ts'); window.dispatchEvent(new CustomEvent(JjodelEvents.PROPERTIES_SHOW)); })()`);
        await poll(page, `(() => { const r = document.querySelector('.properties-tree-overlay'); return !!r && !r.classList.contains('properties-tree-overlay--collapsed'); })()`, 5000);
        await wait(page, 1500);
        await env.away();
        await stack(env, 'rest, rail open');
        // The tree's context menu (Create View): position fixed, z 9999, at the pointer, kept inside the viewport only;
        // it renders inside the rail, so it paints at the rail's 900. Opened on a class row, near the rail's right edge.
        await opened(env, 'rail: tree context menu on a class row', async () => {
            const at = await page.evaluate(`(() => { const r = document.querySelector('.properties-tree-overlay').getBoundingClientRect(); const i = window.__vu.pick('.tree-node__icon.tree-DClass'); if (!i) return null; const row = i.closest('[data-element-id]') || i.parentElement; const rr = row.getBoundingClientRect(); return { x: Math.round(Math.min(rr.right, r.right) - 12), y: Math.round(rr.y + rr.height / 2), hit: window.__vu.desc(document.elementFromPoint(Math.min(rr.right, r.right) - 12, rr.y + rr.height / 2)) }; })()`) as any;
            note('jjodie dock: right-click on the tree at', at);
            if (at) await page.mouse.click(at.x, at.y, { button: 'right' });
        }, true, '.tree-node__context-menu');
        // A tooltip near the seam: the hover of the rail's rightmost button.
        await opened(env, 'rail: hover of its rightmost button', async () => {
            const at = await page.evaluate(`(() => { const r = document.querySelector('.properties-tree-overlay'); const b = [...r.querySelectorAll('button')].filter(window.__vu.vis).sort((p, q) => q.getBoundingClientRect().right - p.getBoundingClientRect().right)[0]; if (!b) return null; const x = b.getBoundingClientRect(); return { el: window.__vu.desc(b), t: b.getAttribute('title') || b.getAttribute('aria-label'), x: Math.round(x.x + x.width / 2), y: Math.round(x.y + x.height / 2) }; })()`) as any;
            note('jjodie dock: hover at', at);
            if (at) await page.mouse.move(at.x, at.y, { steps: 4 });
        }, false);
        // The app bar's menu (New document).
        await opened(env, 'app bar: New document menu', async () => { await page.evaluate(`window.__vu.pick('button.new-document__btn')?.click()`); });
        // The status bar's notification centre, at its right end, above the window's column (portalled to body).
        await opened(env, 'status bar: notification centre', async () => { await page.evaluate(`window.__vu.pick('button.sb-rz__bell')?.click()`); });
        // The rail closed: the canvas reaches the window.
        await page.evaluate(`[...document.querySelectorAll('button')].find((b) => window.__vu.vis(b) && /^Hide panel$/.test(b.getAttribute('title') || b.getAttribute('aria-label') || ''))?.click()`);
        await poll(page, `(() => { const r = document.querySelector('.properties-tree-overlay'); return !r || r.classList.contains('properties-tree-overlay--collapsed') || !window.__vu.vis(r); })()`, 5000);
        await wait(page, 1000);
        await env.away();
        await stack(env, 'rest, rail closed');
        note('jjodie dock (rail closed): the canvas topbar within 300px of the window', await page.evaluate(String.raw`(() => { const x0 = document.querySelector('.jodie-window--docked').getBoundingClientRect().x;
          return [...document.querySelectorAll('button, [role="button"], select')].filter((e) => window.__vu.vis(e) && !e.closest('.jodie-window')).map((e) => ({ el: window.__vu.desc(e), t: (e.getAttribute('title') || e.getAttribute('aria-label') || e.textContent || '').trim().slice(0, 26), hp: e.getAttribute('aria-haspopup'), box: window.__vu.box(e) })).filter((d) => d.box.y > 60 && d.box.y < 140 && d.box.right > x0 - 300); })()`));
        note('jjodie dock: the palette', await page.evaluate(`(() => { const p = [...document.querySelectorAll('[class*="palette"]')].filter(window.__vu.vis).map((e) => e.getBoundingClientRect().right); return { right: p.length ? Math.round(Math.max(...p)) : null, jodieX: Math.round(document.querySelector('.jodie-window--docked').getBoundingClientRect().x) }; })()`));
        // The canvas toolbar's rightmost dropdown (the viewpoint listbox), the rail closed.
        await opened(env, 'canvas toolbar: viewpoint listbox', async () => { await page.evaluate(`window.__vu.pick('button.toolbar-viewpoint-trigger')?.click()`); });
        // The canvas context menu (position fixed, z 1000), right-clicked on the node nearest the window.
        await opened(env, 'canvas: node context menu beside the window', async () => {
            const at = await page.evaluate(`(() => { const x0 = document.querySelector('.jodie-window--docked').getBoundingClientRect().x; const n = [...document.querySelectorAll('.react-flow__node')].filter(window.__vu.vis).map((e) => e.getBoundingClientRect()).filter((r) => r.right < x0 - 4).sort((p, q) => q.right - p.right)[0]; return n ? { x: Math.round(n.right - 10), y: Math.round(n.y + 10) } : null; })()`) as any;
            note('jjodie dock: right-click on a node at', at);
            if (at) await page.mouse.click(at.x, at.y, { button: 'right' });
        });
        // Jjodie's own overlays. The header's overflow menu (z 20, inside the window): now a participant of the app-level
        // context, it must render as it did inside the window's own context. `.jodie-confirm-overlay` (z 3000) is
        // rendered by no component (grep, 2026-11-21): noted, not opened.
        await page.evaluate(`document.querySelector('.jodie-window--docked .jodie-overflow-btn')?.click()`);
        await poll(page, `!!document.querySelector('.jodie-overflow-menu')`, 5000);
        await wait(page, 400);
        note('jjodie dock: the overflow menu', await page.evaluate(`(() => { const m = document.querySelector('.jodie-overflow-menu'); return m ? { box: window.__vu.box(m), z: getComputedStyle(m).zIndex, items: m.querySelectorAll('[role="menuitem"]').length } : null; })()`));
        await stack(env, 'jjodie: overflow menu open');
        await page.keyboard.press('Escape');
        await env.away();
        await wait(page, 400);
        note('jjodie dock: .jodie-confirm-overlay rendered', await page.evaluate(`document.querySelectorAll('.jodie-confirm-overlay').length`));
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
