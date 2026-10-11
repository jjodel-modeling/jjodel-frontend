/**
 * consumerProposalModel — #168 J4 (lane C2): Jodie's change proposal as the stand-alone consumer
 * reads it (`?profile=`, see `environment/consumerMode.ts`).
 *
 * In the consumer, a `jjscript` block in Jodie's reply is not the developer's script editor
 * (`ScriptBlock`): it is a list of changes in plain words, with «Apply» and «Discard»
 * (`ConsumerProposal.tsx`). This module is the part of it that decides, so the bench can run it:
 *
 *  - `readProposal` describes each line in plain words and says whether the proposal can be
 *    applied at all. It refuses before any write: a line that does not parse, a step that is not
 *    a create / set / rename / delete of elements, and a created element of a type that cannot sit
 *    at the model root (`LClass.rootable`) unless a later `set` puts it in a containment slot whose
 *    owner resolves, whose slot accepts the type and whose type the profile lets the user change.
 *    Measured 2026-10-01 (M0 Q5): a child left at the root is invisible to the consumer.
 *  - `runProposal` applies the steps one by one and stops at the first failure: the failed step
 *    says why, the steps after it read «Not applied».
 *  - `failureText` turns the executor's result into a sentence with no technical word in it. In
 *    the consumer the profile guard runs before the handler, so a name that does not resolve
 *    arrives as `PROFILE_UNRESOLVED` with the handler's sentence (`executor.ts` describeForGuard).
 *  - `proposalFocus` and `configuratorTargetOf` say which element the Configurator lands on.
 *  - The outcome of a proposal lives in a store keyed by the script text: closing Jodie unmounts
 *    the messages (`Jodie.tsx`), and a state kept in the component would offer «Apply» again.
 *    Declared limit: a later reply with a byte-identical script shows the earlier outcome.
 *
 * Names follow the executor (`jjscript/executor/commands/instance.ts`): an element is addressed by
 * name among the roots of the model (`model.objects`), and a name created in the same run wins.
 *
 * Importable by the `node` bench on purpose: the parser imports only its lexer, grammar and
 * `jjscript/types`; `multiDraw.ts` imports only `irReadCtx`, which has no imports.
 */
import { parse } from '../../jjscript/parser/parser';
import type { LiteralValue, QualifiedName } from '../../jjscript/types';
import { pathTo } from '../editor-v2/hooks/multiDraw';
import type { NavState } from '../../jjform/nav';

type Idlookup = Record<string, any>;

// ── The world the proposal is read against ────────────────────────────────────

/** A reference of a type, as the proposal needs it. `containment` is the core's own flag
 *  (`LReference.containment`, composition or aggregation): it is what moves an element. */
export interface ProposalReference {
    name: string;
    containment: boolean;
    upper: number;
    /** Name of the type the reference points to. */
    type: string;
}

/** A type of the metamodel. */
export interface ProposalClass {
    name: string;
    /** `LClass.rootable`: an element of this type can sit at the model root. */
    rootable: boolean;
    /** The profile lets the user create and change elements of this type. */
    editable: boolean;
    /** The type and every type it inherits from, by name. */
    kinds: string[];
    attributes: string[];
    references: ProposalReference[];
}

/** An element of the model. `root`: listed in `model.objects`, where the executor finds names. */
export interface ProposalElement {
    id: string;
    className: string;
    root: boolean;
}

export interface ProposalWorld {
    classes: Record<string, ProposalClass>;
    /** By name. */
    elements: Record<string, ProposalElement[]>;
}

export const EMPTY_WORLD: ProposalWorld = { classes: {}, elements: {} };

// ── Reading a proposal ────────────────────────────────────────────────────────

export type ProposalStepKind =
    | 'create' | 'attribute' | 'link' | 'contain' | 'clear' | 'delete' | 'rename'
    | 'unsupported' | 'unreadable';

export interface ProposalStep {
    /** The command as it is executed. */
    line: string;
    kind: ProposalStepKind;
    /** What the consumer reads. */
    text: string;
    /** The element the step works on: the created name, or the element set, renamed, deleted. */
    subject?: string;
    /** `create`: the type. */
    className?: string;
    /** `set`: the property. */
    feature?: string;
    /** `set` that links or puts inside: the element it names. */
    value?: string;
    /** `rename`: the new name. */
    newName?: string;
}

