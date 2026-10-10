/**
 * bpmn-lanes-fixture (P-2026-10-10-0105, slice S2): the OMG BPMN pools-and-lanes fixture, and the S2 oracle.
 *
 * Builds, in the real app on its own dev server, the metamodel fragment of the discovery report §G1, the IR views of
 * §G2 (spec addendum 2026-10-10 §10) and the model of §I in the root form (R-GV-10: every object in DModel.objects,
 * appended to its containment slot by the canvas write path, `syncCreateCompositionLink`):
 *   - pool `Customer` with no lanes and two tasks;
 *   - pool `Shop` with lane `Sales` (StartEvent, Task `Check order`, ExclusiveGateway) and lane `Warehouse`
 *     (Task `Ship`, EndEvent);
 *   - four SequenceFlows in Shop's process and one MessageFlow in the collaboration;
 *   - one black-box Participant, `Supplier`, without `processRef`.
 * Every flow node is placed inside its lane's computed box (spec addendum §7: lanes stacked under Shop's left band).
 *
 * Then it measures, from the DOM only (node `style.transform` and offset sizes are flow coordinates, independent of the
 * zoom): the S2 acceptance criteria, and two control scenes with a hull (the S1 fixtures `gv_region` and `gv_collapsed`
 * on a Region/State metamodel) that must render identically before and after S2. Screenshots in the light theme.
 *
 * Run:  node frontend/scripts/lane-run.mjs probe ~/jjodel-w-graphvertex \
 *         frontend/scripts/probe/bpmn-lanes-fixture.ts --port 3071 --id P-2026-10-10-0105
 * Env:  GV_TAG    label of the run in file names (default after)
 *       GV_OUT    output directory (default docs/discovery/assets/graphvertex-s2 of this tree)
 *       GV_ONLY   comma list of scenes: bpmn, hull, demos (default bpmn,hull)
 *       GV_DEMOS  directory of the demo exports for the `demos` scene (default ~/jjodel-demo-exports)
 */
import { chromium, type Browser, type Page } from '@playwright/test';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { seed, setTheme, BOOT_MS, NAV_MS, SETTLE_MS, TAB_MS } from '../smoke/states.ts';

const URL = (process.env.PROBE_URL || 'http://localhost:3071/').replace(/\/$/, '');
if (/:300[01]$/.test(URL)) throw new Error('never 3000 or 3001');
const TAG = process.env.GV_TAG || 'after';
const OUT = (process.env.GV_OUT || new globalThis.URL('../../../docs/discovery/assets/graphvertex-s2/', import.meta.url).pathname).replace(/\/$/, '');
const ONLY = (process.env.GV_ONLY || 'bpmn,hull').split(',').filter(Boolean);
const DEMOS = process.env.GV_DEMOS || `${process.env.HOME}/jjodel-demo-exports`;
mkdirSync(OUT, { recursive: true });

