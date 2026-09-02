import { describe, it, expect } from 'vitest';
import {
    IDENTITY_KEY,
    bulkExclusionReason,
    bulkPlan,
    multiModel,
    unionPreflight,
    willApplyTo,
    type MultiInstance,
} from '../multi';
import type { AttrShape, ClassShape, RefShape } from '../shape';

/**
 * Il contratto di `jjform/multi` (slice 12b).
 *
 * Le prove sono di COMPORTAMENTO, non statiche: `multi.ts` non importa niente, e
 * un modulo a zero import e' caricabile sotto vitest. E' la ragione per cui il
 * motore sta in `jjform/` e non nell'adapter — `create.test.ts` e `delete.test.ts`
 * sono lo stesso caso.
 *
 * Il metamodello di prova e' quello del design (`Instance Node Proposal.dc.html`,
 * Turno 12): un `Sensor` con `name`, `tint` (enum), `threshold` (numero), `active`
 * (booleano), una reference `cfg` e uno slot di containment `ports`.
 */

const attr = (key: string, over: Partial<AttrShape> = {}): AttrShape => ({
    key, id: 'a_' + key, lower: 0, upper: 1, many: false, required: false,
    derived: false, readOnly: false, type: 'string', typeName: 'EString', ...over,
});

const ref = (key: string, over: Partial<RefShape> = {}): RefShape => ({
    key, id: 'r_' + key, lower: 0, upper: 1, many: false, required: false,
    derived: false, readOnly: false, of: 'Config', ofId: 'c_Config', composition: false, ...over,
});

const SENSOR: ClassShape = {
    key: 'Sensor', id: 'c_Sensor', root: true, abstract: false, singleton: false,
    containedIn: [],
    attrs: [
        attr('name'),
        attr('tint', { type: 'enum', enum: 'Palette', typeName: 'Palette' }),
        attr('threshold', { type: 'number', typeName: 'EInt' }),
        attr('active', { type: 'boolean', typeName: 'EBoolean' }),
        attr('serial', { readOnly: true }),
    ],
    refs: [ref('cfg')],
    children: [ref('ports', { of: 'Port', ofId: 'c_Port', composition: true, upper: -1, many: true })],
};

const inst = (id: string, values: Record<string, unknown>, refs: Record<string, unknown> = {}): MultiInstance =>
    ({ id, values, refs });

const THREE: MultiInstance[] = [
    inst('s1', { name: 's1', tint: 'Green', threshold: 40, active: true }, { cfg: 'cfg1' }),
    inst('s2', { name: 's2', tint: 'Red', threshold: 40, active: true }, { cfg: 'cfg1' }),
    inst('s3', { name: 's3', tint: 'Blue', threshold: 40, active: false }, { cfg: 'cfg2' }),
];

describe('multiModel — i valori misti sono dichiarati, mai mediati', () => {
    it('un campo su cui le istanze non concordano e\' `mixed` e non ha valore', () => {
        const m = multiModel(SENSOR, THREE);
        const tint = m.fields.find(f => f.key === 'tint')!;
        expect(tint.state).toBe('mixed');
        // Mai un rappresentante: offrirne uno sarebbe la media che il design vieta.
        expect(tint.value).toBeNull();
    });

    it('porta i valori distinti, in ordine di prima comparsa', () => {
        // E' cio' che stampa «Mixed (Green, Red, Blue)».
        const m = multiModel(SENSOR, THREE);
        expect(m.fields.find(f => f.key === 'tint')!.distinct).toEqual(['Green', 'Red', 'Blue']);
    });

    it('un campo su cui concordano e\' `uniform` e porta il valore', () => {
        const m = multiModel(SENSOR, THREE);
        const th = m.fields.find(f => f.key === 'threshold')!;
        expect(th.state).toBe('uniform');
        expect(th.value).toBe(40);
        expect(th.distinct).toEqual([40]);
    });

    it('vuoto e non-scritto sono la stessa cosa, e collassano in un solo distinto', () => {
        const m = multiModel(SENSOR, [
            inst('a', { threshold: null }),
            inst('b', {}),
            inst('c', { threshold: '' }),
        ]);
        const th = m.fields.find(f => f.key === 'threshold')!;
        expect(th.distinct).toEqual([null]);
        expect(th.state).toBe('uniform');
    });

    it('una reference si comporta come un attributo, per valore del puntatore', () => {
        const m = multiModel(SENSOR, THREE);
        const cfg = m.fields.find(f => f.key === 'cfg')!;
        expect(cfg.kind).toBe('ref');
        expect(cfg.state).toBe('mixed');
        expect(cfg.distinct).toEqual(['cfg1', 'cfg2']);
    });
});

