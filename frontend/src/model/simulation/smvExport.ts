/**
 * smvExport — a one-token state machine and its σ as one nuXmv module (hardware
 * demonstrator, slice S-G1, docs/discovery/discovery_2026-10-21_hw_demonstrator_plan.md §10.1).
 *
 * The correspondence is the spec's table (docs/spec/claude_spec_2026-09-13_computational_model.md
 * §8), for what this first cut translates:
 * - the control: one enumerated `VAR state` over the places, `init` the initial marking;
 * - σ: one `VAR` per stored semantic attribute of each element, in its declared domain
 *   (`boolean`, `min..max`, `{literals}`, `unsigned word[N]`/`signed word[N]`, N the element's
 *   own width), `init` from `CompiledNet.initial`; an input (R-SIM-88) is an `IVAR`; a derived
 *   attribute (R-SIM-73) is a `DEFINE` of its equation, read on the same σ as the step reads;
 * - the step's inputs: the selector `IVAR sel` (the transitions and `none`) and, with the event
 *   role, `IVAR event` (the triggers and `absent`, ε);
 * - one `DEFINE en_<t>` per transition: its source, its trigger, its guard `g_<t>`, and for an
 *   `else` the negation of its siblings' guards (`netStep.ts` `elseOutcome`); `en_<t>` is the
 *   simulator's candidate set, a terminated configuration having none (R-SIM-27);
 * - `TRANS` admissibility (spec §4.3): `none` only without a candidate, a transition only when
 *   enabled; a step that would halt on a range attribute written outside its domain (R-SIM-23)
 *   has no admissible selector, so the path ends there, as the run does;
 * - the transfers, one parallel assignment on the state before the step (`netStep.ts:296`):
 *   `next(x) := case <writes of x> ; TRUE : x; esac;`, the `TRUE` arm being the frame; a write
 *   through the memory idiom unrolled per cell (`sel = t & key = k : v`);
 * - the watches (R-SIM-137) as `INVARSPEC`: an invariant as it is, a breakpoint negated, so a
 *   counterexample is a run that reaches it.
 *
 * Expressions go through `bvToSmv`, whose `leaves` callback adds what it lacks (plan R13): a σ
 * read `X.[a]`, `X.[marked]` and `X.[tokens]`; the memory idiom (`memoryIdiom.ts`) as a `case`
 * over the frozen keys of the cells, hoisted into one `DEFINE` per distinct read, with
 * `bits(w, <ROM idiom>)` read per cell; `if … then … else` as a `case`; and any subexpression
 * that reads neither σ nor `event`, evaluated once over the frozen M as `judgeActionTarget`
 * folds a target. Refused with a defect naming the element, first cut: a bound above 1, a fork,
 * a join or a Petri arc, an inhibitor, `toNumber` outside the key of the memory idiom, `/`,
 * `%`, a read of `event`, strings (enumeration literals included) and decimals, a dynamic target
 * outside the memory idiom, and a memory whose cells do not cover every value of its key (an
 * uncovered key halts the simulator). Not modelled: the halt of an action that fails at run time
 * for another reason, a double write through two memory keys that coincide (the property
 * `single_write_<t>` below reports it), and a presentation action, which never reaches σ.
 *
 * The structural properties (slice S-G2), generated from the machine, none written by hand, each
 * named by the element it is about and listed in the result with what the exporter proves of it
 * without nuXmv. They read the state only: with the event role a transition's enabling under some
 * event is `ready_<t>`, `en_<t>` without its event. (1) `no_deadlock`, `final_quiescent` and one
 * `live_<s>` per state that is not final; (2) `LTLSPEC returns_<initial>`, and a graph check,
 * guards ignored, that every state reaches the initial one or a final one; (3) `single_write_<t>`:
 * a named target written twice is refused, so only two memory writes whose keys may coincide leave
 * a text; (5) `no_choice_<t>_<u>` per pair of transitions out of one state; (6) one `in_range_…`
 * per memory key, proved because the cells must cover the key. The free-ROM variant (`freeRom`,
 * plan R14) reads a cell's feature through the memory idiom as a `FROZENVAR` of its type, so the
 * `live_` instance at the decoding state covers every byte the fetch can load (item 4).
 *
 * Pure, no React; nuXmv is not run here (spec §8: the exporter is a function from the model
 * and its STC to a text).
 */

import { JjelEvaluator, isJjelObject } from '../../jjel/evaluator';
import type { EvaluationContext, JjelValue, JjelWarning } from '../../jjel/evaluator';
import { isBitVector } from '../../jjel/evaluator/context';
import type { JjelExpression } from '../../jjel/types/ast';
import { STATE_RESERVED } from '../../jjel/stateReserved';
import { firstAbsence, describeType } from '../jjelTriState';
import { actionSiteKey, judgeActionTarget } from './actionEvaluator';
import type { CompiledAction } from './actionEvaluator';
import { bvToSmv, smvWordConstant, smvWordType, SmvTranslationDefect } from './bvToSmv';
import type { SmvLeaves, SmvText, SmvType } from './bvToSmv';
import type { CompiledDerived } from './derivedEvaluator';
import { buildGuardContext } from './guardContext';
import type { SimSnapshot } from './guardContext';
import type { CompiledGuard } from './guardEvaluator';
import { matchMemoryIdiom } from './memoryIdiom';
import type { MemoryIdiom } from './memoryIdiom';
import type { CompiledNet, Domain, NetTransition, SimValue, StateAttributeDecl } from './netTypes';
import type { WatchRecord } from './watchCodec';
import { compileWatch } from './watchEvaluator';

/** What the exporter reads: the run Reset compiles (`compileModelRun` gives all but `nameOf` and `watches`). */
export interface SmvExportInput {
    readonly net: CompiledNet;
    readonly snapshot: SimSnapshot;
    /** The guards of each guard site. */
    readonly guards: ReadonlyMap<string, readonly CompiledGuard[]>;
    /** The actions of each action site, by `actionSiteKey`. */
    readonly actions: ReadonlyMap<string, readonly CompiledAction[]>;
    /** The derived equations; required when a semantic attribute is derived. */
    readonly equations?: CompiledDerived;
    /** The display name of an element: places, transitions, events and owners of σ are named by it. */
    readonly nameOf: (id: string) => string;
    readonly watches?: readonly WatchRecord[];
    /** The free-ROM variant (R14): a cell's feature read through the memory idiom is a `FROZENVAR`, any value of its type. */
    readonly freeRom?: boolean;
}

/** What a name of the text stands for, so a counterexample can be read back (S-H). */
export interface SmvNames {
    /** The constants of `state`, of `sel` and of `event`, each to its element. */
    readonly states: ReadonlyMap<string, string>;
    readonly transitions: ReadonlyMap<string, string>;
    readonly events: ReadonlyMap<string, string>;
    /** A `VAR`, an `IVAR` or a `DEFINE` of σ to its owner and attribute. */
    readonly attributes: ReadonlyMap<string, { readonly element: string; readonly attr: string; readonly role: 'var' | 'input' | 'derived' }>;
    /** A `FROZENVAR` of the free-ROM variant to its cell and feature. */
    readonly frozen?: ReadonlyMap<string, { readonly element: string; readonly feature: string }>;
}