export interface ProposalReading {
    steps: ProposalStep[];
    /** Why the proposal cannot be applied, or null. */
    blocked: string | null;
}

/** The lines that run, with `ScriptBlock`'s own filter: no blank line, no `//` or `#` comment,
 *  no `target …` line. One line, one command. */
export function proposalLines(code: string): string[] {
    return code
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith('//') && !l.startsWith('#') && !l.toLowerCase().startsWith('target '));
}

/** `firstName` → «First name», `first_name` → «First name», `title` → «Title». */
export function featureLabel(name: string): string {
    const words = name
        .replace(/[_-]+/g, ' ')
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .trim()
        .toLowerCase();
    return words ? words.charAt(0).toUpperCase() + words.slice(1) : name;
}

function isLiteral(value: unknown): value is LiteralValue {
    return !!value && typeof value === 'object' && 'kind' in (value as any)
        && ['string', 'number', 'boolean', 'null', 'array', 'enumLiteral'].includes((value as any).kind);
}

function literalText(value: LiteralValue): string {
    switch (value.kind) {
        case 'string': return `"${value.value}"`;
        case 'number': return String(value.value);
        case 'boolean': return value.value ? 'yes' : 'no';
        case 'null': return 'nothing';
        case 'array': return value.values.map(literalText).join(', ');
        case 'enumLiteral': return value.literal;
        default: return '';
    }
}

/** The name the executor reads off a `set` / `rename` / `delete` target. */
function targetName(target: QualifiedName): string {
    return target.segments.join('::') || target.raw;
}

/** The single root element called `name`, as the executor finds it, or null (none, or several). */
function rootElement(world: ProposalWorld, name: string): ProposalElement | null {
    const roots = (world.elements[name] ?? []).filter((e) => e.root);
    return roots.length === 1 ? roots[0] : null;
}

/** The type of the element called `name`: a name created earlier in the script first, then the
 *  single root of that name. For a description only, a single element anywhere will do. */
function typeOf(
    world: ProposalWorld,
    created: Map<string, string>,
    name: string,
    anywhere: boolean,
): string | null {
    const handle = created.get(name);
    if (handle) return handle;
    const root = rootElement(world, name);
    if (root) return root.className;
    if (!anywhere) return null;
    const all = world.elements[name] ?? [];
    return all.length === 1 ? all[0].className : null;
}

const UNREADABLE_TEXT = "A part of the proposal that can't be read";
const UNSUPPORTED_TEXT = "A step that can't be done here";

/** Describe one parsed line, given the names created so far. */
function describe(line: string, world: ProposalWorld, created: Map<string, string>): ProposalStep {
    const parsed = parse(line);
    if (!parsed.success || !parsed.ast) return { line, kind: 'unreadable', text: UNREADABLE_TEXT };
    const ast = parsed.ast;
    const args: any = ast.args;
    const onElements = args?.elementType === undefined || args.elementType === 'instance';

    if (ast.command === 'create' && args.elementType === 'instance') {
        const className: string = args.name;
        const name = args.options?.defaultValue?.kind === 'string' ? args.options.defaultValue.value as string : undefined;
        if (name) created.set(name, className);
        return {
            line, kind: 'create', className, subject: name,
            text: name ? `Create ${className} "${name}"` : `Create a new ${className}`,
        };
    }

    if (ast.command === 'set') {
        const owner = targetName(args.target);
        const feature: string = args.property;
        const label = featureLabel(feature);
        const cls = world.classes[typeOf(world, created, owner, true) ?? ''];
        const isAttribute = !!cls?.attributes.includes(feature);
        const reference = isAttribute ? undefined : cls?.references.find((r) => r.name === feature);
        const value = args.value;
        if (isLiteral(value) && value.kind === 'null') {
            return { line, kind: 'clear', subject: owner, feature, text: `Clear ${label} of ${owner}` };
        }
        // A reference takes an element: a name, or a string naming one (as the executor reads it).
        const names = !isAttribute && (!isLiteral(value) || (value.kind === 'string' && !!reference));
        if (names) {
            const target = isLiteral(value) ? (value as any).value as string : (value as QualifiedName).raw;
            if (reference?.containment) {
                return { line, kind: 'contain', subject: owner, feature, value: target, text: `Put ${target} inside ${owner}` };
            }
            return { line, kind: 'link', subject: owner, feature, value: target, text: `Link ${owner} to ${target} (${label})` };
        }
        const shown = isLiteral(value) ? literalText(value) : (value as QualifiedName).raw;
        return { line, kind: 'attribute', subject: owner, feature, text: `Set ${label} of ${owner} to ${shown}` };
    }

    if (ast.command === 'rename' && onElements) {
        const subject = targetName(args.target);
        const newName: string = args.newName;
        const handle = created.get(subject);
        if (handle) { created.delete(subject); created.set(newName, handle); }
        return { line, kind: 'rename', subject, newName, text: `Rename ${subject} to "${newName}"` };
    }

    if (ast.command === 'delete' && onElements) {
        const subject = targetName(args.target);
        return { line, kind: 'delete', subject, text: `Delete ${subject}` };
    }

    return { line, kind: 'unsupported', text: UNSUPPORTED_TEXT };
}

