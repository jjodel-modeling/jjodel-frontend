/**
 * setting — the experimental code generation setting and the rule of the «Code» pill (slice S5, P-2026-10-10-1825;
 * R-GEN-2, discovery §E.2, §I.5).
 *
 * The node bench has no `window` and no storage: each test stubs both, a Map-backed `localStorage` and an
 * `EventTarget` as `window`, and drops them after (P11: no state survives a test). The hook is executed twice: under
 * React's server renderer, where `useSyncExternalStore` reads its server snapshot, and with `useSyncExternalStore`
 * replaced by a recorder, so the subscription it hands React is the one called here. The browser side, a checkbox
 * toggled in Settings that mounts the pill without a reload, is the probe's (scripts/probe/codegen-panel.ts).
 * Mutations each test kills are in its name; the bench is in the commit body.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { JjodelEvents } from '../../events/registry';
import {
    CODEGEN_SETTING_KEY, codePillVisible, getCodegenEnabled, setCodegenEnabled, subscribeCodegenEnabled, useCodegenEnabled,
} from '../setting';

function fakeStorage(initial: Record<string, string> = {}): Storage {
    const m = new Map(Object.entries(initial));
    return {
        get length() { return m.size; },
        clear: () => m.clear(),
        getItem: (k: string) => (m.has(k) ? m.get(k)! : null),
        key: (i: number) => [...m.keys()][i] ?? null,
        removeItem: (k: string) => { m.delete(k); },
        setItem: (k: string, v: string) => { m.set(k, String(v)); },
    };
}

/** A `storage` event as another tab sends it: only `key` is read. */
const storageEvent = (key: string | null): Event => Object.assign(new Event('storage'), { key });

let win: EventTarget;

beforeEach(() => {
    win = new EventTarget();
    vi.stubGlobal('window', win);
    vi.stubGlobal('localStorage', fakeStorage());
});

afterEach(() => {
    vi.unstubAllGlobals();
    vi.doUnmock('react');
    vi.resetModules();
});

describe('getCodegenEnabled (kills: default on; any value but "true" read as on)', () => {
    it('is off with no key, and with every value but "true"', () => {
        expect(getCodegenEnabled()).toBe(false);
        for (const v of ['false', '', '1', 'TRUE', 'yes']) {
            localStorage.setItem(CODEGEN_SETTING_KEY, v);
            expect(getCodegenEnabled()).toBe(false);
        }
        localStorage.setItem(CODEGEN_SETTING_KEY, 'true');
        expect(getCodegenEnabled()).toBe(true);
    });

    it('is off with no storage at all, and with a storage that throws', () => {
        vi.stubGlobal('localStorage', undefined);
        expect(getCodegenEnabled()).toBe(false);
        vi.stubGlobal('localStorage', { getItem: () => { throw new Error('denied'); } });
        expect(getCodegenEnabled()).toBe(false);
    });

    it('reads the key jjodel.experimental.codegen (kills: another key)', () => {
        expect(CODEGEN_SETTING_KEY).toBe('jjodel.experimental.codegen');
        localStorage.setItem('jjodel.experimental.codegen', 'true');
        expect(getCodegenEnabled()).toBe(true);
    });
});

describe('setCodegenEnabled (kills: no event; event without the value)', () => {
    it('writes the key and announces the value in this tab', () => {
        const seen: unknown[] = [];
        win.addEventListener(JjodelEvents.EXPERIMENTAL_CODEGEN_CHANGED, e => seen.push((e as CustomEvent).detail));
        setCodegenEnabled(true);
        expect(localStorage.getItem(CODEGEN_SETTING_KEY)).toBe('true');
        expect(getCodegenEnabled()).toBe(true);
        setCodegenEnabled(false);
        expect(getCodegenEnabled()).toBe(false);
        expect(seen).toEqual([{ enabled: true }, { enabled: false }]);
    });

    it('the event is the registry\'s, a jjodel: name of its own', () => {
        expect(JjodelEvents.EXPERIMENTAL_CODEGEN_CHANGED).toBe('jjodel:experimental-codegen-changed');
        const names = Object.values(JjodelEvents);
        expect(names.filter(n => n === JjodelEvents.EXPERIMENTAL_CODEGEN_CHANGED)).toHaveLength(1);
    });
});

