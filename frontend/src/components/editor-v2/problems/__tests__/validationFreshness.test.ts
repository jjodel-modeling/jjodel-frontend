/**
 * La freschezza, e il ritiro che le va insieme (R-VAL-18).
 *
 * Il soggetto e' `validationFreshness.ts`, che e' puro: nessun barrel, nessun React, il
 * registro dei problemi come sola dipendenza. `vi.resetModules()` a ogni test — sia la
 * mappa della freschezza sia il registro sono stato module-level.
 *
 * Le due meta' della regola si misurano SEPARATAMENTE e poi INSIEME, perche' e' la loro
 * coppia a essere la regola: il ritiro da solo lascerebbe l'assenza di pallini
 * indistinguibile da un modello pulito.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

type Any = any;

let FR: typeof import('../validationFreshness');
let VTP: typeof import('../validationToProblems');
let REG: typeof import('../registry');

beforeEach(async () => {
    vi.resetModules();
    REG = await import('../registry');
    VTP = await import('../validationToProblems');
    FR = await import('../validationFreshness');
    vi.useFakeTimers();
});
afterEach(() => { vi.useRealTimers(); });

const violation = (instanceId: string, ruleId: string): Any =>
    ({ instanceId, ruleId, ruleName: `rule_${ruleId}`, message: `msg_${ruleId}` });
const resolver = (objectId: string): string | null =>
    ({ o1: 'v1' } as Record<string, string>)[objectId] ?? null;

const entries = (model: string): string[] => REG.getProblemIdsOwnedBy('validation', model);

/** Un giro di Validate completo, come lo fa la Toolbar: pubblica e poi dichiara. */
function validate(model: string, violations: Any[], signature: string): void {
    VTP.publishValidationProblems(model, violations, resolver);
    FR.noteValidationRun(model, violations.length, signature);
}

// ── LA FIRMA ─────────────────────────────────────────────────────────────────

describe('buildValidationSignature', () => {
    const obj = (id: string, over: Any = {}) =>
        ({ id, className: 'DObject', instanceof: 'c1', name: 'n', ...over });
    const rule = (id: string, over: Any = {}) => ({
        id, className: 'DValidationRule', name: 'r', context: 'c1',
        body: 'true', message: 'm', enabled: true, ...over,
    });

    it('cambia quando cambia un valore di slot', () => {
        const a = FR.buildValidationSignature({ s1: { id: 's1', className: 'DValue', values: [1] } });
        const b = FR.buildValidationSignature({ s1: { id: 's1', className: 'DValue', values: [2] } });
        expect(a).not.toBe(b);
    });

    it('cambia quando un\'istanza viene rinominata', () => {
        expect(FR.buildValidationSignature({ o1: obj('o1') }))
            .not.toBe(FR.buildValidationSignature({ o1: obj('o1', { name: 'altro' }) }));
    });

    it('cambia quando un\'istanza cambia metaclasse', () => {
        expect(FR.buildValidationSignature({ o1: obj('o1') }))
            .not.toBe(FR.buildValidationSignature({ o1: obj('o1', { instanceof: 'c2' }) }));
    });

    it('cambia quando una classe cambia gerarchia — decide quali regole si applicano', () => {
        const c = (over: Any) => ({ c1: { id: 'c1', className: 'DClass', name: 'C', extends: [], ...over } });
        expect(FR.buildValidationSignature(c({})))
            .not.toBe(FR.buildValidationSignature(c({ extends: ['c0'] })));
    });

    // LA META' CHE UNA FIRMA SUL SOLO MODELLO MANCHEREBBE. Sono quattro test e non uno
    // perche' ognuno e' un campo che `collectValidationRules` legge: mancarne uno
    // significa pallini che rispondono a una regola che non c'e' piu'.
    it('cambia quando cambia il CORPO di una regola', () => {
        expect(FR.buildValidationSignature({ r1: rule('r1') }))
            .not.toBe(FR.buildValidationSignature({ r1: rule('r1', { body: 'false' }) }));
    });

    it('cambia quando una regola viene SPENTA', () => {
        expect(FR.buildValidationSignature({ r1: rule('r1') }))
            .not.toBe(FR.buildValidationSignature({ r1: rule('r1', { enabled: false }) }));
    });

    it('cambia quando cambia il CONTESTO di una regola', () => {
        expect(FR.buildValidationSignature({ r1: rule('r1') }))
            .not.toBe(FR.buildValidationSignature({ r1: rule('r1', { context: 'c2' }) }));
    });

    it('cambia quando cambia il MESSAGGIO o il NOME di una regola', () => {
        const base = FR.buildValidationSignature({ r1: rule('r1') });
        expect(base).not.toBe(FR.buildValidationSignature({ r1: rule('r1', { message: 'altro' }) }));
        expect(base).not.toBe(FR.buildValidationSignature({ r1: rule('r1', { name: 'altro' }) }));
    });

    it('cambia quando una regola entra in un viewpoint di validazione', () => {
        const vp = (rules: string[]) => ({ v: { id: 'v', className: 'DValidationViewpoint', rules } });
        expect(FR.buildValidationSignature(vp([])))
            .not.toBe(FR.buildValidationSignature(vp(['r1'])));
    });

    // Il viewpoint di default ha un id fisso, ma R-VAL-2 ne vuole piu' d'uno: la firma
    // scandisce per className, quindi un secondo viewpoint non le sfugge.
    it('vede un viewpoint di validazione con un id qualunque', () => {
        const one = { X: { id: 'X', className: 'DValidationViewpoint', rules: ['r1'] } };
        expect(FR.buildValidationSignature(one)).toContain('VX=r1');
    });

    it('NON cambia per una modifica che non riguarda ne\' il modello ne\' le regole', () => {
        // Un DVertex e' posizione sul canvas: spostare un nodo non invalida un verdetto.
        const g = (x: number) => ({ v1: { id: 'v1', className: 'DVertex', model: 'o1', x, y: 0 } });
        expect(FR.buildValidationSignature(g(10))).toBe(FR.buildValidationSignature(g(999)));
    });

    it('sopporta un idlookup assente', () => {
        expect(FR.buildValidationSignature(undefined)).toBe('');
    });
});

