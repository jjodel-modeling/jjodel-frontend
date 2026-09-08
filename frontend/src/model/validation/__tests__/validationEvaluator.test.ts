/**
 * validationEvaluator — il valutatore, eseguito.
 *
 * A differenza di `validationTypes.test.ts`, che e' sul sorgente perche' il modulo
 * importa `joiner`, questo file **esegue** il modulo: `validationEvaluator.ts` non
 * importa niente oltre a JjEL, e JjEL non tocca `window`. La purezza serviva a questo.
 *
 * ── La fixture, e perche' ha questa forma ────────────────────────────────────
 *
 * Il semaforo della Tabella 7.5 del libro: tre stati, tre transizioni. Gli handle sono
 * oggetti piatti con le feature sotto il nome nudo, che e' la forma che
 * `buildEvalContext` / `fillInstanceSlots` producono dal modello vero — e le tre scelte
 * che contano sono le stesse dello Step 0: una feature multivalore e' SEMPRE un array
 * (vuoto se non popolata), una reference singola non popolata e' `null` e non assente,
 * una classe e' un oggetto piatto con `.instances`.
 *
 * ── Il controllo positivo, e P12 ─────────────────────────────────────────────
 *
 * Ogni asserzione di ASSENZA — «nessuna violazione», «non finisce fra le violazioni» —
 * e' accompagnata dalla stessa chiamata su un modello che invece la produce. Un
 * `toHaveLength(0)` passa identico se il valutatore non ha valutato niente: senza il
 * confronto non distingue «non viola» da «non ha guardato».
 */

import { describe, it, expect } from 'vitest';
import {
    evaluateValidation, verdict,
    type ValidationInput, type ValidationRuleInput, type ValidationInstanceInput,
} from '../validationEvaluator';

// ── La fixture ───────────────────────────────────────────────────────────────

type Tr = { __type: string; id: string; name: string; nextState: any };
type St = { __type: string; id: string; name: string; isInitial: boolean; isFinal: boolean; ownedTransitions: Tr[] };

function semaforo(opts: { initial: string | null; danglingFrom?: string; deadEnd?: string } = { initial: 'Green' }) {
    const mk = (name: string): St => ({
        __type: 'State', id: 'st_' + name, name,
        isInitial: false, isFinal: false, ownedTransitions: [],
    });
    const green = mk('Green'), yellow = mk('Yellow'), red = mk('Red');
    const states = [green, yellow, red];
    const byName: Record<string, St> = { Green: green, Yellow: yellow, Red: red };
    if (opts.initial) byName[opts.initial].isInitial = true;

    const mkT = (name: string, from: St, to: St | null): Tr => {
        const t: Tr = { __type: 'Transition', id: 'tr_' + name, name, nextState: to };
        from.ownedTransitions.push(t);
        return t;
    };
    const transitions = [mkT('g2y', green, yellow), mkT('y2r', yellow, red), mkT('r2g', red, green)];
    if (opts.danglingFrom) for (const t of byName[opts.danglingFrom].ownedTransitions) t.nextState = null;
    if (opts.deadEnd) byName[opts.deadEnd].ownedTransitions = [];

    const StateCls = { __type: 'DClass', name: 'State', instances: states, allInstances: states };
    const TransitionCls = { __type: 'DClass', name: 'Transition', instances: transitions, allInstances: transitions };
    return { states, transitions, byName, globals: { State: StateCls, Transition: TransitionCls } as any };
}

/** Un'istanza nella forma che il valutatore vuole: `self` piu' le feature appiattite. */
const asInstance = (s: any, chain: string[] = ['C_State']): ValidationInstanceInput => ({
    id: s.id, classChain: chain, self: s, bindings: { ...s },
});

const rule = (over: Partial<ValidationRuleInput> & { id: string; body: string }): ValidationRuleInput => ({
    name: over.id, context: 'C_State', message: 'violata', enabled: true, ...over,
});

/** Le tre invarianti della Tabella 7.5. La terza nella forma che R-VAL-13 impone. */
const INV1 = '(forall s in State.instances such that s.isInitial).size == 1';
const INV2 = 'not isFinal implies ownedTransitions.isNotEmpty';
const INV3 = 'ownedTransitions.all(t => t.nextState != null)';
/** La terza come la scrive il libro oggi: restituisce un array, non un verdetto. */
const INV3_LIBRO = 'forall t in ownedTransitions: t.nextState != null';

