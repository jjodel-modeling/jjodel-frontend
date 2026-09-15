/**
 * probe_2026-09-05_rdmv_sliceF_prune — R-DMV slice F: la view svuotata sparisce.
 *
 * Quinta e ultima della serie. Le unita' di `irPrune.test.ts` provano che le
 * funzioni potano; questa prova che il giro completo — pannello, store, albero —
 * ci passa davvero: la view che il pannello ha creato non resta in `idlookup`
 * come guscio, e la classe esce dalla sezione «Data Manager».
 *
 * IL CONFRONTO E' DENTRO IL GIRO: stesso progetto, stessa classe, stessa
 * sessione, con l'override scritto e poi tolto. Il fatto che cambia e' solo
 * quello, il che toglie di mezzo ogni differenza di fixture.
 *
 * Il singleton NON si crea a mano: si arriva dalla voce di sidebar, come l'utente.
 *
 * Con il dev server su (P8: porta 3000, non 3001):
 *   cd frontend && npx tsx ../docs/discovery/harness/probe_2026-09-05_rdmv_sliceF_prune.mts
 */
import playwright from '../../../frontend/node_modules/@playwright/test/index.js';
const { chromium } = playwright as unknown as typeof import('@playwright/test');
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { BASE_URL, NAV_MS, SETTLE_MS, createProject, seed } from '../../../frontend/scripts/smoke/states.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const shot = (n: string) => resolve(HERE, `_tmp_rdmvF_${n}.png`);

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
const warns: string[] = [];
page.on('pageerror', (e) => errors.push(e.message));
// Gli avvisi si raccolgono perche' il pannello INGHIOTTE le eccezioni della scrittura in
// un `console.warn`: senza questo canale, una `delete()` che lancia si legge come «la
// potatura non pota», che e' lo stato che non si e' formato letto come comportamento.
page.on('console', (m) => { if (m.type() === 'warning' || m.type() === 'error') warns.push(m.text()); });

