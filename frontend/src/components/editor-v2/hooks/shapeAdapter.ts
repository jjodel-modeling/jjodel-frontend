/**
 * shapeAdapter — the D-graph backend of `jjform`'s `ShapeCtx` (R-FORM-2, Q4).
 *
 * Lives next to `getMetaclassInfo` because it is that function's continuation: the
 * spine of the shape IS `MetaclassInfo`, which already owns the parts that are
 * real work — walking packages and subpackages for classes, folding the extends
 * chain, computing concrete subclasses and rootable-ness. Rewriting that here to
 * read `idlookup` directly would be a second implementation of the hardest half,
 * free to disagree with the first.
 *
 * What `MetaclassInfo` does NOT carry are the three holes §2.2 of the Fase 1
 * discovery named — enum literals, `derived`/`changeable`, and incoming
 * references. All three are filled from `idlookup`, by the element ids
 * `MetaclassInfo` already hands over, and the code that does it lives in
 * `shapeDraw.ts`: pure, importless, and therefore testable. THIS file is the
 * impure half — it is the one that touches the store — exactly as
 * `irReadCtxLproxy` is the impure half of `irReadCtx`.
 *
 * Q4 AS RATIFIED: through the adapter, without touching the core. The alternative
 * was to extract a `validTargetsFor(feature, modelId)` out of
 * `LValue.get_validTargets` (`LModelElement.tsx:7853`), which is core (rule 5).
 * The declared cost of not doing it: `get_validTargets` also filters out the
 * candidates that would close a containment loop, and that filter is
 * PER-INSTANCE — it reads the instance's own father chain. It has no meaning for
 * a metaclass and is therefore ABSENT here rather than approximated. A shape says
 * what the metamodel allows; which of those candidates a particular instance may
 * take is a question for the moment of writing, and slice 2c inherits it.
 */

import { store } from '../../../joiner';
import type { EnumShape, MetamodelShape, RefShape, ShapeCtx } from '../../../jjform';
import { attrShape, refShape, referencedBy } from './shapeDraw';
import { getMetaclassInfo, type MetaclassInfo } from './useEditorMode';

type Idlookup = Record<string, any>;

/** Re-exported so a consumer needs one import for the adapter, while the
 *  implementation stays in the importless module the tests can reach. */
export { referencedBy } from './shapeDraw';

/**
 * Build the serializable shape of a model's metamodel.
 *
 * Exported on its own, not only through `makeShapeCtx`, because it IS the thing
 * `form-engine-contract.md` calls `metamodelShape`: a JSON value that can be
 * written to a file and handed to an engine with no jjodel around it.
 */
export function buildMetamodelShape(modelId: string): MetamodelShape {
    const shape: MetamodelShape = { enums: {}, classes: {} };
    if (!modelId) return shape;

    let info: { allClasses: MetaclassInfo[]; rootableClasses: MetaclassInfo[] };
    try {
        info = getMetaclassInfo(modelId);
    } catch {
        // A half-loaded model resolves to no metamodel. An empty shape is the
        // honest answer, and the next store change rebuilds it.
        return shape;
    }

    const idlookup: Idlookup = (store.getState() as any)?.idlookup ?? {};
    const rootIds = new Set(info.rootableClasses.map(c => c.id));
    const enums: Record<string, EnumShape> = shape.enums;

    // `containedIn` is the INVERSE of every containment reference, so it needs its
    // own pass: a class does not know who contains it, the container knows what it
    // holds. Accumulated over concrete subclasses too — a reference typed on an
    // abstract class contains any of its concretions.
    const containedIn: Record<string, Set<string>> = {};
    for (const cls of info.allClasses) {
        for (const ref of cls.references) {
            if (!ref.containment) continue;
            const targets = [ref.targetClassName];
            const target = info.allClasses.find(c => c.id === ref.targetClassId);
            if (target) for (const sub of target.concreteSubclasses) targets.push(sub.name);
            for (const t of targets) {
                if (!t) continue;
                (containedIn[t] ??= new Set<string>()).add(cls.name);
            }
        }
    }

    for (const cls of info.allClasses) {
        // `allAttributes` (own + inherited) rather than `attributes`: a table over
        // a subclass has to show the columns it inherits. References are already
        // folded by `resolveM1Info` (`cls.allReferences ?? cls.references`), so the
        // two sides agree without a second fold here.
        const attrs = (cls.allAttributes ?? cls.attributes).map(a => attrShape(idlookup, a, enums));
        const refs: RefShape[] = [];
        const children: RefShape[] = [];
        for (const r of cls.references) (r.containment ? children : refs).push(refShape(idlookup, r));

        shape.classes[cls.name] = {
            key: cls.name,
            id: cls.id,
            root: rootIds.has(cls.id),
            abstract: cls.isAbstract,
            singleton: !!cls.isSingleton,
            containedIn: [...(containedIn[cls.name] ?? [])].sort(),
            attrs,
            refs,
            children,
        };
    }

    return shape;
}

/**
 * The `ShapeCtx` over the live D-graph.
 *
 * `shape()` is memoised for the lifetime of the context: the metamodel does not
 * change while a table is being read, and rebuilding it per row would make every
 * render quadratic in the size of the metamodel. How long a context lives is the
 * caller's decision — the manager rebuilds it whenever `idlookup` changes
 * identity, the same granularity everything else in that tab uses.
 */
export function makeShapeCtx(modelId: string): ShapeCtx {
    let cached: MetamodelShape | null = null;
    const lookup = (): Idlookup => (store.getState() as any)?.idlookup ?? {};
    return {
        shape(): MetamodelShape {
            return (cached ??= buildMetamodelShape(modelId));
        },
        classOf(instanceId: string): string | null {
            const idlookup = lookup();
            const cid = idlookup[instanceId]?.instanceof;
            return typeof cid === 'string' ? (idlookup[cid]?.name ?? null) : null;
        },
        referencedBy(instanceId: string) {
            return referencedBy(lookup(), instanceId);
        },
    };
}
