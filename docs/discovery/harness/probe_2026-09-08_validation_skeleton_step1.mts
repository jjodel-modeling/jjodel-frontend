/**
 * probe_2026-09-08_validation_skeleton_step1 — il modello della validazione esiste
 * davvero a runtime, non solo in compilazione.
 *
 * Lo Step 1 aggiunge due coppie D/L (`DValidationViewpoint`, `DValidationRule`) che
 * NESSUN test della suite puo' toccare: `vitest.config.ts` gira con
 * `environment: 'node'` e il modulo importa `../../joiner`, che alla prima riga scrive
 * su `window`. Il test unitario che accompagna lo Step 1 e' quindi sul SORGENTE, e
 * difende le decisioni di forma; questa sonda difende il resto, che e' la parte che
 * puo' rompersi in silenzio.
 *
 * ── Che cosa misura, e perche' ciascun blocco esiste ─────────────────────────
 *
 *  A. LA REGISTRAZIONE D<->L. `buildLSingletons` (`redux/reducer/reducer.ts:1392`)
 *     accoppia `D<Nome>` con `L<Nome>` per convenzione di nome, e un accoppiamento
 *     mancato NON produce nessun errore di compilazione: produce una proxy che a runtime
 *     non trova il proprio singleton e un `Log.exDev` che nessuno guarda. E' la prima
 *     cosa da misurare perche' e' quella che fallisce senza dirlo.
 *
 *  B. LA NASCITA ALLA PRIMA SCRITTURA (R-DMV-6). Su un progetto appena creato il
 *     viewpoint NON deve esserci; dopo la prima scrittura deve esserci una volta sola.
 *
 *     LIMITE DICHIARATO: `ensureValidationViewpoint` NON e' raggiungibile da qui. Il
 *     decoratore `@RuntimeAccessible` mette su `window` le CLASSI, non le funzioni di
 *     modulo, e la sonda gira nel contesto della pagina. Il blocco misura quindi i due
 *     rami di cui `ensure` e' composto — la lettura di `idlookup` sotto il puntatore
 *     fisso, che e' `findValidationViewpoint`, e `DValidationViewpoint.new()` — e
 *     verifica che dopo la creazione la lettura risponda con lo STESSO oggetto, cioe'
 *     che il ramo di uscita anticipata di `ensure` scatterebbe. Che `ensure` sia
 *     davvero find-then-create sta nel test unitario sul sorgente, non qui.
 *
 *  C. LA REGOLA E IL SUO AGGANCIO. La regola nasce dentro il viewpoint: `father`
 *     all'indietro e `rules` in avanti. Le due direzioni si misurano SEPARATAMENTE,
 *     perche' sono scritte da due meccanismi diversi — il `father` da `Constructors`,
 *     la collezione da una `SetFieldAction` che sta FUORI dalla creazione (CLAUDE.md
 *     §3.3), ed e' esattamente il genere di scrittura che si perde se finisce annidata.
 *
 *  D. LA PROXY L, E IL SUO TRABOCCHETTO. Il getter di default risolve ogni stringa che
 *     sia un `Pointer_` in una proxy L: `lRule.context` NON e' un id. E' dichiarato nel
 *     commento del campo, e qui si misura invece di crederci.
 *
 *  E. IL GIRO DI SALVATAGGIO. L'affermazione «non serve nessuna persistenza» poggia su
 *     `U.compressedState`, che serializza l'INTERO `idlookup`. Se fosse falsa, lo
 *     scheletro perderebbe le regole al primo reload e la cosa si scoprirebbe allo Step
 *     4. Si salva, si ricarica la pagina, si rilegge.
 *
 *  F. IL CONTROLLO POSITIVO, e serve DAVVERO, due volte. In A: se la query al registro
 *     fosse malformata tutto tornerebbe vuoto, e il referto leggerebbe «non registrato»
 *     dove il problema e' la domanda — la stessa query su `DViewPoint`, registrato da
 *     anni, deve rispondere di si'. In B: la stessa misura di commit su un `DViewPoint`
 *     creato qui accanto, per la ragione detta sotto.
 *
 * ── L'ATTESA FRA SCRITTURA E LETTURA NON E' SCARAMANZIA ──────────────────────
 *
 * Misurato in questo giro, e costato la prima stesura della sonda: subito dopo
 * `.new()` lo stato **non e' cambiato** (`store.getState()` restituisce lo stesso
 * oggetto), l'elemento e' in `DPointerTargetable.pendingCreation`, e `idlookup[id]`
 * risponde mentre `Object.keys(idlookup)` non lo elenca. Il commit passa da un
 * `setInterval` di `U.UpdatingTimer` = 300 ms (`reducer.ts`, `setDocumentEvents`). E'
 * la stessa cosa che CLAUDE.md §9.2 chiama «deferred attribute setting».
 *
 * La prima stesura leggeva subito e dichiarava sei fallimenti — collezione vuota,
 * niente dopo il reload. Il controllo positivo del blocco B esiste perche' quella
 * lettura affrettata dava lo stesso identico esito su `DViewPoint`, che funziona da
 * anni: senza quel confronto, sei difetti del framework sarebbero stati scritti a
 * referto come difetti dei tipi nuovi.
 *
 * ── Che cosa NON prova ───────────────────────────────────────────────────────
 *
 * Non prova niente sulla valutazione (Step 2), sul comando (Step 3) o sull'authoring
 * (Step 4): non esistono ancora. E non prova che la cancellazione di una classe faccia
 * la cosa giusta con le regole che la nominano — R-VAL-9 e' fuori dallo scheletro, e
 * qui non c'e' nessun meccanismo che la implementi.
 *
 * Con il dev server su (P8: porta 3000, non 3001):
 *   cd frontend && npx tsx ../docs/discovery/harness/probe_2026-09-08_validation_skeleton_step1.mts
 */
