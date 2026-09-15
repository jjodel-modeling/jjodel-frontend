/**
 * probe_2026-09-05_rskin_sliceB_palettes — R-SKIN slice B: le quattro palette,
 * misurate dove dipingono.
 *
 * Sesta sonda della serie del Data Manager. Le cinque di R-DMV misuravano STATO —
 * quale view, quale chiave, quale riga. Questa misura PIXEL, o meglio i valori che
 * li producono: `getComputedStyle` su un elemento della TABELLA e su uno del
 * DRAWER, per ciascuna palette, in light e in dark.
 *
 * ── Perche' due elementi e non uno ────────────────────────────────────────────
 *
 * E' la domanda Q2 della Fase 1, resa misurabile. La tabella legge gli stessi nove
 * token della form (143 righe di `instanceManagerTab.scss`), e l'attributo sta su
 * `.instance-manager`, che e' antenato di `.ir-form`. Se la palette arrivasse a uno
 * solo dei due, una schermata avrebbe due materiali. Un solo elemento misurato non
 * distinguerebbe «coprono entrambi» da «copre quello che ho guardato».
 *
 * ── Perche' due temi ──────────────────────────────────────────────────────────
 *
 * E' il rischio R2 del referto, ed e' silenzioso: le custom property si ereditano,
 * quindi una regola su un discendente vince su `:root[data-theme="dark"]` senza che
 * nessun confronto di specificita' avvenga. Una palette che dichiarasse solo i
 * valori chiari dipingerebbe quelli chiari ANCHE in tema scuro, e la cosa si vede
 * solo aprendo il tema scuro. Il blocco C lo esercita.
 *
 * ── Che cosa NON prova ────────────────────────────────────────────────────────
 *
 * Che i valori siano BELLI. Questa sonda dice che arrivano dove devono e che sono
 * quelli scritti nel foglio; la calibrazione e' l'HARD STOP che segue, a occhio.
 *
 * Con il dev server su (P8: porta 3000, non 3001):
 *   cd frontend && npx tsx ../docs/discovery/harness/probe_2026-09-05_rskin_sliceB_palettes.mts
 */
