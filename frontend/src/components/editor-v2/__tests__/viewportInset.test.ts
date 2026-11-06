/**
 * The canvas right inset is not read during a render (P-2026-10-21-1010).
 *
 * `fitViewOptions={{ padding: fitPadding() }}` called `getComputedStyle(document.body)` in every `EditorV2Inner`
 * render, a document-wide style recalc per render (round 3 report §3.4: 177 ms of a viewpoint switch, 43-54 per
 * click). `useFitViewOptions` reads a cached inset that the publisher's own write refreshes: the publisher sets the
 * variable inline on <body>, a MutationObserver on the body's `style` attribute sees it.
 *
 * ── The subject runs ────────────────────────────────────────────────────────
 * `window`, `document.body`, `getComputedStyle` and `MutationObserver` are stand-ins; the body's inline style is a
 * map, `getComputedStyle` answers from it and counts its calls, the observer's callback is fired by the test where
 * the browser would fire it. Each render is a real render of a component that calls the hook, through
 * react-dom/server. The module is loaded fresh per test: its cache is module state.
 *
 * Mutation bench (P11): (m3) the inset read back in the render dies on «twenty renders, no style read».
 * Gap: the call site (`EditorV2.tsx`, `fitViewOptions={fitViewOptions}`) is not executable here, because
 * EditorV2 imports the joiner barrel (`window is not defined`); it is a one-line read of this hook.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const inline = new Map<string, string>();
let gcsCalls = 0;
let observers: Array<() => void> = [];

beforeEach(() => {
    vi.resetModules();
    inline.clear();
    gcsCalls = 0;
    observers = [];
    const body = {
        style: {
            getPropertyValue: (k: string) => inline.get(k) ?? '',
            setProperty: (k: string, v: string) => { inline.set(k, v); },
            removeProperty: (k: string) => { inline.delete(k); },
        },
    };
    vi.stubGlobal('window', {});
    vi.stubGlobal('document', { body });
    vi.stubGlobal('getComputedStyle', () => {
        gcsCalls += 1;
        return { getPropertyValue: (k: string) => inline.get(k) ?? '' };
    });
    vi.stubGlobal('MutationObserver', class {
        constructor(private cb: () => void) {}
        observe() { observers.push(() => this.cb()); }
        disconnect() {}
    });
});
afterEach(() => {
    vi.unstubAllGlobals();
});

/** The publisher's write, then the observer's callback where the browser would run it. */
function publish(v: string | null): void {
    if (v === null) inline.delete('--jj-canvas-right-inset');
    else inline.set('--jj-canvas-right-inset', v);
    for (const fire of observers) fire();
}

async function renderer() {
    const mod = await import('../viewportInset');
    const Probe = () => createElement('pre', null, JSON.stringify(mod.useFitViewOptions()));
    return {
        mod,
        render: () => JSON.parse(renderToStaticMarkup(createElement(Probe)).replace(/^<pre>|<\/pre>$/g, '').replace(/&quot;/g, '"')),
    };
}

describe('viewportInset: the inset is not read during a render', () => {
    it('twenty renders, no style read once the cache is primed (m3)', async () => {
        publish('312px');
        const { render } = await renderer();
        render();
        const primed = gcsCalls;
        // Positive control: the priming read went through the computed style.
        expect(primed).toBe(1);
        for (let i = 0; i < 20; i++) render();
        expect(gcsCalls).toBe(primed);
    });

    it('the publisher\'s write reaches the next render', async () => {
        const { render } = await renderer();
        expect(render()).toEqual({ padding: 0.2, maxZoom: 1 });
        publish('312px');
        expect(render()).toEqual({ padding: { top: 0.2, bottom: 0.2, left: 0.2, right: '332px' }, maxZoom: 1 });
        publish(null);
        expect(render()).toEqual({ padding: 0.2, maxZoom: 1 });
    });

    it('a body style write that is not the inset costs no style read', async () => {
        publish('312px');
        const { render } = await renderer();
        render();
        const before = gcsCalls;
        inline.set('cursor', 'grabbing');
        for (const fire of observers) fire();
        render();
        expect(gcsCalls).toBe(before);
    });

    it('fitPadding, read outside the render, keeps its values', async () => {
        const { mod } = await renderer();
        expect(mod.fitPadding()).toBe(0.2);
        publish('100px');
        expect(mod.fitPadding(0.3)).toEqual({ top: 0.3, bottom: 0.3, left: 0.3, right: '120px' });
    });
});
