/**
 * StatusBar Component
 * Fixed 28px bar at the bottom of the application.
 *
 * Left zone: contextual info — project stats OR editor breadcrumb with stats.
 * Right zone: delegated to StatusBarRightZone (shared with JjTL status bar).
 *
 * Context detection:
 * - Project view (first tab active): shows metamodel/model/transformation counts.
 * - Metamodel editor: shows "metamodel_1 | N classes · M attributes · K references | › ClassName".
 * - Model editor: shows "model_1 | N instances · MetamodelName | › objectName : ClassName".
 * - JjTL editor active: hides entirely (JjTL has its own status bar).
 *
 * Visibility fix: jjtlActive is driven by the active tab ID (primary) AND the
 * JjtlDevelopmentEnv mount/unmount event (backup). This ensures the StatusBar
 * reappears when switching from a transformation tab to a model/metamodel tab,
 * even if JjtlDevelopmentEnv doesn't unmount (rc-dock keeps tabs alive).
 */

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { DState } from '../joiner';
import { LPointerTargetable } from '../joiner';
import StatusBarRightZone from './StatusBarRightZone';
import { JjodelEvents } from '../events/registry';
import './StatusBar.scss';

// ─── Types ───────────────────────────────────────────────────────────

type StatusBarContext = 'project' | 'editor';

interface ProjectStats {
    metamodels: number;
    models: number;
    transformations: number;
}

interface ActiveModelInfo {
    id: string;
    name: string;
    isMetamodel: boolean;
}

interface SelectedElement {
    name: string;
    detail: string;
}

type EditorStats =
    | { type: 'metamodel'; classCount: number; attrCount: number; opCount: number; enumCount: number; refCount: number }
    | { type: 'model'; objectCount: number; conformsTo: string };

// ─── Equality helpers ────────────────────────────────────────────────

/** Shallow equality for EditorStats (avoids re-renders when values haven't changed). */
function statsEqual(a: EditorStats | null, b: EditorStats | null): boolean {
    if (a === b) return true;
    if (!a || !b) return false;
    if (a.type !== b.type) return false;
    if (a.type === 'metamodel' && b.type === 'metamodel') {
        return a.classCount === b.classCount && a.attrCount === b.attrCount
            && a.opCount === b.opCount && a.enumCount === b.enumCount && a.refCount === b.refCount;
    }
    if (a.type === 'model' && b.type === 'model') {
        return a.objectCount === b.objectCount && a.conformsTo === b.conformsTo;
    }
    return false;
}

// ─── Hooks ───────────────────────────────────────────────────────────

/**
 * Derive project-level stats from the Redux state.
 */
function useProjectStats(): ProjectStats | null {
    return useSelector((state: DState) => {
        try {
            const projectId = (state as any)._openProject;
            if (!projectId) return null;
            const project = (state as any)[projectId];
            if (!project) return null;

            const mmCount = Array.isArray(project.metamodels) ? project.metamodels.length : 0;
            const mCount = Array.isArray(project.models) ? project.models.length : 0;

            return { metamodels: mmCount, models: mCount, transformations: 0 };
        } catch {
            return null;
        }
    });
}

/**
 * Get the active editor model.
 * Primary: from the active tab ID (model pointer used as tab ID).
 * Fallback: from _lastSelected (walk up to find the parent DModel).
 */
function useActiveModel(activeTabId: string): ActiveModelInfo | null {
    return useSelector((state: DState) => {
        // Primary: from active tab ID
        if (activeTabId
            && !activeTabId.startsWith('DockComponent_rightbar_')
            && !activeTabId.startsWith('jjtl_')
            && !activeTabId.startsWith('doc_')) {
            const raw = (state as any)[activeTabId] || (state as any).idlookup?.[activeTabId];
            if (raw && raw.className === 'DModel') {
                return { id: raw.id || activeTabId, name: raw.name || 'Unnamed', isMetamodel: !!raw.isMetamodel };
            }
        }

        // Fallback: from _lastSelected — walk up to find parent DModel
        try {
            const lastSelected = (state as any)._lastSelected;
            if (!lastSelected?.modelElement) return null;

            const meId: string = lastSelected.modelElement;
            const raw = (state as any).idlookup?.[meId];
            if (!raw) return null;

            let modelRaw: any = null;
            if (raw.className === 'DModel') {
                modelRaw = raw;
            } else {
                let current = raw;
                for (let i = 0; i < 10; i++) {
                    const fatherId = current.father;
                    if (!fatherId) break;
                    const father = (state as any).idlookup?.[fatherId];
                    if (!father) break;
                    if (father.className === 'DModel') {
                        modelRaw = father;
                        break;
                    }
                    current = father;
                }
            }

            if (!modelRaw) return null;
            return { id: modelRaw.id, name: modelRaw.name || 'Unnamed', isMetamodel: !!modelRaw.isMetamodel };
        } catch {
            return null;
        }
    });
}