describe('subscribeCodegenEnabled (kills: event not listened; storage of any key; no unsubscribe)', () => {
    it('reports this tab\'s event, and another tab\'s storage event on the key or on a clear, nothing else', () => {
        const onChange = vi.fn();
        const off = subscribeCodegenEnabled(onChange);
        setCodegenEnabled(true);
        expect(onChange).toHaveBeenCalledTimes(1);
        win.dispatchEvent(storageEvent(CODEGEN_SETTING_KEY));
        expect(onChange).toHaveBeenCalledTimes(2);
        win.dispatchEvent(storageEvent(null));
        expect(onChange).toHaveBeenCalledTimes(3);
        win.dispatchEvent(storageEvent('jjodel.interfaceMode'));
        expect(onChange).toHaveBeenCalledTimes(3);
        off();
        setCodegenEnabled(false);
        win.dispatchEvent(storageEvent(CODEGEN_SETTING_KEY));
        expect(onChange).toHaveBeenCalledTimes(3);
    });
});

describe('useCodegenEnabled', () => {
    const Probe = () => React.createElement('span', null, String(useCodegenEnabled()));

    it('renders the stored setting (kills: hook reading a constant)', () => {
        expect(renderToStaticMarkup(React.createElement(Probe))).toBe('<span>false</span>');
        localStorage.setItem(CODEGEN_SETTING_KEY, 'true');
        expect(renderToStaticMarkup(React.createElement(Probe))).toBe('<span>true</span>');
    });

    it('hands React a subscription that fires on the change and a snapshot that reads it (kills: hook not subscribed)', async () => {
        let subscribe: ((cb: () => void) => () => void) | null = null;
        let snapshot: (() => boolean) | null = null;
        vi.doMock('react', async () => {
            const actual = await vi.importActual<typeof import('react')>('react');
            return {
                ...actual,
                useSyncExternalStore: (s: (cb: () => void) => () => void, g: () => boolean) => {
                    subscribe = s;
                    snapshot = g;
                    return g();
                },
            };
        });
        vi.resetModules();
        const fresh = await import('../setting');
        expect(fresh.useCodegenEnabled()).toBe(false);
        expect(subscribe).not.toBeNull();
        const onChange = vi.fn();
        const off = subscribe!(onChange);
        fresh.setCodegenEnabled(true);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(snapshot!()).toBe(true);
        off();
        fresh.setCodegenEnabled(false);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(snapshot!()).toBe(false);
    });
});

describe('codePillVisible', () => {
    const lookup = (state?: Record<string, unknown>) => ({
        MM: { className: 'DModel', id: 'MM', ...(state ? { _state: state } : {}) },
        OTHER: { className: 'DModel', id: 'OTHER', _state: { genTemplates: '{"v":1,"templates":[]}' } },
        M: { className: 'DModel', id: 'M', instanceof: 'MM' },
        LOOSE: { className: 'DModel', id: 'LOOSE' },
    });
    const STORED = { genTemplates: '{"v":1,"templates":[{"name":"main","params":[],"body":"\\"x\\""}]}' };

    it('is hidden with the setting off, templates and Advanced mode notwithstanding (kills: pill shown with the setting off)', () => {
        expect(codePillVisible(false, true, lookup(STORED), 'M', true)).toBe(false);
        expect(codePillVisible(false, false, lookup(STORED), 'M', true)).toBe(false);
    });

    it('is hidden on a metamodel editor (kills: M2 accepted)', () => {
        expect(codePillVisible(true, true, lookup(STORED), 'MM', false)).toBe(false);
    });

    it('shows in Advanced mode on a model of any metamodel, templates or not (kills: Advanced ignored)', () => {
        expect(codePillVisible(true, true, lookup(), 'M', true)).toBe(true);
        expect(codePillVisible(true, true, lookup(), 'LOOSE', true)).toBe(true);
    });

    it('shows in Basic mode only when the model\'s own metamodel holds genTemplates (kills: key ignored; another metamodel read)', () => {
        expect(codePillVisible(true, false, lookup(STORED), 'M', true)).toBe(true);
        expect(codePillVisible(true, false, lookup(), 'M', true)).toBe(false);
        expect(codePillVisible(true, false, lookup({ simEnabled: true }), 'M', true)).toBe(false);
        expect(codePillVisible(true, false, lookup({ genTemplates: '' }), 'M', true)).toBe(false);
        expect(codePillVisible(true, false, lookup(STORED), 'LOOSE', true)).toBe(false);
        expect(codePillVisible(true, false, lookup(STORED), 'MISSING', true)).toBe(false);
    });
});
