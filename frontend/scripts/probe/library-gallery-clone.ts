/**
 * library-gallery-clone (P-2026-10-18-1800, slice S2): clones each gallery project from the Templates page, as a user
 * does, and checks the clone against its package file (frontend/public/library/gallery/<id>.jjodel).
 *
 * For each catalog `galleryProject`, in one browser context (so the names collide as in a real workspace):
 *   - Templates → the card's «Clone to my workspace» → the modal, «Project name» prefilled with the label (the graph
 *     entry types its own name) → «Clone & open»;
 *   - the project that opens: its id differs from the file's, its name is the chosen one with no « copy», the
 *     DProject entry carries `_clonedFrom: <catalog id>`, its metamodels, models and objects are the file's, and
 *     each model's default editor shows one node per object;
 *   - an explicit save, then a reopen from the page load: name and `_clonedFrom` survive.
 * Then a second Library clone takes «Library (1)», and a package with one user-defined megamodel edge is cloned to
 * measure where the import registers it (projects.ts, `registerSerializedMegamodel(json.id, …)`).
 * Screenshots at 1440×900, light theme, into docs/discovery/assets/library-gallery/.
 *
 * Run:  ~/.local/bin/node frontend/scripts/lane-run.mjs probe <worktree> frontend/scripts/probe/library-gallery-clone.ts \
 *         --port 3098 --id P-2026-10-18-1800
 */
import { chromium, type Page } from '@playwright/test';
import { mkdirSync, readFileSync } from 'node:fs';
import lz from 'async-lz-string';
import { seed } from '../smoke/states.ts';

const URL = (process.env.PROBE_URL || 'http://localhost:3098/').replace(/\/$/, '');
if (/:(3000|3001|3003)$/.test(URL)) throw new Error('never 3000, 3001 or 3003');
const SHOTS = new globalThis.URL('../../../docs/discovery/assets/library-gallery', import.meta.url).pathname;
mkdirSync(SHOTS, { recursive: true });

interface Entry { id: string; kind: string; label: string; status: string; package?: string }
const catalog = JSON.parse(readFileSync(new globalThis.URL('../../../docs/library/catalog.json', import.meta.url), 'utf8')) as { entries: Entry[] };
const GALLERY = catalog.entries.filter(e => e.kind === 'galleryProject' && e.status === 'available');
/** The entry whose clone gets a name typed by the user, not the prefilled label. */
const TYPED: Record<string, string> = { graph: 'My Graph' };

let failures = 0;
const check = (label: string, ok: boolean, detail: unknown) => {
    if (!ok) failures++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}  ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`);
};
const meas = (label: string, detail: unknown) => console.log(`MEAS  ${label}  ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`);
const wait = (page: Page, ms: number) => page.waitForTimeout(ms);

async function poll<T>(page: Page, expr: string, ms: number): Promise<T | null> {
    const end = Date.now() + ms;
    while (Date.now() < end) {
        // Bounded: an evaluate begun while the clone's full reload tears the page down can hang past any deadline.
        const v = await Promise.race([page.evaluate(expr).catch(() => null), new Promise(r => setTimeout(() => r(null), 5000))]) as T | null;
        if (v) return v;
        await wait(page, 250);
    }
    return null;
}

/** The file's own project: id, metamodel names, and each model by name with its number of objects. */
async function expected(entry: Entry) {
    const json = JSON.parse(readFileSync(new globalThis.URL(`../../public/${entry.package}`, import.meta.url), 'utf8'));
    const lk = JSON.parse(await lz.decompressFromUTF16(json.state)).idlookup as Record<string, any>;
    const under = (id: string, root: string) => { let d = lk[lk[id]?.father]; for (let i = 0; d && i < 60; i++) { if (d.id === root) return true; d = lk[d.father]; } return false; };
    const objs = Object.values(lk).filter((d: any) => d?.className === 'DObject') as any[];
    return {
        id: json.id as string,
        metamodels: (json.metamodels as string[]).map(i => lk[i].name).sort(),
        models: Object.fromEntries((json.models as string[]).map(i => [lk[i].name, objs.filter(o => under(o.id, i)).length])) as Record<string, number>,
    };
}

// ── Page side (plain strings: no transform) ─────────────────────────────────────────────────────

const INFO = String.raw`(async () => {
  try {
    const j = await import('/src/joiner/index.ts');
    const lk = window.windoww.store.getState().idlookup;
    const p = j.L.fromPointer(j.DUser.current).project;
    if (!p) return null;
    const under = (id, root) => { let d = lk[lk[id] && lk[id].father]; for (let i = 0; d && i < 60; i++) { if (d.id === root) return true; d = lk[d.father]; } return false; };
    const objs = Object.values(lk).filter((d) => d && d.className === 'DObject');
    const rec = JSON.parse(localStorage.getItem('projects') || '[]').find((r) => r.id === p.id);
    return {
      id: p.id, name: p.name, clonedFrom: (lk[p.id] || {})._clonedFrom ?? null, recordName: rec ? rec.name : null,
      metamodels: (p.metamodels || []).map((m) => m.name).sort(),
      models: (p.models || []).filter((m) => !m.isMetamodel).map((m) => ({ id: m.id, name: m.name, objects: objs.filter((o) => under(o.id, m.id)).length })),
    };
  } catch (e) { return null; }
})()`;

const SAVE = String.raw`(async () => {
  const j = await import('/src/joiner/index.ts');
  const api = await import('/src/api/persistance/projects.ts');
  await api.ProjectsApi.save(j.L.fromPointer(j.DUser.current).project);
  await new Promise((r) => setTimeout(r, 800));
  return true;
})()`;

async function openTemplates(page: Page, id: string): Promise<boolean> {
    await page.goto(`${URL}/#/templates`, { waitUntil: 'domcontentloaded', timeout: 300000 });
    const card = `document.querySelector('[data-gallery-id="${id}"]')`;
    const ready = await poll(page, `(() => { const c = ${card}; const t = c && c.querySelector('.templates-card__counts'); return !!(t && /metamodel/.test(t.textContent)); })()`, 120000);
    return !!ready;
}

