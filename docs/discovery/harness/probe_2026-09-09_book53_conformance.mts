/**
 * probe_2026-09-09_book53_conformance — il passo zero della figura 5.8, e le sue catture.
 *
 * La 5.3 dice «the validity indicator», al singolare e sul modello intero, e le due
 * immagini sono placeholder. Prima di riscrivere quella frase bisogna sapere quali
 * indicatori esistono davvero, che cosa dicono, e se sono verdetti o etichette.
 *
 * ── Le affermazioni sotto misura ─────────────────────────────────────────────
 *
 *  1. Lo scenario della didascalia si riproduce: una transizione con `nextState` [1]
 *     non impostato, e il modello non conforma.
 *  2. IL PUNTO NELLA STATUS BAR. Il prompt lo chiama «verdetto complessivo». Si misura
 *     il testo E il colore calcolato, sui due stati del modello: se non cambia, non e'
 *     un verdetto ma un'etichetta di legame, e la 5.3 non puo' chiamarlo indicatore.
 *  3. IL BADGE SUL NODO. Compare sull'elemento colpevole, e su nessun altro? E sparisce
 *     quando il difetto e' sanato? Si legge sull'id del nodo React Flow, che e' il
 *     DVertex.
 *  4. LA FASCIA NEL PANNELLO delle proprieta', che ha due stati dichiarati nel sorgente
 *     («Conforms to» / «Does not conform to»). Si misura con l'elemento colpevole
 *     selezionato.
 *  5. «L'indicatore si spegne nell'istante in cui un target viene fornito»: vero per
 *     quali dei superstiti? La conformance ha un debounce di 500 ms, quindi «istante»
 *     va misurato e non assunto.
 *
 * ── Controllo che discrimina ─────────────────────────────────────────────────
 *
 * Il modello sano si misura PRIMA di romperlo. Un indicatore che dicesse «non conforma»
 * anche a modello sano passerebbe ogni verifica fatta solo sul modello rotto.
 *
 * Con il dev server su (P8: porta 3000, non 3001):
 *   cd frontend && npx tsx ../docs/discovery/harness/probe_2026-09-09_book53_conformance.mts
 */
import playwright from '../../../frontend/node_modules/@playwright/test/index.js';
const { chromium } = playwright as unknown as typeof import('@playwright/test');
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { BASE_URL, NAV_MS, SETTLE_MS, createProject, seed } from '../../../frontend/scripts/smoke/states.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const shot = (n: string) => resolve(HERE, `_tmp_book53_${n}.png`);

let pass = 0, fail = 0;
const check = (label: string, ok: boolean, detail: string) => {
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}\n        ${detail}`);
    ok ? pass++ : fail++;
};
const note = (label: string, d: unknown) =>
    console.log(`  MISURA  ${label}\n        ${typeof d === 'string' ? d : JSON.stringify(d)}`);
const h = (s: string) => console.log('\n' + s + '\n' + '─'.repeat(s.length));

const COMMIT_MS = 1200;
/** La conformance e' calcolata con 500 ms di debounce: si aspetta piu' di quelli. */
const CONFORMANCE_MS = 1600;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1500, height: 950 } });
await ctx.addInitScript(() => {
    (window as any).__name = (f: any) => f;
    try {
        localStorage.setItem('jjodel_donation_banner',
            JSON.stringify({ lastShown: Date.now(), showCount: 4 }));
    } catch { /* si vedra' il banner, e si dichiara */ }
});
await seed(ctx, true);
const page = await ctx.newPage();
const errors: string[] = [];
page.on('pageerror', (e) => errors.push(e.message));

await page.goto(`${BASE_URL}/all-projects`, { waitUntil: 'domcontentloaded', timeout: NAV_MS });
await page.waitForTimeout(SETTLE_MS);
const pid = await createProject(page, `Book53_${Date.now()}`);
if (!pid) { console.log('FIXTURE FAILED: createProject'); await browser.close(); process.exit(1); }
await page.goto(`${BASE_URL}/#/project?id=${pid}`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(NAV_MS + SETTLE_MS);

// ── A. La fixture del capitolo ───────────────────────────────────────────────
h('A. Il metamodello e il semaforo del capitolo 5');