let pass = 0; let fail = 0;
export const check = (name: string, ok: boolean, detail: unknown) => {
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  ${JSON.stringify(detail).slice(0, 1500)}`);
    if (ok) pass++; else fail++;
};
export const meas = (name: string, v: unknown) => console.log(`MEAS  ${name}  ${JSON.stringify(v).slice(0, 3000)}`);

// ── The views (spec addendum §10, discovery §G2) ─────────────────────────────────────────────────────────────────

const I = (prop: string) => ({ from: 'intrinsic', prop });
const isKind = (c: string) => ({ op: 'isKind', class: c });
const band = { side: 'w', size: 30 };
const headerLabel = { position: 'header', orientation: 'vertical', source: I('name') };

export const BPMN_VIEWS: Array<[string, Record<string, unknown>]> = [
    ['Process', { kind: 'vertex', metaclasses: ['Process'], label: 'Process (not drawn)', visible: false, shape: { form: 'rect' } }],
    ['LaneSet', { kind: 'vertex', metaclasses: ['LaneSet'], label: 'LaneSet (not drawn)', visible: false, shape: { form: 'rect' } }],
    ['Collaboration', { kind: 'vertex', metaclasses: ['Collaboration'], label: 'Collaboration (not drawn)', visible: false, shape: { form: 'rect' } }],
    ['Participant', { kind: 'graphVertex', metaclasses: ['Participant'], label: 'Pool with lanes', priority: 1,
        predicate: { op: 'not', arg: { op: 'empty', path: '$processRef.value.$laneSets.values' } },
        shape: { form: 'rect', fill: '#ffffff', border: { width: 1.5 }, labels: [headerLabel] },
        containment: { children: '$processRef.value.$laneSets.values[0].$lanes.values', childFilter: isKind('Lane'),
            layout: { mode: 'partitions', axis: 'vertical', header: band }, membership: { mode: 'forbid' }, edges: 'hide', collapsible: false } }],
    ['Participant', { kind: 'graphVertex', metaclasses: ['Participant'], label: 'Pool without lanes',
        shape: { form: 'rect', fill: '#ffffff', border: { width: 1.5 }, labels: [headerLabel] },
        containment: { children: '$processRef.value.$flowElements.values', childFilter: isKind('FlowNode'),
            layout: { mode: 'free', header: band }, membership: { mode: 'reparent' }, edges: 'hide', collapsible: true } }],
    // Black-box pool (R-GV-14, open question 2): a Participant with no processRef draws as a thin band, as wide as
    // the other pools of this fixture. Told apart by predicate and priority (D-b, R-GV-12).
    ['Participant', { kind: 'graphVertex', metaclasses: ['Participant'], label: 'Black-box pool', priority: 2,
        predicate: { op: 'not', arg: { op: 'exists', path: '$processRef.value' } },
        defaultSize: { width: 900, height: 40 },
        shape: { form: 'rect', fill: '#ffffff', border: { width: 1.5 }, labels: [{ position: 'center', source: I('name') }] },
        containment: { collapsible: false } }],
    ['Lane', { kind: 'graphVertex', metaclasses: ['Lane'], label: 'Lane',
        shape: { form: 'rect', fill: '#ffffff', border: { width: 1 }, labels: [headerLabel] },
        containment: { children: '$flowNodeRefs.values', childFilter: isKind('FlowNode'), layout: { mode: 'free', header: band },
            membership: { mode: 'reference', create: { ownerKind: 'Process', feature: 'flowElements' } }, edges: 'hide', collapsible: false } }],
    ['Lane', { kind: 'graphVertex', metaclasses: ['Lane'], label: 'Lane with sub-lanes', priority: 1,
        predicate: { op: 'exists', path: '$childLaneSet.value' },
        shape: { form: 'rect', fill: '#ffffff', border: { width: 1 }, labels: [headerLabel] },
        containment: { children: '$childLaneSet.value.$lanes.values', childFilter: isKind('Lane'),
            layout: { mode: 'partitions', axis: 'vertical', header: band }, membership: { mode: 'forbid' }, edges: 'hide', collapsible: false } }],
    ['Task', { kind: 'vertex', metaclasses: ['Task'], label: 'Task', shape: { form: 'rounded', labels: [{ position: 'center', source: I('name') }] } }],
    ['StartEvent', { kind: 'vertex', metaclasses: ['StartEvent'], label: 'Start event', defaultSize: { width: 36, height: 36 },
        shape: { form: 'circle', border: { width: 1.5 }, labels: [{ position: 'outside', anchor: 's', source: I('name') }] } }],
    ['EndEvent', { kind: 'vertex', metaclasses: ['EndEvent'], label: 'End event', defaultSize: { width: 36, height: 36 },
        shape: { form: 'circle', border: { width: 3 }, labels: [{ position: 'outside', anchor: 's', source: I('name') }] } }],
    ['ExclusiveGateway', { kind: 'vertex', metaclasses: ['ExclusiveGateway'], label: 'Exclusive gateway', defaultSize: { width: 50, height: 50 },
        shape: { form: 'diamond', marker: 'x', labels: [{ position: 'outside', anchor: 'n', source: I('name') }] } }],
    ['SequenceFlow', { kind: 'edge', metaclasses: ['SequenceFlow'], label: 'Sequence flow',
        edge: { source: '$sourceRef.value', target: '$targetRef.value', line: { style: 'solid', width: 1.5 },
            terminations: { targetEnd: 'closedArrow' }, routing: 'orthogonal', labels: { center: I('name') } } }],
    ['MessageFlow', { kind: 'edge', metaclasses: ['MessageFlow'], label: 'Message flow',
        edge: { source: '$sourceRef.value', target: '$targetRef.value', line: { style: 'dashed', width: 1 },
            terminations: { sourceEnd: 'hollowCircle', targetEnd: 'openArrow' }, routing: 'orthogonal', labels: { center: I('name') } } }],
];

// ── The metamodel (discovery §G1) ────────────────────────────────────────────────────────────────────────────────

/** [class, abstract, supertypes]; every class but the two marker interfaces carries `name` through BaseElement. */
export const BPMN_CLASSES: Array<[string, boolean, string[]]> = [
    ['BaseElement', true, []], ['InteractionNode', true, []],
    ['Collaboration', false, ['BaseElement']], ['Participant', false, ['BaseElement', 'InteractionNode']],
    ['MessageFlow', false, ['BaseElement']], ['Process', false, ['BaseElement']],
    ['LaneSet', false, ['BaseElement']], ['Lane', false, ['BaseElement']],
    ['FlowElement', true, ['BaseElement']], ['FlowNode', true, ['FlowElement']],
    ['Task', false, ['FlowNode', 'InteractionNode']], ['StartEvent', false, ['FlowNode', 'InteractionNode']],
    ['EndEvent', false, ['FlowNode', 'InteractionNode']], ['ExclusiveGateway', false, ['FlowNode']],
    ['SequenceFlow', false, ['FlowElement']],
];
/** [owner, reference, type, containment, many]; `processRef`, `childLaneSet` and `default` are 0..1 (OPTIONAL_REFS). */
export const OPTIONAL_REFS = new Set(['processRef', 'childLaneSet', 'default']);
export const BPMN_REFS: Array<[string, string, string, boolean, boolean]> = [
    ['Collaboration', 'participants', 'Participant', true, true], ['Collaboration', 'messageFlows', 'MessageFlow', true, true],
    ['Participant', 'processRef', 'Process', false, false],
    ['MessageFlow', 'sourceRef', 'InteractionNode', false, false], ['MessageFlow', 'targetRef', 'InteractionNode', false, false],
    ['Process', 'flowElements', 'FlowElement', true, true], ['Process', 'laneSets', 'LaneSet', true, true],
    ['LaneSet', 'lanes', 'Lane', true, true],
    ['Lane', 'flowNodeRefs', 'FlowNode', false, true], ['Lane', 'childLaneSet', 'LaneSet', true, false],
    ['ExclusiveGateway', 'default', 'SequenceFlow', false, false],
    ['SequenceFlow', 'sourceRef', 'FlowNode', false, false], ['SequenceFlow', 'targetRef', 'FlowNode', false, false],
];

// ── The model (discovery §I), geometry of spec addendum §7 ───────────────────────────────────────────────────────
// Shop at (100, 100), resized 900 x 360; Sales and Warehouse resized 180 high each: under Shop's 30 px left band the
// lane boxes are Sales (130, 100, 870, 180) and Warehouse (130, 280, 870, 180). The lanes are STORED elsewhere
// ((1100, 520) and (1100, 760), 200 wide) on purpose: only the partition pass can bring them there, so the S2 checks
// fail without it (P12, a control that discriminates). Customer at (100, 520), resized 900 x 200, free with the same
// band. Supplier at (100, 780), the black-box view's default 900 x 40.

/** [key, class, name, x, y, size: [w, h] resized by hand, or null]. */
export const BPMN_OBJECTS: Array<[string, string, string, number, number, [number, number] | null]> = [
    ['collab', 'Collaboration', 'Order collaboration', 1300, 100, null],
    ['shopProc', 'Process', 'Shop process', 1300, 220, null],
    ['custProc', 'Process', 'Customer process', 1300, 340, null],
    ['laneSet', 'LaneSet', 'Shop lanes', 1300, 460, null],
    ['shop', 'Participant', 'Shop', 100, 100, [900, 360]],
    ['customer', 'Participant', 'Customer', 100, 520, [900, 200]],
    ['supplier', 'Participant', 'Supplier', 100, 780, null],
    ['sales', 'Lane', 'Sales', 1100, 520, [200, 180]],
    ['warehouse', 'Lane', 'Warehouse', 1100, 760, [200, 180]],
    ['start', 'StartEvent', 'Order received', 190, 172, null],
    ['check', 'Task', 'Check order', 300, 160, [140, 60]],
    ['gw', 'ExclusiveGateway', 'In stock?', 530, 165, null],
    ['ship', 'Task', 'Ship', 500, 340, [140, 60]],
    ['end', 'EndEvent', 'Shipped', 720, 352, null],
    ['place', 'Task', 'Place order', 250, 590, [140, 60]],
    ['receive', 'Task', 'Receive goods', 600, 590, [140, 60]],
    ['sf1', 'SequenceFlow', 'sf1', 1300, 580, null],
    ['sf2', 'SequenceFlow', 'sf2', 1300, 640, null],
    ['sf3', 'SequenceFlow', 'yes', 1300, 700, null],
    ['sf4', 'SequenceFlow', 'sf4', 1300, 760, null],
    ['mf1', 'MessageFlow', 'order', 1300, 820, null],
];
/** [owner, containment reference, child]: the canvas composition link, in the root form. */
export const BPMN_CONTAINMENT: Array<[string, string, string]> = [
    ['collab', 'participants', 'shop'], ['collab', 'participants', 'customer'], ['collab', 'participants', 'supplier'],
    ['collab', 'messageFlows', 'mf1'],
    ['shopProc', 'laneSets', 'laneSet'], ['laneSet', 'lanes', 'sales'], ['laneSet', 'lanes', 'warehouse'],
    ...(['start', 'check', 'gw', 'ship', 'end', 'sf1', 'sf2', 'sf3', 'sf4'].map(k => ['shopProc', 'flowElements', k] as [string, string, string])),
    ['custProc', 'flowElements', 'place'], ['custProc', 'flowElements', 'receive'],
];
/** [owner, non-containment reference, target]. */
export const BPMN_REFERENCES: Array<[string, string, string]> = [
    ['shop', 'processRef', 'shopProc'], ['customer', 'processRef', 'custProc'],
    ['sales', 'flowNodeRefs', 'start'], ['sales', 'flowNodeRefs', 'check'], ['sales', 'flowNodeRefs', 'gw'],
    ['warehouse', 'flowNodeRefs', 'ship'], ['warehouse', 'flowNodeRefs', 'end'],
    ['sf1', 'sourceRef', 'start'], ['sf1', 'targetRef', 'check'],
    ['sf2', 'sourceRef', 'check'], ['sf2', 'targetRef', 'gw'],
    ['sf3', 'sourceRef', 'gw'], ['sf3', 'targetRef', 'ship'],
    ['sf4', 'sourceRef', 'ship'], ['sf4', 'targetRef', 'end'],
    ['mf1', 'sourceRef', 'place'], ['mf1', 'targetRef', 'check'],
];

// ── Page helpers ─────────────────────────────────────────────────────────────────────────────────────────────────

/** Evaluate an async body in the page with `w` (window) and `a` (the argument); a pause after each write. */
export async function ev<T = unknown>(page: Page, body: string, arg?: unknown, pauseMs = 400): Promise<T> {
    return page.evaluate(async ([src, a, ms]) => {
        // eslint-disable-next-line no-new-func
        const r = await new Function('w', 'a', `return (async () => { ${src} })();`)(window, a);
        await new Promise((res) => setTimeout(res, ms as number));
        return JSON.parse(JSON.stringify(r ?? null));
    }, [body, arg, pauseMs] as const) as Promise<T>;
}

/** New Project through the dashboard, on this probe's URL (smoke/states.ts `createProject` reads SMOKE_URL, default 3000). */
export async function createProject(page: Page, name: string): Promise<string | null> {
    // A cold dev server compiles on the first request: the long timeout of the other probes.
    await page.goto(`${URL}/#/allProjects`, { waitUntil: 'domcontentloaded', timeout: 300000 });
    await page.waitForTimeout(BOOT_MS);
    await page.locator('button', { hasText: 'New Project' }).first().click();
    await page.waitForTimeout(1200);
    await page.locator('input[type="text"]').first().fill(name);
    await page.locator('button', { hasText: /^Create/ }).last().click();
    await page.waitForTimeout(5000);
    return page.evaluate(() => {
        const arr = JSON.parse(localStorage.getItem('projects') || '[]') as Array<{ id: string }>;
        return arr.length ? arr[arr.length - 1].id : null;
    });
}

