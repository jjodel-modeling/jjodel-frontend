/**
 * The one entry list behind the syntax chip, View › Syntax and View › Colors (P-2026-11-20-2310), and the registry the
 * View menu reaches the active canvas through. canvasViewChoices.ts imports no store, so it runs here as a unit: every
 * assertion is on what the functions return or call, not on their source.
 */

import { describe, it, expect, vi } from 'vitest';
import {
    ABSTRACT_SYNTAX_SECTION,
    COLORS_DISABLED_TITLE,
    CUSTOM_PALETTES_SECTION,
    NOTATION_OPTIONS,
    VIEWPOINTS_SECTION,
    canvasViewOf,
    colorChoices,
    publishCanvasView,
    retractCanvasView,
    subscribeCanvasViews,
    syntaxChipLabel,
    syntaxChipLabels,
    syntaxChoices,
} from '../canvasViewChoices';
import type { CanvasView, CanvasViewState } from '../canvasViewChoices';

const VIEWPOINTS = [
    { value: 'Pointer_vp_a', label: 'Blueprint', icon: 'bi-eye' },
    { value: 'Pointer_vp_b', label: 'A much longer viewpoint name', icon: 'bi-eye' },
];
const TAB_ENTRIES = [
    { value: '@textual', label: 'Text (Families)', icon: 'bi-file-earmark-text', opensTab: true },
    { value: '@data-manager', label: 'Data manager', icon: 'bi-table', opensTab: true },
];

function makeView(state: Partial<CanvasViewState> = {}) {
    const calls: string[] = [];
    const actions = {
        setNotation: vi.fn((n: string) => { calls.push('setNotation:' + n); }),
        pickSyntax: vi.fn((v: string) => { calls.push('pickSyntax:' + v); }),
        setColorScheme: vi.fn((c: string) => { calls.push('setColorScheme:' + c); }),
        managePalettes: vi.fn(() => { calls.push('managePalettes'); }),
    };
    const view: CanvasView = {
        state: {
            notation: 'uml',
            colorScheme: 'default',
            customPalettes: [],
            shownViewpointId: '',
            concreteSyntaxes: [...VIEWPOINTS, ...TAB_ENTRIES],
            ...state,
        },
        actions: actions as unknown as CanvasView['actions'],
    };
    return { view, actions, calls };
}

describe('syntaxChoices — the order and the headings', () => {
    it('lists the five notations first, under «Abstract syntax», then the viewpoints, then the tab entries', () => {
        const list = syntaxChoices(makeView().view);
        expect(list.map(c => c.label)).toEqual([
            ...NOTATION_OPTIONS.map(o => o.name),
            'Blueprint', 'A much longer viewpoint name', 'Text (Families)', 'Data manager',
        ]);
        expect(list.map(c => c.section ?? null)).toEqual([
            ABSTRACT_SYNTAX_SECTION, null, null, null, null, VIEWPOINTS_SECTION, null, null, null,
        ]);
        // One hairline, above the first entry that opens a tab.
        expect(list.map(c => !!c.sep)).toEqual([false, false, false, false, false, false, false, true, false]);
        expect(list.map(c => !!c.opensTab)).toEqual([false, false, false, false, false, false, false, true, true]);
    });

    it('carries the notations\' one-line descriptions and icons', () => {
        const list = syntaxChoices(makeView().view);
        NOTATION_OPTIONS.forEach((o, i) => {
            expect(list[i].desc).toBe(o.desc);
            expect(list[i].icon).toBe(o.icon);
        });
    });

    it('on a metamodel (no concrete syntax) is the five notations and nothing else', () => {
        const list = syntaxChoices(makeView({ concreteSyntaxes: [] }).view);
        expect(list.map(c => c.label)).toEqual(NOTATION_OPTIONS.map(o => o.name));
    });

    it('puts the hairline on the first tab entry when there is no viewpoint, and no «Viewpoints» heading', () => {
        const list = syntaxChoices(makeView({ concreteSyntaxes: TAB_ENTRIES }).view);
        expect(list.filter(c => c.section === VIEWPOINTS_SECTION)).toHaveLength(0);
        expect(list[5].sep).toBe(true);
    });

    it('gives every entry a distinct key', () => {
        const list = syntaxChoices(makeView().view);
        expect(new Set(list.map(c => c.key)).size).toBe(list.length);
    });
});

