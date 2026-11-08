/**
 * onto-s4-links (P-2026-11-08-2012): acceptance of S4, a link drawn between two instances, on the library of the UML
 * fixture (docs/discovery/discovery_2026-11-08_onto_levels_class_rail_links.md §6, §13; R-OI-5, R-OI-24):
 *   S4-Q6    measure: where `nature`'s node is, and whether it mounts once brought into view;
 *   S4-0     the object viewpoint at `instance`, the bindings written, the fixture's five links drawn as edges;
 *   S4-1     a pair with no association (dune → nature): the drag starts, no menu, nothing written;
 *   S4-2     alice → history with a second association accepting the pair: the menu lists exactly those two;
 *   S4-3     choosing Borrowing: one link, slots in memberEnds order, values alice and history, one undo entry, one edge,
 *            no node;
 *   S4-3b    the new link lives in packagedElements of the Package (R-OI-22), not at the model root;
 *   S4-4     the properties panel of the link names it;
 *   S4-5     Cmd+Z removes the link, its slots and its edge;
 *   S4-6     one match (alice → nature, Magazine to a Publication end through the closure): no menu, one link;
 *   S4-7     history → alice, the drag reversed: the link's ends stay in memberEnds order;
 *   S4-8     save and reload: the links and their edges are there;
 *   S4-9     level `both`: the menu opens, Escape writes nothing; level `class`: no menu, nothing written;
 *   S4-10    the class tab's own edge drag still creates its Generalization, no link;
 *   S4-11    page errors [] and no link warning.
 *
 * Run, from frontend/: node scripts/lane-run.mjs probe <worktree> scripts/probe/onto-s4-links.ts --port <n> --id <Prompt-ID>
 *      UML_FILE  the exported project (default ~/jjodel-demo-exports/uml-s3b/uml-class-object.jjodel)
 *      ONTO_OUT  where the crops go (default ~/.jjodel-lanes/P-2026-11-08-2012/crops)
 */
import { chromium, type Page } from '@playwright/test';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { setTheme, SETTLE_MS } from '../smoke/states.ts';

const URL = (process.env.PROBE_URL || 'http://localhost:3096/').replace(/\/$/, '');
const OUT = (process.env.ONTO_OUT || `${homedir()}/.jjodel-lanes/P-2026-11-08-2012/crops`).replace(/\/$/, '');
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });
process.env.UML_OUT = '/tmp'; process.env.GV_OUT = '/tmp';
const { ev, openPage, pickViewpoint } = await import('./bpmn-lanes-fixture.ts');

const FILE = process.env.UML_FILE || `${homedir()}/jjodel-demo-exports/uml-s3b/uml-class-object.jjodel`;
const VP_OBJECT = 'UML object diagram';
const VP_CLASS = 'UML class diagram';

