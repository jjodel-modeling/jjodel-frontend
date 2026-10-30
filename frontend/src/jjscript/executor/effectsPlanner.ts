/**
 * JjScript effects planner — what an M1 script would do, read without running it (S4a, R-JJD-2)
 *
 * The dry run of a script is this plan, not a live run with rollback and not a sandboxed
 * transaction: it never writes to the store, never dispatches, never opens a TRANSACTION. It
 * reads a `PlanWorld` (plain data, built by the caller from the model's lookups) and returns
 *
 *  - `created`: the instances the script creates, with metaclass, name and container path;
 *  - `features`: the attribute values it sets;
 *  - `references`: the reference writes (`=`, `+=`, `-=`, `= null`, `remove … from`), with targets
 *    created earlier, or later, in the same script;
 *  - `renamed`, `deleted`;
 *  - `warnings`: unknown metaclass (`CLASS_NOT_FOUND`), unknown feature (`UNKNOWN_PROPERTY`),
 *    unresolvable target (`INSTANCE_NOT_FOUND`), one end written of an opposite pair
 *    (`OPPOSITE_ONE_END`, A3: the executor does not mirror opposites), and one
 *    `unsupported: <command>` per command outside the M1 subset;
 *  - `errors` and `error` (the first by line): every other refusal the executor makes, with the
 *    executor's code, and a line that does not parse (`PARSE_ERROR`).
 *
 * A line that is refused, or warned about for one of the first three warnings, plans no effect:
 * the executor writes nothing before such a failure (`runPasses.ts:11-14`).
 *
 * Parity with the executor. `commands/instance.ts` cannot be imported here (it reaches monaco
 * through `joiner`), so each rule below quotes the executor lines it mirrors. What is reused,
 * not mirrored: the pass loop and its deferral rule (`runPasses`, `isDeferrable`, R-JS-3/8), the
 * line filter of `ScriptBlock.tsx:283-288`, and the slot plans of `referenceWrite.ts`.
 *
 * Multi-valued attribute `=` (re-checked for S4a, read, not executed): the executor writes
 * `featureProxy.value = primitive` (`instance.ts:1014`); `LValue.set_value`
 * (`LModelElement.tsx:8114-8121`) writes at the index of the first value
 * (`get_value` = `get_values(…, 1)[0]`, `:7557-7560`), so `=` replaces the first value and keeps
 * the others. Such an effect carries `many: true`.
 *
 * M2 (P-2026-10-24-1520): `create` of every metamodel element type, `add`, `set`, `rename`,
 * `delete`, `extends` and `abstract` are planned against `PlanWorld.m2` (section «M2» below), as
 * effects with `level: 'M2'` in the same lists (`created` with an `M2Kind` as metaclass,
 * `features`, `renamed`, `deleted`) and in `generalizations`. Warnings: a duplicate name in its
 * namespace (`DUPLICATE_NAME`), a type, superclass, container or element found neither in the
 * metamodel nor among what the script creates (`UNKNOWN_*_TYPE`, `PARENT_NOT_FOUND`,
 * `CHILD_NOT_FOUND`, `MEMBER_NOT_FOUND`, `ELEMENT_NOT_FOUND`), a `set` on a property the element
 * does not have (`UNKNOWN_PROPERTY`), a `delete` of an attribute or reference whose slots hold
 * values in a conforming model (`FEATURE_HAS_VALUES`, one per model, from `PlanMetamodel.slotValues`;
 * the line still plans). A mixed script is planned per level (`lineLevel`).
 *
 * Declared limits: `let`, `forall`, blocks, `move`, `copy` and an M2 `remove` are `unsupported`;
 * a `delete` lists the contained elements it cascades to but not the incoming links it clears;
 * M2 names resolve inside the metamodel only (the executor's project-wide fallback is not mirrored).
 */

import { parse } from '../parser/parser';
import type { AbstractArgs, AddArgs, CommandNode, CreateArgs, DeleteArgs, ExtendsArgs, LiteralValue, QualifiedName, RemoveArgs, RenameArgs, SetArgs } from '../types';
import { isManyValued, planAdd, planLink, planRemove, planUnlink } from './referenceWrite';
import { isDeferrable, runPasses } from './runPasses';

// ── The world a plan is read against ──────────────────────────────────────────

/** A reference of a metaclass, its superclasses' included. */
export interface PlanReference {
    name: string;
    /** `LReference.containment` (composition or aggregation). */
    containment: boolean;
    /** `upperBound`: `-1` or `'*'` for unbounded. */
    upper: number | '*';
    /** Name of the type it holds. */
    type: string;
    /** Name of the opposite reference on `type`, when there is one. */
    opposite?: string;
}

export interface PlanAttribute {
    name: string;
    upper: number | '*';
}

/** A metaclass, found by name as `findMetaclassByName` finds it (`instance.ts:93-115`). */
export interface PlanClass {
    name: string;
    abstract?: boolean;
    singleton?: boolean;
    /** The class and every class it extends, by name. */
    kinds: string[];
    /** `allAttributes`, inherited included. */
    attributes: PlanAttribute[];
    /** `allReferences`, inherited included. */
    references: PlanReference[];
}

/** An instance of the target M1 model, roots and contained alike (R-JS-10). */
export interface PlanElement {
    id: string;
    name: string;
    className: string;
    /** Listed in `model.objects`. */
    root: boolean;
    /** The slot that is its father, when it is a contained instance. */
    container?: { owner: string; feature: string };
    /** Reference slots by feature: the ids they hold (`__raw.values`, holes dropped). */
    references?: Record<string, string[]>;
}

/** The metaclass of an M2 element, as the chips and the Apply check name it. */
export type M2Kind = 'Package' | 'Class' | 'Enumeration' | 'Attribute' | 'Reference' | 'Operation' | 'Literal' | 'Parameter';

/** An element of the metamodel (P-2026-10-24-1520): a package, classifier, feature, literal or parameter. */
export interface PlanM2Element {
    id: string;
    name: string;
    kind: M2Kind;
    /** The containing element (package, class, enum, operation), or the metamodel itself. */
    father: string | null;
    abstract?: boolean;
    interface?: boolean;
    /** A class: the ids of the classes it extends. */
    extends?: string[];
    /** A typed element: the id of its type (a class, an enum or a primitive). */
    type?: string | null;
    /** A reference: `composition || aggregation`. */
    containment?: boolean;
    upper?: number | '*';
}

/** The metamodel an M2 command writes into: the open metamodel, or the one an M1 model conforms to. */
export interface PlanMetamodel {
    id: string;
    name: string;
    /** Where `create class|enum|package` without `in` goes: the first package, else the metamodel (`getDefaultParent`, `utils.ts:225-279`). */
    defaultParent: string;
    elements: PlanM2Element[];
    /**
     * A metamodel world: per attribute or reference id, the conforming models whose slots of that
     * feature hold values, and how many (`FEATURE_HAS_VALUES`). Absent: no model holds any, or not read.
     */
    slotValues?: Record<string, PlanSlotValues[]>;
}

