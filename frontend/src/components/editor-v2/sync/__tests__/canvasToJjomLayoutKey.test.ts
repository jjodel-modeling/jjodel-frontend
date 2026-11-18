/**
 * The write-back writes under the layout key it is given (multi-tab L3, P-2026-11-07-1249).
 *
 * Two tabs on one model under two exclusive viewpoints `A` and `B`: a gesture in the `B` tab must
 * write `layoutByViewpoint.B` and leave `A`'s record as it is, whatever the root `state.viewpoint`
 * says. The five layout writes of `canvasToJjom.ts` emit one `SetFieldAction` of `layoutByViewpoint`
 * with `'+='`, a shallow per-key merge (reducer), so "untouched" means: the payload carries the one
 * key. With no key the root's is read, which is the write-back before L3.
 *
 * The joiner barrel is faked: `SetFieldAction.new` is recorded, `TRANSACTION` runs its body.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const redux: { state: any } = { state: {} };
const actions: Array<{ id: string; field: string; value: any; op: unknown }> = [];
vi.mock('../../../../joiner', () => {
    const none = { new: () => undefined };
    return {
        store: { getState: () => redux.state },
        SetFieldAction: { new: (id: string, field: string, value: any, op: unknown) => { actions.push({ id, field, value, op }); } },
        TRANSACTION: (_n: string, f: () => void) => f(),
        DeleteElementAction: none, LPointerTargetable: { fromPointer: () => undefined },
        DVertex: none, DEdge: none, DVoidEdge: none, DObject: none, DModel: none, DClass: none,
        DEnumerator: none, DPackage: none, GraphSize: class {},
    };
});
vi.mock('../../hooks/useOrphanFeatures', () => ({ captureAttributeOrphanValues: () => undefined }));
vi.mock('../m1EdgeSweep', () => ({ sweepAllM1ReferenceGraphs: () => undefined }));

import {
    syncPositionToJjom, syncPositionBatchToJjom, syncSizeToJjom, syncSizeResetToJjom, syncSizeBatchToJjom,
} from '../canvasToJjom';

const A = { x: 10, y: 20, w: 120, h: 60, isResized: true };
const B = { x: 300, y: 400, w: 220, h: 160, isResized: true };
const vertex = (id: string) => ({ id, className: 'DVertex', x: 1, y: 2, w: 100, h: 50, isResized: false, layoutByViewpoint: { A: { ...A }, B: { ...B } } });

/** The `layoutByViewpoint` payloads written, per vertex: one key each, the record it carries. */
const writes = () => actions.map(a => {
    expect(a.field).toBe('layoutByViewpoint');
    expect(a.op).toBe('+=');
    return { id: a.id, keys: Object.keys(a.value), rec: Object.values(a.value)[0] };
});

beforeEach(() => {
    actions.length = 0;
    redux.state = {
        viewpoint: 'A',
        idlookup: { A: { id: 'A', isExclusiveView: true }, B: { id: 'B', isExclusiveView: true }, v1: vertex('v1'), v2: vertex('v2') },
    };
});

describe('canvasToJjom: the five layout writes take the key as a parameter', () => {
    it('a drag writes the record of the key it is given, the other key untouched', () => {
        syncPositionToJjom('v1', 7, 8, 'B');
        expect(writes()).toEqual([{ id: 'v1', keys: ['B'], rec: { ...B, x: 7, y: 8 } }]);
    });

    it('a batch drag, sized or not, writes every vertex under the key it is given', () => {
        syncPositionBatchToJjom([{ id: 'v1', x: 7, y: 8 }, { id: 'v2', x: 9, y: 9, w: 50, h: 40 }], 'B');
        expect(writes()).toEqual([
            { id: 'v1', keys: ['B'], rec: { ...B, x: 7, y: 8 } },
            { id: 'v2', keys: ['B'], rec: { x: 9, y: 9, w: 50, h: 40, isResized: true } },
        ]);
    });

    it('a resize writes the size under the key it is given', () => {
        syncSizeToJjom('v1', 55, 44, 'B');
        expect(writes()).toEqual([{ id: 'v1', keys: ['B'], rec: { ...B, w: 55, h: 44, isResized: true } }]);
    });

    it('a Reset size clears the flag of the key it is given only', () => {
        syncSizeResetToJjom('v1', 'B');
        expect(writes()).toEqual([{ id: 'v1', keys: ['B'], rec: { ...B, isResized: false } }]);
    });

    it('a size propagation writes every vertex under the key it is given', () => {
        syncSizeBatchToJjom([{ vertexId: 'v1', w: 55, h: 44 }, { vertexId: 'v2', w: 66, h: 33 }], 'B');
        expect(writes().map(w => [w.id, w.keys, w.rec])).toEqual([
            ['v1', ['B'], { ...B, w: 55, h: 44, isResized: true }],
            ['v2', ['B'], { ...B, w: 66, h: 33, isResized: true }],
        ]);
    });

    it('with no key every write goes under the root key: the write-back of one tab, unchanged', () => {
        syncPositionToJjom('v1', 7, 8);
        syncPositionBatchToJjom([{ id: 'v2', x: 9, y: 9 }]);
        syncSizeToJjom('v1', 55, 44);
        syncSizeResetToJjom('v2');
        syncSizeBatchToJjom([{ vertexId: 'v1', w: 66, h: 33 }]);
        expect(writes().map(w => w.keys)).toEqual([['A'], ['A'], ['A'], ['A'], ['A']]);
        expect(writes()[0].rec).toEqual({ ...A, x: 7, y: 8 });
    });

    it('with one tab and its key equal to the root key, the actions equal the keyless ones', () => {
        const run = (key?: string) => {
            actions.length = 0;
            syncPositionToJjom('v1', 7, 8, key);
            syncPositionBatchToJjom([{ id: 'v2', x: 9, y: 9, w: 50, h: 40 }], key);
            syncSizeToJjom('v1', 55, 44, key);
            syncSizeResetToJjom('v2', key);
            syncSizeBatchToJjom([{ vertexId: 'v1', w: 66, h: 33 }], key);
            return actions.map(a => ({ ...a }));
        };
        expect(run('A')).toEqual(run());
    });
});
