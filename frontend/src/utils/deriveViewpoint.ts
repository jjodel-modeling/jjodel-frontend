/**
 * deriveViewpoint — «Derive viewpoint» on a metamodel (P-2026-09-29-0135).
 *
 * Creates a NEW viewpoint named `<metamodel> (derived)` with one IR view per
 * concrete class, the documents of `deriveViewpointForBinding`, created in its
 * order (deepest class first). The simulation role binding stored on the
 * metamodel, read as a run reads it (`runBag`, the keys of the roles its profile
 * turns off dropped), picks the notation: with a role bound, the role-keyed ones
 * (R-VP-15..17); with none, the generic structural notation (R-VP-19,
 * P-2026-09-29-2350), whose contained objects are row views.
 *
 * - The default viewpoint and every existing view are never touched: the
 *   father of every view is the new viewpoint.
 * - The viewpoint is not activated: its tab opens, as New Viewpoint does
 *   (`handleCreateViewpoint`, ProjectEditor.tsx).
 * - NO OUTER TRANSACTION (CLAUDE.md §3.3): `newVP` and `new2` are bare calls,
 *   as in irDemoFixture.ts. Each `persist` opens a TRANSACTION whose END runs
 *   after this function returns, so every creation folds into one composite
 *   action, and one undo step (action.ts BEGIN/END).
 */

import { DViewElement, DViewPoint, U, store } from '../joiner';
import DockManager from '../components/abstract/DockManager';
import { toast } from '../components/Toast/toastDispatch';
import { appliableToForIRKind } from '../view/viewElement/view';
import { deriveViewpointForBinding, isDerivableMetamodel } from '../components/editor-v2/viewpoint/derive/viewpointDerivation';
import { runBag } from '../components/editor-v2/sim/simBridge';
import { storedProfile } from '../components/editor-v2/sim/simRoleStatus';
import { ROLE_CATALOG } from '../model/simulation/roleCatalog';
import type { DerivationRoles } from '../components/editor-v2/viewpoint/derive/viewpointDerivation';

/** The role binding stored on the metamodel, or null when no role key is set. */
function storedRoles(lookup: Record<string, any>, metamodelId: string): DerivationRoles | null {
    const raw = lookup[metamodelId]?._state;
    if (!raw || typeof raw !== 'object') return null;
    if (!ROLE_CATALOG.some(d => d.key !== null && typeof raw[d.key] === 'string' && raw[d.key] !== '')) return null;
    return { bag: runBag(raw, lookup), shape: storedProfile(raw).profile.shape };
}

/**
 * Derives a viewpoint from the metamodel `metamodelId` and opens its tab.
 * Returns the new viewpoint, or null when there is nothing to derive.
 */
export function createDerivedViewpoint(metamodelId: string): DViewPoint | null {
    const lookup: Record<string, any> = (store.getState() as any).idlookup ?? {};
    const metamodel = lookup[metamodelId];
    if (!isDerivableMetamodel(metamodel)) return null;

    const views = deriveViewpointForBinding(lookup, metamodelId, storedRoles(lookup, metamodelId));
    if (views.length === 0) {
        toast.warning(`"${metamodel.name}" has no concrete class to derive a view for.`, 'Nothing to derive');
        return null;
    }

    const name = `${metamodel.name} (derived)`;
    // A syntax viewpoint, set as New Viewpoint sets the type 'syntax'.
    const viewpoint = DViewPoint.newVP(name, (vp) => {
        vp.isExclusiveView = true;
        vp.isValidation = false;
        (vp as any).viewpointType = 'syntax';
    });
    for (const v of views) {
        DViewElement.new2(v.ir.label ?? `View for ${v.className}`, '', viewpoint, (d) => {
            // Same fields as a class view of createViewInWorkbench; the ir is set in the
            // callback, which runs before persist, so the view is persisted with it.
            d.oclCondition = `context DObject inv: self.instanceof.id = '${v.classId}'`;
            d.appliableToClasses = ['DObject'];
            const appliableTo = appliableToForIRKind(v.ir.kind);
            if (appliableTo) d.appliableTo = appliableTo;
            d.css_MUST_RECOMPILE = true;
            (d as any).ir = v.ir;
        }, true);
    }
    U.isProjectModified = true;
    DockManager.openViewpoint(viewpoint);
    toast.success(`"${name}": ${views.length} views`, 'Viewpoint derived');
    return viewpoint;
}
