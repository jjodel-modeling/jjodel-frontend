/**
 * Test di `neighborhoodDraw` — la meta' pura dell'adapter del vicinato (13a).
 *
 * Testabile perche' non importa il barrel del joiner: e' la ragione di R-FORM-5,
 * e `outlineDraw.test.ts` / `multiDraw.test.ts` sono lo stesso caso.
 *
 * L'`idlookup` finto ha la forma vera, che e' l'unica cosa che rende le prove
 * valide: un `DObject` porta `features`, ogni feature e' un `DValue` il cui
 * `instanceof` punta alla `DReference` — il nome della feature sta li' — il
 * `father` di un oggetto contenuto e' lo SLOT del proprietario, e `pointedBy`
 * porta i percorsi `idlookup.<slot>.values.<n>` che la risalita di 2b legge.
 *
 * Il fixture e' quello di `outlineDraw.test.ts` (quattro livelli m -> s1 -> p2 ->
 * f1, un puntatore morto, un buco) esteso di cio' che 13a deve vedere: DUE
 * `Config` con referrer DISTINTI, un riferimento reciproco, uno slot che punta
 * due volte allo stesso bersaglio, un required vuoto, e i vertici del canvas.
 */

import { describe, expect, it } from 'vitest';
import { egoInputOf, neighborhoodOf, ownerLinkOf, salientValue, vertexOfObject } from '../neighborhoodDraw';
import { egoNeighborhood } from '../../../../jjform';
import type { AttrShape, ClassShape, MetamodelShape, Neighborhood, RefShape } from '../../../../jjform';

type Any = Record<string, any>;

