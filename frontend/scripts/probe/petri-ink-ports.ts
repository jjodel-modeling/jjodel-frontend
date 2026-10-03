/**
 * petri-ink-ports probe (P-2026-10-03-1920, Phase 1 of the Petri ink / place label / ELK ports discovery).
 *
 * Questions, in numbers, on the four demo exports (read only):
 *   1. Ink: the contrast of every solid notation glyph (a bar, a filled disc, a filled marker, an entry dot)
 *      against the canvas background around it, light and dark, read from the pixels of a screenshot.
 *   2. Labels: for every outside label of a vertex (a classic Petri place's name), the distance from its box
 *      to the nearest arrowhead and to the nearest edge line, at rest, after one toolbar Auto layout, and
 *      (classic Petri only) after a second Auto layout with the notation's profile turned to DOWN.
 *   3. Ports: after the toolbar Auto layout, for every edge end, the distance between the drawn end, the
 *      route the renderer was given (elkLayout.ts store), ELK's own port (its section end, moved by its
 *      node's snap) and the React Flow handle the edge is attached to; the bends drawn against ELK's.
 *
 * Drives the real app on its own dev server (never 3001). For each scene, in a fresh context: import, open
 * the M1, write the simulation binding as Apply writes it, derive each notation through the dialog's calls
 * (`dialogPrefill` + `createDerivedViewpoint`), activate, measure at rest (light, then dark), click Auto
 * layout (the ELK call captured by wrapping `layout` on the elkjs instance elkLayout.ts imports, this page
 * only), measure again. The default viewpoint's pane is dumped for the Phase 2 byte comparison.
 *
 * Run:  ~/.local/bin/node frontend/scripts/lane-run.mjs probe <worktree> \
 *         frontend/scripts/probe/petri-ink-ports.ts --port 3080 --id P-2026-10-03-1920
 * Env:  PIP_SCENES  directory of the exports (default ~/jjodel-demo-exports)
 *       PIP_ONLY    comma list of scene keys (petri, flowB, pest, esm; default all)
 *       PIP_OUT     JSON output (default /tmp/petriink/probe_<tag>.json)
 *       PIP_CROPS   crop directory (default ~/.jjodel-lanes/P-2026-10-03-1920/crops)
 *       PIP_TAG     label of the run in crop and file names (default before)
 *       PIP_COMPARE <before.json>,<after.json>: the default panes compared (PASS when identical), and the
 *                   acceptance numbers of every pane, before then after
 */
import { chromium, type Page } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { seed, setTheme } from '../smoke/states.ts';

const URL = (process.env.PROBE_URL || 'http://localhost:3080/').replace(/\/$/, '');
if (/:3001$/.test(URL)) throw new Error('never 3001');
const SCENES_DIR = process.env.PIP_SCENES || `${process.env.HOME}/jjodel-demo-exports`;
const ONLY = (process.env.PIP_ONLY || '').split(',').filter(Boolean);
const TAG = process.env.PIP_TAG || 'before';
const OUT = process.env.PIP_OUT || `/tmp/petriink/probe_${TAG}.json`;
const CROPS = (process.env.PIP_CROPS || `${process.env.HOME}/.jjodel-lanes/P-2026-10-03-1920/crops`).replace(/\/$/, '');

