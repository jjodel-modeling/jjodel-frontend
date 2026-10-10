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
 *       GV_ONLY   comma list of scenes: bpmn, hull, demos, s3, s3hull, s6, s6flat, s6hull (default bpmn,hull)
 *       GV_DEMOS  directory of the demo exports for the `demos` scene (default ~/jjodel-demo-exports)
 *       GV_SAVE   opt-in: a directory where each built scene is exported, before any gesture, as the File menu's
 *                 «Download Project» does (gv-bpmn.jjodel, gv-hull.jjodel); open one with Import Project
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
const SAVE = process.env.GV_SAVE ? process.env.GV_SAVE.replace(/\/$/, '') : null;
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
    ['Lane', { kind: 'graphVertex', metaclasses: ['Lane'], label: 'Lane', resizable: true,
        shape: { form: 'rect', fill: '#ffffff', border: { width: 1 }, labels: [headerLabel] },
        containment: { children: '$flowNodeRefs.values', childFilter: isKind('FlowNode'), layout: { mode: 'free', header: band },
            membership: { mode: 'reference', create: { ownerKind: 'Process', feature: 'flowElements' } }, edges: 'hide', collapsible: false } }],
    ['Lane', { kind: 'graphVertex', metaclasses: ['Lane'], label: 'Lane with sub-lanes', priority: 1, resizable: true,
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

const savedOnce = new Set<string>();
/**
 * With GV_SAVE set, the open project as the File menu's «Download Project» writes it (Navbar.tsx): saved, then
 * `buildProjectExportJson` with the runtime megamodel, the format of ~/jjodel-demo-exports. Once per file name: the
 * scenes that build the same model write it once. Without GV_SAVE, nothing.
 */
export async function saveScene(page: Page, file: string) {
    if (!SAVE || savedOnce.has(file)) return;
    savedOnce.add(file);
    const text = await ev<string | null>(page, `
        const api = await import('/src/api/persistance/projects.ts');
        const mp = await import('/src/model/megamodelPersistence.ts');
        const mr = await import('/src/model/megamodelRuntime.ts');
        const project = w.LProject.getProject();
        const dproject = await api.ProjectsApi.save(project);
        return dproject ? JSON.stringify(mp.buildProjectExportJson(dproject, mr.getRuntimeMegamodel(project.id))) : null;`, undefined, 800);
    if (!text) { meas('save', `${file}: no project`); return; }
    mkdirSync(SAVE, { recursive: true });
    writeFileSync(`${SAVE}/${file}`, text);
    meas('save', `${SAVE}/${file} (${text.length} bytes)`);
}

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

export async function shoot(page: Page, file: string, hideRail = false, outSteps = 1) {
    if (hideRail) {
        const hide = page.locator('button[aria-label="Hide the side panel"]:visible');
        if (await hide.count()) { await hide.first().click(); await page.waitForTimeout(900); }
    }
    // The zoom-level button runs fitView (Toolbar.tsx, «Fit to view retired from this group»).
    const fit = page.locator('.toolbar-commands__level:visible');
    if (await fit.count()) { await fit.first().click(); await page.waitForTimeout(900); }
    const out = page.locator('button[title="Zoom out"]:visible');
    if (await out.count()) { await out.first().click(); await page.waitForTimeout(700); }
    // A layout larger than the fit allows (S6): the picture only, the viewport's transform set on the drawn nodes'
    // box (style.transform, flow units), a margin around; React Flow's own viewport is not touched.
    if (outSteps > 1) {
        await page.evaluate((root) => {
            const pane = document.querySelector(root) as HTMLElement | null;
            const vp = document.querySelector(`${root} .react-flow__viewport`) as HTMLElement | null;
            if (!pane || !vp) return;
            let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
            for (const el of Array.from(document.querySelectorAll(`${root} .react-flow__node`)) as HTMLElement[]) {
                if (getComputedStyle(el).visibility === 'hidden' || el.style.display === 'none') continue;
                const m = el.style.transform.match(/translate\(\s*(-?[\d.]+)px,\s*(-?[\d.]+)px\)/);
                if (!m) continue;
                x0 = Math.min(x0, +m[1]); y0 = Math.min(y0, +m[2]); x1 = Math.max(x1, +m[1] + el.offsetWidth); y1 = Math.max(y1, +m[2] + el.offsetHeight);
            }
            if (!Number.isFinite(x0)) return;
            const k = Math.min(1, (pane.clientWidth - 80) / (x1 - x0), (pane.clientHeight - 80) / (y1 - y0));
            vp.style.transform = `translate(${40 - x0 * k}px, ${40 - y0 * k}px) scale(${k})`;
        }, ACTIVE);
        await page.waitForTimeout(400);
    }
    const pane = page.locator(ACTIVE).first();
    await pane.screenshot({ path: `${OUT}/${file}` });
    meas('screenshot', `${OUT}/${file}`);
}

const within = (a: number, b: number, tol = 1) => Math.abs(a - b) <= tol;
const inside = (c: Box, p: Box) => c.x >= p.x - 1 && c.y >= p.y - 1 && c.x + c.w <= p.x + p.w + 1 && c.y + c.h <= p.y + p.h + 1;

// ── Scenes ───────────────────────────────────────────────────────────────────────────────────────────────────────

/** The BPMN scene, built and shown under its viewpoint in the light theme; null when the graph never came. */
export async function buildBpmnScene(browser: Browser, label: string) {
    const { page, errors } = await openPage(browser);
    const pid = await createProject(page, `GV_${label}_${TAG}_${Date.now()}`);
    await page.goto(`${URL}/#/project?id=${pid}`, { waitUntil: 'domcontentloaded', timeout: 300000 });
    await page.waitForTimeout(NAV_MS);
    await page.addStyleTag({ content: '.notification-widget, .notification-content, .donation-banner { pointer-events: none !important; display: none !important; }' }).catch(() => {});
    meas(`${label} metamodel`, await buildMetamodel(page, BPMN_CLASSES, BPMN_REFS, 'BaseElement'));
    const shell = await buildModelShell(page);
    meas(`${label} model shell`, shell);
    if (!shell.graphId) { check(`${label}: v2-flow graph exists`, false, shell); return null; }
    const ids = await buildObjects(page, shell.graphId, BPMN_OBJECTS);
    await buildLinks(page, ids, BPMN_CONTAINMENT, BPMN_REFERENCES);
    const vp = await buildViewpoint(page, 'BPMN', BPMN_VIEWS);
    meas(`${label} viewpoint`, vp);
    await setTheme(page, 'light');
    await pickViewpoint(page, 'BPMN');
    await page.waitForTimeout(SETTLE_MS);
    await saveScene(page, 'gv-bpmn.jjodel');
    return { page, errors, ids, shell: shell as { modelId: string; graphId: string } };
}

async function sceneBpmn(browser: Browser, out: Record<string, unknown>) {
    const scene = await buildBpmnScene(browser, 'S2_bpmn');
    if (!scene) return;
    const { page, errors, ids, shell } = scene;

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
    // Exported under the hull viewpoint, so the file opens on it; without GV_SAVE the scene runs as before.
    if (SAVE) { await pickViewpoint(page, 'Hulls'); await saveScene(page, 'gv-hull.jjodel'); }
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

// ── S3: gestures and membership (P-2026-10-10-0105 S3, docs/lir/lir_2026-10-10_graphvertex_s3.md) ────────────────

/** The zoom of the visible canvas, from its viewport transform. */
export async function zoomOf(page: Page): Promise<number> {
    return page.evaluate(() => {
        const t = (document.querySelector('.dock-tabpane-active .react-flow__viewport') as HTMLElement | null)?.style.transform ?? '';
        const m = t.match(/scale\(\s*([\d.]+)\s*\)/);
        return m ? +m[1] : 1;
    });
}
/** The screen box of a node of the visible canvas. */
export async function screenBox(page: Page, vertexId: string) {
    return page.locator(`.dock-tabpane-active .react-flow__node[data-id="${vertexId}"]`).first().boundingBox();
}
/** A mouse drag in screen pixels, in steps, then a pause for the sync. */
export async function drag(page: Page, from: { x: number; y: number }, to: { x: number; y: number }, settle = 1500) {
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    for (let i = 1; i <= 12; i++) await page.mouse.move(from.x + (to.x - from.x) * i / 12, from.y + (to.y - from.y) * i / 12);
    await page.mouse.up();
    await page.waitForTimeout(settle);
}
/** The ids a slot holds, by its owner's key and feature name, read from Redux. */
export async function slotIds(page: Page, ids: Record<string, { obj: string }>, key: string, feature: string): Promise<string[]> {
    return ev<string[]>(page, `const idl = w.store.getState().idlookup; const o = idl[a.obj];
        for (const f of o?.features || []) { const v = idl[f]; if (v && idl[v.instanceof]?.name === a.feature) return (v.values || []).filter((x) => typeof x === 'string'); }
        return [];`, { obj: ids[key].obj, feature }, 0);
}
/** The stored layout record of each vertex, under the layout key in force. */
export async function records(page: Page, ids: Record<string, { vertex: string }>) {
    return ev<Record<string, { x: number; y: number; w: number; h: number }>>(page, `
        const lay = await import('/src/components/editor-v2/viewpoint/layout/vertexLayout.ts');
        const ad = await import('/src/components/editor-v2/viewpoint/layout/vertexLayoutAdapter.ts');
        const idl = w.store.getState().idlookup; const key = ad.getActiveLayoutKey();
        return Object.fromEntries(Object.entries(a).map(([k, v]) => { const r = lay.readVertexLayout(idl[v.vertex] || {}, key); return [k, { x: r.x, y: r.y, w: r.w, h: r.h }]; }));`, ids, 0);
}
const objectsOf = (page: Page, cls: string) => ev<string[]>(page, `const idl = w.store.getState().idlookup;
    return Object.values(idl).filter((d) => d && d.className === 'DObject' && idl[d.instanceof]?.name === a).map((d) => d.id);`, cls, 0);

async function sceneS3(browser: Browser, out: Record<string, unknown>) {
    const scene = await buildBpmnScene(browser, 'S3_bpmn');
    if (!scene) return;
    const { page, errors, ids, shell } = scene;
    const res: Record<string, unknown> = { tag: TAG, ids };
    out.s3 = res;
    const laneVertices = new Set([ids.sales.vertex, ids.warehouse.vertex]);
    const hit = async (x: number, y: number) => page.evaluate(([x, y]) => { const el = document.elementFromPoint(x, y) as HTMLElement | null; return { cls: String(el?.className ?? '').slice(0, 60), node: (el?.closest('.react-flow__node') as HTMLElement | null)?.dataset.id ?? null }; }, [x, y] as const);
    // An empty point of the pane: a click there clears the selection.
    const clickPane = async () => {
        const pane = await page.locator('.dock-tabpane-active .react-flow__pane').first().boundingBox();
        if (!pane) return false;
        for (let fy = 0.95; fy >= 0.05; fy -= 0.1) for (let fx = 0.05; fx <= 0.95; fx += 0.1) {
            const p = { x: pane.x + pane.width * fx, y: pane.y + pane.height * fy };
            if ((await hit(p.x, p.y)).cls.includes('react-flow__pane')) { await page.mouse.click(p.x, p.y); await page.waitForTimeout(300); return true; }
        }
        return false;
    };
    const laneEdgeCount = async () => (await readEdges(page)).filter((e) => laneVertices.has(e.source)).length;
    const k = await zoomOf(page);
    res.zoom = k;

    // 1. Ship from Warehouse to Sales: the two lists swap it; no lane edge; one undo restores both.
    const before1 = { sales: await slotIds(page, ids, 'sales', 'flowNodeRefs'), warehouse: await slotIds(page, ids, 'warehouse', 'flowNodeRefs') };
    const shipBox = await screenBox(page, ids.ship.vertex);
    const shipRec0 = (await records(page, ids)).ship;
    if (shipBox) await drag(page, { x: shipBox.x + shipBox.width / 2, y: shipBox.y + shipBox.height / 2 }, { x: shipBox.x + shipBox.width / 2, y: shipBox.y + shipBox.height / 2 - 200 * k });
    const after1 = { sales: await slotIds(page, ids, 'sales', 'flowNodeRefs'), warehouse: await slotIds(page, ids, 'warehouse', 'flowNodeRefs') };
    const laneEdges1 = await laneEdgeCount();
    await shoot(page, `s3-ship-moved-${TAG}-light.png`, true);
    check('S3-1 Ship into Sales: Sales.flowNodeRefs gains it, Warehouse.flowNodeRefs loses it',
        after1.sales.includes(ids.ship.obj) && !after1.warehouse.includes(ids.ship.obj) && !before1.sales.includes(ids.ship.obj), { before1, after1 });
    check('S3-2 no Lane→Task edge after the move', laneEdges1 === 0, laneEdges1);
    await page.locator('button[title="Undo (Ctrl+Z)"]:visible').first().click();
    await page.waitForTimeout(2000);
    const undone = { sales: await slotIds(page, ids, 'sales', 'flowNodeRefs'), warehouse: await slotIds(page, ids, 'warehouse', 'flowNodeRefs') };
    const shipRecU = (await records(page, ids)).ship;
    check('S3-3 one undo restores both lists, and Ship\'s place', JSON.stringify(undone) === JSON.stringify(before1)
        && shipRecU.x === shipRec0.x && shipRecU.y === shipRec0.y, { undone, before1, shipRec0, shipRecU });
    check('S3-3b still no Lane→Task edge after the undo', (await laneEdgeCount()) === 0, await laneEdgeCount());
    res.move = { before1, after1, undone, laneEdges1, shipRec0, shipRecU };

    // 2. Back and forth: Ship to Sales and straight back to Warehouse.
    const b2 = await screenBox(page, ids.ship.vertex);
    if (b2) {
        const c = { x: b2.x + b2.width / 2, y: b2.y + b2.height / 2 };
        await drag(page, c, { x: c.x, y: c.y - 200 * k }, 300);
        await drag(page, { x: c.x, y: c.y - 200 * k }, c, 2500);
    }
    const final2 = { sales: await slotIds(page, ids, 'sales', 'flowNodeRefs'), warehouse: await slotIds(page, ids, 'warehouse', 'flowNodeRefs') };
    const pairEdges = await ev<number>(page, `const idl = w.store.getState().idlookup; const g = idl[a.g];
        return (g?.subElements || []).map((id) => idl[id]).filter((d) => d && (d.className === 'DVoidEdge' || d.className === 'DEdge') && d.start === a.wh && d.end === a.ship).length;`,
        { g: shell.graphId, wh: ids.warehouse.vertex, ship: ids.ship.vertex }, 0);
    check('S3-4 back and forth: Ship ends in Warehouse alone, one Warehouse→Ship edge, none drawn',
        final2.warehouse.includes(ids.ship.obj) && !final2.sales.includes(ids.ship.obj) && pairEdges === 1 && (await laneEdgeCount()) === 0, { final2, pairEdges });
    res.backAndForth = { final2, pairEdges };

    // 3. Sales dragged out of Shop: it snaps back, its record untouched.
    const nodes3 = await readNodes(page);
    const sales3 = nodes3.find((n) => n.id === ids.sales.vertex)!;
    const rec3 = (await records(page, ids)).sales;
    const sb = await screenBox(page, ids.sales.vertex);
    // Pressed on its header band, checked to be Sales: the right end of a lane can sit under the side panel.
    const press3 = sb ? { x: sb.x + 10, y: sb.y + 20 } : null;
    const hit3 = press3 ? await hit(press3.x, press3.y) : null;
    if (press3) await drag(page, press3, { x: press3.x, y: press3.y + 500 * k });
    const sales3b = (await readNodes(page)).find((n) => n.id === ids.sales.vertex)!;
    const rec3b = (await records(page, ids)).sales;
    check('S3-5 Sales dragged out of Shop snaps back (box and record unchanged)', hit3?.node === ids.sales.vertex
        && sales3.x === sales3b.x && sales3.y === sales3b.y && sales3.w === sales3b.w && sales3.h === sales3b.h && rec3.x === rec3b.x && rec3.y === rec3b.y,
        { pressedOn: hit3, sales3: [sales3.x, sales3.y, sales3.w, sales3.h], sales3b: [sales3b.x, sales3b.y, sales3b.w, sales3b.h], rec3, rec3b });

    // 4. Shop dragged by its band: every descendant moves by Shop's delta.
    const desc = ['sales', 'warehouse', 'start', 'check', 'gw', 'ship', 'end'];
    const n4 = await readNodes(page);
    const at = (ns: Box[], key: string) => ns.find((n) => n.id === ids[key].vertex)!;
    const pb = await screenBox(page, ids.shop.vertex);
    if (pb) await drag(page, { x: pb.x + 15 * k, y: pb.y + pb.height / 2 }, { x: pb.x + 15 * k + 160 * k, y: pb.y + pb.height / 2 + 32 * k }, 2500);
    const n4b = await readNodes(page);
    const dShop = { x: at(n4b, 'shop').x - at(n4, 'shop').x, y: at(n4b, 'shop').y - at(n4, 'shop').y };
    const deltas = desc.map((d) => ({ d, dx: at(n4b, d).x - at(n4, d).x, dy: at(n4b, d).y - at(n4, d).y }));
    const recs4 = await records(page, ids);
    check('S3-6 Shop dragged: every descendant\'s x (and y) changes by exactly Shop\'s delta', dShop.x !== 0
        && deltas.every((v) => Math.abs(v.dx - dShop.x) < 0.5 && Math.abs(v.dy - dShop.y) < 0.5), { dShop, deltas });
    check('S3-6b the flow nodes\' records moved with it', ['start', 'check', 'gw', 'ship', 'end'].every((d) => Math.abs((recs4[d].x - at(n4b, d).x)) < 0.5),
        Object.fromEntries(['start', 'check', 'ship'].map((d) => [d, [recs4[d].x, at(n4b, d).x]])));
    await shoot(page, `s3-shop-moved-${TAG}-light.png`, true);

    // 5. The Sales/Warehouse border resized: both heights change, their sum does not.
    const n5 = await readNodes(page);
    const s5 = at(n5, 'sales'); const w5 = at(n5, 'warehouse');
    const sb5 = await screenBox(page, ids.sales.vertex);
    // Selected by its header band: the right end of a lane can sit under the side panel.
    // Shop is still selected from the drag, and React Flow lifts a selected node by 1000 (elevateNodesOnSelect): it
    // covers its lanes until it is deselected.
    const paneClicked = await clickPane();
    const hit5 = sb5 ? await hit(sb5.x + 10, sb5.y + sb5.height / 2) : null;
    if (sb5) { await page.mouse.click(sb5.x + 10, sb5.y + sb5.height / 2); await page.waitForTimeout(600); }
    const selected5 = await page.evaluate(() => [...document.querySelectorAll('.dock-tabpane-active .react-flow__node.selected')].map((n) => (n as HTMLElement).dataset.id));
    const line = page.locator(`.dock-tabpane-active .react-flow__node[data-id="${ids.sales.vertex}"] .react-flow__resize-control.line.bottom`).first();
    const lb = (await line.count()) ? await line.boundingBox() : null;
    if (lb) await drag(page, { x: lb.x + lb.width * 0.7, y: lb.y + lb.height / 2 }, { x: lb.x + lb.width * 0.7, y: lb.y + lb.height / 2 + 40 * k }, 2000);
    const n5b = await readNodes(page);
    const s5b = at(n5b, 'sales'); const w5b = at(n5b, 'warehouse');
    const recs5 = await records(page, ids);
    check('S3-7 the Sales/Warehouse border resized: both heights change, their sum is constant',
        !!lb && s5b.h !== s5.h && w5b.h !== w5.h && Math.abs((s5b.h + w5b.h) - (s5.h + w5.h)) < 1 && Math.abs(s5b.y + s5b.h - w5b.y) < 1,
        { line: !!lb, before: [s5.h, w5.h], after: [s5b.h, w5b.h], records: [recs5.sales.h, recs5.warehouse.h], paneClicked, hit: hit5, salesSelected: selected5.includes(ids.sales.vertex) });
    await page.mouse.click(5, 5);

    // 6. A Task dropped from the palette into Warehouse: in the process's flowElements and in Warehouse.flowNodeRefs.
    const tasks0 = await objectsOf(page, 'Task');
    const taskClass = await ev<string>(page, `return w.LProject.getProject().metamodels[0].packages[0].classes.find((c) => c.name === 'Task').id;`, undefined, 0);
    const wb = await screenBox(page, ids.warehouse.vertex);
    if (wb) {
        await page.evaluate(([x, y, cls]) => {
            const el = document.elementFromPoint(x as number, y as number);
            const dt = new DataTransfer();
            dt.setData('application/reactflow', 'objectNode');
            dt.setData('metaclassId', cls as string);
            el?.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, clientX: x as number, clientY: y as number, dataTransfer: dt }));
            el?.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, clientX: x as number, clientY: y as number, dataTransfer: dt }));
        }, [wb.x + wb.width * 0.6, wb.y + wb.height * 0.5, taskClass] as const);
        await page.waitForTimeout(2500);
    }
    const newTasks = (await objectsOf(page, 'Task')).filter((t) => !tasks0.includes(t));
    const fe = await slotIds(page, ids, 'shopProc', 'flowElements');
    const whRefs = await slotIds(page, ids, 'warehouse', 'flowNodeRefs');
    check('S3-8 a Task dropped into Warehouse sits in Process.flowElements and in Warehouse.flowNodeRefs',
        newTasks.length === 1 && fe.includes(newTasks[0]) && whRefs.includes(newTasks[0]), { newTasks, inFlowElements: fe.includes(newTasks[0] ?? ''), inWarehouse: whRefs.includes(newTasks[0] ?? '') });
    res.paletteDrop = { newTasks };

    // 7. A SequenceFlow connected from Check order to Ship: the edge object sits in Process.flowElements.
    const flows0 = await objectsOf(page, 'SequenceFlow');
    // A new connection starts from the ghost handle a hovered side shows (DynamicHandles), on a side with no edge yet:
    // Check's top. It ends on Ship's top border, where Ship's handles sit.
    const srcHandle = page.locator(`.dock-tabpane-active .react-flow__node[data-id="${ids.check.vertex}"] .react-flow__handle.source.mm-anchor--ghost-visible`).first();
    const cb = await screenBox(page, ids.check.vertex);
    const tb = await screenBox(page, ids.ship.vertex);
    if (cb) { await page.mouse.move(cb.x + cb.width / 2, cb.y + 3); await page.waitForTimeout(400); }
    const sh = (await srcHandle.count()) ? await srcHandle.boundingBox() : null;
    const th = tb ? { x: tb.x + tb.width / 2 - 4, y: tb.y - 4, width: 8, height: 8 } : null;
    // The press goes where the handle itself is hit (its half inside the node is under the node's content), and is
    // dispatched on the source ghost: under the pointer the target ghost of the same slot comes on top, and a target
    // handle does not start a connection (DynamicHandles, isConnectableStart false).
    let press: { x: number; y: number } | null = null;
    if (sh) {
        for (let fy = 0.1; fy <= 0.9 && !press; fy += 0.2) for (let fx = 0.5; fx <= 0.9 && !press; fx += 0.2) {
            const p = { x: sh.x + sh.width * fx, y: sh.y + sh.height * fy };
            if ((await hit(p.x, p.y)).cls.includes('react-flow__handle')) press = p;
        }
    }
    let picked = false;
    if (press && th) {
        const to = { x: th.x + th.width / 2, y: th.y + th.height / 2 };
        await page.mouse.move(press.x, press.y); await page.waitForTimeout(200);
        await srcHandle.dispatchEvent('mousedown', { clientX: press.x, clientY: press.y, button: 0, buttons: 1 });
        for (let i = 1; i <= 12; i++) { await page.mouse.move(press.x + (to.x - press.x) * i / 12, press.y + (to.y - press.y) * i / 12); await page.waitForTimeout(40); }
        await page.mouse.up(); await page.waitForTimeout(800);
        const option = page.locator('.edge-type-popup__label', { hasText: 'New SequenceFlow' }).first();
        if (await option.count()) { await option.click(); picked = true; }
        await page.waitForTimeout(2500);
    }
    const newFlows = (await objectsOf(page, 'SequenceFlow')).filter((f) => !flows0.includes(f));
    const fe7 = await slotIds(page, ids, 'shopProc', 'flowElements');
    check('S3-9 a SequenceFlow connected inside Shop sits in Process.flowElements', newFlows.length === 1 && fe7.includes(newFlows[0]),
        { handles: [!!sh, !!th], picked, newFlows, inFlowElements: fe7.includes(newFlows[0] ?? '') });
    res.connect = { handles: [!!sh, !!th], picked, newFlows };
    await shoot(page, `s3-final-${TAG}-light.png`, true);
    res.errors = errors.slice(0, 20);
}

