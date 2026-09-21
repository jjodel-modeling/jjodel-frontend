/**
 * probe_2026-09-09_semaforo_end_to_end — la fetta intera, dal semaforo del libro alle
 * tre invarianti scritte a mano nell'ambiente di authoring.
 *
 * Chiusura dello scheletro della validazione definita dall'utente. Gli step 0-4 hanno
 * ciascuno la propria misura; questa e' l'unica che li attraversa tutti nello stesso
 * giro, sullo stesso progetto, senza scorciatoie: il viewpoint nasce da un click, le
 * regole si scrivono nei campi, il verdetto si legge a schermo.
 *
 * READ-ONLY sul codice: nessun file di `frontend/src` toccato. Se il giro trova un
 * difetto lo riferisce e si ferma li'.
 *
 * ── Che cosa misura, e perche' ciascun blocco esiste ─────────────────────────
 *
 *  A. IL SEMAFORO, COSTRUITO. Metamodello `State` / `Transition` / `Event` con
 *     `isInitial`, `isFinal`, `ownedTransitions` (molti) e `nextState` (uno); modello
 *     Red-Green-Yellow con tre transizioni in ciclo e Red iniziale. E' l'esempio
 *     conduttore del libro, non una fixture di comodo: le tre invarianti della Tabella
 *     7.5 parlano di questo.
 *
 *  B. IL VIEWPOINT NASCE DA UN CLICK. Prima non c'e'; si apre l'ambiente dalla toolbar
 *     del metamodello e si preme «New rule»; adesso c'e'. E' la materializzazione alla
 *     prima scrittura (R-DMV-6) vista da fuori, e la prova che nessun pezzo di codice
 *     deve essere eseguito a mano per cominciare.
 *
 *  C. LE QUATTRO REGOLE, SCRITTE NEI CAMPI. Le tre invarianti del libro piu' una quarta
 *     nella forma ORIGINALE della Tabella 7.5 — `forall t in coll: pred` — lasciata li'
 *     apposta. Il corpo entra da Monaco con `insertText` e non con `type`: Monaco chiude
 *     da solo le parentesi, e una parentesi in piu' misurerebbe l'editor invece della
 *     regola. Che il testo sia arrivato intatto lo dice l'asserzione, che rilegge il
 *     D-LAYER e lo confronta con quello che si voleva scrivere.
 *
 *  D. IL VERDETTO SUL MODELLO SANO, E IL TERZO NUMERO. Zero violazioni — e il terzo
 *     numero **non** e' zero: conta le valutazioni della quarta regola, che restituisce
 *     un insieme e non un verdetto. E' la prova dal vivo che la strada silenziosa e'
 *     chiusa (R-VAL-14): senza quel numero, l'autore della forma del libro leggerebbe
 *     «nessuna violazione» e concluderebbe che il modello e' valido, quando la sua regola
 *     non ha mai risposto.
 *
 *  E. LA VIOLAZIONE COMPARE E SPARISCE. Tolto `isInitial` a Red la prima invariante
 *     viola; rimesso, sparisce. E' il criterio di accettazione del prompt di Fase 2,
 *     alla lettera, ed e' anche il controllo positivo dei blocchi C e D: uno zero che
 *     non sa diventare diverso da zero non e' una misura.
 *
 *  F. L'ESTENSIONE, ANCHE QUI. Un secondo modello di macchina a stati nello stesso
 *     progetto, con il suo unico stato iniziale. Sul primo modello la prima invariante
 *     deve continuare a non violare: se l'estensione tornasse a essere il progetto,
 *     conterebbe due iniziali (R-VAL-15, R-VAL-16).
 *
 * ── LE FIGURE PER LA SEZIONE 5.5 DEL LIBRO ──────────────────────────────────
 *
 * Tre catture, scritte accanto a questa sonda:
 *   `_tmp_book55_1_violation.png`  il modale degli esiti con la violazione
 *   `_tmp_book55_2_resolved.png`   lo stesso, a violazione risolta
 *   `_tmp_book55_3_authoring.png`  l'ambiente con la regola dello stato iniziale
 *                                  e il contesto dichiarato `self: State`
 * Il prefisso `_tmp_` e' quello che `.gitignore` esclude (riga 69): le immagini restano
 * sul disco accanto alla sonda e non entrano nel repository, come gli artefatti di ogni
 * altra sonda di questa cartella. Se servono versionate per il libro, vanno copiate in
 * una cartella di figure, che e' una decisione di quel giro e non di questo.
 *
 * ── Che cosa NON prova ───────────────────────────────────────────────────────
 *
 * Il metamodello e il modello si costruiscono con l'API del L-layer, non cliccando sul
 * canvas: disegnare tre classi e tre istanze a colpi di mouse misurerebbe l'editor
 * grafico, che non e' il soggetto. Cio' che il prompt chiede di fare dall'interfaccia —
 * il viewpoint e le regole — e' fatto dall'interfaccia.
 *
 * Con il dev server su (P8: porta 3000, non 3001):
 *   cd frontend && npx tsx ../docs/discovery/harness/probe_2026-09-09_semaforo_end_to_end.mts
 */