let pass = 0; let fail = 0;
const check = (name: string, ok: boolean, detail: unknown) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  ${JSON.stringify(detail).slice(0, 1500)}`); if (ok) pass++; else fail++; };
const meas = (name: string, v: unknown) => console.log(`MEAS  ${name}  ${typeof v === 'string' ? v : JSON.stringify(v).slice(0, 6000)}`);

const SCENES = [
    { key: 'petri', file: 'scene_2_DemoPetri.jjodel', profile: 'petri', notations: ['petriClassic', 'petri'] },
    { key: 'flowB', file: 'scene_4_DemoFlowB.jjodel', profile: 'flowchart', notations: ['activityUml', 'flowchart'] },
    { key: 'pest', file: 'scene_1_DemoPEST.jjodel', profile: 'stateMachine', notations: ['statechart'] },
    { key: 'esm', file: 'scene_3_DemoESM.jjodel', profile: 'stateMachine', notations: ['statechart'] },
].filter((s) => !ONLY.length || ONLY.includes(s.key));

const wait = (page: Page, ms: number) => page.waitForTimeout(ms);
const paneSel = (m1: string) => `[id="${m1}"].dock-tabpane-active`;

// ── Scene setup (the calls of derived-notations-edges.ts, P-2026-10-03-1304) ──────────────────────────

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

async function derive(page: Page, mm: string, profile: string, notation: string) {
    return page.evaluate(async ([x, prof, n]: string[]) => {
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
        const views = Object.values(L).filter((d: any) => d?.className === 'DViewElement' && d.ir?.generated && (d.father === vp?.id || d.viewpoint === vp?.id))
            .map((d: any) => ({ name: d.name, shape: d.ir?.shape ? { form: d.ir.shape.form, fill: d.ir.shape.fill, border: d.ir.shape.border, marker: d.ir.shape.marker, entry: d.ir.shape.entry, labels: (d.ir.shape.labels ?? []).map((l: any) => ({ position: l.position, anchor: l.anchor })) } : null }));
        return { vp: vp?.id ?? null, views, layout: (L[vp?.id]?._state ?? {}).derivedLayout ?? null };
    }, [mm, profile, notation]);
}

const activate = async (page: Page, vp: string | null) => {
    await page.evaluate(async (x: string | null) => { const load = (p: string): Promise<any> => import(p); const m = await load('/src/utils/lastViewpoint.ts'); m.activateViewpoint(x); }, vp);
    await wait(page, 3000);
};

/**
 * Fit the pane to its visible nodes and their outside labels, zoom at most 1, through the pane's React Flow store
 * (the controls are hidden by EditorV2.scss, so their fit button cannot be clicked). Returns the zoom set.
 */
async function fit(page: Page, m1: string) {
    const z = await page.evaluate(async (sel: string) => {
        const pane = document.querySelector(sel);
        const rf = pane?.querySelector('.react-flow');
        const key = rf && Object.keys(rf).find((k) => k.startsWith('__reactFiber$'));
        let f = key && (rf as any)[key]; let store: any = null;
        for (let i = 0; f && i < 80; i++, f = f.return) {
            const v = f.memoizedProps && f.memoizedProps.value;
            if (v && typeof v.getState === 'function' && typeof v.getState().triggerNodeChanges === 'function') { store = v; break; }
        }
        if (!store) return null;
        const s = store.getState();
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        for (const n of s.nodes) {
            if (n.hidden) continue;
            const il = s.nodeLookup.get(n.id);
            const p = il?.internals?.positionAbsolute ?? n.position;
            const w = n.measured?.width ?? n.width ?? 0, h = n.measured?.height ?? n.height ?? 0;
            x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x + w); y1 = Math.max(y1, p.y + h);
        }
        if (!Number.isFinite(x0) || !s.panZoom) return null;
        const pad = 70;
        const zoom = Math.min(1, s.width / (x1 - x0 + 2 * pad), s.height / (y1 - y0 + 2 * pad));
        await s.panZoom.setViewport({ x: s.width / 2 - ((x0 + x1) / 2) * zoom, y: s.height / 2 - ((y0 + y1) / 2) * zoom, zoom });
        return zoom;
    }, paneSel(m1));
    await wait(page, 700);
    return z;
}

/** The ELK wrapper, on the module instance elkLayout.ts imports: records every input graph and output. */
async function installWrapper(page: Page) {
    return page.evaluate(async () => {
        const w = window as any;
        if (w.__pipWrapped) return { ok: true, again: true };
        const src = await (await fetch('/src/components/editor-v2/utils/elkLayout.ts')).text();
        const m = src.match(/from\s+["']([^"']*elkjs[^"']*)["']/);
        if (!m) return { ok: false, why: 'no elkjs import in the served elkLayout.ts' };
        const mod = await import(m[1]);
        let proto = mod.default.prototype; let owner: any = null;
        while (proto) { if (Object.prototype.hasOwnProperty.call(proto, 'layout')) { owner = proto; break; } proto = Object.getPrototypeOf(proto); }
        if (!owner) return { ok: false, why: 'no layout on the prototype chain' };
        const orig = owner.layout;
        w.__pipCaps = [];
        owner.layout = async function (graph: any, ...rest: any[]) {
            const input = JSON.parse(JSON.stringify(graph));
            const out = await orig.call(this, graph, ...rest);
            w.__pipCaps.push({ input, out: JSON.parse(JSON.stringify(out)) });
            return out;
        };
        w.__pipWrapped = true;
        return { ok: true, url: m[1] };
    });
}

async function clickLayout(page: Page, m1: string) {
    await page.mouse.move(5, 5);
    const btn = page.locator(`${paneSel(m1)} .toolbar-btn[title="Auto layout"]`).first();
    if (!(await btn.count())) return 'no button';
    if (await btn.isDisabled()) return 'disabled';
    const before = await page.evaluate(() => (window as any).__pipCaps?.length ?? 0);
    await btn.click();
    await wait(page, 3000);
    const after = await page.evaluate(() => (window as any).__pipCaps?.length ?? 0);
    await page.mouse.move(5, 5);
    return after - before;
}

/** The derived viewpoint's layout profile with another direction (this probe's own project only). */
async function setDirection(page: Page, vp: string, direction: string) {
    return page.evaluate(async ([x, d]: string[]) => {
        const w = window as any;
        const L = w.windoww.store.getState().idlookup;
        const st = { ...(L[x]?._state ?? {}) };
        if (typeof st.derivedLayout !== 'string') return { ok: false, why: 'no derivedLayout' };
        const p = JSON.parse(st.derivedLayout);
        p.direction = d;
        st.derivedLayout = JSON.stringify(p);
        w.LPointerTargetable.fromPointer(x).state = st;
        await new Promise((r) => setTimeout(r, 800));
        return { ok: JSON.parse(w.windoww.store.getState().idlookup[x]._state.derivedLayout).direction === d, layout: w.windoww.store.getState().idlookup[x]._state.derivedLayout };
    }, [vp, direction]);
}

/** «Color by metaclass» on or off on a viewpoint, as the Viewpoint properties panel writes it (this probe's project only). */
async function setColoring(page: Page, vp: string, enabled: boolean) {
    const ok = await page.evaluate(async ([x, on]: [string, boolean]) => {
        const w = window as any;
        w.LPointerTargetable.fromPointer(x).metaclassColoring = { enabled: on, baseColor: '#0ea5e9', border: true };
        await new Promise((r) => setTimeout(r, 900));
        return w.windoww.store.getState().idlookup[x]?.metaclassColoring?.enabled === on;
    }, [vp, enabled] as [string, boolean]);
    await wait(page, 600);
    return ok;
}

/** The computed fill of every node's shape (CSS background, or the SVG silhouette's fill), by node name. */
async function fills(page: Page, m1: string): Promise<Record<string, string>> {
    return page.evaluate((sel: string) => {
        const pane = document.querySelector(sel);
        const w = window as any;
        const idl = w.windoww.store.getState().idlookup;
        const out: Record<string, string> = {};
        for (const node of pane?.querySelectorAll('.react-flow__node') ?? []) {
            const c = node.querySelector(':scope .ir-node-content') as HTMLElement | null;
            if (!c) continue;
            const id = node.getAttribute('data-id')!; const d = idl[id]; const o = d?.className === 'DObject' ? id : (d?.model ?? d?.data);
            let name = ''; try { name = String(w.LPointerTargetable.fromPointer(o)?.name ?? ''); } catch { /* none */ }
            const svg = c.querySelector(':scope > svg:not(.ir-marker-svg):not(.ir-entry-svg)');
            const sil = svg ? [...svg.querySelectorAll('path, polygon, ellipse, circle, rect')].find((p) => !/ir-sel-/.test(p.getAttribute('class') ?? '') && (p.getAttribute('fill') ?? 'none') !== 'none') : null;
            out[name || id] = sil ? getComputedStyle(sil).fill : getComputedStyle(c).backgroundColor;
        }
        return out;
    }, paneSel(m1));
}

// ── Measures in the page ───────────────────────────────────────────────────────────────────────────

/** Nodes, edges with their arrowheads, outside labels, handles and the React Flow edges, in flow coordinates. */
async function measure(page: Page, m1: string) {
    return page.evaluate(async (sel: string) => {
        const pane = document.querySelector(sel);
        if (!pane) return { error: 'no pane ' + sel } as any;
        const vp = pane.querySelector('.react-flow__viewport') as HTMLElement | null;
        const mt = vp ? getComputedStyle(vp).transform : 'none';
        const mm = mt.match(/matrix\(([^)]+)\)/);
        const zoom = mm ? Number(mm[1].split(',')[0]) : 1;
        const w = window as any;
        const idl = w.windoww.store.getState().idlookup;
        const nameOfObj = (oid: string | null) => { try { return oid ? String(w.LPointerTargetable.fromPointer(oid)?.name ?? '') : ''; } catch { return ''; } };
        // The React Flow store of this pane (the fiber walk of tree-crossing.ts): edges with their handle ids.
        const rf = pane.querySelector('.react-flow');
        const key = rf && Object.keys(rf).find((k) => k.startsWith('__reactFiber$'));
        let f = key && (rf as any)[key]; let store: any = null;
        for (let i = 0; f && i < 80; i++, f = f.return) {
            const v = f.memoizedProps && f.memoizedProps.value;
            if (v && typeof v.getState === 'function' && typeof v.getState().triggerNodeChanges === 'function') { store = v; break; }
        }
        const rfEdges = store ? store.getState().edges.map((e: any) => ({ id: e.id, source: e.source, target: e.target, sourceHandle: e.sourceHandle ?? null, targetHandle: e.targetHandle ?? null, hidden: !!e.hidden, junctionIn: e.data?.irJunctionTarget?.side ?? null, junctionOut: e.data?.irJunctionSource?.side ?? null })) : null;
        const nodes = [...pane.querySelectorAll('.react-flow__node')].map((el) => {
            const h = el as HTMLElement;
            const t = h.style.transform.match(/translate\(\s*(-?[\d.]+)px\s*,\s*(-?[\d.]+)px\s*\)/);
            const id = h.getAttribute('data-id')!;
            const d = idl[id];
            const objId = d?.className === 'DObject' ? id : (d?.model ?? d?.data ?? null);
            const obj = idl[objId];
            const c = h.querySelector('.ir-node-content') as HTMLElement | null;
            const r = h.getBoundingClientRect();
            const ir = c ? c.getBoundingClientRect() : null;
            return {
                id, x: t ? Number(t[1]) : NaN, y: t ? Number(t[2]) : NaN, w: h.offsetWidth, h: h.offsetHeight,
                cl: { left: r.left, top: r.top }, inkCl: ir ? { left: ir.left, top: ir.top, width: ir.width, height: ir.height } : null,
                name: nameOfObj(objId) || (h.textContent ?? '').trim().slice(0, 30),
                cls: obj?.className === 'DObject' ? idl[obj.instanceof]?.name ?? null : null,
                form: (c?.className.match(/ir-shape--(\w+)/) ?? [])[1] ?? null,
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
        const outsideLabels = [...pane.querySelectorAll('.react-flow__node .ir-label--outside')].map((el) => {
            const r = el.getBoundingClientRect();
            const anchor = (['n', 'e', 's', 'w'] as const).find((a) => el.classList.contains(`ir-label--anchor-${a}`)) ?? null;
            return { node: el.closest('.react-flow__node')?.getAttribute('data-id') ?? null, anchor, text: (el.textContent ?? '').trim(), x: fx(r.left), y: fy(r.top), w: r.width / zoom, h: r.height / zoom };
        });
        // An arrowhead: the shape of the marker's children, in marker units, mapped onto the path's end (orient auto).
        const markerPoly = (p: SVGPathElement, which: 'start' | 'end') => {
            const ref = p.getAttribute(which === 'end' ? 'marker-end' : 'marker-start');
            const mid = ref?.match(/url\(#([^)]+)\)/)?.[1];
            const mk = mid ? document.getElementById(mid) : null;
            if (!mk) return null;
            const vb = (mk.getAttribute('viewBox') || '0 0 3 3').split(/[ ,]+/).map(Number);
            const mw = Number(mk.getAttribute('markerWidth') || 3), mh = Number(mk.getAttribute('markerHeight') || 3);
            const sw = (mk.getAttribute('markerUnits') || 'strokeWidth') === 'strokeWidth' ? (parseFloat(getComputedStyle(p).strokeWidth) || 1) : 1;
            const s = Math.min((mw * sw) / vb[2], (mh * sw) / vb[3]);
            const refX = Number(mk.getAttribute('refX') || 0), refY = Number(mk.getAttribute('refY') || 0);
            let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
            for (const ch of mk.querySelectorAll('path, circle, polygon, line')) {
                if (ch.tagName === 'circle') {
                    const cx = Number(ch.getAttribute('cx') || 0), cy = Number(ch.getAttribute('cy') || 0), r = Number(ch.getAttribute('r') || 0);
                    x0 = Math.min(x0, cx - r); x1 = Math.max(x1, cx + r); y0 = Math.min(y0, cy - r); y1 = Math.max(y1, cy + r);
                    continue;
                }
                const nums = (ch.getAttribute('d') ?? ch.getAttribute('points') ?? '').match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
                for (let i = 0; i + 1 < nums.length; i += 2) { x0 = Math.min(x0, nums[i]); x1 = Math.max(x1, nums[i]); y0 = Math.min(y0, nums[i + 1]); y1 = Math.max(y1, nums[i + 1]); }
            }
            if (!Number.isFinite(x0)) return null;
            const L = p.getTotalLength();
            if (L < 1) return null;
            const tip = p.getPointAtLength(which === 'end' ? L : 0);
            const back = p.getPointAtLength(which === 'end' ? Math.max(0, L - 2) : Math.min(L, 2));
            // orient auto: the marker's x axis along the path's direction at that end; auto-start-reverse turns the start.
            let ang = which === 'end' ? Math.atan2(tip.y - back.y, tip.x - back.x) : Math.atan2(back.y - tip.y, back.x - tip.x);
            if (which === 'start' && mk.getAttribute('orient') === 'auto-start-reverse') ang += Math.PI;
            const cos = Math.cos(ang), sin = Math.sin(ang);
            const map = (u: number, v: number) => { const lx = (u - refX) * s, ly = (v - refY) * s; return [Math.round((tip.x + lx * cos - ly * sin) * 100) / 100, Math.round((tip.y + lx * sin + ly * cos) * 100) / 100]; };
            return { id: mid, poly: [map(x0, y0), map(x1, y0), map(x1, y1), map(x0, y1)] };
        };
        const edges = [...pane.querySelectorAll('g.react-flow__edge')].map((g) => {
            const id = g.getAttribute('data-id')!;
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
            const heads = vis.flatMap((p) => [markerPoly(p, 'start'), markerPoly(p, 'end')]).filter(Boolean);
            return { id, d: main?.getAttribute('d') ?? null, pts: main ? sample(main) : [], all: vis.map((p) => sample(p)), heads, paths: vis.map((p) => p.getAttribute('d')) };
        });
        const labels = [...pane.querySelectorAll('.react-flow__edgelabel-renderer .edge-label, .react-flow__edgelabel-renderer .edge-end-label, .react-flow__edgelabel-renderer .edge-cardinality')].map((el) => {
            const span = (el.querySelector('.edge-label__text') as HTMLElement | null) ?? (el as HTMLElement);
            const r = span.getBoundingClientRect();
            const v = (span as any).checkVisibility ? (span as any).checkVisibility({ opacityProperty: true, visibilityProperty: true }) : true;
            return { text: (span.textContent ?? '').trim(), visible: v && r.width > 0, x: fx(r.left), y: fy(r.top), w: r.width / zoom, h: r.height / zoom };
        });
        // The route each edge was given (the session store elkLayout.ts keeps; the app's own module instance).
        let routes: Record<string, any> = {};
        try {
            const load = (x: string): Promise<any> => import(x);
            const el = await load('/src/components/editor-v2/utils/elkLayout.ts');
            for (const e of edges) { const r = el.getElkRoute(e.id); if (r) routes[e.id] = { points: r.points, sourceSide: r.sourceSide, targetSide: r.targetSide, orthogonal: r.orthogonal, sourceRect: r.sourceRect, targetRect: r.targetRect }; }
        } catch (err) { routes = { error: String(err) }; }
        return { zoom, calib: { OX, OY, spread }, nodes, edges, labels, outsideLabels, rfEdges, routes };
    }, paneSel(m1));
}

/**
 * Every solid notation glyph of the pane with the colour it is declared and painted in: a bar's ink, a disc
 * filled in a colour that is not the node surface, a filled marker part (the bull's-eye dot), an entry dot.
 * The client rect of each, and four canvas points around its node (10 px out), for the pixel read.
 */
async function glyphs(page: Page, m1: string) {
    return page.evaluate((sel: string) => {
        const pane = document.querySelector(sel);
        if (!pane) return [];
        const w = window as any;
        const idl = w.windoww.store.getState().idlookup;
        const nameOf = (el: Element) => { const id = el.getAttribute('data-id')!; const d = idl[id]; const o = d?.className === 'DObject' ? id : (d?.model ?? d?.data); try { return String(w.LPointerTargetable.fromPointer(o)?.name ?? ''); } catch { return ''; } };
        const out: any[] = [];
        const rectOf = (e: Element) => { const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; };
        for (const node of pane.querySelectorAll('.react-flow__node')) {
            const c = node.querySelector(':scope .ir-node-content') as HTMLElement | null;
            if (!c) continue;
            const form = (c.className.match(/ir-shape--(\w+)/) ?? [])[1] ?? null;
            const nb = node.getBoundingClientRect();
            // Eight canvas points round the node, 10 and 22 px out on each side and corner: their most frequent colour is the canvas.
            const around = [10, 22].flatMap((k) => [[nb.left - k, nb.top + nb.height / 2], [nb.right + k, nb.top + nb.height / 2], [nb.left - k, nb.top - k], [nb.right + k, nb.bottom + k]]);
            // Whether the glyph's centre is on screen and paints this node (a panel or the viewport edge would not).
            const hit = (e: Element) => { const r = e.getBoundingClientRect(); const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !!top && top.closest('.react-flow__node') === node; };
            const nid = node.getAttribute('data-id')!; const dd = idl[nid]; const oid = dd?.className === 'DObject' ? nid : (dd?.model ?? dd?.data);
            const cls = idl[idl[oid]?.instanceof]?.name ?? null;
            const base = { node: nameOf(node), cls, form, around, hitOf: hit };
            if (form === 'bar') {
                const cs = getComputedStyle(c);
                out.push({ ...base, kind: 'bar', declared: c.style.background || c.style.backgroundColor || null, computed: cs.backgroundColor, rect: rectOf(c), onScreen: hit(c) });
                continue;
            }
            const svg = c.querySelector(':scope > svg:not(.ir-marker-svg):not(.ir-entry-svg)');
            const silhouette = svg ? [...svg.querySelectorAll('path, polygon, ellipse, circle, rect')].find((p) => !/ir-sel-/.test(p.getAttribute('class') ?? '') && (p.getAttribute('fill') ?? 'none') !== 'none') : null;
            if (silhouette) {
                const decl = silhouette.getAttribute('fill');
                // A shape filled in an ink, not the node surface (the surface token, or the box default).
                if (decl && !/inode-surface|node-bg/.test(decl)) out.push({ ...base, kind: 'disc', declared: decl, computed: getComputedStyle(silhouette).fill, rect: rectOf(silhouette), onScreen: hit(silhouette) });
            } else if (!svg) {
                // A CSS-painted form (circle, rect, rounded): the fill is the inline background (IRNodeContent).
                const decl = c.style.background || c.style.backgroundColor;
                if (decl && !/inode-surface|node-bg/.test(decl)) out.push({ ...base, kind: 'disc', declared: decl, computed: getComputedStyle(c).backgroundColor, rect: rectOf(c), onScreen: hit(c) });
            }
            const body = silhouette ?? (svg ? null : c);
            for (const p of c.querySelectorAll(':scope > .ir-marker-svg path')) {
                const decl = p.getAttribute('fill');
                if (!decl || decl === 'none') continue;
                out.push({ ...base, kind: 'marker', declared: decl, computed: getComputedStyle(p).fill, rect: rectOf(p), inside: body ? rectOf(body) : null, onScreen: hit(p) });
            }
            for (const p of c.querySelectorAll(':scope > .ir-entry-svg circle')) {
                // The entry layer takes no pointer: on screen when what paints at its centre is the pane, not another node or a panel.
                const r = p.getBoundingClientRect();
                const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
                const free = !!top && !!top.closest('.react-flow') && (!top.closest('.react-flow__node') || top.closest('.react-flow__node') === node);
                out.push({ ...base, kind: 'entry', declared: p.getAttribute('fill'), computed: getComputedStyle(p).fill, rect: rectOf(p), onScreen: free });
            }
        }
        return out.map(({ hitOf, ...g }) => g);
    }, paneSel(m1));
}

/** The viewport screenshot decoded in the page: the RGB at each client point, 3x3 device pixels, median per channel. */
async function pixels(page: Page, points: number[][]): Promise<number[][]> {
    if (!points.length) return [];
    const png = await page.screenshot({ scale: 'device' });
    return page.evaluate(async ([b64, pts]: [string, number[][]]) => {
        const img = new Image();
        img.src = `data:image/png;base64,${b64}`;
        await img.decode();
        const cv = document.createElement('canvas');
        cv.width = img.naturalWidth; cv.height = img.naturalHeight;
        const g = cv.getContext('2d')!;
        g.drawImage(img, 0, 0);
        const k = img.naturalWidth / window.innerWidth;
        return pts.map(([x, y]) => {
            const px = Math.round(x * k), py = Math.round(y * k);
            const d = g.getImageData(px - 1, py - 1, 3, 3).data;
            const ch = [0, 1, 2].map((c) => { const v: number[] = []; for (let i = 0; i < 9; i++) v.push(d[i * 4 + c]); v.sort((a, b) => a - b); return v[4]; });
            return ch;
        });
    }, [png.toString('base64'), points] as [string, number[][]]);
}

async function crop(page: Page, m1: string, name: string) {
    const file = `${CROPS}/${name}.png`;
    const clip = await page.evaluate((sel: string) => {
        const pane = document.querySelector(sel)!;
        const rf = pane.querySelector('.react-flow')!.getBoundingClientRect();
        const els = [...pane.querySelectorAll('.react-flow__node, g.react-flow__edge path, .react-flow__edgelabel-renderer .edge-label__text, .react-flow__edgelabel-renderer .edge-end-label, .ir-label--outside')];
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        for (const e of els) { const r = e.getBoundingClientRect(); if (!r.width && !r.height) continue; x0 = Math.min(x0, r.left); y0 = Math.min(y0, r.top); x1 = Math.max(x1, r.right); y1 = Math.max(y1, r.bottom); }
        x0 = Math.max(rf.left, x0 - 24); y0 = Math.max(rf.top, y0 - 24); x1 = Math.min(rf.right, x1 + 24); y1 = Math.min(rf.bottom, y1 + 24);
        return { x: x0, y: y0, width: Math.max(10, x1 - x0), height: Math.max(10, y1 - y0) };
    }, paneSel(m1));
    await page.evaluate(() => { const st = document.createElement('style'); st.id = '__pipShot'; st.textContent = '.properties-tree-overlay, .react-flow__minimap, .react-flow__controls { visibility: hidden !important; }'; document.head.appendChild(st); });
    await wait(page, 150);
    await page.screenshot({ path: file, clip });
    await page.evaluate(() => document.getElementById('__pipShot')?.remove());
    try { execFileSync('sips', ['-Z', '900', file, '--out', file.replace(/\.png$/, '_900.png')], { stdio: 'ignore' }); } catch { /* sips absent */ }
    return file;
}

// ── Analysis (node side, pure) ────────────────────────────────────────────────────────────────────────

type Pt = number[];

/** WCAG 2 relative luminance of an sRGB triple, and the contrast ratio of two. */
const lum = ([r, g, b]: number[]) => {
    const f = (c: number) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const contrast = (a: number[], b: number[]) => { const x = lum(a), y = lum(b); return Math.round(((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)) * 100) / 100; };
const hex = (c: number[]) => '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');

/** The most frequent colour among the canvas samples (a dot of the grid loses to the background). */
function modeColour(cs: number[][]): number[] {
    const count = new Map<string, number>();
    for (const c of cs) count.set(hex(c), (count.get(hex(c)) ?? 0) + 1);
    const best = [...count.entries()].sort((a, b) => b[1] - a[1])[0][0];
    return cs.find((c) => hex(c) === best)!;
}

/** Glyphs with their painted colour, the canvas around, and the contrast; the bull's-eye dot also against its disc. */
async function inkOf(page: Page, m1: string) {
    await page.mouse.move(5, 5);
    // The overlays the crops hide (the properties tree sits over the pane's right side).
    await page.evaluate(() => { const st = document.createElement('style'); st.id = '__pipInk'; st.textContent = '.properties-tree-overlay, .react-flow__minimap, .react-flow__controls { visibility: hidden !important; }'; document.head.appendChild(st); });
    await wait(page, 300);
    const gs = await glyphs(page, m1);
    const points: number[][] = [];
    for (const g of gs) {
        points.push([g.rect.x + g.rect.w / 2, g.rect.y + g.rect.h / 2]);
        for (const a of g.around) points.push(a);
        // The disc a marker sits on: a point halfway between the marker and the disc's edge.
        if (g.inside) points.push([g.inside.x + g.inside.w * 0.5, g.inside.y + Math.max(2, (g.rect.y - g.inside.y) / 2)]);
    }
    const px = await pixels(page, points);
    await page.evaluate(() => document.getElementById('__pipInk')?.remove());
    let k = 0;
    return gs.map((g: any) => {
        const ink = px[k++];
        const canvas = modeColour(g.around.map(() => px[k++]));
        const disc = g.inside ? px[k++] : null;
        return {
            node: g.node, cls: g.cls, kind: g.kind, onScreen: g.onScreen, declared: g.declared, computed: g.computed, painted: hex(ink), canvas: hex(canvas),
            vsCanvas: contrast(ink, canvas), ...(disc ? { disc: hex(disc), vsDisc: contrast(ink, disc) } : {}),
            size: [Math.round(g.rect.w * 10) / 10, Math.round(g.rect.h * 10) / 10],
        };
    });
}

const segDist = (p: Pt, a: Pt, b: Pt) => {
    const dx = b[0] - a[0], dy = b[1] - a[1]; const L2 = dx * dx + dy * dy;
    const t = L2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2)) : 0;
    return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
};
const inRect = (p: Pt, r: { x: number; y: number; w: number; h: number }) => p[0] >= r.x && p[0] <= r.x + r.w && p[1] >= r.y && p[1] <= r.y + r.h;
function segsCross(a: Pt, b: Pt, c: Pt, d: Pt): boolean {
    const o = (p: Pt, q: Pt, r: Pt) => Math.sign((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]));
    return o(a, b, c) !== o(a, b, d) && o(c, d, a) !== o(c, d, b);
}
/** Distance between a rect and a polygon (0 when they overlap). */
function rectPolyDist(r: { x: number; y: number; w: number; h: number }, poly: Pt[]): number {
    const rc: Pt[] = [[r.x, r.y], [r.x + r.w, r.y], [r.x + r.w, r.y + r.h], [r.x, r.y + r.h]];
    const inPoly = (p: Pt) => { let s = 0; for (let i = 0; i < poly.length; i++) { const a = poly[i], b = poly[(i + 1) % poly.length]; const c = (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]); if (c !== 0) { if (s === 0) s = Math.sign(c); else if (Math.sign(c) !== s) return false; } } return true; };
    if (poly.some((p) => inRect(p, r)) || rc.some(inPoly)) return 0;
    let d = Infinity;
    for (let i = 0; i < 4; i++) for (let j = 0; j < poly.length; j++) {
        const a = rc[i], b = rc[(i + 1) % 4], c = poly[j], e = poly[(j + 1) % poly.length];
        if (segsCross(a, b, c, e)) return 0;
        d = Math.min(d, segDist(a, c, e), segDist(b, c, e), segDist(c, a, b), segDist(e, a, b));
    }
    return Math.round(d * 100) / 100;
}
/** Distance between a rect and a sampled polyline (0 when the line enters it). */
function rectLineDist(r: { x: number; y: number; w: number; h: number }, pts: Pt[]): number {
    let d = Infinity;
    for (const p of pts) {
        if (inRect(p, r)) return 0;
        const dx = Math.max(r.x - p[0], 0, p[0] - (r.x + r.w)), dy = Math.max(r.y - p[1], 0, p[1] - (r.y + r.h));
        d = Math.min(d, Math.hypot(dx, dy));
    }
    return Math.round(d * 100) / 100;
}

/** Question 2: every outside label, its nearest arrowhead and nearest line, and the sides of its node the edges use. */
function labelReport(m: any) {
    const byId = new Map<string, any>(m.nodes.map((n: any) => [n.id, n]));
    const nm = (id: string) => byId.get(id)?.name ?? id;
    return m.outsideLabels.map((l: any) => {
        const r = { x: l.x, y: l.y, w: l.w, h: l.h };
        let head = { d: Infinity, edge: '' }, line = { d: Infinity, edge: '' };
        for (const e of m.edges) {
            const name = (() => { const rf = (m.rfEdges ?? []).find((x: any) => x.id === e.id); return rf ? `${nm(rf.source)}->${nm(rf.target)}` : e.id; })();
            for (const h of e.heads) { const d = rectPolyDist(r, h.poly); if (d < head.d) head = { d, edge: name }; }
            for (const pts of e.all) { const d = rectLineDist(r, pts); if (d < line.d) line = { d, edge: name }; }
        }
        // The sides of the label's node the drawn ends take (classified on the node box, a bar on its ink).
        const n = byId.get(l.node);
        const sides: string[] = [];
        if (n) {
            const box = n.form === 'bar' && n.ink ? n.ink : n;
            for (const e of m.edges) {
                const rf = (m.rfEdges ?? []).find((x: any) => x.id === e.id);
                if (!rf || !e.pts.length) continue;
                if (rf.source === l.node) sides.push(`out:${sideOf(e.pts[0], box)}`);
                if (rf.target === l.node) sides.push(`in:${sideOf(e.pts[e.pts.length - 1], box)}`);
            }
        }
        return { node: nm(l.node), text: l.text, anchor: l.anchor, headDist: head.d === Infinity ? null : head.d, headEdge: head.edge, lineDist: line.d === Infinity ? null : line.d, lineEdge: line.edge, endSides: sides };
    });
}

/** The side of a box a point on or near its border belongs to. */
function sideOf(p: Pt, n: any): string {
    const ox = p[0] < n.x ? n.x - p[0] : p[0] > n.x + n.w ? p[0] - (n.x + n.w) : 0;
    const oy = p[1] < n.y ? n.y - p[1] : p[1] > n.y + n.h ? p[1] - (n.y + n.h) : 0;
    if (ox > oy) return p[0] < n.x ? 'left' : 'right';
    if (oy > ox) return p[1] < n.y ? 'top' : 'bottom';
    const d: [string, number][] = [['left', Math.abs(p[0] - n.x)], ['right', Math.abs(p[0] - n.x - n.w)], ['top', Math.abs(p[1] - n.y)], ['bottom', Math.abs(p[1] - n.y - n.h)]];
    d.sort((a, b) => a[1] - b[1]);
    return d[0][0];
}

/** Bends of a sampled polyline: runs of one direction (within 4 degrees) of at least 6 px, less one; null on a curve. */
function bendsOf(pts: Pt[]): number | null {
    const runs: { angle: number; len: number }[] = [];
    for (let i = 1; i < pts.length; i++) {
        const dx = pts[i][0] - pts[i - 1][0], dy = pts[i][1] - pts[i - 1][1];
        const len = Math.hypot(dx, dy);
        if (len < 1e-6) continue;
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        const last = runs[runs.length - 1];
        const diff = last ? Math.abs(((angle - last.angle + 540) % 360) - 180) : 999;
        if (last && diff <= 4) last.len += len; else runs.push({ angle, len });
    }
    const long = runs.filter((r) => r.len >= 6);
    const diag = long.filter((r) => { const a = ((r.angle % 90) + 90) % 90; return Math.min(a, 90 - a) > 2; });
    if (long.length > 6 && diag.length > 4) return null;
    return Math.max(0, long.length - 1);
}

const dist = (a: Pt | null, b: Pt | null) => (a && b ? Math.round(Math.hypot(a[0] - b[0], a[1] - b[1]) * 100) / 100 : null);
const sideOfHandle = (h: string | null) => (h ? h.split('-')[0] : null);

/**
 * Question 3: after Auto layout, per edge end: the drawn end, the end of the route the renderer was given, ELK's
 * own port (its section's end moved by its node's snap to the 8 px grid, as readElkResult moves it) and the React
 * Flow handle the edge is attached to; the sides of each; the bends drawn, of the route given, and of ELK's output.
 */
function portReport(m: any, cap: any) {
    const byId = new Map<string, any>(m.nodes.map((n: any) => [n.id, n]));
    const nm = (id: string) => byId.get(id)?.name ?? id;
    const outNodes = new Map<string, any>((cap?.out?.children ?? []).map((c: any) => [c.id, c]));
    const outEdges = new Map<string, any>((cap?.out?.edges ?? []).map((e: any) => [e.id, e]));
    const snap = (v: number) => Math.round(v / 8) * 8;
    const shiftOf = (id: string): Pt => { const c = outNodes.get(id); return c ? [snap(c.x) - c.x, snap(c.y) - c.y] : [0, 0]; };
    const rows: any[] = [];
    for (const e of m.edges) {
        const rf = (m.rfEdges ?? []).find((x: any) => x.id === e.id);
        if (!rf || rf.hidden || rf.source === rf.target || !e.pts.length) continue;
        const route = m.routes?.[e.id];
        const oe = outEdges.get(e.id);
        let elkStart: Pt | null = null, elkEnd: Pt | null = null, elkBends: number | null = null;
        if (oe?.sections?.length) {
            const s0 = oe.sections[0], s1 = oe.sections[oe.sections.length - 1];
            const src = oe.sources?.[0], tgt = oe.targets?.[0];
            const a = shiftOf(src), b = shiftOf(tgt);
            // An end on an Activity junction node (::junction::) keeps where ELK put it.
            elkStart = [s0.startPoint.x + (String(src).startsWith('::junction::') ? 0 : a[0]), s0.startPoint.y + (String(src).startsWith('::junction::') ? 0 : a[1])];
            elkEnd = [s1.endPoint.x + (String(tgt).startsWith('::junction::') ? 0 : b[0]), s1.endPoint.y + (String(tgt).startsWith('::junction::') ? 0 : b[1])];
            elkBends = oe.sections.reduce((n: number, s: any) => n + (s.bendPoints?.length ?? 0), 0);
        }
        const handleAt = (nodeId: string, hid: string | null, type: string): Pt | null => {
            const n = byId.get(nodeId);
            const h = n?.handles.find((x: any) => x.id === hid && x.type === type);
            return h ? [h.x, h.y] : null;
        };
        const drawnStart = e.pts[0], drawnEnd = e.pts[e.pts.length - 1];
        const rs = route?.points?.[0] ? [route.points[0].x, route.points[0].y] : null;
        const re = route?.points?.length ? [route.points[route.points.length - 1].x, route.points[route.points.length - 1].y] : null;
        const hs = handleAt(rf.source, rf.sourceHandle, 'source'), ht = handleAt(rf.target, rf.targetHandle, 'target');
        const sbox = byId.get(rf.source), tbox = byId.get(rf.target);
        const boxOf = (n: any) => (n?.form === 'bar' && n.ink ? n.ink : n);
        rows.push({
            edge: `${nm(rf.source)}->${nm(rf.target)}`, id: e.id,
            junction: rf.junctionIn || rf.junctionOut ? { in: rf.junctionIn, out: rf.junctionOut } : null,
            routed: !!route, elkCaptured: !!oe,
            source: {
                drawnVsRoute: dist(drawnStart, rs), drawnVsElk: dist(drawnStart, elkStart), drawnVsHandle: dist(drawnStart, hs), routeVsElk: dist(rs, elkStart),
                drawnSide: sbox ? sideOf(drawnStart, boxOf(sbox)) : null, routeSide: route?.sourceSide ?? null, handleSide: sideOfHandle(rf.sourceHandle), handleFound: !!hs,
            },
            target: {
                drawnVsRoute: dist(drawnEnd, re), drawnVsElk: dist(drawnEnd, elkEnd), drawnVsHandle: dist(drawnEnd, ht), routeVsElk: dist(re, elkEnd),
                drawnSide: tbox ? sideOf(drawnEnd, boxOf(tbox)) : null, routeSide: route?.targetSide ?? null, handleSide: sideOfHandle(rf.targetHandle), handleFound: !!ht,
            },
            bends: { drawn: bendsOf(e.pts), route: route?.points ? Math.max(0, route.points.length - 2) : null, elk: elkBends },
        });
    }
    return rows;
}

/** The acceptance numbers of a pane, for the Phase 2 compare. */
function acceptance(ink: any[] | null, labels: any[], ports: any[] | null) {
    const ends = (ports ?? []).flatMap((r: any) => [{ e: r.edge, end: 'source', j: !!r.junction, ...r.source }, { e: r.edge, end: 'target', j: !!r.junction, ...r.target }]);
    return {
        inkMinVsCanvas: ink && ink.length ? Math.min(...ink.filter((g) => g.kind !== 'marker').map((g) => g.vsCanvas)) : null,
        inkBelow3: (ink ?? []).filter((g) => (g.kind === 'marker' ? (g.vsDisc ?? g.vsCanvas) : g.vsCanvas) < 3).map((g) => `${g.node} ${g.kind} ${g.painted} on ${g.kind === 'marker' ? g.disc : g.canvas} ${g.kind === 'marker' ? g.vsDisc : g.vsCanvas}`),
        labelsNearHead: labels.filter((l) => l.headDist !== null && l.headDist < 4).map((l) => `${l.node}:${l.text} ${l.headDist} ${l.headEdge}`),
        labelsOnLine: labels.filter((l) => l.lineDist !== null && l.lineDist < 1).map((l) => `${l.node}:${l.text} ${l.lineEdge}`),
        endsOffHandle: ends.filter((x) => x.drawnVsHandle === null || x.drawnVsHandle > 1).length,
        endsOffElk: ends.filter((x) => x.drawnVsElk !== null && x.drawnVsElk > 1).length,
        ends: ends.length,
        handleSideMismatch: ends.filter((x) => x.handleSide && x.drawnSide && x.handleSide !== x.drawnSide).length,
        extraBends: (ports ?? []).reduce((n: number, r: any) => n + (r.bends.drawn !== null && r.bends.elk !== null ? Math.max(0, r.bends.drawn - r.bends.elk) : 0), 0),
    };
}

/** The default viewpoint's pane, by names: what Phase 2 must leave identical. */
const round2 = (d: string | null) => (d ?? '').replace(/-?\d+\.\d+/g, (x) => String(Math.round(Number(x) * 100) / 100));
function defaultDump(m: any) {
    const byId = new Map<string, any>(m.nodes.map((n: any) => [n.id, n]));
    const nm = (id: string) => byId.get(id)?.name ?? id;
    const rfOf = (id: string) => (m.rfEdges ?? []).find((x: any) => x.id === id);
    return {
        nodes: m.nodes.map((n: any) => [n.name, Math.round(n.x * 100) / 100, Math.round(n.y * 100) / 100, n.w, n.h]).sort((p: any, q: any) => String(p[0]).localeCompare(String(q[0]))),
        edges: m.edges.map((e: any) => { const rf = rfOf(e.id); return [rf ? `${nm(rf.source)}->${nm(rf.target)}` : e.id, e.paths.map((p: string) => round2(p))]; }).sort((p: any, q: any) => JSON.stringify(p).localeCompare(JSON.stringify(q))),
        labels: m.labels.filter((l: any) => l.visible).map((l: any) => [l.text, Math.round(l.x * 10) / 10, Math.round(l.y * 10) / 10]).sort((p: any, q: any) => JSON.stringify(p).localeCompare(JSON.stringify(q))),
    };
}

// ── Compare: PIP_COMPARE=<before.json>,<after.json> ───────────────────────────────────────────────────
if (process.env.PIP_COMPARE) {
    const [b, a] = process.env.PIP_COMPARE.split(',').map((f) => JSON.parse(readFileSync(f, 'utf8')));
    for (const key of Object.keys(b.scenes ?? {})) {
        for (const theme of ['light', 'dark']) {
            const x = round2(JSON.stringify(b.scenes[key]?.defaultPane?.[theme])), y = round2(JSON.stringify(a.scenes?.[key]?.defaultPane?.[theme]));
            check(`${key}: the default viewpoint's pane identical before and after (${theme})`, !!x && x === y, x === y ? 'identical' : { before: x?.slice(0, 600), after: y?.slice(0, 600) });
        }
        for (const notation of Object.keys(b.scenes[key].notations ?? {})) {
            for (const phase of ['rest', 'elk', 'elkDown']) {
                const nb = b.scenes[key].notations[notation]?.acceptance?.[phase], na = a.scenes?.[key]?.notations?.[notation]?.acceptance?.[phase];
                if (nb || na) meas(`${key}/${notation} ${phase} acceptance before -> after`, [nb ?? null, na ?? null]);
            }
        }
    }
    console.log(`RESULT ${pass}/${pass + fail}`);
    process.exit(fail ? 1 : 0);
}

