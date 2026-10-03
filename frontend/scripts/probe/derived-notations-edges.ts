/**
 * derived-notations-edges probe (P-2026-10-03-1304, Phase 1 of the derived notations edges discovery).
 *
 * Question: what the derived notations draw for edges, anchors, shapes and layout on the demo exports,
 * in numbers: the bends and the diagonal runs of every edge, the side of a bar each end lands on, the
 * crossings, the ends that share a point on a junction diamond, the transitions with no label, the
 * event nodes and the space they take, the entry arrowhead, the compartment rows with no value.
 *
 * Drives the real app on its own dev server (never 3001). For each scene of DNE_SCENES (the demo
 * exports, read only), in a fresh context: import, open the M1, write the simulation binding as
 * Apply writes it (so the dialog's prefill is the binder's), derive each notation through the
 * notations module the dialog calls (`dialogPrefill` + `createDerivedViewpoint`), activate it, then
 * measure twice: at rest (the stored positions) and after one click on the toolbar's Auto layout.
 * The ELK input of that click is captured by wrapping `layout` on the very elkjs instance
 * elkLayout.ts imports (this page only, no file touched), so the layout variants of question 8 run
 * offline on the exact graph (DNE_VARIANTS=1, elkjs in node).
 *
 * Run:  ~/.local/bin/node frontend/scripts/lane-run.mjs probe <worktree> \
 *         frontend/scripts/probe/derived-notations-edges.ts --port 3023 [--id <Prompt-ID>]
 * Env:  DNE_SCENES  directory of the exports (default ~/jjodel-demo-exports)
 *       DNE_ONLY    comma list of scene keys (petri, flowB, pest, esm; default all)
 *       DNE_OUT     JSON output (default /tmp/dnotC/probe.json)
 *       DNE_CROPS   crop directory (default frontend/scripts/smoke/_tmp_dnotC_crops, gitignored)
 *       DNE_TAG     label of the run in crop names (default before)
 *       DNE_COMPARE <before.json>,<after.json>: the default panes compared (PASS when identical) and the
 *                   acceptance numbers of every pane, before then after (P-2026-10-03-1304 Phase 2)
 */
import { chromium, type Page } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { seed, setTheme } from '../smoke/states.ts';

const URL = (process.env.PROBE_URL || 'http://localhost:3023/').replace(/\/$/, '');
if (/:3001$/.test(URL)) throw new Error('never 3001');
const SCENES_DIR = process.env.DNE_SCENES || `${process.env.HOME}/jjodel-demo-exports`;
const ONLY = (process.env.DNE_ONLY || '').split(',').filter(Boolean);
const OUT = process.env.DNE_OUT || '/tmp/dnotC/probe.json';
const TAG = process.env.DNE_TAG || 'before';
const CROPS = (process.env.DNE_CROPS || new globalThis.URL('../smoke/_tmp_dnotC_crops/', import.meta.url).pathname).replace(/\/$/, '');
mkdirSync(CROPS, { recursive: true });
mkdirSync(OUT.replace(/\/[^/]*$/, ''), { recursive: true });

let pass = 0; let fail = 0;
const check = (name: string, ok: boolean, detail: unknown) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  ${JSON.stringify(detail).slice(0, 1500)}`); if (ok) pass++; else fail++; };
const meas = (name: string, v: unknown) => console.log(`MEAS  ${name}  ${typeof v === 'string' ? v : JSON.stringify(v).slice(0, 4000)}`);

const SCENES = [
    { key: 'petri', file: 'scene_2_DemoPetri.jjodel', profile: 'petri', notations: ['petriClassic', 'petri'] },
    { key: 'flowB', file: 'scene_4_DemoFlowB.jjodel', profile: 'flowchart', notations: ['activityUml'] },
    { key: 'pest', file: 'scene_1_DemoPEST.jjodel', profile: 'stateMachine', notations: ['statechart'] },
    { key: 'esm', file: 'scene_3_DemoESM.jjodel', profile: 'stateMachine', notations: ['statechart'] },
].filter((s) => !ONLY.length || ONLY.includes(s.key));

const wait = (page: Page, ms: number) => page.waitForTimeout(ms);
const paneSel = (m1: string) => `[id="${m1}"].dock-tabpane-active`;

async function importScene(page: Page, file: string): Promise<{ project: string | null; models: Array<{ id: string; name: string; meta: boolean }> }> {
    await page.goto(`${URL}/#/allProjects`, { waitUntil: 'domcontentloaded', timeout: 300000 });
    await wait(page, 5000);
    const text = readFileSync(`${SCENES_DIR}/${file}`, 'utf8');
    const project = await page.evaluate(`(async () => {
      const api = await import('/src/api/persistance/projects.ts');
      const count = () => JSON.parse(localStorage.getItem('projects') || '[]').length;
      const before = count();
      await api.ProjectsApi.importFromText(${JSON.stringify(text)});
      for (let i = 0; i < 75 && count() <= before; i++) await new Promise(r => setTimeout(r, 200));
      const a = JSON.parse(localStorage.getItem('projects') || '[]');
      return a.length > before ? a[a.length - 1].id : null;
    })()`) as string | null;
    if (!project) return { project, models: [] };
    await page.goto(`${URL}/#/project?id=${project}`, { waitUntil: 'domcontentloaded', timeout: 300000 });
    await wait(page, 9000);
    await page.addStyleTag({ content: '.notification-widget, .notification-content, .donation-banner { pointer-events: none !important; display: none !important; }' }).catch(() => {});
    const models = await page.evaluate(`(async () => {
      const j = await import('/src/joiner/index.ts');
      const pr = j.L.fromPointer(j.DUser.current).project;
      return [...(pr.metamodels || []).map(m => ({ id: m.id, name: m.name, meta: true })), ...(pr.models || []).filter(m => !m.isMetamodel).map(m => ({ id: m.id, name: m.name, meta: false }))];
    })()`) as Array<{ id: string; name: string; meta: boolean }>;
    return { project, models };
}

async function openModel(page: Page, id: string) {
    await page.evaluate(`(async () => { const j = await import('/src/joiner/index.ts'); const dm = await import('/src/components/abstract/DockManager.tsx'); await dm.default.open2(j.LModel.fromPointer(${JSON.stringify(id)})); })()`).catch(() => {});
    await wait(page, 4000);
    await page.evaluate((x: string) => {
        const b = [...document.querySelectorAll('.dock-tab-btn')].find((e) => e.id.endsWith(`-tab-${x}`)) as HTMLElement | undefined;
        b?.click();
    }, id);
    await wait(page, 4000);
}

/** The simulation binding as Apply writes it, then the dialog's prefill and `createDerivedViewpoint`. */
async function derive(page: Page, mm: string, profile: string, notation: string) {
    return page.evaluate(async ([x, prof, n]: string[]) => {
        // A computed specifier: the page resolves it, the scripts' type check does not try to.
        const load = (p: string): Promise<any> => import(p);
        const [pb, sp, ms, rc, dv, nt] = await Promise.all([
            load('/src/model/simulation/profileBinder.ts'), load('/src/model/simulation/simProfiles.ts'), load('/src/components/editor-v2/sim/metamodelSketch.ts'),
            load('/src/model/simulation/roleCatalog.ts'), load('/src/utils/deriveViewpoint.ts'), load('/src/components/editor-v2/viewpoint/derive/notations.ts')]);
        const w = window as any;
        const b = pb.bindProfile(sp.systemProfile(prof), ms.sketchOfMetamodel(w.windoww.store.getState().idlookup, x));
        const out: Record<string, unknown> = { simProfile: prof };
        for (const d of rc.ROLE_CATALOG) { const v = (b as any)[d.id]; if (d.key && v?.status === 'bound') out[d.key] = v.value; }
        w.LPointerTargetable.fromPointer(x).state = out;
        await new Promise((r) => setTimeout(r, 1200));
        const s = w.windoww.store.getState();
        const pre = nt.dialogPrefill(s.idlookup, x, n as any, dv.projectViewpointIds());
        const vp = dv.createDerivedViewpoint(x, { notation: n as any, classRoles: pre.roles }) as any;
        await new Promise((r) => setTimeout(r, 1500));
        const L = w.windoww.store.getState().idlookup;
        const roles = Object.fromEntries(Object.entries(pre.roles).map(([k, v]) => [L[k]?.name ?? k, v]));
        const views = Object.values(L).filter((d: any) => d?.className === 'DViewElement' && d.ir?.generated && (d.father === vp?.id || d.viewpoint === vp?.id))
            .map((d: any) => ({ name: d.name, ir: d.ir }));
        return { vp: vp?.id ?? null, from: pre.from, roles, bag: out, views };
    }, [mm, profile, notation]);
}

