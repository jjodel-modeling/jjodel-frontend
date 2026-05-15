import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
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
 * Auto-expands when JjScript execution starts.
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
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }, [width]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, String(width));
    }, [width]);

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
    // (with Monaco editors for Template/Style) inside the fluid Properties column.
    // The 260px Tree View would starve it of width, so we auto-collapse the tree
    // while a view is selected. This override is transient: when _lastSelected.view
    // becomes falsy again, the user's manual isTreeViewVisible preference is restored
    // without being mutated.
    const viewSelected = useSelector((state: any) => !!state._lastSelected?.view);

    // Get tree view state from context. `show`/`hide` ci servono per il soft
    // auto-collapse one-shot del tree quando `viewSelected` transiziona falsy→truthy.
    const {
        isVisible: isTreeViewVisible,
        show: showTree,
        hide: hideTree,
        toggle: toggleTreeView,
        isHighlighted,
        isScriptExecuting,
    } = useTreeViewPanel();

    // Soft auto-collapse del tree + cross-panel auto-open del Properties,
    // fusi in UN solo useEffect transition-based. Fira SOLO sulla transizione
    // `viewSelected` falsy→truthy, NON ogni volta che lo state cambia.
    // `isPropertiesVisible` NON è nelle deps per evitare il bug F1 latente
    // (riapertura continua di Properties dopo l'utente lo chiude manualmente).
    const prevViewSelectedRef = useRef<boolean>(!!viewSelected);
    useEffect(() => {
        const isViewSelected = !!viewSelected;
        const wasViewSelected = prevViewSelectedRef.current;
        if (isViewSelected && !wasViewSelected) {
            hideTree();                    // soft: l'utente può riaprire dalla rail
            setIsPropertiesVisible(true);  // cross-panel auto-open
        }
        prevViewSelectedRef.current = isViewSelected;
    }, [viewSelected, hideTree]);

    // Effective visibility (rail-based collapse model 2026-05-13): un pannello
    // "showXxx = true" significa espanso, "false" significa rail collassata.
    // Niente derived viewSelected-based override: la transizione è ora gestita
    // dal useEffect transition-based sopra (one-shot, non continuous).
    const showPropertiesPanel = isPropertiesVisible;
    const showTreePanel = isTreeViewVisible;
    const showResizeHandle = showPropertiesPanel && showTreePanel;

    // Layout helpers (2026-05-13 finalization):
    // - bothRails: entrambi in rail → segnale al Dock per shrinkare il tab a 56px
    // - onlyTreeExpanded: Properties in rail + Tree espanso → Tree prende flex:1
    //   (caso simmetrico: Tree in rail + Properties espanso non serve modifier
    //   perché Properties ha già `flex: 1 1 0` di default nel SCSS aggiornato)
    const bothRails = !showPropertiesPanel && !showTreePanel;
    const onlyTreeExpanded = !showPropertiesPanel && showTreePanel;

    // Dock shrink signal: entra/esce rail-only mode su transizione di bothRails.
    // Firetempi: anche al mount con bothRails=false → dispatcha EXIT, no-op safe
    // sul body attribute assente. Garantisce cleanup di sessioni precedenti.
    useEffect(() => {
        const eventName = bothRails
            ? JjodelEvents.PROPERTIES_TREE_RAIL_ONLY_ENTER
            : JjodelEvents.PROPERTIES_TREE_RAIL_ONLY_EXIT;
        window.dispatchEvent(new CustomEvent(eventName));
    }, [bothRails]);

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
        <div
            ref={containerRef}
            className={`properties-with-tree-view${onlyTreeExpanded ? ' tree-only-expanded' : ''}`}
        >
            {/* Properties: container espanso oppure rail collassata */}
            {showPropertiesPanel ? (
                <div
                    className="properties-panel-container"
                    style={viewSelected ? { maxWidth: 'none' } : undefined}
                >
                    <div className="properties-panel-header">
                        <i className="bi bi-sliders" />
                        <span>PROPERTIES</span>
                        <button
                            className="properties-panel-toggle-btn"
                            onClick={toggleProperties}
                            title="Hide properties"
                            aria-label="Hide properties panel"
                        >
                            <i className="bi bi-chevron-right" />
                        </button>
                    </div>
                    <div className="properties-panel-body">
                        <Info mode={mode} />

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
            ) : (
                <CollapsedPanelToggle side="properties" onClick={() => setIsPropertiesVisible(true)} />
            )}

            {/* Tree: container espanso oppure rail collassata. Il resize handle
                vive dentro il tree container (position absolute, left -3px) ed
                è renderizzato solo quando entrambi i pannelli sono espansi. */}
            {showTreePanel ? (
                <div
                    className={`tree-view-panel-container ${isHighlighted ? 'tree-view-panel-container--highlighted' : ''} ${isScriptExecuting ? 'tree-view-panel-container--executing' : ''}`}
                    style={onlyTreeExpanded
                        ? undefined
                        : { width: `${width}px`, minWidth: `${width}px`, maxWidth: `${width}px` }}
                >
                    {showResizeHandle && (
                        <div
                            className="tree-view-panel-resize-handle"
                            onMouseDown={handleResizeStart}
                            role="separator"
                            aria-orientation="vertical"
                            aria-label="Resize tree view"
                            title="Drag to resize"
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
                            title="Hide tree"
                        >
                            <i className="bi bi-chevron-left" />
                        </button>
                    </div>
                    <div className="tree-view-panel-body">
                        <TreeViewContent />
                    </div>
                </div>
            ) : (
                <CollapsedPanelToggle side="tree" onClick={showTree} />
            )}

        </div>
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
}

const CollapsedPanelToggle: React.FC<CollapsedPanelToggleProps> = ({ side, onClick }) => {
    const iconClass = side === 'properties' ? 'bi-chevron-left' : 'bi-chevron-right';
    const tooltip = side === 'properties' ? 'Show properties' : 'Show tree';
    return (
        <button
            type="button"
            className={`collapsed-panel-toggle collapsed-panel-toggle--${side}`}
            onClick={onClick}
            title={tooltip}
            aria-label={tooltip}
        >
            <i className={`bi ${iconClass}`} aria-hidden="true" />
        </button>
    );
};

export default PropertiesWithTreeView;
