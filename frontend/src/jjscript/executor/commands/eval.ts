/**
 * JjScript EVAL Command Handler
 * Evaluates JjEL expressions against the active metamodel context
 */

import {
    EvalArgs,
    ExecutionResult,
    ExecutionContext
} from '../../types';
import { getProject, getTargetMetamodel } from '../utils';
import { jjelEval } from '../../../jjel';
import type { JjelValue } from '../../../jjel';
import { extractAttributeValues } from '../../../jjel/evaluator/modelContext';
import { store, LPointerTargetable } from '../../../joiner';

// ============================================
// EVAL COMMAND EXECUTOR
// ============================================

export async function executeEval(
    args: EvalArgs,
    context: ExecutionContext
): Promise<ExecutionResult> {
    const { expression } = args;

    try {
        // Build evaluation context from active metamodel
        const variables = buildEvalContext(context);

        // Also include context variables (from let bindings, forall, etc.)
        for (const [key, value] of context.variables) {
            variables[key] = value;
        }

        // Evaluate the JjEL expression
        const result = jjelEval(expression, variables);

        // Detect undefined bare identifiers: if expression is a simple word
        // not in context, the evaluator returns null silently — treat as error
        if (result === null && isBareIdentifier(expression) && !(expression in variables)) {
            return {
                success: false,
                command: 'eval',
                message: `Unknown identifier: '${expression}'`,
                errors: [{
                    code: 'UNDEFINED_VARIABLE',
                    message: `'${expression}' is not a recognized variable or command`,
                    suggestion: 'Available: classes, attributes, references, packages, enumerations, instances, metamodel, project, data, node, <ClassName>. Try: help'
                }]
            };
        }

        // Format the result for display
        const formatted = formatJjelResult(result);

        return {
            success: true,
            command: 'eval',
            message: formatted.message,
            data: {
                expression,
                result,
                resultType: formatted.type,
                items: formatted.items
            }
        };
    } catch (error) {
        const err = error as Error;
        return {
            success: false,
            command: 'eval',
            message: `JjEL evaluation error: ${err.message}`,
            errors: [{
                code: 'JJEL_ERROR',
                message: err.message,
                suggestion: 'Check expression syntax. Example: forall c in classes : c.name'
            }]
        };
    }
}

// ============================================
// CONTEXT BUILDING
// ============================================

/**
 * Build JjEL evaluation context from the active metamodel.
 * Converts L-layer proxy objects to plain JjelValue objects
 * using shallow conversion to avoid circular reference issues.
 */
