/**
 * guardContext — step 2 of the plan (R-SIM-14, R-SIM-18), P-2026-09-24-1520.
 *
 * Executes `freezeSnapshot` and `buildGuardContext` (P11) on a record shaped
 * like the output of `buildEvalContext`: class shells, a pool of plain instance
 * handles with references resolved to pool handles, names bound at the top,
 * the ambiguity map. `buildEvalContext` itself does not import under the node
 * bench (the joiner writes on `window`), so the record is synthetic; the gap is
 * declared, not filled with a source-text test (CLAUDE.md §5).
 *
 * An L proxy is not available either, for the same reason. It is stood in for
 * by a JS `Proxy` with no freeze trap that answers `__isProxy`, which is what
 * `joiner/proxy.ts` does: its `preventExtensions`/`defineProperty` traps are
 * commented out. The control below shows that `Object.freeze` on such a proxy
 * freezes its target: the refusal is what keeps the model unfrozen.
 */

import { describe, it, expect } from 'vitest';
import { createFunction } from '../../../jjel/evaluator';
import { buildGuardContext, freezeSnapshot, SimSnapshotError } from '../guardContext';

const MODEL = { id: 'm1', name: 'Machine' };

function shell(name: string): any {
    return { __type: 'Class', className: 'DClass', name, superTypes: [], subTypes: [], instances: [], allInstances: [], instanceCount: 0 };
}

/** A record shaped like `buildEvalContext`'s: two transitions, a door, an event. */
function makeGlobals(): Record<string, any> {
    const Transition = shell('Transition');
    const Door = shell('Door');
    const Event = shell('Event');
    const door: any = { id: 'o_door', __type: 'Object', name: 'd1', instanceOf: Door, instanceof: Door, locked: true, parent: null };
    const go: any = { id: 'o_go', __type: 'Object', name: 'go', instanceOf: Event, instanceof: Event, parent: null };
    const t1: any = { id: 'o_t1', __type: 'Object', name: 'T1', instanceOf: Transition, instanceof: Transition, count: 2, requires: null, parent: null };
    const t2: any = { id: 'o_t2', __type: 'Object', name: 'T2', instanceOf: Transition, instanceof: Transition, count: 5, requires: door, parent: null };
    Transition.instances = [t1, t2]; Transition.allInstances = [t1, t2]; Transition.instanceCount = 2;
    Door.instances = [door]; Door.allInstances = [door]; Door.instanceCount = 1;
    Event.instances = [go]; Event.allInstances = [go]; Event.instanceCount = 1;
    const classes = [Transition, Door, Event];
    return {
        classes,
        instances: [t1, t2, door, go],
        metamodel: { name: 'MM', isMetamodel: true, classes },
        Transition, Door, Event,
        T1: t1, T2: t2, d1: door, go,
        __ambiguousInstances: new Map([['dup', { count: 2, sampleClass: 'Transition' }]]),
    };
}

/** A stand-in for an L proxy: answers `__isProxy`, has no freeze trap. */
function standInProxy(): { proxy: any; target: any } {
    const target: any = { id: 'live', name: 'live' };
    const proxy = new Proxy(target, {
        get: (t, p, r) => (p === '__isProxy' ? true : Reflect.get(t, p, r)),
    });
    return { proxy, target };
}

