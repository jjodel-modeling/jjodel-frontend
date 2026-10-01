/**
 * probe_2026-09-09_book55_validazione — il passo zero della sezione 5.5, e le sue figure.
 *
 * La sezione descrive un comportamento del prodotto e la corsia si e' mossa piu' volte,
 * quindi si guarda l'applicazione prima di scrivere. Questa sonda costruisce la fixture
 * ESATTA del capitolo 5 — il metamodello delle macchine a stati e il semaforo — e misura
 * cio' che la 5.5 racconterebbe, un'affermazione alla volta. Le tre catture escono dallo
 * stesso giro, cosi' che le figure e il testo descrivano lo stesso stato.
 *
 * ── Le affermazioni sotto misura ─────────────────────────────────────────────
 *
 *  1. L'invariante per istanza scelta dal prompt — «ogni stato non finale possiede
 *     almeno una transizione uscente» — si scrive in JjEL, compila e produce un verdetto.
 *  2. Sul modello sano del capitolo non viola nulla, E HA GIRATO: le tre istanze sono nel
 *     conto, e la riga sulla regola senza istanze (R-VAL-17) non compare.
 *  3. Sul modello rotto la violazione cade sullo stato colpevole, non su tutti.
 *  4. Il pallino rosso e' sul nodo di quello stato e su nessun altro.
 *  5. Il modale dichiara i tre numeri di R-VAL-14.
 *  6. Dopo una modifica al modello i pallini si ritirano e la dichiarazione di freschezza
 *     lo dice (R-VAL-18). E' la parte che il prompt chiede di verificare per ultima e di
 *     non descrivere se non c'e'.
 *  7. `isFinal` MAI SCRITTO: uno slot booleano non scritto vale `null`, non `false`. La
 *     sezione istruisce il lettore a marcare gli stati, quindi conta sapere che cosa
 *     succede a chi non lo fa.
 *
 * ── Che cosa NON prova ───────────────────────────────────────────────────────
 *
 * Niente sulla sintassi concreta della 5.4: le figure escono dalla vista di default,
 * come `ch05-model-instances.png`. Niente sulla rivalutazione automatica, che non esiste.
 *
 * Con il dev server su (P8: porta 3000, non 3001):
 *   cd frontend && npx tsx ../docs/discovery/harness/probe_2026-09-09_book55_validazione.mts
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

/** Il corpo candidato, quello che finirebbe stampato nel libro. */
const RULE_BODY = 'isFinal or ownedTransitions.isNotEmpty';
const RULE_NAME = 'nonFinalStateHasOutgoing';
const RULE_MSG = 'a non-final state must have at least one outgoing transition';

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1500, height: 950 } });
await ctx.addInitScript(() => {
    (window as any).__name = (f: any) => f;
    // Il banner delle donazioni compare 30 s dopo il montaggio e coprirebbe l'angolo in
    // basso a destra delle catture. Si spegne dalla sua stessa memoria — `showCount` al
    // massimo — invece che con un click, che il pannello delle proprieta' intercetta.
    try {
        localStorage.setItem('jjodel_donation_banner',
            JSON.stringify({ lastShown: Date.now(), showCount: 4 }));
    } catch { /* niente localStorage: si vedra' il banner, e si dichiara */ }
});
await seed(ctx, true);   // advanced = true: l'ambiente di authoring vive li'
const page = await ctx.newPage();
const errors: string[] = [];
page.on('pageerror', (e) => errors.push(e.message));

await page.goto(`${BASE_URL}/all-projects`, { waitUntil: 'domcontentloaded', timeout: NAV_MS });
await page.waitForTimeout(SETTLE_MS);
const pid = await createProject(page, `Book55_${Date.now()}`);
if (!pid) { console.log('FIXTURE FAILED: createProject'); await browser.close(); process.exit(1); }
await page.goto(`${BASE_URL}/#/project?id=${pid}`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(NAV_MS + SETTLE_MS);

// ── A. Il metamodello del capitolo 5, alla lettera ───────────────────────────
h('A. Il metamodello del capitolo 5: namedElement, State, Transition, Event');

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
    return {
        ok: true as const, m2: dM2.id, pkg: lPkg.id,
        named: named.id, state: state.id, transition: transition.id, event: event.id,
    };
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
    // La containment del capitolo: State possiede le sue transizioni, [0..*].
    const owned = state.addReference('ownedTransitions', ids.transition);
    owned.upperBound = -1;
    owned.composition = true;
    const tr = L(ids.transition);
    const next = tr.addReference('nextState', ids.state);
    next.lowerBound = 1; next.upperBound = 1;
    const ev = tr.addReference('event', ids.event);
    ev.lowerBound = 0; ev.upperBound = 1;
}, m2);
await page.waitForTimeout(COMMIT_MS * 2);

