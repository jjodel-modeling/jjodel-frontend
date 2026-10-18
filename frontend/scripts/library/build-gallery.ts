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
 *   - each model's editor is opened once, so its layout is in the store the export serializes, and it must show nodes;
 *   - Navbar's File → «Download Project» is clicked, and the browser's download is the file.
 * No viewpoint is added: the projects render with the default syntax (R-IRN-15).
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

async function build(browser: Browser, entry: Entry): Promise<void> {
    const src = SOURCES[entry.id];
    if (!src) { check(`${entry.id}: has sources`, false, 'no SOURCES row'); return; }
    const out = target(entry);
    if (!out) return;
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
        await file.saveAs(out);
        let parsed: Record<string, any> | null = null;
        try { parsed = JSON.parse(readFileSync(out, 'utf8')); } catch { parsed = null; }
        check(`${entry.id}: the download, ${file.suggestedFilename()}, is a project file`,
            !!parsed && typeof parsed.state === 'string' && parsed.state.length > 0 && parsed.name === entry.label,
            `${out} ${statSync(out).size} bytes sha256 ${sha256(out)}`);
        console.log(`MEAS  ${entry.id}  ${JSON.stringify({ metamodels: info.metamodels.map((m: any) => m.name), models: info.models.map((m: any) => `${m.name}:${m.objects}`) })}`);
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
