/**
 * probe_2026-09-05_rskin_sliceC_select — R-SKIN slice C: la palette scelta dal
 * PANNELLO, misurata sulle due superfici che dipinge.
 *
 * Settima sonda della serie del Data Manager, e la prima che chiude il giro intero:
 * la B scriveva `formPalette` da console — cioe' misurava il foglio di stile, non il
 * controllo — e questa parte dal gesto che l'utente compie davvero, la select del
 * rail. P11: la sonda esegue il soggetto, non il layer sotto.
 *
 * ── Che cosa misura, e perche' ciascun blocco esiste ─────────────────────────
 *
 *  A. LA SELECT C'E', SOTTO «Form theme», E NON MATERIALIZZA. Quattro opzioni, i
 *     quattro nomi in ordine di catalogo, `Slate` marcata default. Con il singleton
 *     ASSENTE — lo stato di ogni progetto salvato — la select legge gia' `Slate`, e
 *     aprire il rail non crea niente (R-DMV-6).
 *
 *  B. LA SCELTA SCRIVE, E MATERIALIZZA I DUE GRADINI. `Paper` scelta dalla select fa
 *     nascere il singleton con `formPalette: 'Paper'`. E' lo stesso `writeViewpoint`
 *     del nome e del tema: qui si verifica che la terza porta lo attraversi.
 *
 *  C. UNA SCRITTURA, DUE SUPERFICI (Q2), DALLA PORTA DELL'UTENTE. Aperto il manager,
 *     `getComputedStyle` su una cella della TABELLA e su un controllo del DRAWER
 *     porta i valori CALIBRATI di Paper. La sonda B lo aveva misurato con una
 *     scrittura di console; questo blocco lo misura con la select, che e' la catena
 *     completa select -> campo -> attributo -> foglio -> pixel.
 *
 *  D. IL NEGATIVO: TORNARE A `Slate` NON LASCIA TRACCIA. E' la meta' che conta di
 *     R-SKIN-2. Rimessa `Slate`, il campo torna ASSENTE (non `'Slate'` scritto), il
 *     progetto e' quello di oggi byte per byte, e le due superfici tornano ai valori
 *     di `:root`. Una select che scrivesse `'Slate'` passerebbe a occhio e
 *     fallirebbe qui.
 *
 * ── Che cosa NON prova ───────────────────────────────────────────────────────
 *
 * Che i valori siano belli: la calibrazione e' stata l'HARD STOP della slice B, a
 * occhio, ed e' gia' avvenuta. Questa sonda prova che il gesto arriva dove deve.
 *
 * Con il dev server su (P8: porta 3000, non 3001):
 *   cd frontend && npx tsx ../docs/discovery/harness/probe_2026-09-05_rskin_sliceC_select.mts
 */
import playwright from '../../../frontend/node_modules/@playwright/test/index.js';
const { chromium } = playwright as unknown as typeof import('@playwright/test');
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { BASE_URL, NAV_MS, SETTLE_MS, createProject, seed } from '../../../frontend/scripts/smoke/states.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const shot = (n: string) => resolve(HERE, `_tmp_rskinC_${n}.png`);

let pass = 0, fail = 0;
const check = (label: string, ok: boolean, detail: string) => {
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}\n        ${detail}`);
    ok ? pass++ : fail++;
};
const note = (label: string, d: unknown) =>
    console.log(`  MISURA  ${label}\n        ${typeof d === 'string' ? d : JSON.stringify(d)}`);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1700, height: 1000 } });
await ctx.addInitScript(() => { (window as any).__name = (f: any) => f; });
await seed(ctx, true);
const page = await ctx.newPage();
const errors: string[] = [];
page.on('pageerror', (e) => errors.push(e.message));

await page.goto(`${BASE_URL}/all-projects`, { waitUntil: 'domcontentloaded', timeout: NAV_MS });
await page.waitForTimeout(SETTLE_MS);
const pid = await createProject(page, `Smoke_RSKINC_${Date.now()}`);
if (!pid) { console.log('FIXTURE FAILED: createProject'); await browser.close(); process.exit(1); }
await page.goto(`${BASE_URL}/#/project?id=${pid}`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(NAV_MS + SETTLE_MS);