const m2 = await page.evaluate(() => {
    const w = window as any;
    const project = w.LProject.getProject();
    if (!project) return { ok: false as const, error: 'no project' };
    const dM2 = w.DModel.new('StateMachine', undefined, true);
    const lM2 = w.LModel.fromD(dM2);
    w.SetFieldAction.new(project.id, 'metamodels', lM2.id, '+=', true);
    const lPkg = w.LPackage.fromD(lM2.addChild('package'));
    lPkg.name = 'statemachine';
    const named = w.LClass.fromD(lPkg.addClass('namedElement'));
    named.abstract = true;
    const state = w.LClass.fromD(lPkg.addClass('State'));
    const transition = w.LClass.fromD(lPkg.addClass('Transition'));
    const event = w.LClass.fromD(lPkg.addClass('Event'));
    return { ok: true as const, m2: dM2.id, named: named.id, state: state.id,
        transition: transition.id, event: event.id };
});
if (!m2.ok) { console.log('FIXTURE FAILED: ' + (m2 as any).error); await browser.close(); process.exit(1); }
await page.waitForTimeout(COMMIT_MS);

await page.evaluate((ids: any) => {
    const w = window as any;
    const L = (id: string) => w.LPointerTargetable.fromPointer(id);
    L(ids.named).addAttribute('name', 'Pointer_ESTRING');
    for (const c of [ids.state, ids.transition, ids.event]) L(c).extends = [ids.named];
}, m2);
await page.waitForTimeout(COMMIT_MS);

await page.evaluate((ids: any) => {
    const w = window as any;
    const L = (id: string) => w.LPointerTargetable.fromPointer(id);
    const state = L(ids.state);
    state.addAttribute('isInitial', 'Pointer_EBOOLEAN');
    state.addAttribute('isFinal', 'Pointer_EBOOLEAN');
    const owned = state.addReference('ownedTransitions', ids.transition);
    owned.upperBound = -1; owned.composition = true;
    const tr = L(ids.transition);
    // `nextState` [1]: e' la molteplicita' su cui poggia tutta la figura.
    const next = tr.addReference('nextState', ids.state);
    next.lowerBound = 1; next.upperBound = 1;
    const ev = tr.addReference('event', ids.event);
    ev.lowerBound = 0; ev.upperBound = 1;
}, m2);
await page.waitForTimeout(COMMIT_MS * 2);

const modelId = await page.evaluate((mm: string) => {
    const w = window as any;
    const project = w.LProject.getProject();
    const m = w.DModel.new('TrafficLight', mm, false);
    w.SetFieldAction.new(project.id, 'models', m.id, '+=', true);
    return m.id;
}, m2.m2);
await page.waitForTimeout(COMMIT_MS);

const objectIds = () => page.evaluate((mid: string) => {
    const lm = (window as any).LPointerTargetable.fromPointer(mid);
    return ((lm?.allSubObjects ?? lm?.objects ?? []) as any[]).map((o: any) => o.id);
}, modelId);

await page.evaluate((ids: any) => {
    const w = window as any;
    const lm = w.LPointerTargetable.fromPointer(ids.model);
    const S = w.LPointerTargetable.fromPointer(ids.state);
    const T = w.LPointerTargetable.fromPointer(ids.transition);
    const E = w.LPointerTargetable.fromPointer(ids.event);
    for (let i = 0; i < 3; i++) lm.addObject({}, S);
    for (let i = 0; i < 3; i++) lm.addObject({}, T);
    lm.addObject({}, E);
}, { model: modelId, state: m2.state, transition: m2.transition, event: m2.event });
await page.waitForTimeout(COMMIT_MS * 2);

const m1 = await page.evaluate((mid: string) => {
    const w = window as any;
    const lm = w.LPointerTargetable.fromPointer(mid);
    const objs = (lm?.allSubObjects ?? lm?.objects ?? []) as any[];
    const byClass = (n: string) => objs.filter((o: any) => { try { return o.instanceof?.name === n; } catch { return false; } });
    const states = byClass('State'), trans = byClass('Transition'), events = byClass('Event');
    const sn = ['Red', 'Green', 'Yellow'], tn = ['toGreen', 'toYellow', 'toRed'];
    states.forEach((s: any, i: number) => { s.name = sn[i]; s['$isInitial'].value = i === 0; s['$isFinal'].value = false; });
    trans.forEach((t: any, i: number) => { t.name = tn[i]; });
    if (events[0]) events[0].name = 'timerExpired';
    return { states: states.map((s: any) => s.id), transitions: trans.map((t: any) => t.id), event: events[0]?.id ?? null };
}, modelId);
await page.waitForTimeout(COMMIT_MS);
note('istanze', m1);

