import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useSelector, useStore } from 'react-redux';
import { Info } from './Info';
import { NodeEditor } from './NodeEditor';
import HelpButton from '../HelpButton';
import { TreeViewContent } from '../TreeViewSidebar/TreeViewContent';
import { useTreeViewPanel } from '../../contexts/TreeViewPanelContext';
import './properties-with-tree-view.scss';
// Import tree view styles for icon colors and tree node styling
import '../TreeViewSidebar/tree-view-sidebar.scss';
import { JjodelEvents } from '../../events/registry';

/**
 * PropertiesWithTreeView Component
 *
 * The right rail: a single continuous shell (arc 1, 2026-08-10) holding, top to
 * bottom, a header, the structure tree pane and the inspector. It replaced the two
 * stacked floating cards ("TREE VIEW" and "PROPERTIES"), each of which used to
 * carry its own header, border and shadow.
 *
 * Geometry is fixed (R-RAIL-14): the tree pane takes `PRESET_2A.treePaneHeight`
 * while both panes are mounted, and the whole remaining height when it is the only
 * one left. Nothing here depends on the selection, and nothing is draggable.
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

// Floating overlay (F2 2026-07-29): the rail is a fixed column over the canvas,
// with its own persisted width. Own localStorage key so it never collides with the
// tab-mode width/propsWidth semantics (which mean panel widths, not this one).
// Minimum raised 320 → 360 by R-RAIL-11 (2026-08-10): below 360 the rail's own
// controls start wrapping. Clamped both on read and during the drag.
const DEFAULT_OVERLAY_WIDTH = 400;
const MIN_OVERLAY_WIDTH = 360;
const MAX_OVERLAY_WIDTH = 640;
const STORAGE_KEY_OVERLAY_WIDTH = 'jjodel_property_overlay_width';

/**
 * Rail layout preset. Arc 1 ships exactly one (`2a`), so this type carries only
 * the values the shell actually reads — no gate flags, which would be branches
 * that can never go the other way (R-RAIL-3 / C3.2).
 */
export type RailPreset = {
    /** Height of the tree pane while both panes are mounted, px (R-RAIL-14). */
    treePaneHeight: number;
};

/** Preset `2a`. The only preset of arc 1, and the default. */
export const PRESET_2A: RailPreset = {
    treePaneHeight: 392,
};

interface PropertiesWithTreeViewProps {
    mode: 'floating';
}

