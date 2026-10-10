/**
 * gv-right-margin (P-2026-10-11-0040): the right margin of a framing container, measured from the DOM.
 *
 * Builds the S2b statechart and the BPMN fixture of the graphVertex front and measures them as built, after one
 * toolbar Auto layout, and again after a save, a reload and a reopen. The statechart has one step more between the
 * last two: Active's leftmost substate (i1) dragged one grid step (16 px) to the right, the case where a region's
 * children sit more than the margin past its start, which the presentation pass used to take off the right.
 *
 * Measured with `getBoundingClientRect`, in flow px (screen px over the viewport's zoom), the four gaps between every
 * framing container and the union of its visible children's node boxes, twice: from the container's node box (the
 * geometry the presentation pass writes) and from the inner side of its painted border (`.ir-node-content`, inset in
 * the node by the wrapper's border). The partitions (A1, A2; Sales, Warehouse) and the self-framed Running are the
 * acceptance; Active, Shop and the free Customer pool are reported only.
 *
 * Checks: every right gap of the node box at least 16 px; with GM_BASE (the JSON of a run on the code before the fix),
 * no left, top or bottom gap smaller than there, phase by phase, 0.5 px of tolerance.
 *
 * Run:  ~/.local/bin/node frontend/scripts/lane-run.mjs probe ~/jjodel-w-gvmargin \
 *         frontend/scripts/probe/gv-right-margin.ts --port 3087 --id P-2026-10-11-0040
 * Env:  GM_TAG   label of the run in file names (default after)
 *       GM_OUT   output directory (default ~/.jjodel-lanes/P-2026-10-11-0040)
 *       GM_ONLY  comma list of scenes: statechart, bpmn (default both)
 *       GM_BASE  the JSON of the run to compare with (optional)
 */
import { chromium, type Browser, type Page } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { autoLayout, buildBpmnScene, drag, ev, pickViewpoint, screenBox, zoomOf } from './bpmn-lanes-fixture.ts';
import { buildStatechartScene } from './statechart-fixture.ts';
import { setTheme } from '../smoke/states.ts';

const URL = (process.env.PROBE_URL || 'http://localhost:3087/').replace(/\/$/, '');
if (/:300[013]$/.test(URL)) throw new Error('never 3000, 3001 or 3003');
const TAG = process.env.GM_TAG || 'after';
const OUT = (process.env.GM_OUT || `${process.env.HOME}/.jjodel-lanes/P-2026-10-11-0040`).replace(/\/$/, '');
const ONLY = (process.env.GM_ONLY || 'statechart,bpmn').split(',').filter(Boolean);
const BASE = process.env.GM_BASE ? JSON.parse(readFileSync(process.env.GM_BASE, 'utf8')) as Record<string, any> : null;
mkdirSync(OUT, { recursive: true });

/** The margin the prompt asks for on the right: PARTITION_CONTENT_MARGIN (irContainment.ts). */
const MARGIN = 16;
/** The canvas's snap grid (EditorV2 `snapGrid`): a drag lands on it. */
const GRID = 16;
const ACTIVE = '.dock-tabpane-active .react-flow';

