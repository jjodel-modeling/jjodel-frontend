/**
 * The boot script of index.html, executed (P-2026-10-10-0910, D-UI-15).
 *
 * Jjodel has no dark theme. The inline script that runs before React mounts is the only
 * place the app writes `data-theme` on <html>: it keeps a stored 'light' (the second light
 * state, B, of docs/discovery/discovery_2026-10-10_dark_theme_removal.md §3.1) and must
 * ignore a stored 'dark', so a returning dark user opens in the default light state A.
 *
 * The script is read from index.html and run in a vm context with a fake localStorage and
 * a fake documentElement: the subject runs, its source is not matched.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';

const HTML = readFileSync(resolve(__dirname, '../../index.html'), 'utf8');

/** Every inline <script> of index.html (no src attribute), in document order. */
const INLINE = [...HTML.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);

function boot(stored: string | null) {
    const store = new Map<string, string>();
    if (stored !== null) store.set('theme', stored);
    const writes: string[] = [];
    const attrs = new Map<string, string>();
    const localStorage = {
        getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
        setItem: (k: string, v: string) => { writes.push(`set ${k}=${v}`); store.set(k, String(v)); },
        removeItem: (k: string) => { writes.push(`remove ${k}`); store.delete(k); },
    };
    const documentElement = {
        setAttribute: (k: string, v: string) => { attrs.set(k, String(v)); },
        getAttribute: (k: string) => (attrs.has(k) ? attrs.get(k)! : null),
        removeAttribute: (k: string) => { attrs.delete(k); },
    };
    for (const src of INLINE) runInNewContext(src, { localStorage, document: { documentElement } });
    return { theme: documentElement.getAttribute('data-theme'), writes, stored: localStorage.getItem('theme') };
}

describe('index.html boot script — the theme it restores', () => {
    it('control: index.html has an inline script, and it reads the stored theme', () => {
        expect(INLINE.length).toBeGreaterThan(0);
        expect(boot('light').theme).toBe('light');
    });

    it("a stored 'dark' sets no data-theme: the page opens in light state A", () => {
        expect(boot('dark').theme).toBeNull();
    });

    it("a stored 'light' keeps data-theme=\"light\" (state B, unchanged)", () => {
        expect(boot('light').theme).toBe('light');
    });

    it('nothing stored, or any other value: no attribute (state A, the default)', () => {
        expect(boot(null).theme).toBeNull();
        expect(boot('blue').theme).toBeNull();
    });

    it("the stored value is never written or removed: a 'dark' stays in storage, unread", () => {
        const r = boot('dark');
        expect(r.writes).toEqual([]);
        expect(r.stored).toBe('dark');
    });
});
