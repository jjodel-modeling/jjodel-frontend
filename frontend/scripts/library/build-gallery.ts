/**
 * build-gallery (P-2026-10-18-1800, slice S1): builds the five gallery projects of R-LIB-5 in a running app and saves
 * them as the project files the Templates page clones, frontend/public/library/gallery/<id>/<n>.jjodel, `n` the
 * entry's current version (R-LIB-9, P-2026-10-18-2300).
 *
 * The files are written by the app's own importers and export, not by hand. For each catalog entry of kind
 * `galleryProject` (docs/library/catalog.json), in a fresh browser context (so the store holds that project alone):
 *   - a project named as the catalog label is created through the dashboard's New Project;
 *   - its metamodels are imported through the project page's `.ecore` input, then its models through the `.xmi` input
 *     (EcoreService.importFromFile, XMIService.importM1FromFile: the XMI resolves its metamodel by nsURI or by
 *     EPackage name, so the metamodels go first);
 *   - one viewpoint per metamodel is written by hand with the IR, as the probes write theirs (bpmn-lanes-fixture.ts
 *     `buildViewpoint`: `DViewPoint.newVP`, `createViewInWorkbench`, `view.ir`), named after the metamodel, and the
 *     first one is made the active viewpoint (`activateViewpoint`, utils/lastViewpoint.ts: `project.activeViewpoint`
 *     and the root `viewpoint`, both in the exported store) (R-LIB-9, P-2026-10-18-2300);
 *   - each model's editor is opened once, so its layout is in the store the export serializes, and it must show nodes;
 *     a template's vertices are then placed by PLACES (the drag's write, `syncPositionToJjom`, under the layout of the
 *     viewpoint that draws the model), short and wide so the fit leaves the minimap's corner empty, and the view fitted;
 *   - Navbar's File → «Download Project» is clicked, and the browser's download is the file.
 *
 * Sources: frontend/scripts/library/gallery/<id>/ (the fixtures of src/__tests__/fixtures/xmi-m1/ copied, plus the
 * Families, Persons and Library metamodels and the Library, Graph and Shapes sample models written for the gallery).
 * The tier `template` is built; the tier `example` is a byte copy of its first `source` (a codegen example of
 * frontend/public/examples/codegen/, which stays where it is).
 *
 * A published version is never rewritten (R-LIB-9): when the file of the current version exists, the build refuses it
 * unless GAL_REWRITE names it (`<id>@<n>`, comma separated). A fix is a new version in the catalog.
 *
 * Run:  ~/.local/bin/node frontend/scripts/lane-run.mjs probe <worktree> frontend/scripts/library/build-gallery.ts \
 *         --port 3097 --id P-2026-10-18-1800
 * Env:  GAL_ID       one catalog id (default: every galleryProject)
 *       GAL_DIR      the output folder (default frontend/public/library/gallery)
 *       GAL_REWRITE  the existing versions the build may overwrite, `<id>@<n>` comma separated
 */
import { chromium, type Browser, type Page } from '@playwright/test';
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { seed } from '../smoke/states.ts';

const URL = (process.env.PROBE_URL || 'http://localhost:3097/').replace(/\/$/, '');
if (/:(3000|3001|3003)$/.test(URL)) throw new Error('never 3000, 3001 or 3003');
const DIR = process.env.GAL_DIR || new globalThis.URL('../../public/library/gallery', import.meta.url).pathname;
const SRC = (id: string, file: string) => new globalThis.URL(`./gallery/${id}/${file}`, import.meta.url).pathname;
const REPO = (path: string) => new globalThis.URL(`../../../${path}`, import.meta.url).pathname;
mkdirSync(DIR, { recursive: true });

interface Entry { id: string; kind: string; label: string; tier?: string; version?: number; source?: string[] }
const catalog = JSON.parse(readFileSync(new globalThis.URL('../../../docs/library/catalog.json', import.meta.url), 'utf8')) as { entries: Entry[] };
const GALLERY = catalog.entries.filter(e => e.kind === 'galleryProject');