/** Why a created element of a type that cannot sit at the root would be left there, or null. */
function containmentProblem(steps: ProposalStep[], index: number, world: ProposalWorld): string | null {
    const step = steps[index];
    const cls = world.classes[step.className ?? ''];
    if (!cls || cls.rootable) return null;   // unknown type: the run refuses it in its own words
    const name = step.subject;
    if (!name) return `The new ${cls.name} has to go inside another element, and this proposal doesn't say which one.`;
    const who = `"${name}" (a new ${cls.name})`;

    // The names created up to each step, to resolve the owner the way the run will.
    const created = new Map<string, string>();
    for (let j = 0; j < index; j++) if (steps[j].kind === 'create' && steps[j].subject) created.set(steps[j].subject!, steps[j].className!);
    created.set(name, cls.name);

    let closest: string | null = null;
    for (let j = index + 1; j < steps.length; j++) {
        const s = steps[j];
        if (s.kind === 'create' && s.subject) created.set(s.subject, s.className!);
        if ((s.kind !== 'contain' && s.kind !== 'link') || s.value !== name) continue;
        const ownerType = typeOf(world, created, s.subject!, false);
        const owner = ownerType ? world.classes[ownerType] : undefined;
        if (!owner) {
            closest = closest ?? `${who} is to go inside "${s.subject}", but there is no single element called "${s.subject}".`;
            continue;
        }
        const ref = owner.references.find((r) => r.name === s.feature);
        if (ref && !ref.containment) continue;   // a plain link: it points at the element, it does not place it
        if (!ref || !cls.kinds.includes(ref.type)) {
            closest = `A ${owner.name} can't hold ${who} in ${featureLabel(s.feature ?? '')}.`;
            continue;
        }
        if (!owner.editable) {
            closest = `${who} would go inside "${s.subject}", but you can't change ${owner.name} elements here.`;
            continue;
        }
        return null;
    }
    return closest ?? `${who} has to go inside another element, and this proposal doesn't say which one.`;
}

/** The proposal as the consumer reads it, and whether it can be applied. */
export function readProposal(code: string, world: ProposalWorld): ProposalReading {
    const created = new Map<string, string>();
    const steps = proposalLines(code).map((line) => describe(line, world, created));

    let blocked: string | null = null;
    if (steps.length === 0) blocked = 'This proposal has no changes in it.';
    else if (steps.some((s) => s.kind === 'unreadable')) blocked = 'Part of this proposal could not be read, so nothing will be changed.';
    else if (steps.some((s) => s.kind === 'unsupported')) blocked = "This proposal includes a step that can't be done here, so nothing will be changed.";
    else {
        for (let i = 0; i < steps.length && !blocked; i++) {
            if (steps[i].kind === 'create') blocked = containmentProblem(steps, i, world);
        }
    }
    return { steps, blocked };
}

// ── Failures, in plain words ──────────────────────────────────────────────────

/** What one command returned, as `onJjScriptExecute` passes it. */
export interface ProposalResult {
    success: boolean;
    message: string;
    errors?: { code: string; message: string; suggestion?: string }[];
}

export const NOT_APPLIED_TEXT = 'Not applied, because an earlier change failed.';
export const HOST_REFUSAL_TEXT = "This change can't be made from here. Select an element in the list, then ask Jodie again.";
export const GENERIC_FAILURE_TEXT = 'This change could not be made.';
const UNMATCHED_TEXT = 'This change could not be matched to an element, so it was not made.';

