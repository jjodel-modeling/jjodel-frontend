/**
 * probe_2026-09-08_validation_skeleton_step3 — il comando «Validate» fa quello che dice,
 * dall'inizio alla fine.
 *
 * Lo Step 2 e' coperto da 24 test unitari che eseguono il valutatore su una fixture
 * scritta a mano. Quello che nessun test unitario puo' provare e' il **cablaggio**: che
 * il bottone chiami il comando, che il comando legga il MODELLO VERO attraverso
 * `buildEvalContext`, che i valori M1 arrivino davvero fino al corpo della regola, che le
 * violazioni finiscano nel registro dei problemi e che i tre numeri di R-VAL-14 compaiano
 * a schermo. E' questo il perimetro della sonda.
 *
 * ── Che cosa misura, e perche' ciascun blocco esiste ─────────────────────────
 *
 *  A. LA FIXTURE, COSTRUITA DALL'APP. Un metamodello con una classe e un attributo
 *     booleano, un modello con due istanze, una `done` e una no. Non e' un dettaglio: la
 *     riga che conta di tutto il giro e' che una regola scritta sul nome nudo
 *     dell'attributo veda il valore VERO dell'istanza, e per vederlo serve un modello
 *     vero. Le fixture della suite non lo provano perche' se lo costruiscono da sole.
 *
 *  B. IL PONTE PORTA I VALORI M1. Una regola `done` deve cadere sull'istanza che ha
 *     `done = false` e NON sull'altra, che ha `done = true`. Se il ponte non passasse i
 *     valori la regola cadrebbe su entrambe o su nessuna: due esiti sbagliati che con una
 *     sola istanza non si distinguerebbero da quello giusto. E' il motivo per cui le
 *     istanze sono due, e per cui il valore e' scritto ESPLICITAMENTE su tutte e due —
 *     vedi il blocco G, che misura cosa succede quando non lo e'.
 *
 *  C. I TRE NUMERI (R-VAL-14). Cinque regole, scelte una per esito: una che cade, una
 *     che tiene, una spenta, una con un refuso, una che non compila. La superficie deve
 *     leggere 1 violazione, 1 regola inattiva, 2 non valutabili. Il numero delle non
 *     valutabili e' quello che chiude l'ultima strada silenziosa, e qui si vede a
 *     schermo o non c'e'.
 *
 *  G. LO SLOT NON POPOLATO NON E' `false`. Misurato in questo giro, e non era scontato:
 *     un attributo booleano opzionale MAI SCRITTO vale `null` e non `false`
 *     (`emptyAttributeDefault`, `jjscript/executor/commands/eval.ts`). Una regola `done`
 *     su quell'istanza non produce quindi una violazione ma una NON VALUTABILE, per il
 *     secondo ingresso di R-VAL-13. E' la semantica giusta — assente non e' falso — ma
 *     e' anche il genere di cosa che si scopre in produzione se nessuno la scrive.
 *
 *  D. IL REGISTRO. Le violazioni sono voci, le non valutabili NO. Si legge
 *     `window._jjNodeProblems` — l'unica finestra sul registro, gia' esposta per il
 *     debug — e si contano le voci di kind `validation`. Se ne comparissero tre invece
 *     di una, il contatore delle non valutabili sarebbe diventato rumore nel registro,
 *     che e' esattamente cio' che R-VAL-14 vieta.
 *
 *  E. IL GIRO COMPLETO DAL BOTTONE. Si clicca il bottone della toolbar come farebbe
 *     l'utente, non si chiama la funzione: fra i due c'e' il cablaggio, ed e' il
 *     cablaggio il soggetto. Poi si legge il modale a schermo, testo compreso.
 *
 *  F. IL CONTROLLO POSITIVO, e DISCRIMINA (P12). Si spegne l'attributo `done`
 *     sull'istanza che ce l'aveva e si rivalida: le violazioni devono passare da 1 a 2 e
 *     il numero a schermo con loro. Un controllo che leggesse due volte lo stesso stato
 *     passerebbe anche con un comando che non ricalcola niente; questo no, perche' il
 *     numero DEVE cambiare. Fra la scrittura e la rivalidazione si aspetta il commit
 *     differito (`U.UpdatingTimer`, CLAUDE.md §9.2): leggere prima restituirebbe lo
 *     stato vecchio con l'aria di un esito.
 *
 * ── Che cosa NON prova ───────────────────────────────────────────────────────
 *
 * Non prova il salto sul canvas. Il modale emette `SELECT_NODE` con l'id dell'ELEMENTO,
 * come fa l'albero, e il canvas confronta l'id del nodo React Flow, che e' quello del
 * DVertex: la centratura non e' garantita ed e' un limite dichiarato dello scheletro,
 * non un difetto da scoprire qui. Non prova niente sull'authoring (Step 4), che non
 * esiste. E non misura il costo su un metamodello realistico: due istanze non sono una
 * misura di costo, e la spec §9 chiede quella misura prima di rendere automatica la
 * rivalutazione, non prima di lasciarla a comando.
 *
 * Con il dev server su (P8: porta 3000, non 3001):
 *   cd frontend && npx tsx ../docs/discovery/harness/probe_2026-09-08_validation_skeleton_step3.mts
 */
