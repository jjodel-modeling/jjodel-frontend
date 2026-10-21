/**
 * Acceptance probe of S3a (P-2026-10-21-1636): missing and orphan slots as problems, «Sync slots».
 * Oracle: docs/discovery/discovery_2026-10-21_onto_s3a_slot_problems.md, «Oracle for Phase 2».
 *
 *   S3-0  baseline: no `instantiation:` id in `window._jjNodeProblems`, before and after the bindings are written;
 *   S3-1  delete Property isbn through `L(id).delete()` (R1: in the class diagram isbn is a row, not a flow node):
 *         dune's isbn slot stays in idlookup, an `instantiation:orphan:` entry on dune's object and vertex, the badge
 *         on dune's node;
 *   S3-2  Property pages added to Book (createInstance, the host's create primitive): `instantiation:missing:` on dune,
 *         its description names pages;
 *   S3-3  the overlay's «Sync slots»: one new Slot whose definingFeature is pages, no idlookup key deleted, the missing
 *         entry resolved, dune's node holds five rows (DOM boxes);
 *   S3-4  one Cmd+Z: the undo stack +1 then back, every created id gone from idlookup, the missing entry back;
 *   S3-5  the node menu «Sync slots» gives the same as S3-3;
 *   S3-6  a duplicate title slot and a LiteralString in year (createInstance): both ids in idlookup, both entries
 *         within 1 s of the landing of the write that makes them (the slot's definingFeature lands about 1 s after
 *         the call, addObject's deferred seeding; the times from the call are recorded too);
 *   S3-7  page errors [].
 * Mutation M4: drop the `run` branch of `onAction` in NodeProblemOverlay.tsx; S3-3 turns red.
 *
 * Run: lane-run probe <worktree> frontend/scripts/probe/onto-s3a-slot-problems.ts --port <n> [--id <Prompt-ID>].
 * ONTO_OUT moves the assets (crops and measures) out of docs/discovery/assets/onto-s3a/.
 */
import { chromium, type Page } from '@playwright/test';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { setTheme, SETTLE_MS } from '../smoke/states.ts';

const URL = (process.env.PROBE_URL || 'http://localhost:3088/').replace(/\/$/, '');
const OUT = (process.env.ONTO_OUT || new globalThis.URL('../../../docs/discovery/assets/onto-s3a/', import.meta.url).pathname).replace(/\/$/, '');
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });
// bpmn-lanes-fixture writes its own assets where these point at import time: keep them out of the tree.
process.env.UML_OUT = '/tmp'; process.env.GV_OUT = '/tmp';
const { ev, openPage, pickViewpoint } = await import('./bpmn-lanes-fixture.ts');

const FILE = process.env.UML_FILE || `${homedir()}/jjodel-demo-exports/uml/uml-class-object.jjodel`;
const VP_OBJECT = 'UML object diagram';
const MENU = '.context-menu-backdrop ~ .context-menu';