import playwright from '../../../frontend/node_modules/@playwright/test/index.js';
const { chromium } = playwright as unknown as typeof import('@playwright/test');
import { BASE_URL, NAV_MS, SETTLE_MS, createProject, seed } from '../../../frontend/scripts/smoke/states.ts';

let pass = 0, fail = 0;
const check = (label: string, ok: boolean, detail: string) => {
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}\n        ${detail}`);
    ok ? pass++ : fail++;
};
const note = (label: string, d: unknown) =>
    console.log(`  MISURA  ${label}\n        ${typeof d === 'string' ? d : JSON.stringify(d)}`);
const h = (s: string) => console.log('\n' + s + '\n' + '─'.repeat(s.length));

/** Il puntatore fisso, ricopiato qui perche' le costanti di modulo non stanno su
 *  `window`. Se il modulo lo cambia e questa riga no, il blocco B fallisce sul primo
 *  check invece di passare per caso: e' il verso giusto in cui rompersi. */
const VP_ID = 'Pointer_ValidationViewpointDefault';
/** Quattro giri di `U.UpdatingTimer` (300 ms): abbondante, e la sonda non e' a tempo. */
const COMMIT_MS = 1200;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1500, height: 950 } });
await ctx.addInitScript(() => { (window as any).__name = (f: any) => f; });
await seed(ctx, true);
const page = await ctx.newPage();
const errors: string[] = [];
page.on('pageerror', (e) => errors.push(e.message));

await page.goto(`${BASE_URL}/all-projects`, { waitUntil: 'domcontentloaded', timeout: NAV_MS });
await page.waitForTimeout(SETTLE_MS);
const pid = await createProject(page, `Smoke_VAL1_${Date.now()}`);
if (!pid) { console.log('FIXTURE FAILED: createProject'); await browser.close(); process.exit(1); }
await page.goto(`${BASE_URL}/#/project?id=${pid}`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(NAV_MS + SETTLE_MS);

// ── A + F ────────────────────────────────────────────────────────────────────
h('A. La registrazione D<->L, quella che fallisce senza dirlo   (+ F, controllo positivo)');

const reg = await page.evaluate(() => {
    const w = window as any;
    const R = w.RuntimeAccessibleClass;
    const probe = (n: string) => {
        const c = R.classes[n];
        return { registrata: !!c, logic: c?.logic?.cname ?? null, singleton: !!c?.singleton, suWindow: !!w[n] };
    };
    return {
        DValidationViewpoint: probe('DValidationViewpoint'),
        LValidationViewpoint: probe('LValidationViewpoint'),
        DValidationRule: probe('DValidationRule'),
        LValidationRule: probe('LValidationRule'),
        controlloPositivo: probe('DViewPoint'),
    };
});
note('registro delle classi', reg);
check('F  controllo positivo: DViewPoint risponde alla stessa domanda',
    reg.controlloPositivo.registrata && reg.controlloPositivo.logic === 'LViewPoint',
    `DViewPoint.logic = ${reg.controlloPositivo.logic}`);