const built = await page.evaluate(async () => {
    const w = window as any;
    try {
        const project = w.LProject.getProject();
        if (!project) return { ok: false, error: 'no project' };
        const dM2 = w.DModel.new('SkinCM2', undefined, true);
        const lM2 = w.LModel.fromD(dM2);
        const dG2 = w.DGraph.new(0, dM2.id);
        w.SetFieldAction.new(project.id, 'metamodels', lM2.id, '+=', true);
        w.SetFieldAction.new(project.id, 'graphs', dG2.id, '+=', true);
        w.SetFieldAction.new(dG2.id, 'graphStyle', 'v2-flow', '', false);
        const dPkg = lM2.addChild('package');
        const lPkg = w.LPackage.fromD(dPkg);
        lPkg.name = 'skinc';
        const lSensor = w.LClass.fromD(lPkg.addClass('Sensor'));
        for (const a of ['name', 'note', 'tag']) lSensor.addAttribute(a, 'Pointer_ESTRING');
        w.DVertex.new(lSensor.id, dG2.id);
        const dM1 = w.DModel.new('SkinCM1', dM2.id, false, true);
        const dG1 = w.DGraph.new(0, dM1.id);
        w.SetFieldAction.new(dG1.id, 'graphStyle', 'v2-flow', '', false);
        w.SetFieldAction.new(project.id, 'models', dM1.id, '+=', true);
        w.SetRootFieldAction.new('graphs', dG1.id, '+=', true);
        w.SetFieldAction.new(project.id, 'graphs', dG1.id, '+=', true);
        return { ok: true, m1: dM1.id, cls: lSensor.id };
    } catch (e) { return { ok: false, error: e instanceof Error ? `${e.message}\n${e.stack}` : String(e) }; }
});
if (!built.ok) { console.log('FIXTURE FAILED: ' + built.error); await browser.close(); process.exit(1); }
await page.waitForTimeout(2500);

/** Un'istanza con i campi valorizzati: una colonna vuota sparisce da se', e il drawer
 *  di un oggetto senza valori non ha molto da dipingere (stessa fixture della sonda B). */
const made = await page.evaluate(async (a: { m1: string; cls: string }) => {
    const w = window as any;
    try {
        w.DObject.new(a.cls, a.m1, w.DModel, 'Alpha', true);
        await new Promise(r => setTimeout(r, 2000));
        const lModel = w.LPointerTargetable.fromD(a.m1);
        const o = lModel.objects.find((x: any) => x.name === 'Alpha');
        if (!o) return 'oggetto non trovato';
        for (const attr of ['note', 'tag']) o['$' + attr].value = `${attr}-alpha`;
        return 'ok';
    } catch (e) { return e instanceof Error ? e.message : String(e); }
}, { m1: built.m1, cls: built.cls });
if (made !== 'ok') { console.log('FIXTURE FAILED (object): ' + made); await browser.close(); process.exit(1); }
await page.waitForTimeout(2500);

// ── le due porte: l'editor col rail, e il manager ────────────────────────────

/** L'editor del modello: e' cio' che rende l'albero, e con esso la voce «Data Manager».
 *  Stessa condizione che `DockManager.openViewpoint` verifica su `body[data-editor-type]`. */
const openEditor = async (mid: string) => {
    const r = await page.evaluate((m: string) => {
        const w = window as any;
        try { return !!w.DockManager.open2(w.LModel.fromPointer(m)); } catch (e) { return String(e); }
    }, mid);
    await page.waitForTimeout(6000);
    return String(r);
};

const openManager = async (mid: string) => {
    const r = await page.evaluate((m: string) => {
        const w = window as any;
        try { return !!w.DockManager.openManager(w.LModel.fromPointer(m)); } catch (e) { return String(e); }
    }, mid);
    await page.waitForTimeout(6000);
    return String(r);
};

/** Apre il pannello del singleton dalla voce dell'albero: la porta della slice E, che
 *  e' anche l'unica che un utente ha. */
const openPanel = async () => {
    const label = page.locator('[data-section-key="__section:dataManager"] .tree-section__label').first();
    if (await label.count() === 0) return 'voce «Data Manager» non trovata nell\'albero';
    await label.click();
    await page.waitForTimeout(2500);
    return 'ok';
};

const singleton = () => page.evaluate(() => {
    const s = (window as any).windoww.store.getState();
    const d = s.idlookup['Pointer_ViewPointDataManager'];
    if (!d) return { exists: false as const };
    return {
        exists: true as const,
        type: d.viewpointType,
        exclusive: d.isExclusiveView,
        palette: d.formPalette,
        // Cio' che il progetto SALVA: `undefined` sparisce dal JSON, una stringa no.
        persisted: JSON.parse(JSON.stringify(d)).formPalette ?? null,
    };
});

/** La forma del rail: le etichette dei campi nell'ordine in cui stanno, e la select
 *  della palette con le sue opzioni. Le etichette servono al controllo di POSIZIONE —
 *  «sotto Form theme» e' una richiesta sull'ordine, non sulla sola presenza. */
