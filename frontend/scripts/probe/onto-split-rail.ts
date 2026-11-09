/**
 * onto-split-rail (P-2026-11-09-1115): the M1 rail in a split of canvases, the UML class diagram and object diagram
 * side by side, in both orders.
 *
 * Scene: the export of uml-class-object-fixture, its bindings written through `mm.state` (onto-s2-instantiate.ts), the
 * class viewpoint at level `class`, the object viewpoint at `instance`; the first tab on one viewpoint, the second
 * opened beside it by `DockManager.openModelTabBeside`, the function of the tree's «Open beside».
 *
 * Checks, for each order and each pane, the pane made active by a real press on its empty canvas:
 *   SP-0  two panes, one active, the side panel's inset above the snap tolerance (else the click check cannot tell);
 *   SP-1  the palette follows the active pane: «Elements» for class, «Instances of» for object;
 *   SP-2  a rail click puts one node, its top-left at the centre of that pane with the pane's own inset (0 unless last);
 *   SP-3  a rail drag on the active pane puts one node, its top-left at the drop point;
 *   SP-4  a rail drag on the inactive pane is refused: dragover not accepted, and the drop, dispatched anyway, writes
 *         nothing (`idlookup` and undo unchanged, no new node in either pane);
 *   SP-5  dragover on the inactive pane answers alike for `application/reactflow` (the linguistic palette, the trunk's
 *         rule) and the rail's key, refused on the inactive pane and accepted on the active one;
 *   SP-6  no level on either viewpoint: a rail drag on the inactive pane is refused and writes nothing; SP-6c the same
 *         item on the active pane writes. Across levels the drop's own gate (R-OI-20) stops the write, so in SP-4 only
 *         `accepted` tells the pane guard; here the guard alone can stop it (bench on a031db094: SP-4's write part stays
 *         green without the fix, SP-6 is the check of it);
 *   SP-E  page errors [].
 * SP-3 on a pane is the positive control of SP-4 on it: same pane, the only difference being which pane is active.
 * The linguistic palette itself is not dragged: the UML client has no rootable class, so its «Instances» is empty.
 *
 * Crops into ONTO_OUT: split-<order>.png, the window with the rail and the split; click-<order>-pane<i>.png, a pane
 * after its rail click with the expected point marked.
 *
 * Run:  node frontend/scripts/lane-run.mjs probe ~/jjodel-w-oi-rail frontend/scripts/probe/onto-split-rail.ts \
 *         --port 3087 --id P-2026-11-09-1115
 * Env:  ONTO_OUT   output directory (required: probe assets stay out of docs/)
 *       UML_FILE   the exported project (default ~/jjodel-demo-exports/uml/uml-class-object.jjodel)
 */
import { chromium, type Browser, type Page } from '@playwright/test';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { setTheme, SETTLE_MS } from '../smoke/states.ts';

const URL = (process.env.PROBE_URL || 'http://localhost:3087/').replace(/\/$/, '');
if (/:(3000|3001|3005|3015)$/.test(URL)) throw new Error('never 3000, 3001, 3005 or 3015');
if (!process.env.ONTO_OUT) throw new Error('ONTO_OUT is required');
const OUT = process.env.ONTO_OUT.replace(/\/$/, '');
mkdirSync(OUT, { recursive: true });
process.env.UML_OUT = OUT;
process.env.GV_OUT = OUT;
const { ev, meas, openPage, pickViewpoint } = await import('./bpmn-lanes-fixture.ts');

const FILE = process.env.UML_FILE || `${homedir()}/jjodel-demo-exports/uml/uml-class-object.jjodel`;
const VP_CLASS = 'UML class diagram';
const VP_OBJECT = 'UML object diagram';
const RAIL = '.dock-tabpane-active .editor-v2-palette--m1';
const ITEMS = `${RAIL} .palette-onto__item:not(.palette-onto__item--disabled)`;
const ONTO_KEY = 'application/jjodel-onto';
const LINGUISTIC_KEY = 'application/reactflow';

