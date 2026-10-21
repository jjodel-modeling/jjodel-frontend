/**
 * access — the target profile a template reads, `target` in its context, for Verilog (hardware demonstrator, slice
 * S-D, route A, plan `docs/discovery/discovery_2026-10-21_hw_demonstrator_plan.md` §8 and §10.1; R-GEN-16).
 *
 * The second target of the engine, in the shape of the JavaScript one (target/js/access.ts): generate.ts binds it to
 * `target` when the entry template's `target` field is `'verilog'`. It reads the run the simulator would start
 * (`compileModelRun`) and prints every expression through the printer of slice S-D0 (printer.ts), so the register
 * transfers Verilator runs are the JjEL texts the simulator runs (§8). A template lays out the module and the
 * testbench; the target names the signals and prints the values:
 * - `name`: `'verilog'`; `module`: the model's name, the module's;
 * - `state`: the control state variable, `{ name: 'state', width, type }`, one code per place;
 * - `states`: the places in compile order, each `{ id, name, code, final, transitions }`, `code` the sized literal
 *   of its index, which is the trace's state number (plan §7.4); `transitions` the transitions leaving it, the
 *   guarded ones in compile order and then the `else`, each `{ id, name, next, guarded, otherwise, first }`, `next`
 *   the name of the place it enters;
 * - `registers`: the stored words of σ that are no memory word, in model order, `{ element, attr, name, width,
 *   signed, type }`, `type` the text after `reg` (`[7:0]`, `signed [7:0]`);
 * - `memories`: the collections a memory idiom reads or writes (`rom.cells`, memoryIdiom.ts), in the order the
 *   run first reads them, `{ name, kind, width, signed, type, depth, range }`: a `ram` holds a σ word per element,
 *   a `rom` the feature the idiom reads under `bits(w, …)`, frozen data;
 * - `initial`: the statements of an `initial` block that give the configuration Reset gives, one per line: the
 *   initial place, every register, every word of every memory (a RAM's from σ, a ROM's from its feature);
 * - `final`: the condition that the control state is a final place, `1'b0` when the model has none;
 * - `guard(t)`: the condition of a guarded transition, its guards conjoined;
 * - `actions(t)`: the nonblocking assignments of a transition, one per line, its action sites in the order the
 *   simulator applies them in one parallel assignment (exit, its own, entry; netTypes.ts `ActionSite`).
 * A transition is one clock cycle (plan §8 D2): a guard reads the registers before the edge, as the simulator reads
 * σ before the step, and the nonblocking assignments write them after it, as its parallel assignment does. The
 * guards of a place are tried in order, the first that holds fires: exclusive guards give the simulator's step.
 *
 * What route A cannot print is refused, naming the element: at construction (`VerilogPrintDefect`, which generate.ts
 * reports on the entry) a place or a register without a Verilog name, a transition that is not one place to one
 * place without trigger, a place with an unguarded transition among others, a memory whose keys are not distinct
 * indices; at the hole (an error fragment, origin.ts) a guard or an action the printer refuses.
 *
 * Pure: JjEL, the simulator's core and the printer.
 */

import { createFunction } from '../../../jjel';
import type { JjelValue } from '../../../jjel';
import { makeBitVector, toVerilog } from '../../../jjel/evaluator/builtins/bitvectors';
import { isBitVector } from '../../../jjel/evaluator/context';
import type { JjelBitVector } from '../../../jjel/evaluator/context';
import type { JjelAction, JjelExpression } from '../../../jjel/types/ast';
import { actionSiteKey } from '../../../model/simulation/actionEvaluator';
import type { CompiledAction } from '../../../model/simulation/actionEvaluator';
import { matchMemoryIdiom } from '../../../model/simulation/memoryIdiom';
import type { MemoryIdiom } from '../../../model/simulation/memoryIdiom';
import type { NetTransition } from '../../../model/simulation/netTypes';
import { literalArgument } from '../../../model/simulation/stateAttributesCodec';
import { compileModelRun } from '../js/access';
import type { ModelRun } from '../js/access';
import { VerilogPrintDefect, printVerilog, printVerilogAction } from './printer';
import type { VerilogNames, VerilogSignal } from './printer';

type Lookup = Record<string, any>;
type Handle = Record<string, unknown>;

/** The name of this target profile, and the value of a template's `target` field that binds it (generate.ts). */
export const VERILOG_TARGET_NAME = 'verilog';

/** The control state variable of the module. */
const STATE = 'state';