export async function openPage(browser: Browser): Promise<{ page: Page; errors: string[] }> {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await seed(ctx, true);
    await ctx.addInitScript(() => { (globalThis as any).__name = (f: any) => f; });
    const page = await ctx.newPage();
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    return { page, errors };
}

/** New project, New metamodel, classes and references through the L-API (the collapsed-render probe's way). */
export async function buildMetamodel(page: Page, classes: Array<[string, boolean, string[]]>, refs: Array<[string, string, string, boolean, boolean]>, attrOn: string) {
    const nm = page.getByText('New metamodel', { exact: true });
    if (await nm.count()) { await nm.first().click(); await page.waitForTimeout(TAB_MS); }
    await page.waitForTimeout(SETTLE_MS);
    const pkgJs = `const pkg = w.LProject.getProject().metamodels[0].packages[0]; const cls = (n) => pkg.classes.find((c) => c.name === n);`;
    for (const [name] of classes) await ev(page, `${pkgJs} pkg.addClass(a); return 1;`, name);
    await ev(page, `${pkgJs} cls(a).addAttribute('name'); return 1;`, attrOn);
    for (const [name, abstract, sup] of classes) {
        if (abstract) await ev(page, `${pkgJs} cls(a).abstract = true; return 1;`, name);
        if (sup.length) await ev(page, `${pkgJs} cls(a[0]).extends = a[1].map((s) => cls(s).id); return 1;`, [name, sup]);
    }
    for (const [owner, ref, type, comp, many] of refs) {
        await ev(page, `${pkgJs} const r = cls(a[0]).addReference(a[1], cls(a[2]).id); return r?.id ?? null;`, [owner, ref, type]);
        if (comp || many) await ev(page, `${pkgJs} const r = cls(a[0]).references.find((x) => x.name === a[1]);
            if (a[2]) r.composition = true; if (a[3]) r.upperBound = -1; return 1;`, [owner, ref, comp, many]);
        if (OPTIONAL_REFS.has(ref)) await ev(page, `${pkgJs} const r = cls(a[0]).references.find((x) => x.name === a[1]);
            r.lowerBound = 0; return 1;`, [owner, ref]);
    }
    return ev(page, `${pkgJs} return pkg.classes.map((c) => ({ n: c.name, abs: c.abstract, ext: c.extends.map((e) => e.name),
        refs: c.references.map((x) => x.name + ':' + x.type?.name + (x.composition ? ':comp' : '') + (x.upperBound === -1 ? ':*' : '')) }));`);
}