function run(rules: ValidationRuleInput[], fx = semaforo(), chain?: string[]) {
    const input: ValidationInput = {
        rules,
        instances: fx.states.map(s => asInstance(s, chain)),
        globals: fx.globals,
    };
    return evaluateValidation(input);
}

// ── §A Il verdetto, da solo ──────────────────────────────────────────────────

describe('§A verdict() — l\'unica funzione che decide, e non converte niente', () => {
    it('i due soli verdetti sono i due booleani', () => {
        expect(verdict(true)).toBe('satisfied');
        expect(verdict(false)).toBe('violated');
    });

    it('un array che contiene un falso NON e\' un verdetto (Step 0: e\' «vero» per ogni via)', () => {
        expect(verdict([false])).toBe('not-boolean');
        expect(verdict([false, false])).toBe('not-boolean');
        expect(verdict([true, false, true])).toBe('not-boolean');
    });

    it('l\'array vuoto NON e\' un verdetto (Step 0: e\' «falso» per isTruthy, «vero» per Boolean)', () => {
        expect(verdict([])).toBe('not-boolean');
    });

    it('e nemmeno null, i numeri, le stringhe, gli oggetti', () => {
        for (const v of [null, 0, 1, '', 'x', {} as any]) expect(verdict(v)).toBe('not-boolean');
    });
});

// ── §B Le tre invarianti del libro ───────────────────────────────────────────

describe('§B le tre invarianti della Tabella 7.5, valutate sul semaforo', () => {
    it('sul modello corretto nessuna delle tre e\' violata, e tutte e tre sono state VALUTATE', () => {
        const r = run([rule({ id: 'inv1', body: INV1 }), rule({ id: 'inv2', body: INV2 }), rule({ id: 'inv3', body: INV3 })]);
        expect(r.violations).toHaveLength(0);
        // Controllo positivo (P12): un `toHaveLength(0)` passa identico se non e' stato
        // valutato niente. Queste due righe distinguono «non viola» da «non ha guardato».
        expect(r.notEvaluable).toHaveLength(0);
        expect(r.defects).toHaveLength(0);
        const sporco = run([rule({ id: 'inv1', body: INV1 })], semaforo({ initial: null }));
        expect(sporco.violations.length).toBeGreaterThan(0);
    });

    it('INV1 cade quando gli stati iniziali sono due', () => {
        const fx = semaforo({ initial: 'Green' });
        fx.byName.Red.isInitial = true;
        const r = run([rule({ id: 'inv1', body: INV1 })], fx);
        expect(r.violations.map(v => v.ruleId)).toEqual(['inv1', 'inv1', 'inv1']);
    });

    it('INV2 cade sullo stato non finale rimasto senza transizioni uscenti', () => {
        const r = run([rule({ id: 'inv2', body: INV2 })], semaforo({ initial: 'Green', deadEnd: 'Red' }));
        expect(r.violations.map(v => v.instanceId)).toEqual(['st_Red']);
        expect(r.notEvaluable).toHaveLength(0);
    });

    it('INV3 cade sullo stato la cui transizione non ha target', () => {
        const r = run([rule({ id: 'inv3', body: INV3 })], semaforo({ initial: 'Green', danglingFrom: 'Yellow' }));
        expect(r.violations.map(v => v.instanceId)).toEqual(['st_Yellow']);
    });

    it('INV3 e\' vera vacuamente sullo stato senza transizioni: `all` sul vuoto e\' true', () => {
        const r = run([rule({ id: 'inv3', body: INV3 })], semaforo({ initial: 'Green', deadEnd: 'Red' }));
        expect(r.violations).toHaveLength(0);
        expect(r.notEvaluable).toHaveLength(0);
    });

    it('INV3 nella forma del libro NON produce un verdetto: e\' un difetto della regola, non del modello', () => {
        const r = run([rule({ id: 'inv3libro', body: INV3_LIBRO })], semaforo({ initial: 'Green', danglingFrom: 'Yellow' }));
        // La riga che conta: il modello E' rotto, e la regola scritta cosi' NON lo dice.
        expect(r.violations).toHaveLength(0);
        expect(r.notEvaluable).toHaveLength(3);
        expect(r.notEvaluable.every(n => n.reason === 'non-boolean')).toBe(true);
        expect(r.notEvaluable[0].detail).toContain('array(1)');
        // ... e la stessa proprieta', riscritta come impone R-VAL-13, lo dice.
        const ok = run([rule({ id: 'inv3', body: INV3 })], semaforo({ initial: 'Green', danglingFrom: 'Yellow' }));
        expect(ok.violations.map(v => v.instanceId)).toEqual(['st_Yellow']);
    });
});