/** The keywords of IEEE 1364-2005 (Annex B), which no signal or place may be named. */
const KEYWORDS = new Set((
    'always and assign automatic begin buf bufif0 bufif1 case casex casez cell cmos config deassign default defparam '
    + 'design disable edge else end endcase endconfig endfunction endgenerate endmodule endprimitive endspecify '
    + 'endtable endtask event for force forever fork function generate genvar highz0 highz1 if ifnone incdir include '
    + 'initial inout input instance integer join large liblist library localparam macromodule medium module nand '
    + 'negedge nmos nor noshowcancelled not notif0 notif1 or output parameter pmos posedge primitive pull0 pull1 '
    + 'pulldown pullup pulsestyle_onevent pulsestyle_ondetect rcmos real realtime reg release repeat rnmos rpmos rtran '
    + 'rtranif0 rtranif1 scalared showcancelled signed small specify specparam strong0 strong1 supply0 supply1 table '
    + 'task time tran tranif0 tranif1 tri tri0 tri1 triand trior trireg unsigned use uwire vectored wait wand weak0 '
    + 'weak1 while wire wor xnor xor logic bit byte int'
).split(' '));

const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_$]*$/;

/** A memory of the run: a collection `X.f` of the model a memory idiom selects a word of. */
interface Memory {
    readonly key: string;
    readonly name: string;
    readonly kind: 'ram' | 'rom';
    /** The σ attribute (ram) or the feature (rom) the idiom reads. */
    readonly read: string;
    readonly width: number;
    readonly signed: boolean;
    /** Element id → index, from the key feature. */
    readonly words: ReadonlyMap<string, number>;
    readonly depth: number;
}

/** What the scan of the run's texts found of one collection. */
interface MemoryUse {
    readonly owner: string;
    readonly collection: string;
    readonly feature: string;
    readonly keyFeature: string;
    readonly reads: Set<string>;
    /** `bits(w, …)` / `sbits(w, …)` around a ROM read: the word type it asks. */
    readonly words: Array<{ width: number; signed: boolean }>;
}

/** The id of a site a template passes: an element id, or an object that carries one. */
function idOf(x: unknown): string {
    if (typeof x === 'string') return x;
    const id = x && typeof x === 'object' ? (x as Record<string, unknown>).id ?? (x as Record<string, unknown>).element : undefined;
    return typeof id === 'string' ? id : '';
}

/** `[w-1:0]`, under `signed` when the word is. */
function wordType(width: number, signed: boolean): string {
    return `${signed ? 'signed ' : ''}[${width - 1}:0]`;
}

/** Every node of a JjEL tree, `location` left out. */
function* nodes(node: unknown): Generator<Record<string, unknown>> {
    if (Array.isArray(node)) {
        for (const n of node) yield* nodes(n);
        return;
    }
    if (node === null || typeof node !== 'object') return;
    const n = node as Record<string, unknown>;
    if (typeof n.type === 'string') yield n;
    for (const k of Object.keys(n)) if (k !== 'location') yield* nodes(n[k]);
}

/** The handle a name binds in the model's record, when it is an object of the model. */
function bound(globals: Record<string, JjelValue>, name: string): Handle | null {
    const h = Object.prototype.hasOwnProperty.call(globals, name) ? (globals[name] as unknown) : undefined;
    return h && typeof h === 'object' && !Array.isArray(h) && typeof (h as Handle).id === 'string' ? (h as Handle) : null;
}

/** `X.f` of a memory idiom, X a name the record binds: the owner's id and the feature; `null` otherwise. */
function collectionOf(m: MemoryIdiom, globals: Record<string, JjelValue>): { owner: Handle; name: string; feature: string } | null {
    const c = m.collection;
    if (c.type !== 'MemberAccess' || c.object.type !== 'Identifier') return null;
    const owner = bound(globals, c.object.name);
    return owner ? { owner, name: c.object.name, feature: c.property } : null;
}

/** The trees of the run's guards and actions, in compile order. */
function runTrees(run: ModelRun): unknown[] {
    const out: unknown[] = [];
    for (const list of run.guards.values()) for (const g of list) if (g.expr) out.push(g.expr);
    for (const list of run.actions.values()) for (const a of list) if (a.action) out.push((a.action as JjelAction).target, (a.action as JjelAction).value);
    return out;
}