/** New model (createM1), opened in editor-v2; returns the model and its v2-flow graph. */
export async function buildModelShell(page: Page): Promise<{ modelId: string; graphId: string | null }> {
    await ev(page, `const nb = await import('/src/pages/components/Navbar.tsx'); const p = w.LProject.getProject();
        nb.createM1(p, p.metamodels[0]); return 1;`);
    await page.waitForTimeout(TAB_MS);
    const tab = page.locator('.appbar-tab__name').filter({ hasText: /^\s*model_1\s*$/ });
    if (await tab.count()) { await tab.first().click(); await page.waitForTimeout(TAB_MS); }
    // The first layout of a fresh graph arms a 3 s re-layout watcher (reLayoutWatcher.ts): wait it out, so the
    // fixture's positions are never moved by it.
    await page.waitForTimeout(4000);
    return ev(page, `const s = w.store.getState(); const m = w.LProject.getProject().models[0];
        const g = (s.graphs || []).map((id) => s.idlookup[id]).find((d) => d && d.model === m.id && d.graphStyle === 'v2-flow');
        return { modelId: m.id, graphId: g ? g.id : null };`);
}

/** Objects through the canvas create (`syncCreateObject`, a root with its vertex), sized by hand where declared. */
export async function buildObjects(page: Page, graphId: string, objects: Array<[string, string, string, number, number, [number, number] | null]>) {
    const ids: Record<string, { obj: string; vertex: string }> = {};
    for (const [key, cls, name, x, y, size] of objects) {
        const r = await ev<{ obj: string; vertex: string } | null>(page, `
            const c2j = await import('/src/components/editor-v2/sync/canvasToJjom.ts');
            const j = await import('/src/joiner/index.ts');
            const pkg = w.LProject.getProject().metamodels[0].packages[0];
            const klass = pkg.classes.find((c) => c.name === a.cls);
            const vid = c2j.syncCreateObject(a.graphId, klass.id, a.x, a.y, a.name);
            if (!vid) return null;
            if (a.size) {
                j.TRANSACTION('fixture size', () => {
                    j.SetFieldAction.new(vid, 'w', a.size[0], undefined, false);
                    j.SetFieldAction.new(vid, 'h', a.size[1], undefined, false);
                    j.SetFieldAction.new(vid, 'isResized', true, undefined, false);
                });
            }
            return { obj: w.store.getState().idlookup[vid]?.model, vertex: vid };`, { graphId, cls, name, x, y, size }, 250);
        if (r) ids[key] = r;
    }
    return ids;
}