import playwright from '../../../frontend/node_modules/@playwright/test/index.js';
const { chromium } = playwright as unknown as typeof import('@playwright/test');
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { BASE_URL, NAV_MS, SETTLE_MS, createProject, seed } from '../../../frontend/scripts/smoke/states.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const shot = (n: string) => resolve(HERE, `_tmp_rskinB_${n}.png`);

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
const pid = await createProject(page, `Smoke_RSKINB_${Date.now()}`);
if (!pid) { console.log('FIXTURE FAILED: createProject'); await browser.close(); process.exit(1); }
await page.goto(`${BASE_URL}/#/project?id=${pid}`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(NAV_MS + SETTLE_MS);

const built = await page.evaluate(async () => {
    const w = window as any;
    try {
        const project = w.LProject.getProject();
        if (!project) return { ok: false, error: 'no project' };
        const dM2 = w.DModel.new('SkinM2', undefined, true);
        const lM2 = w.LModel.fromD(dM2);
        const dG2 = w.DGraph.new(0, dM2.id);
        w.SetFieldAction.new(project.id, 'metamodels', lM2.id, '+=', true);
        w.SetFieldAction.new(project.id, 'graphs', dG2.id, '+=', true);
        w.SetFieldAction.new(dG2.id, 'graphStyle', 'v2-flow', '', false);
        const dPkg = lM2.addChild('package');
        const lPkg = w.LPackage.fromD(dPkg);
        lPkg.name = 'skin';
        const lSensor = w.LClass.fromD(lPkg.addClass('Sensor'));
        for (const a of ['name', 'note', 'tag']) lSensor.addAttribute(a, 'Pointer_ESTRING');
        w.DVertex.new(lSensor.id, dG2.id);
        const dM1 = w.DModel.new('SkinM1', dM2.id, false, true);
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

/** Un'istanza, con i campi valorizzati: una colonna interamente vuota sparisce da se'
 *  e il drawer di un oggetto senza valori non ha molto da dipingere. */
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

const openManager = async (mid: string) => {
    await page.goto(`${BASE_URL}/#/project?id=${pid}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(NAV_MS);
    const r = await page.evaluate((m: string) => {
        const w = window as any;
        try { return !!w.DockManager.openManager(w.LModel.fromPointer(m)); } catch (e) { return String(e); }
    }, mid);
    await page.waitForTimeout(6000);
    return String(r);
};

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

/**
 * Seleziona l'istanza, che e' cio' che APRE il drawer.
 *
 * Senza questo la `.ir-form` non e' nel DOM affatto, e `getComputedStyle` su `null`
 * non e' una misura: il primo giro leggeva `form: null` su tutte e sei le palette e
 * dichiarava rotta la meta' della catena che semplicemente non era sullo schermo.
 * CLAUDE.md §5, lo stato che non si e' formato letto come comportamento.
 */
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

/** Scrive la palette sul singleton, come fara' la select della slice C. */
const setPalette = (name: string | null) => page.evaluate((n: string | null) => {
    const w = window as any; const W: any = w.windoww ?? w;
    try {
        let d = W.store.getState().idlookup['Pointer_ViewPointDataManager'];
        if (!d) {
            w.DViewPoint.newVP('Data Manager', (vp: any) => {
                vp.viewpointType = 'dataManager'; vp.isValidation = false;
            }, true, 'Pointer_ViewPointDataManager');
            d = W.store.getState().idlookup['Pointer_ViewPointDataManager'];
        }
        const l: any = w.LPointerTargetable.fromD(d);
        l.formPalette = n === null ? undefined : n;
        // Rilettura DOPO un tick: le azioni partono con `setTimeout(0)`, e leggere lo
        // store subito restituisce il valore PRECEDENTE — nelle note del primo giro
        // ogni riga mostrava la palette di prima.
        return new Promise<string>(res => setTimeout(() => res(
            String(W.store.getState().idlookup['Pointer_ViewPointDataManager']?.formPalette)), 50));
    } catch (e) { return e instanceof Error ? e.message : String(e); }
}, name);

const setTheme = (t: 'light' | 'dark') => page.evaluate((th: string) => {
    document.documentElement.setAttribute('data-theme', th);
    return document.documentElement.getAttribute('data-theme');
}, t);

/**
 * I valori CALCOLATI su due elementi: una cella della tabella e un controllo del drawer.
 * Si leggono le custom property risolte con `getPropertyValue`, che e' cio' che la palette
 * rimappa; una `background-color` sarebbe la stessa misura passata per una regola in piu'.
 */
const measure = () => page.evaluate(() => {
    const root = document.querySelector('[data-probe-visible="1"]');
    if (!root) return null;
    const table = root.querySelector('.instance-manager__table, table');
    const form = root.querySelector('.ir-form');
    const read = (el: Element | null) => {
        if (!el) return null;
        const cs = getComputedStyle(el);
        const g = (t: string) => cs.getPropertyValue(t).trim();
        return {
            surface: g('--color-form-surface'),
            border: g('--color-form-border'),
            muted: g('--color-form-muted'),
            label: g('--color-form-label'),
        };
    };
    return {
        attr: root.getAttribute('data-palette'),
        theme: document.documentElement.getAttribute('data-theme'),
        table: read(table),
        form: read(form),
        formFound: !!form,
        tableFound: !!table,
    };
});

console.log('\n== R-SKIN slice B ==============================================');
note('openManager', await openManager(built.m1));
note('markVisible', await markVisible());
note('pick(Sensor)', await pick('Sensor'));
note('pickInstance', await pickInstance());

// ── A. senza palette: l'attributo c'e', le regole no ────────────────────────
console.log('\n-- A. nessuna palette scelta: `slate`, cioe\' i valori di :root -----');
await setTheme('light');
await page.waitForTimeout(800);
await markVisible();
const a = await measure();
await page.screenshot({ path: shot('a_slate_light') });
note('slate / light', a);
check('A0 positivo di controllo: tabella e drawer sono entrambi sullo schermo',
    !!a && a.tableFound && a.formFound, `table ${a?.tableFound}, form ${a?.formFound}`);
check('A1 l\'attributo c\'e\' anche senza singleton, ed e\' `slate` (paletteAttr non torna mai vuoto)',
    a?.attr === 'slate', `data-palette=${JSON.stringify(a?.attr)}`);
check('A2 `slate` NON rimappa: i token sono quelli di :root (#ffffff / #e2e8f0)',
    a?.table?.surface === '#ffffff' && a?.table?.border === '#e2e8f0',
    `${JSON.stringify(a?.table)}`);

// ── B. le tre palette in light, su ENTRAMBE le superfici ────────────────────
console.log('\n-- B. le tre palette, tabella E drawer (Q2) ------------------');
const EXPECT_LIGHT: Record<string, { surface: string; border: string }> = {
    paper: { surface: '#fbf7ee', border: '#ddd2b8' },
    ink:   { surface: '#ffffff', border: '#334155' },
    mist:  { surface: '#f7f9fb', border: 'rgba(15, 23, 42, 0.05)' },
};
for (const name of ['Paper', 'Ink', 'Mist']) {
    note(`setPalette(${name})`, await setPalette(name));
    await page.waitForTimeout(1500);
    await markVisible();
    const m = await measure();
    await page.screenshot({ path: shot(`b_${name.toLowerCase()}_light`) });
    note(`${name} / light`, m);
    const want = EXPECT_LIGHT[name.toLowerCase()];
    check(`B-${name} l'attributo segue il campo del singleton`,
        m?.attr === name.toLowerCase(), `data-palette=${JSON.stringify(m?.attr)}`);
    check(`B-${name} la TABELLA porta i valori della palette`,
        m?.table?.surface === want.surface && m?.table?.border === want.border,
        `atteso ${JSON.stringify(want)}, letto ${JSON.stringify(m?.table)}`);
    check(`B-${name} il DRAWER porta gli STESSI valori: una scrittura, due superfici (Q2)`,
        !!m?.form && m.form.surface === m.table?.surface && m.form.border === m.table?.border,
        `table ${JSON.stringify(m?.table)} vs form ${JSON.stringify(m?.form)}`);
}

// ── C. il tema scuro: due regole per palette, non una ───────────────────────
console.log('\n-- C. dark: la regola della palette copre anche il dark (R2) -');
note('setTheme(dark)', await setTheme('dark'));
await page.waitForTimeout(1200);
await markVisible();
const darkSlate = await (async () => { await setPalette(null); await page.waitForTimeout(1200); await markVisible(); return measure(); })();
await page.screenshot({ path: shot('c_slate_dark') });
note('slate / dark', darkSlate);
check('C0 positivo di controllo: senza palette il dark e\' quello di :root[data-theme=dark]',
    darkSlate?.table?.surface === '#16181a',
    `atteso #16181a, letto ${JSON.stringify(darkSlate?.table)}`);

const EXPECT_DARK: Record<string, string> = { paper: '#201c16', ink: '#000000', mist: '#131517' };
for (const name of ['Paper', 'Ink', 'Mist']) {
    note(`setPalette(${name})`, await setPalette(name));
    await page.waitForTimeout(1500);
    await markVisible();
    const m = await measure();
    await page.screenshot({ path: shot(`c_${name.toLowerCase()}_dark`) });
    note(`${name} / dark`, m);
    check(`C-${name} il dark ha i valori SCURI della palette, non quelli chiari`,
        m?.table?.surface === EXPECT_DARK[name.toLowerCase()]
        && m?.form?.surface === EXPECT_DARK[name.toLowerCase()],
        `atteso ${EXPECT_DARK[name.toLowerCase()]}, table ${m?.table?.surface}, form ${m?.form?.surface}`);
}

// ── D. il ritorno ───────────────────────────────────────────────────────────
console.log('\n-- D. tolta la palette, tutto torna com\'era ------------------');
await setTheme('light');
note('setPalette(null)', await setPalette(null));
await page.waitForTimeout(1500);
await markVisible();
const d = await measure();
note('dopo il reset', d);
check('D1 senza campo si torna a `slate` e ai valori di :root, in tabella e nel drawer',
    d?.attr === 'slate' && d?.table?.surface === '#ffffff' && d?.form?.surface === '#ffffff',
    `${JSON.stringify(d)}`);
check('D2 nessun errore di pagina in tutto il giro',
    errors.length === 0, `pageerror: ${JSON.stringify(errors.slice(0, 3))}`);

console.log(`\n== ${pass} PASS, ${fail} FAIL ===================================\n`);
await browser.close();
process.exit(fail === 0 ? 0 : 1);
