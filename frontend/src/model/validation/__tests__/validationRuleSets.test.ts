/**
 * validationRuleSets — le due decisioni dell'authoring, eseguite (R-VAL, Step 4).
 *
 * Il modulo e' puro e quindi si importa nella suite; `validationAuthoring.ts` no, perche'
 * scrive nel D-layer e tocca `window`. La partizione fra proprie ed ereditate non e' una
 * comodita' di resa: e' R-VAL-12 in forma eseguibile, e un refactoring che la sbagliasse
 * renderebbe modificabile dalla sottoclasse una regola della superclasse, cioe'
 * suggerirebbe un override che la decisione esclude.
 */

import { describe, it, expect } from 'vitest';
import { partitionRulesByClass, nextRuleName } from '../validationRuleSets';

const R = (id: string, context: string, name = id) => ({ id, name, context });

const SUB = 'C_Sub';
const SUPER = 'C_Super';
const GRAND = 'C_Grand';
const OTHER = 'C_Other';

const RULES = [
    R('r1', SUB), R('r2', SUPER), R('r3', GRAND), R('r4', OTHER), R('r5', SUB),
];

describe('§A la partizione: proprie ed ereditate sono due insiemi', () => {
    it('le proprie sono quelle della classe, nell\'ordine d\'ingresso', () => {
        const p = partitionRulesByClass(RULES, SUB, [SUPER, GRAND]);
        expect(p.own.map(r => r.id)).toEqual(['r1', 'r5']);
    });

    it('le ereditate vengono dalle superclassi e sanno DA DOVE', () => {
        const p = partitionRulesByClass(RULES, SUB, [SUPER, GRAND]);
        expect(p.inherited.map(i => [i.rule.id, i.fromClassId])).toEqual([['r2', SUPER], ['r3', GRAND]]);
    });

    it('una regola di una classe fuori dalla catena non compare da nessuna parte', () => {
        const p = partitionRulesByClass(RULES, SUB, [SUPER, GRAND]);
        const visti = [...p.own.map(r => r.id), ...p.inherited.map(i => i.rule.id)];
        expect(visti).not.toContain('r4');
        expect(visti).toHaveLength(4);   // controllo positivo: le altre quattro ci sono tutte
    });

    it('`allSuperClasses` include la classe stessa, e la propria NON finisce fra le ereditate', () => {
        // E' la forma che `LClass.allSuperClasses` restituisce davvero: `get_superclasses(c, true)`.
        const p = partitionRulesByClass(RULES, SUB, [SUB, SUPER, GRAND]);
        expect(p.own.map(r => r.id)).toEqual(['r1', 'r5']);
        expect(p.inherited.map(i => i.rule.id)).toEqual(['r2', 'r3']);
    });

    it('nessuna regola compare in entrambi gli insiemi, mai', () => {
        const p = partitionRulesByClass(RULES, SUB, [SUB, SUPER, GRAND]);
        const own = new Set(p.own.map(r => r.id));
        expect(p.inherited.some(i => own.has(i.rule.id))).toBe(false);
    });

    it('senza classe scelta i due insiemi sono vuoti', () => {
        const p = partitionRulesByClass(RULES, '', [SUPER]);
        expect(p.own).toEqual([]);
        expect(p.inherited).toEqual([]);
        // Controllo positivo: con la classe, non lo sono.
        expect(partitionRulesByClass(RULES, SUB, [SUPER]).own).toHaveLength(2);
    });

    it('un nome uguale su due classi resta DUE regole: nessun override (R-VAL-12)', () => {
        const omonime = [R('a', SUB, 'stessoNome'), R('b', SUPER, 'stessoNome')];
        const p = partitionRulesByClass(omonime, SUB, [SUPER]);
        expect(p.own.map(r => r.id)).toEqual(['a']);
        expect(p.inherited.map(i => i.rule.id)).toEqual(['b']);
    });
});

describe('§B il nome di partenza di una regola nuova', () => {
    it('e\' il primo libero, e i buchi si riusano', () => {
        expect(nextRuleName([])).toBe('rule_0');
        expect(nextRuleName(['rule_0'])).toBe('rule_1');
        expect(nextRuleName(['rule_0', 'rule_1'])).toBe('rule_2');
        expect(nextRuleName(['rule_1'])).toBe('rule_0');
    });

    it('e\' unico rispetto a TUTTO il viewpoint, non alla sola classe', () => {
        // I nomi sono unici dentro il viewpoint (spec §4.1): nella lista delle violazioni
        // il nome della regola e' l'unica cosa che le distingue.
        expect(nextRuleName(['rule_0', 'rule_1', 'altro'])).toBe('rule_2');
    });

    it('non collide nemmeno con nomi non numerati', () => {
        expect(nextRuleName(['rule_0', 'rule_2'])).toBe('rule_1');
    });
});
