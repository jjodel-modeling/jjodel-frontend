import {BoxData, DockLayout, PanelData, TabData} from 'rc-dock';
import { JjodelEvents } from '../../events/registry';
import type {GObject, DViewPoint, LViewPoint} from '../../joiner';
import {LModel, LProject, RuntimeAccessible, SetRootFieldAction, U, store} from '../../joiner';
import TabDataMaker from "./tabs/TabDataMaker";
import { managerTabId } from "./tabs/instanceManagerModel";
import { layoutTabIds, modelOfTabId, nextModelTabId } from "./tabs/modelTabId";
import { activeGroup, groupOfTab, noteActiveTab, withSplitRight } from "./tabs/dockGroups";
import { isConsumerMode } from '../environment/consumerMode';
import { besideAction, type BesidePanel } from '../scripts/refactoringBeside';
import { activateCanvasPane, NO_CANVAS_SPLIT, reconcileCanvasSplit, type CanvasSplit } from '../editor-v2/utils/canvasSplit';
import {DocumentationTab} from "./tabs/DocumentationTab";
import React from 'react';
import { JjtlDevelopmentEnv, ModelOption } from '../../jjtl/components';
import { JjtlTransformation, TransformationAST } from '../../jjtl/types';
import { MetamodelElement } from '../../jjtl/views/MetamodelTreeView';
import type { ExecutionResult } from '../../jjtl/executor';
import type { RunRecord } from '../../jjtl/components/sourceSelection';

@RuntimeAccessible('DockManager')
class DockManager {
    static cname = "DockManager";
    static dock: DockLayout|null;

    // The canvases shown side by side and the active one (multi-tab L6c, P-2026-11-08-1855).
    static canvasSplit: CanvasSplit = NO_CANVAS_SPLIT;
    private static canvasSplitListeners = new Set<() => void>();

    static subscribeCanvasSplit = (listener: () => void): (() => void) => {
        DockManager.canvasSplitListeners.add(listener);
        return () => { DockManager.canvasSplitListeners.delete(listener); };
    };

    static getCanvasSplit = (): CanvasSplit => DockManager.canvasSplit;

    // R-MT-30 (Q6): the active group shows no canvas while another group does; the palette shows collapsed.
    static paletteCollapsed = false;
    static getPaletteCollapsed = (): boolean => DockManager.paletteCollapsed;

    private static setCanvasSplit(next: CanvasSplit, paletteCollapsed: boolean = DockManager.paletteCollapsed): void {
        if (next === DockManager.canvasSplit && paletteCollapsed === DockManager.paletteCollapsed) return;
        DockManager.canvasSplit = next;
        DockManager.paletteCollapsed = paletteCollapsed;
        DockManager.canvasSplitListeners.forEach(listener => listener());
    }

    /**
     * Re-reads the split from the dock: the same rows the split's SCSS matches, and the editor each panel shows. A Refactoring split is none.
     * Editor groups (R-MT-30): a group whose active tab is no canvas is a group without canvas, not the end of the split (Q6); the canvas of
     * the active group is the active pane, and with no canvas there the last active one stays, its palette collapsed.
     */
    static refreshCanvasSplit = (): void => {
        const box = document.querySelector('.not-strip > .dock-layout > .dock-hbox');
        const beside = !box || !!box.querySelector(':scope > .dock-panel .script-tab--beside');
        const rows = beside ? [] : [...box.querySelectorAll<HTMLElement>(':scope > .dock-panel.dock-style-models')];
        const canvasOf = (row: Element | undefined) => row?.querySelector<HTMLElement>('.dock-tabpane-active .editor-v2') ?? null;
        const panes = rows.map(canvasOf).filter((pane): pane is HTMLElement => pane !== null);
        let split = reconcileCanvasSplit(DockManager.canvasSplit, panes);
        const layout = DockManager.dock?.getLayout();
        const groupId = layout ? activeGroup(layout)?.id : undefined;
        const activeRow = rows.find(row => row.dataset.dockid === groupId);
        const activeCanvas = canvasOf(activeRow);
        if (activeCanvas) split = activateCanvasPane(split, activeCanvas);
        DockManager.setCanvasSplit(split, !!activeRow && !activeCanvas && panes.length > 0);
    };

    static activateCanvasPane(pane: HTMLElement): void {
        DockManager.setCanvasSplit(activateCanvasPane(DockManager.canvasSplit, pane));
    }