describe('syntaxChoices — the check mark', () => {
    it('on abstract syntax, checks the current notation and only it', () => {
        const list = syntaxChoices(makeView({ notation: 'compact' }).view);
        expect(list.filter(c => c.checked).map(c => c.label)).toEqual(['Compact']);
    });

    it('on a viewpoint, checks the viewpoint and no notation', () => {
        const list = syntaxChoices(makeView({ notation: 'compact', shownViewpointId: 'Pointer_vp_b' }).view);
        expect(list.filter(c => c.checked).map(c => c.label)).toEqual(['A much longer viewpoint name']);
    });

    it('never checks an entry that opens a tab, even if its value were the one shown', () => {
        const list = syntaxChoices(makeView({ shownViewpointId: '@data-manager' }).view);
        expect(list.filter(c => c.checked)).toHaveLength(0);
    });
});

describe('syntaxChoices — what an entry runs', () => {
    it('a notation on abstract syntax sets the notation and does not touch the syntax', () => {
        const { view, actions, calls } = makeView();
        syntaxChoices(view)[3].run?.();
        expect(calls).toEqual(['setNotation:wireframe']);
        expect(actions.pickSyntax).not.toHaveBeenCalled();
    });

    it('a notation on a viewpoint brings the tab back to abstract syntax first, then sets the notation', () => {
        const { view, calls } = makeView({ shownViewpointId: 'Pointer_vp_a' });
        syntaxChoices(view)[4].run?.();
        expect(calls).toEqual(['pickSyntax:', 'setNotation:er']);
    });

    it('a viewpoint or a tab entry goes to the old picker handler with its own value', () => {
        const { view, calls } = makeView();
        const list = syntaxChoices(view);
        list[5].run?.();
        list[8].run?.();
        expect(calls).toEqual(['pickSyntax:Pointer_vp_a', 'pickSyntax:@data-manager']);
    });
});

describe('syntaxChipLabel / syntaxChipLabels', () => {
    it('reads the notation on abstract syntax and the viewpoint name on a viewpoint', () => {
        expect(syntaxChipLabel(makeView({ notation: 'simplified' }).view.state)).toBe('Simplified');
        expect(syntaxChipLabel(makeView({ shownViewpointId: 'Pointer_vp_a' }).view.state)).toBe('Blueprint');
    });

    it('falls back to the notation when the viewpoint shown has no entry', () => {
        expect(syntaxChipLabel(makeView({ notation: 'er', shownViewpointId: 'Pointer_gone' }).view.state)).toBe('ER');
    });

    it('falls back to the first notation on an unknown notation', () => {
        expect(syntaxChipLabel(makeView({ notation: 'nope' as never }).view.state)).toBe(NOTATION_OPTIONS[0].name);
    });

    it('lists every label the chip can read, the tab entries excluded, so the chip is as wide as the longest', () => {
        const labels = syntaxChipLabels(makeView().view.state);
        expect(labels).toEqual([...NOTATION_OPTIONS.map(o => o.name), 'Blueprint', 'A much longer viewpoint name']);
        const state = makeView({ shownViewpointId: 'Pointer_vp_b' }).view.state;
        expect(syntaxChipLabels(state)).toContain(syntaxChipLabel(state));
    });
});

