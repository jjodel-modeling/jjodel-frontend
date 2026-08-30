/**
 * Tests of `outlineDraw` — la meta' pura dell'adapter dell'outline (slice 10b).
 *
 * Testabile perche' non importa il barrel del joiner: e' la ragione di R-FORM-5, e
 * `multiDraw.test.ts` / `createDraw.test.ts` sono lo stesso caso.
 *
 * L'`idlookup` finto qui sotto ha la forma vera, che e' l'unica cosa che rende le
 * prove valide: un `DObject` porta `features`, ogni feature e' un `DValue` il cui
 * `instanceof` punta alla `DReference` — **il nome della feature sta li'** — e il
 * `father` di un oggetto contenuto e' lo SLOT del proprietario, non il proprietario.
 *
 * Il fixture e' quello di `multiDraw.test.ts` esteso di cio' che 10b deve vedere:
 * i QUATTRO livelli (m -> s1 -> p2 -> f1), un puntatore morto (`ghost`), un buco
 * (`''`), un secondo slot di contenimento dichiarato DOPO `ports` ma alfabeticamente
 * PRIMA, e due figli nello stesso slot in ordine d'array non alfabetico.
 */

import { describe, expect, it } from 'vitest';
import { outlineRoots, outlineRows, outlineTree } from '../outlineDraw';
import { outlineOpenByDefault } from '../../../../jjform';
import type { ClassShape, MetamodelShape, OutlineNode, RefShape } from '../../../../jjform';

type Any = Record<string, any>;

function fixture(): Any {
    const lk: Any = {};
    lk['m'] = { id: 'm', className: 'DModel', name: 'plant' };
    lk['c_Sensor'] = { id: 'c_Sensor', className: 'DClass', name: 'Sensor' };
    lk['c_Port'] = { id: 'c_Port', className: 'DClass', name: 'Port' };
    lk['c_Filter'] = { id: 'c_Filter', className: 'DClass', name: 'Filter' };
    lk['c_Alarm'] = { id: 'c_Alarm', className: 'DClass', name: 'Alarm' };
    lk['a_name'] = { id: 'a_name', className: 'DAttribute', name: 'name' };
    lk['r_ports'] = { id: 'r_ports', className: 'DReference', name: 'ports', composition: true };
    lk['r_alarms'] = { id: 'r_alarms', className: 'DReference', name: 'alarms', composition: true };
    lk['r_filters'] = { id: 'r_filters', className: 'DReference', name: 'filters', composition: true };

    const obj = (id: string, cls: string, father: string, name: string, slots: Array<[string, string, unknown[]]>) => {
        const featureIds: string[] = [];
        for (const [slotId, featureId, values] of slots) {
            lk[slotId] = { id: slotId, className: 'DValue', instanceof: featureId, father: id, values, name: 'NOT_THE_FEATURE_NAME' };
            featureIds.push(slotId);
        }
        lk[id] = { id, className: 'DObject', instanceof: cls, father, name, features: featureIds };
    };

    // s1: radice del modello, due slot di contenimento, `ports` con DUE figli in
    // ordine d'array p2, p1 — non alfabetico e non per id.
    obj('s1', 'c_Sensor', 'm', 's1', [
        ['s1_name', 'a_name', ['s1']],
        ['s1_ports', 'r_ports', ['p2', 'p1']],
        ['s1_alarms', 'r_alarms', ['al1']],
    ]);
    obj('s2', 'c_Sensor', 'm', 's2', [
        ['s2_name', 'a_name', ['s2']],
        ['s2_ports', 'r_ports', []],
        ['s2_alarms', 'r_alarms', []],
    ]);
    // p2: terzo livello, e il suo slot porta un buco e un puntatore morto.
    obj('p2', 'c_Port', 's1_ports', 'p2', [
        ['p2_name', 'a_name', ['p2']],
        ['p2_filters', 'r_filters', ['f1', '', 'ghost']],
    ]);
    obj('p1', 'c_Port', 's1_ports', 'p1', [
        ['p1_name', 'a_name', ['p1']],
        ['p1_filters', 'r_filters', []],
    ]);
    obj('al1', 'c_Alarm', 's1_alarms', 'al1', [['al1_name', 'a_name', ['al1']]]);
    // f1: quarto livello.
    obj('f1', 'c_Filter', 'p2_filters', 'f1', [['f1_name', 'a_name', ['f1']]]);
    return lk;
}

