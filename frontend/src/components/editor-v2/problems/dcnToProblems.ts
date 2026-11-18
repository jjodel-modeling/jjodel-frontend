/**
 * The seventh producer of the problems registry: the DCN well-formedness checks (P-2026-11-07-1825; spec §5,
 * `model/dcn/dcnWellFormedness.ts`), as node problems of kind `'dcn'` on the class-level elements they name.
 *
 * ── WHAT IS READ ────────────────────────────────────────────────────────────
 *
 * The open model's metamodel bag, as a run reads it (`runBag`): the dcn roles (`dcnStcFromRoles`) and the R-OI
 * bindings (`ontoBindings`). With no dcn role closure, or no binding whose feature container a static class
 * conforms to, nothing is checked and the producer is inert. Of those bindings the one with feature sources comes
 * first. The read view is the raw lookup, with the readers of the sim bridge (`objectSlots.ts`, `isKindOf.ts`,
 * `collectModelObjectIds`): this trunk has no store adapter of `OntoReadView` yet.
 *
 * The M2 features no role names (range bounds, literals, parameters) are found by name in the metamodel, as the
 * probe fixture names them (`scripts/probe/dcn-drone-fixture.ts`): `Property.rangeMin`, `Property.rangeMax`,
 * `Enumeration.ownedLiterals`, `Operation.ownedParameters`. A metamodel that names them otherwise has its range and
 * parameter checks off.
 *
 * ── ANCHORING AND OWNERSHIP ─────────────────────────────────────────────────
 *
 * As `simCheckToProblems.ts`: two entries per diagnostic, under the DObject id (tree, rail) and the resolved DVertex
 * id (canvas dot), `${kind}:${nodeId}:${rule}:${n}`; owned by the model; revoked by `markResolved`, cleared outright
 * on the last unmount. Pure over the lookup, so it runs under the node test bench.
 */

import {
    clearProblem, getProblemIdsOwnedBy, markResolved, registerProblem,
    type NodeProblem,
} from './registry';
import type { VertexResolver } from './vertexResolver';
import { collectModelObjectIds, runBag, runSignature } from '../sim/simBridge';
import { classIsKindOf } from '../../../model/simulation/isKindOf';
import { objectReferences, objectSlotValues } from '../../../model/simulation/objectSlots';
import { dcnStcFromRoles } from '../../../model/simulation/dcn/dcnRoles';
import type { DcnStc } from '../../../model/simulation/dcn/dcnRoles';
import type { DcnFeatures, DcnReadView } from '../../../model/simulation/dcn/dcnCompile';
import { decodeOntoBindings, ONTO_BINDINGS_KEY } from '../../../model/ontological/bindingCodec';
import { checkDcnWellFormedness } from '../../../model/dcn/dcnWellFormedness';
import type { DcnDiagnostic, DcnRule, DcnWellFormednessInput } from '../../../model/dcn/dcnWellFormedness';

type Lookup = Record<string, any>;

const DCN_KIND: NodeProblem['kind'] = 'dcn';

const RULE_TITLE: Record<DcnRule, string> = {
    W1: 'read outside its class',
    W2: 'cycle of class tests',
    W3: 'redefinition',
    W4: 'write outside its class',
    W6: 'write ownership',
    'R-DCN-13': 'range bounds',
    'R-DCN-16': 'blank invariant',
};

/** The M2 features of `DcnFeatures`, by `Class.feature` (see the module comment). */
const FEATURE_NAMES: Record<keyof DcnFeatures, string> = {
    rangeMin: 'Property.rangeMin',
    rangeMax: 'Property.rangeMax',
    literals: 'Enumeration.ownedLiterals',
    parameters: 'Operation.ownedParameters',
};

/** The id of an entry; `n` the ordinal among the entries of one element and rule. */
export function dcnProblemId(nodeId: string, rule: DcnRule, n: number): string {
    return `${DCN_KIND}:${nodeId}:${rule}:${n}`;
}

/** The metamodel whose bag holds the roles: the open model's `instanceof`, or `null`. */
function configModelOf(lookup: Lookup, modelId: string): string | null {
    const mm = lookup[modelId]?.instanceof;
    return typeof mm === 'string' && mm ? mm : null;
}

/** The dcn roles of the bag a run reads, or `null`; the raw bag first, so an unbound metamodel pays no `runBag`. */
function stcOf(lookup: Lookup, raw: unknown): DcnStc | null {
    if (!raw || typeof raw !== 'object') return null;
    const bag = raw as Record<string, unknown>;
    return dcnStcFromRoles(bag) === null ? null : dcnStcFromRoles(runBag(bag, lookup));
}

/** The read view of the model over the raw lookup. */
export function dcnReadView(lookup: Lookup, modelId: string): DcnReadView {
    const objects = collectModelObjectIds(lookup, modelId);
    const str = (v: unknown): string | undefined => (typeof v === 'string' && v !== '' ? v : undefined);
    return {
        objects: () => objects,
        metaclassOf: id => str(lookup[id]?.instanceof),
        referenceTargets: (id, reference) => objectReferences(lookup, id, reference),
        attributeValue: (id, attribute) => {
            const values = objectSlotValues(lookup, id, attribute);
            return values.length === 0 ? undefined : values.length === 1 ? values[0] : values;
        },
        ownerOf: feature => str(lookup[feature]?.father),
        conformsTo: (metaclass, superId) => classIsKindOf(lookup, metaclass, superId),
        nameOf: id => str(lookup[id]?.name),
    };
}

