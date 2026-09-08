/**
 * probe_2026-09-08_jjel_verdetto_booleano — che cosa restituiscono davvero le tre
 * invarianti del libro, e che cosa succede quando quel valore viene preso per un
 * verdetto.
 *
 * Nasce dallo Step 0 del prompt di Fase 2 (scheletro della validazione definita
 * dall'utente). La spec dice «corpo JjEL booleano»; due delle tre invarianti della
 * Tabella 7.5 del libro NON restituiscono un booleano — la prima confronta un numero,
 * la terza costruisce un insieme. Il libro se la cava scrivendo che «le regole di
 * truthiness dell'evaluator fanno funzionare la cosa in pratica». Questa sonda mette
 * quella frase alla prova, perche' se un array non vuoto e' vero a prescindere dal
 * contenuto allora `[false, false]` e' vero e la regola violata viene dichiarata
 * soddisfatta in silenzio.
 *
 * ── Che cosa misura, e perche' ciascun blocco esiste ─────────────────────────
 *
 *  A. LA FIXTURE, MODELLATA SUL COSTRUTTORE DI CONTESTO VERO. Non c'e' store Redux
 *     qui dentro, quindi il modello del semaforo e' costruito a mano — ma NON a
 *     capriccio: la forma degli handle replica quella che `buildEvalContext`
 *     (`jjscript/executor/commands/eval.ts`) e `fillInstanceSlots` (:579) producono
 *     dal modello vero, e le tre scelte che contano sono citate al punto di codice:
 *       - una classe e' un oggetto piatto con `.instances` (:207);
 *       - una feature multivalore e' SEMPRE un array, vuoto se non popolata (:643);
 *       - una reference singola non popolata e' `null`, non assente (:643);
 *       - un attributo singolo opzionale vuoto e' `null` (`emptyAttributeDefault`).
 *     Se questa forma e' sbagliata, e' sbagliato tutto il resto: sta scritta qui in
 *     chiaro perche' sia contestabile.
 *
 *  B. LE TRE INVARIANTI, TIPO E VALORE. Domanda 1 del prompt. Ciascuna e' valutata
 *     su un modello che la soddisfa e su un modello che la viola, e di ogni esito si
 *     riporta `typeof` e il valore. E' la misura che decide se «corpo booleano» sia
 *     una descrizione vera del linguaggio o un'ipotesi.
 *
 *  C. `forall ... : pred` CON ALMENO UN ELEMENTO FALSO. Domanda 2. Il valore
 *     restituito, e poi la sua conversione a booleano per tutte le vie che un
 *     chiamante ha davvero: la truthiness interna dell'evaluator (osservata
 *     attraverso `if`, `not`, `and`, `implies`), e il `Boolean()` di JavaScript che
 *     e' quello che usano oggi JjTL e JjScript.
 *
 *  D. LO STESSO SULLA COLLEZIONE VUOTA. Domanda 3. Qui la posta e' la verita'
 *     vacua: un vincolo universale su un insieme vuoto deve essere VERO, e un
 *     verdetto preso sulla lunghezza dell'array dice il contrario.
 *
 *  E. ESISTE GIA' UNA FUNZIONE JjelValue -> boolean? Domanda 4. Cercata per
 *     ESECUZIONE, non per lettura: si guarda la superficie esportata del modulo
 *     `jjel`, poi si esegue la funzione interna dell'evaluator su una tabella di
 *     valori, e accanto la regola di JavaScript che gli altri chiamanti applicano.
 *     Due regole diverse gia' in circolo si vedono solo mettendole in colonna.
 *
 *  F. IL CONTROLLO POSITIVO, e serve DAVVERO. Un elenco di esiti sorprendenti e'
 *     indistinguibile da una fixture rotta: se `State.instances` fosse vuoto per un
 *     errore di costruzione, TUTTE le invarianti direbbero qualcosa di falso e la
 *     sonda sembrerebbe piena di scoperte. Questi controlli hanno esito noto e devono
 *     passare tutti. Se uno solo fallisce, il resto del referto non vale niente.
 *
 *  G. FUORI DAL MANDATO, MA DICHIARATO: il tri-stato di R-VAL-7. La regola di
 *     verdetto che lo Step 2 deve scrivere non e' completa finche' non si sa quali
 *     delle tre invarianti LANCIANO su un'istanza mal formata, invece di rispondere.
 *     Misurato qui perche' costa tre righe e altrimenti servirebbe una seconda sonda.
 *
 * ── Che cosa NON prova ───────────────────────────────────────────────────────
 *
 * Non prova niente sul modello del semaforo REALE dentro l'app: prova la semantica
 * dell'evaluator su un contesto della stessa forma. E non tocca il linguaggio: e'
 * una sonda di lettura, il fix — se serve — sta a valle e non e' qui.
 *
 *   cd frontend && npx tsx ../docs/discovery/harness/probe_2026-09-08_jjel_verdetto_booleano.mts
 */