    /**
     * Close a tab by its ID
     * @param tabId - The ID of the tab to close
     * @returns true if the tab was found and closed, false otherwise
     */
    static closeTab(tabId: string): boolean {
        if (!DockManager.dock) {
            console.warn('[DockManager] Dock not available, cannot close tab');
            return false;
        }

        try {
            const existingTab = DockManager.dock.find(tabId);
            // Check if it's a TabData (has 'content' property) or PanelData (has 'tabs' property)
            if (existingTab && ('content' in existingTab || 'tabs' in existingTab)) {
                // console.log('[DockManager] Closing tab:', tabId);
                DockManager.dock.dockMove(existingTab as TabData, null, 'remove');
                return true;
            }
            return false;
        } catch (error) {
            console.error('[DockManager] Error closing tab:', error);
            return false;
        }
    }

    /**
     * Close all tabs associated with an entity (metamodel, model, transformation, etc.)
     * This handles different tab ID patterns:
     * - Metamodel/Model: entityId directly
     * - Documentation: doc_${entityId}
     * - Transformation: jjtl_${entityId}
     *
     * @param entityId - The ID of the entity being deleted
     * @param entityType - Optional type to specify which patterns to check
     */
    static closeTabsForEntity(entityId: string, entityType?: 'metamodel' | 'model' | 'transformation' | 'documentation' | 'viewpoint'): void {
        if (!DockManager.dock || !entityId) {
            return;
        }

        // console.log('[DockManager] Closing tabs for entity:', { entityId, entityType });

        // Tab IDs to try closing
        const tabIds: string[] = [];

        if (!entityType || entityType === 'metamodel' || entityType === 'model') {
            // Metamodel/Model tabs use the entity ID directly
            tabIds.push(entityId);
            // ...and its further tabs (R-MT-9), wherever they were docked.
            tabIds.push(...layoutTabIds(DockManager.dock.getLayout()).filter(id => id !== entityId && modelOfTabId(id) === entityId));
            // Also close any documentation tab for this model
            tabIds.push(`doc_${entityId}`);
            // ...and its instance manager, which is a second tab on the same
            // subject. Without this line deleting an M1 leaves its manager open
            // on a model that no longer exists.
            tabIds.push(managerTabId(entityId));
        }

        if (!entityType || entityType === 'transformation') {
            // Transformation tabs use jjtl_ prefix
            tabIds.push(`jjtl_${entityId}`);
        }

        if (!entityType || entityType === 'viewpoint') {
            // Viewpoint tabs use vp_ prefix
            tabIds.push(`vp_${entityId}`);
        }

        if (entityType === 'documentation') {
            tabIds.push(`doc_${entityId}`);
        }

        // Try to close each tab
        tabIds.forEach(tabId => {
            DockManager.closeTab(tabId);
        });
    }

    static async open(group: 'models'|'editors', tab: TabData): Promise<void> {
        if(!DockManager.dock) return;
        const target = DockManager.activeGroupPanel();
        // G3 (R-MT-30): a model opens as a tab in the active group, or is focused there when the group has one of its
        // tabs; open only in another group, a copy opens in the active group. Any other tab is focused where it is (Q3).
        if (tab.id) {
            const modelId = modelOfTabId(tab.id);
            const model = (store.getState() as any).idlookup?.[modelId];
            const isModelTab = model?.className === 'DModel' && !model.isMetamodel && tab.id === modelId;
            const here = isModelTab && target ? target.tabs.find(t => modelOfTabId(t.id as string) === modelId) : undefined;
            if (here) {
                DockManager.dock.updateTab(here.id as string, null as any, true);
                return;
            }
            const existing = DockManager.dock.find(tab.id);
            if (existing && 'content' in existing) {
                const elsewhere = isModelTab && target && groupOfTab(DockManager.dock.getLayout(), tab.id) !== target;
                if (!elsewhere) {
                    DockManager.dock.updateTab(tab.id, null as any, true);
                    return;
                }
                const copy = DockManager.makeModelTab(modelId, undefined);
                if (copy && target) DockManager.dock.dockMove(copy, target, 'middle');
                return;
            }
        }
        if (target) {
            DockManager.dock.dockMove(tab, target, 'middle');
            return;
        }
        // F1 (2026-07-29 floating panels): both groups resolve to the canvas child
        // children[0]. The 'editors' group (Documentation opened via Jodie) is
        // redirected here from the former right child ahead of F2's removal of the
        // right dock panel, so the doc tab survives that removal. 'models' already
        // targeted children[0]. See
        // docs/discovery/discovery_2026-07-28_floating_panels_canvas.md (B5b, risk #1).
        const index = 0;
        DockManager.dock.dockMove(tab, DockManager.dock.getLayout().dockbox.children[index], 'middle');
    }