/** The collections the run's memory idioms select from, with what they read of them. */
function scanMemories(run: ModelRun, globals: Record<string, JjelValue>): Map<string, MemoryUse> {
    const uses = new Map<string, MemoryUse>();
    const use = (m: MemoryIdiom): MemoryUse | null => {
        const c = collectionOf(m, globals);
        if (!c) return null;
        const key = `${String(c.owner.id)}.${c.feature}`;
        let u = uses.get(key);
        if (!u) {
            u = { owner: String(c.owner.id), collection: `${c.name}.${c.feature}`, feature: c.feature, keyFeature: m.keyFeature, reads: new Set(), words: [] };
            uses.set(key, u);
        }
        if (u.keyFeature !== m.keyFeature) throw new VerilogPrintDefect(`${u.collection} is indexed by ${u.keyFeature} and by ${m.keyFeature}`);
        u.reads.add(m.read.kind === 'state' ? `[${m.read.attribute}]` : m.read.feature);
        return u;
    };
    for (const tree of runTrees(run)) {
        for (const n of nodes(tree)) {
            const e = n as unknown as JjelExpression;
            if (e.type === 'FunctionCall' && (e.name === 'bits' || e.name === 'sbits') && e.args.length === 2) {
                const m = matchMemoryIdiom(e.args[1]);
                const w = literalArgument(e.args[0]);
                if (m && m.read.kind === 'feature' && typeof w === 'number') use(m)?.words.push({ width: w, signed: e.name === 'sbits' });
                continue;
            }
            const m = matchMemoryIdiom(e);
            if (m) use(m);
        }
    }
    return uses;
}

/** A Verilog name for an element of the model: a legal identifier that is no keyword. */
function verilogName(name: string, what: string): string {
    if (!IDENTIFIER.test(name) || KEYWORDS.has(name)) throw new VerilogPrintDefect(`${what} has no Verilog name: '${name}' is not an identifier or is a keyword`);
    return name;
}

/** The memories of the run, from the scan: their words, indices and word type. */
function buildMemories(uses: Map<string, MemoryUse>, run: ModelRun, lookup: Lookup): Memory[] {
    const out: Memory[] = [];
    const initial = run.net.initial;
    for (const [key, u] of uses) {
        const owner = run.snapshot.handleById.get(u.owner) as Handle | undefined;
        const elements = Array.isArray(owner?.[u.feature]) ? (owner![u.feature] as Handle[]) : [];
        const reads = [...u.reads];
        if (reads.length !== 1) throw new VerilogPrintDefect(`${u.collection} is read as ${reads.join(' and ')}: a memory holds one word per element`);
        const read = reads[0];
        const kind = read.startsWith('[') ? 'ram' : 'rom';
        const words = new Map<string, number>();
        for (const h of elements) {
            const index = h?.[u.keyFeature];
            const id = String(h?.id ?? '');
            if (typeof index !== 'number' || !Number.isInteger(index) || index < 0) {
                throw new VerilogPrintDefect(`${String(lookup[id]?.name ?? id)} of ${u.collection} has no index: its ${u.keyFeature} is ${JSON.stringify(index ?? null)}`);
            }
            if ([...words.values()].includes(index)) throw new VerilogPrintDefect(`${u.collection} has two words at ${u.keyFeature} ${index}`);
            words.set(id, index);
        }
        if (words.size === 0) throw new VerilogPrintDefect(`${u.collection} has no word`);
        let width: number;
        let signed: boolean;
        if (kind === 'ram') {
            const attr = read.slice(1, -1);
            const types = [...words.keys()].map(id => initial.attrs.get(id)?.get(attr));
            const first = types[0];
            if (!types.every(v => isBitVector(v) && isBitVector(first) && v.width === first.width && v.signed === first.signed)) {
                throw new VerilogPrintDefect(`the words of ${u.collection} are not stored words of one width: [${attr}] is not a word of every element`);
            }
            width = (first as JjelBitVector).width;
            signed = (first as JjelBitVector).signed;
        } else {
            const asked = u.words;
            if (asked.length === 0 || asked.some(w => w.width !== asked[0].width || w.signed !== asked[0].signed)) {
                throw new VerilogPrintDefect(`${u.collection}.${read} is not read as words of one width: write bits(w, …) around every read`);
            }
            width = asked[0].width;
            signed = asked[0].signed;
        }
        const name = verilogName(u.collection.split('.')[0].toLowerCase(), `the memory ${u.collection}`);
        out.push({ key, name, kind, read: kind === 'ram' ? read.slice(1, -1) : read, width, signed, words, depth: Math.max(...words.values()) + 1 });
    }
    return out;
}

/**
 * The `target` value of a Verilog template's context: `null` when the model has no STC or M cannot be frozen, as
 * for JavaScript; a `VerilogPrintDefect` when the run has a shape route A does not print.
 */
