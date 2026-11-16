/**
 * onto-mlm (P-2026-11-16-0430, multilevel L4, R-OI-31): the acceptance of multilevel instantiation on the clabject
 * fixture's export (mlm-clabject-fixture.ts), imported in a fresh browser context, light theme.
 *
 * Source: docs/discovery/discovery_2026-11-16_onto_multilevel_level_potency.md §3.4, §6 item 4. Checks:
 *   M0  an unset EInt reads `undefined` through the reader (Book, DVD, mobyDick potency; isbn's feature potency), after
 *       the round trip of the export, and the reader derives the potencies 1, 1, 0 from it;
 *   M1  `mobyDick` (potency 0) is absent from the rail, the pane menu and the node menu («New instance») under the
 *       default viewpoint (`both`) and under each level viewpoint;
 *   M2  the rail and the pane menu offer, per level: 0 no clabject (the linguistic Elements), 1 ProductType, 2 Book
 *       and DVD, `both` all three;
 *   M3  at level 1, «Instances of ▸ ProductType» (a rail click) creates a clabject of ProductType with exactly one slot,
 *       taxRate;
 *   M4  one Cmd+Z after it removes it whole: the clabjects and the idlookup size as before the click;
 *   M5  at level 2, «New instance» on Book's node creates an instance of Book with the slots isbn and price, no taxRate;
 *   M6  one Cmd+Z after it removes it whole;
 *   M7  a slot one level off (a hand-made slot of price on Book) shows as an orphan row whose tooltip reads
 *       «price is due 1 level below Book»;
 *   M8  the ghost rows of a clabject land under its slots compartment: a field weight^1 : Integer added to ProductType
 *       gives DVD and Book a ghost row `weight =` in the compartment of their slot rows, below every slot row (whether a
 *       field row sits between, the ghost anchor of §7 Q9, is a measure);
 *   M9  page errors [] and no `[EditorV2] instantiate:` warning.
 * Crops into MLM_CROPS: the three level viewpoints on the canvas, Book with its slot, the instance of Book with its two.
 *
 * Run:  node frontend/scripts/lane-run.mjs probe ~/jjodel-w-oi-ml frontend/scripts/probe/onto-mlm.ts \
 *         --port 3143 --id P-2026-11-16-0430
 * Env:  MLM_FILE   the export (default ~/jjodel-demo-exports/mlm-clabject/mlm-clabject.jjodel)
 *       MLM_CROPS  the crops (default /tmp/onto-mlm)
 */