/** The families of S-G2, by the plan's items: 1, 2, 3, 5 and 6 (item 4 is item 1 on the free-ROM variant). */
export type SmvPropertyFamily = 'no-deadlock' | 'returns' | 'single-write' | 'no-choice' | 'address-range';

/** A structural property, generated and named by the element it is about. */
export interface SmvProperty {
    /** Its `NAME` in the text, or the name of a check the exporter alone makes. */
    readonly name: string;
    readonly family: SmvPropertyFamily;
    /** A state, a transition or a memory; `null` for the machine as a whole. */
    readonly element: string | null;
    /** The spec as printed; `null` for a check with no text (the graph check, a step that writes no attribute twice, two transitions with no event in common). */
    readonly text: string | null;
    /** What the exporter establishes without nuXmv, and why; `null` when nuXmv decides. */
    readonly verdict: { readonly holds: boolean; readonly reason: string } | null;
}

export interface SmvExportDefect {
    /** The element the defect is about; `null` for the model as a whole. */
    readonly element: string | null;
    readonly message: string;
}

export type SmvExportResult =
    | { readonly kind: 'ok'; readonly text: string; readonly names: SmvNames; readonly properties: readonly SmvProperty[] }
    | { readonly kind: 'refused'; readonly defects: readonly SmvExportDefect[] };

/** The selector's value without a candidate, and the event's for ε (spec §8). */
export const SMV_NO_SELECTOR = 'none';
export const SMV_NO_EVENT = 'absent';

const RESERVED = new Set([
    'MODULE', 'DEFINE', 'MDEFINE', 'CONSTANTS', 'VAR', 'IVAR', 'FROZENVAR', 'INIT', 'TRANS', 'INVAR', 'SPEC', 'CTLSPEC',
    'LTLSPEC', 'PSLSPEC', 'COMPUTE', 'NAME', 'INVARSPEC', 'FAIRNESS', 'JUSTICE', 'COMPASSION', 'ISA', 'ASSIGN',
    'CONSTRAINT', 'SIMPWFF', 'CTLWFF', 'LTLWFF', 'PSLWFF', 'COMPWFF', 'IN', 'MIN', 'MAX', 'MIRROR', 'PRED', 'PREDICATES',
    'process', 'array', 'of', 'boolean', 'integer', 'real', 'word', 'word1', 'bool', 'signed', 'unsigned', 'extend',
    'resize', 'sizeof', 'uwconst', 'swconst', 'toint', 'count', 'abs', 'max', 'min', 'floor', 'EX', 'AX', 'EF', 'AF',
    'EG', 'AG', 'E', 'F', 'O', 'G', 'H', 'X', 'Y', 'Z', 'A', 'U', 'S', 'V', 'T', 'BU', 'EBF', 'ABF', 'EBG', 'ABG', 'case',
    'esac', 'mod', 'next', 'init', 'union', 'in', 'xor', 'xnor', 'self', 'TRUE', 'FALSE', 'running', 'set', 'time',
]);

/** An identifier nuXmv reads: letters, digits and `_`, not a keyword. */
export function smvIdentifier(name: string): string {
    let id = name.replace(/[^A-Za-z0-9_]/g, '_');
    if (id === '' || /^[0-9]/.test(id)) id = `_${id}`;
    return RESERVED.has(id) ? `${id}_` : id;
}

const BOOLEAN: SmvType = { kind: 'boolean' };
const INTEGER: SmvType = { kind: 'integer' };
const EVALUATOR = new JjelEvaluator();

/** A σ name: what a read of `element.[attr]` prints, and its type (`null` for an enumeration, refused in texts). */
interface SigmaName {
    readonly name: string;
    readonly element: string;
    readonly attr: string;
    readonly decl: StateAttributeDecl;
    readonly role: 'var' | 'input' | 'derived';
    readonly type: SmvType | null;
}

interface Arm {
    readonly condition: string;
    readonly value: string;
}

function typeName(t: SmvType): string {
    return t.kind === 'word' ? smvWordType(t.width, t.signed) : t.kind;
}

function sameType(a: SmvType, b: SmvType): boolean {
    return typeName(a) === typeName(b);
}

/** Whether an expression reads σ (`.[x]`) or names `event`: then its value is known only in the step. */
function readsStep(node: unknown): boolean {
    if (node === null || typeof node !== 'object') return false;
    if (Array.isArray(node)) return node.some(readsStep);
    const e = node as { type?: unknown; name?: unknown };
    if (e.type === 'StateAccess') return true;
    if (e.type === 'Identifier' && e.name === 'event') return true;
    return Object.entries(node).some(([key, child]) => key !== 'location' && readsStep(child));
}

/** `W.toNumber()` or `W.toNumber`: the word `W`, or `null`. */
function toNumberReceiver(e: JjelExpression): JjelExpression | null {
    if (e.type === 'MethodCall' && e.method === 'toNumber' && e.args.length === 0) return e.object;
    if (e.type === 'MemberAccess' && e.property === 'toNumber') return e.object;
    return null;
}

/** The refusals a fold would hide, checked on the whole text first: `/`, `%`, `toNumber` outside a memory key. */
function checkSubset(node: unknown): void {
    if (node === null || typeof node !== 'object') return;
    if (Array.isArray(node)) { node.forEach(checkSubset); return; }
    const e = node as JjelExpression;
    if (e.type === 'Binary' && (e.operator === '/' || e.operator === '%')) {
        throw new SmvTranslationDefect(`'${e.operator}' has no nuXmv translation in this cut`);
    }
    const idiom = matchMemoryIdiom(e);
    if (idiom) {
        checkSubset(idiom.collection);
        checkSubset(toNumberReceiver(idiom.key) ?? idiom.key);
        return;
    }
    if (toNumberReceiver(e)) throw new SmvTranslationDefect('toNumber outside the key of the memory idiom has no nuXmv translation');
    for (const [key, child] of Object.entries(node)) if (key !== 'location') checkSubset(child);
}

function domainText(domain: Domain, width: number | undefined): string {
    switch (domain.kind) {
        case 'boolean': return 'boolean';
        case 'range': return `${domain.min}..${domain.max}`;
        case 'enum': return `{${domain.literals.map(smvIdentifier).join(', ')}}`;
        case 'word': return smvWordType(width ?? 0, domain.signed);
    }
}

function domainType(domain: Domain, width: number | undefined): SmvType | null {
    switch (domain.kind) {
        case 'boolean': return BOOLEAN;
        case 'range': return INTEGER;
        case 'enum': return null;
        case 'word': return { kind: 'word', width: width ?? 0, signed: domain.signed };
    }
}