import {
    jjelEval,
    jjelEvalWithDiagnostics,
    JjelEvaluator,
    JjelEvaluationError,
} from '../../../frontend/src/jjel/index.ts';
import type { JjelValue } from '../../../frontend/src/jjel/index.ts';
import * as jjelModule from '../../../frontend/src/jjel/index.ts';
import { getCollectionMethod } from '../../../frontend/src/jjel/evaluator/builtins/collections.ts';

let pass = 0, fail = 0;
const ok = (c: boolean, msg: string) => { if (c) { pass++; console.log('  PASS  ' + msg); } else { fail++; console.log('  FAIL  ' + msg); } };
const h = (s: string) => console.log('\n' + s + '\n' + '─'.repeat(s.length));
const show = (v: unknown): string => {
    if (typeof v === 'string') return JSON.stringify(v);
    try { return JSON.stringify(v); } catch { return String(v); }
};
/** Valuta e restituisce `{ v }` oppure `{ err }`: nessun throw esce da qui. */
const tryEval = (src: string, vars: Record<string, JjelValue>): { v?: JjelValue; err?: string } => {
    try { return { v: jjelEval(src, vars) }; }
    catch (e: any) { return { err: `${e?.constructor?.name ?? 'Error'}: ${e?.message ?? String(e)}` }; }
};

// ── A. La fixture ────────────────────────────────────────────────────────────
h('A. Fixture: la macchina a stati del semaforo, nella forma di buildEvalContext');

/**
 * Costruisce un contesto equivalente a quello che `buildEvalContext` produce dal
 * modello vero. `opts.initial` dice quale stato porta `isInitial = true`; `null`
 * significa NESSUNO stato iniziale (il modello rotto del criterio di accettazione).
 * `opts.danglingFrom` toglie il target alla transizione uscente da quello stato.
 * `opts.deadEnd` marca uno stato come non finale e gli toglie le transizioni.
 */
function buildSemaforo(opts: { initial: string | null; danglingFrom?: string; deadEnd?: string }) {
    // Le istanze sono oggetti piatti: le feature stanno sotto il nome nudo, come
    // le scrive fillInstanceSlots (eval.ts:610-663). `__type` e `name` sono i
    // marcatori di identita' che il costruttore vero mette (eval.ts:617).
    const mk = (name: string) => ({
        __type: 'State', id: 'st_' + name, name,
        isInitial: false,          // attributo booleano popolato -> boolean
        isFinal: false,
        ownedTransitions: [] as any[],   // reference multivalore -> array (eval.ts:643)
    });
    const green = mk('Green'), yellow = mk('Yellow'), red = mk('Red');
    const states = [green, yellow, red];
    const byName: Record<string, any> = { Green: green, Yellow: yellow, Red: red };

    if (opts.initial) byName[opts.initial].isInitial = true;

    const mkT = (name: string, from: any, to: any) => {
        // reference singola: l'oggetto target, oppure null se non popolata (eval.ts:643)
        const t = { __type: 'Transition', id: 'tr_' + name, name, nextState: to as any };
        from.ownedTransitions.push(t);
        return t;
    };
    const transitions = [
        mkT('g2y', green, yellow),
        mkT('y2r', yellow, red),
        mkT('r2g', red, green),
    ];

    if (opts.danglingFrom) {
        for (const t of byName[opts.danglingFrom].ownedTransitions) t.nextState = null;
    }
    if (opts.deadEnd) {
        byName[opts.deadEnd].ownedTransitions = [];
        byName[opts.deadEnd].isFinal = false;
    }

    // Le classi sono shell piatte con .instances (eval.ts:207), legate per nome
    // come variabili di primo livello (eval.ts:277-283).
    const StateCls = { __type: 'DClass', name: 'State', instances: states, allInstances: states, instanceCount: states.length };
    const TransitionCls = { __type: 'DClass', name: 'Transition', instances: transitions, allInstances: transitions, instanceCount: transitions.length };

    return { states, transitions, byName, vars: { State: StateCls, Transition: TransitionCls } as Record<string, JjelValue> };
}