const mmShape = await page.evaluate((ids: any) => {
    const idl = (window as any).store.getState().idlookup;
    const feats = (cid: string) => {
        const c = idl[cid];
        const all = [...(c?.attributes ?? []), ...(c?.references ?? [])];
        return all.map((f: string) => ({
            name: idl[f]?.name, composition: idl[f]?.composition ?? false,
            lower: idl[f]?.lowerBound, upper: idl[f]?.upperBound,
        }));
    };
    return { State: feats(ids.state), Transition: feats(ids.transition) };
}, m2);
note('le feature costruite', mmShape);
check('State ha isInitial, isFinal e la containment ownedTransitions [0..*]',
    mmShape.State.some((f: any) => f.name === 'isInitial') &&
    mmShape.State.some((f: any) => f.name === 'isFinal') &&
    mmShape.State.some((f: any) => f.name === 'ownedTransitions' && f.composition === true && f.upper === -1),
    JSON.stringify(mmShape.State));
check('Transition ha nextState [1]',
    mmShape.Transition.some((f: any) => f.name === 'nextState' && f.lower === 1 && f.upper === 1),
    JSON.stringify(mmShape.Transition));

// ── B. Il semaforo della 5.3 ─────────────────────────────────────────────────
h('B. Il semaforo: Red iniziale, Green, Yellow, ciascuno con la sua transizione');

const modelId = await page.evaluate((mm: string) => {
    const w = window as any;
    const project = w.LProject.getProject();
    const m = w.DModel.new('TrafficLight', mm, false);
    w.SetFieldAction.new(project.id, 'models', m.id, '+=', true);
    return m.id;
}, m2.m2);
await page.waitForTimeout(COMMIT_MS);

// Le istanze si creano tutte in un giro, i valori si scrivono nel giro dopo: il commit
// e' differito e `addObject` sarebbe inerte nella stessa `evaluate` (CLAUDE.md §9.2).
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

const m1 = await page.evaluate((ids: any) => {
    const w = window as any;
    const lm = w.LPointerTargetable.fromPointer(ids.model);
    const objs = (lm?.allSubObjects ?? lm?.objects ?? []) as any[];
    const byClass = (n: string) => objs.filter((o: any) => { try { return o.instanceof?.name === n; } catch { return false; } });
    const states = byClass('State'), trans = byClass('Transition'), events = byClass('Event');
    const names = ['Red', 'Green', 'Yellow'];
    states.forEach((s: any, i: number) => {
        s.name = names[i];
        // Scritti ESPLICITAMENTE tutti e due: uno slot mai scritto vale `null`, non `false`.
        s['$isInitial'].value = i === 0;
        s['$isFinal'].value = false;
    });
    // I nomi sono quelli della figura della 5.3: la 5.5 mostra lo stesso modello.
    const tn = ['toGreen', 'toYellow', 'toRed'];
    trans.forEach((t: any, i: number) => { t.name = tn[i]; });
    if (events[0]) events[0].name = 'timerExpired';
    return {
        states: states.map((s: any) => ({ id: s.id, name: names[states.indexOf(s)] })),
        transitions: trans.map((t: any) => t.id),
        event: events[0]?.id ?? null,
    };
}, { model: modelId });
await page.waitForTimeout(COMMIT_MS);
note('istanze create', m1);

// Le reference si scrivono con `.values = [...]`, non con `.value = ...`: la seconda
// forma non lancia e non scrive (CLAUDE.md §9.3).
await page.evaluate((d: any) => {
    const w = window as any;
    const L = (id: string) => w.LPointerTargetable.fromPointer(id);
    const [red, green, yellow] = d.states.map((s: any) => s.id);
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
    const ids = (slot: any) => (slot?.values ?? []).map((v: any) => v?.id ?? v);
    return d.states.map((s: any) => ({
        name: s.name,
        owned: ids(L(s.id)['$ownedTransitions']).length,
        isFinal: L(s.id)['$isFinal']?.value,
    }));
}, m1);
note('il cablaggio riletto dal modello', wired);
check('i tre stati possiedono una transizione ciascuno e sono marcati non finali',
    wired.length === 3 && wired.every((s: any) => s.owned === 1 && s.isFinal === false),
    JSON.stringify(wired));