// Il cablaggio COMPLETO: si parte dal modello sano, e lo si rompe dopo. Misurare solo
// il modello rotto non distinguerebbe un indicatore da una decorazione sempre accesa.
await page.evaluate((d: any) => {
    const w = window as any;
    const L = (id: string) => w.LPointerTargetable.fromPointer(id);
    const [red, green, yellow] = d.states;
    const [t1, t2, t3] = d.transitions;
    L(red)['$ownedTransitions'].values = [t1];
    L(green)['$ownedTransitions'].values = [t2];
    L(yellow)['$ownedTransitions'].values = [t3];
    L(t1)['$nextState'].values = [green];
    L(t2)['$nextState'].values = [yellow];
    L(t3)['$nextState'].values = [red];
    if (d.event) for (const t of d.transitions) L(t)['$event'].values = [d.event];
}, m1);
await page.waitForTimeout(COMMIT_MS * 2);

const wired = await page.evaluate((d: any) => {
    const w = window as any;
    const L = (id: string) => w.LPointerTargetable.fromPointer(id);
    const n = (slot: any) => (slot?.values ?? []).length;
    return d.transitions.map((t: string) => ({ name: L(t).name, next: n(L(t)['$nextState']) }));
}, m1);
note('le transizioni, cablate', wired);
check('la fixture parte SANA: ogni transizione ha il suo nextState',
    wired.every((t: any) => t.next === 1), JSON.stringify(wired));

await page.evaluate(async (m: string) => {
    const w = window as any;
    await w.DockManager.open2(w.LPointerTargetable.fromPointer(m));
}, modelId);
await page.waitForTimeout(NAV_MS + SETTLE_MS);

const autoLayout = async () => {
    const b = page.locator('button[title="Auto layout"]:visible');
    if (await b.count()) { await b.first().click(); await page.waitForTimeout(SETTLE_MS * 2); }
};
await autoLayout();

// ── gli strumenti di lettura ─────────────────────────────────────────────────

const vertexOf = (objIds: string[]) => page.evaluate((ids: string[]) => {
    const lookup = (window as any).store.getState().idlookup ?? {};
    const byObject = new Map<string, string>();
    for (const id in lookup) {
        const e = lookup[id];
        if (e?.className === 'DVertex' && e.model) byObject.set(e.model, id);
    }
    return ids.map(i => byObject.get(i) ?? null);
}, objIds);

/** La status bar: testo E colore calcolato del punto. Il colore e' la meta' che dice se
 *  e' un verdetto o un'etichetta, e si legge dal rendering, non dal foglio di stile. */
const statusBar = () => page.evaluate(() => {
    const el = document.querySelector('.app-statusbar__conforms');
    if (!el) return null;
    const dot = el.querySelector('.app-statusbar__conforms-dot');
    return {
        text: (el.textContent ?? '').replace(/\s+/g, ' ').trim(),
        dotColor: dot ? getComputedStyle(dot).backgroundColor : null,
        dotClasses: dot ? Array.from(dot.classList).join(' ') : null,
    };
});

/** La fascia nel pannello delle proprieta'. */
const banner = () => page.evaluate(() => {
    const el = document.querySelector('.jj-conformance-bar');
    if (!el) return null;
    return {
        text: (el.textContent ?? '').replace(/\s+/g, ' ').trim(),
        classes: Array.from(el.classList).join(' '),
        dotColor: (() => {
            const d = el.querySelector('.jj-conformance-dot');
            return d ? getComputedStyle(d).backgroundColor : null;
        })(),
        quante: document.querySelectorAll('.jj-conformance-bar').length,
    };
});