// ── Main ──────────────────────────────────────────────────────────────────────────────────────────────

mkdirSync(CROPS, { recursive: true });
mkdirSync(OUT.replace(/\/[^/]*$/, ''), { recursive: true });
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
    meas(`${sc.key} theme light`, await setTheme(page, 'light'));
    const mm = models.find((m) => m.meta)!.id;
    const m1 = models.find((m) => !m.meta)!.id;
    const defaultVp = await page.evaluate(() => (window as any).windoww.store.getState().viewpoint ?? null);
    await openModel(page, m1);
    await fit(page, m1);
    const sceneOut: any = { mm, m1, notations: {}, defaultPane: {} };
    // The default viewpoint at rest, both themes: Phase 2 leaves it byte-identical. Its glyphs too (none expected).
    sceneOut.defaultPane.light = defaultDump(await measure(page, m1));
    sceneOut.defaultInk = { light: await inkOf(page, m1) };
    await crop(page, m1, `pip_${TAG}_${sc.key}_default_light`);
    meas(`${sc.key} theme dark`, await setTheme(page, 'dark'));
    await wait(page, 800);
    sceneOut.defaultPane.dark = defaultDump(await measure(page, m1));
    sceneOut.defaultInk.dark = await inkOf(page, m1);
    await crop(page, m1, `pip_${TAG}_${sc.key}_default_dark`);
    await setTheme(page, 'light');
    await wait(page, 800);
    for (const notation of sc.notations) {
        await activate(page, defaultVp);
        const d = await derive(page, mm, sc.profile, notation);
        meas(`${sc.key}/${notation} derive`, { vp: d.vp, layout: d.layout, views: d.views });
        check(`${sc.key}/${notation}: derived`, !!d.vp, d.vp);
        await activate(page, d.vp);
        await openModel(page, m1);
        await fit(page, m1);
        const n: any = { derive: d, acceptance: {} };
        // 1. Ink, at rest, light then dark (the glyphs do not move with the layout).
        n.ink = { light: await inkOf(page, m1) };
        await crop(page, m1, `pip_${TAG}_${sc.key}_${notation}_rest_light`);
        await setTheme(page, 'dark');
        await wait(page, 800);
        n.ink.dark = await inkOf(page, m1);
        await crop(page, m1, `pip_${TAG}_${sc.key}_${notation}_rest_dark`);
        await setTheme(page, 'light');
        await wait(page, 800);
        // 1b. «Color by metaclass» on: the glyphs paint as off (R-VP-50); the control is a node that is not a glyph changing fill.
        if (d.vp) {
            const offFills = await fills(page, m1);
            const on = await setColoring(page, d.vp, true);
            n.ink.coloured = await inkOf(page, m1);
            const onFills = await fills(page, m1);
            await setColoring(page, d.vp, false);
            const glyphNodes = new Set(n.ink.light.map((g: any) => g.node));
            const changed = Object.keys(offFills).filter((k) => !glyphNodes.has(k) && onFills[k] !== offFills[k]);
            check(`${sc.key}/${notation}: «Color by metaclass» switched on (control: a node that is not a glyph changes fill)`, on && changed.length > 0, { on, changed: changed.map((k) => `${k} ${offFills[k]} -> ${onFills[k]}`).slice(0, 4) });
            // Matched by node, kind and order: with the option on, an ordinary node's inline pastel reads as a filled shape too.
            // A marker is a notation glyph when its view draws a plain marker (the bull's-eye, R-VP-50); a Conditional marker is
            // the token count inside a place, a coloured node, which paints in that node's text colour (R-VP-30).
            const plainMarker = new Set(d.views.filter((v: any) => typeof v.shape?.marker === 'string' && v.shape.marker).map((v: any) => String(v.name).replace(/^View for /, '')));
            const isGlyph = (g: any) => g.kind !== 'marker' || plainMarker.has(g.cls);
            n.ink.light.forEach((g: any) => { g.glyph = isGlyph(g); }); n.ink.dark.forEach((g: any) => { g.glyph = isGlyph(g); });
            const keyed = (list: any[]) => { const seen = new Map<string, number>(); return list.map((g) => { const k = `${g.node}|${g.kind}`; const i = seen.get(k) ?? 0; seen.set(k, i + 1); return [`${k}|${i}`, g] as const; }); };
            const onBy = new Map(keyed(n.ink.coloured));
            const pairs = keyed(n.ink.light).filter(([, g]) => g.glyph).map(([k, g]) => ({ k, off: g.painted, on: onBy.get(k)?.painted ?? null }));
            check(`${sc.key}/${notation}: every glyph paints the same with «Color by metaclass» on`, pairs.length > 0 && pairs.every((p) => p.off === p.on), pairs.map((p) => `${p.k} ${p.off}/${p.on}`));
        }
        meas(`${sc.key}/${notation} ink light`, n.ink.light);
        meas(`${sc.key}/${notation} ink dark`, n.ink.dark);
        // A control with signal: the ink read must differ between the themes for every glyph whose declared colour is a
        // theme token (a token that resolves the same in both would make a theme-blind read look right).
        const tokenGlyphs = n.ink.light.filter((g: any, i: number) => /var\(/.test(g.declared ?? '') && n.ink.dark[i]);
        check(`${sc.key}/${notation}: every glyph read on screen, painting its own node (light, dark)`, [...n.ink.light, ...n.ink.dark].every((g: any) => g.onScreen), [...n.ink.light, ...n.ink.dark].filter((g: any) => !g.onScreen).map((g: any) => `${g.node} ${g.kind}`));
        // And the canvas read itself: the background around every glyph changes with the theme.
        if (n.ink.light.length) check(`${sc.key}/${notation}: the canvas read follows the theme`, n.ink.light.every((g: any, i: number) => n.ink.dark[i] && g.canvas !== n.ink.dark[i].canvas), n.ink.light.map((g: any, i: number) => `${g.node} ${g.canvas}/${n.ink.dark[i]?.canvas}`));
        if (tokenGlyphs.length) check(`${sc.key}/${notation}: the pixel read follows the theme on token-inked glyphs`, tokenGlyphs.every((g: any) => { const k = n.ink.light.indexOf(g); return g.painted !== n.ink.dark[k].painted; }), tokenGlyphs.map((g: any) => { const k = n.ink.light.indexOf(g); return `${g.node} ${g.painted}/${n.ink.dark[k].painted}`; }));
        // 2. Labels, at rest.
        const restRaw = await measure(page, m1);
        if (restRaw.error) { check(`${sc.key}/${notation}: pane measured`, false, restRaw.error); continue; }
        n.labels = { rest: labelReport(restRaw) };
        n.raw = { rest: restRaw };
        // 3. Auto layout, then labels and ports.
        const wrapped = await installWrapper(page);
        const capBefore = await page.evaluate(() => (window as any).__pipCaps?.length ?? 0);
        const calls = await clickLayout(page, m1);
        await fit(page, m1);
        await wait(page, 800);
        const elkRaw = await measure(page, m1);
        const cap = await page.evaluate((k: number) => (window as any).__pipCaps?.[k] ?? null, capBefore);
        check(`${sc.key}/${notation}: the toolbar auto-layout ran ELK once and the call was captured`, calls === 1 && !!cap, { calls, wrapped });
        check(`${sc.key}/${notation}: calibration spread < 1 px (rest, elk)`, restRaw.calib.spread < 1 && elkRaw.calib.spread < 1, [restRaw.calib.spread, elkRaw.calib.spread]);
        check(`${sc.key}/${notation}: the React Flow store and the route store were read`, Array.isArray(elkRaw.rfEdges) && !elkRaw.routes?.error && Object.keys(elkRaw.routes ?? {}).length > 0, { rf: elkRaw.rfEdges?.length ?? null, routes: elkRaw.routes?.error ?? Object.keys(elkRaw.routes ?? {}).length });
        n.labels.elk = labelReport(elkRaw);
        n.ports = portReport(elkRaw, cap);
        n.raw.elk = elkRaw;
        n.elkCapture = cap;
        await crop(page, m1, `pip_${TAG}_${sc.key}_${notation}_elk_light`);
        await setTheme(page, 'dark');
        await wait(page, 800);
        await crop(page, m1, `pip_${TAG}_${sc.key}_${notation}_elk_dark`);
        await setTheme(page, 'light');
        await wait(page, 800);
        n.acceptance.rest = acceptance(n.ink.light.concat(n.ink.dark.map((g: any) => ({ ...g, node: `${g.node}(dark)` }))), n.labels.rest, null);
        n.acceptance.elk = acceptance(null, n.labels.elk, n.ports);
        // 2b. Classic Petri: the profile turned DOWN, a second Auto layout (vertical arcs, the case of 2026-10-02).
        if (notation === 'petriClassic' && d.vp) {
            const turned = await setDirection(page, d.vp, 'DOWN');
            check(`${sc.key}/${notation}: the profile turned DOWN`, !!turned.ok, turned);
            const capDown = await page.evaluate(() => (window as any).__pipCaps?.length ?? 0);
            const callsDown = await clickLayout(page, m1);
            await fit(page, m1);
            await wait(page, 800);
            const downRaw = await measure(page, m1);
            const capD = await page.evaluate((k: number) => (window as any).__pipCaps?.[k] ?? null, capDown);
            check(`${sc.key}/${notation}: the DOWN layout ran with direction DOWN`, callsDown === 1 && capD?.input?.layoutOptions?.['elk.direction'] === 'DOWN', { callsDown, dir: capD?.input?.layoutOptions?.['elk.direction'] });
            n.labels.elkDown = labelReport(downRaw);
            n.portsDown = portReport(downRaw, capD);
            n.raw.elkDown = downRaw;
            n.acceptance.elkDown = acceptance(null, n.labels.elkDown, n.portsDown);
            await crop(page, m1, `pip_${TAG}_${sc.key}_${notation}_elkdown_light`);
            await setDirection(page, d.vp, 'RIGHT');
        }
        for (const ph of Object.keys(n.labels)) meas(`${sc.key}/${notation} labels ${ph}`, n.labels[ph]);
        meas(`${sc.key}/${notation} ports elk`, n.ports.map((r: any) => [r.edge, r.junction ? 'junction' : '', r.routed ? 'routed' : 'router', r.source, r.target, r.bends]));
        if (n.portsDown) meas(`${sc.key}/${notation} ports elkDown`, n.portsDown.map((r: any) => [r.edge, r.routed ? 'routed' : 'router', r.source, r.target, r.bends]));
        for (const ph of Object.keys(n.acceptance)) meas(`${sc.key}/${notation} acceptance ${ph}`, n.acceptance[ph]);
        sceneOut.notations[notation] = n;
        result.scenes[sc.key] = sceneOut;
        writeFileSync(OUT, JSON.stringify(result, null, 0));
    }
    meas(`${sc.key} page errors`, errors.slice(0, 6));
    check(`${sc.key}: no page errors`, errors.length === 0, errors.slice(0, 3));
    await ctx.close();
}
writeFileSync(OUT, JSON.stringify(result, null, 0));
await browser.close();
meas('out', OUT);
console.log(`RESULT ${pass}/${pass + fail}`);
process.exit(fail ? 1 : 0);
