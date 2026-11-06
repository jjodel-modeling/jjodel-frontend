/**
 * jjodie-s4b-ghost-preview probe (P-2026-10-24-0255, visual check of slice S4b, R-JJD-2). Read-only on sources: it
 * writes only to the throwaway browser profile, to the model of the imported scene and to the lane folder.
 *
 * Question: on an M1 model drawn on the canvas, fire `JjodelEvents.SCRIPT_PREVIEW_REQUEST` with a small script (three
 * created instances, two references, one unknown feature). Do the ghost nodes and edges render as specified (dashed
 * #06b6d4 border, translucent fill, dashed edges, amber marker on the warned element), does the bar read
 * `Preview · +N objects · K warnings`, are the ghosts inert (no selection change on click, no move on drag), clear of
 * the drawn nodes, and do Discard and Apply do what they say (no model change; exactly the planned elements)?
 *
 * The script is composed from the model's own metaclasses (the PlanWorld of `planWorld.ts`): a class C with a
 * non-containment reference r, without an opposite, to a concrete class T. Expected: N = 3, K = 1.
 *
 * Fixture: scene_1_DemoPEST.jjodel (OED_SCENES dir, as canvas-multi-selection.ts); the first M1 whose pane shows a
 * node and whose metamodel offers such a reference. Real app, own dev server (never 3000, 3001, 3003), 1600x1000,
 * light theme, advanced mode.
 *
 * Run:  PROBE_URL=http://localhost:<port>/ ~/.local/bin/node frontend/scripts/probe/jjodie-s4b-ghost-preview.ts
 * Env:  S4P_SCENES  directory of the scene exports (default ~/jjodel-demo-exports)
 *       S4P_OUT     lane folder (default ~/.jjodel-lanes/P-2026-10-24-0255)
 *
 * Exit code: number of failed checks.
 */
import { chromium, type Page } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { seed } from '../smoke/states.ts';

const URL = (process.env.PROBE_URL || 'http://localhost:3012/').replace(/\/$/, '');
if (/:(3000|3001|3003)$/.test(URL)) throw new Error('never 3000, 3001, 3003');
const SCENES_DIR = process.env.S4P_SCENES || `${process.env.HOME}/jjodel-demo-exports`;
const OUT_DIR = process.env.S4P_OUT || `${process.env.HOME}/.jjodel-lanes/P-2026-10-24-0255`;