const ref = (o: Partial<RefShape> & { key: string; of: string }): RefShape => ({
    id: 'r_' + o.key, lower: 0, upper: -1, many: true, required: false,
    derived: false, readOnly: false, ofId: 'c_' + o.of, composition: true, ...o,
});
const cls = (o: Partial<ClassShape> & { key: string }): ClassShape => ({
    id: 'c_' + o.key, root: false, abstract: false, singleton: false,
    containedIn: [], attrs: [], refs: [], children: [], ...o,
});

const SHAPE: MetamodelShape = {
    enums: {},
    classes: {
        // `ports` dichiarato PRIMA di `alarms`, che lo precede in alfabeto.
        Sensor: cls({ key: 'Sensor', root: true, children: [ref({ key: 'ports', of: 'Port' }), ref({ key: 'alarms', of: 'Alarm' })] }),
        Port: cls({ key: 'Port', containedIn: ['Sensor'], children: [ref({ key: 'filters', of: 'Filter' })] }),
        Filter: cls({ key: 'Filter', containedIn: ['Port'] }),
        Alarm: cls({ key: 'Alarm', containedIn: ['Sensor'] }),
    },
};

/** L'albero appiattito tutto aperto, come `id@depth`. */
const flat = (root: OutlineNode) => outlineRows(root, () => true).map(n => `${n.id}@${n.depth}`);

describe('outlineRoots — le istanze che il modello possiede direttamente', () => {
    it('le radici, non i contenuti', () => {
        expect(outlineRoots(fixture(), 'm').sort()).toEqual(['s1', 's2']);
    });
    it('un altro modello non ha radici in questo lookup', () => {
        expect(outlineRoots(fixture(), 'altro')).toEqual([]);
    });
    it('lookup o modello assenti — lista vuota, non un errore', () => {
        expect(outlineRoots(null as any, 'm')).toEqual([]);
        expect(outlineRoots(fixture(), '')).toEqual([]);
    });
});

describe('outlineTree — i quattro livelli', () => {
    it('il nodo modello e la radice dell albero, non una lista di radici', () => {
        const t = outlineTree(fixture(), 'm', SHAPE);
        expect(t.kind).toBe('model');
        expect(t.id).toBe('m');
        expect(t.name).toBe('plant');
        expect(t.depth).toBe(0);
        expect(t.childKey).toBeNull();
    });

    it('la catena m -> s1 -> p2 -> f1 e visibile, con la profondita giusta', () => {
        const rows = flat(outlineTree(fixture(), 'm', SHAPE));
        expect(rows).toContain('m@0');
        expect(rows).toContain('s1@1');
        expect(rows).toContain('p2@2');
        expect(rows).toContain('f1@3');
        // e in quest'ordine, il figlio dopo il padre
        expect(rows.indexOf('f1@3')).toBeGreaterThan(rows.indexOf('p2@2'));
        expect(rows.indexOf('p2@2')).toBeGreaterThan(rows.indexOf('s1@1'));
    });

    it('ogni nodo sa da quale slot e tenuto; la radice da nessuno', () => {
        const t = outlineTree(fixture(), 'm', SHAPE);
        const byId = new Map(outlineRows(t, () => true).map(n => [n.id, n]));
        expect(byId.get('s1')!.childKey).toBeNull();
        expect(byId.get('p2')!.childKey).toBe('ports');
        expect(byId.get('al1')!.childKey).toBe('alarms');
        expect(byId.get('f1')!.childKey).toBe('filters');
    });

    it('nome e metaclasse vengono dalla regola di makeDrawReadCtx', () => {
        const t = outlineTree(fixture(), 'm', SHAPE);
        const p2 = outlineRows(t, () => true).find(n => n.id === 'p2')!;
        expect(p2.name).toBe('p2');
        expect(p2.cls).toBe('Port');
        expect(p2.kind).toBe('object');
    });
});