const activate = async (page: Page, vp: string | null) => {
    await page.evaluate(async (x: string | null) => { const load = (p: string): Promise<any> => import(p); const m = await load('/src/utils/lastViewpoint.ts'); m.activateViewpoint(x); }, vp);
    await wait(page, 3000);
};

async function fit(page: Page, m1: string) {
    const b = page.locator(`${paneSel(m1)} .react-flow__controls-fitview`).first();
    if (await b.count()) { await b.click(); await wait(page, 1500); }
}

/** The ELK wrapper, on the module instance elkLayout.ts imports: records every input graph and output. */
async function installWrapper(page: Page) {
    return page.evaluate(async () => {
        const w = window as any;
        if (w.__dneWrapped) return { ok: true, again: true };
        const src = await (await fetch('/src/components/editor-v2/utils/elkLayout.ts')).text();
        const m = src.match(/from\s+["']([^"']*elkjs[^"']*)["']/);
        if (!m) return { ok: false, why: 'no elkjs import in the served elkLayout.ts' };
        const mod = await import(m[1]);
        let proto = mod.default.prototype; let owner: any = null;
        while (proto) { if (Object.prototype.hasOwnProperty.call(proto, 'layout')) { owner = proto; break; } proto = Object.getPrototypeOf(proto); }
        if (!owner) return { ok: false, why: 'no layout on the prototype chain' };
        const orig = owner.layout;
        w.__dneCaps = [];
        owner.layout = async function (graph: any, ...rest: any[]) {
            const input = JSON.parse(JSON.stringify(graph));
            const out = await orig.call(this, graph, ...rest);
            w.__dneCaps.push({ input, out: JSON.parse(JSON.stringify(out)) });
            return out;
        };
        w.__dneWrapped = true;
        return { ok: true, url: m[1] };
    });
}

/** Everything the questions need from the active pane, in flow coordinates. */
async function measure(page: Page, m1: string) {
    return page.evaluate((sel: string) => {
        const pane = document.querySelector(sel);
        if (!pane) return { error: 'no pane ' + sel } as any;
        const vp = pane.querySelector('.react-flow__viewport') as HTMLElement | null;
        const mt = vp ? getComputedStyle(vp).transform : 'none';
        const mm = mt.match(/matrix\(([^)]+)\)/);
        const zoom = mm ? Number(mm[1].split(',')[0]) : 1;
        const w = window as any;
        const idl = w.windoww.store.getState().idlookup;
        const nameOfObj = (oid: string | null) => { try { return oid ? String(w.LPointerTargetable.fromPointer(oid)?.name ?? '') : ''; } catch { return ''; } };
        const nodes = [...pane.querySelectorAll('.react-flow__node')].map((el) => {
            const h = el as HTMLElement;
            const t = h.style.transform.match(/translate\(\s*(-?[\d.]+)px\s*,\s*(-?[\d.]+)px\s*\)/);
            const id = h.getAttribute('data-id')!;
            const d = idl[id];
            const objId = d?.className === 'DObject' ? id : (d?.model ?? d?.data ?? null);
            const obj = idl[objId];
            const c = h.querySelector('.ir-node-content') as HTMLElement | null;
            const r = h.getBoundingClientRect();
            const entry = h.querySelector('.ir-entry-svg');
            const rows = [...h.querySelectorAll('.ir-compartment .ir-row')].map((x) => (x.textContent ?? '').trim());
            const ir = c ? c.getBoundingClientRect() : null;
            // Q3: the vertex as stored (numbers and key names), to show a turn saves nothing on it.
            const stored = d ? Object.fromEntries(Object.keys(d).sort().filter((k) => typeof d[k] !== 'object' || d[k] === null).map((k) => [k, d[k]])) : null;
            return {
                inkCl: ir ? { left: ir.left, top: ir.top, width: ir.width, height: ir.height } : null, stored,
                id, objId, x: t ? Number(t[1]) : NaN, y: t ? Number(t[2]) : NaN, w: h.offsetWidth, h: h.offsetHeight,
                cl: { left: r.left, top: r.top },
                name: nameOfObj(objId) || (h.textContent ?? '').trim().slice(0, 30),
                cls: obj?.className === 'DObject' ? idl[obj.instanceof]?.name ?? null : null,
                form: (c?.className.match(/ir-shape--(\w+)/) ?? [])[1] ?? null,
                text: (h.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 60),
                rows,
                entry: entry ? [...entry.querySelectorAll('path, circle')].map((p) => ({ tag: p.tagName, d: p.getAttribute('d'), fill: p.getAttribute('fill'), stroke: p.getAttribute('stroke') })) : null,
                handles: [...h.querySelectorAll('.react-flow__handle.mm-anchor--connected')].map((x) => {
                    const hr = x.getBoundingClientRect();
                    return { id: x.getAttribute('data-handleid'), type: x.classList.contains('source') ? 'source' : 'target', cx: hr.left + hr.width / 2, cy: hr.top + hr.height / 2 };
                }),
            };
        });
        const ox = nodes.map((n) => n.cl.left - zoom * n.x); const oy = nodes.map((n) => n.cl.top - zoom * n.y);
        const med = (v: number[]) => { const s = [...v].sort((p, q) => p - q); return s[Math.floor(s.length / 2)] ?? 0; };
        const OX = med(ox); const OY = med(oy);
        const spread = Math.max(0, ...ox.map((v) => Math.abs(v - OX)), ...oy.map((v) => Math.abs(v - OY)));
        const fx = (x: number) => Math.round(((x - OX) / zoom) * 100) / 100;
        const fy = (y: number) => Math.round(((y - OY) / zoom) * 100) / 100;
        for (const n of nodes as any[]) {
            n.handles = n.handles.map((hh: any) => ({ id: hh.id, type: hh.type, x: fx(hh.cx), y: fy(hh.cy) }));
            n.ink = n.inkCl ? { x: fx(n.inkCl.left), y: fy(n.inkCl.top), w: n.inkCl.width / zoom, h: n.inkCl.height / zoom } : null;
            delete n.cl; delete n.inkCl;
        }
        // The labels a node paints outside its box (a classic Petri transition's name), in flow units.
        const outsideLabels = [...pane.querySelectorAll('.react-flow__node .ir-label--outside')].map((el) => {
            const r = el.getBoundingClientRect();
            return { node: el.closest('.react-flow__node')?.getAttribute('data-id') ?? null, text: (el.textContent ?? '').trim(), x: fx(r.left), y: fy(r.top), w: r.width / zoom, h: r.height / zoom };
        });
        // The SVG of the edges is in flow coordinates already (inside the viewport transform).
        const markerSummary = (ref: string | null) => {
            const id = ref?.match(/url\(#([^)]+)\)/)?.[1];
            const mk = id ? document.getElementById(id) : null;
            return mk ? { id, inner: [...mk.querySelectorAll('*')].map((x) => `${x.tagName}[fill=${x.getAttribute('fill')}]`).join(' ') } : null;
        };
        const edges = [...pane.querySelectorAll('g.react-flow__edge')].map((g) => {
            const id = g.getAttribute('data-id')!;
            const al = g.getAttribute('aria-label') ?? '';
            const st = al.match(/^Edge from (.+) to (.+)$/);
            const paths = [...g.querySelectorAll('path')] as SVGPathElement[];
            const vis = paths.filter((p) => {
                const cs = getComputedStyle(p);
                return p.getAttribute('d') && cs.stroke !== 'none' && cs.visibility !== 'hidden' && Number(cs.strokeOpacity) > 0 && Number(cs.opacity) > 0
                    && !p.classList.contains('react-flow__edge-interaction') && Number(cs.strokeWidth.replace('px', '')) < 6;
            });
            const main = vis.find((p) => p.getAttribute('marker-end')) ?? vis[0];
            const sample = (p: SVGPathElement) => {
                const L = p.getTotalLength();
                const n = Math.max(2, Math.ceil(L / 2));
                const pts: number[][] = [];
                for (let i = 0; i <= n; i++) { const q = p.getPointAtLength((L * i) / n); pts.push([Math.round(q.x * 100) / 100, Math.round(q.y * 100) / 100]); }
                return pts;
            };
            return {
                id, source: st?.[1] ?? null, target: st?.[2] ?? null,
                d: main?.getAttribute('d') ?? null, pts: main ? sample(main) : [],
                paths: vis.map((p) => ({ d: p.getAttribute('d'), cls: p.getAttribute('class'), markerEnd: p.getAttribute('marker-end'), markerStart: p.getAttribute('marker-start') })),
                markerEnd: markerSummary(main?.getAttribute('marker-end') ?? null),
                polygons: [...g.querySelectorAll('polygon')].map((p) => p.getAttribute('points')),
            };
        });
        const labels = [...pane.querySelectorAll('.react-flow__edgelabel-renderer .edge-label, .react-flow__edgelabel-renderer .edge-end-label, .react-flow__edgelabel-renderer .edge-cardinality')].map((el) => {
            const span = (el.querySelector('.edge-label__text') as HTMLElement | null) ?? (el as HTMLElement);
            const r = span.getBoundingClientRect();
            const vis = (span as any).checkVisibility ? (span as any).checkVisibility({ opacityProperty: true, visibilityProperty: true }) : true;
            // What paints on top at the label's centre: the label itself, or a node over it.
            const top = r.width > 0 ? document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2) : null;
            const covered = top && !span.contains(top) && top !== span ? (top.closest('.react-flow__node')?.getAttribute('data-id') ?? top.className?.toString().slice(0, 40) ?? top.tagName) : null;
            return { kind: [...el.classList].filter((c) => c.startsWith('edge-')).join('.'), text: (span.textContent ?? '').trim(), visible: vis && r.width > 0, covered, x: fx(r.left), y: fy(r.top), w: r.width / zoom, h: r.height / zoom };
        });
        // Q7: the event objects of the model (the tree lists a model's objects, never the canvas: TreeViewContent buildInstanceForest).
        const events = { inModel: Object.values(idl).filter((d: any) => d?.className === 'DObject' && idl[d.instanceof]?.name === 'Event').length };
        return { zoom, calib: { OX, OY, spread }, nodes, edges, labels, events, outsideLabels };
    }, paneSel(m1));
}

async function clickLayout(page: Page, m1: string) {
    const btn = page.locator(`${paneSel(m1)} .toolbar-btn[title="Auto layout"]`).first();
    if (!(await btn.count())) return 'no button';
    if (await btn.isDisabled()) return 'disabled';
    const before = await page.evaluate(() => (window as any).__dneCaps?.length ?? 0);
    await btn.click();
    await wait(page, 3000);
    const after = await page.evaluate(() => (window as any).__dneCaps?.length ?? 0);
    return after - before;
}

async function crop(page: Page, m1: string, name: string) {
    const file = `${CROPS}/${name}.png`;
    const clip = await page.evaluate((sel: string) => {
        const pane = document.querySelector(sel)!;
        const rf = pane.querySelector('.react-flow')!.getBoundingClientRect();
        const els = [...pane.querySelectorAll('.react-flow__node, g.react-flow__edge path, .react-flow__edgelabel-renderer .edge-label__text, .react-flow__edgelabel-renderer .edge-end-label')];
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        for (const e of els) { const r = e.getBoundingClientRect(); if (!r.width && !r.height) continue; x0 = Math.min(x0, r.left); y0 = Math.min(y0, r.top); x1 = Math.max(x1, r.right); y1 = Math.max(y1, r.bottom); }
        x0 = Math.max(rf.left, x0 - 24); y0 = Math.max(rf.top, y0 - 24); x1 = Math.min(rf.right, x1 + 24); y1 = Math.min(rf.bottom, y1 + 24);
        return { x: x0, y: y0, width: Math.max(10, x1 - x0), height: Math.max(10, y1 - y0) };
    }, paneSel(m1));
    await page.evaluate(() => { const st = document.createElement('style'); st.id = '__dneShot'; st.textContent = '.properties-tree-overlay, .react-flow__minimap, .react-flow__controls { visibility: hidden !important; }'; document.head.appendChild(st); });
    await wait(page, 150);
    await page.screenshot({ path: file, clip });
    await page.evaluate(() => document.getElementById('__dneShot')?.remove());
    try { execFileSync('sips', ['-Z', '900', file, '--out', file.replace(/\.png$/, '_900.png')], { stdio: 'ignore' }); } catch { /* sips absent */ }
    return file;
}

/** A close-up of every entry mark (`.ir-entry-svg`) with its node and the edge leaving it, for the visual check. */
async function cropEntries(page: Page, m1: string, name: string) {
    const clips = await page.evaluate((sel: string) => [...document.querySelectorAll(`${sel} .ir-entry-svg`)].map((svg) => {
        const node = svg.closest('.react-flow__node')!.getBoundingClientRect();
        const r = svg.getBoundingClientRect();
        const x0 = Math.min(node.left, r.left) - 16, y0 = Math.min(node.top, r.top) - 16;
        return { x: x0, y: y0, width: Math.max(node.right, r.right) + 48 - x0, height: Math.max(node.bottom, r.bottom) + 16 - y0 };
    }), paneSel(m1));
    const files: string[] = [];
    for (const [i, clip] of clips.entries()) {
        const file = `${CROPS}/${name}_entry${i}.png`;
        await page.screenshot({ path: file, clip });
        try { execFileSync('sips', ['-Z', '600', file, '--out', file.replace(/\.png$/, '_600.png')], { stdio: 'ignore' }); } catch { /* sips absent */ }
        files.push(file);
    }
    return files;
}

/**
 * Q3 (a): on the first bar of the pane, what the hit test, the selection ring and the hover answer, against the ink.
 * A point inside the node's box and outside its ink (when the box is larger) must not hit the node; the ring is the
 * ink's outline; hovering that point shows no ghost handle, hovering the ink near a long side shows one on it.
 */
async function barChecks(page: Page, m1: string) {
    const geo = await page.evaluate((sel: string) => {
        const pane = document.querySelector(sel)!;
        const ink = pane.querySelector('.react-flow__node .ir-node-content.ir-shape--bar') as HTMLElement | null;
        if (!ink) return null;
        const node = ink.closest('.react-flow__node') as HTMLElement;
        const b = node.getBoundingClientRect(), r = ink.getBoundingClientRect();
        const off = [b.left + 3, b.top + 3];
        const offInk = off[0] < r.left || off[0] > r.right || off[1] < r.top || off[1] > r.bottom;
        return { id: node.getAttribute('data-id'), box: [b.left, b.top, b.width, b.height], ink: [r.left, r.top, r.width, r.height], off: offInk ? off : null };
    }, paneSel(m1));
    if (!geo) return null;
    const at = (x: number, y: number) => page.evaluate(([px, py, id]: any[]) => {
        const e = document.elementFromPoint(px, py);
        if (!e) return 'none';
        if (e.closest('.react-flow__node')?.getAttribute('data-id') === id) return 'node';
        // Q3: an SVG element's className is an SVGAnimatedString; say what it is, and the edge it belongs to.
        const cls = typeof (e as any).className === 'string' ? (e as any).className : (e as any).className?.baseVal ?? '';
        const edge = e.closest('.react-flow__edge')?.getAttribute('data-id');
        return `${e.tagName.toLowerCase()}.${String(cls).split(' ')[0]}${edge ? ` of edge ${edge}` : ''}`.slice(0, 80);
    }, [x, y, geo.id]);
    const ghosts = () => page.evaluate((id: string) => [...document.querySelectorAll(`.react-flow__node[data-id="${id}"] .mm-anchor--ghost-visible`)].map((g) => { const r = g.getBoundingClientRect(); return [Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2)]; }), geo.id);
    const out: any = { box: geo.box.map(Math.round), ink: geo.ink.map(Math.round) };
    out.hitOffInk = geo.off ? await at(geo.off[0], geo.off[1]) : 'box equals ink';
    out.hitInk = await at(geo.ink[0] + geo.ink[2] / 2, geo.ink[1] + geo.ink[3] / 2);
    if (geo.off) { await page.mouse.move(geo.off[0], geo.off[1]); await page.waitForTimeout(300); out.ghostsOffInk = (await ghosts()).length; }
    const upright = geo.ink[3] >= geo.ink[2];
    const nearLong = upright ? [geo.ink[0] + 1, geo.ink[1] + geo.ink[3] * 0.5] : [geo.ink[0] + geo.ink[2] * 0.5, geo.ink[1] + 1];
    await page.mouse.move(nearLong[0], nearLong[1]); await page.waitForTimeout(300);
    const g = await ghosts();
    // A ghost on the ink's long side: its centre within 6 px of that side's line.
    out.ghostOnInkLongSide = g.map((p) => (upright ? Math.min(Math.abs(p[0] - geo.ink[0]), Math.abs(p[0] - geo.ink[0] - geo.ink[2])) : Math.min(Math.abs(p[1] - geo.ink[1]), Math.abs(p[1] - geo.ink[1] - geo.ink[3]))) <= 6);
    await page.mouse.click(geo.ink[0] + geo.ink[2] / 2, geo.ink[1] + geo.ink[3] / 2); await page.waitForTimeout(500);
    out.ring = await page.evaluate((id: string) => {
        const node = document.querySelector(`.react-flow__node[data-id="${id}"]`)!;
        const mm = node.querySelector('.mm-node') as HTMLElement, c = node.querySelector('.ir-node-content') as HTMLElement;
        const cs = getComputedStyle(c), ms = getComputedStyle(mm);
        return { selected: mm.classList.contains('selected'), onInk: `${cs.outlineStyle} ${cs.outlineWidth} offset ${cs.outlineOffset}`, onWrapper: `${ms.outlineStyle} ${ms.outlineWidth} shadow ${ms.boxShadow === 'none' ? 'none' : 'some'}` };
    }, geo.id);
    await page.mouse.click(5, 300).catch(() => {});
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(300);
    return out;
}