check('le quattro classi sono nel registro',
    reg.DValidationViewpoint.registrata && reg.LValidationViewpoint.registrata &&
    reg.DValidationRule.registrata && reg.LValidationRule.registrata,
    'tutte e quattro presenti in RuntimeAccessibleClass.classes');
check('buildLSingletons ha accoppiato le due coppie per convenzione di nome',
    reg.DValidationViewpoint.logic === 'LValidationViewpoint' && reg.DValidationRule.logic === 'LValidationRule',
    `viewpoint -> ${reg.DValidationViewpoint.logic}, rule -> ${reg.DValidationRule.logic}`);
check('i singleton L esistono: senza, ogni proxy fallisce a runtime',
    reg.DValidationViewpoint.singleton && reg.DValidationRule.singleton,
    'singleton presenti su entrambe le classi D');

// ── B ────────────────────────────────────────────────────────────────────────
h('B. Il viewpoint nasce alla prima scrittura, e nasce una volta sola');

const beforeWrite = await page.evaluate((VP_ID: string) => {
    const w = window as any;
    const idl = w.store.getState().idlookup;
    const d = idl[VP_ID];
    return { trovato: !!(d && d.className === 'DValidationViewpoint') };
}, VP_ID);
check('su un progetto appena creato il viewpoint NON c\'e\'', beforeWrite.trovato === false,
    'la lettura sotto il puntatore fisso torna null prima della prima scrittura');

// La scrittura, e accanto un DViewPoint di controllo creato nello stesso istante.
const written = await page.evaluate((VP_ID: string) => {
    const w = window as any;
    const st0 = w.store.getState();
    const vp = w.DValidationViewpoint.new();
    const ctrl = w.DViewPoint.newVP('CtrlVP');
    const st1 = w.store.getState();
    return {
        vpId: vp?.id,
        ctrlId: ctrl?.id,
        // la fotografia PRIMA del commit, che e' il motivo per cui questa sonda aspetta
        subitoDopo: {
            statoCambiato: st0 !== st1,
            nuovo_inKeys: Object.keys(st1.idlookup).includes(VP_ID),
            controllo_inKeys: Object.keys(st1.idlookup).includes(ctrl?.id),
        },
    };
}, VP_ID);
note('subito dopo la scrittura, prima del commit', written.subitoDopo);
check('F  controllo positivo: prima del commit NEMMENO il DViewPoint e\' in `Object.keys` — l\'attesa serve al framework, non ai tipi nuovi',
    written.subitoDopo.statoCambiato === false &&
    written.subitoDopo.nuovo_inKeys === false && written.subitoDopo.controllo_inKeys === false,
    `stato cambiato = ${written.subitoDopo.statoCambiato}, nuovo = ${written.subitoDopo.nuovo_inKeys}, controllo = ${written.subitoDopo.controllo_inKeys}`);

await page.waitForTimeout(COMMIT_MS);

const born = await page.evaluate(([VP_ID, ctrlId]: string[]) => {
    const w = window as any;
    const st = w.store.getState();
    const idl = st.idlookup;
    const d = idl[VP_ID];
    const trovato = d && d.className === 'DValidationViewpoint' ? d : null;
    return {
        inKeys: Object.keys(idl).includes(VP_ID),
        controllo_inKeys: Object.keys(idl).includes(ctrlId),
        trovato: !!trovato, id: trovato?.id, className: trovato?.className, name: trovato?.name,
        rules: trovato?.rules,
        quanti: Object.values(idl).filter((o: any) => o?.className === 'DValidationViewpoint').length,
        // La cartella di stato che il reducer deriva dal className
        // (`className.substring(1).toLowerCase()+'s'`, reducer.ts:466). Accanto, le due
        // di controllo: `viewpoints` E' dichiarata su `DState` come array, `viewelements`
        // NON lo e' — e `DViewElement` e' il tipo piu' creato del sistema. Il confronto
        // dice se una cartella non dichiarata sia un difetto o la normalita'.
        cartelle: {
            validationviewpoints: st.validationviewpoints,
            validationrules: st.validationrules,
            viewpoints_dichiarata: Array.isArray(st.viewpoints) ? `array(${st.viewpoints.length})` : typeof st.viewpoints,
            viewelements_NON_dichiarata: Array.isArray(st.viewelements) ? `array(${st.viewelements.length})` : typeof st.viewelements,
        },
    };
}, [VP_ID, written.ctrlId] as any);
note('dopo il commit', born);
check('dopo il commit il viewpoint c\'e\', sotto il puntatore fisso',
    born.inKeys && born.trovato && born.id === VP_ID && born.className === 'DValidationViewpoint',
    `id = ${born.id}, className = ${born.className}, name = ${born.name}`);