export const PropertiesWithTreeView: React.FC<PropertiesWithTreeViewProps> = ({ mode }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const preset = PRESET_2A;

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
        // Floating (F2): this handle is the LEFT edge of the rail column (anchored to
        // the right of the viewport). Dragging LEFT widens it → `startWidth - delta`,
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

    // Header control (R-RAIL-23): it commutes the INSPECTOR only, never the tree. The
    // header belongs to the shell (R-RAIL-18) and survives as long as either pane is
    // mounted, so hiding the inspector is reversible from here — there is no dead end
    // left to escape by collapsing both zones at once. The tree keeps its own key and
    // its ⌘B: this component never writes `jjodel_treeview_visible` and never calls the
    // TreeViewPanelContext setters (R-RAIL-11). When the tree is already hidden, hiding
    // the inspector empties the shell, which unmounts and hands over to the reopen pill.
    const toggleInspector = useCallback(() => {
        setIsPropertiesVisible(v => !v);
    }, []);

    // Expert/Advanced mode — controls visibility of NODE section
    const advanced = useSelector((state: any) => state.advanced);
    // Open by default, and deliberately NOT persisted: the storage inventory of
    // R-RAIL-11 is one visibility plus one width, and a disclosure that starts closed
    // would put NodeEditor one click further away than the section has ever been.
    const [nodeOpen, setNodeOpen] = useState(true);

    // The Basic/Advanced control lives in the app bar (Navbar), which also owns the
    // once-per-mount restore of the persisted mode: the interface mode is global and the
    // Navbar is the only component mounted on every view. This card is a pure reader of
    // Redux `advanced`.

    // When a view/viewpoint is selected in the Tree View, Info.tsx renders ViewData
    // (with Monaco editors for Template/Style) inside the inspector zone.

    // Get tree view state from context. `show` riapre il tree dalla rail collassata.
    const {
        isVisible: isTreeViewVisible,
        show: showTree,
        toggle: toggleTreeView,
        isHighlighted,
        isScriptExecuting,
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

    // ─── Rail chrome data, read straight off the raw D-layer in `idlookup`.
    // These are backward-link walks over raw entities, the sanctioned pattern for
    // reads that must not wait on the L-layer forward collections (CLAUDE.md §3.6).
    // Every selector returns a primitive so the rail does not re-render on unrelated
    // store writes.

    // Header title: the name of the DModel that owns the current selection.
    const railTitle = useSelector((state: any) => {
        const lookup = state.idlookup || {};
        let id: string | undefined = state._lastSelected?.modelElement;
        // Bounded walk: a corrupt father chain must not hang the render.
        for (let hops = 0; id && hops < 64; hops++) {
            const e = lookup[id];
            if (!e) return '';
            if (e.className === 'DModel') return e.name || '';
            id = e.father;
        }
        return '';
    });

    // Effective visibility (rail-based collapse model 2026-05-13): un pannello
    // "showXxx = true" significa espanso, "false" significa rail collassata.
    const showPropertiesPanel = isPropertiesVisible;
    const showTreePanel = isTreeViewVisible;

    // Reopen pill gate (floating overlay): the pill appears exactly when the rail is
    // NOT visible. The rail renders iff !bothCollapsed, so `bothCollapsed` (neither
    // zone shown) IS "rail hidden". Gated on an active model/metamodel editor, so the
    // pill is absent on dashboard/transformation/summary. A CSS kill-switch (properties-
    // with-tree-view.scss) additionally hides it in canvas-only and on the documentation
    // tab. Pill and rail are therefore mutually exclusive in every combination.
    const bothCollapsed = !showPropertiesPanel && !showTreePanel;
    const showFloatingCluster = bothCollapsed &&
        (activeEditorType === 'model' || activeEditorType === 'metamodel');

    // Canvas right-inset writer (F3 2026-07-29): publish the rail's right footprint
    // (column width + 8px gutter) onto <body> as --jj-canvas-right-inset so the canvas
    // viewport fit, the MiniMap and the Jodie FAB can reserve room for it. 0px when the
    // rail is not showing (pill mode, or a non-model/metamodel editor) → readers fall
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

    // 'floating' (F2) portals the rail to <body>.
    const isFloating = mode === 'floating';

    // Right panel visibility is controlled by CSS via body[data-editor-type].
    // Always render content so it's ready when the panel becomes visible.

    // The rail is shown only over a model/metamodel canvas; it steps aside for the
    // reopen pill when both zones are collapsed. Portaled to <body> (position:fixed,
    // tier z ~900) so it escapes the dock DOM.
    const overlayActive = activeEditorType === 'model' || activeEditorType === 'metamodel';

    // Fixed geometry (R-RAIL-14): the preset height while both panes are mounted, the
    // whole remaining height when the inspector is hidden and the tree is the survivor.
    // Not draggable, and not a function of the selection.
    const treePaneStyle: React.CSSProperties = showPropertiesPanel
        ? { height: `${preset.treePaneHeight}px` }
        : { flex: '1 1 auto', minHeight: 0 };

    const splitPanel = (
        <div
            ref={containerRef}
            className={`properties-with-tree-view${isFloating ? ' properties-with-tree-view--floating properties-with-tree-view--rail' : ''}`}
        >
            {/* Rail width handle: left edge of the column. Dragging left widens the rail. */}
            <div
                className="properties-panel-resize-handle"
                onMouseDown={handlePropsResizeStart}
                role="separator"
                aria-orientation="vertical"
                aria-label="Resize properties panel"
            />

            {/* Header (44px): one bar for the whole rail, alive while either pane is. */}
            <div className="rail-header">
                {railTitle && (
                    <span
                        className={`rail-header__badge rail-header__badge--${activeEditorType === 'metamodel' ? 'metamodel' : 'model'}`}
                        aria-hidden="true"
                    >
                        {activeEditorType === 'metamodel' ? 'M' : 'm'}
                    </span>
                )}
                <span className="rail-header__title" title={railTitle}>{railTitle}</span>
                <div className="rail-header__spacer" />
                {/* Contextual help of the rail, owned by the host (Q4): the same
                    `properties-panel` help whatever the inspector is showing. */}
                <div className="properties-panel-header__actions">
                    <HelpButton helpKey="properties-panel" />
                </div>
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
                    onClick={toggleInspector}
                    aria-label={showPropertiesPanel ? 'Hide properties' : 'Show properties'}
                    aria-pressed={!showPropertiesPanel}
                    title={showPropertiesPanel ? 'Hide properties' : 'Show properties'}
                >
                    <i className={`bi ${showPropertiesPanel ? 'bi-chevron-double-right' : 'bi-chevron-double-left'}`} />
                </button>
            </div>

            {/* Tree pane. Keeps its container/body classes so TreeViewContent's styling
                and the sticky filter rule keep matching. */}
            {showTreePanel && (
                <div
                    className={`tree-view-panel-container ${isHighlighted ? 'tree-view-panel-container--highlighted' : ''} ${isScriptExecuting ? 'tree-view-panel-container--executing' : ''}`}
                    style={treePaneStyle}
                >
                    {isScriptExecuting && (
                        <span className="tree-view-executing-badge">
                            <span className="pulse-dot" />
                            Executing
                        </span>
                    )}
                    <div className="tree-view-panel-body">
                        <TreeViewContent />
                    </div>
                </div>
            )}

            {/* Inspector zone. Keeps `.properties-panel-container` so the whole B4 skin
                (2026-07-30) that is anchored on it keeps applying to the form below. */}
            {showPropertiesPanel && (
                <div className="properties-panel-container">
                    <div className="properties-panel-body">
                        <Info
                            mode={isFloating ? 'tab' : mode}
                            overrideSelected={effectivePin}
                            onInternalNavigate={isPinned ? handleInternalNavigate : undefined}
                        />

                        {/* NODE section — Expert mode only (R-RAIL-12: it stays in the
                            shell, so `advanced` keeps deciding WHEN it appears, not only
                            where). Disclosure row: caret, eyebrow label, hairline rule. */}
                        {advanced && (
                            <div className="properties-node-section">
                                <button
                                    className="properties-node-section__header"
                                    onClick={() => setNodeOpen(!nodeOpen)}
                                    type="button"
                                    aria-expanded={nodeOpen}
                                >
                                    <i className={`bi bi-chevron-${nodeOpen ? 'down' : 'right'}`} aria-hidden="true" />
                                    <span className="properties-node-section__label">NODE</span>
                                    <span className="properties-node-section__rule" aria-hidden="true" />
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
        {/* Reopen pill: floating cluster, portaled to <body>. Shown only while the rail
            is hidden (both zones collapsed) over a model/metamodel editor; the CSS adds a
            kill-switch for canvas-only / documentation. Mutually exclusive with the rail. */}
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

export default PropertiesWithTreeView;