export async function buildLinks(page: Page, ids: Record<string, { obj: string; vertex: string }>,
    containment: Array<[string, string, string]>, references: Array<[string, string, string]>) {
    for (const [owner, ref, child] of containment) {
        await ev(page, `const c2j = await import('/src/components/editor-v2/sync/canvasToJjom.ts');
            return c2j.syncCreateCompositionLink(a[0], a[1], a[2]);`, [ids[owner].vertex, ids[child].vertex, ref], 300);
    }
    for (const [owner, ref, target] of references) {
        await ev(page, `const c2j = await import('/src/components/editor-v2/sync/canvasToJjom.ts');
            c2j.syncSetReferenceValue(a[0], a[1], a[2], 'append'); return 1;`, [ids[owner].vertex, ref, ids[target].obj], 300);
    }
}

/** A viewpoint with one view per entry: createViewInWorkbench, then `view.ir = draft` with the class pins. */
export async function buildViewpoint(page: Page, name: string, views: Array<[string, Record<string, unknown>]>) {
    const vpId = await ev<string>(page, `return w.DViewPoint.newVP(a, undefined, true).id;`, name, 600);
    const made: string[] = [];
    for (const [cls, ir] of views) {
        made.push(await ev<string>(page, `
            const lv = await import('/src/utils/lastViewpoint.ts');
            const pkg = w.LProject.getProject().metamodels[0].packages[0];
            const klass = pkg.classes.find((k) => k.name === a.cls);
            const id = lv.createViewInWorkbench(klass.id, klass.name, 'DClass', a.vp);
            await new Promise((res) => setTimeout(res, 400));
            const pins = {};
            for (const m of a.ir.metaclasses) pins[m] = pkg.classes.find((k) => k.name === m).id;
            const view = w.LPointerTargetable.fromPointer(id);
            view.ir = { irVersion: 'ir-1.2', exclusive: true, ...a.ir, authoringMetaclassPins: pins };
            await new Promise((res) => setTimeout(res, 400));
            return view.name + ':' + w.store.getState().idlookup[id]?.ir?.kind;`, { cls, ir, vp: vpId }));
    }
    return { vpId, made };
}

export async function pickViewpoint(page: Page, name: string) {
    await page.locator('.toolbar-viewpoint-trigger:not([disabled])').first().click();
    await page.waitForTimeout(400);
    await page.locator('.toolbar-viewpoint-menu__option', { hasText: name }).first().click();
    await page.waitForTimeout(4000);
}

export interface Box { id: string; name: string; x: number; y: number; w: number; h: number; z: string; cls: string; band: string | null; bandLabel: string | null }

/** Every drawn node in flow coordinates (style.transform), with its object's name, z-index and header band. */
/** The canvas of the visible dock pane: every tab keeps its canvas mounted, the metamodel's included. */
const ACTIVE = '.dock-tabpane-active .react-flow';

export async function readNodes(page: Page): Promise<Box[]> {
    return page.evaluate((root) => {
        const idl = (window as any).store.getState().idlookup;
        return Array.from(document.querySelectorAll(`${root} .react-flow__node`)).map((el) => {
            const e = el as HTMLElement;
            const m = e.style.transform.match(/translate\(\s*(-?[\d.]+)px,\s*(-?[\d.]+)px\)/);
            const id = e.dataset.id ?? '';
            const obj = idl[id]?.model;
            const bandEl = e.querySelector('.ir-header-band') as HTMLElement | null;
            const lbl = bandEl?.querySelector('.ir-label') as HTMLElement | null;
            return {
                id, name: (obj && idl[obj]?.name) || '', x: m ? +m[1] : NaN, y: m ? +m[2] : NaN, w: e.offsetWidth, h: e.offsetHeight,
                z: e.style.zIndex, cls: (e.querySelector('.ir-node-content') as HTMLElement | null)?.className ?? '',
                band: bandEl ? `${bandEl.className}|${bandEl.offsetWidth}x${bandEl.offsetHeight}` : null,
                bandLabel: lbl ? `${lbl.textContent}|${getComputedStyle(lbl).writingMode}|${getComputedStyle(lbl).transform}` : null,
            };
        });
    }, ACTIVE);
}

/** Every drawn edge: id and its two vertex ends, from React Flow's default aria-label. */
export async function readEdges(page: Page): Promise<Array<{ id: string; source: string; target: string }>> {
    return page.evaluate((root) => Array.from(document.querySelectorAll(`${root} .react-flow__edge`)).map((g) => {
        const m = (g.getAttribute('aria-label') ?? '').match(/^Edge from (\S+) to (\S+)$/);
        return { id: (g as HTMLElement).dataset.id ?? '', source: m ? m[1] : '', target: m ? m[2] : '' };
    }), ACTIVE);
}

