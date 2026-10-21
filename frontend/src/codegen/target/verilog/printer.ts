/**
 * Verilog target: the register-transfer subset of JjEL as SystemVerilog text
 * (hardware demonstrator, slice S-D0, plan
 * `docs/discovery/discovery_2026-10-21_hw_demonstrator_plan.md` §8 and §10.1).
 *
 * The second target R-GEN-16 anticipated. The Verilog of a register transfer
 * is printed from the JjEL text the simulator runs, so that Jjodel and
 * Verilator run the same program by construction (§8).
 *
 * The subset: σ reads `X.[a]` and the memory idiom
 * `coll.filter(c => c.F == E).first.X` (`model/simulation/memoryIdiom.ts`),
 * printed `x`, `ram[e]`, `rom[e]` with the `toNumber` of the key dropped;
 * `bits`/`sbits` constants (`toVerilog`, §7.2); the 24 operators of
 * `oracle.mapping` in `src/jjel/__tests__/fixtures/bv-cases.json`, each in the
 * form that table records and Verilator checked (R-BV-10); `if … then … else`
 * (`c ? a : b`); an action `X.[a] := e` as `x <= e;`. Anything else is a
 * `VerilogPrintDefect` that names the element.
 *
 * The width trap: JjEL widths are exact (R-BV-3), Verilog widths are
 * context-determined (IEEE 1800-2017 §11.6), so `a + b` read in a wider
 * context keeps the carry. Every operator result that is the operand of
 * another operator is wrapped in a self-determined concatenation `{…}`, under
 * `$signed(…)` when the JjEL value is signed (a concatenation is unsigned,
 * §11.8.1), and through a size cast `W'(…)` (§6.24.1) when its text is not of
 * its own width (`zext`, `sext`, `trunc`). The text of the whole expression is
 * exact in a context of its own width: the right-hand side of an assignment to
 * a variable of that width, which is where an action puts it.
 *
 * Pure. Widths, indices and shift amounts must be literals, as in `bvToSmv.ts`.
 */

import { parseAction, parseExpressionStrict } from '../../../jjel/parser';
import { makeBitVector, toVerilog } from '../../../jjel/evaluator/builtins/bitvectors';
import { literalArgument } from '../../../model/simulation/stateAttributesCodec';
import { matchMemoryIdiom } from '../../../model/simulation/memoryIdiom';
import type { JjelAction, JjelExpression } from '../../../jjel/types/ast';
import type { MemoryIdiom } from '../../../model/simulation/memoryIdiom';

export type VerilogType =
    | { readonly kind: 'word'; readonly width: number; readonly signed: boolean }
    | { readonly kind: 'boolean' };

/** A printed expression: its Verilog text and its JjEL type. */
export interface VerilogText {
    readonly text: string;
    readonly type: VerilogType;
}

/** A Verilog variable, or the words of a memory: its name, word width and signedness. */
export interface VerilogSignal {
    readonly name: string;
    readonly width: number;
    readonly signed: boolean;
}

/**
 * How the model's elements are named in Verilog. `leaf` is asked first at
 * every node (a σ read `PC.[value]`, a bound name) and returns `null` when the
 * node is not one; `memory` names the memory an idiom reads or writes.
 */
export interface VerilogNames {
    readonly leaf: (e: JjelExpression) => VerilogSignal | null;
    readonly memory: (m: MemoryIdiom) => VerilogSignal | null;
}

export class VerilogPrintDefect extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'VerilogPrintDefect';
    }
}

type Word = { readonly kind: 'word'; readonly width: number; readonly signed: boolean };

/**
 * `name`: an identifier or a memory word, selectable with `[hi:lo]`. `atom`:
 * self-determined, of the width and signedness of `type`. `open`: an operator
 * text, exact in a context of `type.width` bits; `own` is its width on its own.
 */
interface Printed extends VerilogText {
    readonly form: 'name' | 'atom' | 'open';
    readonly own: number;
}

type PrintedWord = Printed & { readonly type: Word };

const BOOLEAN: VerilogType = { kind: 'boolean' };

function word(width: number, signed: boolean): Word {
    return { kind: 'word', width, signed };
}

function typeText(t: VerilogType): string {
    return t.kind === 'word' ? `${t.signed ? 'signed ' : ''}word[${t.width}]` : 'boolean';
}

function sameType(a: VerilogType, b: VerilogType): boolean {
    return a.kind === b.kind && (a.kind !== 'word' || (b.kind === 'word' && a.width === b.width && a.signed === b.signed));
}