let pass = 0; let fail = 0;
const check = (name: string, ok: boolean, detail: unknown) => {
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  ${JSON.stringify(detail).slice(0, 900)}`);
    if (ok) pass++; else fail++;
};
const wait = (page: Page, ms: number) => page.waitForTimeout(ms);

interface Pt { x: number; y: number }
interface PaneInfo { active: boolean; inSplit: boolean; canvas: { left: number; top: number; width: number; height: number }; nodes: string[] }
interface Split { count: number; inset: number; panes: PaneInfo[] }

/** The canvases shown, left to right, in the page's own script. */
const PANES = `const panes = [...document.querySelectorAll('.dock-tabpane-active .editor-v2')]
    .filter((p) => p.getBoundingClientRect().width > 0).sort((x, y) => x.getBoundingClientRect().left - y.getBoundingClientRect().left);`;

const readSplit = (page: Page) => ev<Split>(page, `${PANES}
    const dm = await import('/src/components/abstract/DockManager.tsx'); const v = await import('/src/components/editor-v2/viewportInset.ts');
    const s = dm.default.getCanvasSplit();
    return { count: s.panes.length, inset: v.getCanvasRightInset(), panes: panes.map((p) => { const c = p.querySelector('.editor-v2__canvas').getBoundingClientRect();
        return { active: s.active === p, inSplit: s.panes.includes(p), canvas: { left: c.left, top: c.top, width: c.width, height: c.height },
            nodes: [...p.querySelectorAll('.react-flow__node[data-id]')].map((n) => n.dataset.id) }; }) };`, undefined, 0);

/** The centre `clientCentre` gives for pane `i` with `inset`, the function the app calls. */
const centreOf = (page: Page, s: Split, i: number, inset: number) => ev<Pt>(page, `const c = await import('/src/components/editor-v2/utils/canvasCentre.ts');
    return c.clientCentre(a.rect, a.inset);`, { rect: s.panes[i].canvas, inset }, 0);

/** A point of pane `i` whose topmost element is its own flow pane. */
const emptyPoint = (page: Page, i: number) => page.evaluate(([i, list]) => {
    const panes = new Function(`${list} return panes;`)() as HTMLElement[];
    const pane = panes[i as number].querySelector('.react-flow__pane') as HTMLElement;
    const r = pane.getBoundingClientRect();
    for (const fy of [0.85, 0.72, 0.6, 0.45, 0.3]) for (const fx of [0.12, 0.22, 0.32, 0.42, 0.55]) {
        const x = Math.round(r.left + r.width * fx); const y = Math.round(r.top + r.height * fy);
        if (document.elementFromPoint(x, y) === pane) return { x, y };
    }
    return null;
}, [i, PANES] as const);

const nodeBox = (page: Page, i: number, id: string) => page.evaluate(([i, id, list]) => {
    const panes = new Function(`${list} return panes;`)() as HTMLElement[];
    const el = panes[i as number].querySelector(`.react-flow__node[data-id="${id}"]`) as HTMLElement | null;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { l: r.left, t: r.top, w: r.width, h: r.height, zoom: el.offsetWidth ? r.width / el.offsetWidth : 1 };
}, [i, id, PANES] as const);

/** Half a step of the canvas's 16 px grid at the node's zoom, and 1 px: the tolerance S2-R1 and S2-R2 read. */
const tolerance = (zoom: number) => 8 * zoom + 1;
const topLeftAt = (b: { l: number; t: number; zoom: number } | null, p: Pt) => !!b && Math.abs(b.l - p.x) <= tolerance(b.zoom) && Math.abs(b.t - p.y) <= tolerance(b.zoom);

const store = (page: Page) => ev<{ idl: number; undo: number | null }>(page, `const u = (w.statehistory || {})[w.DUser.current];
    return { idl: Object.keys(w.store.getState().idlookup).length, undo: u ? u.undoable.length : null };`, undefined, 0);

/** Wait until neither `idlookup` nor the undo stack has moved for 1200 ms, at most 6 s (the COMMIT tick is 300 ms). */
async function quiet(page: Page) {
    let last = await store(page); let since = Date.now(); const end = Date.now() + 6000;
    while (Date.now() < end && Date.now() - since < 1200) {
        await wait(page, 150); const n = await store(page);
        if (n.idl !== last.idl || n.undo !== last.undo) { since = Date.now(); last = n; }
    }
    return last;
}

/** The first node of pane `i` not in `before`, within 20 s. */
async function newNode(page: Page, i: number, before: string[]) {
    for (let k = 0; k < 66; k++) {
        const id = (await readSplit(page)).panes[i].nodes.find((n) => !before.includes(n));
        if (id) return id;
        await wait(page, 300);
    }
    return null;
}

/** A rail item dragged to `at` (S2's dragTo): one DataTransfer, dragover and drop on the topmost element there. It opens
 *  with the press a real drag starts with: the pane guard holds the click that activated the pane, and consumes a
 *  dragstart until a mousedown closes it (`paneEventVerdict`). */
const dragTo = (page: Page, text: string, at: Pt) => page.evaluate(({ item, text, at }) => {
    const src = [...document.querySelectorAll(item)].find((e) => (e.textContent || '').trim() === text) as HTMLElement | undefined;
    const el = document.elementFromPoint(at.x, at.y);
    if (!src || !el) return null;
    src.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
    src.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, detail: 1 }));
    const dt = new DataTransfer();
    src.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer: dt }));
    const types = [...dt.types];
    const over = new DragEvent('dragover', { bubbles: true, cancelable: true, clientX: at.x, clientY: at.y, dataTransfer: dt });
    el.dispatchEvent(over);
    el.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, clientX: at.x, clientY: at.y, dataTransfer: dt }));
    src.dispatchEvent(new DragEvent('dragend', { bubbles: true, cancelable: true, dataTransfer: dt }));
    return { types, accepted: over.defaultPrevented };
}, { item: ITEMS, text, at });

/** Whether a dragover carrying `key` at `at` is accepted (the pane's `preventDefault`). */
const dragOverAccepted = (page: Page, key: string, at: Pt) => page.evaluate(({ key, at }) => {
    const el = document.elementFromPoint(at.x, at.y);
    if (!el) return null;
    const dt = new DataTransfer();
    dt.setData(key, 'probe');
    const over = new DragEvent('dragover', { bubbles: true, cancelable: true, clientX: at.x, clientY: at.y, dataTransfer: dt });
    el.dispatchEvent(over);
    return over.defaultPrevented;
}, { key, at });

const railTitle = async (page: Page) => (await page.locator(`${RAIL} .palette-onto__title`).allTextContents()).map((t) => t.trim());

async function activate(page: Page, i: number) {
    const p = await emptyPoint(page, i);
    if (!p) throw new Error(`no empty point on pane ${i}`);
    await page.mouse.click(p.x, p.y);
    await wait(page, 700);
    return (await readSplit(page)).panes[i].active;
}

async function shot(page: Page, s: Split, i: number, mark: Pt, path: string) {
    const c = s.panes[i].canvas;
    await page.evaluate((p) => { const d = document.createElement('div'); d.id = 'probe-cursor';
        d.style.cssText = `position:fixed;left:${p.x - 4}px;top:${p.y - 4}px;width:8px;height:8px;border-radius:50%;background:#e11d48;z-index:99999;pointer-events:none`;
        document.body.appendChild(d); }, mark);
    await page.screenshot({ path, clip: { x: Math.max(0, c.left), y: Math.max(0, c.top), width: c.width, height: c.height } });
    await page.evaluate(() => document.getElementById('probe-cursor')?.remove());
}

