/**
 * deriveViewpoint — «Derive viewpoint» on a metamodel (P-2026-09-29-0135; the notation
 * dialog, slice D, P-2026-09-30-0255, R-VP-21).
 *
 * Creates a NEW viewpoint named `<metamodel> (derived)` with one IR view per
 * concrete class, the documents of the choice the dialog confirms
 * (`derivedDocuments`, notations.ts: the notation picked and its metaclass → role
 * table), created in their order (deepest class first), each with its provenance
 * (`ir.generated`). The viewpoint keeps the choice in its `_state`
 * (`derivedViewpointState`), where the next derivation from the same metamodel
 * finds it. The simulation binding stored on the metamodel is not read here: it
 * only prefills the dialog, and nothing here writes it.
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

import { DProject, DViewElement, DViewPoint, U, store } from '../joiner';
import DockManager from '../components/abstract/DockManager';
import { toast } from '../components/Toast/toastDispatch';
import { appliableToForIRKind } from '../view/viewElement/view';
import { isDerivableMetamodel } from '../components/editor-v2/viewpoint/derive/viewpointDerivation';
import { canDerive, defaultChoice, derivedDocuments, derivedViewpointState } from '../components/editor-v2/viewpoint/derive/notations';
import type { DeriveChoice } from '../components/editor-v2/viewpoint/derive/notations';

/** The project's viewpoints, in its order: where the dialog looks for the latest derived viewpoint. */
export function projectViewpointIds(): string[] {
    const ids = (DProject.getProject() as any)?.viewpoints;
    return Array.isArray(ids) ? ids.filter((x: unknown): x is string => typeof x === 'string') : [];
}

/**
 * Derives a viewpoint from the metamodel `metamodelId` with `choice`, the dialog's
 * (absent: what the dialog would open on, `defaultChoice`), and opens its tab.
 * Returns the new viewpoint, or null when there is nothing to derive.
 */
export function createDerivedViewpoint(metamodelId: string, choice?: DeriveChoice): DViewPoint | null {
    const lookup: Record<string, any> = (store.getState() as any).idlookup ?? {};
    const metamodel = lookup[metamodelId];
    if (!isDerivableMetamodel(metamodel)) return null;

    const picked = choice ?? defaultChoice(lookup, metamodelId, projectViewpointIds());
    if (!canDerive(picked)) {
        toast.warning('Give a class a role, or choose Generic.', 'Nothing to derive');
        return null;
    }
    const views = derivedDocuments(lookup, metamodelId, picked);
    if (views.length === 0) {
        toast.warning(`"${metamodel.name}" has no concrete class to derive a view for.`, 'Nothing to derive');
        return null;
    }

    const name = `${metamodel.name} (derived)`;
    const state = derivedViewpointState(lookup, metamodelId, picked);
    // A syntax viewpoint, set as New Viewpoint sets the type 'syntax'.
    const viewpoint = DViewPoint.newVP(name, (vp) => {
        vp.isExclusiveView = true;
        vp.isValidation = false;
        (vp as any).viewpointType = 'syntax';
        // The dialog's binding, kept with the viewpoint only (R-VP-21): set before persist, as
        // viewpointType, so it is part of the created object and of its one undo step.
        (vp as any)._state = state;
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