import { chromium, type Page } from '@playwright/test';
import { mkdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { setTheme, SETTLE_MS } from '../smoke/states.ts';

const URL = (process.env.PROBE_URL || 'http://localhost:3143/').replace(/\/$/, '');
if (/:300[01]$/.test(URL)) throw new Error('never 3000 or 3001');
const FILE = process.env.MLM_FILE || `${homedir()}/jjodel-demo-exports/mlm-clabject/mlm-clabject.jjodel`;
const CROPS = (process.env.MLM_CROPS || '/tmp/onto-mlm').replace(/\/$/, '');
mkdirSync(CROPS, { recursive: true });
// bpmn-lanes-fixture reads GV_OUT at load: keep its folder out of the tree.
process.env.GV_OUT = CROPS;
const { ev, openPage, pickViewpoint } = await import('./bpmn-lanes-fixture.ts');

let pass = 0; let fail = 0;
const check = (name: string, ok: boolean, detail: unknown) => {
    if (ok) pass++; else fail++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  ${JSON.stringify(detail).slice(0, 1500)}`);
};
const meas = (name: string, v: unknown) => console.log(`MEAS  ${name}  ${JSON.stringify(v).slice(0, 1500)}`);
const wait = (page: Page, ms: number) => page.waitForTimeout(ms);
const J = (v: unknown) => JSON.stringify(v);

const VP = { 0: 'MLM / level 0', 1: 'MLM / level 1', 2: 'MLM / level 2' } as const;
const MENU = '.context-menu-backdrop ~ .context-menu';
const ITEM = '.palette-onto__item';

/** The model's root clabjects (type, slot features by name), the idlookup size and the user's undo stack. */
const CENSUS = `
    const inst = await import('/src/components/editor-v2/hooks/instantiate.ts');
    const idl = w.store.getState().idlookup; const get = (id) => idl[id]; const view = inst.ontoReadView(get); const rec = inst.objectRecord(get, a);
    const nm = (id) => (idl[id] || {}).name ?? id;
    const clabjects = [];
    for (const id of idl[a].objects || []) { const o = idl[id]; if (!o || nm(o.instanceof) !== 'Clabject') continue;
        clabjects.push({ id, name: o.name, type: view.referenceTargets(id, rec.typeReference).map(nm)[0] ?? null,
            slots: view.referenceTargets(id, rec.slotContainer).map((s) => nm(view.referenceTargets(s, rec.definingFeature)[0])) }); }
    const u = w.statehistory && w.statehistory[w.DUser.current];
    return { clabjects, idl: Object.keys(idl).length, undo: u ? u.undoable.length : null };`;
type Clab = { id: string; name: string; type: string | null; slots: string[] };
type Census = { clabjects: Clab[]; idl: number; undo: number | null };
const census = (page: Page, model: string) => ev<Census>(page, CENSUS, model, 0);

const history = (page: Page) => ev<{ user: number | null }>(page, `const u = (w.statehistory || {})[w.DUser.current]; return { user: u ? u.undoable.length : null };`, undefined, 0);
/** Until the user's undo stack has not grown for 800 ms (the COMMIT tick is 300 ms), at most 4 s (onto-s2-instantiate). */
async function settle(page: Page) {
    let h = await history(page); let since = Date.now(); const end = Date.now() + 4000;
    while (Date.now() < end && Date.now() - since < 800) {
        await wait(page, 150); const n = await history(page);
        if (n.user !== h.user) since = Date.now();
        h = n;
    }
    return h;
}

/** A new clabject of type `type` with at least `slots` slots, at most 12 s. */
async function waitClabject(page: Page, model: string, before: Census, type: string, slots: number) {
    const known = new Set(before.clabjects.map((c) => c.id));
    for (let i = 0; i < 40; i++) {
        const c = await census(page, model);
        const made = c.clabjects.find((x) => !known.has(x.id) && x.type === type);
        if (made && made.slots.length >= slots) { await wait(page, 1500); return { made: (await census(page, model)).clabjects.find((x) => x.id === made.id) ?? made, c }; }
        await wait(page, 300);
    }
    const c = await census(page, model);
    return { made: c.clabjects.find((x) => !known.has(x.id) && x.type === type) ?? null, c };
}

/** One Cmd+Z on a focused, idle canvas (no pane click: its deselect writes an entry, onto-s2-instantiate S2-3). */
async function undoOnce(page: Page, model: string, before: Census, made: string | null) {
    await page.evaluate(() => (document.querySelector('.editor-v2') as HTMLElement | null)?.focus());
    const pre = await settle(page);
    await page.keyboard.press('Meta+z');
    await wait(page, 1200);
    const now = await census(page, model);
    const ids = (c: Census) => J(c.clabjects.map((x) => x.id).sort());
    return { whole: ids(now) === ids(before) && now.idl === before.idl, gone: !now.clabjects.some((x) => x.id === made),
        idlBefore: before.idl, idlAfter: now.idl, undoBefore: before.undo, undoAtPress: pre.user, undoAfter: now.undo };
}

/** Drag the pane until the nodes `sel` matches sit, as one box, in the canvas's visible part: the run of points whose
 *  topmost element is the flow's renderer, so the tips card, the conformance bar and the rail are left out
 *  (onto-s3b-ghost-rows.ts bringIntoView, on the union of the nodes). */
async function bringIntoView(page: Page, sel: string) {
    for (let i = 0; i < 4; i++) {
        const g = await page.evaluate((s) => {
            const els = Array.from(document.querySelectorAll(s)); const flow = document.querySelector('.dock-tabpane-active .react-flow');
            if (!els.length || !flow) return null;
            const rs = els.map((e) => e.getBoundingClientRect());
            const n = { left: Math.min(...rs.map((r) => r.left)), right: Math.max(...rs.map((r) => r.right)), top: Math.min(...rs.map((r) => r.top)), bottom: Math.max(...rs.map((r) => r.bottom)) };
            const p = flow.getBoundingClientRect();
            const vw = Math.min(p.right, window.innerWidth); const vh = Math.min(p.bottom, window.innerHeight);
            const inFlow = (x: number, y: number) => { const h = document.elementFromPoint(x, y); return !!h && !!h.closest('.dock-tabpane-active .react-flow__renderer'); };
            const longest = (from: number, to: number, at: (v: number) => boolean) => { let best: [number, number] = [from, from]; let start: number | null = null;
                for (let v = from; v <= to; v += 10) { if (at(v)) { if (start === null) start = v; if (v - start > best[1] - best[0]) best = [start, v]; } else start = null; }
                return best; };
            const [x0, x1] = longest(p.left + 5, vw - 5, (x) => inFlow(x, (p.top + vh) / 2));
            const [y0, y1] = longest(p.top + 5, vh - 5, (y) => inFlow((x0 + x1) / 2, y));
            const fits = n.right - n.left <= x1 - x0 - 40 && n.bottom - n.top <= y1 - y0 - 40;
            const inside = n.left >= x0 + 20 && n.right <= x1 - 20 && n.top >= y0 + 20 && n.bottom <= y1 - 20;
            const dx = (x0 + x1) / 2 - (n.left + n.right) / 2; const dy = (y0 + y1) / 2 - (n.top + n.bottom) / 2;
            let from = null;
            const xs: number[] = []; for (let v = x0 + 20; v < x1 - 20; v += 30) xs.push(v); if (dx < 0) xs.reverse();
            const ys: number[] = []; for (let v = y0 + 20; v < y1 - 20; v += 30) ys.push(v); if (dy < 0) ys.reverse();
            for (const gy of ys) for (const gx of xs) {
                if (from) break;
                const ex = Math.max(x0 + 10, Math.min(x1 - 10, gx + dx)); const ey = Math.max(y0 + 10, Math.min(y1 - 10, gy + dy));
                const hit = document.elementFromPoint(gx, gy);
                if (hit && hit.classList.contains('react-flow__pane') && Math.hypot(ex - gx, ey - gy) >= 0.9 * Math.min(Math.hypot(dx, dy), 300)) from = { x: gx, y: gy, ex, ey };
            }
            return { inside, fits, from, area: { x0, x1, y0, y1 } };
        }, sel);
        if (!g || g.inside || !g.from) return g;
        await page.mouse.move(g.from.x, g.from.y); await page.mouse.down();
        await page.mouse.move(g.from.ex, g.from.ey, { steps: 12 }); await page.mouse.up();
        await wait(page, 500);
    }
    return null;
}

const NODES = '.dock-tabpane-active .react-flow__node';
const nodeSel = (vid: string) => `${NODES}[data-id="${vid}"]`;

/** Zoom to 100%, then zoom out until every node of the canvas sits in its visible part (the toolbar has no fit). */
async function fit(page: Page) {
    const f = page.locator('.toolbar-commands__level:visible');
    if (await f.count()) { await f.first().click(); await wait(page, 600); }
    for (let i = 0; i < 4; i++) {
        const g = await bringIntoView(page, NODES);
        if (!g || g.inside) return g;
        const out = page.locator('.dock-tabpane-active button[title="Zoom out"]:visible, button[title="Zoom out"]:visible');
        if (!(await out.count())) return g;
        await out.first().click(); await wait(page, 500);
    }
    return bringIntoView(page, NODES);
}

/** The vertex of `objectId` in the active graph. */
const vertexOf = (page: Page, objectId: string) => ev<string | null>(page, `const idl = w.store.getState().idlookup;
    const v = Object.values(idl).find((r) => r && r.model === a && /Vertex/.test(r.className || '')
        && document.querySelector('.dock-tabpane-active .react-flow__node[data-id="' + r.id + '"]'));
    return v ? v.id : null;`, objectId, 0);

const closeMenu = async (page: Page) => {
    await page.keyboard.press('Escape');
    await page.evaluate(() => (document.querySelector('.context-menu-backdrop') as HTMLElement | null)?.click());
    await wait(page, 300);
};

/** A point of the active canvas whose topmost element is the pane itself (onto-s2-instantiate). */
const emptyPanePoint = (page: Page) => page.evaluate(() => {
    const pane = document.querySelector('.dock-tabpane-active .react-flow__pane') as HTMLElement | null;
    if (!pane) return null;
    const r = pane.getBoundingClientRect();
    for (const fy of [0.9, 0.8, 0.7, 0.55, 0.4]) for (const fx of [0.92, 0.85, 0.75, 0.65, 0.5]) {
        const x = Math.round(r.left + r.width * fx); const y = Math.round(r.top + r.height * fy);
        const el = document.elementFromPoint(x, y);
        if (el && el.classList.contains('react-flow__pane')) return { x, y };
    }
    return null;
});

/** The pane menu's cascade labels (empty when there is no cascade). */
async function cascade(page: Page) {
    const at = await emptyPanePoint(page);
    if (!at) return { at, parent: null, labels: [] as string[] };
    await page.mouse.click(at.x, at.y);
    await wait(page, 200);
    await page.mouse.click(at.x, at.y, { button: 'right' });
    await wait(page, 500);
    const parent = page.locator(MENU).first().locator('.context-menu__item--cascade').first();
    const label = (await parent.count()) ? (await parent.innerText()).trim() : null;
    if (await parent.count()) { await parent.hover(); await wait(page, 400); }
    const labels = (await page.locator(MENU).count()) > 1 ? (await page.locator(MENU).nth(1).locator('.context-menu__item').allInnerTexts()).map((t) => t.trim()) : [];
    await closeMenu(page);
    return { at, parent: label, labels };
}

/** The node menu of a vertex, its labels; the menu stays open when `keep`. */
async function nodeMenu(page: Page, vertexId: string | null, keep = false) {
    if (!vertexId) return null;
    const seen = await bringIntoView(page, nodeSel(vertexId));
    const bb = await page.locator(nodeSel(vertexId)).first().boundingBox();
    if (!bb) return null;
    // A point of the node's own box whose topmost element is the node, read from the DOM, not a fixed point.
    const pick = await page.evaluate(({ id, b }) => {
        for (const fy of [0.5, 0.3, 0.7, 0.15, 0.85]) for (const fx of [0.5, 0.3, 0.7]) {
            const x = Math.round(b.x + b.width * fx); const y = Math.round(b.y + b.height * fy);
            const el = document.elementFromPoint(x, y);
            if (el && el.closest('.react-flow__node')?.getAttribute('data-id') === id) return { x, y, hit: null as string | null };
        }
        const x = Math.round(b.x + b.width / 2); const y = Math.round(b.y + b.height / 2); const el = document.elementFromPoint(x, y) as HTMLElement | null;
        return { x, y, hit: el ? `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 60)} in ${el.closest('.react-flow__node')?.getAttribute('data-id') ?? 'no node'}` : null };
    }, { id: vertexId, b: bb });
    const at = { x: pick.x, y: pick.y }; const hit = pick.hit ?? 'the node';
    if (pick.hit) meas('node hidden', { vertexId, at, hit, box: bb, seen });
    await page.mouse.click(at.x, at.y, { button: 'right' });
    await wait(page, 600);
    const items = (await page.locator(MENU).first().locator('.context-menu__item').allInnerTexts()).map((t) => t.trim());
    if (items.length === 0) meas('node menu empty', { vertexId, at, hit, box: bb, menus: await page.locator('.context-menu').count() });
    if (!keep) await closeMenu(page);
    return items;
}

const railItems = (page: Page) => page.locator(`.dock-tabpane-active ${ITEM}`).allInnerTexts().then((t) => t.map((x) => x.trim()));

/** The node's rows: text, ghost, orphan, tooltip, feature, box, and the index of the compartment that holds it. */
const nodeRows = (page: Page, vid: string) => page.evaluate((id) => {
    const el = document.querySelector(`.dock-tabpane-active .react-flow__node[data-id="${id}"]`);
    if (!el) return null;
    const comps = Array.from(el.querySelectorAll('.ir-compartment'));
    const n = el.getBoundingClientRect();
    return { box: { x: n.x, y: n.y, w: n.width, h: n.height }, rows: Array.from(el.querySelectorAll('.ir-row')).map((x) => {
        const r = x.getBoundingClientRect();
        return { text: (x as HTMLElement).innerText.replace(/\s+/g, ' ').trim().slice(0, 60), ghost: x.classList.contains('ir-row--ghost'),
            orphan: x.classList.contains('ir-row--orphan'), title: x.getAttribute('title'), feature: x.getAttribute('data-feature'),
            top: Math.round(r.top), bottom: Math.round(r.bottom), comp: comps.indexOf(x.closest('.ir-compartment') as Element) };
    }) };
}, vid);

async function cropBox(page: Page, file: string, box: { x: number; y: number; w: number; h: number } | null, pad = 24) {
    if (!box) return;
    const vp = page.viewportSize() ?? { width: 1440, height: 900 };
    const x = Math.max(0, box.x - pad); const y = Math.max(0, box.y - pad);
    await page.screenshot({ path: `${CROPS}/${file}`, clip: { x, y, width: Math.min(vp.width - x, box.w + 2 * pad), height: Math.min(vp.height - y, box.h + 2 * pad) } });
}

const browser = await chromium.launch();
try {
    const { page, errors } = await openPage(browser);
    const warnings: string[] = [];
    page.on('console', (m) => { if (/\[EditorV2\] instantiate:/.test(m.text())) warnings.push(m.text().slice(0, 300)); });
    await page.context().addInitScript(() => { localStorage.setItem('jjodel_welcome_3_1_1_seen', '1'); });
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
    await page.addStyleTag({ content: '.notification-widget, .notification-content, .donation-banner, .tips-card { pointer-events: none !important; display: none !important; }' }).catch(() => {});
    if (!(await page.locator('.toolbar-viewpoint-trigger:visible:not([disabled])').count())) {
        await ev(page, `const dm = await import('/src/components/abstract/DockManager.tsx'); const m = w.LProject.getProject().models.find((x) => !x.isMetamodel);
            await dm.default.open2(w.LPointerTargetable.fromPointer(m.id)); return 1;`, undefined, 8000);
    }
    await setTheme(page, 'light');
    await ev(page, `const j = await import('/src/joiner/index.ts'); j.SetRootFieldAction.new('advanced', true); w.advanced = true;
        localStorage.setItem('jjodel.interfaceMode', 'advanced'); return 1;`, undefined, 1200);

    // ── The ids, by name ───────────────────────────────────────────────────────────────────────────────────────────
    const ids = await ev<{ model: string; mm: string; o: Record<string, string>; vps: string[] }>(page, `
        const idl = w.store.getState().idlookup; const m = w.LProject.getProject().models.find((x) => !x.isMetamodel);
        const o = {}; for (const id of Object.keys(idl)) { const r = idl[id]; if (r && r.className === 'DObject' && r.name) o[r.name] = id; }
        const vps = Object.values(idl).filter((r) => r && r.className === 'DViewPoint').map((r) => r.name);
        return { model: m.id, mm: idl[m.id].instanceof, o, vps };`, undefined, 0);
    meas('ids', ids);
    const o = ids.o;

    // ── M0: an unset EInt ──────────────────────────────────────────────────────────────────────────────────────────
    const m0 = await ev<Record<string, unknown>>(page, `
        const br = await import('/src/model/ontological/bindingReader.ts'); const inst = await import('/src/components/editor-v2/hooks/instantiate.ts');
        const idl = w.store.getState().idlookup; const get = (id) => idl[id]; const view = inst.ontoReadView(get); const rec = inst.objectRecord(get, a.model);
        const read = (id, role) => { const v = view.attributeValue(id, role); return v === undefined ? 'undefined' : v; };
        const raw = (id, role) => { for (const vid of idl[id].features || []) { const v = idl[vid]; if (v && v.instanceof === role) return v.values; } return 'no slot'; };
        return { read: { Book: read(a.o.Book, rec.potency), DVD: read(a.o.DVD, rec.potency), mobyDick: read(a.o.mobyDick, rec.potency),
                ProductType: read(a.o.ProductType, rec.potency), isbn: read(a.o.isbn, rec.featurePotency), price: read(a.o.price, rec.featurePotency) },
            raw: { Book: raw(a.o.Book, rec.potency), isbn: raw(a.o.isbn, rec.featurePotency) },
            derived: { Book: br.clabjectPotency(view, rec, a.o.Book), DVD: br.clabjectPotency(view, rec, a.o.DVD), mobyDick: br.clabjectPotency(view, rec, a.o.mobyDick) } };`,
        { model: ids.model, o }, 0);
    meas('unset EInt', m0);
    const rd = m0.read as Record<string, unknown>;
    check('M0 an unset EInt reads undefined (Book, DVD, mobyDick potency; isbn feature potency), the written ones 2; potencies derived 1, 1, 0',
        rd.Book === 'undefined' && rd.DVD === 'undefined' && rd.mobyDick === 'undefined' && rd.isbn === 'undefined' && rd.ProductType === 2 && rd.price === 2
        && J(m0.derived) === J({ Book: 1, DVD: 1, mobyDick: 0 }), m0);

    // ── M1, M2: the surfaces at every level, and the crops of the level viewpoints ───────────────────────────────────
    await page.locator('.toolbar-viewpoint-trigger:not([disabled])').first().click();
    await wait(page, 400);
    const vpOptions = (await page.locator('.toolbar-viewpoint-menu__option').allInnerTexts()).map((t) => t.trim());
    await page.keyboard.press('Escape');
    await wait(page, 300);
    const defaultVp = vpOptions.find((t) => !/^MLM \//.test(t)) ?? null;
    meas('viewpoint options', { vpOptions, defaultVp });
    const surfaces: Record<string, { rail: string[]; pane: string[]; mobyMenu: string[] | null; bookMenu: string[] | null }> = {};
    for (const [key, name] of [['both', defaultVp], ['0', VP[0]], ['1', VP[1]], ['2', VP[2]]] as const) {
        if (!name) continue;
        await pickViewpoint(page, name);
        await wait(page, SETTLE_MS);
        await fit(page);
        if (key !== 'both') {
            const pane = await page.locator('.dock-tabpane-active').first().boundingBox();
            if (pane) await cropBox(page, `level-${key}.png`, { x: pane.x, y: pane.y, w: pane.width, h: pane.height }, 0);
        }
        const rail = await railItems(page);
        const pane = (await cascade(page)).labels;
        const mobyMenu = await nodeMenu(page, await vertexOf(page, o.mobyDick));
        const bookMenu = await nodeMenu(page, await vertexOf(page, o.Book));
        surfaces[key] = { rail, pane, mobyMenu, bookMenu };
    }
    meas('surfaces', surfaces);
    const levels = Object.keys(surfaces); // integer-like keys come first: '0', '1', '2', 'both'
    check('M1 mobyDick (potency 0) is absent from the rail, the pane menu and its node menu at both and levels 0, 1, 2',
        J([...levels].sort()) === J(['0', '1', '2', 'both']) && levels.every((k) => !surfaces[k].rail.includes('mobyDick') && !surfaces[k].pane.includes('mobyDick')
            && !!surfaces[k].mobyMenu && surfaces[k].mobyMenu!.length > 0 && !surfaces[k].mobyMenu!.includes('New instance')),
        Object.fromEntries(levels.map((k) => [k, { rail: surfaces[k].rail, pane: surfaces[k].pane, mobyMenu: surfaces[k].mobyMenu }])));
    const objects = (k: string) => surfaces[k]?.rail.filter((t) => ['ProductType', 'Book', 'DVD', 'mobyDick'].includes(t)) ?? null;
    const paneClabjects = (k: string) => surfaces[k]?.pane.filter((t) => ['ProductType', 'Book', 'DVD', 'mobyDick'].includes(t)) ?? null;
    // Level 0 is the class level: its rail and pane menu are the linguistic Elements (Clabject, Field), no clabject.
    check('M2 per level, rail and pane menu: 0 no clabject, 1 ProductType, 2 Book and DVD, both all three',
        J(objects('0')) === '[]' && J(paneClabjects('0')) === '[]'
        && J(objects('1')) === '["ProductType"]' && J(surfaces['1']?.pane) === '["ProductType"]'
        && J(objects('2')) === '["Book","DVD"]' && J(surfaces['2']?.pane) === '["Book","DVD"]'
        && J([...(objects('both') ?? [])].sort()) === '["Book","DVD","ProductType"]' && J([...(surfaces.both?.pane ?? [])].sort()) === '["Book","DVD","ProductType"]',
        Object.fromEntries(levels.map((k) => [k, { rail: objects(k), pane: surfaces[k].pane }])));

    // ── M3, M4: level 1, «Instances of ▸ ProductType» ───────────────────────────────────────────────────────────────
    await pickViewpoint(page, VP[1]);
    await wait(page, SETTLE_MS);
    await fit(page);
    const bookV = await vertexOf(page, o.Book);
    if (bookV) await bringIntoView(page, nodeSel(bookV));
    await cropBox(page, 'book-slot.png', bookV ? (await nodeRows(page, bookV))?.box ?? null : null);
    const c3 = await census(page, ids.model);
    const item = page.locator(`.dock-tabpane-active ${ITEM}`, { hasText: /^\s*ProductType\s*$/ }).first();
    const clicked = (await item.count()) > 0;
    if (clicked) await item.click();
    const r3 = await waitClabject(page, ids.model, c3, 'ProductType', 1);
    meas('level 1 creation', { clicked, made: r3.made, entries: r3.c.undo !== null && c3.undo !== null ? r3.c.undo - c3.undo : null });
    check('M3 level 1: the rail\'s ProductType creates a clabject of ProductType with exactly one slot, taxRate',
        clicked && !!r3.made && J(r3.made.slots) === '["taxRate"]', r3.made);
    const u4 = await undoOnce(page, ids.model, c3, r3.made?.id ?? null);
    check('M4 one Cmd+Z after it removes it whole (clabjects and idlookup size as before the click)', !!r3.made && u4.whole && u4.gone, u4);

    // ── M5, M6: level 2, «New instance» on Book ─────────────────────────────────────────────────────────────────────
    await pickViewpoint(page, VP[2]);
    await wait(page, SETTLE_MS);
    await fit(page);
    const c5 = await census(page, ids.model);
    const items5 = await nodeMenu(page, await vertexOf(page, o.Book), true);
    const hasNew = !!items5 && items5.includes('New instance');
    if (hasNew) await page.locator(`${MENU} .context-menu__item`, { hasText: /^New instance$/ }).first().click();
    else await closeMenu(page);
    const r5 = await waitClabject(page, ids.model, c5, 'Book', 2);
    meas('level 2 creation', { items5, made: r5.made });
    check('M5 level 2: «New instance» on Book makes an instance of Book with the slots isbn and price, no taxRate',
        hasNew && !!r5.made && J(r5.made.slots) === '["isbn","price"]', r5.made);
    if (r5.made) {
        const v5 = await vertexOf(page, r5.made.id);
        if (v5) await bringIntoView(page, nodeSel(v5));
        await cropBox(page, 'book-instance.png', v5 ? (await nodeRows(page, v5))?.box ?? null : null);
    }
    const u6 = await undoOnce(page, ids.model, c5, r5.made?.id ?? null);
    check('M6 one Cmd+Z after it removes it whole', !!r5.made && u6.whole && u6.gone, u6);

    // ── M7: a slot one level off ────────────────────────────────────────────────────────────────────────────────────
    await pickViewpoint(page, VP[1]);
    await wait(page, SETTLE_MS);
    await fit(page);
    const orphan = await ev<{ ok: boolean; id: string | null; reason?: string }>(page, `const ca = await import('/src/components/editor-v2/hooks/createAdapter.ts');
        const r = ca.createInstance(a.model, 'Slot', a.book, 'slots', {});
        await new Promise((res) => setTimeout(res, 700));
        if (r.ok && r.id) w.LPointerTargetable.fromPointer(r.id).$field.values = [a.price];
        return { ok: r.ok, id: r.id, reason: r.reason };`, { model: ids.model, book: o.Book, price: o.price }, 1500);
    const rows7 = bookV ? await nodeRows(page, bookV) : null;
    const orphanRow = rows7?.rows.find((r) => r.orphan);
    meas('orphan', { orphan, rows: rows7?.rows });
    check('M7 a slot of price on Book is an orphan row reading «price is due 1 level below Book»',
        orphan.ok && !!orphanRow && orphanRow.title === 'price is due 1 level below Book', { orphan, row: orphanRow ?? null });

    // ── M8: the ghost rows under the slots compartment ──────────────────────────────────────────────────────────────
    const weight = await ev<{ ok: boolean; id: string | null; reason?: string }>(page, `const ca = await import('/src/components/editor-v2/hooks/createAdapter.ts');
        const r = ca.createInstance(a.model, 'Field', a.pt, 'fields', { name: 'weight' });
        await new Promise((res) => setTimeout(res, 700));
        if (r.ok && r.id) { const f = w.LPointerTargetable.fromPointer(r.id); f.$type.values = [a.int]; f.$potency.value = 1; }
        return { ok: r.ok, id: r.id, reason: r.reason };`, { model: ids.model, pt: o.ProductType, int: o.Integer }, 1500);
    const ghostOn = async (key: string) => {
        const v = await vertexOf(page, o[key]);
        const rs = v ? await nodeRows(page, v) : null;
        const ghost = rs?.rows.find((r) => r.ghost && r.feature === weight.id) ?? null;
        // A field row reads `name^p : type` or `name : type`; every other real row is a slot (`field = value`, trimmed).
        const fieldRows = rs?.rows.filter((r) => !r.ghost && / : /.test(r.text)) ?? [];
        const slotRows = rs?.rows.filter((r) => !r.ghost && !/ : /.test(r.text)) ?? [];
        const under = !!ghost && slotRows.length > 0 && slotRows.every((s) => s.comp === ghost.comp && ghost.top >= s.bottom - 1);
        const fieldBetween = !!ghost && fieldRows.some((f) => f.top >= Math.max(...slotRows.map((s) => s.bottom)) - 1 && f.bottom <= ghost.top + 1);
        return { under, fieldBetween, ghost, rows: rs?.rows ?? null };
    };
    const g8 = { DVD: await ghostOn('DVD'), Book: await ghostOn('Book') };
    meas('ghost rows', { weight, g8 });
    meas('ghost anchor (§7 Q9): a field row between the slots and the ghost', { DVD: g8.DVD.fieldBetween, Book: g8.Book.fieldBetween });
    check('M8 a field weight^1 on ProductType gives DVD and Book a ghost row weight = in their slots compartment, below every slot row',
        weight.ok && g8.DVD.under && g8.Book.under && /^weight =/.test(g8.DVD.ghost?.text ?? ''), { DVD: g8.DVD.ghost, Book: g8.Book.ghost });
    if (bookV) await bringIntoView(page, nodeSel(bookV));
    await cropBox(page, 'ghost-rows.png', bookV ? (await nodeRows(page, bookV))?.box ?? null : null);

    check('M9 page errors [] and no [EditorV2] instantiate: warning', errors.length === 0 && warnings.length === 0, { errors: errors.slice(0, 5), warnings: warnings.slice(0, 5) });
} catch (e) {
    fail++;
    console.log(`FAIL  scene  ${String((e as Error)?.stack || e).slice(0, 1200)}`);
} finally {
    await browser.close();
    console.log(`DONE pass=${pass} fail=${fail}`);
    process.exitCode = fail ? 1 : 0;
}