/** The values one conforming model holds in the slots of one feature. */
export interface PlanSlotValues {
    modelId: string;
    model: string;
    count: number;
}

export interface PlanWorld {
    classes: Record<string, PlanClass>;
    elements: PlanElement[];
    /** The level of the open editor; absent reads as M1. */
    level?: 'M1' | 'M2';
    /** The metamodel M2 commands plan against; absent: M2 commands plan against an empty one. */
    m2?: PlanMetamodel;
}

// ── The plan ──────────────────────────────────────────────────────────────────

export interface PlannedCreate {
    line: number;
    /** `planned:<n>`, the n-th instance this plan creates. */
    id: string;
    metaclass: string;
    name: string;
    /** `Parent.reference` for `create instance … in`, otherwise null (a root). On M2, the name of the father. */
    container: string | null;
    /** `M2`: an element of the metamodel, `metaclass` is its `M2Kind`. Absent: an M1 instance. */
    level?: 'M2';
    /** M2: the id of the father (an element of the world or `planned:<n>`). */
    containerId?: string | null;
    /** M2, a typed element: the name of its type, its id when resolved, and whether the script creates it. */
    type?: string;
    typeId?: string | null;
    typeCreated?: boolean;
    /** M2, a reference: containment. */
    containment?: boolean;
    /** M2, a class: abstract or interface. */
    abstract?: boolean;
}

export interface PlannedFeature {
    line: number;
    owner: string;
    ownerId: string;
    feature: string;
    value: string | number | boolean | null;
    /** A multi-valued attribute: `=` replaces its first value. */
    many: boolean;
    /** `M2`: a `set` (or `abstract`) on an element of the metamodel. */
    level?: 'M2';
}

/** M2: `child extends parent`, written by `create class … extends` or by `extends`. */
export interface PlannedGeneralization {
    line: number;
    child: string;
    childId: string;
    parent: string;
    parentId: string;
    parentCreated: boolean;
}

export interface PlannedReference {
    line: number;
    source: string;
    sourceId: string;
    feature: string;
    /** `clear` is `= null`; `remove x from s.f` is `-=`. */
    operator: '=' | '+=' | '-=' | 'clear';
    target: string | null;
    targetId: string | null;
    containment: boolean;
    /** The target is an instance this script creates. */
    targetCreated: boolean;
    /** Ids taken out of the slot. */
    removed: string[];
}

export interface PlannedRename { line: number; id: string; from: string; to: string; level?: 'M2' }
export interface PlannedDelete { line: number; id: string; name: string; contained: string[]; level?: 'M2' }

export interface PlanIssue { line: number; code: string; message: string }

export interface EffectsPlan {
    created: PlannedCreate[];
    features: PlannedFeature[];
    references: PlannedReference[];
    renamed: PlannedRename[];
    deleted: PlannedDelete[];
    warnings: PlanIssue[];
    errors: PlanIssue[];
    /** The first error by line, or null. */
    error: PlanIssue | null;
    /** The level of the open editor the plan was read for (`PlanWorld.level`). */
    level?: 'M1' | 'M2';
    /** M2 generalizations. */
    generalizations?: PlannedGeneralization[];
}

/** The level an effect belongs to. */
export function effectLevel(effect: { level?: 'M2' }): 'M1' | 'M2' {
    return effect.level === 'M2' ? 'M2' : 'M1';
}

/** The codes reported as warnings; every other refusal is an error. */
const WARNING_CODES = new Set([
    'CLASS_NOT_FOUND', 'UNKNOWN_PROPERTY', 'INSTANCE_NOT_FOUND', 'OPPOSITE_ONE_END', 'UNSUPPORTED',
    // M2: a duplicate name in the namespace, a type, container or element that resolves to nothing.
    'DUPLICATE_NAME', 'UNKNOWN_ATTRIBUTE_TYPE', 'UNKNOWN_REFERENCE_TYPE', 'UNKNOWN_OPERATION_TYPE',
    'UNKNOWN_PARAMETER_TYPE', 'UNKNOWN_TYPE', 'PARENT_NOT_FOUND', 'CHILD_NOT_FOUND', 'MEMBER_NOT_FOUND',
    'ELEMENT_NOT_FOUND',
]);

/** Commands that write nothing: no effect, no warning. */
const READ_ONLY_COMMANDS = new Set(['eval', 'list', 'show', 'help', 'validate', 'clear']);

// ── The simulated model ───────────────────────────────────────────────────────

interface SimElement {
    id: string;
    name: string;
    className: string;
    root: boolean;
    container?: { owner: string; feature: string };
    references: Record<string, string[]>;
    created: boolean;
    deleted: boolean;
}

type Effect =
    | { kind: 'create'; value: PlannedCreate }
    | { kind: 'feature'; value: PlannedFeature }
    | { kind: 'reference'; value: PlannedReference }
    | { kind: 'rename'; value: PlannedRename }
    | { kind: 'delete'; value: PlannedDelete };

interface LineResult {
    success: boolean;
    errors?: { code: string; message: string }[];
    effect?: Effect;
    /** M2: the generalizations the line writes. */
    generalizations?: PlannedGeneralization[];
    /** M2 `delete`: the attributes and references of the metamodel it removes, cascade included. */
    droppedFeatures?: string[];
}

const ok = (effect?: Effect): LineResult => ({ success: true, effect });
const fail = (code: string, message: string): LineResult => ({ success: false, errors: [{ code, message }] });

class Simulation {
    readonly elements: SimElement[];
    /** The run's handle registry (`handleRegistry.ts`): name → id, created in this run. */
    readonly handles = new Map<string, string>();
    private createdCount = 0;

    constructor(readonly world: PlanWorld) {
        this.elements = world.elements.map((e) => ({
            id: e.id, name: e.name, className: e.className, root: e.root,
            container: e.container ? { ...e.container } : undefined,
            references: Object.fromEntries(Object.entries(e.references ?? {}).map(([k, v]) => [k, [...v]])),
            created: false, deleted: false,
        }));
    }

    live(): SimElement[] { return this.elements.filter((e) => !e.deleted); }
    byId(id: string): SimElement | undefined { return this.elements.find((e) => e.id === id && !e.deleted); }
    slot(e: SimElement, feature: string): string[] { return e.references[feature] ?? (e.references[feature] = []); }
    nextId(): string { return `planned:${++this.createdCount}`; }

    /** `resolveInstanceHandle` (`instance.ts:246-261`): the handle wins, then the name, model-wide. */
    resolve(name: string): { value?: SimElement; ambiguous?: boolean } {
        const id = this.handles.get(name);
        if (id) {
            const e = this.byId(id);
            if (e) return { value: e };
            this.handles.delete(name);
        }
        const matches = this.live().filter((e) => e.name === name);
        if (matches.length === 1) return { value: matches[0] };
        return matches.length === 0 ? {} : { ambiguous: true };
    }
}

const nameOf = (q: QualifiedName): string => q.segments.join('::') || q.raw;

function isLiteral(value: unknown): value is LiteralValue {
    return !!value && typeof value === 'object' && 'kind' in (value as any)
        && ['string', 'number', 'boolean', 'null', 'array', 'enumLiteral'].includes((value as any).kind);
}

