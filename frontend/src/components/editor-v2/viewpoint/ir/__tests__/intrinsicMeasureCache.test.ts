/**
 * The intrinsic measure of an IR node's content is taken only when something it depends on moved
 * (P-2026-10-21-1240, LIR docs/lir/lir_2026-10-21_intrinsic_cache.md).
 *
 * `measureIntrinsic` writes `max-content` on `.ir-node-content`, reads `offsetWidth/offsetHeight` and
 * restores: one forced layout per node per commit, 431 ms of a production drag (round 3 §3.4). The
 * reading is now kept per element with the key it was taken under (the element's class, inline style
 * and content markup, its ancestors' classes up to the React Flow node, the node's box) and an epoch
 * that inherited CSS bumps (fonts, the theme attribute on <html>, stylesheet text).
 *
 * ── The subject runs, React and the document are stubbed ───────────────────
 * The bench of useContentSizeUnmount.test.ts, plus `useEffect` run at commit after the layout effects
 * and a counted `useState` setter (a re-render asked of the host). The element is a stand-in attached
 * to the document, whose `offsetWidth/offsetHeight` reads and whose five measured style properties are
 * counted: a read is a forced layout, a write is the `max-content` thrash. The document holds <html>,
 * <head>, the viewpoint CSS injector and `document.fonts`; MutationObserver is a stand-in whose records
 * the test queues as the browser would. Module state (the cache, the epoch, the observers) is reset in
 * `beforeEach` by a fresh import (P11).
 *
 * Mutation bench (commit body): m1 key without the content markup, m2 epoch not bumped on a theme
 * change, m3 a hit still writes `max-content`, m4 entry kept after unmount; each dies by a named test.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type Effect = { fn: () => void | (() => void); deps?: unknown[]; passive: boolean };
const runtime = {
    slots: [] as unknown[], i: 0, e: 0,
    pending: [] as Effect[],
    mounted: [] as Array<{ deps?: unknown[]; cleanup?: () => void }>,
    rerenders: 0,
};
vi.mock('react', async (importOriginal) => {
    const actual = await importOriginal<typeof import('react')>();
    return {
        ...actual,
        useRef: (v: unknown) => {
            const k = runtime.i++;
            if (!(k in runtime.slots)) runtime.slots[k] = { current: v };
            return runtime.slots[k];
        },
        useState: (v: unknown) => {
            const k = runtime.i++;
            if (!(k in runtime.slots)) runtime.slots[k] = v;
            return [runtime.slots[k], () => { runtime.rerenders += 1; }];
        },
        useEffect: (fn: Effect['fn'], deps?: unknown[]) => { runtime.pending[runtime.e++] = { fn, deps, passive: true }; },
        useLayoutEffect: (fn: Effect['fn'], deps?: unknown[]) => { runtime.pending[runtime.e++] = { fn, deps, passive: false }; },
    };
});

type RFNode = { id: string; width?: number; height?: number; measured?: unknown };
const rf: { nodes: RFNode[]; writes: number } = { nodes: [], writes: 0 };
vi.mock('@xyflow/react', () => ({
    useReactFlow: () => ({
        getNode: (id: string) => rf.nodes.find(n => n.id === id),
        setNodes: (f: (nds: RFNode[]) => RFNode[]) => {
            const next = f(rf.nodes);
            if (next !== rf.nodes) rf.writes += 1;
            rf.nodes = next;
        },
    }),
}));

const redux: { state: any } = { state: {} };
vi.mock('react-redux', () => ({ useSelector: (sel: (s: any) => unknown) => sel(redux.state) }));
vi.mock('../../../../../joiner', () => ({ store: { getState: () => redux.state } }));

import type { ShapeForm } from '../irTypes';

const V = 'v1';

/** A stand-in element: a class name and a parent, `classList.contains` over the current class. */
type Box = { className: string; parentElement: Box | null; classList: { contains(c: string): boolean } };
function box(className: string, parentElement: Box | null): Box {
    const b: Box = { className, parentElement, classList: { contains: (c: string) => b.className.split(/\s+/).includes(c) } };
    return b;
}