// ── I TRE STATI ──────────────────────────────────────────────────────────────

describe('i tre stati della dichiarazione', () => {
    it('parte da «mai validato», che non e\' «pulito»', () => {
        expect(FR.getFreshness('m1')).toEqual({ status: 'never' });
    });

    it('dopo un giro dichiara «fresh» col numero delle violazioni e la firma vista', () => {
        validate('m1', [violation('o1', 'r1')], 'SIG');
        expect(FR.getFreshness('m1')).toEqual({ status: 'fresh', violationCount: 1, signature: 'SIG' });
    });

    it('un giro pulito e\' «fresh» con zero, e resta distinto da «mai validato»', () => {
        validate('m1', [], 'SIG');
        expect(FR.getFreshness('m1')).toEqual({ status: 'fresh', violationCount: 0, signature: 'SIG' });
    });

    it('markStaleIfFresh porta a «stale»', () => {
        validate('m1', [violation('o1', 'r1')], 'SIG');
        expect(FR.markStaleIfFresh('m1')).toBe(true);
        expect(FR.getFreshness('m1')).toEqual({ status: 'stale' });
    });

    it('la freschezza e\' per modello: un altro modello non la eredita', () => {
        validate('m1', [violation('o1', 'r1')], 'SIG');
        expect(FR.getFreshness('m2')).toEqual({ status: 'never' });
    });
});

// ── LA COPPIA: RITIRO E DICHIARAZIONE ────────────────────────────────────────

