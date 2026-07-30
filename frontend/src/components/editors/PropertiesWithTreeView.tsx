import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useSelector, useStore } from 'react-redux';
import { Info } from './Info';
import { NodeEditor } from './NodeEditor';
import { TreeViewContent } from '../TreeViewSidebar/TreeViewContent';
import { useTreeViewPanel } from '../../contexts/TreeViewPanelContext';
import './properties-with-tree-view.scss';
// Import tree view styles for icon colors and tree node styling
import '../TreeViewSidebar/tree-view-sidebar.scss';
import { JjodelEvents } from '../../events/registry';

/**
 * PropertiesWithTreeView Component
 *
 * A split panel that combines:
 * - Left: Properties of the selected element (FLUID - takes remaining space)
 * - Right: Tree View of the metamodel hierarchy (FIXED 260px)
 *
 * The Tree View can be toggled on/off with a button in the header.
 * When collapsed, a pulse dot signals JjScript activity instead of auto-opening.
 */

// Tree panel resizable (2026-05-13): range 200-500px, default 260 preserva il
// comportamento storico per utenti senza preferenza salvata.
const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 200;
const MAX_WIDTH = 500;
const STORAGE_KEY = 'jjodel_property_tree_view_width';

// Properties panel visibility (2026-05-13): toggle indipendente dal tree.
// Default: visible (preserva comportamento storico per utenti esistenti).
const STORAGE_KEY_PROPERTIES_VISIBLE = 'jjodel_property_panel_visible';

// Properties panel width (2026-07-06): larghezza fissa e indipendente dal tree.
// range 400-700px, default 440. Chiave propria, clamp + NaN guard come il tree.
const DEFAULT_PROPS_WIDTH = 440;
const MIN_PROPS_WIDTH = 400;
const MAX_PROPS_WIDTH = 700;
const STORAGE_KEY_PROPERTIES_WIDTH = 'jjodel_property_panel_width';

// Floating overlay (F2 2026-07-29): stacked-layout dims for mode='floating'. The
// overlay is a fixed column (its own width) with the Tree card on top (its own
// height) and Properties filling below. Own localStorage keys so they never collide
// with the tab-mode width/propsWidth semantics (which mean panel widths, not these).
const DEFAULT_OVERLAY_WIDTH = 400;
const MIN_OVERLAY_WIDTH = 320;
const MAX_OVERLAY_WIDTH = 640;
const STORAGE_KEY_OVERLAY_WIDTH = 'jjodel_property_overlay_width';

const DEFAULT_TREE_HEIGHT = 360;
const MIN_TREE_HEIGHT = 180;
const MAX_TREE_HEIGHT = 720;
const STORAGE_KEY_TREE_HEIGHT = 'jjodel_property_tree_height';

// Cap the Tree card height to the smaller of the hard px ceiling and ~60vh, so the
// Properties card below always keeps room (and never scrolls off-screen). Floored at
// MIN_TREE_HEIGHT. Used by both the initial read and the drag handler (F2-fix).
function clampTreeHeight(h: number): number {
    const vhCap = typeof window !== 'undefined' ? Math.floor(window.innerHeight * 0.6) : MAX_TREE_HEIGHT;
    return Math.min(MAX_TREE_HEIGHT, vhCap, Math.max(MIN_TREE_HEIGHT, h));
}

interface PropertiesWithTreeViewProps {
    mode: 'floating';
}

