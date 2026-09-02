import { describe, it, expect } from 'vitest';
import {
    childrenIn,
    multiInstanceOf,
    multiInstancesOf,
    navStepOf,
    pathTo,
    sameMetaclass,
} from '../multiDraw';
import type { AttrShape, ClassShape, RefShape } from '../../../../jjform';

/**
 * Il contratto di `multiDraw` (slice 12b/12c) — la meta' pura dell'adapter.
 *
 * Testabile perche' non importa il barrel del joiner: e' la ragione di R-FORM-5, e
 * `createDraw.test.ts` / `deleteDraw.test.ts` sono lo stesso caso.
 *
 * L'`idlookup` finto qui sotto ha la forma vera, che e' l'unica cosa che rende le
 * prove valide: un `DObject` porta `features`, ogni feature e' un `DValue` il cui
 * `instanceof` punta alla `DAttribute`/`DReference` — **il nome della feature sta
 * li', non sul DValue** — e il `father` di un oggetto contenuto e' lo SLOT del
 * proprietario, non il proprietario.
 */

type Any = Record<string, any>;

/** Un idlookup con: Sensor s1 (contiene p2 in `ports`, che contiene f1 in `filters`),
 *  s2 e s3 come fratelli di s1 sotto il modello. */
function fixture(): Any {
    const lk: Any = {};
    lk['m'] = { id: 'm', className: 'DModel', name: 'plant' };
    lk['c_Sensor'] = { id: 'c_Sensor', className: 'DClass', name: 'Sensor' };
    lk['c_Port'] = { id: 'c_Port', className: 'DClass', name: 'Port' };
    lk['c_Filter'] = { id: 'c_Filter', className: 'DClass', name: 'Filter' };
    // le feature (M2)
    lk['a_name'] = { id: 'a_name', className: 'DAttribute', name: 'name' };
    lk['a_tint'] = { id: 'a_tint', className: 'DAttribute', name: 'tint' };
    lk['a_active'] = { id: 'a_active', className: 'DAttribute', name: 'active' };
    lk['r_cfg'] = { id: 'r_cfg', className: 'DReference', name: 'cfg' };
    lk['r_ports'] = { id: 'r_ports', className: 'DReference', name: 'ports', composition: true };
    lk['r_filters'] = { id: 'r_filters', className: 'DReference', name: 'filters', composition: true };

    /** Crea un DObject con i suoi slot. `father` e' il modello o lo slot del padre. */
    const obj = (id: string, cls: string, father: string, name: string, slots: Array<[string, string, unknown[]]>) => {
        const featureIds: string[] = [];
        for (const [slotId, featureId, values] of slots) {
            lk[slotId] = { id: slotId, className: 'DValue', instanceof: featureId, father: id, values, name: 'NOT_THE_FEATURE_NAME' };
            featureIds.push(slotId);
        }
        lk[id] = { id, className: 'DObject', instanceof: cls, father, name, features: featureIds };
    };

    obj('s1', 'c_Sensor', 'm', 's1', [
        ['s1_name', 'a_name', ['s1']],
        ['s1_tint', 'a_tint', ['Green']],
        ['s1_active', 'a_active', [true]],
        ['s1_cfg', 'r_cfg', ['cfg1']],
        ['s1_ports', 'r_ports', ['p2']],
    ]);
    obj('s2', 'c_Sensor', 'm', 's2', [
        ['s2_name', 'a_name', ['s2']],
        ['s2_tint', 'a_tint', ['Red']],
        ['s2_active', 'a_active', [true]],
        ['s2_cfg', 'r_cfg', ['cfg1']],
        ['s2_ports', 'r_ports', []],
    ]);
    // s3: `tint` con un BUCO in posizione 0 e un valore in 1 — cio' che lascia
    // `clearSlotValue`. E un `cfg` diverso.
    obj('s3', 'c_Sensor', 'm', 's3', [
        ['s3_name', 'a_name', ['s3']],
        ['s3_tint', 'a_tint', [null, 'Blue']],
        ['s3_active', 'a_active', [false]],
        ['s3_cfg', 'r_cfg', ['cfg2']],
        ['s3_ports', 'r_ports', []],
    ]);
    // p2 contenuto in s1 attraverso lo slot `s1_ports`
    obj('p2', 'c_Port', 's1_ports', 'p2', [
        ['p2_name', 'a_name', ['p2']],
        ['p2_filters', 'r_filters', ['f1', '', 'ghost']],
    ]);
    // f1 contenuto in p2 attraverso `p2_filters`
    obj('f1', 'c_Filter', 'p2_filters', 'f1', [['f1_name', 'a_name', ['f1']]]);
    return lk;
}

const attr = (key: string, over: Partial<AttrShape> = {}): AttrShape => ({
    key, id: 'a_' + key, lower: 0, upper: 1, many: false, required: false,
    derived: false, readOnly: false, type: 'string', typeName: 'EString', ...over,
});
const ref = (key: string, over: Partial<RefShape> = {}): RefShape => ({
    key, id: 'r_' + key, lower: 0, upper: 1, many: false, required: false,
    derived: false, readOnly: false, of: 'Config', ofId: 'c_Config', composition: false, ...over,
});

const SENSOR: ClassShape = {
    key: 'Sensor', id: 'c_Sensor', root: true, abstract: false, singleton: false, containedIn: [],
    attrs: [attr('name'), attr('tint'), attr('active', { type: 'boolean', typeName: 'EBoolean' })],
    refs: [ref('cfg')],
    children: [ref('ports', { of: 'Port', ofId: 'c_Port', composition: true, upper: -1, many: true })],
};

