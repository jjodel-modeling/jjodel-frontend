import { describe, it, expect } from 'vitest';
import { isLProxy, unproxyDeep, proxyToIdReplacer } from '../unproxy';
import { irHash } from '../../components/editor-v2/viewpoint/ir/irCompile';
import { defaultObjectViewIR, defaultEdgeViewIR, defaultRowViewIR } from '../../components/editor-v2/viewpoint/ir/irDefaults';

/**
 * P-2026-09-29-2121 (F1 of the discovery 2026-09-29 ir_authoring_freeze): no L-proxy
 * stored inside a view's IR, and no stringify of an IR that walks one.
 *
 * The real L object cannot be built here (`joiner` reaches monaco: `window is not
 * defined`), so the fixture reproduces the one property that hangs the page: every get
 * returns a FRESH proxy, so the graph has no end and `JSON.stringify`'s cycle check never
 * fires. A budget throws at MAX gets: a walk that reaches it is the freeze, measured as
 * a count instead of a hung worker. `__isProxy`, `id` and `toJSON` answer as the real
 * handler does (`joiner/proxy.ts`, `__defaultGetter` reading `c.data.toJSON`) and are not
 * counted: they are what a guard is allowed to read.
 */

const MAX = 1000;
type Budget = { gets: number };

/** `id` is read from the rest so that an explicit `undefined` stays undefined. */
function lazyProxy(budget: Budget, ...idArg: [unknown?]): any {
    const id = idArg.length ? idArg[0] : 'Pointer_A1';
    return new Proxy({}, {
        get(_t, k) {
            if (k === '__isProxy') return true;
            if (k === 'id') return id;
            if (typeof k === 'symbol' || k === 'toJSON') return undefined;
            if (++budget.gets >= MAX) throw new Error('lazy L graph walked past ' + MAX + ' gets');
            return lazyProxy(budget, String(id) + '.' + k);
        },
        ownKeys() { return ['father', 'model', 'pointedBy']; },
        getOwnPropertyDescriptor() { return { enumerable: true, configurable: true }; },
    });
}

/** The djb2 of irHash over a PLAIN stringify: what irHash computed before the replacer. */
function plainHash(v: unknown): string {
    const s = JSON.stringify(v);
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
    return String(h);
}

const draftWith = (pin: unknown) => ({
    irVersion: 'ir-1.2', kind: 'vertex', metaclasses: ['A1'],
    shape: { form: 'ellipse', labels: [{ position: 'center', source: { from: 'path', expr: '$name.value' } }] },
    authoringMetaclassPins: { A1: pin },
});

describe('the fixture is the freeze', () => {
    it('a plain JSON.stringify of a draft holding it reaches the budget', () => {
        const b: Budget = { gets: 0 };
        expect(() => JSON.stringify(draftWith(lazyProxy(b)))).toThrow(/walked past/);
        expect(b.gets).toBe(MAX);
    });
});

describe('irHash never walks an L object', () => {
    it('terminates on a draft holding one, reading no property but id', () => {
        const b: Budget = { gets: 0 };
        expect(() => irHash(draftWith(lazyProxy(b)) as never)).not.toThrow();
        expect(b.gets).toBe(0);
    });

    it('hashes the proxy as its id', () => {
        const b: Budget = { gets: 0 };
        expect(irHash(draftWith(lazyProxy(b)) as never)).toBe(irHash(draftWith('Pointer_A1') as never));
    });

    it('is byte-identical to the plain hash on IRs without proxies (persisted migratedHash stamps)', () => {
        for (const ir of [defaultObjectViewIR(), defaultEdgeViewIR(), defaultRowViewIR(), draftWith('Pointer_A1')]) {
            expect(irHash(ir as never)).toBe(plainHash(ir));
        }
    });
});

describe('proxyToIdReplacer', () => {
    it('writes an L object as its id, in an object and in an array', () => {
        const b: Budget = { gets: 0 };
        const s = JSON.stringify({ pin: lazyProxy(b, 'Pointer_X'), list: [lazyProxy(b, 'Pointer_Y'), 'z'] }, proxyToIdReplacer);
        expect(s).toBe('{"pin":"Pointer_X","list":["Pointer_Y","z"]}');
        expect(b.gets).toBe(0);
    });

    it('drops an L object without a string id instead of walking it', () => {
        const b: Budget = { gets: 0 };
        const s = JSON.stringify({ a: 1, pin: lazyProxy(b, 42), list: [lazyProxy(b, undefined)] }, proxyToIdReplacer);
        expect(s).toBe('{"a":1,"list":[null]}');
        expect(b.gets).toBe(0);
    });
});