/** The ids of the metamodel's features by `Class.feature`, the class being the one that declares the feature. */
function featuresByName(lookup: Lookup, metamodelId: string): Map<string, string> {
    const inMetamodel = new Map<string, boolean>();
    const rootIs = (classId: string): boolean => {
        const known = inMetamodel.get(classId);
        if (known !== undefined) return known;
        let owner: any = lookup[classId];
        for (let depth = 0; owner && owner.className !== 'DModel' && depth < 40; depth++) owner = lookup[owner.father];
        const yes = owner?.id === metamodelId;
        inMetamodel.set(classId, yes);
        return yes;
    };
    const out = new Map<string, string>();
    for (const id in lookup) {
        const d = lookup[id];
        if (d?.className !== 'DAttribute' && d?.className !== 'DReference') continue;
        const owner = lookup[d.father];
        if (owner?.className !== 'DClass' || !rootIs(owner.id)) continue;
        const key = `${owner.name}.${d.name}`;
        if (!out.has(key)) out.set(key, id);
    }
    return out;
}

/** The input of the checks for the open model, or `null` when it binds no dcn role or no binding fits. */
export function dcnInputOf(lookup: Lookup, modelId: string): DcnWellFormednessInput | null {
    const mm = configModelOf(lookup, modelId);
    const raw = mm ? lookup[mm]?._state : undefined;
    const stc = stcOf(lookup, raw);
    if (!mm || !stc) return null;
    const decoded = decodeOntoBindings(raw[ONTO_BINDINGS_KEY]);
    if (!decoded.ok) return null;
    const fits = decoded.value.bindings.filter(b => {
        const owner = b.featureContainer !== undefined ? lookup[b.featureContainer]?.father : undefined;
        return typeof owner === 'string' && classIsKindOf(lookup, stc.staticClass, owner);
    });
    const binding = fits.find(b => b.featureSources !== undefined) ?? fits[0];
    if (!binding) return null;
    const byName = featuresByName(lookup, mm);
    const features: DcnFeatures = {
        rangeMin: byName.get(FEATURE_NAMES.rangeMin),
        rangeMax: byName.get(FEATURE_NAMES.rangeMax),
        literals: byName.get(FEATURE_NAMES.literals),
        parameters: byName.get(FEATURE_NAMES.parameters),
    };
    return { stc, binding, view: dcnReadView(lookup, modelId), features, associationEnds: byName.get('Association.ownedEnds') };
}

/**
 * What the producer's selector keys on: `''` when the model binds no dcn role, so that only a DCN model pays the
 * walk; otherwise the run's own signature (R-SIM-34: the bag's `sim*` keys, the model's slots, the metamodel) and
 * the bindings, which the run signature does not carry.
 */
export function dcnSignature(lookup: Lookup, modelId: string): string {
    const mm = configModelOf(lookup, modelId);
    const raw = mm ? lookup[mm]?._state : undefined;
    if (!mm || stcOf(lookup, raw) === null) return '';
    return `${runSignature(lookup, modelId, mm)}onto=${JSON.stringify(raw[ONTO_BINDINGS_KEY] ?? null)};`;
}

/** The registry entries of `diagnostics`, under the element and its resolved vertex. */
export function dcnProblemsOf(
    diagnostics: readonly DcnDiagnostic[],
    owner: string,
    resolveVertex?: VertexResolver,
    now: number = Date.now(),
): NodeProblem[] {
    const out: NodeProblem[] = [];
    const ordinal = new Map<string, number>();
    for (const d of diagnostics) {
        const key = `${d.element}\u0000${d.rule}`;
        const n = ordinal.get(key) ?? 0;
        ordinal.set(key, n + 1);
        const relatedNodeIds = d.related.map(r => resolveVertex?.(r) ?? r);
        const entry = (nodeId: string): NodeProblem => ({
            id: dcnProblemId(nodeId, d.rule, n),
            nodeId,
            kind: DCN_KIND,
            severity: d.severity,
            title: `${d.rule}: ${RULE_TITLE[d.rule]}`,
            description: d.message,
            relatedNodeIds,
            ownerModelId: owner,
            createdAt: now,
        });
        out.push(entry(d.element));
        const vertexId = resolveVertex?.(d.element) ?? null;
        if (vertexId && vertexId !== d.element) out.push(entry(vertexId));
    }
    return out;
}

/**
 * The body of the producer's effect: check the model, register the entries, mark resolved the entries of this model
 * it no longer wants. A model with no input, or a check that throws, publishes nothing and so revokes everything.
 *
 * @returns how many entries were registered, both anchors counted.
 */
export function reconcileDcnProblems(lookup: Lookup, modelId: string, resolveVertex?: VertexResolver): number {
    let problems: NodeProblem[] = [];
    try {
        const input = dcnInputOf(lookup, modelId);
        if (input) problems = dcnProblemsOf(checkDcnWellFormedness(input), modelId, resolveVertex);
    } catch {
        problems = [];
    }
    const desired = new Set(problems.map(p => p.id));
    for (const p of problems) registerProblem(p);
    for (const id of getProblemIdsOwnedBy(DCN_KIND, modelId)) {
        if (!desired.has(id)) markResolved(id);
    }
    return desired.size;
}

/** Mark resolved every entry of a model, with no check: it binds no dcn role any more. */
export function resolveDcnProblems(ownerModelId: string): void {
    for (const id of getProblemIdsOwnedBy(DCN_KIND, ownerModelId)) markResolved(id);
}

/** Remove every entry of a model outright, with no resolved transient: the editor closed. */
export function clearDcnProblems(ownerModelId: string): void {
    for (const id of getProblemIdsOwnedBy(DCN_KIND, ownerModelId)) clearProblem(id);
}