/** Templates → card → modal → «Clone & open»; returns the name in the modal and the id of the project that opens. */
async function cloneFromTemplates(page: Page, entry: Entry, typed?: string, shot?: string): Promise<{ prefilled: string; chosen: string; info: any } | null> {
    if (!(await openTemplates(page, entry.id))) { check(`${entry.id}: the Templates card shows its counts`, false, ''); return null; }
    if (shot) await page.screenshot({ path: `${SHOTS}/${shot}-page.png` });
    await page.locator(`[data-gallery-id="${entry.id}"] button`, { hasText: 'Clone to my workspace' }).click();
    const input = page.locator('#templates-clone-name');
    await input.waitFor({ timeout: 10000 });
    const prefilled = await input.inputValue();
    if (typed) await input.fill(typed);
    const chosen = typed ?? prefilled;
    if (shot) await page.screenshot({ path: `${SHOTS}/${shot}-modal.png` });
    const before = await page.evaluate(`JSON.parse(localStorage.getItem('projects') || '[]').map((r) => r.id)`) as string[];
    await page.locator('.templates-clone-dialog button[type="submit"]').click();
    await page.waitForURL(/project\?id=/, { timeout: 60000 }).catch(() => undefined);
    await page.waitForLoadState('domcontentloaded');
    await wait(page, 3000);
    const info = await poll<any>(page, `(async () => { if (!location.hash.includes('project?id=')) return null; const i = await ${INFO}; return i && !${JSON.stringify(before)}.includes(i.id) && i.models.length > 0 && document.querySelector('.dock-tab') ? i : null; })()`, 120000);
    return info ? { prefilled, chosen, info } : null;
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addInitScript(() => { (globalThis as any).__name = (f: any) => f; });
await seed(ctx, true);
const page = await ctx.newPage();
const errors: string[] = [];
page.on('pageerror', (e: Error) => errors.push('pageerror: ' + e.message));
try {
    await page.goto(`${URL}/#/allProjects`, { waitUntil: 'domcontentloaded', timeout: 300000 });
    await poll(page, `!!(window.windoww && window.windoww.store && window.LPointerTargetable)`, 120000);
    await wait(page, 2000);

    for (const entry of GALLERY) {
        const exp = await expected(entry);
        const shot = entry.id === 'library' ? 'templates' : undefined;
        const got = await cloneFromTemplates(page, entry, TYPED[entry.id], shot);
        check(`${entry.id}: «Clone & open» opens a new project`, !!got, '');
        if (!got) continue;
        const { info } = got;
        check(`${entry.id}: the modal is prefilled with the label`, got.prefilled === entry.label, got.prefilled);
        check(`${entry.id}: the new id differs from the file's`, info.id !== exp.id, `${info.id} vs ${exp.id}`);
        check(`${entry.id}: the name is the chosen one, in the store and the stored record`, info.name === got.chosen && info.recordName === got.chosen, { store: info.name, record: info.recordName, chosen: got.chosen });
        check(`${entry.id}: _clonedFrom is the catalog id`, info.clonedFrom === entry.id, String(info.clonedFrom));
        check(`${entry.id}: the metamodels are the file's`, JSON.stringify(info.metamodels) === JSON.stringify(exp.metamodels), info.metamodels);
        const counts = Object.fromEntries(info.models.map((m: any) => [m.name, m.objects]));
        check(`${entry.id}: the models and their objects are the file's`, JSON.stringify(counts) === JSON.stringify(exp.models), { clone: counts, file: exp.models });

        for (const m of info.models) {
            await page.evaluate(String.raw`(async () => { const dm = await import('/src/components/abstract/DockManager.tsx'); await dm.default.open2(window.LPointerTargetable.fromPointer(${JSON.stringify(m.id)})); })()`);
            const pane = `(document.querySelector('[role="tabpanel"][aria-labelledby$="-tab-${m.id}"]'))`;
            const nodes = await poll<number>(page, `(() => { const p = ${pane}; const n = p ? p.querySelectorAll('.react-flow__node').length : 0; return n >= ${m.objects} ? n : 0; })()`, 60000);
            check(`${entry.id}: the default editor of ${m.name} shows one node per object`, nodes === m.objects, `${nodes} nodes, ${m.objects} objects`);
            await wait(page, 1500);
        }
        if (entry.id === 'familiesPersons') await page.screenshot({ path: `${SHOTS}/cloned-familiesPersons.png` });

        await page.evaluate(SAVE);
        await page.goto(`${URL}/?open=${encodeURIComponent(info.id)}#/project?id=${info.id}`, { waitUntil: 'domcontentloaded', timeout: 300000 });
        const reopened = await poll<any>(page, `(async () => { const i = await ${INFO}; return i && i.id === ${JSON.stringify(info.id)} && i.models.length > 0 && document.querySelector('.dock-tab') ? i : null; })()`, 120000);
        check(`${entry.id}: after save and reopen, name and _clonedFrom survive`,
            !!reopened && reopened.name === got.chosen && reopened.clonedFrom === entry.id, reopened ? { name: reopened.name, clonedFrom: reopened.clonedFrom } : null);
        if (reopened) {
            const again = Object.fromEntries(reopened.models.map((m: any) => [m.name, m.objects]));
            check(`${entry.id}: after reopen, the models and objects are the file's`, JSON.stringify(again) === JSON.stringify(exp.models), again);
        }
    }

    // A second clone of the same entry, with the prefilled label: the (1) convention.
    const lib = GALLERY.find(e => e.id === 'library')!;
    const second = await cloneFromTemplates(page, lib);
    check('library again: the second clone is named «Library (1)»', !!second && second.info.name === 'Library (1)' && second.info.recordName === 'Library (1)', second ? second.info.name : null);

    // The megamodel registration of the import (projects.ts, before duplicateProject): one user-defined edge.
    const mega = await page.evaluate(String.raw`(async () => {
      const api = await import('/src/api/persistance/projects.ts');
      const mp = await import('/src/model/megamodelPersistence.ts');
      const json = JSON.parse(await (await fetch('/library/gallery/familiesPersons.jjodel')).text());
      const [a, b] = json.metamodels;
      json.megamodel = { megamodelVersion: '1.0', edges: [{ id: 'probe-edge', source: { id: a, kind: 'metamodel' }, target: { id: b, kind: 'metamodel' }, type: 'transformsTo', origin: 'user-defined' }] };
      const id = await api.ProjectsApi.importFromText(JSON.stringify(json), 'Megamodel probe', Date.now(), { clonedFrom: 'familiesPersons' });
      const atNew = mp.getSerializedMegamodel(id);
      const atOld = mp.getSerializedMegamodel(json.id);
      return { newId: id, oldId: json.id, atNew: atNew ? atNew.edges.length : null, atOld: atOld ? atOld.edges.length : null };
    })()`) as any;
    meas('megamodel registration of an imported user-defined edge', mega);

    check('no page error', errors.length === 0, errors.slice(0, 3));
} finally {
    await ctx.close();
    await browser.close();
}
console.log(`${failures === 0 ? 'ALL GREEN' : `${failures} FAILED`}`);
process.exit(failures === 0 ? 0 : 1);