type Kind = 'class' | 'object';
const ITEM: Record<Kind, string> = { class: 'Class', object: 'Library' };
const TITLE: Record<Kind, string> = { class: 'Elements', object: 'Instances of' };

/** The project imported, the bindings written, the levels if asked, the two viewpoints side by side, the side panel open. */
async function openSplit(browser: Browser, order: [Kind, Kind], withLevels: boolean) {
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
    if (!(await page.locator('.toolbar-viewpoint-trigger:visible:not([disabled])').count())) {
        await ev(page, `const dm = await import('/src/components/abstract/DockManager.tsx'); const m = w.LProject.getProject().models.find((x) => !x.isMetamodel);
            await dm.default.open2(w.LPointerTargetable.fromPointer(m.id)); return 1;`, undefined, 8000);
    }
    await setTheme(page, 'light');

    const ids = await ev<{ model: string; mm: string; vp: Record<string, string> }>(page, `
        const idl = w.store.getState().idlookup; const m = w.LProject.getProject().models.find((x) => !x.isMetamodel);
        const vp = {}; for (const r of Object.values(idl)) if (r && r.className === 'DViewPoint' && a.includes(r.name)) vp[r.name] = r.id;
        return { model: m.id, mm: idl[m.id].instanceof, vp };`, [VP_CLASS, VP_OBJECT], 0);
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
    if (withLevels) for (const [vp, level] of [[VP_CLASS, 'class'], [VP_OBJECT, 'instance']]) {
        await ev(page, `w.LPointerTargetable.fromPointer(a.vp).state = { ontoLevel: a.level }; return 1;`, { vp: ids.vp[vp], level }, 700);
    }

    const name = (k: Kind) => (k === 'class' ? VP_CLASS : VP_OBJECT);
    await pickViewpoint(page, name(order[0]));
    await wait(page, SETTLE_MS);
    await ev(page, `const dm = await import('/src/components/abstract/DockManager.tsx'); dm.default.openModelTabBeside(a.model, a.vp); return 1;`, { model: ids.model, vp: ids.vp[name(order[1])] }, 4000);
    await wait(page, SETTLE_MS);
    if (await page.locator('button[aria-label="Show the side panel"]').count()) {
        await page.locator('button[aria-label="Show the side panel"]').first().click();
        await wait(page, 900);
    }
    return { page, errors };
}