/** `literalToPrimitive` (`instance.ts:303-311`): arrays and enum literals write null. */
function literalToPrimitive(value: LiteralValue): string | number | boolean | null {
    switch (value.kind) {
        case 'boolean': case 'number': case 'string': return value.value;
        default: return null;
    }
}

function conforms(world: PlanWorld, className: string, type: string): boolean {
    const cls = world.classes[className];
    return !cls || cls.kinds.includes(type);
}

// ── One command ───────────────────────────────────────────────────────────────

/** `generateInstanceName` (`instance.ts:271-282`): `<Class>`, `<Class>2`, … free model-wide and among handles. */
function generateName(sim: Simulation, className: string): string {
    const taken = new Set<string>(sim.live().map((e) => e.name));
    for (const h of sim.handles.keys()) taken.add(h);
    if (!taken.has(className)) return className;
    let i = 2;
    while (taken.has(`${className}${i}`)) i++;
    return `${className}${i}`;
}

/** `executeCreateInstance` (`instance.ts:491-658`) and `resolveContainerSlot` (`:415-485`). */
function planCreate(sim: Simulation, args: CreateArgs, line: number): LineResult {
    const className = args.name;
    const explicitName = args.options?.defaultValue?.kind === 'string' ? args.options.defaultValue.value : undefined;
    const cls = sim.world.classes[className];
    if (!cls) return fail('CLASS_NOT_FOUND', `Class '${className}' not found in metamodel`);           // :524-535
    if (cls.abstract) return fail('ABSTRACT_CLASS', `Cannot instantiate abstract class '${className}'`); // :537-547
    if (cls.singleton) return fail('SINGLETON_CLASS', `Cannot instantiate singleton class '${className}'`); // :553-563

    let container: { owner: SimElement; feature: string; label: string } | undefined;
    if (args.parent) {
        const refName = args.parent.member;
        const handle = args.parent.segments.join('::');
        const label = `${handle}.${refName ?? ''}`;
        if (!refName || !handle) return fail('CONTAINER_REF_REQUIRED', `Name the container as <Parent>.<reference>, got '${args.parent.raw}'`); // :427-430
        const parent = sim.resolve(handle);
        if (parent.ambiguous) return fail('AMBIGUOUS_INSTANCE', `Cannot create inside '${handle}': the name is ambiguous`); // :433-435
        if (!parent.value) return fail('INSTANCE_NOT_FOUND', `Container instance '${handle}' not found in active model`); // :437-440
        const parentClass = sim.world.classes[parent.value.className];
        const ref = parentClass?.references.find((r) => r.name === refName);
        if (!ref) return fail('UNKNOWN_PROPERTY', `'${refName}' is not a reference of class '${parent.value.className}'`); // :449-453
        if (!ref.containment) return fail('NOT_A_CONTAINMENT', `'${parent.value.className}.${refName}' is not a containment reference`); // :454-457
        if (!cls.kinds.includes(ref.type)) {                                                                          // :458-465
            return fail('TYPE_MISMATCH', `'${className}' does not conform to '${ref.type}', the type of ${parent.value.className}.${refName}`);
        }
        // Committed values plus the children this run created into it (:474-482).
        const upper = ref.upper;
        if (typeof upper === 'number' && upper >= 0 && sim.slot(parent.value, refName).length >= upper) {
            return fail('MULTIPLICITY_EXCEEDED', `'${label}' is full (at most ${upper})`);
        }
        container = { owner: parent.value, feature: refName, label };
    }

    const name = explicitName ?? generateName(sim, className);                                                       // :583
    if (sim.handles.has(name)) return fail('HANDLE_IN_USE', `Handle '${name}' already used in this script`);         // :588-598

    const id = sim.nextId();
    sim.elements.push({
        id, name, className, root: !container, references: {}, created: true, deleted: false,
        container: container ? { owner: container.owner.id, feature: container.feature } : undefined,
    });
    sim.handles.set(name, id);                                                                                        // :633-634
    if (container) sim.slot(container.owner, container.feature).push(id);
    return ok({ kind: 'create', value: { line, id, metaclass: className, name, container: container?.label ?? null } });
}

/** `executeSetInstance` (`instance.ts:899-1191`) and `applyCollectionUpdate` (`:1204-1293`). */
function planSet(sim: Simulation, args: SetArgs, line: number): LineResult {
    const ownerName = nameOf(args.target);                                                                            // :923
    const owner = sim.resolve(ownerName);
    if (owner.ambiguous) return fail('AMBIGUOUS_INSTANCE', `Cannot set on '${ownerName}': the name is ambiguous`);  // :927-934
    if (!owner.value) return fail('INSTANCE_NOT_FOUND', `Instance '${ownerName}' not found`);                       // :936-946
    const source = owner.value;
    const cls = sim.world.classes[source.className];
    if (!cls) return fail('NO_METACLASS', `Cannot resolve metaclass for instance '${ownerName}'`);                  // :950-957

    // `classifyMetaclassProperty` (:290-298): attributes first, then references.
    const attribute = cls.attributes.find((a) => a.name === args.property);
    const reference = attribute ? undefined : cls.references.find((r) => r.name === args.property);
    if (!attribute && !reference) {                                                                                   // :959-970
        return fail('UNKNOWN_PROPERTY', `Property '${args.property}' is not a feature of class '${cls.name}'`);
    }
    const operator = args.operator ?? '=';

    if (attribute) {
        if (operator !== '=') return fail('OPERATOR_NOT_SUPPORTED', `'${operator}' is not available on the attribute '${args.property}'`); // :977-987
        if (!isLiteral(args.value)) return fail('TYPE_MISMATCH', `Attribute '${args.property}' expects a literal value`); // :988-998
        return ok({ kind: 'feature', value: {
            line, owner: ownerName, ownerId: source.id, feature: args.property,
            value: literalToPrimitive(args.value), many: isManyValued(attribute.upper),
        } });
    }

    const ref = reference!;
    const slot = sim.slot(source, ref.name);
    const base = { line, source: ownerName, sourceId: source.id, feature: ref.name, containment: ref.containment };
    const isUnlink = isLiteral(args.value) && args.value.kind === 'null';
    if (isUnlink && operator !== '=') return fail('TYPE_MISMATCH', `'${operator}' needs an instance name`);         // :1047-1057
    if (isUnlink) {                                                                                                   // :1059-1089
        const plan = planUnlink(slot);
        takeOut(sim, source, ref, plan.remove);
        return ok({ kind: 'reference', value: { ...base, operator: 'clear', target: null, targetId: null, targetCreated: false, removed: plan.remove } });
    }

    let targetName: string;                                                                                           // :1092-1109
    if (isLiteral(args.value)) {
        if (args.value.kind !== 'string') return fail('TYPE_MISMATCH', `Reference '${args.property}' expects an instance name`);
        targetName = args.value.value;
    } else {
        targetName = (args.value as QualifiedName).raw;
    }
    const resolvedTarget = sim.resolve(targetName);
    if (resolvedTarget.ambiguous) return fail('AMBIGUOUS_INSTANCE', `Cannot link to '${targetName}': the name is ambiguous`); // :1115-1122
    if (!resolvedTarget.value) return fail('INSTANCE_NOT_FOUND', `Target instance '${targetName}' not found in active model`); // :1124-1134
    const target = resolvedTarget.value;

    // `linkTypeMismatch` (:369-393), not on a removal (:1141-1144).
    if (operator !== '-=' && !conforms(sim.world, target.className, ref.type)) {
        return fail('TYPE_MISMATCH', `'${targetName}' is a ${target.className}: ${cls.name}.${ref.name} holds ${ref.type} and its subclasses`);
    }
    const effect = (op: PlannedReference['operator'], removed: string[]): LineResult =>
        ok({ kind: 'reference', value: { ...base, operator: op, target: targetName, targetId: target.id, targetCreated: target.created, removed } });

    if (operator === '+=') {                                                                                          // :1230-1240
        const plan = planAdd(slot, target.id, ref.upper);
        if ('full' in plan) return fail('MULTIPLICITY_EXCEEDED', `'${ownerName}.${ref.name}' is full (at most ${plan.full})`);
        if ('write' in plan) putIn(sim, source, ref, plan.write);
        return effect('+=', []);
    }
    if (operator === '-=') {                                                                                          // :1241-1253
        const plan = planRemove(slot, target.id);
        if ('absent' in plan) return fail('NOT_LINKED', `'${targetName}' is not in ${ownerName}.${ref.name}`);
        const bornHere = target.container?.owner === source.id && target.container.feature === ref.name;
        if (ref.containment && bornHere && !target.root) {
            return fail('WOULD_ORPHAN', `Cannot remove '${targetName}' from ${ownerName}.${ref.name}: it would be left outside the model`);
        }
        takeOut(sim, source, ref, plan.remove);
        return effect('-=', plan.remove);
    }
    const plan = planLink(slot, target.id, isManyValued(ref.upper));                                                 // :1162-1166
    takeOut(sim, source, ref, plan.remove);
    if (plan.write) putIn(sim, source, ref, plan.write);
    return effect('=', plan.remove);
}