/** The sources of each project, in import order: metamodels first, then the models that instantiate them. */
const SOURCES: Record<string, { ecore: string[]; xmi: string[] }> = {
    library: { ecore: ['Library.ecore'], xmi: ['sample-Library.xmi'] },
    'families-persons': { ecore: ['Families.ecore', 'Persons.ecore'], xmi: ['sample-Families.xmi', 'sample-Persons.xmi'] },
    'state-machine': { ecore: ['StateMachine.ecore'], xmi: ['sample-StateMachine.xmi'] },
    graph: { ecore: ['Graph.ecore'], xmi: ['sample-Graph.xmi'] },
    shapes: { ecore: ['Shapes.ecore'], xmi: ['sample-Shapes.xmi'] },
};
// ── The template viewpoints (R-LIB-9): one per metamodel, hand-written with the IR ────────────────────────────────

type View = [string, Record<string, unknown>];
interface Viewpoint { metamodel: string; name: string; views: View[] }

const I = (prop: string) => ({ from: 'intrinsic', prop });
const P = (expr: string) => ({ from: 'path', expr });
const L = (text: string) => ({ from: 'literal', text });
const isKind = (c: string) => ({ op: 'isKind', class: c });
const center = (source: unknown) => ({ position: 'center', source });
/** The name compartment of a frame: a band on top, the label in it. */
const BAND = { side: 'n', size: 28 };
const arrow = { sourceEnd: 'none', targetEnd: 'openArrow' };

/** A root that only holds the others: not drawn, and its containment arcs go with it (irContainment.ts). */
const hidden = (c: string): View => [c, { kind: 'vertex', metaclasses: [c], label: `${c} (not drawn)`, visible: false, shape: { form: 'rect' } }];
const vertex = (c: string, form: string, size: [number, number], label: unknown, border: Record<string, unknown> = { width: 1 }): View =>
    [c, { kind: 'vertex', metaclasses: [c], label: c, defaultSize: { width: size[0], height: size[1] },
        shape: { form, fill: '#ffffff', border, labels: [center(label)] } }];
/** A frame headed by `label` holding its `child` objects (every composition feature: the default channel), sized to
 *  them; the containment arcs of the channel are hidden. */
const frame = (c: string, label: unknown, child: string): View =>
    [c, { kind: 'graphVertex', metaclasses: [c], label: `${c} frame`,
        shape: { form: 'rect', fill: '#ffffff', border: { width: 1.5 }, labels: [{ position: 'header', source: label }] },
        containment: { childFilter: isKind(child), layout: { mode: 'free', frame: 'self', header: BAND, padding: 16 }, edges: 'hide', collapsible: false } }];
/** No edge view hides a reference edge (statechart-fixture.ts SC_VIEWS): one that must not show is drawn clear. */
const clear = (c: string, ref: string): View =>
    [c, { kind: 'edge', metaclasses: [c], reference: ref, label: `${c}.${ref} (drawn clear)`,
        edge: { line: { color: 'transparent', width: 1 }, terminations: { sourceEnd: 'none', targetEnd: 'none' } } }];
const kindIs = (literal: string) => ({ op: 'eq', left: '$kind.value', right: { kind: 'string', value: literal } });