check('ce n\'e\' esattamente uno: il ramo di uscita anticipata di ensure() scatterebbe',
    born.quanti === 1, `oggetti di quel className in idlookup = ${born.quanti}`);
check('nasce con la collezione delle regole vuota, non undefined',
    Array.isArray(born.rules) && born.rules.length === 0, `rules = ${JSON.stringify(born.rules)}`);
note('cartelle di stato derivate dal className, con i due controlli', born.cartelle);
check('una cartella non dichiarata su DState si comporta uguale per il tipo nuovo e per DViewElement',
    typeof born.cartelle.validationviewpoints === typeof born.cartelle.viewelements_NON_dichiarata ||
    born.cartelle.viewelements_NON_dichiarata === 'undefined',
    `validationviewpoints = ${JSON.stringify(born.cartelle.validationviewpoints)}, `
    + `viewelements (non dichiarata) = ${born.cartelle.viewelements_NON_dichiarata}, `
    + `viewpoints (dichiarata) = ${born.cartelle.viewpoints_dichiarata}`);

// ── C ────────────────────────────────────────────────────────────────────────
h('C. La regola: le due direzioni del legame, misurate separatamente');

const made = await page.evaluate((VP_ID: string) => {
    const w = window as any;
    const project = w.LProject.getProject();
    if (!project) return { ok: false as const, error: 'no project' };
    // Un metamodello minimo, per avere una classe M2 vera da mettere in `context`.
    const dM2 = w.DModel.new('ValM2', undefined, true);
    const lM2 = w.LModel.fromD(dM2);
    w.SetFieldAction.new(project.id, 'metamodels', lM2.id, '+=', true);
    const lPkg = w.LPackage.fromD(lM2.addChild('package'));
    lPkg.name = 'val';
    const lState = w.LClass.fromD(lPkg.addClass('State'));
    const rule = w.DValidationRule.new(
        VP_ID, 'oneInitialState', lState.id,
        '(forall s in State.instances such that s.isInitial).size == 1',
        'esattamente uno stato iniziale');
    return { ok: true as const, classeM2: { id: lState.id, name: lState.name }, ruleId: rule.id };
}, VP_ID);
if (!made.ok) { console.log('FIXTURE FAILED: ' + (made as any).error); await browser.close(); process.exit(1); }
await page.waitForTimeout(COMMIT_MS);

const linked = await page.evaluate(([ruleId, VP_ID]: string[]) => {
    const w = window as any;
    const idl = w.store.getState().idlookup;
    const r = idl[ruleId];
    const vp = idl[VP_ID];
    return {
        inKeys: Object.keys(idl).includes(ruleId),
        className: r?.className,
        campi: r && { name: r.name, context: r.context, body: r.body, message: r.message, enabled: r.enabled },
        father: r?.father,
        rulesDelViewpoint: vp?.rules,
        severityPresente: r ? ('severity' in r) : null,
    };
}, [made.ruleId, VP_ID] as any);
note('la regola dopo il commit', linked);
check('la regola e\' in idlookup con il proprio className',
    linked.inKeys && linked.className === 'DValidationRule', `className = ${linked.className}`);
check('i cinque campi sono scritti come passati',
    !!linked.campi && linked.campi.name === 'oneInitialState' && linked.campi.context === made.classeM2.id &&
    String(linked.campi.body).startsWith('(forall s in State.instances') && linked.campi.enabled === true,
    JSON.stringify(linked.campi));
check('nessun campo `severity`: nello scheletro ogni violazione e\' un error',
    linked.severityPresente === false, `'severity' in dRule = ${linked.severityPresente}`);
check('direzione ALL\'INDIETRO: father punta al viewpoint',
    linked.father === VP_ID, `father = ${linked.father}`);
check('direzione IN AVANTI: la SetFieldAction fuori dalla creazione e\' arrivata',
    Array.isArray(linked.rulesDelViewpoint) && linked.rulesDelViewpoint.includes(made.ruleId),
    `viewpoint.rules = ${JSON.stringify(linked.rulesDelViewpoint)}`);

// ── D ────────────────────────────────────────────────────────────────────────
h('D. La proxy L, e il trabocchetto di `context`');