/** `removeLinked` (`instance.ts:344-351`): out by value; a contained child fathered here goes back to the model. */
function takeOut(sim: Simulation, source: SimElement, ref: PlanReference, ids: readonly string[]): void {
    for (const id of ids) {
        source.references[ref.name] = sim.slot(source, ref.name).filter((v) => v !== id);
        const e = sim.byId(id);
        if (ref.containment && e?.container?.owner === source.id && e.container.feature === ref.name) e.container = undefined;
    }
}

/** `refProxy.values = write`: a containment target moves into the slot (`referenceWrite.ts:13-14`). */
function putIn(sim: Simulation, source: SimElement, ref: PlanReference, write: string[]): void {
    source.references[ref.name] = [...write];
    if (!ref.containment) return;
    for (const id of write) {
        const e = sim.byId(id);
        if (e) e.container = { owner: source.id, feature: ref.name };
    }
}

/** `executeRenameInstance` (`instance.ts:790-897`). */
function planRename(sim: Simulation, args: RenameArgs, line: number): LineResult {
    if (!args.newName.trim()) return fail('INVALID_NAME', 'An instance name cannot be empty');                      // :805-812
    const from = nameOf(args.target);
    const resolved = sim.resolve(from);
    if (resolved.ambiguous) return fail('AMBIGUOUS_INSTANCE', `Cannot rename '${from}': the name is ambiguous`);    // :827-834
    if (!resolved.value) return fail('INSTANCE_NOT_FOUND', `Instance '${from}' not found in active model`);          // :836-846
    const e = resolved.value;
    if (sim.live().some((o) => o.name === args.newName && o.id !== e.id)) {                                         // :851-860
        return fail('NAME_CONFLICT', `An instance named '${args.newName}' already exists`);
    }
    e.name = args.newName;
    const handle = sim.handles.get(from);                                                                             // :874 renameHandle
    if (handle) { sim.handles.delete(from); sim.handles.set(args.newName, handle); }
    return ok({ kind: 'rename', value: { line, id: e.id, from, to: args.newName } });
}

/** `executeDeleteInstance` (`instance.ts:664-784`): the instance and, deepest first, what it contains. */
function planDelete(sim: Simulation, args: DeleteArgs, line: number): LineResult {
    const name = nameOf(args.target);
    const resolved = sim.resolve(name);
    if (resolved.ambiguous) return fail('AMBIGUOUS_INSTANCE', `Cannot delete '${name}': the name is ambiguous`);    // :692-699
    if (!resolved.value) return fail('INSTANCE_NOT_FOUND', `Instance '${name}' not found in active model`);          // :701-711
    const e = resolved.value;
    if (sim.world.classes[e.className]?.singleton) return fail('SINGLETON_INSTANCE', `Cannot delete: ${e.className} is a singleton`); // :718-728

    const doomed = [e];
    for (let i = 0; i < doomed.length; i++) {
        for (const o of sim.live()) if (o.container?.owner === doomed[i].id && !doomed.includes(o)) doomed.push(o);
    }
    const ids = new Set(doomed.map((o) => o.id));
    for (const o of doomed) o.deleted = true;
    for (const o of sim.live()) {
        for (const f of Object.keys(o.references)) o.references[f] = o.references[f].filter((id) => !ids.has(id));
    }
    sim.handles.delete(name);                                                                                         // :763
    return ok({ kind: 'delete', value: { line, id: e.id, name, contained: doomed.slice(1).map((o) => o.name) } });
}

// ── M2 (P-2026-10-24-1520) ────────────────────────────────────────────────────
//
// The metamodel commands, mirrored from `commands/create.ts` (`executeCreate` :215-452 and the
// creators :475-1178), `set.ts` (:53-156), `rename.ts` (:65-142), `delete.ts` (:51-116),
// `extends.ts` (:44-137), `abstract.ts` and `add.ts` (a `create` with `to` as its parent).
// Names resolve inside the metamodel only, case-sensitive, with the qualified segments read as
// ancestors (`Pkg::Class`, `Class.feature`); the executor's project-wide fallback is not mirrored.

interface SimM2 {
    id: string;
    name: string;
    kind: M2Kind;
    father: string | null;
    abstract: boolean;
    extends: string[];
    type: string | null;
    containment: boolean;
    upper: number | '*';
    created: boolean;
    deleted: boolean;
}

/** `PRIMITIVE_ATTRIBUTE_TYPES` (`create.ts:49-77`). */
const PRIMITIVES: Record<string, string> = {
    estring: 'EString', string: 'EString', str: 'EString', echar: 'EChar', char: 'EChar',
    eint: 'EInt', int: 'EInt', integer: 'EInt', eshort: 'EShort', short: 'EShort',
    elong: 'ELong', long: 'ELong', ebyte: 'EByte', byte: 'EByte', eboolean: 'EBoolean',
    boolean: 'EBoolean', bool: 'EBoolean', edate: 'EDate', date: 'EDate', edouble: 'EDouble',
    double: 'EDouble', efloat: 'EFloat', float: 'EFloat', evoid: 'EVoid', void: 'EVoid',
    expression: 'Expression', action: 'Action',
};