if (!wired.every((s: any) => s.owned === 1)) {
    console.log('FIXTURE FAILED: la containment non e\' stata scritta, non c\'e\' niente da validare');
    await browser.close(); process.exit(1);
}

// ── apertura e strumenti ─────────────────────────────────────────────────────
await page.evaluate(async (m: string) => {
    const w = window as any;
    await w.DockManager.open2(w.LPointerTargetable.fromPointer(m));
}, modelId);
await page.waitForTimeout(NAV_MS + SETTLE_MS);

const vertexOf = (objIds: string[]) => page.evaluate((ids: string[]) => {
    const lookup = (window as any).store.getState().idlookup ?? {};
    const byObject = new Map<string, string>();
    for (const id in lookup) {
        const e = lookup[id];
        if (e?.className === 'DVertex' && e.model) byObject.set(e.model, id);
    }
    return ids.map(i => byObject.get(i) ?? null);
}, objIds);

/** Rete di sicurezza: se il banner e' comparso lo stesso, lo si toglie a forza. Il
 *  pannello delle proprieta' ne intercetta i click, quindi `force`. */
const dismissBanner = async () => {
    const b = page.locator('.donation-banner__close');
    if (await b.count()) {
        try { await b.first().click({ force: true, timeout: 3000 }); } catch { /* gia' via */ }
        await page.waitForTimeout(300);
    }
};

/** La disposizione: il bottone «Auto layout» della barra, cioe' il gesto che farebbe un
 *  lettore. Scrivere le coordinate nel D-layer non basta — misurato: i nodi React Flow
 *  tengono le proprie, e un `SetFieldAction` su `x`/`y` non li muove.
 *
 *  Si dispone SEMPRE prima di validare: e' vero che spostare un nodo non invalida un
 *  esito (misurato, R-VAL-18), ma una figura non deve dipendere da quella misura. */
const autoLayout = async () => {
    const b = page.locator('button[title="Auto layout"]:visible');
    if (await b.count()) { await b.first().click(); await page.waitForTimeout(SETTLE_MS * 2); }
};

const btn = page.locator('button[title="Validate the open model against the active rules"]:visible');
const closeModal = async () => {
    const x = page.locator('.validation-results__close:visible');
    if (await x.count()) { await x.first().click(); await page.waitForTimeout(SETTLE_MS); }
};
const readModal = () => page.evaluate(() => {
    const root = document.querySelector('.validation-results');
    if (!root) return null;
    return {
        stats: Array.from(root.querySelectorAll('.validation-results__stat')).map(s => ({
            value: s.querySelector('.validation-results__stat-value')?.textContent ?? '',
            label: s.querySelector('.validation-results__stat-label')?.textContent ?? '',
        })),
        meta: (root.querySelector('.validation-results__meta')?.textContent ?? '').replace(/\s+/g, ' ').trim(),
        items: Array.from(root.querySelectorAll('.validation-results__item-btn')).map(i => ({
            element: i.querySelector('.validation-results__item-element')?.textContent ?? '',
            message: i.querySelector('.validation-results__item-message')?.textContent ?? '',
        })),
        notes: Array.from(root.querySelectorAll('.validation-results__note'))
            .map(n => (n.textContent ?? '').replace(/\s+/g, ' ').trim()),
    };
});
const declaration = () => page.evaluate(() => {
    const el = document.querySelector('.validation-freshness');
    return el ? {
        text: (el.textContent ?? '').replace(/\s+/g, ' ').trim(),
        cls: Array.from(el.classList).filter(c => c.startsWith('validation-freshness--')).join(','),
    } : null;
});
/** I pallini ATTIVI. Una voce ritirata resta nel DOM per i 5 s del suo transitorio
 *  verde (`RESOLVED_TTL_MS`), e contarla direbbe il contrario di cio' che si misura. */
const SEL_DOT = '.react-flow__node .node-problem-dot:not(.node-problem-dot--resolved)';
const dotCount = () => page.evaluate((sel: string) =>
    document.querySelectorAll(sel).length, SEL_DOT);
const dotOn = (vid: string) => page.evaluate((v: string) => {
    const n = document.querySelector(`.react-flow__node[data-id="${CSS.escape(v)}"]`);
    return n ? n.querySelectorAll('.node-problem-dot:not(.node-problem-dot--resolved)').length : -1;
}, vid);

