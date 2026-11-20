/**
 * How a diagram canvas is seen: its syntax (the five notations of the abstract syntax, the viewpoints, and the
 * entries that open a sibling tab) and its colors (P-2026-11-20-2310).
 *
 * One definition for the two places that offer these choices: the syntax chip of the editor bar, which acts on its
 * own canvas, and the View menu of the topbar (Syntax, Colors), which acts on the canvas of the active tab. Neither
 * holds a list of its own; both render what `syntaxChoices` and `colorChoices` return.
 *
 * No state lives here. Notation and colors stay EditorV2 state seeded from their global localStorage keys, the
 * syntax stays the tab's viewpoint (EditorSwitch): each canvas publishes what it shows and the setters it already
 * has, keyed by its tab id, and the View menu reads the entry of the active tab.
 */

import { useSyncExternalStore } from 'react';
import type { NotationMode, ActiveColorScheme, CustomColorScheme } from './types';
import { MAIN_OPTIONS, PALETTE_OPTIONS } from './components/ColorSchemeSelector';
import { JjodelEvents } from '../../events/registry';

/** The notations of the abstract syntax. Moved here from Toolbar.tsx, where the notation dropdown used it. */
export const NOTATION_OPTIONS: Array<{ id: NotationMode; name: string; desc: string; icon: string }> = [
    { id: 'uml',        name: 'Structured',        desc: 'Class diagram like',  icon: 'bi-diagram-3' },
    { id: 'simplified',  name: 'Simplified', desc: 'Names only, minimal',     icon: 'bi-list' },
    { id: 'compact',     name: 'Compact',    desc: 'Headers only',            icon: 'bi-textarea' },
    { id: 'wireframe',   name: 'Wireframe',  desc: 'Blueprint style',         icon: 'bi-bounding-box-circles' },
    { id: 'er',          name: 'ER',         desc: 'Entity-Relationship',     icon: 'bi-database' },
];

export const ABSTRACT_SYNTAX_SECTION = 'Abstract syntax';
export const VIEWPOINTS_SECTION = 'Viewpoints';
export const CUSTOM_PALETTES_SECTION = 'Your palettes';
/** The tooltip ColorSchemeSelector's trigger carried while a viewpoint was active, unchanged. */
export const COLORS_DISABLED_TITLE = 'The active viewpoint defines the colors — switch to Abstract syntax to change them';
const NOTATION_VALUE_PREFIX = 'notation:';

/** A syntax the canvas can show beside its notations: a viewpoint, or an entry that opens a sibling tab. */
export interface ConcreteSyntaxOption {
    /** A viewpoint id, or a sentinel of dataManagerOption.ts. */
    readonly value: string;
    readonly label: string;
    /** Bootstrap class, without the `bi ` prefix. */
    readonly icon: string;
    /** Opens another tab (Text, Data manager) instead of changing what this canvas shows. */
    readonly opensTab?: boolean;
}

/** What a canvas shows, as far as the choices need to know. */
export interface CanvasViewState {
    readonly notation: NotationMode;
    readonly colorScheme: ActiveColorScheme;
    readonly customPalettes: readonly CustomColorScheme[];
    /** '' is abstract syntax, otherwise the viewpoint id the tab shows. */
    readonly shownViewpointId: string;
    /** In picker order: the viewpoints, then the entries that open a tab. Empty on a metamodel. */
    readonly concreteSyntaxes: readonly ConcreteSyntaxOption[];
}

/** The setters the canvas already had; nothing here writes state of its own. */
export interface CanvasViewActions {
    setNotation(notation: NotationMode): void;
    /** '' (abstract syntax), a viewpoint id, or a sentinel: the old picker's handler. */
    pickSyntax(value: string): void;
    setColorScheme(scheme: ActiveColorScheme): void;
    /** Opens the palette editor (create, rename, delete), the one ColorSchemeSelector already holds. */
    managePalettes(): void;
}

export interface CanvasView {
    readonly state: CanvasViewState;
    readonly actions: CanvasViewActions;
}

/** One entry of the chip's popover, of View › Syntax, or of View › Colors. */
export interface ViewChoice {
    readonly key: string;
    /** For the syntax entries: `notation:<id>`, a viewpoint id or a sentinel. For colors: the scheme id. */
    readonly value: string;
    readonly label: string;
    readonly desc?: string;
    /** Bootstrap class, without the `bi ` prefix. */
    readonly icon: string;
    readonly checked: boolean;
    readonly disabled?: boolean;
    /** Why the entry is disabled, when it is. */
    readonly title?: string;
    /** A heading drawn above this entry. Not an entry: no focus, no click. */
    readonly section?: string;
    /** A hairline drawn above this entry. */
    readonly sep?: boolean;
    readonly opensTab?: boolean;
    /** A submenu (Colors › Palette). */
    readonly children?: readonly ViewChoice[];
    readonly run?: () => void;
}