export function buildEvalContext(context: ExecutionContext): Record<string, JjelValue> {
    const variables: Record<string, JjelValue> = {};

    const project = getProject(context);
    if (!project) return variables;

    const metamodel = getTargetMetamodel(context, project);
    if (!metamodel) return variables;

    // Collect raw M1 L-proxy objects first so per-class `instances` /
    // `allInstances` can be derived by filtering on `obj.instanceof.name`. The
    // DClass.instances pointer list is unreliable here (often doesn't reflect
    // newly-created model objects), so we compute from the M1 model side instead.
    const m1models: any[] = (metamodel as any).instances || [];
    const rawM1Objects: any[] = [];
    for (const m of m1models) {
        const objs = (m as any).allSubObjects || (m as any).objects || [];
        for (const obj of objs) rawM1Objects.push(obj);
    }

    // Two-pass build for reference identity (so `obj.instanceOf == Person` works):
    //   Pass 1: build class shells (no instances yet).
    //   Pass 2: build classByName map.
    //   Pass 3: build instance plain objects, looking up shared class shell via classByName.
    //   Pass 4: mutate class shells to populate instances/allInstances from the shared pool.
    const classes = (metamodel as any).classes || [];
    const classJjelValues: JjelValue[] = classes.map((cls: any) => shallowClassToJjelValue(cls));
    variables['classes'] = classJjelValues;

    const classByName: Map<string, JjelValue> = new Map();
    for (let i = 0; i < classes.length; i++) {
        const cName = classes[i]?.name;
        if (typeof cName === 'string' && cName) classByName.set(cName, classJjelValues[i]);
    }

    const allInstancesJjel: JjelValue[] = rawM1Objects.map((o) => shallowObjectToJjelValue(o, classByName));
    variables['instances'] = allInstancesJjel;

    // Pass 3b (Stage 1): id -> handle index, then materialize feature slots.
    // The index is built from the shared pool so reference slots resolve to the
    // SAME handle object (instance identity for `==`). It must be complete before
    // slot-filling, hence a separate pass: a reference may point at an instance
    // built later in the pool.
    const instanceById: Map<string, JjelValue> = new Map();
    for (let j = 0; j < rawM1Objects.length; j++) {
        const oid = rawM1Objects[j]?.id;
        if (typeof oid === 'string' && oid) instanceById.set(oid, allInstancesJjel[j]);
    }
    // PERF: O(objects × features) per context build; no cross-evaluation cache in
    // Stage 1. Context-level memoization is the future lever.
    //
    // Worklist (not a plain loop) so an out-of-pool (cross-MM) reference target,
    // wrapped on demand mid-fill, is itself enqueued and filled exactly once —
    // never re-entering a handle that is currently mid-fill (recursion guard via
    // the `filled` set keyed on handle identity).
    const filled = new Set<JjelValue>();
    const fillWorklist: Array<[any, JjelValue]> = [];
    for (let j = 0; j < rawM1Objects.length; j++) fillWorklist.push([rawM1Objects[j], allInstancesJjel[j]]);
    while (fillWorklist.length) {
        const [srcObj, srcHandle] = fillWorklist.pop()!;
        if (filled.has(srcHandle)) continue;
        filled.add(srcHandle);
        fillInstanceSlots(srcObj, srcHandle as any, instanceById, classByName, fillWorklist);
    }

    // Pass 4: populate per-class instances/allInstances by sharing references
    // with the global pool, so identity holds across both surfaces.
    for (let i = 0; i < classes.length; i++) {
        const cls = classes[i];
        const classObj = classJjelValues[i] as any;
        const cName = cls?.name ?? '';
        if (!cName) continue;

        // Subclass set including the class itself, for allInstances.
        const subclassNames = new Set<string>([cName]);
        try {
            const subs = cls.allSubclasses || cls.allSubClasses || [];
            for (const s of subs) if (s?.name) subclassNames.add(s.name);
        } catch { /* skip */ }

        const instances: JjelValue[] = [];
        const allInstances: JjelValue[] = [];
        for (let j = 0; j < rawM1Objects.length; j++) {
            let instType: string | null = null;
            try { instType = rawM1Objects[j]?.instanceof?.name ?? null; } catch { /* skip */ }
            if (!instType) continue;
            const sharedJjel = allInstancesJjel[j];
            if (instType === cName) {
                instances.push(sharedJjel);
                allInstances.push(sharedJjel);
            } else if (subclassNames.has(instType)) {
                allInstances.push(sharedJjel);
            }
        }
        classObj.instances = instances;
        classObj.allInstances = allInstances;
        classObj.instanceCount = instances.length;
    }

    // Flat list of all attributes across all classes
    const allAttributes: JjelValue[] = [];
    for (const cls of classes) {
        const attrs = cls.attributes || [];
        for (const attr of attrs) {
            allAttributes.push(shallowAttributeToJjelValue(attr, cls.name));
        }
    }
    variables['attributes'] = allAttributes;

    // References (flat list across all classes)
    const allReferences: JjelValue[] = [];
    for (const cls of classes) {
        const refs = cls.references || [];
        for (const ref of refs) {
            allReferences.push(shallowReferenceToJjelValue(ref, cls.name));
        }
    }
    variables['references'] = allReferences;

    // Packages of the active metamodel (including nested sub-packages)
    const pkgs = (metamodel as any).allSubPackages || (metamodel as any).packages || [];
    variables['packages'] = pkgs.map((pkg: any) => shallowPackageToJjelValue(pkg));

    // Enumerations of the active metamodel
    const enums = (metamodel as any).enumerators || [];
    variables['enumerations'] = enums.map((e: any) => shallowEnumToJjelValue(e));

    // Metamodel as a plain object
    variables['metamodel'] = {
        name: metamodel.name ?? '',
        isMetamodel: true,
        classes: classJjelValues
    } as JjelValue;

    // Project-level context
    const metamodels = (project as any).metamodels || [];
    variables['project'] = {
        name: project.name ?? '',
        metamodels: metamodels.map((mm: any) => ({
            name: mm.name ?? '',
            isMetamodel: true,
            classes: ((mm as any).classes || []).map((cls: any) => shallowClassToJjelValue(cls))
        }))
    } as JjelValue;

    // Register each class by name as a top-level variable so users can write
    // `State` or `State.instances` instead of digging through `classes`.
    // Built-ins take precedence on collision (reserved names are skipped).
    for (let i = 0; i < classes.length; i++) {
        const name = classes[i]?.name;
        if (typeof name !== 'string' || !name) continue;
        if (name in variables) continue;
        variables[name] = classJjelValues[i];
    }

    // Selected element: `data` (model element) and `node` (graph vertex).
    // Read from Redux `_lastSelected`. classByName is threaded through so that
    // `self.instanceOf == RoadNetwork` resolves by reference identity.
    try {
        const state: any = store.getState();
        const selectedMeId = state?._lastSelected?.modelElement;
        const selectedNodeId = state?._lastSelected?.node;
        if (selectedMeId) {
            const me = LPointerTargetable.fromPointer(selectedMeId) as any;
            if (me) variables['data'] = wrapSelectedElement(me, classByName);
        }
        if (selectedNodeId) {
            const n = LPointerTargetable.fromPointer(selectedNodeId) as any;
            if (n) variables['node'] = wrapSelectedElement(n, classByName);
        }
    } catch {
        // selected element not available — skip
    }

    return variables;
}

