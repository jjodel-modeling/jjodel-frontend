/**
 * probe_2026-09-09_albero_tre_concern — i tre concern sotto VIEWPOINTS (R-VAL-19,
 * emendata da R-VAL-19-bis), misurati sulla STRUTTURA RESA.
 *
 * ── Perche' una sonda e non dei test ─────────────────────────────────────────
 *
 * L'albero e' JSX annidato a mano con `depth` LETTERALI: un numero sbagliato non e' un
 * errore di tipo, e' un rientro. Una rete che leggesse `depth={3}` dal sorgente
 * proverebbe che la costante e' scritta, non che la riga ne esce — e i test unitari non
 * possono montare il componente (`TreeViewContent.tsx` importa il barrel di `editor-v2/`,
 * che arriva a monaco, che dereferenzia `window` all'import; `vitest.config.ts` dichiara
 * `environment: 'node'`). Qui si misura il `padding-left` calcolato e il contenimento nel
 * DOM: il pixel, non la costante (P11).
 *
 * ── Cosa misura ──────────────────────────────────────────────────────────────
 *
 *  A. I TRE CONCERN CI SONO ANCHE A ZERO, dentro «Viewpoints» e non accanto, ciascuno
 *     con la riga che dice cosa ci andrebbe. Positivo di controllo: «Metamodels» e
 *     «Documentation» ci sono, cosi' «il concern c'e'» non si confonde con «l'albero si
 *     e' reso».
 *  B. LA PROFONDITA' E' QUELLA, misurata sul rientro calcolato e non sul sorgente. I tre
 *     header a depth 2, le righe di stato a depth 3, e il positivo di controllo su
 *     «Metamodels» a depth 1 — che discrimina, perche' se tutto fosse a 0 il confronto
 *     fallirebbe (P12).
 *  C. IL CLIC SOPRAVVIVE ALLO SPOSTAMENTO. L'etichetta del Data Manager e la sua riga di
 *     stato selezionano ancora il singleton, e il rail apre il pannello sullo stub.
 *  D. IL CONTATORE CONTA VIEWPOINT E NON CLASSI, con la fixture che DISCRIMINA: due
 *     classi personalizzate, contatore che resta 1. Sotto la semantica vecchia direbbe 2.
 *  E. LE REGOLE STANNO IN PIANO SOTTO IL LORO VIEWPOINT, con la classe di contesto nella
 *     colonna dove per le view compare «Vertex», e il clic apre l'ambiente di authoring.
 *
 * Con il dev server su (P8: porta 3000, non 3001):
 *   cd frontend && npx tsx ../docs/discovery/harness/probe_2026-09-09_albero_tre_concern.mts
 */
import playwright from '../../../frontend/node_modules/@playwright/test/index.js';
const { chromium } = playwright as unknown as typeof import('@playwright/test');
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { BASE_URL, NAV_MS, SETTLE_MS, createProject, seed } from '../../../frontend/scripts/smoke/states.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const shot = (n: string) => resolve(HERE, `_tmp_concern_${n}.png`);

let pass = 0, fail = 0;
const check = (label: string, ok: boolean, detail: string) => {
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}\n        ${detail}`);
    ok ? pass++ : fail++;
};
const note = (label: string, d: unknown) =>
    console.log(`  MISURA  ${label}\n        ${typeof d === 'string' ? d : JSON.stringify(d)}`);

const KEY = {
    viewpoints: '__section:viewpoints',
    syntax: '__section:viewpoints/syntax',
    dataManager: '__section:dataManager',
    validation: '__section:viewpoints/validation',
    metamodels: '__section:metamodels',
    documentation: '__section:documentation',
};

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1700, height: 1000 } });
await ctx.addInitScript(() => { (window as any).__name = (f: any) => f; });
await seed(ctx, true);
const page = await ctx.newPage();
const errors: string[] = [];
page.on('pageerror', (e) => errors.push(e.message));

await page.goto(`${BASE_URL}/all-projects`, { waitUntil: 'domcontentloaded', timeout: NAV_MS });
await page.waitForTimeout(SETTLE_MS);
const pid = await createProject(page, `Smoke_Concern_${Date.now()}`);
if (!pid) { console.log('FIXTURE FAILED: createProject'); await browser.close(); process.exit(1); }
await page.goto(`${BASE_URL}/#/project?id=${pid}`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(NAV_MS + SETTLE_MS);

