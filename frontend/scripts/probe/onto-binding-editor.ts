/**
 * onto-binding-editor (P-2026-11-08-0113): acceptance of lane B of the «Instances of» front, the binding editor
 * (`components/editor-v2/onto/OntoBindingModal.tsx`, `model/ontological/bindingDetect.ts`), opened from the
 * «Ontological binding…» row of the metamodel's «Semantic type class» section (Info.tsx, Advanced only).
 *
 * Scene: the UML library project, imported from `uml-s3b/uml-class-object.jjodel` (no `ontoBindings` in its bag),
 * the object diagram viewpoint on the model tab, light theme; the editor is driven on the metamodel tab.
 *
 * Checks:
 *   B-0  the bag has no `ontoBindings`; the row reads «none»;
 *   B-1  the row sits in «Semantic type class» in Advanced, and opens the dialog;
 *   B-2  Detect fills both records, every row found, none missing, no defect;
 *   B-3  a row corrected by hand shows its defect message; Detect again clears it;
 *   B-4  Confirm: the bag decodes and equals the probe table (onto-s2-instantiate.ts, the console setup), `link` with
 *        the four slot roles and `object`'s valueKinds (question 3); +1 undo entry;
 *   B-5  one Cmd+Z restores the previous bag, the key measured (gone, or kept with which value); a Cmd+Z that leaves a
 *        defective bag is a HARD STOP of the lane;
 *   B-6  declared again, the pane menu of the object diagram cascades to the same options as the console setup;
 *   B-7  Remove writes {"v":1,"bindings":[]}, +1 undo entry, one Cmd+Z brings the binding back;
 *   B-8  in Basic the «Semantic type class» section is absent;
 *   B-9  page errors [].
 *
 * Run:  node frontend/scripts/lane-run.mjs probe ~/jjodel-w-oi-rail frontend/scripts/probe/onto-binding-editor.ts \
 *         --port 3093 --id P-2026-11-08-0113
 * Env:  ONTO_OUT   output directory (default /tmp/onto-binding-editor)
 *       UML_FILE   the exported project (default ~/jjodel-demo-exports/uml-s3b/uml-class-object.jjodel)
 */
import { chromium, type Page } from '@playwright/test';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { setTheme, SETTLE_MS } from '../smoke/states.ts';

const URL = (process.env.PROBE_URL || 'http://localhost:3093/').replace(/\/$/, '');
if (/:(3000|3001|3005|3015)$/.test(URL)) throw new Error('never 3000, 3001, 3005 or 3015');
const OUT = (process.env.ONTO_OUT || '/tmp/onto-binding-editor').replace(/\/$/, '');
mkdirSync(OUT, { recursive: true });
process.env.GV_OUT = OUT;
const { ev, meas, openPage, pickViewpoint } = await import('./bpmn-lanes-fixture.ts');

const FILE = process.env.UML_FILE || `${homedir()}/jjodel-demo-exports/uml-s3b/uml-class-object.jjodel`;
const VP_OBJECT = 'UML object diagram';
const CASCADE = ['Book', 'Library', 'Magazine', 'Member'];

