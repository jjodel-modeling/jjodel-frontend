/**
 * onto-s3b-ghost-rows (P-2026-10-25-2220): S3b's acceptance on the library of the UML fixture, the oracle of
 * docs/discovery/discovery_2026-10-21_onto_s3b_ghost_rows.md («Oracle for Phase 2», probe):
 *   S3b-0  baseline: no `.ir-row--ghost`, no `.ir-row--orphan` in any node, before and after the bindings are written;
 *   S3b-1  Property `pages : Integer = 320` added to Book (createInstance, as onto-s3a-slot-problems.ts S3-2): within
 *          1 s dune's node holds a `.ir-row--ghost` reading `pages =`, no Slot whose definingFeature is pages in
 *          idlookup; the ghost row's DOM box inside the node's box and not clipped (the hit test at its centre lands on
 *          it), both boxes recorded;
 *   S3b-2  double-click the ghost value, type 300, Enter: within 3 s one new Slot (definingFeature pages) and one
 *          LiteralInteger with value 300 (not 320); no ghost row left; a row reading `pages = 300`; dune's node sampled
 *          every 100 ms in the page through the run never shows an orphan row nor two rows naming pages; undo stack +1,
 *          counted from the open editor (the double-click's own selection write, risk R4, lands first and is recorded);
 *   S3b-3  one Cmd+Z: both ids gone, the idlookup key set equal to the one before S3b-2, the ghost row back, the undo
 *          stack back to its length at the edit;
 *   S3b-4  Property isbn deleted through `L(id).delete()`: dune's isbn row carries `.ir-row--orphan`, the marker, the
 *          tooltip «Its feature is gone», and still the value 978-0441013593; its slot still in idlookup;
 *   S3b-5  page errors [].
 * Mutation M4: the `orphan` prop not passed to `IRRow` in IRNodeContent.tsx; S3b-4 turns red.
 *
 * The export: UML_FILE, default ~/jjodel-demo-exports/uml-s3b/uml-class-object.jjodel (re-exported after decision 2,
 * R-OI-16: no InstanceSpecification carries a manual box).
 * Run: lane-run probe <worktree> frontend/scripts/probe/onto-s3b-ghost-rows.ts --port <n> [--id <Prompt-ID>].
 * ONTO_OUT moves the assets (crops and measures) out of docs/discovery/assets/onto-s3b/.
 */
import { chromium, type Page } from '@playwright/test';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { setTheme, SETTLE_MS } from '../smoke/states.ts';

const URL = (process.env.PROBE_URL || 'http://localhost:3088/').replace(/\/$/, '');
const OUT = (process.env.ONTO_OUT || new globalThis.URL('../../../docs/discovery/assets/onto-s3b/', import.meta.url).pathname).replace(/\/$/, '');
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });
// bpmn-lanes-fixture writes its own assets where these point at import time: keep them out of the tree.
process.env.UML_OUT = '/tmp'; process.env.GV_OUT = '/tmp';
const { ev, openPage, pickViewpoint } = await import('./bpmn-lanes-fixture.ts');

const FILE = process.env.UML_FILE || `${homedir()}/jjodel-demo-exports/uml-s3b/uml-class-object.jjodel`;
const VP_OBJECT = 'UML object diagram';

