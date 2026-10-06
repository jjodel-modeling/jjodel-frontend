/**
 * JjScript M1 Instance Command Handlers
 *
 * Handles operations on DObject instances inside an M1 model:
 *   create instance <ClassName> ["<instanceName>"]
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
 */

import {
    CreateArgs,
    DeleteArgs,
    RenameArgs,
    SetArgs,
    ExecutionResult,
    ExecutionContext,
    LiteralValue,
    QualifiedName,
} from '../../types';
import { qualifiedNameToString, literalValueToString } from '../../parser/grammar';

import {
    DObject,
    DModel,
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
} from '../handleRegistry';
import { isManyValued, linkedIds, planLink, planUnlink } from '../referenceWrite';

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
 * Returns the LIST, never one of them (R-S1-5). A name is not a key: `model.objects`
 * can legitimately hold several instances that share one, and the `.find` this used to
 * be answered "the first" to a question that has no single answer. Whoever needs ONE
 * goes through `resolveInstanceHandle`, which turns the list into a verdict.
 *
 * `model.objects` is `data.objects` (`LModelElement.tsx:5561`), i.e. the ROOTS of one
 * model — not the nested instances, and not other models. That scope is unchanged by
 * this slice; only the arity of the answer is.
 */
export function findInstanceByName(model: LModel, instanceName: string): any[] {
    const objects = (model as any).objects ?? [];
    return objects.filter((o: any) => o?.name === instanceName);
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
    const objects = (model as any).objects ?? [];
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
        const dObject = (DObject as any).new(
            metaclass.id,
            targetModel.id,
            DModel,
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

        return {
            success: true,
            command: 'create',
            message: `Created instance '${instanceName}' of ${className}`,
            data: {
                id: dObject.id,
                name: instanceName,
                type: 'instance',
                className: className
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
        // Free the handle so it can be reused later in the same run.
        unregisterHandle(instanceName);
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

    // Attribute branch — write a primitive
    if (kind === 'attribute') {
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
        const primitive = literalToPrimitive(args.value as LiteralValue);

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
                        message: `Set ${instanceName}.${args.property} = ${literalValueToString(args.value as LiteralValue)}`,
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

    const resolvedTarget = resolveInstanceHandle(targetModel, targetInstanceName);
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
    const targetInstance = resolvedTarget.value;
    if (!targetInstance) {
        return {
            success: false,
            command: 'set',
            message: `Target instance '${targetInstanceName}' not found in active model`,
            errors: [{
                code: 'INSTANCE_NOT_FOUND',
                message: `No instance named '${targetInstanceName}' to link to`
            }]
        };
    }

    // Read the slot only after the queued writes have landed.
    await settlePendingWrites();

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

// ============================================
// LITERAL TYPE GUARD
// ============================================

function isLiteralValue(value: any): value is LiteralValue {
    return value && typeof value === 'object' && 'kind' in value &&
        ['string', 'number', 'boolean', 'null', 'array', 'enumLiteral'].includes(value.kind);
}