let pass = 0; let fail = 0;
const check = (name: string, ok: boolean, detail: unknown) => {
    if (ok) pass++; else fail++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  ${JSON.stringify(detail ?? null).slice(0, 900)}`);
};
const meas = (name: string, v: unknown) => console.log(`MEAS  ${name}  ${JSON.stringify(v).slice(0, 1500)}`);
const wait = (page: Page, ms: number) => page.waitForTimeout(ms);
const ACTIVE = '.dock-tabpane-active';
const nodeSel = (id: string) => `${ACTIVE} .react-flow__node[data-id="${id}"]`;
const POPUP = '.edge-type-popup__option';

type Link = { id: string; name: string; classifier: string; slots: Array<{ id: string; df: string[]; val: string[][] }> };
type State = { keys: number; undo: number | null; links: Link[]; inFlight: boolean; classes: Record<string, number> };

const READ = `
    const idl = w.store.getState().idlookup;
    const feat = (o, n) => { for (const vid of (o && o.features) || []) { const v = idl[vid]; if (v && idl[v.instanceof] && idl[v.instanceof].name === n) return v; } return { values: [] }; };
    const meta = (id) => { const o = idl[id]; return o && idl[o.instanceof] && idl[o.instanceof].name; };
    const names = (ids) => ids.map((i) => idl[i] && idl[i].name);
    const objs = Object.values(idl).filter((r) => r && r.className === 'DObject');
    const links = objs.filter((o) => meta(o.id) === 'InstanceSpecification' && meta(feat(o, 'classifier').values[0]) === 'Association').map((o) => ({
        id: o.id, name: o.name, classifier: idl[feat(o, 'classifier').values[0]].name,
        slots: feat(o, 'slots').values.map((s) => ({ id: s, df: names(feat(idl[s], 'definingFeature').values), val: feat(idl[s], 'values').values.map((v) => names(feat(idl[v], 'instance').values)) })),
    }));
    const classes = {}; for (const o of objs) { const m = meta(o.id); classes[m] = (classes[m] || 0) + 1; }
    const h = w.statehistory && w.statehistory[w.DUser.current];
    const inst = await import('/src/components/editor-v2/hooks/instantiate.ts');
    return { keys: Object.keys(idl).length, undo: h ? h.undoable.length : null, links, inFlight: inst.instantiationInFlight(), classes };`;
const read = (page: Page) => ev<State>(page, READ, undefined, 0);

/** No instantiation in flight and the undo length still for 800 ms. */
async function settle(page: Page) {
    let s = await read(page); let since = Date.now(); const end = Date.now() + 8000;
    while (Date.now() < end && (s.inFlight || Date.now() - since < 800)) {
        await wait(page, 150); const n = await read(page);
        if (n.undo !== s.undo || n.keys !== s.keys || n.inFlight) since = Date.now();
        s = n;
    }
    return s;
}

const flow = (page: Page) => page.evaluate((root) => {
    const ids = (sel: string) => [...document.querySelectorAll(`${root} ${sel}`)].map((e) => e.getAttribute('data-id') ?? e.getAttribute('data-testid') ?? '');
    return { nodes: ids('.react-flow__node'), edges: ids('.react-flow__edge') };
}, ACTIVE);

/** The vertex of each named instance that this canvas draws or could draw: `{ name: [vertex ids] }`. */
const verticesOf = (page: Page, names: string[], metaclass = 'InstanceSpecification') => ev<Record<string, string[]>>(page, `
    const idl = w.store.getState().idlookup; const out = {};
    for (const n of a.names) { const o = Object.values(idl).find((r) => r && r.className === 'DObject' && r.name === n && (idl[r.instanceof] || {}).name === a.metaclass); out[n] = o ? Object.values(idl).filter((r) => r && r.model === o.id && /Vertex/.test(r.className)).map((r) => r.id) : []; }
    return out;`, { names, metaclass }, 0);

async function viewportOf(page: Page) {
    return page.evaluate((root) => {
        const flowEl = document.querySelector(`${root} .react-flow`); const vp = flowEl && flowEl.querySelector('.react-flow__viewport');
        if (!flowEl || !vp) return null;
        const m = new DOMMatrixReadOnly(getComputedStyle(vp).transform); const r = flowEl.getBoundingClientRect();
        return { z: m.a, ox: m.e, oy: m.f, left: r.left, top: r.top, w: r.width, h: r.height };
    }, ACTIVE);
}

/** The store layout in force for a vertex. */
const layoutOf = (page: Page, vid: string) => ev<{ x: number; y: number; w: number; h: number }>(page, `
    const st = w.store.getState();
    const lk = (await import('/src/components/editor-v2/viewpoint/layout/vertexLayoutAdapter.ts')).getLayoutKeyOf(st);
    const l = (await import('/src/components/editor-v2/viewpoint/layout/vertexLayout.ts')).readVertexLayout(st.idlookup[a], lk);
    return { x: l.x, y: l.y, w: l.w, h: l.h };`, vid, 0);

/** Pan the pane by dragging it from a free point; returns whether a free point was found. */
async function pan(page: Page, dx: number, dy: number) {
    const from = await page.evaluate((root) => {
        const f = document.querySelector(`${root} .react-flow`); if (!f) return null;
        const r = f.getBoundingClientRect();
        for (let oy = -160; oy <= 160; oy += 20) for (let ox = -200; ox <= 200; ox += 20) {
            const x = r.left + r.width / 2 + ox; const y = r.top + r.height / 2 + oy;
            const h = document.elementFromPoint(x, y);
            if (h && h.classList.contains('react-flow__pane')) return { x, y };
        }
        return null;
    }, ACTIVE);
    if (!from) return false;
    await page.mouse.move(from.x, from.y); await page.mouse.down();
    await page.mouse.move(from.x + dx, from.y + dy, { steps: 8 }); await page.mouse.up();
    await wait(page, 300);
    return true;
}

/** Zoom out on the pane, then pan so that the middle of `vids`' store boxes is in the middle of the canvas. */
async function frame(page: Page, vids: string[]) {
    const boxes: Array<{ x: number; y: number; w: number; h: number }> = [];
    for (const v of vids) boxes.push(await layoutOf(page, v));
    const cx = (Math.min(...boxes.map((b) => b.x)) + Math.max(...boxes.map((b) => b.x + (b.w || 0)))) / 2;
    const cy = (Math.min(...boxes.map((b) => b.y)) + Math.max(...boxes.map((b) => b.y + (b.h || 0)))) / 2;
    for (let i = 0; i < 12; i++) {
        const v = await viewportOf(page);
        if (!v) return false;
        const dx = v.w / 2 - (v.ox + cx * v.z); const dy = v.h / 2 - (v.oy + cy * v.z);
        const mounted = await page.evaluate((sels) => sels.every((s) => !!document.querySelector(s)), vids.map(nodeSel));
        if (mounted && Math.hypot(dx, dy) < 40) return true;
        const step = Math.min(1, 280 / Math.max(1, Math.hypot(dx, dy)));
        if (!(await pan(page, dx * step, dy * step))) return false;
    }
    return page.evaluate((sels) => sels.every((s) => !!document.querySelector(s)), vids.map(nodeSel));
}

type Vertices = Record<string, string[]>;
const mountedVid = async (page: Page, v: Vertices, name: string) =>
    page.evaluate((vs) => vs.find((id) => document.querySelector(`.dock-tabpane-active .react-flow__node[data-id="${id}"]`)) ?? null, v[name] ?? []);

/** An edge drag from a ghost handle of `src` to the nearest handle of `tgt` (S2-L22's gesture). The mouse is left up. */
async function dragEdge(page: Page, src: string, tgt: string) {
    const sb = await page.locator(nodeSel(src)).boundingBox();
    const tb = await page.locator(nodeSel(tgt)).boundingBox();
    if (!sb || !tb) return { connecting: false, started: false, picker: [] as string[], why: 'no box' };
    const ghost = `${nodeSel(src)} .react-flow__handle.source.mm-anchor--ghost-visible`;
    let sh: { x: number; y: number; width: number; height: number } | null = null;
    for (const s of [{ x: sb.x + sb.width / 2, y: sb.y + 3 }, { x: sb.x + sb.width - 3, y: sb.y + sb.height / 2 }, { x: sb.x + sb.width / 2, y: sb.y + sb.height - 3 }, { x: sb.x + 3, y: sb.y + sb.height / 2 }]) {
        await page.mouse.move(s.x, s.y); await wait(page, 400);
        if (await page.locator(ghost).count()) { sh = await page.locator(ghost).first().boundingBox(); if (sh) break; }
    }
    if (!sh) return { connecting: false, started: false, picker: [] as string[], why: 'no ghost handle' };
    const press = { x: sh.x + sh.width / 2, y: sh.y + sh.height / 2 };
    // A drop on a source handle is no connection (strict mode), so the target handles come first.
    const handlesOf = () => page.locator(`${nodeSel(tgt)} .react-flow__handle`).evaluateAll((els) => {
        const at = (e: Element) => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
        const targets = els.filter((e) => e.classList.contains('target'));
        return { targets: targets.length, points: (targets.length ? targets : els).map(at) };
    });
    const handles = (await handlesOf()).points;
    const near = [...handles].sort((a, b) => Math.hypot(a.x - press.x, a.y - press.y) - Math.hypot(b.x - press.x, b.y - press.y))[0] ?? { x: tb.x + tb.width / 2, y: tb.y };
    await page.mouse.move(press.x, press.y); await wait(page, 200);
    await page.locator(ghost).first().dispatchEvent('mousedown', { clientX: press.x, clientY: press.y, button: 0, buttons: 1 });
    let connecting = false;
    for (let i = 1; i <= 12; i++) {
        await page.mouse.move(press.x + (near.x - press.x) * i / 12, press.y + (near.y - press.y) * i / 12); await wait(page, 40);
        if (i === 6) connecting = (await page.locator(`${ACTIVE} .react-flow__connection`).count()) > 0;
    }
    // A node with no edge has its handles only under the pointer: wait for them and aim at the nearest target, as a user does.
    await wait(page, 400);
    const final = await handlesOf();
    if (final.targets > 0) {
        const aim = [...final.points].sort((a, b) => Math.hypot(a.x - near.x, a.y - near.y) - Math.hypot(b.x - near.x, b.y - near.y))[0];
        await page.mouse.move(aim.x, aim.y, { steps: 3 }); await wait(page, 200);
    }
    await page.mouse.up(); await wait(page, 900);
    const picker = await page.locator(POPUP).allInnerTexts();
    return { connecting, started: true, picker: picker.map((t) => t.trim()), why: null as string | null, finalTargets: final.targets };
}

async function crop(page: Page, file: string, rect?: { x: number; y: number; width: number; height: number }) {
    await page.screenshot({ path: `${OUT}/${file}`, ...(rect ? { clip: rect } : {}) });
}

const browser = await chromium.launch();
const out: Record<string, unknown> = { url: URL, at: new Date().toISOString(), file: FILE };
const warnings: string[] = [];
try {
    const { page, errors } = await openPage(browser);
    page.on('console', (m) => { if (m.type() === 'warning' && /\[EditorV2\] link/.test(m.text())) warnings.push(m.text().slice(0, 300)); });
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

    const openObjectTab = async () => {
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
        const fit = page.locator('.toolbar-commands__level:visible'); if (await fit.count()) { await fit.first().click(); await wait(page, 900); }
    };
    await openObjectTab();

    const ids = await ev<{ model: string; mm: string; pkg: string | null; member: string; publication: string; vp: Record<string, string> }>(page, `
        const idl = w.store.getState().idlookup;
        const m = w.LProject.getProject().models.find((x) => !x.isMetamodel);
        const objs = Object.values(idl).filter((r) => r && r.className === 'DObject');
        const by = (n) => objs.find((o) => o.name === n && idl[o.instanceof] && idl[o.instanceof].name === 'Class');
        const holdings = objs.find((o) => o.name === 'Holdings');
        const vp = {}; for (const r of Object.values(idl)) if (r && r.className === 'DViewPoint' && a.includes(r.name)) vp[r.name] = r.id;
        return { model: m.id, mm: idl[m.id].instanceof, pkg: holdings ? idl[holdings.father].father : null, member: by('Member').id, publication: by('Publication').id, vp };`, [VP_OBJECT, VP_CLASS], 0);
    out.ids = ids;

    // The bindings, as onto-s3b-ghost-rows.ts S3b-0 writes them: the `link` record with no value kinds of its own.
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
    if (!written.ok) throw new Error('the bindings did not land: ' + JSON.stringify(written));

    const setLevel = async (vp: string, level: string) => {
        const landed = await ev<unknown>(page, `w.LPointerTargetable.fromPointer(a.vp).state = { ontoLevel: a.level };
            await new Promise((r) => setTimeout(r, 600)); return w.store.getState().idlookup[a.vp]._state.ontoLevel;`, { vp, level }, 0);
        if (landed !== level) throw new Error(`level ${level} did not land: ${String(landed)}`);
    };
    await setLevel(ids.vp[VP_OBJECT], 'instance');
    await settle(page);

    const NAMES = ['alice', 'history', 'dune', 'nature', 'cityLib'];
    const V = await verticesOf(page, NAMES);
    out.vertices = V;

    // ── Q6: where nature's node is ──────────────────────────────────────────────────────────────────────────────────
    {
        const f0 = await flow(page);
        const vp0 = await viewportOf(page);
        const layouts: Record<string, unknown> = {};
        for (const n of NAMES) if (V[n]?.[0]) layouts[n] = await layoutOf(page, V[n][0]);
        const mounted = Object.fromEntries(NAMES.map((n) => [n, (V[n] ?? []).some((v) => f0.nodes.includes(v))]));
        meas('Q6 before any pan', { nodes: f0.nodes.length, edges: f0.edges.length, mounted, viewport: vp0, layouts });
        const natureBox = V.nature?.[0] ? await layoutOf(page, V.nature[0]) : null;
        const inView = natureBox && vp0 ? { sx: vp0.ox + natureBox.x * vp0.z, sy: vp0.oy + natureBox.y * vp0.z, w: vp0.w, h: vp0.h } : null;
        const framed = V.nature?.[0] ? await frame(page, [V.nature[0]]) : false;
        const f1 = await flow(page);
        const natureMounted = (V.nature ?? []).some((v) => f1.nodes.includes(v));
        const after = V.nature?.[0] ? await page.locator(nodeSel(V.nature[0])).boundingBox() : null;
        out.q6 = { projectedBeforePan: inView, framed, natureMounted, box: after, nodes: f1.nodes.length };
        check('S4-Q6 (measure): nature\'s node mounts once its store box is in the middle of the canvas', natureMounted, out.q6);
    }

    // Everything the drags touch has to be mounted at once; zoom out until the five are.
    {
        const v = await viewportOf(page);
        if (v) { await page.mouse.move(v.left + v.w / 2, v.top + v.h / 2); }
        const vids = NAMES.map((n) => V[n]?.[0]).filter(Boolean) as string[];
        for (let i = 0; i < 10; i++) {
            if (await frame(page, vids)) break;
            const f = await viewportOf(page);
            if (f) { await page.mouse.move(f.left + 8, f.top + 8); await page.keyboard.down('Control'); await page.mouse.wheel(0, 240); await page.keyboard.up('Control'); await wait(page, 300); }
        }
    }
    const baseFlow = await flow(page);
    const base = await settle(page);
    const vid = async (n: string) => { const v = await mountedVid(page, V, n); if (!v) throw new Error(`${n} is not mounted`); return v; };
    const scene = { nodes: baseFlow.nodes.length, edges: baseFlow.edges.length, undo: base.undo, links: base.links.length };
    out.scene = scene;
    check('S4-0 at `instance`, the bindings written: five links in the model, the five instances mounted', base.links.length === 5 && NAMES.every((n) => (V[n] ?? []).some((x) => baseFlow.nodes.includes(x))), { ...scene, zoom: (await viewportOf(page))?.z });

    // ── S4-1: no association, no menu, nothing written ──────────────────────────────────────────────────────────────
    {
        const before = await settle(page); const f0 = await flow(page);
        const r = await dragEdge(page, await vid('dune'), await vid('nature'));
        const after = await settle(page); const f1 = await flow(page);
        out.s41 = { r, keys: after.keys - before.keys, undo: (after.undo ?? 0) - (before.undo ?? 0), edges: f1.edges.length - f0.edges.length };
        check('S4-1 dune → nature: the drag starts, no menu, nothing written', r.connecting && r.picker.length === 0 && after.keys === before.keys && after.undo === before.undo, out.s41);
    }

    // ── A second association accepting Member and Publication ───────────────────────────────────────────────────────
    const made = await ev<{ ok: boolean; reason?: unknown; id?: string }>(page, `
        const ca = await import('/src/components/editor-v2/hooks/createAdapter.ts');
        const wait = (ms) => new Promise((r) => setTimeout(r, ms));
        const idl = () => w.store.getState().idlookup;
        const assoc = ca.createInstance(a.model, 'Association', a.pkg, 'packagedElements', { name: 'Reservation' });
        if (!assoc.ok) return { ok: false, reason: assoc.reason };
        await wait(1200);
        const end1 = ca.createInstance(a.model, 'Property', assoc.id, 'memberEnds', { name: 'reserver', type: a.member });
        await wait(1200);
        const end2 = ca.createInstance(a.model, 'Property', assoc.id, 'memberEnds', { name: 'reserved', type: a.publication });
        await wait(1200);
        return { ok: !!end1.ok && !!end2.ok, id: assoc.id, reason: [end1.reason, end2.reason] };`, { model: ids.model, pkg: ids.pkg, member: ids.member, publication: ids.publication }, 0);
    if (!made.ok) throw new Error('Reservation did not land: ' + JSON.stringify(made));
    await settle(page);

    // ── S4-2 and S4-3: the menu, then one link ──────────────────────────────────────────────────────────────────────
    const flowCounts = async () => { const f = await flow(page); return { nodes: f.nodes.length, edges: f.edges.length, ids: f.edges }; };
    const undoBeforeLink = await settle(page);
    const f2 = await flowCounts();
    const alice = await vid('alice'); const history = await vid('history');
    const r2 = await dragEdge(page, alice, history);
    out.s42 = r2;
    await crop(page, 'menu.png');
    const wanted = ['New Borrowing', 'New Reservation'];
    check('S4-2 alice → history: the menu lists the two associations accepting the pair, no other', r2.connecting && JSON.stringify(r2.picker) === JSON.stringify(wanted), r2);
    const borrowingIndex = r2.picker.indexOf('New Borrowing');
    let linkId: string | null = null;
    if (borrowingIndex >= 0) {
        await page.locator(POPUP).nth(borrowingIndex).click();
        const t0 = Date.now();
        let f = await flowCounts();
        while (f.edges - 0 === f2.edges && Date.now() - t0 < 4000) { await wait(page, 100); f = await flowCounts(); }
        const drawnAfterMs = Date.now() - t0;
        const after = await settle(page);
        const f3 = await flowCounts();
        const added = after.links.filter((l) => !undoBeforeLink.links.some((b) => b.id === l.id));
        const link = added[0];
        linkId = link?.id ?? null;
        const slots = link ? link.slots.map((s) => `${s.df[0]}=${s.val.flat().join()}`) : [];
        out.s43 = { added: added.length, classifier: link?.classifier, slots, undo: (after.undo ?? 0) - (undoBeforeLink.undo ?? 0), edges: f3.edges - f2.edges, nodes: f3.nodes - f2.nodes, drawnAfterMs, edgeIsLink: !!linkId && f3.ids.some((e) => e.includes(linkId!)) };
        check('S4-3 one Borrowing link, slots borrower=alice loans=history in memberEnds order, one undo entry, one edge, no node',
            added.length === 1 && link.classifier === 'Borrowing' && JSON.stringify(slots) === JSON.stringify(['borrower=alice', 'loans=history']) && after.undo === (undoBeforeLink.undo ?? 0) + 1 && f3.edges === f2.edges + 1 && f3.nodes === f2.nodes, out.s43);
        await crop(page, 'edge.png');
        // A contained object's father is the slot that holds it, whose father is the owner.
        const placed = await ev<{ slot: string | null; owner: string | null; held: boolean }>(page, `const l = w.store.getState().idlookup; const v = l[l[a].father]; const ref = v && l[v.instanceof]; const o = v && l[v.father]; const m = o && l[o.instanceof]; return { slot: ref ? ref.name : (v ? v.className : null), owner: m ? m.name : null, held: !!v && (v.values || []).includes(a) };`, linkId, 0);
        out.s43placed = placed;
        check('S4-3b the new link lives in packagedElements of the Package (R-OI-22), not at the model root', placed.slot === 'packagedElements' && placed.owner === 'Package' && placed.held, placed);

        // ── S4-4: the properties panel of the link ──────────────────────────────────────────────────────────────────
        const edgeBox = await page.evaluate((id) => { const g = [...document.querySelectorAll(`.dock-tabpane-active .react-flow__edge[data-id*="${id}"] path`)].sort((x, y) => (y as SVGPathElement).getTotalLength() - (x as SVGPathElement).getTotalLength())[0] as SVGPathElement | undefined; if (!g) return null; const p = g.getPointAtLength(g.getTotalLength() / 2); const b = g.getBBox(); const r = g.getBoundingClientRect(); return { x: r.left + (p.x - b.x) * (b.width ? r.width / b.width : 1), y: r.top + (p.y - b.y) * (b.height ? r.height / b.height : 1) }; }, linkId);
        if (edgeBox) { await page.mouse.click(edgeBox.x, edgeBox.y); await wait(page, 900); }
        const selected = await ev<unknown>(page, `const s = w.store.getState()._lastSelected; return s ? { el: s.modelElement, name: (w.store.getState().idlookup[s.modelElement] || {}).name } : null;`, undefined, 0);
        const panelText = await page.evaluate(() => [...document.querySelectorAll('.dock-tabpane-active, .property-bar, [class*="properties"], [class*="Properties"]')].map((e) => (e as HTMLElement).innerText || '').join(' ').slice(0, 20000));
        out.s44 = { edgeBox, selected, mentionsBorrower: /borrower/.test(panelText), mentionsLoans: /loans/.test(panelText), name: link?.name };
        await crop(page, 'link-properties.png');
        meas('S4-4 (crop, read by the lane)', out.s44);

        // ── S4-5: undo ──────────────────────────────────────────────────────────────────────────────────────────────
        await page.mouse.move(10, 10);
        const u0 = await settle(page); const fu0 = await flowCounts();
        await page.keyboard.press('Meta+z'); await wait(page, 1200);
        const u1 = await settle(page); const fu1 = await flowCounts();
        out.s45 = { links: u1.links.length - u0.links.length, keys: u1.keys - undoBeforeLink.keys, undo: (u1.undo ?? 0) - (u0.undo ?? 0), edges: fu1.edges - fu0.edges, slotsLeft: u1.classes.Slot - undoBeforeLink.classes.Slot, valuesLeft: u1.classes.InstanceValue - undoBeforeLink.classes.InstanceValue };
        check('S4-5 Cmd+Z removes the link, its two slots, its values and its edge', u1.links.length === undoBeforeLink.links.length && u1.classes.Slot === undoBeforeLink.classes.Slot && u1.classes.InstanceValue === undoBeforeLink.classes.InstanceValue && fu1.edges === fu0.edges - 1, out.s45);
    }

    // ── S4-6: one match, no menu ────────────────────────────────────────────────────────────────────────────────────
    {
        const before = await settle(page); const f0 = await flowCounts();
        const r = await dragEdge(page, await vid('alice'), await vid('nature'));
        const after = await settle(page); const f1 = await flowCounts();
        const added = after.links.filter((l) => !before.links.some((b) => b.id === l.id));
        out.s46 = { r, added: added.map((l) => [l.classifier, l.slots.map((s) => `${s.df[0]}=${s.val.flat().join()}`)]), undo: (after.undo ?? 0) - (before.undo ?? 0), edges: f1.edges - f0.edges };
        check('S4-6 alice → nature (Magazine, a Publication end through the closure): no menu, one Reservation, one undo entry, one edge',
            r.picker.length === 0 && added.length === 1 && added[0].classifier === 'Reservation' && after.undo === (before.undo ?? 0) + 1 && f1.edges === f0.edges + 1, out.s46);
    }

    // ── S4-7: the drag reversed keeps memberEnds order ──────────────────────────────────────────────────────────────
    {
        const before = await settle(page); const f0 = await flowCounts();
        const r = await dragEdge(page, await vid('history'), await vid('alice'));
        const pick = r.picker.indexOf('New Borrowing');
        if (pick >= 0) await page.locator(POPUP).nth(pick).click();
        const after = await settle(page); const f1 = await flowCounts();
        const added = after.links.filter((l) => !before.links.some((b) => b.id === l.id));
        const slots = added[0] ? added[0].slots.map((s) => `${s.df[0]}=${s.val.flat().join()}`) : [];
        out.s47 = { r, slots, undo: (after.undo ?? 0) - (before.undo ?? 0), edges: f1.edges - f0.edges };
        check('S4-7 history → alice: the slots stay borrower=alice loans=history', pick >= 0 && JSON.stringify(slots) === JSON.stringify(['borrower=alice', 'loans=history']) && f1.edges === f0.edges + 1, out.s47);
    }

    // ── S4-9: `both` and `class` (before the reload: the viewpoint's level persists with it, S4-8 reads `instance`) ────
    {
        await setLevel(ids.vp[VP_OBJECT], 'both');
        await settle(page);
        const before = await settle(page);
        const r = await dragEdge(page, await vid('alice'), await vid('history'));
        await page.keyboard.press('Escape'); await wait(page, 500);
        const after = await settle(page);
        out.s49both = { picker: r.picker, keys: after.keys - before.keys, undo: (after.undo ?? 0) - (before.undo ?? 0), popup: await page.locator(POPUP).count() };
        check('S4-9a level `both`: the same menu; Escape closes it and writes nothing', JSON.stringify(r.picker) === JSON.stringify(wanted) && after.keys === before.keys && after.undo === before.undo, out.s49both);

        await setLevel(ids.vp[VP_OBJECT], 'class');
        await settle(page);
        const before2 = await settle(page);
        const f0 = await flowCounts();
        const present = await mountedVid(page, V, 'alice') && await mountedVid(page, V, 'history');
        const r2c = present ? await dragEdge(page, await vid('alice'), await vid('history')) : { connecting: false, started: false, picker: [] as string[], why: 'unmounted at class' };
        const after2 = await settle(page); const f1 = await flowCounts();
        out.s49class = { r: r2c, keys: after2.keys - before2.keys, undo: (after2.undo ?? 0) - (before2.undo ?? 0), edges: f1.edges - f0.edges, present: !!present };
        check('S4-9b level `class`: no menu, nothing written', r2c.picker.length === 0 && after2.keys === before2.keys && after2.undo === before2.undo, out.s49class);
        await setLevel(ids.vp[VP_OBJECT], 'instance');
        await settle(page);
    }

    // ── S4-8: save and reload ───────────────────────────────────────────────────────────────────────────────────────
    {
        const before = await settle(page);
        const expected = before.links.map((l) => l.id).sort();
        await ev(page, `const api = await import('/src/api/persistance/projects.ts'); await api.ProjectsApi.save(w.LProject.getProject(), { silent: true }); return 1;`, undefined, 1500);
        await openObjectTab();
        const after = await settle(page);
        const again = after.links.map((l) => l.id).sort();
        const vids = NAMES.map((n) => V[n]?.[0]).filter(Boolean) as string[];
        await frame(page, vids);
        await wait(page, 800);
        const f = await flowCounts();
        const newOnes = expected.filter((id) => !base.links.some((b) => b.id === id));
        out.s48 = { expected: expected.length, again: again.length, same: JSON.stringify(expected) === JSON.stringify(again), newOnes, drawn: newOnes.filter((id) => f.ids.some((e) => e.includes(id))), edges: f.edges };
        check('S4-8 save and reload: every link is there and the new links draw as edges', JSON.stringify(expected) === JSON.stringify(again) && newOnes.length > 0 && newOnes.every((id) => f.ids.some((e) => e.includes(id))), out.s48);
    }

    // ── S4-10: the class tab's edge drag ────────────────────────────────────────────────────────────────────────────
    {
        await pickViewpoint(page, VP_CLASS);
        await wait(page, SETTLE_MS);
        const fit = page.locator('.toolbar-commands__level:visible'); if (await fit.count()) { await fit.first().click(); await wait(page, 900); }
        const C = await verticesOf(page, ['Book', 'Library'], 'Class');
        const framed = await frame(page, [C.Book?.[0], C.Library?.[0]].filter(Boolean) as string[]);
        const before = await settle(page); const f0 = await flowCounts();
        const src = await mountedVid(page, C, 'Book'); const tgt = await mountedVid(page, C, 'Library');
        const r = src && tgt ? await dragEdge(page, src, tgt) : { connecting: false, started: false, picker: [] as string[], why: 'not mounted' };
        const after = await settle(page); const f1 = await flowCounts();
        out.s410 = { framed, r, generalizations: (after.classes.Generalization ?? 0) - (before.classes.Generalization ?? 0), links: after.links.length - before.links.length, instances: (after.classes.InstanceSpecification ?? 0) - (before.classes.InstanceSpecification ?? 0), undo: (after.undo ?? 0) - (before.undo ?? 0), edges: f1.edges - f0.edges };
        check('S4-10 class tab, Book → Library: the drag creates one Generalization and no link, as before', r.connecting && after.classes.Generalization === before.classes.Generalization + 1 && after.links.length === before.links.length && after.classes.InstanceSpecification === before.classes.InstanceSpecification, out.s410);
    }

    out.errors = errors.slice(0, 10);
    out.warnings = warnings.slice(0, 10);
    check('S4-11 page errors [] and no link warning', errors.length === 0 && warnings.length === 0, { errors: errors.slice(0, 5), warnings: warnings.slice(0, 5) });
    await page.context().close();
} catch (e) {
    fail++;
    console.log(`FAIL  the run threw: ${String((e as Error).stack ?? e).slice(0, 900)}`);
} finally {
    writeFileSync(`${OUT}/onto-s4-links.json`, JSON.stringify(out, null, 1));
    await browser.close();
}
console.log(`RESULT  ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