/**
 * Q3 (d): drag a bar's only neighbour across it and back to where it lies along: the bar's ink sampled mid-drag and
 * after release, its box and its stored vertex compared before and after (no layout shift, nothing saved on it).
 */
async function dragTurn(page: Page, m1: string, barName: string, neighbourName: string) {
    const read = () => page.evaluate(([sel, bar, nb]: string[]) => {
        const w = window as any; const idl = w.windoww.store.getState().idlookup;
        const name = (el: Element) => { const id = el.getAttribute('data-id')!; const d = idl[id]; const o = d?.className === 'DObject' ? id : (d?.model ?? d?.data); try { return String(w.LPointerTargetable.fromPointer(o)?.name ?? ''); } catch { return ''; } };
        const nodes = [...document.querySelectorAll(`${sel} .react-flow__node`)];
        const b = nodes.find((n) => name(n) === bar), n = nodes.find((x) => name(x) === nb);
        if (!b || !n) return null;
        const ink = b.querySelector('.ir-node-content')!.getBoundingClientRect(), box = b.getBoundingClientRect(), nr = n.getBoundingClientRect();
        const id = b.getAttribute('data-id')!; const d = idl[id];
        const stored = d ? JSON.stringify(Object.fromEntries(Object.keys(d).sort().filter((k) => typeof d[k] !== 'object' || d[k] === null).map((k) => [k, d[k]]))) : null;
        return { orientation: ink.height >= ink.width ? 'upright' : 'lying', box: [box.left, box.top, box.width, box.height].map(Math.round), inkCentre: [ink.left + ink.width / 2, ink.top + ink.height / 2], nb: [nr.left + nr.width / 2, nr.top + nr.height / 2], stored };
    }, [paneSel(m1), barName, neighbourName]);
    const before = await read();
    if (!before) return { skipped: 'no bar or neighbour' };
    const [bx, by] = before.inkCentre; const [nx, ny] = before.nb;
    // Across the bar's current long axis: to its left when it lies, above it when it stands.
    const target = before.orientation === 'lying' ? [bx - 160, by] : [bx, by - 160];
    await page.mouse.move(nx, ny); await page.mouse.down();
    for (let i = 1; i <= 12; i++) { await page.mouse.move(nx + ((target[0] - nx) * i) / 12, ny + ((target[1] - ny) * i) / 12); await page.waitForTimeout(16); }
    await page.waitForTimeout(400);
    const mid = await read();
    await page.mouse.up(); await page.waitForTimeout(1500);
    const after = await read();
    return {
        before: before.orientation, midDrag: mid?.orientation, afterRelease: after?.orientation,
        boxMoved: JSON.stringify(before.box) !== JSON.stringify(after?.box), box: [before.box, after?.box],
        storedChanged: before.stored !== after?.stored,
    };
}