const VIEWPOINTS: Record<string, Viewpoint[]> = {
    graph: [{ metamodel: 'Graph', name: 'Graph', views: [
        hidden('Graph'),
        vertex('Node', 'circle', [64, 64], I('name'), { width: 1.5 }),
        ['Edge', { kind: 'edge', metaclasses: ['Edge'], label: 'Edge (an arc)',
            edge: { source: '$source.value', target: '$target.value', line: { width: 1.5 }, terminations: arrow } }],
    ] }],
    library: [{ metamodel: 'Library', name: 'Library', views: [
        hidden('Library'),
        vertex('Book', 'rounded', [180, 56], P('$title.value')),
        vertex('Magazine', 'rect', [180, 56], P('$title.value'), { width: 1, style: 'dashed' }),
        vertex('Writer', 'ellipse', [170, 56], I('name')),
        vertex('Member', 'stadium', [120, 40], I('name')),
        ['Book', { kind: 'edge', metaclasses: ['Book'], reference: 'authors', label: 'Book.authors',
            edge: { line: { width: 1.5 }, terminations: arrow, labels: { center: L('author') } } }],
        ['LibraryItem', { kind: 'edge', metaclasses: ['LibraryItem'], reference: 'borrowedBy', label: 'LibraryItem.borrowedBy',
            edge: { line: { width: 1, style: 'dashed' }, terminations: arrow, labels: { center: L('borrowed by') } } }],
    ] }],
    'state-machine': [{ metamodel: 'statemachine', name: 'StateMachine', views: [
        hidden('StateMachine'),
        vertex('State', 'rounded', [120, 48], I('name')),
        // The kind tells initial and final apart; its slot holds the literal (R-FRM-3).
        ['State', { kind: 'vertex', metaclasses: ['State'], label: 'Initial state', priority: 1, predicate: kindIs('initial'),
            defaultSize: { width: 24, height: 24 },
            shape: { form: 'circle', fill: '#1f2937', border: { width: 0 }, labels: [{ position: 'outside', anchor: 's', source: I('name') }] } }],
        ['State', { kind: 'vertex', metaclasses: ['State'], label: 'Final state', priority: 1, predicate: kindIs('final'),
            defaultSize: { width: 32, height: 32 },
            shape: { form: 'circle', fill: '#ffffff', border: { width: 4, style: 'double' }, labels: [{ position: 'outside', anchor: 's', source: I('name') }] } }],
        ['State', { kind: 'graphVertex', metaclasses: ['State'], label: 'Composite state', priority: 2,
            predicate: { op: 'exists', path: '$substates.values[0]' },
            shape: { form: 'rounded', fill: '#ffffff', border: { width: 1 }, labels: [{ position: 'header', source: I('name') }] },
            containment: { children: '$substates.values', childFilter: isKind('State'),
                layout: { mode: 'free', frame: 'self', header: BAND, padding: 16 }, edges: 'hide', collapsible: false } }],
        ['Transition', { kind: 'edge', metaclasses: ['Transition'], label: 'Transition',
            edge: { source: '$source.value', target: '$target.value', line: { width: 1 }, terminations: arrow, labels: { center: P('$trigger.value') } } }],
        ['Transition', { kind: 'edge', metaclasses: ['Transition'], label: 'Transition (guard)', priority: 1, predicate: { op: 'exists', path: '$guard.value' },
            edge: { source: '$source.value', target: '$target.value', line: { width: 1 }, terminations: arrow,
                labels: { template: [P('$trigger.value'), L(' ['), P('$guard.value'), L(']')] } } }],
        clear('State', 'outgoing'),
    ] }],
    'families-persons': [
        { metamodel: 'Families', name: 'Families', views: [
            frame('Family', P('$lastName.value'), 'Member'),
            vertex('Member', 'rounded', [110, 36], P('$firstName.value')),
            ...['familyFather', 'familyMother', 'familySon', 'familyDaughter'].map(r => clear('Member', r)),
        ] },
        { metamodel: 'Persons', name: 'Persons', views: [
            vertex('Male', 'rect', [150, 40], P('$fullName.value')),
            vertex('Female', 'stadium', [150, 40], P('$fullName.value')),
        ] },
    ],
    shapes: [{ metamodel: 'Shapes', name: 'Shapes', views: [
        frame('Canvas', I('name'), 'Shape'),
        vertex('Circle', 'circle', [72, 72], P('$label.value')),
        vertex('Square', 'rect', [72, 72], P('$label.value')),
    ] }],
};

/**
 * Where each vertex of a template sits (flow px, top left), by model and by the object's label; the viewpoint that
 * draws the model when it is not the first. A frame (`frame: 'self'`) is the box of its children and is not placed.
 * Every layout is at most ~330 px tall: at the fit's maxZoom 1 the 1440×900 canvas keeps the minimap's band empty.
 */