describe('unproxyDeep', () => {
    it('maps a nested L object to its id without walking it', () => {
        const b: Budget = { gets: 0 };
        const r = unproxyDeep(draftWith(lazyProxy(b)));
        expect(r).toEqual({ ok: true, value: draftWith('Pointer_A1'), mapped: 1 });
        expect(b.gets).toBe(0);
    });

    it('maps L objects inside arrays, deep', () => {
        const b: Budget = { gets: 0 };
        const r = unproxyDeep({ rows: [{ refs: ['k', lazyProxy(b, 'Pointer_R')] }], other: lazyProxy(b, 'Pointer_O') });
        expect(r).toEqual({ ok: true, value: { rows: [{ refs: ['k', 'Pointer_R'] }], other: 'Pointer_O' }, mapped: 2 });
    });

    it('returns the same reference when nothing is a proxy, and keeps untouched subtrees shared', () => {
        const plain = draftWith('Pointer_A1');
        const r = unproxyDeep(plain);
        expect(r.ok && r.value).toBe(plain);
        expect(r.ok && r.mapped).toBe(0);

        const b: Budget = { gets: 0 };
        const mixed = draftWith(lazyProxy(b));
        const m = unproxyDeep(mixed);
        expect(m.ok && m.value).not.toBe(mixed);
        expect(m.ok && (m.value as any).shape).toBe(mixed.shape);
        expect(m.ok && (m.value as any).metaclasses).toBe(mixed.metaclasses);
    });

    it('never mutates its input', () => {
        const b: Budget = { gets: 0 };
        const p = lazyProxy(b);
        const draft = { pins: { A1: p }, list: [p] };
        unproxyDeep(draft);
        expect(draft.pins.A1).toBe(p);
        expect(draft.list[0]).toBe(p);
    });

    it('passes primitives, null and undefined through (`view.ir = undefined` disables the IR)', () => {
        for (const v of [undefined, null, 0, 'x', true]) expect(unproxyDeep(v)).toEqual({ ok: true, value: v, mapped: 0 });
    });

    it('refuses a value that is itself an L object', () => {
        const b: Budget = { gets: 0 };
        const r = unproxyDeep(lazyProxy(b));
        expect(r.ok).toBe(false);
        expect(r.ok === false && r.path).toBe('');
        expect(b.gets).toBe(0);
    });

    it('refuses a nested L object without a string id, naming its path', () => {
        for (const id of [undefined, 42, '']) {
            const b: Budget = { gets: 0 };
            const r = unproxyDeep({ pins: { A1: lazyProxy(b, id) } });
            expect(r).toEqual({ ok: false, path: 'pins.A1', reason: 'an L object without a string id' });
            expect(b.gets).toBe(0);
        }
        const b: Budget = { gets: 0 };
        expect(unproxyDeep({ list: ['a', lazyProxy(b, null)] })).toMatchObject({ ok: false, path: 'list[1]' });
        // The first offending node is the one reported, and the walk stops there.
        expect(unproxyDeep({ first: lazyProxy(b, undefined), later: { loop: null as any, bad: lazyProxy(b, 7) } }))
            .toEqual({ ok: false, path: 'first', reason: 'an L object without a string id' });
    });

    it('refuses a circular structure and accepts a shared, acyclic one', () => {
        const loop: any = { a: { b: {} } };
        loop.a.b.back = loop;
        expect(unproxyDeep(loop)).toEqual({ ok: false, path: 'a.b.back', reason: 'a circular structure' });

        const shared = { color: '#fff' };
        const dag = { x: shared, y: [shared, shared] };
        expect(unproxyDeep(dag)).toEqual({ ok: true, value: dag, mapped: 0 });
    });

    it('does not walk non-plain objects', () => {
        class Box { constructor(public inner: unknown) {} }
        const b: Budget = { gets: 0 };
        const box = new Box(lazyProxy(b));
        const r = unproxyDeep({ box });
        expect(r).toEqual({ ok: true, value: { box }, mapped: 0 });
        expect(r.ok && (r.value as any).box).toBe(box);
    });
});

describe('isLProxy', () => {
    it('reads __isProxy only on objects', () => {
        const b: Budget = { gets: 0 };
        expect(isLProxy(lazyProxy(b))).toBe(true);
        expect(isLProxy({ __isProxy: false })).toBe(false);
        expect(isLProxy({})).toBe(false);
        expect(isLProxy(null)).toBe(false);
        expect(isLProxy('Pointer_A1')).toBe(false);
    });
});
