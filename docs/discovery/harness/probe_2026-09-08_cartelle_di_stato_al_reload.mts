/**
 * probe_2026-09-08_cartelle_di_stato_al_reload — una chiave nuova su `DState` arriva
 * anche nei progetti gia' salvati, o no?
 *
 * VERIFICA OBBLIGATORIA richiesta prima di scrivere la correzione di
 * `state.validationviewpoints` / `state.validationrules`. La correzione proposta e' due
 * righe additive su `DState` (`redux/store.tsx`), e regge solo se lo stato caricato da
 * un progetto salvato prende i valori di default della classe. Se invece lo stato si
 * ripristina in blocco dallo snapshot, la chiave arriva `undefined` e la correzione non
 * raggiunge nessun progetto esistente — cioe' rompe in un altro modo invece di sanare.
 *
 * ── Che cosa misura, e perche' ciascun blocco esiste ─────────────────────────
 *
 *  A. LA CARTELLA MALFORMATA, RIPRODOTTA. `reducer.ts:466` deriva dal className la
 *     cartella di stato e ci scrive con il modificatore `'[]'`. Su una chiave che non
 *     esiste, `'[]'` si comporta come `'='` (`reducer.ts:186-188`, ramo
 *     `oldValue === undefined`): il campo diventa la STRINGA dell'id invece di un array
 *     di uno. Prima si riproduce, poi si discute.
 *
 *  B. LO SNAPSHOT SE LA PORTA DIETRO. Si salva e si ricarica: se la stringa sopravvive
 *     al giro, ogni progetto salvato da oggi in avanti nasce con la cartella malformata,
 *     e sanarla dopo costa una migrazione. E' il motivo per cui la correzione ha la
 *     precedenza sul resto.
 *
 *  C. LA DOMANDA VERA, e si misura su una chiave GIA' DICHIARATA. `edgepoints` sta su
 *     `DState` con `= []` da sempre, e nessuno la tocca nel percorso di caricamento. La
 *     si toglie dallo snapshot e si fa passare lo snapshot dal percorso di caricamento
 *     VERO (`SaveManager.load`, che chiama `VersionFixer.update` e poi `LoadAction`). Se
 *     torna `undefined`, il ripristino e' in blocco e la dichiarazione su `DState` non
 *     raggiunge i progetti salvati: e' la risposta che decide la correzione.
 *
 *     Il CONTROLLO POSITIVO e' un SEGNAVIA piantato nello snapshot ritoccato
 *     (`tooltip`), che dopo il caricamento deve leggersi nello stato. Serve, e la prima
 *     stesura lo ha dimostrato: senza, un caricamento che non e' ancora avvenuto —
 *     `LoadAction` passa dallo stesso commit differito di `U.UpdatingTimer` — restituisce
 *     lo stato VECCHIO, e lo stato vecchio ha tutte le chiavi al posto giusto. La lettura
 *     affrettata diceva «la chiave viene ripristinata», che era la risposta opposta a
 *     quella vera. Una chiave lasciata al suo posto NON e' un controllo: passa identica
 *     sia che il caricamento sia avvenuto sia che non lo sia.
 *
 *  E. E' UNA SPECIE NUOVA DI MALFORMAZIONE, O CE NE SONO GIA'? La cartella la deriva il
 *     reducer dal className di OGNI classe D. Si passano in rassegna tutte le classi
 *     registrate e si guarda quali cartelle `DState` dichiara davvero: se ce ne sono gia'
 *     di non dichiarate, la nostra non introduce una specie nuova, e la correzione e' una
 *     riparazione generale invece che una toppa. Cambia la scala della decisione.
 *
 *  D. E ALLORA CHE SUCCEDE SU UN PROGETTO CARICATO? Nello stato ripristinato si crea un
 *     viewpoint di validazione: se la chiave e' assente, la cartella torna stringa
 *     anche con `DState` corretta. E' la misura che dice se la correzione basta da sola
 *     o se serve altro.
 *
 * ── Che cosa NON prova ───────────────────────────────────────────────────────
 *
 * Non prova niente su cosa faccia `VersionFixer` con una chiave assente: la sonda lo
 * attraversa e ne osserva l'esito, non ne legge le migrazioni. E non tocca `DState`:
 * gira sul codice com'e' oggi, prima di qualunque correzione.
 *
 * Con il dev server su (P8: porta 3000, non 3001):
 *   cd frontend && npx tsx ../docs/discovery/harness/probe_2026-09-08_cartelle_di_stato_al_reload.mts
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

const VP_ID = 'Pointer_ValidationViewpointDefault';
const COMMIT_MS = 1200;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
await ctx.addInitScript(() => { (window as any).__name = (f: any) => f; });
await seed(ctx, true);
const page = await ctx.newPage();
const errors: string[] = [];
page.on('pageerror', (e) => errors.push(e.message));

await page.goto(`${BASE_URL}/all-projects`, { waitUntil: 'domcontentloaded', timeout: NAV_MS });
await page.waitForTimeout(SETTLE_MS);
const pid = await createProject(page, `Smoke_FOLDER_${Date.now()}`);
if (!pid) { console.log('FIXTURE FAILED: createProject'); await browser.close(); process.exit(1); }
await page.goto(`${BASE_URL}/#/project?id=${pid}`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(NAV_MS + SETTLE_MS);

// ── A ────────────────────────────────────────────────────────────────────────
h('A. La cartella malformata, riprodotta');

const pre = await page.evaluate(() => {
    const st = (window as any).store.getState();
    return { validationviewpoints: st.validationviewpoints ?? '(assente)', tipo: typeof st.validationviewpoints };
});
note('prima di creare niente', pre);
check('su un progetto nuovo la cartella non esiste ancora',
    pre.tipo === 'undefined', `typeof state.validationviewpoints = ${pre.tipo}`);

await page.evaluate(() => { (window as any).DValidationViewpoint.new(); });
await page.waitForTimeout(COMMIT_MS);

const afterCreate = await page.evaluate(() => {
    const st = (window as any).store.getState();
    return {
        validationviewpoints: st.validationviewpoints,
        tipo: typeof st.validationviewpoints,
        // i due riferimenti: entrambe dichiarate su DState con `= []`
        viewpoints: Array.isArray(st.viewpoints) ? `array(${st.viewpoints.length})` : typeof st.viewpoints,
        viewelements: Array.isArray(st.viewelements) ? `array(${st.viewelements.length})` : typeof st.viewelements,
    };
});
note('dopo la creazione', afterCreate);
check('la cartella del tipo nuovo e\' una STRINGA, non un array di uno',
    afterCreate.tipo === 'string' && afterCreate.validationviewpoints === VP_ID,
    `validationviewpoints = ${JSON.stringify(afterCreate.validationviewpoints)} (${afterCreate.tipo})`);
check('le due cartelle dichiarate su DState sono invece array',
    afterCreate.viewpoints.startsWith('array') && afterCreate.viewelements.startsWith('array'),
    `viewpoints = ${afterCreate.viewpoints}, viewelements = ${afterCreate.viewelements}`);

// ── B ────────────────────────────────────────────────────────────────────────
h('B. Lo snapshot se la porta dietro: e\' per questo che la correzione ha la precedenza');

await page.evaluate(async () => {
    const w = window as any;
    await w.ProjectsApi.save(w.LProject.getProject());
});
await page.goto(`${BASE_URL}/all-projects`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(SETTLE_MS);
await page.goto(`${BASE_URL}/#/project?id=${pid}`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(NAV_MS + SETTLE_MS);

const afterReload = await page.evaluate(() => {
    const st = (window as any).store.getState();
    return { validationviewpoints: st.validationviewpoints, tipo: typeof st.validationviewpoints };
});
note('dopo salva + ricarica', afterReload);
check('la stringa sopravvive al giro: il file di progetto la contiene',
    afterReload.tipo === 'string' && afterReload.validationviewpoints === VP_ID,
    `validationviewpoints = ${JSON.stringify(afterReload.validationviewpoints)} (${afterReload.tipo})`);

// ── C ────────────────────────────────────────────────────────────────────────
h('C. La domanda vera: una chiave DICHIARATA su DState, tolta dallo snapshot, torna?');

const SENTINEL = 'SEGNAVIA_' + Date.now();
const prima = await page.evaluate(([SENTINEL]: string[]) => {
    const w = window as any;
    const project = w.LProject.getProject();
    const snapshot = JSON.parse(JSON.stringify(w.store.getState()));
    const before = {
        edgepoints: Array.isArray(snapshot.edgepoints) ? `array(${snapshot.edgepoints.length})` : typeof snapshot.edgepoints,
        validationviewpoints: typeof snapshot.validationviewpoints,
        tooltip: w.store.getState().tooltip,
    };
    delete snapshot.edgepoints;              // dichiarata su DState
    delete snapshot.validationviewpoints;    // NON dichiarata
    snapshot.tooltip = SENTINEL;             // il segnavia: dice se il caricamento e' avvenuto
    // Il percorso di caricamento VERO: VersionFixer.update + LoadAction.
    w.SaveManager.load(snapshot, project.__raw ?? project);
    return before;
}, [SENTINEL] as any);
note('nello snapshot, prima del ritocco', prima);

await page.waitForTimeout(COMMIT_MS);

const restored = await page.evaluate(() => {
    const st = (window as any).store.getState();
    return {
        tooltip: st.tooltip,
        edgepoints_TOLTA: Array.isArray(st.edgepoints) ? `array(${st.edgepoints.length})` : typeof st.edgepoints,
        validationviewpoints_TOLTA: typeof st.validationviewpoints,
    };
});
note('dopo il caricamento dello snapshot ritoccato', restored);
check('CONTROLLO POSITIVO: il segnavia si legge nello stato — il caricamento e\' avvenuto davvero',
    restored.tooltip === SENTINEL, `state.tooltip = ${JSON.stringify(restored.tooltip)}`);
check('la chiave DICHIARATA su DState ma assente dallo snapshot resta assente',
    restored.edgepoints_TOLTA === 'undefined',
    `edgepoints = ${restored.edgepoints_TOLTA} (nello snapshot era ${prima.edgepoints}) `
    + '-> il ripristino e\' IN BLOCCO: i default di DState NON raggiungono i progetti salvati');
check('e cosi\' la chiave non dichiarata', restored.validationviewpoints_TOLTA === 'undefined',
    `validationviewpoints = ${restored.validationviewpoints_TOLTA}`);

// ── D ────────────────────────────────────────────────────────────────────────
h('D. E allora, su un progetto caricato, che succede alla cartella?');

await page.evaluate(() => { (window as any).DValidationViewpoint.new(); });
await page.waitForTimeout(COMMIT_MS);

const onLoaded = await page.evaluate(() => {
    const st = (window as any).store.getState();
    return { validationviewpoints: st.validationviewpoints, tipo: typeof st.validationviewpoints };
});
note('creazione dentro lo stato ripristinato senza la chiave', onLoaded);
check('con la chiave assente la cartella torna stringa, e lo farebbe anche con DState corretta',
    onLoaded.tipo === 'string',
    `validationviewpoints = ${JSON.stringify(onLoaded.validationviewpoints)} (${onLoaded.tipo})`);

// ── E ────────────────────────────────────────────────────────────────────────
h('E. Quante altre cartelle non sono dichiarate su DState?');

const folders = await page.evaluate(() => {
    const w = window as any;
    const fresh = w.DState.new ? null : null;
    // Lo stato APPENA COSTRUITO, non quello caricato: e' li' che si legge cosa DState
    // dichiara, senza le assenze introdotte dal ripristino in blocco.
    const dichiarate = new Set(Object.keys(new (w.RuntimeAccessibleClass.classes['DState'] as any)('dwc')));
    const nomiD = Object.keys(w.RuntimeAccessibleClass.classes)
        .filter(n => n[0] === 'D' && (n[1] || '').toUpperCase() === n[1]);
    const senzaCartella: string[] = [];
    const conCartella: string[] = [];
    for (const n of nomiD) {
        const folder = n.substring(1).toLowerCase() + 's';
        (dichiarate.has(folder) ? conCartella : senzaCartella).push(n + ' -> ' + folder);
    }
    return { totaleClassiD: nomiD.length, conCartella: conCartella.length, senzaCartella };
});
note('classi D con e senza cartella dichiarata su DState', {
    totale: folders.totaleClassiD, conCartella: folders.conCartella, senzaCartella: folders.senzaCartella.length });
console.log('        senza cartella: ' + folders.senzaCartella.join(', '));
check('la nostra non e\' l\'unica classe senza cartella dichiarata',
    folders.senzaCartella.length > 2,
    `${folders.senzaCartella.length} classi D su ${folders.totaleClassiD} non hanno una cartella dichiarata su DState`);

// ── Esito ────────────────────────────────────────────────────────────────────
h('ESITO');
if (errors.length) console.log('  pageerror raccolti:\n' + errors.map(e => '        ' + e).join('\n'));
console.log(`  pageerror: ${errors.length}`);
console.log(`\n  ${pass} PASS   ${fail} FAIL`);
await browser.close();
if (fail > 0) process.exitCode = 1;