/** S3 control: a graphVertex view without membership or layout keeps today's behaviour exactly. */
async function sceneS3Hull(browser: Browser, out: Record<string, unknown>) {
    const { page } = await openPage(browser);
    const pid = await createProject(page, `GV_S3_hull_${TAG}_${Date.now()}`);
    await page.goto(`${URL}/#/project?id=${pid}`, { waitUntil: 'domcontentloaded', timeout: 300000 });
    await page.waitForTimeout(NAV_MS);
    await page.addStyleTag({ content: '.notification-widget, .notification-content, .donation-banner { pointer-events: none !important; display: none !important; }' }).catch(() => {});
    await buildMetamodel(page, [['Named', true, []], ['Region', false, ['Named']], ['State', false, ['Named']]], [['Region', 'states', 'State', true, true]], 'Named');
    const shell = await buildModelShell(page);
    if (!shell.graphId) { check('S3 hull: v2-flow graph exists', false, shell); return; }
    const ids = await buildObjects(page, shell.graphId, [
        ['r1', 'Region', 'region1', 100, 100, null], ['r2', 'Region', 'region2', 700, 100, null],
        ['a', 'State', 'A', 120, 260, null], ['b', 'State', 'B', 380, 260, null], ['d', 'State', 'D', 720, 300, null],
    ]);
    await buildLinks(page, ids, [['r1', 'states', 'a'], ['r1', 'states', 'b'], ['r2', 'states', 'd']], []);
    await buildViewpoint(page, 'Hulls', [
        ['Region', { kind: 'graphVertex', metaclasses: ['Region'], shape: { form: 'rect', labels: [{ position: 'top', source: I('name') }] }, containment: { collapsible: true } }],
        ['State', { kind: 'vertex', metaclasses: ['State'], shape: { form: 'rounded', labels: [{ position: 'center', source: I('name') }] } }],
    ]);
    await setTheme(page, 'light');
    await pickViewpoint(page, 'Hulls');
    await page.waitForTimeout(SETTLE_MS);
    const k = await zoomOf(page);
    const r1Before = await slotIds(page, ids, 'r1', 'states');
    const r2Before = await slotIds(page, ids, 'r2', 'states');
    const rec0 = await records(page, ids);
    // A State dragged into the other Region's box: moved, slots untouched (no membership, today).
    const ab = await screenBox(page, ids.a.vertex);
    const d0 = (await readNodes(page)).find((n) => n.id === ids.d.vertex)!;
    if (ab) await drag(page, { x: ab.x + ab.width / 2, y: ab.y + ab.height / 2 }, { x: ab.x + ab.width / 2 + (d0.x - rec0.a.x) * k, y: ab.y + ab.height / 2 + 120 * k });
    const rec1 = await records(page, ids);
    const r1After = await slotIds(page, ids, 'r1', 'states');
    const r2After = await slotIds(page, ids, 'r2', 'states');
    check('S3-10 hull view without membership: a State dropped in another Region moves, the slots are untouched',
        rec1.a.x !== rec0.a.x && JSON.stringify(r1After) === JSON.stringify(r1Before) && JSON.stringify(r2After) === JSON.stringify(r2Before),
        { a: [rec0.a, rec1.a], r1: [r1Before, r1After], r2: [r2Before, r2After] });
    // A Region dragged: its States stay where they are (no layout, today).
    const rb = await screenBox(page, ids.r2.vertex);
    if (rb) await drag(page, { x: rb.x + rb.width / 2, y: rb.y + rb.height / 2 }, { x: rb.x + rb.width / 2 + 96 * k, y: rb.y + rb.height / 2 + 48 * k });
    const rec2 = await records(page, ids);
    check('S3-11 hull view without layout: a Region dragged moves alone', rec2.r2.x !== rec1.r2.x && rec2.d.x === rec1.d.x && rec2.d.y === rec1.d.y,
        { r2: [rec1.r2, rec2.r2], d: [rec1.d, rec2.d] });
    await shoot(page, `s3-hull-${TAG}-light.png`, true);
    out.s3hull = { ids, rec0, rec1, rec2, r1Before, r1After, r2Before, r2After };
}