    /**
     * Activate the `project_summary` tab if it is not already the active one.
     *
     * Callers are affordances outside the dock (the project rail) that trigger UI
     * owned by ProjectEditor — modals and the metamodel-selection dropdown. That UI
     * lives inside the `project_summary` tab content, and rc-dock lays inactive panes
     * out off-screen inside a clipped container, so a `position:fixed` modal rendered
     * in a hidden pane resolves against the translated ancestor and never shows.
     *
     * The rail is visible on the summary tab (already active — this is a no-op) and on
     * the Documentation tab (`doc_*`), which is the case this exists for.
     *
     * @returns true if the tab was found (and thus activated), false otherwise.
     */
    static activateProjectSummary(): boolean {
        if (!DockManager.dock) return false;
        try {
            const existing = DockManager.dock.find('project_summary');
            if (!existing || !('content' in existing)) return false;
            // Same activation call as the open() guard: null payload, activate = true.
            DockManager.dock.updateTab('project_summary', null as any, true);
            return true;
        } catch (error) {
            console.error('[DockManager] Error activating project summary:', error);
            return false;
        }
    }

    static async open2(me: LModel): Promise<void> {
        // #157 Fase 3: in consumer mode (a ?profile= is active) metamodels are not editable —
        // refuse to open the M2 editor even if something asks. Models stay open.
        if (isConsumerMode() && me?.isMetamodel) {
            console.warn('[DockManager] open2: metamodels are hidden in consumer mode', me?.id);
            return;
        }
        const tab = (me.isMetamodel) ? TabDataMaker.metamodel(me) : TabDataMaker.model(me);
        await DockManager.open('models', tab);
        const editorType = me.isMetamodel ? 'metamodel' : 'model';
        // console.log('[OPEN2] about to dispatch', { editorType });
        window.dispatchEvent(new CustomEvent(JjodelEvents.EDITOR_TYPE_CHANGE, {
            detail: { editorType, modelId: me.id }
        }));
    }

    /**
     * Open the instance manager of a model — the third kind of project tab.
     *
     * Sister of `open2`, and deliberately not folded into it: `open2` picks the
     * surface from `isMetamodel`, which is a property of the model, while the
     * manager is a property of what the user asked for. A model has both tabs
     * available at once and they coexist in the same dock group.
     *
     * Metamodels are refused rather than silently ignored: the manager catalogues
     * INSTANCES, and an M2 has none. Returns false so the caller can tell.
     */
    /**
     * Open the editor tab of a project script file (S6a, R-JJD-5), or raise it when it is open.
     * Returns false when the dock is not ready or the project has no such script. `written` is an
     * entry the caller has just written: the store commits in batches, so it may not be there yet.
     */
    static openScript(scriptId: string, written?: { id: string; name: string }): boolean {
        if (!DockManager.dock || !scriptId) return false;
        const pid = U.getProjectID_URL();
        const scripts = ((pid && (store.getState() as any).idlookup?.[pid]?.scripts) || []) as Array<{ id: string; name: string }>;
        const script = scripts.find(s => s.id === scriptId) || (written?.id === scriptId ? written : undefined);
        if (!script) {
            console.warn('[DockManager] openScript: no such script in the project', scriptId);
            return false;
        }
        void DockManager.open('models', TabDataMaker.script(script));
        // A code tab with no model under it: the panels follow it as they follow a JjTL tab
        // (`EditorType` has no 'script' member).
        window.dispatchEvent(new CustomEvent(JjodelEvents.EDITOR_TYPE_CHANGE, {
            detail: { editorType: 'transformation', modelId: scriptId }
        }));
        return true;
    }