const KIND_BY_ELEMENT_TYPE: Record<string, M2Kind> = {
    'class': 'Class', 'abstract class': 'Class', 'interface': 'Class', 'enum': 'Enumeration',
    'enumeration': 'Enumeration', 'package': 'Package', 'attribute': 'Attribute', 'reference': 'Reference',
    'containment': 'Reference', 'composition': 'Reference', 'operation': 'Operation',
    'parameter': 'Parameter', 'literal': 'Literal',
};

/** `PARENT_KINDS_BY_ELEMENT_TYPE` (`create.ts:128-142`); `null` stands for the metamodel. */
const PARENT_KINDS: Record<M2Kind, (M2Kind | null)[]> = {
    Attribute: ['Class'], Reference: ['Class'], Operation: ['Class'], Parameter: ['Operation'],
    Literal: ['Enumeration'], Class: ['Package', null], Enumeration: ['Package', null], Package: ['Package', null],
};

/** `needsParent` (`utils.ts:283-285`). */
const NEEDS_PARENT = new Set<M2Kind>(['Attribute', 'Reference', 'Operation', 'Parameter', 'Literal']);

/** `TYPE_CLAUSE_RULES` (`create.ts:592-625`): the kinds a `type` clause may name, and its error code. */
const TYPE_RULES: Partial<Record<M2Kind, { kinds: M2Kind[]; primitives: boolean; code: string }>> = {
    Attribute: { kinds: ['Enumeration'], primitives: true, code: 'UNKNOWN_ATTRIBUTE_TYPE' },
    Reference: { kinds: ['Class'], primitives: false, code: 'UNKNOWN_REFERENCE_TYPE' },
    Parameter: { kinds: ['Class', 'Enumeration'], primitives: true, code: 'UNKNOWN_PARAMETER_TYPE' },
    Operation: { kinds: ['Class', 'Enumeration'], primitives: true, code: 'UNKNOWN_OPERATION_TYPE' },
};

/** `getPropertyInfo` (`set.ts:170-228`): the properties `set` accepts per kind, matched case-insensitively. */
const SET_PROPERTIES: Record<M2Kind, string[]> = {
    Class: ['abstract', 'interface', 'singleton', 'superTypes', 'attributes', 'references', 'operations'],
    Attribute: ['type', 'lowerBound', 'upperBound', 'derived', 'changeable', 'transient', 'volatile', 'unsettable', 'iD', 'defaultValueLiteral', 'default', 'lower', 'upper', 'readonly', 'id'],
    Reference: ['type', 'lowerBound', 'upperBound', 'containment', 'container', 'opposite', 'resolveProxies', 'composition', 'aggregation', 'lower', 'upper'],
    Operation: ['type', 'parameters', 'exceptions'],
    Package: ['uri', 'prefix', 'classifiers', 'subPackages'],
    Enumeration: ['literals'],
    Literal: ['value'],
    Parameter: ['type', 'lowerBound', 'upperBound'],
};
const COMMON_PROPERTIES = ['name', 'annotations'];

class M2Simulation {
    readonly elements: SimM2[];
    readonly metamodelId: string;
    readonly metamodelName: string;
    readonly defaultParent: string | null;

    constructor(world: PlanWorld, private readonly nextId: () => string) {
        const mm = world.m2;
        this.metamodelId = mm?.id ?? 'planned:metamodel';
        this.metamodelName = mm?.name ?? '';
        this.defaultParent = mm?.defaultParent ?? this.metamodelId;
        this.elements = (mm?.elements ?? []).map((e) => ({
            id: e.id, name: e.name, kind: e.kind, father: e.father, abstract: !!e.abstract,
            extends: [...(e.extends ?? [])], type: e.type ?? null, containment: !!e.containment,
            upper: e.upper ?? 1, created: false, deleted: false,
        }));
    }

    newId(): string { return this.nextId(); }
    live(): SimM2[] { return this.elements.filter((e) => !e.deleted); }
    byId(id: string | null): SimM2 | undefined { return id ? this.elements.find((e) => e.id === id && !e.deleted) : undefined; }
    nameOf(id: string | null): string { return id === this.metamodelId ? this.metamodelName : this.byId(id)?.name ?? ''; }

    /** The names above `e`, nearest first, the metamodel's last. */
    private ancestry(e: SimM2): string[] {
        const out: string[] = [];
        let f = e.father;
        for (let i = 0; i < 64 && f; i++) {
            if (f === this.metamodelId) { out.push(this.metamodelName); break; }
            const p = this.byId(f);
            if (!p) break;
            out.push(p.name);
            f = p.father;
        }
        return out;
    }

    /** The live element `qn` names among `kinds` (all kinds when absent): its last segment is the name, the others its ancestors, in order. */
    resolve(qn: QualifiedName, kinds?: readonly (M2Kind | null)[]): { value?: SimM2; ambiguous?: boolean; memberMissingOn?: string } {
        const path = [...qn.segments, ...(qn.member ? [qn.member] : [])].filter(Boolean);
        const name = path[path.length - 1];
        const prefix = path.slice(0, -1);
        const match = (e: SimM2): boolean => {
            if (e.name !== name || (kinds && !kinds.includes(e.kind))) return false;
            const up = this.ancestry(e);
            let i = 0;
            for (let p = prefix.length - 1; p >= 0; p--) {
                while (i < up.length && up[i] !== prefix[p]) i++;
                if (i >= up.length) return false;
                i++;
            }
            return true;
        };
        const found = this.live().filter(match);
        if (found.length === 1) return { value: found[0] };
        if (found.length > 1) return { ambiguous: true };
        if (qn.member && prefix.length > 0) {
            const owner = this.resolve({ segments: qn.segments, raw: qn.segments.join('::') });
            if (owner.value) return { memberMissingOn: owner.value.name };
        }
        return {};
    }

    /** Every class `cls` is, itself first (`extends`, transitively). */
    lineage(cls: SimM2): SimM2[] {
        const out: SimM2[] = [];
        const queue = [cls];
        while (queue.length) {
            const c = queue.shift()!;
            if (out.includes(c)) continue;
            out.push(c);
            for (const id of c.extends) { const p = this.byId(id); if (p) queue.push(p); }
        }
        return out;
    }

    /** The names a new `kind` named `name` under `father` would collide with (`checkM2NameUniqueness`, R-M2U-1..4). */
    taken(kind: M2Kind, father: string | null, name: string, excludeId?: string): boolean {
        const others = this.live().filter((e) => e.id !== excludeId && e.name === name);
        if (kind === 'Class' || kind === 'Enumeration') return others.some((e) => e.kind === 'Class' || e.kind === 'Enumeration');
        if (kind === 'Attribute' || kind === 'Reference' || kind === 'Operation') {
            const owner = this.byId(father);
            const owners = new Set((owner ? this.lineage(owner) : []).map((c) => c.id));
            return others.some((e) => (e.kind === 'Attribute' || e.kind === 'Reference' || e.kind === 'Operation') && !!e.father && owners.has(e.father));
        }
        return others.some((e) => e.father === father);
    }
}