// ── S6: the toolbar Auto layout across containers ────────────────────────────────────────────────────────────────

/** One click on the toolbar's Auto layout, and the time for the layout, the writes and the fit to settle. */
export async function autoLayout(page: Page) {
    await page.locator('button[title="Auto layout"]:visible').first().click();
    await page.waitForTimeout(4000);
}
const overlaps = (a: Box, b: Box) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
/** Every drawn node by its object's name, rounded to 0.1 px: the comparable dump of a layout. */
const byName = (ns: Box[]) => Object.fromEntries(ns.filter((n) => n.name).map((n) => [n.name, [Math.round(n.x * 10) / 10, Math.round(n.y * 10) / 10, n.w, n.h]]).sort(([a], [b]) => String(a).localeCompare(String(b))));

/** S6: after one Auto layout, every flow node in its lane, in its lane's list, no overlap, flows left to right,
 *  pools holding their content; a second Auto layout gives the same positions. */
async function sceneS6(browser: Browser, out: Record<string, unknown>) {
    const scene = await buildBpmnScene(browser, 'S6_bpmn');
    if (!scene) return;
    const { page, errors, ids } = scene;
    const res: Record<string, unknown> = { tag: TAG };
    out.s6 = res;
    const refs = async () => ({ sales: await slotIds(page, ids, 'sales', 'flowNodeRefs'), warehouse: await slotIds(page, ids, 'warehouse', 'flowNodeRefs') });
    const refs0 = await refs();
    res.before = byName(await readNodes(page));
    await autoLayout(page);
    const n1 = await readNodes(page);
    res.after1 = byName(n1);
    const at = (key: string) => n1.find((n) => n.id === ids[key].vertex)!;
    const lanes: Record<string, string> = { start: 'sales', check: 'sales', gw: 'sales', ship: 'warehouse', end: 'warehouse' };
    check('S6-1 every flow node lies inside its lane\'s box', Object.entries(lanes).every(([k, l]) => inside(at(k), at(l))),
        Object.fromEntries(Object.entries(lanes).map(([k, l]) => [k, [at(k).x, at(k).y, at(k).w, at(k).h, l, at(l).x, at(l).y, at(l).w, at(l).h]])));
    const refs1 = await refs();
    check('S6-2 every flow node stays in its lane\'s flowNodeRefs', JSON.stringify(refs1) === JSON.stringify(refs0), { refs0, refs1 });
    const flow = ['start', 'check', 'gw', 'ship', 'end', 'place', 'receive'];
    const pairs = flow.flatMap((a, i) => flow.slice(i + 1).filter((b) => overlaps(at(a), at(b))).map((b) => `${a}/${b}`));
    check('S6-3 no two flow nodes overlap', pairs.length === 0, pairs);
    const flows: Array<[string, string]> = [['start', 'check'], ['check', 'gw'], ['gw', 'ship'], ['ship', 'end']];
    check('S6-4 every sequence flow goes left to right (source x < target x)', flows.every(([s, t]) => at(s).x < at(t).x),
        flows.map(([s, t]) => `${s}:${at(s).x} -> ${t}:${at(t).x}`));
    const pools: Array<[string, string]> = [['shop', 'sales'], ['shop', 'warehouse'], ['customer', 'place'], ['customer', 'receive']];
    check('S6-5 the pools hold their lanes and their tasks, and no two pools overlap',
        pools.every(([p, c]) => inside(at(c), at(p))) && !overlaps(at('shop'), at('customer')) && !overlaps(at('shop'), at('supplier')) && !overlaps(at('customer'), at('supplier')),
        Object.fromEntries(['shop', 'customer', 'supplier', 'sales', 'warehouse'].map((k) => [k, [at(k).x, at(k).y, at(k).w, at(k).h]])));
    await shoot(page, `s6-bpmn-${TAG}-light.png`, true, 3);
    await autoLayout(page);
    const n2 = await readNodes(page);
    res.after2 = byName(n2);
    const moved = n1.filter((n) => { const m = n2.find((x) => x.id === n.id); return !m || Math.abs(m.x - n.x) > 1 || Math.abs(m.y - n.y) > 1 || Math.abs(m.w - n.w) > 1 || Math.abs(m.h - n.h) > 1; });
    check('S6-6 a second Auto layout gives the same positions and sizes (within 1 px)', moved.length === 0, moved.map((n) => n.name));
    res.errors = errors.slice(0, 20);
}

