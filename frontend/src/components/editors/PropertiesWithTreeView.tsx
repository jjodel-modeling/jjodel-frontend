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

// Ingombro reale (margin-box) di un toggle collassato: 24px button + 2+2 di
// margine orizzontale = 28px. DEVE combaciare con .collapsed-panel-toggle nello
// SCSS (single source of truth per la formula di larghezza del tab). Se lo SCSS
// cambia i margini, aggiornare qui il valore reale — non fingere 28.
const COLLAPSED_PANEL_TOGGLE_WIDTH = 28;

interface PropertiesWithTreeViewProps {
    mode: 'popup' | 'tab' | 'inline';
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

    const handleResizeStart = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
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
            // Riabilita la transition 200ms del width-lock del tab (vedi effect
            // di dispatch della larghezza + regola in abstract/style.scss).
            document.body.removeAttribute('data-properties-tree-dragging');
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        // Disabilita la transition del tab durante il drag → follow istantaneo.
        document.body.setAttribute('data-properties-tree-dragging', 'true');
    }, [width]);

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
            document.body.removeAttribute('data-properties-tree-dragging');
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        document.body.setAttribute('data-properties-tree-dragging', 'true');
    }, [propsWidth]);

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

    // Expert/Advanced mode — controls visibility of NODE section
    const advanced = useSelector((state: any) => state.advanced);
    const [nodeOpen, setNodeOpen] = useState(false);

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

    // Both-collapsed (2026-07-06 addendum): il tab va a 0, i due toggle NON sono
    // più in-panel ma diventano un cluster flottante (portal su <body>). Gate: solo
    // con un editor model/metamodel attivo (dashboard/transformation/summary →
    // cluster assente). Kill-switch CSS aggiuntivo per canvas-only e documentation.
    const bothCollapsed = !showPropertiesPanel && !showTreePanel;
    const showFloatingCluster = bothCollapsed &&
        (activeEditorType === 'model' || activeEditorType === 'metamodel');

    // Width-lock del dock tab (2026-07-06): larghezze fisse e indipendenti. La
    // larghezza desiderata del tab = somma delle parti visibili (pannello aperto
    // → la sua width; pannello chiuso → l'ingombro del toggle). Scritta
    // DIRETTAMENTE su document.body come custom property + data-attr di
    // attivazione: NON via evento, perché gli effect dei figli girano prima di
    // quelli del Dock e un dispatch iniziale andrebbe perso (si partirebbe senza
    // lock). Consumata da abstract/style.scss. Attiva solo in mode 'tab' (popup/
    // inline non hanno lo split → nessun lock, nessun cleanup che tocchi il body).
    useEffect(() => {
        if (mode !== 'tab') return;
        const bothClosed = !showPropertiesPanel && !showTreePanel;
        let tabWidth: number;
        if (showPropertiesPanel && showTreePanel) tabWidth = propsWidth + width;
        else if (showPropertiesPanel) tabWidth = propsWidth + COLLAPSED_PANEL_TOGGLE_WIDTH;
        else if (showTreePanel) tabWidth = width + COLLAPSED_PANEL_TOGGLE_WIDTH;
        else tabWidth = 0; // both-collapsed (2026-07-06 addendum): tab a 0, il canvas
                           // prende tutto lo spazio; i toggle diventano un cluster
                           // flottante (portal su <body>), non più in-panel.

        const body = document.body;
        body.style.setProperty('--properties-tree-tab-width', `${tabWidth}px`);
        body.setAttribute('data-properties-tree-width-lock', 'true');
        // Data-attr dedicato allo stato both-collapsed: abstract/style.scss lo usa
        // per azzerare il pannello (pattern canvas-only) e nascondere il divider.
        if (bothClosed) body.setAttribute('data-properties-tree-both-collapsed', 'true');
        else body.removeAttribute('data-properties-tree-both-collapsed');
        return () => {
            body.style.removeProperty('--properties-tree-tab-width');
            body.removeAttribute('data-properties-tree-width-lock');
            body.removeAttribute('data-properties-tree-both-collapsed');
        };
    }, [mode, showPropertiesPanel, showTreePanel, propsWidth, width]);

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

    // For non-tab modes, just render Info without the split
    if (mode !== 'tab') {
        return <Info mode={mode} />;
    }

    // Right panel visibility is controlled by CSS via body[data-editor-type].
    // Always render content so it's ready when the panel becomes visible.
    // Rail collapse model 2026-05-13: niente più early return su bothHidden,
    // niente più modifier classes split-only-*. Quando un pannello è chiuso
    // viene sostituito da una rail 28px sul suo lato, sempre cliccabile.

    return (
        <>
        <div
            ref={containerRef}
            className="properties-with-tree-view"
        >
            {/* Properties: container a larghezza fissa (400-700, resize handle sul
                bordo sinistro) oppure toggle collassato. */}
            {showPropertiesPanel ? (
                <div
                    className="properties-panel-container"
                    style={{ width: `${propsWidth}px`, minWidth: `${propsWidth}px`, maxWidth: `${propsWidth}px` }}
                >
                    <div
                        className="properties-panel-resize-handle"
                        onMouseDown={handlePropsResizeStart}
                        role="separator"
                        aria-orientation="vertical"
                        aria-label="Resize properties panel"
                    />
                    <div className="properties-panel-header">
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
                            mode={mode}
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

            {/* Tree: container a larghezza fissa (sempre `width`, mai espansione
                a riempire) oppure toggle collassato. Larghezza indipendente dallo
                stato del Properties (R1). Il resize handle vive dentro il tree
                container (position absolute, left -3px), reso solo quando entrambi
                i pannelli sono espansi. */}
            {showTreePanel ? (
                <div
                    className={`tree-view-panel-container ${isHighlighted ? 'tree-view-panel-container--highlighted' : ''} ${isScriptExecuting ? 'tree-view-panel-container--executing' : ''}`}
                    style={{ width: `${width}px`, minWidth: `${width}px`, maxWidth: `${width}px` }}
                >
                    {showResizeHandle && (
                        <div
                            className="tree-view-panel-resize-handle"
                            onMouseDown={handleResizeStart}
                            role="separator"
                            aria-orientation="vertical"
                            aria-label="Resize tree view"
                        />
                    )}
                    <div className="tree-view-panel-header">
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
        {/* Both-collapsed: cluster flottante di riapertura, portalizzato su <body>
            così sfugge al pannello a 0px. Gate JS su editor model/metamodel; il CSS
            aggiunge il kill-switch per canvas-only / documentation. */}
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