function fixture(): Any {
    const lk: Any = {};
    lk['m'] = { id: 'm', className: 'DModel', name: 'plant' };
    for (const name of ['Sensor', 'Port', 'Filter', 'Alarm', 'Config']) {
        lk['c_' + name] = { id: 'c_' + name, className: 'DClass', name };
    }
    lk['a_name'] = { id: 'a_name', className: 'DAttribute', name: 'name' };
    lk['a_kind'] = { id: 'a_kind', className: 'DAttribute', name: 'kind' };
    lk['a_serial'] = { id: 'a_serial', className: 'DAttribute', name: 'serial' };
    lk['r_ports'] = { id: 'r_ports', className: 'DReference', name: 'ports', composition: true };
    lk['r_alarms'] = { id: 'r_alarms', className: 'DReference', name: 'alarms', composition: true };
    lk['r_filters'] = { id: 'r_filters', className: 'DReference', name: 'filters', composition: true };
    lk['r_cfg'] = { id: 'r_cfg', className: 'DReference', name: 'cfg', composition: false };
    lk['r_peer'] = { id: 'r_peer', className: 'DReference', name: 'peer', composition: false };

    const obj = (id: string, cls: string, father: string, name: string, slots: Array<[string, string, unknown[]]>) => {
        const featureIds: string[] = [];
        for (const [slotId, featureId, values] of slots) {
            lk[slotId] = { id: slotId, className: 'DValue', instanceof: featureId, father: id, values, name: 'NOT_THE_FEATURE_NAME' };
            featureIds.push(slotId);
        }
        lk[id] = { id, className: 'DObject', instanceof: cls, father, name, features: featureIds, pointedBy: [] };
    };

    obj('s1', 'c_Sensor', 'm', 's1', [
        ['s1_name', 'a_name', ['s1']],
        ['s1_kind', 'a_kind', ['fast']],
        ['s1_ports', 'r_ports', ['p2', 'p1']],
        ['s1_alarms', 'r_alarms', ['al1']],
        ['s1_cfg', 'r_cfg', ['cfg1']],
        ['s1_peer', 'r_peer', ['s2']],
    ]);
    obj('s2', 'c_Sensor', 'm', 's2', [
        ['s2_name', 'a_name', ['s2']],
        ['s2_kind', 'a_kind', []],
        ['s2_ports', 'r_ports', []],
        ['s2_cfg', 'r_cfg', ['cfg2']],
        // Lo stesso bersaglio due volte nello stesso slot: due puntatori, un arco.
        ['s2_peer', 'r_peer', ['s1', 's1']],
    ]);
    obj('s3', 'c_Sensor', 'm', 's3', [
        ['s3_name', 'a_name', ['s3']],
        ['s3_kind', 'a_kind', []],
        // Un riferimento NON di contenimento che non risolve: nodo broken.
        ['s3_cfg', 'r_cfg', ['ghost']],
    ]);
    obj('p2', 'c_Port', 's1_ports', 'p2', [
        ['p2_name', 'a_name', ['p2']],
        ['p2_filters', 'r_filters', ['f1', '', 'ghost']],
    ]);
    obj('p1', 'c_Port', 's1_ports', 'p1', [['p1_name', 'a_name', ['p1']]]);
    obj('al1', 'c_Alarm', 's1_alarms', 'al1', [['al1_name', 'a_name', ['al1']]]);
    obj('f1', 'c_Filter', 'p2_filters', 'f1', [['f1_name', 'a_name', ['f1']]]);
    obj('cfg1', 'c_Config', 'm', 'cfg1', [
        ['cfg1_name', 'a_name', ['cfg1']],
        ['cfg1_serial', 'a_serial', []],
    ]);
    obj('cfg2', 'c_Config', 'm', 'cfg2', [
        ['cfg2_name', 'a_name', ['cfg2']],
        ['cfg2_serial', 'a_serial', ['A-2']],
    ]);

    // `pointedBy`, l'indice che il reducer mantiene per ogni puntatore.
    lk['cfg1'].pointedBy = [{ source: 'idlookup.s1_cfg.values.0' }];
    lk['cfg2'].pointedBy = [{ source: 'idlookup.s2_cfg.values.0' }];
    lk['s1'].pointedBy = [
        { source: 'idlookup.s2_peer.values.0' },
        { source: 'idlookup.s2_peer.values.1' },
    ];
    lk['s2'].pointedBy = [{ source: 'idlookup.s1_peer.values.0' }];
    // Il contenimento e' anch'esso un puntatore, e finisce nello stesso indice.
    lk['p2'].pointedBy = [{ source: 'idlookup.s1_ports.values.0' }];

    // Il canvas: un grafo sul modello, i vertici degli oggetti, e un vertice
    // omonimo su un ALTRO grafo che non deve rispondere.
    lk['g1'] = { id: 'g1', className: 'DGraph', model: 'm' };
    lk['g2'] = { id: 'g2', className: 'DGraph', model: 'altro' };
    lk['v_s1_altro'] = { id: 'v_s1_altro', className: 'DVertex', model: 's1', graph: 'g2' };
    lk['v_s1'] = { id: 'v_s1', className: 'DVertex', model: 's1', graph: 'g1' };
    lk['v_p2'] = { id: 'v_p2', className: 'DVertex', model: 'p2', graph: 'g1' };
    return lk;
}

const attr = (o: Partial<AttrShape> & { key: string }): AttrShape => ({
    id: 'a_' + o.key, lower: 0, upper: 1, many: false, required: false, derived: false,
    readOnly: false, type: 'string', typeName: 'EString', ...o,
});
const ref = (o: Partial<RefShape> & { key: string; of: string }): RefShape => ({
    id: 'r_' + o.key, lower: 0, upper: -1, many: true, required: false, derived: false,
    readOnly: false, ofId: 'c_' + o.of, composition: false, ...o,
});
const cls = (o: Partial<ClassShape> & { key: string }): ClassShape => ({
    id: 'c_' + o.key, root: false, abstract: false, singleton: false,
    containedIn: [], attrs: [], refs: [], children: [], ...o,
});

