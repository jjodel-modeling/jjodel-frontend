/**
 * singletonShape — la forma del nodo istanza e le due meta' dell'etichetta.
 *
 * Le prove qui sono di due tipi. Sulla FORMA: che la regola guardi il contenuto
 * e non il solo flag, perche' e' quello che tiene il `Config` con struttura
 * dentro un rettangolo. Sull'ETICHETTA: che «prima superclasse diretta astratta»
 * sia esattamente questo e non una delle tre nozioni vicine — la prima diretta,
 * la prima astratta a qualunque profondita', la prima in ordine alfabetico —
 * ognuna delle quali passerebbe un test scritto male sullo stesso modello.
 *
 * Ogni caso della scala porta il proprio controllo negativo: un modello che
 * distingue la regola giusta da quella sbagliata, non solo uno che la conferma.
 */

import { describe, it, expect } from 'vitest';
import {
    countValuedSlots,
    firstAbstractDirectSuperclass,
    readDirectSuperclasses,
    readIsSingleton,
    readSingletonInstanceInfo,
    resolveInstanceShape,
    singletonLabelParts,
    type SuperclassRef,
} from '../singletonShape';

// ─── Fixture: il modello dell'accettazione ───────────────────────────────────
//
//   Color (astratta)
//     ^-- Red, Green, Blue   (concrete, singleton, un'istanza omonima ciascuna)
//   Config (singleton, nessuna superclasse)
//   Shape  (ordinaria, non singleton)
//
// Piu' quello che serve ai controlli negativi: una superclasse CONCRETA
// (`Named`) e una astratta di SECONDO livello (`Base`), che nessuna delle due
// deve finire nell'etichetta.

function buildLookup(): Record<string, any> {
    return {
        // M2
        Base: { className: 'DClass', name: 'Base', abstract: true, extends: [] },
        Named: { className: 'DClass', name: 'Named', abstract: false, extends: ['Base'] },
        Color: { className: 'DClass', name: 'Color', abstract: true, extends: ['Base'] },
        Red: { className: 'DClass', name: 'Red', abstract: false, isSingleton: true, extends: ['Color'] },
        // Ordine dichiarato: la CONCRETA per prima. Se l'implementazione
        // restituisse «la prima diretta» invece di «la prima diretta astratta»,
        // qui direbbe `Named` e il test lo vedrebbe.
        Green: { className: 'DClass', name: 'Green', abstract: false, isSingleton: true, extends: ['Named', 'Color'] },
        Config: { className: 'DClass', name: 'Config', abstract: false, isSingleton: true, extends: [] },
        Shape: { className: 'DClass', name: 'Shape', abstract: false, isSingleton: false, extends: [] },

        // M1
        red: { className: 'DObject', name: 'Red', instanceof: 'Red', features: ['v_identity'] },
        green: { className: 'DObject', name: 'Green', instanceof: 'Green', features: [] },
        cfgEmpty: { className: 'DObject', name: 'Config', instanceof: 'Config', features: ['v_blank'] },
        cfgFull: { className: 'DObject', name: 'Config', instanceof: 'Config', features: ['v_debug', 'v_level'] },
        shape0: { className: 'DObject', name: 'Shape_0', instanceof: 'Shape', features: ['v_label'] },

        // Gli slot puntano alla feature dichiarata: e' la condizione perche'
        // il compartimento li renda, e quindi perche' il conteggio li veda.
        a_debug: { className: 'DAttribute', name: 'debug' },
        a_level: { className: 'DAttribute', name: 'level' },
        a_label: { className: 'DAttribute', name: 'label' },
        v_debug: { className: 'DValue', instanceof: 'a_debug', values: [true] },
        v_level: { className: 'DValue', instanceof: 'a_level', values: [2] },
        v_blank: { className: 'DValue', instanceof: 'a_debug', values: [''] },
        v_label: { className: 'DValue', instanceof: 'a_label', values: ['hello'] },

        // Lo slot IDENTITA': tiene il nome dell'istanza e non punta a nessuna
        // feature, perche' la classe non dichiara `name`. Presente su `red`.
        v_identity: { className: 'DValue', values: ['Red'] },
    };
}

// ─── Forma ───────────────────────────────────────────────────────────────────

describe('resolveInstanceShape', () => {
    it('singleton senza slot valorizzati: pill', () => {
        expect(resolveInstanceShape({ isSingleton: true, valuedSlotCount: 0 })).toBe('pill');
    });

    it('singleton CON slot valorizzati: rettangolo, perche\' la pill non ospita un compartimento', () => {
        expect(resolveInstanceShape({ isSingleton: true, valuedSlotCount: 1 })).toBe('rectangle');
        expect(resolveInstanceShape({ isSingleton: true, valuedSlotCount: 2 })).toBe('rectangle');
    });

    it('non singleton: rettangolo anche a zero slot — il controllo negativo del flag', () => {
        expect(resolveInstanceShape({ isSingleton: false, valuedSlotCount: 0 })).toBe('rectangle');
    });
});