/** The views of the BPMN fixture with every graphVertex drawn as a plain vertex: a viewpoint with no graphVertex view. */
const FLAT_VIEWS: Array<[string, Record<string, unknown>]> = BPMN_VIEWS.map(([c, ir]) => {
    if (ir.kind !== 'graphVertex') return [c, ir];
    const { containment: _c, kind: _k, ...rest } = ir as Record<string, unknown>;
    return [c, { ...rest, kind: 'vertex' }];
});

/** Control: the BPMN model under a viewpoint with no graphVertex view, after one Auto layout, dumped by name. */
async function sceneS6Flat(browser: Browser, out: Record<string, unknown>) {
    const { page, errors } = await openPage(browser);
    const pid = await createProject(page, `GV_S6_flat_${TAG}_${Date.now()}`);
    await page.goto(`${URL}/#/project?id=${pid}`, { waitUntil: 'domcontentloaded', timeout: 300000 });
    await page.waitForTimeout(NAV_MS);
    await page.addStyleTag({ content: '.notification-widget, .notification-content, .donation-banner { pointer-events: none !important; display: none !important; }' }).catch(() => {});
    await buildMetamodel(page, BPMN_CLASSES, BPMN_REFS, 'BaseElement');
    const shell = await buildModelShell(page);
    if (!shell.graphId) { check('s6flat: v2-flow graph exists', false, shell); return; }
    const ids = await buildObjects(page, shell.graphId, BPMN_OBJECTS);
    await buildLinks(page, ids, BPMN_CONTAINMENT, BPMN_REFERENCES);
    await buildViewpoint(page, 'Flat', FLAT_VIEWS);
    await setTheme(page, 'light');
    await pickViewpoint(page, 'Flat');
    await page.waitForTimeout(SETTLE_MS);
    await autoLayout(page);
    const positions = byName(await readNodes(page));
    meas('s6flat positions', positions);
    await shoot(page, `s6-flat-${TAG}-light.png`, true, 3);
    out.s6flat = { positions, errors: errors.slice(0, 10) };
}