/** A short name of the element, for a defect. */
function describe(e: JjelExpression): string {
    switch (e.type) {
        case 'Identifier': return e.name;
        case 'Literal': return JSON.stringify(e.value);
        case 'StateAccess': return `${describe(e.object)}.[${e.attribute}]`;
        case 'MemberAccess': return `${describe(e.object)}.${e.property}`;
        case 'MethodCall': return `${describe(e.object)}.${e.method}(…)`;
        case 'FunctionCall': return `${e.name}(…)`;
        case 'Binary': return `'${e.operator}'`;
        case 'Unary': return `'${e.operator}'`;
        default: return e.type;
    }
}

function asWord(label: string, x: Printed): PrintedWord {
    if (x.type.kind !== 'word') throw new VerilogPrintDefect(`${label} needs a word, got ${typeText(x.type)}`);
    return x as PrintedWord;
}

function literalInt(label: string, name: string, e: JjelExpression, min: number, max: number): number {
    const v = literalArgument(e);
    if (typeof v !== 'number' || !Number.isInteger(v) || v < min || v > max) {
        throw new VerilogPrintDefect(`${label}: ${name} must be a literal integer from ${min} to ${max}`);
    }
    return v;
}

function arity(label: string, args: readonly JjelExpression[], n: number): void {
    if (args.length !== n) throw new VerilogPrintDefect(`${label} expects ${n} argument${n === 1 ? '' : 's'}, got ${args.length}`);
}

/** `x` as an unsigned self-determined operand of its width. */
function unsignedOperand(x: PrintedWord): string {
    if (x.form === 'open') return x.own === x.type.width ? `{${x.text}}` : `{${x.type.width}'(${x.text})}`;
    return x.type.signed ? `$unsigned(${x.text})` : x.text;
}

/** `x` as a signed self-determined operand of its width. */
function signedOperand(x: PrintedWord): string {
    return x.form !== 'open' && x.type.signed ? x.text : `$signed(${unsignedOperand(x)})`;
}

/** `x` as the operand of another operator: self-determined, of its width and signedness. */
function operand(x: Printed): string {
    if (x.type.kind === 'boolean') return x.form === 'open' ? `(${x.text})` : x.text;
    const w = x as PrintedWord;
    return w.type.signed ? signedOperand(w) : unsignedOperand(w);
}

function open(text: string, type: VerilogType, own: number): Printed {
    return { text, type, form: 'open', own };
}

function atom(text: string, type: Word): Printed {
    return { text, type, form: 'atom', own: type.width };
}

/** The index of a memory word: `x.toNumber()` with `toNumber` dropped, or a literal integer. */
function memoryKey(e: JjelExpression, names: VerilogNames): string {
    const n = literalArgument(e);
    if (typeof n === 'number' && Number.isInteger(n) && n >= 0) return String(n);
    let x: JjelExpression | null = null;
    if (e.type === 'MethodCall' && e.method === 'toNumber' && e.args.length === 0) x = e.object;
    else if (e.type === 'MemberAccess' && e.property === 'toNumber') x = e.object;
    if (!x) throw new VerilogPrintDefect(`the key ${describe(e)} of a memory idiom must be \`x.toNumber()\` or a literal integer`);
    const k = asWord(`the key ${describe(e)}`, print(x, names));
    if (k.type.signed) throw new VerilogPrintDefect(`the key ${describe(e)} of a memory idiom is signed`);
    return unsignedOperand(k);
}

/** `mem[key]`; `expected` is the type the context asks of the word, when it asks one. */
function memoryWord(m: MemoryIdiom, names: VerilogNames, expected: Word | null): Printed {
    const mem = names.memory(m);
    if (!mem) throw new VerilogPrintDefect(`${describe(m.collection)} names no memory`);
    const type = word(mem.width, mem.signed);
    if (expected && !sameType(type, expected)) {
        throw new VerilogPrintDefect(`${describe(m.collection)} holds ${typeText(type)}, read as ${typeText(expected)}`);
    }
    return { text: `${mem.name}[${memoryKey(m.key, names)}]`, type, form: 'name', own: mem.width };
}

/** `bits(w, n)` / `sbits(w, n)` with literal arguments, or `bits(w, <ROM idiom>)`. */
function constant(fn: 'bits' | 'sbits', args: readonly JjelExpression[], names: VerilogNames): Printed {
    const values = args.map(literalArgument);
    if (args.length === 2 && values[1] === null) {
        const m = matchMemoryIdiom(args[1]);
        if (m && m.read.kind === 'feature') {
            const w = literalInt(`${fn}(…)`, 'the width', args[0], 1, Number.MAX_SAFE_INTEGER);
            return memoryWord(m, names, word(w, fn === 'sbits'));
        }
    }
    if (values.some(v => v === null)) throw new VerilogPrintDefect(`${fn}(…) needs literal arguments or a memory idiom`);
    let v;
    try {
        v = makeBitVector(fn, values as Array<number | string>);
    } catch (err) {
        throw new VerilogPrintDefect((err as Error).message);
    }
    return atom(toVerilog(v), word(v.width, v.signed));
}