const proxied = await page.evaluate(([ruleId, VP_ID]: string[]) => {
    const w = window as any;
    const l = w.LPointerTargetable.fromPointer(ruleId);
    const lvp = w.LPointerTargetable.fromPointer(VP_ID);
    let contextTipo = 'ND', contextName = null as any, contextClassName = null as any;
    try {
        const c = l.context;
        contextTipo = typeof c;
        contextName = c?.name ?? null;
        contextClassName = c?.className ?? null;
    } catch (e: any) { contextTipo = 'throw: ' + e?.message; }
    return {
        proxyClassName: l?.className,
        name: l?.name, body: typeof l?.body, enabled: l?.enabled,
        contextTipo, contextName, contextClassName,
        rawContext: l?.__raw?.context,
        vpRulesLen: Array.isArray(lvp?.rules) ? lvp.rules.length : null,
        vpRule0ClassName: lvp?.rules?.[0]?.className ?? null,
    };
}, [made.ruleId, VP_ID] as any);
note('lettura dalla proxy', proxied);
check('la proxy riporta il className del D-layer (CLAUDE.md §3.13)',
    proxied.proxyClassName === 'DValidationRule', `l.className = ${proxied.proxyClassName}`);
check('i campi scalari si leggono senza getter dedicati',
    proxied.name === 'oneInitialState' && proxied.body === 'string' && proxied.enabled === true,
    `name = ${proxied.name}, typeof body = ${proxied.body}, enabled = ${proxied.enabled}`);
check('`context` sulla proxy NON e\' un id: e\' la LClass, e il grezzo tiene l\'id',
    proxied.contextTipo === 'object' && proxied.contextClassName === 'DClass' &&
    proxied.rawContext === made.classeM2.id,
    `l.context -> ${proxied.contextClassName} «${proxied.contextName}», l.__raw.context = ${proxied.rawContext}`);
check('`rules` sulla proxy del viewpoint torna le regole avvolte',
    proxied.vpRulesLen === 1 && proxied.vpRule0ClassName === 'DValidationRule',
    `rules.length = ${proxied.vpRulesLen}, rules[0].className = ${proxied.vpRule0ClassName}`);

// ── E ────────────────────────────────────────────────────────────────────────
h('E. Il giro di salvataggio: si salva, si ricarica, si rilegge');

const saved = await page.evaluate(async () => {
    const w = window as any;
    try { await w.ProjectsApi.save(w.LProject.getProject()); return { ok: true }; }
    catch (e: any) { return { ok: false, error: e?.message ?? String(e) }; }
});
note('salvataggio', saved);
check('il salvataggio non lancia', saved.ok === true, JSON.stringify(saved));

await page.goto(`${BASE_URL}/all-projects`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(SETTLE_MS);
await page.goto(`${BASE_URL}/#/project?id=${pid}`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(NAV_MS + SETTLE_MS);

const reread = await page.evaluate(([ruleId, VP_ID]: string[]) => {
    const w = window as any;
    const idl = w.store.getState().idlookup;
    const vp = idl[VP_ID];
    const r = idl[ruleId];
    return {
        vp: vp && { className: vp.className, name: vp.name, rules: vp.rules },
        rule: r && { className: r.className, name: r.name, body: r.body, message: r.message,
                     enabled: r.enabled, context: r.context, father: r.father },
        proxyOk: (() => { try { return w.LPointerTargetable.fromPointer(ruleId)?.name ?? null; } catch { return 'throw'; } })(),
    };
}, [made.ruleId, VP_ID] as any);
note('dopo il reload', reread);
check('il viewpoint sopravvive al giro di salvataggio',
    !!reread.vp && reread.vp.className === 'DValidationViewpoint' &&
    Array.isArray(reread.vp.rules) && reread.vp.rules.includes(made.ruleId),
    `rules = ${JSON.stringify(reread.vp?.rules)}`);
check('la regola sopravvive con tutti i suoi campi',
    !!reread.rule && reread.rule.name === 'oneInitialState' &&
    reread.rule.context === made.classeM2.id && reread.rule.enabled === true &&
    reread.rule.father === VP_ID,
    JSON.stringify(reread.rule));
check('e la proxy si costruisce ancora dopo il ricaricamento',
    reread.proxyOk === 'oneInitialState', `l.name = ${reread.proxyOk}`);

// ── Esito ────────────────────────────────────────────────────────────────────
h('ESITO');
if (errors.length) console.log('  pageerror raccolti:\n' + errors.map(e => '        ' + e).join('\n'));
check('nessun errore di pagina in tutto il giro', errors.length === 0, `${errors.length} pageerror`);
console.log(`\n  ${pass} PASS   ${fail} FAIL`);
await browser.close();
if (fail > 0) process.exitCode = 1;