export function verilogTarget(globals: Record<string, JjelValue>, lookup: Lookup, modelId: string): JjelValue | null {
    const compiled = compileModelRun(lookup, modelId, globals);
    if (compiled.kind !== 'ok') return null;
    const run = compiled.run;
    const net = run.net;
    const nameOf = (id: string) => String(lookup[id]?.name ?? id);

    // The memories, then the registers: every stored word of σ on an element that is no memory word.
    const memories = buildMemories(scanMemories(run, globals), run, lookup);
    const memoryWords = new Set(memories.flatMap(m => [...m.words.keys()]));
    const registers: Array<{ element: string; attr: string; name: string; width: number; signed: boolean; type: string; initial: JjelBitVector }> = [];
    for (const [element, byName] of net.declared) {
        if (memoryWords.has(element)) continue;
        for (const [attr, decl] of byName) {
            const value = net.initial.attrs.get(element)?.get(attr);
            if (decl.space !== 'semantic' || decl.equation !== undefined || !isBitVector(value)) continue;
            const base = attr === 'value' ? nameOf(element) : `${nameOf(element)}_${attr}`;
            const name = verilogName(base.toLowerCase(), `the register ${nameOf(element)}.[${attr}]`);
            registers.push({ element, attr, name, width: value.width, signed: value.signed, type: wordType(value.width, value.signed), initial: value });
        }
    }

    // The places, their codes, and the transitions leaving each.
    const places = [...net.places];
    const width = Math.max(1, Math.ceil(Math.log2(places.length)));
    const code = new Map(places.map((p, i) => [p, toVerilog(makeBitVector('bits', [width, i]))]));
    const byPlace = new Map<string, NetTransition[]>(places.map(p => [p, []]));
    for (const t of net.transitions) {
        const ok = t.preset.length === 1 && t.postset.length === 1 && t.preset[0].weight === 1 && t.postset[0].weight === 1
            && t.inhibitors.length === 0 && t.triggers.length === 0;
        if (!ok) throw new VerilogPrintDefect(`${t.origin.map(nameOf).join(' + ') || nameOf(t.id)} is not one place to one place without trigger: route A prints a single control state`);
        byPlace.get(t.preset[0].place)?.push(t);
    }
    const guarded = (t: NetTransition) => t.guardSites.some(site => (run.guards.get(site)?.length ?? 0) > 0);
    const states = places.map(p => {
        const out = byPlace.get(p) ?? [];
        const ordered = [...out.filter(t => t.elseOf === null && guarded(t)), ...out.filter(t => t.elseOf !== null)];
        if (ordered.length !== out.length && out.length > 1) {
            throw new VerilogPrintDefect(`${nameOf(p)} has a transition without guard among ${out.length}: which one fires is not determined`);
        }
        const list = out.length === 1 ? out : ordered;
        return {
            id: p,
            name: verilogName(nameOf(p), `the state ${nameOf(p)}`),
            code: code.get(p) as string,
            final: net.final?.has(p) ?? false,
            transitions: list.map((t, i) => ({
                id: t.id,
                name: t.origin.length > 0 ? t.origin.map(nameOf).join(' + ') : nameOf(t.id),
                next: nameOf(t.postset[0].place),
                guarded: t.elseOf === null && guarded(t),
                otherwise: t.elseOf !== null,
                first: i === 0,
            })),
        };
    });
    const taken = new Map<string, string>();
    for (const [n, what] of [[STATE, 'the control state variable'], ['clk', 'the clock'], ['cycle', 'the testbench\'s cycle count'], ...states.map(s => [s.name, `the state ${s.name}`]),
        ...registers.map(r => [r.name, `the register ${nameOf(r.element)}`]), ...memories.map(m => [m.name, `the memory ${m.name}`])] as Array<[string, string]>) {
        const other = taken.get(n);
        if (other !== undefined) throw new VerilogPrintDefect(`${what} and ${other} have one Verilog name, '${n}'`);
        taken.set(n, what);
    }

    // The initial configuration: one marked place, then σ and the ROM data.
    const marked = [...net.initial.marking].filter(([, n]) => n > 0);
    if (marked.length !== 1 || marked[0][1] !== 1) throw new VerilogPrintDefect(`the initial configuration marks ${marked.length} places: route A prints a single control state`);
    const initial: string[] = [`${STATE} = ${nameOf(marked[0][0])};`];
    for (const r of registers) initial.push(`${r.name} = ${toVerilog(r.initial)};`);
    for (const m of memories) {
        const words = [...m.words].sort((a, b) => a[1] - b[1]);
        for (const [id, index] of words) {
            let value: unknown;
            if (m.kind === 'ram') value = net.initial.attrs.get(id)?.get(m.read);
            else {
                const handle = run.snapshot.handleById.get(id) as Handle | undefined;
                try {
                    value = makeBitVector(m.signed ? 'sbits' : 'bits', [m.width, handle?.[m.read] as JjelValue]);
                } catch (e) {
                    throw new VerilogPrintDefect(`${nameOf(id)}.${m.read} is no word of ${m.width} bits: ${(e as Error).message}`);
                }
            }
            if (!isBitVector(value)) throw new VerilogPrintDefect(`${nameOf(id)} has no initial word`);
            initial.push(`${m.name}[${index}] = ${toVerilog(value)};`);
        }
    }

    // The names the printer asks: a σ read `X.[a]` of a register, a memory idiom's collection.
    const registerOf = new Map(registers.map(r => [`${r.element}\u0000${r.attr}`, r]));
    const memoryOf = new Map(memories.map(m => [m.key, m]));
    const names: VerilogNames = {
        leaf: (e): VerilogSignal | null => {
            if (e.type !== 'StateAccess' || e.object.type !== 'Identifier') return null;
            const h = bound(globals, e.object.name);
            const r = h ? registerOf.get(`${String(h.id)}\u0000${e.attribute}`) : undefined;
            return r ? { name: r.name, width: r.width, signed: r.signed } : null;
        },
        memory: (m): VerilogSignal | null => {
            const c = collectionOf(m, globals);
            const mem = c ? memoryOf.get(`${String(c.owner.id)}.${c.feature}`) : undefined;
            return mem ? { name: mem.name, width: mem.width, signed: mem.signed } : null;
        },
    };

    const transitionOf = new Map(net.transitions.map(t => [t.id, t]));
    const transition = (x: unknown): NetTransition => {
        const t = transitionOf.get(idOf(x));
        if (!t) throw new Error(`No transition '${idOf(x)}' in the model`);
        return t;
    };
    const guard = (x: unknown): string => {
        const t = transition(x);
        const printed: string[] = [];
        for (const site of t.guardSites) {
            for (const g of run.guards.get(site) ?? []) {
                if (g.defect) throw new Error(`The guard of ${nameOf(site)}, '${g.source}', is a defect: ${g.defect.detail}`);
                if (g.expr === null) continue;
                let out;
                try {
                    out = printVerilog(g.expr, names);
                } catch (e) {
                    throw new Error(`The guard of ${nameOf(site)}, '${g.source}', has no Verilog: ${(e as Error).message}`);
                }
                if (out.type.kind !== 'boolean') throw new Error(`The guard of ${nameOf(site)}, '${g.source}', is not a condition`);
                printed.push(out.text);
            }
        }
        if (printed.length === 0) throw new Error(`${nameOf(t.id)} has no guard`);
        return printed.length === 1 ? printed[0] : printed.map(p => `(${p})`).join(' && ');
    };
    const actions = (x: unknown): string => {
        const t = transition(x);
        const lines: string[] = [];
        for (const site of t.actionSites) {
            const list: readonly CompiledAction[] = run.actions.get(actionSiteKey(site)) ?? [];
            for (const c of list) {
                if (c.defect !== null || c.action === null) throw new Error(`The action '${c.source}' of ${nameOf(site.element)} is a defect: ${c.defect ?? 'it does not parse'}`);
                try {
                    lines.push(printVerilogAction(c.action, names));
                } catch (e) {
                    throw new Error(`The action '${c.source}' of ${nameOf(site.element)} has no Verilog: ${(e as Error).message}`);
                }
            }
        }
        return lines.join('\n');
    };
    const finals = states.filter(s => s.final).map(s => `${STATE} == ${s.code}`);
    const fn = (f: (x: unknown) => string): JjelValue => createFunction(['site'], ([x]) => f(x) as JjelValue) as unknown as JjelValue;

    return Object.freeze({
        __type: 'Target',
        name: VERILOG_TARGET_NAME,
        module: verilogName(nameOf(modelId), `the model ${nameOf(modelId)}`),
        state: deepFreeze({ name: STATE, width, type: wordType(width, false) }),
        states: deepFreeze(states),
        registers: deepFreeze(registers.map(({ initial: _initial, ...r }) => r)),
        memories: deepFreeze(memories.map(m => ({ name: m.name, kind: m.kind, width: m.width, signed: m.signed, type: wordType(m.width, m.signed), depth: m.depth, range: `[0:${m.depth - 1}]` }))),
        initial: initial.join('\n'),
        final: finals.length === 0 ? "1'b0" : finals.join(' || '),
        guard: fn(guard),
        actions: fn(actions),
    }) as unknown as JjelValue;
}

/** Freezes `value` and every object and array under it. Only for what this module builds. */
function deepFreeze<T>(value: T): T {
    if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
        Object.freeze(value);
        for (const v of Object.values(value)) deepFreeze(v);
    }
    return value;
}