// Fixture minima: un metamodello con DUE classi. Nessun viewpoint di sintassi, nessun
// singleton del Data Manager, nessun viewpoint di validazione — cioe' lo stato in cui i
// tre concern valgono zero, che e' il soggetto del blocco A.
const built = await page.evaluate(async () => {
    const w = window as any;
    try {
        const project = w.LProject.getProject();
        if (!project) return { ok: false, error: 'no project' };
        const dM2 = w.DModel.new('ConcernM2', undefined, true);
        const lM2 = w.LModel.fromD(dM2);
        const dG2 = w.DGraph.new(0, dM2.id);
        w.SetFieldAction.new(project.id, 'metamodels', lM2.id, '+=', true);
        w.SetFieldAction.new(project.id, 'graphs', dG2.id, '+=', true);
        w.SetFieldAction.new(dG2.id, 'graphStyle', 'v2-flow', '', false);
        const dPkg = lM2.addChild('package');
        const lPkg = w.LPackage.fromD(dPkg);
        lPkg.name = 'concern';
        const lSensor = w.LClass.fromD(lPkg.addClass('Sensor'));
        lSensor.addAttribute('name', 'Pointer_ESTRING');
        lSensor.addAttribute('note', 'Pointer_ESTRING');
        const lGauge = w.LClass.fromD(lPkg.addClass('Gauge'));
        lGauge.addAttribute('unit', 'Pointer_ESTRING');
        w.DVertex.new(lSensor.id, dG2.id);
        w.DVertex.new(lGauge.id, dG2.id);
        const dM1 = w.DModel.new('ConcernM1', dM2.id, false, true);
        const dG1 = w.DGraph.new(0, dM1.id);
        w.SetFieldAction.new(dG1.id, 'graphStyle', 'v2-flow', '', false);
        w.SetFieldAction.new(project.id, 'models', dM1.id, '+=', true);
        w.SetRootFieldAction.new('graphs', dG1.id, '+=', true);
        w.SetFieldAction.new(project.id, 'graphs', dG1.id, '+=', true);
        return { ok: true, m1: dM1.id, m2: dM2.id, sensor: lSensor.id, gauge: lGauge.id };
    } catch (e) { return { ok: false, error: e instanceof Error ? `${e.message}\n${e.stack}` : String(e) }; }
});
if (!built.ok) { console.log('FIXTURE FAILED: ' + built.error); await browser.close(); process.exit(1); }
await page.waitForTimeout(2500);

// Il rail con l'albero si vede aprendo un editor.
await page.evaluate((m: string) => {
    const w = window as any;
    try { w.DockManager.open2(w.LModel.fromPointer(m)); } catch { /* misurato sotto */ }
}, built.m1!);
await page.waitForTimeout(6000);

/** Una sezione dell'albero, letta dal DOM: dove sta, quanto rientra, cosa contiene. */
const section = (key: string) => page.evaluate((k: string) => {
    const root = document.querySelector(`[data-section-key="${k}"]`);
    if (!root) return null;
    const header = root.querySelector('.tree-section__header') as HTMLElement | null;
    const content = root.querySelector(`[data-section-content="${k}"]`);
    const vpContent = document.querySelector('[data-section-content="__section:viewpoints"]');
    return {
        label: (root.querySelector('.tree-section__label')?.textContent ?? '').trim(),
        counter: (root.querySelector('.tree-counter')?.textContent ?? '').trim(),
        // Il rientro CALCOLATO, non la costante nel sorgente: e' il pixel.
        padLeft: header ? parseFloat(getComputedStyle(header).paddingLeft) : -1,
        // Contenimento vero nel DOM: e' l'affermazione strutturale di R-VAL-19.
        insideViewpoints: !!vpContent && k !== '__section:viewpoints' && vpContent.contains(root),
        emptyLine: (content?.querySelector('.tree-empty-concern-label, .tree-empty-dmv-label')?.textContent ?? '').trim(),
        emptyPadLeft: (() => {
            const el = content?.querySelector('.tree-empty-concern, .tree-empty-dmv') as HTMLElement | null;
            return el ? parseFloat(getComputedStyle(el).paddingLeft) : -1;
        })(),
        rows: Array.from(content?.querySelectorAll('.tree-row__name') ?? []).map(n => (n.textContent ?? '').trim()),
        types: Array.from(content?.querySelectorAll('.tree-feature__type') ?? []).map(n => (n.textContent ?? '').trim()),
    };
}, key);

