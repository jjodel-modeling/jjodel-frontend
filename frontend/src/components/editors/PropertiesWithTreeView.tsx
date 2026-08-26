import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useSelector, useStore } from 'react-redux';
import { Info } from './Info';
import { NodeEditor } from './NodeEditor';
import { TreeViewContent } from '../TreeViewSidebar/TreeViewContent';
import { TreeViewScopeBarLive } from '../TreeViewSidebar/TreeViewScopeBar';
import { useTreeViewPanel } from '../../contexts/TreeViewPanelContext';
import './properties-with-tree-view.scss';
// Import tree view styles for icon colors and tree node styling
import '../TreeViewSidebar/tree-view-sidebar.scss';
import { JjodelEvents } from '../../events/registry';

/**
 * PropertiesWithTreeView Component
 *
 * The right rail: a single continuous shell (arc 1, 2026-08-10) holding, top to
 * bottom, the structure tree pane and the inspector. It replaced the two stacked
 * floating cards ("TREE VIEW" and "PROPERTIES"), each of which used to carry its own
 * header, border and shadow.
 *
 * It had a header of its own until 2026-08-26, when the column's chrome went up into
 * the canvas topbar: the model badge and name, and the control that takes the whole
 * column off screen and brings it back, are rendered there by `editor-v2/Toolbar.tsx`.
 * The rail now opens directly on the filter band and the Filter field.
 *
 * Layout is preset `2a` ("Adaptive rail"), and from arc 2 (R-RAIL-38) it carries the
 * posture again: the tree pane collapses to 0px when a leaf is selected (Focus) and
 * returns on Escape or on the Focus bar's Structure chip (Browse). Nothing else
 * moves — inspector and footer keep their place, so the switch reads as a change of
 * height and not as a change of screen. Nothing is draggable.
 */

// Tree panel resizable (2026-05-13): range 200-500px, default 260 preserva il
// comportamento storico per utenti senza preferenza salvata.
const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 200;
const MAX_WIDTH = 500;
const STORAGE_KEY = 'jjodel_property_tree_view_width';

// Properties panel visibility (2026-05-13): il toggle resta indipendente dal tree, ma
// dal 2026-08-26 lo stato e la sua chiave `jjodel_property_panel_visible` vivono in
// TreeViewPanelContext — il controllo che lo commuta sta nella topbar del canvas, che e'
// un altro sottoalbero React. Vedi il commento su `useTreeViewPanel` qui sotto.

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
 * First-open width by viewport class. Read ONLY when nothing is persisted yet: a
 * width the user has already dragged wins at every resolution, forever. 400 is
 * `DEFAULT_OVERLAY_WIDTH` unchanged, so the middle band behaves exactly as before.
 */
function firstOpenOverlayWidth(): number {
    if (typeof window === 'undefined') return DEFAULT_OVERLAY_WIDTH;
    const vw = window.innerWidth;
    if (vw < 1600) return 360;
    if (vw < 2200) return DEFAULT_OVERLAY_WIDTH;
    return 560;
}

/**
 * Metadata density of the tree rows, driven by the rail's own width — the one the
 * user controls with the drag handle, not the viewport. It rides on the shell as a
 * `data-density` attribute and the tree rows read it through the cascade: no prop
 * drilling, and the rail root is already an ancestor of every row.
 *
 * A CSS container query would have been the obvious tool, but `container-type`
 * makes the query container a containing block for `position: fixed` descendants,
 * and the tree's own context menu (`useClassifierContextMenu`) is fixed-positioned
 * with viewport coordinates and rendered inline — it would jump. Hence an attribute.
 *
 * Density never changes WHAT the tree lists, only what the right-hand column carries,
 * and never the row height. With the attribute absent, everything shows: the
 * degraded state is today's behaviour.
 */
type RailDensity = 'compact' | 'default' | 'full';

function densityForWidth(w: number): RailDensity {
    if (w < 400) return 'compact';   // type only
    if (w < 520) return 'default';   // type + multiplicity (today)
    return 'full';                   // everything, incl. future documentation markers
}