/** Gli id delle istanze del modello, per differenza: un oggetto appena creato porta un
 *  nome di default (`State_0`), quindi cercarlo «senza nome» non lo trova. */
const objectIds = (m: string) => page.evaluate((mid: string) => {
    const lm = (window as any).LPointerTargetable.fromPointer(mid);
    return ((lm?.allSubObjects ?? lm?.objects ?? []) as any[]).map((o: any) => o.id);
}, m);
const newSince = async (m: string, before: string[]): Promise<string | null> => {
    const after = await objectIds(m);
    const fresh = after.filter(id => !before.includes(id));
    return fresh.length === 1 ? fresh[0] : null;
};

// ── C. La regola: compila, gira, e sul modello sano non viola ────────────────
h('C. La regola del capitolo, sul modello SANO');

await dismissBanner();
await autoLayout();

const ruleId = await page.evaluate(([vp, st, body, name, msg]: string[]) => {
    const w = window as any;
    w.DValidationViewpoint.new();
    return w.DValidationRule.new(vp, name, st, body, msg).id;
}, [VP_ID, m2.state, RULE_BODY, RULE_NAME, RULE_MSG] as any);
await page.waitForTimeout(COMMIT_MS);

await btn.first().click();
await page.waitForTimeout(SETTLE_MS);
const sano = await readModal();
note('il modale sul modello sano', sano);
await closeModal();

check(`il corpo «${RULE_BODY}» compila: nessuna riga di difetto`,
    !!sano && !sano.notes.some(n => /do(es)? not compile/.test(n)),
    `note = ${JSON.stringify(sano?.notes)}`);
check('sul modello sano non viola nulla',
    !!sano && sano.items.length === 0, `voci = ${JSON.stringify(sano?.items)}`);
check('e HA GIRATO: nessuna «non valutabile», e nessuna regola senza istanze (R-VAL-17)',
    !!sano && sano.stats[2]?.value === '0' && !sano.notes.some(n => /found no instance/.test(n)),
    `stats = ${JSON.stringify(sano?.stats)}, note = ${JSON.stringify(sano?.notes)}`);
check('la riga di riepilogo conferma il perimetro: una regola sulle istanze del modello',
    !!sano && /1 rule over/.test(sano.meta), `meta = «${sano?.meta}»`);

// ── D. Il modello rotto: la violazione cade sullo stato colpevole ────────────
h('D. Uno stato senza transizione uscente: la violazione cade su QUELLO');

const beforeFlashing = await objectIds(modelId);
await page.evaluate((ids: any) => {
    const w = window as any;
    const lm = w.LPointerTargetable.fromPointer(ids.model);
    lm.addObject({}, w.LPointerTargetable.fromPointer(ids.state));
}, { model: modelId, state: m2.state });
await page.waitForTimeout(COMMIT_MS * 2);

const flashing = await newSince(modelId, beforeFlashing);
if (!flashing) { console.log('FIXTURE FAILED: lo stato nuovo non e\' identificabile'); await browser.close(); process.exit(1); }
await page.evaluate((oid: string) => {
    const o = (window as any).LPointerTargetable.fromPointer(oid);
    o.name = 'Flashing';
    o['$isInitial'].value = false;
    o['$isFinal'].value = false;
}, flashing);
await page.waitForTimeout(COMMIT_MS);
note('lo stato colpevole', flashing);

await autoLayout();
await dismissBanner();

await btn.first().click();
await page.waitForTimeout(SETTLE_MS);
const rotto = await readModal();
note('il modale sul modello rotto', rotto);
await page.screenshot({ path: shot('violation') });
await closeModal();

check('una violazione sola, e nomina lo stato colpevole',
    !!rotto && rotto.items.length === 1 && rotto.items[0].element === 'Flashing',
    JSON.stringify(rotto?.items));
check('il messaggio della regola e\' quello scritto dall\'autore',
    !!rotto && rotto.items[0]?.message === RULE_MSG, `letto = «${rotto?.items[0]?.message}»`);
check('il modale dichiara i tre numeri di R-VAL-14',
    !!rotto && rotto.stats.length === 3 &&
    rotto.stats[0].value === '1' && rotto.stats[1].value === '0' && rotto.stats[2].value === '0',
    JSON.stringify(rotto?.stats));