const ARITHMETIC = new Set(['+', '-', '*']);
const COMPARISON = new Set(['==', '!=', '<', '<=', '>', '>=']);

function binary(op: string, a: Printed, b: Printed): Printed {
    const label = `'${op}'`;
    if (!ARITHMETIC.has(op) && !COMPARISON.has(op)) throw new VerilogPrintDefect(`${label} has no Verilog form`);
    const x = asWord(label, a);
    const y = asWord(label, b);
    if (!sameType(x.type, y.type)) {
        throw new VerilogPrintDefect(`${label} needs two words of one type, got ${typeText(x.type)} and ${typeText(y.type)}`);
    }
    const text = `${operand(x)} ${op} ${operand(y)}`;
    return COMPARISON.has(op) ? open(text, BOOLEAN, 1) : open(text, x.type, x.type.width);
}

function method(e: JjelExpression, receiver: JjelExpression, name: string, args: readonly JjelExpression[], names: VerilogNames): Printed {
    const label = describe(e);
    const x = asWord(label, print(receiver, names));
    const { width, signed } = x.type;
    const shift = (): number => {
        arity(label, args, 1);
        return literalInt(label, 'the amount', args[0], 0, Number.MAX_SAFE_INTEGER);
    };
    const pairWith = (op: string): Printed => {
        arity(label, args, 1);
        const y = asWord(label, print(args[0], names));
        if (!sameType(x.type, y.type)) {
            throw new VerilogPrintDefect(`${label} needs two words of one type, got ${typeText(x.type)} and ${typeText(y.type)}`);
        }
        return open(`${operand(x)} ${op} ${operand(y)}`, x.type, width);
    };
    switch (name) {
        case 'and': return pairWith('&');
        case 'or': return pairWith('|');
        case 'xor': return pairWith('^');
        case 'not': arity(label, args, 0); return open(`~${operand(x)}`, x.type, width);
        case 'shl': return open(`${operand(x)} << 32'd${shift()}`, x.type, width);
        case 'shr': return open(`${operand(x)} >> 32'd${shift()}`, x.type, width);
        // Verilog `>>>` is arithmetic only on a signed operand (§11.4.10); JjEL copies the top bit whatever the signedness.
        case 'ashr': return open(`${signedOperand(x)} >>> 32'd${shift()}`, x.type, width);
        // A part-select applies to a name only; anything else is shifted down and cut by a size cast.
        case 'slice': {
            arity(label, args, 2);
            const hi = literalInt(label, 'hi', args[0], 0, width - 1);
            const lo = literalInt(label, 'lo', args[1], 0, hi);
            const type = word(hi - lo + 1, false);
            if (x.form === 'name') return atom(`${x.text}[${hi}:${lo}]`, type);
            const u = unsignedOperand(x);
            return atom(`${type.width}'(${lo === 0 ? u : `${u} >> 32'd${lo}`})`, type);
        }
        case 'bit': {
            arity(label, args, 1);
            const i = literalInt(label, 'i', args[0], 0, width - 1);
            if (x.form === 'name') return atom(`${x.text}[${i}]`, word(1, false));
            const u = unsignedOperand(x);
            return atom(`1'(${i === 0 ? u : `${u} >> 32'd${i}`})`, word(1, false));
        }
        case 'concat': {
            if (args.length < 1) throw new VerilogPrintDefect(`${label} expects at least 1 argument, got 0`);
            const parts = [x, ...args.map(a => asWord(label, print(a, names)))];
            const total = parts.reduce((n, p) => n + p.type.width, 0);
            return atom(`{${parts.map(operand).join(', ')}}`, word(total, false));
        }
        case 'replicate': {
            arity(label, args, 1);
            const n = literalInt(label, 'n', args[0], 1, Number.MAX_SAFE_INTEGER);
            return atom(`{${n}{${operand(x)}}}`, word(n * width, false));
        }
        // The extensions and the truncation are exact in a context of the result width; `operand` sizes them otherwise.
        case 'zext': {
            arity(label, args, 1);
            const t = literalInt(label, 'the width', args[0], width, Number.MAX_SAFE_INTEGER);
            return open(unsignedOperand(x), word(t, signed), width);
        }
        case 'sext': {
            arity(label, args, 1);
            const t = literalInt(label, 'the width', args[0], width, Number.MAX_SAFE_INTEGER);
            return open(signedOperand(x), word(t, signed), width);
        }
        case 'trunc': {
            arity(label, args, 1);
            const t = literalInt(label, 'the width', args[0], 1, width);
            return open(x.text, word(t, signed), x.own);
        }
        default:
            throw new VerilogPrintDefect(`${label} has no Verilog form`);
    }
}

function print(e: JjelExpression, names: VerilogNames): Printed {
    const leaf = names.leaf(e);
    if (leaf) return { text: leaf.name, type: word(leaf.width, leaf.signed), form: 'name', own: leaf.width };
    switch (e.type) {
        case 'FunctionCall':
            if (e.name === 'bits' || e.name === 'sbits') return constant(e.name, e.args, names);
            break;
        case 'StateAccess': {
            const m = matchMemoryIdiom(e);
            if (m) return memoryWord(m, names, null);
            throw new VerilogPrintDefect(`${describe(e)} names no register`);
        }
        case 'Unary':
            if (e.operator === '-') {
                const x = asWord(`'-'`, print(e.operand, names));
                return open(`-${operand(x)}`, x.type, x.type.width);
            }
            break;
        case 'Binary':
            return binary(e.operator, print(e.left, names), print(e.right, names));
        case 'MethodCall':
            return method(e, e.object, e.method, e.args, names);
        case 'MemberAccess':
            // `x.not`: the zero-argument form of `x.not()` (S1).
            if (e.property === 'not') return method(e, e.object, 'not', [], names);
            break;
        case 'IfThenElse': {
            if (!e.elseBranch) throw new VerilogPrintDefect(`if … then … needs an else`);
            const c = print(e.condition, names);
            if (c.type.kind !== 'boolean') throw new VerilogPrintDefect(`the condition of if … then … else needs a boolean, got ${typeText(c.type)}`);
            const a = asWord('if … then … else', print(e.thenBranch, names));
            const b = asWord('if … then … else', print(e.elseBranch, names));
            if (!sameType(a.type, b.type)) {
                throw new VerilogPrintDefect(`if … then … else needs two branches of one type, got ${typeText(a.type)} and ${typeText(b.type)}`);
            }
            return open(`${operand(c)} ? ${operand(a)} : ${operand(b)}`, a.type, a.type.width);
        }
        default:
            break;
    }
    throw new VerilogPrintDefect(`${describe(e)} has no Verilog form`);
}

/**
 * The Verilog text of `e`, with its type; a `VerilogPrintDefect` when some part
 * has none. A word's text is exact in a context of its own width.
 */
export function printVerilog(e: JjelExpression, names: VerilogNames): VerilogText {
    const p = print(e, names);
    return { text: p.text, type: p.type };
}

/** `printVerilog` of a source text, parsed strictly. */
export function printVerilogExpression(source: string, names: VerilogNames): VerilogText {
    const parsed = parseExpressionStrict(source);
    const err = parsed.errors[0];
    if (err || !parsed.expression) throw new VerilogPrintDefect(err ? `${err.line}:${err.column} ${err.message}` : 'no expression');
    return printVerilog(parsed.expression, names);
}

/**
 * One action as a nonblocking assignment: `X.[a] := e` → `x <= e;`, a memory
 * idiom target → `ram[k] <= e;`. The value has the type of the target.
 */
export function printVerilogAction(action: JjelAction, names: VerilogNames): string {
    const leaf = names.leaf(action.target);
    let target: Printed;
    if (leaf) target = { text: leaf.name, type: word(leaf.width, leaf.signed), form: 'name', own: leaf.width };
    else {
        const m = matchMemoryIdiom(action.target);
        if (!m) throw new VerilogPrintDefect(`${describe(action.target)} names no register or memory`);
        target = memoryWord(m, names, null);
    }
    const value = print(action.value, names);
    if (!sameType(target.type, value.type)) {
        throw new VerilogPrintDefect(`${describe(action.target)} is ${typeText(target.type)}, the value is ${typeText(value.type)}`);
    }
    return `${target.text} <= ${value.text};`;
}

/** The action texts of a site, in order, blanks dropped (as `compileActions` reads them). */
export function printVerilogActions(sources: ReadonlyArray<string | null | undefined>, names: VerilogNames): string[] {
    const out: string[] = [];
    for (const source of sources) {
        const text = source ?? '';
        if (text.trim() === '') continue;
        const parsed = parseAction(text);
        const err = parsed.errors[0];
        if (err || !parsed.action) throw new VerilogPrintDefect(`${text}: ${err ? `${err.line}:${err.column} ${err.message}` : 'no action'}`);
        out.push(printVerilogAction(parsed.action, names));
    }
    return out;
}