const railShape = () => page.evaluate(() => {
    const root = document.querySelector('.properties-tab .workbench-properties')
        ?? document.querySelector('.workbench-properties');
    if (!root) return null;
    const fields = Array.from(root.querySelectorAll('.wp-field'));
    const labels = fields.map(f => (f.querySelector('.wp-field__label')?.textContent ?? '').trim());
    const paletteField = fields.find(f =>
        (f.querySelector('.wp-field__label')?.textContent ?? '').trim() === 'Palette') ?? null;
    const sel = paletteField?.querySelector('select') as HTMLSelectElement | null;
    return {
        headers: Array.from(root.querySelectorAll('.workbench-properties__section-header'))
            .map(h => (h.textContent ?? '').trim()),
        labels,
        hasPalette: !!sel,
        value: sel?.value ?? null,
        options: sel ? Array.from(sel.options).map(o => ({ value: o.value, text: o.text.trim() })) : [],
    };
});

const paletteSelect = () => page.locator('.workbench-properties .wp-field')
    .filter({ has: page.locator('.wp-field__label', { hasText: /^Palette$/ }) })
    .locator('select').first();

// ── la misura sulle due superfici, identica a quella della sonda B ───────────

const markVisible = () => page.evaluate(() => {
    const paints = (el: Element) => {
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) return false;
        const cx = Math.min(Math.max(r.left + r.width / 2, 1), window.innerWidth - 1);
        const cy = Math.min(Math.max(r.top + r.height / 2, 1), window.innerHeight - 1);
        const hit = document.elementFromPoint(cx, cy);
        return !!hit && (el === hit || el.contains(hit));
    };
    const roots = Array.from(document.querySelectorAll('.instance-manager'));
    for (const r of roots) r.removeAttribute('data-probe-visible');
    const root = roots.find(paints) ?? null;
    if (root) root.setAttribute('data-probe-visible', '1');
    return { managers: roots.length, found: !!root };
});

const pick = async (name: string) => {
    await markVisible();
    const rail = page.locator('[data-probe-visible="1"] .instance-manager__pane--classes');
    const row = rail.locator('.instance-manager__row').filter({
        has: page.locator('.instance-manager__row-name', { hasText: new RegExp(`^${name}$`) }),
    }).first();
    if (await row.count() === 0) return `riga «${name}» non trovata`;
    await row.click();
    await page.waitForTimeout(1800);
    return 'ok';
};

/** Selezionare l'istanza e' cio' che APRE il drawer: senza, `.ir-form` non e' nel DOM
 *  affatto e la misura sul drawer sarebbe `null` letto come «non dipinto» (sonda B). */
const pickInstance = async () => {
    await markVisible();
    const row = page.locator('[data-probe-visible="1"] tbody tr').first();
    if (await row.count() === 0) return 'nessuna riga di istanza';
    await row.click();
    await page.waitForTimeout(2500);
    const open = await page.evaluate(() =>
        !!document.querySelector('[data-probe-visible="1"] .ir-form'));
    return open ? 'ok' : 'drawer non aperto';
};

const measure = () => page.evaluate(() => {
    const root = document.querySelector('[data-probe-visible="1"]');
    if (!root) return null;
    const table = root.querySelector('.instance-manager__table, table');
    const form = root.querySelector('.ir-form');
    const read = (el: Element | null) => {
        if (!el) return null;
        const cs = getComputedStyle(el);
        const g = (t: string) => cs.getPropertyValue(t).trim();
        return { surface: g('--color-form-surface'), border: g('--color-form-border') };
    };
    return {
        attr: root.getAttribute('data-palette'),
        table: read(table),
        form: read(form),
        tableFound: !!table,
        formFound: !!form,
    };
});

/** Apre il manager e ci porta fino al drawer aperto, che e' lo stato in cui entrambe
 *  le superfici sono sullo schermo insieme. */
const showBothSurfaces = async () => {
    note('openManager', await openManager(built.m1));
    note('markVisible', await markVisible());
    note('pick(Sensor)', await pick('Sensor'));
    note('pickInstance', await pickInstance());
    await markVisible();
    return measure();
};

console.log('\n== R-SKIN slice C ==============================================');
note('openEditor', await openEditor(built.m1));

// ── A. la select c'e', al suo posto, e aprire non materializza ──────────────
console.log('\n-- A. la select «Palette», sul singleton ASSENTE -------------');
note('openPanel', await openPanel());
const a = await railShape();
await page.screenshot({ path: shot('a_panel_stub') });
note('rail', a);
check('A0 positivo di controllo: il rail rende il pannello del Data Manager',
    !!a && a.headers.includes('Data Manager') && a.headers.includes('Fields'),
    `headers ${JSON.stringify(a?.headers)}`);