const [vFlashing] = await vertexOf([flashing]);
const [vRed] = await vertexOf([m1.states[0].id]);
note('i vertici', { Flashing: vFlashing, Red: vRed });
check('il pallino e\' sul nodo dello stato colpevole, e su nessun altro',
    !!vFlashing && await dotOn(vFlashing) === 1 && await dotCount() === 1,
    `pallini totali = ${await dotCount()}, su Flashing = ${vFlashing ? await dotOn(vFlashing) : 'n/d'}`);

const decRotto = await declaration();
note('la dichiarazione di freschezza', decRotto);
check('la dichiarazione dice «1 violation»',
    decRotto?.cls === 'validation-freshness--violated' && /1 violation/.test(decRotto?.text ?? ''),
    JSON.stringify(decRotto));

// La cattura della violazione: il modale chiuso, cosi' che si veda il pallino sul
// diagramma. Il modale ha la sua cattura sopra.
await page.screenshot({ path: shot('violation-canvas') });

// ── E. La freschezza (R-VAL-18) ──────────────────────────────────────────────
h('E. Dopo una modifica al modello: i pallini si ritirano e la superficie lo dice');

await page.evaluate((oid: string) => {
    (window as any).LPointerTargetable.fromPointer(oid).name = 'Flashing2';
}, flashing);
await page.waitForTimeout(COMMIT_MS);

const decStale = await declaration();
note('dopo la modifica', { dots: await dotCount(), dec: decStale });
check('i pallini si ritirano', await dotCount() === 0, `pallini = ${await dotCount()}`);
check('e la dichiarazione dice che il modello non e\' validato dall\'ultima modifica',
    decStale?.cls === 'validation-freshness--stale' && /Changed since validation/.test(decStale?.text ?? ''),
    JSON.stringify(decStale));

await page.evaluate((oid: string) => {
    (window as any).LPointerTargetable.fromPointer(oid).name = 'Flashing';
}, flashing);
await page.waitForTimeout(COMMIT_MS);

// ── F. La correzione ─────────────────────────────────────────────────────────
h('F. La correzione: si da\' una transizione a Flashing, e la violazione sparisce');

const beforeT4 = await objectIds(modelId);
await page.evaluate((ids: any) => {
    const w = window as any;
    const lm = w.LPointerTargetable.fromPointer(ids.model);
    lm.addObject({}, w.LPointerTargetable.fromPointer(ids.transition));
}, { model: modelId, transition: m2.transition });
await page.waitForTimeout(COMMIT_MS * 2);

const t4 = await newSince(modelId, beforeT4);
if (!t4) { console.log('FIXTURE FAILED: la transizione nuova non e\' identificabile'); await browser.close(); process.exit(1); }
await page.evaluate((d: any) => {
    const w = window as any;
    const L = (id: string) => w.LPointerTargetable.fromPointer(id);
    L(d.t4).name = 'toRed2';
    L(d.flashing)['$ownedTransitions'].values = [d.t4];
    L(d.t4)['$nextState'].values = [d.red];
}, { t4, flashing, red: m1.states[0].id });
await page.waitForTimeout(COMMIT_MS * 2);

const corretto = await page.evaluate((d: any) => {
    const w = window as any;
    const L = (id: string) => w.LPointerTargetable.fromPointer(id);
    const ids = (slot: any) => (slot?.values ?? []).map((v: any) => v?.id ?? v);
    return { owned: ids(L(d.flashing)['$ownedTransitions']).length };
}, { flashing });
check('la correzione e\' entrata nel modello: Flashing possiede una transizione',
    corretto.owned === 1, JSON.stringify(corretto));

await autoLayout();
await dismissBanner();

await btn.first().click();
await page.waitForTimeout(SETTLE_MS);
const fixed = await readModal();
note('il modale dopo la correzione', fixed);
await page.screenshot({ path: shot('fixed') });
await closeModal();

check('nessuna violazione dopo la correzione',
    !!fixed && fixed.items.length === 0, JSON.stringify(fixed?.items));
check('e nessun pallino sul diagramma', await dotCount() === 0, `pallini = ${await dotCount()}`);
const decFixed = await declaration();
check('la dichiarazione passa a «No violations», che e\' diverso da «mai validato»',
    decFixed?.cls === 'validation-freshness--clean' && /No violations/.test(decFixed?.text ?? ''),
    JSON.stringify(decFixed));
await page.screenshot({ path: shot('fixed-canvas') });