/** Il contesto di una regola: le variabili globali + `self` + le feature appiattite. */
function ruleCtx(fixture: ReturnType<typeof buildSemaforo>, self: any): Record<string, JjelValue> {
    return { ...fixture.vars, self, ...self };
}

const OK = buildSemaforo({ initial: 'Green' });
const NO_INITIAL = buildSemaforo({ initial: null });
const TWO_INITIAL = (() => { const f = buildSemaforo({ initial: 'Green' }); f.byName.Red.isInitial = true; return f; })();
const DANGLING = buildSemaforo({ initial: 'Green', danglingFrom: 'Yellow' });
const DEAD_END = buildSemaforo({ initial: 'Green', deadEnd: 'Red' });

console.log(`OK          : stati ${OK.states.length}, iniziali ${OK.states.filter(s => s.isInitial).length}, transizioni ${OK.transitions.length}`);
console.log(`NO_INITIAL  : iniziali ${NO_INITIAL.states.filter(s => s.isInitial).length}`);
console.log(`TWO_INITIAL : iniziali ${TWO_INITIAL.states.filter(s => s.isInitial).length}`);
console.log(`DANGLING    : Yellow.ownedTransitions[0].nextState = ${show(DANGLING.byName.Yellow.ownedTransitions[0].nextState)}`);
console.log(`DEAD_END    : Red.isFinal=${DEAD_END.byName.Red.isFinal}, Red.ownedTransitions.length=${DEAD_END.byName.Red.ownedTransitions.length}`);

// ── B. Le tre invarianti del libro ───────────────────────────────────────────
h('B. Le tre invarianti della Tabella 7.5: tipo e valore del risultato');

const INV1 = '(forall s in State.instances such that s.isInitial).size == 1';
const INV2 = 'not isFinal implies ownedTransitions.isNotEmpty';
const INV3 = 'forall t in ownedTransitions: t.nextState != null';

const row = (label: string, src: string, vars: Record<string, JjelValue>) => {
    const r = tryEval(src, vars);
    const t = r.err ? '(throw)' : (Array.isArray(r.v) ? 'array' : (r.v === null ? 'null' : typeof r.v));
    console.log(`  ${label.padEnd(34)} tipo=${String(t).padEnd(8)} valore=${r.err ?? show(r.v)}`);
    return r;
};

console.log(`\nINV1  ${INV1}`);
const b1ok = row('modello OK (1 iniziale)', INV1, OK.vars);
const b1no = row('NO_INITIAL (0 iniziali)', INV1, NO_INITIAL.vars);
const b1two = row('TWO_INITIAL (2 iniziali)', INV1, TWO_INITIAL.vars);

console.log(`\nINV2  ${INV2}   (self = uno stato)`);
const b2ok = row('OK, self=Green', INV2, ruleCtx(OK, OK.byName.Green));
const b2dead = row('DEAD_END, self=Red', INV2, ruleCtx(DEAD_END, DEAD_END.byName.Red));

console.log(`\nINV3  ${INV3}   (self = uno stato)`);
const b3ok = row('OK, self=Green', INV3, ruleCtx(OK, OK.byName.Green));
const b3bad = row('DANGLING, self=Yellow', INV3, ruleCtx(DANGLING, DANGLING.byName.Yellow));
const b3empty = row('DEAD_END, self=Red (0 transiz.)', INV3, ruleCtx(DEAD_END, DEAD_END.byName.Red));