// ─── Prima superclasse diretta astratta ──────────────────────────────────────

describe('firstAbstractDirectSuperclass', () => {
    const abstractColor: SuperclassRef = { id: 'Color', name: 'Color', abstract: true };
    const concreteNamed: SuperclassRef = { id: 'Named', name: 'Named', abstract: false };
    const abstractBase: SuperclassRef = { id: 'Base', name: 'Base', abstract: true };

    it('nessuna superclasse: null', () => {
        expect(firstAbstractDirectSuperclass([])).toBeNull();
    });

    it('salta le concrete: una superclasse concreta nomina un insieme di cui l\'istanza poteva essere membro ordinario', () => {
        expect(firstAbstractDirectSuperclass([concreteNamed])).toBeNull();
        expect(firstAbstractDirectSuperclass([concreteNamed, abstractColor])?.name).toBe('Color');
    });

    it('con piu\' astratte prende la PRIMA DICHIARATA, non l\'alfabetica', () => {
        // Alfabeticamente vincerebbe Base: il test fallisce se qualcuno ordina.
        expect(firstAbstractDirectSuperclass([abstractColor, abstractBase])?.name).toBe('Color');
        expect(firstAbstractDirectSuperclass([abstractBase, abstractColor])?.name).toBe('Base');
    });
});

describe('readDirectSuperclasses', () => {
    it('risolve i pointer in ordine di dichiarazione', () => {
        const l = buildLookup();
        expect(readDirectSuperclasses(l, 'Green').map(s => s.name)).toEqual(['Named', 'Color']);
    });

    it('legge `abstract`, non `isAbstract`: il secondo non esiste sul layer D', () => {
        const l = buildLookup();
        // Controllo positivo e negativo nello stesso modello: Color e' astratta,
        // Named no, e la differenza deve arrivare fino a qui.
        const supers = readDirectSuperclasses(l, 'Green');
        expect(supers.find(s => s.name === 'Color')?.abstract).toBe(true);
        expect(supers.find(s => s.name === 'Named')?.abstract).toBe(false);
    });

    it('NON e\' transitiva: Base e\' astratta ma sta due livelli sopra Red', () => {
        const l = buildLookup();
        const names = readDirectSuperclasses(l, 'Red').map(s => s.name);
        expect(names).toEqual(['Color']);
        expect(names).not.toContain('Base');
    });

    it('regge id mancanti, campo assente e classe inesistente', () => {
        const l = buildLookup();
        expect(readDirectSuperclasses(l, 'Config')).toEqual([]);
        expect(readDirectSuperclasses(l, 'nonesiste')).toEqual([]);
        expect(readDirectSuperclasses(l, null)).toEqual([]);
        expect(readDirectSuperclasses({ X: { extends: ['ghost'] } }, 'X')).toEqual([]);
    });
});

// ─── Etichetta ───────────────────────────────────────────────────────────────

describe('singletonLabelParts', () => {
    it('con superclasse astratta: le due meta\', separate', () => {
        const l = buildLookup();
        const parts = singletonLabelParts('Red', readDirectSuperclasses(l, 'Red'));
        expect(parts).toEqual({ superclassName: 'Color', instanceName: 'Red' });
    });

    it('senza superclasse astratta: il nome e\' l\'etichetta completa', () => {
        const l = buildLookup();
        expect(singletonLabelParts('Config', readDirectSuperclasses(l, 'Config')))
            .toEqual({ superclassName: null, instanceName: 'Config' });
    });

    it('le due meta\' restano separate: il chiamante non deve mai concatenarle', () => {
        // La sottolineatura UML copre il solo nome, quindi una stringa unica
        // sarebbe gia' il difetto — l'istanza si leggerebbe come se si chiamasse
        // cosi'. Il separatore (`::`) vive nel componente, non qui: questo
        // modulo restituisce due meta' e nessuna colla.
        const parts = singletonLabelParts('Red', [{ id: 'Color', name: 'Color', abstract: true }]);
        expect(parts.superclassName).toBe('Color');
        expect(parts.instanceName).toBe('Red');
        for (const v of Object.values(parts)) {
            expect(String(v)).not.toContain(':');
        }
    });
});

// ─── Conteggio degli slot valorizzati ────────────────────────────────────────