    /**
     * Show the canvas tab `tabId` (a model id, or the id of a further tab on a model, R-MT-24) in the dock panel right of the tab `besideTabId`
     * (P-2026-10-25-0020, the Refactoring tab beside its target): raise it there when it already is,
     * move it there when it is open elsewhere, open it there otherwise. It never splits: Split Right is
     * the only way to make a group (R-MT-30, Q12), so with no group right of `besideTabId`'s it returns
     * false and the Refactoring tab keeps its own class-box pane. `ratio` is no longer read (it sized the split).
     * Never a second instance of the tab. Returns false when the dock cannot place it (no group to the
     * right, the tab is floating, maximized or nested, no such model, consumer mode for a metamodel).
     */
    static openBeside(besideTabId: string, tabId: string, ratio: number, viewpointId?: string | null): boolean {
        const dock = DockManager.dock;
        if (!dock || !besideTabId || !tabId) return false;
        const modelId = modelOfTabId(tabId);
        const model = (store.getState() as any).idlookup?.[modelId];
        if (model?.className !== 'DModel') return false;
        if (isConsumerMode() && model.isMetamodel) return false;
        if (tabId !== modelId && model.isMetamodel) return false;
        try {
            const layout = dock.getLayout();
            if (layout?.dockbox?.mode !== 'horizontal' || layout.maxbox?.children?.length) return false;
            const children = layout.dockbox.children as Array<PanelData | BoxData>;
            const panels: BesidePanel[] = children.map(c => ({
                id: c.id as string,
                tabIds: 'tabs' in c ? c.tabs.map(t => t.id as string) : [],
            }));
            const action = besideAction(panels, besideTabId, tabId);
            if (action.kind === 'unavailable') return false;
            const target = children.find(c => c.id === action.panelId);
            if (!target || !('tabs' in target)) return false;
            const open = () => dock.find(tabId) as TabData | undefined;
            const fresh = () => (model.isMetamodel ? TabDataMaker.metamodel(model) : TabDataMaker.model(model, { tabId, viewpointId }));
            switch (action.kind) {
                case 'activate': dock.updateTab(tabId, null as any, true); return true;
                case 'move-into': dock.dockMove(open() as TabData, target, 'middle'); return true;
                case 'open-into': dock.dockMove(fresh(), target, 'middle'); return true;
                // No split here (R-MT-30, Q12): Split Right is the only way to make a group.
                case 'split-move': case 'split-open': return false;
            }
            return true;
        } catch (error) {
            console.error('[DockManager] openBeside:', error);
            return false;
        }
    }

    /**
     * A further tab on the M1 model `modelId`, on `viewpointId` (null: abstract syntax), or the model's
     * first tab when none is open (R-MT-9). No second tab on a metamodel: it owns no tab viewpoint.
     */
    static async openModelTab(modelId: string, viewpointId: string | null): Promise<void> {
        const tab = DockManager.makeModelTab(modelId, viewpointId);
        if (tab) await DockManager.open('models', tab);
    }

    /**
     * «Open beside ▸ <viewpoint>» of the Tree View (R-MT-24), now Split Right with that viewpoint (R-MT-30, Q8): a new
     * group right of the active one, holding a further tab on the model. When the dock cannot split it opens as a new
     * tab in the active group, on the same viewpoint.
     */
    static openModelTabBeside(modelId: string, viewpointId: string | null): void {
        if (DockManager.splitRightModel(modelId, viewpointId)) return;
        const tab = DockManager.makeModelTab(modelId, viewpointId);
        if (tab) void DockManager.open('models', tab);
    }

    /** The active editor group (R-MT-30): the group of the last focused or activated tab, else the first. */
    static activeGroupPanel(): PanelData | null {
        const layout = DockManager.dock?.getLayout();
        return layout ? (activeGroup(layout) as PanelData | null) : null;
    }

    /**
     * Split Right (R-MT-30, G2): a new group immediately right of the group of the tab `tabId`, holding a copy of it on
     * `viewpointId` (same model, so the layout is shared, R-MT-4); rc-dock halves the group's width (Q2). The new tab is
     * active. False when the tab is no M1 model's (a metamodel has no second tab), not in a group, or something is maximized.
     */
    static splitRight(tabId: string, viewpointId: string | null): boolean {
        const layout = DockManager.dock?.getLayout();
        const group = layout ? groupOfTab(layout, tabId) : null;
        return !!group && DockManager.splitRightOf(group as PanelData, modelOfTabId(tabId), viewpointId);
    }

    /** Split Right of the active group with a further tab on the M1 model `modelId`, on `viewpointId` (Q8). */
    static splitRightModel(modelId: string, viewpointId: string | null): boolean {
        const group = DockManager.activeGroupPanel();
        return !!group && DockManager.splitRightOf(group, modelId, viewpointId);
    }