ok(typeof b1ok.v === 'boolean' && b1ok.v === true, 'INV1 e\' booleana e vera sul modello OK');
ok(typeof b1no.v === 'boolean' && b1no.v === false, 'INV1 e\' booleana e falsa senza stato iniziale');
ok(typeof b1two.v === 'boolean' && b1two.v === false, 'INV1 e\' falsa con due stati iniziali');
ok(typeof b2ok.v === 'boolean', 'INV2 restituisce un booleano');
ok(Array.isArray(b3ok.v), 'INV3 NON restituisce un booleano: restituisce un array');
ok(Array.isArray(b3bad.v), 'INV3 restituisce un array anche quando la proprieta\' e\' violata');

console.log('\n  --> il conto dei tipi di ritorno delle tre invarianti:');
console.log(`      INV1 -> ${typeof b1ok.v}   INV2 -> ${typeof b2ok.v}   INV3 -> ${Array.isArray(b3ok.v) ? 'array' : typeof b3ok.v}`);

// ── C. forall con almeno un elemento falso ───────────────────────────────────
h('C. `forall ... : pred` con almeno un elemento falso, e la sua conversione a booleano');

// Il caso di laboratorio, senza dipendere dalla fixture: tre elementi, uno falso.
const LAB = { xs: [{ p: true }, { p: false }, { p: true }] } as Record<string, JjelValue>;
const FORALL_MIXED = 'forall x in xs: x.p';
const vMixed = jjelEval(FORALL_MIXED, LAB);
console.log(`  ${FORALL_MIXED}   ->  ${show(vMixed)}      (${Array.isArray(vMixed) ? 'array di ' + (vMixed as JjelValue[]).length : typeof vMixed})`);
ok(Array.isArray(vMixed) && (vMixed as JjelValue[]).length === 3, 'la proiezione restituisce UN ELEMENTO PER ELEMENTO, non un booleano');
ok(JSON.stringify(vMixed) === '[true,false,true]', 'e conserva i falsi dentro l\'array');

console.log('\n  Come si converte quel valore, per ogni via che un chiamante ha davvero:');
const conv = (label: string, src: string) => {
    const r = tryEval(src, LAB);
    console.log(`    ${label.padEnd(46)} ${r.err ?? show(r.v)}`);
    return r.v;
};
const cIf      = conv('if (forall...) then "VERO" else "FALSO"',      `if (${FORALL_MIXED}) then "VERO" else "FALSO"`);
const cNot     = conv('not (forall...)',                              `not (${FORALL_MIXED})`);
const cAnd     = conv('(forall...) and true',                         `(${FORALL_MIXED}) and true`);
const cImplies = conv('true implies (forall...)',                     `true implies (${FORALL_MIXED})`);
const cJs      = Boolean(vMixed);
console.log(`    ${'Boolean(valore)  — la regola di JS, usata da JjTL'.padEnd(46)} ${cJs}`);

ok(cIf === 'VERO', 'la truthiness dell\'evaluator dichiara VERO un array che contiene un falso');
ok(cNot === false, '`not` sullo stesso array da\' false, cioe\' lo considera vero');
ok(cAnd === true && cImplies === true, '`and` e `implies` lo considerano vero');
ok(cJs === true, 'anche Boolean() di JavaScript lo considera vero');
console.log('\n  --> UN ARRAY CHE CONTIENE UN FALSO E\' VERO PER TUTTE LE VIE MISURATE.');

// La forma corretta esiste, e va misurata accanto: e' il termine di paragone.
const ALL_MIXED = 'xs.all(x => x.p)';
const vAll = jjelEval(ALL_MIXED, LAB);
console.log(`\n  ${ALL_MIXED}   ->  ${show(vAll)}   (${typeof vAll})   <- la forma che dice il vero`);
ok(vAll === false, '`coll.all(x => pred)` restituisce false, e distingue il caso');