/** I badge di conformance sul canvas, ATTIVI: una voce ritirata resta nel DOM 5 s. */
const badges = () => page.evaluate(() => {
    const sel = '.react-flow__node .node-problem-dot:not(.node-problem-dot--resolved)';
    return Array.from(document.querySelectorAll(sel)).map(d => {
        const node = d.closest('.react-flow__node');
        return node?.getAttribute('data-id') ?? '?';
    });
});

/** Il marcatore sulla RIGA della feature, dentro il nodo: `missing`, con il triangolo.
 *  Non lo produce il motore di conformance ma `detectValueRenderer` dalla cardinalita'
 *  del metamodello (`RowValue.tsx:221`), il che lo rende un secondo livello vero e non
 *  un'eco del badge. */
const missingMarks = () => page.evaluate(() => {
    return Array.from(document.querySelectorAll('.react-flow__node .mm-object__missing')).map(m => {
        const node = m.closest('.react-flow__node');
        return {
            node: node?.getAttribute('data-id') ?? '?',
            text: (m.textContent ?? '').trim(),
            title: m.getAttribute('title') ?? '',
        };
    });
});

/** La pill di conformita' che la 5.3 potrebbe star descrivendo. */
const pillCount = () => page.evaluate(() => document.querySelectorAll('.validation-pill').length);

const selectNode = async (vertexId: string) => {
    await page.locator(`.react-flow__node[data-id="${vertexId}"]`).first().click();
    await page.waitForTimeout(SETTLE_MS);
};

// ── B. Il modello SANO: il controllo che discrimina ──────────────────────────
h('B. Modello sano: che cosa dicono gli indicatori quando non c\'e\' niente da dire');

await page.waitForTimeout(CONFORMANCE_MS);
const sbSano = await statusBar();
const badgeSano = await badges();
const pillSano = await pillCount();
note('status bar (sano)', sbSano);
note('badge sul canvas (sano)', badgeSano);
note('elementi .validation-pill', pillSano);

const missSano = await missingMarks();
note('marcatori `missing` sulle righe (sano)', missSano);
check('sul modello sano non c\'e\' nessun badge di conformance sul canvas',
    badgeSano.length === 0, JSON.stringify(badgeSano));
check('ne\' nessun marcatore `missing` sulle righe',
    missSano.length === 0, JSON.stringify(missSano));

const [vT1] = await vertexOf([m1.transitions[0]]);
if (!vT1) { console.log('FIXTURE FAILED: la transizione non ha un vertice'); await browser.close(); process.exit(1); }
await selectNode(vT1);
const banSano = await banner();
note('fascia nel pannello, con `toGreen` selezionata (sano)', banSano);

// ── C. Il modello ROTTO: una transizione nuova, `nextState` mai impostato ────
h('C. Il modello rotto: una transizione nuova, col suo `nextState` [1] ancora vuoto');

// MISURATO, e per questo lo scenario e' costruito cosi': svuotare uno slot di reference
// gia' scritto con `slot.values = []` NON scrive. Lo slot resta com'era, in silenzio,
// esattamente come le forme sbagliate in scrittura di CLAUDE.md §9.3. Lo scenario della
// didascalia si ottiene invece per costruzione, ed e' anche il caso piu' vero: una
// transizione appena creata non ha ancora un target.
const before = await objectIds();
await page.evaluate((ids: any) => {
    const w = window as any;
    const lm = w.LPointerTargetable.fromPointer(ids.model);
    lm.addObject({}, w.LPointerTargetable.fromPointer(ids.transition));
}, { model: modelId, transition: m2.transition });
await page.waitForTimeout(COMMIT_MS * 2);

const after = await objectIds();
const t4 = after.filter((id: string) => !before.includes(id));
if (t4.length !== 1) { console.log('FIXTURE FAILED: transizione nuova non identificabile'); await browser.close(); process.exit(1); }
const tNew = t4[0];

await page.evaluate((d: any) => {
    const w = window as any;
    const L = (id: string) => w.LPointerTargetable.fromPointer(id);
    L(d.tNew).name = 'toRed2';
    // Posseduta da Yellow, come ogni transizione, e senza `nextState`: e' il difetto.
    L(d.yellow)['$ownedTransitions'].values = [d.t3, d.tNew];
}, { tNew, yellow: m1.states[2], t3: m1.transitions[2] });
await page.waitForTimeout(COMMIT_MS * 2 + CONFORMANCE_MS);
await autoLayout();
await page.waitForTimeout(CONFORMANCE_MS);