/** The DOM work of the measure: a read is a forced layout, a write the `max-content` thrash. */
const dom = { reads: 0, writes: 0 };
/** The ink the browser would lay out at `max-content`. */
let ink = { w: 40, h: 20 };
let cssText = 'background: rgb(255, 255, 255);';
const style: Record<string, string> = {};
Object.defineProperty(style, 'cssText', { get: () => cssText });
for (const k of ['width', 'height', 'minWidth', 'minHeight', 'aspectRatio']) {
    let v = '';
    Object.defineProperty(style, k, { get: () => v, set: (x: string) => { dom.writes += 1; v = x; }, enumerable: true });
}
const rfNodeEl = box('react-flow__node react-flow__node-object', null);
const mmNode = box('mm-node', rfNodeEl);
const el = {
    ...box('ir-node-content ir-shape--circle', mmNode),
    isConnected: true,
    innerHTML: '<span class="ir-label ir-label--center">Task</span>',
    style,
    get offsetWidth() { dom.reads += 1; return ink.w; },
    get offsetHeight() { dom.reads += 1; return ink.h; },
};
el.classList = { contains: (c: string) => el.className.split(/\s+/).includes(c) };
const ref = { current: el as unknown as HTMLDivElement };

/** The document: <html> and its attributes, <head>, the viewpoint CSS injector, the font set. */
const html = { nodeName: 'HTML', attrs: {} as Record<string, string>, getAttribute(n: string) { return this.attrs[n] ?? null; } };
const head = { nodeName: 'HEAD' };
const injector = { nodeName: 'STYLE', id: 'views-css-injector-d' };
const title = { nodeName: 'TITLE' };
type FontSet = { status: string; ready: Promise<unknown>; listeners: Record<string, Array<() => void>>;
    addEventListener(t: string, f: () => void): void };
let fonts: FontSet;
function fontSet(status: string, ready: Promise<unknown>): FontSet {
    return { status, ready, listeners: {}, addEventListener(t, f) { (this.listeners[t] ??= []).push(f); } };
}

/** MutationObserver as the browser runs it: records queue up, `takeRecords()` drains them, delivery is later. */
class FakeObserver {
    static all: FakeObserver[] = [];
    queue: unknown[] = [];
    targets: unknown[] = [];
    constructor(private cb: (records: unknown[], o: FakeObserver) => void) { FakeObserver.all.push(this); }
    observe(target: unknown) { this.targets.push(target); }
    takeRecords() { const q = this.queue; this.queue = []; return q; }
    disconnect() { this.targets = []; }
    deliver() { const q = this.takeRecords(); if (q.length) this.cb(q, this); }
}
/** The browser queues `record` on every observer watching `via`. */
function mutate(via: unknown, record: Record<string, unknown>): void {
    for (const o of FakeObserver.all) if (o.targets.includes(via)) o.queue.push(record);
}
const deliverAll = () => { for (const o of FakeObserver.all) o.deliver(); };

let useContentDrivenSize: typeof import('../useContentSize').useContentDrivenSize;
function render(form: ShapeForm = 'circle'): void {
    runtime.i = 0;
    runtime.e = 0;
    runtime.pending = [];
    useContentDrivenSize(V, form, ref);
}
const changed = (a?: unknown[], b?: unknown[]) => !a || !b || a.length !== b.length || a.some((x, k) => !Object.is(x, b[k]));
/** The commit: cleanups of the due effects, then the layout bodies, then the passive ones. */
function commit(): void {
    const due = runtime.pending.map((p, k) => !runtime.mounted[k] || changed(runtime.mounted[k].deps, p.deps));
    runtime.pending.forEach((_, k) => { if (due[k]) runtime.mounted[k]?.cleanup?.(); });
    for (const passive of [false, true]) {
        runtime.pending.forEach((p, k) => {
            if (!due[k] || p.passive !== passive) return;
            const cleanup = p.fn();
            runtime.mounted[k] = { deps: p.deps, cleanup: typeof cleanup === 'function' ? cleanup : undefined };
        });
    }
}
function unmount(): void {
    for (const m of runtime.mounted) m?.cleanup?.();
    runtime.mounted = [];
    runtime.slots = [];
}
const node = () => rf.nodes.find(n => n.id === V)!;
/** Mount and settle: the write, then the commit that confirms it. */
function settle(): void {
    render(); commit();
    render(); commit();
    render(); commit();
}
/** One more commit; what it cost in DOM work. */
function step(): { reads: number; writes: number } {
    const r = dom.reads, w = dom.writes;
    render(); commit();
    return { reads: dom.reads - r, writes: dom.writes - w };
}
const tick = () => new Promise<void>(r => setTimeout(r, 0));