describe('colorChoices', () => {
    it('keeps ColorSchemeSelector\'s order: Default, Monochrome, Palette, High Contrast, Print', () => {
        const list = colorChoices(makeView().view);
        expect(list.map(c => c.label)).toEqual(['Default', 'Monochrome', 'Palette', 'High Contrast', 'Print']);
        expect(list[0].desc).toBe('Theme colors');
    });

    it('lists the built-in palettes, the custom ones under their heading, then «Manage palettes…» after a hairline', () => {
        const { view } = makeView({ customPalettes: [{ id: 'custom-1', name: 'Mine', seed: '#123456' }, { id: 'custom-2', name: 'Yours', seed: '#654321' }] });
        const palette = colorChoices(view)[2];
        const children = palette.children ?? [];
        expect(children.map(c => c.label)).toEqual(['Sapphire', 'Amethyst', 'Jade', 'Terracotta', 'Crimson', 'Mine', 'Yours', 'Manage palettes…']);
        expect(children.map(c => c.section ?? null)).toEqual([null, null, null, null, null, CUSTOM_PALETTES_SECTION, null, null]);
        expect(children[children.length - 1].sep).toBe(true);
    });

    it('checks the current scheme, and Palette when the current scheme is one of its children', () => {
        const top = colorChoices(makeView({ colorScheme: 'print' }).view);
        expect(top.filter(c => c.checked).map(c => c.label)).toEqual(['Print']);
        const inPalette = colorChoices(makeView({ colorScheme: 'jade' }).view);
        expect(inPalette.filter(c => c.checked).map(c => c.label)).toEqual(['Palette']);
        expect(inPalette[2].children?.filter(c => c.checked).map(c => c.label)).toEqual(['Jade']);
    });

    it('sets the scheme, and opens the palette editor from «Manage palettes…»', () => {
        const { view, calls } = makeView();
        const list = colorChoices(view);
        list[1].run?.();
        const children = list[2].children ?? [];
        children[0].run?.();
        children[children.length - 1].run?.();
        expect(calls).toEqual(['setColorScheme:monochrome', 'setColorScheme:sapphire', 'managePalettes']);
    });

    it('is disabled, with the old tooltip, while a viewpoint is shown, and live on abstract syntax', () => {
        const onVp = colorChoices(makeView({ shownViewpointId: 'Pointer_vp_a' }).view);
        const all = [...onVp, ...(onVp[2].children ?? [])];
        expect(all.every(c => c.disabled === true && c.title === COLORS_DISABLED_TITLE)).toBe(true);
        const onAbstract = colorChoices(makeView().view);
        expect([...onAbstract, ...(onAbstract[2].children ?? [])].some(c => c.disabled)).toBe(false);
    });
});

describe('the registry of canvases by tab id', () => {
    it('returns what a tab published, null for another tab and for no tab', () => {
        const { view } = makeView();
        publishCanvasView('tab-reg-1', view);
        expect(canvasViewOf('tab-reg-1')).toBe(view);
        expect(canvasViewOf('tab-reg-other')).toBeNull();
        expect(canvasViewOf(null)).toBeNull();
        retractCanvasView('tab-reg-1', view);
    });

    it('withdraws only the view still published: a remount that replaced it keeps its own', () => {
        const first = makeView().view;
        const second = makeView({ notation: 'er' }).view;
        publishCanvasView('tab-reg-2', first);
        publishCanvasView('tab-reg-2', second);
        retractCanvasView('tab-reg-2', first);
        expect(canvasViewOf('tab-reg-2')).toBe(second);
        retractCanvasView('tab-reg-2', second);
        expect(canvasViewOf('tab-reg-2')).toBeNull();
    });

    it('tells its subscribers on publish and on retract, and stops after unsubscribe', () => {
        const listener = vi.fn();
        const unsubscribe = subscribeCanvasViews(listener);
        const { view } = makeView();
        publishCanvasView('tab-reg-3', view);
        retractCanvasView('tab-reg-3', view);
        expect(listener).toHaveBeenCalledTimes(2);
        retractCanvasView('tab-reg-3', view); // nothing published: no change, no call
        expect(listener).toHaveBeenCalledTimes(2);
        unsubscribe();
        publishCanvasView('tab-reg-3', view);
        expect(listener).toHaveBeenCalledTimes(2);
        retractCanvasView('tab-reg-3', view);
    });
});
