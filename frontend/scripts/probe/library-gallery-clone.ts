/**
 * library-gallery-clone (P-2026-10-18-1800, slice S2): clones each gallery project from the Templates page, as a user
 * does, and checks the clone against its package file (frontend/public/library/gallery/<id>/<n>.jjodel, the current
 * version: R-LIB-9, P-2026-10-18-2300).
 *
 * For each catalog `galleryProject`, in one browser context (so the names collide as in a real workspace):
 *   - Templates → the card's «Clone to my workspace» → the modal, «Project name» prefilled with the label (the graph
 *     entry types its own name) → «Clone & open»;
 *   - the project that opens: its id differs from the file's, its name is the chosen one with no « copy», the
 *     DProject entry carries `_clonedFrom: <id>@<n>`, its metamodels, models and objects are the file's, and
 *     each model's editor shows its nodes;
 *   - an explicit save, then a reopen from the page load: name and `_clonedFrom` survive.
 * The page shows «Templates» then «Examples», each card with its `<id>@<n>`; the deep links `#/templates/graph@1` (the
 * clone dialog of that version, prefilled) and `#/templates/nope@9` (one line, the page as usual) are screenshot.
 * Then a second Library clone takes «Library (1)», and a package with one user-defined megamodel edge is cloned to
 * measure where the import registers it (projects.ts, `registerSerializedMegamodel(json.id, …)`).
 * The Templates shell is checked against the Projects page's, the dialog at rest (animations ended), and the Quick Tip
 * and the donation banner are closed before each screenshot. Screenshots at 1440×900, light theme, into docs/discovery/assets/library-gallery/.
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

interface Entry { id: string; kind: string; label: string; status: string; tier?: string; version?: number; versions?: Array<{ n: number; file: string }> }
const catalog = JSON.parse(readFileSync(new globalThis.URL('../../../docs/library/catalog.json', import.meta.url), 'utf8')) as { entries: Entry[] };
const GALLERY = catalog.entries.filter(e => e.kind === 'galleryProject' && e.status === 'available');
const refOf = (e: Entry) => `${e.id}@${e.version}`;
const fileOf = (e: Entry) => e.versions!.find(v => v.n === e.version)!.file;
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
    const json = JSON.parse(readFileSync(new globalThis.URL(`../../public/${fileOf(entry)}`, import.meta.url), 'utf8'));
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

/** The Quick Tip and the donation banner cover the page: closed (their own close buttons) before every screenshot,
 *  then the page's animations are let finish, so no popup is caught sliding in. */
async function closeTip(page: Page): Promise<void> {
    // The banner shows 30 s after load (useDonationBanner.ts), so it can arrive after a first pass: three passes.
    for (let pass = 0; pass < 3; pass++) {
        await wait(page, 1500);
        // A DOM click: in the editor the banner sits under the right panel, where a pointer click cannot reach it.
        await page.evaluate(`document.querySelectorAll('.notification-widget.is-tip .notification-close, .donation-banner__close').forEach((b) => b.click())`);
        await poll(page, `!document.querySelector('.notification-widget.is-tip') && !document.querySelector('.donation-banner')`, 5000);
        await poll(page, `document.getAnimations().every((a) => a.playState !== 'running' || a.effect?.getTiming().iterations === Infinity)`, 5000);
    }
    meas('before the screenshot', await page.evaluate(`({ mode: localStorage.getItem('jjodel.interfaceMode'), toggle: [...document.querySelectorAll('button')].filter((b) => /^(Basic|Advanced)$/.test((b.textContent || '').trim())).map((b) => b.textContent.trim() + ':' + b.className + ':' + b.getAttribute('aria-pressed')).join(' | '), popups: document.querySelectorAll('.notification-widget.is-tip, .donation-banner').length })`));
}

/** Where the title row and the content below it start, and the shell's padding: the Projects page is the reference. */
const SHELL = String.raw`(() => {
  const t = document.querySelector('.dashboard-page-title'), row = document.querySelector('.dashboard-cta-row'), main = document.querySelector('.dashboard-main-content'), dash = document.querySelector('.dash-content');
  if (!t || !row || !main || !dash || !row.nextElementSibling) return null;
  const r = (e) => { const b = e.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top)]; };
  return { title: r(t), content: r(row.nextElementSibling), mainPadding: getComputedStyle(main).padding, dash: dash.className.replace(/\s+/g, ' ').trim(), dashBg: getComputedStyle(dash).backgroundColor };
})()`;

async function openTemplates(page: Page, id: string, hash = '#/templates'): Promise<boolean> {
    await page.goto(`${URL}/${hash}`, { waitUntil: 'domcontentloaded', timeout: 300000 });
    const card = `document.querySelector('[data-gallery-id="${id}"]')`;
    const ready = await poll(page, `(() => { const c = ${card}; const t = c && c.querySelector('.templates-card__counts'); return !!(t && /metamodel/.test(t.textContent)); })()`, 120000);
    return !!ready;
}