// ── Analysis (node side, pure) ──────────────────────────────────────────────────────────────────────

type Pt = number[];
type Run = { angle: number; len: number; from: Pt; to: Pt };

/** The polyline as runs of one direction (within 4 degrees), the short corner arcs dropped. */
function runsOf(pts: Pt[]): Run[] {
    const runs: Run[] = [];
    for (let i = 1; i < pts.length; i++) {
        const dx = pts[i][0] - pts[i - 1][0], dy = pts[i][1] - pts[i - 1][1];
        const len = Math.hypot(dx, dy);
        if (len < 1e-6) continue;
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        const last = runs[runs.length - 1];
        const diff = last ? Math.abs(((angle - last.angle + 540) % 360) - 180) : 999;
        if (last && diff <= 4) { last.len += len; last.to = pts[i]; } else runs.push({ angle, len, from: pts[i - 1], to: pts[i] });
    }
    return runs.filter((r) => r.len >= 6);
}
const axisOff = (angle: number) => { const a = ((angle % 90) + 90) % 90; return Math.min(a, 90 - a); };

function edgeShape(pts: Pt[]) {
    const runs = runsOf(pts);
    const total = runs.reduce((s, r) => s + r.len, 0);
    const diagonal = runs.filter((r) => axisOff(r.angle) > 2);
    const curved = runs.length > 6 && diagonal.length > 4;
    return {
        runs: runs.length, bends: curved ? null : Math.max(0, runs.length - 1), curved,
        diagonalLen: Math.round(diagonal.reduce((s, r) => s + r.len, 0)), totalLen: Math.round(total),
        maxDiagonalRun: Math.round(Math.max(0, ...diagonal.map((r) => r.len))),
        slopes: runs.filter((r) => axisOff(r.angle) > 0.05 && axisOff(r.angle) <= 2).map((r) => ({ off: Math.round(axisOff(r.angle) * 100) / 100, dx: Math.round((r.to[0] - r.from[0]) * 10) / 10, dy: Math.round((r.to[1] - r.from[1]) * 10) / 10 })),
    };
}

