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

/**
 * 10g — un nodo per istanza.
 *
 * Il fixture qui sotto e' quello MISURATO sull'app vera (referto 10g): tre
 * oggetti elencati in uno slot di contenimento il cui `father` e' rimasto il
 * modello, che e' cio' che una scrittura grezza su `values` lascia dietro (la
 * via `LValue.setValueAtPosition` scriverebbe `father`, la `SetFieldAction`
 * diretta no). Prima di questa slice rendevano DUE volte: radice e figlio.
 */
function fixtureDoppi(): Any {
    const lk: Any = {};
    lk['m'] = { id: 'm', className: 'DModel', name: 'sm' };
    lk['c_Machine'] = { id: 'c_Machine', className: 'DClass', name: 'Machine' };
    lk['c_State'] = { id: 'c_State', className: 'DClass', name: 'State' };
    lk['a_name'] = { id: 'a_name', className: 'DAttribute', name: 'name' };
    lk['r_states'] = { id: 'r_states', className: 'DReference', name: 'states', composition: true };
    lk['r_next'] = { id: 'r_next', className: 'DReference', name: 'next', composition: false };

    const obj = (id: string, cls: string, father: string, slots: Array<[string, string, unknown[]]>) => {
        const featureIds: string[] = [];
        for (const [slotId, featureId, values] of slots) {
            lk[slotId] = { id: slotId, className: 'DValue', instanceof: featureId, father: id, values };
            featureIds.push(slotId);
        }
        lk[id] = { id, className: 'DObject', instanceof: cls, father, name: id, features: featureIds };
    };

    // Heater elenca Idle, Running e Warmup fra i suoi `states`, ma solo Warmup
    // ha il `father` spostato: Idle e Running hanno ancora il modello per padre.
    obj('Heater', 'c_Machine', 'm', [
        ['H_name', 'a_name', ['Heater']],
        ['H_states', 'r_states', ['Idle', 'Running', 'Warmup']],
    ]);
    obj('Idle', 'c_State', 'm', [['I_name', 'a_name', ['Idle']], ['I_next', 'r_next', ['Running']]]);
    obj('Running', 'c_State', 'm', [['R_name', 'a_name', ['Running']], ['R_next', 'r_next', []]]);
    obj('Warmup', 'c_State', 'H_states', [['W_name', 'a_name', ['Warmup']], ['W_next', 'r_next', []]]);
    return lk;
}

const SHAPE_SM: MetamodelShape = {
    enums: {},
    classes: {
        Machine: cls({ key: 'Machine', root: true, children: [ref({ key: 'states', of: 'State' })] }),
        State: cls({
            key: 'State', containedIn: ['Machine'],
            refs: [ref({ key: 'next', of: 'State', composition: false })],
        }),
    },
};

describe('outlineTree — 10g: un nodo per istanza', () => {
    it('N istanze -> N+1 nodi: il modello piu una riga per istanza, mai due', () => {
        const t = outlineTree(fixtureDoppi(), 'm', SHAPE_SM);
        const rows = outlineRows(t, () => true);
        expect(rows.length).toBe(5);          // m + Heater + Idle + Running + Warmup
        expect(new Set(rows.map(n => n.id)).size).toBe(rows.length);
    });

    it('l istanza il cui father e ancora il modello rende UNA volta, alla radice', () => {
        const t = outlineTree(fixtureDoppi(), 'm', SHAPE_SM);
        expect(t.children.map(n => n.id)).toEqual(['Heater', 'Idle', 'Running']);
        const heater = t.children.find(n => n.id === 'Heater')!;
        expect(heater.children.map(n => n.id)).toEqual(['Warmup']);
    });

    it('lo slot che la elenca non la disegna: il father dice chi e l owner', () => {
        const t = outlineTree(fixtureDoppi(), 'm', SHAPE_SM);
        const heater = t.children.find(n => n.id === 'Heater')!;
        expect(heater.children.map(n => n.id)).not.toContain('Idle');
        expect(heater.children.map(n => n.id)).not.toContain('Running');
    });

    it('PER CONTRASTO: l istanza col father spostato NON e piu una radice', () => {
        const t = outlineTree(fixtureDoppi(), 'm', SHAPE_SM);
        expect(t.children.map(n => n.id)).not.toContain('Warmup');
    });

    it('una ref NON containment non porta un secondo nodo: Running e uno solo', () => {
        const rows = outlineRows(outlineTree(fixtureDoppi(), 'm', SHAPE_SM), () => true);
        expect(rows.filter(n => n.id === 'Running').length).toBe(1);
    });

    it('puntata da due slot di cui uno solo containment: un nodo, sotto quel padre', () => {
        // Warmup e' contenuta da Heater.states e citata da Idle.next.
        const lk = fixtureDoppi();
        lk['I_next'].values = ['Warmup'];
        const t = outlineTree(lk, 'm', SHAPE_SM);
        const rows = outlineRows(t, () => true);
        expect(rows.filter(n => n.id === 'Warmup').length).toBe(1);
        expect(t.children.find(n => n.id === 'Heater')!.children.map(n => n.id)).toEqual(['Warmup']);
    });

    it('lo stesso oggetto in DUE slot di contenimento rende sotto il father, una volta', () => {
        const lk = fixtureDoppi();
        lk['c_Room'] = { id: 'c_Room', className: 'DClass', name: 'Room' };
        lk['Cooler'] = {
            id: 'Cooler', className: 'DObject', instanceof: 'c_Machine', father: 'm', name: 'Cooler',
            features: ['C_name', 'C_states'],
        };
        lk['C_name'] = { id: 'C_name', className: 'DValue', instanceof: 'a_name', father: 'Cooler', values: ['Cooler'] };
        // Cooler elenca Warmup, che pero' ha per father lo slot di Heater.
        lk['C_states'] = { id: 'C_states', className: 'DValue', instanceof: 'r_states', father: 'Cooler', values: ['Warmup'] };
        const t = outlineTree(lk, 'm', SHAPE_SM);
        const rows = outlineRows(t, () => true);
        expect(rows.filter(n => n.id === 'Warmup').length).toBe(1);
        expect(t.children.find(n => n.id === 'Cooler')!.children).toEqual([]);
        expect(t.children.find(n => n.id === 'Heater')!.children.map(n => n.id)).toEqual(['Warmup']);
    });

    it('l orfano — father su un owner che non lo disegna — non sparisce: torna radice', () => {
        const lk = fixtureDoppi();
        lk['H_states'].values = ['Idle', 'Running'];   // Warmup ha ancora H_states per father
        const t = outlineTree(lk, 'm', SHAPE_SM);
        const rows = outlineRows(t, () => true);
        expect(rows.filter(n => n.id === 'Warmup').length).toBe(1);
        expect(t.children.map(n => n.id)).toContain('Warmup');
        expect(rows.length).toBe(5);
    });

    it('il puntatore morto resta un nodo broken: il filtro e sull owner, non sulla vivezza', () => {
        const lk = fixtureDoppi();
        lk['H_states'].values = ['Warmup', 'ghost'];
        const t = outlineTree(lk, 'm', SHAPE_SM);
        const heater = t.children.find(n => n.id === 'Heater')!;
        expect(heater.children.map(n => `${n.id}:${n.kind}`)).toEqual(['Warmup:object', 'ghost:broken']);
    });

    it('un ciclo di contenimento si ferma, e non raddoppia un nodo', () => {
        const lk = fixtureDoppi();
        // Warmup contiene Heater, che contiene Warmup: father incrociati.
        lk['W_states'] = { id: 'W_states', className: 'DValue', instanceof: 'r_states', father: 'Warmup', values: ['Heater'] };
        lk['Warmup'].features = [...lk['Warmup'].features, 'W_states'];
        lk['Warmup'].instanceof = 'c_Machine';
        lk['Heater'].father = 'W_states';
        const rows = outlineRows(outlineTree(lk, 'm', SHAPE_SM), () => true);
        expect(new Set(rows.map(n => n.id)).size).toBe(rows.length);
    });

    it('senza shape la sweep NON scatta: il rendering di 10b resta quello', () => {
        const t = outlineTree(fixtureDoppi(), 'm', null);
        expect(t.children.map(n => n.id)).toEqual(['Heater', 'Idle', 'Running']);
    });
});