/**
 * Convert an L-layer class proxy to a plain JjEL object.
 * Uses shallow conversion to avoid circular proxy loops.
 *
 * Builds the class shell only (no instances/allInstances). Those arrays are
 * populated by the buildEvalContext post-pass once the shared pool of M1
 * instance plain objects exists, so identity comparisons such as
 * `instances.first().instanceOf == Person` resolve correctly.
 */
function shallowClassToJjelValue(cls: any): JjelValue {
    const className = cls.name ?? '';

    const attributes = (cls.attributes || []).map((attr: any) =>
        shallowAttributeToJjelValue(attr, className)
    );
    const references = (cls.references || []).map((ref: any) =>
        shallowReferenceToJjelValue(ref, className)
    );
    const operations = (cls.operations || []).map((op: any) => ({
        name: op.name ?? '',
        returnType: op.type?.name ?? op.typeName ?? 'void',
        className
    }));

    // Read superclass names
    const superTypes: string[] = [];
    try {
        const supers = cls.extends || cls.extend || cls.superClasses || [];
        for (const s of supers) {
            if (typeof s === 'string') superTypes.push(s);
            else if (s?.name) superTypes.push(s.name);
        }
    } catch { /* proxy access can fail */ }

    return {
        name: className,
        // M3 type name (meta-metaclass), e.g. "DClass". Source: D-layer runtime
        // class name auto-set by the joiner at construction (classes.ts:458).
        className: cls.className ?? 'DClass',
        isAbstract: cls.isAbstract ?? cls.abstract ?? false,
        isInterface: cls.isInterface ?? cls.interface ?? false,
        // Mapped to D-layer field allowCrossReference for historical reasons;
        // UI and JjEL both use the more accurate name allowCrossExtend.
        allowCrossExtend: cls.allowCrossReference ?? false,
        isFinal: cls.isFinal ?? cls.final ?? false,
        isSingleton: cls.isSingleton ?? false,
        isRootable: cls.isRootable ?? cls.rootable ?? false,
        isPartial: cls.isPartial ?? cls.partial ?? false,
        attributes,
        references,
        operations,
        superTypes,
        // Populated by buildEvalContext post-pass. Empty here so that nested
        // contexts (e.g. project.metamodels[*].classes) that build classes in
        // isolation get a consistent shape without paying for instance enumeration.
        instances: [] as JjelValue[],
        allInstances: [] as JjelValue[],
        attributeCount: attributes.length,
        referenceCount: references.length,
        operationCount: operations.length,
        instanceCount: 0,
        __type: 'Class'
    } as JjelValue;
}

/**
 * Convert an L-layer attribute proxy to a plain JjEL object.
 */
function shallowAttributeToJjelValue(attr: any, className: string): JjelValue {
    return {
        name: attr.name ?? '',
        type: attr.type?.name ?? attr.typeName ?? 'String',
        className,
        isDerived: attr.isDerived ?? attr.derived ?? false,
        isId: attr.isId ?? attr.id ?? false,
        multiValued: attr.upperBound === -1 || attr.upperBound === '*',
        defaultValue: attr.defaultValue ?? null,
        __type: 'Attribute'
    } as JjelValue;
}