// ── D. Collezione vuota ──────────────────────────────────────────────────────
h('D. Lo stesso su collezione vuota: la verita\' vacua');

const EMPTY = { xs: [] as JjelValue[] } as Record<string, JjelValue>;
const vEmpty = jjelEval(FORALL_MIXED, EMPTY);
console.log(`  forall x in [] : x.p          ->  ${show(vEmpty)}   (array di ${(vEmpty as JjelValue[]).length})`);
const eIf = jjelEval(`if (${FORALL_MIXED}) then "VERO" else "FALSO"`, EMPTY);
const eNot = jjelEval(`not (${FORALL_MIXED})`, EMPTY);
const eJs = Boolean(vEmpty);
console.log(`  if (...) then "VERO" else "FALSO"  ->  ${show(eIf)}`);
console.log(`  not (...)                         ->  ${show(eNot)}`);
console.log(`  Boolean(valore)  — la regola di JS ->  ${eJs}`);
const eAll = jjelEval('xs.all(x => x.p)', EMPTY);
console.log(`  xs.all(x => x.p)                  ->  ${show(eAll)}   <- la forma che dice il vero`);

ok(Array.isArray(vEmpty) && (vEmpty as JjelValue[]).length === 0, 'su collezione vuota `forall` restituisce l\'array vuoto');
ok(eIf === 'FALSO', 'la truthiness dell\'evaluator dichiara FALSO l\'array vuoto');
ok(eNot === true, '`not` sull\'array vuoto da\' true, cioe\' lo considera falso');
ok(eJs === true, 'ma Boolean() di JavaScript lo considera VERO: le due regole DIVERGONO qui');
ok(eAll === true, '`coll.all(...)` sulla collezione vuota da\' true, la verita\' vacua');
console.log('\n  --> LE DUE REGOLE IN CIRCOLO NEL CODEBASE SI CONTRADDICONO SULL\'ARRAY VUOTO.');

// E il caso peggiore, esplicito: tutti falsi.
const ALL_FALSE = { xs: [{ p: false }, { p: false }] } as Record<string, JjelValue>;
const vAllFalse = jjelEval(FORALL_MIXED, ALL_FALSE);
const fIf = jjelEval(`if (${FORALL_MIXED}) then "VERO" else "FALSO"`, ALL_FALSE);
console.log(`\n  forall su [{p:false},{p:false}]   ->  ${show(vAllFalse)}  e `
    + `if(...) -> ${show(fIf)}   <- il difetto in forma pura`);
ok(fIf === 'VERO', '[false, false] e\' dichiarato VERO: la regola violata risulterebbe soddisfatta');

// ── E. Esiste gia' una funzione JjelValue -> boolean? ────────────────────────
h('E. Una funzione JjelValue -> boolean gia\' nel codice: c\'e\', ed e\' raggiungibile?');

const exported = Object.keys(jjelModule).sort();
const boolLike = exported.filter(n => /truthy|toBool|asBool|isBool/i.test(n));
console.log(`  export del modulo jjel (${exported.length}): ${exported.join(', ')}`);
console.log(`  fra questi, quelli che convertono in booleano: ${boolLike.length === 0 ? '(nessuno)' : boolLike.join(', ')}`);
ok(boolLike.length === 0, 'il modulo `jjel` NON esporta nessun convertitore a booleano');

// La funzione esiste, ma e' `private` — che in TypeScript e' solo compile-time:
// a runtime sta sul prototype. La si esegue per LEGGERNE LA REGOLA, non per usarla.
const proto: any = (JjelEvaluator as any).prototype;
const hasIsTruthy = typeof proto?.isTruthy === 'function';
console.log(`\n  JjelEvaluator.prototype.isTruthy presente a runtime: ${hasIsTruthy}  (dichiarata \`private\`: barriera di compilazione, non di runtime)`);
ok(hasIsTruthy, 'la funzione esiste sul prototype dell\'evaluator');