let pass = 0; let fail = 0;
const check = (name: string, ok: boolean, detail: unknown) => {
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  ${JSON.stringify(detail).slice(0, 1500)}`);
    if (ok) pass++; else fail++;
};
const wait = (page: Page, ms: number) => page.waitForTimeout(ms);

const MENU = '.context-menu-backdrop ~ .context-menu';
const DIALOG = '.onto-binding-modal';
const history = (page: Page) => ev<{ user: number | null }>(page, `
    const h = w.statehistory || {}; const u = h[w.DUser.current]; return { user: u ? u.undoable.length : null };`, undefined, 0);
/** Wait until the user's undo stack has not grown for 800 ms, at most 4 s; the last read. */
async function settle(page: Page) {
    let h = await history(page); let since = Date.now(); const end = Date.now() + 4000;
    while (Date.now() < end && Date.now() - since < 800) {
        await wait(page, 150); const n = await history(page);
        if (n.user !== h.user) since = Date.now();
        h = n;
    }
    return h;
}
/** The bag key as stored: absent (`'absent'`), or its string. */
const bagOf = (page: Page, mm: string) => ev<{ has: boolean; raw: unknown; keys: string[] }>(page, `
    const s = w.store.getState().idlookup[a]._state || {}; return { has: 'ontoBindings' in s, raw: s.ontoBindings === undefined ? null : s.ontoBindings, keys: Object.keys(s) };`, mm, 0);

async function emptyPanePoint(page: Page) {
    return page.evaluate(() => {
        const pane = document.querySelector('.dock-tabpane-active .react-flow__pane') as HTMLElement | null;
        if (!pane) return null;
        const r = pane.getBoundingClientRect();
        for (const fy of [0.9, 0.8, 0.7, 0.55, 0.4]) for (const fx of [0.08, 0.15, 0.25, 0.35, 0.5]) {
            const x = Math.round(r.left + r.width * fx); const y = Math.round(r.top + r.height * fy);
            const el = document.elementFromPoint(x, y);
            if (el && el.classList.contains('react-flow__pane')) return { x, y };
        }
        return null;
    });
}
const openTab = (page: Page, id: string) => ev(page, `const dm = await import('/src/components/abstract/DockManager.tsx');
    await dm.default.open2(w.LPointerTargetable.fromPointer(a)); return 1;`, id, 3500);
/** The «Semantic type class» section of the Properties rail. */
const section = (page: Page) => page.locator('.props-section', { has: page.locator('.props-section__title', { hasText: /^Semantic type class$/ }) });
const row = (page: Page) => section(page).locator('.jj-toggle-row', { hasText: 'Ontological binding' });
/** Select the metamodel: its tab, a click on the empty pane. */
async function selectMetamodel(page: Page, mm: string) {
    await openTab(page, mm);
    const p = await emptyPanePoint(page);
    if (p) await page.mouse.click(p.x, p.y);
    await wait(page, 1500);
}
async function openDialog(page: Page) {
    await row(page).first().click();
    await wait(page, 800);
    return page.locator(DIALOG).count();
}
const dialogRows = (page: Page) => page.evaluate((sel) => [...document.querySelectorAll(`${sel} .onto-binding-modal__row`)].map((r) => ({
    record: (r.closest('[data-record]') as HTMLElement | null)?.dataset.record, path: (r as HTMLElement).dataset.path,
    found: !!r.querySelector('.onto-binding-modal__verdict--found'), missing: !!r.querySelector('.onto-binding-modal__verdict--missing'),
    defect: r.querySelector('.onto-binding-modal__help--error')?.textContent ?? null,
    value: (r.querySelector('select') as HTMLSelectElement | null)?.value ?? null,
})), DIALOG);
const button = (page: Page, text: string) => page.locator(`${DIALOG} button`, { hasText: new RegExp(`^\\s*${text}\\s*$`) }).first();
/** Detect, then Confirm; the undo stack before and after. */
async function declare(page: Page) {
    await button(page, 'Detect').click();
    await wait(page, 500);
    const h0 = await settle(page);
    await button(page, 'Confirm').click();
    await wait(page, 800);
    const h1 = await settle(page);
    // Confirm disabled (nothing to write) leaves the dialog open over the canvas: close it.
    const open = (await page.locator(DIALOG).count()) > 0;
    if (open) { await button(page, 'Cancel').click(); await wait(page, 400); }
    return { h0: h0.user, h1: h1.user, leftOpen: open };
}
/** Sorted keys, so that two records compare by content. */
const canon = (v: unknown): unknown => (Array.isArray(v) ? v.map(canon)
    : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v as object).sort().map((k) => [k, canon((v as Record<string, unknown>)[k])])) : v);

const browser = await chromium.launch();
const out: Record<string, unknown> = { url: URL, at: new Date().toISOString(), file: FILE };
try {
    const { page, errors } = await openPage(browser);
    if (!existsSync(FILE)) throw new Error(`no exported project at ${FILE}`);

    // ── Scene ──────────────────────────────────────────────────────────────────────────────────────────────────────
    await page.goto(`${URL}/#/allProjects`, { waitUntil: 'domcontentloaded', timeout: 300000 });
    await wait(page, 5000);
    const imported = await ev<{ id: string | null }>(page, `
        const api = await import('/src/api/persistance/projects.ts');
        const list = () => JSON.parse(localStorage.getItem('projects') || '[]');
        const before = list().length;
        await api.ProjectsApi.importFromText(a);
        for (let i = 0; i < 75 && list().length <= before; i++) await new Promise((r) => setTimeout(r, 200));
        const l = list(); return { id: l.length > before ? l[l.length - 1].id : null };`, readFileSync(FILE, 'utf8'), 0);
    if (!imported.id) throw new Error('the export did not import');
    await page.goto(`${URL}/#/project?id=${imported.id}`, { waitUntil: 'domcontentloaded', timeout: 300000 });
    await wait(page, 9000);
    await page.addStyleTag({ content: '.notification-widget, .notification-content, .donation-banner { pointer-events: none !important; display: none !important; }' }).catch(() => {});
    if (!(await page.locator('.toolbar-viewpoint-trigger:visible:not([disabled])').count())) {
        await ev(page, `const dm = await import('/src/components/abstract/DockManager.tsx'); const m = w.LProject.getProject().models.find((x) => !x.isMetamodel);
            await dm.default.open2(w.LPointerTargetable.fromPointer(m.id)); return 1;`, undefined, 8000);
    }
    await setTheme(page, 'light');
    await pickViewpoint(page, VP_OBJECT);
    await wait(page, SETTLE_MS);
    const ids = await ev<{ model: string; mm: string }>(page, `
        const m = w.LProject.getProject().models.find((x) => !x.isMetamodel); return { model: m.id, mm: w.store.getState().idlookup[m.id].instanceof };`, undefined, 0);
    out.ids = ids;

    // The probe table: the console setup of onto-s2-instantiate.ts, computed here and not written.
    const table = await ev<{ missing: string[]; object: unknown; link: unknown }>(page, `
        const idl = w.store.getState().idlookup; const mm = a;
        const inMM = (id) => { for (let x = id, i = 0; x && i < 32; i++) { if (x === mm) return true; x = idl[x] && idl[x].father; } return false; };
        const cls = {}; for (const r of Object.values(idl)) if (r && r.className === 'DClass' && inMM(r.id)) cls[r.name] = r;
        const missing = [];
        const C = (n) => { if (!cls[n]) missing.push(n); return cls[n] ? cls[n].id : n; };
        const F = (c, n) => { const k = cls[c]; const id = k && [...(k.attributes || []), ...(k.references || [])].find((f) => idl[f] && idl[f].name === n);
            if (!id) missing.push(c + '.' + n); return id || c + '.' + n; };
        const shared = { typeReference: F('InstanceSpecification', 'classifier'), slotContainer: F('InstanceSpecification', 'slots'),
            definingFeature: F('Slot', 'definingFeature'), valueHolder: F('Slot', 'values') };
        const object = { name: 'object', ...shared, featureContainer: F('Class', 'ownedAttributes'),
            generalization: { via: F('Classifier', 'generalizations'), general: F('Generalization', 'general') },
            abstractFlag: F('Classifier', 'isAbstract'), featureType: F('TypedElement', 'type'), defaultValue: F('Property', 'defaultValue'),
            valueKinds: [
                { when: 'primitive:Boolean', create: C('LiteralBoolean'), field: F('LiteralBoolean', 'value') },
                { when: 'primitive:String', create: C('LiteralString'), field: F('LiteralString', 'value') },
                { when: 'primitive:Integer', create: C('LiteralInteger'), field: F('LiteralInteger', 'value') },
                { when: 'instance', create: C('InstanceValue'), field: F('InstanceValue', 'instance') },
            ] };
        const link = { name: 'link', ...shared, featureContainer: F('Association', 'memberEnds') };
        return { missing, object, link };`, ids.mm, 0);
    out.table = { missing: table.missing };

    // ── B-0, B-1: the row in Advanced ─────────────────────────────────────────────────────────────────────────────
    const bag0 = await bagOf(page, ids.mm);
    await selectMetamodel(page, ids.mm);
    const advancedRow = await row(page).count();
    const summary0 = advancedRow ? (await row(page).first().innerText()).replace(/\s+/g, ' ').trim() : null;
    out.b0 = { bag0, advancedRow, summary0 };
    check('B-0 the bag has no ontoBindings and the row reads «none»', !bag0.has && /none$/.test(summary0 ?? ''), out.b0);
    if (advancedRow) await section(page).first().screenshot({ path: `${OUT}/b1-semantic-type-class-advanced.png` });
    const dialogs = advancedRow ? await openDialog(page) : 0;
    check('B-1 «Semantic type class» holds the «Ontological binding…» row in Advanced, and it opens the dialog', advancedRow === 1 && dialogs === 1, { advancedRow, dialogs });

    // ── B-2: Detect ────────────────────────────────────────────────────────────────────────────────────────────────
    await button(page, 'Detect').click();
    await wait(page, 600);
    const rows2 = await dialogRows(page);
    const records2 = [...new Set(rows2.map((r) => r.record))];
    out.detect = { rows: rows2.length, records: records2, missing: rows2.filter((r) => r.missing).map((r) => `${r.record}:${r.path}`),
        defects: rows2.filter((r) => r.defect).map((r) => `${r.record}:${r.path}`), notFound: rows2.filter((r) => !r.found).map((r) => `${r.record}:${r.path}:${r.value}`) };
    await page.locator(DIALOG).screenshot({ path: `${OUT}/b2-editor-after-detect.png` });
    // Detect does not search the object-only roles on `link` (question 3: the four slot roles and the value kinds): those
    // rows carry no verdict and stay empty; every row Detect searched is found.
    const LINK_UNSEARCHED = ['generalization.via', 'generalization.general', 'abstractFlag', 'featureType', 'defaultValue'];
    const unsearched = rows2.filter((r) => !r.found && !r.missing);
    check('B-2 Detect fills object and link, every searched row found, none missing, no defect; link\'s object-only roles empty',
        JSON.stringify(records2) === '["object","link"]' && rows2.length > 0 && rows2.every((r) => !r.missing && !r.defect)
        && JSON.stringify(unsearched.map((r) => `${r.record}:${r.path}:${r.value}`)) === JSON.stringify(LINK_UNSEARCHED.map((p) => `link:${p}:`)), out.detect);

    // ── B-3: a row corrected by hand ───────────────────────────────────────────────────────────────────────────────
    const typeRef = rows2.find((r) => r.record === 'object' && r.path === 'typeReference')?.value ?? '';
    const sel = page.locator(`${DIALOG} [data-record="object"] [data-path="definingFeature"] select`);
    await sel.selectOption(typeRef);
    await wait(page, 500);
    const rows3 = await dialogRows(page);
    const hand = rows3.find((r) => r.record === 'object' && r.path === 'definingFeature');
    await page.locator(`${DIALOG} [data-record="object"]`).screenshot({ path: `${OUT}/b3-row-corrected-by-hand.png` });
    await button(page, 'Detect').click();
    await wait(page, 500);
    const rows3b = await dialogRows(page);
    out.hand = { set: typeRef, defect: hand?.defect, afterDetect: rows3b.filter((r) => r.defect).length };
    check('B-3 a defining feature not owned by the slot metaclass shows its defect on its row; Detect again clears it',
        !!hand?.defect && /defining feature is owned by/.test(hand.defect) && rows3b.every((r) => !r.defect), out.hand);

    // ── B-4: Confirm ───────────────────────────────────────────────────────────────────────────────────────────────
    const h0 = await settle(page);
    await button(page, 'Confirm').click();
    await wait(page, 800);
    const h1 = await settle(page);
    const bag4 = await bagOf(page, ids.mm);
    const parsed = typeof bag4.raw === 'string' ? JSON.parse(bag4.raw) : null;
    const expected = { v: 1, bindings: [table.object, { ...(table.link as object), valueKinds: (table.object as { valueKinds: unknown }).valueKinds }] };
    const equal = JSON.stringify(canon(parsed)) === JSON.stringify(canon(expected));
    out.confirm = { undo: [h0.user, h1.user], closed: (await page.locator(DIALOG).count()) === 0, bytes: typeof bag4.raw === 'string' ? bag4.raw.length : 0, equal, tableMissing: table.missing };
    if (!equal) out.confirm = { ...(out.confirm as object), parsed, expected };
    check('B-4 Confirm writes a bag equal to the probe table (link with the slot roles), +1 undo entry, the dialog closed',
        table.missing.length === 0 && equal && (h1.user ?? 0) - (h0.user ?? 0) === 1 && (out.confirm as { closed: boolean }).closed, out.confirm);
    const confirmedRaw = bag4.raw as string;

    // ── B-5: one Cmd+Z ─────────────────────────────────────────────────────────────────────────────────────────────
    await page.evaluate(() => (document.querySelector('.dock-tabpane-active .editor-v2') as HTMLElement | null ?? document.querySelector('.editor-v2') as HTMLElement | null)?.focus());
    await page.keyboard.press('Meta+z');
    await wait(page, 900);
    const h5 = await settle(page);
    const bag5 = await bagOf(page, ids.mm);
    const decodable = (raw: unknown) => { if (raw === null) return true; try { const p = JSON.parse(raw as string); return p && p.v === 1 && Array.isArray(p.bindings); } catch { return false; } };
    const summary5 = (await row(page).count()) ? (await row(page).first().innerText()).replace(/\s+/g, ' ').trim() : null;
    out.undo = { undo: h5.user, key: bag5.has ? 'kept' : 'gone', raw: bag5.raw, decodable: decodable(bag5.raw), summary: summary5, stateKeys: bag5.keys };
    check('B-5 one Cmd+Z restores the previous bag (no binding) and leaves no defective bag', !bag5.has || bag5.raw === null || bag5.raw === '{"v":1,"bindings":[]}', out.undo);
    if (bag5.has && !decodable(bag5.raw)) check('B-5h HARD STOP: the Cmd+Z left a defective bag', false, out.undo);

    // ── B-6: declared again, the pane menu of the object diagram ───────────────────────────────────────────────────
    await selectMetamodel(page, ids.mm);
    await openDialog(page);
    const again = await declare(page);
    const bag6 = await bagOf(page, ids.mm);
    await openTab(page, ids.model);
    await wait(page, 1500);
    const p6 = await emptyPanePoint(page);
    let labels: string[] = []; let parent: string | null = null;
    if (p6) {
        await page.mouse.click(p6.x, p6.y); await wait(page, 200);
        await page.mouse.click(p6.x, p6.y, { button: 'right' }); await wait(page, 500);
        const cascade = page.locator(MENU).first().locator('.context-menu__item--cascade').first();
        parent = (await cascade.count()) ? (await cascade.innerText()).trim() : null;
        if (parent) { await cascade.hover(); await wait(page, 400); }
        if ((await page.locator(MENU).count()) > 1) labels = (await page.locator(MENU).nth(1).locator('.context-menu__item').allInnerTexts()).map((t) => t.trim());
        await page.keyboard.press('Escape');
        await page.evaluate(() => (document.querySelector('.context-menu-backdrop') as HTMLElement | null)?.click());
        await wait(page, 300);
    }
    out.menu = { again, sameBag: bag6.raw === confirmedRaw, at: p6, parent, labels };
    check('B-6 declared again, the pane menu cascades «New instance of ▸» to the options of the console setup',
        bag6.raw === confirmedRaw && parent === 'New instance of' && JSON.stringify(labels) === JSON.stringify(CASCADE), out.menu);

    // ── B-7: Remove ────────────────────────────────────────────────────────────────────────────────────────────────
    await selectMetamodel(page, ids.mm);
    await openDialog(page);
    const h7a = await settle(page);
    await button(page, 'Remove').click();
    await wait(page, 800);
    const h7b = await settle(page);
    const bag7 = await bagOf(page, ids.mm);
    await page.evaluate(() => (document.querySelector('.dock-tabpane-active .editor-v2') as HTMLElement | null ?? document.querySelector('.editor-v2') as HTMLElement | null)?.focus());
    await page.keyboard.press('Meta+z');
    await wait(page, 900);
    await settle(page);
    const bag7u = await bagOf(page, ids.mm);
    out.remove = { undo: [h7a.user, h7b.user], raw: bag7.raw, afterUndoSame: bag7u.raw === confirmedRaw };
    check('B-7 Remove writes {"v":1,"bindings":[]}, +1 undo entry, one Cmd+Z brings the binding back',
        bag7.raw === '{"v":1,"bindings":[]}' && (h7b.user ?? 0) - (h7a.user ?? 0) === 1 && bag7u.raw === confirmedRaw, out.remove);

    // ── B-8: Basic ─────────────────────────────────────────────────────────────────────────────────────────────────
    await ev(page, `const j = await import('/src/joiner/index.ts'); j.SetRootFieldAction.new('advanced', false); w.advanced = false;
        localStorage.setItem('jjodel.interfaceMode', 'basic'); return 1;`, undefined, 1200);
    await selectMetamodel(page, ids.mm);
    const basicSections = await section(page).count();
    const general = page.locator('.props-section', { has: page.locator('.props-section__title', { hasText: /^General$/ }) });
    const generalCount = await general.count();
    const rail = page.locator('.props-section').first().locator('xpath=..');
    if (await rail.count()) await rail.screenshot({ path: `${OUT}/b8-basic-no-semantic-type-class.png` });
    out.basic = { basicSections, generalCount };
    check('B-8 in Basic the metamodel shows «General» and no «Semantic type class»', basicSections === 0 && generalCount > 0, out.basic);

    // ── B-9 ────────────────────────────────────────────────────────────────────────────────────────────────────────
    out.errors = errors.slice(0, 10);
    check('B-9 page errors []', errors.length === 0, errors.slice(0, 5));
    await page.context().close();
} catch (e) {
    check('B-X the probe ran to the end', false, String((e as Error)?.stack ?? e).slice(0, 800));
} finally {
    out.checks = { pass, fail };
    writeFileSync(`${OUT}/onto-binding-editor-measures.json`, JSON.stringify(out, null, 2));
    meas('json', `${OUT}/onto-binding-editor-measures.json`);
    await browser.close();
}
console.log(`DONE pass=${pass} fail=${fail}`);
process.exit(fail === 0 ? 0 : 1);
