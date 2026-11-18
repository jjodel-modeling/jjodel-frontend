/**
 * JjScript M1 Instance Command Handlers
 *
 * Handles operations on DObject instances inside an M1 model:
 *   create instance <ClassName> ["<instanceName>"] [in <Parent>.<reference>]
 *   delete <InstanceName>          (in M1 context)
 *   rename <InstanceName> to <newName>   (in M1 context)
 *   set <InstanceName>.<attrName> = <value>   (in M1 context, attribute or reference)
 *
 * Pattern source (canvasToJjom.ts):
 *   - DObject.new(metaclassId, modelId, DModel, name, true)   — NOT inside TRANSACTION
 *   - (lObject as any)['$' + featureName].value = newValue    — inside TRANSACTION (single value)
 *   - refProxy.values = [...meaningful, targetObject.id]      — inside TRANSACTION (multi-value / reference)
 *
 * Reference (link) semantics (#168 C1, `../referenceWrite.ts`):
 *   In M1, `set X.refName = Y` where refName is a metaclass reference REPLACES the target
 *   when the reference is single-valued, and appends Y's id when it is multi-valued
 *   (mirroring syncCreateReferenceLink). Setting to null clears the reference (unlink).
 *   Both read the slot only after the queued writes have landed (`settlePendingWrites`).
 *
 * Collection updates and types (#175, `docs/discovery/discovery_2026-10-07_175_jjscript_m1_operators.md`):
 *   `set X.refName += Y` appends Y while the slot has room and never replaces; `set X.refName -= Y`
 *   and `remove Y from X.refName` take Y out by value. A link (`=`, `+=`) writes only an instance
 *   of the reference type or of a subclass (`TYPE_MISMATCH`).
 */

import {
    CreateArgs,
    DeleteArgs,
    RenameArgs,
    SetArgs,
    RemoveArgs,
    ExecutionResult,
    ExecutionContext,
    LiteralValue,
    QualifiedName,
} from '../../types';
import { qualifiedNameToString, literalValueToString } from '../../parser/grammar';

import {
    DObject,
    DModel,
    DValue,
    SetFieldAction,
    TRANSACTION,
    LPointerTargetable,
    LModel,
    LProject,
    LClass,
} from '../../../joiner';
import {
    registerHandle,
    getHandleId,
    hasHandle,
    unregisterHandle,
    renameHandle,
    getReservedHandles,
    registerPendingChild,
    getPendingChildren,
    forgetPendingChild,
} from '../handleRegistry';
import { isManyValued, linkedIds, planLink, planUnlink, planAdd, planRemove } from '../referenceWrite';
import { resolveInstanceAddress, elsewhereSuggestion } from '../instanceAddress';

// ============================================
// SHARED HELPERS
// ============================================

/**
 * Resolve the M1 target model from the execution context.
 * Returns null with an error message if the context is not properly set up.
 */
export function resolveTargetModel(context: ExecutionContext, project: LProject): LModel | null {
    if (!context.modelId) return null;
    const models = (project as any).models || [];
    const model = models.find((m: LModel) => m.id === context.modelId && !m.isMetamodel);
    return model ?? null;
}

/**
 * Resolve the metamodel of conformity for the active M1 model.
 */
function resolveMetamodel(context: ExecutionContext, project: LProject): LModel | null {
    if (!context.targetMetamodelId) return null;
    const metamodels = (project as any).metamodels || [];
    return metamodels.find((m: LModel) => m.id === context.targetMetamodelId) ?? null;
}

/**
 * Find a metaclass by name across the metamodel (model-level + packages, recursively).
 * Mirrors useEditorMode.ts' class collection: classes can sit at the model level OR
 * inside packages/subpackages.
 */
function findMetaclassByName(metamodel: LModel, className: string): LClass | null {
    const visited = new Set<string>();
    const stack: any[] = [metamodel];

    while (stack.length > 0) {
        const container = stack.pop();
        if (!container || visited.has(container.id)) continue;
        visited.add(container.id);

        const classes = container.classes ?? [];
        for (const c of classes) {
            if (c?.name === className) return c as LClass;
        }

        const subpackages = container.subpackages ?? container.subPackages ?? [];
        for (const sp of subpackages) stack.push(sp);

        const packages = container.packages ?? [];
        for (const p of packages) stack.push(p);
    }

    return null;
}

/**
 * Every instance of the target M1 model carrying this name — the RAW lookup.
 *
 * Returns the LIST, never one of them (R-S1-5). A name is not a key: a model can
 * legitimately hold several instances that share one, and the `.find` this used to
 * be answered "the first" to a question that has no single answer. Whoever needs ONE
 * goes through `resolveInstanceHandle`, which turns the list into a verdict.
 *
 * The scope is the whole model, roots and contained instances (R-JS-10, amending
 * R-S1-5's «roots of one model»): `model.objects` holds the roots only, and an
 * instance born in a containment slot (`create instance … in`, the UI's «Add») is
 * never listed there, so a roots-only lookup could not address it from a later run.
 */
export function findInstanceByName(model: LModel, instanceName: string): any[] {
    return allModelInstances(model).filter((o: any) => o?.name === instanceName);
}

/**
 * The instances of one M1 model: its roots (`model.objects`) in their order, then, level by
 * level, every object its containment slots hold (`LObject.subObjects`, the source the tree
 * uses), each once. An object listed both as a root and in a slot (what `set p.ref += x` leaves
 * behind, report §4.3) is one instance. A containment cycle ends at the first repeat.
 */
export function allModelInstances(model: LModel): any[] {
    const queue: any[] = [...((model as any)?.objects ?? [])];
    const seen = new Set<string>();
    const out: any[] = [];
    for (let i = 0; i < queue.length; i++) {
        const o = queue[i];
        if (!o) continue;
        if (typeof o.id === 'string') {
            if (seen.has(o.id)) continue;
            seen.add(o.id);
        }
        out.push(o);
        let subs: any[] = [];
        try { subs = o.subObjects ?? []; } catch { /* proxy not resolvable */ }
        for (const sub of subs) {
            // A slot can hold primitives and literals as well: only objects are instances.
            if (sub && typeof sub.id === 'string' && sub.className === 'DObject') queue.push(sub);
        }
    }
    return out;
}

/**
 * Whether an instance can be waited for as present (R-JS-11): one the model already shows
 * (roots or contained, committed by construction), or the handle this run created, once its
 * metaclass is in the store. `DObject.new` puts the object in the store at once, but its
 * `instanceof`, its slots and its place in the model land together about 300 ms later
 * (report §4.5); a handler reached before that answers `NO_METACLASS`.
 */
export function hasReadyInstance(model: LModel, instanceName: string): boolean {
    // `.length > 0`, never the bare value: an empty list is truthy.
    if (findInstanceByName(model, instanceName).length > 0) return true;
    const id = getHandleId(instanceName);
    if (!id) return false;
    const obj = LPointerTargetable.fromPointer(id) as any;
    const raw = obj?.__raw ?? obj;
    return !!(obj && obj.id && raw?.instanceof);
}

/** One of several instances a name could have meant. */
export interface InstanceCandidate {
    id: string;
    /** Metaclass name, or '' when it cannot be resolved. */
    className: string;
}

/**
 * The three outcomes of resolving a name to an instance.
 *
 *  - `{ok: true, value}`            — exactly one, or the session handle registry answered.
 *  - `{ok: false, reason}`          — nothing carries that name. No `candidates`.
 *  - `{ok: false, reason, candidates}` — 2+ carry it. `candidates.length >= 2` is what
 *                                    distinguishes this case from the one above, so the
 *                                    caller never has to parse `reason` to tell them apart.
 *
 * Same family as the `WriteResult` of the write path, deliberately NOT the same type:
 * ambiguity of RESOLUTION is a different question from uniqueness of WRITING, and the two
 * shapes converge in S4 if they turn out to want the same fields. Local to jjscript.
 */
export interface InstanceResolution {
    ok: boolean;
    value?: any;
    reason?: string;
    candidates?: InstanceCandidate[];
}

function toCandidate(o: any): InstanceCandidate {
    let className = '';
    try { className = (o?.instanceof?.name as string) ?? ''; } catch { /* proxy not resolvable */ }
    return { id: String(o?.id ?? ''), className };
}