describe('multiModel — il toggle ha uno stato terzo', () => {
    it('un booleano porta quanti sono accesi e quanti spenti', () => {
        // «Active — 2 on · 1 off» nel design.
        const counts = multiModel(SENSOR, THREE).fields.find(f => f.key === 'active')!.counts!;
        expect(counts).toEqual({ on: 2, off: 1, unset: 0 });
    });

    it('un booleano non scritto e\' `unset`, non `off`', () => {
        const counts = multiModel(SENSOR, [
            inst('a', { active: true }), inst('b', {}), inst('c', { active: false }),
        ]).fields.find(f => f.key === 'active')!.counts!;
        expect(counts).toEqual({ on: 1, off: 1, unset: 1 });
    });

    it('solo i booleani portano i conteggi', () => {
        const m = multiModel(SENSOR, THREE);
        expect(m.fields.find(f => f.key === 'threshold')!.counts).toBeUndefined();
    });
});

describe('multiModel — identita\' e containment spariscono', () => {
    it('`name` non e\' un campo, ed e\' escluso con un motivo', () => {
        const m = multiModel(SENSOR, THREE);
        expect(m.fields.some(f => f.key === IDENTITY_KEY)).toBe(false);
        const ex = m.excluded.find(e => e.key === IDENTITY_KEY);
        expect(ex?.reason).toMatch(/identity is never bulk-edited/);
    });

    it('ogni slot di containment e\' escluso, uno per uno', () => {
        const m = multiModel(SENSOR, THREE);
        expect(m.fields.some(f => f.key === 'ports')).toBe(false);
        expect(m.excluded.find(e => e.key === 'ports')?.reason).toMatch(/containment is never bulk-edited/);
    });

    it('un campo read-only non e\' offerto: il write path lo rifiuterebbe', () => {
        const m = multiModel(SENSOR, THREE);
        expect(m.fields.some(f => f.key === 'serial')).toBe(false);
        expect(m.excluded.find(e => e.key === 'serial')?.reason).toMatch(/Read-only/);
    });

    it('il verdetto di esclusione e\' interrogabile da solo', () => {
        expect(bulkExclusionReason(attr('name'))).toMatch(/identity/);
        expect(bulkExclusionReason(attr('tint'))).toBeNull();
        expect(bulkExclusionReason(attr('tint'), { isChild: true })).toMatch(/containment/);
    });
});

describe('multiModel — l\'intestazione', () => {
    it('conta e nomina la selezione', () => {
        expect(multiModel(SENSOR, THREE).title).toBe('3 Sensors selected');
    });
    it('al singolare non pluralizza', () => {
        expect(multiModel(SENSOR, [THREE[0]]).title).toBe('1 Sensor selected');
    });
    it('willApplyTo e\' il conteggio della selezione', () => {
        expect(willApplyTo(multiModel(SENSOR, THREE))).toBe(3);
    });
});

describe('bulkPlan — non toccato, non scritto', () => {
    it('un campo toccato produce un evento per ogni istanza', () => {
        const m = multiModel(SENSOR, THREE);
        const plan = bulkPlan(m, { threshold: 50 });
        expect(plan).toHaveLength(3);
        expect(plan.map(e => e.id)).toEqual(['s1', 's2', 's3']);
        expect(plan.every(e => e.key === 'threshold' && e.value === 50)).toBe(true);
    });

    it('un campo NON toccato non produce niente, e resta misto', () => {
        // La regola che tiene «Mixed» dopo una scrittura su un altro campo.
        const m = multiModel(SENSOR, THREE);
        const plan = bulkPlan(m, { threshold: 50 });
        expect(plan.some(e => e.key === 'tint')).toBe(false);
    });

    it('nessun campo toccato, nessun evento', () => {
        expect(bulkPlan(multiModel(SENSOR, THREE), {})).toEqual([]);
    });

    it('scrivere un misto lo applica a TUTTE le selezionate', () => {
        const plan = bulkPlan(multiModel(SENSOR, THREE), { tint: 'Green' });
        expect(plan.map(e => e.id)).toEqual(['s1', 's2', 's3']);
        expect(new Set(plan.map(e => e.value))).toEqual(new Set(['Green']));
    });

    it('porta l\'handle della feature e sa se il valore e\' un puntatore', () => {
        const plan = bulkPlan(multiModel(SENSOR, THREE), { cfg: 'cfg3', threshold: 1 });
        const cfg = plan.find(e => e.key === 'cfg')!;
        const th = plan.find(e => e.key === 'threshold')!;
        expect(cfg.featureId).toBe('r_cfg');
        expect(cfg.isPtr).toBe(true);      // reference
        expect(th.isPtr).toBe(false);      // primitivo
        expect(bulkPlan(multiModel(SENSOR, THREE), { tint: 'Red' })[0].isPtr).toBe(true); // enum
    });
});

