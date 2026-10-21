/**
 * onto-s2-instantiate (P-2026-10-21-0100, continuation of P-2026-10-21-0040): acceptance of S2 of the ontological
 * instantiation front, the creation menu and the slot synthesis (`components/editor-v2/hooks/instantiate.ts`).
 *
 * Scene: the UML library project of uml-class-object-fixture (P-2026-10-20-2330), imported from its export
 * `uml-class-object.jjodel`, the object diagram viewpoint, light theme. The fixture does not declare the bindings: this
 * probe writes the records `object` and `link` (R-OI-6, R-OI-8) into the metamodel bag through `mm.state`, the M2 ids
 * resolved by name.
 *
 * Checks:
 *   S2-0  before the binding, a right click on the pane opens no menu (the canvas behaves as before);
 *   S2-1  with the binding, the cascade «New instance of ▸» lists exactly Book, Library, Magazine, Member;
 *   S2-2  «Book» makes one InstanceSpecification classified by Book, four slots whose defining features are isbn,
 *         genre, title, year (the S1 closure, own first), no value object, one vertex (useJjomSync Step 2bis: a
 *         vertex placed at the click broke the undo of the instantiation, measured in this lane);
 *   S2-3  undo: the entries one instantiation pushes and the Cmd+Z presses that bring the objects back;
 *   S2-4  «Member» gives the slot `active` a LiteralBoolean `true` (Property.defaultValue);
 *   S2-5  «New instance» on the Book class node gives the same structure; the abstract Publication offers no entry;
 *   S2-6  the new instances pass the fixture's object rules O1, O2, O3, O5 (`runRules`; O4 reports the empty slots);
 *   S2-7  page errors [] and no `[EditorV2] instantiate:` warning.
 *
 * Run:  node frontend/scripts/lane-run.mjs probe ~/jjodel-w-oi-s2 frontend/scripts/probe/onto-s2-instantiate.ts \
 *         --port 3087 --id P-2026-10-21-0100
 * Env:  ONTO_OUT   output directory (default docs/discovery/assets/onto-s2)
 *       UML_FILE   the exported project (default ~/jjodel-demo-exports/uml/uml-class-object.jjodel)
 */
import { chromium, type Page } from '@playwright/test';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { setTheme, SETTLE_MS } from '../smoke/states.ts';

const URL = (process.env.PROBE_URL || 'http://localhost:3087/').replace(/\/$/, '');
if (/:300[01]$/.test(URL)) throw new Error('never 3000 or 3001');
const OUT = (process.env.ONTO_OUT || new globalThis.URL('../../../docs/discovery/assets/onto-s2/', import.meta.url).pathname).replace(/\/$/, '');
mkdirSync(OUT, { recursive: true });
// The fixtures write their screenshots into UML_OUT / GV_OUT, read at load: set before they are loaded.
process.env.UML_OUT = OUT;
process.env.GV_OUT = OUT;
const { runRules } = await import('./uml-class-object-fixture.ts');
const { ev, meas, openPage, pickViewpoint, readNodes } = await import('./bpmn-lanes-fixture.ts');
type Snap = Parameters<typeof runRules>[0];

const FILE = process.env.UML_FILE || `${homedir()}/jjodel-demo-exports/uml/uml-class-object.jjodel`;
const VP_CLASS = 'UML class diagram';
const VP_OBJECT = 'UML object diagram';
const BOOK_CLOSURE = ['isbn', 'genre', 'title', 'year'];