// ── §C Il criterio di accettazione del prompt ────────────────────────────────

describe('§C tolto lo stato iniziale la prima invariante compare, rimesso sparisce', () => {
    const rules = [rule({ id: 'inv1', body: INV1, name: 'oneInitialState', message: 'esattamente uno stato iniziale' })];

    it('senza stato iniziale, INV1 e\' fra le violazioni', () => {
        const r = run(rules, semaforo({ initial: null }));
        expect(r.violations).toHaveLength(3);   // una voce per istanza del contesto
        expect(r.violations[0]).toEqual({
            instanceId: 'st_Green', ruleId: 'inv1', ruleName: 'oneInitialState',
            message: 'esattamente uno stato iniziale',
        });
    });

    it('rimesso lo stato iniziale, sparisce — e non perche\' il valutatore ha smesso di guardare', () => {
        const r = run(rules, semaforo({ initial: 'Green' }));
        expect(r.violations).toHaveLength(0);
        expect(r.notEvaluable).toHaveLength(0);
        expect(r.defects).toHaveLength(0);
        expect(r.disabledRuleCount).toBe(0);
        expect(r.suspectRuleIds).toHaveLength(0);
    });
});

// ── §D L'accumulo lungo la gerarchia (R-VAL-12) ──────────────────────────────

describe('§D le regole si accumulano, nessuna sovrascrive nessuna', () => {
    const CHAIN = ['C_State', 'C_AbstractState'];

    it('valgono la regola della classe e quella della superclasse, entrambe', () => {
        const r = run([
            rule({ id: 'sub', context: 'C_State', body: 'false', message: 'dalla sottoclasse' }),
            rule({ id: 'super', context: 'C_AbstractState', body: 'false', message: 'dalla superclasse' }),
        ], semaforo(), CHAIN);
        expect(r.violations).toHaveLength(6);   // 2 regole x 3 istanze
        expect(new Set(r.violations.map(v => v.ruleId))).toEqual(new Set(['sub', 'super']));
    });

    it('un nome uguale NON crea override: due voci, due messaggi', () => {
        const r = run([
            rule({ id: 'a', name: 'stessoNome', context: 'C_State', body: 'false', message: 'dalla sottoclasse' }),
            rule({ id: 'b', name: 'stessoNome', context: 'C_AbstractState', body: 'false', message: 'dalla superclasse' }),
        ], semaforo(), CHAIN);
        const perIstanza = r.violations.filter(v => v.instanceId === 'st_Green');
        expect(perIstanza).toHaveLength(2);
        expect(perIstanza.map(v => v.message).sort()).toEqual(['dalla sottoclasse', 'dalla superclasse']);
    });

    it('una regola di una classe che non e\' nella catena non si applica', () => {
        const r = run([
            rule({ id: 'altrove', context: 'C_Transition', body: 'false' }),
            rule({ id: 'qui', context: 'C_State', body: 'false' }),   // controllo positivo
        ], semaforo(), CHAIN);
        expect(r.violations.map(v => v.ruleId)).toEqual(['qui', 'qui', 'qui']);
    });
});

// ── §E I tre ingressi del non valutabile (R-VAL-13) ──────────────────────────

