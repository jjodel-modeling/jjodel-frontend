/**
 * probe_2026-09-04_rdmv_sliceD_rail_panel — R-DMV slice D:
 * il rail del singleton, e cio' che il rail NON deve poter fare.
 *
 * Terza di una serie: `..._rvp_slice1_manager_columns` misura l'ordinamento delle
 * colonne, `..._rdmv_sliceC_singleton_read` misura DA QUALE viewpoint il manager
 * legge, questa misura CHI SCRIVE e con quale UI.
 *
 * ── Cosa misura ──────────────────────────────────────────────────────────────
 *
 *  A. IL PANNELLO. Selezionato il singleton nel rail, si rende
 *     `DataManagerViewpointPanel` e non `ViewpointProperties`: Name e Form theme
 *     ci sono, il segmented «Type» NON c'e', e non c'e' nemmeno l'hint «Applies
 *     when this viewpoint is active», che sul singleton sarebbe sempre visibile e
 *     sempre falso. Il controllo positivo e' un viewpoint ORDINARIO selezionato
 *     nello stesso rail: li' il segmented c'e'. Senza quel confronto «assente»
 *     non si distingue da «il rail non si e' reso».
 *
 *  B. LA SCRITTURA E LA MATERIALIZZAZIONE. Cambiato il widget di una feature, il
 *     secondo gradino di R-DMV-6 avviene: nel singleton compare una view di
 *     classe che PRIMA non c'era, con `form.widgets` scritto. Misurato lo STATO,
 *     non il click: il valore letto e' quello del `SetFieldAction`, non quello del
 *     `<select>`.
 *
 *  C. IL NEGATIVO. Il singleton non e' fra le opzioni del picker della toolbar e
 *     non compare nella lista VIEWPOINTS della dashboard di progetto — che e' come
 *     non e' duplicabile ne' cancellabile, perche' i bottoni Duplicate/Delete
 *     stanno su quelle righe. Ogni negativo ha accanto il positivo che dimostra
 *     che la sorgente era popolata: senza, «assente» non si distingue da «lista
 *     vuota».
 *
 * Il singleton si crea A MANO come nella sonda della slice C: la porta d'ingresso
 * dell'utente e' la voce di sidebar della slice E, che non esiste ancora. Il primo
 * gradino della materializzazione (il DViewPoint) resta quindi non misurato qui, ed
 * e' dichiarato: questa sonda misura il secondo.
 *
 * Con il dev server su (P8: porta 3000, non 3001):
 *   cd frontend && npx tsx ../docs/discovery/harness/probe_2026-09-04_rdmv_sliceD_rail_panel.mts
 */