let pass = 0; let fail = 0;
const check = (name: string, ok: boolean, detail: unknown) => {
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  ${JSON.stringify(detail).slice(0, 1500)}`);
    if (ok) pass++; else fail++;
};
const wait = (page: Page, ms: number) => page.waitForTimeout(ms);

/** The model's objects, roots and contained, with metaclass, name, and every feature's values (ids as they are). */
const CENSUS = `
    const idl = w.store.getState().idlookup; const out = []; const seen = new Set(); const q = [...(idl[a].objects || [])];
    while (q.length) { const id = q.shift(); const o = idl[id]; if (seen.has(id) || !o || o.className !== 'DObject') continue;
        seen.add(id); const f = {};
        for (const vid of o.features || []) { const v = idl[vid]; const fd = v && idl[v.instanceof]; if (!fd) continue;
            f[fd.name] = (v.values || []).filter((x) => x !== undefined);
            for (const c of f[fd.name]) if (typeof c === 'string' && idl[c] && idl[c].father === vid) q.push(c); }
        out.push({ id, cls: idl[o.instanceof] && idl[o.instanceof].name, name: o.name, father: o.father, f }); }
    const undo = w.statehistory && w.statehistory[w.DUser.current] ? w.statehistory[w.DUser.current].undoable.length : null;
    return { objects: out, undo };`;
interface Obj { id: string; cls: string; name: string; father: string; f: Record<string, unknown[]> }
const census = (page: Page, modelId: string) => ev<{ objects: Obj[]; undo: number | null }>(page, CENSUS, modelId, 0);

/** An instance and its slots as names: classifier, then per slot (list order) its defining feature and values. */
function shapeOf(objs: Obj[], instanceId: string) {
    const by = new Map(objs.map((o) => [o.id, o]));
    const inst = by.get(instanceId);
    if (!inst) return null;
    const nameOf = (v: unknown) => (typeof v === 'string' && by.get(v)?.name) || v;
    const slots = (inst.f.slots ?? []).map((sid) => {
        const s = by.get(sid as string);
        const vals = (s?.f.values ?? []).map((vid) => { const v = by.get(vid as string); return v ? { cls: v.cls, value: v.f.value?.[0], instance: nameOf(v.f.instance?.[0]) } : vid; });
        return { cls: s?.cls, feature: nameOf(s?.f.definingFeature?.[0]), values: vals, contained: s?.father === `${instanceId}` ? 'father=instance' : s?.father ? 'father=dvalue' : null };
    });
    return { id: inst.id, cls: inst.cls, name: inst.name, classifier: nameOf(inst.f.classifier?.[0]), slots };
}

/** The vertices drawing `objectId`, with their position. */
const verticesOf = (page: Page, objectId: string) => ev<Array<{ id: string; cls: string; x: number; y: number; father: string }>>(page, `
    const idl = w.store.getState().idlookup;
    return Object.values(idl).filter((r) => r && r.model === a && /Vertex/.test(r.className || ''))
        .map((r) => ({ id: r.id, cls: r.className, x: r.x, y: r.y, father: r.father }));`, objectId, 0);

/** A point of the active canvas whose topmost element is the pane itself, not a node or an edge. */
async function emptyPanePoint(page: Page, prefer: 'left' | 'right' = 'left') {
    return page.evaluate((side) => {
        const pane = document.querySelector('.dock-tabpane-active .react-flow__pane') as HTMLElement | null;
        if (!pane) return null;
        const r = pane.getBoundingClientRect();
        const xs = side === 'left' ? [0.08, 0.15, 0.25, 0.35, 0.5] : [0.92, 0.85, 0.75, 0.65, 0.5];
        for (const fy of [0.9, 0.8, 0.7, 0.55, 0.4]) for (const fx of xs) {
            const x = Math.round(r.left + r.width * fx); const y = Math.round(r.top + r.height * fy);
            const el = document.elementFromPoint(x, y);
            if (el && el.classList.contains('react-flow__pane')) return { x, y };
        }
        return null;
    }, prefer);
}

/** The editor-v2 menu's panels: the app has other `.context-menu` elements; this one follows its backdrop. */
const MENU = '.context-menu-backdrop ~ .context-menu';
/** The undo history as the reducer sees it: the interaction flag, both stacks, the last entry's age. */
const history = (page: Page) => ev<Record<string, unknown>>(page, `
    const h = w.statehistory || {}; const u = h[w.DUser.current]; const last = u && u.undoable[u.undoable.length - 1];
    return { flag: w.U ? w.U.userHasInteracted : null, user: u ? u.undoable.length : null, all: h.all ? h.all.undoable.length : null,
        senders: Object.keys(h), lastAgeMs: last && last.timestamp ? Date.now() - last.timestamp : null };`, undefined, 0);
const menuCount = (page: Page) => page.locator(MENU).count();
const closeMenu = async (page: Page) => {
    await page.keyboard.press('Escape');
    await page.evaluate(() => (document.querySelector('.context-menu-backdrop') as HTMLElement | null)?.click());
    await wait(page, 300);
};

/** Right click the pane, open the cascade, return its labels and the item locators. */
async function openCascade(page: Page, at: { x: number; y: number }) {
    await page.mouse.click(at.x, at.y);            // a pointerdown first: arms U.userHasInteracted
    await wait(page, 200);
    await page.mouse.click(at.x, at.y, { button: 'right' });
    await wait(page, 500);
    const root = page.locator(MENU).first();
    const parent = root.locator('.context-menu__item--cascade').first();
    const parentLabel = (await parent.count()) ? (await parent.innerText()).trim() : null;
    if (await parent.count()) { await parent.hover(); await wait(page, 400); }
    const panels = await menuCount(page);
    const child = page.locator(MENU).nth(1);
    const labels = panels > 1 ? (await child.locator('.context-menu__item').allInnerTexts()).map((t) => t.trim()) : [];
    return { panels, parentLabel, labels, child };
}

/** Wait until the model holds a new instance of `classifier` with `slots` slots (or the limit passes). */
async function waitInstance(page: Page, modelId: string, before: Set<string>, classifierId: string, slots: number) {
    for (let i = 0; i < 40; i++) {
        const c = await census(page, modelId);
        const inst = c.objects.find((o) => !before.has(o.id) && o.cls === 'InstanceSpecification' && o.f.classifier?.[0] === classifierId);
        if (inst && (inst.f.slots ?? []).length >= slots) { await wait(page, 1500); return { inst, c: await census(page, modelId) }; }
        await wait(page, 300);
    }
    const c = await census(page, modelId);
    return { inst: c.objects.find((o) => !before.has(o.id) && o.cls === 'InstanceSpecification' && o.f.classifier?.[0] === classifierId) ?? null, c };
}

const browser = await chromium.launch();
const out: Record<string, unknown> = { url: URL, at: new Date().toISOString(), file: FILE };
try {
    const { page, errors } = await openPage(browser);
    const warnings: string[] = [];
    page.on('console', (m) => { if (/\[EditorV2\] instantiate:/.test(m.text())) warnings.push(m.text()); });
    if (!existsSync(FILE)) throw new Error(`no exported project at ${FILE}`);

    // ── Scene: Import Project of the fixture's export, the object diagram, light ───────────────────────────────────
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

    const ids = await ev<{ model: string; mm: string; classes: Record<string, string> }>(page, `
        const idl = w.store.getState().idlookup;
        const m = w.LProject.getProject().models.find((x) => !x.isMetamodel);
        const classes = {};
        const q = [...(idl[m.id].objects || [])];
        for (const id of q) { const o = idl[id]; if (o && ['Class', 'Enumeration', 'PrimitiveType', 'Association'].includes(idl[o.instanceof] && idl[o.instanceof].name)) classes[o.name] = id; }
        return { model: m.id, mm: idl[m.id].instanceof, classes };`, undefined, 0);
    out.ids = ids;

    // ── S2-0: no binding, no menu ──────────────────────────────────────────────────────────────────────────────────
    const bag0 = await ev<unknown>(page, `const s = w.store.getState().idlookup[a]._state; return s ? s.ontoBindings ?? null : null;`, ids.mm, 0);
    const p0 = await emptyPanePoint(page);
    if (!p0) throw new Error('no empty pane point');
    await page.mouse.click(p0.x, p0.y);
    await page.mouse.click(p0.x, p0.y, { button: 'right' });
    await wait(page, 600);
    const menus0 = await menuCount(page);
    check('S2-0 a metamodel without ontoBindings: a right click on the pane opens no menu', bag0 === null && menus0 === 0, { bag0, menus0, at: p0 });
    if (menus0) await closeMenu(page);

    // ── The binding, through mm.state ──────────────────────────────────────────────────────────────────────────────
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
    out.binding = written;
    out.historyAfterBinding = await history(page);
    check('S2-B the records object and link are written into the metamodel bag through mm.state', written.ok, { missing: written.missing, bytes: written.raw?.length ?? 0 });

    // ── S2-1: the cascade ─────────────────────────────────────────────────────────────────────────────────────────
    const p1 = (await emptyPanePoint(page, 'left'))!;
    const c1 = await openCascade(page, p1);
    out.cascade = { at: p1, panels: c1.panels, parent: c1.parentLabel, labels: c1.labels };
    check('S2-1 the pane menu cascades «New instance of ▸» to exactly Book, Library, Magazine, Member',
        c1.parentLabel === 'New instance of' && JSON.stringify(c1.labels) === JSON.stringify(['Book', 'Library', 'Magazine', 'Member']), out.cascade);
    // The unclamped bottom is where the panel would end opened at its parent's top: it says whether the clamp was exercised.
    const fit = await page.evaluate((sel) => {
        const panels = document.querySelectorAll(sel);
        const parent = panels[0]?.querySelector('.context-menu__item--cascade')?.getBoundingClientRect();
        const panel = panels[1]?.getBoundingClientRect();
        const items = panels[1]?.querySelectorAll('.context-menu__item');
        const last = items?.[items.length - 1]?.getBoundingClientRect();
        if (!parent || !panel || !last) return null;
        return { vh: window.innerHeight, lastTop: last.top, lastBottom: last.bottom, panelTop: panel.top,
            unclampedBottom: parent.top - 6 + panel.height };
    }, MENU);
    out.cascadeFit = fit;
    check('S2-1v the last item of the cascade lies inside the viewport', !!fit && fit.lastTop >= 0 && fit.lastBottom <= fit.vh, fit);
    await page.screenshot({ path: `${OUT}/onto-s2-cascade-light.png` });
    meas('screenshot', `${OUT}/onto-s2-cascade-light.png`);

    // ── S2-2: «Book» ──────────────────────────────────────────────────────────────────────────────────────────────
    const flow1 = await page.evaluate(({ x, y }) => {
        const vp = document.querySelector('.dock-tabpane-active .react-flow__viewport') as HTMLElement | null;
        const pane = document.querySelector('.dock-tabpane-active .react-flow') as HTMLElement | null;
        const m = vp?.style.transform.match(/translate\((-?[\d.]+)px,\s*(-?[\d.]+)px\)\s*scale\(([\d.]+)\)/);
        if (!m || !pane) return null;
        const r = pane.getBoundingClientRect();
        return { x: (x - r.left - +m[1]) / +m[3], y: (y - r.top - +m[2]) / +m[3] };
    }, p1);
    const before = await census(page, ids.model);
    const beforeIds = new Set(before.objects.map((o) => o.id));
    const h0 = await history(page);
    await c1.child.locator('.context-menu__item', { hasText: 'Book' }).first().click();
    const b = await waitInstance(page, ids.model, beforeIds, ids.classes.Book, 4);
    const added = b.c.objects.filter((o) => !beforeIds.has(o.id));
    const bookShape = b.inst ? shapeOf(b.c.objects, b.inst.id) : null;
    const bookVerts = b.inst ? await verticesOf(page, b.inst.id) : [];
    out.book = { shape: bookShape, added: added.map((o) => `${o.cls}:${o.name}`), vertices: bookVerts, clickFlow: flow1, undo: { before: before.undo, after: b.c.undo } };
    check('S2-2 «Book»: one InstanceSpecification classified by Book, slots isbn, genre, title, year in this order, no value',
        !!bookShape && bookShape.classifier === 'Book' && JSON.stringify(bookShape.slots.map((s) => s.feature)) === JSON.stringify(BOOK_CLOSURE)
        && bookShape.slots.every((s) => s.cls === 'Slot' && s.values.length === 0)
        && added.filter((o) => o.cls === 'InstanceSpecification').length === 1 && added.length === 5, out.book);
    check('S2-2v one vertex for the new instance (position measured: Step 2bis, not the click point)', bookVerts.length === 1, { bookVerts, flow1 });

    // ── S2-3: undo of one instantiation ────────────────────────────────────────────────────────────────────────────
    const entries = (b.c.undo ?? 0) - (before.undo ?? 0);
    const free = async () => (await emptyPanePoint(page, 'left')) ?? p1;
    const h1 = await history(page);
    { const q = await free(); await page.mouse.click(q.x, q.y); }
    await page.evaluate(() => (document.querySelector('.editor-v2') as HTMLElement | null)?.focus());
    const bag = () => ev<boolean>(page, `const s = w.store.getState().idlookup[a]._state; return !!(s && s.ontoBindings);`, ids.mm, 0);
    let presses = 0; let back = false; let now = b.c; let bagAfterUndo = true;
    const steps: unknown[] = [];
    for (; presses < 20 && !back && bagAfterUndo;) {
        await page.keyboard.press('Meta+z'); presses++;
        await wait(page, 700);
        now = await census(page, ids.model);
        bagAfterUndo = await bag();
        back = now.objects.length === before.objects.length && now.objects.every((o) => beforeIds.has(o.id));
        steps.push({ undo: now.undo, objects: now.objects.length, instance: !!b.inst && now.objects.some((o) => o.id === b.inst!.id), binding: bagAfterUndo });
    }
    out.undo = { entries, presses, back, undoBefore: before.undo, undoAfterCreate: b.c.undo, undoAfterPresses: now.undo, bindingKept: bagAfterUndo, h0, h1, steps };
    check('S2-3 one instantiation is N undo entries (declared, S2u makes it one); Cmd+Z presses bring the objects back, the binding kept',
        back && bagAfterUndo === true, out.undo);
    if (!bagAfterUndo) {
        // The undo took the binding: write it again, so the rest of the acceptance runs (measured above, not hidden).
        await ev(page, `w.LPointerTargetable.fromPointer(a.mm).state = { ontoBindings: a.raw }; return 1;`, { mm: ids.mm, raw: written.raw }, 600);
        out.bindingRewritten = await bag();
    }

    // ── S2-2 again (the screenshot's) and S2-4: «Member» ──────────────────────────────────────────────────────────
    const c2 = await openCascade(page, await free());
    const before2 = await census(page, ids.model);
    const before2Ids = new Set(before2.objects.map((o) => o.id));
    await c2.child.locator('.context-menu__item', { hasText: 'Book' }).first().click();
    const b2 = await waitInstance(page, ids.model, before2Ids, ids.classes.Book, 4);
    const p2 = (await emptyPanePoint(page, 'right')) ?? p1;
    const c3 = await openCascade(page, p2);
    await c3.child.locator('.context-menu__item', { hasText: 'Member' }).first().click();
    const m = await waitInstance(page, ids.model, before2Ids, ids.classes.Member, 2);
    const memberShape = m.inst ? shapeOf(m.c.objects, m.inst.id) : null;
    const active = memberShape?.slots.find((s) => s.feature === 'active');
    out.member = { shape: memberShape };
    check('S2-4 «Member»: the slot active holds one LiteralBoolean true from defaultValue, the slot name none',
        !!memberShape && JSON.stringify(memberShape.slots.map((s) => s.feature)) === JSON.stringify(['name', 'active'])
        && active?.values.length === 1 && JSON.stringify(active.values[0]) === JSON.stringify({ cls: 'LiteralBoolean', value: true, instance: undefined })
        && memberShape.slots[0].values.length === 0, out.member);
    // Step 2bis puts a new root far below the drawn diagram: the picture frames the new instances' nodes.
    {
        const vids = [...(b2.inst ? await verticesOf(page, b2.inst.id) : []), ...(m.inst ? await verticesOf(page, m.inst.id) : [])].map((v) => v.id);
        const hide = page.locator('button[aria-label="Hide the side panel"]:visible');
        if (await hide.count()) { await hide.first().click(); await wait(page, 900); }
        out.framed = await page.evaluate((vs) => {
            const pane = document.querySelector('.dock-tabpane-active .react-flow') as HTMLElement | null;
            const vp = document.querySelector('.dock-tabpane-active .react-flow__viewport') as HTMLElement | null;
            if (!pane || !vp) return null;
            let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
            for (const id of vs) {
                const el = document.querySelector(`.dock-tabpane-active .react-flow__node[data-id="${id}"]`) as HTMLElement | null;
                const mm = el?.style.transform.match(/translate\(\s*(-?[\d.]+)px,\s*(-?[\d.]+)px\)/);
                if (!el || !mm) continue;
                x0 = Math.min(x0, +mm[1]); y0 = Math.min(y0, +mm[2]); x1 = Math.max(x1, +mm[1] + el.offsetWidth); y1 = Math.max(y1, +mm[2] + el.offsetHeight);
            }
            if (!Number.isFinite(x0)) return null;
            const k = Math.min(1, (pane.clientWidth - 160) / (x1 - x0), (pane.clientHeight - 160) / (y1 - y0));
            vp.style.transform = `translate(${80 - x0 * k}px, ${80 - y0 * k}px) scale(${k})`;
            return { box: [x0, y0, x1, y1], k };
        }, vids);
        await wait(page, 500);
        await page.locator('.dock-tabpane-active .react-flow').first().screenshot({ path: `${OUT}/onto-s2-new-instance-light.png` });
        meas('screenshot', `${OUT}/onto-s2-new-instance-light.png`);
    }
    const drawnNew = (await readNodes(page)).filter((n) => n.name === b2.inst?.name || n.name === m.inst?.name);
    out.objectDiagramNew = drawnNew.map((n) => ({ name: n.name, x: n.x, y: n.y, w: n.w, h: n.h }));
    check('S2-4d the object diagram draws the two new instances', drawnNew.length === 2, out.objectDiagramNew);

    // ── S2-5: «New instance» on the class node ────────────────────────────────────────────────────────────────────
    await pickViewpoint(page, VP_CLASS);
    await wait(page, SETTLE_MS);
    { const fit = page.locator('.toolbar-commands__level:visible'); if (await fit.count()) { await fit.first().click(); await wait(page, 900); } }
    const nodes = await readNodes(page);
    const bookNode = nodes.find((n) => n.name === 'Book');
    const pubNode = nodes.find((n) => n.name === 'Publication');
    const rightClickNode = async (vertexId: string) => {
        const el = page.locator(`.dock-tabpane-active .react-flow__node[data-id="${vertexId}"]`).first();
        const bb = await el.boundingBox();
        if (!bb) return [] as string[];
        await page.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2, { button: 'right' });
        await wait(page, 500);
        return (await page.locator(MENU).first().locator('.context-menu__item').allInnerTexts()).map((t) => t.trim());
    };
    const pubItems = pubNode ? await rightClickNode(pubNode.id) : [];
    await closeMenu(page);
    const bookItems = bookNode ? await rightClickNode(bookNode.id) : [];
    const before3 = await census(page, ids.model);
    const before3Ids = new Set(before3.objects.map((o) => o.id));
    if (bookItems.includes('New instance')) await page.locator(`${MENU} .context-menu__item`, { hasText: /^New instance$/ }).first().click();
    else await closeMenu(page);
    const b3 = await waitInstance(page, ids.model, before3Ids, ids.classes.Book, 4);
    const nodeShape = b3.inst ? shapeOf(b3.c.objects, b3.inst.id) : null;
    const nodeVerts = b3.inst ? await verticesOf(page, b3.inst.id) : [];
    const cascadeShape = b2.inst ? shapeOf(b2.c.objects, b2.inst.id) : null;
    const strip = (s: ReturnType<typeof shapeOf>) => s && { cls: s.cls, classifier: s.classifier, slots: s.slots.map((x) => ({ cls: x.cls, feature: x.feature, values: x.values })) };
    out.classNode = { bookItems, pubItems, shape: nodeShape, cascadeShape: cascadeShape && { name: cascadeShape.name }, vertices: nodeVerts, bookNode };
    check('S2-5 «New instance» on the Book class node gives the structure of the cascade, one vertex; Publication offers none',
        !!nodeShape && JSON.stringify(strip(nodeShape)) === JSON.stringify(strip(cascadeShape)) && !pubItems.includes('New instance')
        && nodeVerts.length === 1, out.classNode);

    // ── S2-6: the fixture's object rules on the new instances ─────────────────────────────────────────────────────
    const fin = await census(page, ids.model);
    const snap: Snap = {};
    const byId = new Map(fin.objects.map((o) => [o.id, o]));
    for (const o of fin.objects) {
        const f: Record<string, unknown[]> = {};
        for (const [k, vs] of Object.entries(o.f)) f[k] = vs.map((x) => (typeof x === 'string' && byId.has(x) ? { ref: x } : x));
        (snap as Record<string, unknown>)[o.id] = { cls: o.cls, name: o.name, f };
    }
    const newNames = [b2.inst?.name, m.inst?.name, b3.inst?.name].filter(Boolean) as string[];
    const findings = runRules(snap).filter((x) => newNames.includes(x.at));
    const hard = findings.filter((x) => x.sev === 'error' && ['O1', 'O2', 'O3', 'O5'].includes(x.rule));
    out.rules = { newNames, findings };
    check('S2-6 the new instances pass the object rules O1, O2, O3, O5 of the fixture (O4 measured: the empty slots)', hard.length === 0 && newNames.length === 3, out.rules);

    // ── S2-3b: undo of a later instantiation (book3, the class-node entry) ─────────────────────────────────────────
    {
        const q = await emptyPanePoint(page, 'left');
        if (q) await page.mouse.click(q.x, q.y);
        await page.evaluate(() => (document.querySelector('.dock-tabpane-active .editor-v2') as HTMLElement | null)?.focus());
        const u0 = await census(page, ids.model);
        const gone = new Set([b3.inst?.id, ...((b3.inst?.f.slots ?? []) as string[])]);
        const st: unknown[] = []; let n = 0; let ok = false; let kept = true;
        for (; n < 10 && !ok && kept;) {
            await page.keyboard.press('Meta+z'); n++;
            await wait(page, 700);
            const c = await census(page, ids.model);
            kept = await bag();
            ok = !c.objects.some((o) => gone.has(o.id));
            st.push({ undo: c.undo, objects: c.objects.length, binding: kept, member1: c.objects.some((o) => o.id === m.inst?.id) });
            if (ok) out.undoLater = { entriesBefore: u0.undo, presses: n, steps: st, removed: u0.objects.length - c.objects.length };
        }
        if (!ok) out.undoLater = { entriesBefore: u0.undo, presses: n, steps: st, removed: false };
        check('S2-3b a later instantiation (book3): Cmd+Z removes it with its slots, nothing else', ok && kept
            && (st[st.length - 1] as { member1: boolean }).member1, out.undoLater);
        if (!kept) {
            await ev(page, `w.LPointerTargetable.fromPointer(a.mm).state = { ontoBindings: a.raw }; return 1;`, { mm: ids.mm, raw: written.raw }, 600);
            out.bindingRewritten2 = await bag();
        }
    }

    // ── S2-3m: where the undo entries go, measured (not a check) ──────────────────────────────────────────────────
    // A direct createInstance (the discovery's run 3 path), then instantiate() called from the page, each after a
    // pointerdown and a 1.5 s pause: the history before and after each.
    const lib = ids.classes.Library;
    { const q = await free(); await page.mouse.click(q.x, q.y); } await wait(page, 1500);
    const d0 = await history(page);
    await ev(page, `const ca = await import('/src/components/editor-v2/hooks/createAdapter.ts');
        return ca.createInstance(a.model, 'InstanceSpecification', null, null, { name: 'diag1', classifier: a.lib });`, { model: ids.model, lib }, 1500);
    const d1 = await history(page);
    const d2r = await ev<unknown>(page, `const ins = await import('/src/components/editor-v2/hooks/instantiate.ts');
        const get = (id) => w.store.getState().idlookup[id];
        const rec = ins.objectRecord(get, a.model); const r = await ins.instantiate(a.lib, rec);
        return { ok: r.ok, instance: r.instance, slots: r.slots.length, problems: r.problems };`, { model: ids.model, lib }, 1500);
    const d2 = await history(page);
    // Cmd+Z on that instantiation, called from the page: is it removed?
    const libInst = (d2r as { instance?: string } | null)?.instance;
    const dz: unknown[] = [];
    { const q = await emptyPanePoint(page, 'right'); if (q) await page.mouse.click(q.x, q.y); }
    for (let k = 0; k < 6; k++) {
        await page.keyboard.press('Meta+z'); await wait(page, 700);
        const c = await census(page, ids.model);
        const present = c.objects.some((o) => o.id === libInst);
        dz.push({ undo: c.undo, objects: c.objects.length, libInstance: present, diag1: c.objects.some((o) => o.name === 'diag1') });
        if (!present) break;
    }
    out.undoPaths = { before: d0, afterCreateInstance: d1, instantiateResult: d2r, afterInstantiate: d2, undoNoPlace: dz };
    meas('undo paths', out.undoPaths);

    // ── S2-7 ──────────────────────────────────────────────────────────────────────────────────────────────────────
    out.errors = errors.slice(0, 10);
    out.warnings = warnings.slice(0, 10);
    check('S2-7 page errors [] and no instantiate warning', errors.length === 0 && warnings.length === 0, { errors: errors.slice(0, 5), warnings: warnings.slice(0, 5) });
    await page.context().close();
} catch (e) {
    check('S2-X the probe ran to the end', false, String((e as Error)?.stack ?? e).slice(0, 800));
} finally {
    out.checks = { pass, fail };
    writeFileSync(`${OUT}/onto-s2-measures.json`, JSON.stringify(out, null, 2));
    meas('json', `${OUT}/onto-s2-measures.json`);
    await browser.close();
}
console.log(`DONE pass=${pass} fail=${fail}`);
process.exit(fail === 0 ? 0 : 1);