const PLACES: Record<string, Record<string, { viewpoint?: string; at: Record<string, [number, number]> }>> = {
    graph: { 'sample-Graph': { at: { A: [0, 140], B: [260, 0], C: [520, 140], D: [260, 280] } } },
    library: { 'sample-Library': { at: {
        'Pride and Prejudice': [0, 0], Emma: [240, 0], 'The Hobbit': [480, 0], 'Literary Review': [720, 0],
        'Jane Austen': [125, 150], 'J. R. R. Tolkien': [485, 150], Anna: [30, 290], Luca: [510, 290],
    } } },
    'state-machine': { 'sample-StateMachine': { at: {
        Idle: [0, 112], Warmup: [200, 112], Steady: [280, 100], Off: [620, 40], Broken: [600, 180],
    } } },
    'families-persons': {
        'sample-Families': { at: {
            Jim: [0, 0], Cindy: [130, 0], Brandon: [0, 56], Brenda: [130, 56],
            Peter: [330, 0], Jackie: [460, 0], Kelly: [590, 0], David: [330, 56], Dylan: [460, 56],
        } },
        'sample-Persons': { viewpoint: 'Persons', at: {
            'Jim March': [0, 0], 'Brandon March': [180, 0], 'Peter Sailor': [360, 0], 'David Sailor': [540, 0], 'Dylan Sailor': [720, 0],
            'Cindy March': [90, 100], 'Brenda March': [270, 100], 'Jackie Sailor': [450, 100], 'Kelly Sailor': [630, 100],
        } },
    },
    shapes: { 'sample-Shapes': { at: { sun: [0, 0], wheel: [120, 0], house: [240, 0] } } },
};

const IDS = process.env.GAL_ID ? [process.env.GAL_ID] : GALLERY.map(e => e.id);
const REWRITE = new Set((process.env.GAL_REWRITE || '').split(',').filter(Boolean));

/** The file of the entry's current version; null, after a FAIL, when it exists and GAL_REWRITE does not name it. */
function target(entry: Entry): string | null {
    const ref = `${entry.id}@${entry.version}`;
    const out = `${DIR}/${entry.id}/${entry.version}.jjodel`;
    if (!entry.version) { check(`${entry.id}: has a current version`, false, ''); return null; }
    if (existsSync(out) && !REWRITE.has(ref)) { check(`${ref}: is not rewritten (published; GAL_REWRITE=${ref} to overwrite)`, false, out); return null; }
    mkdirSync(`${DIR}/${entry.id}`, { recursive: true });
    return out;
}
const sha256 = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex');