const SHAPE: MetamodelShape = {
    enums: {},
    classes: {
        Sensor: cls({
            key: 'Sensor', root: true,
            attrs: [attr({ key: 'name' }), attr({ key: 'kind' })],
            refs: [ref({ key: 'cfg', of: 'Config' }), ref({ key: 'peer', of: 'Sensor' })],
            children: [ref({ key: 'ports', of: 'Port', composition: true }), ref({ key: 'alarms', of: 'Alarm', composition: true })],
        }),
        Port: cls({
            key: 'Port', containedIn: ['Sensor'], attrs: [attr({ key: 'name' })],
            children: [ref({ key: 'filters', of: 'Filter', composition: true })],
        }),
        Filter: cls({ key: 'Filter', containedIn: ['Port'], attrs: [attr({ key: 'name' })] }),
        Alarm: cls({ key: 'Alarm', containedIn: ['Sensor'], attrs: [attr({ key: 'name' })] }),
        Config: cls({
            key: 'Config', root: true,
            attrs: [attr({ key: 'name' }), attr({ key: 'serial', lower: 1, upper: 1, required: true })],
        }),
    },
};

const nod = (n: Neighborhood, id: string) => n.nodes.find(x => x.id === id);
const roles = (n: Neighborhood) => n.nodes.map(x => `${x.id}:${x.role}`).sort();
const arcs = (n: Neighborhood) =>
    n.edges.map(e => `${e.source}-${e.featureKey}->${e.target}`).sort();

describe('ownerLinkOf — un livello su, con la chiave del contenimento', () => {
    it('un contenuto ha owner e chiave', () => {
        expect(ownerLinkOf(fixture(), 'p2')).toEqual({ ownerId: 's1', featureKey: 'ports' });
        expect(ownerLinkOf(fixture(), 'f1')).toEqual({ ownerId: 'p2', featureKey: 'filters' });
    });
    it('una radice del modello non ha owner', () => {
        expect(ownerLinkOf(fixture(), 's1')).toBeNull();
    });
});

describe('neighborhoodOf — il vicinato dei quattro livelli', () => {
    it("l'owner e a un livello, e i figli NON ci sono (sono dell'outline)", () => {
        const n = neighborhoodOf(fixture(), 'p2', SHAPE);
        expect(roles(n)).toEqual(['p2:subject', 's1:owner']);
        expect(arcs(n)).toEqual(['s1-ports->p2']);
        // f1 e' contenuto in p2: un salto di contenimento in giu' non e' vicinato.
        expect(nod(n, 'f1')).toBeUndefined();
        // E il puntatore morto dello slot di CONTENIMENTO non compare qui.
        expect(nod(n, 'ghost')).toBeUndefined();
    });

    it('un owner non e un referrer: il contenimento non entra fra gli entranti', () => {
        const n = neighborhoodOf(fixture(), 'p2', SHAPE);
        // `p2.pointedBy` contiene il puntatore di `s1_ports`, che e' containment:
        // s1 c'e' UNA volta sola, come owner, con l'arco di owner.
        expect(n.nodes.filter(x => x.id === 's1')).toHaveLength(1);
        expect(n.edges.filter(e => e.source === 's1')).toHaveLength(1);
        expect(n.edges[0].kind).toBe('owner');
    });

    it('uscenti con la chiave della feature sull arco', () => {
        const n = neighborhoodOf(fixture(), 's1', SHAPE);
        expect(nod(n, 'cfg1')?.role).toBe('outgoing');
        expect(arcs(n)).toContain('s1-cfg->cfg1');
    });

    it('un riferimento che non risolve e un nodo broken, non un nodo mancante', () => {
        const n = neighborhoodOf(fixture(), 's3', SHAPE);
        expect(nod(n, 'ghost')).toMatchObject({ kind: 'broken', role: 'outgoing', cls: '' });
        expect(arcs(n)).toEqual(['s3-cfg->ghost']);
    });

    it('istanza senza refs: solo owner, e il riquadro non e vuoto', () => {
        const n = neighborhoodOf(fixture(), 'al1', SHAPE);
        expect(roles(n)).toEqual(['al1:subject', 's1:owner']);
    });

    it('radice senza riferimenti: il solo soggetto', () => {
        const lk = fixture();
        lk['s3_cfg'].values = [];
        const n = neighborhoodOf(lk, 's3', SHAPE);
        expect(n.nodes).toHaveLength(1);
        expect(n.edges).toHaveLength(0);
    });
});