let pass = 0; let fail = 0;
const check = (name: string, ok: boolean, detail: unknown) => {
    if (ok) pass++; else fail++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  ${JSON.stringify(detail ?? null).slice(0, 900)}`);
};
const wait = (page: Page, ms: number) => page.waitForTimeout(ms);

type Entry = { id: string; nodeId: string; severity: string; title: string; description: string; resolved: boolean; run: boolean };
type State = { keys: string[]; undo: number | null; slots: Array<{ id: string; df: string[] | null }>; entries: Entry[]; inFlight: boolean };

/** idlookup keys, the user's undo length, dune's slots with their definingFeature, the instantiation entries. */
const READ = `
    const idl = w.store.getState().idlookup;
    const feat = (o, n) => { for (const vid of (o && o.features) || []) { const v = idl[vid]; if (v && idl[v.instanceof] && idl[v.instanceof].name === n) return v; } return null; };
    const dune = idl[a];
    const sv = feat(dune, 'slots');
    const slots = sv ? sv.values.map((sid) => { const df = idl[sid] ? feat(idl[sid], 'definingFeature') : null; return { id: sid, df: df ? [...df.values] : null }; }) : [];
    const reg = w._jjNodeProblems; const entries = [];
    if (reg) for (const p of reg.values()) if (String(p.id).startsWith('instantiation:'))
        entries.push({ id: p.id, nodeId: p.nodeId, severity: p.severity, title: p.title, description: p.description, resolved: p.resolvedAt !== undefined, run: !!(p.action && p.action.run) });
    const h = w.statehistory && w.statehistory[w.DUser.current];
    const inst = await import('/src/components/editor-v2/hooks/instantiate.ts');
    return { keys: Object.keys(idl), undo: h ? h.undoable.length : null, slots, entries, inFlight: inst.instantiationInFlight() };`;
const read = (page: Page, dune: string) => ev<State>(page, READ, dune, 0);
const active = (s: State, prefix: string, nodeId?: string) => s.entries.filter((e) => e.id.startsWith(prefix) && !e.resolved && (!nodeId || e.nodeId === nodeId));

/** Poll the page state until `ok` holds or `ms` runs out; the elapsed time comes back with it. */
async function until(page: Page, dune: string, ok: (s: State) => boolean, ms: number) {
    const t0 = Date.now(); let s = await read(page, dune);
    while (!ok(s) && Date.now() - t0 < ms) { await wait(page, 50); s = await read(page, dune); }
    return { s, ok: ok(s), ms: Date.now() - t0 };
}
/** No instantiation in flight and the undo length still for 800 ms (the S2 probe's settle, on this READ). */
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
/** dune's node: its box and its `.ir-row` boxes, each inside the node or not. */
const nodeBox = (page: Page, vid: string) => page.evaluate((sel) => {
    const el = document.querySelector(sel) as HTMLElement | null; if (!el) return null;
    const n = el.getBoundingClientRect();
    const rows = Array.from(el.querySelectorAll('.ir-row')).map((x) => { const r = x.getBoundingClientRect();
        return { text: (x as HTMLElement).innerText.replace(/\s+/g, ' ').trim().slice(0, 40), top: Math.round(r.top - n.top), h: Math.round(r.height),
            inside: r.left >= n.left - 1 && r.right <= n.right + 1 && r.top >= n.top - 1 && r.bottom <= n.bottom + 1 }; });
    return { x: n.x, y: n.y, w: n.width, h: n.height, rows, dot: el.querySelectorAll('.node-problem-dot').length };
}, nodeSel(vid));

/**
 * Drag the pane (from an empty point) until dune's node sits in the middle of the canvas's visible part; at most four
 * drags. Visible is measured by `elementFromPoint`: the dock's panels cover the right of `.react-flow`.
 */
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
            const box = { x0, x1, y0, y1 };
            const inside = n.left >= x0 + 20 && n.right <= x1 - 20 && n.top >= y0 + 20 && n.bottom <= y1 - 20;
            const dx = (x0 + x1) / 2 - (n.left + n.width / 2); const dy = (y0 + y1) / 2 - (n.top + n.height / 2);
            let from = null;
            // Scan from the side the drag starts on, so one drag can cover the whole visible box.
            const xs: number[] = []; for (let v = x0 + 20; v < x1 - 20; v += 30) xs.push(v); if (dx < 0) xs.reverse();
            const ys: number[] = []; for (let v = y0 + 20; v < y1 - 20; v += 30) ys.push(v); if (dy < 0) ys.reverse();
            for (const gy of ys) for (const gx of xs) {
                if (from) break;
                const ex = Math.max(x0 + 10, Math.min(x1 - 10, gx + dx)); const ey = Math.max(y0 + 10, Math.min(y1 - 10, gy + dy));
                const hit = document.elementFromPoint(gx, gy);
                if (hit && hit.classList.contains('react-flow__pane') && Math.hypot(ex - gx, ey - gy) >= 0.9 * Math.min(Math.hypot(dx, dy), 300)) from = { x: gx, y: gy, ex, ey };
            }
            return { inside, box, from, dx, dy };
        }, nodeSel(vid));
        console.log(`MEAS  bringIntoView ${i}  ${JSON.stringify(g)}`);
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
    console.log(`MEAS  crop ${file}  ${JSON.stringify({ rects, clip: [x0, y0, x1, y1] })}`);
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

    // The ids: model, metamodel, Book and its isbn and title, dune with its year slot, Integer, dune's vertex.
    const ids = await ev<Record<string, any>>(page, `
        const idl = w.store.getState().idlookup;
        const m = w.LProject.getProject().models.find((x) => !x.isMetamodel);
        const objs = Object.values(idl).filter((r) => r && r.className === 'DObject');
        const meta = (o) => idl[o.instanceof] && idl[o.instanceof].name;
        const feat = (o, n) => { for (const vid of o.features || []) { const v = idl[vid]; if (v && idl[v.instanceof] && idl[v.instanceof].name === n) return v; } return null; };
        const book = objs.find((o) => o.name === 'Book' && meta(o) === 'Class');
        const attrs = book ? (feat(book, 'ownedAttributes') || { values: [] }).values : [];
        const attr = (n) => attrs.find((x) => idl[x] && idl[x].name === n) || null;
        const dune = objs.find((o) => o.name === 'dune');
        const slots = dune ? (feat(dune, 'slots') || { values: [] }).values : [];
        const slotOf = (f) => slots.find((s) => idl[s] && (feat(idl[s], 'definingFeature') || { values: [] }).values.includes(f)) || null;
        // title and year are Publication's (inherited by Book): read them off dune's slots.
        const dfNamed = (n) => { for (const s of slots) for (const f of (idl[s] && feat(idl[s], 'definingFeature') || { values: [] }).values) if (idl[f] && idl[f].name === n) return f; return null; };
        const integer = objs.find((o) => o.name === 'Integer' && meta(o) === 'PrimitiveType');
        const vertices = dune ? Object.values(idl).filter((r) => r && r.model === dune.id).map((r) => r.id) : [];
        return { model: m.id, mm: idl[m.id].instanceof, book: book && book.id, isbn: attr('isbn'), title: dfNamed('title'), year: dfNamed('year'),
            dune: dune && dune.id, isbnSlot: slotOf(attr('isbn')), yearSlot: slotOf(dfNamed('year')), integer: integer && integer.id, vertices };`, undefined, 0);
    out.ids = ids;
    const vid = await page.evaluate((vs: string[]) => vs.find((v) => document.querySelector(`.dock-tabpane-active .react-flow__node[data-id="${v}"]`)) ?? null, ids.vertices as string[]);
    out.vertex = vid;
    if (vid) { await bringIntoView(page, vid); out.inView = await nodeBox(page, vid); }
    if (!ids.dune || !ids.book || !ids.isbn || !ids.isbnSlot || !ids.yearSlot || !ids.integer || !vid) throw new Error('fixture ids missing: ' + JSON.stringify({ ...ids, vid }));
    const dune = ids.dune as string;

    // ── S3-0: baseline, then the bindings through mm.state (the S2 probe's binding, verbatim) ─────────────────────────
    const s00 = await read(page, dune);
    const written = await ev<{ ok: boolean; missing: string[]; raw: string | null }>(page, `
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
        if (missing.length) return { ok: false, missing, raw: null };
        w.LPointerTargetable.fromPointer(mm).state = { ontoBindings: JSON.stringify({ v: 1, bindings: [object, link] }) };
        await new Promise((r) => setTimeout(r, 600));
        const s = w.store.getState().idlookup[mm]._state;
        return { ok: !!(s && s.ontoBindings), missing, raw: s ? s.ontoBindings ?? null : null };`, ids.mm, 400);
    if (!written.ok) throw new Error('the bindings did not land: ' + JSON.stringify(written.missing));
    await wait(page, 1200);
    const s01 = await settle(page, dune);
    check('S3-0 baseline: no instantiation: entry before the bindings, none after them (the library is clean)',
        s00.entries.length === 0 && s01.entries.length === 0, { before: s00.entries.map((e) => e.id), after: s01.entries.map((e) => e.id) });

    // ── S3-1: delete isbn through the L-layer (R1) ──────────────────────────────────────────────────────────────────
    await ev(page, `w.LPointerTargetable.fromPointer(a).delete(); return 1;`, ids.isbn, 0);
    const r1 = await until(page, dune, (s) => active(s, `instantiation:orphan:${ids.isbnSlot}@`, dune).length === 1
        && active(s, `instantiation:orphan:${ids.isbnSlot}@`, vid).length === 1, 3000);
    await wait(page, 400);
    const box1 = await nodeBox(page, vid);
    const isbnGone = !r1.s.keys.includes(ids.isbn);
    const slotKept = r1.s.keys.includes(ids.isbnSlot) && r1.s.slots.some((x) => x.id === ids.isbnSlot);
    check('S3-1 isbn deleted: dune\'s isbn slot stays in idlookup and in dune\'s slots, an orphan entry on dune\'s object and vertex, the badge on its node',
        isbnGone && slotKept && r1.ok && !!box1 && box1.dot === 1,
        { isbnGone, slotKept, ms: r1.ms, orphan: active(r1.s, 'instantiation:orphan:').filter((e) => e.nodeId === dune || e.nodeId === vid).map((e) => [e.id, e.severity, e.title, e.description]), dot: box1 && box1.dot });

    // ── S3-2: Property pages : Integer = 320 on Book ─────────────────────────────────────────────────────────────────
    const pages = await ev<{ ok: boolean; id: string | null; reason?: string }>(page, `
        const ca = await import('/src/components/editor-v2/hooks/createAdapter.ts');
        return ca.createInstance(a.model, 'Property', a.book, 'ownedAttributes', { name: 'pages', type: a.integer, defaultValue: '320' });`,
        { model: ids.model, book: ids.book, integer: ids.integer }, 0);
    const missingPrefix = `instantiation:missing:${dune}@`;
    const r2 = await until(page, dune, (s) => active(s, missingPrefix, vid).some((e) => /pages/.test(e.description)), 3000);
    await wait(page, 500);
    const box2 = await nodeBox(page, vid);
    check('S3-2 pages added to Book: an instantiation:missing: entry on dune whose description names pages, with the Sync slots action',
        pages.ok && r2.ok && active(r2.s, missingPrefix, vid).every((e) => e.run && e.severity === 'warning'),
        { pages, ms: r2.ms, missing: active(r2.s, missingPrefix).map((e) => [e.id, e.severity, e.title, e.description, e.run]) });
    if (box2) await crop(page, 'onto-s3a-badge-light.png', [box2]);

    // ── S3-3: the overlay's «Sync slots» ─────────────────────────────────────────────────────────────────────────────
    const s30 = await settle(page, dune);
    const dot = page.locator(`${nodeSel(vid)} .node-problem-dot`).first();
    await dot.click();
    await wait(page, 600);
    const overlay = page.locator('.node-problem-overlay').first();
    const overlayTexts = (await page.locator('.node-problem-overlay .node-problem-overlay__problem').allInnerTexts().catch(() => [])).map((t) => t.replace(/\s+/g, ' ').trim());
    const action = page.locator('.node-problem-overlay .node-problem-overlay__action', { hasText: 'Sync slots' }).first();
    const hasAction = (await action.count()) === 1;
    const ob = await overlay.boundingBox().catch(() => null);
    if (ob && box2) await crop(page, 'onto-s3a-overlay-sync-light.png', [{ x: ob.x, y: ob.y, w: ob.width, h: ob.height }, box2]);
    const t3 = Date.now();
    if (hasAction) await action.click();
    const r3 = await until(page, dune, (s) => s.slots.length === s30.slots.length + 1 && !s.inFlight, 6000);
    const landedMs = Date.now() - t3;
    const s31 = await settle(page, dune);
    await wait(page, 800);
    const s3 = await read(page, dune);
    const created3 = s3.keys.filter((k) => !s30.keys.includes(k));
    const deleted3 = s30.keys.filter((k) => !s3.keys.includes(k));
    const newSlots3 = s3.slots.filter((x) => !s30.slots.some((y) => y.id === x.id));
    const box3 = await nodeBox(page, vid);
    const overlayClosed = (await page.locator('.node-problem-overlay').count()) === 0;
    check('S3-3 the overlay\'s Sync slots: one new Slot whose definingFeature is pages, no idlookup key deleted, the missing entry resolved, five rows inside dune\'s node',
        hasAction && r3.ok && newSlots3.length === 1 && JSON.stringify(newSlots3[0]?.df) === JSON.stringify([pages.id]) && deleted3.length === 0
        && active(s3, missingPrefix).length === 0 && !!box3 && box3.rows.length === 5 && box3.rows.every((r) => r.inside),
        { hasAction, overlayTexts, landedMs, newSlots: newSlots3, created: created3.length, deleted: deleted3, missingActive: active(s3, missingPrefix).map((e) => e.id),
            overlayClosed, rows: box3 && box3.rows.map((r) => [r.text, r.inside]), node: box3 && { w: box3.w, h: box3.h } });
    if (box3) await crop(page, 'onto-s3a-five-rows-light.png', [box3]);
    out.s33 = { landedMs, created: created3, undo: { before: s30.undo, after: s31.undo }, rows: box3 && box3.rows };

    // ── S3-4: one Cmd+Z ─────────────────────────────────────────────────────────────────────────────────────────────
    await page.evaluate(() => (document.querySelector('.dock-tabpane-active .editor-v2') as HTMLElement | null)?.focus());
    await page.keyboard.press('Meta+z');
    await wait(page, 700);
    const s4 = await settle(page, dune);
    const r4 = await until(page, dune, (s) => active(s, missingPrefix, vid).length === 1, 2000);
    const back4 = created3.filter((k) => r4.s.keys.includes(k));
    check('S3-4 one Cmd+Z: the undo stack +1 then back, every created id gone from idlookup, the missing entry back',
        s31.undo === (s30.undo ?? -2) + 1 && s4.undo === s30.undo && created3.length > 0 && back4.length === 0 && r4.ok,
        { undo: [s30.undo, s31.undo, s4.undo], created: created3.length, stillThere: back4, missingBackMs: r4.ms });

    // ── S3-5: the node menu «Sync slots» ────────────────────────────────────────────────────────────────────────────
    const s50 = await settle(page, dune);
    const b5 = await nodeBox(page, vid);
    let menuItems: string[] = []; let clicked = false;
    if (b5) {
        // The header body: below the top handle (at the top centre), above the first row (+57).
        await page.mouse.click(b5.x + b5.w / 2, b5.y + 32, { button: 'right' });
        await wait(page, 600);
        menuItems = (await page.locator(`${MENU} .context-menu__item`).allInnerTexts().catch(() => [])).map((t) => t.trim());
        out.s35menu = await page.evaluate(([x, y]) => { const hit = document.elementFromPoint(x, y); const chain: string[] = [];
            for (let e = hit as Element | null, i = 0; e && i < 8; e = e.parentElement, i++) chain.push(e.tagName.toLowerCase() + '.' + String(e.className).split(' ').slice(0, 3).join('.'));
            return { chain, menus: document.querySelectorAll('.context-menu').length, items: Array.from(document.querySelectorAll('.context-menu__item')).map((n) => (n as HTMLElement).innerText.trim()).slice(0, 20) }; },
            [b5.x + b5.w / 2, b5.y + 32]);
        console.log(`MEAS  s35menu  ${JSON.stringify(out.s35menu).slice(0, 1200)}`);
        const item = page.locator(`${MENU} .context-menu__item`, { hasText: 'Sync slots' }).first();
        if (await item.count()) { await item.click(); clicked = true; }
        else await page.keyboard.press('Escape');
    }
    const r5 = await until(page, dune, (s) => s.slots.length === s50.slots.length + 1 && !s.inFlight, 6000);
    const s51 = await settle(page, dune);
    await wait(page, 800);
    const s5 = await read(page, dune);
    const deleted5 = s50.keys.filter((k) => !s5.keys.includes(k));
    const newSlots5 = s5.slots.filter((x) => !s50.slots.some((y) => y.id === x.id));
    const box5 = await nodeBox(page, vid);
    check('S3-5 the node menu Sync slots: the same as S3-3 (one Slot for pages, nothing deleted, missing resolved, five rows, one undo entry)',
        clicked && r5.ok && newSlots5.length === 1 && JSON.stringify(newSlots5[0]?.df) === JSON.stringify([pages.id]) && deleted5.length === 0
        && active(s5, missingPrefix).length === 0 && !!box5 && box5.rows.length === 5 && box5.rows.every((r) => r.inside) && s51.undo === (s50.undo ?? -2) + 1,
        { menuItems, clicked, ms: r5.ms, newSlots: newSlots5, deleted: deleted5, undo: [s50.undo, s51.undo], rows: box5 && box5.rows.map((r) => [r.text, r.inside]) });

    // ── S3-6: a duplicate title slot and a LiteralString in year ────────────────────────────────────────────────────
    // Timed inside the page (25 ms polls, no round trip): the writes, the slot's definingFeature landing, each entry.
    const w6 = await ev<{ slot: { ok: boolean; id: string | null }; value: { ok: boolean; id: string | null }; t: Record<string, number | null>; dup: string[]; vt: string[] }>(page, `
        const ca = await import('/src/components/editor-v2/hooks/createAdapter.ts');
        const t0 = performance.now();
        const slot = ca.createInstance(a.model, 'Slot', a.dune, 'slots', { definingFeature: a.title });
        const value = ca.createInstance(a.model, 'LiteralString', a.yearSlot, 'values', { value: 'MCMLXV' });
        const t = { writes: performance.now() - t0, df: null, valueType: null, duplicate: null };
        const on = (prefix) => [...w._jjNodeProblems.values()].filter((p) => String(p.id).startsWith(prefix) && p.resolvedAt === undefined).map((p) => p.id);
        const dfOf = (sid) => { const idl = w.store.getState().idlookup; const s = idl[sid]; if (!s) return null;
            for (const vid of s.features || []) { const v = idl[vid]; if (v && idl[v.instanceof] && idl[v.instanceof].name === 'definingFeature') return v.values; } return null; };
        while (performance.now() - t0 < 4000 && (t.df === null || t.valueType === null || t.duplicate === null)) {
            const ms = Math.round(performance.now() - t0);
            if (t.df === null && slot.id && (dfOf(slot.id) || []).includes(a.title)) t.df = ms;
            if (t.valueType === null && value.id && on('instantiation:value-type:' + value.id + '@').length) t.valueType = ms;
            if (t.duplicate === null && on('instantiation:duplicate:' + a.dune + ':' + a.title + '@').length) t.duplicate = ms;
            await new Promise((r) => setTimeout(r, 25));
        }
        return { slot, value, t, dup: on('instantiation:duplicate:'), vt: value.id ? on('instantiation:value-type:' + value.id + '@') : [] };`,
        { model: ids.model, dune, title: ids.title, yearSlot: ids.yearSlot }, 0);
    const s6 = await read(page, dune);
    // «Within 1 s» counts from the landing of the write that makes the finding: the LiteralString is one at the call;
    // the duplicate is one when the host's deferred seeding lands the slot's definingFeature (t.df, about 1 s after the
    // call, addObject's single deferral). From the call, the duplicate entry comes at t.duplicate (recorded).
    check('S3-6 a duplicate title slot and a LiteralString in year: both writes land and both entries appear within 1 s of their landing',
        w6.slot.ok && w6.value.ok && s6.keys.includes(w6.slot.id!) && s6.keys.includes(w6.value.id!) && w6.t.df !== null
        && w6.t.duplicate !== null && w6.t.duplicate - w6.t.df <= 1000 && w6.t.valueType !== null && w6.t.valueType <= 1000,
        { slot: w6.slot, value: w6.value, t: w6.t, duplicate: w6.dup, valueType: w6.vt });

    // ── S3-7: page errors ───────────────────────────────────────────────────────────────────────────────────────────
    check('S3-7 page errors []', errors.length === 0, errors.slice(0, 5));
} catch (e) {
    fail++;
    console.log(`ABORT  ${String((e as Error)?.stack || e).slice(0, 900)}`);
} finally {
    out.pass = pass; out.fail = fail;
    writeFileSync(`${OUT}/onto-s3a-measures.json`, JSON.stringify(out, null, 2) + '\n');
    console.log(`RESULT  ${pass}/${pass + fail} pass`);
    await browser.close();
}
process.exit(fail ? 1 : 0);