describe('countValuedSlots', () => {
    it('conta gli slot che tengono qualcosa', () => {
        const l = buildLookup();
        expect(countValuedSlots(l, 'cfgFull')).toBe(2);
    });

    it('uno slot presente ma vuoto non conta: e\' la differenza fra pill e rettangolo', () => {
        const l = buildLookup();
        expect(countValuedSlots(l, 'cfgEmpty')).toBe(0);
    });

    it('`false` e `0` sono valori, non vuoti', () => {
        const l: Record<string, any> = {
            o: { features: ['a', 'b'] },
            f1: { className: 'DAttribute' }, f2: { className: 'DAttribute' },
            a: { instanceof: 'f1', values: [false] },
            b: { instanceof: 'f2', values: [0] },
        };
        expect(countValuedSlots(l, 'o')).toBe(2);
    });

    it('lo slot IDENTITA\' non conta: tiene il nome, non struttura', () => {
        // Misurato 2026-08-28 sul singleton `Blue`: il record D porta uno slot
        // con values ["Blue"] e nessun `instanceof`, mentre `LObject.features`
        // ne restituisce zero. Contarlo renderebbe rettangolo ogni singleton
        // con un nome, cioe' tutti.
        const l = buildLookup();
        expect(l.red.features).toEqual(['v_identity']);   // il controllo positivo: c'e'
        expect(countValuedSlots(l, 'red')).toBe(0);       // e non viene contato
    });

    it('uno slot che punta a una feature inesistente non conta', () => {
        const l: Record<string, any> = {
            o: { features: ['a'] },
            a: { instanceof: 'ghost', values: ['x'] },
        };
        expect(countValuedSlots(l, 'o')).toBe(0);
    });

    it('regge oggetto senza features, id sconosciuto e lookup vuoto', () => {
        const l = buildLookup();
        expect(countValuedSlots(l, 'green')).toBe(0);
        expect(countValuedSlots(l, 'nonesiste')).toBe(0);
        expect(countValuedSlots(l, null)).toBe(0);
    });
});

// ─── L'insieme, come lo legge una riga reference ─────────────────────────────

describe('readSingletonInstanceInfo', () => {
    it('Red: pill, etichetta Color : Red — e lo slot identita\' non lo rende rettangolo', () => {
        const info = readSingletonInstanceInfo(buildLookup(), 'red', 'Red');
        expect(info.shape).toBe('pill');
        expect(info.isSingleton).toBe(true);
        expect(info.label).toEqual({ superclassName: 'Color', instanceName: 'Red' });
    });

    it('Green: pill, e la superclasse e\' Color anche se Named e\' dichiarata prima', () => {
        const info = readSingletonInstanceInfo(buildLookup(), 'green', 'Green');
        expect(info.shape).toBe('pill');
        expect(info.label.superclassName).toBe('Color');
    });

    it('Config vuoto: pill senza tipo; Config pieno: rettangolo — stesso metaclasse, forma diversa', () => {
        const l = buildLookup();
        const empty = readSingletonInstanceInfo(l, 'cfgEmpty', 'Config');
        const full = readSingletonInstanceInfo(l, 'cfgFull', 'Config');
        expect(empty.shape).toBe('pill');
        expect(empty.label).toEqual({ superclassName: null, instanceName: 'Config' });
        expect(full.shape).toBe('rectangle');
        expect(full.valuedSlotCount).toBe(2);
        // Il flag e' identico nei due: e' il CONTENUTO a decidere.
        expect(empty.isSingleton).toBe(full.isSingleton);
    });

    it('istanza ordinaria: rettangolo — il controllo negativo dell\'intera catena', () => {
        const info = readSingletonInstanceInfo(buildLookup(), 'shape0', 'Shape_0');
        expect(info.shape).toBe('rectangle');
        expect(info.isSingleton).toBe(false);
    });

    it('istanza senza metaclasse (orfana): non e\' singleton, quindi rettangolo', () => {
        const l: Record<string, any> = { orphan: { name: 'X', features: [] } };
        const info = readSingletonInstanceInfo(l, 'orphan', 'X');
        expect(info.shape).toBe('rectangle');
        expect(info.label).toEqual({ superclassName: null, instanceName: 'X' });
    });
});

describe('readIsSingleton', () => {
    it('vero solo sul flag della metaclasse', () => {
        const l = buildLookup();
        expect(readIsSingleton(l, 'Red')).toBe(true);
        expect(readIsSingleton(l, 'Shape')).toBe(false);
        expect(readIsSingleton(l, 'Color')).toBe(false);   // astratta, non singleton
        expect(readIsSingleton(l, 'nonesiste')).toBe(false);
    });
});
