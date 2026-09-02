/**
 * rowViewAnnotationsWrite — declaring a Row view rule on the metamodel.
 *
 * The write half of `rowViewAnnotations.ts`, split off from it for one concrete
 * reason: importing the joiner barrel pulls in Monaco, and Monaco dereferences
 * `window` at import time. Any module that touches the barrel is therefore
 * unloadable in the `node` test environment, and the decision side of the Row
 * view library has to stay testable. So the DECIDING is pure and over there,
 * the WRITING is here, and the wire format is still owned by exactly one file —
 * `annotationSource` is imported, never re-spelled.
 */

import { store, DAnnotation, SetFieldAction } from '../../../joiner';
import {
    annotationSource,
    findRowViewAnnotationId,
    type RowViewAnnotationKey,
} from './rowViewAnnotations';

/**
 * Declare `key = value` on a metamodel feature, promoting an inferred renderer
 * to a rule-1 declaration.
 *
 * «A user correction promotes to the metamodel, not the instance. It becomes
 * the rule-1 declaration, and the heuristic stops running for that property.»
 * — README.md, "Value-renderer detection". So the write lands on the
 * DAttribute, where it governs every instance of the class, and not on the
 * DValue the user happened to be looking at.
 *
 * NOT wrapped in a TRANSACTION. `DAnnotation.new` is a creator and opens one of
 * its own; nesting it drops the writes (CLAUDE.md §3.3). The update path is a
 * bare `SetFieldAction`, which needs none — a single action is already atomic.
 */
export function declareRowViewAnnotation(
    featureId: string,
    key: RowViewAnnotationKey,
    value: string | number,
): void {
    if (!featureId) return;
    const idlookup = store.getState()?.idlookup ?? {};
    const existing = findRowViewAnnotationId(idlookup, featureId, key);
    const source = annotationSource(key, value);

    if (existing) {
        // `as any` on the id and field name, the shape every SetFieldAction call
        // site in the sync layer uses: the generic overloads are keyed on a
        // `DPointerTargetable` subtype we do not have statically here.
        // `isPointer: false` — `source` holds a string, not a pointer.
        SetFieldAction.new(existing as any, 'source' as any, source, undefined, false);
        return;
    }
    // Bare creator call, mirroring useJjomSync. The annotation parents itself on
    // the feature through the `father` argument, and `DAnnotation`'s own
    // constructor pushes the pointer into `DAttribute.annotations`
    // (`joiner/classes.ts:810`, `setExternalPtr(father, "annotations", "+=")`),
    // so no second action is needed to link it.
    DAnnotation.new(source, [], featureId, true);
}

/**
 * Remove a declaration, handing the property back to the ladder.
 *
 * The annotation is emptied rather than deleted: `DeleteElementAction` on a
 * child whose pointer still sits in `DAttribute.annotations` leaves a dangling
 * id, and `readRowViewAnnotations` already ignores a source it cannot parse. An
 * empty source parses to nothing, which is exactly "no declaration".
 */
export function clearRowViewAnnotation(featureId: string, key: RowViewAnnotationKey): void {
    if (!featureId) return;
    const idlookup = store.getState()?.idlookup ?? {};
    const existing = findRowViewAnnotationId(idlookup, featureId, key);
    if (existing) SetFieldAction.new(existing as any, 'source' as any, '', undefined, false);
}