check('A1 il campo «Palette» c\'e\', ed e\' SOTTO «Form theme» (ordine, non sola presenza)',
    !!a && a.labels.indexOf('Palette') === a.labels.indexOf('Form theme') + 1,
    `etichette ${JSON.stringify(a?.labels)}`);
check('A2 quattro opzioni, i quattro nomi in ordine di catalogo, `Slate` marcata default',
    !!a && a.options.length === 4
    && a.options.map(o => o.value).join(',') === 'Slate,Paper,Ink,Mist'
    && a.options[0].text === 'Slate (default)',
    `opzioni ${JSON.stringify(a?.options)}`);
check('A3 senza singleton la select legge gia\' `Slate`',
    a?.value === 'Slate', `value ${JSON.stringify(a?.value)}`);
const beforeWrite = await singleton();
check('A4 APRIRE NON MATERIALIZZA: il singleton non esiste ancora (R-DMV-6)',
    beforeWrite.exists === false, `idlookup[Pointer_ViewPointDataManager] ${JSON.stringify(beforeWrite)}`);

// ── B. la scelta scrive, e fa nascere il singleton ──────────────────────────
console.log('\n-- B. `Paper` scelta dalla select ----------------------------');
await paletteSelect().selectOption('Paper');
await page.waitForTimeout(3000);
const b = await singleton();
await page.screenshot({ path: shot('b_paper_written') });
note('singleton dopo la scelta', b);
check('B1 la scelta ha MATERIALIZZATO il singleton, `dataManager` e `isExclusiveView: true`',
    b.exists === true && b.type === 'dataManager' && b.exclusive === true, `${JSON.stringify(b)}`);
check('B2 il campo porta il NOME scelto, non l\'attributo',
    b.exists && b.palette === 'Paper', `formPalette = ${JSON.stringify(b.exists && b.palette)}`);
const bRail = await railShape();
check('B3 la select rilegge quello che ha scritto',
    bRail?.value === 'Paper', `value ${JSON.stringify(bRail?.value)}`);

// ── C. le due superfici, dalla porta dell'utente (Q2) ───────────────────────
console.log('\n-- C. tabella e drawer, con la palette scelta dal pannello ---');
const c = await showBothSurfaces();
await page.screenshot({ path: shot('c_manager_paper') });
note('manager con Paper', c);
check('C0 positivo di controllo: tabella e drawer sono entrambi sullo schermo',
    !!c && c.tableFound && c.formFound, `table ${c?.tableFound}, form ${c?.formFound}`);
check('C1 l\'attributo sulla radice del manager segue la scelta del pannello',
    c?.attr === 'paper', `data-palette = ${JSON.stringify(c?.attr)}`);
check('C2 la TABELLA porta i valori CALIBRATI di Paper',
    c?.table?.surface === '#fbf7ee' && c?.table?.border === '#ddd2b8',
    `letto ${JSON.stringify(c?.table)}`);
check('C3 il DRAWER porta gli STESSI valori: una scrittura, due superfici (Q2)',
    !!c?.form && c.form.surface === c.table?.surface && c.form.border === c.table?.border,
    `table ${JSON.stringify(c?.table)} vs form ${JSON.stringify(c?.form)}`);

// ── D. il negativo: `Slate` non lascia traccia ──────────────────────────────
console.log('\n-- D. rimessa `Slate`: il progetto di oggi, byte per byte ----');
note('openEditor', await openEditor(built.m1));
note('openPanel', await openPanel());
await paletteSelect().selectOption('Slate');
await page.waitForTimeout(3000);
const d = await singleton();
note('singleton dopo il ritorno a Slate', d);
check('D1 il campo torna ASSENTE, non scritto `\'Slate\'`: il salvato e\' quello di oggi (R-SKIN-2)',
    d.exists === true && d.palette === undefined && d.persisted === null,
    `formPalette = ${JSON.stringify(d.exists && d.palette)}, persistito ${JSON.stringify(d.exists && d.persisted)}`);
const dSurf = await showBothSurfaces();
await page.screenshot({ path: shot('d_manager_slate') });
note('manager dopo il ritorno', dSurf);
check('D2 le due superfici tornano ai valori di `:root`, tabella e drawer',
    dSurf?.attr === 'slate' && dSurf?.table?.surface === '#ffffff' && dSurf?.form?.surface === '#ffffff',
    `${JSON.stringify(dSurf)}`);
check('D3 nessun errore di pagina in tutto il giro',
    errors.length === 0, `pageerror: ${JSON.stringify(errors.slice(0, 3))}`);

console.log(`\n== ${pass} PASS, ${fail} FAIL ===================================\n`);
await browser.close();
process.exit(fail === 0 ? 0 : 1);