export async function readHulls(page: Page) {
    return page.evaluate((root) => Array.from(document.querySelectorAll(`${root} .ir-hull`)).map((h) => {
        const e = h as HTMLElement;
        return { transform: e.style.transform, w: e.offsetWidth, h: e.offsetHeight, name: e.textContent?.trim() ?? '' };
    }), ACTIVE);
}

export async function shoot(page: Page, file: string, hideRail = false) {
    if (hideRail) {
        const hide = page.locator('button[aria-label="Hide the side panel"]:visible');
        if (await hide.count()) { await hide.first().click(); await page.waitForTimeout(900); }
    }
    // The zoom-level button runs fitView (Toolbar.tsx, «Fit to view retired from this group»).
    const fit = page.locator('.toolbar-commands__level:visible');
    if (await fit.count()) { await fit.first().click(); await page.waitForTimeout(900); }
    const out = page.locator('button[title="Zoom out"]:visible');
    if (await out.count()) { await out.first().click(); await page.waitForTimeout(700); }
    const pane = page.locator(ACTIVE).first();
    await pane.screenshot({ path: `${OUT}/${file}` });
    meas('screenshot', `${OUT}/${file}`);
}

const within = (a: number, b: number, tol = 1) => Math.abs(a - b) <= tol;
const inside = (c: Box, p: Box) => c.x >= p.x - 1 && c.y >= p.y - 1 && c.x + c.w <= p.x + p.w + 1 && c.y + c.h <= p.y + p.h + 1;

// ── Scenes ───────────────────────────────────────────────────────────────────────────────────────────────────────