/** A value of σ as a constant of its domain. */
function valueText(value: SimValue, domain: Domain): string {
    if (isBitVector(value as JjelValue)) {
        const v = value as unknown as { width: number; signed: boolean; bits: bigint };
        return smvWordConstant(v.width, v.signed, v.bits);
    }
    if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
    if (typeof value === 'number') return String(value);
    if (domain.kind === 'enum') return smvIdentifier(value as string);
    throw new SmvTranslationDefect(`the value ${JSON.stringify(value)} has no nuXmv constant`);
}

/** A value of the frozen M as a constant: a boolean, an integer or a word. */
function constantOf(value: JjelValue, what: string): SmvText {
    if (isBitVector(value)) return { text: smvWordConstant(value.width, value.signed, value.bits), type: { kind: 'word', width: value.width, signed: value.signed } };
    if (typeof value === 'boolean') return { text: value ? 'TRUE' : 'FALSE', type: BOOLEAN };
    if (typeof value === 'number' && Number.isInteger(value)) return { text: String(value), type: INTEGER };
    if (typeof value === 'number') throw new SmvTranslationDefect(`${what} is the decimal ${value}: decimals have no translation in this cut`);
    if (typeof value === 'string') throw new SmvTranslationDefect(`${what} is the string ${JSON.stringify(value)}: strings have no translation in this cut`);
    throw new SmvTranslationDefect(`${what} is ${describeType(value)}, not a boolean, an integer or a word`);
}

/** `case c1 : v1; …; TRUE : vn; esac`, on one line. */
function caseText(arms: readonly Arm[]): string {
    return `case ${arms.map(a => `${a.condition} : ${a.value};`).join(' ')} esac`;
}

/** `c.F` with `c` the parameter of an idiom, read on one cell. */
function featureOf(element: string, feature: string): JjelExpression {
    return { type: 'MemberAccess', object: { type: 'Identifier', name: element }, property: feature } as JjelExpression;
}

/**
 * The graph check of item 2, guards ignored: every place that reaches `home`, to the arc that starts
 * one of its shortest paths there (`null` for a place of `home`); a place that does not is absent.
 */
export function pathsHome(arcs: ReadonlyArray<{ readonly id: string; readonly from: string; readonly to: string }>,
    home: ReadonlySet<string>): Map<string, string | null> {
    const out = new Map<string, string | null>([...home].map(p => [p, null]));
    let frontier = new Set(home);
    while (frontier.size > 0) {
        const next = new Set<string>();
        for (const a of arcs) {
            if (!out.has(a.from) && frontier.has(a.to)) { out.set(a.from, a.id); next.add(a.from); }
        }
        frontier = next;
    }
    return out;
}