if (hasIsTruthy) {
    const ev: any = new JjelEvaluator();
    const table: [string, JjelValue][] = [
        ['null', null],
        ['false', false],
        ['true', true],
        ['0', 0],
        ['1', 1],
        ['""', ''],
        ['"x"', 'x'],
        ['[]', []],
        ['[false]', [false]],
        ['[false, false]', [false, false]],
        ['{}', {}],
    ];
    console.log('\n  valore            isTruthy (JjEL)   Boolean() (JS, usata da JjTL/JjScript)   concordi?');
    let divergenze = 0;
    for (const [label, v] of table) {
        const a = ev.isTruthy(v);
        const b = Boolean(v as any);
        if (a !== b) divergenze++;
        console.log(`  ${label.padEnd(17)} ${String(a).padEnd(17)} ${String(b).padEnd(39)} ${a === b ? 'si' : 'NO'}`);
    }
    console.log(`\n  --> la regola di isTruthy: null->false, boolean->se stesso, number->!=0, string->non vuota,`);
    console.log(`      array->NON VUOTO (il contenuto non e' guardato), qualunque altro oggetto->true.`);
    console.log(`  --> divergenze fra le due regole sulla tabella: ${divergenze}`);
    ok(ev.isTruthy([false, false]) === true, 'isTruthy([false,false]) === true: conferma diretta del difetto');
    ok(ev.isTruthy([]) === false && Boolean([]) === true, 'le due regole divergono esattamente sull\'array vuoto');
}

// Il costrutto giusto esiste come builtin: e' il termine di paragone per lo Step 2.
console.log(`\n  getCollectionMethod('all')  -> ${typeof getCollectionMethod('all')}`);
console.log(`  getCollectionMethod('forAll')-> ${typeof getCollectionMethod('forAll')}   (assente: gia' misurato il 2026-09-08)`);
ok(typeof getCollectionMethod('all') === 'function', '`all` e\' un builtin di collezione');

// ── F. Controlli positivi ────────────────────────────────────────────────────
h('F. Controlli positivi: se uno di questi fallisce, la fixture e\' rotta e il referto non vale');

ok(jjelEval('1 == 1', {}) === true, 'controllo: l\'evaluator gira (1 == 1)');
ok(jjelEval('State.instances.size()', OK.vars) === 3, 'controllo: State.instances ha 3 elementi — la fixture e\' popolata');
ok(jjelEval('State.instances.size', OK.vars) === 3, 'controllo: `.size` senza parentesi funziona (la forma del libro)');
ok(jjelEval('ownedTransitions.isNotEmpty', ruleCtx(OK, OK.byName.Green)) === true, 'controllo: `.isNotEmpty` senza parentesi funziona');
ok(jjelEval('isFinal == false', ruleCtx(OK, OK.byName.Green)) === true, 'controllo: le feature appiattite sono leggibili come nomi nudi');
ok(jjelEval('self.name', ruleCtx(OK, OK.byName.Green)) === 'Green', 'controllo: `self` e\' legato all\'istanza');
ok(jjelEval('forall x in xs: x.p', { xs: [{ p: true }] } as any).toString() === 'true', 'controllo: forall con un solo elemento vero da\' [true]');

// ── G. Fuori dal mandato, dichiarato: il tri-stato di R-VAL-7 ────────────────
h('G. [oltre le 4 domande] Quali invarianti LANCIANO invece di rispondere');

// Un'istanza a cui manca del tutto la feature: e' il caso che R-VAL-7 chiama
// «non valutabile». Non e' quello che fillInstanceSlots produce da un modello ben
// formato (li' la feature c'e' e vale null), ma e' quello che si ottiene se la
// regola nomina una feature che la classe non ha.
const MALFORMED: Record<string, JjelValue> = { ...OK.vars, self: { __type: 'State', name: 'Ghost' } as any, name: 'Ghost' };
const g1 = tryEval('not isFinal implies ownedTransitions.isNotEmpty', MALFORMED);
const g2 = tryEval('forall t in ownedTransitions: t.nextState != null', MALFORMED);
const g3 = tryEval('self.owner.name != ""', MALFORMED);
console.log(`  INV2 su istanza senza le feature   -> ${g1.err ?? show(g1.v)}`);
console.log(`  INV3 su istanza senza le feature   -> ${g2.err ?? show(g2.v)}`);
console.log(`  navigazione su assente (self.owner.name) -> ${g3.err ?? show(g3.v)}`);
const g4 = jjelEvalWithDiagnostics('ownedTransitions', MALFORMED);
console.log(`  diagnostica su identificatore assente -> ${JSON.stringify(g4)}`);
ok(typeof g3.err === 'string' && g3.err.startsWith('JjelEvaluationError'), 'la navigazione su un assente LANCIA JjelEvaluationError (il canale del tri-stato)');
ok(g4.warnings.length > 0, 'un identificatore assente non lancia ma produce un warning: due canali distinti');
ok(JjelEvaluationError !== undefined, 'JjelEvaluationError e\' esportata e catturabile al confine');