describe('§E i tre ingressi del non valutabile, e nessuno di essi e\' una violazione', () => {
    it('1. l\'eccezione: la navigazione su un assente lancia, e non diventa una violazione', () => {
        const r = run([rule({ id: 'boom', body: 'self.owner.name != ""' })]);
        expect(r.violations).toHaveLength(0);
        expect(r.notEvaluable).toHaveLength(3);
        expect(r.notEvaluable.every(n => n.reason === 'exception')).toBe(true);
        expect(r.notEvaluable[0].detail).toContain('JjelEvaluationError');
    });

    it('2. il risultato non booleano: `forall` su un NON array torna [] e non lancia', () => {
        const r = run([rule({ id: 'vuoto', body: 'forall t in nonEsiste: t.x' })]);
        expect(r.violations).toHaveLength(0);
        expect(r.notEvaluable).toHaveLength(3);
        // L'assenza di `nonEsiste` la vede prima il warning: e' la diagnosi piu' utile.
        expect(r.notEvaluable[0].reason).toBe('absent-identifier');

        // Lo stesso ingresso, isolato da ogni assenza: un corpo che risponde un numero.
        const n = run([rule({ id: 'numero', body: '1 + 1' })]);
        expect(n.violations).toHaveLength(0);
        expect(n.notEvaluable.every(x => x.reason === 'non-boolean')).toBe(true);
        expect(n.notEvaluable[0].detail).toContain('number');
    });

    it('3. l\'identificatore assente: non lancia, non cambia tipo, e senza i warning passerebbe per un verdetto', () => {
        const r = run([rule({ id: 'refuso', body: 'isFinl == false' })]);
        expect(r.violations).toHaveLength(0);
        expect(r.notEvaluable).toHaveLength(3);
        expect(r.notEvaluable[0].reason).toBe('absent-identifier');
        expect(r.notEvaluable[0].detail).toContain('isFinl');
        // Il controllo positivo, e qui e' obbligatorio (P12): scritto GIUSTO, lo stesso
        // corpo produce un verdetto. Senza questa riga, «tutto non valutabile» sarebbe
        // indistinguibile da un valutatore che non valuta.
        const ok = run([rule({ id: 'giusto', body: 'isFinal == false' })]);
        expect(ok.notEvaluable).toHaveLength(0);
        expect(ok.violations).toHaveLength(0);
    });

    it('la navigazione sicura non compra un verdetto: `?.` dice come navigare, non che il dato c\'era', () => {
        const r = run([rule({ id: 'safe', body: 'self.owner?.name != ""' })]);
        expect(r.violations).toHaveLength(0);
        expect(r.notEvaluable.every(n => n.reason === 'absent-identifier')).toBe(true);
    });
});

// ── §F Attivazione, difetti della regola, sospetto ───────────────────────────

describe('§F le regole spente, quelle rotte, quelle sospette', () => {
    it('una regola spenta non gira, e il conto e\' dichiarato', () => {
        const r = run([
            rule({ id: 'spenta', body: 'false', enabled: false }),
            rule({ id: 'accesa', body: 'false' }),        // controllo positivo
        ]);
        expect(r.disabledRuleCount).toBe(1);
        expect(r.violations.map(v => v.ruleId)).toEqual(['accesa', 'accesa', 'accesa']);
    });

    it('un corpo che non compila e\' un difetto della REGOLA, e non gira su nessuna istanza', () => {
        const r = run([rule({ id: 'rotta', body: 'coll.forAll(x => x.p)' })]);
        expect(r.defects).toHaveLength(1);
        expect(r.defects[0]).toMatchObject({ ruleId: 'rotta', kind: 'parse-error' });
        expect(r.violations).toHaveLength(0);
        expect(r.notEvaluable).toHaveLength(0);   // non gira: non produce voci per istanza
    });

    it('non valutabile su TUTTE le istanze del contesto e\' sospetta; su alcune, no', () => {
        const tutte = run([rule({ id: 'refuso', body: 'isFinl == false' })]);
        expect(tutte.suspectRuleIds).toEqual(['refuso']);

        // Su alcune: la stessa regola cade solo dove il dato manca davvero.
        const fx = semaforo();
        (fx.byName.Red as any).ownedTransitions = null;   // un'istanza malformata su tre
        const alcune = run([rule({ id: 'parziale', body: 'ownedTransitions.isNotEmpty' })], fx);
        expect(alcune.notEvaluable).toHaveLength(1);
        expect(alcune.notEvaluable[0].instanceId).toBe('st_Red');
        expect(alcune.suspectRuleIds).toHaveLength(0);
    });

    it('una regola che non si applica a nessuna istanza non e\' sospetta: non e\' mai stata provata', () => {
        const r = run([rule({ id: 'altrove', context: 'C_Transition', body: 'isFinl == false' })]);
        expect(r.suspectRuleIds).toHaveLength(0);
        expect(r.notEvaluable).toHaveLength(0);
    });

    it('il valutatore non lancia mai, nemmeno con tutto rotto insieme', () => {
        const fx = semaforo();
        (fx.byName.Red as any).ownedTransitions = null;
        expect(() => run([
            rule({ id: 'r1', body: 'self.a.b.c' }),
            rule({ id: 'r2', body: '((((' }),
            rule({ id: 'r3', body: 'forall x in ownedTransitions: x.nextState' }),
            rule({ id: 'r4', body: 'true' }),
        ], fx)).not.toThrow();
    });
});