describe('outlineTree — 10g: i due casi che il solo filtro sull owner non chiude', () => {
    it('due slot di contenimento dello STESSO owner che elencano lo stesso figlio: un nodo', () => {
        const lk = fixtureDoppi();
        lk['r_spare'] = { id: 'r_spare', className: 'DReference', name: 'spare', composition: true };
        lk['H_spare'] = { id: 'H_spare', className: 'DValue', instanceof: 'r_spare', father: 'Heater', values: ['Warmup'] };
        lk['Heater'].features = [...lk['Heater'].features, 'H_spare'];
        // `father` di Warmup resta H_states: l owner e Heater da entrambi i lati,
        // e il filtro sull owner lascia passare tutti e due gli slot.
        const shape: MetamodelShape = {
            enums: {},
            classes: {
                ...SHAPE_SM.classes,
                Machine: cls({
                    key: 'Machine', root: true,
                    children: [ref({ key: 'states', of: 'State' }), ref({ key: 'spare', of: 'State' })],
                }),
            },
        };
        const rows = outlineRows(outlineTree(lk, 'm', shape), () => true);
        expect(rows.filter(n => n.id === 'Warmup').length).toBe(1);
        expect(new Set(rows.map(n => n.id)).size).toBe(rows.length);
    });

    it('un orfano gia disegnato dalla sweep non torna sotto un orfano disegnato dopo', () => {
        const lk: Any = {};
        lk['m'] = { id: 'm', className: 'DModel', name: 'sm' };
        lk['c_Machine'] = { id: 'c_Machine', className: 'DClass', name: 'Machine' };
        lk['a_name'] = { id: 'a_name', className: 'DAttribute', name: 'name' };
        lk['r_states'] = { id: 'r_states', className: 'DReference', name: 'states', composition: true };
        lk['Heater'] = {
            id: 'Heater', className: 'DObject', instanceof: 'c_Machine', father: 'm', name: 'Heater',
            features: ['H_states'],
        };
        // H_states NON elenca Off: Off e' un orfano — father posato, slot che non lo disegna.
        lk['H_states'] = { id: 'H_states', className: 'DValue', instanceof: 'r_states', father: 'Heater', values: [] };
        // Sub compare PRIMA di Off nell ordine d inserimento: la sweep lo incontra per primo.
        lk['Sub'] = {
            id: 'Sub', className: 'DObject', instanceof: 'c_Machine', father: 'O_states', name: 'Sub', features: [],
        };
        lk['Off'] = {
            id: 'Off', className: 'DObject', instanceof: 'c_Machine', father: 'H_states', name: 'Off',
            features: ['O_states'],
        };
        lk['O_states'] = { id: 'O_states', className: 'DValue', instanceof: 'r_states', father: 'Off', values: ['Sub'] };
        const shape: MetamodelShape = {
            enums: {},
            classes: { Machine: cls({ key: 'Machine', root: true, children: [ref({ key: 'states', of: 'Machine' })] }) },
        };
        const rows = outlineRows(outlineTree(lk, 'm', shape), () => true);
        expect(rows.filter(n => n.id === 'Sub').length).toBe(1);
        expect(rows.length).toBe(4);   // m + Heater + Sub + Off
    });
});