function segInt(a: Pt, b: Pt, c: Pt, d: Pt): Pt | null {
    const r = [b[0] - a[0], b[1] - a[1]], s = [d[0] - c[0], d[1] - c[1]];
    const den = r[0] * s[1] - r[1] * s[0];
    if (Math.abs(den) < 1e-9) return null;
    const t = ((c[0] - a[0]) * s[1] - (c[1] - a[1]) * s[0]) / den;
    const u = ((c[0] - a[0]) * r[1] - (c[1] - a[1]) * r[0]) / den;
    if (t < 0 || t > 1 || u < 0 || u > 1) return null;
    return [a[0] + t * r[0], a[1] + t * r[1]];
}

/** Proper crossings between two polylines, away (8 px) from every end of either. */
function crossings(p: Pt[], q: Pt[]): Pt[] {
    const ends = [p[0], p[p.length - 1], q[0], q[q.length - 1]];
    const out: Pt[] = [];
    const step = (x: Pt[]) => x.filter((_, i) => i % 3 === 0 || i === x.length - 1);
    const P = step(p), Q = step(q);
    for (let i = 1; i < P.length; i++) for (let j = 1; j < Q.length; j++) {
        const x = segInt(P[i - 1], P[i], Q[j - 1], Q[j]);
        if (!x) continue;
        if (ends.some((e) => Math.hypot(e[0] - x[0], e[1] - x[1]) < 8)) continue;
        if (out.some((o) => Math.hypot(o[0] - x[0], o[1] - x[1]) < 4)) continue;
        out.push(x);
    }
    return out;
}

/**
 * The side of the node box an end point belongs to: a point outside the box by the side it lies
 * beyond (xyflow's handle point sits 4 px past the border), a point on or inside by the nearest side.
 */
function sideOf(p: Pt, n: any): { side: string; dist: number } {
    const ox = p[0] < n.x ? n.x - p[0] : p[0] > n.x + n.w ? p[0] - (n.x + n.w) : 0;
    const oy = p[1] < n.y ? n.y - p[1] : p[1] > n.y + n.h ? p[1] - (n.y + n.h) : 0;
    if (ox > oy) return { side: p[0] < n.x ? 'left' : 'right', dist: Math.round(ox * 10) / 10 };
    if (oy > ox) return { side: p[1] < n.y ? 'top' : 'bottom', dist: Math.round(oy * 10) / 10 };
    const d: [string, number][] = [['left', Math.abs(p[0] - n.x)], ['right', Math.abs(p[0] - n.x - n.w)], ['top', Math.abs(p[1] - n.y)], ['bottom', Math.abs(p[1] - n.y - n.h)]];
    d.sort((a, b) => a[1] - b[1]);
    return { side: d[0][0], dist: Math.round(d[0][1] * 10) / 10 };
}

/** Distance of an end point from the painted outline of a diamond or a circle (positive: outside); null for a box. */
function offOutline(p: Pt, n: any): number | null {
    const cx = n.x + n.w / 2, cy = n.y + n.h / 2;
    if (n.form === 'diamond') {
        const k = Math.abs(p[0] - cx) / (n.w / 2) + Math.abs(p[1] - cy) / (n.h / 2) - 1;
        return Math.round((k * (n.w / 2) / Math.SQRT2) * 10) / 10;
    }
    if (n.form === 'circle') return Math.round((Math.hypot(p[0] - cx, p[1] - cy) - n.w / 2) * 10) / 10;
    return null;
}

function analyse(m: any) {
    const byId = new Map<string, any>(m.nodes.map((n: any) => [n.id, n]));
    const nm = (id: string) => byId.get(id)?.name ?? id;
    const edges = m.edges.filter((e: any) => e.pts.length > 1).map((e: any) => {
        const s = byId.get(e.source), t = byId.get(e.target);
        const first = e.pts[0], last = e.pts[e.pts.length - 1];
        const end = (p: Pt, n: any) => {
            if (!n) return null;
            // A bar is judged on its drawn ink (Q3: its box may be square).
            const box = n.form === 'bar' && n.ink ? n.ink : n;
            const sd = sideOf(p, box);
            const long = n.form === 'bar' ? (box.h > box.w ? (sd.side === 'left' || sd.side === 'right') : (sd.side === 'top' || sd.side === 'bottom')) : null;
            return { node: n.name, form: n.form, ...sd, longSide: long, offOutline: offOutline(p, n), at: [Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10] };
        };
        // The length of the drawn line inside a node box other than its two ends (a line through a node).
        const through: Record<string, number> = {};
        for (const n of m.nodes) {
            if (n.id === e.source || n.id === e.target) continue;
            let inside = 0;
            for (let i = 1; i < e.pts.length; i++) {
                const [x, y] = [(e.pts[i][0] + e.pts[i - 1][0]) / 2, (e.pts[i][1] + e.pts[i - 1][1]) / 2];
                if (x > n.x && x < n.x + n.w && y > n.y && y < n.y + n.h) inside += Math.hypot(e.pts[i][0] - e.pts[i - 1][0], e.pts[i][1] - e.pts[i - 1][1]);
            }
            if (inside >= 2) through[n.name] = Math.round(inside);
        }
        return { id: e.id, name: `${nm(e.source)}->${nm(e.target)}`, self: e.source === e.target, ...edgeShape(e.pts), src: end(first, s), tgt: end(last, t), marker: e.markerEnd?.inner ?? null, polygons: e.polygons.length, through, lineSlopes: lineSlopes(e.d) };
    });
    const visibleEdges = m.edges.filter((e: any) => e.pts.length > 1);
    const pairs: any[] = [];
    for (let i = 0; i < visibleEdges.length; i++) for (let j = i + 1; j < visibleEdges.length; j++) {
        const x = crossings(visibleEdges[i].pts, visibleEdges[j].pts);
        if (x.length) pairs.push({ a: edges[i].name, b: edges[j].name, n: x.length, at: x.map((p) => p.map((v) => Math.round(v))) });
    }
    // Labels to their nearest edge (label divs carry no edge id).
    const segDist = (px: number, py: number, a: Pt, b: Pt) => {
        const dx = b[0] - a[0], dy = b[1] - a[1]; const L2 = dx * dx + dy * dy;
        const t = L2 ? Math.max(0, Math.min(1, ((px - a[0]) * dx + (py - a[1]) * dy) / L2)) : 0;
        return Math.hypot(px - (a[0] + t * dx), py - (a[1] + t * dy));
    };
    const labelOf: Record<string, string[]> = {};
    for (const l of m.labels.filter((x: any) => x.visible && x.text)) {
        const cx = l.x + l.w / 2, cy = l.y + l.h / 2;
        let best: any = null;
        visibleEdges.forEach((e: any, k: number) => { for (let i = 1; i < e.pts.length; i += 2) { const d = segDist(cx, cy, e.pts[i - 1], e.pts[i]); if (!best || d < best.d) best = { k, d }; } });
        if (best) (labelOf[edges[best.k].name] ??= []).push(`${l.text}@${Math.round(best.d)}${l.covered ? ` under ${byId.get(l.covered)?.name ?? l.covered}` : ''}`);
    }
    // Ends that share a point on one node (within 2 px).
    const shared: any[] = [];
    const ends: { e: string; p: Pt; node: string }[] = [];
    for (const e of visibleEdges) { ends.push({ e: nm(e.source) + '->' + nm(e.target), p: e.pts[0], node: nm(e.source) }); ends.push({ e: nm(e.source) + '->' + nm(e.target), p: e.pts[e.pts.length - 1], node: nm(e.target) }); }
    for (let i = 0; i < ends.length; i++) for (let j = i + 1; j < ends.length; j++) {
        if (ends[i].e === ends[j].e) continue;
        const d = Math.hypot(ends[i].p[0] - ends[j].p[0], ends[i].p[1] - ends[j].p[1]);
        if (d < 2) shared.push({ a: ends[i].e, b: ends[j].e, node: ends[i].node === ends[j].node ? ends[i].node : `${ends[i].node}|${ends[j].node}`, at: ends[i].p.map((v) => Math.round(v)), d: Math.round(d * 10) / 10 });
    }
    // Bars: the sum of the unit vectors to the connected neighbours, from the bar's centre.
    const bars = m.nodes.filter((n: any) => n.form === 'bar').map((b: any) => {
        const c = [b.x + b.w / 2, b.y + b.h / 2];
        let sx = 0, sy = 0;
        for (const e of visibleEdges) {
            const other = e.source === b.id ? byId.get(e.target) : e.target === b.id ? byId.get(e.source) : null;
            if (!other) continue;
            const dx = other.x + other.w / 2 - c[0], dy = other.y + other.h / 2 - c[1];
            const L = Math.hypot(dx, dy) || 1;
            sx += Math.abs(dx) / L; sy += Math.abs(dy) / L;
        }
        // Q3: a turned bar's orientation is its ink's, the box being square.
        const k = b.ink ?? b;
        return { name: b.name, w: b.w, h: b.h, upright: k.h > k.w, sumAbs: [Math.round(sx * 100) / 100, Math.round(sy * 100) / 100], wantsUpright: sx > sy, ratio: Math.round((Math.max(sx, sy) / Math.max(1e-6, Math.min(sx, sy))) * 100) / 100 };
    });
    const box = (ns: any[]) => ns.length ? { x0: Math.min(...ns.map((n) => n.x)), y0: Math.min(...ns.map((n) => n.y)), x1: Math.max(...ns.map((n) => n.x + n.w)), y1: Math.max(...ns.map((n) => n.y + n.h)) } : null;
    const nodes = m.nodes.map((n: any) => ({ name: n.name, cls: n.cls, form: n.form, x: n.x, y: n.y, w: n.w, h: n.h, ink: n.ink, stored: n.stored, cx: n.x + n.w / 2, cy: n.y + n.h / 2, rows: n.rows, entry: n.entry, handles: n.handles.map((h: any) => `${h.type}:${h.id}`) }));
    // An edge whose drawn line runs through a node's outside label (its own node's included).
    const labelsCrossed = (m.outsideLabels ?? []).flatMap((l: any) => m.edges.filter((e: any) => e.pts.some((p: Pt) => p[0] > l.x + 0.5 && p[0] < l.x + l.w - 0.5 && p[1] > l.y + 0.5 && p[1] < l.y + l.h - 0.5)).map((e: any) => `${l.text} by ${nm(e.source)}->${nm(e.target)}`));
    // Q3: the drawn extent, a turned bar by its ink, beside the box extent.
    const drawn = m.nodes.map((n: any) => (n.form === 'bar' && n.ink ? { ...n, x: n.ink.x, y: n.ink.y, w: n.ink.w, h: n.ink.h } : n));
    return { calib: m.calib, zoom: m.zoom, events: m.events, labelsCrossed, nodes, edges, crossings: pairs, labelsByEdge: labelOf, sharedEnds: shared, bars, bbox: box(m.nodes), drawnBbox: box(drawn), labels: m.labels.filter((l: any) => l.visible) };
}