describe('outlineTree — il puntatore morto e il buco', () => {
    it('il puntatore morto e un nodo broken, non un nodo che sparisce', () => {
        const t = outlineTree(fixture(), 'm', SHAPE);
        const rows = outlineRows(t, () => true);
        const ghost = rows.find(n => n.id === 'ghost');
        expect(ghost).toBeDefined();
        expect(ghost!.kind).toBe('broken');
        expect(ghost!.cls).toBe('');
        expect(ghost!.childKey).toBe('filters');
        expect(ghost!.children).toEqual([]);
    });

    it('il buco invece non e un valore: nessun nodo per la stringa vuota', () => {
        const rows = outlineRows(outlineTree(fixture(), 'm', SHAPE), () => true);
        expect(rows.filter(n => n.id === '')).toEqual([]);
        // p2 tiene tre posizioni, due valori: f1 e il ghost.
        const p2 = rows.find(n => n.id === 'p2')!;
        expect(p2.children.map(c => c.id)).toEqual(['f1', 'ghost']);
    });
});

describe('outlineTree — l ordine e dichiarato, e non e alfabetico', () => {
    it('gli slot nell ordine della shape: ports prima di alarms', () => {
        const t = outlineTree(fixture(), 'm', SHAPE);
        const s1 = t.children.find(n => n.id === 's1')!;
        expect(s1.children.map(c => c.childKey)).toEqual(['ports', 'ports', 'alarms']);
    });

    it('dentro uno slot, l ordine dell array: p2 prima di p1', () => {
        const t = outlineTree(fixture(), 'm', SHAPE);
        const s1 = t.children.find(n => n.id === 's1')!;
        expect(s1.children.map(c => c.id)).toEqual(['p2', 'p1', 'al1']);
    });
});

describe('outlineTree — cio che manca non cancella un ramo', () => {
    it('senza shape ogni oggetto e una foglia, ma le radici restano', () => {
        const t = outlineTree(fixture(), 'm', null);
        expect(t.children.map(n => n.id).sort()).toEqual(['s1', 's2']);
        expect(t.children.every(n => n.children.length === 0)).toBe(true);
    });

    it('una metaclasse assente dalla shape rende un nodo senza figli, non un buco', () => {
        const partial: MetamodelShape = { enums: {}, classes: { Sensor: SHAPE.classes.Sensor } };
        const t = outlineTree(fixture(), 'm', partial);
        const s1 = t.children.find(n => n.id === 's1')!;
        expect(s1.children.map(c => c.id)).toEqual(['p2', 'p1', 'al1']);
        expect(s1.children.find(c => c.id === 'p2')!.children).toEqual([]);
    });

    it('un modello che non esiste rende il solo nodo modello', () => {
        const t = outlineTree(fixture(), 'altro', SHAPE);
        expect(t.id).toBe('altro');
        expect(t.children).toEqual([]);
    });
});

describe('outlineRows — cosa una lista disegna', () => {
    it('un nodo chiuso non porta i suoi discendenti', () => {
        const t = outlineTree(fixture(), 'm', SHAPE);
        const ids = outlineRows(t, n => n.id !== 's1').map(n => n.id);
        expect(ids).toContain('s1');
        expect(ids).not.toContain('p2');
        expect(ids).not.toContain('f1');
    });

    it('l apertura di default mostra modello e radici, non il terzo livello', () => {
        const t = outlineTree(fixture(), 'm', SHAPE);
        const ids = outlineRows(t, n => outlineOpenByDefault(n.depth)).map(n => n.id);
        expect(ids).toContain('m');
        expect(ids).toContain('s1');
        expect(ids).toContain('p2');      // figlio di una radice aperta
        expect(ids).not.toContain('f1');  // p2 e' a depth 2: chiuso
    });

    it('nessun albero — nessuna riga', () => {
        expect(outlineRows(null, () => true)).toEqual([]);
    });
});