describe('neighborhoodOf — le due Config, che un walk piatto confonderebbe', () => {
    it('ogni Config vede il PROPRIO referrer, non tutti i Sensor', () => {
        const lk = fixture();
        const a = neighborhoodOf(lk, 'cfg1', SHAPE);
        const b = neighborhoodOf(lk, 'cfg2', SHAPE);
        expect(roles(a)).toEqual(['cfg1:subject', 's1:incoming']);
        expect(roles(b)).toEqual(['cfg2:subject', 's2:incoming']);
        expect(arcs(a)).toEqual(['s1-cfg->cfg1']);
        expect(arcs(b)).toEqual(['s2-cfg->cfg2']);
        // Il controllo che rende la prova una prova: i due vicinati differiscono,
        // pur essendo le due istanze della STESSA metaclasse.
        expect(roles(a)).not.toEqual(roles(b));
    });

    it('le due Config sono radici: nessun owner, e nessun arco inventato', () => {
        const n = neighborhoodOf(fixture(), 'cfg1', SHAPE);
        expect(n.nodes.some(x => x.role === 'owner')).toBe(false);
    });
});

describe('neighborhoodOf — un nodo per id, gli archi tutti', () => {
    it('un riferimento reciproco da un nodo e due archi', () => {
        const n = neighborhoodOf(fixture(), 's1', SHAPE);
        expect(n.nodes.filter(x => x.id === 's2')).toHaveLength(1);
        // s1 -> s2 (uscente) e s2 -> s1 (entrante): il legame doppio si vede.
        expect(arcs(n)).toContain('s1-peer->s2');
        expect(arcs(n)).toContain('s2-peer->s1');
        // Primo ruolo che lo raggiunge: uscente prima di entrante.
        expect(nod(n, 's2')?.role).toBe('outgoing');
    });

    it('due puntatori nello stesso slot verso lo stesso bersaglio sono UN arco', () => {
        const n = neighborhoodOf(fixture(), 's1', SHAPE);
        expect(n.edges.filter(e => e.source === 's2' && e.featureKey === 'peer')).toHaveLength(1);
    });
});

describe('salientValue — una decisione, quella della ladder', () => {
    it('il primo attributo con valore, saltando lo slot identita', () => {
        const lk = fixture();
        expect(salientValue(lk, 's1', SHAPE.classes.Sensor, SHAPE))
            .toEqual({ key: 'kind', text: 'fast', missing: false });
    });

    it('nessun attributo con valore: nessun valore saliente', () => {
        const lk = fixture();
        expect(salientValue(lk, 's2', SHAPE.classes.Sensor, SHAPE)).toBeUndefined();
    });

    it('un required vuoto porta il suo token, non un trattino', () => {
        const lk = fixture();
        expect(salientValue(lk, 'cfg1', SHAPE.classes.Config, SHAPE))
            .toEqual({ key: 'serial', text: '', missing: true });
        expect(salientValue(lk, 'cfg2', SHAPE.classes.Config, SHAPE))
            .toEqual({ key: 'serial', text: 'A-2', missing: false });
    });

    it('il valore arriva sul nodo, non solo dalla funzione', () => {
        const n = neighborhoodOf(fixture(), 's1', SHAPE);
        expect(nod(n, 's1')?.value).toEqual({ key: 'kind', text: 'fast', missing: false });
        expect(nod(n, 'cfg1')?.value).toEqual({ key: 'serial', text: '', missing: true });
    });
});

