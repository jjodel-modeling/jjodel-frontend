/**
 * slotAppendQueue: an append to a slot plans over what the store holds and what is on its way.
 * The fake has the three states of a write (action.ts): in the open buffer, in flight after a flush, in the store.
 */
import { describe, expect, it } from 'vitest';
import { createSlotAppendQueue, type SlotAppendQueue } from '../slotAppendQueue';

interface Fake {
    q: SlotAppendQueue;
    slots: Record<string, unknown[]>;
    /** Plans an append and writes nothing, as a write sitting in the open buffer. */
    plan(slot: string, id: string): unknown[];
    /** FINAL_END's flush: a new buffer, one dispatch in flight. */
    flush(): void;
    /** FINAL_END's abort: a new buffer, nothing in flight. */
    abort(): void;
    /** The in-flight dispatch runs: the slot takes `values` and the listeners hear the update. */
    land(slot: string, values: unknown[]): void;
    /** A store update that does not touch the slots. */
    otherUpdate(): void;
    subscriptions(): number;
    /** Puts a dispatch in flight without a flush, as an unrelated composite on its way. */
    inFlight(n: number): void;
}

function fake(): Fake {
    const slots: Record<string, unknown[]> = {};
    const listeners: Array<() => void> = [];
    let buffer: object = {};
    let inFlight = 0;
    const q = createSlotAppendQueue({
        storedValues: (slot) => slots[slot],
        currentBuffer: () => buffer,
        dispatchesInFlight: () => inFlight,
        subscribe: (l) => { listeners.push(l); },
    });
    const notify = () => { for (const l of listeners) l(); };
    return {
        q, slots,
        plan: (slot, id) => q.plan(slot, slots[slot] ?? [], id),
        flush: () => { buffer = {}; inFlight++; },
        abort: () => { buffer = {}; },
        land: (slot, values) => { inFlight = Math.max(0, inFlight - 1); slots[slot] = values; notify(); },
        otherUpdate: notify,
        subscriptions: () => listeners.length,
        inFlight: (n) => { inFlight = n; },
    };
}

describe('slotAppendQueue', () => {
    it('two appends to one slot before the store holds the first keep both, in order', () => {
        const f = fake();
        expect(f.plan('s', 'A')).toEqual(['A']);
        expect(f.plan('s', 'B')).toEqual(['A', 'B']);
        expect(f.plan('s', 'C')).toEqual(['A', 'B', 'C']);
    });

    it('plans after what the store holds, without its empty values', () => {
        const f = fake();
        f.slots.s = [null, 'X', '', undefined, 'Y'];
        expect(f.plan('s', 'A')).toEqual(['X', 'Y', 'A']);
        expect(f.plan('s', 'B')).toEqual(['X', 'Y', 'A', 'B']);
    });

    it('keeps an entry once its buffer has flushed, while its dispatch is in flight', () => {
        const f = fake();
        f.plan('s', 'A');
        f.flush();
        expect(f.plan('s', 'B')).toEqual(['A', 'B']);
    });

    it('drops an entry once the store holds it: it is not planned twice', () => {
        const f = fake();
        f.plan('s', 'A');
        f.flush();
        f.land('s', ['A']);
        expect(f.plan('s', 'B')).toEqual(['A', 'B']);
    });

    it('drops an entry at the store update that lands it, with no plan on that slot', () => {
        const f = fake();
        f.plan('s', 'A');
        f.flush();
        f.land('s', ['A']);
        f.slots.s = [];
        // An unrelated dispatch in flight would pass the bound: only the landing can have dropped A.
        f.inFlight(1);
        expect(f.plan('s', 'B')).toEqual(['B']);
    });

    it('the bound drops a write that never lands: buffer thrown away by an abort, nothing in flight', () => {
        const f = fake();
        f.plan('s', 'A');
        f.abort();
        expect(f.plan('s', 'B')).toEqual(['B']);
    });

    it('the bound also applies at a store update, not only at a plan', () => {
        const f = fake();
        f.plan('s', 'A');
        f.abort();
        f.otherUpdate();
        f.inFlight(1);
        expect(f.plan('s', 'B')).toEqual(['B']);
    });

    it('the bound does not drop an entry whose buffer is still open, with nothing in flight', () => {
        const f = fake();
        f.plan('s', 'A');
        f.otherUpdate();
        expect(f.plan('s', 'B')).toEqual(['A', 'B']);
    });

    it('the bound waits for every dispatch in flight: an entry of a flushed buffer stays while one is', () => {
        const f = fake();
        f.plan('s', 'A');
        f.flush();
        f.otherUpdate();
        f.inFlight(2);
        expect(f.plan('s', 'B')).toEqual(['A', 'B']);
    });

    it('an entry planned after a flush belongs to the new buffer, and outlives the old one', () => {
        const f = fake();
        f.plan('s', 'A');
        f.flush();
        f.plan('s', 'B');
        f.land('s', ['A']);
        expect(f.plan('s', 'C')).toEqual(['A', 'B', 'C']);
    });

    it('appends to different slots do not interfere', () => {
        const f = fake();
        expect(f.plan('s', 'A')).toEqual(['A']);
        expect(f.plan('t', 'B')).toEqual(['B']);
        expect(f.plan('s', 'C')).toEqual(['A', 'C']);
        expect(f.plan('t', 'D')).toEqual(['B', 'D']);
    });

    it('a landing on one slot leaves the entries of another', () => {
        const f = fake();
        f.plan('s', 'A');
        f.plan('t', 'B');
        f.flush();
        // Two composites on their way: the one that lands holds A only, the other still holds B.
        f.inFlight(2);
        f.land('s', ['A']);
        expect(f.plan('t', 'C')).toEqual(['B', 'C']);
    });

    it('an id already queued is not listed twice and keeps its place', () => {
        const f = fake();
        f.plan('s', 'A');
        f.plan('s', 'B');
        expect(f.plan('s', 'A')).toEqual(['A', 'B']);
        expect(f.plan('s', 'C')).toEqual(['A', 'B', 'C']);
    });

    it('an id the store already holds is listed again, as before, and not queued', () => {
        const f = fake();
        f.slots.s = ['A'];
        expect(f.plan('s', 'A')).toEqual(['A', 'A']);
        expect(f.plan('s', 'B')).toEqual(['A', 'B']);
    });

    it('forget drops the queue of that slot only', () => {
        const f = fake();
        f.plan('s', 'A');
        f.plan('t', 'B');
        f.q.forget('s');
        expect(f.plan('s', 'C')).toEqual(['C']);
        expect(f.plan('t', 'D')).toEqual(['B', 'D']);
    });

    it('subscribes to the store once, at the first plan', () => {
        const f = fake();
        expect(f.subscriptions()).toBe(0);
        f.plan('s', 'A');
        f.plan('t', 'B');
        expect(f.subscriptions()).toBe(1);
    });

    it('a slot gone from the store still follows the bound', () => {
        const f = fake();
        f.plan('s', 'A');
        f.abort();
        f.otherUpdate();
        f.inFlight(1);
        expect(f.q.plan('s', [], 'B')).toEqual(['B']);
    });
});