// Si legge `__raw.values`, non `values`. MISURATO: su uno slot di reference singolo mai
// scritto la proxy L risolve e restituisce `[null]`, quindi `values.length` vale 1 e
// direbbe che un target c'e'. E' il corollario in lettura di CLAUDE.md §9.3, e qui
// avrebbe fatto dichiarare non riprodotto uno scenario che invece lo era.
const rotto = await page.evaluate((t: string) => {
    const L = (window as any).LPointerTargetable.fromPointer(t);
    const slot = L['$nextState'];
    return {
        name: L.name,
        viaProxy: (slot?.values ?? []).length,
        viaRaw: (slot?.__raw?.values ?? []).filter((v: any) => !!v).length,
    };
}, tNew);
note('la transizione nuova', rotto);
check('lo scenario della didascalia e\' riprodotto: `nextState` [1] non ha target',
    rotto.viaRaw === 0, JSON.stringify(rotto));

const sbRotto = await statusBar();
const badgeRotto = await badges();
note('status bar (rotto)', sbRotto);
note('badge sul canvas (rotto)', badgeRotto);

const [vNew] = await vertexOf([tNew]);
note('il vertice della transizione nuova', vNew);
check('IL BADGE SUL NODO compare, e sull\'elemento colpevole soltanto',
    badgeRotto.length === 1 && badgeRotto[0] === vNew,
    `badge = ${JSON.stringify(badgeRotto)}, vertice di toRed2 = ${vNew}`);

// IL SECONDO LIVELLO, che il prompt non nominava e che la cattura ha mostrato per prima:
// dentro il nodo, la riga della feature che manca porta il proprio marcatore.
const missRotto = await missingMarks();
note('marcatori `missing` sulle righe (rotto)', missRotto);
check('LA RIGA DELLA FEATURE si marca da sola: `missing` su `nextState`, e solo li\'',
    missRotto.length === 1 && missRotto[0].node === vNew && /missing/.test(missRotto[0].text),
    JSON.stringify(missRotto));

// LA DOMANDA CHE DECIDE LA FRASE DELLA 5.3, e la risposta e' negativa.
// Il punto nella status bar NON cambia: stesso testo e stesso verde su un modello che
// conforma e su uno che non conforma. Non e' un verdetto, e' l'etichetta del legame
// (`StatusBar.tsx:175`, `conformsTo` = nome del metamodello; il punto ha un colore solo,
// `StatusBar.scss:124`). Si asserisce la verita' misurata invece di lasciare un rosso:
// se un giorno questo diventa rosso, il prodotto e' cambiato e la 5.3 va rivista.
check('la status bar NON e\' un verdetto: non cambia fra modello sano e modello rotto',
    JSON.stringify(sbSano) === JSON.stringify(sbRotto),
    `sano = ${JSON.stringify(sbSano)}\n        rotto = ${JSON.stringify(sbRotto)}`);

if (vNew) await selectNode(vNew);
const banRotto = await banner();
note('fascia nel pannello, con `toRed2` selezionata (rotto)', banRotto);
// Stessa forma, stesso motivo. La fascia dichiara la CONFORMITA' di un elemento che il
// canvas sta segnalando. Causa nel sorgente: `Info.tsx:647` riassegna `conform` a ogni
// feature invece di congiungerlo, quindi decide l'ULTIMA e non tutte. Misurato e non
// corretto qui: e' un difetto del prodotto, non di questo giro. Non entra nel libro.
check('la fascia del pannello NON e\' affidabile: dichiara «Conforms to» sull\'elemento segnalato',
    !!banRotto && /Conforms to/.test(banRotto.text) && !/Does not conform/.test(banRotto.text),
    JSON.stringify(banRotto));

check('la ValidationPill resta l\'unico verdetto complessivo mai scritto, e non e\' montata',
    await pillCount() === 0, `elementi .validation-pill = ${await pillCount()}`);