let pass = 0; let fail = 0;
const check = (name: string, ok: boolean, detail: unknown) => {
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  ${JSON.stringify(detail).slice(0, 1500)}`);
    if (ok) pass++; else fail++;
};
const meas = (name: string, v: unknown) => console.log(`MEAS  ${name}  ${JSON.stringify(v).slice(0, 3000)}`);

/** [label, container key, child keys, part of the acceptance]. */
type Target = [string, string, string[], boolean];
const SC_TARGETS: Target[] = [
    ['A1', 'a1', ['i1', 'waiting', 'processing'], true],
    ['A2', 'a2', ['i2', 'running', 'paused'], true],
    ['Running', 'running', ['i3', 'fetch', 'compute'], true],
    ['Active', 'active', ['a1', 'a2'], false],
];
const BPMN_TARGETS: Target[] = [
    ['Sales', 'sales', ['start', 'check', 'gw'], true],
    ['Warehouse', 'warehouse', ['ship', 'end'], true],
    ['Shop', 'shop', ['sales', 'warehouse'], false],
    ['Customer', 'customer', ['place', 'receive'], false],
];

/** One target's gaps, flow px, [left, right, top, bottom]: `node` from the node box, `paint` from the inner side of
 *  the painted border. */
interface Gaps { label: string; acceptance: boolean; kids: number; zoom: number; node: number[]; paint: number[]; border: number[]; inset: number[] }

async function gapsOf(page: Page, ids: Record<string, { vertex: string }>, targets: Target[]): Promise<Gaps[]> {
    const arg = targets.map(([label, c, kids, acceptance]) => ({ label, acceptance, c: ids[c].vertex, kids: kids.map((k) => ids[k].vertex) }));
    return page.evaluate(([root, list]) => {
        const vp = document.querySelector(`${root} .react-flow__viewport`) as HTMLElement | null;
        const zoom = vp ? new DOMMatrixReadOnly(getComputedStyle(vp).transform).a : 1;
        const nodeEl = (id: string) => document.querySelector(`${root} .react-flow__node[data-id="${id}"]`) as HTMLElement | null;
        const r1 = (v: number) => Math.round(v * 10) / 10;
        return list.map(({ label, acceptance, c, kids }) => {
            const n = nodeEl(c);
            const paint = (n?.querySelector('.ir-node-content') as HTMLElement | null) ?? n;
            const rects = kids.map(nodeEl).filter((e): e is HTMLElement => !!e && getComputedStyle(e).visibility !== 'hidden' && e.style.display !== 'none')
                .map((e) => e.getBoundingClientRect());
            if (!n || !paint || rects.length === 0) return { label, acceptance, kids: rects.length, zoom, node: [], paint: [], border: [], inset: [] };
            const nr = n.getBoundingClientRect();
            const pr = paint.getBoundingClientRect();
            const s = getComputedStyle(paint);
            const b = [s.borderLeftWidth, s.borderRightWidth, s.borderTopWidth, s.borderBottomWidth].map((v) => parseFloat(v) || 0);
            const minL = Math.min(...rects.map((k) => k.left)); const maxR = Math.max(...rects.map((k) => k.right));
            const minT = Math.min(...rects.map((k) => k.top)); const maxB = Math.max(...rects.map((k) => k.bottom));
            const gaps = (r: DOMRect, bw: number[]) => [
                r1((minL - r.left) / zoom - bw[0]), r1((r.right - maxR) / zoom - bw[1]), r1((minT - r.top) / zoom - bw[2]), r1((r.bottom - maxB) / zoom - bw[3]),
            ];
            return {
                label, acceptance, kids: rects.length, zoom: r1(zoom * 1000) / 1000,
                node: gaps(nr, [0, 0, 0, 0]), paint: gaps(pr, b), border: b,
                inset: [r1((pr.left - nr.left) / zoom), r1((nr.right - pr.right) / zoom), r1((pr.top - nr.top) / zoom), r1((nr.bottom - pr.bottom) / zoom)],
            };
        });
    }, [ACTIVE, arg] as const);
}

/** The stored record of each target under the layout key in force: position, size, `isResized`. */
async function recordsOf(page: Page, ids: Record<string, { vertex: string }>, keys: string[]) {
    return ev<Record<string, unknown>>(page, `
        const lay = await import('/src/components/editor-v2/viewpoint/layout/vertexLayout.ts');
        const ad = await import('/src/components/editor-v2/viewpoint/layout/vertexLayoutAdapter.ts');
        const idl = w.store.getState().idlookup; const key = ad.getActiveLayoutKey();
        return Object.fromEntries(a.map(([k, v]) => { const r = lay.readVertexLayout(idl[v] || {}, key);
            return [k, [r.x, r.y, r.w, r.h, !!r.isResized]]; }));`, keys.map((k) => [k, ids[k].vertex]), 0);
}

/** A light-theme crop of one node, a margin around it, at the canvas's zoom. */
async function crop(page: Page, vertexId: string, file: string) {
    const box = await page.locator(`${ACTIVE} .react-flow__node[data-id="${vertexId}"]`).first().boundingBox();
    if (!box) { meas('crop', `${file}: no box`); return; }
    const m = 24;
    await page.screenshot({ path: `${OUT}/${file}`, clip: { x: Math.max(0, box.x - m), y: Math.max(0, box.y - m), width: box.width + 2 * m, height: box.height + 2 * m } });
    meas('crop', `${OUT}/${file}`);
}

/** Save, reload, reopen the project, its model and the viewpoint; the probe's light theme again. */
async function saveReload(page: Page, viewpoint: string) {
    const saved = await ev<{ id: string; stored: boolean }>(page, `
        const api = await import('/src/api/persistance/projects.ts');
        const p = w.LProject.getProject();
        await api.ProjectsApi.save(p, { silent: true });
        await new Promise((r) => setTimeout(r, 2000));
        const a = JSON.parse(localStorage.getItem('projects') || '[]');
        return { id: p.id, stored: !!a.find((x) => x.id === p.id) };`, undefined, 0);
    await page.goto(`${URL}/#/allProjects`, { waitUntil: 'domcontentloaded', timeout: 300000 });
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 300000 });
    await page.waitForTimeout(5000);
    await page.goto(`${URL}/#/project?id=${saved.id}`, { waitUntil: 'domcontentloaded', timeout: 300000 });
    await page.waitForTimeout(9000);
    await page.addStyleTag({ content: '.notification-widget, .notification-content, .donation-banner { pointer-events: none !important; display: none !important; }' }).catch(() => {});
    // Not open at load: open the model as the tree and the Data manager do (DockManager.open2).
    if (!(await page.locator('.toolbar-viewpoint-trigger:visible').count())) {
        await ev(page, `const dm = await import('/src/components/abstract/DockManager.tsx'); const m = w.LProject.getProject().models[0];
            await dm.default.open2(w.LPointerTargetable.fromPointer(m.id)); return 1;`, undefined, 8000);
    }
    await setTheme(page, 'light');
    const current = await page.locator('.toolbar-viewpoint-trigger__label:visible').first().textContent().catch(() => null);
    if (!current || !current.includes(viewpoint)) await pickViewpoint(page, viewpoint);
    await page.waitForTimeout(3000);
    return { ...saved, viewpointBefore: current };
}

