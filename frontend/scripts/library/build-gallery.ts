/**
 * build-gallery (P-2026-10-18-1800, slice S1): builds the five gallery projects of R-LIB-5 in a running app and saves
 * them as the project files the Templates page clones, frontend/public/library/gallery/<id>.jjodel.
 *
 * The files are written by the app's own importers and export, not by hand. For each catalog entry of kind
 * `galleryProject` (docs/library/catalog.json), in a fresh browser context (so the store holds that project alone):
 *   - a project named as the catalog label is created through the dashboard's New Project;
 *   - its metamodels are imported through the project page's `.ecore` input, then its models through the `.xmi` input
 *     (EcoreService.importFromFile, XMIService.importM1FromFile: the XMI resolves its metamodel by nsURI or by
 *     EPackage name, so the metamodels go first);
 *   - the viewpoints of DERIVE are derived by the app's «Derive viewpoint» path (`createDerivedViewpoint`,
 *     utils/deriveViewpoint.ts, with the table of its dialog: `dialogPrefill`, notations.ts), and the first one is made
 *     the active viewpoint (`activateViewpoint`, utils/lastViewpoint.ts: `project.activeViewpoint` and the root
 *     `viewpoint`, both in the exported store) (P-2026-10-18-2150, slice S1b);
 *   - each model's editor is opened once, so its layout is in the store the export serializes, and it must show nodes;
 *   - Navbar's File → «Download Project» is clicked, and the browser's download is the file.
 *
 * Sources: frontend/scripts/library/gallery/ (the fixtures of src/__tests__/fixtures/xmi-m1/ copied, plus the
 * Families, Persons and Library metamodels and the Library, Graph and Shapes sample models written for the gallery).
 *
 * Run:  ~/.local/bin/node frontend/scripts/lane-run.mjs probe <worktree> frontend/scripts/library/build-gallery.ts \
 *         --port 3097 --id P-2026-10-18-1800
 * Env:  GAL_ID   one catalog id (default: every galleryProject)
 *       GAL_DIR  the output folder (default frontend/public/library/gallery)
 */
import { chromium, type Browser, type Page } from '@playwright/test';
import { mkdirSync, readFileSync, statSync } from 'node:fs';
import { seed } from '../smoke/states.ts';

const URL = (process.env.PROBE_URL || 'http://localhost:3097/').replace(/\/$/, '');
if (/:(3000|3001|3003)$/.test(URL)) throw new Error('never 3000, 3001 or 3003');
const DIR = process.env.GAL_DIR || new globalThis.URL('../../public/library/gallery', import.meta.url).pathname;
const SRC = (file: string) => new globalThis.URL(`./gallery/${file}`, import.meta.url).pathname;
mkdirSync(DIR, { recursive: true });

interface Entry { id: string; kind: string; label: string }
const catalog = JSON.parse(readFileSync(new globalThis.URL('../../../docs/library/catalog.json', import.meta.url), 'utf8')) as { entries: Entry[] };
const GALLERY = catalog.entries.filter(e => e.kind === 'galleryProject');

/** The sources of each project, in import order: metamodels first, then the models that instantiate them. */
const SOURCES: Record<string, { ecore: string[]; xmi: string[] }> = {
    library: { ecore: ['Library.ecore'], xmi: ['sample-Library.xmi'] },
    familiesPersons: { ecore: ['Families.ecore', 'Persons.ecore'], xmi: ['sample-Families.xmi', 'sample-Persons.xmi'] },
    stateMachineEcore: { ecore: ['StateMachine.ecore'], xmi: ['sample-StateMachine.xmi'] },
    graph: { ecore: ['Graph.ecore'], xmi: ['sample-Graph.xmi'] },
    shapes: { ecore: ['Shapes.ecore'], xmi: ['sample-Shapes.xmi'] },
};
/**
 * The derived viewpoints of each project (S1b), in derivation order; the first is the active one. `fallback` completes
 * the class roles, by class name, only when `canDerive` refuses the dialog's prefill on the metamodel.
 */
