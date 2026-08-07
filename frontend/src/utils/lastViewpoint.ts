/**
 * Lightweight tracker for the most recently opened/edited viewpoint
 * in the ViewpointWorkbench. Used by context menus to know where
 * to create new views.
 */

import { DPointerTargetable, DViewElement, LPointerTargetable, LProject, LViewElement, LViewPoint, SetFieldAction, SetRootFieldAction, Defaults, store } from '../joiner';
import { toast } from '../components/Toast/toastDispatch';
import { JjodelEvents } from '../events/registry';
import { DEFAULT_VIEW_JSX_STRING } from './defaultViewTemplate';
import { auditGlobalCss, markWarned, type ViewCssDescriptor } from './globalCssAudit';

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

    // 3. Warn once per distinct set of author-modified global CSS (micro-slice 3.6).
    //    Informative only: nothing is written back to the model.
    warnOnGlobalCss(viewpointId);
}

/** Beyond this many names the toast lists a count instead of a wall of text. */
const MAX_NAMES_IN_TOAST = 3;

/**
 * Builds the audit input from the current store. Lives here, at the choke point, so
 * `globalCssAudit` stays a pure module with no store dependency.
 */
function collectViewCssDescriptors(activeViewpointId: string | null): ViewCssDescriptor[] {
    const idlookup: any = store.getState()?.idlookup ?? {};
    const out: ViewCssDescriptor[] = [];
    for (const id in idlookup) {
        const d: any = idlookup[id];
        if (!d) continue;
        if (d.className !== 'DViewElement' && d.className !== 'DViewPoint') continue;
        out.push({
            id,
            name: d.name || id,
            css: d.css || '',
            cssIsGlobal: !!d.cssIsGlobal,
            isViewpoint: d.className === 'DViewPoint',
            isExclusiveView: !!d.isExclusiveView,
            isDefault: Defaults.check(id),
            isActive: id === activeViewpointId,
        });
    }
    return out;
}

/**
 * One toast per activation, aggregating every culprit, and silent when the same set
 * with the same css has already been reported in this session.
 */
function warnOnGlobalCss(activeViewpointId: string | null): void {
    try {
        const { culprits, key } = auditGlobalCss(collectViewCssDescriptors(activeViewpointId));
        if (!culprits.length) return;
        if (!markWarned(key)) return;

        const names = culprits.map((c) => c.name);
        const rest = names.length - MAX_NAMES_IN_TOAST;
        const from = rest > 0
            ? `${names.slice(0, MAX_NAMES_IN_TOAST).join(', ')} and ${rest} more`
            : names.join(', ');
        toast.warning(
            `Global CSS with !important is repainting the canvas. From: ${from} (cssIsGlobal is on). Classic views can edit it in the Style tab.`,
            'Global CSS',
        );
    } catch {
        // A warning must never be able to break viewpoint activation.
    }
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
 * Crea una View "vuota" come sub-view di un Viewpoint specifico.
 * Usata dal pulsante "+" inline sulle righe Viewpoint del Tree View.
 * Ritorna la DViewElement appena creata in modo da poter attivare
 * il rename inline immediatamente.
 *
 * @param dVp - DViewElement del Viewpoint padre
 * @param nameSeed - prefisso nome (default "New view")
 * @returns DViewElement della view creata
 */
export function createBlankViewInViewpoint(
    dVp: DViewElement,
    nameSeed: string = 'New view'
): DViewElement {
    const lVp = LPointerTargetable.fromD(dVp) as LViewElement;
    const existingNames = new Set(
        lVp.subViews.map(v => v?.name).filter(Boolean) as string[]
    );

    // Trova nome unico: "New view", "New view2", "New view3", ...
    // Usa la convention di U.increaseEndingNumber (senza parentesi).
    let candidate = nameSeed;
    let i = 1;
    while (existingNames.has(candidate)) {
        i += 1;
        candidate = `${nameSeed}${i}`;
    }

    const newView = DViewElement.new2(
        candidate,
        '', // jsxString vuoto, l'utente personalizzerà dopo
        dVp,
        undefined,
        true
    );
    return newView;
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