/** Control: the S1 hull scenes after one Auto layout, under each viewpoint, dumped by name. */
async function sceneS6Hull(browser: Browser, out: Record<string, unknown>) {
    const { page, errors } = await openPage(browser);
    const pid = await createProject(page, `GV_S6_hull_${TAG}_${Date.now()}`);
    await page.goto(`${URL}/#/project?id=${pid}`, { waitUntil: 'domcontentloaded', timeout: 300000 });
    await page.waitForTimeout(NAV_MS);
    await page.addStyleTag({ content: '.notification-widget, .notification-content, .donation-banner { pointer-events: none !important; display: none !important; }' }).catch(() => {});
    await buildMetamodel(page, [['Named', true, []], ['Region', false, ['Named']], ['State', false, ['Named']]], [['Region', 'states', 'State', true, true]], 'Named');
    const shell = await buildModelShell(page);
    if (!shell.graphId) { check('s6hull: v2-flow graph exists', false, shell); return; }
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
    const res: Record<string, unknown> = { errors };
    for (const vp of ['Hulls', 'Collapsed']) {
        await pickViewpoint(page, vp);
        await page.waitForTimeout(SETTLE_MS);
        await autoLayout(page);
        const positions = byName(await readNodes(page));
        res[vp] = { positions, hulls: await readHulls(page) };
        meas(`s6hull ${vp} positions`, positions);
        await shoot(page, `s6-hull-${vp.toLowerCase()}-${TAG}-light.png`);
    }
    out.s6hull = res;
}