describe('neighborhoodOf — quello che lo store dice adesso', () => {
    it('gerarchia cambiata sotto: il vicinato riflette lo store, non la corsa prima', () => {
        const lk = fixture();
        expect(nod(neighborhoodOf(lk, 'p2', SHAPE), 's1')?.role).toBe('owner');
        // p2 riparentato sotto s2: nessuna cache da invalidare, la funzione rilegge.
        lk['s1_ports'].values = ['p1'];
        lk['s2_ports'].values = ['p2'];
        lk['p2'].father = 's2_ports';
        const after = neighborhoodOf(lk, 'p2', SHAPE);
        expect(roles(after)).toEqual(['p2:subject', 's2:owner']);
    });

    it('soggetto inesistente o non un DObject: vicinato vuoto, non un errore', () => {
        expect(neighborhoodOf(fixture(), 'nessuno', SHAPE).nodes).toEqual([]);
        expect(neighborhoodOf(fixture(), 'c_Sensor', SHAPE).nodes).toEqual([]);
        expect(neighborhoodOf(null as any, 's1', SHAPE).nodes).toEqual([]);
    });

    it('shape assente: il soggetto resta, gli uscenti no — mai un riquadro cancellato', () => {
        const n = neighborhoodOf(fixture(), 's1', null);
        expect(nod(n, 's1')).toBeTruthy();
        expect(n.nodes.some(x => x.role === 'outgoing')).toBe(false);
        // Gli entranti non dipendono dalla shape: vengono dall'indice.
        expect(nod(n, 's2')?.role).toBe('incoming');
    });
});

describe('vertexOfObject — lo spazio di id del canvas', () => {
    it('il vertice del grafo di QUEL modello, non un omonimo di un altro grafo', () => {
        expect(vertexOfObject(fixture(), 'm', 's1')).toBe('v_s1');
        expect(vertexOfObject(fixture(), 'm', 'p2')).toBe('v_p2');
    });
    it('oggetto senza vertice: null, e il chiamante riprova o rinuncia', () => {
        expect(vertexOfObject(fixture(), 'm', 'f1')).toBeNull();
    });
    it('modello sbagliato o argomenti vuoti: null', () => {
        expect(vertexOfObject(fixture(), 'altro', 'p2')).toBeNull();
        expect(vertexOfObject(fixture(), '', 's1')).toBeNull();
        expect(vertexOfObject(null as any, 'm', 's1')).toBeNull();
    });
});

/**
 * `egoInputOf` — l'INGRESSO del nastro (FL5/FL6), sullo stesso fixture.
 *
 * Quello che si prova qui e' la meta' IMPURA della catena: che i tre dati escano
 * dall'`idlookup` nella forma in cui `egoNeighborhood` li vuole — uno per
 * POSIZIONE, contenimento incluso e marcato, puntatori morti conservati. Le
 * scelte (dedup, precedenza, cap, conteggi) sono provate in
 * `jjform/__tests__/egoNeighborhood.test.ts` e non si ripetono; l'ultimo blocco
 * mette in fila le due meta' una volta sola, per vedere che si parlino.
 */