    private static splitRightOf(group: PanelData, modelId: string, viewpointId: string | null): boolean {
        const dock = DockManager.dock;
        if (!dock || dock.getLayout()?.maxbox?.children?.length) return false;
        const tab = DockManager.makeModelTab(modelId, viewpointId);
        if (!tab) return false;
        try {
            withSplitRight(() => dock.dockMove(tab, group, 'right'));
        } catch (error) {
            console.error('[DockManager] splitRight:', error);
            return false;
        }
        const placed = groupOfTab(dock.getLayout(), tab.id as string);
        if (!placed || placed === group) return false;
        noteActiveTab(tab.id as string);
        return true;
    }

    private static makeModelTab(modelId: string, viewpointId: string | null | undefined): TabData | null {
        const dock = DockManager.dock;
        const model = (store.getState() as any).idlookup?.[modelId];
        if (!dock || model?.className !== 'DModel' || model.isMetamodel) return null;
        const tabId = nextModelTabId(modelId, layoutTabIds(dock.getLayout()));
        return TabDataMaker.model(model, { tabId, viewpointId });
    }

    /** The share of the width the tab `besideTabId`'s panel takes from it and the panel to its right; null when there is none. */
    static besideRatio(besideTabId: string): number | null {
        const kids = DockManager.dock?.getLayout()?.dockbox?.children ?? [];
        const at = kids.findIndex(c => 'tabs' in c && c.tabs.some(t => t.id === besideTabId));
        const left = kids[at];
        const right = kids[at + 1];
        if (at < 0 || !right || !(left.size! > 0) || !(right.size! > 0)) return null;
        return left.size! / (left.size! + right.size!);
    }

    static async openManager(me: LModel): Promise<boolean> {
        if (!me?.id) return false;
        if (me.isMetamodel) {
            console.warn('[DockManager] openManager: metamodels have no instances', me.id);
            return false;
        }
        await DockManager.open('models', TabDataMaker.instanceManager(me));
        return true;
    }

    /**
     * Open Documentation Tab in the left dock area
     */
    static openDocumentation(project: LProject, documentation?: any): void {
        // console.log('[DockManager] openDocumentation called', { projectId: project?.id, dockAvailable: !!DockManager.dock });

        if (!DockManager.dock) {
            console.warn('[DockManager] Dock not available, cannot open documentation');
            U.alert('w', 'Cannot open documentation', 'Please open a metamodel or model first.');
            return;
        }

        if (!project?.id) {
            console.warn('[DockManager] No project ID provided');
            return;
        }

        const tabId = `doc_${project.id}`;

        try {
            // Check if tab already exists
            const existingTab = DockManager.dock.find(tabId);
            if (existingTab) {
                // console.log('[DockManager] Activating existing documentation tab');
                DockManager.dock.updateTab(tabId, null as any, true);
                window.dispatchEvent(new CustomEvent(JjodelEvents.EDITOR_TYPE_CHANGE, {
                    detail: { editorType: 'summary', modelId: project.id }
                }));
                return;
            }

            // Create new Documentation tab
            const tab: TabData = {
                id: tabId,
                title: React.createElement('div', {
                    className: 'tab-title active-on-mouseenter',
                    'data-type': 'documentation'
                }, 'Documentation'),
                group: 'models',
                closable: true,
                content: React.createElement(DocumentationTab, { modelid: project.id })
            };

            const target = DockManager.activeGroupPanel();
            if (target) {
                // console.log('[DockManager] Creating new documentation tab');
                DockManager.dock.dockMove(tab, target, 'middle');
                window.dispatchEvent(new CustomEvent(JjodelEvents.EDITOR_TYPE_CHANGE, {
                    detail: { editorType: 'summary', modelId: project.id }
                }));
            } else {
                console.warn('[DockManager] Dock layout not ready');
                U.alert('w', 'Cannot open documentation', 'The editor layout is not ready. Please try again.');
            }
        } catch (error) {
            console.error('[DockManager] Error opening documentation:', error);
            U.alert('e', 'Error', 'Failed to open documentation tab.');
        }
    }