import playwright from '../../../frontend/node_modules/@playwright/test/index.js';
const { chromium } = playwright as unknown as typeof import('@playwright/test');
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { BASE_URL, NAV_MS, SETTLE_MS, createProject, seed } from '../../../frontend/scripts/smoke/states.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const shot = (n: string) => resolve(HERE, `_tmp_val3_${n}.png`);

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
const ctx = await browser.newContext({ viewport: { width: 1500, height: 950 } });
await ctx.addInitScript(() => { (window as any).__name = (f: any) => f; });
await seed(ctx, true);
const page = await ctx.newPage();
const errors: string[] = [];
page.on('pageerror', (e) => errors.push(e.message));

await page.goto(`${BASE_URL}/all-projects`, { waitUntil: 'domcontentloaded', timeout: NAV_MS });
await page.waitForTimeout(SETTLE_MS);
const pid = await createProject(page, `Smoke_VAL3_${Date.now()}`);
if (!pid) { console.log('FIXTURE FAILED: createProject'); await browser.close(); process.exit(1); }
await page.goto(`${BASE_URL}/#/project?id=${pid}`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(NAV_MS + SETTLE_MS);

// ── A ────────────────────────────────────────────────────────────────────────
h('A. La fixture: un metamodello, un modello, due istanze — una `done`, una no');

/**
 * La fixture si costruisce A TAPPE, con un'attesa fra l'una e l'altra, e non e'
 * prudenza: misurato in questo giro che scrivendola tutta in un `evaluate` solo
 * `addAttribute` non ha ancora committato quando `addObject` gira, e `addObject`
 * restituisce `undefined` creando zero istanze. E' la stessa cosa che CLAUDE.md §9.2
 * chiama «deferred attribute setting», ed e' il motivo per cui ogni tappa qui sotto
 * finisce con un `waitForTimeout`.
 */
const s1 = await page.evaluate(() => {
    const w = window as any;
    const project = w.LProject.getProject();
    if (!project) return { ok: false as const, error: 'no project' };
    const dM2 = w.DModel.new('TaskMM', undefined, true);
    const lM2 = w.LModel.fromD(dM2);
    w.SetFieldAction.new(project.id, 'metamodels', lM2.id, '+=', true);
    const lPkg = w.LPackage.fromD(lM2.addChild('package'));
    lPkg.name = 'tasks';
    const lTask = w.LClass.fromD(lPkg.addClass('Task'));
    return { ok: true as const, m2: dM2.id, taskClass: lTask.id };
});
if (!s1.ok) { console.log('FIXTURE FAILED: ' + (s1 as any).error); await browser.close(); process.exit(1); }
await page.waitForTimeout(COMMIT_MS);

await page.evaluate((task: string) => {
    (window as any).LPointerTargetable.fromPointer(task).addAttribute('done', 'Pointer_EBOOLEAN');
}, s1.taskClass);
await page.waitForTimeout(COMMIT_MS);

const s3 = await page.evaluate((m2: string) => {
    const w = window as any;
    const project = w.LProject.getProject();
    const dM1 = w.DModel.new('TaskModel', m2, false);
    w.SetFieldAction.new(project.id, 'models', dM1.id, '+=', true);
    return { m1: dM1.id };
}, s1.m2);
await page.waitForTimeout(COMMIT_MS);

await page.evaluate(([m1, task]: string[]) => {
    const w = window as any;
    const lM1 = w.LPointerTargetable.fromPointer(m1);
    const lTask = w.LPointerTargetable.fromPointer(task);
    lM1.addObject({}, lTask);
    lM1.addObject({}, lTask);
}, [s3.m1, s1.taskClass] as any);
await page.waitForTimeout(COMMIT_MS * 2);

// Il blocco G, prima di popolare: con lo slot MAI SCRITTO, quanto vale `done`?
const unset = await page.evaluate((m1: string) => {
    const w = window as any;
    const lm = w.LPointerTargetable.fromPointer(m1);
    const objs = (lm?.allSubObjects ?? lm?.objects ?? []) as any[];
    return objs.map((o: any) => { try { return o['$done']?.value ?? null; } catch { return 'throw'; } });
}, s3.m1);

// Poi il valore su ENTRAMBE, esplicitamente: `true` su una, `false` sull'altra. E' la
// discriminante del blocco B, e senza la seconda scrittura il caso «non scritto» del
// blocco G si mescolerebbe al caso «scritto falso», che sono due esiti diversi.
await page.evaluate((m1: string) => {
    const w = window as any;
    const lm = w.LPointerTargetable.fromPointer(m1);
    const objs = (lm?.allSubObjects ?? lm?.objects ?? []) as any[];
    if (objs[0]) objs[0]['$done'].value = true;
    if (objs[1]) objs[1]['$done'].value = false;
}, s3.m1);
await page.waitForTimeout(COMMIT_MS);

const built = { m1: s3.m1, taskClass: s1.taskClass };

const fixture = await page.evaluate((m1: string) => {
    const w = window as any;
    const lm = w.LPointerTargetable.fromPointer(m1);
    const objs = (lm?.allSubObjects ?? lm?.objects ?? []) as any[];
    return {
        count: objs.length,
        done: objs.map((o: any) => { try { return o['$done']?.value ?? null; } catch { return 'throw'; } }),
        ids: objs.map((o: any) => o.id),
    };
}, built.m1);
note('slot MAI scritto (blocco G)', unset);
note('istanze del modello, dopo la scrittura esplicita', fixture);
check('G  un booleano opzionale mai scritto vale null, NON false: assente non e\' falso',
    unset.length === 2 && unset.every((v: any) => v === null),
    `valori prima di scrivere = ${JSON.stringify(unset)}`);
check('il modello ha due istanze, una `done` e una no',
    fixture.count === 2 && JSON.stringify([...fixture.done].sort()) === JSON.stringify([false, true]),
    `done = ${JSON.stringify(fixture.done)}`);

// ── B + C ────────────────────────────────────────────────────────────────────
h('B+C. Le cinque regole, e i tre numeri');

await page.evaluate(([VP_ID, cls]: string[]) => {
    const w = window as any;
    w.DValidationViewpoint.new();
    w.DValidationRule.new(VP_ID, 'mustBeDone', cls, 'done', 'the task is not done');
    w.DValidationRule.new(VP_ID, 'alwaysTrue', cls, 'true', 'never seen');
    w.DValidationRule.new(VP_ID, 'silenced', cls, 'false', 'spenta', false);
    w.DValidationRule.new(VP_ID, 'typo', cls, 'dne', 'refuso nel nome');
    w.DValidationRule.new(VP_ID, 'broken', cls, 'coll.forAll(x => x.p)', 'non compila');
}, [VP_ID, built.taskClass] as any);
await page.waitForTimeout(COMMIT_MS);

const rules = await page.evaluate((VP_ID: string) => {
    const idl = (window as any).store.getState().idlookup;
    const vp = idl[VP_ID];
    return (vp?.rules ?? []).map((r: string) => ({ name: idl[r]?.name, enabled: idl[r]?.enabled }));
}, VP_ID);
note('regole create', rules);
check('cinque regole, una spenta', rules.length === 5 && rules.filter((r: any) => r.enabled === false).length === 1,
    JSON.stringify(rules));

// ── E ────────────────────────────────────────────────────────────────────────
h('E. Il giro completo, dal BOTTONE della toolbar');

// Il modello aperto: si apre la sua tab, che e' il perimetro di R-VAL-14. `open2` e'
// la via vera — sceglie la superficie da `isMetamodel` — e non `open`, che vuole un
// gruppo e una tab gia' fatta.
await page.evaluate(async (m1: string) => {
    const w = window as any;
    await w.DockManager.open2(w.LPointerTargetable.fromPointer(m1));
}, built.m1);
await page.waitForTimeout(NAV_MS);

const btn = page.locator('button[title="Validate the open model against the active rules"]');
const btnCount = await btn.count();
check('il bottone «Validate» e\' sulla toolbar del modello', btnCount === 1, `${btnCount} bottoni trovati`);
await page.screenshot({ path: shot('a_toolbar') });

if (btnCount === 1) {
    await btn.first().click();
    await page.waitForTimeout(SETTLE_MS);
}

const modal = await page.evaluate(() => {
    const root = document.querySelector('.validation-results');
    if (!root) return null;
    const stats = Array.from(root.querySelectorAll('.validation-results__stat')).map(s => ({
        value: s.querySelector('.validation-results__stat-value')?.textContent ?? '',
        label: s.querySelector('.validation-results__stat-label')?.textContent ?? '',
    }));
    return {
        title: root.querySelector('.validation-results__title')?.textContent ?? '',
        stats,
        meta: root.querySelector('.validation-results__meta')?.textContent ?? '',
        items: Array.from(root.querySelectorAll('.validation-results__item-btn')).map(i => ({
            element: i.querySelector('.validation-results__item-element')?.textContent ?? '',
            message: i.querySelector('.validation-results__item-message')?.textContent ?? '',
            rule: i.querySelector('.validation-results__item-rule')?.textContent ?? '',
        })),
        notes: Array.from(root.querySelectorAll('.validation-results__note')).map(n => (n.textContent ?? '').trim()),
    };
});
note('il modale a schermo', modal);
await page.screenshot({ path: shot('b_modal') });

check('il modale e\' a schermo e nomina il modello', !!modal && modal.title.includes('TaskModel'),
    `title = ${modal?.title}`);
check('C  i TRE numeri ci sono, e sono quelli attesi: 1 violazione, 1 regola inattiva, 2 non valutabili',
    !!modal && modal.stats.length === 3 &&
    modal.stats[0].value === '1' && modal.stats[1].value === '1' && modal.stats[2].value === '2',
    JSON.stringify(modal?.stats));
check('B  la violazione e\' UNA sola: il ponte porta i valori M1 fino al corpo della regola',
    !!modal && modal.items.length === 1 && modal.items[0].rule === 'mustBeDone',
    JSON.stringify(modal?.items));
check('la riga sulle non valutabili compare, e quella sulle regole che non compilano anche',
    !!modal && modal.notes.length === 2 &&
    modal.notes[0].includes('could not produce a verdict') &&
    modal.notes[1].includes('compile'),
    JSON.stringify(modal?.notes));

// ── D ────────────────────────────────────────────────────────────────────────
h('D. Il registro: le violazioni sono voci, le non valutabili no');

const registry = await page.evaluate(() => {
    const m = (window as any)._jjNodeProblems as Map<string, any>;
    const all = Array.from(m?.values?.() ?? []);
    const val = all.filter(p => p.kind === 'validation');
    return {
        totale: all.length,
        validation: val.length,
        kinds: Array.from(new Set(all.map(p => p.kind))),
        voci: val.map(p => ({ id: p.id, nodeId: p.nodeId, title: p.title, severity: p.severity, owner: !!p.ownerModelId })),
    };
});
note('registro dei problemi', registry);
check('UNA voce di kind `validation`: le non valutabili non sono diventate rumore',
    registry.validation === 1, `voci validation = ${registry.validation} su ${registry.totale} totali`);
check('la voce e\' ancorata all\'id dell\'ELEMENTO e porta il proprietario',
    registry.voci.length === 1 && fixture.ids.includes(registry.voci[0].nodeId) &&
    registry.voci[0].owner === true && registry.voci[0].severity === 'error',
    JSON.stringify(registry.voci));

// ── F ────────────────────────────────────────────────────────────────────────
h('F. Controllo positivo che DISCRIMINA (P12): il numero deve CAMBIARE');

await page.evaluate(() => { document.querySelector<HTMLElement>('.validation-results__close')?.click(); });
await page.waitForTimeout(500);

const flipped = await page.evaluate((m1: string) => {
    const w = window as any;
    const lm = w.LPointerTargetable.fromPointer(m1);
    const objs = (lm?.allSubObjects ?? lm?.objects ?? []) as any[];
    for (const o of objs) {
        try { if (o['$done']?.value === true) { o['$done'].value = false; return { flipped: o.id }; } } catch { /* skip */ }
    }
    return { flipped: null };
}, built.m1);
note('spento `done` sull\'istanza che ce l\'aveva', flipped);
// L'attesa e' obbligatoria: leggere prima del commit differito restituirebbe lo stato
// vecchio, cioe' un numero invariato che si leggerebbe come «il comando non ricalcola».
await page.waitForTimeout(COMMIT_MS * 2);

await btn.first().click();
await page.waitForTimeout(SETTLE_MS);

const after = await page.evaluate(() => {
    const root = document.querySelector('.validation-results');
    if (!root) return null;
    return {
        violazioni: root.querySelector('.validation-results__stat-value')?.textContent ?? '',
        items: root.querySelectorAll('.validation-results__item-btn').length,
    };
});
note('dopo la modifica del modello', after);
await page.screenshot({ path: shot('c_after') });
check('le violazioni passano da 1 a 2: il comando ricalcola davvero sul modello di adesso',
    !!after && after.violazioni === '2' && after.items === 2,
    `violazioni = ${after?.violazioni}, voci in lista = ${after?.items}`);

const registry2 = await page.evaluate(() => {
    const m = (window as any)._jjNodeProblems as Map<string, any>;
    return Array.from(m?.values?.() ?? []).filter(p => p.kind === 'validation' && !p.resolvedAt).length;
});
check('e il registro le segue: due voci non risolte', registry2 === 2, `voci = ${registry2}`);

// ── Esito ────────────────────────────────────────────────────────────────────
h('ESITO');
if (errors.length) console.log('  pageerror raccolti:\n' + errors.map(e => '        ' + e).join('\n'));
check('nessun errore di pagina in tutto il giro', errors.length === 0, `${errors.length} pageerror`);
console.log(`\n  ${pass} PASS   ${fail} FAIL`);
await browser.close();
if (fail > 0) process.exitCode = 1;