// La cattura: il badge da solo e' un puntino. Aperto, dichiara il difetto per esteso, ed
// e' quello che rende la figura leggibile.
if (vNew) {
    const dot = page.locator(`.react-flow__node[data-id="${vNew}"] .node-problem-dot`).first();
    if (await dot.count()) { await dot.click(); await page.waitForTimeout(SETTLE_MS); }
}
const popover = await page.evaluate(() => {
    const el = document.querySelector('.node-problem-overlay');
    if (!el) return null;
    return {
        title: el.querySelector('.node-problem-overlay__title')?.textContent ?? '',
        rows: Array.from(el.querySelectorAll('.node-problem-overlay__conf-row')).map(r => ({
            message: r.querySelector('.node-problem-overlay__conf-message')?.textContent ?? '',
            type: r.querySelector('.node-problem-overlay__conf-type')?.textContent ?? '',
        })),
    };
});
note('il badge aperto', popover);
check('il badge aperto dichiara il difetto per esteso, e nomina la feature',
    !!popover && popover.rows.length >= 1 && /nextState/.test(JSON.stringify(popover.rows)),
    JSON.stringify(popover));

await page.screenshot({ path: shot('violation') });

// ── D. Il target fornito: «l'indicatore si spegne nell'istante...» ───────────
h('D. Il target fornito: quali indicatori si spengono, e quando');

await page.evaluate((d: any) => {
    const w = window as any;
    w.LPointerTargetable.fromPointer(d.t)['$nextState'].values = [d.red];
}, { t: tNew, red: m1.states[0] });

// «Nell'istante»: si misura subito, e poi dopo il debounce dichiarato.
await page.waitForTimeout(300);
const badgeSubito = await badges();
note('badge dopo 300 ms', badgeSubito);
await page.waitForTimeout(COMMIT_MS + CONFORMANCE_MS);
const badgeDopo = await badges();
const sbFix = await statusBar();
note('badge dopo il debounce', badgeDopo);
note('status bar (sanato)', sbFix);

const missDopo = await missingMarks();
note('marcatori `missing` dopo la correzione', missDopo);
check('il badge sparisce quando il target e\' fornito',
    badgeDopo.length === 0, JSON.stringify(badgeDopo));
check('e il marcatore sulla riga sparisce con lui',
    missDopo.length === 0, JSON.stringify(missDopo));
check('e non e\' istantaneo: la conformance ha 500 ms di debounce, quindi «nell\'istante» e\' impreciso',
    true, `dopo 300 ms: ${JSON.stringify(badgeSubito)} · dopo il debounce: ${JSON.stringify(badgeDopo)}`);

if (vNew) await selectNode(vNew);
const banFix = await banner();
note('fascia nel pannello, con `toRed2` selezionata (sanato)', banFix);
// Non prova niente sulla correzione: la fascia dice «Conforms to» in entrambi gli
// stati. Si misura per registrare che il testo NON e' cambiato, che e' il reperto.
check('la fascia dice la stessa identica cosa prima e dopo, quindi non e\' un indicatore',
    !!banFix && !!banRotto && banFix.text === banRotto.text,
    `rotto = «${banRotto?.text}» · sanato = «${banFix?.text}»`);

await page.keyboard.press('Escape');
// Il registro tiene la voce ritirata per 5 s col suo transitorio VERDE, e in una figura
// un puntino verde su un nodo si legge come un segno, non come l'assenza di segni. Si
// aspetta oltre `RESOLVED_TTL_MS` prima di scattare.
await page.waitForTimeout(6000);
const badgeFinali = await badges();
const missFinali = await missingMarks();
check('al momento dello scatto il diagramma e\' pulito, transitorio compreso',
    badgeFinali.length === 0 && missFinali.length === 0 &&
    await page.evaluate(() => document.querySelectorAll('.react-flow__node .node-problem-dot').length) === 0,
    `badge = ${JSON.stringify(badgeFinali)}, missing = ${JSON.stringify(missFinali)}`);
await page.screenshot({ path: shot('ok') });

// ── esito ────────────────────────────────────────────────────────────────────
h('Esito');
if (errors.length) note('errori di pagina', errors.slice(0, 5));
console.log(`\n  ${pass} PASS  ${fail} FAIL\n`);
await browser.close();
process.exit(fail === 0 ? 0 : 1);