    /**
     * Select a viewpoint in the Properties panel. Sets `_lastSelected.view` so that
     * Info.tsx renders the `ViewpointProperties` form (Name, Type, Exclusive).
     *
     * Called from the dashboard (project summary) and tree view clicks. The
     * Properties panel is CSS-hidden in summary mode (`body[data-editor-type="summary"]`),
     * so if no editor tab is currently active we first open the project's first
     * metamodel via `open2()` — which dispatches EDITOR_TYPE_CHANGE and reveals
     * the right-side Properties panel — and then set the selection after a short
     * delay to let the tab mount.
     */
    static openViewpoint(vp: DViewPoint | LViewPoint): void {
        if (!vp?.id) {
            console.warn('[DockManager] openViewpoint: invalid viewpoint');
            return;
        }
        // #157 Fase 3: viewpoints are a developer surface — hidden in consumer mode.
        if (isConsumerMode()) {
            console.warn('[DockManager] openViewpoint: viewpoints are hidden in consumer mode', vp.id);
            return;
        }

        const applySelection = () => {
            try {
                SetRootFieldAction.new('_lastSelected' as any, {
                    node: '',
                    view: vp.id,
                    modelElement: '',
                });
            } catch (error) {
                console.error('[DockManager] Error selecting viewpoint:', error);
            }
        };

        // If a metamodel/model editor is already active, just update the selection.
        const currentEditorType = document.body.getAttribute('data-editor-type');
        if (currentEditorType === 'metamodel' || currentEditorType === 'model') {
            applySelection();
            return;
        }

        // No editor active — open the project's first metamodel so the Properties
        // panel becomes visible (CSS keys off body[data-editor-type]).
        try {
            const project = LProject.getProject();
            const firstMetamodel = project?.metamodels?.[0] as LModel | undefined;
            if (!firstMetamodel) {
                console.warn('[DockManager] openViewpoint: no metamodel in project; selecting anyway (Properties panel may be hidden).');
                applySelection();
                return;
            }
            DockManager.open2(firstMetamodel).then(() => {
                // Delay lets the tab mount + EDITOR_TYPE_CHANGE propagate before
                // Info.tsx reads _lastSelected.view.
                setTimeout(applySelection, 200);
            });
        } catch (error) {
            console.error('[DockManager] Error opening viewpoint:', error);
            applySelection();
        }
    }

    /**
     * Select a view in the Properties panel, which is where views are edited: Info.tsx
     * renders `ViewData` (Apply to / Template / Style / Events / Options) for a
     * DViewElement sitting in `_lastSelected.view`.
     *
     * The triple is written whole and atomically, so opening the views editor on a view
     * clears `node` and `modelElement`. That deselection is accepted behaviour, not an
     * oversight: the panel shows one thing at a time and the view is the thing asked for.
     *
     * Also asks the rail to expand. A collapsed rail would swallow the whole action —
     * the selection would be correct and nothing would be on screen.
     */
    static openView(viewId: string): void {
        if (!viewId) {
            console.warn('[DockManager] openView: invalid view id');
            return;
        }
        try {
            SetRootFieldAction.new('_lastSelected' as any, {
                node: '',
                view: viewId,
                modelElement: '',
            });
            window.dispatchEvent(new CustomEvent(JjodelEvents.PROPERTIES_SHOW));
        } catch (error) {
            console.error('[DockManager] Error selecting view:', error);
        }
    }