/** The MEAS lines of one measured phase, the same online and offline (DNE_ANALYSE). */
function report(label: string, a: any) {
    const tag = (x: any) => x && `${x.side}${x.longSide === false ? '(short)' : ''}${x.offOutline !== null && x.offOutline !== undefined && Math.abs(x.offOutline) > 1 ? `(off${x.offOutline})` : ''}`;
    meas(`${label} edges`, a.edges.map((e: any) => [e.name, e.self ? 'self' : e.curved ? 'curve' : `b${e.bends}`, e.diagonalLen ? `diag${e.diagonalLen}/${e.totalLen}` : '', e.slopes.length ? e.slopes : '', tag(e.src), tag(e.tgt)]));
    meas(`${label} crossings`, a.crossings);
    meas(`${label} through nodes`, a.edges.filter((e: any) => Object.keys(e.through).length).map((e: any) => [e.name, e.through]));
    meas(`${label} shared ends`, a.sharedEnds);
    meas(`${label} labels`, a.labelsByEdge);
    meas(`${label} bars`, a.bars);
    const barEnds = a.edges.flatMap((e: any) => [e.src, e.tgt]).filter((x: any) => x && x.form === 'bar');
    meas(`${label} bar ends`, { total: barEnds.length, short: barEnds.filter((x: any) => x.longSide === false).length });
    const diamondEnds = a.edges.flatMap((e: any) => [e.src && { e: e.name, end: 'src', ...e.src }, e.tgt && { e: e.name, end: 'tgt', ...e.tgt }]).filter((x: any) => x && x.form === 'diamond');
    meas(`${label} diamond ends`, diamondEnds.map((x: any) => [x.node, x.e, x.end, x.side, x.at, x.offOutline]));
    meas(`${label} entry marks`, a.nodes.filter((n: any) => n.entry).map((n: any) => [n.name, n.entry]));
    meas(`${label} nodes`, a.nodes.map((n: any) => [n.name, n.cls, n.form, Math.round(n.x), Math.round(n.y), n.w, n.h, n.rows.length ? n.rows : '']));
    meas(`${label} acceptance`, acceptance(a));
}

/**
 * The straight segments of a path (its `L` commands) that are almost but not quite level or upright: off by more
 * than 0.3 px and by less than 3 degrees. A curve (Q, C, A) only moves the pen. The slope Phase 2 removes.
 */
function lineSlopes(d: string | null): { dx: number; dy: number }[] {
    if (!d) return [];
    const out: { dx: number; dy: number }[] = [];
    const tokens = d.match(/[MLQCAZ]|-?\d+(?:\.\d+)?(?:e-?\d+)?/g) ?? [];
    let cmd = ''; let cur = { x: 0, y: 0 }; const nums: number[] = [];
    const arity: Record<string, number> = { M: 2, L: 2, Q: 4, C: 6, A: 7 };
    const flush = () => {
        while (cmd && arity[cmd] && nums.length >= arity[cmd]) {
            const a = nums.splice(0, arity[cmd]);
            const next = { x: a[a.length - 2], y: a[a.length - 1] };
            if (cmd === 'L') {
                const dx = next.x - cur.x, dy = next.y - cur.y, lo = Math.min(Math.abs(dx), Math.abs(dy)), hi = Math.max(Math.abs(dx), Math.abs(dy));
                if (lo > 0.3 && lo / hi <= Math.tan((3 * Math.PI) / 180)) out.push({ dx: Math.round(dx * 10) / 10, dy: Math.round(dy * 10) / 10 });
            }
            cur = next;
        }
    };
    for (const t of tokens) { if (/[A-Z]/.test(t)) { flush(); cmd = t; } else nums.push(Number(t)); }
    flush();
    return out;
}

