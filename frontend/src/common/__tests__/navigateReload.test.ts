/**
 * hashReload — the hash set and the reload of R.navigate, and what happens when the user cancels the reload at the
 * unsaved-changes prompt ("Stay on page") (P-2026-09-25-1905).
 *
 * The browser prompt cannot run in the bench: the fake window below replays what Chromium does, as measured in
 * discovery_2026-09-25_navigate_cancel.md §2.4. Setting the hash fires a `push` navigate event. `reload()` aborts
 * that one, then fires its own `reload` navigate event, and on "Stay" aborts it before `reload()` returns. The
 * real prompt is held by the probes of that report (§6, P1-P5).
 */
import { describe, it, expect } from 'vitest';
import { hashReload } from '../navigateReload';
import type { ReloadNavigateEvent, ReloadWindow } from '../navigateReload';

type FakeOptions = { stay?: boolean, noNavigationApi?: boolean, pushEvent?: boolean };
const SHOWN = 'http://localhost:3000/#/project?id=Pointer_A';

function fakeWindow(opts: FakeOptions) {
    const calls: string[] = [];
    const flags: boolean[] = [];
    const listeners: ((e: ReloadNavigateEvent) => void)[] = [];
    let href = SHOWN;
    let abortPush: (() => void) | undefined;
    // Fires a navigate event of this type at the current listeners; returns the function that aborts its signal.
    const fire = (navigationType: string): (() => void) => {
        const onAbort: (() => void)[] = [];
        const e: ReloadNavigateEvent = { navigationType, signal: { addEventListener: (_t, l) => { onAbort.push(l); } } };
        for (const l of listeners.slice()) l(e);
        return () => onAbort.forEach(l => l());
    };
    const win: ReloadWindow = {
        location: {
            get href() { return href; },
            get hash() { return href.slice(href.indexOf('#')); },
            set hash(h: string) {
                calls.push('hash ' + h);
                href = href.slice(0, href.indexOf('#')) + h;
                if (opts.pushEvent) abortPush = fire('push');
            },
            reload() {
                calls.push('reload');
                abortPush?.(); // the reload supersedes the hash's own navigation, whatever the user answers
                const abortReload = fire('reload');
                if (opts.stay) abortReload();
            },
            replace(url: string) { calls.push('replace ' + url); href = url; },
        },
        navigation: opts.noNavigationApi ? undefined : {
            addEventListener(_t, l) { calls.push('listen'); listeners.push(l); },
            removeEventListener(_t, l) { calls.push('unlisten'); const i = listeners.indexOf(l); if (i >= 0) listeners.splice(i, 1); },
        },
    };
    const setNavigating = (v: boolean) => { calls.push('navigating ' + v); flags.push(v); };
    return { win, calls, flags, setNavigating, listeners, href: () => href };
}

describe('hashReload', () => {
    it('V1 a reload aborted inside reload() ("Stay") puts back the shown URL and lets actions through', () => {
        const f = fakeWindow({ stay: true });
        const proceeded = hashReload(f.win, '#/project?id=Pointer_B', f.setNavigating);
        expect(proceeded).toBe(false);
        expect(f.calls).toContain('replace ' + SHOWN);
        expect(f.href()).toBe(SHOWN);
        expect(f.flags[f.flags.length - 1]).toBe(false);
        expect(f.listeners.length).toBe(0);
    });

    it('V2 a reload not aborted ("Leave") keeps the target URL and the flag up until unload, as today', () => {
        const f = fakeWindow({ stay: false });
        const proceeded = hashReload(f.win, '#/project?id=Pointer_B', f.setNavigating);
        expect(proceeded).toBe(true);
        expect(f.calls.some(c => c.startsWith('replace'))).toBe(false);
        expect(f.href()).toBe('http://localhost:3000/#/project?id=Pointer_B');
        expect(f.flags).toEqual([true]);
        expect(f.listeners.length).toBe(0);
    });

    it('V3 the abort of the hash\'s own push navigation is not a cancelled reload', () => {
        // Measured on every run, Stay and Leave alike: reload() aborts the push that setting the hash started.
        const f = fakeWindow({ stay: false, pushEvent: true });
        const proceeded = hashReload(f.win, '#/allProjects', f.setNavigating);
        expect(proceeded).toBe(true);
        expect(f.calls.some(c => c.startsWith('replace'))).toBe(false);
        expect(f.flags).toEqual([true]);
    });

    it('V4 the order: listen, flag up, hash, reload, then on cancel replace and flag down, all before returning', () => {
        // Kills M6 (the flag raised after reload()), with V5's exact call list: no outcome differs in the bench, only
        // the order, and a probe cannot see it either (the dying page lives 8-44 ms and dispatches are deferred).
        const f = fakeWindow({ stay: true, pushEvent: true });
        hashReload(f.win, '#/allProjects', f.setNavigating);
        expect(f.calls).toEqual([
            'listen', 'navigating true', 'hash #/allProjects', 'reload', 'unlisten', 'replace ' + SHOWN, 'navigating false',
        ]);
    });

    it('V5 without the Navigation API nothing is known, so the reload is taken as proceeding, as today', () => {
        const f = fakeWindow({ stay: true, noNavigationApi: true });
        const proceeded = hashReload(f.win, '#/project?id=Pointer_B', f.setNavigating);
        expect(proceeded).toBe(true);
        expect(f.calls).toEqual(['navigating true', 'hash #/project?id=Pointer_B', 'reload']);
        expect(f.flags).toEqual([true]);
    });
});
