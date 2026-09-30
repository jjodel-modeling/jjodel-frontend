/**
 * TryComponent catches once: a fallback that throws is contained under it, not re-caught by it
 * (P-2026-09-30-1540).
 *
 * THE DEFECT, measured on 3061 (discovery `discovery_2026-09-30_empty_state_white_page.md` §4.3): the full
 * fallback is `DefaultView.error`, a `<Measurable draggable>` around `ErrorDisplay`; on a project page
 * `Measurable` throws `$measurable[type] is not a function` on mount, the error reached the same boundary, which
 * rendered the same fallback again: `<Try><Thrower/></Try>` alone gave 53 `componentDidCatch`, "Maximum update
 * depth exceeded" x2 and an empty container.
 *
 * HERE the suite runs in `environment: node`, where React's error-boundary protocol cannot run (no DOM). The
 * test executes the class's own lifecycle methods in React's order; the loop itself is measured by the probe
 * `_tmp_emptystate_try.ts`. `connect` is doubled to hand back the unexported class.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createElement, isValidElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const h = vi.hoisted(() => {
    (globalThis as any).window = (globalThis as any).window ?? {};
    // `Report` reads the URL: a project page, where the measured loop happens.
    (globalThis as any).window.location = { href: 'http://localhost/#/project?id=p1', hash: '#/project?id=p1' };
    const RICH = { marker: 'rich-fallback' };
    return { Cls: undefined as any, RICH, dvError: undefined as any };
});

vi.mock('react-redux', () => ({ connect: () => (C: any) => { h.Cls = C; return C; } }));
vi.mock('../../../redux/store', () => ({ statehistory: {} }));
vi.mock('async-lz-string', () => ({
    compressToBase64: async (s: string) => s, compressToUTF16: async (s: string) => s,
    decompressFromBase64: async (s: string) => s, decompressFromUTF16: async (s: string) => s,
}));
vi.mock('../../../joiner', () => ({
    Log: { allMessages: [], ee: () => {}, e: () => {} },
    U: {
        mailerror: () => ({ mailto: 'mailto:x', gitissue: 'https://example.test' }),
        getOSBrowserData: () => ({}),
        deepReplace: (x: any) => x,
        cropDeepObject: (x: any) => x,
    },
    store: { getState: () => ({ version: { n: 1 } }) },
    transientProperties: {},
    Constructors: { makeID: () => 'err_1' },
    DUser: { getUser: () => ({ autoReport: false }) },
}));
vi.mock('../../../common/DV', () => {
    h.dvError = vi.fn((..._args: any[]) => createElement('span', { className: 'rich' }, h.RICH.marker));
    return { DefaultView: { error: h.dvError } };
});
vi.mock('../../../redux/VersionFixer', () => ({ VersionFixer: { autocorrect: () => {} } }));
vi.mock('../../../common/U', () => ({}));

import { Try } from '../Try';

/** React's `setState`, applied at once: the order of the calls below is React's commit order. */
function mount(children: any) {
    const inst = new h.Cls({ children, stateUpdateTime: 0 });
    inst.setState = (p: any) => { inst.state = { ...inst.state, ...(typeof p === 'function' ? p(inst.state) : p) }; };
    return inst;
}
/** What React does when an error reaches a boundary: the derived state first, a render, then the callback. */
function capture(inst: any, error: Error) {
    inst.state = { ...inst.state, ...h.Cls.getDerivedStateFromError(error) };
    const out = inst.render();
    inst.componentDidCatch(error, { componentStack: '' });
    return out;
}
/** Walk a returned element to the boundary a failing fallback would reach first. */
function guardOf(el: any) {
    expect(isValidElement(el)).toBe(true);
    expect(typeof el.type).toBe('function');
    expect(typeof el.type.getDerivedStateFromError).toBe('function');   // it is an error boundary
    return el;
}

beforeEach(() => {
    h.dvError.mockClear();
    vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('TryComponent — the full fallback is guarded', () => {
    it('POSITIVE CONTROL: the doubled connect handed back the class, and a healthy child renders as is', () => {
        expect(typeof Try).toBe('function');
        const child = createElement('i', null, 'ok');
        const inst = mount(child);

        expect(h.Cls).toBeTruthy();
        expect(inst.render()).toBe(child);
    });

    it('a child error renders the full fallback once, inside a guard', () => {
        const inst = mount(createElement('i'));

        const el = capture(inst, new Error('child throws'));

        expect(h.dvError).toHaveBeenCalledTimes(1);
        const guard = guardOf(el);
        expect(renderToStaticMarkup(guard.props.children)).toContain(h.RICH.marker);
    });

    // ---- the load-bearing assertion ----
    it('when the full fallback throws, the guard shows the plain message and TryComponent is not reached', () => {
        const inst = mount(createElement('i'));
        const didCatch = vi.spyOn(inst, 'componentDidCatch');
        const el = guardOf(capture(inst, new Error('child throws')));

        // The fallback's mount throws: the nearest boundary above it is the guard, not TryComponent.
        const Guard = el.type;
        const g = new Guard(el.props);
        g.state = { ...g.state, ...Guard.getDerivedStateFromError(new Error('$measurable[type] is not a function')) };
        const plain = g.render();

        const html = renderToStaticMarkup(plain);
        expect(html).not.toContain(h.RICH.marker);
        expect(html).toContain('child throws');                    // the plain fallback names the child's error
        expect(didCatch).toHaveBeenCalledTimes(1);                  // catches once
        expect(h.dvError).toHaveBeenCalledTimes(1);
    });

    it('PER CONTRASTO: a guard whose fallback does not throw renders the full fallback', () => {
        const inst = mount(createElement('i'));
        const el = guardOf(capture(inst, new Error('child throws')));

        const g = new el.type(el.props);

        expect(renderToStaticMarkup(g.render())).toContain(h.RICH.marker);
    });
});