/** A `type` clause: a primitive, a classifier of the admissible kinds, or the line's refusal (`resolveTypeClause`, `create.ts:654-715`). */
function resolveM2Type(m2: M2Simulation, kind: M2Kind, owner: string, typeRef: any): { ok: true; name: string; id: string | null; created: boolean } | { ok: false; result: LineResult } {
    const rule = TYPE_RULES[kind]!;
    const spelled: string | undefined = typeRef?.kind === 'primitive' ? typeRef.type
        : typeRef?.name?.raw ?? typeRef?.name?.segments?.[typeRef.name.segments.length - 1];
    const primitive = spelled ? PRIMITIVES[spelled.trim().toLowerCase()] : undefined;
    if (primitive && rule.primitives) return { ok: true, name: primitive, id: null, created: false };
    const qn: QualifiedName | undefined = typeRef?.kind === 'class' ? typeRef.name : undefined;
    if (qn) {
        const found = m2.resolve(qn, rule.kinds);
        if (found.value) return { ok: true, name: found.value.name, id: found.value.id, created: found.value.created };
        if (found.ambiguous) return { ok: false, result: fail('AMBIGUOUS_TYPE', `'${qn.raw}' matches more than one classifier`) };
    }
    const shown = qn?.raw ?? spelled ?? '';
    return { ok: false, result: fail(rule.code, `Unknown type '${shown}' for ${kind.toLowerCase()} '${owner}': not found in the metamodel and not created by the script`) };
}

/** `executeCreate` (`create.ts:215-452`) for every element type but `instance`. */
function planM2Create(m2: M2Simulation, args: CreateArgs, line: number): LineResult {
    const kind = KIND_BY_ELEMENT_TYPE[args.elementType];
    if (!kind) return fail('UNSUPPORTED_TYPE', `Cannot create ${args.elementType}`);                                  // :425-431
    const name = args.name;

    // The father (:278-355).
    let father: string | null;
    if (args.parent) {
        const kinds = PARENT_KINDS[kind];
        const found = m2.resolve(args.parent, kinds.filter((k): k is M2Kind => k !== null));
        if (found.memberMissingOn) return fail('MEMBER_NOT_FOUND', `'${args.parent.member}' is not a member of '${found.memberMissingOn}'`); // :311-324
        if (found.ambiguous) return fail('AMBIGUOUS_PARENT', `More than one element answers to '${args.parent.raw}'`);       // :326-338
        let parent: SimM2 | undefined = found.value;
        if (!parent && !NEEDS_PARENT.has(kind)) parent = m2.resolve(args.parent).value;                                // :301-306
        if (!parent && NEEDS_PARENT.has(kind)) {
            return fail('PARENT_NOT_FOUND', `'${args.parent.raw}' not found: ${kind === 'Literal' ? 'literals can only be added to enums' : kind === 'Parameter' ? 'parameters can only be added to operations' : `${kind.toLowerCase()}s can only be added to classes`}`);
        }
        if (parent && NEEDS_PARENT.has(kind) && !PARENT_KINDS[kind].includes(parent.kind)) {                         // INVALID_PARENT_TYPE of the creators
            return fail('INVALID_PARENT_TYPE', `Cannot create ${kind.toLowerCase()} in ${parent.kind.toLowerCase()} '${parent.name}'`);
        }
        father = parent?.id ?? m2.defaultParent;
    } else {
        if (NEEDS_PARENT.has(kind)) return fail('PARENT_NOT_FOUND', `Could not find parent for ${args.elementType}`);   // :340-355
        father = m2.defaultParent;                                                                                   // :307-309
    }

    if (m2.taken(kind, father, name)) {                                                                              // :371-378
        return fail('DUPLICATE_NAME', `'${name}' is already used in ${father === m2.metamodelId || kind === 'Class' || kind === 'Enumeration' ? `the metamodel${m2.metamodelName ? ` '${m2.metamodelName}'` : ''}` : `'${m2.nameOf(father)}'`}`);
    }

    // The superclasses, settled before the class exists (`createClass`, :493-501).
    const supers: SimM2[] = [];
    if (kind === 'Class') {
        const many = args.options?.superClasses;
        const names = many && many.length > 0 ? many.filter(Boolean) : args.options?.superClass ? [args.options.superClass] : [];
        for (const qn of names) {
            const s = m2.resolve(qn).value;
            if (!s) return fail('PARENT_NOT_FOUND', `Superclass '${qn.raw}' of '${name}' not found in the metamodel and not created by the script`);
            supers.push(s);
        }
    }

    // The type, settled before the element exists (:786-787, :852-856).
    let type: { name: string; id: string | null; created: boolean } | undefined;
    if (TYPE_RULES[kind] && (args.options?.type || args.options?.returnType)) {
        const settled = resolveM2Type(m2, kind, name, args.options?.type ?? args.options?.returnType);
        if (!settled.ok) return settled.result;
        type = settled;
    } else if (kind === 'Attribute') {
        type = { name: 'EString', id: null, created: false };                                                         // :737-739
    }

    const containment = kind === 'Reference' && (args.elementType === 'containment' || args.elementType === 'composition' || !!args.options?.containment);
    const upperRaw = args.options?.multiplicity?.upper;
    const isAbstract = kind === 'Class' && (args.elementType === 'abstract class' || args.elementType === 'interface' || !!args.options?.abstract || !!args.options?.interface);
    const id = m2.newId();
    m2.elements.push({
        id, name, kind, father, abstract: isAbstract, extends: supers.map((s) => s.id), type: type?.id ?? null,
        containment, upper: upperRaw === '*' ? -1 : (upperRaw ?? 1), created: true, deleted: false,
    });
    const value: PlannedCreate = {
        line, id, metaclass: kind, name, container: father === m2.metamodelId ? null : m2.nameOf(father) || null,
        level: 'M2', containerId: father,
    };
    if (type) { value.type = type.name; value.typeId = type.id; value.typeCreated = type.created; }
    if (kind === 'Reference') value.containment = containment;
    if (kind === 'Class') value.abstract = isAbstract;
    const generalizations = supers.map((s) => ({ line, child: name, childId: id, parent: s.name, parentId: s.id, parentCreated: s.created }));
    return { success: true, effect: { kind: 'create', value }, generalizations };
}