describe('il ritiro e la dichiarazione sono una transizione sola', () => {
    it('markStaleIfFresh RITIRA le voci e LO DICE, insieme', () => {
        validate('m1', [violation('o1', 'r1')], 'SIG');
        expect(entries('m1')).toHaveLength(2);   // elemento + vertice

        FR.markStaleIfFresh('m1');

        // Il ritiro: nessuna voce resta, ne' attiva ne' risolta.
        expect(entries('m1')).toHaveLength(0);
        expect(REG.getNodeProblemsSnapshot('v1')).toHaveLength(0);
        // La dichiarazione: senza questa, l'assenza di pallini sarebbe indistinguibile
        // da un modello validato e pulito.
        expect(FR.getFreshness('m1').status).toBe('stale');
    });

    // Ritirate, NON marcate risolte: il verde del transitorio direbbe «l'hai sistemata»,
    // e la verita' e' «non l'ho piu' controllata».
    it('non lascia dietro di se\' voci marcate risolte', () => {
        validate('m1', [violation('o1', 'r1')], 'SIG');
        FR.markStaleIfFresh('m1');
        expect(REG.getNodeProblemsSnapshot('o1')).toHaveLength(0);
        expect(REG.getNodeProblemsSnapshot('v1')).toHaveLength(0);
    });

    it('non invalida un modello mai validato: resta «mai validato», che e\' la verita\'', () => {
        expect(FR.markStaleIfFresh('m1')).toBe(false);
        expect(FR.getFreshness('m1')).toEqual({ status: 'never' });
    });

    it('un secondo markStaleIfFresh e\' inerte', () => {
        validate('m1', [violation('o1', 'r1')], 'SIG');
        FR.markStaleIfFresh('m1');
        expect(FR.markStaleIfFresh('m1')).toBe(false);
        expect(FR.getFreshness('m1')).toEqual({ status: 'stale' });
    });

    it('non tocca le voci ne\' la dichiarazione di un altro modello', () => {
        validate('m1', [violation('o1', 'r1')], 'SIG');
        validate('m2', [violation('o1', 'r1')], 'SIG');
        FR.markStaleIfFresh('m1');
        expect(entries('m2')).toHaveLength(2);
        expect(FR.getFreshness('m2').status).toBe('fresh');
    });

    it('non tocca le voci degli altri produttori', () => {
        REG.registerProblem({
            id: 'conformance:v1', nodeId: 'v1', kind: 'conformance', severity: 'error',
            title: 'Conformance', description: 'x', relatedNodeIds: [],
            ownerModelId: 'm1', createdAt: 0,
        });
        validate('m1', [violation('o1', 'r1')], 'SIG');
        FR.markStaleIfFresh('m1');
        expect(REG.getNodeProblemsSnapshot('v1').map(p => p.kind)).toEqual(['conformance']);
    });

    it('un nuovo giro dopo lo stale ridichiara «fresh» e riaccende i pallini', () => {
        validate('m1', [violation('o1', 'r1')], 'SIG_A');
        FR.markStaleIfFresh('m1');
        validate('m1', [violation('o1', 'r1')], 'SIG_B');
        expect(FR.getFreshness('m1')).toEqual({ status: 'fresh', violationCount: 1, signature: 'SIG_B' });
        expect(entries('m1')).toHaveLength(2);
    });
});

describe('resetFreshness', () => {
    it('riporta a «mai validato» e ritira le voci', () => {
        validate('m1', [violation('o1', 'r1')], 'SIG');
        FR.resetFreshness('m1');
        expect(FR.getFreshness('m1')).toEqual({ status: 'never' });
        expect(entries('m1')).toHaveLength(0);
    });

    // «Non ho potuto guardare» non e' «va tutto bene»: dopo un comando che non produce
    // referto, la dichiarazione non deve restare quella del giro precedente.
    it('cancella una dichiarazione «fresh» precedente', () => {
        validate('m1', [], 'SIG');
        FR.resetFreshness('m1');
        expect(FR.getFreshness('m1').status).toBe('never');
    });
});

describe('subscribe', () => {
    it('notifica a ogni transizione e non quando lo stato non cambia', () => {
        let n = 0;
        const off = FR.subscribe(() => { n++; });
        FR.noteValidationRun('m1', 0, 'SIG');
        expect(n).toBe(1);
        FR.markStaleIfFresh('m1');
        expect(n).toBe(2);
        FR.markStaleIfFresh('m1');   // gia' stale: inerte
        expect(n).toBe(2);
        off();
        FR.noteValidationRun('m1', 0, 'SIG');
        expect(n).toBe(2);
    });
});