/** The guard's codes whose sentence is already written for the consumer (lane B). */
const PLAIN_GUARD_CODES = new Set([
    'PROFILE_TYPE_LOCKED', 'PROFILE_HIDDEN_TARGET', 'PROFILE_LANGUAGE_LOCKED', 'PROFILE_COMMAND_LOCKED', 'PROFILE_NOT_FOUND',
]);

/** The codes of a name that did not resolve, which carry the executor's sentence. */
const NAME_CODES = new Set(['PROFILE_UNRESOLVED', 'INSTANCE_NOT_FOUND', 'AMBIGUOUS_INSTANCE', 'CLASS_NOT_FOUND']);

/** The name the executor's sentence is about, and what went wrong with it. */
function nameFailure(message: string, world: ProposalWorld): string {
    const ambiguous = /Ambiguous instance name '([^']+)'/.exec(message);
    if (ambiguous) return `More than one element is called "${ambiguous[1]}", so it isn't clear which one is meant.`;
    const missing = /No instance named '([^']+)'/.exec(message);
    if (missing) {
        const name = missing[1];
        if ((world.elements[name] ?? []).some((e) => !e.root)) {
            return `"${name}" is inside another element, and changes to it can't be made from here yet.`;
        }
        return `There is no element called "${name}".`;
    }
    const type = /Class '([^']+)' not found/.exec(message);
    if (type) return `"${type[1]}" isn't a kind of element in this project.`;
    return UNMATCHED_TEXT;
}

/** Why a step failed, with no technical word in it. The executor's own text is never shown. */
export function failureText(step: ProposalStep, result: ProposalResult, world: ProposalWorld): string {
    const error = result.errors?.[0];
    if (!error) return HOST_REFUSAL_TEXT;
    if (PLAIN_GUARD_CODES.has(error.code)) return error.message;
    if (NAME_CODES.has(error.code)) return nameFailure(error.message, world);
    const label = featureLabel(step.feature ?? '');
    switch (error.code) {
        case 'UNKNOWN_PROPERTY': return `${step.subject} has nothing called "${label}".`;
        case 'TYPE_MISMATCH': return `${label} of ${step.subject} can't take that value.`;
        case 'ABSTRACT_CLASS': return `"${step.className}" is too general to create: choose a more specific kind.`;
        case 'SINGLETON_CLASS': return `There can be only one ${step.className}, and it already exists.`;
        case 'SINGLETON_INSTANCE': return `${step.subject} can't be deleted: there must always be one.`;
        case 'NAME_CONFLICT': return `Another element is already called "${step.newName}".`;
        case 'HANDLE_IN_USE': return `This proposal creates two elements called "${step.subject}".`;
        default: return GENERIC_FAILURE_TEXT;
    }
}

// ── The outcome of a proposal ─────────────────────────────────────────────────

export type ProposalPhase = 'applying' | 'applied' | 'failed' | 'discarded';
export type ProposalStepStatus = 'pending' | 'applied' | 'failed' | 'skipped';

export interface ProposalOutcome {
    phase: ProposalPhase;
    steps: { text: string; status: ProposalStepStatus; reason?: string }[];
}

const outcomes = new Map<string, ProposalOutcome>();
const listeners = new Set<() => void>();

/** The outcome of the proposal with this script, or undefined while it is still open. */
export function proposalOutcome(code: string): ProposalOutcome | undefined {
    return outcomes.get(code);
}

export function setProposalOutcome(code: string, outcome: ProposalOutcome): void {
    outcomes.set(code, outcome);
    listeners.forEach((l) => l());
}

/** For `useSyncExternalStore`. */
export function subscribeProposals(listener: () => void): () => void {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
}

/** Tests only: module state survives between tests (P11). */
export function resetProposals(): void {
    outcomes.clear();
    listeners.clear();
}

/**
 * Apply the steps one by one, stopping at the first failure. A blocked proposal runs nothing.
 * `report` receives every intermediate outcome, so a remount mid-run loses nothing.
 * Returns which steps were applied.
 */