/** `executeSet` at M2 (`set.ts:53-156`). */
function planM2Set(m2: M2Simulation, args: SetArgs, line: number): LineResult {
    const found = m2.resolve(args.target);
    const shown = args.target.segments.join('::') + (args.target.member ? `.${args.target.member}` : '');
    if (found.ambiguous) return fail('AMBIGUOUS_TARGET', `More than one element answers to '${shown}'`);
    if (!found.value) return fail('ELEMENT_NOT_FOUND', `Element '${shown}' not found in the metamodel and not created by the script`); // :54-65
    const e = found.value;
    const allowed = [...COMMON_PROPERTIES, ...SET_PROPERTIES[e.kind]];
    const property = allowed.find((p) => p.toLowerCase() === args.property.toLowerCase());
    if (!property) return fail('UNKNOWN_PROPERTY', `${e.kind} '${e.name}' has no property '${args.property}'`);            // :67-82

    let value: string | number | boolean | null;
    if (property === 'type' && TYPE_RULES[e.kind]) {                                                                // :84-92
        const typeRef = isLiteral(args.value)
            ? (args.value.kind === 'string' ? { kind: 'class', name: { segments: [args.value.value], raw: args.value.value } } : undefined)
            : { kind: 'class', name: args.value as QualifiedName };
        const settled = resolveM2Type(m2, e.kind, e.name, typeRef);
        if (!settled.ok) {
            const e0 = settled.result.errors![0];
            return e0.code === 'AMBIGUOUS_TYPE' ? settled.result : fail('UNKNOWN_TYPE', e0.message);                    // set.ts:325-387
        }
        e.type = settled.id;
        value = settled.name;
    } else if (isLiteral(args.value)) {
        value = literalToPrimitive(args.value);
    } else {
        value = (args.value as QualifiedName).raw;
    }
    if (property === 'name' && typeof value === 'string') e.name = value;
    if (property === 'abstract') e.abstract = !!value;
    if ((property === 'upperBound' || property === 'upper') && typeof value === 'number') e.upper = value;
    if (property === 'containment' || property === 'composition') e.containment = !!value;
    return ok({ kind: 'feature', value: { line, owner: shown, ownerId: e.id, feature: property, value, many: false, level: 'M2' } });
}

/** The element `rename` / `delete` name, restricted to the kind the command names (`TARGET_KINDS_BY_ELEMENT_TYPE`). */
function resolveM2Target(m2: M2Simulation, target: QualifiedName, elementType: string | undefined, verb: string): { value: SimM2 } | { result: LineResult } {
    const kind = elementType ? KIND_BY_ELEMENT_TYPE[elementType] : undefined;
    const found = m2.resolve(target, kind ? [kind] : undefined);
    if (found.memberMissingOn) return { result: fail('MEMBER_NOT_FOUND', `'${target.member}' is not a member of '${found.memberMissingOn}'`) };
    if (found.ambiguous) return { result: fail('AMBIGUOUS_TARGET', `More than one element answers to '${target.raw}'`) };
    if (!found.value) return { result: fail('ELEMENT_NOT_FOUND', `Cannot ${verb} '${target.raw}': not found in the metamodel`) };
    return { value: found.value };
}

/** `executeRename` at M2 (`rename.ts:65-142`). */
function planM2Rename(m2: M2Simulation, args: RenameArgs, line: number): LineResult {
    if (!args.newName.trim()) return fail('INVALID_NAME', 'A name cannot be empty');
    const t = resolveM2Target(m2, args.target, args.elementType, 'rename');
    if ('result' in t) return t.result;
    const e = t.value;
    if (m2.taken(e.kind, e.father, args.newName, e.id)) return fail('NAME_CONFLICT', `Name conflict: '${args.newName}' already exists`); // :127-142
    const from = e.name;
    e.name = args.newName;
    return ok({ kind: 'rename', value: { line, id: e.id, from, to: args.newName, level: 'M2' } });
}

/** `executeDelete` at M2 (`delete.ts:51-160`): the element and, through `father`, what it contains. */
function planM2Delete(m2: M2Simulation, args: DeleteArgs, line: number): LineResult {
    const t = resolveM2Target(m2, args.target, args.elementType, 'delete');
    if ('result' in t) return t.result;
    const e = t.value;
    const doomed = [e];
    for (let i = 0; i < doomed.length; i++) {
        for (const o of m2.live()) if (o.father === doomed[i].id && !doomed.includes(o)) doomed.push(o);
    }
    const ids = new Set(doomed.map((o) => o.id));
    for (const o of doomed) o.deleted = true;
    for (const o of m2.live()) o.extends = o.extends.filter((id) => !ids.has(id));
    const droppedFeatures = doomed.filter((o) => o.kind === 'Attribute' || o.kind === 'Reference').map((o) => o.id);
    return { ...ok({ kind: 'delete', value: { line, id: e.id, name: e.name, contained: doomed.slice(1).map((o) => o.name), level: 'M2' } }), droppedFeatures };
}

/** `executeExtends` (`extends.ts:44-160`). */
function planM2Extends(m2: M2Simulation, args: ExtendsArgs, line: number): LineResult {
    const child = m2.resolve(args.childClass).value;
    if (!child) return fail('CHILD_NOT_FOUND', `Class '${args.childClass.raw}' not found in the metamodel and not created by the script`);
    if (child.kind !== 'Class') return fail('NOT_A_CLASS', `'${args.childClass.raw}' is not a class`);
    const parent = m2.resolve(args.parentClass).value;
    if (!parent) return fail('PARENT_NOT_FOUND', `Class '${args.parentClass.raw}' not found in the metamodel and not created by the script`);
    if (parent.kind !== 'Class') return fail('NOT_A_CLASS', `'${args.parentClass.raw}' is not a class`);
    if (m2.lineage(parent).includes(child)) return fail('CIRCULAR_INHERITANCE', `${child.name} cannot extend ${parent.name}: circular inheritance`);
    if (child.extends.includes(parent.id)) return ok();                                                              // :125-137
    child.extends.push(parent.id);
    return { success: true, generalizations: [{ line, child: child.name, childId: child.id, parent: parent.name, parentId: parent.id, parentCreated: parent.created }] };
}

/** `executeAbstract` (`abstract.ts`): toggles the flag of a class. */
function planM2Abstract(m2: M2Simulation, args: AbstractArgs, line: number): LineResult {
    const e = m2.resolve(args.target).value;
    if (!e) return fail('ELEMENT_NOT_FOUND', `Class '${args.target.raw}' not found in the metamodel and not created by the script`);
    if (e.kind !== 'Class') return fail('NOT_A_CLASS', `'${args.target.raw}' is not a class`);
    e.abstract = !e.abstract;
    return ok({ kind: 'feature', value: { line, owner: args.target.raw, ownerId: e.id, feature: 'abstract', value: e.abstract, many: false, level: 'M2' } });
}

/**
 * The level a `set`, `rename`, `delete` or `remove` line plans at. The executor routes by the open
 * editor's level (`set.ts:49`, `delete.ts:47`, `rename.ts:61`); a mixed script is planned per level,
 * so a line whose target only the other level knows plans there, and one neither knows stays on the open level.
 */
function lineLevel(sim: Simulation, m2: M2Simulation, open: 'M1' | 'M2', target: QualifiedName, elementType?: string): 'M1' | 'M2' {
    if (elementType === 'instance') return 'M1';
    if (elementType && KIND_BY_ELEMENT_TYPE[elementType]) return 'M2';
    const m1 = sim.resolve(nameOf(target));
    const inM1 = !!(m1.value || m1.ambiguous);
    const r2 = m2.resolve(target);
    const inM2 = !!(r2.value || r2.ambiguous);
    if (open === 'M1') return !inM1 && inM2 ? 'M2' : 'M1';
    return !inM2 && inM1 ? 'M1' : 'M2';
}

