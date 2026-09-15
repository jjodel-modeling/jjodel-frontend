import { Fragment, useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import type { NotationMode, ActiveColorScheme, CustomColorScheme } from './types';
import ColorSchemeSelector from './components/ColorSchemeSelector';
import HighlightPalette from './components/HighlightPalette';
// Geometry of the portalled syntax menu. Imported, not re-derived: this helper is the
// one implementation `InlineObjectSelect`, `InlineEnumSelect` and `ReferencePicker`
// already share, so the flip-up, the viewport clamp and the `fixed` frame stay one
// thing. A fourth copy is exactly what the prompt asked not to write.
import { computeListStyle } from './components/InlineObjectSelect';
import { LayoutMode, getSavedLayoutMode, saveLayoutMode } from '../abstract/Dock';
import { isProjectOverviewPage } from '../../utils/navigationUtils';
import { Defaults, isDataManagerViewpoint, isDataManagerViewpointId, LPointerTargetable, LViewPoint, store } from '../../joiner';
import type { DViewPoint, LModel } from '../../joiner';
import {
    DATA_MANAGER_OPTION_ICON,
    DATA_MANAGER_OPTION_LABEL,
    DATA_MANAGER_OPTION_VALUE,
    isDataManagerOption,
} from './dataManagerOption';
import { activateViewpoint } from '../../utils/lastViewpoint';
import DockManager from '../abstract/DockManager';
import { JjodelEvents } from '../../events/registry';
import { useTreeViewPanel } from '../../contexts/TreeViewPanelContext';
// TODO: cleanup — `ValidationPill` is no longer rendered here (2026-08-26). The import is
// dropped, the component is not: it is the only conformance summary in the codebase and
// the aggregated Problems panel it defers to (WP2-D) is still to be built.

interface ToolbarProps {
    snapEnabled: boolean;
    onToggleSnap: () => void;
    // TODO: cleanup — `onFitView` has had no call site since the fit button left the
    // command group (2026-08-26). Kept, with the prop EditorV2 passes, until the bar
    // is settled at screen: the handler behind it is one line and reinstating the
    // button must not mean re-plumbing it.
    onFitView: () => void;
    onDeleteSelected: () => void;
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    notation: NotationMode;
    onNotationChange: (notation: NotationMode) => void;
    onAutoLayout?: () => void;
    onDuplicateSelected?: () => void;
    colorScheme: ActiveColorScheme;
    onColorSchemeChange: (scheme: ActiveColorScheme) => void;
    customPalettes: CustomColorScheme[];
    onCreateCustomPalette: (name: string, seed: string) => void;
    onRenamePalette: (id: string, name: string) => void;
    onDeletePalette: (id: string) => void;
    // Zoom controls
    zoomLevel?: number;
    onZoomIn?: () => void;
    onZoomOut?: () => void;
    onResetZoom?: () => void;
    // Alignment (inline — replaces undo/redo group when 2+ selected)
    selectedCount?: number;
    onAlignLeft?: () => void;
    onAlignCenterV?: () => void;
    onAlignRight?: () => void;
    onAlignTop?: () => void;
    onAlignCenterH?: () => void;
    onAlignBottom?: () => void;
    onDistributeH?: () => void;
    onDistributeV?: () => void;
    /** Metamodel tab. Also picks the `M` / `m` letter of the identity badge. */
    isMetamodel?: boolean;
    /** Open model id — resolves the model name shown in the identity block, flush right. */
    modelId?: string;
    editorMode?: 'flow' | 'classic' | 'split';
    hasViewpoint?: boolean;
    onEditorModeChange?: (mode: 'flow' | 'classic' | 'split') => void;
    // Highlight mode palette (rendered only when highlight mode is active)
    highlightModeActive?: boolean;
    activeHighlightColor?: number;
    onSelectHighlightColor?: (n: number) => void;
    onClearHighlights?: () => void;
}

/* ── Syntax picker (NAV2) ────────────────────────────────────────────────────
   The entries of the viewpoint picker, and the ids the listbox needs.

   The VOCABULARY is NAV1's, unchanged: the empty string is «Abstract syntax», one
   entry per non-system `DViewPoint`, and the `@data-manager` sentinel last. What
   NAV2 adds is what a native `<option>` could not carry — a glyph per entry, and a
   selected state drawn in the ratified cyan.

   `bi-eye` for the concrete syntaxes because that is already the viewpoint glyph in
   this bar: it sits on the picker itself and on every entry of the views menu beside
   it. `bi-diagram-3` for the abstract syntax is the class-diagram glyph the notation
   selector uses for «Structured», the notation abstract syntax draws through. */
interface SyntaxEntry {
    /** The value handed to `handleViewpointChange`: '' , a viewpoint id, or the sentinel. */
    value: string;
    label: string;
    /** Bootstrap class, without the `bi ` prefix. */
    icon: string;
    /** A hairline is drawn ABOVE this entry. Not an entry of its own — see below. */
    sep?: boolean;
}

const ABSTRACT_SYNTAX_ENTRY: SyntaxEntry = { value: '', label: 'Abstract syntax', icon: 'bi-diagram-3' };
const VIEWPOINT_ENTRY_ICON = 'bi-eye';

/** `aria-controls` / `aria-activedescendant` need ids, and the listbox is portalled onto
 *  `document.body` — outside the toolbar's subtree, where a scoped id would not help. One
 *  picker is on screen per active pane, so a constant is enough. */
const SYNTAX_LISTBOX_ID = 'toolbar-syntax-listbox';
const syntaxOptionId = (i: number) => `toolbar-syntax-option-${i}`;

const NOTATION_OPTIONS: Array<{ id: NotationMode; name: string; desc: string; icon: string }> = [
    { id: 'uml',        name: 'Structured',        desc: 'Class diagram like',  icon: 'bi-diagram-3' },
    { id: 'simplified',  name: 'Simplified', desc: 'Names only, minimal',     icon: 'bi-list' },
    { id: 'compact',     name: 'Compact',    desc: 'Headers only',            icon: 'bi-textarea' },
    { id: 'wireframe',   name: 'Wireframe',  desc: 'Blueprint style',         icon: 'bi-bounding-box-circles' },
    { id: 'er',          name: 'ER',         desc: 'Entity-Relationship',     icon: 'bi-database' },
];

/**
 * Compact toolbar (Row 2) for the editor.
 *
 * Layout:
 * [↶][↷][⧉][🗑] | VIEW [Structured ▾] [Theme: X ▾] | LAYOUT [⊞][⊟] | [👁 Abstract syntax ▾] | ——spacer—— | ┌[−] 100% [+] ┊ [»]┐ │(m) model_1            ⌄
 *
 * The viewpoint selector is the syntax control (R-IRN-10): it replaced the separate
 * [● Abstract syntax] pill that used to sit beside it and only restated its state.
 *
 * The right end is the chrome of the canvas as a surface (2026-08-26): one bordered
 * group for zoom and the rail collapse, then the identity of the open model. It
 * absorbed the rail's own 44px header, which used to repeat that identity a second
 * time one column over.
 *
 * Revision 2b: that identity is no longer an item flush with the bar's right edge but
 * a CELL the width of the rail below it (`--jj-rail-width`), sharing the rail's left
 * hairline — so the bar is split into a canvas zone, which the command group closes,
 * and a rail zone, which the model name heads. Collapse the rail and the cell goes
 * with it, leaving the group flush right as before.
 */
// SVG icons for alignment tools (moved from AlignmentToolbar)
const AlignIcons = {
    left: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="1" y="1" width="1.5" height="14" rx="0.5" />
            <rect x="4" y="3" width="10" height="3" rx="0.5" />
            <rect x="4" y="9" width="7" height="3" rx="0.5" />
        </svg>
    ),
    centerV: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="7.25" y="1" width="1.5" height="14" rx="0.5" opacity="0.4" />
            <rect x="2" y="3" width="12" height="3" rx="0.5" />
            <rect x="3.5" y="9" width="9" height="3" rx="0.5" />
        </svg>
    ),
    right: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="13.5" y="1" width="1.5" height="14" rx="0.5" />
            <rect x="2" y="3" width="10" height="3" rx="0.5" />
            <rect x="5" y="9" width="7" height="3" rx="0.5" />
        </svg>
    ),
    top: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="1" y="1" width="14" height="1.5" rx="0.5" />
            <rect x="3" y="4" width="3" height="10" rx="0.5" />
            <rect x="9" y="4" width="3" height="7" rx="0.5" />
        </svg>
    ),
    centerH: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="1" y="7.25" width="14" height="1.5" rx="0.5" opacity="0.4" />
            <rect x="3" y="2" width="3" height="12" rx="0.5" />
            <rect x="9" y="3.5" width="3" height="9" rx="0.5" />
        </svg>
    ),
    bottom: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="1" y="13.5" width="14" height="1.5" rx="0.5" />
            <rect x="3" y="2" width="3" height="10" rx="0.5" />
            <rect x="9" y="5" width="3" height="7" rx="0.5" />
        </svg>
    ),
    distributeH: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="1" y="1" width="1.5" height="14" rx="0.5" opacity="0.4" />
            <rect x="13.5" y="1" width="1.5" height="14" rx="0.5" opacity="0.4" />
            <rect x="4" y="3" width="3" height="10" rx="0.5" />
            <rect x="9" y="5" width="3" height="6" rx="0.5" />
        </svg>
    ),
    distributeV: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="1" y="1" width="14" height="1.5" rx="0.5" opacity="0.4" />
            <rect x="1" y="13.5" width="14" height="1.5" rx="0.5" opacity="0.4" />
            <rect x="3" y="4" width="10" height="3" rx="0.5" />
            <rect x="5" y="9" width="6" height="3" rx="0.5" />
        </svg>
    ),
};