/**
 * Convert an L-layer reference proxy to a plain JjEL object.
 */
function shallowReferenceToJjelValue(ref: any, className: string): JjelValue {
    const upper = ref.upperBound ?? ref.upper ?? 1;
    return {
        name: ref.name ?? '',
        type: ref.type?.name ?? ref.typeName ?? '',
        containment: ref.containment ?? false,
        multiplicity: upper === -1 || upper === '*' ? '*' : String(upper),
        upperBound: upper,
        lowerBound: ref.lowerBound ?? ref.lower ?? 0,
        opposite: ref.opposite?.name ?? null,
        className,
        __type: 'Reference'
    } as JjelValue;
}

/**
 * Convert an L-layer package proxy to a plain JjEL object.
 */
function shallowPackageToJjelValue(pkg: any): JjelValue {
    const classes = (pkg.classes || []).map((c: any) => ({
        name: c.name ?? '',
        isAbstract: c.isAbstract ?? c.abstract ?? false,
        isInterface: c.isInterface ?? c.interface ?? false
    }));
    return {
        name: pkg.name ?? '',
        uri: pkg.uri ?? '',
        prefix: pkg.prefix ?? '',
        classes,
        classCount: classes.length,
        __type: 'Package'
    } as JjelValue;
}

/**
 * Convert an L-layer enumerator proxy to a plain JjEL object.
 */
function shallowEnumToJjelValue(e: any): JjelValue {
    const literals = (e.literals || []).map((l: any) => ({
        name: l.name ?? '',
        value: l.value ?? null
    }));
    return {
        name: e.name ?? '',
        literals,
        literalCount: literals.length,
        __type: 'Enumeration'
    } as JjelValue;
}

/**
 * Convert an L-layer M1 object proxy to a plain JjEL object.
 * Surfaces user-defined attribute values as top-level properties.
 *
 * When `classByName` is provided, `instanceOf` (canonical) and `instanceof`
 * (deprecated alias, same reference) point to the shared plain class object,
 * enabling identity comparisons like `obj.instanceOf == Person`. When the map
 * is absent the properties remain null — callers that need identity must
 * thread the map through (buildEvalContext does).
 */
function shallowObjectToJjelValue(obj: any, classByName?: Map<string, JjelValue> | null): JjelValue {
    // `className` is intentionally omitted on instances: it is strict-on-classes
    // (M2->M3) per the v2 design (2026-04-28). Accessing `obj.className` on an
    // instance produces a pedagogical JjEL error (see evaluator.ts) redirecting
    // the user to `obj.instanceOf.name` for the metaclass name.
    const result: any = {
        id: obj.id ?? '',
        __type: 'Object'
    };
    try { result.name = obj.name ?? null; } catch { result.name = null; }

    // Resolve instanceOf to the shared plain class object (not a string, not
    // an L-proxy). Both `instanceOf` (canonical, camelCase) and `instanceof`
    // (deprecated alias) hold the same reference.
    let instType: string | null = null;
    try { instType = obj.instanceof?.name ?? null; } catch { /* skip */ }
    const classObj: JjelValue | null = (classByName && instType) ? (classByName.get(instType) ?? null) : null;
    result.instanceOf = classObj;
    result.instanceof = classObj;

    // Expose metamodel feature values (from $name.value etc.) directly.
    extractAttributeValues(obj, result);
    return result as JjelValue;
}

/**
 * Stage 1 — materialize an M1 instance's feature slots onto its extent handle.
 *
 * Runs as a second pass (after the full id->handle index exists) so reference
 * slots can resolve to the shared pool handles. Two read strategies, by feature
 * kind (distinguished via the slot's `instanceof` M2 feature):
 *
 *   - Attributes: read through the L-layer getter (`feature.value`/`feature.values`)
 *     so primitive coercion (EBoolean, numeric clamping, EString identity
 *     fallback) and enum-literal resolution reuse the verified `LValue.get_values`
 *     pipeline. Enum literals are collapsed to their `name` string so no L-proxy
 *     is ever stored on the handle (the inspector / `==` need plain values).
 *   - References: read the raw DValue pointer ids and resolve them against the
 *     shared pool BY POINTER — never by class name (cross-MM safe). A resolved
 *     target is the SAME handle object, giving instance identity for `==`.
 *     Out-of-pool targets (e.g. cross-metamodel) are wrapped on demand, memoized
 *     into the index, and enqueued on `fillWorklist` so their own slots are
 *     filled exactly once (their `instanceOf` may legitimately be null when the
 *     class is not in `classByName` — not extended across metamodels in Stage 1).
 *
 * Shape follows cardinality: upperBound 1 -> single value | handle | null;
 * multi -> array (never null). Reserved keys (`id`, `__type`, `instanceOf`,
 * `instanceof`) are never overwritten; a user feature MAY shadow `name`
 * (user-feature-first, book §3.13.4).
 */
