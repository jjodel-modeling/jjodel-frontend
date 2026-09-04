/**
 * probe_2026-09-04_rdmv_sliceE_sidebar — R-DMV slice E, e con essa la verifica
 * della slice D dalla porta dell'UTENTE.
 *
 * Quarta della serie. Le tre precedenti creavano il singleton A MANO, perche' non
 * c'era modo di arrivarci cliccando. Questa non lo crea: parte da un progetto in
 * cui il singleton NON esiste — lo stato di ogni progetto salvato — e ci arriva
 * dalla sezione «Data Manager» dell'albero, che e' la porta della slice E.
 *
 * ── Cosa misura ──────────────────────────────────────────────────────────────
 *
 *  A. LA SEZIONE C'E' SEMPRE. Con nessun singleton in idlookup, la sezione si
 *     rende lo stesso e mostra lo stato vuoto ratificato. Positivo di controllo:
 *     le altre sezioni dell'albero ci sono, cosi' «la sezione c'e'» non si
 *     confonde con «l'albero non si e' reso».
 *
 *  B. LA VOCE APRE IL PANNELLO SULLO STUB. Cliccando la voce, il rail rende
 *     `DataManagerViewpointPanel` — e il singleton CONTINUA a non esistere. E' il
 *     cuore di R-DMV-6: aprire non materializza.
 *
 *  C. LA PRIMA SCRITTURA MATERIALIZZA I DUE GRADINI. Scelto un widget dal
 *     pannello, nascono in un colpo il `DViewPoint` (gradino 1, che le sonde
 *     precedenti non hanno mai esercitato perche' lo creavano a mano) e la view di
 *     classe (gradino 2). Il viewpoint nasce `dataManager` ed `isExclusiveView:
 *     true`, che e' l'invariante portante del referto §2.3.
 *
 *  D. L'ALBERO SI POPOLA E NON SDOPPIA. La sezione elenca la classe con la feature
 *     toccata e l'override accanto; il singleton NON compare fra i viewpoint, e il
 *     contatore di «Viewpoints» non lo conta.
 *
 * Con il dev server su (P8: porta 3000, non 3001):
 *   cd frontend && npx tsx ../docs/discovery/harness/probe_2026-09-04_rdmv_sliceE_sidebar.mts
 */