const g = globalThis as Record<string, unknown>;
const saved = { getComputedStyle: g.getComputedStyle, document: g.document, MutationObserver: g.MutationObserver };
async function load(fontStatus = 'loaded', ready: Promise<unknown> = Promise.resolve()): Promise<void> {
    fonts = fontSet(fontStatus, ready);
    g.document = {
        documentElement: html, head, fonts,
        getElementById: (id: string) => (id === injector.id ? injector : null),
    };
    vi.resetModules();
    ({ useContentDrivenSize } = await import('../useContentSize'));
}
beforeEach(async () => {
    await tick();
    runtime.slots = [];
    runtime.pending = [];
    runtime.mounted = [];
    runtime.rerenders = 0;
    rf.nodes = [{ id: V }];
    rf.writes = 0;
    redux.state = { viewpoint: null, idlookup: { [V]: { id: V } } };
    dom.reads = 0;
    dom.writes = 0;
    ink = { w: 40, h: 20 };
    cssText = 'background: rgb(255, 255, 255);';
    el.className = 'ir-node-content ir-shape--circle';
    el.innerHTML = '<span class="ir-label ir-label--center">Task</span>';
    el.isConnected = true;
    rfNodeEl.className = 'react-flow__node react-flow__node-object';
    html.attrs = {};
    FakeObserver.all = [];
    g.MutationObserver = FakeObserver;
    g.getComputedStyle = () => ({
        borderLeftWidth: '1px', borderRightWidth: '1px', borderTopWidth: '1px', borderBottomWidth: '1px',
        paddingLeft: '8px', paddingRight: '8px', paddingTop: '4px', paddingBottom: '4px',
    });
    await load();
});
afterEach(() => {
    g.getComputedStyle = saved.getComputedStyle;
    g.document = saved.document;
    g.MutationObserver = saved.MutationObserver;
});

describe('intrinsic measure cache: a commit that changes nothing measured takes no layout', () => {
    it('a hit takes no DOM write and no layout read, and gives back the stored size (kills m3)', () => {
        settle();
        const size = { w: node().width, h: node().height };
        // Positive control: the mount measured and wrote a circle's box.
        expect(dom.reads).toBeGreaterThan(0);
        expect(dom.writes).toBeGreaterThan(0);
        expect(size.w).toBe(size.h);
        for (let i = 0; i < 5; i++) expect(step()).toEqual({ reads: 0, writes: 0 });
        // The ink moves behind the key's back: the stored reading is what the hook uses.
        ink = { w: 400, h: 20 };
        expect(step()).toEqual({ reads: 0, writes: 0 });
        expect({ w: node().width, h: node().height }).toEqual(size);
    });

    it('a content change misses and the box follows (kills m1)', () => {
        settle();
        const before = node().width!;
        el.innerHTML = '<span class="ir-label ir-label--center">Review the order</span>';
        ink = { w: 120, h: 20 };
        expect(step().reads).toBeGreaterThan(0);
        expect(node().width).toBeGreaterThan(before);
    });

    it('a descendant style change with the same text misses', () => {
        settle();
        el.innerHTML = '<span class="ir-label ir-label--center" style="font-size: 20px;">Task</span>';
        ink = { w: 70, h: 30 };
        expect(step().reads).toBeGreaterThan(0);
    });

    it('a class change misses', () => {
        settle();
        el.className = 'ir-node-content ir-shape--circle ir-pad--large';
        expect(step().reads).toBeGreaterThan(0);
    });

    it('an inline style change misses', () => {
        settle();
        cssText = 'background: rgb(255, 255, 255); border-width: 3px;';
        expect(step().reads).toBeGreaterThan(0);
    });

    it('a class change on the React Flow node (partition separator) misses', () => {
        settle();
        rfNodeEl.className = 'react-flow__node react-flow__node-object ir-partition-sep-dashed-v';
        expect(step().reads).toBeGreaterThan(0);
    });

    it('a detached element is measured at every commit and never served from the cache', () => {
        el.isConnected = false;
        settle();
        expect(step().reads).toBeGreaterThan(0);
        expect(step().reads).toBeGreaterThan(0);
    });
});