/**
 * The message an ambiguous name earns, shared by all five commands.
 *
 * ONE builder, because five copies of the same sentence drift into five different
 * sentences. The candidates are named by METACLASS, not by containment path: measured
 * (`docs/discovery/discovery_2026-08-30_s1b_ambiguita_dichiarata.md` §5), every candidate
 * this lookup can return is a root of the SAME model, so all of them share one path and
 * printing it would put two identical lines under "which one?". The metaclass is what
 * actually separates them; the id is the tiebreaker when even that repeats, and it is
 * printed in full because a truncated pointer cannot be used to address anything.
 */
export function describeAmbiguity(instanceName: string, candidates: InstanceCandidate[]): string {
    const listed = candidates
        .map(c => (c.className ? `${c.className} (${c.id})` : c.id))
        .join(', ');
    return `Ambiguous instance name '${instanceName}': ${candidates.length} candidates — ${listed}. `
        + `Rename one, or address it from the canvas.`;
}

/**
 * Resolve an M1 instance for a script command. The session handle registry WINS: if
 * `handle` was created in this run, resolve its DObject by id — immediate and
 * independent of the (mutable, asynchronously-committed) `name` attribute. Only when the
 * handle is not a script-local one do we fall back to name-based lookup, for instances
 * that pre-existed the script. Stale entries (object deleted underneath us) self-heal.
 *
 * AMBIGUITY IS ONLY REACHABLE ON THE FALLBACK. The registry is keyed by id and per-run, so
 * a handle never resolves to two things: the homonym scenario of
 * `handleRegistry.test.ts` ("registry precedence") stays resolved WITHOUT the list being
 * built. Only an instance that pre-existed the script can be ambiguous — which is exactly
 * the case the census describes.
 *
 * Exported so the dependency waiter can adopt the same resolution in a follow-up.
 */
export function resolveInstanceHandle(model: LModel, handle: string): InstanceResolution {
    const id = getHandleId(handle);
    if (id) {
        const obj = LPointerTargetable.fromPointer(id) as any;
        if (obj && obj.id) return { ok: true, value: obj }; // registry wins: id-based, race-free
        unregisterHandle(handle);      // stale (deleted) → clean up, fall through
    }

    const matches = findInstanceByName(model, handle);
    if (matches.length === 1) return { ok: true, value: matches[0] };
    if (matches.length === 0) {
        return { ok: false, reason: `No instance named '${handle}' in '${(model as any)?.name ?? 'the model'}'` };
    }
    const candidates = matches.map(toCandidate);
    return { ok: false, reason: describeAmbiguity(handle, candidates), candidates };
}

/**
 * Generate a unique default name for a new instance.
 * Strategy: <ClassName>, <ClassName>2, <ClassName>3, ... — same as the visual editor.
 *
 * `reserved` carries the handles already created in this run: the model's committed
 * `objects` list lags behind (deferred store commit), so without it two consecutive
 * auto-named creates in a batch would both pick `<ClassName>`.
 */
function generateInstanceName(className: string, model: LModel, reserved: Set<string>): string {
    // Model-wide (R-JS-10): a name a contained instance holds would make the new one ambiguous.
    const objects = allModelInstances(model);
    const taken = new Set<string>(
        objects.map((o: any) => o?.name).filter((n: any) => typeof n === 'string')
    );
    for (const h of reserved) taken.add(h);
    if (!taken.has(className)) return className;
    let i = 2;
    while (taken.has(`${className}${i}`)) i++;
    return `${className}${i}`;
}

/**
 * Determine if a metaclass property name is an attribute, a reference, or unknown.
 * Walks the inheritance chain via allAttributes/allReferences (proxy getters).
 */
type PropertyKind = 'attribute' | 'reference' | 'unknown';

function classifyMetaclassProperty(metaclass: LClass, propName: string): PropertyKind {
    const attrs: any[] = (metaclass as any).allAttributes ?? (metaclass as any).attributes ?? [];
    if (attrs.some((a) => a?.name === propName)) return 'attribute';

    const refs: any[] = (metaclass as any).allReferences ?? (metaclass as any).references ?? [];
    if (refs.some((r) => r?.name === propName)) return 'reference';

    return 'unknown';
}

/**
 * Convert a JjScript literal/qualified-name value into a primitive for an attribute set.
 */
function literalToPrimitive(value: LiteralValue): string | number | boolean | null {
    switch (value.kind) {
        case 'null':    return null;
        case 'boolean': return value.value;
        case 'number':  return value.value;
        case 'string':  return value.value;
        default:        return null;
    }
}

/**
 * #211 — write a whole vector into an attribute slot.
 *
 * The plain whole-array set the reducer replaces (`reducer.ts deepCopyButOnlyFollowingPath`):
 * it grows and shrinks, so `= [a, b]`, `= []`, `= null` and a full `+=` all take this one form.
 * The proxy's `slot.values = [...]` setter is deliberately not used: its shrink path issues the
 * valueless `'-='` the reducer drops (model/AGENTS.md §9.3), so a shorter write would keep the
 * excess. Primitives carry no containment and no `pointedBy`, `isPtr` is false.
 */
function writeVector(
    lObject: any,
    property: string,
    values: (string | number | boolean | null)[],
    message: string,
    data: Record<string, any>
): Promise<ExecutionResult> {
    return new Promise((resolve) => {
        try {
            TRANSACTION('JjScript: Set instance attribute', () => {
                const slot = (lObject as any)['$' + property];
                if (!slot?.id) {
                    resolve({
                        success: false,
                        command: 'set',
                        message: `Feature proxy for '${property}' is not available on instance`,
                        errors: [{ code: 'NO_FEATURE_PROXY', message: 'Internal: $-proxy missing' }]
                    });
                    return;
                }
                SetFieldAction.new(slot.id, 'values', values, '', false);
                resolve({
                    success: true,
                    command: 'set',
                    message,
                    data,
                    affectedElements: [lObject.id],
                    undoable: true
                });
            });
        } catch (error) {
            resolve({
                success: false,
                command: 'set',
                message: `Failed to set attribute: ${(error as Error).message}`,
                errors: [{ code: 'SET_INSTANCE_ATTR_ERROR', message: (error as Error).message }]
            });
        }
    });
}

/**
 * Let every write already queued reach the store before a reference slot is read.
 *
 * The app keeps a transaction block open and commits it every `U.UpdatingTimer` (300 ms,
 * `reducer.ts:1444`), so a `set` returns while its write is still queued. A second `set` on the
 * same slot inside that window read the old values and overwrote the first: measured in a
 * `do ... end` block, in a `forall` and at the Run button's 20 ms pacing (#168 C1,
 * `docs/discovery/discovery_2026-10-02_168_c1_executor_prompt.md` §3.2-3.3). This is the
 * interval's own call made now; it schedules the dispatch as a `setTimeout(0)` (`action.ts:349`),
 * so one macrotask later the store holds it, as in the drain of `reducer.ts:1591-1592`.
 *
 * `COMMIT` is loaded here, not at the top: `joiner` does not export it, and a static import of
 * `action.ts` would evaluate it in the suites that mock `joiner` to load this file
 * (`handleRegistry.test.ts`, `elementWaiter.test.ts`), where it reads `windoww` from the mock.
 */