function fillInstanceSlots(
    rawObj: any,
    handle: any,
    instanceById: Map<string, JjelValue>,
    classByName: Map<string, JjelValue> | null,
    fillWorklist: Array<[any, JjelValue]>
): void {
    if (!rawObj || !handle || typeof handle !== 'object') return;

    let features: any[];
    try { features = rawObj.features || []; } catch { return; }
    if (!Array.isArray(features)) return;

    const collapse = (v: any): JjelValue => {
        // Enum literals (and any stray L-proxy) collapse to their name string;
        // primitives pass through; undefined normalizes to null.
        if (v && typeof v === 'object') {
            try {
                if ((v as any).__isProxy || (v as any).className === 'DEnumLiteral') {
                    const n = (v as any).name;
                    return typeof n === 'string' ? n : null;
                }
            } catch { /* skip */ }
            try {
                const n = (v as any).name;
                if (typeof n === 'string') return n;
            } catch { /* skip */ }
        }
        return v === undefined ? null : v;
    };

    for (const feature of features) {
        if (!feature) continue;
        let fname: string | undefined;
        try { fname = feature.name; } catch { continue; }
        if (!fname || typeof fname !== 'string') continue;
        // Identity/type markers are not overwritable. `name` is intentionally
        // absent here so a user feature named "name" can shadow it.
        if (fname === 'id' || fname === '__type' || fname === 'instanceOf' || fname === 'instanceof') continue;

        let meta: any;
        try { meta = feature.instanceof; } catch { meta = undefined; }
        const metaClass: string | undefined = meta?.className;

        let ub: any;
        try { ub = meta?.upperBound; } catch { ub = undefined; }
        const isMany = ub === -1 || ub === '*' || (typeof ub === 'number' && ub > 1);

        if (metaClass === 'DReference') {
            let rawVals: any[];
            try {
                const r = feature.__raw?.values;
                rawVals = Array.isArray(r) ? r : [];
            } catch { rawVals = []; }

            const seen = new Set<string>();
            const resolved: JjelValue[] = [];
            for (const v of rawVals) {
                if (typeof v !== 'string' || !v) continue;
                if (seen.has(v)) continue;
                seen.add(v);
                let target: JjelValue | null = instanceById.get(v) ?? null;
                if (target === null) {
                    try {
                        const ltarget = LPointerTargetable.fromPointer(v) as any;
                        if (ltarget) {
                            target = shallowObjectToJjelValue(ltarget, classByName);
                            instanceById.set(v, target);
                            // Fill the on-demand target's own slots too (guarded
                            // fill-once by the caller's `filled` set).
                            fillWorklist.push([ltarget, target]);
                        }
                    } catch { target = null; }
                }
                if (target !== null) resolved.push(target);
            }
            handle[fname] = isMany ? resolved : (resolved.length ? resolved[0] : null);
            continue;
        }

        // Attribute (or shapeless/unknown meta): L-getter for correct coercion.
        if (isMany) {
            let vals: any[];
            try {
                const vv = feature.values;
                vals = Array.isArray(vv) ? vv : (vv == null ? [] : [vv]);
            } catch { vals = []; }
            handle[fname] = vals.map(collapse);
        } else {
            let v: any;
            try { v = feature.value; } catch { v = null; }
            const collapsed = collapse(v);
            // Stage 1 amendment: an empty single-valued attribute resolves to its
            // declared default / canonical type default / null (not bare null).
            handle[fname] = collapsed === null ? emptyAttributeDefault(meta) : collapsed;
        }
    }
}