const line = (gs: Gaps[]) => gs.map((g) => `${g.label} node ${g.node.join('/')} paint ${g.paint.join('/')} (${g.kids})`);

async function scene(browser: Browser, name: 'statechart' | 'bpmn', out: Record<string, unknown>) {
    const built = name === 'statechart' ? await buildStatechartScene(browser) : await buildBpmnScene(browser, `margin_${TAG}`);
    if (!built) { check(`${name}: scene built`, false, null); return; }
    const { page, errors, ids } = built;
    const targets = name === 'statechart' ? SC_TARGETS : BPMN_TARGETS;
    const viewpoint = name === 'statechart' ? 'Statechart' : 'BPMN';
    const cropKey = name === 'statechart' ? 'active' : 'shop';
    const keys = [...new Set(targets.flatMap(([, c, kids]) => [c, ...kids]))];
    const res: Record<string, unknown> = {};
    out[name] = res;

    const phases = name === 'statechart' ? ['built', 'layout', 'drag', 'reload'] as const : ['built', 'layout', 'reload'] as const;
    for (const phase of phases) {
        if (phase === 'layout') await autoLayout(page);
        if (phase === 'drag') {
            // i1, the leftmost substate of A1, one grid step right: A1 is the wider region after the layout.
            const b = await screenBox(page, ids.i1.vertex);
            const z = await zoomOf(page);
            const from = b ? { x: b.x + b.width / 2, y: b.y + b.height / 2 } : null;
            if (from) await drag(page, from, { x: from.x + GRID * z, y: from.y }, 2500);
            res.dragFrom = from;
        }
        if (phase === 'reload') res.reopen = await saveReload(page, viewpoint);
        const gaps = await gapsOf(page, ids, targets);
        res[phase] = { gaps, records: await recordsOf(page, ids, keys) };
        meas(`${name} ${phase} gaps [L/R/T/B]`, line(gaps));
        if (phase !== 'built') {
            const acc = gaps.filter((g) => g.acceptance);
            check(`${name} ${phase}: every partition and self-framed container keeps a right gap of at least ${MARGIN} px (node box)`,
                acc.length > 0 && acc.every((g) => g.kids > 0 && g.node[1] >= MARGIN - 0.5),
                acc.map((g) => [g.label, g.node[1], g.paint[1]]));
            const base = BASE?.[name]?.[phase]?.gaps as Gaps[] | undefined;
            if (base) {
                const smaller = gaps.flatMap((g) => {
                    const o = base.find((x) => x.label === g.label);
                    if (!o || !o.node?.length || !g.node.length) return [];
                    return ([[0, 'left'], [2, 'top'], [3, 'bottom']] as const).filter(([i]) => g.node[i] < o.node[i] - 0.5)
                        .map(([i, side]) => `${g.label} ${side} ${o.node[i]} -> ${g.node[i]}`);
                });
                check(`${name} ${phase}: no left, top or bottom gap smaller than in ${BASE?.tag}`, smaller.length === 0, smaller);
            }
            await crop(page, ids[cropKey].vertex, `${cropKey}-${phase}-${TAG}-light.png`);
        }
    }
    res.errors = errors.slice(0, 20);
    await page.context().close();
}

if (process.argv[1] && /gv-right-margin\.ts$/.test(process.argv[1])) {
    const browser = await chromium.launch();
    const out: Record<string, unknown> = { url: URL, tag: TAG, at: new Date().toISOString() };
    try {
        if (ONLY.includes('statechart')) await scene(browser, 'statechart', out);
        if (ONLY.includes('bpmn')) await scene(browser, 'bpmn', out);
    } finally {
        out.checks = { pass, fail };
        writeFileSync(`${OUT}/margin-${TAG}.json`, JSON.stringify(out, null, 2));
        meas('json', `${OUT}/margin-${TAG}.json`);
        await browser.close();
    }
    console.log(`DONE pass=${pass} fail=${fail}`);
    process.exit(fail === 0 ? 0 : 1);
}