/** The numbers Phase 2 is accepted on (P-2026-10-03-1304 GO): crossings, length through other nodes, slight slopes, the Activity spine bends. */
function acceptance(a: any) {
    const spine = ['i0->work', 'work->d1', 'd1->fk', 'jn->fin'];
    const spineEdges = a.edges.filter((e: any) => spine.includes(e.name));
    return {
        crossings: a.crossings.reduce((n: number, c: any) => n + c.n, 0),
        throughPx: a.edges.reduce((n: number, e: any) => n + Object.values<number>(e.through).reduce((x, y) => x + y, 0), 0),
        slopes: a.edges.filter((e: any) => e.lineSlopes.length).map((e: any) => `${e.name} ${JSON.stringify(e.lineSlopes)}`),
        spineBends: spineEdges.length ? spineEdges.reduce((n: number, e: any) => n + (e.bends ?? 99), 0) : null,
        hiddenLabels: Object.values<string[]>(a.labelsByEdge).flat().filter((l) => l.includes(' under ')).length,
        labelsCrossed: a.labelsCrossed ?? [],
        transitionLabels: a.labelsByEdge,
        // Q7: the nodes drawn, the Event boxes among them, the Event objects in the model and in the tree, the canvas height.
        drawn: a.nodes.length,
        eventBoxes: a.nodes.filter((n: any) => n.cls === 'Event').length,
        events: a.events ?? null,
        height: a.bbox ? Math.round(a.bbox.y1 - a.bbox.y0) : null,
        drawnSize: a.drawnBbox ? [Math.round(a.drawnBbox.x1 - a.drawnBbox.x0), Math.round(a.drawnBbox.y1 - a.drawnBbox.y0)] : null,
        // Q2: the connected handles of every bar, and the drawn ends on it, on a short side.
        barHandles: (() => {
            const bars = a.nodes.filter((n: any) => n.form === 'bar');
            const hs = bars.flatMap((n: any) => n.handles.map((h: string) => ({ upright: (n.ink ?? n).h > (n.ink ?? n).w, side: h.split(':')[1].split('-')[0] })));
            const short = hs.filter((h: any) => (h.upright ? h.side === 'top' || h.side === 'bottom' : h.side === 'left' || h.side === 'right'));
            return { total: hs.length, short: short.length };
        })(),
        barInk: a.nodes.filter((n: any) => n.form === 'bar').map((n: any) => `${n.name} box ${Math.round(n.w)}x${Math.round(n.h)} ink ${n.ink ? `${Math.round(n.ink.w)}x${Math.round(n.ink.h)}` : '-'}`),
        barEnds: (() => { const e = a.edges.flatMap((x: any) => [x.src, x.tgt]).filter((x: any) => x && x.form === 'bar'); return { total: e.length, short: e.filter((x: any) => x.longSide === false).length }; })(),
        // Q4: the drawn ends on each diamond: side, distance off the outline, and the closest two ends.
        diamonds: a.nodes.filter((n: any) => n.form === 'diamond').map((n: any) => {
            const ends = a.edges.flatMap((x: any) => [x.src && { e: x.name, ...x.src }, x.tgt && { e: x.name, ...x.tgt }]).filter((x: any) => x && x.node === n.name);
            let gap = Infinity;
            for (let i = 0; i < ends.length; i++) for (let j = i + 1; j < ends.length; j++) gap = Math.min(gap, Math.hypot(ends[i].at[0] - ends[j].at[0], ends[i].at[1] - ends[j].at[1]));
            return { node: n.name, ends: ends.map((x: any) => `${x.e} ${x.side} off${x.offOutline}`), minGap: Number.isFinite(gap) ? Math.round(gap * 10) / 10 : null, handles: n.handles };
        }),
    };
}

/** Every number of a path rounded to 0.01 px: below that, two runs of the same code differ (measured, Phase 2). */
const round2 = (d: string | null) => (d ?? '').replace(/-?\d+\.\d+/g, (x) => String(Math.round(Number(x) * 100) / 100));

/** The default viewpoint's pane, by names: what must not move unless a layout change says so. */
function defaultDump(m: any) {
    const byId = new Map<string, any>(m.nodes.map((n: any) => [n.id, n]));
    const nm = (id: string) => byId.get(id)?.name ?? id;
    return {
        nodes: m.nodes.map((n: any) => [n.name, Math.round(n.x * 100) / 100, Math.round(n.y * 100) / 100, n.w, n.h, n.text]).sort((p: any, q: any) => String(p[0]).localeCompare(String(q[0]))),
        edges: m.edges.map((e: any) => [`${nm(e.source)}->${nm(e.target)}`, e.paths.map((p: any) => round2(p.d))]).sort((p: any, q: any) => JSON.stringify(p).localeCompare(JSON.stringify(q))),
        labels: m.labels.filter((l: any) => l.visible).map((l: any) => [l.text, Math.round(l.x * 10) / 10, Math.round(l.y * 10) / 10]).sort((p: any, q: any) => JSON.stringify(p).localeCompare(JSON.stringify(q))),
    };
}

// ── Compare: DNE_COMPARE=<before.json>,<after.json> pairs the default panes and the acceptance numbers ─────
if (process.env.DNE_COMPARE) {
    const [b, a] = process.env.DNE_COMPARE.split(',').map((f) => JSON.parse(readFileSync(f, 'utf8')));
    for (const key of Object.keys(b.scenes ?? {})) {
        // Rounded to 0.01 px at compare time too, so a dump of an earlier run compares on the same footing.
        const x = round2(JSON.stringify(b.scenes[key]?.defaultPane)), y = round2(JSON.stringify(a.scenes?.[key]?.defaultPane));
        check(`${key}: the default viewpoint's pane identical before and after`, !!x && x === y, x === y ? 'identical' : { before: x?.slice(0, 600), after: y?.slice(0, 600) });
        for (const notation of Object.keys(b.scenes[key].notations ?? {})) {
            for (const phase of ['rest', 'elk']) {
                const nb = b.scenes[key].notations[notation]?.raw?.[phase], na = a.scenes?.[key]?.notations?.[notation]?.raw?.[phase];
                if (nb && na) meas(`${key}/${notation} ${phase} acceptance before -> after`, [acceptance(analyse(nb)), acceptance(analyse(na))]);
            }
        }
    }
    console.log(`RESULT ${pass}/${pass + fail}`);
    process.exit(fail ? 1 : 0);
}

// ── Offline: DNE_ANALYSE=<json>[,<json>] re-reads the raw measures of an earlier run ──────────────
if (process.env.DNE_ANALYSE) {
    for (const f of process.env.DNE_ANALYSE.split(',')) {
        const r = JSON.parse(readFileSync(f, 'utf8'));
        for (const [key, sc] of Object.entries<any>(r.scenes ?? {})) {
            for (const [notation, n] of Object.entries<any>(sc.notations ?? {})) {
                for (const phase of ['rest', 'elk']) report(`${key}/${notation} ${phase}`, analyse(n.raw[phase]));
            }
        }
    }
    process.exit(0);
}

// ── Main ──────────────────────────────────────────────────────────────────────────────────────────