import playwright from '../../../frontend/node_modules/@playwright/test/index.js';
const { chromium } = playwright as unknown as typeof import('@playwright/test');
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { BASE_URL, NAV_MS, SETTLE_MS, createProject, seed } from '../../../frontend/scripts/smoke/states.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const shot = (n: string) => resolve(HERE, `_tmp_rdmvE_${n}.png`);

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
const pid = await createProject(page, `Smoke_RDMVE_${Date.now()}`);
if (!pid) { console.log('FIXTURE FAILED: createProject'); await browser.close(); process.exit(1); }
await page.goto(`${BASE_URL}/#/project?id=${pid}`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(NAV_MS + SETTLE_MS);

const built = await page.evaluate(async () => {
    const w = window as any;
    try {
        const project = w.LProject.getProject();
        if (!project) return { ok: false, error: 'no project' };
        const dM2 = w.DModel.new('DmveM2', undefined, true);
        const lM2 = w.LModel.fromD(dM2);
        const dG2 = w.DGraph.new(0, dM2.id);
        w.SetFieldAction.new(project.id, 'metamodels', lM2.id, '+=', true);
        w.SetFieldAction.new(project.id, 'graphs', dG2.id, '+=', true);
        w.SetFieldAction.new(dG2.id, 'graphStyle', 'v2-flow', '', false);
        const dPkg = lM2.addChild('package');
        const lPkg = w.LPackage.fromD(dPkg);
        lPkg.name = 'dmve';
        const lSensor = w.LClass.fromD(lPkg.addClass('Sensor'));
        lSensor.addAttribute('name', 'Pointer_ESTRING');
        lSensor.addAttribute('note', 'Pointer_ESTRING');
        w.DVertex.new(lSensor.id, dG2.id);
        // Un viewpoint ordinario, per il contatore di «Viewpoints» del blocco D.
        w.DViewPoint.newVP('Ordinary syntax', (vp: any) => {
            vp.viewpointType = 'syntax'; vp.isExclusiveView = true; vp.isValidation = false;
        }, true, 'Pointer_DMVE_ORDINARY');
        const dM1 = w.DModel.new('DmveM1', dM2.id, false, true);
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

// Il rail con l'albero si vede aprendo un editor: e' la stessa condizione che
// `DockManager.openViewpoint` verifica su `body[data-editor-type]`.
await page.evaluate((m: string) => {
    const w = window as any;
    try { w.DockManager.open2(w.LModel.fromPointer(m)); } catch { /* misurato sotto */ }
}, built.m1);
await page.waitForTimeout(6000);

const singletonExists = () => page.evaluate(() =>
    !!(window as any).windoww.store.getState().idlookup['Pointer_ViewPointDataManager']);

/** La sezione «Data Manager» dell'albero, letta dal DOM. */
const dmvSection = () => page.evaluate(() => {
    const root = document.querySelector('[data-section-key="__section:dataManager"]');
    if (!root) return null;
    const content = root.querySelector('[data-section-content="__section:dataManager"]');
    return {
        label: (root.querySelector('.tree-section__label')?.textContent ?? '').trim(),
        counter: (root.querySelector('.tree-counter')?.textContent ?? '').trim(),
        empty: (root.querySelector('.tree-empty-dmv-label')?.textContent ?? '').trim(),
        rows: content
            ? Array.from(content.querySelectorAll('.tree-row__name, .tree-feature__name'))
                .map(n => (n.textContent ?? '').trim()).filter(Boolean)
            : [],
        overrides: content
            ? Array.from(content.querySelectorAll('.tree-feature__type'))
                .map(n => (n.textContent ?? '').trim()).filter(Boolean)
            : [],
    };
});

const railShape = () => page.evaluate(() => {
    const root = document.querySelector('.properties-tab .workbench-properties')
        ?? document.querySelector('.workbench-properties');
    if (!root) return null;
    return {
        headers: Array.from(root.querySelectorAll('.workbench-properties__section-header'))
            .map(h => (h.textContent ?? '').trim()),
        hasTypeSegmented: !!root.querySelector('.wp-type-segmented'),
        featureRows: Array.from(root.querySelectorAll('.dmv-panel__row .dmv-panel__name'))
            .map(n => (n.textContent ?? '').trim()),
    };
});

console.log('\n== R-DMV slice E ==============================================');

// ── A. la sezione c'e' anche senza singleton ────────────────────────────────
console.log('\n-- A. la sezione, con il singleton ASSENTE -------------------');
const sectionsPresent = await page.evaluate(() =>
    Array.from(document.querySelectorAll('[data-section-key]')).map(n => n.getAttribute('data-section-key')));
note('sezioni dell\'albero', sectionsPresent);
check('A0 positivo di controllo: l\'albero si e\' reso e porta le sue sezioni note',
    sectionsPresent.includes('__section:viewpoints') && sectionsPresent.includes('__section:metamodels'),
    `sezioni ${JSON.stringify(sectionsPresent)}`);
check('A1 il singleton NON esiste: nessuno lo ha creato aprendo il progetto (R-DMV-6)',
    (await singletonExists()) === false, 'idlookup[Pointer_ViewPointDataManager] assente');

const a = await dmvSection();
await page.screenshot({ path: shot('a_empty') });
note('sezione Data Manager', a);
check('A2 la sezione c\'e\' lo stesso, e si chiama «Data Manager» (Q4)',
    !!a && a.label === 'Data Manager', `letto ${JSON.stringify(a?.label)}`);
check('A3 lo stato vuoto e\' quello ratificato',
    !!a && a.empty === 'All classes use the type-derived defaults', `letto ${JSON.stringify(a?.empty)}`);

// ── B. la voce apre il pannello sullo STUB ──────────────────────────────────
console.log('\n-- B. la voce apre il pannello, e non materializza -----------');
await page.locator('[data-section-key="__section:dataManager"] .tree-section__label').first().click();
await page.waitForTimeout(2500);
const b = await railShape();
await page.screenshot({ path: shot('b_stub_panel') });
note('rail dopo il click sulla voce', b);
check('B1 il rail rende il pannello del Data Manager, con il singleton ancora assente',
    !!b && b.headers.includes('Data Manager') && b.headers.includes('Fields'),
    `headers ${JSON.stringify(b?.headers)}`);
check('B2 il segmented «Type» non c\'e\' nemmeno sullo stub',
    !!b && b.hasTypeSegmented === false, `hasTypeSegmented ${b?.hasTypeSegmented}`);
check('B3 APRIRE NON MATERIALIZZA: il singleton non e\' stato creato dal click (R-DMV-6)',
    (await singletonExists()) === false, 'idlookup[Pointer_ViewPointDataManager] ancora assente');
check('B4 la tabella delle feature e\' gia\' popolata dal metamodello, senza nessuna view',
    !!b && ['name', 'note'].every(n => b.featureRows.includes(n)), `righe ${JSON.stringify(b?.featureRows)}`);

// ── C. la prima scrittura materializza i due gradini ────────────────────────
console.log('\n-- C. prima scrittura: i due gradini insieme -----------------');
const rowSelect = page.locator('.dmv-panel__row', { has: page.locator('.dmv-panel__name', { hasText: /^note$/ }) })
    .locator('select').first();
await rowSelect.selectOption('textarea');
await page.waitForTimeout(3000);
const c = await page.evaluate(() => {
    const W: any = (window as any).windoww; const s = W.store.getState();
    const vp = s.idlookup['Pointer_ViewPointDataManager'];
    const views = (s.viewelements ?? [])
        .filter((v: string) => s.idlookup[v]?.viewpoint === 'Pointer_ViewPointDataManager')
        .map((v: string) => ({ id: v, name: s.idlookup[v]?.name, widgets: s.idlookup[v]?.ir?.form?.widgets }));
    return {
        vpExists: !!vp, vpType: vp?.viewpointType, vpExclusive: vp?.isExclusiveView, vpName: vp?.name,
        activeViewpoint: s.viewpoint, views,
    };
});
note('stato dopo la prima scrittura', c);
check('C1 gradino 1: il DViewPoint e\' NATO, `dataManager` e `isExclusiveView: true` (referto §2.3)',
    c.vpExists === true && c.vpType === 'dataManager' && c.vpExclusive === true,
    `exists ${c.vpExists}, type ${c.vpType}, exclusive ${c.vpExclusive}, name ${JSON.stringify(c.vpName)}`);
check('C2 gradino 2: la view di classe e\' nata dentro di lui, con `form.widgets` scritto',
    c.views.length === 1 && c.views[0].widgets?.note === 'textarea', `${JSON.stringify(c.views)}`);
check('C3 il singleton NON e\' diventato il viewpoint attivo',
    c.activeViewpoint !== 'Pointer_ViewPointDataManager', `state.viewpoint = ${JSON.stringify(c.activeViewpoint)}`);

// ── D. l'albero si popola, e non sdoppia ────────────────────────────────────
console.log('\n-- D. l\'albero dopo la configurazione ------------------------');
const d = await dmvSection();
await page.screenshot({ path: shot('d_populated') });
note('sezione Data Manager', d);
check('D1 la classe personalizzata e\' elencata, con la feature toccata sotto',
    !!d && d.rows.includes('Sensor') && d.rows.includes('note'), `righe ${JSON.stringify(d?.rows)}`);
check('D2 l\'override e\' scritto accanto alla feature, col nome del widget e non con la chiave',
    !!d && d.overrides.includes('Code'), `override ${JSON.stringify(d?.overrides)}`);
check('D3 il contatore della sezione conta le classi personalizzate',
    !!d && d.counter === '1', `contatore ${JSON.stringify(d?.counter)}`);

const vpSection = await page.evaluate(() => {
    const root = document.querySelector('[data-section-key="__section:viewpoints"]');
    if (!root) return null;
    return {
        counter: (root.querySelector('.tree-counter')?.textContent ?? '').trim(),
        names: Array.from(root.querySelectorAll('.tree-row__name')).map(n => (n.textContent ?? '').trim()),
    };
});
note('sezione Viewpoints', vpSection);
check('D4 positivo di controllo: la sezione Viewpoints elenca il viewpoint ordinario',
    !!vpSection && vpSection.names.some(n => n.includes('Ordinary syntax')),
    `nomi ${JSON.stringify(vpSection?.names)}`);
check('D5 il singleton NON e\' fra i viewpoint, e il contatore non lo conta (R-DMV-5)',
    !!vpSection && !vpSection.names.some(n => n.includes('Data Manager')) && vpSection.counter === '1',
    `nomi ${JSON.stringify(vpSection?.names)}, contatore ${JSON.stringify(vpSection?.counter)}`);

check('D6 nessun errore di pagina in tutto il giro',
    errors.length === 0, `pageerror: ${JSON.stringify(errors.slice(0, 3))}`);

console.log(`\n== ${pass} PASS, ${fail} FAIL ===================================\n`);
await browser.close();
process.exit(fail === 0 ? 0 : 1);