/**
 * Rail layout preset. Arc 1 ships exactly one (`2a`), so this type carries only
 * the values the shell actually reads — no gate flags, which would be branches
 * that can never go the other way (R-RAIL-3 / C3.2).
 */
export type RailPreset = {
    /**
     * Height of the tree pane in Browse posture, as a CSS length. Focus posture is
     * always 0, and the transition between the two interpolates because `clamp()`
     * resolves to an absolute length at computed-value time.
     */
    treePaneHeight: string;
};

/** Preset `2a` — "Adaptive rail". The only preset of the arc, and the default. */
export const PRESET_2A: RailPreset = {
    // Viewport-relative, not the 392px fixed height it replaced: on a 900px viewport
    // the rail is 777px tall (viewport minus app bar + toolbar + status bar), so 392
    // took more than half of it and squeezed the inspector; on a 1440px viewport it
    // wasted half the column.
    //
    // The formula is defined by three points, and is NOT a rounded `Nvh` — do not
    // "simplify" it into one, it would break the middle point, which is the reference
    // tier ("on a standard screen nothing changes"). Values measured in Chromium,
    // with the intent they serve:
    //   900px  viewport → 299px  (~300: the inspector gets room back on a 14" laptop)
    //   1080px viewport → 391px  (~392, today's height: the reference tier)
    //   1440px viewport → 574px  (~576: grows visibly on a 27" monitor)
    // The 1-2px below each round target is the slope rounded from 51.11% to 51%.
    // The 640px cap protects viewports above ~1570px; it is deliberately never
    // reached at 1440 and is not a target to hit. The 240px floor keeps the pane
    // usable on a short window.
    treePaneHeight: 'clamp(240px, calc(51vh - 160px), 640px)',
};

/**
 * Browse shows the tree pane; Focus collapses it to 0 and gives the whole rail to
 * the inspector. Session-only by design: it resets to Browse on every mount.
 */
type RailPosture = 'browse' | 'focus';

// Selecting one of these switches the rail to Focus posture: they are the leaves of
// the structure tree, the elements whose inspector is worth the whole rail. Selecting
// a container (package, class, model) leaves the posture alone.
const LEAF_CLASSNAMES = new Set(['DAttribute', 'DReference', 'DOperation', 'DEnumLiteral']);