let failures = 0;
const table: Array<{ name: string; ok: boolean; detail: string }> = [];
const check = (name: string, ok: boolean, detail: unknown) => {
    if (!ok) failures++;
    const d = JSON.stringify(detail).slice(0, 1500);
    table.push({ name, ok, detail: d });
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  ${d}`);
};
const meas = (name: string, v: unknown) => console.log(`MEAS  ${name}  ${typeof v === 'string' ? v : JSON.stringify(v).slice(0, 3000)}`);
const wait = (page: Page, ms: number) => page.waitForTimeout(ms);
const paneSel = (m: string) => `[id="${m}"].dock-tabpane-active`;

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
    await page.evaluate(`(async () => { const j = await import('/src/joiner/index.ts'); const dm = await import('/src/components/abstract/DockManager.tsx'); await dm.default.open2(j.LModel.fromPointer(${JSON.stringify(id)})); })()`).catch((e) => meas('open2 error', String(e).slice(0, 600)));
    await wait(page, 4000);
    await page.evaluate((x: string) => {
        const b = [...document.querySelectorAll('.dock-tab-btn')].find((e) => e.id.endsWith(`-tab-${x}`)) as HTMLElement | undefined;
        b?.click();
    }, id);
    await wait(page, 4000);
}

/** The world of the model, as the preview store builds it, and the counts that Discard must leave unchanged. */
async function worldOf(page: Page, modelId: string): Promise<any> {
    return page.evaluate(async (m: string) => {
        const pw = await import('/src/jjscript/executor/planWorld.ts' as any);
        const s = (window as any).windoww.store.getState();
        const world = pw.buildPlanWorld(s.idlookup, m);
        return { world, idlookupSize: Object.keys(s.idlookup).length };
    }, modelId);
}

/** Every node and edge of the pane: ids, boxes, the computed styles that the spec names. */
async function paneState(page: Page, m: string): Promise<any> {
    return page.evaluate((sel: string) => {
        const pane = document.querySelector(sel);
        if (!pane) return null;
        const flow = pane.querySelector('.react-flow') as HTMLElement | null;
        const fr = flow?.getBoundingClientRect();
        const box = (el: Element) => { const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; };
        const nodes = [...pane.querySelectorAll('.react-flow__node')].map((n) => {
            const cs = getComputedStyle(n);
            const after = getComputedStyle(n, '::after');
            return {
                id: n.getAttribute('data-id') || '',
                cls: (n as HTMLElement).className,
                ghost: n.classList.contains('jj-preview-node'),
                box: box(n),
                transform: (n as HTMLElement).style.transform,
                text: (n.textContent || '').trim().slice(0, 80),
                borderStyle: cs.borderTopStyle,
                borderColor: cs.borderTopColor,
                borderWidth: cs.borderTopWidth,
                background: cs.backgroundColor,
                opacity: cs.opacity,
                pointerEvents: cs.pointerEvents,
                afterContent: after.content,
                afterBackground: after.backgroundColor,
                afterWidth: after.width,
                selected: n.classList.contains('selected'),
            };
        });
        const edges = [...pane.querySelectorAll('.react-flow__edge')].map((e) => {
            const p = e.querySelector('.react-flow__edge-path');
            const cs = p ? getComputedStyle(p) : null;
            return {
                id: e.getAttribute('data-id') || e.getAttribute('data-testid') || '',
                cls: (e as Element).getAttribute('class') || '',
                ghost: e.classList.contains('jj-preview-edge'),
                d: p?.getAttribute('d')?.slice(0, 120) ?? null,
                dash: cs?.strokeDasharray ?? null,
                stroke: cs?.stroke ?? null,
                label: (e.textContent || '').trim(),
            };
        });
        const bar = pane.querySelector('.jj-preview-bar');
        const barSpans = bar ? [...bar.querySelectorAll('span')].map((s) => (s.textContent || '').trim()).join(' ') : null;
        return { flow: fr ? { x: fr.left, y: fr.top, w: fr.width, h: fr.height } : null, nodes, edges, bar: barSpans };
    }, paneSel(m));
}

function alphaOf(color: string): number {
    const m = color.match(/rgba?\(([^)]+)\)/);
    if (!m) return color === 'transparent' ? 0 : 1;
    const parts = m[1].split(/[ ,/]+/).filter(Boolean);
    return parts.length >= 4 ? Number(parts[3]) : 1;
}

const overlap = (a: any, b: any) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));

mkdirSync(OUT_DIR, { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1, colorScheme: 'light' });
await seed(ctx, true);
await ctx.addInitScript(() => { (globalThis as any).__name = (f: any) => f; });
const page = await ctx.newPage();
const errors: Array<{ t: number; text: string }> = [];
let phaseStart = Number.POSITIVE_INFINITY;
page.on('pageerror', (e) => errors.push({ t: Date.now(), text: 'pageerror: ' + e.message }));
page.on('console', (msg) => { if (msg.type() === 'error') errors.push({ t: Date.now(), text: 'console: ' + msg.text() }); });
const result: any = { url: URL };

const { project, models } = await importScene(page, 'scene_1_DemoPEST.jjodel');
check('imported', !!project && models.some((m) => !m.meta), { project, models: models.map((m) => m.name) });
meas('theme', await page.evaluate(() => document.documentElement.getAttribute('data-theme') || document.body.className));

// Pick the model and compose the script from its metamodel.
let target = '';
let script = '';
type Pick = { C: string; T: string; r: string; many: boolean };
let plan = null as Pick | null;
for (const m of models.filter((x) => !x.meta)) {
    await openModel(page, m.id);
    let st = await paneState(page, m.id);
    for (let i = 0; i < 40 && !(st?.nodes || []).some((n: any) => !n.ghost && n.box.w > 20); i++) { await wait(page, 500); st = await paneState(page, m.id); }
    const real = (st?.nodes || []).filter((n: any) => !n.ghost && n.box.w > 20);
    const { world } = await worldOf(page, m.id);
    const classes = Object.values(world.classes) as any[];
    const concrete = new Set(classes.filter((c) => !c.abstract && !c.singleton).map((c) => c.name));
    let pick = null as Pick | null;
    for (const c of classes) {
        if (!concrete.has(c.name)) continue;
        const r = c.references.find((x: any) => !x.containment && !x.opposite && concrete.has(x.type));
        if (r) { pick = { C: c.name, T: r.type, r: r.name, many: r.upper === -1 || r.upper === '*' || Number(r.upper) > 1 }; break; }
    }
    meas(`model ${m.name}`, { nodes: real.length, elements: world.elements.length, classes: classes.map((c) => c.name), pick });
    if (real.length >= 1 && pick) { target = m.id; plan = pick; result.model = m; break; }
}
if (!target) {
    await page.screenshot({ path: `${OUT_DIR}/debug_no_canvas.png` });
    meas('dom', await page.evaluate(() => ({ panes: [...document.querySelectorAll('.dock-tabpane-active')].map((e) => e.id), flows: document.querySelectorAll('.react-flow').length, nodes: document.querySelectorAll('.react-flow__node').length })));
}
check('an M1 on the canvas with a usable reference', !!target && !!plan, { target, plan });

if (target && plan) {
    const op = plan.many ? '+=' : '=';
    script = [
        `create instance of ${plan.C} "GhostA"`,
        `create instance of ${plan.T} "GhostB"`,
        `create instance of ${plan.C} "GhostC"`,
        `set GhostA.${plan.r} ${op} GhostB`,
        `set GhostC.${plan.r} ${op} GhostB`,
        `set GhostA.zzNoSuchFeature = 1`,
    ].join('\n');
    result.script = script;
    meas('script', script);

    const before = await worldOf(page, target);
    const fire = async () => {
        await page.evaluate(([s, m]: [string, string]) => {
            window.dispatchEvent(new CustomEvent('jjodel:script-preview-request', { detail: { script: s, modelId: m } }));
        }, [script, target] as [string, string]);
        await wait(page, 2000);
    };
    const pane = await paneState(page, target);
    const realNodes = pane.nodes.filter((n: any) => !n.ghost);

    // Select a real node first, so that "unchanged" has something to lose.
    const first = realNodes.find((n: any) => n.box.w > 20 && n.box.x > pane.flow.x && n.box.y > pane.flow.y && n.box.x + n.box.w < pane.flow.x + pane.flow.w);
    if (first) await page.mouse.click(first.box.x + first.box.w / 2, first.box.y + Math.min(10, first.box.h / 2));
    await wait(page, 1500);

    phaseStart = Date.now();
    await fire();
    let st = await paneState(page, target);
    let ghosts = st.nodes.filter((n: any) => n.ghost);
    // Ghosts sit one column right of the drawn nodes, where the right sidebar may cover the pane (`.react-flow`
    // extends under it): a ghost is visible when the hit test at its centre lands on it. Pan left until all are.
    const visible = async () => page.evaluate((ids: string[]) => ids.map((id) => {
        const n = document.querySelector(`.react-flow__node[data-id="${id}"]`);
        if (!n) return false;
        const r = n.getBoundingClientRect();
        const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return !!top && n.contains(top);
    }), ghosts.map((g: any) => g.id));
    const vis0 = await visible();
    meas('ghosts visible in the viewport as opened', vis0);
    result.ghostsVisibleAsOpened = vis0;
    for (let i = 0; i < 6 && ghosts.length > 0 && !(await visible()).every(Boolean); i++) {
        const start = await page.evaluate((sel: string) => {
            const f = document.querySelector(`${sel} .react-flow`)?.getBoundingClientRect();
            if (!f) return null;
            for (let y = f.top + f.height * 0.9; y > f.top + 40; y -= 20) for (let x = f.left + 320; x < f.left + f.width * 0.6; x += 20) {
                const e = document.elementFromPoint(x, y);
                if (e?.classList.contains('react-flow__pane')) return { x, y };
            }
            return null;
        }, paneSel(target));
        if (!start) break;
        await page.mouse.move(start.x, start.y);
        await page.mouse.down();
        await page.mouse.move(start.x - 300, start.y, { steps: 10 });
        await page.mouse.up();
        await wait(page, 600);
        st = await paneState(page, target);
        ghosts = st.nodes.filter((n: any) => n.ghost);
    }
    check('ghosts visible after panning', (await visible()).every(Boolean), await visible());
    result.preview = st;
    const gEdges = st.edges.filter((e: any) => e.ghost);
    meas('ghost nodes', ghosts.map((g: any) => ({ id: g.id, text: g.text, box: g.box, border: `${g.borderWidth} ${g.borderStyle} ${g.borderColor}`, bg: g.background, warn: g.cls.includes('--warning') })));
    meas('ghost edges', gEdges.map((e: any) => ({ id: e.id, d: e.d, dash: e.dash, stroke: e.stroke, label: e.label })));

    check('3 ghost nodes', ghosts.length === 3, ghosts.map((g: any) => g.text));
    check('ghost border dashed rgb(6, 182, 212)', ghosts.length > 0 && ghosts.every((g: any) => g.borderStyle === 'dashed' && g.borderColor === 'rgb(6, 182, 212)'), ghosts.map((g: any) => [g.borderStyle, g.borderColor]));
    check('ghost fill translucent (alpha < 1)', ghosts.length > 0 && ghosts.every((g: any) => alphaOf(g.background) < 1 && alphaOf(g.background) > 0), ghosts.map((g: any) => g.background));
    check('2 ghost edges, dashed, rendered', gEdges.length === 2 && gEdges.every((e: any) => e.d && e.dash && e.dash !== 'none'), gEdges.map((e: any) => [e.dash, !!e.d]));
    const warned = ghosts.filter((g: any) => g.cls.includes('jj-preview-node--warning'));
    check('amber marker on GhostA only', warned.length === 1 && warned[0].text.startsWith('GhostA') && warned[0].afterContent !== 'none', warned.map((g: any) => ({ text: g.text, after: g.afterContent, bg: g.afterBackground })));
    meas('amber colour', warned.map((g: any) => g.afterBackground));
    check('bar text', st.bar === 'Preview · +3 objects · 1 warning', st.bar);
    const pairs: any[] = [];
    for (const g of ghosts) for (const n of st.nodes.filter((x: any) => !x.ghost && x.box.w > 0)) { const a = overlap(g.box, n.box); if (a > 0) pairs.push({ ghost: g.text, node: n.id, area: a }); }
    check('no ghost overlaps a drawn node', pairs.length === 0, pairs);
    await page.screenshot({ path: `${OUT_DIR}/crop_preview_shown.png`, clip: { x: st.flow.x, y: st.flow.y, width: Math.min(st.flow.w, 1600 - st.flow.x), height: Math.min(st.flow.h, 1000 - st.flow.y) } });

    // Inert: click and drag a ghost.
    const sel = async () => page.evaluate((s: string) => {
        const p = document.querySelector(s);
        const g = (window as any).windoww.store.getState();
        return { rf: p ? [...p.querySelectorAll('.react-flow__node.selected')].map((n) => n.getAttribute('data-id')) : [], last: g._lastSelected?.node ?? null };
    }, paneSel(target));
    const g0 = ghosts[0];
    if (g0) {
        const selBefore = await sel();
        meas("hit test at the ghost centre", await page.evaluate(([x, y]: [number, number]) => {
            return document.elementsFromPoint(x, y).slice(0, 6).map((e) => `${e.tagName.toLowerCase()}.${String((e as any).className?.baseVal ?? (e as any).className).split(" ").slice(0, 3).join(".")} pe=${getComputedStyle(e).pointerEvents}`);
        }, [g0.box.x + g0.box.w / 2, g0.box.y + g0.box.h / 2] as [number, number]));
        await page.mouse.click(g0.box.x + g0.box.w / 2, g0.box.y + g0.box.h / 2);
        await wait(page, 1200);
        const selAfter = await sel();
        check('click on a ghost leaves the selection unchanged', JSON.stringify(selBefore) === JSON.stringify(selAfter), { selBefore, selAfter });
        const posBefore = (await paneState(page, target)).nodes.find((n: any) => n.id === g0.id);
        await page.mouse.move(g0.box.x + g0.box.w / 2, g0.box.y + g0.box.h / 2);
        await page.mouse.down();
        await page.mouse.move(g0.box.x + g0.box.w / 2 + 60, g0.box.y + g0.box.h / 2 + 40, { steps: 8 });
        await page.mouse.up();
        await wait(page, 1200);
        const stAfterDrag = await paneState(page, target);
        const posAfter = stAfterDrag.nodes.find((n: any) => n.id === g0.id);
        // A drag that misses the ghost pans the viewport: compare against a drawn node to separate the two.
        check('drag leaves a ghost in place', !!posAfter && posAfter.transform === posBefore?.transform, { before: posBefore?.transform, after: posAfter?.transform, boxBefore: posBefore?.box, boxAfter: posAfter?.box });
        meas('selection after drag', await sel());
    }

    // Discard.
    await page.locator(`${paneSel(target)} .jj-preview-bar button`, { hasText: 'Discard' }).click();
    await wait(page, 1500);
    const afterDiscard = await paneState(page, target);
    const wDiscard = await worldOf(page, target);
    check('Discard removes every ghost and the bar', afterDiscard.nodes.every((n: any) => !n.ghost) && afterDiscard.edges.every((e: any) => !e.ghost) && afterDiscard.bar === null, { ghosts: afterDiscard.nodes.filter((n: any) => n.ghost).length, bar: afterDiscard.bar });
    check('Discard leaves the element count unchanged', wDiscard.world.elements.length === before.world.elements.length && wDiscard.idlookupSize === before.idlookupSize, { before: [before.world.elements.length, before.idlookupSize], after: [wDiscard.world.elements.length, wDiscard.idlookupSize] });

    // Second preview, then Apply.
    await fire();
    const st2 = await paneState(page, target);
    check('second preview shows again', st2.nodes.filter((n: any) => n.ghost).length === 3 && st2.bar !== null, { ghosts: st2.nodes.filter((n: any) => n.ghost).length, bar: st2.bar });
    await page.locator(`${paneSel(target)} .jj-preview-bar button`, { hasText: 'Apply' }).click();
    let st3 = await paneState(page, target);
    for (let i = 0; i < 40 && st3.bar !== null; i++) { await wait(page, 500); st3 = await paneState(page, target); }
    await wait(page, 3000);
    st3 = await paneState(page, target);
    const after = await worldOf(page, target);
    const added = after.world.elements.filter((e: any) => !before.world.elements.some((b: any) => b.id === e.id));
    meas('added elements', added.map((e: any) => ({ name: e.name, className: e.className, refs: e.references })));
    const byName = (n: string) => added.find((e: any) => e.name === n);
    const bId = byName('GhostB')?.id;
    check('Apply creates exactly the 3 planned elements', added.length === 3 && byName('GhostA')?.className === plan.C && byName('GhostB')?.className === plan.T && byName('GhostC')?.className === plan.C, added.map((e: any) => `${e.name}:${e.className}`));
    check('Apply writes the 2 planned references', !!bId && (byName('GhostA')?.references?.[plan.r] || []).includes(bId) && (byName('GhostC')?.references?.[plan.r] || []).includes(bId), { A: byName('GhostA')?.references, C: byName('GhostC')?.references });
    check('Apply clears the bar and the ghosts', st3.bar === null && st3.nodes.every((n: any) => !n.ghost), { bar: st3.bar, ghosts: st3.nodes.filter((n: any) => n.ghost).length });
    meas('real nodes after Apply', st3.nodes.filter((n: any) => !n.ghost).map((n: any) => n.text.slice(0, 30)));
    await page.screenshot({ path: `${OUT_DIR}/crop_after_apply.png`, clip: { x: st3.flow.x, y: st3.flow.y, width: Math.min(st3.flow.w, 1600 - st3.flow.x), height: Math.min(st3.flow.h, 1000 - st3.flow.y) } });
}

const fresh = errors.filter((e) => e.t >= phaseStart).map((e) => e.text);
meas('errors before the preview', errors.filter((e) => e.t < phaseStart).map((e) => e.text.slice(0, 200)).slice(0, 5));
check('console free of new errors', fresh.length === 0, fresh.slice(0, 5));
result.table = table;
writeFileSync(`${OUT_DIR}/probe_s4b_ghost_preview.json`, JSON.stringify(result, null, 2));
console.log(`OUT ${OUT_DIR}/probe_s4b_ghost_preview.json  crops ${OUT_DIR}/crop_preview_shown.png ${OUT_DIR}/crop_after_apply.png`);
await ctx.close();
await browser.close();
process.exit(failures);