async function scene(browser: Browser, order: [Kind, Kind], out: Record<string, unknown>) {
    const tag = order.join('-');
    const { page, errors } = await openSplit(browser, order, true);
    let s = await readSplit(page);
    const zoomFloor = 1;
    check(`SP-0 [${tag}] two panes in the split, one active, the inset above the snap tolerance`,
        s.count === 2 && s.panes.length === 2 && s.panes.every((p) => p.inSplit) && s.panes.filter((p) => p.active).length === 1 && s.inset / 2 > tolerance(zoomFloor),
        { count: s.count, panes: s.panes.map((p) => ({ active: p.active, left: p.canvas.left, width: p.canvas.width })), inset: s.inset });
    await page.screenshot({ path: `${OUT}/split-${tag}.png` });
    out[`layout-${tag}`] = { inset: s.inset, canvases: s.panes.map((p) => p.canvas) };

    const measures: Record<string, unknown> = {};
    for (const i of [0, 1]) {
        const j = 1 - i;
        const k = order[i];
        const active = await activate(page, i);
        const title = await railTitle(page);
        check(`SP-1 [${tag}] pane ${i} (${k}) active, the palette shows «${TITLE[k]}»`, active && title.includes(TITLE[k]), { active, title });
        await quiet(page);

        // SP-2: the click, at this pane's own centre.
        s = await readSplit(page);
        const last = i === s.panes.length - 1;
        const expected = await centreOf(page, s, i, last ? s.inset : 0);
        const everyPaneFormula = await centreOf(page, s, i, s.inset);
        const before2 = await store(page);
        const nodes2 = s.panes[i].nodes;
        await page.locator(ITEMS, { hasText: new RegExp(`^${ITEM[k]}$`) }).first().click();
        const id2 = await newNode(page, i, nodes2);
        const after2 = await quiet(page);
        const box2 = id2 ? await nodeBox(page, i, id2) : null;
        const still = (await readSplit(page)).panes[i].active;
        check(`SP-2 [${tag}] rail click on pane ${i} (${k}): one node, top-left at the pane's centre (inset ${last ? 'of the side panel' : '0'}), one undo entry`,
            !!id2 && topLeftAt(box2, expected) && (after2.undo ?? 0) - (before2.undo ?? 0) === 1 && still,
            { expected, box: box2, dx: box2 && box2.l - expected.x, dy: box2 && box2.t - expected.y, withFullInset: everyPaneFormula, undo: [before2.undo, after2.undo], stillActive: still });
        await shot(page, s, i, expected, `${OUT}/click-${tag}-pane${i}.png`);

        // SP-3: the drag on the active pane, the positive control of the refusal on this pane.
        const p3 = await emptyPoint(page, i);
        if (!p3) throw new Error(`no empty point on pane ${i} for the drag`);
        const nodes3 = (await readSplit(page)).panes[i].nodes;
        const before3 = await store(page);
        const drag3 = await dragTo(page, ITEM[k], p3);
        const id3 = await newNode(page, i, nodes3);
        const after3 = await quiet(page);
        const box3 = id3 ? await nodeBox(page, i, id3) : null;
        check(`SP-3 [${tag}] rail drag on the active pane ${i} (${k}): one node at the drop point, one undo entry`,
            !!id3 && !!drag3 && drag3.accepted && JSON.stringify(drag3.types) === JSON.stringify([ONTO_KEY]) && topLeftAt(box3, p3) && (after3.undo ?? 0) - (before3.undo ?? 0) === 1,
            { at: p3, drag: drag3, box: box3, undo: [before3.undo, after3.undo] });

        // SP-4: the same rail, dragged on the other pane, the inactive one.
        const p4 = await emptyPoint(page, j);
        if (!p4) throw new Error(`no empty point on pane ${j} for the refused drag`);
        const s4 = await readSplit(page);
        const before4 = await store(page);
        const drag4 = await dragTo(page, ITEM[k], p4);
        await wait(page, 1500);
        const after4 = await quiet(page);
        const s4b = await readSplit(page);
        const added = s4b.panes.map((p, n) => p.nodes.filter((x) => !s4.panes[n].nodes.includes(x)));
        check(`SP-4 [${tag}] rail drag from pane ${i} (${k}) on the inactive pane ${j}: dragover refused, the drop writes nothing`,
            !!drag4 && !drag4.accepted && after4.idl === before4.idl && after4.undo === before4.undo && added.every((a) => a.length === 0) && s4b.panes[i].active,
            { at: p4, drag: drag4, idl: [before4.idl, after4.idl], undo: [before4.undo, after4.undo], added });

        // SP-5: the trunk's rule, the linguistic palette's key beside the rail's.
        const pActive = await emptyPoint(page, i);
        if (!pActive) throw new Error(`no empty point on pane ${i} for dragover`);
        const answers = {
            inactive: { linguistic: await dragOverAccepted(page, LINGUISTIC_KEY, p4), rail: await dragOverAccepted(page, ONTO_KEY, p4) },
            active: { linguistic: await dragOverAccepted(page, LINGUISTIC_KEY, pActive), rail: await dragOverAccepted(page, ONTO_KEY, pActive) },
        };
        check(`SP-5 [${tag}] dragover with pane ${i} active: refused on pane ${j} and accepted on pane ${i}, alike for the linguistic key and the rail's`,
            answers.inactive.linguistic === false && answers.inactive.rail === false && answers.active.linguistic === true && answers.active.rail === true, answers);

        measures[`pane${i}`] = { kind: k, expected, everyPaneFormula, box2, p3, box3, p4, answers };
    }
    out[tag] = measures;
    check(`SP-E [${tag}] page errors []`, errors.length === 0, errors.slice(0, 5));
    await page.context().close();
}