async function settlePendingWrites(): Promise<void> {
    const { COMMIT } = await import('../../../redux/action/action');
    COMMIT(undefined, false);
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

/**
 * Take ids out of a reference slot by value. Must run inside the caller's TRANSACTION.
 *
 * `refProxy.values = [...]` cannot shrink a slot: it shortens it with a `'-='` that carries no
 * value, which the reducer drops (`model/CLAUDE.md` §9.3). By value it is the reducer's own
 * removal, the one `Dummy.get_delete` uses (R-DEL-4). A child taken out of a containment goes
 * back to the model root, the write `_clearValueAtPosition` makes when it evicts one
 * (`LModelElement.tsx:7855-7856`) — only when this slot is its father, so an object another
 * container holds is not pulled out of it.
 */
function removeLinked(refProxy: any, ids: readonly string[], containment: boolean, modelId: string): void {
    for (const id of ids) {
        SetFieldAction.new(refProxy.id, 'values', id as any, '-=', true);
        if (containment && (LPointerTargetable.fromPointer(id as any) as any)?.__raw?.father === refProxy.id) {
            SetFieldAction.new(id as any, 'father', modelId as any, undefined, true);
        }
    }
}

/**
 * Whether the model lists this object among its roots (`model.objects`). A child born in its slot
 * (`create instance … in`, the UI's «Add», R-JS-9) never is: taken out of that slot it would be
 * fathered to the model and listed nowhere, the eviction orphan of #174.
 */
function isListedAtRoot(model: LModel, id: string): boolean {
    const objects: any[] = (model as any).__raw?.objects ?? [];
    return objects.some((o: any) => (typeof o === 'string' ? o : o?.id) === id);
}

/**
 * Record a cross-model link as a model dependency (#213 follow-up): the caller model lists the
 * target model in its `dependencies` ("Include other models as prerequisite for this model",
 * `LModelElement.tsx:5155-5159`), so it is set when a link to an instance of another model is
 * written, if not already. The committed write forms of the field: the Info panel «Depends
 * from models» (`Info.tsx:533`, whole-list `l.dependencies = [ids]`) and the delete cascade
 * (`Dummy.ts`, `case 'dependencies'`, `'-='` by id) — a pointer-list field of DModel driven by
 * `SetFieldAction` ops, the `'+='` the `pointedBy` writes use. Must run inside the caller's
 * TRANSACTION, so the undo of the link takes the dependency with it.
 */
function ensureModelDependency(callerModel: LModel, targetModelId: string): void {
    const deps: any[] = (callerModel as any).__raw?.dependencies ?? [];
    if (deps.some((p: any) => (typeof p === 'string' ? p : p?.id) === targetModelId)) return;
    SetFieldAction.new(callerModel.id, 'dependencies', targetModelId as any, '+=', true);
}

/**
 * The refusal of a link whose target is not an instance of the reference type or of one of its
 * subclasses, or `null` (#175). The same test `resolveContainerSlot` runs for `create … in`. The
 * target's class is read from the store, so the caller drains the queued writes first: a target
 * the previous line created has no `instanceof` until the commit lands (R-JS-11).
 */
function linkTypeMismatch(metaclass: LClass, property: string, targetId: string, targetName: string): ExecutionResult | null {
    const refs: any[] = (metaclass as any).allReferences ?? (metaclass as any).references ?? [];
    const refType: any = refs.find((r: any) => r?.name === property)?.type;
    if (!refType) return null;
    const targetClass: any = (LPointerTargetable.fromPointer(targetId as any) as any)?.instanceof;
    if (!targetClass) {
        return {
            success: false,
            command: 'set',
            message: `Cannot resolve the class of '${targetName}'`,
            errors: [{ code: 'NO_METACLASS', message: `'${targetName}' has no instanceof reference` }]
        };
    }
    const conforms = typeof targetClass.isExtending === 'function'
        ? targetClass.isExtending(refType)
        : targetClass.id === refType.id;
    if (conforms) return null;
    const holds = `${(metaclass as any).name}.${property} holds ${refType.name ?? '?'} and its subclasses`;
    return {
        success: false,
        command: 'set',
        message: `'${targetName}' is a ${targetClass.name ?? '?'}: ${holds}`,
        errors: [{ code: 'TYPE_MISMATCH', message: `'${targetName}' is a ${targetClass.name ?? '?'}, and ${holds}` }]
    };
}

// ============================================
// CONTAINER OF A NEW INSTANCE (R-JS-9)
// ============================================

/**
 * The slot an instance is born in, for `create instance of <Class> … in <Parent>.<ref>`, or the
 * failure that refuses the line. Every check runs before anything is written:
 *
 *  - the parent resolves (handle of this run, else by name, model-wide): `INSTANCE_NOT_FOUND`,
 *    deferrable, when a later line may create it; `AMBIGUOUS_INSTANCE` when two hold the name;
 *  - its metaclass and its slot are in the store: `CONTAINER_NOT_READY`, deferrable, for a parent
 *    created by an earlier line whose slots land about 300 ms after it (report §4.5);
 *  - `<ref>` is a reference of the parent's class, its superclasses included (`UNKNOWN_PROPERTY`),
 *    a containment (`NOT_A_CONTAINMENT`), whose type the new class conforms to (`TYPE_MISMATCH`);
 *  - the slot has room: committed values plus the children this run created into it
 *    (`MULTIPLICITY_EXCEEDED`).
 *
 * The father of the new instance is the slot, a `DValue`, as `LValue.addObject` makes it
 * (`LModelElement.tsx:7277`), never the parent object and never the model.
 */
function resolveContainerSlot(
    parentName: QualifiedName,
    metaclass: LClass,
    className: string,
    model: LModel
): { slot: any; label: string } | { failure: ExecutionResult } {
    const fail = (code: string, message: string, detail: string): { failure: ExecutionResult } => ({
        failure: { success: false, command: 'create', message, errors: [{ code, message: detail }] },
    });
    const refName = parentName.member;
    const handle = parentName.segments.join('::');
    const label = `${handle}.${refName ?? ''}`;
    if (!refName || !handle) {
        return fail('CONTAINER_REF_REQUIRED', `Name the container as <Parent>.<reference>, got '${parentName.raw}'`,
            "Syntax: create instance of <ClassName> \"<instanceName>\" in <Parent>.<reference>");
    }

    const resolved = resolveInstanceHandle(model, handle);
    if (!resolved.ok && resolved.candidates) {
        return fail('AMBIGUOUS_INSTANCE', `Cannot create inside '${handle}': the name is ambiguous`, resolved.reason!);
    }
    const parent = resolved.value;
    if (!parent) {
        return fail('INSTANCE_NOT_FOUND', `Container instance '${handle}' not found in active model`,
            `No instance named '${handle}' in '${(model as any)?.name ?? 'the model'}'`);
    }

    const parentClass: any = parent.instanceof;
    if (!parentClass) {
        return fail('CONTAINER_NOT_READY', `Container '${handle}' is not ready yet`,
            `'${handle}' was just created: its class and its slots are not in the model yet`);
    }

    const refs: any[] = parentClass.allReferences ?? parentClass.references ?? [];
    const ref = refs.find((r: any) => r?.name === refName);
    if (!ref) {
        return fail('UNKNOWN_PROPERTY', `'${refName}' is not a reference of class '${parentClass.name}'`,
            `'${parentClass.name}' has no reference named '${refName}' to contain '${className}'`);
    }
    if (!ref.containment) {
        return fail('NOT_A_CONTAINMENT', `'${parentClass.name}.${refName}' is not a containment reference`,
            `An instance is created inside a containment (composition) reference only`);
    }
    const slotType: any = ref.type;
    const conforms = slotType && (typeof (metaclass as any).isExtending === 'function'
        ? (metaclass as any).isExtending(slotType)
        : (metaclass as any).id === slotType.id);
    if (!conforms) {
        return fail('TYPE_MISMATCH', `'${className}' does not conform to '${slotType?.name ?? '?'}', the type of ${parentClass.name}.${refName}`,
            `${parentClass.name}.${refName} contains instances of '${slotType?.name ?? '?'}' and its subclasses`);
    }

    let slot: any;
    try { slot = parent['$' + refName]; } catch { slot = undefined; }
    if (!slot?.id) {
        return fail('CONTAINER_NOT_READY', `Container '${label}' is not ready yet`,
            `The slot '${refName}' of '${handle}' is not in the model yet`);
    }

    const upper = ref.upperBound;
    if (typeof upper === 'number' && upper >= 0) {
        const committed: any[] = (slot.__raw?.values ?? []).filter((v: any) => v != null && v !== '');
        const pending = getPendingChildren(slot.id).filter(id => !committed.includes(id));
        if (committed.length + pending.length >= upper) {
            return fail('MULTIPLICITY_EXCEEDED', `'${label}' is full (at most ${upper})`,
                `${parentClass.name}.${refName} holds at most ${upper} instance${upper === 1 ? '' : 's'}`);
        }
    }

    return { slot, label };
}

// ============================================
// CREATE INSTANCE
// ============================================

export async function executeCreateInstance(
    args: CreateArgs,
    context: ExecutionContext,
    project: LProject
): Promise<ExecutionResult> {
    if (context.level !== 'M1') {
        return {
            success: false,
            command: 'create',
            message: 'create instance requires an M1 model editor',
            errors: [{
                code: 'WRONG_LEVEL',
                message: 'This command creates instances. Open a model editor (M1) to use it.'
            }]
        };
    }

    const className = args.name;  // grammar: create instance <ClassName> ["<name>"]
    const explicitInstanceName =
        args.options?.defaultValue?.kind === 'string'
            ? args.options.defaultValue.value
            : undefined;

    const metamodel = resolveMetamodel(context, project);
    if (!metamodel) {
        return {
            success: false,
            command: 'create',
            message: 'No metamodel of conformity in context',
            errors: [{ code: 'NO_METAMODEL', message: 'Cannot resolve metamodel for the active M1 model' }]
        };
    }

    const metaclass = findMetaclassByName(metamodel, className);
    if (!metaclass) {
        return {
            success: false,
            command: 'create',
            message: `Class '${className}' not found in metamodel`,
            errors: [{
                code: 'CLASS_NOT_FOUND',
                message: `Metaclass '${className}' does not exist in metamodel '${metamodel.name}'`
            }]
        };
    }

    if ((metaclass as any).abstract) {
        return {
            success: false,
            command: 'create',
            message: `Cannot instantiate abstract class '${className}'`,
            errors: [{
                code: 'ABSTRACT_CLASS',
                message: `'${className}' is abstract — pick a concrete subclass`
            }]
        };
    }

    // Singleton pre-check (R-SGL-1): a singleton class is not instantiable by any user
    // route. Unlike the classic addObject path, DObject.new below has no D-layer guard,
    // so without this the command would succeed. Reads the SAME flag as the delete
    // pre-check below — no divergent logic.
    if ((metaclass as any).isSingleton) {
        return {
            success: false,
            command: 'create',
            message: `Cannot instantiate singleton class '${className}'`,
            errors: [{
                code: 'SINGLETON_CLASS',
                message: `'${className}' is a singleton — its instance already exists, one per model. Remove the singleton flag in the metamodel first.`
            }]
        };
    }

    const targetModel = resolveTargetModel(context, project);
    if (!targetModel) {
        return {
            success: false,
            command: 'create',
            message: 'No active M1 model',
            errors: [{ code: 'NO_MODEL', message: 'Cannot create instance — no active M1 model' }]
        };
    }

    // R-JS-9: `in <Parent>.<ref>` — born inside its container, or refused before any write.
    let container: { slot: any; label: string } | undefined;
    if (args.parent) {
        const c = resolveContainerSlot(args.parent, metaclass, className, targetModel);
        if ('failure' in c) return c.failure;
        container = c;
    }

    const instanceName = explicitInstanceName ?? generateInstanceName(className, targetModel, getReservedHandles());

    // An explicit handle can only be claimed once per script run. Auto-generated names
    // are chosen free of the reserved set above, so this only triggers on a genuine
    // duplicate explicit handle.
    if (hasHandle(instanceName)) {
        return {
            success: false,
            command: 'create',
            message: `Handle '${instanceName}' already used in this script`,
            errors: [{
                code: 'HANDLE_IN_USE',
                message: `The instance handle '${instanceName}' is already bound in this run. Use a different handle; the 'name' attribute can still be set to any (even duplicate) value afterwards.`
            }]
        };
    }

    try {
        // DObject.new(instanceof, father, fatherType, name, persist)
        // Pattern source: canvasToJjom.ts:1097 — do NOT wrap in outer TRANSACTION.
        // The father is the model, or the container's slot (a DValue) for `in <Parent>.<ref>`.
        const dObject = (DObject as any).new(
            metaclass.id,
            container ? container.slot.id : targetModel.id,
            container ? DValue : DModel,
            instanceName,
            true
        );

        // Apply the explicit instance name to initialName as well. DObject.new always
        // stamps initialName with the auto default (<Class>_<N>), and the M1 identity-slot
        // value getter (LModelElement.tsx ~7280) surfaces initialName BEFORE data.name for an
        // empty name:EString slot — so without this the quoted name is shadowed (displayed as
        // <Class>_<N> and not addressable by findInstanceByName). Direct assignment mirrors
        // DObject.new's own `ret.initialName = ...` write (no TRANSACTION — see §3.3).
        // See docs/discovery/2026-06-12_create_instance_name_regression.md.
        if (explicitInstanceName && dObject) {
            (dObject as any).initialName = explicitInstanceName;
        }

        if (!dObject?.id) {
            return {
                success: false,
                command: 'create',
                message: `Failed to create instance '${instanceName}'`,
                errors: [{ code: 'CREATE_INSTANCE_ERROR', message: 'DObject.new returned null' }]
            };
        }

        // Bind the creation handle to the stable DObject id for the rest of the run.
        registerHandle(instanceName, dObject.id);
        if (container) registerPendingChild(container.slot.id, dObject.id);

        return {
            success: true,
            command: 'create',
            message: `Created instance '${instanceName}' of ${className}` + (container ? ` in ${container.label}` : ''),
            data: {
                id: dObject.id,
                name: instanceName,
                type: 'instance',
                className: className,
                ...(container ? { container: container.label } : {})
            },
            affectedElements: [dObject.id],
            undoable: true
        };
    } catch (error) {
        return {
            success: false,
            command: 'create',
            message: `Failed to create instance: ${(error as Error).message}`,
            errors: [{ code: 'CREATE_INSTANCE_ERROR', message: (error as Error).message }]
        };
    }
}

// ============================================
// DELETE INSTANCE
// ============================================

export async function executeDeleteInstance(
    args: DeleteArgs,
    context: ExecutionContext,
    project: LProject
): Promise<ExecutionResult> {
    if (context.level !== 'M1') {
        return {
            success: false,
            command: 'delete',
            message: 'delete instance requires an M1 model editor',
            errors: [{ code: 'WRONG_LEVEL', message: 'Open a model editor (M1) to delete instances' }]
        };
    }

    const targetModel = resolveTargetModel(context, project);
    if (!targetModel) {
        return {
            success: false,
            command: 'delete',
            message: 'No active M1 model',
            errors: [{ code: 'NO_MODEL', message: 'Cannot delete instance — no active M1 model' }]
        };
    }

    const instanceName = args.target.segments.join('::') || args.target.raw; // instance name from segments; raw may carry a dotted '.property' member (P0b)
    const resolved = resolveInstanceHandle(targetModel, instanceName);
    // Ambiguous → REFUSE. Deleting is destructive and irreversible in one gesture: hitting
    // the first of several homonyms is the defect the census names, not a behaviour to keep.
    if (!resolved.ok && resolved.candidates) {
        return {
            success: false,
            command: 'delete',
            message: `Cannot delete '${instanceName}': the name is ambiguous`,
            errors: [{ code: 'AMBIGUOUS_INSTANCE', message: resolved.reason! }]
        };
    }
    const lObject = resolved.value;
    if (!lObject) {
        return {
            success: false,
            command: 'delete',
            message: `Instance '${instanceName}' not found in active model`,
            errors: [{
                code: 'INSTANCE_NOT_FOUND',
                message: `No instance named '${instanceName}' in '${targetModel.name}'`
            }]
        };
    }

    // Singleton pre-check: the canonical cascade refuses singleton instances
    // silently (LObject.get_delete → Log.ww), which would make the success
    // result below lie. Reads the SAME flag as the canonical guard
    // (isSingleton via instanceof) — no divergent logic.
    const metaClass: any = (lObject as any).instanceof;
    if (metaClass?.isSingleton) {
        return {
            success: false,
            command: 'delete',
            message: `Cannot delete: ${metaClass?.name ?? 'the metaclass'} is a singleton`,
            errors: [{
                code: 'SINGLETON_INSTANCE',
                message: `Instance '${instanceName}' is the singleton of '${metaClass?.name ?? 'its class'}'. Remove the singleton flag in the metamodel first.`
            }]
        };
    }

    try {
        // #171: the canonical cascade (Dummy.get_delete) cleans the incoming reference
        // slots, the instance's own DValue slots, model.objects and its graph vertices,
        // but it stops at the slots: an element a containment slot holds survived with a
        // `father` that no longer resolved (measured, discovery_2026-10-04_157_closing_defects.md
        // D3b). So the delete goes through the Configurator's and the Data Manager's plan
        // (deleteAdapter, 12d): `descendantsOf` lists the contained elements and each one
        // gets its own .delete(), deepest first, the container last. Verdict dirty (no
        // options): nothing is written first, each .delete() removes the incoming pointers
        // by value as the single call did, and the deletes run now, before the result.
        // Every .delete() opens its own TRANSACTION, so no outer wrapper (rule 12).
        //
        // The plan reads the store: queued writes land first (a container created or linked
        // earlier in the same run is not there yet). The adapters are loaded here, as
        // `action.ts` is in `settlePendingWrites`, so this file's module graph does not take
        // on the editor-v2 adapter chain (it reaches `sync/canvasToJjom`).
        await settlePendingWrites();
        const { applyDelete, deletePlan, preflightFor } = await import('../../../components/editor-v2/hooks/deleteAdapter');
        const { makeShapeCtx } = await import('../../../components/editor-v2/hooks/shapeAdapter');
        const plan = deletePlan(preflightFor(targetModel.id, makeShapeCtx(targetModel.id).shape(), lObject.id), {});
        if (applyDelete(plan) === 0) {
            // A blocked plan, or an instance no longer in the store: nothing was deleted,
            // and a success here would lie.
            const reason = plan.blocked ?? `Instance '${instanceName}' is no longer in the model`;
            return {
                success: false,
                command: 'delete',
                message: `Failed to delete instance: ${reason}`,
                errors: [{ code: 'DELETE_INSTANCE_ERROR', message: reason }]
            };
        }
        // Free the handle so it can be reused later in the same run, and the place every
        // deleted element held in the slot it was created into (R-JS-9).
        unregisterHandle(instanceName);
        for (const id of plan.deletes) forgetPendingChild(id);
        const contained = plan.deletes.length - 1;
        return {
            success: true,
            command: 'delete',
            message: contained > 0
                ? `Deleted instance '${instanceName}' and ${contained} contained element${contained === 1 ? '' : 's'}`
                : `Deleted instance '${instanceName}'`,
            data: { id: lObject.id, name: instanceName, type: 'instance' },
            affectedElements: plan.deletes,
            undoable: true
        };
    } catch (error) {
        return {
            success: false,
            command: 'delete',
            message: `Failed to delete instance: ${(error as Error).message}`,
            errors: [{ code: 'DELETE_INSTANCE_ERROR', message: (error as Error).message }]
        };
    }
}

// ============================================
// RENAME INSTANCE
// ============================================

export async function executeRenameInstance(
    args: RenameArgs,
    context: ExecutionContext,
    project: LProject
): Promise<ExecutionResult> {
    if (context.level !== 'M1') {
        return {
            success: false,
            command: 'rename',
            message: 'rename instance requires an M1 model editor',
            errors: [{ code: 'WRONG_LEVEL', message: 'Open a model editor (M1) to rename instances' }]
        };
    }

    // #175: `rename x to "…"` takes any name `create` takes, but not an empty one.
    if (!args.newName.trim()) {
        return {
            success: false,
            command: 'rename',
            message: 'An instance name cannot be empty',
            errors: [{ code: 'INVALID_NAME', message: 'Give the instance a name: rename <instance> to "<name>"' }]
        };
    }

    const targetModel = resolveTargetModel(context, project);
    if (!targetModel) {
        return {
            success: false,
            command: 'rename',
            message: 'No active M1 model',
            errors: [{ code: 'NO_MODEL', message: 'Cannot rename instance — no active M1 model' }]
        };
    }

    const instanceName = args.target.segments.join('::') || args.target.raw; // instance name from segments; raw may carry a dotted '.property' member (P0b)
    const resolved = resolveInstanceHandle(targetModel, instanceName);
    // Ambiguous → REFUSE: renaming the wrong homonym is as silent as deleting it.
    if (!resolved.ok && resolved.candidates) {
        return {
            success: false,
            command: 'rename',
            message: `Cannot rename '${instanceName}': the name is ambiguous`,
            errors: [{ code: 'AMBIGUOUS_INSTANCE', message: resolved.reason! }]
        };
    }
    const lObject = resolved.value;
    if (!lObject) {
        return {
            success: false,
            command: 'rename',
            message: `Instance '${instanceName}' not found in active model`,
            errors: [{
                code: 'INSTANCE_NOT_FOUND',
                message: `No instance named '${instanceName}' in '${targetModel.name}'`
            }]
        };
    }

    // Name conflict check. The lookup returns the list now, so «already taken» is «at
    // least one OTHER instance holds it» — same verdict as before for one holder, and no
    // longer blind to the second.
    const conflicts = findInstanceByName(targetModel, args.newName)
        .filter((o: any) => o?.id !== lObject.id);
    if (conflicts.length > 0) {
        return {
            success: false,
            command: 'rename',
            message: `An instance named '${args.newName}' already exists`,
            errors: [{ code: 'NAME_CONFLICT', message: `Pick a different name` }]
        };
    }

    return new Promise((resolve) => {
        try {
            TRANSACTION('JjScript: Rename instance', () => {
                SetFieldAction.new(lObject, 'name', args.newName);
                // Mirror the create fix: keep initialName in sync so the identity-slot
                // fallback (initialName || data.name) does not shadow the new name when the
                // name:EString slot is empty. SetFieldAction (not the set_name proxy setter)
                // writes data.name only, so initialName must be updated explicitly.
                // See docs/discovery/2026-06-12_create_instance_name_regression.md.
                SetFieldAction.new(lObject, 'initialName', args.newName);
                // Move the script handle to the new name, keeping the same id. No-op if
                // the target was resolved via the pre-existing fallback (not a handle).
                renameHandle(instanceName, args.newName);
                resolve({
                    success: true,
                    command: 'rename',
                    message: `Renamed instance '${instanceName}' to '${args.newName}'`,
                    data: { id: lObject.id, oldName: instanceName, newName: args.newName, type: 'instance' },
                    affectedElements: [lObject.id],
                    undoable: true
                });
            });
        } catch (error) {
            resolve({
                success: false,
                command: 'rename',
                message: `Failed to rename instance: ${(error as Error).message}`,
                errors: [{ code: 'RENAME_INSTANCE_ERROR', message: (error as Error).message }]
            });
        }
    });
}

// ============================================
// SET INSTANCE PROPERTY (attribute or reference link)
// ============================================

export async function executeSetInstance(
    args: SetArgs,
    context: ExecutionContext,
    project: LProject
): Promise<ExecutionResult> {
    if (context.level !== 'M1') {
        return {
            success: false,
            command: 'set',
            message: 'set on instance requires an M1 model editor',
            errors: [{ code: 'WRONG_LEVEL', message: 'Open a model editor (M1) to set instance values' }]
        };
    }

    const targetModel = resolveTargetModel(context, project);
    if (!targetModel) {
        return {
            success: false,
            command: 'set',
            message: 'No active M1 model',
            errors: [{ code: 'NO_MODEL', message: 'Cannot set property — no active M1 model' }]
        };
    }

    const instanceName = args.target.segments.join('::') || args.target.raw; // instance name from segments; raw may carry a dotted '.property' member (P0b)
    const resolved = resolveInstanceHandle(targetModel, instanceName);
    // Ambiguous → REFUSE before any write: `set` mutates, and writing into the first of
    // several homonyms is a write to an instance the script never named.
    if (!resolved.ok && resolved.candidates) {
        return {
            success: false,
            command: 'set',
            message: `Cannot set on '${instanceName}': the name is ambiguous`,
            errors: [{ code: 'AMBIGUOUS_INSTANCE', message: resolved.reason! }]
        };
    }
    const lObject = resolved.value;
    if (!lObject) {
        return {
            success: false,
            command: 'set',
            message: `Instance '${instanceName}' not found`,
            errors: [{
                code: 'INSTANCE_NOT_FOUND',
                message: `No instance named '${instanceName}' in '${targetModel.name}'`
            }]
        };
    }

    // Classify the property: attribute or reference?
    const metaclass = (lObject as any).instanceof as LClass | undefined;
    if (!metaclass) {
        return {
            success: false,
            command: 'set',
            message: `Cannot resolve metaclass for instance '${instanceName}'`,
            errors: [{ code: 'NO_METACLASS', message: 'Instance has no instanceof reference' }]
        };
    }

    const kind = classifyMetaclassProperty(metaclass, args.property);
    if (kind === 'unknown') {
        return {
            success: false,
            command: 'set',
            message: `Property '${args.property}' is not a feature of class '${(metaclass as any).name}'`,
            errors: [{
                code: 'UNKNOWN_PROPERTY',
                message: `'${args.property}' is neither an attribute nor a reference of '${(metaclass as any).name}'`
            }]
        };
    }

    const operator = args.operator ?? '=';

    // Attribute branch — write a primitive, or, on a vector attribute, act on its elements (#211)
    if (kind === 'attribute') {
        const metaclassAttrs: any[] = (metaclass as any).allAttributes ?? (metaclass as any).attributes ?? [];
        const attrMeta = metaclassAttrs.find((a: any) => a?.name === args.property);
        const many = isManyValued(attrMeta?.upperBound);
        const label = `${instanceName}.${args.property}`;

        // #175 / R-JS-13, amended by #211: `+=` and `-=` act on a vector; a single-valued
        // attribute holds none, so the refusal stands there.
        if (operator !== '=' && !many) {
            return {
                success: false,
                command: 'set',
                message: `'${operator}' is not available on the attribute '${args.property}'`,
                errors: [{
                    code: 'OPERATOR_NOT_SUPPORTED',
                    message: `Write the new value: set ${instanceName}.${args.property} = <value>`
                }]
            };
        }
        if (!isLiteralValue(args.value)) {
            return {
                success: false,
                command: 'set',
                message: `Attribute '${args.property}' expects a literal value`,
                errors: [{
                    code: 'TYPE_MISMATCH',
                    message: `Cannot assign a name '${qualifiedNameToString(args.value as QualifiedName)}' to an attribute`
                }]
            };
        }
        const lit = args.value as LiteralValue;

        // #211: `= [a, b]` replaces the whole vector, order as written; `= []` clears it.
        if (lit.kind === 'array') {
            if (operator !== '=') {
                return {
                    success: false,
                    command: 'set',
                    message: `'${operator}' takes a single element of ${label}, not a list`,
                    errors: [{
                        code: 'TYPE_MISMATCH',
                        message: `Write one element: set ${label} ${operator} <value>`
                    }]
                };
            }
            if (!many) {
                return {
                    success: false,
                    command: 'set',
                    message: `'${label}' holds at most one value`,
                    errors: [{
                        code: 'MULTIPLICITY_EXCEEDED',
                        message: `${label} is single-valued and the list holds ${lit.values.length} element${lit.values.length === 1 ? '' : 's'}`,
                        suggestion: `Write one value: set ${label} = <value>`
                    }]
                };
            }
            // Every refusal is decided before any write. A slot holds primitives: a name names
            // nothing it can hold, `null` names nothing, and an enum literal is a pointer.
            for (const v of lit.values) {
                if (!isLiteralValue(v) || (v as LiteralValue).kind === 'null' || (v as LiteralValue).kind === 'enumLiteral') {
                    const shown = isLiteralValue(v) ? literalValueToString(v as LiteralValue) : qualifiedNameToString(v as QualifiedName);
                    return {
                        success: false,
                        command: 'set',
                        message: `'${shown}' is not a value ${label} can hold`,
                        errors: [{
                            code: 'TYPE_MISMATCH',
                            message: `${label} holds primitives; to clear it: set ${label} = null`
                        }]
                    };
                }
            }
            const vector = lit.values.map((v) => literalToPrimitive(v as LiteralValue));
            return writeVector(lObject, args.property, vector,
                `Set ${label} = ${literalValueToString(lit)}`,
                { id: lObject.id, instance: instanceName, property: args.property, newValue: vector, kind: 'attribute' });
        }

        // #211: `= null` on a vector clears it, as on a reference; single-valued keeps the
        // committed single write below.
        if (lit.kind === 'null' && many && operator === '=') {
            return writeVector(lObject, args.property, [],
                `Cleared ${label}`,
                { id: lObject.id, instance: instanceName, property: args.property, cleared: true, kind: 'attribute' });
        }

        // #211: `+=` / `-=` on the vector (a single-valued attribute was refused above).
        if (operator === '+=' || operator === '-=') {
            if (lit.kind === 'null') {
                return {
                    success: false,
                    command: 'set',
                    message: `'${operator}' needs a value`,
                    errors: [{
                        code: 'TYPE_MISMATCH',
                        message: operator === '+='
                            ? `Add an element: set ${label} += <value>`
                            : `Take an element out: set ${label} -= <value>`
                    }]
                };
            }
            if (lit.kind === 'enumLiteral') {
                return {
                    success: false,
                    command: 'set',
                    message: `'${label}' holds primitives, not enum literals`,
                    errors: [{
                        code: 'TYPE_MISMATCH',
                        message: `${label} holds primitives; '${lit.literal}' is an enum literal`
                    }]
                };
            }
            const primitive = literalToPrimitive(lit);
            // Read the slot only after the queued writes have landed, as the reference branch does.
            await settlePendingWrites();
            const slot = (lObject as any)['$' + args.property];
            if (!slot?.id) {
                return {
                    success: false,
                    command: 'set',
                    message: `Feature proxy for '${args.property}' is not available on instance`,
                    errors: [{ code: 'NO_FEATURE_PROXY', message: 'Internal: $-proxy missing' }]
                };
            }
            const raw: any[] = slot.__raw?.values ?? [];
            const current = raw.filter((v: any) => v != null && v !== '');
            if (operator === '+=') {
                const bound = attrMeta?.upperBound;
                const capacity = bound === -1 || bound === '*' ? Infinity : (bound as number);
                if (current.length >= capacity) {
                    return {
                        success: false,
                        command: 'set',
                        message: `'${label}' is full (at most ${capacity})`,
                        errors: [{
                            code: 'MULTIPLICITY_EXCEEDED',
                            message: `${label} holds at most ${capacity} elements`
                        }]
                    };
                }
                // Duplicates are kept, as in the reference vectors (#175): the slot may hold the
                // element more than once, and `+=` appends rather than checks.
                const vector = [...current, primitive];
                return writeVector(lObject, args.property, vector,
                    `Added ${literalValueToString(lit)} to ${label}`,
                    { id: lObject.id, instance: instanceName, property: args.property, newValue: vector, kind: 'attribute' });
            }
            if (!current.includes(primitive)) {
                const shown = literalValueToString(lit);
                return {
                    success: false,
                    command: 'set',
                    message: `${shown} is not in ${label}`,
                    errors: [{
                        code: 'NOT_SET',
                        message: `Nothing to remove: ${label} does not hold ${shown}`
                    }]
                };
            }
            return new Promise((resolve) => {
                try {
                    TRANSACTION('JjScript: Remove from attribute', () => {
                        // By value, every copy — the reducer's own removal, the one `removeLinked`
                        // makes (R-DEL-4). A valueless `'-='` would be dropped by the reducer.
                        SetFieldAction.new(slot.id, 'values', primitive, '-=', false);
                        resolve({
                            success: true,
                            command: 'set',
                            message: `Removed ${literalValueToString(lit)} from ${label}`,
                            data: {
                                id: lObject.id,
                                instance: instanceName,
                                property: args.property,
                                removed: true,
                                kind: 'attribute'
                            },
                            affectedElements: [lObject.id],
                            undoable: true
                        });
                    });
                } catch (error) {
                    resolve({
                        success: false,
                        command: 'set',
                        message: `Failed to remove from attribute: ${(error as Error).message}`,
                        errors: [{ code: 'SET_INSTANCE_ATTR_ERROR', message: (error as Error).message }]
                    });
                }
            });
        }

        // Single literal: the committed path, single-valued and vector alike.
        const primitive = literalToPrimitive(lit);

        return new Promise((resolve) => {
            try {
                TRANSACTION('JjScript: Set instance attribute', () => {
                    const featureProxy = (lObject as any)['$' + args.property];
                    if (!featureProxy) {
                        resolve({
                            success: false,
                            command: 'set',
                            message: `Feature proxy for '${args.property}' is not available on instance`,
                            errors: [{ code: 'NO_FEATURE_PROXY', message: 'Internal: $-proxy missing' }]
                        });
                        return;
                    }
                    featureProxy.value = primitive;
                    resolve({
                        success: true,
                        command: 'set',
                        message: `Set ${instanceName}.${args.property} = ${literalValueToString(lit)}`,
                        data: {
                            id: lObject.id,
                            instance: instanceName,
                            property: args.property,
                            newValue: primitive,
                            kind: 'attribute'
                        },
                        affectedElements: [lObject.id],
                        undoable: true
                    });
                });
            } catch (error) {
                resolve({
                    success: false,
                    command: 'set',
                    message: `Failed to set attribute: ${(error as Error).message}`,
                    errors: [{ code: 'SET_INSTANCE_ATTR_ERROR', message: (error as Error).message }]
                });
            }
        });
    }

    // Reference branch (kind === 'reference') — link semantics
    // Pattern source: canvasToJjom.ts:1197-1208 (syncCreateCompositionLink)
    // Setting to null clears the reference (unlink).
    const isUnlink = isLiteralValue(args.value) && (args.value as LiteralValue).kind === 'null';

    // #175: `+= null` and `-= null` name nothing to add or take out; only `= null` empties.
    if (isUnlink && operator !== '=') {
        return {
            success: false,
            command: 'set',
            message: `'${operator}' needs an instance name`,
            errors: [{
                code: 'TYPE_MISMATCH',
                message: `To empty the reference: set ${instanceName}.${args.property} = null`
            }]
        };
    }

    if (isUnlink) {
        // Read the slot only after the queued writes have landed.
        await settlePendingWrites();
        return new Promise((resolve) => {
            try {
                TRANSACTION('JjScript: Unlink reference', () => {
                    const refProxy = (lObject as any)['$' + args.property];
                    if (refProxy) {
                        // `refProxy.values = []` reported success and left the slot as it was.
                        const plan = planUnlink(linkedIds(refProxy.__raw?.values));
                        removeLinked(refProxy, plan.remove, !!refProxy.instanceof?.containment, targetModel.id);
                    }
                    resolve({
                        success: true,
                        command: 'set',
                        message: `Cleared reference ${instanceName}.${args.property}`,
                        data: { id: lObject.id, instance: instanceName, property: args.property, kind: 'reference', cleared: true },
                        affectedElements: [lObject.id],
                        undoable: true
                    });
                });
            } catch (error) {
                resolve({
                    success: false,
                    command: 'set',
                    message: `Failed to unlink: ${(error as Error).message}`,
                    errors: [{ code: 'UNLINK_ERROR', message: (error as Error).message }]
                });
            }
        });
    }

    // Link: value must be the name of another instance
    let targetInstanceName: string;
    if (isLiteralValue(args.value)) {
        const lit = args.value as LiteralValue;
        if (lit.kind !== 'string') {
            return {
                success: false,
                command: 'set',
                message: `Reference '${args.property}' expects an instance name`,
                errors: [{
                    code: 'TYPE_MISMATCH',
                    message: `A reference target must be an instance name, got ${lit.kind}`
                }]
            };
        }
        targetInstanceName = lit.value;
    } else {
        targetInstanceName = (args.value as QualifiedName).raw;
    }

    // #213: `<Model>::<instance>` addresses an instance of another M1 model of the project.
    // The decision is pure (instanceAddress.ts); `consultRegistry` carries the registry-skip
    // rule as data: a run-local handle is an instance of the ACTIVE model, and `Other::p`
    // must never silently resolve to the run-local p. A qualifier naming the active model is
    // not cross-model — the address keeps today's path exactly, the registry included.
    const m1Models: LModel[] = (((project as any).models ?? []) as LModel[]).filter((m) => !m.isMetamodel);
    const resolution = resolveInstanceAddress(
        targetInstanceName,
        { id: targetModel.id, name: (targetModel as any).name ?? '' },
        m1Models.map((m) => ({ id: m.id, name: (m as any).name ?? '' })),
    );

    let targetInstance: any;
    // #213 follow-up: the model of a cross-model target, so the write below can record it as a
    // dependency of the caller model. Null for a local target (a model does not depend on itself).
    let crossModel: LModel | null = null;
    if (resolution.kind === 'model-absent') {
        return {
            success: false,
            command: 'set',
            message: `No model named '${resolution.qualifier}' in the project`,
            errors: [{
                code: 'MODEL_NOT_FOUND',
                message: `No model named '${resolution.qualifier}' to take the instance from`,
                suggestion: `Models in the project: ${resolution.models.map((m) => `'${m.name}'`).join(', ')}`
            }]
        };
    }
    if (resolution.kind === 'model-ambiguous') {
        return {
            success: false,
            command: 'set',
            message: `Cannot link to '${targetInstanceName}': the model name is ambiguous`,
            errors: [{
                code: 'AMBIGUOUS_MODEL',
                message: `Ambiguous model name '${resolution.qualifier}': ${resolution.matches.length} candidates — ${resolution.matches.map((m) => m.id).join(', ')}. Rename one of the models.`
            }]
        };
    }

    if (resolution.kind === 'local') {
        const resolvedTarget = resolveInstanceHandle(targetModel, resolution.name);
        // Ambiguous → REFUSE. This is the case the census calls out as the worst of the five:
        // the link would be WRITTEN, pointing at whichever homonym came first in `objects`, and
        // nothing downstream would ever report that the target was chosen rather than named.
        if (!resolvedTarget.ok && resolvedTarget.candidates) {
            return {
                success: false,
                command: 'set',
                message: `Cannot link to '${targetInstanceName}': the name is ambiguous`,
                errors: [{ code: 'AMBIGUOUS_INSTANCE', message: resolvedTarget.reason! }]
            };
        }
        targetInstance = resolvedTarget.value;
        if (!targetInstance) {
            // #213: the name is not in the active model, but one or more other models of the
            // project hold it. Bare names stay active-model-only (no fallback); the suggestion
            // points at the qualified spelling.
            const elsewhere = m1Models
                .filter((m) => m.id !== targetModel.id && findInstanceByName(m, resolution.name).length > 0)
                .map((m) => (m as any).name ?? '');
            return {
                success: false,
                command: 'set',
                message: `Target instance '${targetInstanceName}' not found in active model`,
                errors: [{
                    code: 'INSTANCE_NOT_FOUND',
                    message: `No instance named '${targetInstanceName}' to link to`,
                    ...(elsewhere.length > 0 ? { suggestion: elsewhereSuggestion(resolution.name, elsewhere) } : {})
                }]
            };
        }
    } else {
        // Cross-model: the instance the model named holds, model-wide (roots and contained),
        // through the same lookup as the local path. The run's handle registry is deliberately
        // not consulted (consultRegistry is false above).
        const otherModel = m1Models.find((m) => m.id === resolution.model.id);
        const matches = otherModel ? findInstanceByName(otherModel, resolution.instance) : [];
        if (matches.length > 1) {
            return {
                success: false,
                command: 'set',
                message: `Cannot link to '${targetInstanceName}': the name is ambiguous`,
                errors: [{ code: 'AMBIGUOUS_INSTANCE', message: describeAmbiguity(targetInstanceName, matches.map(toCandidate)) }]
            };
        }
        targetInstance = matches[0];
        if (!targetInstance) {
            return {
                success: false,
                command: 'set',
                message: `Target instance '${targetInstanceName}' not found in model '${resolution.model.name}'`,
                errors: [{
                    code: 'INSTANCE_NOT_FOUND',
                    message: `No instance named '${resolution.instance}' in model '${resolution.model.name}'`
                }]
            };
        }
        // TODO(#213): the slot is written below as the canvas writes it (refProxy.values / the
        // by-value removal); the composition policy for cross-model containment slots (father,
        // orphaning on removal) is off-topic until decided.
        if (otherModel) crossModel = otherModel;
    }

    // Read the slot only after the queued writes have landed.
    await settlePendingWrites();

    // #175: a link writes only an instance of the reference type or of a subclass. A removal is
    // not checked: taking a wrong-typed element out is how such a slot is repaired.
    if (operator !== '-=') {
        const mismatch = linkTypeMismatch(metaclass, args.property, targetInstance.id, targetInstanceName);
        if (mismatch) return mismatch;
    }
    if (operator !== '=') {
        return applyCollectionUpdate(operator, lObject, args.property, instanceName, targetInstance.id, targetInstanceName, targetModel, crossModel);
    }

    return new Promise((resolve) => {
        try {
            TRANSACTION('JjScript: Link reference', () => {
                const refProxy = (lObject as any)['$' + args.property];
                if (!refProxy) {
                    resolve({
                        success: false,
                        command: 'set',
                        message: `Reference proxy for '${args.property}' is not available`,
                        errors: [{ code: 'NO_FEATURE_PROXY', message: 'Internal: $-proxy missing' }]
                    });
                    return;
                }
                // Single-valued: the target replaces what the slot held. Multi-valued: appended.
                const meta = refProxy.instanceof;
                const plan = planLink(linkedIds(refProxy.__raw?.values), targetInstance.id, isManyValued(meta?.upperBound));
                removeLinked(refProxy, plan.remove, !!meta?.containment, targetModel.id);
                if (plan.write) refProxy.values = plan.write;
                // #213 follow-up: a link that adds a cross-model target records the target model
                // as a dependency of the caller model, if not already (same TRANSACTION: the undo
                // takes it back with the link).
                if (plan.write && crossModel) ensureModelDependency(targetModel, crossModel.id);
                resolve({
                    success: true,
                    command: 'set',
                    message: `Linked ${instanceName}.${args.property} → ${targetInstanceName}`,
                    data: {
                        id: lObject.id,
                        instance: instanceName,
                        property: args.property,
                        target: targetInstanceName,
                        kind: 'reference'
                    },
                    affectedElements: [lObject.id, targetInstance.id],
                    undoable: true
                });
            });
        } catch (error) {
            resolve({
                success: false,
                command: 'set',
                message: `Failed to link: ${(error as Error).message}`,
                errors: [{ code: 'LINK_ERROR', message: (error as Error).message }]
            });
        }
    });
}

/**
 * `+=` and `-=` on a reference (#175). Every refusal is decided on the slot as the store holds it,
 * before any write. Called after `settlePendingWrites`, and after the type check for `+=`.
 *
 *  - `+=`: appended while the slot has room (`planAdd`); a slot already holding the target as its
 *    single value is left as it is; a full slot is `MULTIPLICITY_EXCEEDED`, and a single-valued
 *    one names `=`, the operator that replaces.
 *  - `-=`: the target taken out by value (`removeLinked`, the removal `= null` makes);
 *    `NOT_LINKED` when the slot does not hold it; `WOULD_ORPHAN` for a containment child born in
 *    this slot, which the removal would leave fathered to the model and listed nowhere (#174).
 */
function applyCollectionUpdate(
    operator: '+=' | '-=',
    lObject: any,
    property: string,
    instanceName: string,
    targetId: string,
    targetName: string,
    targetModel: LModel,
    crossModel: LModel | null = null
): Promise<ExecutionResult> | ExecutionResult {
    const fail = (code: string, message: string, detail: string, suggestion?: string): ExecutionResult => ({
        success: false,
        command: 'set',
        message,
        errors: [{ code, message: detail, ...(suggestion ? { suggestion } : {}) }]
    });
    const label = `${instanceName}.${property}`;
    const refProxy = lObject['$' + property];
    if (!refProxy) {
        return fail('NO_FEATURE_PROXY', `Reference proxy for '${property}' is not available`, 'Internal: $-proxy missing');
    }
    const meta = refProxy.instanceof;
    const containment = !!meta?.containment;
    const current = linkedIds(refProxy.__raw?.values);

    let remove: string[] = [];
    let write: string[] | undefined;
    if (operator === '+=') {
        const plan = planAdd(current, targetId, meta?.upperBound);
        if ('full' in plan) {
            return plan.full === 1
                ? fail('MULTIPLICITY_EXCEEDED', `'${label}' already holds an element`,
                    `${label} holds one element, and '+=' adds without replacing`,
                    `To replace it: set ${label} = ${targetName}`)
                : fail('MULTIPLICITY_EXCEEDED', `'${label}' is full (at most ${plan.full})`,
                    `${label} holds at most ${plan.full} elements`);
        }
        if ('write' in plan) write = plan.write;
    } else {
        const plan = planRemove(current, targetId);
        if ('absent' in plan) {
            return fail('NOT_LINKED', `'${targetName}' is not in ${label}`, `Nothing to remove: ${label} does not hold '${targetName}'`);
        }
        const father = (LPointerTargetable.fromPointer(targetId as any) as any)?.__raw?.father;
        if (containment && father === refProxy.id && !isListedAtRoot(targetModel, targetId)) {
            return fail('WOULD_ORPHAN', `Cannot remove '${targetName}' from ${label}: it would be left outside the model`,
                `'${targetName}' was created inside ${label} and has no other place in the model`,
                `To take it away, delete it: delete instance ${targetName}`);
        }
        remove = plan.remove;
    }

    if (!write && remove.length === 0) {
        // `+=` of the single value the slot already holds: nothing to write, no undo entry.
        return {
            success: true,
            command: 'set',
            message: `${label} already holds ${targetName}`,
            data: { id: lObject.id, instance: instanceName, property, target: targetName, kind: 'reference' },
            affectedElements: [],
            undoable: false
        };
    }

    return new Promise((resolve) => {
        try {
            TRANSACTION(operator === '+=' ? 'JjScript: Add to reference' : 'JjScript: Remove from reference', () => {
                removeLinked(refProxy, remove, containment, targetModel.id);
                if (write) refProxy.values = write;
                // #213 follow-up: an append that adds a cross-model target records the target
                // model as a dependency of the caller model, if not already. A removal (`-=`)
                // adds nothing: taking a link out is not an addition.
                if (operator === '+=' && write && crossModel) ensureModelDependency(targetModel, crossModel.id);
                resolve({
                    success: true,
                    command: 'set',
                    message: operator === '+=' ? `Linked ${label} → ${targetName}` : `Removed ${targetName} from ${label}`,
                    data: {
                        id: lObject.id,
                        instance: instanceName,
                        property,
                        target: targetName,
                        kind: 'reference',
                        ...(operator === '-=' ? { removed: true } : {})
                    },
                    affectedElements: [lObject.id, targetId],
                    undoable: true
                });
            });
        } catch (error) {
            resolve(fail(operator === '+=' ? 'LINK_ERROR' : 'UNLINK_ERROR',
                `Failed to ${operator === '+=' ? 'link' : 'unlink'}: ${(error as Error).message}`, (error as Error).message));
        }
    });
}

// ============================================
// REMOVE FROM A REFERENCE (#175)
// ============================================

/**
 * `remove <Instance> from <Owner>.<reference>` at M1: the instance taken out of the slot, exactly
 * as `set <Owner>.<reference> -= <Instance>`. Without the reference there is no slot to take it
 * out of: `REFERENCE_REQUIRED`, before anything is resolved.
 */
export async function executeRemoveInstance(
    args: RemoveArgs,
    context: ExecutionContext,
    project: LProject
): Promise<ExecutionResult> {
    const property = args.from.member;
    if (!property) {
        return {
            success: false,
            command: 'remove',
            message: `Name the reference: remove ${args.target.raw} from ${args.from.raw}.<reference>`,
            errors: [{
                code: 'REFERENCE_REQUIRED',
                message: 'At M1, remove takes an instance out of a reference: remove <instance> from <Instance>.<reference>'
            }]
        };
    }
    const owner = args.from.segments.join('::');
    const result = await executeSetInstance(
        { command: 'set', target: { segments: args.from.segments, raw: owner }, property, value: args.target, operator: '-=' },
        context,
        project
    );
    return { ...result, command: 'remove' };
}

// ============================================
// LITERAL TYPE GUARD
// ============================================

function isLiteralValue(value: any): value is LiteralValue {
    return value && typeof value === 'object' && 'kind' in value &&
        ['string', 'number', 'boolean', 'null', 'array', 'enumLiteral'].includes(value.kind);
}
