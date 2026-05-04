/**
 * Lightweight tracker for the most recently opened/edited viewpoint
 * in the ViewpointWorkbench. Used by context menus to know where
 * to create new views.
 */

import { DPointerTargetable, DViewElement, LProject, LViewPoint, SetFieldAction, SetRootFieldAction, Defaults } from '../joiner';
import { toast } from '../components/Toast/toastDispatch';
import { JjodelEvents } from '../events/registry';
import { DEFAULT_VIEW_JSX_STRING } from './defaultViewTemplate';

let lastEditedViewpointId: string | null = null;
let lastEditedViewpointName: string | null = null;

export function setLastEditedViewpoint(id: string, name: string): void {
    lastEditedViewpointId = id;
    lastEditedViewpointName = name;
}

export function getLastEditedViewpointId(): string | null {
    return lastEditedViewpointId;
}

export function getLastEditedViewpointName(): string | null {
    return lastEditedViewpointName;
}

export function clearLastEditedViewpoint(): void {
    lastEditedViewpointId = null;
    lastEditedViewpointName = null;
}

/**
 * Activates a viewpoint for rendering.
 *
 * Sets both:
 * 1. project.activeViewpoint (via direct SetFieldAction) — used by the classic renderer
 * 2. state.viewpoint (root state) — used by EditorSwitch for split view toggle
 *
 * Uses direct SetFieldAction instead of the L-proxy setter to avoid async
 * TRANSACTION batching issues that caused the SetRootFieldAction to interfere
 * with the project.activeViewpoint update.
 *
 * @param viewpointId - ID of the viewpoint to activate, or null/'' to deactivate
 */
export function activateViewpoint(viewpointId: string | null): void {
    const project = LProject.getProject();
    const projectId = (project as any).__raw?.id;

    // 1. Set project.activeViewpoint via direct SetFieldAction (no L-proxy, no async TRANSACTION)
    if (viewpointId && projectId) {
        SetFieldAction.new(projectId, 'activeViewpoint', viewpointId, '', true);
    }

    // 2. Update state.viewpoint (used by EditorSwitch for split view toggle)
    SetRootFieldAction.new('viewpoint', viewpointId || '', '', true);
}

/**
 * Resolves the viewpoint to use as parent for new views.
 * Priority: last edited workbench VP → active project VP → default VP.
 * Returns { dViewpoint, vpName } or null if nothing found.
 */
export function resolveParentViewpoint(): { dViewpoint: DViewElement; vpName: string } | null {
    // 1. Try last edited workbench viewpoint
    const vpId = getLastEditedViewpointId();
    if (vpId) {
        const d = DPointerTargetable.from(vpId) as DViewElement | undefined;
        if (d?.className) {
            return { dViewpoint: d, vpName: getLastEditedViewpointName() || d.name || 'Viewpoint' };
        }
        console.warn('[resolveParentViewpoint] lastEditedViewpointId is stale:', vpId);
    }

    // 2. Fallback: active project viewpoint (same logic as newDefault)
    try {
        const activeVP: LViewPoint | undefined = LProject.getProject()?.activeViewpoint;
        if (activeVP && activeVP.id !== Defaults.Pointer_ViewPointDefault) {
            const d = activeVP.__raw;
            if (d?.className) {
                return { dViewpoint: d, vpName: d.name || 'Active Viewpoint' };
            }
        }
    } catch { /* project not available */ }

    // 3. Fallback: default viewpoint
    try {
        const d = DPointerTargetable.from(Defaults.viewpoints[0]) as DViewElement | undefined;
        if (d?.className) {
            return { dViewpoint: d, vpName: d.name || 'Default Viewpoint' };
        }
    } catch { /* default not available */ }

    return null;
}

/**
 * Creates a view in the last edited workbench viewpoint for a given classifier.
 * Shared by canvas context menu and tree view context menu.
 *
 * Uses the same DViewElement.new2() mechanism as DViewElement.newDefault()
 * (see view/viewElement/view.tsx).
 */
export function createViewInWorkbench(elementId: string, elementName: string, className: string): boolean {
    // console.log('[createViewInWorkbench] called:', { elementId, elementName, className });

    // Resolve parent viewpoint
    const resolved = resolveParentViewpoint();
    if (!resolved) {
        console.warn('[createViewInWorkbench] no viewpoint found');
        toast.error('No viewpoint available. Open a viewpoint first.', 'Cannot create view');
        return false;
    }
    const { dViewpoint, vpName } = resolved;
    // console.log('[createViewInWorkbench] using viewpoint:', dViewpoint.id, vpName);

    // Build OCL query and determine appliableTo (matches defaults/views.ts pattern)
    let query = '';
    let appliableTo: string = 'Vertex';
    let appliableToClasses: string[] = [];
    switch (className) {
        case 'DClass':
            query = `context DObject inv: self.instanceof.id = '${elementId}'`;
            appliableToClasses = ['DObject'];
            appliableTo = 'Vertex';
            break;
        case 'DEnumerator':
            query = `context DEnumerator inv: self.id = '${elementId}'`;
            appliableToClasses = ['DEnumerator'];
            appliableTo = 'Vertex';
            break;
        case 'DModel':
            query = `context DModel inv: self.id = '${elementId}'`;
            appliableToClasses = ['DModel'];
            appliableTo = 'Graph';
            break;
        case 'DPackage':
            query = `context DPackage inv: self.id = '${elementId}'`;
            appliableToClasses = ['DPackage'];
            appliableTo = 'GraphVertex';
            break;
        default:
            console.warn('[createViewInWorkbench] unhandled className:', className);
            toast.error(`Cannot create view for ${className}`, 'Unsupported type');
            return false;
    }

    const viewName = 'View for ' + (elementName || 'unnamed');
    // console.log('[createViewInWorkbench] creating:', viewName, 'query:', query, 'father:', dViewpoint.id);

    try {
        // Same JSX template and pattern as DViewElement.newDefault()
        const newView = DViewElement.new2(viewName,
            DEFAULT_VIEW_JSX_STRING,
            dViewpoint,
            (d) => {
                d.oclCondition = query;
                d.appliableTo = appliableTo as any;
                d.appliableToClasses = appliableToClasses;
                d.css_MUST_RECOMPILE = true;
            },
            true
        );
        // console.log('[createViewInWorkbench] created view:', newView?.id, newView?.name);
    } catch (e) {
        console.error('[createViewInWorkbench] DViewElement.new2 threw:', e);
        toast.error('Failed to create view. Check console for details.', 'Error');
        return false;
    }

    toast.success(`"${viewName}" added to "${vpName}"`, 'View created');

    // Notify ViewpointEditorRoot (and any other listener) that a view was created
    setTimeout(() => {
        window.dispatchEvent(new CustomEvent(JjodelEvents.VIEW_CREATED, { detail: { viewpointId: dViewpoint.id } }));
    }, 300);

    return true;
}
