import { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import type { NotationMode, ActiveColorScheme, CustomColorScheme } from './types';
import ColorSchemeSelector from './components/ColorSchemeSelector';
import HighlightPalette from './components/HighlightPalette';
import { LayoutMode, getSavedLayoutMode, saveLayoutMode } from '../abstract/Dock';
import { isProjectOverviewPage } from '../../utils/navigationUtils';
import { Defaults, LPointerTargetable, LViewPoint, store } from '../../joiner';
import type { DViewPoint } from '../../joiner';
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
 * [↶][↷][⧉][🗑] | VIEW [Structured ▾] [Theme: X ▾] | LAYOUT [⊞][⊟] | [👁 Abstract syntax ▾] | ——spacer—— | ┌[−] 100% [+] [⤢] ┊ [»]┐ │ (m) model_1 ⌄
 *
 * The viewpoint selector is the syntax control (R-IRN-10): it replaced the separate
 * [● Abstract syntax] pill that used to sit beside it and only restated its state.
 *
 * The right end is the chrome of the canvas as a surface (2026-08-26): one bordered
 * group for zoom and the rail collapse, then the identity of the open model, flush
 * right. It absorbed the rail's own 44px header, which used to repeat that identity a
 * second time one column over.
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
        .filter(ptr => !Defaults.isSystemViewpoint(ptr))
        .map(ptr => {
            try {
                const lVp = LPointerTargetable.fromPointer(ptr) as LViewPoint;
                return lVp ? { id: ptr, name: lVp.name || 'Unnamed' } : null;
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

    const handleViewpointChange = useCallback((vpId: string) => {
        activateViewpoint(vpId || null);
    }, []);

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
                Choosing a viewpoint is choosing the concrete syntax, so the empty option
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
                    <i className="bi bi-eye" />
                    <select
                        value={shownViewpointId}
                        onChange={(e) => handleViewpointChange(e.target.value)}
                        disabled={isMetamodel}
                        title={isMetamodel ? 'Metamodels use abstract syntax only' : 'Select viewpoint'}
                    >
                        <option value="">Abstract syntax</option>
                        {!isMetamodel && viewpoints.map(vp => (
                            <option key={vp.id} value={vp.id}>{vp.name}</option>
                        ))}
                    </select>
                </div>

                {/* Views menu — the way into the views editor from the canvas toolbar.
                    Borrows the .notation-selector shape (relative wrapper + absolute
                    dropdown) so it behaves like the other toolbar menus; the <select>
                    beside it is untouched. aria-haspopup/aria-expanded are on this button
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

            {/* ── Command group: one bordered box, right-aligned ──
                Zoom out / level / zoom in / fit, a hairline, then the rail collapse.
                The two families sit together because they are the only two controls
                that act on the CANVAS AS A SURFACE rather than on its contents — the
                hairline keeps "how big is what I see" apart from "how much room does
                it get". */}
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
                {/* Fit to view. Outside the zoom guard on purpose: it is the fallback
                    the old layout already had when the zoom props were absent, and it
                    has no keyboard shortcut, so this is its only way in. */}
                <button
                    className="toolbar-commands__btn"
                    onClick={onFitView}
                    title="Fit to view"
                >
                    <i className="bi bi-arrows-fullscreen" />
                </button>

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

            {/* ── Identity of the open editor, flush right ──
                Subject is the TAB's model, not the owner of the selection: a tab's
                subject must not move when the selection does. The retired rail header
                walked up from `_lastSelected` instead, which is why it went blank with
                nothing selected. The chevron is an affordance for switching model and
                is inert for now — there is no model-selection dropdown to hang it on
                (open models are switched through the dock tabs). */}
            {editorTitle && (
                <>
                    <div className="toolbar-identity-divider" aria-hidden="true" />
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
                </>
            )}
        </div>
    );
}

export default Toolbar;
