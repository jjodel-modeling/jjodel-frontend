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
 *         S2-1m, before it, a right click that moves 3 px between press and release opens the cascade too (R-OI-17,
 *         P-2026-11-07-1235: with the right button in panOnDrag the movement panned and opened no menu);
 *   S2-2  «Book» makes one InstanceSpecification classified by Book, four slots whose defining features are isbn,
 *         genre, title, year (the S1 closure, own first), no value object, one vertex (useJjomSync Step 2bis: a
 *         vertex placed at the click broke the undo of the instantiation, measured in this lane);
 *   S2-3  undo: the entries one instantiation pushes and the Cmd+Z presses that bring the objects back;
 *   S2-4  «Member» gives the slot `active` a LiteralBoolean `true` (Property.defaultValue);
 *   S2-5  «New instance» on the Book class node gives the same structure; the abstract Publication offers no entry;
 *         S2-5o, run last on a second class-node instance, its node in the object diagram (zoom to fit) holds its
 *         header and four rows (P-2026-10-21-0725, P-2026-10-21-1016);
 *   S2-6  the new instances pass the fixture's object rules O1, O2, O3, O5 (`runRules`; O4 reports the empty slots);
 *   S2-7  page errors [] and no `[EditorV2] instantiate:` warning;
 *   S2-8  the node of a new instance holds its header and its four slot rows (DOM boxes), and S2-3n the undo numbers
 *         of S2-3 are those measured before the node size (P-2026-10-21-0655);
 *   S2u   one undo group per instantiation (P-2026-10-21-1016): S2-3n the cascade and S2-3b the class-node entry are
 *         1 entry and 1 Cmd+Z with as many `idlookup` entries after the press as before the instantiation (S2-3b1: past
 *         the late sync entries of `pointedBy` alone, a measure, P-2026-10-21-1121), S2-4u
 *         Member 1 entry, S2-2p the cascade node box contains the click (4 px), S2-3m bare createInstance +2 and
 *         instantiate +1 (decision 5).
 *   S2-R  the «Instances of» rail (R-OI-18, P-2026-11-08-0212): S2-R0 with no bag, «Declare binding…» in Advanced, which
 *         opens the binding dialog, and no section in Basic; S2-Rl the object record's classes, the link record's
 *         associations disabled, a click on one creating nothing; S2-R1 a rail drag drops one instance at the drop point
 *         under the tab's layout, 1 undo entry, 1 Cmd+Z; S2-R2 a click places it at the visible centre; S2-R3 a Class
 *         added to the model appears in the rail with the tab open; S2-R4 the linguistic «Instances» drag still creates
 *         its object (regression; the UML client has no rootable class, so it drags on LING_FILE's model).
 *         Crops into ONTO_OUT, `r*-*.png`.
 *
 * Run:  node frontend/scripts/lane-run.mjs probe ~/jjodel-w-oi-s2 frontend/scripts/probe/onto-s2-instantiate.ts \
 *         --port 3087 --id P-2026-10-21-0100
 * Env:  ONTO_OUT   output directory (default docs/discovery/assets/onto-s2)
 *       UML_FILE   the exported project (default ~/jjodel-demo-exports/uml/uml-class-object.jjodel)
 *       LING_FILE  the export of S2-R4's linguistic drag (default ~/jjodel-demo-exports/scene_2_DemoPetri.jjodel)
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
/** The export S2-R4 drags a linguistic entry on, when the UML client's rail offers none. */
const LING_FILE = process.env.LING_FILE || `${homedir()}/jjodel-demo-exports/scene_2_DemoPetri.jjodel`;
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
    return { objects: out, undo, idl: Object.keys(idl).length };`;
interface Obj { id: string; cls: string; name: string; father: string; f: Record<string, unknown[]> }
const census = (page: Page, modelId: string) => ev<{ objects: Obj[]; undo: number | null; idl: number }>(page, CENSUS, modelId, 0);

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
/** The M1 rail of the active tab (PalettePanel). */
const RAIL = '.dock-tabpane-active .editor-v2-palette--m1';
/** The undo history as the reducer sees it: the interaction flag, both stacks, the last entry's age. */
const history = (page: Page) => ev<Record<string, unknown>>(page, `
    const h = w.statehistory || {}; const u = h[w.DUser.current]; const last = u && u.undoable[u.undoable.length - 1];
    return { flag: w.U ? w.U.userHasInteracted : null, user: u ? u.undoable.length : null, all: h.all ? h.all.undoable.length : null,
        senders: Object.keys(h), lastAgeMs: last && last.timestamp ? Date.now() - last.timestamp : null };`, undefined, 0);
/** Wait until the user's undo stack has not grown for 800 ms (the COMMIT tick is 300 ms), at most 4 s; the last read. */
async function settle(page: Page) {
    let h = await history(page); let since = Date.now(); const end = Date.now() + 4000;
    while (Date.now() < end && Date.now() - since < 800) {
        await wait(page, 150); const n = await history(page);
        if (n.user !== h.user) since = Date.now();
        h = n;
    }
    return h;
}
/** The user's undo entries from index `from` on: per entry its age, top-level keys and the idlookup records it touches. */
/** The reducer's undo group state (`undoGroupState`, dev only), its times as ages like `entriesFrom`, and the buffer. */
const groupState = (page: Page) => ev<Record<string, unknown> | null>(page, `
    if (!w.undoGroupState) return null; const g = w.undoGroupState(); const now = Date.now(); const t = w.transactionStatus || {};
    const age = (e) => e && { ...e, ageMs: now - e.at, at: undefined };
    return { open: g.open && { id: g.open.id, ageMs: now - g.open.openedAt }, tail: g.tail && { ageMs: now - g.tail.timestamp, lastAgeMs: now - g.tail.lastAt, onTop: g.tail.onTop },
        closed: age(g.closed), tailCleared: age(g.tailCleared), txDepth: t.transactionDepthLevel, txBegun: t.hasBegun };`, undefined, 0);
const entriesFrom = (page: Page, from: number) => ev<unknown[]>(page, `
    const u = w.statehistory[w.DUser.current]; const now = Date.now();
    return u.undoable.slice(a).map((d) => { const il = d.idlookup || {}; const ks = Object.keys(il);
        return { ageMs: d.timestamp ? now - d.timestamp : null, keys: Object.keys(d).filter((k) => !/^timestamp/.test(k)).slice(0, 12),
            idl: ks.length, cls: ks.slice(0, 8).map((k) => (il[k] && il[k].className) || (w.store.getState().idlookup[k] || {}).className || '?'),
            fields: ks.length <= 4 ? ks.map((k) => k.slice(-14) + ':' + (il[k] && typeof il[k] === 'object' ? Object.keys(il[k]).slice(0, 8).join(',') : String(il[k]).slice(0, 40))) : undefined,
            title: d.action_title }; });`, from, 0);
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

/** A rail item dragged onto the pane at `at`: dragstart on the item writes its payload into one DataTransfer, dragover
 *  and drop on the topmost element there read it, dragend closes the drag; the keys the item wrote. */
const dragTo = (page: Page, item: string, text: string, at: { x: number; y: number }) => page.evaluate(({ item, text, at }) => {
    const src = [...document.querySelectorAll(item)].find((e) => (e.textContent || '').trim() === text) as HTMLElement | undefined;
    const el = document.elementFromPoint(at.x, at.y);
    if (!src || !el) return null;
    const dt = new DataTransfer();
    src.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer: dt }));
    const types = [...dt.types];
    el.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, clientX: at.x, clientY: at.y, dataTransfer: dt }));
    el.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, clientX: at.x, clientY: at.y, dataTransfer: dt }));
    src.dispatchEvent(new DragEvent('dragend', { bubbles: true, cancelable: true, dataTransfer: dt }));
    return types;
}, { item, text, at });

/** The screen box of the node of vertex `id` in the active tab, `null` when it is not drawn. */
const nodeScreenBox = (page: Page, id: string) => page.evaluate((vid) => {
    const el = document.querySelector(`.dock-tabpane-active .react-flow__node[data-id="${vid}"]`) as HTMLElement | null;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { l: r.left, t: r.top, r: r.right, b: r.bottom, zoom: el.offsetWidth ? r.width / el.offsetWidth : 1 };
}, id);
/** The node's top-left is the point, within half a step of the canvas's 16 px grid (the snap S2-2p measures) and 1 px. */
const topLeftAt = (b: { l: number; t: number; zoom: number } | null, p: { x: number; y: number }) =>
    !!b && Math.abs(b.l - p.x) <= 8 * b.zoom + 1 && Math.abs(b.t - p.y) <= 8 * b.zoom + 1;

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
    if (!(await page.locator('.toolbar-viewpoint-trigger:visible:not([disabled])').count())) {
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

    // ── S2-R0: the rail with no bag: «Declare binding…» in Advanced only (R-OI-18, question 2) ─────────────────────
    {
        const setAdvanced = (on: boolean) => ev(page, `const j = await import('/src/joiner/index.ts'); j.SetRootFieldAction.new('advanced', a); w.advanced = a;
            localStorage.setItem('jjodel.interfaceMode', a ? 'advanced' : 'basic'); return 1;`, on, 1200);
        const advanced0 = await ev<boolean>(page, `return !!w.store.getState().advanced;`, undefined, 0);
        await setAdvanced(true);
        const advanced = { section: await page.locator(`${RAIL} .palette-onto`).count(), declare: await page.locator(`${RAIL} .palette-onto__declare`).count(), dialog: 0 };
        await page.locator(RAIL).first().screenshot({ path: `${OUT}/r0-rail-empty-advanced.png` });
        if (advanced.declare) {
            await page.locator(`${RAIL} .palette-onto__declare`).first().click();
            await wait(page, 800);
            advanced.dialog = await page.locator('.onto-binding-modal').count();
            await page.keyboard.press('Escape');
            await wait(page, 400);
        }
        await setAdvanced(false);
        const basic = { section: await page.locator(`${RAIL} .palette-onto`).count(), instances: await page.locator(`${RAIL} .palette-instances`).count() };
        await page.locator(RAIL).first().screenshot({ path: `${OUT}/r0-rail-basic-no-binding.png` });
        await setAdvanced(advanced0);
        out.railEmpty = { advanced0, advanced, basic, dialogLeft: await page.locator('.onto-binding-modal').count() };
        check('S2-R0 no bag: Advanced shows «Instances of» with «Declare binding…», which opens the binding dialog; Basic shows no section',
            advanced.section === 1 && advanced.declare === 1 && advanced.dialog === 1 && basic.section === 0 && basic.instances === 1, out.railEmpty);
    }

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

    // ── S2-1m: a right click that moves 3 px between press and release (a trackpad's two-finger click) ─────────────
    // With the right button in panOnDrag the movement was a pan and no menu opened (R-OI-17, P-2026-11-07-1235).
    const pm = (await emptyPanePoint(page, 'left'))!;
    const vpOf = () => page.evaluate(() => (document.querySelector('.dock-tabpane-active .react-flow__viewport') as HTMLElement | null)?.style.transform ?? null);
    await page.mouse.click(pm.x, pm.y);            // a pointerdown first: arms U.userHasInteracted
    await wait(page, 200);
    const vm0 = await vpOf();
    await page.mouse.move(pm.x, pm.y);
    await page.mouse.down({ button: 'right' });
    await page.mouse.move(pm.x + 3, pm.y, { steps: 3 });
    await page.mouse.up({ button: 'right' });
    await wait(page, 500);
    const mParent = page.locator(MENU).first().locator('.context-menu__item--cascade').first();
    const mLabel = (await mParent.count()) ? (await mParent.innerText()).trim() : null;
    if (mLabel) { await mParent.hover(); await wait(page, 400); }
    out.rightClickMoved = { at: pm, parent: mLabel, panels: await menuCount(page), viewport: [vm0, await vpOf()] };
    check('S2-1m a right click that moves 3 px on the empty pane opens the «New instance of ▸» cascade',
        mLabel === 'New instance of' && (await menuCount(page)) > 1, out.rightClickMoved);
    if (await menuCount(page)) await closeMenu(page);

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
    check('S2-2v one vertex for the new instance', bookVerts.length === 1, { bookVerts, flow1 });
    // Ticket (a): the node's top-left goes at the click, so its DOM box (screen) contains the click point within 4 px;
    // the top-left's distance from the click is kept (measured: the canvas snaps it to its 16 px grid).
    const placed = bookVerts[0] ? await page.evaluate(({ id, at }) => {
        const el = document.querySelector(`.dock-tabpane-active .react-flow__node[data-id="${id}"]`) as HTMLElement | null;
        const mm = el?.style.transform.match(/translate\(\s*(-?[\d.]+)px,\s*(-?[\d.]+)px\)/);
        if (!el || !mm) return null;
        const r = el.getBoundingClientRect();
        return { flow: { x: +mm[1], y: +mm[2] }, box: { l: r.left, t: r.top, r: r.right, b: r.bottom }, at };
    }, { id: bookVerts[0].id, at: p1 }) : null;
    out.placement = { placed, flow1 };
    check('S2-2p the cascade instance\'s node box contains the right-click point within 4 px', !!placed && !!flow1
        && placed.box.l - 4 <= p1.x && p1.x <= placed.box.r + 4 && placed.box.t - 4 <= p1.y && p1.y <= placed.box.b + 4,
        { ...out.placement, topLeftDelta: placed && flow1 && { x: placed.flow.x - flow1.x, y: placed.flow.y - flow1.y } });

    // ── S2-3: undo of one instantiation ────────────────────────────────────────────────────────────────────────────
    const entries = (b.c.undo ?? 0) - (before.undo ?? 0);
    const free = async () => (await emptyPanePoint(page, 'left')) ?? p1;
    const h1 = await history(page);
    // No pane click before the presses (P-2026-10-21-1219): the click's deselect makes a sync write of `DEdge.pointedBy`
    // land ~300 ms later as an undo entry of its own (measured: +1 entry, 2 presses with it; 0 entries, 1 press without).
    // The user's sequence is create, then Cmd+Z: focus the canvas and let the store go idle first.
    await page.evaluate(() => (document.querySelector('.editor-v2') as HTMLElement | null)?.focus());
    const h1s = await settle(page);
    out.settled = { pushed: (h1s.user as number) - (h1.user as number), top: await entriesFrom(page, (h1.user as number) - 1) };
    // The entries and the group state at the first press: what a press with no visible effect undoes (P-2026-10-21-1121).
    out.undoPre = { entries: await entriesFrom(page, (before.undo ?? 1) - 1), group: await groupState(page) };
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
    out.undo = { entries, presses, back, undoBefore: before.undo, undoAfterCreate: b.c.undo, undoAfterPresses: now.undo, bindingKept: bagAfterUndo,
        idlBefore: before.idl, idlAfterCreate: b.c.idl, idlAfterPresses: now.idl, h0, h1, steps };
    check('S2-3 one instantiation is N undo entries (declared, S2u makes it one); Cmd+Z presses bring the objects back, the binding kept',
        back && bagAfterUndo === true, out.undo);
    // The node size write (P-2026-10-21-0655) must not make the undo worse than measured before it (P-2026-10-21-0635:
    // 1 entry, 2 presses, the first one a no-op); the numbers are kept in out.undo.
    check('S2-3n the cascade instantiation is 1 entry and 1 Cmd+Z, no idlookup orphan after the press (S2u)',
        entries === 1 && presses === 1 && back && bagAfterUndo === true && now.idl === before.idl,
        { entries, presses, idlBefore: before.idl, idlAfterCreate: b.c.idl, idlAfterPresses: now.idl });
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
    const preMember = await census(page, ids.model);
    await c3.child.locator('.context-menu__item', { hasText: 'Member' }).first().click();
    const m = await waitInstance(page, ids.model, before2Ids, ids.classes.Member, 2);
    out.memberUndo = { before: preMember.undo, after: m.c.undo, entries: await entriesFrom(page, (preMember.undo ?? 1) - 1), group: await groupState(page) };
    check('S2-4u «Member» (a default value) is 1 undo entry, not 2', (m.c.undo ?? 0) - (preMember.undo ?? 0) === 1, out.memberUndo);
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

    // ── S2-8: the new instance's node holds its header and its rows (DOM boxes, P-2026-10-21-0655) ─────────────────
    const nodeBox = (id: string) => page.evaluate((id) => {
            const el = document.querySelector(`.dock-tabpane-active .react-flow__node[data-id="${id}"]`) as HTMLElement | null;
            const content = el?.querySelector('.ir-node-content') as HTMLElement | null;
            if (!el || !content) return null;
            const n = el.getBoundingClientRect(); const c = content.getBoundingClientRect();
            const clip = { l: Math.max(n.left, c.left), r: Math.min(n.right, c.right), t: Math.max(n.top, c.top), b: Math.min(n.bottom, c.bottom) };
            const inside = (r: DOMRect) => r.width > 0 && r.height > 0
                && r.left >= clip.l - 0.5 && r.right <= clip.r + 0.5 && r.top >= clip.t - 0.5 && r.bottom <= clip.b + 0.5;
            // Offsets from the node's top, in screen px (the viewport is scaled: compared with each other only).
            const span = (r: DOMRect) => ({ top: Math.round((r.top - n.top) * 10) / 10, bottom: Math.round((r.bottom - n.top) * 10) / 10 });
            const labels = Array.from(el.querySelectorAll('.ir-label--top')).map((l) => {
                const e = l as HTMLElement; const r = e.getBoundingClientRect();
                // Both axes: at 280x60 the two labels were squeezed to a third of their line height (measured).
                const clipped = e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 1;
                return { text: (e.textContent ?? '').trim(), inside: inside(r), clipped, ...span(r) };
            });
            const rows = Array.from(el.querySelectorAll('.ir-row')).map((x) => {
                const r = x.getBoundingClientRect();
                return { text: (x.textContent ?? '').trim(), inside: inside(r), ...span(r) };
            });
            return { node: { w: el.offsetWidth, h: el.offsetHeight }, labels, rows };
        }, id);
    {
        const bookVid = b2.inst ? (await verticesOf(page, b2.inst.id))[0]?.id : undefined;
        const box = bookVid ? await nodeBox(bookVid) : null;
        out.bookBox = { name: b2.inst?.name, vertex: bookVid, box };
        const headerBottom = box ? Math.max(...box.labels.map((l) => l.bottom)) : Infinity;
        check('S2-8 book1: its header (name, classifier) is fully inside its node, no row drawn over it',
            !!box && JSON.stringify(box.labels.map((l) => l.text)) === JSON.stringify([b2.inst?.name, 'Book'])
            && box.labels.every((l) => l.inside && !l.clipped) && box.rows.every((r) => r.top >= headerBottom - 0.5), out.bookBox);
        check('S2-8r book1: its four slot rows are inside its node', !!box && box.rows.length === 4 && box.rows.every((r) => r.inside), out.bookBox);
    }

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
        // No pane click, the store idle before the baseline, as in S2-3 (P-2026-10-21-1219).
        await page.evaluate(() => (document.querySelector('.dock-tabpane-active .editor-v2') as HTMLElement | null)?.focus());
        await settle(page);
        const u0 = await census(page, ids.model);
        const e3 = await entriesFrom(page, (before3.undo ?? 1) - 1);
        out.undoLaterGroup = await groupState(page);
        const gone = new Set([b3.inst?.id, ...((b3.inst?.f.slots ?? []) as string[])]);
        const st: unknown[] = []; let n = 0; let ok = false; let kept = true;
        for (; n < 10 && !ok && kept;) {
            await page.keyboard.press('Meta+z'); n++;
            await wait(page, 700);
            const c = await census(page, ids.model);
            kept = await bag();
            ok = !c.objects.some((o) => gone.has(o.id));
            st.push({ undo: c.undo, objects: c.objects.length, binding: kept, member1: c.objects.some((o) => o.id === m.inst?.id) });
            if (ok) out.undoLater = { entriesBefore: u0.undo, presses: n, steps: st, removed: u0.objects.length - c.objects.length,
                entries: (b3.c.undo ?? 0) - (before3.undo ?? 0), entryList: e3, idlBefore: before3.idl, idlAfterCreate: b3.c.idl, idlAfterPresses: c.idl };
        }
        if (!ok) out.undoLater = { entriesBefore: u0.undo, presses: n, steps: st, removed: false };
        check('S2-3b a later instantiation (book3): Cmd+Z removes it with its slots, nothing else', ok && kept
            && (st[st.length - 1] as { member1: boolean }).member1, out.undoLater);
        const ul = out.undoLater as { entries?: number; idlBefore?: number; idlAfterPresses?: number };
        // The entries after the instantiation's own (e3[0] is the one before it): a later sync write of `pointedBy`
        // alone (a pane click's deselect triggers it, P-2026-10-21-1219) is not part of the instantiation, and a group held open
        // that long would swallow the user's own edits (P-2026-10-21-1121): a known measure, one Cmd+Z each, not a fail.
        const later = (e3 as Array<{ keys: string[]; fields?: string[] }>).slice(1 + (ul.entries ?? 0));
        const lateSync = later.filter((e) => e.keys.every((k) => k === 'idlookup' || k === 'action_title') && !!e.fields
            && e.fields.every((x) => /^clonedCounter:/.test(x) || x.split(':').pop()!.split(',').every((k) => k === 'pointedBy' || k === 'clonedCounter'))
            && e.fields.some((x) => x.split(':').pop()!.split(',').includes('pointedBy')));
        const syncMeasure = { lateSync: lateSync.length, others: later.length - lateSync.length, presses: n };
        out.undoLaterSync = syncMeasure;
        meas('S2-3b1 late sync entries (pointedBy only), not the instantiation', syncMeasure);
        check('S2-3b1 the class-node instantiation is 1 entry of its own and 1 Cmd+Z past the late sync entries, no idlookup orphan (S2u)',
            ok && ul.entries === 1 && later.length === lateSync.length && n === 1 + lateSync.length && ul.idlAfterPresses === ul.idlBefore,
            { ...syncMeasure, entries: ul.entries, idlBefore: ul.idlBefore, idlAfterPresses: ul.idlAfterPresses });
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
        const rec = ins.objectRecord(get, a.model); const t0 = Date.now(); const r = await ins.instantiate(a.lib, rec);
        return { ok: r.ok, instance: r.instance, slots: r.slots.length, problems: r.problems, ms: Date.now() - t0 };`, { model: ids.model, lib }, 1500);
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
    {
        const u = (h: Record<string, unknown>) => (h.user as number | null) ?? 0;
        const r = d2r as { ok?: boolean; problems?: string[]; ms?: number } | null;
        check('S2-3m bare createInstance +2 entries, instantiate +1 with no problem (decision 5)',
            u(d1) - u(d0) === 2 && u(d2) - u(d1) === 1 && !!r?.ok && (r.problems ?? []).length === 0,
            { createInstance: u(d1) - u(d0), instantiate: u(d2) - u(d1), problems: r?.problems, ms: r?.ms });
    }

    // ── S2-5o: a class-node instance, made under the class diagram, in the object diagram (zoom to fit) ─────────────
    // Last, so the undo measures above keep their viewpoint (P-2026-10-21-0725). book3 was undone by S2-3b: a fresh one.
    {
        if (bookNode) await rightClickNode(bookNode.id);
        const before4 = await census(page, ids.model);
        const before4Ids = new Set(before4.objects.map((o) => o.id));
        await page.locator(`${MENU} .context-menu__item`, { hasText: /^New instance$/ }).first().click();
        const b4 = await waitInstance(page, ids.model, before4Ids, ids.classes.Book, 4);
        await pickViewpoint(page, VP_OBJECT);
        await wait(page, SETTLE_MS);
        { const fit = page.locator('.toolbar-commands__level:visible'); if (await fit.count()) { await fit.first().click(); await wait(page, 900); } }
        const vid = b4.inst ? (await verticesOf(page, b4.inst.id))[0]?.id : undefined;
        const box = vid ? await nodeBox(vid) : null;
        out.classNodeBox = { name: b4.inst?.name, vertex: vid, box };
        const headerBottom = box ? Math.max(...box.labels.map((l) => l.bottom)) : Infinity;
        await page.locator('.dock-tabpane-active .react-flow').first().screenshot({ path: `${OUT}/onto-s2-class-node-instance-light.png` });
        meas('screenshot', `${OUT}/onto-s2-class-node-instance-light.png`);
        check('S2-5o a class-node instance in the object diagram: header (name, classifier) and four slot rows inside its node',
            !!box && JSON.stringify(box.labels.map((l) => l.text)) === JSON.stringify([b4.inst?.name, 'Book'])
            && box.labels.every((l) => l.inside && !l.clipped) && box.rows.length === 4
            && box.rows.every((r) => r.inside && r.top >= headerBottom - 0.5), out.classNodeBox);
    }

    // ── S2-R: the «Instances of» rail (R-OI-18, P-2026-11-08-0212) ─────────────────────────────────────────────────
    // Last but S2-7, so the instance names and the undo measures above stay as they were. The object diagram, fit.
    {
        const objectItems = `${RAIL} .palette-onto__item:not(.palette-onto__item--disabled)`;
        const linkItems = `${RAIL} .palette-onto__item--disabled`;
        const texts = async (sel: string) => (await page.locator(sel).allInnerTexts()).map((t) => t.trim());
        const objects = await texts(objectItems);
        const links = await page.locator(linkItems).evaluateAll((els) => els.map((e) => ({
            text: (e.textContent || '').trim(), disabled: e.getAttribute('aria-disabled'), draggable: e.getAttribute('draggable'), title: e.getAttribute('title') })));
        const gap = await page.evaluate((rail) => {
            const a = document.querySelector(`${rail} .palette-instances`)?.getBoundingClientRect();
            const b = document.querySelector(`${rail} .palette-onto`)?.getBoundingClientRect();
            return a && b ? { instancesBottom: a.bottom, ontoTop: b.top, gap: b.top - a.bottom } : null;
        }, RAIL);
        await page.locator(RAIL).first().screenshot({ path: `${OUT}/r1-rail-binding.png` });
        const preL = await census(page, ids.model);
        if (links.length) { await page.locator(linkItems).first().click({ force: true }); await wait(page, 1500); }
        const postL = await census(page, ids.model);
        out.rail = { objects, links, gap, linkClick: { objects: [preL.objects.length, postL.objects.length], undo: [preL.undo, postL.undo] } };
        check('S2-Rl the rail lists Book, Library, Magazine, Member under the object record and the associations disabled; a link click creates nothing',
            JSON.stringify(objects) === JSON.stringify(['Book', 'Library', 'Magazine', 'Member']) && links.length > 0
            && links.every((l) => l.disabled === 'true' && l.draggable === null && l.title === 'A link is drawn between two instances (S4)')
            && !!gap && gap.gap >= 0 && postL.objects.length === preL.objects.length && postL.undo === preL.undo, out.rail);

        // S2-R1: a drag from the rail, dropped on an empty point of the pane.
        const pR = await emptyPanePoint(page, 'right');
        if (!pR) throw new Error('no empty pane point for the rail drop');
        await page.mouse.click(pR.x, pR.y); await wait(page, 300);
        await settle(page);
        const pre1 = await census(page, ids.model);
        const pre1Ids = new Set(pre1.objects.map((o) => o.id));
        const types1 = await dragTo(page, objectItems, 'Magazine', pR);
        const r1 = await waitInstance(page, ids.model, pre1Ids, ids.classes.Magazine, 3);
        await settle(page);
        const post1 = await census(page, ids.model);
        const v1 = r1.inst ? (await verticesOf(page, r1.inst.id))[0]?.id : undefined;
        const box1 = v1 ? await nodeScreenBox(page, v1) : null;
        await page.evaluate((p) => { const d = document.createElement('div'); d.id = 'probe-cursor';
            d.style.cssText = `position:fixed;left:${p.x - 4}px;top:${p.y - 4}px;width:8px;height:8px;border-radius:50%;background:#e11d48;z-index:99999;pointer-events:none`;
            document.body.appendChild(d); }, pR);
        await page.locator('.dock-tabpane-active .react-flow').first().screenshot({ path: `${OUT}/r2-canvas-after-drop.png` });
        await page.evaluate(() => document.getElementById('probe-cursor')?.remove());
        await page.keyboard.press('Meta+z');
        await wait(page, 1200); await settle(page);
        const undone1 = await census(page, ids.model);
        out.railDrop = { at: pR, types: types1, name: r1.inst?.name, slots: (r1.inst?.f.slots ?? []).length, vertex: v1, box: box1,
            undo: [pre1.undo, post1.undo, undone1.undo], objects: [pre1.objects.length, post1.objects.length, undone1.objects.length] };
        check('S2-R1 a rail drag drops one Magazine instance, its top-left at the drop point (half a grid step) under the tab\'s layout, 1 undo entry, 1 Cmd+Z',
            JSON.stringify(types1) === JSON.stringify(['application/jjodel-onto']) && !!r1.inst && topLeftAt(box1, pR)
            && (post1.undo ?? 0) - (pre1.undo ?? 0) === 1
            && undone1.objects.length === pre1.objects.length && undone1.objects.every((o) => pre1Ids.has(o.id)), out.railDrop);

        // S2-R2: a click on a rail entry, at the centre of the canvas the overlay leaves visible.
        await settle(page);
        const pre2 = await census(page, ids.model);
        const pre2Ids = new Set(pre2.objects.map((o) => o.id));
        const centre = await ev<{ x: number; y: number } | null>(page, `
            const c = await import('/src/components/editor-v2/utils/canvasCentre.ts'); const v = await import('/src/components/editor-v2/viewportInset.ts');
            const el = document.querySelector('.dock-tabpane-active .editor-v2__canvas'); return el ? c.clientCentre(el.getBoundingClientRect(), v.getCanvasRightInset()) : null;`, undefined, 0);
        await page.locator(objectItems, { hasText: /^Library$/ }).first().click();
        const r2 = await waitInstance(page, ids.model, pre2Ids, ids.classes.Library, 1);
        await settle(page);
        const post2 = await census(page, ids.model);
        const v2 = r2.inst ? (await verticesOf(page, r2.inst.id))[0]?.id : undefined;
        const box2 = v2 ? await nodeScreenBox(page, v2) : null;
        out.railClick = { centre, name: r2.inst?.name, vertex: v2, box: box2, undo: [pre2.undo, post2.undo] };
        check('S2-R2 a rail click places one Library instance, its top-left at the visible centre of the canvas (half a grid step), 1 undo entry',
            !!r2.inst && !!centre && topLeftAt(box2, centre) && (post2.undo ?? 0) - (pre2.undo ?? 0) === 1, out.railClick);

        // S2-R3: a Class added to the model reaches the rail with the tab open.
        await ev(page, `const ca = await import('/src/components/editor-v2/hooks/createAdapter.ts');
            return ca.createInstance(a, 'Class', null, null, { name: 'Novel' });`, ids.model, 1500);
        let objects3: string[] = [];
        for (let i = 0; i < 20 && !objects3.includes('Novel'); i++) { await wait(page, 250); objects3 = await texts(objectItems); }
        out.railNewClass = { objects: objects3 };
        check('S2-R3 a Class added to the model appears in the rail without reopening the tab', objects3.includes('Novel'), out.railNewClass);

        // S2-R4: the linguistic «Instances» drag still creates its object. The UML client offers no rootable class
        // («No rootable classes found», measured on uml-s3b), so the drag runs on LING_FILE's model when this rail has none.
        const lingItems = `${RAIL} .palette-instances__item`;
        let ling = await texts(lingItems);
        let lingModel = ids.model;
        const lingUml = ling.length;
        if (ling.length === 0 && existsSync(LING_FILE)) {
            const imported2 = await ev<{ id: string | null }>(page, `
                const api = await import('/src/api/persistance/projects.ts');
                const list = () => JSON.parse(localStorage.getItem('projects') || '[]');
                const before = list().length;
                await api.ProjectsApi.importFromText(a);
                for (let i = 0; i < 75 && list().length <= before; i++) await new Promise((r) => setTimeout(r, 200));
                const l = list(); return { id: l.length > before ? l[l.length - 1].id : null };`, readFileSync(LING_FILE, 'utf8'), 0);
            if (imported2.id) {
                await page.goto(`${URL}/#/project?id=${imported2.id}`, { waitUntil: 'domcontentloaded', timeout: 300000 });
                await wait(page, 9000);
                await page.addStyleTag({ content: '.notification-widget, .notification-content, .donation-banner { pointer-events: none !important; display: none !important; }' }).catch(() => {});
                if (!(await page.locator(RAIL).count())) {
                    await ev(page, `const dm = await import('/src/components/abstract/DockManager.tsx'); const m = w.LProject.getProject().models.find((x) => !x.isMetamodel);
                        await dm.default.open2(w.LPointerTargetable.fromPointer(m.id)); return 1;`, undefined, 8000);
                }
                lingModel = await ev<string>(page, `return w.LProject.getProject().models.find((x) => !x.isMetamodel).id;`, undefined, 0);
                ling = await texts(lingItems);
            }
        }
        const lingName = ling[0];
        const p4 = await emptyPanePoint(page, 'left');
        if (p4) { await page.mouse.click(p4.x, p4.y); await wait(page, 300); }
        const pre4 = await census(page, lingModel);
        const pre4Ids = new Set(pre4.objects.map((o) => o.id));
        const types4 = p4 && lingName ? await dragTo(page, lingItems, lingName, p4) : null;
        let made4: Obj[] = [];
        for (let i = 0; i < 20 && made4.length === 0; i++) {
            await wait(page, 250);
            made4 = (await census(page, lingModel)).objects.filter((o) => !pre4Ids.has(o.id) && o.cls === lingName);
        }
        out.lingDrop = { umlItems: lingUml, file: lingModel === ids.model ? FILE : LING_FILE, items: ling, name: lingName, at: p4, types: types4, made: made4.map((o) => o.name) };
        check('S2-R4 the linguistic «Instances» drag still creates one object of its metaclass (regression)',
            !!types4 && types4.includes('application/reactflow') && !types4.includes('application/jjodel-onto') && made4.length === 1, out.lingDrop);
    }

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