export async function runProposal(
    reading: ProposalReading,
    execute: (step: ProposalStep) => Promise<ProposalResult>,
    world: ProposalWorld,
    report: (outcome: ProposalOutcome) => void,
): Promise<boolean[]> {
    const applied = reading.steps.map(() => false);
    if (reading.blocked) return applied;
    const rows: ProposalOutcome['steps'] = reading.steps.map((s) => ({ text: s.text, status: 'pending' }));
    report({ phase: 'applying', steps: rows.map((r) => ({ ...r })) });

    let failed = false;
    for (let i = 0; i < reading.steps.length; i++) {
        if (failed) { rows[i] = { ...rows[i], status: 'skipped', reason: NOT_APPLIED_TEXT }; continue; }
        let result: ProposalResult;
        try {
            result = await execute(reading.steps[i]);
        } catch {
            result = { success: false, message: '', errors: [{ code: 'EXECUTION_ERROR', message: '' }] };
        }
        if (result?.success) {
            applied[i] = true;
            rows[i] = { ...rows[i], status: 'applied' };
        } else {
            failed = true;
            rows[i] = { ...rows[i], status: 'failed', reason: failureText(reading.steps[i], result ?? { success: false, message: '' }, world) };
        }
        report({ phase: 'applying', steps: rows.map((r) => ({ ...r })) });
    }
    report({ phase: failed ? 'failed' : 'applied', steps: rows.map((r) => ({ ...r })) });
    return applied;
}

// ── Where the Configurator lands ──────────────────────────────────────────────

/**
 * The element to select after «Apply»: the first created element that no other new element
 * points to, otherwise the element changed by the first applied step, otherwise none (a proposal
 * that only deletes). `created` says whether its id is in the run's handle registry.
 */
export function proposalFocus(steps: ProposalStep[], applied: boolean[]): { name: string; created: boolean } | null {
    const done = (i: number) => !!applied[i];
    const created = steps.filter((s, i) => done(i) && s.kind === 'create' && !!s.subject);
    const createdNames = new Set(created.map((s) => s.subject!));
    const pointedAt = new Set(steps
        .filter((s, i) => done(i) && (s.kind === 'link' || s.kind === 'contain')
            && createdNames.has(s.subject!) && !!s.value && createdNames.has(s.value))
        .map((s) => s.value!));
    const first = created.find((s) => !pointedAt.has(s.subject!)) ?? created[0];
    if (first) {
        // A rename later in the run moves the handle with it (`handleRegistry.renameHandle`).
        let name = first.subject!;
        steps.forEach((s, i) => { if (done(i) && s.kind === 'rename' && s.subject === name && s.newName) name = s.newName; });
        return { name, created: true };
    }
    const changed = steps.find((s, i) => done(i) && ['attribute', 'link', 'contain', 'clear', 'rename'].includes(s.kind));
    return changed?.subject ? { name: changed.subject, created: false } : null;
}

/** The id of a root element called `name` in the world, when exactly one has it. */
export function rootIdOf(world: ProposalWorld, name: string): string | null {
    return rootElement(world, name)?.id ?? null;
}

/**
 * Where the Configurator shows an element: its own row when its type is a top-level type of the
 * page; otherwise the row of its nearest ancestor of a top-level type, and the form drilled down
 * to it (`nav`, the road `pathTo` walks, as `InstanceDetail.drillTo` would build it). A hidden type
 * on the road keeps the row and drops the drill-in, since the detail does not open hidden elements.
 * Null when the element is not in the store yet, is of a hidden type, or has no such ancestor.
 */
export function configuratorTargetOf(
    idlookup: Idlookup,
    topTypeIds: readonly string[],
    instanceId: string,
    isHidden?: (classId: string) => boolean,
): { typeId: string; rowId: string; nav: NavState | null } | null {
    const obj = idlookup?.[instanceId];
    if (obj?.className !== 'DObject' || typeof obj.instanceof !== 'string') return null;
    const hidden = (classId: unknown) => typeof classId === 'string' && !!isHidden?.(classId);
    if (hidden(obj.instanceof)) return null;
    if (topTypeIds.includes(obj.instanceof)) return { typeId: obj.instanceof, rowId: instanceId, nav: null };

    const road = pathTo(idlookup, instanceId);
    for (let i = road.length - 2; i >= 0; i--) {
        const typeId = idlookup[road[i].id]?.instanceof;
        if (typeof typeId !== 'string' || !topTypeIds.includes(typeId)) continue;
        const steps = road.slice(i);
        if (steps.some((s) => hidden(idlookup[s.id]?.instanceof))) return { typeId, rowId: road[i].id, nav: null };
        return { typeId, rowId: road[i].id, nav: { path: [{ ...steps[0], childKey: null }, ...steps.slice(1)] } };
    }
    return null;
}