const browser = await chromium.launch();
const result: any = { url: URL, tag: TAG, scenes: {} };
for (const sc of SCENES) {
    const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 2 });
    await seed(ctx, true);
    await ctx.addInitScript(() => { (globalThis as any).__name = (f: any) => f; });
    const page = await ctx.newPage();
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
    const { project, models } = await importScene(page, sc.file);
    check(`${sc.key}: imported`, !!project && models.length >= 2, { project, models });
    if (!project) { await ctx.close(); continue; }
    meas(`${sc.key} theme`, await setTheme(page, 'light'));
    const mm = models.find((m) => m.meta)!.id;
    const m1 = models.find((m) => !m.meta)!.id;
    const defaultVp = await page.evaluate(() => (window as any).windoww.store.getState().viewpoint ?? null);
    await openModel(page, m1);
    await fit(page, m1);
    const sceneOut: any = { mm, m1, notations: {}, defaultPane: defaultDump(await measure(page, m1)) };
    await crop(page, m1, `dne_${TAG}_${sc.key}_default`);
    for (const notation of sc.notations) {
        await activate(page, defaultVp);
        const d = await derive(page, mm, sc.profile, notation);
        meas(`${sc.key}/${notation} derive`, { vp: d.vp, from: d.from, roles: d.roles });
        check(`${sc.key}/${notation}: derived`, !!d.vp, d.vp);
        await activate(page, d.vp);
        await openModel(page, m1);
        await fit(page, m1);
        const restRaw = await measure(page, m1);
        if (restRaw.error) { check(`${sc.key}/${notation}: pane measured`, false, restRaw.error); continue; }
        const rest = analyse(restRaw);
        // Q3: the bar checks at rest, on the three notations that draw bars.
        if (['petriClassic', 'petri', 'activityUml'].includes(notation)) {
            sceneOut.barChecks = { ...(sceneOut.barChecks ?? {}), [notation]: await barChecks(page, m1) };
            meas(`${sc.key}/${notation} bar checks`, sceneOut.barChecks[notation]);
        }
        await crop(page, m1, `dne_${TAG}_${sc.key}_${notation}_rest`);
        meas(`${sc.key}/${notation} entry crops`, await cropEntries(page, m1, `dne_${TAG}_${sc.key}_${notation}`));
        const wrapped = await installWrapper(page);
        const capBefore = await page.evaluate(() => (window as any).__dneCaps?.length ?? 0);
        const calls = await clickLayout(page, m1);
        await fit(page, m1);
        await wait(page, 800);
        const elkRaw = await measure(page, m1);
        const elk = analyse(elkRaw);
        await crop(page, m1, `dne_${TAG}_${sc.key}_${notation}_elk`);
        const cap = await page.evaluate((k: number) => (window as any).__dneCaps?.[k] ?? null, capBefore);
        check(`${sc.key}/${notation}: calibration spread < 1 px (rest, elk)`, rest.calib.spread < 1 && elk.calib.spread < 1, [rest.calib.spread, elk.calib.spread]);
        check(`${sc.key}/${notation}: the toolbar auto-layout ran ELK once and the input was captured`, calls === 1 && !!cap, { calls, wrapped });
        sceneOut.notations[notation] = { derive: d, rest, elk, elkInput: cap?.input ?? null, elkOutput: cap?.out ?? null, raw: { rest: restRaw, elk: elkRaw } };
        // Q3 (d): a drag that should turn a bar at release, not before; last, as it moves a node.
        if (notation === 'petriClassic' || notation === 'petri') {
            sceneOut.notations[notation].drag = await dragTurn(page, m1, 't3', 'lock');
            meas(`${sc.key}/${notation} drag`, sceneOut.notations[notation].drag);
        }
        for (const [phase, a] of [['rest', rest], ['elk', elk]] as const) report(`${sc.key}/${notation} ${phase}`, a);
        result.scenes[sc.key] = sceneOut;
        writeFileSync(OUT, JSON.stringify(result, null, 0));
    }
    meas(`${sc.key} page errors`, errors.slice(0, 6));
    check(`${sc.key}: no page errors`, errors.length === 0, errors.slice(0, 3));
    await ctx.close();
}
writeFileSync(OUT, JSON.stringify(result, null, 0));
await browser.close();

// ── Question 8: the layout variants, offline on the captured ELK input ──────────────────────────────
const requireFrom = createRequire(new globalThis.URL('../../package.json', import.meta.url));
const ELK = requireFrom('elkjs/lib/elk.bundled.js');
const elk = new ELK();
/** The bends of the main path's edges in ELK's own output, and the spread of the centres across the flow. */
async function variant(input: any, patch: (g: any) => void, chain: string[], axis: 'x' | 'y') {
    const g = JSON.parse(JSON.stringify(input));
    patch(g);
    const out = await elk.layout(g);
    const bendsOf = (id: string) => {
        const e = (out.edges ?? []).find((x: any) => x.id === id);
        return e ? (e.sections ?? []).reduce((s: number, sec: any) => s + (sec.bendPoints?.length ?? 0), 0) : null;
    };
    const ch = new Map((out.children ?? []).map((c: any) => [c.id, c]));
    const centres = chain.map((id) => { const c: any = ch.get(id); return c ? (axis === 'x' ? c.x + c.width / 2 : c.y + c.height / 2) : null; }).filter((v) => v !== null) as number[];
    const totalBends = (out.edges ?? []).reduce((s: number, e: any) => s + (e.sections ?? []).reduce((t: number, sec: any) => t + (sec.bendPoints?.length ?? 0), 0), 0);
    return { totalBends, centreSpread: centres.length ? Math.round((Math.max(...centres) - Math.min(...centres)) * 10) / 10 : null, centres: centres.map((v) => Math.round(v * 10) / 10), area: [Math.round(out.width ?? 0), Math.round(out.height ?? 0)], bends: bendsOf };
}
const opt = (g: any, k: string, v: string) => { g.layoutOptions = { ...(g.layoutOptions ?? {}), [k]: v }; };
const edgeOpt = (g: any, ids: string[], k: string, v: string) => { for (const e of g.edges ?? []) if (ids.includes(e.id)) e.layoutOptions = { ...(e.layoutOptions ?? {}), [k]: v }; };
const q8: any = {};
for (const [scene, notation, chainNames, flowAxis] of [['flowB', 'activityUml', ['i0', 'work', 'd1', 'fk', 'jn', 'fin'], 'x'], ['pest', 'statechart', ['locked', 'unlocked', 'off'], 'y'], ['esm', 'statechart', ['locked', 'unlocked', 'off'], 'y'], ['petri', 'petriClassic', ['p1', 't1', 'p2', 't2', 'p3'], 'y']] as const) {
    const n = result.scenes[scene]?.notations?.[notation];
    if (!n?.elkInput) continue;
    const ids = new Map<string, string>(n.raw.rest.nodes.map((x: any) => [x.name, x.id]));
    const chain = (chainNames as readonly string[]).map((x) => ids.get(x)).filter(Boolean) as string[];
    // Junctions sit on the chain too: the merge before the action it feeds.
    const junctions = (n.elkInput.children ?? []).map((c: any) => c.id).filter((id: string) => id.startsWith('::junction::'));
    const chainEdges = (n.elkInput.edges ?? []).filter((e: any) => {
        const s = e.sources[0], t = e.targets[0];
        const on = (x: string) => chain.includes(x) || junctions.includes(x);
        return on(s) && on(t);
    }).map((e: any) => e.id);
    const V: Record<string, (g: any) => void> = {
        V0_current: () => {},
        V1_favorStraight: (g) => opt(g, 'elk.layered.nodePlacement.favorStraightEdges', 'true'),
        V2_straightness10_chain: (g) => edgeOpt(g, chainEdges, 'elk.layered.priority.straightness', '10'),
        V3_both: (g) => { opt(g, 'elk.layered.nodePlacement.favorStraightEdges', 'true'); edgeOpt(g, chainEdges, 'elk.layered.priority.straightness', '10'); },
        V4_networkSimplex_straightness: (g) => { opt(g, 'elk.layered.nodePlacement.strategy', 'NETWORK_SIMPLEX'); edgeOpt(g, chainEdges, 'elk.layered.priority.straightness', '10'); },
        V5_linearSegments: (g) => opt(g, 'elk.layered.nodePlacement.strategy', 'LINEAR_SEGMENTS'),
        V6_bk_noBalance: (g) => opt(g, 'elk.layered.nodePlacement.bk.fixedAlignment', 'NONE'),
        V7_bk_leftup: (g) => opt(g, 'elk.layered.nodePlacement.bk.fixedAlignment', 'LEFTUP'),
    };
    const rows: any = {};
    for (const [k, p] of Object.entries(V)) {
        try {
            const r = await variant(n.elkInput, p, [...chain, ...junctions], flowAxis as 'x' | 'y');
            rows[k] = { totalBends: r.totalBends, chainBends: Object.fromEntries(chainEdges.map((id: string) => [id.replace(/^irobj_/, ''), r.bends(id)])), centreSpread: r.centreSpread, centres: r.centres, area: r.area };
        } catch (e) { rows[k] = { error: String(e).slice(0, 200) }; }
    }
    q8[`${scene}/${notation}`] = { chain: chainNames, chainEdges, rows };
    meas(`q8 ${scene}/${notation}`, rows);
}
result.q8 = q8;
writeFileSync(OUT, JSON.stringify(result, null, 0));
meas('out', OUT);
console.log(`RESULT ${pass}/${pass + fail}`);
process.exit(fail ? 1 : 0);