// Escape must not be stolen from a field or from Monaco, where it means "revert the
// edit". Monaco stops propagation in the bubble phase (CLAUDE.md §15.1), so a bubble
// listener never sees its keys; this guard covers plain inputs.
function isTypingTarget(target: EventTarget | null): boolean {
    const el = target as HTMLElement | null;
    if (!el || !el.tagName) return false;
    const tag = el.tagName.toLowerCase();
    return tag === 'input' || tag === 'textarea' || tag === 'select' || el.isContentEditable === true;
}

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
        if (!saved) return firstOpenOverlayWidth();
        const parsed = parseInt(saved, 10);
        if (Number.isNaN(parsed)) return firstOpenOverlayWidth();
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

    // Posture (preset 2a, R-RAIL-38): session-only, always starts in Browse. Never
    // persisted — reopening a project must show the structure, not the last element
    // inspected. It is a state of the shell, so it never travels through `Info` as a
    // prop: the zones read it from here.
    const [posture, setPosture] = useState<RailPosture>('browse');
    // TODO: cleanup — no call site since the rail header was retired (2026-08-26). The
    // header's own button and its double-click gesture were the two callers. Entering
    // Focus is now only automatic (leaf selection); leaving it goes through
    // `setPosture('browse')` on Escape and on the Focus bar's Structure chip. Kept
    // because a deliberate Focus control is a plausible tenant of the new topbar group.
    const togglePosture = useCallback(() => {
        setPosture(p => (p === 'browse' ? 'focus' : 'browse'));
    }, []);

    // Expert/Advanced mode — controls visibility of NODE section
    const advanced = useSelector((state: any) => state.advanced);
    // Closed by default (R-RAIL-24): it is the state the section has always had, so
    // the disclosure restyle changes how the row looks and not what it shows. Not
    // persisted either — the storage inventory of R-RAIL-11 is one visibility plus one
    // width, and this state does not join it.
    const [nodeOpen, setNodeOpen] = useState(false);

    // The Basic/Advanced control lives in the app bar (Navbar), which also owns the
    // once-per-mount restore of the persisted mode: the interface mode is global and the
    // Navbar is the only component mounted on every view. This card is a pure reader of
    // Redux `advanced`.

    // When a view/viewpoint is selected in the Tree View, Info.tsx renders ViewData
    // (with Monaco editors for Template/Style) inside the inspector zone.

    // Get tree view state from context. `show` riapre il tree dalla rail collassata.
    //
    // The inspector's own visibility now comes from the same context (2026-08-26). It
    // commutes the INSPECTOR only, never the tree — the semantics R-RAIL-23 gave the
    // retired header button, unchanged. What changed is where the control sits: the rail
    // header is gone and the collapse control lives in the canvas topbar, a different
    // React subtree, so the state cannot stay private to this component. The tree keeps
    // its own key and its ⌘B: this component still never writes `jjodel_treeview_visible`
    // and never calls the tree setters (R-RAIL-11). When the tree is already hidden,
    // hiding the inspector empties the shell, which unmounts and hands over to the pill.
    const {
        isVisible: isTreeViewVisible,
        toggle: toggleTreeView,
        isHighlighted,
        isScriptExecuting,
        activeEditorType,
        isInspectorVisible: isPropertiesVisible,
        showInspector,
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

    // TODO: cleanup — no call site since the rail header was retired (2026-08-26); the
    // header's pin button was the only one. The pin itself is NOT retired: double
    // clicking a view row in the tree still pins and unpins through PROPERTIES_PIN_VIEW
    // (handler below), and the dangling guard still auto-unpins on delete.
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

    // The two walks that fed the retired header — the owning DModel's name, and the id
    // it landed on — are gone with it (2026-08-26). The name is now the canvas topbar's
    // to compute, and it names the OPEN EDITOR rather than the owner of the selection:
    // a tab's subject does not move when the selection does.
    //
    // With them goes `subjectShownInRailHeader`, the flag that told the inspector to drop
    // its own name and badge because the header was already showing them a few pixels
    // above (measured 2026-08-25: two `model_1` titles 324.5px apart in the same column).
    // There is no header above the inspector any more, so the flag is no longer passed
    // and `Info` renders its identity block in full — including the state the rail opens
    // in, where the selection is the model itself. `Info` keeps the prop and its branch:
    // this stops feeding it, it does not remove it.

    // Selected element: its id drives the posture switch, its className says whether
    // it is a leaf, and its name + owner feed the Focus breadcrumb bar.
    const selectedElementId = useSelector((state: any) => state._lastSelected?.modelElement || '');

    const selectedIsLeaf = useSelector((state: any) => {
        const id = state._lastSelected?.modelElement;
        const cn = id ? state.idlookup?.[id]?.className : undefined;
        return !!cn && LEAF_CLASSNAMES.has(cn);
    });
    const selectedName = useSelector((state: any) => {
        const id = state._lastSelected?.modelElement;
        return id ? (state.idlookup?.[id]?.name || 'unnamed') : '';
    });
    const selectedOwnerName = useSelector((state: any) => {
        const id = state._lastSelected?.modelElement;
        const fatherId = id ? state.idlookup?.[id]?.father : undefined;
        return fatherId ? (state.idlookup?.[fatherId]?.name || '') : '';
    });

    // Selecting a leaf switches to Focus. Keyed on the id ALONE on purpose: keying it
    // on `selectedIsLeaf` too would re-assert Focus on every unrelated store write and
    // fight the user's own click on "Browse" while the same leaf stays selected.
    const leafRef = useRef(selectedIsLeaf);
    leafRef.current = selectedIsLeaf;
    useEffect(() => {
        if (selectedElementId && leafRef.current) setPosture('focus');
    }, [selectedElementId]);

    // Escape always returns to Browse (design 4a), except while a field owns the key —
    // there it means "revert the edit" and must not be intercepted.
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key !== 'Escape') return;
            if (isTypingTarget(e.target)) return;
            setPosture('browse');
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, []);

    /**
     * Sibling stepping (design §6). R-RAIL-7 says the order of the siblings is the one
     * `TreeViewContent` RENDERS, and that rebuilding it here would duplicate the model.
     * So this does not rebuild it: it reads the rendered rows in document order, and
     * the only thing it takes from the store is which of them are siblings — `father`,
     * the same field the rail already reads for the Focus bar. The order is the DOM's.
     *
     * Two consequences worth naming. First, in Focus posture the tree pane is 0px tall
     * but still mounted, so the rows are there to be read (that is the whole reason the
     * pane is a height and not a mount). Second, the step does not write the selection
     * itself: it clicks the target row, so selection keeps travelling through the tree's
     * own handler and there is no second writer.
     */
    const stepSibling = useCallback((dir: 1 | -1) => {
        const body = containerRef.current?.querySelector('.tree-view-panel-body');
        if (!body) return;
        // One row per element: the same element can be rendered by more than one section
        // of the tree, and the first occurrence is the one the user is looking at.
        const seen = new Set<string>();
        const rows = (Array.from(body.querySelectorAll('.tree-row[data-element-id]')) as HTMLElement[])
            .filter(r => {
                const id = r.dataset.elementId;
                if (!id || seen.has(id)) return false;
                seen.add(id);
                return true;
            });
        const state: any = store.getState();
        const lookup = state.idlookup || {};
        const currentId: string | undefined = state._lastSelected?.modelElement;
        const father: string | undefined = currentId ? lookup[currentId]?.father : undefined;
        if (!currentId || !father) return;
        const siblings = rows.filter(r => lookup[r.dataset.elementId as string]?.father === father);
        if (siblings.length < 2) return;
        const idx = siblings.findIndex(r => r.dataset.elementId === currentId);
        if (idx < 0) return;
        // Wrapping at the ends, as the design prescribes.
        const target = siblings[(idx + dir + siblings.length) % siblings.length];
        (target.querySelector('.tree-row__content') as HTMLElement | null)?.click();
    }, [store]);

    // J/↓ next, K/↑ previous, only while the Focus bar is the one showing the position,
    // and never while a field owns the key. Arrow keys are left alone in Browse, where
    // the tree is on screen and owns them.
    useEffect(() => {
        if (posture !== 'focus') return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (isTypingTarget(e.target)) return;
            if (e.key === 'j' || e.key === 'J' || e.key === 'ArrowDown') { e.preventDefault(); stepSibling(1); }
            else if (e.key === 'k' || e.key === 'K' || e.key === 'ArrowUp') { e.preventDefault(); stepSibling(-1); }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [posture, stepSibling]);

    // Effective visibility (rail-based collapse model 2026-05-13): un pannello
    // "showXxx = true" significa espanso, "false" significa rail collassata.
    const showPropertiesPanel = isPropertiesVisible;
    const showTreePanel = isTreeViewVisible;

    // The rail renders iff at least one zone is shown, so `bothCollapsed` IS "rail
    // hidden". It used to gate the reopen pill as well; that cluster is gone (see the
    // note at the render below) and this is now purely the render gate.
    const bothCollapsed = !showPropertiesPanel && !showTreePanel;

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
            showInspector();
        };
        window.addEventListener(JjodelEvents.PROPERTIES_PIN_VIEW, handlePinView);
        return () => {
            window.removeEventListener(JjodelEvents.PROPERTIES_PIN_VIEW, handlePinView);
        };
    }, [pinnedSelected]);

    // Bring the Properties zone back from its collapsed rail, without touching the pin.
    // Reuses the same setter the pin handler above already uses —
    // it is the one mechanism the rail has for expanding, and this listener is only the
    // door onto it for callers outside this component (DockManager.openView).
    useEffect(() => {
        const handleShow = () => showInspector();
        window.addEventListener(JjodelEvents.PROPERTIES_SHOW, handleShow);
        return () => {
            window.removeEventListener(JjodelEvents.PROPERTIES_SHOW, handleShow);
        };
    }, []);

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

    // The tree pane is a height, not a mount: collapsing it in Focus must animate, so
    // the rows stay mounted (and keep their scroll position) at height 0. That the DOM
    // survives at height 0 is also what lets the Focus bar's sibling steppers read the
    // order the tree renders instead of recomputing it (R-RAIL-7).
    // Geometry, in order of precedence: Focus collapses to 0; with the inspector hidden
    // the tree is the only zone left and takes the rest; otherwise the preset height.
    const treePaneShown = showTreePanel && posture === 'browse';
    const treePaneStyle: React.CSSProperties = !treePaneShown
        ? { height: '0px', opacity: 0 }
        : showPropertiesPanel
            ? { height: preset.treePaneHeight, opacity: 1 }
            : { flex: '1 1 auto', minHeight: 0, opacity: 1 };

    // The Focus bar stands in for the tree pane: it says where the inspected element
    // sits and gets the user back. Only meaningful when the tree could be shown at all.
    const showFocusBar = showTreePanel && posture === 'focus' && !!selectedElementId;

    /**
     * Overflow affordance of the tree pane. The pane is clamped to a fraction of the
     * viewport, so the last visible row is routinely cut mid-height and nothing says
     * the list continues. Two gradients, top and bottom, appear only when there is
     * content past that edge.
     *
     * The verdict is written straight onto the DOM as data attributes instead of going
     * through state: it is recomputed on every scroll frame, and a re-render of the
     * whole rail per scroll tick would be paid for nothing — the fades are pure CSS.
     */
    const treeScrollRef = useRef<HTMLDivElement>(null);
    const treeFadeTopRef = useRef<HTMLDivElement>(null);
    // The scroller is held in STATE, not in a ref: the rail only renders its portal
    // once an editor tab is active, so at first mount the node does not exist yet and
    // a ref would leave the effect below wired to nothing, forever. A callback ref
    // re-runs the effect on the render that actually attaches the node.
    const [treeBodyEl, setTreeBodyEl] = useState<HTMLDivElement | null>(null);

    const measureTreeFade = useCallback(() => {
        const body = treeBodyEl;
        const wrap = treeScrollRef.current;
        if (!body || !wrap) return;
        // Sub-pixel slack: scrollHeight/clientHeight round differently under browser
        // zoom, and a 1px residue would leave a fade lit at the very bottom forever.
        const EPS = 2;
        const max = body.scrollHeight - body.clientHeight;
        const scrollable = max > EPS;
        wrap.dataset.fadeTop = scrollable && body.scrollTop > EPS ? '1' : '0';
        wrap.dataset.fadeBottom = scrollable && body.scrollTop < max - EPS ? '1' : '0';
        // The filter row is sticky and opaque at the top of the scroller: the top fade
        // starts where that row ends, so it dissolves the rows sliding under it and
        // never tints the row itself. Measured, never a literal — the row can be absent.
        const bar = body.querySelector('.tree-search') as HTMLElement | null;
        const offset = bar
            ? Math.max(0, bar.getBoundingClientRect().bottom - body.getBoundingClientRect().top)
            : 0;
        if (treeFadeTopRef.current) treeFadeTopRef.current.style.top = `${Math.round(offset)}px`;
    }, [treeBodyEl]);

    useEffect(() => {
        const body = treeBodyEl;
        if (!body) return;
        // One measurement per frame at most, whatever fired it.
        let frame = 0;
        const schedule = () => {
            if (frame) return;
            frame = requestAnimationFrame(() => { frame = 0; measureTreeFade(); });
        };
        schedule();
        body.addEventListener('scroll', schedule, { passive: true });
        window.addEventListener('resize', schedule);
        // Height of the viewport (density bands, Focus posture, window) and height of
        // the content (expand/collapse, which changes scrollHeight with no scroll event).
        const ro = new ResizeObserver(schedule);
        ro.observe(body);
        const content = body.firstElementChild;
        if (content) ro.observe(content);
        const mo = new MutationObserver(schedule);
        mo.observe(body, { childList: true, subtree: true });
        return () => {
            if (frame) cancelAnimationFrame(frame);
            body.removeEventListener('scroll', schedule);
            window.removeEventListener('resize', schedule);
            ro.disconnect();
            mo.disconnect();
        };
    }, [treeBodyEl, measureTreeFade]);

    const splitPanel = (
        <div
            ref={containerRef}
            className={`properties-with-tree-view${isFloating ? ' properties-with-tree-view--floating properties-with-tree-view--rail' : ''}${isFloating && posture === 'focus' ? ' properties-with-tree-view--rail-focus' : ''}`}
            data-density={densityForWidth(overlayWidth)}
        >
            {/* Rail width handle: left edge of the column. Dragging left widens the rail. */}
            <div
                className="properties-panel-resize-handle"
                onMouseDown={handlePropsResizeStart}
                role="separator"
                aria-orientation="vertical"
                aria-label="Resize properties panel"
            />

            {/* No header row (2026-08-26). The rail used to open with a 44px bar carrying
                the model name, a badge, the Focus/Browse posture button, the contextual
                help, the pin and the inspector collapse. The name and the badge moved up
                into the canvas topbar, where they name the open editor once instead of
                once per column; the collapse control went with them and widened on the
                way, from the inspector alone to the whole rail. Help lives in the
                app bar's Help menu; the pin button and the posture button are retired —
                their state machines are not (see `pinnedSelected` above, still driven by
                PROPERTIES_PIN_VIEW, and `posture`, still switched by leaf selection, by
                Escape and by the Focus bar's own Structure chip).

                The rail therefore opens on the filter band, then the Filter field. */}

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
                    {/* Scope bar: dentro il container e fuori dal body, così non
                        scorre via con l'albero. */}
                    <TreeViewScopeBarLive />
                    {/* Overflow affordance: the scroller plus the two fades that say
                        there is more above / below. The wrapper exists only to be the
                        positioning context of the fades — the body keeps its class,
                        its scroll and its role as the queried scroll container. */}
                    <div className="tree-view-panel-scroll" ref={treeScrollRef}>
                        <div className="tree-view-panel-body" ref={setTreeBodyEl}>
                            <TreeViewContent />
                        </div>
                        <div className="tree-view-panel-fade tree-view-panel-fade--top" ref={treeFadeTopRef} aria-hidden="true" />
                        <div className="tree-view-panel-fade tree-view-panel-fade--bottom" aria-hidden="true" />
                    </div>
                </div>
            )}

            {/* Focus breadcrumb bar (34px): only while the tree pane is collapsed. */}
            {showFocusBar && (
                <div className="rail-focusbar">
                    <button
                        type="button"
                        className="rail-focusbar__back"
                        onClick={() => setPosture('browse')}
                        title="Back to the structure"
                    >
                        <i className="bi bi-diagram-3" aria-hidden="true" />
                        {selectedOwnerName || 'Structure'}
                    </button>
                    <i className="bi bi-chevron-right rail-focusbar__sep" aria-hidden="true" />
                    <span className="rail-focusbar__current">{selectedName}</span>
                    <div className="rail-focusbar__spacer" />
                    <button
                        type="button"
                        className="rail-focusbar__step"
                        onClick={() => stepSibling(-1)}
                        aria-label="Previous sibling"
                        title="Previous sibling (K)"
                    >
                        <i className="bi bi-chevron-up" aria-hidden="true" />
                    </button>
                    <button
                        type="button"
                        className="rail-focusbar__step"
                        onClick={() => stepSibling(1)}
                        aria-label="Next sibling"
                        title="Next sibling (J)"
                    >
                        <i className="bi bi-chevron-down" aria-hidden="true" />
                    </button>
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
        {/* No reopen pill (2026-08-26). A floating cluster of two buttons used to
            appear on the right edge while the rail was hidden, one to bring back the
            inspector and one the tree. It was the only way back when the rail's own
            header was the thing that collapsed it; now the topbar's own control is the
            way in and the way out, always in the same place, so the cluster was a
            second door onto a room that already has one — and one that sat on the
            canvas, which is exactly the surface the user asked to clear.

            No dead end follows. The topbar renders wherever the rail can: both are
            gated on a model/metamodel editor. The two states the CSS kill-switch
            covered are not exceptions either — `canvas-only` is normalised away at
            mount (Toolbar.tsx), and on the documentation tab the rail is hidden by
            CSS without any state change, so leaving the tab brings it back by itself. */}
        </>
    );
};

export default PropertiesWithTreeView;