// ── H. La regola candidata, messa alla prova qui e non scritta in albero ─────
h('H. [proposta] La regola di verdetto dichiarata dallo Step 2, provata sulle tre invarianti');

/**
 * NON e' codice che entra in albero: e' la regola che il prompt dello Step 2
 * prescrive di applicare SE la truthiness dell'evaluator non distingue `[false]`
 * da `[true]` — e il blocco C ha appena misurato che non lo distingue.
 *
 *   booleano -> se stesso
 *   insieme  -> soddisfa se e solo se OGNI elemento e' vero; l'insieme vuoto soddisfa
 *   null     -> non soddisfa (nessuna risposta non e' una risposta affermativa)
 *   altro    -> la truthiness ordinaria
 *
 * La differenza con l'evaluator sta tutta nelle due righe di mezzo, ed e'
 * esattamente dove il blocco C e il blocco D hanno trovato il difetto.
 */
function verdetto(v: JjelValue): boolean {
    if (typeof v === 'boolean') return v;
    if (Array.isArray(v)) return v.every(x => verdetto(x));   // vuoto -> true
    if (v === null) return false;
    if (typeof v === 'number') return v !== 0;
    if (typeof v === 'string') return v.length > 0;
    return true;
}

const casi: [string, string, Record<string, JjelValue>, boolean][] = [
    ['INV1  modello OK',                 INV1, OK.vars, true],
    ['INV1  senza stato iniziale',       INV1, NO_INITIAL.vars, false],
    ['INV1  con due stati iniziali',     INV1, TWO_INITIAL.vars, false],
    ['INV2  OK, self=Green',             INV2, ruleCtx(OK, OK.byName.Green), true],
    ['INV2  DEAD_END, self=Red',         INV2, ruleCtx(DEAD_END, DEAD_END.byName.Red), false],
    ['INV3  OK, self=Green',             INV3, ruleCtx(OK, OK.byName.Green), true],
    ['INV3  DANGLING, self=Yellow',      INV3, ruleCtx(DANGLING, DANGLING.byName.Yellow), false],
    ['INV3  DEAD_END, self=Red (vuoto)', INV3, ruleCtx(DEAD_END, DEAD_END.byName.Red), true],
];
console.log('  caso                              valore grezzo      verdetto()   truthiness evaluator   atteso');
for (const [label, src, vars, atteso] of casi) {
    const r = tryEval(src, vars);
    const v = r.err ? null : (r.v as JjelValue);
    const mio = r.err ? '(throw)' : String(verdetto(v));
    const suo = r.err ? '(throw)' : String((new (JjelEvaluator as any)() as any).isTruthy(v));
    console.log(`  ${label.padEnd(33)} ${(r.err ?? show(v)).padEnd(18)} ${mio.padEnd(12)} ${suo.padEnd(22)} ${atteso}`);
    ok(!r.err && verdetto(v) === atteso, `verdetto corretto — ${label}`);
}
console.log('\n  --> la colonna «truthiness evaluator» sbaglia due casi su otto, e sono i due che contano:');
console.log('      la transizione senza target (dichiarata soddisfatta) e lo stato senza transizioni (dichiarato violato).');

// ── Esito ────────────────────────────────────────────────────────────────────
h('ESITO');
console.log(`  ${pass} PASS   ${fail} FAIL`);
if (fail > 0) process.exitCode = 1;