/**
 * Stage 1 amendment — resolve the value of an EMPTY single-valued attribute slot
 * (called by fillInstanceSlots only when the L-getter yields no value).
 *
 * Resolution order, from the typing M2 attribute `meta` (an LAttribute):
 *   1. Declared default: if the attribute declares a `defaultValue`, use it,
 *      coerced to the attribute's primitive type (same `type`/`defaultValue`
 *      fields read by shallowAttributeToJjelValue — no parallel value pipeline).
 *   2. Mandatory: else if `lowerBound >= 1`, the canonical type default —
 *      boolean -> false, numeric -> 0, EString -> "", enum -> first literal name.
 *   3. Optional: else (lowerBound 0, or not reliably readable) -> null.
 *
 * NB: the D-layer default for `lowerBound` is 0 (DAttribute.lowerBound), so an
 * attribute is OPTIONAL unless explicitly made mandatory — step 2 fires only for
 * attributes whose lower bound was set to >= 1. Multi-valued attributes (empty
 * array) and references never reach here.
 */
function emptyAttributeDefault(meta: any): JjelValue {
    if (!meta) return null;

    // Type categorisation, shared by declared-default coercion and the canonical
    // default. Reuses the attribute's classifier; introduces no parallel pipeline.
    let typeName = '';
    let isEnum = false;
    let enumLiterals: any[] = [];
    try {
        const t = meta.type;
        if (t) {
            isEnum = t.isEnum === true || t.className === 'DEnumerator';
            typeName = String(t.name || '').toLowerCase();
            if (isEnum) { try { enumLiterals = t.literals || []; } catch { enumLiterals = []; } }
        }
    } catch { /* type unreadable -> 'other' below */ }

    const isBool = !isEnum && typeName.includes('bool');
    const isNum  = !isEnum && /(int|long|short|byte|float|double|decimal|integer|number)/.test(typeName);
    const isStr  = !isEnum && typeName.includes('string');

    const firstLiteralName = (): JjelValue => {
        try { const n = enumLiterals[0]?.name; return typeof n === 'string' ? n : null; }
        catch { return null; }
    };

    // 1. Declared default (coerced to the attribute's type).
    let declared: any;
    try { declared = meta.defaultValue; } catch { declared = undefined; }
    if (declared !== undefined && declared !== null && declared !== '') {
        if (isEnum) {
            try {
                if (typeof declared === 'number') {
                    const lit = enumLiterals.find((l: any) => l?.value === declared) || enumLiterals[declared];
                    return (lit?.name) ?? null;
                }
                const named = enumLiterals.find((l: any) => l?.name === declared);
                if (named?.name) return named.name;
                return typeof declared === 'string' ? declared : null;
            } catch { return null; }
        }
        if (isBool) {
            if (declared === true || declared === 'true' || declared === 1 || declared === '1') return true;
            if (declared === false || declared === 'false' || declared === 0 || declared === '0') return false;
            return Boolean(declared);
        }
        if (isNum) { const n = Number(declared); return Number.isFinite(n) ? n : 0; }
        if (isStr) return typeof declared === 'string' ? declared : String(declared);
        return declared;
    }

    // 2. Mandatory -> canonical type default.
    let lower: any;
    try { lower = meta.lowerBound; } catch { lower = undefined; }
    if (typeof lower === 'number' && lower >= 1) {
        if (isEnum) return firstLiteralName();
        if (isBool) return false;
        if (isNum)  return 0;
        if (isStr)  return '';
        return null;
    }

    // 3. Optional / unknown lower bound -> null.
    return null;
}

/**
 * Wrap the currently-selected model element or graph node for use in the JjEL
 * context. Attribute values are surfaced as top-level properties so users can
 * write `data.age` instead of `data.$age.value`.
 *
 * When `classByName` is provided, `instanceOf` (canonical) and `instanceof`
 * (deprecated alias) are overridden to the shared plain class object so that
 * `self.instanceOf == Person` resolves by reference identity, consistent with
 * `instances[i].instanceOf` exposed by shallowObjectToJjelValue.
 */