    /**
     * Open JjTL Transformation Editor Tab
     * @param transformation - The transformation to open
     * @param sourceMetamodel - Optional source metamodel data (MetamodelElement[])
     * @param targetMetamodel - Optional target metamodel data (MetamodelElement[])
     * @param onSave - Optional callback when code is saved
     * @param getSourceMetamodel - Optional getter for fresh source metamodel data
     * @param getTargetMetamodel - Optional getter for fresh target metamodel data
     * @param availableModels - Optional list of models available for transformation execution
     * @param existingModelNames - Optional list of existing model names (to prevent duplicates)
     * @param onExecuteTransformation - Optional callback when transformation is executed
     * @param getLastRun - Optional getter for the record of the last run of this transformation
     */
    static openTransformation(
        transformation: JjtlTransformation,
        sourceMetamodel?: MetamodelElement[],
        targetMetamodel?: MetamodelElement[],
        onSave?: (code: string) => void,
        getSourceMetamodel?: () => MetamodelElement[],
        getTargetMetamodel?: () => MetamodelElement[],
        availableModels?: ModelOption[],
        existingModelNames?: string[],
        onExecuteTransformation?: (sourceModelId: string, outputModelName: string, ast: TransformationAST, includedModelIds?: string[]) => Promise<ExecutionResult | void>,
        getLastRun?: () => RunRecord | null
    ): void {
        // console.log('[DockManager] openTransformation called', {
        //     transformationId: transformation?.id,
        //     name: transformation?.name,
        //     dockAvailable: !!DockManager.dock,
        //     hasSourceMetamodel: !!sourceMetamodel?.length,
        //     hasTargetMetamodel: !!targetMetamodel?.length,
        //     hasGetters: !!(getSourceMetamodel && getTargetMetamodel)
        // });

        if (!DockManager.dock) {
            console.warn('[DockManager] Dock not available, cannot open transformation');
            U.alert('w', 'Cannot open transformation', 'Please open a metamodel or model first to initialize the editor.');
            return;
        }

        if (!transformation?.id) {
            console.warn('[DockManager] No transformation ID provided');
            return;
        }

        const tabId = `jjtl_${transformation.id}`;

        // EDGE CASE — keystroke autosync (debounced 300ms).
        // JjtlDevelopmentEnv keeps typed code in its own internal state and only
        // calls onSave when the user clicks the editor toolbar's Save button. If
        // the user instead triggers Save Project (Cmd+S, etc.) without first
        // saving in the editor, compressedState would serialize the stale
        // transformation.code (the template generated at createTransformation
        // time), and on reload the user would see the template instead of their
        // edits. To prevent this data loss, mirror every keystroke into the
        // ProjectEditor's transformation store via the same onSave callback,
        // debounced so we don't dispatch a Redux action per character.
        let debounceTimer: ReturnType<typeof setTimeout> | null = null;
        const flushDebounce = () => {
            if (debounceTimer) { clearTimeout(debounceTimer); debounceTimer = null; }
        };
        const debouncedSync = (code: string) => {
            flushDebounce();
            debounceTimer = setTimeout(() => {
                debounceTimer = null;
                onSave?.(code);
            }, 300);
        };
        const explicitSave = onSave ? (code: string) => {
            flushDebounce();
            onSave(code);
        } : undefined;

        // Create tab content with current props (needed for both new and existing tabs)
        const tabContent = React.createElement(JjtlDevelopmentEnv, {
            initialCode: transformation.code,
            sourceMetamodel: sourceMetamodel || [],
            targetMetamodel: targetMetamodel || [],
            getSourceMetamodel: getSourceMetamodel,
            getTargetMetamodel: getTargetMetamodel,
            sourceMetamodelName: transformation.sourceMetamodelName || 'Source',
            sourceMetamodelId: transformation.sourceMetamodelId,
            targetMetamodelName: transformation.targetMetamodelName || 'Target',
            availableModels: availableModels || [],
            existingModelNames: existingModelNames || [],
            onSave: explicitSave,
            onCodeChange: debouncedSync,
            onExecuteTransformation: onExecuteTransformation,
            getLastRun: getLastRun
        });

        try {
            // Check if tab already exists
            const existingTab = DockManager.dock.find(tabId);
            if (existingTab) {
                // console.log('[DockManager] Updating and activating existing transformation tab');
                // CRITICAL: Update tab content with fresh callbacks to avoid stale closures
                DockManager.dock.updateTab(tabId, { content: tabContent } as any, true);
                window.dispatchEvent(new CustomEvent(JjodelEvents.EDITOR_TYPE_CHANGE, {
                    detail: { editorType: 'transformation', modelId: transformation.id }
                }));
                return;
            }


            // Create new JjTL Development Environment tab
            const title = (
                <div className="tab-title active-on-mouseenter">
                    <i className='bi bi-arrow-left-right' style={{ marginRight: '6px', fontSize: '12px' }}/>
                    {transformation.name || 'Transformation'}
                </div>);
            const tab: TabData = {
                id: tabId,
                group: 'models',
                closable: true,
                title,
                content: tabContent
            };

            const target = DockManager.activeGroupPanel();
            if (target) {
                // console.log('[DockManager] Creating new transformation tab');
                DockManager.dock.dockMove(tab, target, 'middle');
                window.dispatchEvent(new CustomEvent(JjodelEvents.EDITOR_TYPE_CHANGE, {
                    detail: { editorType: 'transformation', modelId: transformation.id }
                }));
            } else {
                console.warn('[DockManager] Dock layout not ready');
                U.alert('w', 'Cannot open transformation', 'The editor layout is not ready. Please try again.');
            }
        } catch (error) {
            console.error('[DockManager] Error opening transformation:', error);
            U.alert('e', 'Error', 'Failed to open transformation editor.');
        }
    }

}

export default DockManager;