interface Derive { metamodel: string; notation: string; fallback?: Record<string, string> }
const DERIVE: Record<string, Derive[]> = {
    library: [{ metamodel: 'Library', notation: 'generic' }],
    familiesPersons: [{ metamodel: 'Families', notation: 'generic' }, { metamodel: 'Persons', notation: 'generic' }],
    stateMachineEcore: [
        { metamodel: 'statemachine', notation: 'statechart', fallback: { State: 'node', Transition: 'transition' } },
        { metamodel: 'statemachine', notation: 'generic' },
    ],
    graph: [{ metamodel: 'Graph', notation: 'generic' }],
    shapes: [{ metamodel: 'Shapes', notation: 'generic' }],
};
const IDS = process.env.GAL_ID ? [process.env.GAL_ID] : GALLERY.map(e => e.id);

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

/** Derives one viewpoint as the dialog's confirm does: the notation picked, its prefilled table (completed by `fallback`). */
const DERIVE_ONE = (d: Derive) => String.raw`(async () => {
  const dv = await import('/src/utils/deriveViewpoint.ts');
  const nt = await import('/src/components/editor-v2/viewpoint/derive/notations.ts');
  const d = ${JSON.stringify(d)};
  const lk = window.windoww.store.getState().idlookup;
  const mm = Object.values(lk).find((x) => x && x.className === 'DModel' && x.isMetamodel && x.name === d.metamodel);
  if (!mm) return { error: 'no metamodel ' + d.metamodel };
  const prefill = nt.dialogPrefill(lk, mm.id, d.notation, dv.projectViewpointIds());
  let roles = { ...prefill.roles }, completed = false;
  if (!nt.canDerive({ notation: d.notation, classRoles: roles }) && d.fallback) {
    const under = (x) => { for (let i = 0; x && i < 60; i++) { if (x.father === mm.id) return true; x = lk[x.father]; } return false; };
    for (const c of Object.values(lk)) if (c && c.className === 'DClass' && under(c) && d.fallback[c.name]) roles[c.id] = d.fallback[c.name];
    completed = true;
  }
  const vp = dv.createDerivedViewpoint(mm.id, { notation: d.notation, classRoles: roles });
  if (!vp) return { error: 'nothing derived' };
  const named = Object.fromEntries(Object.entries(roles).map(([k, v]) => [(lk[k] || {}).name || k, v]));
  return { id: vp.id, name: vp.name, prefill: prefill.from, completed, roles: named };
})()`;