/**
 * Compute stats for a model. Uses LModel proxy (same logic as PropertiesOverview).
 *
 * Runs inside useSelector so it re-evaluates on every Redux state change.
 * The custom statsEqual comparator prevents re-renders when the actual
 * counts haven't changed.
 */
function useModelStats(modelId: string | null, isMetamodel: boolean): EditorStats | null {
    return useSelector((_state: DState) => {
        if (!modelId) return null;
        try {
            const lModel = LPointerTargetable.fromPointer(modelId as any);
            if (!lModel) return null;

            if (isMetamodel) {
                const classes = (lModel as any).classes || [];
                const enums = (lModel as any).enumerators || [];
                let totalAttrs = 0;
                let totalOps = 0;
                let totalRefs = 0;
                for (const cls of classes) {
                    totalAttrs += ((cls as any).attributes?.length || 0);
                    totalOps += ((cls as any).operations?.length || 0);
                    totalRefs += ((cls as any).references?.length || 0);
                }
                return { type: 'metamodel' as const, classCount: classes.length, attrCount: totalAttrs, opCount: totalOps, enumCount: enums.length, refCount: totalRefs };
            } else {
                const objects = (lModel as any).objects || [];
                const instanceOf = (lModel as any).instanceof;
                return { type: 'model' as const, objectCount: objects.length, conformsTo: instanceOf?.name || '' };
            }
        } catch {
            return null;
        }
    }, statsEqual);
}

/**
 * Get the selected element within the active model.
 * Returns null if nothing is selected or if the selection belongs to a different model.
 */
function useSelectedElement(modelId: string | null, isMetamodel: boolean): SelectedElement | null {
    return useSelector((state: DState) => {
        if (!modelId) return null;
        try {
            const lastSelected = (state as any)._lastSelected;
            if (!lastSelected?.node) return null;

            const nodeRaw = (state as any).idlookup?.[lastSelected.node];
            if (!nodeRaw) return null;

            const selectedMeId: string | undefined = nodeRaw.model;
            const selectedMe = selectedMeId ? (state as any).idlookup?.[selectedMeId] : null;
            if (!selectedMe) return null;

            // Check if this element belongs to the active model
            let belongs = false;
            let current = selectedMe;
            for (let i = 0; i < 10; i++) {
                if (current.id === modelId) { belongs = true; break; }
                const fatherId = current.father;
                if (!fatherId) break;
                if (fatherId === modelId) { belongs = true; break; }
                const father = (state as any).idlookup?.[fatherId];
                if (!father) break;
                current = father;
            }
            if (!belongs) return null;

            // Don't show the model itself as a "selected element"
            if (selectedMe.id === modelId) return null;

            const name: string = selectedMe.name || '';
            const className: string = selectedMe.className || '';

            if (isMetamodel) {
                return { name, detail: '' };
            } else {
                let typeName = '';
                if (className === 'DObject') {
                    const instanceOfId = selectedMe.instanceof;
                    if (instanceOfId) {
                        const classRaw = (state as any).idlookup?.[instanceOfId];
                        typeName = classRaw?.name || '';
                    }
                }
                return { name, detail: typeName || className.replace(/^D/, '') };
            }
        } catch {
            return null;
        }
    });
}

// ─── Component ───────────────────────────────────────────────────────

