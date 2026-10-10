/**
 * Settings > Appearance offers no theme choice (P-2026-10-10-0910, D-UI-15).
 *
 * The component is rendered to a string in node: what a user would see is what is asserted.
 * Rendering it must not write the theme either: until this lane the Appearance section, on
 * mount, wrote `data-theme="light"` and `localStorage.theme = 'light'` for a user who had
 * stored nothing, moving them from light state A to light state B
 * (docs/discovery/discovery_2026-10-10_dark_theme_removal.md §3.1).
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { AppearanceSettings } from '../AppearanceSettings';

const g = globalThis as any;
let writes: string[];
let saved: { localStorage: unknown; document: unknown };

beforeEach(() => {
    writes = [];
    saved = { localStorage: g.localStorage, document: g.document };
    // Fakes for the base, whose Appearance section read and wrote both at mount.
    g.localStorage = {
        getItem: () => null,
        setItem: (k: string, v: string) => { writes.push(`localStorage ${k}=${v}`); },
        removeItem: (k: string) => { writes.push(`localStorage remove ${k}`); },
    };
    g.document = {
        documentElement: {
            getAttribute: () => null,
            setAttribute: (k: string, v: string) => { writes.push(`attr ${k}=${v}`); },
        },
    };
});

afterEach(() => {
    g.localStorage = saved.localStorage;
    g.document = saved.document;
});

const render = () => renderToString(createElement(AppearanceSettings));

describe('Settings > Appearance — no theme choice', () => {
    it('control: the section renders its placeholder', () => {
        expect(render()).toContain('Coming Soon');
    });

    it('no theme radio, no Dark option, no moon icon', () => {
        const html = render();
        expect(html).not.toMatch(/name="theme"/);
        expect(html).not.toMatch(/>\s*Dark\s*</);
        expect(html).not.toContain('bi-moon');
    });

    it('rendering it writes neither data-theme nor localStorage.theme', () => {
        render();
        expect(writes).toEqual([]);
    });
});
