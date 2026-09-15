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
import { computeCreationSeed } from '../components/editor-v2/viewpoint/ir/irCreationSeed';
import type { AnyViewIR } from '../components/editor-v2/viewpoint/ir/irTypes';

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

    // 1. Set project.activeViewpoint via direct SetFieldAction (no L-proxy, no async TRANSACTION).
    //    The guard is on projectId ALONE. Guarding on viewpointId too — as this line did until
    //    2.228 — meant that deactivating ("Abstract syntax" in the toolbar selector, which calls
    //    activateViewpoint(null)) skipped the write entirely: the root went empty and
    //    project.activeViewpoint stayed on the previous viewpoint. `null` was therefore not
    //    reachable from the UI at all (R-IRN-18).
    if (projectId) {
        SetFieldAction.new(projectId, 'activeViewpoint', viewpointId || null, '', true);
    }

    // 2. Update state.viewpoint (used by EditorSwitch for split view toggle). Same empty form as
    //    the project field — `null`, never '' (R-IRN-11, R-IRN-21): two shapes of empty in the
    //    persisted state is exactly what R-IRN-11 was decided to prevent. All five readers of the
    //    root (EditorSwitch.tsx:55, Toolbar.tsx:202, irResolveCore.ts:117,139,
    //    vertexLayoutAdapter.ts:32 — the per-viewpoint layout, R-LAY-11) go through a
    //    truthiness test, where '' and null behave identically; the one place that needs a string
    //    is the controlled <select>, and it coerces at the render boundary (Toolbar.tsx:229).
    SetRootFieldAction.new('viewpoint', viewpointId || null, '', true);

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
        const activeVP: LViewPoint | null | undefined = LProject.getProject()?.activeViewpoint;
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
 * Same shape as `resolveParentViewpoint()`, but for a viewpoint the caller already
 * knows. Returns null when the id does not resolve to a live D-object, so the caller
 * degrades exactly as it does when no viewpoint is available at all.
 */
function resolveViewpointById(viewpointId: string): { dViewpoint: DViewElement; vpName: string } | null {
    try {
        const d = DPointerTargetable.from(viewpointId) as DViewElement | undefined;
        if (d?.className) return { dViewpoint: d, vpName: d.name || 'Viewpoint' };
    } catch { /* stale or unknown id */ }
    console.warn('[createViewInWorkbench] viewpointId does not resolve:', viewpointId);
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
 *
 * @param viewpointId - when given, this viewpoint is the parent and
 *   `resolveParentViewpoint()` is bypassed entirely. The canvas entries pass the
 *   ACTIVE viewpoint so the draft is born where the user can see it; the older call
 *   sites pass nothing and keep the "last edited workbench viewpoint" priority as is.
 * @returns the id of the created view, or `null` on any failure. The three original
 *   call sites ignore the value; the truthiness of the old `boolean` return is
 *   preserved by an id being non-empty.
 */
export function createViewInWorkbench(elementId: string, elementName: string, className: string, viewpointId?: string): string | null {
    // console.log('[createViewInWorkbench] called:', { elementId, elementName, className });

    // Resolve parent viewpoint
    const resolved = viewpointId ? resolveViewpointById(viewpointId) : resolveParentViewpoint();
    if (!resolved) {
        console.warn('[createViewInWorkbench] no viewpoint found');
        toast.error('No viewpoint available. Open a viewpoint first.', 'Cannot create view');
        return null;
    }
    const { dViewpoint, vpName } = resolved;
    // console.log('[createViewInWorkbench] using viewpoint:', dViewpoint.id, vpName);

    // Build OCL query and determine appliableTo (matches defaults/views.ts pattern)
    let query = '';
    let appliableTo: string = 'Vertex';
    let appliableToClasses: string[] = [];
    // IR seed (R-IRN-4): the class-like branches are born with a vertex ir, so the view
    // produces notation from the start instead of rendering abstract until someone opens
    // the Enable IR gate. `ir` stays undefined on DModel/DPackage: graph and graphVertex
    // are not authorable kinds (R-6, 2026-08-04), and those branches are untouched.
    // The metaclass identity comes from this function's own arguments, never from
    // `appliableToClasses` — that field holds D-level type names here, which the pin and
    // the resolver cannot use.
    let seed: AnyViewIR | null = null;
    // Hoisted above the switch (it used to sit just below it): the seed reuses it as the
    // vertex `label`, and one expression is better than three copies of it.
    const viewName = 'View for ' + (elementName || 'unnamed');
    switch (className) {
        case 'DClass':
            query = `context DObject inv: self.instanceof.id = '${elementId}'`;
            appliableToClasses = ['DObject'];
            appliableTo = 'Vertex';
            seed = computeCreationSeed({
                kind: 'vertex',
                metaclassName: elementName,
                metaclassId: elementId,
                label: viewName,
            });
            break;
        case 'DEnumerator':
            query = `context DEnumerator inv: self.id = '${elementId}'`;
            appliableToClasses = ['DEnumerator'];
            appliableTo = 'Vertex';
            // No pin: the pin is defined as a DClass pointer (irTypes.ts:124-125) and the
            // resolution chain checks it against the project's classes only
            // (metaclassPin.ts:80), which never contain enumerators. An enum id would be
            // discarded at every read — worse than absent, because it would claim an
            // authority it does not have. The name alone is seeded (Fase 0, punto 2).
            seed = computeCreationSeed({
                kind: 'vertex',
                metaclassName: elementName,
                label: viewName,
            });
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
            return null;
    }

    // console.log('[createViewInWorkbench] creating:', viewName, 'query:', query, 'father:', dViewpoint.id);

    let newViewId: string | null = null;
    try {
        // Same JSX template and pattern as DViewElement.newDefault(), except on the seeded
        // branches: a view born with an `ir` renders through the interpreter, so a classic
        // template would be dead text carried forever. It is created empty instead, as
        // createBlankViewInViewpoint already does. Unseeded branches keep the template.
        const newView = DViewElement.new2(viewName,
            seed ? '' : DEFAULT_VIEW_JSX_STRING,
            dViewpoint,
            (d) => {
                d.oclCondition = query;
                d.appliableTo = appliableTo as any;
                d.appliableToClasses = appliableToClasses;
                d.css_MUST_RECOMPILE = true;
                // Written inside the callback, which Constructors.end() runs BEFORE
                // persist (joiner/classes.ts:683,688): the view is persisted with its ir
                // already on it, in one action. Same pattern as irDemoFixture.ts:106.
                if (seed) (d as any).ir = seed;
            },
            true
        );
        // console.log('[createViewInWorkbench] created view:', newView?.id, newView?.name);
        // `new2` hands back a live id (TreeViewContent.tsx:1391-1395 already starts an
        // inline rename on it), so it is safe to return and to open the editor on.
        newViewId = newView?.id ?? null;
    } catch (e) {
        console.error('[createViewInWorkbench] DViewElement.new2 threw:', e);
        toast.error('Failed to create view. Check console for details.', 'Error');
        return null;
    }

    toast.success(`"${viewName}" added to "${vpName}"`, 'View created');

    // Notify ViewpointEditorRoot (and any other listener) that a view was created
    setTimeout(() => {
        window.dispatchEvent(new CustomEvent(JjodelEvents.VIEW_CREATED, { detail: { viewpointId: dViewpoint.id } }));
    }, 300);

    return newViewId;
}