/** Templates → card → modal → «Clone & open»; returns the name in the modal and the id of the project that opens. */
async function cloneFromTemplates(page: Page, entry: Entry, typed?: string, shot?: string): Promise<{ prefilled: string; chosen: string; info: any } | null> {
    if (!(await openTemplates(page, entry.id))) { check(`${entry.id}: the Templates card shows its counts`, false, ''); return null; }
    if (shot) {
        await closeTip(page);
        const shell = await page.evaluate(SHELL) as any;
        meas('Templates shell', shell);
        check('Templates: title and content start where the Projects page\'s do, same padding',
            !!shell && !!projectsShell && JSON.stringify(shell.title) === JSON.stringify(projectsShell.title)
            && JSON.stringify(shell.content) === JSON.stringify(projectsShell.content) && shell.mainPadding === projectsShell.mainPadding,
            { templates: shell && [shell.title, shell.content], projects: projectsShell && [projectsShell.title, projectsShell.content] });
        const sections = await page.evaluate(`[...document.querySelectorAll('.templates-section')].map((s) => ({ tier: s.dataset.galleryTier, title: s.querySelector('.templates-section__title').textContent, cards: [...s.querySelectorAll('.templates-card')].map((c) => c.dataset.galleryId + ' ' + c.querySelector('.templates-card__ref').textContent) }))`) as any[];
        const want = ['template', 'example'].map(t => ({ tier: t, title: t === 'template' ? 'Templates' : 'Examples', cards: GALLERY.filter(e => e.tier === t).map(e => `${e.id} ${refOf(e)}`) }));
        check('Templates: «Templates» then «Examples», cards in catalog order, each with its <id>@<n>', JSON.stringify(sections) === JSON.stringify(want), sections);
        await page.screenshot({ path: `${SHOTS}/${shot}-page.png` });
    }
    await page.locator(`[data-gallery-id="${entry.id}"] button`, { hasText: 'Clone to my workspace' }).click();
    const input = page.locator('#templates-clone-name');
    await input.waitFor({ timeout: 10000 });
    const prefilled = await input.inputValue();
    if (typed) await input.fill(typed);
    const chosen = typed ?? prefilled;
    if (shot) {
        await closeTip(page);
        // The dialog slides up in 200 ms (create-project-dialog.scss): the screenshot waits for its animations to end.
        const dlg = await poll<any>(page, String.raw`(() => {
          const d = document.querySelector('.templates-clone-dialog'), o = document.querySelector('.dialog-overlay');
          if (!d || !o || ![...d.getAnimations(), ...o.getAnimations()].every((a) => a.playState === 'finished')) return null;
          const cs = getComputedStyle(d), b = d.getBoundingClientRect();
          const top = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
          return { opacity: cs.opacity, zIndex: cs.zIndex, background: cs.backgroundColor, overlayZ: getComputedStyle(o).zIndex, onTop: !!top && d.contains(top), value: document.querySelector('#templates-clone-name').value };
        })()`, 10000);
        meas('clone dialog at rest', dlg);
        check('the clone dialog is opaque, white, above the overlay, prefilled', !!dlg && dlg.opacity === '1' && dlg.background === 'rgb(255, 255, 255)'
            && Number(dlg.zIndex) > Number(dlg.overlayZ) && dlg.onTop && dlg.value === chosen, dlg);
        await page.screenshot({ path: `${SHOTS}/${shot}-modal.png` });
    }
    const before = await page.evaluate(`JSON.parse(localStorage.getItem('projects') || '[]').map((r) => r.id)`) as string[];
    await page.locator('.templates-clone-dialog button[type="submit"]').click();
    await page.waitForURL(/project\?id=/, { timeout: 60000 }).catch(() => undefined);
    await page.waitForLoadState('domcontentloaded');
    await wait(page, 3000);
    const info = await poll<any>(page, `(async () => { if (!location.hash.includes('project?id=')) return null; const i = await ${INFO}; return i && !${JSON.stringify(before)}.includes(i.id) && i.models.length > 0 && document.querySelector('.dock-tab') ? i : null; })()`, 120000);
    return info ? { prefilled, chosen, info } : null;
}