describe('freezeSnapshot', () => {
    it('control: before the snapshot, the same writes succeed (the fixture is not frozen by construction)', () => {
        const g = makeGlobals();
        g.instances[0].count = 9;
        g.instances.push({ id: 'x' });
        g.__ambiguousInstances.get('dup').count = 9;
        expect(g.instances[0].count).toBe(9);
        expect(g.instances).toHaveLength(5);
        expect(g.__ambiguousInstances.get('dup').count).toBe(9);
    });

    it('deep-freezes M: a nested handle, the pool array, a class shell and a Map entry reject writes', () => {
        const g = makeGlobals();
        freezeSnapshot(g, MODEL);
        const t2 = g.instances[1];
        expect(() => { t2.requires.locked = false; }).toThrow(TypeError);
        expect(() => { g.instances.push({ id: 'x' }); }).toThrow(TypeError);
        expect(() => { g.Transition.instances.pop(); }).toThrow(TypeError);
        expect(() => { g.__ambiguousInstances.get('dup').count = 9; }).toThrow(TypeError);
        expect(t2.requires.locked).toBe(true);
        expect(g.instances).toHaveLength(4);
        expect(g.Transition.instances).toHaveLength(2);
        expect(g.__ambiguousInstances.get('dup').count).toBe(2);
    });

    it('control: Object.freeze on the stand-in proxy freezes its target (the hazard the refusal prevents)', () => {
        const { proxy, target } = standInProxy();
        Object.freeze(proxy);
        expect(Object.isFrozen(target)).toBe(true);
    });

    it('refuses an L proxy reached from M, and freezes nothing: neither the proxy target nor the rest', () => {
        const g = makeGlobals();
        const { proxy, target } = standInProxy();
        g.instances[0].requires = proxy;
        let error: unknown;
        try { freezeSnapshot(g, MODEL); } catch (e) { error = e; }
        expect(error).toBeInstanceOf(SimSnapshotError);
        expect((error as SimSnapshotError).path).toContain('requires');
        expect(Object.isFrozen(target)).toBe(false);
        expect(Object.isFrozen(g.instances[0])).toBe(false);
        expect(Object.isFrozen(g.instances)).toBe(false);
        expect(Object.isFrozen(g.Transition)).toBe(false);
    });

    it('drops data and node before the walk: an L proxy there is neither refused nor frozen', () => {
        const g = makeGlobals();
        const data = standInProxy();
        const node = standInProxy();
        g.data = data.proxy;
        g.node = node.proxy;
        const snap = freezeSnapshot(g, MODEL);
        expect(Object.isFrozen(data.target)).toBe(false);
        expect(Object.isFrozen(node.target)).toBe(false);
        expect(snap.base.has('data')).toBe(false);
        expect(snap.base.has('node')).toBe(false);
        expect(snap.base.has('Transition')).toBe(true);
    });

    it('refuses a caller-bound JjelFunction, the one JjEL path that could write', () => {
        const g = makeGlobals();
        let calls = 0;
        g.tick = createFunction([], () => ++calls);
        expect(() => freezeSnapshot(g, MODEL)).toThrow(SimSnapshotError);
        expect(Object.isFrozen(g.instances)).toBe(false);
    });

    it('indexes the pool by id, with the handles themselves', () => {
        const g = makeGlobals();
        const snap = freezeSnapshot(g, MODEL);
        expect(snap.handleById.get('o_t1')).toBe(g.instances[0]);
        expect(snap.handleById.get('o_go')).toBe(g.instances[3]);
        expect(snap.handleById.size).toBe(4);
    });
});

describe('buildGuardContext', () => {
    it('binds self to the pool handle of the transition, by identity, not a copy', () => {
        const g = makeGlobals();
        const snap = freezeSnapshot(g, MODEL);
        const ctx = buildGuardContext(snap, { transitionId: 'o_t2' }, { event: null })!;
        expect(ctx.get('self')).toBe(g.instances[1]);
        expect((ctx.get('self') as any).requires).toBe(g.d1);
    });

    it('binds event to null on ε and to the event instance handle otherwise', () => {
        const g = makeGlobals();
        const snap = freezeSnapshot(g, MODEL);
        const eps = buildGuardContext(snap, { transitionId: 'o_t1' }, { event: null })!;
        expect(eps.has('event')).toBe(true);
        expect(eps.get('event')).toBeNull();
        const ev = buildGuardContext(snap, { transitionId: 'o_t1' }, { event: 'o_go' })!;
        expect(ev.get('event')).toBe(g.go);
    });

    it('binds model to the frozen placeholder { __type, id, name }', () => {
        const snap = freezeSnapshot(makeGlobals(), MODEL);
        const ctx = buildGuardContext(snap, { transitionId: 'o_t1' }, { event: null })!;
        const model = ctx.get('model');
        expect(model).toEqual({ __type: 'Model', id: 'm1', name: 'Machine' });
        expect(Object.isFrozen(model)).toBe(true);
    });

    it('never binds node, and never data', () => {
        const g = makeGlobals();
        g.node = { id: 'vertex' };
        g.data = { id: 'selected' };
        const snap = freezeSnapshot(g, MODEL);
        const ctx = buildGuardContext(snap, { transitionId: 'o_t1' }, { event: null })!;
        expect(ctx.has('node')).toBe(false);
        expect(ctx.has('data')).toBe(false);
        expect(ctx.has('self')).toBe(true);
    });

    it('the roots hide globals of the same name; the globals stay in the base', () => {
        const g = makeGlobals();
        g.self = 'G-self';
        g.event = 'G-event';
        g.model = 'G-model';
        const snap = freezeSnapshot(g, MODEL);
        const ctx = buildGuardContext(snap, { transitionId: 'o_t1' }, { event: null })!;
        expect(ctx.get('self')).toBe(g.instances[0]);
        expect(ctx.get('event')).toBeNull();
        expect(ctx.get('model')).toEqual({ __type: 'Model', id: 'm1', name: 'Machine' });
        expect(snap.base.get('event')).toBe('G-event');
        expect(snap.base.get('self')).toBe('G-self');
    });

    it('returns null when the transition or the event has no handle; the same call with known ids does not', () => {
        const snap = freezeSnapshot(makeGlobals(), MODEL);
        expect(buildGuardContext(snap, { transitionId: 'o_missing' }, { event: null })).toBeNull();
        expect(buildGuardContext(snap, { transitionId: 'o_t1' }, { event: 'o_missing' })).toBeNull();
        expect(buildGuardContext(snap, { transitionId: 'o_t1' }, { event: 'o_go' })).not.toBeNull();
    });
});