console.log('\n== A. i tre concern a zero, dentro VIEWPOINTS ==========================\n');

const sectionKeys = await page.evaluate(() =>
    Array.from(document.querySelectorAll('[data-section-key]')).map(n => n.getAttribute('data-section-key')));
note('sezioni dell\'albero', sectionKeys);
check('A0 positivo di controllo: l\'albero si e\' reso, con le sezioni che non cambiano in questo giro',
    sectionKeys.includes(KEY.metamodels) && sectionKeys.includes(KEY.documentation),
    `sezioni ${JSON.stringify(sectionKeys)}`);

const a = { syntax: await section(KEY.syntax), dmv: await section(KEY.dataManager), val: await section(KEY.validation) };
await page.screenshot({ path: shot('a_zero') });
note('SYNTAX', a.syntax); note('DATA MANAGER', a.dmv); note('VALIDATION', a.val);

check('A1 i tre concern esistono con zero contenuto (R-VAL-19: si vedono anche a zero)',
    !!a.syntax && !!a.dmv && !!a.val,
    `syntax=${!!a.syntax} dataManager=${!!a.dmv} validation=${!!a.val}`);
check('A2 si chiamano Syntax, Data Manager, Validation',
    a.syntax?.label === 'Syntax' && a.dmv?.label === 'Data Manager' && a.val?.label === 'Validation',
    `etichette ${JSON.stringify([a.syntax?.label, a.dmv?.label, a.val?.label])}`);
check('A3 tutti e tre stanno DENTRO «Viewpoints», non accanto (il cuore di R-VAL-19)',
    a.syntax?.insideViewpoints === true && a.dmv?.insideViewpoints === true && a.val?.insideViewpoints === true,
    `contenuti ${JSON.stringify([a.syntax?.insideViewpoints, a.dmv?.insideViewpoints, a.val?.insideViewpoints])}`);
check('A4 ciascuno porta la riga che dice cosa ci andrebbe',
    !!a.syntax?.emptyLine && !!a.dmv?.emptyLine && !!a.val?.emptyLine,
    `righe ${JSON.stringify([a.syntax?.emptyLine, a.dmv?.emptyLine, a.val?.emptyLine])}`);
check('A5 la riga del Data Manager e\' quella ratificata da R-DMV-5, alla lettera',
    a.dmv?.emptyLine === 'All classes use the type-derived defaults',
    `letto ${JSON.stringify(a.dmv?.emptyLine)}`);
check('A6 i tre contatori dicono 0, e lo dicono (uno zero si vede, non si omette)',
    a.syntax?.counter === '0' && a.dmv?.counter === '0' && a.val?.counter === '0',
    `contatori ${JSON.stringify([a.syntax?.counter, a.dmv?.counter, a.val?.counter])}`);

// Secondo scatto per la verifica visiva: lo stato a zero, con «Metamodels» chiuso perche'
// aperto spinge i tre concern sotto il bordo. Il chevron e' l'unica cosa che si tocca, e
// nessuna asserzione legge l'apertura di quel ramo.
await page.locator(`[data-section-key="${KEY.metamodels}"] .tree-node__toggle`).first().click();
await page.waitForTimeout(1000);
await page.screenshot({ path: shot('z_rail_zero'), clip: { x: 1180, y: 60, width: 520, height: 320 } });
await page.locator(`[data-section-key="${KEY.metamodels}"] .tree-node__toggle`).first().click();
await page.waitForTimeout(800);

console.log('\n== B. la profondita\', misurata sul rientro calcolato ==================\n');