// ── Main ─────────────────────────────────────────────────────────────────────────────────────────────────────────

if (process.argv[1] && /bpmn-lanes-fixture\.ts$/.test(process.argv[1])) {
    const browser = await chromium.launch();
    const out: Record<string, unknown> = { url: URL, tag: TAG, at: new Date().toISOString() };
    try {
        if (ONLY.includes('bpmn')) await sceneBpmn(browser, out);
        if (ONLY.includes('hull')) await sceneHull(browser, out);
        if (ONLY.includes('demos')) await sceneDemos(browser, out);
        if (ONLY.includes('s3')) await sceneS3(browser, out);
        if (ONLY.includes('s3hull')) await sceneS3Hull(browser, out);
        if (ONLY.includes('s6')) await sceneS6(browser, out);
        if (ONLY.includes('s6flat')) await sceneS6Flat(browser, out);
        if (ONLY.includes('s6hull')) await sceneS6Hull(browser, out);
    } finally {
        out.checks = { pass, fail };
        writeFileSync(`${OUT}/measures-${TAG}.json`, JSON.stringify(out, null, 2));
        meas('json', `${OUT}/measures-${TAG}.json`);
        await browser.close();
    }
    console.log(`DONE pass=${pass} fail=${fail}`);
    process.exit(fail === 0 ? 0 : 1);
}