async function build(browser: Browser, entry: Entry): Promise<void> {
    const src = SOURCES[entry.id];
    if (!src) { check(`${entry.id}: has sources`, false, 'no SOURCES row'); return; }
    const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, acceptDownloads: true });
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
            await page.locator('input[type="file"][accept=".ecore"]').setInputFiles(SRC(file));
            const got = await poll(page, `(async () => { const i = await ${INFO}; return i && i.metamodels.length >= ${i + 1} ? i : null; })()`, 30000);
            check(`${entry.id}: the metamodel ${file} is imported`, !!got, got ? (got as any).metamodels.map((m: any) => m.name) : '');
            await page.keyboard.press('Escape');
            await wait(page, 1500);
        }
        for (const [i, file] of src.xmi.entries()) {
            await page.locator('input[type="file"][accept=".xmi,.xml"]').setInputFiles(SRC(file));
            const got = await poll(page, `(async () => { const i = await ${INFO}; return i && i.models.length >= ${i + 1} ? i : null; })()`, 30000);
            check(`${entry.id}: the model ${file} is imported`, !!got, got ? (got as any).models : '');
            await page.keyboard.press('Escape');
            await wait(page, 1500);
        }
        const info = await page.evaluate(INFO) as any;
        check(`${entry.id}: ${src.ecore.length} metamodel(s) and ${src.xmi.length} model(s) in the project`,
            info.metamodels.length === src.ecore.length && info.models.length === src.xmi.length, { metamodels: info.metamodels.map((m: any) => m.name), models: info.models });
        check(`${entry.id}: every model has objects`, info.models.every((m: any) => m.objects > 0), info.models.map((m: any) => `${m.name}:${m.objects}`));

        // The derived viewpoints (S1b), then the first made active, before the editors open: their layout is the active one's.
        const derived: { id: string; name: string }[] = [];
        for (const d of DERIVE[entry.id] ?? []) {
            const got = await page.evaluate(DERIVE_ONE(d)) as any;
            const ok = !!got && !got.error && !!(await poll(page, `(() => { const v = window.windoww.store.getState().idlookup[${JSON.stringify(got?.id ?? '')}]; return !!(v && v._state && v._state.derivedNotation === ${JSON.stringify(d.notation)}); })()`, 15000));
            check(`${entry.id}: the ${d.notation} viewpoint of ${d.metamodel} is derived`, ok, got);
            if (ok) derived.push({ id: got.id, name: got.name });
            await page.keyboard.press('Escape');
            await wait(page, 1500);
        }
        if (derived.length) {
            await page.evaluate(String.raw`(async () => { const lv = await import('/src/utils/lastViewpoint.ts'); lv.activateViewpoint(${JSON.stringify(derived[0].id)}); })()`);
            const active = await poll(page, `(() => { const s = window.windoww.store.getState(); return s.viewpoint === ${JSON.stringify(derived[0].id)} && s.idlookup[${JSON.stringify(pid)}].activeViewpoint === ${JSON.stringify(derived[0].id)}; })()`, 15000);
            check(`${entry.id}: «${derived[0].name}» is the active viewpoint`, !!active, '');
            await wait(page, 1500);
        }

        // Each model's editor once, so its layout is in the store the export serializes.
        for (const m of info.models) {
            await page.evaluate(String.raw`(async () => { const dm = await import('/src/components/abstract/DockManager.tsx'); await dm.default.open2(window.LPointerTargetable.fromPointer(${JSON.stringify(m.id)})); })()`);
            const pane = `(document.querySelector('[role="tabpanel"][aria-labelledby$="-tab-${m.id}"]'))`;
            const nodes = await poll<number>(page, `(() => { const p = ${pane}; return p ? p.querySelectorAll('.react-flow__node').length : 0; })()`, 60000);
            check(`${entry.id}: the editor of ${m.name} shows its nodes`, (nodes ?? 0) > 0, String(nodes));
            await wait(page, 3000);
        }

        // File → «Download Project»: the app saves the project, then downloads it.
        const download = page.waitForEvent('download', { timeout: 60000 });
        const clicked = await page.evaluate(DOWNLOAD_ENTRY) as boolean;
        check(`${entry.id}: the Download Project entry of the File menu is clicked`, clicked, '');
        if (!clicked) return;
        const file = await download;
        const out = `${DIR}/${entry.id}.jjodel`;
        await file.saveAs(out);
        let parsed: Record<string, any> | null = null;
        try { parsed = JSON.parse(readFileSync(out, 'utf8')); } catch { parsed = null; }
        check(`${entry.id}: the download, ${file.suggestedFilename()}, is a project file`,
            !!parsed && typeof parsed.state === 'string' && parsed.state.length > 0 && parsed.name === entry.label,
            `${out} ${statSync(out).size} bytes`);
        console.log(`MEAS  ${entry.id}  ${JSON.stringify({ metamodels: info.metamodels.map((m: any) => m.name), models: info.models.map((m: any) => `${m.name}:${m.objects}`), viewpoints: derived.map(v => v.name) })}`);
        check(`${entry.id}: no page error`, errors.length === 0, errors.slice(0, 3));
    } finally {
        await ctx.close();
    }
}

const browser = await chromium.launch();
for (const id of IDS) {
    const entry = GALLERY.find(e => e.id === id);
    if (!entry) { check(`${id}: is a galleryProject of the catalog`, false, ''); continue; }
    await build(browser, entry);
}
await browser.close();
console.log(`${failures === 0 ? 'ALL GREEN' : `${failures} FAILED`}  (${DIR})`);
process.exit(failures === 0 ? 0 : 1);