describe('egoInputOf — i tre dati, prima di ogni decisione', () => {
    it('gli uscenti sono le sole reference NON di contenimento, in ordine di shape', () => {
        const input = egoInputOf(fixture(), 's1', SHAPE);
        expect(input).not.toBeNull();
        expect(input!.subject).toEqual({ id: 's1', name: 's1', cls: 'Sensor' });
        expect(input!.outgoing.map(p => [p.featureKey, p.targetId]))
            .toEqual([['cfg', 'cfg1'], ['peer', 's2']]);
        // `ports` e `alarms` sono contenimento: stanno in `children`, e il nastro
        // non li disegna. L'outline (10b) e' dove i figli vivono.
        expect(input!.outgoing.some(p => p.featureKey === 'ports' || p.featureKey === 'alarms')).toBe(false);
    });

    it('lo stesso bersaglio due volte nello stesso slot sono DUE puntatori', () => {
        // Il dedup e' del modulo, non di qui: consegnargli un puntatore solo
        // vorrebbe dire prendere quella decisione due volte, in due posti.
        const input = egoInputOf(fixture(), 's2', SHAPE);
        expect(input!.outgoing.map(p => [p.featureKey, p.targetId]))
            .toEqual([['cfg', 'cfg2'], ['peer', 's1'], ['peer', 's1']]);
    });

    it('un puntatore che non risolve conserva il suo id e perde il bersaglio', () => {
        const input = egoInputOf(fixture(), 's3', SHAPE);
        expect(input!.outgoing).toEqual([{ featureKey: 'cfg', targetId: 'ghost', target: null }]);
    });

    it('gli entranti arrivano verbatim: contenimento incluso e MARCATO', () => {
        // Il filtro sul contenimento e' una regola del disegno, quindi e' del
        // modulo. Filtrarlo qui lo renderebbe invisibile al suo stesso test.
        const input = egoInputOf(fixture(), 'p2', SHAPE);
        expect(input!.incoming.map(r => [r.instanceId, r.featureKey, r.composition]))
            .toEqual([['s1', 'ports', true]]);
        expect(input!.outgoing).toEqual([]);   // Port non ha reference, solo figli
    });

    it('due puntatori dalla stessa istanza attraverso lo stesso slot sono due voci', () => {
        const input = egoInputOf(fixture(), 's1', SHAPE);
        expect(input!.incoming.map(r => [r.instanceId, r.featureKey, r.index]))
            .toEqual([['s2', 'peer', 0], ['s2', 'peer', 1]]);
    });

    it('soggetto morto, id vuoto o lookup assente: null, e la riga non disegna', () => {
        expect(egoInputOf(fixture(), 'ghost', SHAPE)).toBeNull();
        expect(egoInputOf(fixture(), 'c_Sensor', SHAPE)).toBeNull();   // non e' un DObject
        expect(egoInputOf(fixture(), '', SHAPE)).toBeNull();
        expect(egoInputOf(null as any, 's1', SHAPE)).toBeNull();
    });

    it('shape assente: il soggetto resta, gli uscenti no — non sparisce dal suo riquadro', () => {
        const input = egoInputOf(fixture(), 's1', null);
        expect(input!.subject.id).toBe('s1');
        expect(input!.outgoing).toEqual([]);
        expect(input!.incoming.length).toBe(2);   // l'indice non dipende dalla shape
    });
});

describe('egoInputOf + egoNeighborhood — le due meta\' si parlano', () => {
    it('s1: un entrante e un uscente, e il conteggio dei PUNTATORI resta due', () => {
        const ego = egoNeighborhood(egoInputOf(fixture(), 's1', SHAPE));
        // `s2` punta s1 due volte E s1 punta s2: la precedenza «l'uscente vince»
        // lascia una scatola sola, dal lato uscente.
        expect(ego.outgoing.map(n => n.id)).toEqual(['cfg1', 's2']);
        expect(ego.incoming.map(n => n.id)).toEqual([]);
        // Il numero della colonna della tabella e' dei PUNTATORI, non delle
        // scatole: due, come `referencedBy` di 2b li conta.
        expect(ego.counts.referencedBy).toBe(2);
    });

    it('p2: il solo entrante e\' il suo owner, e il nastro non lo disegna', () => {
        const ego = egoNeighborhood(egoInputOf(fixture(), 'p2', SHAPE));
        expect(ego.incoming).toEqual([]);
        expect(ego.outgoing).toEqual([]);
        expect(ego.counts.referencedBy).toBe(0);
    });

    it('s3: il puntatore morto diventa un nodo broken, reso e mai saltato', () => {
        const ego = egoNeighborhood(egoInputOf(fixture(), 's3', SHAPE));
        expect(ego.outgoing.map(n => [n.id, n.kind])).toEqual([['ghost', 'broken']]);
    });
});