export const PropertiesWithTreeView: React.FC<PropertiesWithTreeViewProps> = ({ mode }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    // Width persistita: clamp + NaN guard al caricamento per protezione da
    // localStorage corrotto o da bound changes in versioni future.
    const [width, setWidth] = useState<number>(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return DEFAULT_WIDTH;
        const parsed = parseInt(saved, 10);
        if (Number.isNaN(parsed)) return DEFAULT_WIDTH;
        return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, parsed));
    });

    // Floating overlay (F2): column width, persisted. Declared before the resize
    // handlers so they can list it in their useCallback deps (no TDZ). Clamp + NaN guard.
    const [overlayWidth, setOverlayWidth] = useState<number>(() => {
        const saved = localStorage.getItem(STORAGE_KEY_OVERLAY_WIDTH);
        if (!saved) return DEFAULT_OVERLAY_WIDTH;
        const parsed = parseInt(saved, 10);
        if (Number.isNaN(parsed)) return DEFAULT_OVERLAY_WIDTH;
        return Math.min(MAX_OVERLAY_WIDTH, Math.max(MIN_OVERLAY_WIDTH, parsed));
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY_OVERLAY_WIDTH, String(overlayWidth));
    }, [overlayWidth]);

    // Floating overlay (F2): Tree card height (top of the vertical split), persisted.
    const [treeHeight, setTreeHeight] = useState<number>(() => {
        const saved = localStorage.getItem(STORAGE_KEY_TREE_HEIGHT);
        if (!saved) return DEFAULT_TREE_HEIGHT;
        const parsed = parseInt(saved, 10);
        if (Number.isNaN(parsed)) return DEFAULT_TREE_HEIGHT;
        return clampTreeHeight(parsed);
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY_TREE_HEIGHT, String(treeHeight));
    }, [treeHeight]);

    const handleResizeStart = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        // Floating (F2): this handle is the horizontal divider between the Tree card
        // (top) and Properties (bottom). Dragging DOWN grows the Tree card height.
        if (mode === 'floating') {
            const startY = e.clientY;
            const startHeight = treeHeight;
            const handleMouseMove = (moveEvent: MouseEvent) => {
                const delta = moveEvent.clientY - startY;
                setTreeHeight(clampTreeHeight(startHeight + delta));
            };
            const handleMouseUp = () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
            };
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'row-resize';
            document.body.style.userSelect = 'none';
            return;
        }
        const startX = e.clientX;
        const startWidth = width;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const delta = moveEvent.clientX - startX;
            // Handle è sul bordo SINISTRO del tree panel (panel ancorato a destra
            // dello split). Trascinare il mouse a sinistra (delta < 0) allarga
            // il tree → formula `startWidth - delta`.
            const next = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth - delta));
            setWidth(next);
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }, [mode, treeHeight, width]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, String(width));
    }, [width]);

    // Properties panel width (2026-07-06): stato proprio persistito. Clamp + NaN
    // guard al caricamento, speculare al tree width sopra.
    const [propsWidth, setPropsWidth] = useState<number>(() => {
        const saved = localStorage.getItem(STORAGE_KEY_PROPERTIES_WIDTH);
        if (!saved) return DEFAULT_PROPS_WIDTH;
        const parsed = parseInt(saved, 10);
        if (Number.isNaN(parsed)) return DEFAULT_PROPS_WIDTH;
        return Math.min(MAX_PROPS_WIDTH, Math.max(MIN_PROPS_WIDTH, parsed));
    });

    const handlePropsResizeStart = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        // Floating (F2): this handle is the LEFT edge of the overlay column (anchored
        // to the right of the viewport). Dragging LEFT widens it → `startWidth - delta`,
        // same sign as the tab-mode Properties handle.
        if (mode === 'floating') {
            const startX = e.clientX;
            const startWidth = overlayWidth;
            const handleMouseMove = (moveEvent: MouseEvent) => {
                const delta = moveEvent.clientX - startX;
                setOverlayWidth(Math.min(MAX_OVERLAY_WIDTH, Math.max(MIN_OVERLAY_WIDTH, startWidth - delta)));
            };
            const handleMouseUp = () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
            };
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
            return;
        }
        const startX = e.clientX;
        const startWidth = propsWidth;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const delta = moveEvent.clientX - startX;
            // Handle sul bordo SINISTRO del Properties container (colonna più a
            // sinistra dello split). Trascinare a sinistra (delta < 0) allarga
            // Properties → formula `startWidth - delta`. La larghezza del tab
            // segue live via l'effect di dispatch (dep su propsWidth).
            const next = Math.min(MAX_PROPS_WIDTH, Math.max(MIN_PROPS_WIDTH, startWidth - delta));
            setPropsWidth(next);
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }, [mode, overlayWidth, propsWidth]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY_PROPERTIES_WIDTH, String(propsWidth));
    }, [propsWidth]);

    // Properties panel visibility: state locale + persistenza localStorage.
    // Default true (preserva comportamento storico). Snake_case key per
    // coerenza col pattern jjodel_treeview_visible esistente.
    const [isPropertiesVisible, setIsPropertiesVisible] = useState<boolean>(() => {
        if (typeof window === 'undefined') return true;
        const stored = window.localStorage.getItem(STORAGE_KEY_PROPERTIES_VISIBLE);
        if (stored === null) return true;
        return stored === 'true';
    });

    useEffect(() => {
        try {
            window.localStorage.setItem(STORAGE_KEY_PROPERTIES_VISIBLE, String(isPropertiesVisible));
        } catch { /* ignore */ }
    }, [isPropertiesVisible]);

    const toggleProperties = useCallback(() => {
        setIsPropertiesVisible((v) => !v);
    }, []);

    // Floating overlay (F3-fix): accordion maximize/restore. `null` = balanced split;
    // 'tree'/'properties' = that card fills the overlay, the other collapses to just its
    // header. Driven by a button in each card header.
    const [cardMaximized, setCardMaximized] = useState<'tree' | 'properties' | null>(null);
    const toggleMaximizeTree = useCallback(() => setCardMaximized(m => (m === 'tree' ? null : 'tree')), []);
    const toggleMaximizeProperties = useCallback(() => setCardMaximized(m => (m === 'properties' ? null : 'properties')), []);

    // Expert/Advanced mode — controls visibility of NODE section
    const advanced = useSelector((state: any) => state.advanced);
    const [nodeOpen, setNodeOpen] = useState(false);

    // The Basic/Advanced control lives in the app bar (Navbar), which also owns the
    // once-per-mount restore of the persisted mode: the interface mode is global and the
    // Navbar is the only component mounted on every view. This card is a pure reader of
    // Redux `advanced`.

    // When a view/viewpoint is selected in the Tree View, Info.tsx renders ViewData
    // (with Monaco editors for Template/Style) inside the Properties column.
    // 2026-07-06 fixed-widths: the Properties column has its own fixed width now
    // (400-700px, resizable), so the old maxWidth:'none' widening on view selection
    // was removed — ViewData's Monaco auto-layouts to the container width.

    // Get tree view state from context. `show` riapre il tree dalla rail
    // collassata; `attentionPulse` pilota il pulse dot sul toggle collassato.
    const {
        isVisible: isTreeViewVisible,
        show: showTree,
        toggle: toggleTreeView,
        isHighlighted,
        isScriptExecuting,
        attentionPulse,
        activeEditorType,
    } = useTreeViewPanel();

    // ─── Pin (2026-07-05 fase 2): freeze Properties content on a captured selection triple
    // so the user can browse tree/canvas without losing editing context. Ephemeral (no
    // localStorage). Full design: docs/discovery/2026-07-05_properties-pin.md.
    const [pinnedSelected, setPinnedSelected] = useState<{ node: string; view: string; modelElement: string } | null>(null);

    // Store handle for imperative reads. The current selection is captured at pin time
    // via store.getState() (not useSelector) so the container is NOT re-subscribed to every
    // selection change — only the pinned Info needs to react to the selection (2026-07-05).
    const store = useStore();

    // Dangling guard (semantica punto 5): the pinned element may be deleted while pinned.
    // Resolve its primary id against idlookup; when it disappears, auto-unpin. A pin on an
    // empty selection is intentional (decision 2026-07-05), not dangling.
    const pinnedResolvable = useSelector((state: any) => {
        if (!pinnedSelected) return false;
        const id = pinnedSelected.modelElement || pinnedSelected.view || pinnedSelected.node;
        if (!id) return true;
        return !!state.idlookup?.[id];
    });

    useEffect(() => {
        if (pinnedSelected && !pinnedResolvable) setPinnedSelected(null);
    }, [pinnedSelected, pinnedResolvable]);

    const togglePin = useCallback(() => {
        setPinnedSelected(prev => {
            if (prev) return null;
            // Read the live selection imperatively at click time (no subscription).
            const sel = (store.getState() as any)._lastSelected;
            return {
                node: sel?.node || '',
                view: sel?.view || '',
                modelElement: sel?.modelElement || '',
            };
        });
    }, [store]);

    // Internal navigation inside Info (breadcrumb / contents / view close) re-targets the pin
    // (semantica punto 3). Only wired when pinned, so unpinned navigation follows normally.
    const handleInternalNavigate = useCallback((sel: { node: string; view: string; modelElement: string }) => {
        setPinnedSelected(sel);
    }, []);

    const isPinned = !!pinnedSelected;
    // Inline gate (decision 2026-07-05): never pass a stale id in the frame between the delete
    // and the auto-unpin effect — pass overrideSelected only while still resolvable.
    const effectivePin = pinnedSelected && pinnedResolvable ? pinnedSelected : undefined;

    // Effective visibility (rail-based collapse model 2026-05-13): un pannello
    // "showXxx = true" significa espanso, "false" significa rail collassata.
    const showPropertiesPanel = isPropertiesVisible;
    const showTreePanel = isTreeViewVisible;
    const showResizeHandle = showPropertiesPanel && showTreePanel;

    // Reopen pill gate (floating overlay): the pill appears exactly when the overlay is
    // NOT visible. The overlay renders iff !bothCollapsed, so `bothCollapsed` (neither
    // card shown) IS "overlay hidden" — accordion-maximized still counts as visible, as
    // both cards stay mounted. Gated on an active model/metamodel editor, so the pill is
    // absent on dashboard/transformation/summary. A CSS kill-switch (properties-with-
    // tree-view.scss) additionally hides it in canvas-only and on the documentation tab.
    // Pill and overlay are therefore mutually exclusive in every combination.
    const bothCollapsed = !showPropertiesPanel && !showTreePanel;
    const showFloatingCluster = bothCollapsed &&
        (activeEditorType === 'model' || activeEditorType === 'metamodel');

    // Canvas right-inset writer (F3 2026-07-29): publish the overlay's right footprint
    // (column width + 8px gutter) onto <body> as --jj-canvas-right-inset so the canvas
    // viewport fit, the MiniMap and the Jodie FAB can reserve room for it. 0px when the
    // overlay is not showing (pill mode, or a non-model/metamodel editor) → readers fall
    // back to their historic full-width behaviour. Floating mode only; single writer.
    // NOTE: this is NOT the retired width-lock var — it does not size the dock, and it
    // never touches the data-properties-tree-* body attributes.
    useEffect(() => {
        if (mode !== 'floating') return;
        const overlayShown = (activeEditorType === 'model' || activeEditorType === 'metamodel')
            && (showPropertiesPanel || showTreePanel);
        const inset = overlayShown ? overlayWidth + 8 : 0;
        document.body.style.setProperty('--jj-canvas-right-inset', `${inset}px`);
        return () => {
            document.body.style.removeProperty('--jj-canvas-right-inset');
        };
    }, [mode, activeEditorType, showPropertiesPanel, showTreePanel, overlayWidth]);

    // Double click on a view row in the tree pins the panel on it (2026-07-23). Toggle
    // semantics, mirroring the pin button: double clicking the view that is ALREADY pinned
    // unpins it; a different view re-targets the pin.
    // The triple travels in the event detail — never read from the store here, the tree's
    // own selection dispatch is async (Action.fire → setTimeout 0) and would be stale.
    // Reuses setPinnedSelected as-is, so pinnedResolvable / auto-unpin keep applying.
    useEffect(() => {
        const handlePinView = (e: Event) => {
            const selected = (e as CustomEvent).detail?.selected;
            if (!selected) return;
            if (pinnedSelected && pinnedSelected.view === selected.view) {
                setPinnedSelected(null);   // same view again → release the pin, follow live again
                return;
            }
            setPinnedSelected(selected);
            // A pin nobody can see is useless: bring the panel back from its collapsed rail.
            setIsPropertiesVisible(true);
        };
        window.addEventListener(JjodelEvents.PROPERTIES_PIN_VIEW, handlePinView);
        return () => {
            window.removeEventListener(JjodelEvents.PROPERTIES_PIN_VIEW, handlePinView);
        };
    }, [pinnedSelected]);

    // Listen for external toggle events (e.g., from keyboard shortcut)
    useEffect(() => {
        const handleExternalToggle = () => {
            toggleTreeView();
        };
        window.addEventListener(JjodelEvents.TOGGLE_TREE_VIEW, handleExternalToggle);
        return () => {
            window.removeEventListener(JjodelEvents.TOGGLE_TREE_VIEW, handleExternalToggle);
        };
    }, [toggleTreeView]);

    // 'floating' (F2) renders the same split as 'tab', but portaled to <body>.
    const isFloating = mode === 'floating';

    // Right panel visibility is controlled by CSS via body[data-editor-type].
    // Always render content so it's ready when the panel becomes visible.
    // Rail collapse model 2026-05-13: niente più early return su bothHidden,
    // niente più modifier classes split-only-*. Quando un pannello è chiuso
    // viene sostituito da una rail 28px sul suo lato, sempre cliccabile.

    // Floating overlay is shown only over a model/metamodel canvas; it steps aside for
    // the reopen pill when both cards are collapsed. Portaled to <body> (position:fixed,
    // tier z ~900) so it escapes the dock DOM.
    const overlayActive = activeEditorType === 'model' || activeEditorType === 'metamodel';

    // Accordion (F3-fix): only meaningful when both cards are visible in the floating
    // overlay. Drives the flex sizing of the two cards and which bodies render.
    const effectiveMax = (isFloating && showResizeHandle) ? cardMaximized : null;
    // NB: `height: 'auto'` overrides the base `.tree/.properties-panel-container { height:100% }`
    // — otherwise a collapsed card (flex:0 0 auto) resolves flex-basis to 100% and squashes
    // the maximized card to 0 instead of leaving just its header.
    const treeFloatStyle: React.CSSProperties = effectiveMax === 'tree'
        ? { flex: '1 1 0', height: 'auto', minHeight: 0, width: '100%', maxWidth: '100%' }
        : effectiveMax === 'properties'
            ? { flex: '0 0 auto', height: 'auto', minHeight: 0, width: '100%', maxWidth: '100%' }
            : { flex: `0 0 ${treeHeight}px`, height: `${treeHeight}px`, minHeight: 0, maxHeight: 'none', width: '100%', maxWidth: '100%' };
    const propsFloatStyle: React.CSSProperties = {
        flex: effectiveMax === 'tree' ? '0 0 auto' : '1 1 0',
        height: 'auto',
        minHeight: 0, width: '100%', maxWidth: '100%',
    };

    const splitPanel = (
        <div
            ref={containerRef}
            className={`properties-with-tree-view${isFloating ? ' properties-with-tree-view--floating' : ''}`}
        >
            {/* Properties: container a larghezza fissa (400-700, resize handle sul
                bordo sinistro) oppure toggle collassato. */}
            {showPropertiesPanel ? (
                <div
                    className={`properties-panel-container${effectiveMax === 'tree' ? ' card-header-only' : ''}`}
                    style={isFloating
                        ? propsFloatStyle
                        : { width: `${propsWidth}px`, minWidth: `${propsWidth}px`, maxWidth: `${propsWidth}px` }}
                >
                    <div
                        className="properties-panel-resize-handle"
                        onMouseDown={handlePropsResizeStart}
                        role="separator"
                        aria-orientation="vertical"
                        aria-label="Resize properties panel"
                    />
                    <div
                        className="properties-panel-header"
                        onDoubleClick={isFloating && showResizeHandle ? toggleMaximizeProperties : undefined}
                        title={isFloating && showResizeHandle ? 'Double-click to maximize / restore' : undefined}
                    >
                        <i className="bi bi-sliders" />
                        <span>PROPERTIES</span>
                        <button
                            className={`properties-panel-pin-btn${isPinned ? ' is-active' : ''}`}
                            onClick={togglePin}
                            aria-label={isPinned ? 'Unpin properties panel' : 'Pin properties panel'}
                            aria-pressed={isPinned}
                            title={isPinned ? 'Unpin — follow selection' : 'Pin — freeze content'}
                        >
                            <i className={`bi ${isPinned ? 'bi-pin-angle-fill' : 'bi-pin-angle'}`} />
                        </button>
                        <button
                            className="properties-panel-toggle-btn"
                            onClick={toggleProperties}
                            aria-label="Hide properties panel"
                        >
                            <i className="bi bi-chevron-right" />
                        </button>
                    </div>
                    <div className="properties-panel-body">
                        <Info
                            mode={isFloating ? 'tab' : mode}
                            overrideSelected={effectivePin}
                            onInternalNavigate={isPinned ? handleInternalNavigate : undefined}
                        />

                        {/* NODE section — Expert mode only */}
                        {advanced && (
                            <div className="properties-node-section">
                                <button
                                    className="properties-node-section__header"
                                    onClick={() => setNodeOpen(!nodeOpen)}
                                    type="button"
                                >
                                    <i className={`bi bi-chevron-${nodeOpen ? 'down' : 'right'}`} />
                                    <i className="bi bi-bounding-box-circles" />
                                    <span>NODE</span>
                                </button>
                                {nodeOpen && (
                                    <div className="properties-node-section__content">
                                        <NodeEditor />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            ) : bothCollapsed ? null : (
                <CollapsedPanelToggle side="properties" onClick={() => setIsPropertiesVisible(true)} />
            )}

            {/* F3-fix: in-flow vertical splitter BETWEEN the two cards (floating overlay).
                A real flex item — not absolute, not clipped by the card's overflow, no
                stacking-context games — so the drag reliably lands on it. The previous
                absolute handle/grip inside the card never received the mousedown. */}
            {isFloating && showResizeHandle && effectiveMax === null && (
                <div
                    className="tree-view-panel-vsplit"
                    onMouseDown={handleResizeStart}
                    role="separator"
                    aria-orientation="horizontal"
                    aria-label="Resize tree height"
                    title="Drag to resize"
                >
                    <span className="tree-view-panel-vsplit__grip" aria-hidden="true" />
                </div>
            )}

            {/* Tree: container a larghezza fissa (sempre `width`, mai espansione
                a riempire) oppure toggle collassato. Larghezza indipendente dallo
                stato del Properties (R1). Il resize handle vive dentro il tree
                container (position absolute, left -3px), reso solo quando entrambi
                i pannelli sono espansi. */}
            {showTreePanel ? (
                <div
                    className={`tree-view-panel-container ${isHighlighted ? 'tree-view-panel-container--highlighted' : ''} ${isScriptExecuting ? 'tree-view-panel-container--executing' : ''}${effectiveMax === 'properties' ? ' card-header-only' : ''}`}
                    style={isFloating
                        ? treeFloatStyle
                        : { width: `${width}px`, minWidth: `${width}px`, maxWidth: `${width}px` }}
                >
                    {showResizeHandle && !isFloating && (
                        <div
                            className="tree-view-panel-resize-handle"
                            onMouseDown={handleResizeStart}
                            role="separator"
                            aria-orientation="vertical"
                            aria-label="Resize tree view"
                        />
                    )}
                    <div
                        className="tree-view-panel-header"
                        onDoubleClick={isFloating && showResizeHandle ? toggleMaximizeTree : undefined}
                        title={isFloating && showResizeHandle ? 'Double-click to maximize / restore' : undefined}
                    >
                        <i className="bi bi-diagram-2" />
                        <span>TREE VIEW</span>
                        {isScriptExecuting && (
                            <span className="tree-view-executing-badge">
                                <span className="pulse-dot" />
                                Executing
                            </span>
                        )}
                        <button
                            className="tree-view-toggle-btn"
                            onClick={toggleTreeView}
                            aria-label="Hide tree"
                        >
                            <i className="bi bi-chevron-left" />
                        </button>
                    </div>
                    <div className="tree-view-panel-body">
                        <TreeViewContent />
                    </div>
                </div>
            ) : bothCollapsed ? null : (
                <CollapsedPanelToggle side="tree" onClick={showTree} pulse={attentionPulse} />
            )}

        </div>
    );

    return (
        <>
        {isFloating
            ? (overlayActive && !bothCollapsed && createPortal(
                <div className="properties-tree-overlay" style={{ width: `${overlayWidth}px` }}>
                    {splitPanel}
                </div>,
                document.body
              ))
            : splitPanel}
        {/* Reopen pill: floating cluster, portaled to <body>. Shown only while the overlay
            is hidden (both cards collapsed) over a model/metamodel editor; the CSS adds a
            kill-switch for canvas-only / documentation. Mutually exclusive with the overlay. */}
        {showFloatingCluster && createPortal(
            <div className="properties-tree-floating-cluster" role="group" aria-label="Reopen panels">
                <button
                    type="button"
                    className="properties-tree-floating-cluster__btn"
                    onClick={() => setIsPropertiesVisible(true)}
                    aria-label="Show properties"
                    title="Show properties"
                >
                    <i className="bi bi-sliders" aria-hidden="true" />
                </button>
                <button
                    type="button"
                    className="properties-tree-floating-cluster__btn"
                    onClick={showTree}
                    aria-label="Show tree"
                    title="Show tree"
                >
                    <i className="bi bi-diagram-2" aria-hidden="true" />
                </button>
            </div>,
            document.body
        )}
        </>
    );
};

// ─── Collapsed panel toggle: button compatto 24×24 in alto (2026-05-13).
// Sostituisce la rail full-height 28px del rail-fix. Posizione `align-self:
// flex-start` allinea l'icona alla riga degli header dei pannelli espansi.
// Icone invertite per semantica "outward-pointing" (chevron punta nella
// direzione in cui il contenuto adiacente si muoverà dopo il click).
interface CollapsedPanelToggleProps {
    side: 'properties' | 'tree';
    onClick: () => void;
    // Attention pulse dot: shown when an event would previously have force-opened
    // the panel while collapsed (2026-07-05 decoupling). Only wired on the tree side.
    pulse?: boolean;
}

const CollapsedPanelToggle: React.FC<CollapsedPanelToggleProps> = ({ side, onClick, pulse }) => {
    const iconClass = side === 'properties' ? 'bi-chevron-left' : 'bi-chevron-right';
    const label = side === 'properties' ? 'Show properties' : 'Show tree';
    return (
        <button
            type="button"
            className={`collapsed-panel-toggle collapsed-panel-toggle--${side}`}
            onClick={onClick}
            aria-label={label}
        >
            <i className={`bi ${iconClass}`} aria-hidden="true" />
            {pulse && <span className="collapsed-panel-toggle__pulse" aria-hidden="true" />}
        </button>
    );
};

export default PropertiesWithTreeView;