import playwright from '../../../frontend/node_modules/@playwright/test/index.js';
const { chromium } = playwright as unknown as typeof import('@playwright/test');
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { BASE_URL, NAV_MS, SETTLE_MS, createProject, seed } from '../../../frontend/scripts/smoke/states.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const shot = (n: string) => resolve(HERE, `_tmp_rdmvD_${n}.png`);

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
const pid = await createProject(page, `Smoke_RDMVD_${Date.now()}`);
if (!pid) { console.log('FIXTURE FAILED: createProject'); await browser.close(); process.exit(1); }
await page.goto(`${BASE_URL}/#/project?id=${pid}`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(NAV_MS + SETTLE_MS);

/** Una metaclasse con due `EString` (widget derivato `text`, alternative offerte) e
 *  un `EBoolean` (derivato `checkbox`): due derivazioni diverse, non una sola. */
const built = await page.evaluate(async () => {
    const w = window as any;
    try {
        const project = w.LProject.getProject();
        if (!project) return { ok: false, error: 'no project' };
        const dM2 = w.DModel.new('DmvdM2', undefined, true);
        const lM2 = w.LModel.fromD(dM2);
        const dG2 = w.DGraph.new(0, dM2.id);
        w.SetFieldAction.new(project.id, 'metamodels', lM2.id, '+=', true);
        w.SetFieldAction.new(project.id, 'graphs', dG2.id, '+=', true);
        w.SetFieldAction.new(dG2.id, 'graphStyle', 'v2-flow', '', false);
        const dPkg = lM2.addChild('package');
        const lPkg = w.LPackage.fromD(dPkg);
        lPkg.name = 'dmvd';
        const lSensor = w.LClass.fromD(lPkg.addClass('Sensor'));
        lSensor.addAttribute('name', 'Pointer_ESTRING');
        lSensor.addAttribute('note', 'Pointer_ESTRING');
        lSensor.addAttribute('active', 'Pointer_EBOOLEAN');
        w.DVertex.new(lSensor.id, dG2.id);
        const dM1 = w.DModel.new('DmvdM1', dM2.id, false, true);
        const dG1 = w.DGraph.new(0, dM1.id);
        w.SetFieldAction.new(dG1.id, 'graphStyle', 'v2-flow', '', false);
        w.SetFieldAction.new(project.id, 'models', dM1.id, '+=', true);
        w.SetRootFieldAction.new('graphs', dG1.id, '+=', true);
        w.SetFieldAction.new(project.id, 'graphs', dG1.id, '+=', true);
        return { ok: true, m2: dM2.id, m1: dM1.id, cls: lSensor.id };
    } catch (e) { return { ok: false, error: e instanceof Error ? `${e.message}\n${e.stack}` : String(e) }; }
});
if (!built.ok) { console.log('FIXTURE FAILED: ' + built.error); await browser.close(); process.exit(1); }
await page.waitForTimeout(2500);

/** Il singleton, creato come lo creera' `ensureDataManagerViewpoint`, e un viewpoint
 *  ORDINARIO accanto: e' il positivo di controllo di A. */
const madeVps = await page.evaluate(() => {
    const w = window as any; const W: any = w.windoww ?? w;
    try {
        w.DViewPoint.newVP('Data Manager', (vp: any) => {
            vp.viewpointType = 'dataManager';
            vp.isValidation = false;
        }, true, 'Pointer_ViewPointDataManager');
        w.DViewPoint.newVP('Ordinary syntax', (vp: any) => {
            vp.viewpointType = 'syntax';
            vp.isExclusiveView = true;
            vp.isValidation = false;
        }, true, 'Pointer_DMVD_ORDINARY');
        const s = W.store.getState();
        return {
            singleton: !!s.idlookup['Pointer_ViewPointDataManager'],
            ordinary: !!s.idlookup['Pointer_DMVD_ORDINARY'],
        };
    } catch (e) { return { error: e instanceof Error ? `${e.message}\n${e.stack}` : String(e) }; }
});
note('viewpoint creati', madeVps);
await page.waitForTimeout(1500);

const selectInRail = async (vpId: string) => {
    const r = await page.evaluate((id: string) => {
        const w = window as any; const W: any = w.windoww ?? w;
        try {
            const d = W.store.getState().idlookup[id];
            if (!d) return 'viewpoint non in idlookup';
            w.DockManager.openViewpoint(d);
            return 'ok';
        } catch (e) { return e instanceof Error ? e.message : String(e); }
    }, vpId);
    await page.waitForTimeout(3500);
    return r;
};

/** Cosa il rail sta rendendo, letto dal DOM: i due pannelli si distinguono per il
 *  titolo di sezione e per la presenza del segmented «Type». */
const railShape = () => page.evaluate(() => {
    const root = document.querySelector('.properties-tab .workbench-properties')
        ?? document.querySelector('.workbench-properties');
    if (!root) return null;
    return {
        headers: Array.from(root.querySelectorAll('.workbench-properties__section-header'))
            .map(h => (h.textContent ?? '').trim()),
        labels: Array.from(root.querySelectorAll('.wp-field__label')).map(l => (l.textContent ?? '').trim()),
        hasTypeSegmented: !!root.querySelector('.wp-type-segmented'),
        hasHint: Array.from(root.querySelectorAll('.wp-field__hint'))
            .some(h => (h.textContent ?? '').includes('Applies when this viewpoint is active')),
        featureRows: Array.from(root.querySelectorAll('.dmv-panel__row .dmv-panel__name'))
            .map(n => (n.textContent ?? '').trim()),
    };
});

console.log('\n== R-DMV slice D ==============================================');

// ── A. il pannello ───────────────────────────────────────────────────────────
console.log('\n-- A. il rail del singleton ---------------------------------');
note('selectInRail(ordinary)', await selectInRail('Pointer_DMVD_ORDINARY'));
const ordinaryRail = await railShape();
note('rail del viewpoint ordinario', ordinaryRail);
check('A0 positivo di controllo: un viewpoint ORDINARIO rende ViewpointProperties, col segmented Type',
    !!ordinaryRail && ordinaryRail.hasTypeSegmented && ordinaryRail.headers.includes('Viewpoint'),
    `headers ${JSON.stringify(ordinaryRail?.headers)}, Type ${ordinaryRail?.hasTypeSegmented}`);

note('selectInRail(singleton)', await selectInRail('Pointer_ViewPointDataManager'));
const dmvRail = await railShape();
await page.screenshot({ path: shot('a_panel') });
note('rail del singleton', dmvRail);
check('A1 il singleton rende DataManagerViewpointPanel: sezioni «Data Manager» e «Fields»',
    !!dmvRail && dmvRail.headers.includes('Data Manager') && dmvRail.headers.includes('Fields'),
    `headers ${JSON.stringify(dmvRail?.headers)}`);
check('A2 Name, Form theme e il selettore di metaclasse ci sono',
    !!dmvRail && ['Name', 'Form theme', 'Metaclass'].every(l => dmvRail.labels.includes(l)),
    `labels ${JSON.stringify(dmvRail?.labels)}`);
check('A3 il segmented «Type» NON c\'e\': non si puo\' declassare il singleton (referto §2.3)',
    !!dmvRail && dmvRail.hasTypeSegmented === false,
    `hasTypeSegmented ${dmvRail?.hasTypeSegmented} (era ${ordinaryRail?.hasTypeSegmented} sull\'ordinario)`);
check('A4 l\'hint «Applies when this viewpoint is active» NON c\'e\': sarebbe sempre falso',
    !!dmvRail && dmvRail.hasHint === false, `hasHint ${dmvRail?.hasHint}`);
check('A5 la tabella elenca le feature della metaclasse',
    !!dmvRail && ['name', 'note', 'active'].every(n => dmvRail.featureRows.includes(n)),
    `righe ${JSON.stringify(dmvRail?.featureRows)}`);

// ── B. la scrittura e il secondo gradino della materializzazione ─────────────
console.log('\n-- B. prima scrittura: la view di classe nasce ---------------');
const singletonViews = () => page.evaluate(() => {
    const W: any = (window as any).windoww; const s = W.store.getState();
    const ids = (s.viewelements ?? []).filter((v: string) =>
        s.idlookup[v]?.viewpoint === 'Pointer_ViewPointDataManager');
    return ids.map((v: string) => {
        const d = s.idlookup[v];
        return {
            id: v, name: d?.name, metaclasses: d?.ir?.metaclasses, pins: d?.ir?.authoringMetaclassPins,
            widgets: d?.ir?.form?.widgets, hasShape: !!d?.ir?.shape,
            hasFormKey: !!d?.ir && Object.prototype.hasOwnProperty.call(d.ir, 'form'),
        };
    });
});
const before = await singletonViews();
note('view del singleton PRIMA', before);
check('B0 il singleton non ha ancora nessuna view: la scrittura la deve creare (R-DMV-6)',
    Array.isArray(before) && before.length === 0, `view: ${JSON.stringify(before)}`);

const rowSelect = page.locator('.dmv-panel__row', { has: page.locator('.dmv-panel__name', { hasText: /^note$/ }) })
    .locator('select').first();
note('opzioni offerte per `note`', await rowSelect.locator('option').allTextContents());
await rowSelect.selectOption('textarea');
await page.waitForTimeout(2500);
await page.screenshot({ path: shot('b_written') });

const after = await singletonViews();
note('view del singleton DOPO', after);
check('B1 UNA view di classe e\' nata nel singleton, con `form.widgets` scritto',
    after.length === 1 && after[0].widgets?.note === 'textarea', `${JSON.stringify(after)}`);
check('B2 la view e\' pinnata sulla classe e porta uno `shape` minimo (senza, il compile la scarta)',
    after.length === 1 && JSON.stringify(after[0].metaclasses) === '["Sensor"]' && after[0].hasShape === true,
    `metaclasses ${JSON.stringify(after?.[0]?.metaclasses)}, pins ${JSON.stringify(after?.[0]?.pins)}, shape ${after?.[0]?.hasShape}`);

await rowSelect.selectOption('');
await page.waitForTimeout(2000);
const reset = await singletonViews();
note('dopo il reset al default', reset);
check('B3 tornando al default la chiave `form` viene RIMOSSA, non scritta undefined (R-B9)',
    reset.length === 1 && reset[0].hasFormKey === false, `${JSON.stringify(reset)}`);

await rowSelect.selectOption('textarea');
await page.waitForTimeout(2000);

// ── C. il negativo ───────────────────────────────────────────────────────────
console.log('\n-- C. dove il singleton NON deve comparire -------------------');
const picker = await page.evaluate(() => {
    const W: any = (window as any).windoww; const s = W.store.getState();
    const ptrs: string[] = s.viewpoints ?? [];
    return { root: ptrs, hasSingleton: ptrs.includes('Pointer_ViewPointDataManager') };
});
note('state.viewpoints (la sorgente del picker)', picker);
check('C0 positivo di controllo: la root `state.viewpoints` contiene DAVVERO il singleton',
    picker.hasSingleton === true,
    'se fosse falsa i negativi non proverebbero nulla: il filtro non avrebbe niente da togliere');

await page.goto(`${BASE_URL}/#/project?id=${pid}`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(NAV_MS + SETTLE_MS);
const dashboard = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.list-card__name')).map(n => (n.textContent ?? '').trim()));
note('VIEWPOINTS della dashboard di progetto', dashboard);
await page.screenshot({ path: shot('c_dashboard') });
check('C1 positivo di controllo: la lista VIEWPOINTS e\' popolata e leggibile',
    dashboard.some(n => n.includes('Ordinary syntax')), `letti ${JSON.stringify(dashboard)}`);
check('C2 il singleton NON e\' nella lista: niente riga, quindi niente Duplicate ne\' Delete',
    !dashboard.some(n => n.includes('Data Manager')), `letti ${JSON.stringify(dashboard)}`);

const upstream = await page.evaluate(() => {
    const w = window as any;
    const project = w.LProject.getProject();
    const own = (project?.viewpoints ?? []).map((v: any) => ({ id: v?.id, name: v?.name }));
    return { own, hasSingleton: own.some((v: any) => v.id === 'Pointer_ViewPointDataManager') };
});
note('LProject.viewpoints (sorgente a monte del filtro)', upstream);
check('C3 il singleton E\' in `LProject.viewpoints`: e\' il filtro delle liste a toglierlo, non l\'assenza',
    upstream.hasSingleton === true, `${JSON.stringify(upstream.own)}`);

// Il picker si apre come lo apre l'utente, e le voci si leggono dal listbox che ne
// esce: la lista che il componente calcola e' una variabile di modulo, e asserire su
// quella misurerebbe il layer sotto invece del soggetto (P11).
await page.goto(`${BASE_URL}/#/project?id=${pid}`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(NAV_MS);
const opened = await page.evaluate((m: string) => {
    const w = window as any;
    try { return !!w.DockManager.open2(w.LModel.fromPointer(m)); } catch (e) { return String(e); }
}, built.m1);
note('apertura del modello M1', String(opened));
await page.waitForTimeout(6000);
// Il trigger che DIPINGE, non il primo del DOM: le tab inattive restano montate, e
// `openViewpoint` ne ha aperta una sul metamodello, dove il picker e' disabilitato
// per costruzione (`disabled={isMetamodel}`). Misurato: il primo `.toolbar-viewpoint-
// trigger` del documento tornava `enabled: false`, e le due asserzioni leggevano una
// lista vuota come «il singleton non c'e'» — l'elemento sbagliato, non il fatto.
const visibleTrigger = await page.evaluate(() => {
    const paints = (el: Element) => {
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) return false;
        const cx = Math.min(Math.max(r.left + r.width / 2, 1), window.innerWidth - 1);
        const cy = Math.min(Math.max(r.top + r.height / 2, 1), window.innerHeight - 1);
        const hit = document.elementFromPoint(cx, cy);
        return !!hit && (el === hit || el.contains(hit) || hit.contains(el));
    };
    const all = Array.from(document.querySelectorAll('.toolbar-viewpoint-trigger'));
    for (const t of all) t.removeAttribute('data-probe-visible');
    const t = all.find(paints);
    if (t) t.setAttribute('data-probe-visible', '1');
    return { total: all.length, found: !!t };
});
note('trigger visibile', visibleTrigger);
const trigger = page.locator('.toolbar-viewpoint-trigger[data-probe-visible="1"]').first();
let pickerEntries: string[] = [];
note('picker trigger', { count: await trigger.count(), enabled: await trigger.count() ? await trigger.isEnabled() : null });
if (await trigger.count() > 0 && await trigger.isEnabled()) {
    await trigger.click();
    await page.waitForTimeout(1500);
    pickerEntries = await page.evaluate(() => {
        const box = document.getElementById('toolbar-syntax-listbox');
        if (!box) return [];
        // Il ruolo esatto delle voci non e' garantito: si leggono i figli diretti che
        // portano del testo, che e' cio' che l'utente vede nella lista.
        const byRole = Array.from(box.querySelectorAll('[role="option"]'));
        const nodes = byRole.length > 0 ? byRole : Array.from(box.children);
        return nodes.map(o => (o.textContent ?? '').trim()).filter(Boolean);
    });
    await page.screenshot({ path: shot('d_picker') });
    await page.keyboard.press('Escape');
}
note('voci del picker della toolbar', pickerEntries);
check('C5 positivo di controllo: il picker si e\' aperto e mostra le sintassi del progetto',
    pickerEntries.some(e => e.includes('Ordinary syntax')) && pickerEntries.some(e => e.includes('Abstract syntax')),
    `voci ${JSON.stringify(pickerEntries)}`);
// Uguaglianza esatta e non un `some(...)` negato: una voce in piu' col nome del
// singleton passerebbe qualunque test «non contiene», e il singleton e' rinominabile
// dal suo stesso pannello. La voce sintetica «Data manager» (m minuscola) NON e' il
// singleton: e' il sentinel `@data-manager`, che apre la tab del manager e non attiva
// nessun viewpoint (`Toolbar.handleViewpointChange`).
check('C6 il picker mostra ESATTAMENTE le sintassi piu\' il sentinel: il singleton non c\'e\' (R-DMV-1)',
    JSON.stringify(pickerEntries) === JSON.stringify(['Abstract syntax', 'Ordinary syntax', 'Data manager']),
    `voci ${JSON.stringify(pickerEntries)}`);

// Il megamodello, aperto dal suo bottone nella dashboard di progetto.
await page.goto(`${BASE_URL}/#/project?id=${pid}`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(NAV_MS + SETTLE_MS);
// Aperto con l'evento che la voce di albero dispaccia, non col bottone della
// dashboard: quel bottone esiste ma non e' visibile a questa larghezza, e un click
// su un elemento invisibile e' un timeout, non una misura.
await page.evaluate(() => window.dispatchEvent(new CustomEvent('jjodel:openMegamodel')));
await page.waitForTimeout(3000);
const mmNodes = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.mm-card__name'))
        .map(n => (n.textContent ?? '').trim())
        .filter(Boolean));
await page.screenshot({ path: shot('e_megamodel') });
note('nodi del megamodello', mmNodes);
check('C7 positivo di controllo: il megamodello si e\' reso e nomina il viewpoint ordinario',
    mmNodes.some(n => n.includes('Ordinary syntax')), `letti ${JSON.stringify(mmNodes).slice(0, 400)}`);
check('C8 il singleton NON e\' un nodo del megamodello (R-DMV-1)',
    mmNodes.length > 0 && !mmNodes.some(n => n.includes('Data Manager')),
    `letti ${JSON.stringify(mmNodes).slice(0, 400)}`);

check('C4 nessun errore di pagina in tutto il giro',
    errors.length === 0, `pageerror: ${JSON.stringify(errors.slice(0, 3))}`);

console.log(`\n== ${pass} PASS, ${fail} FAIL ===================================\n`);
await browser.close();
process.exit(fail === 0 ? 0 : 1);