import playwright from '../../../frontend/node_modules/@playwright/test/index.js';
const { chromium } = playwright as unknown as typeof import('@playwright/test');
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { BASE_URL, NAV_MS, SETTLE_MS, createProject, seed } from '../../../frontend/scripts/smoke/states.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const shot = (n: string) => resolve(HERE, `_tmp_book55_${n}.png`);

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

/** Le tre invarianti della Tabella 7.5, piu' la quarta nella forma originale del libro. */
const INV1 = '(forall s in State.instances such that s.isInitial).size == 1';
const INV2 = 'not isFinal implies ownedTransitions.isNotEmpty';
const INV3 = 'ownedTransitions.all(t => t.nextState != null)';
const INV3_BOOK = 'forall t in ownedTransitions: t.nextState != null';

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1500, height: 950 } });
await ctx.addInitScript(() => { (window as any).__name = (f: any) => f; });
await seed(ctx, true);   // advanced: l'ambiente delle regole vive li' (spec §7)
const page = await ctx.newPage();
const errors: string[] = [];
page.on('pageerror', (e) => errors.push(e.message));

await page.goto(`${BASE_URL}/all-projects`, { waitUntil: 'domcontentloaded', timeout: NAV_MS });
await page.waitForTimeout(SETTLE_MS);
const pid = await createProject(page, `Semaforo_${Date.now()}`);
if (!pid) { console.log('FIXTURE FAILED: createProject'); await browser.close(); process.exit(1); }
await page.goto(`${BASE_URL}/#/project?id=${pid}`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(NAV_MS + SETTLE_MS);

// ── A ────────────────────────────────────────────────────────────────────────
h('A. Il semaforo del libro: metamodello e modello');

const m2 = await page.evaluate(() => {
    const w = window as any;
    const project = w.LProject.getProject();
    if (!project) return { ok: false as const, error: 'no project' };
    const d = w.DModel.new('StateMachine', undefined, true);
    const l = w.LModel.fromD(d);
    w.SetFieldAction.new(project.id, 'metamodels', l.id, '+=', true);
    const pkg = w.LPackage.fromD(l.addChild('package'));
    pkg.name = 'sm';
    return {
        ok: true as const, m2: d.id,
        state: w.LClass.fromD(pkg.addClass('State')).id,
        transition: w.LClass.fromD(pkg.addClass('Transition')).id,
        event: w.LClass.fromD(pkg.addClass('Event')).id,
    };
});
if (!m2.ok) { console.log('FIXTURE FAILED: ' + (m2 as any).error); await browser.close(); process.exit(1); }
await page.waitForTimeout(COMMIT_MS);

const feats = await page.evaluate(([st, tr, ev]: string[]) => {
    const w = window as any;
    const lst = w.LPointerTargetable.fromPointer(st);
    const ltr = w.LPointerTargetable.fromPointer(tr);
    lst.addAttribute('isInitial', 'Pointer_EBOOLEAN');
    lst.addAttribute('isFinal', 'Pointer_EBOOLEAN');
    const owned = lst.addReference('ownedTransitions', tr);
    ltr.addReference('nextState', st);
    ltr.addReference('trigger', ev);
    return { owned: owned?.id ?? null };
}, [m2.state, m2.transition, m2.event] as any);
await page.waitForTimeout(COMMIT_MS);
// `ownedTransitions` e' a molti: senza, `all(...)` girerebbe su un solo elemento.
await page.evaluate((id: string) => { (window as any).LPointerTargetable.fromPointer(id).upperBound = -1; }, feats.owned);
await page.waitForTimeout(COMMIT_MS);

/** Costruisce una macchina a stati: N stati in ciclo, il primo iniziale. */
async function buildMachine(name: string, stateNames: string[]) {
    const made = await page.evaluate(([m2id, name]: string[]) => {
        const w = window as any;
        const project = w.LProject.getProject();
        const d = w.DModel.new(name, m2id, false);
        w.SetFieldAction.new(project.id, 'models', d.id, '+=', true);
        return d.id;
    }, [m2.m2, name] as any);
    await page.waitForTimeout(COMMIT_MS);

    await page.evaluate(([mid, st, tr, names]: any[]) => {
        const w = window as any;
        const lm = w.LPointerTargetable.fromPointer(mid);
        const lst = w.LPointerTargetable.fromPointer(st);
        const ltr = w.LPointerTargetable.fromPointer(tr);
        for (const _ of names) lm.addObject({}, lst);
        for (const _ of names) lm.addObject({}, ltr);
    }, [made, m2.state, m2.transition, stateNames] as any);
    await page.waitForTimeout(COMMIT_MS * 2);

    // Nomi, flag e legami. Le reference si scrivono con `.values = [id]`: misurato in
    // questo giro che `.value = <oggetto>` e `.value = <id>` su uno slot di reference
    // NON lanciano e NON scrivono — restano `values: []`, ed e' la forma peggiore di
    // fallimento perche' sembra riuscita.
    await page.evaluate(([mid, names]: any[]) => {
        const w = window as any;
        const objs = (w.LPointerTargetable.fromPointer(mid)?.allSubObjects ?? []) as any[];
        const states = objs.filter(o => o.instanceof?.name === 'State');
        const trans = objs.filter(o => o.instanceof?.name === 'Transition');
        states.forEach((s: any, i: number) => {
            s.name = names[i];
            s['$isInitial'].value = i === 0;
            s['$isFinal'].value = false;
        });
        trans.forEach((t: any, i: number) => {
            t.name = names[i] + '_to_' + names[(i + 1) % names.length];
            t['$nextState'].values = [states[(i + 1) % states.length].id];
        });
        states.forEach((s: any, i: number) => { s['$ownedTransitions'].values = [trans[i].id]; });
    }, [made, stateNames] as any);
    await page.waitForTimeout(COMMIT_MS * 2);
    return made;
}

const semaforo = await buildMachine('Semaforo', ['Red', 'Green', 'Yellow']);

const fixture = await page.evaluate((mid: string) => {
    const w = window as any;
    const objs = (w.LPointerTargetable.fromPointer(mid)?.allSubObjects ?? []) as any[];
    const states = objs.filter(o => o.instanceof?.name === 'State');
    return states.map((s: any) => ({
        name: s.name,
        isInitial: s['$isInitial']?.value ?? null,
        owned: (s['$ownedTransitions']?.values ?? []).length,
        // `values` sulla proxy L torna gli oggetti AVVOLTI, non gli id: il getter di
        // default risolve ogni puntatore (`__shallowSolver`). La prima stesura
        // confrontava un id con un oggetto e leggeva zero target su un modello che ne
        // aveva tre — e le invarianti, che li vedevano, erano in disaccordo con il
        // lettore. Aveva ragione l'evaluator.
        target: (() => { const t = s['$ownedTransitions']?.values?.[0]; if (!t) return null;
            const tid = t.id ?? t;
            const tr = objs.find((o: any) => o.id === tid); return tr?.['$nextState']?.values?.length ?? 0; })(),
    }));
}, semaforo);
note('il semaforo', fixture);
check('tre stati, uno solo iniziale, ciascuno con una transizione che ha un target',
    fixture.length === 3 && fixture.filter((s: any) => s.isInitial === true).length === 1 &&
    fixture.every((s: any) => s.owned === 1 && s.target === 1),
    JSON.stringify(fixture));

// ── B ────────────────────────────────────────────────────────────────────────
h('B. Il viewpoint di validazione nasce da un click, non da codice');

const before = await page.evaluate((VP: string) => !!(window as any).store.getState().idlookup[VP], VP_ID);
check('prima non esiste', before === false, `idlookup[VP] = ${before}`);

await page.evaluate(async (id: string) => {
    const w = window as any;
    await w.DockManager.open2(w.LPointerTargetable.fromPointer(id));
}, m2.m2);
await page.waitForTimeout(NAV_MS);

const rulesBtn = page.locator('button[title="Validation rules of this metamodel"]:visible');
if (await rulesBtn.count() !== 1) { console.log('FIXTURE FAILED: bottone regole assente'); await browser.close(); process.exit(1); }
await rulesBtn.first().click();
await page.waitForTimeout(SETTLE_MS);
await page.locator('.validation-rules__class', { hasText: 'State' }).first().click();
await page.waitForTimeout(500);
await page.locator('.validation-rules__new').first().click();
await page.waitForTimeout(COMMIT_MS * 2);

const after = await page.evaluate((VP: string) => {
    const d = (window as any).store.getState().idlookup[VP];
    return d && { className: d.className, name: d.name, rules: (d.rules ?? []).length };
}, VP_ID);
note('dopo il primo «New rule»', after);
check('dopo il click esiste, con una regola dentro',
    !!after && after.className === 'DValidationViewpoint' && after.rules === 1, JSON.stringify(after));

// ── C ────────────────────────────────────────────────────────────────────────
h('C. Le quattro regole, scritte nei campi dell\'ambiente');

/** Riempie la regola selezionata. Il corpo passa da `insertText`: Monaco chiude da solo
 *  le parentesi, e `type` misurerebbe l'editor invece della regola. */
async function fillRule(name: string, body: string, message: string) {
    await page.locator('.validation-rules__input').first().fill(name);
    await page.locator('.validation-rules__input--wide').first().click();
    await page.waitForTimeout(400);
    await page.locator('.validation-rules__input--wide').first().fill(message);
    await page.locator('.validation-rules__input').first().click();
    await page.waitForTimeout(400);
    const ta = page.locator('.validation-rules__monaco .monaco-editor textarea').first();
    await ta.click({ force: true });
    await page.keyboard.press('Control+A');
    await page.keyboard.insertText(body);
    await page.locator('.validation-rules__input').first().click();
    await page.waitForTimeout(COMMIT_MS);
}

async function newRule() {
    await page.locator('.validation-rules__new').first().click();
    await page.waitForTimeout(COMMIT_MS * 2);
}

await fillRule('oneInitialState', INV1, 'exactly one initial state');
await page.screenshot({ path: shot('3_authoring') });   // figura 3 del libro
await newRule(); await fillRule('nonFinalHasOutgoing', INV2, 'a non-final state needs an outgoing transition');
await newRule(); await fillRule('transitionsHaveTarget', INV3, 'every transition needs a target');
await newRule(); await fillRule('bookOriginalForm', INV3_BOOK, 'the original form of table 7.5');

const ctxLine = await page.evaluate(() => document.querySelector('.validation-rules__context')?.textContent ?? '');
check('il contesto e\' dichiarato sopra il corpo', ctxLine.trim() === 'self: State', `letto: «${ctxLine}»`);

const stored = await page.evaluate((VP: string) => {
    const idl = (window as any).store.getState().idlookup;
    return (idl[VP]?.rules ?? []).map((r: string) => ({ name: idl[r]?.name, body: idl[r]?.body, ctx: idl[r]?.context }));
}, VP_ID);
note('le regole nel D-layer', stored);
check('le quattro regole sono nel modello, con il corpo INTATTO come lo si e\' scritto',
    stored.length === 4 &&
    stored[0].body === INV1 && stored[1].body === INV2 &&
    stored[2].body === INV3 && stored[3].body === INV3_BOOK &&
    stored.every((r: any) => r.ctx === m2.state),
    JSON.stringify(stored.map((r: any) => [r.name, r.body])));

await page.locator('.validation-rules__close').first().click();
await page.waitForTimeout(500);

// ── D ────────────────────────────────────────────────────────────────────────
h('D. Il verdetto sul modello sano, e il terzo numero (R-VAL-14)');

async function validate(modelId: string) {
    await page.evaluate(async (id: string) => {
        const w = window as any;
        await w.DockManager.open2(w.LPointerTargetable.fromPointer(id));
    }, modelId);
    await page.waitForTimeout(NAV_MS);
    await page.locator('button[title="Validate the open model against the active rules"]:visible').first().click();
    await page.waitForTimeout(SETTLE_MS);
    return page.evaluate(() => {
        const root = document.querySelector('.validation-results');
        if (!root) return null;
        return {
            title: root.querySelector('.validation-results__title')?.textContent ?? '',
            stats: Array.from(root.querySelectorAll('.validation-results__stat')).map(s =>
                (s.querySelector('.validation-results__stat-value')?.textContent ?? '')),
            meta: root.querySelector('.validation-results__meta')?.textContent ?? '',
            items: Array.from(root.querySelectorAll('.validation-results__item-btn')).map(i => ({
                element: i.querySelector('.validation-results__item-element')?.textContent ?? '',
                rule: i.querySelector('.validation-results__item-rule')?.textContent ?? '',
            })),
        };
    });
}
const closeResults = () => page.evaluate(() => {
    document.querySelector<HTMLElement>('.validation-results__close')?.click();
});

const sano = await validate(semaforo);
note('esito sul semaforo sano', sano);
await page.screenshot({ path: shot('2_resolved') });   // figura 2 del libro
check('nessuna violazione sul modello sano',
    !!sano && sano.stats[0] === '0' && sano.items.length === 0, JSON.stringify(sano?.stats));
check('il TERZO numero non e\' zero: conta la quarta regola, che restituisce un insieme e non un verdetto',
    !!sano && sano.stats[2] === '3',
    `non valutabili = ${sano?.stats[2]} (atteso 3: la forma del libro su tre stati)`);
check('e nessuna regola e\' spenta: lo zero delle violazioni non viene da una validazione silenziata',
    !!sano && sano.stats[1] === '0', `regole inattive = ${sano?.stats[1]}`);
await closeResults();

// ── E ────────────────────────────────────────────────────────────────────────
h('E. Tolto lo stato iniziale la prima invariante viola; rimesso, sparisce');

const setInitial = async (value: boolean) => {
    await page.evaluate(([mid, v]: any[]) => {
        const w = window as any;
        const objs = (w.LPointerTargetable.fromPointer(mid)?.allSubObjects ?? []) as any[];
        const red = objs.find((o: any) => o.name === 'Red');
        if (red) red['$isInitial'].value = v;
    }, [semaforo, value] as any);
    await page.waitForTimeout(COMMIT_MS * 2);
};

await setInitial(false);
const rotto = await validate(semaforo);
note('esito senza stato iniziale', rotto);
await page.screenshot({ path: shot('1_violation') });   // figura 1 del libro
check('la prima invariante viola, e viola solo lei',
    !!rotto && rotto.items.length === 3 &&
    rotto.items.every((i: any) => i.rule === 'oneInitialState'),
    JSON.stringify(rotto?.items));
await closeResults();

await setInitial(true);
const risanato = await validate(semaforo);
note('esito con lo stato iniziale rimesso', risanato);
check('la violazione sparisce, e il terzo numero resta quello di prima',
    !!risanato && risanato.items.length === 0 && risanato.stats[0] === '0' && risanato.stats[2] === '3',
    JSON.stringify(risanato?.stats));
await closeResults();

// ── F ────────────────────────────────────────────────────────────────────────
h('F. Una seconda macchina a stati nello stesso progetto (R-VAL-15, R-VAL-16)');

const seconda = await buildMachine('Ascensore', ['Fermo', 'Salita']);
const dopoSeconda = await validate(semaforo);
note('esito sul semaforo, con la seconda macchina nel progetto', dopoSeconda);
check('la prima invariante continua a NON violare: l\'estensione e\' il modello, non il progetto',
    !!dopoSeconda && dopoSeconda.items.length === 0 && dopoSeconda.stats[0] === '0',
    `violazioni = ${dopoSeconda?.stats[0]}, meta = «${dopoSeconda?.meta}»`);
await closeResults();

const suSeconda = await validate(seconda);
note('esito sulla seconda macchina', suSeconda);
check('e la seconda macchina, validata a sua volta, e\' sana anche lei',
    !!suSeconda && suSeconda.title.includes('Ascensore') && suSeconda.items.length === 0,
    JSON.stringify(suSeconda?.stats));

// ── Esito ────────────────────────────────────────────────────────────────────
h('ESITO');
console.log('  figure per la sezione 5.5, accanto a questa sonda:');
for (const n of ['1_violation', '2_resolved', '3_authoring']) console.log('        ' + shot(n));
if (errors.length) console.log('  pageerror raccolti:\n' + errors.map(e => '        ' + e).join('\n'));
check('nessun errore di pagina in tutto il giro', errors.length === 0, `${errors.length} pageerror`);
console.log(`\n  ${pass} PASS   ${fail} FAIL`);
await browser.close();
if (fail > 0) process.exitCode = 1;