async function sceneBpmn(browser: Browser, out: Record<string, unknown>) {
    const { page, errors } = await openPage(browser);
    const pid = await createProject(page, `GV_S2_bpmn_${TAG}_${Date.now()}`);
    await page.goto(`${URL}/#/project?id=${pid}`, { waitUntil: 'domcontentloaded', timeout: 300000 });
    await page.waitForTimeout(NAV_MS);
    await page.addStyleTag({ content: '.notification-widget, .notification-content, .donation-banner { pointer-events: none !important; display: none !important; }' }).catch(() => {});
    meas('bpmn metamodel', await buildMetamodel(page, BPMN_CLASSES, BPMN_REFS, 'BaseElement'));
    const shell = await buildModelShell(page);
    meas('bpmn model shell', shell);
    if (!shell.graphId) { check('bpmn: v2-flow graph exists', false, shell); return; }
    const ids = await buildObjects(page, shell.graphId, BPMN_OBJECTS);
    await buildLinks(page, ids, BPMN_CONTAINMENT, BPMN_REFERENCES);
    const vp = await buildViewpoint(page, 'BPMN', BPMN_VIEWS);
    meas('bpmn viewpoint', vp);
    await setTheme(page, 'light');
    await pickViewpoint(page, 'BPMN');
    await page.waitForTimeout(SETTLE_MS);

    const nodes = await readNodes(page);
    const edges = await readEdges(page);
    const byKey = (k: string) => nodes.find((n) => n.id === ids[k]?.vertex);
    const shop = byKey('shop'); const sales = byKey('sales'); const warehouse = byKey('warehouse');
    const supplier = byKey('supplier'); const customer = byKey('customer');
    const laneVertices = new Set([ids.sales?.vertex, ids.warehouse?.vertex]);
    const laneEdges = edges.filter((e) => laneVertices.has(e.source));
    const tasksIn: Array<[string, string]> = [['start', 'sales'], ['check', 'sales'], ['gw', 'sales'], ['ship', 'warehouse'], ['end', 'warehouse']];
    const stored = await ev(page, `const idl = w.store.getState().idlookup;
        return Object.fromEntries(Object.entries(a).map(([k, v]) => [k, { x: idl[v.vertex]?.x, y: idl[v.vertex]?.y, w: idl[v.vertex]?.w, h: idl[v.vertex]?.h, isResized: idl[v.vertex]?.isResized, lvp: idl[v.vertex]?.layoutByViewpoint ?? null }]));`, ids, 0);
    const problems = await ev(page, `const reg = await import('/src/components/editor-v2/problems/registry.ts');
        return Object.values(a).map((v) => ({ v: v.vertex, p: reg.getNodeProblemsSnapshot(v.vertex).map((x) => x.kind + ':' + x.title + ':' + x.relatedNodeIds.length) })).filter((r) => r.p.length);`, ids, 0);
    const result: Record<string, unknown> = { tag: TAG, ids, nodes, edges, stored, problems, errors: errors.slice(0, 20) };
    out.bpmn = result;
    meas('bpmn nodes', nodes.map((n) => `${n.name} ${n.x},${n.y} ${n.w}x${n.h} z${n.z}`));
    meas('bpmn edges', edges.map((e) => `${e.id} ${e.source}->${e.target}`));
    meas('bpmn problems', problems);

    const ok = !!shop && !!sales && !!warehouse;
    check('S2-1 lanes x = Shop.x + 30 and w = Shop.w - 30 (±1 px)', ok && [sales, warehouse].every((l) => within(l!.x, shop!.x + 30) && within(l!.w, shop!.w - 30)),
        ok && { shop: [shop!.x, shop!.w], sales: [sales!.x, sales!.w], warehouse: [warehouse!.x, warehouse!.w] });
    check('S2-2 consecutive lanes share a border: Sales.y + Sales.h = Warehouse.y (±1 px)', ok && within(sales!.y + sales!.h, warehouse!.y),
        ok && { sales: [sales!.y, sales!.h], warehouse: warehouse!.y });
    check('S2-2b the lanes fill Shop: Sales.y = Shop.y and Warehouse bottom = Shop bottom (±1 px)', ok && within(sales!.y, shop!.y) && within(warehouse!.y + warehouse!.h, shop!.y + shop!.h),
        ok && { shop: [shop!.y, shop!.h], sales: sales!.y, warehouseBottom: warehouse!.y + warehouse!.h });
    const containment = tasksIn.map(([t, l]) => ({ t, l, task: byKey(t), lane: byKey(l) }));
    check('S2-3 every flow node box is inside its lane box', containment.every((c) => c.task && c.lane && inside(c.task, c.lane)),
        containment.map((c) => ({ t: c.t, l: c.l, task: c.task && [c.task.x, c.task.y, c.task.w, c.task.h], lane: c.lane && [c.lane.x, c.lane.y, c.lane.w, c.lane.h] })));
    check('S2-4 no drawn edge has a Lane vertex as source', laneEdges.length === 0, laneEdges);
    check('S2-5 the black-box pool is at most 48 px high', !!supplier && supplier.h <= 48, supplier && [supplier.w, supplier.h]);
    check('S2-6 the header band of Shop, Sales, Warehouse and Customer is drawn on the left, 30 px, with a vertical label',
        [shop, sales, warehouse, customer].every((n) => !!n && /ir-header-band--w/.test(n.band ?? '') && /^\S*30x/.test((n.band ?? '').split('|')[1] ?? '') && /vertical/.test(n.bandLabel ?? '')),
        [shop, sales, warehouse, customer].map((n) => n && { name: n.name, band: n.band, label: n.bandLabel }));
    const sfCount = edges.filter((e) => /^irobj_/.test(e.id)).length;
    check('S2-7 the four sequence flows and the message flow are drawn (5 synthetic edges)', sfCount === 5, edges.map((e) => e.id));
    check('S2-8 pools and lanes sit under the edges (negative z-index), flow nodes above them',
        [shop, sales, warehouse, customer].every((n) => !!n && Number(n.z) < 0) && ['start', 'check', 'ship'].every((k) => Number(byKey(k)?.z ?? 0) >= 0),
        nodes.map((n) => `${n.name}:${n.z}`));
    await shoot(page, `bpmn-${TAG}-light.png`);
    // The same canvas with the side panel hidden, for reading (the shot above keeps the framing of every run).
    await shoot(page, `bpmn-${TAG}-light-clean.png`, true);

    // Problems (R-GV-2), after the shots: a task in Shop's process that no lane lists, and Ship listed by both lanes.
    const pack = await buildObjects(page, shell.graphId, [['pack', 'Task', 'Pack', 820, 160, [140, 60]]]);
    Object.assign(ids, pack);
    await buildLinks(page, ids, [['shopProc', 'flowElements', 'pack']], [['sales', 'flowNodeRefs', 'ship']]);
    await page.waitForTimeout(SETTLE_MS);
    const after = await ev<Record<string, Array<{ kind: string; title: string; related: string[] }>>>(page, `
        const reg = await import('/src/components/editor-v2/problems/registry.ts');
        const out = {};
        for (const [k, v] of Object.entries(a)) out[k] = reg.getNodeProblemsSnapshot(v.vertex).map((x) => ({ kind: x.kind, title: x.title, related: x.relatedNodeIds,
            detail: (x.conformance || []).map((d) => d.violationType + ': ' + d.message) }));
        return out;`, ids, 0);
    const edgesAfter = await readEdges(page);
    result.problemsPhase = { problems: after, edges: edgesAfter };
    meas('bpmn problems phase', { pack: after.pack, ship: after.ship });
    const kinds = (k: string) => (after[k] ?? []).filter((p) => p.kind === 'containment');
    check('S2-9 an unclaimed task is listed in problems/ (In no container)', kinds('pack').length === 1 && kinds('pack')[0].title === 'In no container', after.pack);
    check('S2-10 a task claimed by both lanes is listed with its two claimants', kinds('ship').length === 1
        && kinds('ship')[0].title === 'Claimed by 2 containers'
        && [...kinds('ship')[0].related].sort().join() === [ids.sales.vertex, ids.warehouse.vertex].sort().join(), after.ship);
    check('S2-11 still no drawn edge has a Lane vertex as source after the membership edits', edgesAfter.filter((e) => laneVertices.has(e.source)).length === 0,
        edgesAfter.filter((e) => laneVertices.has(e.source)));
}