describe('bulkPlan — la guardia non si fida della UI', () => {
    it('`name` non si scrive nemmeno se la UI lo manda', () => {
        // La form lo nasconde; il piano lo rifiuta lo stesso. Una UI e' una
        // convenzione, un piano che non emette l'evento e' una garanzia.
        const plan = bulkPlan(multiModel(SENSOR, THREE), { name: 'bulk', threshold: 7 });
        expect(plan.some(e => e.key === 'name')).toBe(false);
        expect(plan).toHaveLength(3);
    });

    it('uno slot di containment non si scrive nemmeno se la UI lo manda', () => {
        const plan = bulkPlan(multiModel(SENSOR, THREE), { ports: ['p1'] });
        expect(plan).toEqual([]);
    });

    it('una chiave che il modello non offre viene lasciata cadere', () => {
        expect(bulkPlan(multiModel(SENSOR, THREE), { nonesuch: 1 })).toEqual([]);
    });

    it('un campo read-only non si scrive', () => {
        expect(bulkPlan(multiModel(SENSOR, THREE), { serial: 'x' })).toEqual([]);
    });
});

describe('unionPreflight — un preflight solo per l\'insieme', () => {
    const pre = (id: string, over: any = {}) => ({
        id, name: id, cls: 'Sensor', blocked: null,
        referencedBy: [], descendants: [], reassignCandidates: [], ...over,
    });
    const rf = (instanceId: string, pointsAt: string, featureKey = 'cfg', index = 0) =>
        ({ instanceId, pointsAt, featureKey, index });

    it('unisce i referrer di tutti i membri', () => {
        const u = unionPreflight([
            pre('s1', { referencedBy: [rf('x', 's1')] }),
            pre('s2', { referencedBy: [rf('y', 's2')] }),
        ]);
        expect(u.referencedBy.map((r: any) => r.instanceId)).toEqual(['x', 'y']);
        expect(u.count).toBe(2);
    });

    it('un referrer che sta morendo anche lui NON e\' un referrer', () => {
        // s2 punta a s1, ma s2 e' nell'insieme: riassegnarlo sarebbe modificare
        // un fantasma. Stessa frase con cui 12d scarta i puntatori dei discendenti.
        const u = unionPreflight([
            pre('s1', { referencedBy: [rf('s2', 's1'), rf('x', 's1')] }),
            pre('s2'),
        ]);
        expect(u.referencedBy.map((r: any) => r.instanceId)).toEqual(['x']);
    });

    it('un referrer che punta a un DISCENDENTE dell\'insieme e\' scartato se muore anche lui', () => {
        const u = unionPreflight([
            pre('s1', { descendants: [{ id: 'p1' }], referencedBy: [rf('p1', 's1'), rf('z', 's1')] }),
        ]);
        expect(u.referencedBy.map((r: any) => r.instanceId)).toEqual(['z']);
    });

    it('lo stesso puntatore visto da due membri e\' UNA riga', () => {
        const u = unionPreflight([
            pre('s1', { referencedBy: [rf('x', 's1', 'cfg', 0)] }),
            pre('s2', { referencedBy: [rf('x', 's1', 'cfg', 0)] }),
        ]);
        expect(u.referencedBy).toHaveLength(1);
    });

    it('i candidati di riassegnazione sono l\'INTERSEZIONE, e nessuno sta morendo', () => {
        // Il dialogo offre un bersaglio per tutto l'insieme: un candidato che non
        // va bene per un membro non va bene per l'insieme.
        const u = unionPreflight([
            pre('s1', { referencedBy: [rf('x', 's1')], reassignCandidates: [{ id: 'a', label: 'a' }, { id: 'b', label: 'b' }, { id: 's2', label: 's2' }] }),
            pre('s2', { reassignCandidates: [{ id: 'b', label: 'b' }, { id: 's2', label: 's2' }] }),
        ]);
        expect(u.reassignCandidates.map(c => c.id)).toEqual(['b']);
        expect(u.canReassign).toBe(true);
    });

    it('senza referrer non c\'e\' niente da riassegnare', () => {
        const u = unionPreflight([pre('s1', { reassignCandidates: [{ id: 'a', label: 'a' }] })]);
        expect(u.canReassign).toBe(false);
        expect(u.simple).toBe(true);
        expect(u.message).toBe('This cannot be undone.');
    });

    it('un solo membro bloccato blocca il gesto, e lo nomina', () => {
        const u = unionPreflight([
            pre('s1'),
            pre('s2', { blocked: 'Singleton instance' }),
        ]);
        expect(u.blocked).toMatch(/s2/);
        expect(u.blocked).toMatch(/Singleton instance/);
    });

    it('i discendenti si uniscono senza doppioni', () => {
        const u = unionPreflight([
            pre('s1', { descendants: [{ id: 'p1' }, { id: 'p2' }] }),
            pre('s2', { descendants: [{ id: 'p2' }, { id: 'p3' }] }),
        ]);
        expect(u.descendants.map((d: any) => d.id)).toEqual(['p1', 'p2', 'p3']);
        expect(u.simple).toBe(false);
    });

    it('il titolo conta e pluralizza', () => {
        expect(unionPreflight([pre('s1'), pre('s2')]).title).toBe('Delete 2 Sensors?');
        expect(unionPreflight([pre('s1')]).title).toBe('Delete 1 Sensor?');
    });
});