const mm = await section(KEY.metamodels);
const vp = await section(KEY.viewpoints);
note('rientri', { metamodels: mm?.padLeft, viewpoints: vp?.padLeft,
    syntax: a.syntax?.padLeft, dataManager: a.dmv?.padLeft, validation: a.val?.padLeft,
    righeDiStato: [a.syntax?.emptyPadLeft, a.dmv?.emptyPadLeft, a.val?.emptyPadLeft] });

// TREE_INDENT_STEP = 12px per livello, senza eccezioni.
check('B0 positivo di controllo: i livelli noti rientrano diversamente (se fossero tutti 0 il confronto non direbbe niente)',
    mm?.padLeft === 12 && vp?.padLeft === 12,
    `metamodels=${mm?.padLeft} viewpoints=${vp?.padLeft}, attesi 12 (depth 1)`);
check('B1 i tre concern rientrano a depth 2 — 24px, non 12',
    a.syntax?.padLeft === 24 && a.dmv?.padLeft === 24 && a.val?.padLeft === 24,
    `rientri ${JSON.stringify([a.syntax?.padLeft, a.dmv?.padLeft, a.val?.padLeft])}, attesi 24`);
check('B2 le tre righe di stato rientrano a depth 3 — 36px: un numero dimenticato si vede qui',
    a.syntax?.emptyPadLeft === 36 && a.dmv?.emptyPadLeft === 36 && a.val?.emptyPadLeft === 36,
    `rientri ${JSON.stringify([a.syntax?.emptyPadLeft, a.dmv?.emptyPadLeft, a.val?.emptyPadLeft])}, attesi 36`);

console.log('\n== C. il clic del Data Manager sopravvive allo spostamento =============\n');

const selectedView = () => page.evaluate(() =>
    (window as any).windoww.store.getState()._lastSelected?.view ?? '');
const singletonExists = () => page.evaluate(() =>
    !!(window as any).windoww.store.getState().idlookup['Pointer_ViewPointDataManager']);

check('C0 positivo di controllo: prima del clic nessun singleton e nessuna selezione di view',
    (await singletonExists()) === false && (await selectedView()) !== 'Pointer_ViewPointDataManager',
    `singleton=${await singletonExists()} selezione=${JSON.stringify(await selectedView())}`);

await page.locator(`[data-section-key="${KEY.dataManager}"] .tree-section__label`).first().click();
await page.waitForTimeout(1200);
const afterLabel = await selectedView();
const panelHeaders = await page.evaluate(() => Array.from(
    document.querySelectorAll('.workbench-properties__section-header')).map(n => (n.textContent ?? '').trim()));
await page.screenshot({ path: shot('c_click_label') });
note('selezione dopo il clic sull\'etichetta', { afterLabel, panelHeaders });
check('C1 l\'etichetta seleziona ancora il singleton, un livello piu\' in basso di prima',
    afterLabel === 'Pointer_ViewPointDataManager', `selezione ${JSON.stringify(afterLabel)}`);
check('C2 il rail apre il pannello sullo STUB, e il singleton continua a non esistere (R-DMV-6)',
    panelHeaders.includes('Data Manager') && (await singletonExists()) === false,
    `intestazioni ${JSON.stringify(panelHeaders)}, singleton ${await singletonExists()}`);

// La riga di stato e' l'altra porta, ed e' quella che uno spostamento perde piu'
// facilmente: sta un livello piu' dentro e nessun errore di tipo la difende.
await page.evaluate(() => {
    const w = window as any;
    w.SetRootFieldAction.new('_lastSelected', { node: '', view: '', modelElement: '' });
});
await page.waitForTimeout(600);
check('C3 positivo di controllo: la selezione e\' stata davvero azzerata prima della seconda porta',
    (await selectedView()) !== 'Pointer_ViewPointDataManager', `selezione ${JSON.stringify(await selectedView())}`);
await page.locator(`[data-section-content="${KEY.dataManager}"] .tree-empty-dmv`).first().click();
await page.waitForTimeout(1000);
check('C4 anche la riga di stato seleziona il singleton',
    (await selectedView()) === 'Pointer_ViewPointDataManager', `selezione ${JSON.stringify(await selectedView())}`);

console.log('\n== D. i contatori contano viewpoint, con fixture che discrimina ========\n');