/** The S1 control fixtures: Region (composition hull) with `gv_region`, and the same with `gv_collapsed`'s keys. */
async function sceneHull(browser: Browser, out: Record<string, unknown>) {
    const { page, errors } = await openPage(browser);
    const pid = await createProject(page, `GV_S2_hull_${TAG}_${Date.now()}`);
    await page.goto(`${URL}/#/project?id=${pid}`, { waitUntil: 'domcontentloaded', timeout: 300000 });
    await page.waitForTimeout(NAV_MS);
    await page.addStyleTag({ content: '.notification-widget, .notification-content, .donation-banner { pointer-events: none !important; display: none !important; }' }).catch(() => {});
    meas('hull metamodel', await buildMetamodel(page, [['Named', true, []], ['Region', false, ['Named']], ['State', false, ['Named']]],
        [['Region', 'states', 'State', true, true]], 'Named'));
    const shell = await buildModelShell(page);
    if (!shell.graphId) { check('hull: v2-flow graph exists', false, shell); return; }
    const ids = await buildObjects(page, shell.graphId, [
        ['r1', 'Region', 'region1', 100, 100, null], ['r2', 'Region', 'region2', 700, 100, null],
        ['a', 'State', 'A', 120, 260, null], ['b', 'State', 'B', 380, 260, null], ['c', 'State', 'C', 120, 420, null],
        ['d', 'State', 'D', 720, 300, null], ['x', 'State', 'EXT', 400, 600, null],
    ]);
    await buildLinks(page, ids, [['r1', 'states', 'a'], ['r1', 'states', 'b'], ['r1', 'states', 'c'], ['r2', 'states', 'd']], []);
    const state = { kind: 'vertex', metaclasses: ['State'], shape: { form: 'rounded', labels: [{ position: 'center', source: I('name') }] } };
    await buildViewpoint(page, 'Hulls', [
        ['Region', { kind: 'graphVertex', metaclasses: ['Region'], shape: { form: 'rect', labels: [{ position: 'top', source: I('name') }] }, containment: { collapsible: true } }],
        ['State', state],
    ]);
    await buildViewpoint(page, 'Collapsed', [
        ['Region', { kind: 'graphVertex', metaclasses: ['Region'], shape: { form: 'rounded', fill: '#ffffff', labels: [{ position: 'center', source: I('name') }] },
            containment: { collapsible: true, collapsed: { form: 'cylinder', fill: '#eeeeee', badge: { icon: 'bi-box-seam', position: 'tr', visible: true } } } }],
        ['State', state],
    ]);
    await setTheme(page, 'light');
    const res: Record<string, unknown> = { tag: TAG, ids, errors };
    for (const vp of ['Hulls', 'Collapsed']) {
        await pickViewpoint(page, vp);
        await page.waitForTimeout(SETTLE_MS);
        const nodes = await readNodes(page);
        const hulls = await readHulls(page);
        const edges = await readEdges(page);
        res[vp] = { nodes, hulls, edges };
        meas(`hull ${vp} nodes`, nodes.map((n) => `${n.name} ${n.x},${n.y} ${n.w}x${n.h} z${n.z}`));
        meas(`hull ${vp} hulls`, hulls);
        await shoot(page, `hull-${vp.toLowerCase()}-${TAG}-light.png`);
    }
    out.hull = res;
}

/** Whether any demo export carries a graphVertex view (a pre-existing project with a hull), counted in the app. */
async function sceneDemos(browser: Browser, out: Record<string, unknown>) {
    const res: Record<string, unknown> = {};
    for (const file of readdirSync(DEMOS).filter((f) => f.endsWith('.jjodel'))) {
        const { page } = await openPage(browser);
        await page.goto(`${URL}/#/allProjects`, { waitUntil: 'domcontentloaded', timeout: 300000 });
        await page.waitForTimeout(5000);
        const text = readFileSync(`${DEMOS}/${file}`, 'utf8');
        const counts = await page.evaluate(`(async () => {
            const api = await import('/src/api/persistance/projects.ts');
            const n = () => JSON.parse(localStorage.getItem('projects') || '[]').length;
            const before = n();
            await api.ProjectsApi.importFromText(${JSON.stringify(text)});
            for (let i = 0; i < 75 && n() <= before; i++) await new Promise(r => setTimeout(r, 200));
            const a = JSON.parse(localStorage.getItem('projects') || '[]');
            const id = a.length > before ? a[a.length - 1].id : null;
            if (!id) return null;
            location.hash = '#/project?id=' + id;
            await new Promise(r => setTimeout(r, 9000));
            const idl = window.store.getState().idlookup;
            const kinds = {};
            for (const d of Object.values(idl)) { const k = d && d.ir && d.ir.kind; if (k) kinds[k] = (kinds[k] || 0) + 1; }
            const objects = Object.values(idl).filter((d) => d && d.className === 'DObject').length;
            return { kinds, objects };
        })()`);
        res[file] = counts;
        meas(`demo ${file}`, counts);
        await page.context().close();
    }
    out.demos = res;
}

// ── Main ─────────────────────────────────────────────────────────────────────────────────────────────────────────

if (process.argv[1] && /bpmn-lanes-fixture\.ts$/.test(process.argv[1])) {
    const browser = await chromium.launch();
    const out: Record<string, unknown> = { url: URL, tag: TAG, at: new Date().toISOString() };
    try {
        if (ONLY.includes('bpmn')) await sceneBpmn(browser, out);
        if (ONLY.includes('hull')) await sceneHull(browser, out);
        if (ONLY.includes('demos')) await sceneDemos(browser, out);
    } finally {
        out.checks = { pass, fail };
        writeFileSync(`${OUT}/measures-${TAG}.json`, JSON.stringify(out, null, 2));
        meas('json', `${OUT}/measures-${TAG}.json`);
        await browser.close();
    }
    console.log(`DONE pass=${pass} fail=${fail}`);
    process.exit(fail === 0 ? 0 : 1);
}