function wrapSelectedElement(me: any, classByName?: Map<string, JjelValue> | null): JjelValue {
    // `__type: 'Object'` aligns the discriminator used elsewhere
    // (shallowObjectToJjelValue) so the evaluator's pedagogical error for
    // `obj.className` on instances triggers symmetrically on `data`/`self`.
    const result: any = { __isProxy: true, __type: 'Object' };

    let keys: (string | symbol)[];
    try {
        keys = Reflect.ownKeys(me);
    } catch {
        try { keys = Object.keys(me); } catch { keys = []; }
    }

    for (const key of keys) {
        if (typeof key !== 'string') continue;
        if (key.startsWith('__') || key === '_proxied') continue;
        try {
            const v = me[key];
            if (typeof v === 'function') continue;
            result[key] = v;
        } catch { /* skip inaccessible */ }
    }

    // Metamodel-defined attribute values override built-in keys
    // (aligns with Console/JjTL behavior).
    extractAttributeValues(me, result);

    // Strip className inherited from the L-proxy: per v2 design (2026-04-28),
    // `className` is strict-on-classes. The evaluator's pedagogical error
    // requires the property to be absent on instances so the lookup fails into
    // the error path rather than silently returning the M3 type name.
    delete result.className;

    // Override instanceOf/instanceof with the shared plain class object so
    // that identity comparisons against top-level class bindings work
    // (e.g. `self.instanceOf == RoadNetwork`). The Reflect.ownKeys copy above
    // would otherwise leave an L-proxy reference, breaking identity.
    if (classByName) {
        let instType: string | null = null;
        try { instType = me?.instanceof?.name ?? null; } catch { /* skip */ }
        const classObj = (typeof instType === 'string' && instType) ? (classByName.get(instType) ?? null) : null;
        result.instanceOf = classObj;
        result.instanceof = classObj;
    }

    // If the selected element is a metaclass (M2), hydrate `result` with the
    // structural properties exposed by shallowClassToJjelValue at Level 1, so
    // `self.isAbstract` / `self.instances` resolve identically to
    // `Attribute.isAbstract` / `Attribute.instances` (reference identity for
    // arrays). Reading from the shared plain class object avoids L-proxy
    // getters and the D-layer naming mismatch (`abstract` vs `isAbstract`).
    if (classByName && typeof result.name === 'string') {
        const classPlainObj: any = classByName.get(result.name);
        if (classPlainObj && typeof classPlainObj === 'object') {
            result.isAbstract       = classPlainObj.isAbstract       ?? null;
            result.isInterface      = classPlainObj.isInterface      ?? null;
            result.isFinal          = classPlainObj.isFinal          ?? null;
            result.isSingleton      = classPlainObj.isSingleton      ?? null;
            result.isRootable       = classPlainObj.isRootable       ?? null;
            result.isPartial        = classPlainObj.isPartial        ?? null;
            result.allowCrossExtend = classPlainObj.allowCrossExtend ?? null;
            result.instances        = classPlainObj.instances        ?? [];
            result.allInstances     = classPlainObj.allInstances     ?? [];
            result.attributes       = classPlainObj.attributes       ?? [];
            result.references       = classPlainObj.references       ?? [];
            result.className        = classPlainObj.className        ?? null;
        }
    }

    return result as JjelValue;
}

// ============================================
// RESULT FORMATTING
// ============================================

interface FormattedResult {
    message: string;
    type: 'array' | 'primitive' | 'object' | 'null';
    items?: string[];
}

function formatJjelResult(result: JjelValue): FormattedResult {
    if (result === null || result === undefined) {
        return { message: 'null', type: 'null' };
    }

    if (Array.isArray(result)) {
        if (result.length === 0) {
            return { message: '*Empty result (0 items)*', type: 'array', items: [] };
        }

        const items = result.map(item => formatSingleValue(item));
        return {
            message: `**${result.length}** result${result.length !== 1 ? 's' : ''}`,
            type: 'array',
            items
        };
    }

    if (typeof result === 'object') {
        const name = (result as any).name;
        if (name !== undefined) {
            return { message: String(name), type: 'object' };
        }
        return { message: JSON.stringify(result, null, 2), type: 'object' };
    }

    return { message: String(result), type: 'primitive' };
}

/**
 * Check if an expression is a bare identifier (single word, no dots/operators/parens).
 * Used to detect undefined variable references vs valid null-returning expressions.
 */
function isBareIdentifier(expr: string): boolean {
    const trimmed = expr.trim();
    return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(trimmed);
}

function formatSingleValue(value: JjelValue): string {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (Array.isArray(value)) return `[${value.map(v => formatSingleValue(v)).join(', ')}]`;
    if (typeof value === 'object') {
        const name = (value as any).name;
        if (name !== undefined) return String(name);
        return JSON.stringify(value);
    }
    return String(value);
}