describe('intrinsic measure cache: the epoch of inherited CSS', () => {
    it('the fonts landing bump the epoch, re-render the host and miss', async () => {
        let land!: () => void;
        await load('loading', new Promise<void>(r => { land = r; }));
        settle();
        expect(step().reads).toBe(0);
        land();
        await tick();
        expect(runtime.rerenders).toBeGreaterThan(0);
        expect(step().reads).toBeGreaterThan(0);
        expect(step().reads).toBe(0);
    });

    it('a font loaded later (loadingdone) bumps the epoch and misses', () => {
        settle();
        for (const f of fonts.listeners.loadingdone ?? []) f();
        expect(step().reads).toBeGreaterThan(0);
    });

    it('a theme change on <html> bumps the epoch and misses, in the same commit (kills m2)', () => {
        settle();
        html.attrs['data-theme'] = 'light';
        mutate(html, { type: 'attributes', target: html, attributeName: 'data-theme', oldValue: null });
        expect(step().reads).toBeGreaterThan(0);
        expect(step().reads).toBe(0);
    });

    it('a theme change delivered by the observer re-renders the host', () => {
        settle();
        html.attrs['data-theme'] = 'light';
        mutate(html, { type: 'attributes', target: html, attributeName: 'data-theme', oldValue: null });
        deliverAll();
        expect(runtime.rerenders).toBeGreaterThan(0);
        expect(step().reads).toBeGreaterThan(0);
    });

    it('a viewpoint style change (the injector text) bumps the epoch and misses', () => {
        settle();
        mutate(injector, { type: 'characterData', target: { nodeName: '#text', parentNode: injector } });
        expect(step().reads).toBeGreaterThan(0);
    });

    it('a stylesheet added to <head> bumps the epoch and misses', () => {
        settle();
        mutate(head, { type: 'childList', target: head, addedNodes: [{ nodeName: 'STYLE' }], removedNodes: [] });
        expect(step().reads).toBeGreaterThan(0);
    });

    it('a <title> change, or an attribute rewritten with its own value, does not bump', () => {
        settle();
        mutate(head, { type: 'childList', target: title, addedNodes: [{ nodeName: '#text' }], removedNodes: [{ nodeName: '#text' }] });
        mutate(html, { type: 'attributes', target: html, attributeName: 'class', oldValue: null });
        expect(step()).toEqual({ reads: 0, writes: 0 });
        deliverAll();
        expect(runtime.rerenders).toBe(0);
    });
});

describe('intrinsic measure cache: unmount', () => {
    it('unmount drops the entry (kills m4)', async () => {
        const { peekIntrinsic } = await import('../intrinsicMeasureCache');
        settle();
        // Positive control: the mount stored a reading for the element.
        expect(peekIntrinsic(el as unknown as HTMLElement)).toBeDefined();
        unmount();
        expect(peekIntrinsic(el as unknown as HTMLElement)).toBeUndefined();
    });
});