/** The syntax entries: the notations under «Abstract syntax», the viewpoints, then the entries that open a tab. */
export function syntaxChoices({ state, actions }: CanvasView): ViewChoice[] {
    const abstract = state.shownViewpointId === '';
    const out: ViewChoice[] = NOTATION_OPTIONS.map((o, i) => ({
        key: NOTATION_VALUE_PREFIX + o.id,
        value: NOTATION_VALUE_PREFIX + o.id,
        label: o.name,
        desc: o.desc,
        icon: o.icon,
        checked: abstract && state.notation === o.id,
        section: i === 0 ? ABSTRACT_SYNTAX_SECTION : undefined,
        // A notation is a variant of the abstract syntax: chosen on a viewpoint, it brings the tab back to it.
        run: () => { if (!abstract) actions.pickSyntax(''); actions.setNotation(o.id); },
    }));
    const firstViewpoint = state.concreteSyntaxes.findIndex(c => !c.opensTab);
    const firstTabEntry = state.concreteSyntaxes.findIndex(c => !!c.opensTab);
    state.concreteSyntaxes.forEach((c, i) => out.push({
        key: 'syntax:' + c.value,
        value: c.value,
        label: c.label,
        icon: c.icon,
        checked: !c.opensTab && c.value === state.shownViewpointId,
        section: i === firstViewpoint ? VIEWPOINTS_SECTION : undefined,
        sep: i === firstTabEntry,
        opensTab: c.opensTab,
        run: () => actions.pickSyntax(c.value),
    }));
    return out;
}

/** What the chip reads: the notation on abstract syntax, the viewpoint's name otherwise. */
export function syntaxChipLabel(state: CanvasViewState): string {
    if (state.shownViewpointId !== '') {
        const vp = state.concreteSyntaxes.find(c => !c.opensTab && c.value === state.shownViewpointId);
        if (vp) return vp.label;
    }
    return (NOTATION_OPTIONS.find(o => o.id === state.notation) ?? NOTATION_OPTIONS[0]).name;
}

/** Every label the chip can read for this canvas: the chip is as wide as the longest, so a change does not shift. */
export function syntaxChipLabels(state: CanvasViewState): string[] {
    return [...NOTATION_OPTIONS.map(o => o.name), ...state.concreteSyntaxes.filter(c => !c.opensTab).map(c => c.label)];
}

/** The color entries, in ColorSchemeSelector's order: Default, Monochrome, Palette ›, High Contrast, Print. */
export function colorChoices({ state, actions }: CanvasView): ViewChoice[] {
    // As before: a viewpoint defines its own colors, so the scheme is inert while one is shown.
    const disabled = state.shownViewpointId !== '';
    const title = disabled ? COLORS_DISABLED_TITLE : undefined;
    const scheme = (id: string, label: string, icon: string, desc?: string, section?: string): ViewChoice => ({
        key: 'color:' + id, value: id, label, desc, icon, section, disabled, title,
        checked: state.colorScheme === id,
        run: () => actions.setColorScheme(id as ActiveColorScheme),
    });
    const palettes: ViewChoice[] = PALETTE_OPTIONS.map(o => scheme(o.id, o.name, 'bi-gem'));
    state.customPalettes.forEach((p, i) => palettes.push(scheme(p.id, p.name, 'bi-gem', undefined, i === 0 ? CUSTOM_PALETTES_SECTION : undefined)));
    palettes.push({
        key: 'color:manage', value: '', label: 'Manage palettes…', icon: 'bi-sliders', checked: false, sep: true,
        disabled, title, run: () => actions.managePalettes(),
    });
    const [def, mono, contrast, print] = MAIN_OPTIONS;
    return [
        scheme(def.id, def.name, def.icon, def.desc),
        scheme(mono.id, mono.name, mono.icon, mono.desc),
        { key: 'color:palette', value: '', label: 'Palette', icon: 'bi-gem', checked: palettes.some(c => c.checked), disabled, title, children: palettes },
        scheme(contrast.id, contrast.name, contrast.icon, contrast.desc),
        scheme(print.id, print.name, print.icon, print.desc),
    ];
}

/* ── The canvases, by tab id ─────────────────────────────────────────────── */

const views = new Map<string, CanvasView>();
const listeners = new Set<() => void>();

/** A canvas publishes what it shows each time that changes; the View menu re-renders on it. */
export function publishCanvasView(tabId: string, view: CanvasView): void {
    views.set(tabId, view);
    listeners.forEach(l => l());
}

/** On unmount. Only the view still published is withdrawn: a remount of the same tab may have replaced it. */
export function retractCanvasView(tabId: string, view: CanvasView): void {
    if (views.get(tabId) !== view) return;
    views.delete(tabId);
    listeners.forEach(l => l());
}

export function canvasViewOf(tabId: string | null | undefined): CanvasView | null {
    return tabId ? views.get(tabId) ?? null : null;
}

/** Also fires on ACTIVE_TAB: the active tab moves without any canvas publishing. */
export function subscribeCanvasViews(listener: () => void): () => void {
    listeners.add(listener);
    const onTab = () => listener();
    if (typeof window !== 'undefined') window.addEventListener(JjodelEvents.ACTIVE_TAB, onTab);
    return () => {
        listeners.delete(listener);
        if (typeof window !== 'undefined') window.removeEventListener(JjodelEvents.ACTIVE_TAB, onTab);
    };
}

/** The canvas of the tab `resolveTabId` names (the View menu passes the dock's active tab), null when none is one. */
export function useCanvasViewOf(resolveTabId: () => string | null): CanvasView | null {
    return useSyncExternalStore(subscribeCanvasViews, () => canvasViewOf(resolveTabId()));
}