/** The M1 routing of `executor.ts:161-232` and the commands' own (`set.ts:49`, `create.ts:233-235`, `delete.ts:47`, `rename.ts:61`, `remove.ts:51`), and the M2 one. */
function planCommand(sim: Simulation, m2: M2Simulation, open: 'M1' | 'M2', ast: CommandNode, line: number): LineResult {
    const args: any = ast.args;
    switch (ast.command) {
        case 'create':
            if (args.elementType === 'instance') return planCreate(sim, args as CreateArgs, line);
            return planM2Create(m2, args as CreateArgs, line);
        case 'add': {
            const add = args as AddArgs;                                                                              // add.ts:26-34
            const create: CreateArgs = { command: 'create', elementType: add.elementType, name: add.name, parent: add.to, options: add.options };
            return add.elementType === 'instance' ? planCreate(sim, create, line) : planM2Create(m2, create, line);
        }
        case 'extends': return planM2Extends(m2, args as ExtendsArgs, line);
        case 'abstract': return planM2Abstract(m2, args as AbstractArgs, line);
        case 'set':
            return lineLevel(sim, m2, open, (args as SetArgs).target) === 'M2' ? planM2Set(m2, args as SetArgs, line) : planSet(sim, args as SetArgs, line);
        case 'rename':
            return lineLevel(sim, m2, open, (args as RenameArgs).target, args.elementType) === 'M2' ? planM2Rename(m2, args as RenameArgs, line) : planRename(sim, args as RenameArgs, line);
        case 'delete':
            return lineLevel(sim, m2, open, (args as DeleteArgs).target, args.elementType) === 'M2' ? planM2Delete(m2, args as DeleteArgs, line) : planDelete(sim, args as DeleteArgs, line);
        case 'remove': {
            if (lineLevel(sim, m2, open, (args as RemoveArgs).from) === 'M2') return fail('UNSUPPORTED', 'unsupported: remove on the metamodel');
            const remove = args as RemoveArgs;                                                                        // instance.ts:1304-1328
            if (!remove.from.member) return fail('REFERENCE_REQUIRED', `Name the reference: remove ${remove.target.raw} from ${remove.from.raw}.<reference>`);
            const owner = remove.from.segments.join('::');
            return planSet(sim, { command: 'set', target: { segments: remove.from.segments, raw: owner }, property: remove.from.member, value: remove.target, operator: '-=' }, line);
        }
        default:
            if (READ_ONLY_COMMANDS.has(ast.command)) return ok();
            return fail('UNSUPPORTED', `unsupported: ${ast.command}`);
    }
}

// ── The script ────────────────────────────────────────────────────────────────

/** The lines that run, with `ScriptBlock.tsx:283-288`'s filter, and their 1-based line numbers. */
function scriptLines(code: string): { text: string; line: number }[] {
    const out: { text: string; line: number }[] = [];
    code.split('\n').forEach((raw, i) => {
        const l = raw.trim();
        if (l && !l.startsWith('//') && !l.startsWith('#') && !l.toLowerCase().startsWith('target ')) out.push({ text: l, line: i + 1 });
    });
    return out;
}

/** A link written on one end of an opposite pair whose other end, at the end of the plan, does not point back. */
function oppositeWarnings(sim: Simulation, references: PlannedReference[]): PlanIssue[] {
    const out: PlanIssue[] = [];
    for (const r of references) {
        if (r.operator !== '=' && r.operator !== '+=') continue;
        const source = sim.byId(r.sourceId);
        const target = r.targetId ? sim.byId(r.targetId) : undefined;
        const ref = source && sim.world.classes[source.className]?.references.find((x) => x.name === r.feature);
        if (!source || !target || !ref?.opposite) continue;
        if ((target.references[ref.opposite] ?? []).includes(source.id)) continue;
        out.push({
            line: r.line, code: 'OPPOSITE_ONE_END',
            message: `${r.source}.${r.feature} → ${r.target} is written, but ${r.target}.${ref.opposite} does not point back to ${r.source}`,
        });
    }
    return out;
}

/** A `delete` that drops features whose slots hold values in conforming models: one warning per model, values summed. */
function slotValueWarnings(world: PlanWorld, line: number, featureIds: readonly string[]): PlanIssue[] {
    const perModel = new Map<string, { model: string; count: number }>();
    for (const id of featureIds) {
        for (const s of world.m2?.slotValues?.[id] ?? []) {
            const m = perModel.get(s.modelId) ?? { model: s.model, count: 0 };
            m.count += s.count;
            perModel.set(s.modelId, m);
        }
    }
    return [...perModel.values()].filter((m) => m.count > 0).map((m) => ({
        line, code: 'FEATURE_HAS_VALUES', message: `${m.model} loses ${m.count} slot ${m.count === 1 ? 'value' : 'values'}`,
    }));
}

/** Plan the effects of a script, M1 and M2 commands alike, against `world`. Reads `world`, never writes it. */
export async function planEffects(code: string, world: PlanWorld): Promise<EffectsPlan> {
    const lines = scriptLines(code);
    const asts = lines.map((l) => {
        try {
            const parsed = parse(l.text);
            return parsed.success && parsed.ast ? parsed.ast : null;
        } catch {
            return null;
        }
    });
    const sim = new Simulation(world);
    const m2 = new M2Simulation(world, () => sim.nextId());
    const open = world.level ?? 'M1';

    const run = await runPasses(
        lines.map((l) => l.text),
        async (i): Promise<LineResult> => {
            const ast = asts[i];
            if (!ast) return fail('PARSE_ERROR', `Line ${lines[i].line} does not parse`);
            return planCommand(sim, m2, open, ast, lines[i].line);
        },
        isDeferrable,
    );

    const plan: EffectsPlan = { created: [], features: [], references: [], renamed: [], deleted: [], warnings: [], errors: [], error: null, level: open, generalizations: [] };
    for (const outcome of run.outcomes) {
        const line = lines[outcome.index].line;
        if (outcome.status === 'success') {
            plan.generalizations!.push(...(outcome.result.generalizations ?? []));
            if (outcome.result.droppedFeatures?.length) plan.warnings.push(...slotValueWarnings(world, line, outcome.result.droppedFeatures));
            const effect = outcome.result.effect;
            if (!effect) continue;
            if (effect.kind === 'create') plan.created.push(effect.value);
            else if (effect.kind === 'feature') plan.features.push(effect.value);
            else if (effect.kind === 'reference') plan.references.push(effect.value);
            else if (effect.kind === 'rename') plan.renamed.push(effect.value);
            else plan.deleted.push(effect.value);
        } else if (outcome.status === 'failed') {
            const e = outcome.result.errors?.[0];
            if (!e) continue;
            (WARNING_CODES.has(e.code) ? plan.warnings : plan.errors).push({ line, code: e.code, message: e.message });
        }
    }
    plan.warnings.push(...oppositeWarnings(sim, plan.references));
    plan.warnings.sort((a, b) => a.line - b.line);
    plan.error = plan.errors[0] ?? null;
    return plan;
}