/** The module text of `input`, or every defect that stops it. */
export function exportSmv(input: SmvExportInput): SmvExportResult {
    const { net, snapshot, nameOf } = input;
    const defects: SmvExportDefect[] = [];
    const refuse = (element: string | null, message: string): void => { defects.push({ element, message }); };

    // ── the shape: a one-token state machine (bound 1, one place in and one out) ──
    for (const d of net.defects) refuse(d.element, `compile defect ${d.code}: ${d.message}`);
    for (const d of net.declarationDefects ?? []) refuse(d.element ?? null, `declaration defect ${d.code}${d.name ? ` of '${d.name}'` : ''}: ${d.message}`);
    for (const d of input.equations?.defects ?? []) refuse(d.element ?? null, `equation defect ${d.code}${d.name ? ` of '${d.name}'` : ''}: ${d.message}`);
    if (net.bound !== 1) refuse(null, `the bound is ${net.bound}: only a one-token machine (bound 1) is exported in this cut`);
    for (const t of net.transitions) {
        const unit = (arcs: NetTransition['preset']) => arcs.length === 1 && arcs[0].weight === 1;
        if (!unit(t.preset) || !unit(t.postset)) refuse(t.id, `${nameOf(t.id)} is a fork, a join or a Petri transition: not exported in this cut`);
        if (t.inhibitors.length > 0) refuse(t.id, `${nameOf(t.id)} has an inhibitor arc: not exported in this cut`);
    }
    const initial = [...net.initial.marking].filter(([, n]) => n > 0);
    if (initial.length !== 1 || initial[0][1] !== 1) refuse(null, `the initial marking has ${initial.length} marked places: a one-token machine has one`);
    if (defects.length > 0) return { kind: 'refused', defects };

    // ── names: constants of the three enumerations, and identifiers ──
    const identifiers = new Map<string, string>();
    const claim = (name: string, what: string): string => {
        const other = identifiers.get(name);
        if (other !== undefined) refuse(null, `the name ${name} is both ${other} and ${what}`);
        else identifiers.set(name, what);
        return name;
    };
    const constants = new Map<string, string>();
    const enumeration = (ids: readonly string[], what: string): Map<string, string> => {
        const out = new Map<string, string>();
        for (const id of ids) {
            const name = smvIdentifier(nameOf(id));
            if (out.has(name)) refuse(id, `two ${what}s are named ${name}`);
            out.set(name, id);
            constants.set(name, `the ${what} ${nameOf(id)}`);
        }
        return out;
    };
    const places = [...net.places];
    const states = enumeration(places, 'state');
    const stateOf = new Map([...states].map(([name, id]) => [id, name]));
    const transitions = enumeration(net.transitions.map(t => t.id), 'transition');
    const selOf = new Map([...transitions].map(([name, id]) => [id, name]));
    if (transitions.has(SMV_NO_SELECTOR)) refuse(transitions.get(SMV_NO_SELECTOR)!, `a transition is named ${SMV_NO_SELECTOR}, the selector's value without a candidate`);
    const triggers: string[] = [];
    if (net.hasEventRole) for (const t of net.transitions) for (const e of t.triggers) if (!triggers.includes(e)) triggers.push(e);
    const events = enumeration(triggers, 'event');
    const eventOf = new Map([...events].map(([name, id]) => [id, name]));
    if (events.has(SMV_NO_EVENT)) refuse(events.get(SMV_NO_EVENT)!, `an event is named ${SMV_NO_EVENT}, the event's value for ε`);
    claim('state', 'the control variable');
    claim('sel', 'the selector');
    if (net.hasEventRole) claim('event', 'the event');
    claim('some_enabled', 'the enabling of some transition');
    claim('final', 'the terminal predicate');

    // ── σ: stored, input and derived semantic attributes ──
    const sigma = new Map<string, SigmaName>();
    const keyOf = (element: string, attr: string) => `${element}\u0000${attr}`;
    for (const [element, attrs] of net.declared) {
        const owner = element === net.modelId ? 'model' : smvIdentifier(nameOf(element));
        for (const [attr, decl] of attrs) {
            if (decl.space !== 'semantic' || decl.domain === null) continue;
            const role = decl.equation !== undefined ? 'derived' : decl.input === true ? 'input' : 'var';
            const width = net.widths?.get(element)?.get(attr);
            const name = claim(smvIdentifier(`${owner}_${attr}`), `the attribute ${attr} of ${nameOf(element)}`);
            sigma.set(keyOf(element, attr), { name, element, attr, decl, role, type: domainType(decl.domain, width) });
        }
    }
    for (const [name, what] of constants) if (identifiers.has(name)) refuse(null, `the name ${name} is both ${what} and ${identifiers.get(name)}`);
    if (defects.length > 0) return { kind: 'refused', defects };

    // ── expressions ──
    const memoryDefines: Array<{ name: string; text: string }> = [];
    const memoryByText = new Map<string, SmvText>();
    const memoryCount = new Map<string, number>();

    const evaluate = (e: JjelExpression, ctx: EvaluationContext, what: string): JjelValue => {
        let out: { value: JjelValue; warnings: JjelWarning[] };
        try {
            out = EVALUATOR.evaluateWithDiagnostics(e, ctx);
        } catch (err) {
            throw new SmvTranslationDefect(`${what}: ${(err as Error)?.message ?? String(err)}`);
        }
        const absent = firstAbsence(out.warnings);
        if (absent) throw new SmvTranslationDefect(`${what}: '${absent.identifier}' does not exist`);
        return out.value;
    };
    const elementOf = (e: JjelExpression, ctx: EvaluationContext, what: string): string => {
        const v = evaluate(e, ctx, what);
        const id = isJjelObject(v) ? (v as any).id : undefined;
        if (typeof id !== 'string' || id === '') throw new SmvTranslationDefect(`${what} is ${describeType(v)}, not a model element`);
        return id;
    };
    const sigmaRead = (element: string, attr: string): SmvText => {
        const s = sigma.get(keyOf(element, attr));
        if (!s) throw new SmvTranslationDefect(`${nameOf(element)}.[${attr}] is not a declared semantic attribute`);
        if (s.type === null) throw new SmvTranslationDefect(`${nameOf(element)}.[${attr}] is an enumeration: its literals are strings, not translated in this cut`);
        return { text: s.name, type: s.type };
    };

    /** The cells of an idiom with their keys, the first of a key winning as `.first` does. */
    const cellsOf = (idiom: MemoryIdiom, ctx: EvaluationContext): Array<{ cell: string; handle: JjelValue; key: number }> => {
        if (readsStep(idiom.collection)) throw new SmvTranslationDefect('the collection of a memory read must not read σ');
        const coll = evaluate(idiom.collection, ctx, 'the collection of a memory read');
        if (!Array.isArray(coll)) throw new SmvTranslationDefect(`the collection of a memory read is ${describeType(coll)}, not a collection`);
        const out: Array<{ cell: string; handle: JjelValue; key: number }> = [];
        const seen = new Set<number>();
        for (const handle of coll) {
            const cell = isJjelObject(handle) ? (handle as any).id : undefined;
            if (typeof cell !== 'string') throw new SmvTranslationDefect(`a cell is ${describeType(handle)}, not a model element`);
            const key = evaluate(featureOf(idiom.element, idiom.keyFeature), ctx.child({ [idiom.element]: handle }), `the key ${idiom.keyFeature} of ${nameOf(cell)}`);
            if (typeof key !== 'number' || !Number.isInteger(key)) throw new SmvTranslationDefect(`the key ${idiom.keyFeature} of ${nameOf(cell)} is ${describeType(key)}, not an integer`);
            if (seen.has(key)) continue;
            seen.add(key);
            out.push({ cell, handle, key });
        }
        return out;
    };

    /**
     * The arms of an idiom over its cells: `key` is `K = 0udW_k` per cell whose key the word
     * `K` can hold; `condition` is the same but `TRUE` for the last cell, for one `case` over
     * all the cells (a read); refused when the cells do not cover every value of `K`.
     */
    const keyArms = (idiom: MemoryIdiom, ctx: EvaluationContext, leaves: SmvLeaves): {
        key: SmvText; arms: Array<{ cell: string; handle: JjelValue; key: string; constant: string; condition: string }>;
    } => {
        const cells = cellsOf(idiom, ctx);
        const receiver = toNumberReceiver(idiom.key);
        if (!receiver) throw new SmvTranslationDefect('a memory key that reads σ must be a word\'s toNumber()');
        const k = bvToSmv(receiver, leaves);
        if (k.type.kind !== 'word') throw new SmvTranslationDefect(`a memory key must be a word's toNumber(), got ${typeName(k.type)}`);
        const { width, signed } = k.type;
        const lo = signed ? -(2 ** (width - 1)) : 0;
        const hi = signed ? 2 ** (width - 1) - 1 : 2 ** width - 1;
        const held = cells.filter(c => c.key >= lo && c.key <= hi);
        if (width > 24 || held.length !== hi - lo + 1) {
            throw new SmvTranslationDefect(`the cells cover ${held.length} of the ${width > 24 ? `2^${width}` : hi - lo + 1} values of the key ${k.text}: an uncovered key halts the simulator`);
        }
        return {
            key: k,
            arms: held.map((c, i) => {
                const constant = smvWordConstant(width, signed, BigInt(c.key));
                const key = `${k.text} = ${constant}`;
                return { cell: c.cell, handle: c.handle, key, constant, condition: i === held.length - 1 ? 'TRUE' : key };
            }),
        };
    };

    /** The element whose collection an idiom reads (`ram` of `ram.cells`) and the base of the names it gives, or `null`. */
    const memoryOf = (idiom: MemoryIdiom, ctx: EvaluationContext, read: string): { element: string | null; base: string } => {
        const c = idiom.collection;
        if (c.type !== 'MemberAccess' || readsStep(c.object)) return { element: null, base: smvIdentifier(read) };
        try {
            const element = elementOf(c.object, ctx, 'the memory');
            return { element, base: smvIdentifier(`${nameOf(element)}_${c.property}_${read}`) };
        } catch {
            return { element: null, base: smvIdentifier(read) };
        }
    };

    // ── item 6: one property per memory key, proved because the cells must cover it (`keyArms`) ──
    const addresses: SmvProperty[] = [];
    const addressed = new Set<string>();
    const addressProperty = (name: string, element: string | null, key: SmvText, arms: ReadonlyArray<{ key: string }>): void => {
        const width = key.type.kind === 'word' ? key.type.width : 0;
        addresses.push({
            name, family: 'address-range', element,
            text: `INVARSPEC NAME ${name} := ${arms.map(a => a.key).join(' | ')};`,
            verdict: { holds: true, reason: `the ${arms.length} cells cover every value of the ${width}-bit key ${key.text}` },
        });
    };

    /** In the free-ROM variant, a cell's feature as a `FROZENVAR` of the type its constant has; otherwise the constant. */
    const frozen = new Map<string, { name: string; element: string; feature: string; type: SmvType }>();
    const free = (cell: string, feature: string, constant: SmvText): SmvText => {
        if (input.freeRom !== true) return constant;
        if (constant.type.kind === 'integer') throw new SmvTranslationDefect(`${nameOf(cell)}.${feature} is an integer: a free cell is a boolean or a word`);
        const key = keyOf(cell, feature);
        let f = frozen.get(key);
        if (!f) {
            f = { name: claim(smvIdentifier(`${nameOf(cell)}_${feature}`), `the free ${feature} of ${nameOf(cell)}`), element: cell, feature, type: constant.type };
            frozen.set(key, f);
        }
        if (!sameType(f.type, constant.type)) throw new SmvTranslationDefect(`${nameOf(cell)}.${feature} is read as ${typeName(f.type)} and as ${typeName(constant.type)}`);
        return { text: f.name, type: f.type };
    };

    /** One `DEFINE` per distinct read, named by the memory, its feature and what is read, numbered. */
    const hoist = (idiom: MemoryIdiom, ctx: EvaluationContext, read: string, arms: readonly Arm[], type: SmvType): SmvText => {
        const text = caseText(arms);
        const known = memoryByText.get(text);
        if (known) return known;
        let base = read;
        const c = idiom.collection;
        if (c.type === 'MemberAccess' && !readsStep(c.object)) {
            try { base = `${nameOf(elementOf(c.object, ctx, 'the memory'))}_${c.property}_${read}`; } catch { base = read; }
        }
        base = smvIdentifier(base);
        const n = (memoryCount.get(base) ?? 0) + 1;
        memoryCount.set(base, n);
        const name = claim(`${base}_${n}`, 'a memory read');
        memoryDefines.push({ name, text });
        const out = { text: name, type };
        memoryByText.set(text, out);
        return out;
    };

    /** `idiom` read with a key that reads σ: `case` over the cells; with a frozen key, the one cell. */
    const memoryRead = (idiom: MemoryIdiom, ctx: EvaluationContext, leaves: SmvLeaves, read: string,
        cellValue: (cell: string, handle: JjelValue) => SmvText): SmvText => {
        if (!readsStep(idiom.key)) {
            const key = evaluate(idiom.key, ctx, 'the key of a memory read');
            const hit = cellsOf(idiom, ctx).find(c => c.key === key);
            if (!hit) throw new SmvTranslationDefect(`no cell has the key ${JSON.stringify(key)}`);
            return cellValue(hit.cell, hit.handle);
        }
        const { key, arms } = keyArms(idiom, ctx, leaves);
        const values = arms.map(a => cellValue(a.cell, a.handle));
        const type = values[0].type;
        for (const v of values) if (!sameType(v.type, type)) throw new SmvTranslationDefect(`a memory read: the cells read ${typeName(type)} and ${typeName(v.type)}`);
        const out = hoist(idiom, ctx, read, arms.map((a, i) => ({ condition: a.condition, value: values[i].text })), type);
        if (!addressed.has(out.text)) {
            addressed.add(out.text);
            addressProperty(`in_range_${out.text}`, memoryOf(idiom, ctx, read).element, key, arms);
        }
        return out;
    };

    /** The leaves of one text, `ctx` its context: `self` the site, or the model for a watch. */
    const leavesAt = (ctx: EvaluationContext): SmvLeaves => {
        const leaves: SmvLeaves = e => {
            if (e.type === 'Identifier' && e.name === 'event') throw new SmvTranslationDefect('a read of event is not translated in this cut');
            const idiom = matchMemoryIdiom(e);
            if (idiom && readsStep(e)) {
                if (idiom.read.kind === 'feature') {
                    const feature = idiom.read.feature;
                    return memoryRead(idiom, ctx, leaves, feature, (cell, handle) => free(cell, feature, constantOf(
                        evaluate(featureOf(idiom.element, feature), ctx.child({ [idiom.element]: handle }), `${nameOf(cell)}.${feature}`), `${nameOf(cell)}.${feature}`)));
                }
                const attr = idiom.read.attribute;
                return memoryRead(idiom, ctx, leaves, attr, cell => sigmaRead(cell, attr));
            }
            // `bits(w, <ROM idiom>)`: the constant of each cell, the idiom's feature its payload.
            if (e.type === 'FunctionCall' && (e.name === 'bits' || e.name === 'sbits') && readsStep(e)) {
                const at = e.args.findIndex(a => matchMemoryIdiom(a)?.read.kind === 'feature');
                if (at >= 0) {
                    const rom = matchMemoryIdiom(e.args[at])!;
                    const feature = (rom.read as { readonly feature: string }).feature;
                    return memoryRead(rom, ctx, leaves, feature, (cell, handle) => {
                        const payload = evaluate(featureOf(rom.element, feature), ctx.child({ [rom.element]: handle }), `${nameOf(cell)}.${feature}`);
                        if (typeof payload !== 'string' && typeof payload !== 'number') throw new SmvTranslationDefect(`${nameOf(cell)}.${feature} is ${describeType(payload)}`);
                        const args = e.args.map((a, i) => (i === at ? { type: 'Literal', value: payload } as JjelExpression : a));
                        return free(cell, feature, bvToSmv({ ...e, args } as JjelExpression, leaves));
                    });
                }
            }
            if (e.type === 'StateAccess') {
                if (readsStep(e.object)) throw new SmvTranslationDefect('a σ read whose element reads σ, outside the memory idiom, is not translated');
                const element = elementOf(e.object, ctx, 'the element of a σ read');
                const [MARKED, TOKENS] = STATE_RESERVED.readOnlyAttributes;
                if ((e.attribute === MARKED || e.attribute === TOKENS) && net.places.has(element)) {
                    const at = `state = ${stateOf.get(element)}`;
                    return e.attribute === MARKED ? { text: `(${at})`, type: BOOLEAN } : { text: `case ${at} : 1; TRUE : 0; esac`, type: INTEGER };
                }
                return sigmaRead(element, e.attribute);
            }
            if (e.type === 'IfThenElse') {
                if (e.elseBranch === null) throw new SmvTranslationDefect('if … then without else has no value');
                const c = bvToSmv(e.condition, leaves);
                if (c.type.kind !== 'boolean') throw new SmvTranslationDefect(`the condition of if is ${typeName(c.type)}, not a boolean`);
                const a = bvToSmv(e.thenBranch, leaves);
                const b = bvToSmv(e.elseBranch, leaves);
                if (!sameType(a.type, b.type)) throw new SmvTranslationDefect(`the branches of if are ${typeName(a.type)} and ${typeName(b.type)}`);
                return { text: caseText([{ condition: c.text, value: a.text }, { condition: 'TRUE', value: b.text }]), type: a.type };
            }
            if (e.type !== 'Literal' && !readsStep(e)) return constantOf(evaluate(e, ctx, 'a value of the frozen model'), 'a value of the frozen model');
            return null;
        };
        return leaves;
    };

    const siteContext = (site: string): EvaluationContext => {
        const ctx = buildGuardContext(snapshot, { transitionId: site }, { event: null });
        if (ctx === null) throw new SmvTranslationDefect(`${nameOf(site)} has no handle in the snapshot`);
        return ctx;
    };
    const modelContext = (): EvaluationContext => snapshot.base.child({ self: snapshot.model, event: null, model: snapshot.model });
    /** One text at one element: translated, its type checked, or a defect naming the element (`null` back). */
    const translate = (element: string, source: string, e: JjelExpression, ctx: () => EvaluationContext, want: SmvType): SmvText | null => {
        try {
            checkSubset(e);
            const out = bvToSmv(e, leavesAt(ctx()));
            if (!sameType(out.type, want)) throw new SmvTranslationDefect(`the value is ${typeName(out.type)}, ${typeName(want)} is wanted`);
            return out;
        } catch (err) {
            if (!(err instanceof SmvTranslationDefect)) throw err;
            refuse(element, `${nameOf(element)}: '${source}': ${err.message}`);
            return null;
        }
    };

    // ── derived attributes: a DEFINE of the equation, `self` the owner ──
    const derivedDefines: Array<{ name: string; text: string }> = [];
    const planned = new Set<string>();
    for (const { eq, owner } of input.equations?.plan ?? []) {
        const s = sigma.get(keyOf(owner, eq.decl.name));
        if (!s || s.role !== 'derived') continue;
        planned.add(keyOf(owner, eq.decl.name));
        if (s.type === null) { refuse(owner, `${nameOf(owner)}.[${s.attr}] is a derived enumeration: not translated in this cut`); continue; }
        const self = owner === net.modelId ? snapshot.model : snapshot.handleById.get(owner);
        const out = translate(owner, eq.decl.equation ?? '', eq.expr, () => {
            if (self === undefined) throw new SmvTranslationDefect('the owner has no handle in the snapshot');
            return snapshot.base.child({ self, event: null, model: snapshot.model });
        }, s.type);
        if (out) derivedDefines.push({ name: s.name, text: out.text });
    }
    for (const [key, s] of sigma) if (s.role === 'derived' && !planned.has(key)) refuse(s.element, `${nameOf(s.element)}.[${s.attr}] is derived and has no equation in the plan`);

    // ── guards and enabling ──
    const guardOf = new Map<string, string>();
    for (const t of net.transitions) {
        if (t.guardSites.length === 0) continue;
        const parts: string[] = [];
        for (const site of t.guardSites) {
            for (const g of input.guards.get(site) ?? []) {
                if (g.defect) { refuse(site, `${nameOf(site)}: '${g.source}': guard defect ${g.defect.reason}: ${g.defect.detail}`); continue; }
                if (g.expr === null) continue;
                const out = translate(site, g.source, g.expr, () => siteContext(site), BOOLEAN);
                if (out) parts.push(out.text);
            }
        }
        guardOf.set(t.id, parts.length === 0 ? 'TRUE' : parts.join(' & '));
    }
    const guardDefines = net.transitions.filter(t => guardOf.has(t.id))
        .map(t => ({ name: claim(`g_${selOf.get(t.id)}`, `the guard of ${nameOf(t.id)}`), text: guardOf.get(t.id)! }));
    const final = new Set([...(net.final ?? []), ...(net.activityFinal ?? [])]);
    const enabling: Array<{ name: string; text: string }> = [];
    const enOf = new Map<string, string>();
    // With the event role, the enabling under some event, for the properties, which read the state only.
    const ready: Array<{ name: string; text: string }> = [];
    const onOf = new Map<string, string>();
    for (const t of net.transitions) {
        const name = claim(`en_${selOf.get(t.id)}`, `the enabling of ${nameOf(t.id)}`);
        enOf.set(t.id, name);
        const readyName = net.hasEventRole ? claim(`ready_${selOf.get(t.id)}`, `the enabling of ${nameOf(t.id)} under some event`) : name;
        onOf.set(t.id, readyName);
        const source = t.preset[0].place;
        // A terminated configuration has no candidate (R-SIM-27): one token on a final place is one.
        if (final.has(source)) {
            enabling.push({ name, text: 'FALSE' });
            if (net.hasEventRole) ready.push({ name: readyName, text: 'FALSE' });
            continue;
        }
        const parts = [`state = ${stateOf.get(source)}`];
        if (t.elseOf !== null) {
            const siblings = t.elseOf.filter(id => net.transitions.some(s => s.id === id))
                .map(id => (guardOf.has(id) ? `g_${selOf.get(id)}` : 'TRUE'));
            if (siblings.length > 0) parts.push(`!(${siblings.join(' | ')})`);
        }
        if (guardOf.has(t.id)) parts.push(`g_${selOf.get(t.id)}`);
        if (net.hasEventRole) {
            ready.push({ name: readyName, text: parts.join(' & ') });
            parts.splice(1, 0, t.triggers.length === 0 ? `event = ${SMV_NO_EVENT}`
                : t.triggers.length === 1 ? `event = ${eventOf.get(t.triggers[0])}`
                    : `(${t.triggers.map(e => `event = ${eventOf.get(e)}`).join(' | ')})`);
        }
        enabling.push({ name, text: parts.join(' & ') });
    }
    if (net.hasEventRole) claim('some_ready', 'the enabling of some transition under some event');

    // ── transfers ──
    const writes = new Map<string, Arm[]>();
    const okOf = new Map<string, string[]>();
    /** `once` the attributes the step writes by name, `null` for a write through a memory key (item 3). */
    const addWrite = (t: NetTransition, s: SigmaName, condition: string, value: string, once: Set<string> | null): void => {
        if (once?.has(s.name)) { refuse(t.id, `${nameOf(t.id)} writes ${nameOf(s.element)}.[${s.attr}] twice in one step`); return; }
        once?.add(s.name);
        let arm = condition;
        // A range value outside its domain halts the run (R-SIM-23): the step is not admissible.
        if (s.decl.domain?.kind === 'range') {
            const { min, max } = s.decl.domain;
            const literal = /^-?\d+$/.test(value) ? Number(value) : null;
            if (literal === null || literal < min || literal > max) {
                okOf.set(t.id, [...(okOf.get(t.id) ?? []), literal === null ? `(${value} >= ${min} & ${value} <= ${max})` : 'FALSE']);
                arm = `${condition} & ok_${selOf.get(t.id)}`;
            }
        }
        writes.set(s.name, [...(writes.get(s.name) ?? []), { condition: arm, value }]);
    };
    const targetOf = (t: NetTransition, element: string, attr: string): SigmaName | null => {
        const s = sigma.get(keyOf(element, attr));
        if (!s) { refuse(t.id, `${nameOf(t.id)} writes ${nameOf(element)}.[${attr}], which is not a declared semantic attribute`); return null; }
        if (s.role !== 'var') { refuse(t.id, `${nameOf(t.id)} writes ${nameOf(element)}.[${attr}], which is ${s.role === 'input' ? 'an input' : 'derived'}`); return null; }
        if (s.type === null) { refuse(t.id, `${nameOf(t.id)} writes the enumeration ${nameOf(element)}.[${attr}]: its literals are strings, not translated in this cut`); return null; }
        return s;
    };
    const singleWrites: SmvProperty[] = [];
    for (const t of net.transitions) {
        const fire = `sel = ${selOf.get(t.id)}`;
        const once = new Set<string>();
        // Item 3: the memory writes of the step, each its cells' σ names to their key, and where two may coincide.
        const cellWrites: Array<{ key: SmvText; cells: Map<string, { key: string; constant: string }> }> = [];
        const clashes: string[] = [];
        for (const site of t.actionSites) {
            for (const c of input.actions.get(actionSiteKey(site)) ?? []) {
                if (c.defect !== null || c.action === null) { refuse(site.element, `${nameOf(site.element)}: '${c.source}': action defect: ${c.defect ?? 'no action'}`); continue; }
                const judged = judgeActionTarget(c, site, snapshot);
                if (judged.kind === 'folded') {
                    if (judged.target.onNode) continue;
                    const s = targetOf(t, judged.target.element, judged.target.attr);
                    if (!s) continue;
                    const out = translate(site.element, c.source, c.action.value, () => siteContext(site.element), s.type!);
                    if (out) addWrite(t, s, fire, out.text, once);
                    for (const w of cellWrites) { const hit = w.cells.get(s.name); if (hit) clashes.push(hit.key); }
                    continue;
                }
                if (judged.kind === 'unresolved') { refuse(site.element, `${nameOf(site.element)}: '${c.source}': ${judged.detail}`); continue; }
                const idiom = matchMemoryIdiom(c.action.target);
                if (!idiom || idiom.read.kind !== 'state') { refuse(site.element, `${nameOf(site.element)}: '${c.source}': a target that reads σ outside the memory idiom is not translated`); continue; }
                const attr = idiom.read.attribute;
                try {
                    checkSubset(c.action.target);
                    const ctx = siteContext(site.element);
                    const { key, arms } = keyArms(idiom, ctx, leavesAt(ctx));
                    const cells = new Map<string, { key: string; constant: string }>();
                    for (const a of arms) {
                        const s = targetOf(t, a.cell, attr);
                        if (!s) continue;
                        const out = translate(site.element, c.source, c.action.value, () => ctx, s.type!);
                        // Each cell has its own `next`: its key is tested even for the last cell.
                        if (out) addWrite(t, s, `${fire} & ${a.key}`, out.text, null);
                        cells.set(s.name, { key: a.key, constant: a.constant });
                        if (once.has(s.name)) clashes.push(a.key);
                    }
                    for (const w of cellWrites) {
                        const shared = [...cells].filter(([name]) => w.cells.has(name));
                        if (shared.length === 0) continue;
                        // `e1 = e2` when both keys name the same cells by the same constants, else cell by cell.
                        const same = sameType(key.type, w.key.type) && shared.length === cells.size && shared.length === w.cells.size
                            && shared.every(([name, k]) => w.cells.get(name)!.constant === k.constant);
                        clashes.push(same ? `${key.text} = ${w.key.text}` : `(${shared.map(([name, k]) => `${k.key} & ${w.cells.get(name)!.key}`).join(' | ')})`);
                    }
                    cellWrites.push({ key, cells });
                    const memory = memoryOf(idiom, ctx, attr);
                    addressProperty(`in_range_${selOf.get(t.id)}_${memory.base}_${cellWrites.length}`, memory.element, key, arms);
                } catch (err) {
                    if (!(err instanceof SmvTranslationDefect)) throw err;
                    refuse(site.element, `${nameOf(site.element)}: '${c.source}': ${err.message}`);
                }
            }
        }
        if (once.size + cellWrites.length === 0) continue;
        const name = `single_write_${selOf.get(t.id)}`;
        if (clashes.length > 0) {
            const on = onOf.get(t.id)!;
            singleWrites.push({ name, family: 'single-write', element: t.id, verdict: null,
                text: `INVARSPEC NAME ${name} := !(${on} & ${clashes.length === 1 ? clashes[0] : `(${clashes.join(' | ')})`});` });
            continue;
        }
        const byName = once.size === 0 ? [] : [once.size === 1 ? 'one write by name' : `${once.size} writes by name, to distinct attributes`];
        const byKey = cellWrites.length === 0 ? [] : [cellWrites.length === 1 ? 'one memory write' : `${cellWrites.length} memory writes on distinct cells`];
        singleWrites.push({ name, family: 'single-write', element: t.id, text: null, verdict: { holds: true, reason: [...byName, ...byKey].join(' and ') } });
    }
    const okDefines = net.transitions.filter(t => okOf.has(t.id))
        .map(t => ({ name: claim(`ok_${selOf.get(t.id)}`, `the domains written by ${nameOf(t.id)}`), text: okOf.get(t.id)!.join(' & ') }));

    // ── watches: compiled as the panel compiles them, `self` the model ──
    const specs: string[] = [];
    const specNames = new Set<string>();
    for (const w of input.watches ?? []) {
        const name = smvIdentifier(w.name);
        if (specNames.has(name)) { refuse(null, `two watches are named ${name}`); continue; }
        specNames.add(name);
        const compiled = compileWatch(w, { net, snapshot, nameOf });
        if (compiled.output.defect !== null || compiled.output.expr === null) {
            refuse(null, `the watch ${w.name}: '${w.text}': ${compiled.output.defect?.detail ?? 'no expression'}`);
            continue;
        }
        const out = translate(net.modelId, w.text, compiled.output.expr, modelContext, BOOLEAN);
        if (out) specs.push(`INVARSPEC NAME ${name} := ${w.kind === 'invariant' ? out.text : `!(${out.text})`};`);
    }

    // ── the structural properties (S-G2), on the state only ──
    const some = net.hasEventRole ? 'some_ready' : 'some_enabled';
    const outOf = new Map<string, NetTransition[]>(places.map(p => [p, []]));
    for (const t of net.transitions) outOf.get(t.preset[0].place)?.push(t);
    const unguarded = (t: NetTransition) => (guardOf.get(t.id) ?? 'TRUE') === 'TRUE';
    const holds = (reason: string | null) => (reason === null ? null : { holds: true, reason });
    const lives: SmvProperty[] = [];
    for (const p of places) {
        if (final.has(p)) continue;
        const out = outOf.get(p)!;
        const open = out.find(t => t.elseOf === null && unguarded(t));
        // An else whose siblings are plain transitions out of the same state covers every σ with them.
        const otherwise = out.find(t => t.elseOf !== null && unguarded(t) && t.elseOf.every(id => {
            const u = net.transitions.find(x => x.id === id);
            return u === undefined || (u.elseOf === null && u.preset[0].place === p);
        }));
        const name = `live_${stateOf.get(p)}`;
        lives.push({
            name, family: 'no-deadlock', element: p, text: `INVARSPEC NAME ${name} := state = ${stateOf.get(p)} -> ${some};`,
            verdict: holds(open ? `${nameOf(open.id)} leaves ${nameOf(p)} without a guard`
                : otherwise ? `${nameOf(otherwise.id)} is the else of the other transitions out of ${nameOf(p)}` : null),
        });
    }
    const start = initial[0][0];
    const home = stateOf.get(start)!;
    const homes = new Set([start, ...places.filter(p => final.has(p))]);
    const paths = pathsHome(net.transitions.map(t => ({ id: t.id, from: t.preset[0].place, to: t.postset[0].place })), homes);
    const returns: SmvProperty[] = [
        { name: `returns_${home}`, family: 'returns', element: start, text: `LTLSPEC NAME returns_${home} := G F (state = ${home} | final);`, verdict: null },
    ];
    for (const p of places) {
        if (homes.has(p)) continue;
        const by = paths.get(p);
        returns.push({
            name: `graph_returns_${stateOf.get(p)}`, family: 'returns', element: p, text: null,
            verdict: by ? { holds: true, reason: `${nameOf(p)} reaches ${nameOf(start)} or a final state, first by ${nameOf(by)}` }
                : { holds: false, reason: `${nameOf(p)} reaches neither ${nameOf(start)} nor a final state, guards ignored` },
        });
    }
    const choices: SmvProperty[] = [];
    for (const p of places) {
        const out = outOf.get(p)!;
        for (let i = 0; i < out.length; i++) {
            for (let j = i + 1; j < out.length; j++) {
                const [a, b] = [out[i], out[j]];
                const name = `no_choice_${selOf.get(a.id)}_${selOf.get(b.id)}`;
                // With the event role two transitions compete only under an event both take (ε included).
                const common = !net.hasEventRole || (a.triggers.length === 0 && b.triggers.length === 0) || a.triggers.some(e => b.triggers.includes(e));
                const pair = a.elseOf?.includes(b.id) ? [a, b] : b.elseOf?.includes(a.id) ? [b, a] : null;
                choices.push({
                    name, family: 'no-choice', element: p,
                    text: common ? `INVARSPEC NAME ${name} := !(${onOf.get(a.id)} & ${onOf.get(b.id)});` : null,
                    verdict: holds(final.has(p) ? `${nameOf(p)} is final` : !common ? `${nameOf(a.id)} and ${nameOf(b.id)} have no event in common`
                        : pair ? `${nameOf(pair[0].id)} is the else of ${nameOf(pair[1].id)}` : null),
                });
            }
        }
    }
    const properties: SmvProperty[] = [
        { name: 'no_deadlock', family: 'no-deadlock', element: null, text: `INVARSPEC NAME no_deadlock := final | ${some};`,
            verdict: holds(lives.every(l => l.verdict !== null) ? 'every state that is not final is proved live' : null) },
        { name: 'final_quiescent', family: 'no-deadlock', element: null, text: `INVARSPEC NAME final_quiescent := final -> !${some};`,
            verdict: holds('a transition out of a final state is never enabled (R-SIM-27)') },
        ...lives, ...returns, ...singleWrites, ...choices, ...addresses,
    ];
    for (const p of properties) {
        if (specNames.has(p.name)) refuse(null, `two specs are named ${p.name}`);
        specNames.add(p.name);
    }

    // ── the text ──
    const vars = [...sigma.values()].filter(s => s.role === 'var');
    const inputs = [...sigma.values()].filter(s => s.role === 'input');
    for (const s of vars) if (net.initial.attrs.get(s.element)?.get(s.attr) === undefined) refuse(s.element, `${nameOf(s.element)}.[${s.attr}] has no initial value`);
    if (defects.length > 0) return { kind: 'refused', defects };

    const width = (s: SigmaName) => net.widths?.get(s.element)?.get(s.attr);
    const lines: string[] = [];
    lines.push(`-- ${nameOf(net.modelId)}: a one-token state machine and its state attributes (smvExport, S-G1).`);
    if (input.freeRom === true) lines.push('-- The free-ROM variant (S-G2, R14): a cell\'s feature read through the memory idiom is a FROZENVAR.');
    lines.push('MODULE main');
    lines.push('VAR');
    lines.push(`  state : {${[...states.keys()].join(', ')}};`);
    for (const s of vars) lines.push(`  ${s.name} : ${domainText(s.decl.domain!, width(s))};`);
    if (frozen.size > 0) {
        lines.push('FROZENVAR');
        for (const f of frozen.values()) lines.push(`  ${f.name} : ${typeName(f.type)};`);
    }
    lines.push('IVAR');
    lines.push(`  sel : {${[SMV_NO_SELECTOR, ...transitions.keys()].join(', ')}};`);
    if (net.hasEventRole) lines.push(`  event : {${[SMV_NO_EVENT, ...events.keys()].join(', ')}};`);
    for (const s of inputs) lines.push(`  ${s.name} : ${domainText(s.decl.domain!, width(s))};`);
    lines.push('DEFINE');
    for (const d of [...derivedDefines, ...memoryDefines, ...guardDefines, ...enabling, ...ready, ...okDefines]) lines.push(`  ${d.name} := ${d.text};`);
    lines.push(`  some_enabled := ${enabling.length === 0 ? 'FALSE' : enabling.map(d => d.name).join(' | ')};`);
    if (net.hasEventRole) lines.push(`  some_ready := ${ready.length === 0 ? 'FALSE' : ready.map(d => d.name).join(' | ')};`);
    const finals = places.filter(p => final.has(p)).map(p => `state = ${stateOf.get(p)}`);
    lines.push(`  final := ${finals.length === 0 ? 'FALSE' : finals.join(' | ')};`);
    lines.push('ASSIGN');
    const next = (name: string, arms: readonly Arm[]): void => {
        if (arms.length === 0) { lines.push(`  next(${name}) := ${name};`); return; }
        lines.push(`  next(${name}) := case`);
        for (const a of arms) lines.push(`      ${a.condition} : ${a.value};`);
        lines.push(`      TRUE : ${name};`);
        lines.push('    esac;');
    };
    lines.push(`  init(state) := ${stateOf.get(initial[0][0])};`);
    next('state', net.transitions.map(t => ({ condition: `sel = ${selOf.get(t.id)}`, value: stateOf.get(t.postset[0].place)! })));
    for (const s of vars) {
        lines.push(`  init(${s.name}) := ${valueText(net.initial.attrs.get(s.element)!.get(s.attr)!, s.decl.domain!)};`);
        next(s.name, writes.get(s.name) ?? []);
    }
    lines.push('TRANS');
    lines.push('  case');
    lines.push(`    sel = ${SMV_NO_SELECTOR} : !some_enabled;`);
    for (const t of net.transitions) lines.push(`    sel = ${selOf.get(t.id)} : ${enOf.get(t.id)}${okOf.has(t.id) ? ` & ok_${selOf.get(t.id)}` : ''};`);
    lines.push('  esac;');
    lines.push(...specs);
    lines.push('-- The structural properties, generated from the model (smvExport, S-G2).');
    for (const p of properties) {
        const verdict = p.verdict === null ? null : `${p.verdict.holds ? 'proved by the exporter' : 'fails the exporter\'s check'}: ${p.verdict.reason}`;
        if (p.text === null) lines.push(`-- ${p.name}: ${verdict}`);
        else lines.push(verdict === null ? p.text : `${p.text} -- ${verdict}`);
    }

    const attributes = new Map([...sigma.values()].map(s => [s.name, { element: s.element, attr: s.attr, role: s.role }] as const));
    const frozenNames = new Map([...frozen.values()].map(f => [f.name, { element: f.element, feature: f.feature }] as const));
    return { kind: 'ok', text: lines.join('\n') + '\n', names: { states, transitions, events, attributes, frozen: frozenNames }, properties };
}