// DUE classi personalizzate e UN viewpoint: sotto la semantica vecchia il contatore
// direbbe 2, sotto quella di R-VAL-19-bis dice 1. La fixture separa le due letture (P12).
// Il singleton e le due view di classe si creano come le crea il pannello
// (`DataManagerViewpointPanel.createClassView`): `newVP` per il gradino 1, `new2` per il
// gradino 2, due chiamate NUDE, mai in una TRANSACTION esterna (CLAUDE.md §3.3).
const populated = await page.evaluate((ids: { sensor: string; gauge: string }) => {
    const w = window as any;
    try {
        const vp = w.DViewPoint.newVP('Data Manager', (d: any) => {
            d.viewpointType = 'dataManager';
            d.isValidation = false;
        }, true, 'Pointer_ViewPointDataManager');
        const lookup = w.windoww.store.getState().idlookup;
        const mk = (classId: string, feature: string) => {
            const name = lookup[classId]?.name ?? classId;
            const d = w.DViewElement.new2(name, '', vp, (e: any) => {
                e.appliableTo = 'Vertex';
                e.appliableToClasses = ['DObject'];
                e.ir = {
                    irVersion: 'ir-1.2', kind: 'vertex', metaclasses: [name],
                    authoringMetaclassPins: { [name]: classId }, priority: 0, exclusive: true,
                    shape: { form: 'rect' }, form: { widgets: { [feature]: 'code' } },
                };
            }, true, `dmv-class-${classId}`);
            return d.id;
        };
        return { ok: true, a: mk(ids.sensor, 'note'), b: mk(ids.gauge, 'unit'), vp: vp.id };
    } catch (e) { return { ok: false, error: e instanceof Error ? `${e.message}\n${e.stack}` : String(e) }; }
}, { sensor: built.sensor!, gauge: built.gauge! });
note('due classi personalizzate', populated);
await page.waitForTimeout(2500);

const d = await section(KEY.dataManager);
const dVp = await section(KEY.viewpoints);
await page.screenshot({ path: shot('d_counters') });
note('DATA MANAGER popolato', d); note('VIEWPOINTS', dVp);
check('D0 positivo di controllo: le due classi sono davvero elencate, quindi il conteggio classi varrebbe 2',
    !!d && d.rows.filter(r => r === 'Sensor' || r === 'Gauge').length === 2,
    `righe ${JSON.stringify(d?.rows)}`);
check('D1 il contatore del concern dice 1 — VIEWPOINT, non classi (R-VAL-19-bis (b))',
    d?.counter === '1', `contatore ${JSON.stringify(d?.counter)}, atteso 1 con 2 classi in elenco`);
check('D2 il totale di «Viewpoints» conta il Data Manager una volta sola',
    dVp?.counter === '1', `totale ${JSON.stringify(dVp?.counter)} (0 sintassi + 1 Data Manager + 0 validazione)`);

console.log('\n== E. le regole in piano, con la classe di contesto ====================\n');

// `DValidationViewpoint.new()` e `DValidationRule.new(...)`, come le chiama lo Step 4
// dell'authoring: `ensureValidationViewpoint` non e' esposta sul globale.
const rules = await page.evaluate((ids: { sensor: string; gauge: string }) => {
    const w = window as any;
    try {
        const vp = w.DValidationViewpoint.new();
        const r1 = w.DValidationRule.new(vp.id, 'named', ids.sensor, 'name <> ""', 'Sensor needs a name');
        const r2 = w.DValidationRule.new(vp.id, 'has unit', ids.gauge, 'unit <> ""', 'Gauge needs a unit');
        return { ok: true, vp: vp.id, r1: r1.id, r2: r2.id };
    } catch (e) { return { ok: false, error: e instanceof Error ? `${e.message}\n${e.stack}` : String(e) }; }
}, { sensor: built.sensor!, gauge: built.gauge! });
note('viewpoint di validazione e due regole', rules);
await page.waitForTimeout(2500);

const v = await section(KEY.validation);
const vVp = await section(KEY.viewpoints);
await page.screenshot({ path: shot('e_validation') });
note('VALIDATION', v); note('VIEWPOINTS', vVp);
check('E0 positivo di controllo: il viewpoint di validazione esiste nello store',
    rules.ok === true && (await page.evaluate((id: string) =>
        !!(window as any).windoww.store.getState().idlookup[id], rules.vp!)),
    `creato ${JSON.stringify(rules.ok)}`);