let projectsShell: any = null;
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
    projectsShell = await poll<any>(page, SHELL, 30000);
    meas('Projects shell (reference)', projectsShell);
    await closeTip(page);
    await page.screenshot({ path: `${SHOTS}/projects-page.png` });

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
        check(`${entry.id}: _clonedFrom is ${refOf(entry)}`, info.clonedFrom === refOf(entry), String(info.clonedFrom));
        check(`${entry.id}: the metamodels are the file's`, JSON.stringify(info.metamodels) === JSON.stringify(exp.metamodels), info.metamodels);
        const counts = Object.fromEntries(info.models.map((m: any) => [m.name, m.objects]));
        check(`${entry.id}: the models and their objects are the file's`, JSON.stringify(counts) === JSON.stringify(exp.models), { clone: counts, file: exp.models });

        for (const m of info.models) {
            await page.evaluate(String.raw`(async () => { const dm = await import('/src/components/abstract/DockManager.tsx'); await dm.default.open2(window.LPointerTargetable.fromPointer(${JSON.stringify(m.id)})); })()`);
            const pane = `(document.querySelector('[role="tabpanel"][aria-labelledby$="-tab-${m.id}"]'))`;
            const nodes = await poll<number>(page, `(() => { const p = ${pane}; const n = p ? p.querySelectorAll('.react-flow__node').length : 0; return n > 0 ? n : 0; })()`, 60000);
            check(`${entry.id}: the editor of ${m.name} shows its nodes`, (nodes ?? 0) > 0, `${nodes} nodes, ${m.objects} objects`);
            await wait(page, 1500);
            await closeTip(page);
            await page.screenshot({ path: `${SHOTS}/${entry.id}${info.models.length > 1 ? '-' + m.name : ''}.png` });
        }

        await page.evaluate(SAVE);
        await page.goto(`${URL}/?open=${encodeURIComponent(info.id)}#/project?id=${info.id}`, { waitUntil: 'domcontentloaded', timeout: 300000 });
        const reopened = await poll<any>(page, `(async () => { const i = await ${INFO}; return i && i.id === ${JSON.stringify(info.id)} && i.models.length > 0 && document.querySelector('.dock-tab') ? i : null; })()`, 120000);
        check(`${entry.id}: after save and reopen, name and _clonedFrom survive`,
            !!reopened && reopened.name === got.chosen && reopened.clonedFrom === refOf(entry), reopened ? { name: reopened.name, clonedFrom: reopened.clonedFrom } : null);
        if (reopened) {
            const again = Object.fromEntries(reopened.models.map((m: any) => [m.name, m.objects]));
            check(`${entry.id}: after reopen, the models and objects are the file's`, JSON.stringify(again) === JSON.stringify(exp.models), again);
        }
    }

    // The deep links: a version's clone dialog, prefilled; an unknown reference, one line and the page as usual.
    const graph = GALLERY.find(e => e.id === 'graph')!;
    await openTemplates(page, 'graph', '#/templates/graph@1');
    const deep = await poll<any>(page, `(() => { const i = document.querySelector('#templates-clone-name'); const h = document.querySelector('.templates-clone-dialog h2'); return i && h ? { value: i.value, title: h.textContent } : null; })()`, 15000);
    check('#/templates/graph@1: the clone dialog of graph@1 is open, prefilled with the label', !!deep && deep.value === graph.label && /graph@1/.test(deep.title), deep);
    await closeTip(page);
    await page.screenshot({ path: `${SHOTS}/templates-deeplink-graph-1.png` });
    await openTemplates(page, 'graph', '#/templates/nope@9');
    const nope = await page.evaluate(`({ notice: [...document.querySelectorAll('.templates-page__notice')].map((p) => p.textContent), dialog: !!document.querySelector('.templates-clone-dialog'), cards: document.querySelectorAll('.templates-card').length, firstSection: (document.querySelector('.templates-page__notice') || {}).nextElementSibling?.className })`) as any;
    check('#/templates/nope@9: one line «No gallery entry nope@9.» above the sections, no dialog, every card', JSON.stringify(nope.notice) === JSON.stringify(['No gallery entry nope@9.']) && !nope.dialog && nope.cards === GALLERY.length && nope.firstSection === 'templates-section', nope);
    await closeTip(page);
    await page.screenshot({ path: `${SHOTS}/templates-deeplink-nope-9.png` });

    // A second clone of the same entry, with the prefilled label: the (1) convention.
    const lib = GALLERY.find(e => e.id === 'library')!;
    const second = await cloneFromTemplates(page, lib);
    check('library again: the second clone is named «Library (1)»', !!second && second.info.name === 'Library (1)' && second.info.recordName === 'Library (1)', second ? second.info.name : null);

    // The megamodel registration of the import (projects.ts, before duplicateProject): one user-defined edge.
    const mega = await page.evaluate(String.raw`(async () => {
      const api = await import('/src/api/persistance/projects.ts');
      const mp = await import('/src/model/megamodelPersistence.ts');
      const json = JSON.parse(await (await fetch('/library/gallery/families-persons/1.jjodel')).text());
      const [a, b] = json.metamodels;
      json.megamodel = { megamodelVersion: '1.0', edges: [{ id: 'probe-edge', source: { id: a, kind: 'metamodel' }, target: { id: b, kind: 'metamodel' }, type: 'transformsTo', origin: 'user-defined' }] };
      const id = await api.ProjectsApi.importFromText(JSON.stringify(json), 'Megamodel probe', Date.now(), { clonedFrom: 'families-persons@1' });
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
