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
 * Declared limits: the M2 commands, `let`, `forall` and blocks are `unsupported`; a `delete`
 * lists the contained instances it cascades to but not the incoming links it clears.
 */

import { parse } from '../parser/parser';
import type { CommandNode, CreateArgs, DeleteArgs, LiteralValue, QualifiedName, RemoveArgs, RenameArgs, SetArgs } from '../types';
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

export interface PlanWorld {
    classes: Record<string, PlanClass>;
    elements: PlanElement[];
}

// ── The plan ──────────────────────────────────────────────────────────────────

export interface PlannedCreate {
    line: number;
    /** `planned:<n>`, the n-th instance this plan creates. */
    id: string;
    metaclass: string;
    name: string;
    /** `Parent.reference` for `create instance … in`, otherwise null (a root). */
    container: string | null;
}

export interface PlannedFeature {
    line: number;
    owner: string;
    ownerId: string;
    feature: string;
    value: string | number | boolean | null;
    /** A multi-valued attribute: `=` replaces its first value. */
    many: boolean;
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

export interface PlannedRename { line: number; id: string; from: string; to: string }
export interface PlannedDelete { line: number; id: string; name: string; contained: string[] }

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
}

/** The codes reported as warnings; every other refusal is an error. */
const WARNING_CODES = new Set(['CLASS_NOT_FOUND', 'UNKNOWN_PROPERTY', 'INSTANCE_NOT_FOUND', 'OPPOSITE_ONE_END', 'UNSUPPORTED']);

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

/** The M1 routing of `executor.ts:161-232` and the commands' own (`set.ts:49`, `create.ts:233-235`, `delete.ts:47`, `rename.ts:61`, `remove.ts:51`). */
function planCommand(sim: Simulation, ast: CommandNode, line: number): LineResult {
    const args: any = ast.args;
    switch (ast.command) {
        case 'create':
            if (args.elementType === 'instance') return planCreate(sim, args as CreateArgs, line);
            return fail('UNSUPPORTED', `unsupported: create ${args.elementType}`);
        case 'set': return planSet(sim, args as SetArgs, line);
        case 'rename': return planRename(sim, args as RenameArgs, line);
        case 'delete': return planDelete(sim, args as DeleteArgs, line);
        case 'remove': {
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

/** Plan the effects of an M1 script against `world`. Reads `world`, never writes it. */
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

    const run = await runPasses(
        lines.map((l) => l.text),
        async (i): Promise<LineResult> => {
            const ast = asts[i];
            if (!ast) return fail('PARSE_ERROR', `Line ${lines[i].line} does not parse`);
            return planCommand(sim, ast, lines[i].line);
        },
        isDeferrable,
    );

    const plan: EffectsPlan = { created: [], features: [], references: [], renamed: [], deleted: [], warnings: [], errors: [], error: null };
    for (const outcome of run.outcomes) {
        const line = lines[outcome.index].line;
        if (outcome.status === 'success') {
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