// ── G. isFinal mai scritto ───────────────────────────────────────────────────
h('G. Lo slot booleano MAI scritto: che cosa vede la regola');

const beforeMuto = await objectIds(modelId);
await page.evaluate((ids: any) => {
    const w = window as any;
    const lm = w.LPointerTargetable.fromPointer(ids.model);
    lm.addObject({}, w.LPointerTargetable.fromPointer(ids.state));
}, { model: modelId, state: m2.state });
await page.waitForTimeout(COMMIT_MS * 2);

const mutoId = await newSince(modelId, beforeMuto);
// SOLO il nome: `isInitial` e `isFinal` restano NON scritti, ed e' il punto.
const muto = mutoId ? await page.evaluate((oid: string) => {
    const o = (window as any).LPointerTargetable.fromPointer(oid);
    o.name = 'Untouched';
    return { id: oid, isFinal: o['$isFinal']?.value ?? null, raw: o['$isFinal']?.__raw?.values ?? null };
}, mutoId) : null;
await page.waitForTimeout(COMMIT_MS);
note('lo stato con isFinal mai scritto', muto);

await btn.first().click();
await page.waitForTimeout(SETTLE_MS);
const conMuto = await readModal();
note('il modale con lo stato non toccato', conMuto);
await closeModal();
note('ESITO DEL CASO «mai scritto»', {
    violazioni: conMuto?.items.map((i: any) => i.element),
    nonValutabili: conMuto?.stats[2]?.value,
    note: conMuto?.notes,
});
check('il caso «mai scritto» e\' misurato e non ipotizzato: produce un esito definito',
    !!conMuto, 'vedi la misura sopra; il verdetto scelto va riportato nella sezione');

// ── H. L'ambiente di authoring ───────────────────────────────────────────────
h('H. L\'ambiente di authoring, con la regola e il contesto dichiarato');

await page.evaluate(async (mm: string) => {
    const w = window as any;
    await w.DockManager.open2(w.LPointerTargetable.fromPointer(mm));
}, m2.m2);
await page.waitForTimeout(NAV_MS);

const rulesBtn = page.locator('button[title="Validation rules of this metamodel"]:visible');
check('il bottone dell\'ambiente e\' sulla toolbar del metamodello in Advanced',
    await rulesBtn.count() === 1, `${await rulesBtn.count()} bottoni visibili`);
if (await rulesBtn.count() === 1) {
    await rulesBtn.first().click();
    await page.waitForTimeout(SETTLE_MS);
    await page.locator('.validation-rules__class', { hasText: 'State' }).first().click();
    await page.waitForTimeout(SETTLE_MS);
    // Il contesto e il corpo si vedono con la REGOLA selezionata, non con la sola classe.
    const ruleRow = page.locator('button.validation-rules__rule').first();
    if (await ruleRow.count()) { await ruleRow.click(); await page.waitForTimeout(SETTLE_MS); }
    const authoring = await page.evaluate(() => {
        const root = document.querySelector('.validation-rules');
        if (!root) return null;
        return {
            context: (root.querySelector('.validation-rules__context')?.textContent ?? '').trim(),
            rules: Array.from(root.querySelectorAll('.validation-rules__rule-name')).map(e => e.textContent),
            classes: Array.from(root.querySelectorAll('.validation-rules__class-name')).map(e => e.textContent),
        };
    });
    note('l\'ambiente', authoring);
    await page.screenshot({ path: shot('authoring') });
    check('il contesto e\' dichiarato sopra il corpo come `self: State`',
        authoring?.context === 'self: State', `letto = «${authoring?.context}»`);
    check('la regola del capitolo e\' li\'',
        (authoring?.rules ?? []).includes(RULE_NAME), JSON.stringify(authoring?.rules));
}

// ── I. L'indicatore di conformita' della 5.3 ─────────────────────────────────
h('I. Solo da riferire: l\'indicatore di conformita\' che la 5.3 descrive');

const pill = await page.evaluate(() => document.querySelectorAll('.validation-pill').length);
note('elementi .validation-pill nel DOM', pill);
console.log(`        (0 = la ValidationPill non e' montata dal 2026-08-26; riguarda la 5.3, non la 5.5)`);

// ── esito ────────────────────────────────────────────────────────────────────
h('Esito');
if (errors.length) note('errori di pagina', errors.slice(0, 5));
console.log(`\n  ${pass} PASS  ${fail} FAIL\n`);
await browser.close();
process.exit(fail === 0 ? 0 : 1);