/** SP-6: no level on either viewpoint, both panes offer «Instances of», the drop's own level gate lets it through. */
async function noLevelScene(browser: Browser, out: Record<string, unknown>) {
    const { page, errors } = await openSplit(browser, ['class', 'object'], false);
    const measures: Record<string, unknown> = {};
    for (const i of [0, 1]) {
        const j = 1 - i;
        const active = await activate(page, i);
        await quiet(page);
        const title = await railTitle(page);
        const at = await emptyPoint(page, j);
        if (!at) throw new Error(`no empty point on pane ${j} for the refused drag`);
        const before = await store(page);
        const drag = await dragTo(page, ITEM.object, at);
        await wait(page, 1500);
        const after = await quiet(page);
        measures[`from${i}`] = { active, title, at, drag, idl: [before.idl, after.idl], undo: [before.undo, after.undo] };
        check(`SP-6 [no level] rail drag from pane ${i} on the inactive pane ${j}: dragover refused, the drop writes nothing`,
            active && title.includes(TITLE.object) && !!drag && !drag.accepted && after.idl === before.idl && after.undo === before.undo, measures[`from${i}`]);
    }

    // The control: pane 1 is active after the loop, the same item on it does write.
    const at = await emptyPoint(page, 1);
    if (!at) throw new Error('no empty point on pane 1 for the control');
    const before = await store(page);
    const drag = await dragTo(page, ITEM.object, at);
    for (let k = 0; k < 40 && (await store(page)).idl === before.idl; k++) await wait(page, 300);
    const after = await quiet(page);
    measures.control = { at, drag, idl: [before.idl, after.idl], undo: [before.undo, after.undo] };
    check('SP-6c [no level] the control: the same item dragged on the active pane 1 writes, one undo entry',
        !!drag && drag.accepted && after.idl > before.idl && (after.undo ?? 0) - (before.undo ?? 0) === 1, measures.control);
    out['no-level'] = measures;
    check('SP-E [no level] page errors []', errors.length === 0, errors.slice(0, 5));
    await page.context().close();
}

const browser = await chromium.launch();
const out: Record<string, unknown> = { url: URL, at: new Date().toISOString(), file: FILE };
try {
    if (!existsSync(FILE)) throw new Error(`no exported project at ${FILE}`);
    await scene(browser, ['class', 'object'], out);
    await scene(browser, ['object', 'class'], out);
    await noLevelScene(browser, out);
} catch (e) {
    check('SP-X the probe ran to the end', false, String((e as Error)?.stack ?? e).slice(0, 800));
} finally {
    out.checks = { pass, fail };
    writeFileSync(`${OUT}/onto-split-rail-measures.json`, JSON.stringify(out, null, 2));
    meas('json', `${OUT}/onto-split-rail-measures.json`);
    await browser.close();
}
console.log(`DONE pass=${pass} fail=${fail}`);
process.exit(fail === 0 ? 0 : 1);