check('E1 il concern non dice piu\' «nessun viewpoint di validazione», e conta 1',
    v?.counter === '1' && !v?.emptyLine, `contatore ${JSON.stringify(v?.counter)}, riga ${JSON.stringify(v?.emptyLine)}`);
check('E2 il viewpoint compare col suo nome, e le due regole sotto in piano',
    !!v && v.rows.includes('Validation') && v.rows.includes('named') && v.rows.includes('has unit'),
    `righe ${JSON.stringify(v?.rows)}`);
check('E3 la classe di contesto sta nella colonna dove per le view compare «Vertex»',
    !!v && v.types.includes('Sensor') && v.types.includes('Gauge'),
    `colonna tipo ${JSON.stringify(v?.types)}`);
check('E4 il totale di «Viewpoints» somma i concern: 0 sintassi + 1 Data Manager + 1 validazione',
    vVp?.counter === '2', `totale ${JSON.stringify(vVp?.counter)}`);

// L'albero nomina e naviga: il clic apre l'ambiente, non modifica la regola.
//
// L'ascoltatore si INSTALLA PRIMA del clic e si attende DOPO. Awaitarlo prima, come
// faceva la prima stesura di questa sonda, blocca fino al timeout e legge sempre la
// stringa vuota: un rosso che misurava la sonda, non il soggetto. Misurato in questo giro.
//
// La stringa dell'evento e' letterale perche' qui si osserva il FILO, cioe' il valore che
// `events/registry.ts` definisce e che il browser vede davvero; la regola 25 vieta i
// letterali nel codice dell'applicazione, non in una misura del suo comportamento.
const openedPromise = page.evaluate(() => new Promise<string>((res) => {
    const h = (e: Event) => { res(JSON.stringify((e as CustomEvent).detail)); };
    window.addEventListener('jjodel:validation-rules-open', h, { once: true });
    setTimeout(() => res(''), 6000);
}));
await page.waitForTimeout(400);
const clickRule = page.locator(`[data-section-content="${KEY.validation}"] [data-element-id="${rules.r1}"] .tree-row__content`).first();
await clickRule.click();
const detail = await openedPromise;
note('detail dell\'evento di apertura', detail);
check('E5 cliccare una regola apre l\'ambiente di authoring, sul metamodello della sua classe di contesto',
    detail.includes('metamodelId') && detail.includes(built.m2!),
    `detail ${JSON.stringify(detail)}`);

const ruleRowHtml = await page.evaluate((id: string) =>
    document.querySelector(`[data-element-id="${id}"]`)?.innerHTML ?? '', rules.r1!);
check('E6 nessun authoring nella riga: niente spunta Active, niente rename in riga (R-VAL-19)',
    !ruleRowHtml.includes('checkbox') && !ruleRowHtml.includes('role="switch"') && !ruleRowHtml.includes('rename-input'),
    `html della riga lungo ${ruleRowHtml.length}, senza controlli di scrittura`);

check('F1 nessun errore di pagina in tutto il giro',
    errors.length === 0, `pageerror: ${JSON.stringify(errors.slice(0, 3))}`);

// Lo scatto per la verifica visiva, dopo tutte le asserzioni e senza toccarne nessuna:
// «Metamodels» si chiude solo perche' il ramo, aperto, spinge i tre concern sotto il
// bordo del pannello. Nessuna misura dipende da questo stato.
//
// Prima si chiude l'ambiente delle regole, che E5 ha aperto: il suo backdrop intercetta i
// click e il chevron non si raggiunge (misurato, la prima stesura andava in timeout).
await page.keyboard.press('Escape');
await page.waitForTimeout(800);
await page.locator(`[data-section-key="${KEY.metamodels}"] .tree-node__toggle`).first().click();
await page.waitForTimeout(1200);
await page.screenshot({ path: shot('z_rail'), clip: { x: 1180, y: 60, width: 520, height: 460 } });

console.log(`\n== ${pass} PASS, ${fail} FAIL ===================================\n`);
await browser.close();
process.exit(fail === 0 ? 0 : 1);