await page.goto(`${BASE_URL}/all-projects`, { waitUntil: 'domcontentloaded', timeout: NAV_MS });
await page.waitForTimeout(SETTLE_MS);
const pid = await createProject(page, `Smoke_RDMVF_${Date.now()}`);
if (!pid) { console.log('FIXTURE FAILED: createProject'); await browser.close(); process.exit(1); }
await page.goto(`${BASE_URL}/#/project?id=${pid}`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(NAV_MS + SETTLE_MS);

const built = await page.evaluate(async () => {
    const w = window as any;
    try {
        const project = w.LProject.getProject();
        if (!project) return { ok: false, error: 'no project' };
        const dM2 = w.DModel.new('DmvfM2', undefined, true);
        const lM2 = w.LModel.fromD(dM2);
        const dG2 = w.DGraph.new(0, dM2.id);
        w.SetFieldAction.new(project.id, 'metamodels', lM2.id, '+=', true);
        w.SetFieldAction.new(project.id, 'graphs', dG2.id, '+=', true);
        w.SetFieldAction.new(dG2.id, 'graphStyle', 'v2-flow', '', false);
        const dPkg = lM2.addChild('package');
        const lPkg = w.LPackage.fromD(dPkg);
        lPkg.name = 'dmvf';
        const lSensor = w.LClass.fromD(lPkg.addClass('Sensor'));
        lSensor.addAttribute('name', 'Pointer_ESTRING');
        lSensor.addAttribute('note', 'Pointer_ESTRING');
        w.DVertex.new(lSensor.id, dG2.id);
        const dM1 = w.DModel.new('DmvfM1', dM2.id, false, true);
        const dG1 = w.DGraph.new(0, dM1.id);
        w.SetFieldAction.new(dG1.id, 'graphStyle', 'v2-flow', '', false);
        w.SetFieldAction.new(project.id, 'models', dM1.id, '+=', true);
        w.SetRootFieldAction.new('graphs', dG1.id, '+=', true);
        w.SetFieldAction.new(project.id, 'graphs', dG1.id, '+=', true);
        return { ok: true, m1: dM1.id };
    } catch (e) { return { ok: false, error: e instanceof Error ? `${e.message}\n${e.stack}` : String(e) }; }
});
if (!built.ok) { console.log('FIXTURE FAILED: ' + built.error); await browser.close(); process.exit(1); }
await page.waitForTimeout(2500);

await page.evaluate((m: string) => {
    const w = window as any;
    try { w.DockManager.open2(w.LModel.fromPointer(m)); } catch { /* misurato sotto */ }
}, built.m1);
await page.waitForTimeout(6000);

/** Le view del singleton in `idlookup`, e le righe che l'albero ne ricava. */
const state = () => page.evaluate(() => {
    const W: any = (window as any).windoww; const s = W.store.getState();
    const ids = (s.viewelements ?? []).filter((v: string) =>
        s.idlookup[v]?.viewpoint === 'Pointer_ViewPointDataManager');
    const section = document.querySelector('[data-section-key="__section:dataManager"]');
    const content = section?.querySelector('[data-section-content="__section:dataManager"]');
    return {
        vpExists: !!s.idlookup['Pointer_ViewPointDataManager'],
        views: ids.map((v: string) => ({
            id: v,
            inLookup: !!s.idlookup[v],
            ir: s.idlookup[v]?.ir ? Object.keys(s.idlookup[v].ir).sort() : null,
        })),
        counter: (section?.querySelector('.tree-counter')?.textContent ?? '').trim(),
        empty: (section?.querySelector('.tree-empty-dmv-label')?.textContent ?? '').trim(),
        rows: content
            ? Array.from(content.querySelectorAll('.tree-row__name, .tree-feature__name'))
                .map(n => (n.textContent ?? '').trim()).filter(Boolean)
            : [],
    };
});

console.log('\n== R-DMV slice F ==============================================');

// Dalla voce di sidebar, come l'utente.
await page.locator('[data-section-key="__section:dataManager"] .tree-section__label').first().click();
await page.waitForTimeout(2500);

const rowSelect = page.locator('.dmv-panel__row', { has: page.locator('.dmv-panel__name', { hasText: /^note$/ }) })
    .locator('select').first();

console.log('\n-- A. scritto: la view c\'e\', e la classe compare ------------');
await rowSelect.selectOption('textarea');
await page.waitForTimeout(3000);
const a = await state();
await page.screenshot({ path: shot('a_written') });
note('stato dopo la scrittura', a);
check('A0 positivo di controllo: il singleton e\' nato e porta UNA view di classe',
    a.vpExists === true && a.views.length === 1 && a.views[0].inLookup === true,
    `${JSON.stringify(a.views)}`);
check('A1 la view porta la `form`, e l\'albero elenca la classe con la feature',
    !!a.views[0]?.ir?.includes('form') && a.rows.includes('Sensor') && a.rows.includes('note'),
    `ir ${JSON.stringify(a.views[0]?.ir)}, righe ${JSON.stringify(a.rows)}`);

console.log('\n-- B. tolto l\'override: la view SPARISCE --------------------');
// Il valore del `<select>` PRIMA e DOPO. Un controllo React che torna al valore di prima
// e' il segno che l'`onChange` e' partito e la scrittura non ha attecchito: e' cosi' che il
// no-op di `lView.delete()` si e' fatto vedere, invece che come un'eccezione.
note('select prima del reset', await rowSelect.inputValue());
await rowSelect.selectOption('');
await page.waitForTimeout(1500);
note('select dopo il reset', await rowSelect.inputValue());
await page.waitForTimeout(3000);
const b = await state();
await page.screenshot({ path: shot('b_pruned') });
note('stato dopo il reset', b);
check('B1 la view non e\' rimasta come guscio: nessuna view del singleton in `idlookup`',
    b.views.length === 0, `${JSON.stringify(b.views)}`);
check('B2 la classe e\' sparita dall\'albero, e torna lo stato vuoto (R-DMV-5)',
    !b.rows.includes('Sensor') && b.counter === '0'
    && b.empty === 'All classes use the type-derived defaults',
    `righe ${JSON.stringify(b.rows)}, contatore ${JSON.stringify(b.counter)}, vuoto ${JSON.stringify(b.empty)}`);
check('B3 il VIEWPOINT resta: si pota la view, non il singleton (R-DMV-6 vale una volta sola)',
    b.vpExists === true, `vpExists ${b.vpExists}`);

console.log('\n-- C. riscrivere ricrea, e non duplica ----------------------');
await rowSelect.selectOption('textarea');
await page.waitForTimeout(3000);
const c = await state();
note('stato dopo la riscrittura', c);
check('C1 la view rinasce, UNA sola, e la classe torna nell\'albero',
    c.views.length === 1 && c.rows.includes('Sensor') && c.counter === '1',
    `${JSON.stringify(c.views)}, righe ${JSON.stringify(c.rows)}`);

note('avvisi di console del pannello', warns.filter(w => w.includes('[dataManager]')));
check('C2 nessun errore di pagina in tutto il giro',
    errors.length === 0, `pageerror: ${JSON.stringify(errors.slice(0, 3))}`);

console.log(`\n== ${pass} PASS, ${fail} FAIL ===================================\n`);
await browser.close();
process.exit(fail === 0 ? 0 : 1);