let failures = 0;
const check = (label: string, ok: boolean, detail: unknown) => {
    if (!ok) failures++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}  ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`);
};
const wait = (page: Page, ms: number) => page.waitForTimeout(ms);

async function poll<T>(page: Page, expr: string, ms: number): Promise<T | null> {
    const end = Date.now() + ms;
    while (Date.now() < end) {
        const v = await page.evaluate(expr).catch(() => null) as T | null;
        if (v) return v;
        await wait(page, 250);
    }
    return null;
}

// ── Page side (plain strings: no transform) ─────────────────────────────────────────────────────

/** The open project's metamodels and models, each model with the count of objects under it. */
const INFO = String.raw`(async () => {
  try {
    const j = await import('/src/joiner/index.ts');
    const lk = window.windoww.store.getState().idlookup;
    const p = j.L.fromPointer(j.DUser.current).project;
    if (!p) return null;
    const under = (id, root) => { let d = lk[id]; for (let i = 0; d && i < 60; i++) { if (d.father === root) return true; d = lk[d.father]; } return false; };
    const objs = Object.values(lk).filter((d) => d && d.className === 'DObject');
    return {
      id: p.id, name: p.name,
      metamodels: (p.metamodels || []).map((m) => ({ id: m.id, name: m.name })),
      models: (p.models || []).filter((m) => !m.isMetamodel).map((m) => ({ id: m.id, name: m.name, objects: objs.filter((o) => under(o.id, m.id)).length })),
    };
  } catch (e) { return null; }
})()`;

/** Navbar's File → «Download Project», the entry a user clicks (Navbar.tsx, `name: 'Download Project'`). */
const DOWNLOAD_ENTRY = String.raw`(() => {
  const li = [...document.querySelectorAll('li')].find((l) => { const s = l.querySelector(':scope > label span span'); return s && s.textContent.trim() === 'Download Project'; });
  if (!li) return false;
  li.click();
  return true;
})()`;

/** One viewpoint, as bpmn-lanes-fixture.ts `buildViewpoint` writes it, on the classes of the metamodel it names. */
const BUILD_VIEWPOINT = (vp: Viewpoint) => String.raw`(async () => {
  const lv = await import('/src/utils/lastViewpoint.ts');
  const vp = ${JSON.stringify(vp)};
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const mm = window.LProject.getProject().metamodels.find((m) => m.name === vp.metamodel);
  if (!mm) return { error: 'no metamodel ' + vp.metamodel };
  const classes = mm.packages.flatMap((k) => k.classes);
  const vpId = window.DViewPoint.newVP(vp.name, undefined, true).id;
  await sleep(600);
  const made = [];
  for (const [cls, ir] of vp.views) {
    const klass = classes.find((k) => k.name === cls);
    if (!klass) return { error: 'no class ' + cls };
    const id = lv.createViewInWorkbench(klass.id, klass.name, 'DClass', vpId);
    await sleep(400);
    const pins = {};
    for (const m of ir.metaclasses) pins[m] = classes.find((k) => k.name === m).id;
    window.LPointerTargetable.fromPointer(id).ir = { irVersion: 'ir-1.2', exclusive: true, ...ir, authoringMetaclassPins: pins };
    await sleep(400);
    made.push(cls + ':' + (window.windoww.store.getState().idlookup[id]?.ir?.kind ?? 'none'));
  }
  return { id: vpId, name: vp.name, made };
})()`;

/** Places the drawn vertices of one model's pane by their object's label; returns the labels placed and missed. */
const PLACE = (modelId: string, at: Record<string, [number, number]>) => String.raw`(async () => {
  const c2j = await import('/src/components/editor-v2/sync/canvasToJjom.ts');
  const at = ${JSON.stringify(at)};
  const lk = window.windoww.store.getState().idlookup;
  const LABELS = ['name', 'title', 'firstName', 'fullName', 'label', 'lastName'];
  const labelOf = (o) => { for (const f of (o && o.features) || []) { const v = lk[f]; const n = v && (lk[v.instanceof] || {}).name; if (LABELS.includes(n) && v.values && v.values[0]) return v.values[0]; } return null; };
  const pane = document.querySelector('[role="tabpanel"][aria-labelledby$="-tab-${modelId}"] .react-flow');
  const placed = [];
  for (const n of pane ? pane.querySelectorAll('.react-flow__node') : []) {
    const key = labelOf(lk[(lk[n.dataset.id] || {}).model]);
    if (key && at[key]) { c2j.syncPositionToJjom(n.dataset.id, at[key][0], at[key][1]); placed.push(key); }
  }
  return { placed, missed: Object.keys(at).filter((k) => !placed.includes(k)) };
})()`;

async function build(browser: Browser, entry: Entry): Promise<void> {
    const src = SOURCES[entry.id];
    if (!src) { check(`${entry.id}: has sources`, false, 'no SOURCES row'); return; }
    const out = target(entry);
    if (!out) return;
    // The probe's and the screenshots' viewport, so the fitted view the export stores is the one they open on.
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
    await ctx.addInitScript(() => { (globalThis as any).__name = (f: any) => f; });
    await seed(ctx, true);
    const page = await ctx.newPage();
    const errors: string[] = [];
    page.on('pageerror', (e: Error) => errors.push('pageerror: ' + e.message));
    try {
        await page.goto(`${URL}/#/allProjects`, { waitUntil: 'domcontentloaded', timeout: 300000 });
        await poll(page, `!!(window.windoww && window.windoww.store && window.LPointerTargetable)`, 120000);
        await wait(page, 3000);
        await page.locator('button', { hasText: 'New Project' }).first().click();
        await wait(page, 1500);
        await page.locator('input[type="text"]').first().fill(entry.label);
        await page.locator('button', { hasText: /^Create/ }).last().click();
        const pid = await poll<string>(page, `(() => { const a = JSON.parse(localStorage.getItem('projects') || '[]'); return a.length ? a[a.length - 1].id : null; })()`, 30000);
        check(`${entry.id}: the project «${entry.label}» is created`, !!pid, String(pid));
        if (!pid) return;
        await page.goto(`${URL}/?open=${encodeURIComponent(pid)}#/project?id=${pid}`, { waitUntil: 'domcontentloaded', timeout: 300000 });
        const opened = await poll(page, `(async () => { const i = await ${INFO}; return i && i.id === ${JSON.stringify(pid)} && document.querySelector('input[type="file"][accept=".ecore"]') ? i : null; })()`, 120000);
        check(`${entry.id}: the project page is open`, !!opened, '');
        if (!opened) return;
        await wait(page, 3000);

        for (const [i, file] of src.ecore.entries()) {
            await page.locator('input[type="file"][accept=".ecore"]').setInputFiles(SRC(entry.id, file));
            const got = await poll(page, `(async () => { const i = await ${INFO}; return i && i.metamodels.length >= ${i + 1} ? i : null; })()`, 30000);
            check(`${entry.id}: the metamodel ${file} is imported`, !!got, got ? (got as any).metamodels.map((m: any) => m.name) : '');
            await page.keyboard.press('Escape');
            await wait(page, 1500);
        }
        for (const [i, file] of src.xmi.entries()) {
            await page.locator('input[type="file"][accept=".xmi,.xml"]').setInputFiles(SRC(entry.id, file));
            const got = await poll(page, `(async () => { const i = await ${INFO}; return i && i.models.length >= ${i + 1} ? i : null; })()`, 30000);
            check(`${entry.id}: the model ${file} is imported`, !!got, got ? (got as any).models : '');
            await page.keyboard.press('Escape');
            await wait(page, 1500);
        }
        const info = await page.evaluate(INFO) as any;
        check(`${entry.id}: ${src.ecore.length} metamodel(s) and ${src.xmi.length} model(s) in the project`,
            info.metamodels.length === src.ecore.length && info.models.length === src.xmi.length, { metamodels: info.metamodels.map((m: any) => m.name), models: info.models });
        check(`${entry.id}: every model has objects`, info.models.every((m: any) => m.objects > 0), info.models.map((m: any) => `${m.name}:${m.objects}`));

        // The viewpoints (R-LIB-9), then the first made active, before the editors open: their layout is the active one's.
        const built: { id: string; name: string }[] = [];
        for (const vp of VIEWPOINTS[entry.id] ?? []) {
            const got = await page.evaluate(BUILD_VIEWPOINT(vp)) as any;
            const ok = !!got && !got.error && got.made.length === vp.views.length && got.made.every((m: string) => !m.endsWith(':none'));
            check(`${entry.id}: the viewpoint ${vp.name} has its ${vp.views.length} views`, ok, got);
            if (ok) built.push({ id: got.id, name: got.name });
        }
        check(`${entry.id}: one viewpoint per metamodel`, built.length === src.ecore.length, built.map(v => v.name));
        if (built.length) {
            await page.evaluate(String.raw`(async () => { const lv = await import('/src/utils/lastViewpoint.ts'); lv.activateViewpoint(${JSON.stringify(built[0].id)}); })()`);
            const active = await poll(page, `(() => { const s = window.windoww.store.getState(); return s.viewpoint === ${JSON.stringify(built[0].id)} && s.idlookup[${JSON.stringify(pid)}].activeViewpoint === ${JSON.stringify(built[0].id)}; })()`, 15000);
            check(`${entry.id}: «${built[0].name}» is the active viewpoint`, !!active, '');
            await wait(page, 1500);
        }

        // Each model's editor once, so its layout is in the store the export serializes.
        for (const m of info.models) {
            await page.evaluate(String.raw`(async () => { const dm = await import('/src/components/abstract/DockManager.tsx'); await dm.default.open2(window.LPointerTargetable.fromPointer(${JSON.stringify(m.id)})); })()`);
            const pane = `(document.querySelector('[role="tabpanel"][aria-labelledby$="-tab-${m.id}"]'))`;
            const nodes = await poll<number>(page, `(() => { const p = ${pane}; return p ? p.querySelectorAll('.react-flow__node').length : 0; })()`, 60000);
            check(`${entry.id}: the editor of ${m.name} shows its nodes`, (nodes ?? 0) > 0, String(nodes));
            await wait(page, 3000);
            const place = PLACES[entry.id]?.[m.name];
            if (!place) continue;
            // The first layout of a fresh graph arms a 3 s re-layout (reLayoutWatcher.ts): placed after it.
            await wait(page, 4000);
            const vp = place.viewpoint && built.find(v => v.name === place.viewpoint);
            if (vp) { await page.evaluate(String.raw`(async () => { const lv = await import('/src/utils/lastViewpoint.ts'); lv.activateViewpoint(${JSON.stringify(vp.id)}); })()`); await wait(page, 3000); }
            const got = await page.evaluate(PLACE(m.id, place.at)) as { placed: string[]; missed: string[] };
            check(`${entry.id}: the vertices of ${m.name} are placed${vp ? ` under ${vp.name}` : ''}`, got.missed.length === 0, got);
            await wait(page, 1500);
            const level = page.locator('.toolbar-commands__level').filter({ visible: true });
            if (await level.count()) { await level.first().click(); await wait(page, 1500); }
            if (vp) { await page.evaluate(String.raw`(async () => { const lv = await import('/src/utils/lastViewpoint.ts'); lv.activateViewpoint(${JSON.stringify(built[0].id)}); })()`); await wait(page, 3000); }
        }

        // File → «Download Project»: the app saves the project, then downloads it.
        const download = page.waitForEvent('download', { timeout: 60000 });
        const clicked = await page.evaluate(DOWNLOAD_ENTRY) as boolean;
        check(`${entry.id}: the Download Project entry of the File menu is clicked`, clicked, '');
        if (!clicked) return;
        const file = await download;
        await file.saveAs(out);
        let parsed: Record<string, any> | null = null;
        try { parsed = JSON.parse(readFileSync(out, 'utf8')); } catch { parsed = null; }
        check(`${entry.id}: the download, ${file.suggestedFilename()}, is a project file`,
            !!parsed && typeof parsed.state === 'string' && parsed.state.length > 0 && parsed.name === entry.label,
            `${out} ${statSync(out).size} bytes sha256 ${sha256(out)}`);
        console.log(`MEAS  ${entry.id}  ${JSON.stringify({ metamodels: info.metamodels.map((m: any) => m.name), models: info.models.map((m: any) => `${m.name}:${m.objects}`), viewpoints: built.map(v => v.name) })}`);
        check(`${entry.id}: no page error`, errors.length === 0, errors.slice(0, 3));
    } finally {
        await ctx.close();
    }
}

const browser = await chromium.launch();
for (const id of IDS) {
    const entry = GALLERY.find(e => e.id === id);
    if (!entry) { check(`${id}: is a galleryProject of the catalog`, false, ''); continue; }
    if (entry.tier === 'example') {
        const out = target(entry);
        const from = entry.source?.[0];
        if (!out || !from) continue;
        copyFileSync(REPO(from), out);
        check(`${entry.id}@${entry.version}: copied from ${from}`, sha256(out) === sha256(REPO(from)), `${out} sha256 ${sha256(out)}`);
        continue;
    }
    await build(browser, entry);
}
await browser.close();
console.log(`${failures === 0 ? 'ALL GREEN' : `${failures} FAILED`}  (${DIR})`);
process.exit(failures === 0 ? 0 : 1);