const StatusBar: React.FC = () => {
    const stats = useProjectStats();
    const [transformationCount, setTransformationCount] = useState(0);

    // Track context: 'project' when project overview tab is active, 'editor' otherwise
    const [context, setContext] = useState<StatusBarContext>('project');

    // Hide when JjTL editor has its own status bar
    const [jjtlActive, setJjtlActive] = useState(false);

    // Track the active tab ID to derive the active model
    const [activeTabId, setActiveTabId] = useState('');

    // Active editor model (from tab ID, with _lastSelected fallback)
    const activeModel = useActiveModel(activeTabId);
    const modelId = activeModel?.id || null;
    const isMetamodel = activeModel?.isMetamodel ?? false;

    // Model stats (reactive via useSelector + statsEqual)
    const editorStats = useModelStats(modelId, isMetamodel);
    // Selected element (reactive via _lastSelected)
    const selectedElement = useSelectedElement(modelId, isMetamodel);

    // Listen for transformation count updates from ProjectEditor
    useEffect(() => {
        const handler = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            if (Array.isArray(detail)) {
                setTransformationCount(detail.length);
            }
        };
        window.addEventListener(JjodelEvents.TRANSFORMATIONS, handler);
        return () => window.removeEventListener(JjodelEvents.TRANSFORMATIONS, handler);
    }, []);

    // Listen for JjTL editor visibility changes (backup for mount/unmount)
    useEffect(() => {
        const handler = (e: Event) => {
            setJjtlActive((e as CustomEvent).detail?.active ?? false);
        };
        window.addEventListener(JjodelEvents.JJTL_STATUSBAR, handler);
        return () => window.removeEventListener(JjodelEvents.JJTL_STATUSBAR, handler);
    }, []);

    // Listen for active tab changes from the dock layout.
    // PRIMARY source of truth for context and jjtlActive visibility.
    useEffect(() => {
        const handler = (e: Event) => {
            const activeId: string = (e as CustomEvent).detail?.activeId || '';
            setActiveTabId(activeId);

            if (activeId.startsWith('DockComponent_rightbar_') || activeId.startsWith('doc_')) {
                setContext('project');
                setJjtlActive(false);
            } else if (activeId.startsWith('jjtl_')) {
                setContext('editor');
                setJjtlActive(true);
            } else if (activeId) {
                setContext('editor');
                setJjtlActive(false);
            }
        };
        window.addEventListener(JjodelEvents.ACTIVE_TAB, handler);
        return () => window.removeEventListener(JjodelEvents.ACTIVE_TAB, handler);
    }, []);

    // When JjTL editor is active, its own status bar takes over
    if (jjtlActive) return null;

    // Show editor info when in editor context and we have model data
    const showEditor = context === 'editor' && activeModel;

    return (
        <div className="app-statusbar" role="status">
            {/* ── Left zone: contextual ── */}
            <div className="app-statusbar__left">
                {showEditor ? (
                    <div className="app-statusbar__breadcrumb">
                        {/* Model name */}
                        <span className="app-statusbar__crumb app-statusbar__crumb--model">
                            <i className={`bi ${activeModel.isMetamodel ? 'bi-diagram-3' : 'bi-box'} app-statusbar__crumb-icon`} />
                            {activeModel.name}
                        </span>

                        {/* Stats */}
                        {editorStats && (
                            <>
                                <span className="app-statusbar__sep" />
                                <span className="app-statusbar__stats">
                                    {editorStats.type === 'metamodel' ? (
                                        <>
                                            {editorStats.classCount} {editorStats.classCount === 1 ? 'class' : 'classes'}
                                            <span className="app-statusbar__middot">·</span>
                                            {editorStats.attrCount} {editorStats.attrCount === 1 ? 'attribute' : 'attributes'}
                                            <span className="app-statusbar__middot">·</span>
                                            {editorStats.opCount} {editorStats.opCount === 1 ? 'operation' : 'operations'}
                                            <span className="app-statusbar__middot">·</span>
                                            {editorStats.enumCount} {editorStats.enumCount === 1 ? 'enumeration' : 'enumerations'}
                                            <span className="app-statusbar__middot">·</span>
                                            {editorStats.refCount} {editorStats.refCount === 1 ? 'reference' : 'references'}
                                        </>
                                    ) : (
                                        <>
                                            {editorStats.objectCount} instance{editorStats.objectCount !== 1 ? 's' : ''}
                                            {editorStats.conformsTo && (
                                                    <>
                                                        <span className="app-statusbar__middot">·</span>
                                                        <span className="app-statusbar__conforms">
                                                            <span className="app-statusbar__conforms-dot" />
                                                            conforms to {editorStats.conformsTo}
                                                        </span>
                                                    </>
                                                )}
                                        </>
                                    )}
                                </span>
                            </>
                        )}

                        {/* Selected element */}
                        {selectedElement && selectedElement.name && (
                            <>
                                <span className="app-statusbar__sep" />
                                <span className="app-statusbar__crumb app-statusbar__crumb--last">
                                    › {selectedElement.name}
                                    {selectedElement.detail && (
                                        <span className="app-statusbar__crumb-detail">
                                            {` : ${selectedElement.detail}`}
                                        </span>
                                    )}
                                </span>
                            </>
                        )}
                    </div>
                ) : stats ? (
                    <>
                        <span className="app-statusbar__stat">
                            <strong>{stats.metamodels}</strong> metamodel{stats.metamodels !== 1 ? 's' : ''}
                        </span>
                        <span className="app-statusbar__sep" />
                        <span className="app-statusbar__stat">
                            <strong>{stats.models}</strong> model{stats.models !== 1 ? 's' : ''}
                        </span>
                        <span className="app-statusbar__sep" />
                        <span className="app-statusbar__stat">
                            <strong>{transformationCount}</strong> transformation{transformationCount !== 1 ? 's' : ''}
                        </span>
                    </>
                ) : null}
            </div>

            {/* ── Right zone: shared component ── */}
            <div className="app-statusbar__right">
                <StatusBarRightZone variant="light" />
            </div>
        </div>
    );
};

export default StatusBar;