describe('multiInstanceOf — cosa tiene una istanza', () => {
    it('legge attributi e reference nelle due mappe del contratto', () => {
        const mi = multiInstanceOf(fixture(), SENSOR, 's1');
        expect(mi).toEqual({
            id: 's1',
            values: { name: 's1', tint: 'Green', active: true },
            refs: { cfg: 'cfg1' },
        });
    });

    it('un buco non e\' un valore: legge il primo valore VERO', () => {
        // s3.tint e' [null, 'Blue'] — cio' che lascia `clearSlotValue`. Leggere
        // `values[0]` alla lettera darebbe null e farebbe sembrare s3 «vuoto».
        expect(multiInstanceOf(fixture(), SENSOR, 's3').values.tint).toBe('Blue');
    });

    it('uno slot vuoto legge null, non undefined', () => {
        const lk = fixture();
        lk['s2_tint'].values = [];
        expect(multiInstanceOf(lk, SENSOR, 's2').values.tint).toBeNull();
    });

    it('gli slot di containment NON entrano: il motore li esclude comunque', () => {
        const mi = multiInstanceOf(fixture(), SENSOR, 's1');
        expect('ports' in mi.values).toBe(false);
        expect('ports' in mi.refs).toBe(false);
    });
});

describe('multiInstancesOf — la selezione', () => {
    it('tiene l\'ordine che il chiamante ha dato', () => {
        expect(multiInstancesOf(fixture(), SENSOR, ['s3', 's1', 's2']).map(i => i.id))
            .toEqual(['s3', 's1', 's2']);
    });

    it('un id che non risolve viene lasciato cadere, non reso vuoto', () => {
        // Una selezione stantia (la riga cancellata sotto la form) non deve far
        // risultare misto ogni campo contro un fantasma.
        const got = multiInstancesOf(fixture(), SENSOR, ['s1', 'ghost', 's2']);
        expect(got.map(i => i.id)).toEqual(['s1', 's2']);
    });

    it('un id che non e\' un DObject viene lasciato cadere', () => {
        expect(multiInstancesOf(fixture(), SENSOR, ['s1', 'c_Sensor']).map(i => i.id)).toEqual(['s1']);
    });
});

describe('sameMetaclass — la precondizione della selezione', () => {
    it('restituisce la metaclasse quando concordano', () => {
        expect(sameMetaclass(fixture(), ['s1', 's2', 's3'])).toBe('c_Sensor');
    });
    it('null quando non concordano', () => {
        expect(sameMetaclass(fixture(), ['s1', 'p2'])).toBeNull();
    });
    it('null quando un id non risolve', () => {
        expect(sameMetaclass(fixture(), ['s1', 'ghost'])).toBeNull();
    });
    it('una selezione vuota non ha metaclasse', () => {
        expect(sameMetaclass(fixture(), [])).toBeNull();
    });
});

describe('childrenIn — i figli contenuti di uno slot', () => {
    it('elenca i figli, saltando buchi e puntatori che non risolvono', () => {
        // p2_filters e' ['f1', '', 'ghost']: il buco non e' un figlio e il
        // fantasma nemmeno.
        expect(childrenIn(fixture(), 'p2', 'filters')).toEqual(['f1']);
    });
    it('uno slot vuoto non ha figli', () => {
        expect(childrenIn(fixture(), 's2', 'ports')).toEqual([]);
    });
    it('uno slot che non esiste non ha figli', () => {
        expect(childrenIn(fixture(), 's1', 'nonesuch')).toEqual([]);
    });
});

describe('navStepOf / pathTo — la strada del containment', () => {
    it('un passo porta nome, metaclasse e lo slot da cui e\' passato', () => {
        expect(navStepOf(fixture(), 'p2', 'ports')).toEqual({
            id: 'p2', name: 'p2', cls: 'Port', childKey: 'ports',
        });
    });

    it('un id che non risolve non e\' un passo', () => {
        expect(navStepOf(fixture(), 'ghost')).toBeNull();
    });

    it('la strada va dalla radice al soggetto', () => {
        expect(pathTo(fixture(), 'f1').map(s => s.id)).toEqual(['s1', 'p2', 'f1']);
    });

    it('ogni passo ricorda LO SLOT, letto da `instanceof` e non dal DValue', () => {
        // Il DValue del fixture porta di proposito `name: 'NOT_THE_FEATURE_NAME'`:
        // se questa prova passasse leggendo `slot.name`, leggerebbe quello.
        expect(pathTo(fixture(), 'f1').map(s => s.childKey)).toEqual([null, 'ports', 'filters']);
    });

    it('la radice del modello e\' una strada di un passo solo', () => {
        expect(pathTo(fixture(), 's1').map(s => s.id)).toEqual(['s1']);
    });

    it('un id che non risolve non ha strada', () => {
        expect(pathTo(fixture(), 'ghost')).toEqual([]);
    });

    it('una catena corrotta si ferma invece di ciclare', () => {
        // Il core rifiuta di scrivere un ciclo di containment; un idlookup gia'
        // corrotto non deve far girare la camminata a vuoto.
        const lk = fixture();
        lk['s1'].father = 'p2_filters';     // s1 dentro p2, che e' dentro s1
        const road = pathTo(lk, 'f1');
        expect(road.length).toBeLessThanOrEqual(4);
        expect(new Set(road.map(s => s.id)).size).toBe(road.length);  // nessun doppione
    });
});