function Toolbar({
    snapEnabled,
    onToggleSnap,
    onFitView,
    onDeleteSelected,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
    notation,
    onNotationChange,
    onAutoLayout,
    onDuplicateSelected,
    colorScheme,
    onColorSchemeChange,
    customPalettes,
    onCreateCustomPalette,
    onRenamePalette,
    onDeletePalette,
    zoomLevel,
    onZoomIn,
    onZoomOut,
    onResetZoom,
    selectedCount = 0,
    onAlignLeft,
    onAlignCenterV,
    onAlignRight,
    onAlignTop,
    onAlignCenterH,
    onAlignBottom,
    onDistributeH,
    onDistributeV,
    isMetamodel = false,
    modelId,
    editorMode,
    hasViewpoint = false,
    onEditorModeChange,
    highlightModeActive = false,
    activeHighlightColor = 1,
    onSelectHighlightColor,
    onClearHighlights,
}: ToolbarProps) {
    // Toggle is always rendered. When no viewpoint is active the buttons are
    // visible but inert (greyed out, "flow" stays highlighted as the default).
    const activeEditorMode = editorMode ?? 'flow';
    const modeToggleDisabled = !hasViewpoint;
    const layoutDisabled = editorMode === 'classic';
    const [notationOpen, setNotationOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    // TODO: cleanup — no reader since the fullscreen toggle was retired (2026-08-26).
    const prevPanelMode = useRef<LayoutMode>('sidebar');

    const currentNotation = NOTATION_OPTIONS.find(n => n.id === notation) ?? NOTATION_OPTIONS[0];

    // ── Viewpoint selector ──
    // The root `state.viewpoints` array is a different source from LProject.viewpoints:
    // the reducer pushes every DViewPoint into it (reducer.ts:465-469) and R-IRN-9 does
    // not reach it, so the seeded ids are filtered again here. Not a redundancy.
    //
    // The filter here is UNCONDITIONAL, unlike LProject.viewpoints, which keeps a
    // seeded viewpoint that holds authored views. The asymmetry is deliberate: this
    // array feeds a rendering selector, not a navigation tree. A `Default` holding
    // authored views is reached through the view tree, not activated as the viewpoint
    // things render through.
    const rawActiveViewpointId = useSelector((state: any) => state.viewpoint) as string;
    const viewpointPointers = useSelector((state: any) => state.viewpoints) as string[];
    const viewpoints = (viewpointPointers || [])
        .filter(ptr => !Defaults.isSystemViewpoint(ptr) && !isDataManagerViewpointId(ptr))
        .map(ptr => {
            try {
                const lVp = LPointerTargetable.fromPointer(ptr) as LViewPoint;
                if (!lVp) return null;
                // R-DMV-1: the Data Manager singleton is not a syntax of the canvas and
                // never becomes `state.viewpoint`. Excluded here and not only by pointer
                // above, because the pointer test answers «which one» and this one
                // answers «what kind»: a singleton reached through a path that did not
                // set the fixed id would still be caught.
                if (isDataManagerViewpoint(lVp.__raw as any)) return null;
                return { id: ptr, name: lVp.name || 'Unnamed' };
            } catch { return null; }
        }).filter(Boolean) as Array<{ id: string; name: string }>;

    // A saved project can carry a system viewpoint as the active one: measured,
    // examples/statechartplus.ts has activeViewpoint = Pointer_ViewPointDefault, and
    // get_activeViewpoint falls back to the seeded id when the field is empty
    // (classes.ts:3334). Since the filter above leaves it without an <option>, a
    // controlled <select> would set selectedIndex to -1 and draw EMPTY rather than
    // falling back to the first entry. Reading it as "no viewpoint" shows
    // "Abstract syntax" instead. Read-only on purpose: writing here would mutate
    // activeViewpoint on every open of an old project.
    const activeViewpointId = Defaults.isSystemViewpoint(rawActiveViewpointId)
        ? '' : rawActiveViewpointId;

    // On a metamodel the list is not rendered, so an active viewpoint would be a value
    // without an <option> — the same empty-select failure the line above exists to
    // prevent, reached from the other direction. Collapsing it to '' also keeps the
    // --active state off, which is correct: M2 renders in abstract syntax whatever the
    // project-global viewpoint happens to be. The store is not written.
    // The `|| ''` is the render boundary, not a normalization: the root carries `null` for "no
    // viewpoint" since 2.228 (R-IRN-21), isSystemViewpoint(null) is false so the line above lets it
    // through, and value={null} would turn the controlled <select> into an uncontrolled one — React
    // warns and the selection stops tracking the store. Coerced here and nowhere upstream.
    const shownViewpointId = isMetamodel ? '' : (activeViewpointId || '');

    // ── VIEW group enablement ──
    // Notation and Theme govern the abstract-syntax rendering. As soon as a concrete-syntax
    // viewpoint is active they no longer decide how anything draws — the viewpoint does
    // (R-IRN-10: the viewpoint selector IS the syntax control) — so leaving them live would
    // offer a choice with no effect. Keyed on shownViewpointId, not on the raw root: '' is
    // exactly "Abstract syntax", and the metamodel case collapses to '' one line above, which
    // keeps the controls live on M2 where abstract syntax is all there is.
    const viewControlsDisabled = !!shownViewpointId;

    // The picker carries one synthetic entry, «Data manager», which is NOT a viewpoint
    // (dataManagerOption.ts says why). It is intercepted HERE, before `activateViewpoint`,
    // so the sentinel never reaches `state.viewpoint` and no fake DViewPoint is needed.
    //
    // The manager is not mounted here: this delegates to `DockManager.openManager`, the
    // same door the models rail uses (LeftBar.tsx), and `DockManager.open` activates a tab
    // whose id already exists — so picking the entry twice, or picking it on a model whose
    // manager was opened from the rail, converges on ONE tab instead of remounting.
    //
    // The picker stays controlled on `shownViewpointId`, so it snaps back to the active
    // syntax on the next render. That is correct and not a bug to fix: the canvas tab this
    // toolbar belongs to keeps rendering that syntax underneath, and the manager tab is a
    // sibling of it, not a mode of it. Going back to a syntax means activating the canvas
    // tab — the manager tab is left open, never closed from here.
    const handleViewpointChange = useCallback((vpId: string) => {
        if (isDataManagerOption(vpId)) {
            if (!modelId) return;
            try {
                const lm = LPointerTargetable.fromPointer(modelId) as LModel;
                if (lm) DockManager.openManager(lm);
            } catch (e) {
                console.warn('[Toolbar] Data manager: model not resolvable', modelId, e);
            }
            return;
        }
        activateViewpoint(vpId || null);
    }, [modelId]);

    // ── The picker itself: a custom listbox, no longer a <select> (NAV2) ──
    //
    // Only the SURFACE changed. The vocabulary above, `handleViewpointChange`, the
    // sentinel interception and the convergence on one manager tab are NAV1's, and this
    // block calls into them unmodified — a viewpoint id still reaches `activateViewpoint`,
    // the sentinel still returns before it.
    //
    // Why a custom control at all: a native `<option>` renders text only, so the mock's
    // per-entry glyphs and the cyan selected row cannot live inside one. NAV1 said so and
    // left the glyph on the rail; NAV2 is the control that can hold it.
    //
    // What a `<select>` gave for free, and is therefore re-earned by hand below, item by
    // item — anything missing here is a REGRESSION against the control it replaces, not a
    // nicety skipped: `role=listbox` / `role=option` with `aria-selected` and
    // `aria-activedescendant`, arrows, Home, End, Enter, Space, Escape (which restores
    // focus to the trigger), Tab, and type-ahead.
    //
    // The separator is NOT an entry. In a `<select>` it had to be an `<option disabled>`,
    // the only rule a native list can draw; here it is a hairline `role="presentation"`
    // div, so it cannot be highlighted, cannot be counted into the indices the arrow keys
    // walk, and cannot be read out.
    const [syntaxOpen, setSyntaxOpen] = useState(false);
    /** Viewport rect of the trigger, read once at open: the panel is portalled onto
     *  `document.body` and framed `fixed`, so this is the only thing its geometry can be
     *  born from. */
    const [syntaxRect, setSyntaxRect] = useState<DOMRect | null>(null);
    const [syntaxHighlighted, setSyntaxHighlighted] = useState(0);
    const syntaxTriggerRef = useRef<HTMLButtonElement>(null);
    const syntaxListRef = useRef<HTMLDivElement>(null);
    /** Type-ahead buffer and the moment it was last fed. A `<select>` jumps to the entry
     *  whose label starts with what you type, and repeating one letter cycles the entries
     *  that start with it; without this the custom control is strictly worse than the one
     *  it replaces on a list of ten viewpoints. */
    const syntaxTypeahead = useRef<{ buf: string; at: number }>({ buf: '', at: 0 });

    const syntaxEntries: SyntaxEntry[] = [ABSTRACT_SYNTAX_ENTRY];
    if (!isMetamodel) {
        for (const vp of viewpoints) {
            syntaxEntries.push({ value: vp.id, label: vp.name, icon: VIEWPOINT_ENTRY_ICON });
        }
        // Same guard as NAV1: off on metamodels, which have no instances and whose manager
        // `DockManager.openManager` refuses anyway, and off without a `modelId`, which is
        // what the entry has to resolve to open the tab.
        if (modelId) {
            syntaxEntries.push({
                value: DATA_MANAGER_OPTION_VALUE,
                label: DATA_MANAGER_OPTION_LABEL,
                icon: DATA_MANAGER_OPTION_ICON,
                sep: true,
            });
        }
    }
    /** What the trigger reads. Falls back to «Abstract syntax» for the same reason the
     *  `<select>` was normalized to '' upstream: an active id with no entry would otherwise
     *  leave the control blank. */
    const currentSyntax = syntaxEntries.find(e => e.value === shownViewpointId) ?? ABSTRACT_SYNTAX_ENTRY;

    const openSyntaxMenu = () => {
        const el = syntaxTriggerRef.current;
        if (!el) return;
        setSyntaxRect(el.getBoundingClientRect());
        const i = syntaxEntries.findIndex(e => e.value === shownViewpointId);
        setSyntaxHighlighted(i >= 0 ? i : 0);
        syntaxTypeahead.current = { buf: '', at: 0 };
        setSyntaxOpen(true);
    };

    const pickSyntax = (value: string) => {
        setSyntaxOpen(false);
        // Focus goes back to the trigger, as it does when a `<select>` closes — except for
        // the manager entry, which moves to another tab: pulling focus back onto a control
        // of the tab just left is worse than leaving it where the dock puts it.
        if (!isDataManagerOption(value)) syntaxTriggerRef.current?.focus();
        handleViewpointChange(value);
    };

    /* Closing. `mousedown` and not `click`: a press that starts inside the panel and ends
     * outside (dragging across a label) reaches `window` as a click on the document and
     * would close the panel mid-gesture. The trigger is excluded from "outside" or the
     * toggle would fight itself — mousedown closes, click reopens.
     *
     * Scroll, wheel and resize CLOSE instead of repositioning: the geometry is computed
     * once from the trigger's rect, and a `fixed` panel that stays put while its anchor
     * slides away is worse than a panel that is gone. Gestures INSIDE the panel are
     * ignored, or a long list could not be scrolled. Capture on BOTH add and remove — an
     * ancestor's scroll does not bubble, and a listener added in capture is not removed by
     * a bubble-phase removal.
     *
     * Escape is global and in capture for the reason §15.1 gives: Monaco stops keydown in
     * bubble phase, and this bar sits above editors that embed it. Mounted only while
     * open. */
    useEffect(() => {
        if (!syntaxOpen) return;
        const onDown = (e: MouseEvent) => {
            const t = e.target as Node;
            if (syntaxTriggerRef.current?.contains(t) || syntaxListRef.current?.contains(t)) return;
            setSyntaxOpen(false);
        };
        const onAnchorMove = (e: Event) => {
            if (syntaxListRef.current?.contains(e.target as Node)) return;
            setSyntaxOpen(false);
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key !== 'Escape') return;
            e.preventDefault();
            setSyntaxOpen(false);
            syntaxTriggerRef.current?.focus();
        };
        window.addEventListener('mousedown', onDown, true);
        window.addEventListener('keydown', onKey, true);
        window.addEventListener('scroll', onAnchorMove, true);
        window.addEventListener('wheel', onAnchorMove, true);
        window.addEventListener('resize', onAnchorMove);
        return () => {
            window.removeEventListener('mousedown', onDown, true);
            window.removeEventListener('keydown', onKey, true);
            window.removeEventListener('scroll', onAnchorMove, true);
            window.removeEventListener('wheel', onAnchorMove, true);
            window.removeEventListener('resize', onAnchorMove);
        };
    }, [syntaxOpen]);

    // Focus the list on open, so the keyboard works without a second gesture — the same
    // rAF the inline selects use, because the portal is not in the DOM on the tick the
    // state flips.
    useEffect(() => {
        if (!syntaxOpen) return;
        const raf = requestAnimationFrame(() => syntaxListRef.current?.focus());
        return () => cancelAnimationFrame(raf);
    }, [syntaxOpen]);

    // Keep the highlighted entry inside the scroll box: with ten viewpoints the arrow keys
    // walk past the panel's max-height, and a highlight that cannot be seen is not one.
    useEffect(() => {
        if (!syntaxOpen) return;
        const items = syntaxListRef.current?.querySelectorAll('.toolbar-viewpoint-menu__option');
        (items?.[syntaxHighlighted] as HTMLElement | undefined)?.scrollIntoView({ block: 'nearest' });
    }, [syntaxOpen, syntaxHighlighted]);

    /** Enter and Space open the menu because the trigger is a `<button>`; the arrows are
     *  what a `<select>` adds on top, and they open it too. */
    const onSyntaxTriggerKeyDown = (e: React.KeyboardEvent) => {
        if (syntaxOpen || isMetamodel) return;
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); openSyntaxMenu(); }
    };

    const onSyntaxListKeyDown = (e: React.KeyboardEvent) => {
        e.stopPropagation();
        const last = syntaxEntries.length - 1;
        switch (e.key) {
            case 'ArrowDown': e.preventDefault(); setSyntaxHighlighted(h => Math.min(h + 1, last)); return;
            case 'ArrowUp': e.preventDefault(); setSyntaxHighlighted(h => Math.max(h - 1, 0)); return;
            case 'Home': e.preventDefault(); setSyntaxHighlighted(0); return;
            case 'End': e.preventDefault(); setSyntaxHighlighted(last); return;
            case 'Enter':
            case ' ': e.preventDefault(); pickSyntax(syntaxEntries[syntaxHighlighted]?.value ?? ''); return;
            case 'Escape': e.preventDefault(); setSyntaxOpen(false); syntaxTriggerRef.current?.focus(); return;
            case 'Tab': setSyntaxOpen(false); return;
            default: break;
        }
        // Type-ahead. One character restarts the search AFTER the current entry, so pressing
        // the same letter cycles; two or more within the window extend the buffer and search
        // from the current entry, so a longer prefix narrows instead of jumping.
        if (e.key.length !== 1 || e.altKey || e.ctrlKey || e.metaKey) return;
        const now = Date.now();
        const t = syntaxTypeahead.current;
        t.buf = now - t.at > 700 ? e.key : t.buf + e.key;
        t.at = now;
        const q = t.buf.toLowerCase();
        const from = q.length === 1 ? syntaxHighlighted + 1 : syntaxHighlighted;
        for (let k = 0; k < syntaxEntries.length; k++) {
            const i = (from + k) % syntaxEntries.length;
            if (syntaxEntries[i].label.toLowerCase().startsWith(q)) { setSyntaxHighlighted(i); break; }
        }
    };

    // ── Views menu (edit entry next to the selector) ──
    // The list is built at render straight from the store instead of through a selector:
    // it is only ever read while the menu is open, and opening it goes through this
    // component's own state, so the read always happens on a fresh render. `d.viewpoint`
    // is the same field the IR signature groups views by (irResolveCore.ts).
    // `hasIr` is what separates an IR viewpoint from a classic one: the menu edits IR
    // views, so a viewpoint with none of them gets no button at all.
    const [viewsMenuOpen, setViewsMenuOpen] = useState(false);
    const viewsMenuRef = useRef<HTMLDivElement>(null);

    const viewpointViews: Array<{ id: string; name: string; hasIr: boolean }> = [];
    if (shownViewpointId) {
        const st: any = store.getState();
        const lookup: any = st?.idlookup ?? {};
        for (const vid of (st?.viewelements ?? []) as string[]) {
            const d: any = lookup[vid];
            if (!d || d.viewpoint !== shownViewpointId) continue;
            viewpointViews.push({
                id: vid,
                name: d.name || 'Unnamed',
                hasIr: !!d.ir && typeof d.ir === 'object',
            });
        }
    }
    const showViewsMenu = !isMetamodel && !!shownViewpointId && viewpointViews.some(v => v.hasIr);

    const handleOpenViewsEditor = useCallback(() => {
        setViewsMenuOpen(false);
        const dVp = (store.getState() as any)?.idlookup?.[shownViewpointId];
        if (dVp) DockManager.openViewpoint(dVp as DViewPoint);
        // openViewpoint predates the rail's collapse model and does not expand it, and its
        // three existing callers are left alone. The expansion is asked for here, where the
        // entry needs to land on screen.
        window.dispatchEvent(new CustomEvent(JjodelEvents.PROPERTIES_SHOW));
    }, [shownViewpointId]);

    // Same two guards the notation dropdown has: click outside, and Escape.
    useEffect(() => {
        if (!viewsMenuOpen) return;
        const handleClick = (e: MouseEvent) => {
            if (viewsMenuRef.current && !viewsMenuRef.current.contains(e.target as Node)) {
                setViewsMenuOpen(false);
            }
        };
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setViewsMenuOpen(false);
        };
        document.addEventListener('mousedown', handleClick, true);
        document.addEventListener('keydown', handleKey);
        return () => {
            document.removeEventListener('mousedown', handleClick, true);
            document.removeEventListener('keydown', handleKey);
        };
    }, [viewsMenuOpen]);

    // A menu left hanging open after its trigger stops rendering would still take clicks.
    useEffect(() => {
        if (!showViewsMenu) setViewsMenuOpen(false);
    }, [showViewsMenu]);

    // ── Layout mode state (synced via CustomEvent + localStorage) ──
    // TODO: cleanup — `layoutMode` is written by the listener below and read by nobody
    // since the fullscreen toggle was retired (2026-08-26). `handleLayoutModeChange` IS
    // still live: the `canvas-only` escape hatch below calls it.
    const [layoutMode, setLayoutMode] = useState<LayoutMode>(getSavedLayoutMode);

    useEffect(() => {
        const handleLayoutChange = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            if (detail?.mode) setLayoutMode(detail.mode);
        };
        window.addEventListener(JjodelEvents.LAYOUT_MODE_CHANGE, handleLayoutChange);
        return () => window.removeEventListener(JjodelEvents.LAYOUT_MODE_CHANGE, handleLayoutChange);
    }, []);

    const handleLayoutModeChange = useCallback((mode: LayoutMode, resetToDefault = false) => {
        setLayoutMode(mode);
        saveLayoutMode(mode);
        document.body.setAttribute('data-layout-mode', mode);
        window.dispatchEvent(new CustomEvent(JjodelEvents.LAYOUT_MODE_CHANGE, {
            detail: { mode, resetToDefault }
        }));
    }, []);

    // TODO: cleanup — no call site since the fullscreen toggle was retired (2026-08-26).
    const handleLayoutModeDoubleClick = useCallback((mode: LayoutMode) => {
        handleLayoutModeChange(mode, true);
    }, [handleLayoutModeChange]);

    // TODO: cleanup — same, `showLayoutControls` gated the fullscreen toggle only.
    const showLayoutControls = !isProjectOverviewPage();

    /**
     * Escape hatch for `canvas-only`, once (2026-08-26).
     *
     * The retired fullscreen button was the ONLY writer of that layout mode and the only
     * way out of it: `Navbar`'s own `handleLayoutModeChange` has no call site either, and
     * `properties-with-tree-view.scss:1487` hides BOTH the rail and its reopen pill under
     * `body[data-layout-mode="canvas-only"]`. Anyone whose localStorage holds that value
     * would open the app with no right column and no control able to bring it back.
     *
     * So the mode is normalised to the default on mount. It is not a migration in the
     * VersionFixer sense — the value is in localStorage, not in project state — and it is
     * self-clearing: with no writer left, nobody reaches `canvas-only` again.
     */
    useEffect(() => {
        if (getSavedLayoutMode() !== 'canvas-only') return;
        handleLayoutModeChange('split');
    }, [handleLayoutModeChange]);

    // Rail chrome that lives here now: whether the right rail is on screen at all,
    // shared with the rail itself through TreeViewPanelContext (the rail is portaled to
    // <body>, so the two are in different subtrees and cannot share component state).
    const { isRailVisible, toggleRail } = useTreeViewPanel();

    /**
     * Name of the model this editor tab is open on. Bounded walk up `father` to the
     * owning DModel — the raw D-layer read of CLAUDE.md §3.6, which does not wait on the
     * L-layer forward collections. Returns a primitive, so the toolbar does not re-render
     * on unrelated store writes.
     *
     * `modelId` is already the DModel in the common case; the walk covers the tab being
     * opened on something below it.
     */
    const editorTitle = useSelector((state: any) => {
        const lookup = state.idlookup || {};
        let id: string | undefined = modelId;
        for (let hops = 0; id && hops < 64; hops++) {
            const e = lookup[id];
            if (!e) return '';
            if (e.className === 'DModel') return e.name || '';
            id = e.father;
        }
        return '';
    });

    // Close dropdown on click outside
    useEffect(() => {
        if (!notationOpen) return;
        const handleClick = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setNotationOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick, true);
        return () => document.removeEventListener('mousedown', handleClick, true);
    }, [notationOpen]);

    // Close dropdown on Escape
    useEffect(() => {
        if (!notationOpen) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setNotationOpen(false);
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [notationOpen]);

    // A dropdown left hanging open under a now-disabled trigger would still take clicks.
    useEffect(() => {
        if (viewControlsDisabled) setNotationOpen(false);
    }, [viewControlsDisabled]);

    const handleSelect = useCallback((id: NotationMode) => {
        onNotationChange(id);
        setNotationOpen(false);
    }, [onNotationChange]);

    return (
        <div className="editor-v2-toolbar">
            {/* ── Actions / Alignment group (swaps in-place) ── */}
            {selectedCount >= 2 && onAlignLeft ? (
                <div className="toolbar-group toolbar-group--align">
                    <span className="toolbar-group__label">ALIGN</span>
                    <button className="toolbar-btn" onClick={onAlignLeft} title="Align left">
                        {AlignIcons.left}
                    </button>
                    <button className="toolbar-btn" onClick={onAlignCenterV} title="Align center (vertical axis)">
                        {AlignIcons.centerV}
                    </button>
                    <button className="toolbar-btn" onClick={onAlignRight} title="Align right">
                        {AlignIcons.right}
                    </button>
                    <div className="toolbar-align-divider" />
                    <button className="toolbar-btn" onClick={onAlignTop} title="Align top">
                        {AlignIcons.top}
                    </button>
                    <button className="toolbar-btn" onClick={onAlignCenterH} title="Align center (horizontal axis)">
                        {AlignIcons.centerH}
                    </button>
                    <button className="toolbar-btn" onClick={onAlignBottom} title="Align bottom">
                        {AlignIcons.bottom}
                    </button>
                    {selectedCount >= 3 && onDistributeH && (
                        <>
                            <div className="toolbar-align-divider" />
                            <button className="toolbar-btn" onClick={onDistributeH} title="Distribute horizontally">
                                {AlignIcons.distributeH}
                            </button>
                            <button className="toolbar-btn" onClick={onDistributeV} title="Distribute vertically">
                                {AlignIcons.distributeV}
                            </button>
                        </>
                    )}
                    <span className="toolbar-selection-count">{selectedCount} selected</span>
                </div>
            ) : (
                <div className="toolbar-group">
                    <button
                        className="toolbar-btn"
                        onClick={onUndo}
                        disabled={!canUndo}
                        title="Undo (Ctrl+Z)"
                    >
                        <i className="bi bi-arrow-counterclockwise" />
                    </button>
                    <button
                        className="toolbar-btn"
                        onClick={onRedo}
                        disabled={!canRedo}
                        title="Redo (Ctrl+Shift+Z)"
                    >
                        <i className="bi bi-arrow-clockwise" />
                    </button>
                    {onDuplicateSelected && (
                        <button
                            className="toolbar-btn"
                            onClick={onDuplicateSelected}
                            title="Duplicate selected"
                        >
                            <i className="bi bi-copy" />
                        </button>
                    )}
                    <button
                        className="toolbar-btn danger"
                        onClick={onDeleteSelected}
                        title="Delete selected (Delete/Backspace)"
                    >
                        <i className="bi bi-trash" />
                    </button>
                </div>
            )}

            <div className="toolbar-separator" />

            {/* ── VIEW group (with label) ── */}
            <div className="toolbar-group toolbar-group--labeled">
                <span className="toolbar-group__label">VIEW</span>

                {/* Notation/Structure dropdown */}
                <div className="notation-selector" ref={dropdownRef}>
                    <button
                        className="toolbar-dropdown-btn"
                        onClick={() => setNotationOpen(prev => !prev)}
                        disabled={viewControlsDisabled}
                        title={viewControlsDisabled ? 'The active viewpoint defines the notation — switch to Abstract syntax to change it' : 'Notation mode'}
                    >
                        <span>{currentNotation.name}</span>
                        <i className="bi bi-chevron-down toolbar-dropdown-btn__chevron" />
                    </button>
                    {notationOpen && (
                        <div className="notation-selector__dropdown">
                            {NOTATION_OPTIONS.map(opt => (
                                <button
                                    key={opt.id}
                                    className={`notation-selector__option ${notation === opt.id ? 'active' : ''}`}
                                    onClick={() => handleSelect(opt.id)}
                                >
                                    <i className={`bi ${opt.icon}`} />
                                    <div>
                                        <div className="notation-selector__option-name">{opt.name}</div>
                                        <div className="notation-selector__option-desc">{opt.desc}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Theme/Color scheme dropdown */}
                <ColorSchemeSelector
                    disabled={viewControlsDisabled}
                    colorScheme={colorScheme}
                    onColorSchemeChange={onColorSchemeChange}
                    customPalettes={customPalettes}
                    onCreateCustomPalette={onCreateCustomPalette}
                    onRenamePalette={onRenamePalette}
                    onDeletePalette={onDeletePalette}
                />
            </div>

            {/* Highlight mode palette — only while highlight mode is active */}
            {highlightModeActive && (
                <>
                    <div className="toolbar-separator" />
                    <HighlightPalette
                        activeColor={activeHighlightColor}
                        onSelect={(n) => onSelectHighlightColor?.(n)}
                        onClear={() => onClearHighlights?.()}
                    />
                </>
            )}

            <div className="toolbar-separator" />

            {/* ── LAYOUT group (with label) ── */}
            <div className="toolbar-group toolbar-group--labeled">
                <span className="toolbar-group__label">LAYOUT</span>
                <button
                    className={`toolbar-btn ${snapEnabled ? 'active' : ''}`}
                    onClick={onToggleSnap}
                    disabled={layoutDisabled}
                    title={layoutDisabled ? 'Layout controls only available with the flow editor' : (snapEnabled ? 'Disable snap to grid' : 'Enable snap to grid')}
                >
                    <i className="bi bi-grid-3x3" />
                </button>
                {onAutoLayout && (
                    <button
                        className="toolbar-btn"
                        onClick={onAutoLayout}
                        disabled={layoutDisabled}
                        title={layoutDisabled ? 'Layout controls only available with the flow editor' : 'Auto layout'}
                    >
                        <i className="bi bi-diagram-3" />
                    </button>
                )}
            </div>

            <div className="toolbar-separator" />

            {/* ── Viewpoint selector: this IS the syntax control (R-IRN-10) ──
                Choosing a viewpoint is choosing the concrete syntax, so the first entry
                reads "Abstract syntax" and the retired pill said nothing this does not.
                The lit state stays legible through toolbar-viewpoint-selector--active.

                Rendered on metamodels too, but inert: in editor-v2 viewpoints do not
                reach the M2 canvas (ClassNode resolves no IR, its jsxString branch is
                unreachable, getIRIndex feeds ObjectNode only), and activateViewpoint
                writes project-global state, so an active selector here would change how
                the M1 tabs render without changing a pixel where it was used. The
                metamodel's own rendering stays governed by the notation selector. */}
            <div className="toolbar-viewpoint-group">
                <div className={`toolbar-viewpoint-selector${shownViewpointId ? ' toolbar-viewpoint-selector--active' : ''}`}>
                    {/* The eye moves INSIDE the trigger (it was a sibling of the <select>):
                        the mock draws one control carrying glyph, label and chevron. It stays
                        a `.bi-eye` descendant of `.toolbar-viewpoint-selector`, so the lit
                        rule of `--active` reaches it exactly as before. */}
                    <button
                        ref={syntaxTriggerRef}
                        type="button"
                        className="toolbar-viewpoint-trigger"
                        aria-haspopup="listbox"
                        aria-expanded={syntaxOpen}
                        aria-controls={SYNTAX_LISTBOX_ID}
                        aria-label="Viewpoint"
                        disabled={isMetamodel}
                        title={isMetamodel ? 'Metamodels use abstract syntax only' : 'Select viewpoint'}
                        onClick={() => (syntaxOpen ? setSyntaxOpen(false) : openSyntaxMenu())}
                        onKeyDown={onSyntaxTriggerKeyDown}
                    >
                        <i className="bi bi-eye" aria-hidden="true" />
                        <span className="toolbar-viewpoint-trigger__label">{currentSyntax.label}</span>
                        <i className="bi bi-chevron-down toolbar-viewpoint-trigger__chevron" aria-hidden="true" />
                    </button>

                    {/* Portalled onto `document.body`, and `fixed` from the trigger's rect.
                        Inside the bar it would be clipped: the toolbar is a flex row in an
                        rc-dock pane, the trap the Columns panel of 10k hit from the other
                        side of the app. The portal also settles the rail: the views menu
                        beside this one is anchored right because the rail overlay is
                        `position: fixed` on <body> and forms a stacking context ABOVE the
                        toolbar's, so its 900 paints over a 1000 that lives inside the bar.
                        A panel that is itself on <body> is that overlay's sibling, and
                        `computeListStyle`'s z-index 10000 then means what it says.

                        The theme lives on `html[data-theme]`, so the tokens follow the panel
                        out of the subtree; its rules are flat BEM classes, not descendants of
                        `.editor-v2-toolbar`, and reach it by construction. */}
                    {syntaxOpen && syntaxRect && createPortal(
                        <div
                            id={SYNTAX_LISTBOX_ID}
                            ref={syntaxListRef}
                            className="toolbar-viewpoint-menu"
                            role="listbox"
                            aria-label="Viewpoint"
                            aria-activedescendant={syntaxOptionId(syntaxHighlighted)}
                            tabIndex={0}
                            style={computeListStyle(syntaxRect)}
                            onKeyDown={onSyntaxListKeyDown}
                        >
                            {syntaxEntries.map((entry, i) => (
                                <Fragment key={entry.value || '__abstract__'}>
                                    {entry.sep && (
                                        <div className="toolbar-viewpoint-menu__sep" role="presentation" />
                                    )}
                                    <div
                                        id={syntaxOptionId(i)}
                                        className={'toolbar-viewpoint-menu__option'
                                            + (i === syntaxHighlighted ? ' toolbar-viewpoint-menu__option--highlighted' : '')}
                                        role="option"
                                        aria-selected={entry.value === shownViewpointId}
                                        onClick={() => pickSyntax(entry.value)}
                                        onMouseEnter={() => setSyntaxHighlighted(i)}
                                    >
                                        <i className={`bi ${entry.icon} toolbar-viewpoint-menu__icon`} aria-hidden="true" />
                                        <span className="toolbar-viewpoint-menu__label">{entry.label}</span>
                                        {entry.value === shownViewpointId && (
                                            <i className="bi bi-check-lg toolbar-viewpoint-menu__check" aria-hidden="true" />
                                        )}
                                    </div>
                                </Fragment>
                            ))}
                        </div>,
                        document.body,
                    )}
                </div>

                {/* Views menu — the way into the views editor from the canvas toolbar.
                    Borrows the .notation-selector shape (relative wrapper + absolute
                    dropdown) so it behaves like the other toolbar menus; the syntax picker
                    beside it is untouched — NAV2 rebuilt that one on its own listbox, not
                    on this shape, because it needs a selected state and per-entry glyphs
                    that `.notation-selector__option` does not carry. aria-haspopup/aria-expanded are on this button
                    only: the older .notation-selector is not retrofitted here. */}
                {showViewsMenu && (
                    <div className="notation-selector" ref={viewsMenuRef}>
                        <button
                            className="toolbar-dropdown-btn toolbar-dropdown-btn--icon"
                            onClick={() => setViewsMenuOpen(prev => !prev)}
                            title="Edit the views of this viewpoint"
                            aria-haspopup="menu"
                            aria-expanded={viewsMenuOpen}
                        >
                            <i className="bi bi-pencil" />
                        </button>
                        {viewsMenuOpen && (
                            <div className="notation-selector__dropdown">
                                {viewpointViews.map(v => (
                                    <button
                                        key={v.id}
                                        className="notation-selector__option"
                                        onClick={() => { setViewsMenuOpen(false); DockManager.openView(v.id); }}
                                    >
                                        <i className="bi bi-eye" />
                                        <div>
                                            <div className="notation-selector__option-name">{v.name}</div>
                                        </div>
                                    </button>
                                ))}
                                <button
                                    className="notation-selector__option"
                                    onClick={handleOpenViewsEditor}
                                >
                                    <i className="bi bi-pencil-square" />
                                    <div>
                                        <div className="notation-selector__option-name">Open views editor</div>
                                    </div>
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ── Spacer ── */}
            <div className="toolbar-spacer" />

            {/* Retired from this bar on 2026-08-26, and not relocated:
                — the conformance pill (`ValidationPill`), whose counts read as a
                  notifications badge next to the identity of the open model. The
                  per-node badges on the canvas and the status bar's conformance dot
                  remain. `ValidationPill` itself is left in the tree, unrendered.
                — the fullscreen / show-panel toggle, which drove layout mode
                  `canvas-only`. It read as a second way of doing what the rail
                  collapse below does, so one of the two had to go. See the
                  `canvas-only` normalisation effect above for the escape hatch. */}

            {/* Classic shutdown (Fase 5a): the flow/classic/split mode toggle is
                gone — concrete syntax renders via the IR interpreter behind the
                active viewpoint. TODO: cleanup — remove editorMode/hasViewpoint/
                onEditorModeChange plumbing once the removal layer lands. */}

            {/* ── Command group: one bordered box, at the right end of the CANVAS zone ──
                Zoom out / level / zoom in, a hairline, then the rail collapse.
                The two families sit together because they are the only two controls
                that act on the CANVAS AS A SURFACE rather than on its contents — the
                hairline keeps "how big is what I see" apart from "how much room does
                it get".

                Since 2b it is no longer flush with the toolbar's right edge: the rail
                cell below claims that end, and the group stops just short of the rail
                boundary. With the rail collapsed the cell is not rendered and the group
                falls back to being the last item, i.e. flush right again — the spacer
                above it does that on its own, no branch here. */}
            <div className="toolbar-commands">
                {onZoomOut && onZoomIn && onResetZoom && zoomLevel !== undefined && (
                    <>
                        <button
                            className="toolbar-commands__btn"
                            onClick={onZoomOut}
                            title="Zoom out"
                        >
                            <i className="bi bi-dash" />
                        </button>
                        <button
                            className="toolbar-commands__level"
                            onClick={onResetZoom}
                            title="Reset zoom to 100%"
                        >
                            {zoomLevel}%
                        </button>
                        <button
                            className="toolbar-commands__btn"
                            onClick={onZoomIn}
                            title="Zoom in"
                        >
                            <i className="bi bi-plus" />
                        </button>
                    </>
                )}
                {/* Fit to view retired from this group on 2026-08-26 (mockup 1c): the
                    group is zoom and nothing else. Nothing is lost with it — the level
                    button beside it runs `handleResetZoom`, which is the SAME call as
                    `handleFitView` (`fitView({padding, maxZoom: 1, duration: 200})`,
                    EditorV2.tsx:3313-3316), so the affordance survives under the `%`. */}

                <div className="toolbar-commands__hairline" aria-hidden="true" />

                {/* Rail collapse — the WHOLE column, both zones, not the inspector
                    alone. This is where it differs from the rail header's own button,
                    which under R-RAIL-23 commuted the inspector and left the tree
                    standing: with the header gone, a control that empties half the
                    column reads as broken rather than as deliberate, and the thing a
                    user wants from the canvas is the canvas at full width.

                    The tree keeps its own ⌘B, so the two zones are still independently
                    reachable; and closing remembers the pair, so « restores what was
                    there (see `toggleRail`). The floating reopen pill stays as a second
                    door back, on the edge where the column used to be. */}
                <button
                    className="toolbar-commands__btn"
                    onClick={toggleRail}
                    aria-label={isRailVisible ? 'Hide the side panel' : 'Show the side panel'}
                    aria-pressed={!isRailVisible}
                    title={isRailVisible ? 'Hide panel' : 'Show panel'}
                >
                    <i className={`bi ${isRailVisible ? 'bi-chevron-double-right' : 'bi-chevron-double-left'}`} />
                </button>
            </div>

            {/* ── Identity of the open editor, in the rail's own column (2b) ──
                Subject is the TAB's model, not the owner of the selection: a tab's
                subject must not move when the selection does. The retired rail header
                walked up from `_lastSelected` instead, which is why it went blank with
                nothing selected. The chevron is an affordance for switching model and
                is inert for now — there is no model-selection dropdown to hang it on
                (open models are switched through the dock tabs).

                What 2b changes is where it sits. It was flush with the toolbar's right
                edge, separated from the command group by a 1x22 divider; it is now a
                CELL as wide as the rail below it, sharing its left hairline, so the
                model name reads as the header of that column rather than as one more
                item in the bar. The width comes from `--jj-rail-width` (published by
                PropertiesWithTreeView, the rail's own writer), so the cell follows the
                drag handle live — see EditorV2.scss for the geometry.

                Gated on `isRailVisible`, the same predicate the rail itself is gated
                on: a cell that outlived its column would be a header over nothing. The
                title is still gated too — with no editorTitle there is nothing to put
                in the cell, and an empty 440px box would eat the bar. */}
            {editorTitle && isRailVisible && (
                <div className="toolbar-rail-cell">
                    <div className="toolbar-identity" title={editorTitle}>
                        <span
                            className={`toolbar-identity__badge toolbar-identity__badge--${isMetamodel ? 'metamodel' : 'model'}`}
                            aria-hidden="true"
                        >
                            {isMetamodel ? 'M' : 'm'}
                        </span>
                        <span className="toolbar-identity__name">{editorTitle}</span>
                        <i className="bi bi-chevron-expand toolbar-identity__chevron" aria-hidden="true" />
                    </div>
                </div>
            )}
        </div>
    );
}

export default Toolbar;