let pass = 0; let fail = 0;
const check = (name: string, ok: boolean, detail: unknown) => {
    if (ok) pass++; else fail++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  ${JSON.stringify(detail ?? null).slice(0, 900)}`);
};
const wait = (page: Page, ms: number) => page.waitForTimeout(ms);

type State = { keys: string[]; undo: number | null; slots: Array<{ id: string; df: string[] | null }>; inFlight: boolean };

/** idlookup keys, the user's undo length, dune's slots with their definingFeature (onto-s3a-slot-problems.ts READ). */
const READ = `
    const idl = w.store.getState().idlookup;
    const feat = (o, n) => { for (const vid of (o && o.features) || []) { const v = idl[vid]; if (v && idl[v.instanceof] && idl[v.instanceof].name === n) return v; } return null; };
    const sv = feat(idl[a], 'slots');
    const slots = sv ? sv.values.map((sid) => { const df = idl[sid] ? feat(idl[sid], 'definingFeature') : null; return { id: sid, df: df ? [...df.values] : null }; }) : [];
    const h = w.statehistory && w.statehistory[w.DUser.current];
    const inst = await import('/src/components/editor-v2/hooks/instantiate.ts');
    return { keys: Object.keys(idl), undo: h ? h.undoable.length : null, slots, inFlight: inst.instantiationInFlight() };`;
const read = (page: Page, dune: string) => ev<State>(page, READ, dune, 0);

async function until(page: Page, dune: string, ok: (s: State) => boolean, ms: number) {
    const t0 = Date.now(); let s = await read(page, dune);
    while (!ok(s) && Date.now() - t0 < ms) { await wait(page, 50); s = await read(page, dune); }
    return { s, ok: ok(s), ms: Date.now() - t0 };
}
/** No instantiation in flight and the undo length still for 800 ms. */
async function settle(page: Page, dune: string) {
    let s = await read(page, dune); let since = Date.now(); const end = Date.now() + 5000;
    while (Date.now() < end && (s.inFlight || Date.now() - since < 800)) {
        await wait(page, 150); const n = await read(page, dune);
        if (n.undo !== s.undo || n.inFlight) since = Date.now();
        s = n;
    }
    return s;
}

const nodeSel = (vid: string) => `.dock-tabpane-active .react-flow__node[data-id="${vid}"]`;
type Row = { text: string; ghost: boolean; orphan: boolean; marker: boolean; title: string | null; feature: string | null;
    box: { x: number; y: number; w: number; h: number }; inside: boolean; hit: boolean };
type NodeBox = { x: number; y: number; w: number; h: number; rows: Row[] };
/** dune's node: its box and its `.ir-row`s, each with its classes, its box, inside the node or not, and the hit test. */
const nodeBox = (page: Page, vid: string) => page.evaluate((sel) => {
    const el = document.querySelector(sel) as HTMLElement | null; if (!el) return null;
    const n = el.getBoundingClientRect();
    const rows = Array.from(el.querySelectorAll('.ir-row')).map((x) => { const r = x.getBoundingClientRect();
        const hitEl = document.elementFromPoint(r.left + Math.min(r.width / 2, 20), r.top + r.height / 2);
        return { text: (x as HTMLElement).innerText.replace(/\s+/g, ' ').trim().slice(0, 60),
            ghost: x.classList.contains('ir-row--ghost'), orphan: x.classList.contains('ir-row--orphan'),
            marker: !!x.querySelector('.ir-row__orphan-marker'), title: x.getAttribute('title'), feature: x.getAttribute('data-feature'),
            box: { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) },
            inside: r.left >= n.left - 1 && r.right <= n.right + 1 && r.top >= n.top - 1 && r.bottom <= n.bottom + 1,
            hit: !!hitEl && (hitEl === x || x.contains(hitEl)) }; });
    return { x: n.x, y: n.y, w: n.width, h: n.height, rows };
}, nodeSel(vid)) as Promise<NodeBox | null>;
const allCount = (page: Page, cls: string) => page.evaluate((c) => document.querySelectorAll(`.dock-tabpane-active .react-flow__node .${c}`).length, cls);

/** Drag the pane until dune's node sits in the canvas's visible part (onto-s3a-slot-problems.ts bringIntoView). */
async function bringIntoView(page: Page, vid: string) {
    for (let i = 0; i < 4; i++) {
        const g = await page.evaluate((sel) => {
            const el = document.querySelector(sel); const flow = document.querySelector('.dock-tabpane-active .react-flow');
            if (!el || !flow) return null;
            const n = el.getBoundingClientRect(); const p = flow.getBoundingClientRect();
            const vw = Math.min(p.right, window.innerWidth); const vh = Math.min(p.bottom, window.innerHeight);
            const inFlow = (x: number, y: number) => { const h = document.elementFromPoint(x, y); return !!h && !!h.closest('.dock-tabpane-active .react-flow'); };
            const longest = (from: number, to: number, at: (v: number) => boolean) => { let best: [number, number] = [from, from]; let start: number | null = null;
                for (let v = from; v <= to; v += 10) { if (at(v)) { if (start === null) start = v; if (v - start > best[1] - best[0]) best = [start, v]; } else start = null; }
                return best; };
            const [x0, x1] = longest(p.left + 5, vw - 5, (x) => inFlow(x, (p.top + vh) / 2));
            const [y0, y1] = longest(p.top + 5, vh - 5, (y) => inFlow((x0 + x1) / 2, y));
            const inside = n.left >= x0 + 20 && n.right <= x1 - 20 && n.top >= y0 + 20 && n.bottom <= y1 - 20;
            const dx = (x0 + x1) / 2 - (n.left + n.width / 2); const dy = (y0 + y1) / 2 - (n.top + n.height / 2);
            let from = null;
            const xs: number[] = []; for (let v = x0 + 20; v < x1 - 20; v += 30) xs.push(v); if (dx < 0) xs.reverse();
            const ys: number[] = []; for (let v = y0 + 20; v < y1 - 20; v += 30) ys.push(v); if (dy < 0) ys.reverse();
            for (const gy of ys) for (const gx of xs) {
                if (from) break;
                const ex = Math.max(x0 + 10, Math.min(x1 - 10, gx + dx)); const ey = Math.max(y0 + 10, Math.min(y1 - 10, gy + dy));
                const hit = document.elementFromPoint(gx, gy);
                if (hit && hit.classList.contains('react-flow__pane') && Math.hypot(ex - gx, ey - gy) >= 0.9 * Math.min(Math.hypot(dx, dy), 300)) from = { x: gx, y: gy, ex, ey };
            }
            return { inside, from };
        }, nodeSel(vid));
        if (!g || g.inside || !g.from) return g;
        await page.mouse.move(g.from.x, g.from.y); await page.mouse.down();
        await page.mouse.move(g.from.ex, g.from.ey, { steps: 12 }); await page.mouse.up();
        await wait(page, 500);
    }
    return null;
}

/** A crop of the page around `rects` (union), padded. */
async function crop(page: Page, file: string, rects: Array<{ x: number; y: number; w: number; h: number }>, pad = 24) {
    const x0 = Math.max(0, Math.min(...rects.map((r) => r.x)) - pad); const y0 = Math.max(0, Math.min(...rects.map((r) => r.y)) - pad);
    const vp = page.viewportSize() ?? { width: 1440, height: 900 };
    const x1 = Math.min(vp.width, Math.max(...rects.map((r) => r.x + r.w)) + pad); const y1 = Math.min(vp.height, Math.max(...rects.map((r) => r.y + r.h)) + pad);
    if (x1 - x0 < 8 || y1 - y0 < 8) { console.log(`MEAS  crop ${file} skipped: outside the viewport`); return; }
    await page.screenshot({ path: `${OUT}/${file}`, clip: { x: x0, y: y0, width: x1 - x0, height: y1 - y0 } });
}

const browser = await chromium.launch();
const out: Record<string, unknown> = { url: URL, at: new Date().toISOString(), file: FILE };
try {
    const { page, errors } = await openPage(browser);
    await page.goto(`${URL}/#/allProjects`, { waitUntil: 'domcontentloaded', timeout: 300000 });
    await wait(page, 5000);
    const imported = await ev<{ id: string | null }>(page, `
        const api = await import('/src/api/persistance/projects.ts');
        const list = () => JSON.parse(localStorage.getItem('projects') || '[]');
        const before = list().length;
        await api.ProjectsApi.importFromText(a);
        for (let i = 0; i < 75 && list().length <= before; i++) await new Promise((r) => setTimeout(r, 200));
        const l = list(); return { id: l.length > before ? l[l.length - 1].id : null };`, readFileSync(FILE, 'utf8'), 0);
    if (!imported.id) throw new Error('the export did not import');
    await page.goto(`${URL}/#/project?id=${imported.id}`, { waitUntil: 'domcontentloaded', timeout: 300000 });
    await wait(page, 9000);
    await page.addStyleTag({ content: '.notification-widget, .notification-content, .donation-banner { pointer-events: none !important; display: none !important; }' }).catch(() => {});
    if (!(await page.locator('.toolbar-viewpoint-trigger:visible').count())) {
        await ev(page, `const dm = await import('/src/components/abstract/DockManager.tsx'); const m = w.LProject.getProject().models.find((x) => !x.isMetamodel);
            await dm.default.open2(w.LPointerTargetable.fromPointer(m.id)); return 1;`, undefined, 8000);
    }
    await setTheme(page, 'light');
    await pickViewpoint(page, VP_OBJECT);
    await wait(page, SETTLE_MS);
    { const fit = page.locator('.toolbar-commands__level:visible'); if (await fit.count()) { await fit.first().click(); await wait(page, 900); } }

    // The ids: model, metamodel, Book and its isbn, dune with its isbn slot, Integer, dune's vertex.
    const ids = await ev<Record<string, any>>(page, `
        const idl = w.store.getState().idlookup;
        const m = w.LProject.getProject().models.find((x) => !x.isMetamodel);
        const objs = Object.values(idl).filter((r) => r && r.className === 'DObject');
        const meta = (o) => idl[o.instanceof] && idl[o.instanceof].name;
        const feat = (o, n) => { for (const vid of o.features || []) { const v = idl[vid]; if (v && idl[v.instanceof] && idl[v.instanceof].name === n) return v; } return null; };
        const book = objs.find((o) => o.name === 'Book' && meta(o) === 'Class');
        const attrs = book ? (feat(book, 'ownedAttributes') || { values: [] }).values : [];
        const isbn = attrs.find((x) => idl[x] && idl[x].name === 'isbn') || null;
        const dune = objs.find((o) => o.name === 'dune');
        const slots = dune ? (feat(dune, 'slots') || { values: [] }).values : [];
        const isbnSlot = slots.find((s) => idl[s] && (feat(idl[s], 'definingFeature') || { values: [] }).values.includes(isbn)) || null;
        const integer = objs.find((o) => o.name === 'Integer' && meta(o) === 'PrimitiveType');
        const vertices = dune ? Object.values(idl).filter((r) => r && r.model === dune.id).map((r) => r.id) : [];
        return { model: m.id, mm: idl[m.id].instanceof, book: book && book.id, isbn, dune: dune && dune.id, isbnSlot, integer: integer && integer.id, vertices };`, undefined, 0);
    out.ids = ids;
    const findVid = () => page.evaluate((vs: string[]) => vs.find((v) => document.querySelector(`.dock-tabpane-active .react-flow__node[data-id="${v}"]`)) ?? null, ids.vertices as string[]);
    let vid = await findVid();
    // The canvas mounts only the nodes in view (EditorV2.tsx, onlyRenderVisible.ts): when dune is off-screen, drag the
    // pane towards its store layout until its node mounts (P-2026-11-07-0155, the step of P-2026-11-07-0110's variant).
    if (!vid && (ids.vertices as string[]).length > 0) {
        const lay = await ev<{ lk: string; x: number; y: number; w: number; h: number }>(page, `
            const st = w.store.getState();
            const lk = (await import('/src/components/editor-v2/viewpoint/layout/vertexLayoutAdapter.ts')).getLayoutKeyOf(st);
            const l = (await import('/src/components/editor-v2/viewpoint/layout/vertexLayout.ts')).readVertexLayout(st.idlookup[a], lk);
            return { lk, x: l.x, y: l.y, w: l.w, h: l.h };`, (ids.vertices as string[])[0], 0);
        console.log('SETUP  dune layout ' + JSON.stringify(lay));
        for (let i = 0; i < 40 && !vid; i++) {
            const g = await page.evaluate((l) => {
                const flow = document.querySelector('.dock-tabpane-active .react-flow'); const vp = flow && flow.querySelector('.react-flow__viewport');
                if (!flow || !vp) return null;
                const m = new DOMMatrixReadOnly(getComputedStyle(vp).transform);
                const r = flow.getBoundingClientRect();
                const cx = r.left + m.e + (l.x + (l.w || 0) / 2) * m.a; const cy = r.top + m.f + (l.y + (l.h || 0) / 2) * m.a;
                const tx = r.left + r.width / 2; const ty = r.top + r.height / 2;
                const dx = tx - cx; const dy = ty - cy; const s = Math.min(1, 250 / Math.max(1, Math.hypot(dx, dy)));
                for (let oy = -150; oy <= 150; oy += 30) for (let ox = -150; ox <= 150; ox += 30) {
                    const px = tx + ox; const py = ty + oy; const h = document.elementFromPoint(px, py);
                    if (h && h.classList.contains('react-flow__pane')) return { px, py, ex: px + dx * s, ey: py + dy * s, dx, dy, z: m.a };
                }
                return { px: null, dx, dy, z: m.a };
            }, lay);
            if (!g || g.px === null) { console.log('SETUP  no pane point ' + JSON.stringify(g)); break; }
            await page.mouse.move(g.px, g.py); await page.mouse.down();
            await page.mouse.move(g.ex, g.ey, { steps: 8 }); await page.mouse.up();
            await wait(page, 300);
            vid = await findVid();
            if (vid) console.log(`SETUP  dune mounted after ${i + 1} drag(s), last delta ${Math.round(g.dx)},${Math.round(g.dy)} zoom ${g.z}`);
        }
    }
    out.vertex = vid;
    if (vid) { await bringIntoView(page, vid); out.inView = await nodeBox(page, vid); }
    if (!ids.dune || !ids.book || !ids.isbn || !ids.isbnSlot || !ids.integer || !vid) throw new Error('fixture ids missing: ' + JSON.stringify({ ...ids, vid }));
    const dune = ids.dune as string;

    // ── S3b-0: baseline, then the bindings through mm.state (onto-s3a-slot-problems.ts S3-0, verbatim) ──────────────
    const before0 = { ghost: await allCount(page, 'ir-row--ghost'), orphan: await allCount(page, 'ir-row--orphan') };
    const written = await ev<{ ok: boolean; missing: string[] }>(page, `
        const idl = w.store.getState().idlookup; const mm = a;
        const inMM = (id) => { for (let x = id, i = 0; x && i < 32; i++) { if (x === mm) return true; x = idl[x] && idl[x].father; } return false; };
        const cls = {}; for (const r of Object.values(idl)) if (r && r.className === 'DClass' && inMM(r.id)) cls[r.name] = r;
        const missing = [];
        const C = (n) => { if (!cls[n]) missing.push(n); return cls[n] ? cls[n].id : n; };
        const F = (c, n) => { const k = cls[c]; const id = k && [...(k.attributes || []), ...(k.references || [])].find((f) => idl[f] && idl[f].name === n);
            if (!id) missing.push(c + '.' + n); return id || c + '.' + n; };
        const shared = { typeReference: F('InstanceSpecification', 'classifier'), slotContainer: F('InstanceSpecification', 'slots'),
            definingFeature: F('Slot', 'definingFeature'), valueHolder: F('Slot', 'values') };
        const object = { name: 'object', ...shared, featureContainer: F('Class', 'ownedAttributes'),
            generalization: { via: F('Classifier', 'generalizations'), general: F('Generalization', 'general') },
            abstractFlag: F('Classifier', 'isAbstract'), featureType: F('TypedElement', 'type'), defaultValue: F('Property', 'defaultValue'),
            valueKinds: [
                { when: 'primitive:Boolean', create: C('LiteralBoolean'), field: F('LiteralBoolean', 'value') },
                { when: 'primitive:String', create: C('LiteralString'), field: F('LiteralString', 'value') },
                { when: 'primitive:Integer', create: C('LiteralInteger'), field: F('LiteralInteger', 'value') },
                { when: 'instance', create: C('InstanceValue'), field: F('InstanceValue', 'instance') },
            ] };
        const link = { name: 'link', ...shared, featureContainer: F('Association', 'memberEnds') };
        if (missing.length) return { ok: false, missing };
        w.LPointerTargetable.fromPointer(mm).state = { ontoBindings: JSON.stringify({ v: 1, bindings: [object, link] }) };
        await new Promise((r) => setTimeout(r, 600));
        const s = w.store.getState().idlookup[mm]._state;
        return { ok: !!(s && s.ontoBindings), missing };`, ids.mm, 400);
    if (!written.ok) throw new Error('the bindings did not land: ' + JSON.stringify(written.missing));
    await wait(page, 1200);
    await settle(page, dune);
    const after0 = { ghost: await allCount(page, 'ir-row--ghost'), orphan: await allCount(page, 'ir-row--orphan') };
    const box0 = await nodeBox(page, vid);
    out.s0 = { before0, after0, node: box0 && { w: box0.w, h: box0.h, rows: box0.rows.map((r) => r.text) } };
    check('S3b-0 baseline: no ghost and no orphan row in any node, before and after the bindings',
        before0.ghost === 0 && before0.orphan === 0 && after0.ghost === 0 && after0.orphan === 0, out.s0);

    // ── S3b-1: Property pages : Integer = 320 on Book; dune's ghost row ─────────────────────────────────────────────
    const pages = await ev<{ ok: boolean; id: string | null; reason?: string }>(page, `
        const ca = await import('/src/components/editor-v2/hooks/createAdapter.ts');
        return ca.createInstance(a.model, 'Property', a.book, 'ownedAttributes', { name: 'pages', type: a.integer, defaultValue: '320' });`,
        { model: ids.model, book: ids.book, integer: ids.integer }, 0);
    const t1 = Date.now();
    let box1: NodeBox | null = null; let ghost1: Row | undefined;
    while (Date.now() - t1 < 1000) {
        box1 = await nodeBox(page, vid);
        ghost1 = box1?.rows.find((r) => r.ghost);
        if (ghost1) break;
        await wait(page, 50);
    }
    const ghostMs = Date.now() - t1;
    await wait(page, 500);
    const s1 = await settle(page, dune);
    box1 = await nodeBox(page, vid);
    ghost1 = box1?.rows.find((r) => r.ghost);
    const slotForPages = s1.slots.filter((x) => (x.df || []).includes(pages.id!));
    const pagesSlotsAnywhere = await ev<number>(page, `
        const idl = w.store.getState().idlookup; let n = 0;
        for (const r of Object.values(idl)) if (r && r.className === 'DObject' && idl[r.instanceof] && idl[r.instanceof].name === 'Slot')
            for (const vid of r.features || []) { const v = idl[vid]; if (v && idl[v.instanceof] && idl[v.instanceof].name === 'definingFeature' && (v.values || []).includes(a)) n++; }
        return n;`, pages.id, 0);
    out.s1 = { pages, ghostMs, node: box1 && { x: box1.x, y: box1.y, w: box1.w, h: box1.h }, ghost: ghost1, rows: box1?.rows.map((r) => [r.text, r.inside, r.hit]) };
    check('S3b-1 pages added to Book: within 1 s a ghost row reading "pages =" in dune\'s node, inside its box and not clipped; no Slot for pages',
        pages.ok && ghostMs <= 1000 && !!ghost1 && ghost1.text === 'pages =' && ghost1.feature === pages.id && ghost1.inside && ghost1.hit
        && slotForPages.length === 0 && pagesSlotsAnywhere === 0,
        { ghostMs, ghost: ghost1 && { text: ghost1.text, box: ghost1.box, inside: ghost1.inside, hit: ghost1.hit },
            node: box1 && { x: Math.round(box1.x), y: Math.round(box1.y), w: Math.round(box1.w), h: Math.round(box1.h) }, slotsForPages: pagesSlotsAnywhere });
    if (box1) await crop(page, 'onto-s3b-ghost-light.png', [box1]);

    // ── S3b-2: double-click the ghost value, type 300, Enter ─────────────────────────────────────────────────────────
    const s20 = await settle(page, dune);
    // dune's node sampled in the page every 100 ms: orphan rows, rows naming pages.
    await page.evaluate((sel) => {
        const wv = window as any; wv.__s3bSamples = [];
        wv.__s3bTimer = setInterval(() => {
            const el = document.querySelector(sel); if (!el) { wv.__s3bSamples.push({ none: true }); return; }
            const rows = Array.from(el.querySelectorAll('.ir-row')).map((x) => (x as HTMLElement).innerText.replace(/\s+/g, ' ').trim());
            wv.__s3bSamples.push({ orphan: el.querySelectorAll('.ir-row--orphan').length, pages: rows.filter((t) => /^pages\b/.test(t)).length });
        }, 100);
    }, nodeSel(vid));
    const cell = page.locator(`${nodeSel(vid)} .ir-row--ghost[data-feature="${pages.id}"] .ir-row__value--editable`).first();
    const hasCell = (await cell.count()) === 1;
    let typed = false; let sDbl: State | null = null;
    if (hasCell) {
        await cell.dblclick();
        await wait(page, 300);
        const input = page.locator(`${nodeSel(vid)} .ir-row--ghost .ir-row__input`).first();
        if (await input.count()) {
            // R4 (the shallow-merge ticket): the double-click's selection write lands as an entry of its own; wait for
            // the store idle with the editor open, so the gesture's +1 is counted from here.
            sDbl = await settle(page, dune);
            await page.keyboard.type('300', { delay: 40 });
            typed = true;
            const bt = await nodeBox(page, vid);
            if (bt) await crop(page, 'onto-s3b-typing-light.png', [bt]);
        }
    }
    const t2 = Date.now();
    if (typed) await page.keyboard.press('Enter');
    const r2 = await until(page, dune, (s) => s.slots.length === s20.slots.length + 1 && !s.inFlight, 3000);
    const landedMs = Date.now() - t2;
    const s21 = await settle(page, dune);
    await wait(page, 800);
    const samples = await page.evaluate(() => { const wv = window as any; clearInterval(wv.__s3bTimer); return wv.__s3bSamples as Array<{ orphan?: number; pages?: number; none?: boolean }>; });
    const s2 = await read(page, dune);
    const created2 = s2.keys.filter((k) => !s20.keys.includes(k));
    const deleted2 = s20.keys.filter((k) => !s2.keys.includes(k));
    const newSlots2 = s2.slots.filter((x) => !s20.slots.some((y) => y.id === x.id));
    const objs2 = await ev<Array<{ id: string; meta: string; value: unknown[] | null }>>(page, `
        const idl = w.store.getState().idlookup;
        const feat = (o, n) => { for (const vid of (o && o.features) || []) { const v = idl[vid]; if (v && idl[v.instanceof] && idl[v.instanceof].name === n) return v; } return null; };
        return a.filter((k) => idl[k] && idl[k].className === 'DObject').map((k) => { const v = feat(idl[k], 'value');
            return { id: k, meta: idl[idl[k].instanceof] ? idl[idl[k].instanceof].name : null, value: v ? [...v.values] : null }; });`, created2, 0);
    const lits = objs2.filter((o) => o.meta === 'LiteralInteger');
    const box2 = await nodeBox(page, vid);
    const pagesRow = box2?.rows.find((r) => /^pages\b/.test(r.text));
    const badSamples = samples.filter((x) => x.none || (x.orphan ?? 0) > 0 || (x.pages ?? 0) > 1);
    out.s2 = { hasCell, typed, landedMs, created: objs2, deleted: deleted2, undo: [s20.undo, s21.undo], samples: samples.length, badSamples, undoAtEdit: sDbl?.undo ?? null, rows: box2?.rows.map((r) => [r.text, r.inside]),
        node: box2 && { w: box2.w, h: box2.h } };
    check('S3b-2 type 300 into the ghost row, Enter: one Slot for pages and one LiteralInteger 300 within 3 s, no ghost left, a row "pages = 300", no orphan nor two pages rows sampled, undo +1',
        typed && r2.ok && landedMs <= 3000 && newSlots2.length === 1 && JSON.stringify(newSlots2[0]?.df) === JSON.stringify([pages.id])
        && objs2.filter((o) => o.meta === 'Slot').length === 1 && lits.length === 1 && String(lits[0].value?.[0]) === '300'
        && !!box2 && !box2.rows.some((r) => r.ghost) && !!pagesRow && pagesRow.text === 'pages = 300' && pagesRow.inside
        && samples.length >= 5 && badSamples.length === 0 && deleted2.length === 0 && !!sDbl && sDbl.keys.length === s20.keys.length && s21.undo === (sDbl.undo ?? -2) + 1,
        { typed, landedMs, slots: newSlots2, created: objs2.map((o) => [o.meta, o.value]), pagesRow: pagesRow && [pagesRow.text, pagesRow.inside],
            ghostLeft: box2?.rows.filter((r) => r.ghost).length, samples: samples.length, badSamples: badSamples.slice(0, 5), deleted: deleted2.length, undo: [s20.undo, sDbl?.undo ?? null, s21.undo] });
    if (box2) await crop(page, 'onto-s3b-pages-300-light.png', [box2]);

    // ── S3b-3: one Cmd+Z ────────────────────────────────────────────────────────────────────────────────────────────
    await page.evaluate(() => (document.querySelector('.dock-tabpane-active .editor-v2') as HTMLElement | null)?.focus());
    await page.keyboard.press('Meta+z');
    await wait(page, 700);
    const s3 = await settle(page, dune);
    let box3 = await nodeBox(page, vid); const t3 = Date.now();
    while (!box3?.rows.some((r) => r.ghost) && Date.now() - t3 < 2000) { await wait(page, 100); box3 = await nodeBox(page, vid); }
    const stillThere = created2.filter((k) => s3.keys.includes(k));
    const sameKeys = JSON.stringify([...s3.keys].sort()) === JSON.stringify([...s20.keys].sort());
    const ghost3 = box3?.rows.find((r) => r.ghost);
    out.s3 = { undo: [s20.undo, sDbl?.undo ?? null, s21.undo, s3.undo], stillThere, extra: s3.keys.filter((k) => !s20.keys.includes(k)), missing: s20.keys.filter((k) => !s3.keys.includes(k)), ghost: ghost3?.text };
    check('S3b-3 one Cmd+Z: the undo stack back to its length at the edit, the slot and the value gone, the idlookup key set equal to the one before S3b-2, the ghost row back',
        created2.length > 0 && lits.length === 1 && stillThere.length === 0 && sameKeys && !!ghost3 && ghost3.text === 'pages =' && !!sDbl && s3.undo === sDbl.undo,
        out.s3);

    // ── S3b-4: delete isbn; dune's isbn row an orphan row ───────────────────────────────────────────────────────────
    await ev(page, `w.LPointerTargetable.fromPointer(a).delete(); return 1;`, ids.isbn, 0);
    let box4 = await nodeBox(page, vid); const t4 = Date.now();
    while (!box4?.rows.some((r) => r.orphan) && Date.now() - t4 < 3000) { await wait(page, 100); box4 = await nodeBox(page, vid); }
    const orphanMs = Date.now() - t4;
    await wait(page, 400);
    const s4 = await read(page, dune);
    box4 = await nodeBox(page, vid);
    const isbnRow = box4?.rows.find((r) => r.text.includes('978-0441013593'));
    out.s4 = { orphanMs, isbnRow, rows: box4?.rows.map((r) => [r.text, r.orphan, r.title]) };
    check('S3b-4 isbn deleted: dune\'s isbn row carries .ir-row--orphan, the marker, the tooltip "Its feature is gone" and still its value; the slot still in idlookup',
        !!isbnRow && isbnRow.orphan && isbnRow.marker && isbnRow.title === 'Its feature is gone' && s4.keys.includes(ids.isbnSlot) && !s4.keys.includes(ids.isbn),
        { orphanMs, isbnRow: isbnRow && { text: isbnRow.text, orphan: isbnRow.orphan, marker: isbnRow.marker, title: isbnRow.title }, slotKept: s4.keys.includes(ids.isbnSlot) });
    if (isbnRow && box4) {
        await page.mouse.move(isbnRow.box.x + isbnRow.box.w / 2, isbnRow.box.y + isbnRow.box.h / 2);
        await wait(page, 1500);
        await crop(page, 'onto-s3b-orphan-light.png', [box4]);
    }

    // ── S3b-5: page errors ──────────────────────────────────────────────────────────────────────────────────────────
    check('S3b-5 page errors []', errors.length === 0, errors.slice(0, 5));
} catch (e) {
    fail++;
    console.log(`ABORT  ${String((e as Error)?.stack || e).slice(0, 900)}`);
} finally {
    out.pass = pass; out.fail = fail;
    writeFileSync(`${OUT}/onto-s3b-measures.json`, JSON.stringify(out, null, 2) + '\n');
    console.log(`RESULT  ${pass}/${pass + fail} pass`);
    await browser.close();
}
process.exit(fail ? 1 : 0);
