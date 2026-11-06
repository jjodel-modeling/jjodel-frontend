/**
 * bvToSmv — a bit-vector JjEL expression as nuXmv text (R-BV-8, slice S2).
 *
 * The forms of docs/discovery/discovery_2026-10-20_jjel_bitvector.md §5.3:
 * `unsigned word[N]` / `signed word[N]`, constants `0ud8_255` and `-0sd8_1`,
 * `+ - *` (modular), `&`, `|`, `xor`, `!`, `<<`, `>>` (arithmetic on a signed
 * word), `::`, `x[hi:lo]`, `extend`, `resize`, `signed()` / `unsigned()`, and
 * comparisons signed or unsigned by type. Every operation keeps the meaning of
 * the S1 method it prints (`jjel/evaluator/builtins/bitvectors.ts`): where
 * nuXmv reads the signedness differently (`>>`, `extend`, `resize`, `::`), the
 * operand is cast first. Widths, indices and shift amounts must be literals.
 *
 * There is no `.smv` exporter: this is what its lane consumes. Pure; a defect
 * is a `SmvTranslationDefect`.
 */

import type { JjelExpression } from '../../jjel/types/ast';
import { makeBitVector } from '../../jjel/evaluator/builtins/bitvectors';
import { literalArgument } from './stateAttributesCodec';

export type SmvType =
    | { readonly kind: 'word'; readonly width: number; readonly signed: boolean }
    | { readonly kind: 'integer' }
    | { readonly kind: 'boolean' };

/** A translated expression: its nuXmv text and its type. */
export interface SmvText {
    readonly text: string;
    readonly type: SmvType;
}

/**
 * The nuXmv name and type of a leaf of the expression (a σ read `self.[r]`, a
 * model feature, a bound name), asked first at every node; `null` when the node
 * is not a leaf. The exporter knows each element's widths (`CompiledNet.widths`).
 */
export type SmvLeaves = (e: JjelExpression) => SmvText | null;

export class SmvTranslationDefect extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'SmvTranslationDefect';
    }
}

const INTEGER: SmvType = { kind: 'integer' };
const BOOLEAN: SmvType = { kind: 'boolean' };

/** `unsigned word[8]`, `signed word[16]`. */
export function smvWordType(width: number, signed: boolean): string {
    return `${signed ? 'signed' : 'unsigned'} word[${width}]`;
}

/** One `VAR` line: `r : unsigned word[8];`. */
export function smvDeclaration(name: string, width: number, signed: boolean): string {
    return `${name} : ${smvWordType(width, signed)};`;
}

/**
 * A word constant of the payload `bits`: `0ud8_255`, `0sd8_5`, `-0sd8_1`. The
 * least signed value has no positive decimal of its width, so it prints as the
 * negation of the greatest one: `!0sd8_127` is `8'sh80`.
 */
export function smvWordConstant(width: number, signed: boolean, bits: bigint): string {
    if (!signed) return `0ud${width}_${bits}`;
    const value = BigInt.asIntN(width, bits);
    const greatest = (1n << BigInt(width - 1)) - 1n;
    if (value >= 0n) return `0sd${width}_${value}`;
    if (-value <= greatest) return `-0sd${width}_${-value}`;
    return `!0sd${width}_${greatest}`;
}

function word(width: number, signed: boolean): SmvType {
    return { kind: 'word', width, signed };
}

function typeText(t: SmvType): string {
    return t.kind === 'word' ? smvWordType(t.width, t.signed) : t.kind;
}

function sameType(a: SmvType, b: SmvType): boolean {
    return a.kind === b.kind && (a.kind !== 'word' || (b.kind === 'word' && a.width === b.width && a.signed === b.signed));
}

/** A word operand, or a defect naming the operation. */
function asWord(label: string, x: SmvText): SmvText & { readonly type: { readonly kind: 'word'; readonly width: number; readonly signed: boolean } } {
    if (x.type.kind !== 'word') throw new SmvTranslationDefect(`${label} needs a word, got ${typeText(x.type)}`);
    return x as SmvText & { readonly type: { readonly kind: 'word'; readonly width: number; readonly signed: boolean } };
}

/** A literal integer argument within `min..max`. */
function literalInt(label: string, name: string, e: JjelExpression, min: number, max: number): number {
    const v = literalArgument(e);
    if (typeof v !== 'number' || !Number.isInteger(v) || v < min || v > max) {
        throw new SmvTranslationDefect(`${label}: ${name} must be a literal integer from ${min} to ${max}`);
    }
    return v;
}

function arity(label: string, args: readonly JjelExpression[], n: number): void {
    if (args.length !== n) throw new SmvTranslationDefect(`${label} expects ${n} argument${n === 1 ? '' : 's'}, got ${args.length}`);
}

/** Whether the opening parenthesis of `text` closes at its end. */
function parenthesized(text: string): boolean {
    let depth = 0;
    for (let i = 0; i < text.length; i++) {
        if (text[i] === '(') depth++;
        else if (text[i] === ')' && --depth === 0) return i === text.length - 1;
    }
    return false;
}

/** A receiver of `[hi:lo]` or `!`: a name or a parenthesized text as it is, anything else in parentheses. */
function selectable(text: string): string {
    return /^[A-Za-z_][A-Za-z0-9_$#.\-]*$/.test(text) || (text.startsWith('(') && parenthesized(text)) ? text : `(${text})`;
}

const toUnsigned = (x: SmvText): string => (x.type.kind === 'word' && x.type.signed ? `unsigned(${x.text})` : x.text);
const toSigned = (x: SmvText): string => (x.type.kind === 'word' && !x.type.signed ? `signed(${x.text})` : x.text);

function constant(fn: 'bits' | 'sbits', args: readonly JjelExpression[]): SmvText {
    const values = args.map(literalArgument);
    if (values.some(v => v === null)) throw new SmvTranslationDefect(`${fn}(…) needs literal arguments`);
    let v;
    try {
        v = makeBitVector(fn, values as Array<number | string>);
    } catch (err) {
        throw new SmvTranslationDefect((err as Error).message);
    }
    return { text: smvWordConstant(v.width, v.signed, v.bits), type: word(v.width, v.signed) };
}

const COMPARISON: Readonly<Record<string, string>> = { '==': '=', '!=': '!=', '<': '<', '<=': '<=', '>': '>', '>=': '>=' };

function binary(op: string, a: SmvText, b: SmvText): SmvText {
    const label = `'${op}'`;
    if (op === '+' || op === '-' || op === '*') {
        if (sameType(a.type, b.type) && a.type.kind !== 'boolean') return { text: `(${a.text} ${op} ${b.text})`, type: a.type };
    } else if (op in COMPARISON) {
        const ordered = op !== '==' && op !== '!=';
        if (sameType(a.type, b.type) && !(ordered && a.type.kind === 'boolean')) return { text: `(${a.text} ${COMPARISON[op]} ${b.text})`, type: BOOLEAN };
    } else if (op === 'and' || op === 'or') {
        if (a.type.kind === 'boolean' && b.type.kind === 'boolean') return { text: `(${a.text} ${op === 'and' ? '&' : '|'} ${b.text})`, type: BOOLEAN };
    } else {
        throw new SmvTranslationDefect(`${label} has no nuXmv translation`);
    }
    throw new SmvTranslationDefect(`${label} needs two operands of one type, got ${typeText(a.type)} and ${typeText(b.type)}`);
}

function method(receiver: SmvText, name: string, args: readonly JjelExpression[], leaves: SmvLeaves): SmvText {
    const label = `x.${name}`;
    const x = asWord(label, receiver);
    const { width, signed } = x.type;
    const pairWith = (arg: JjelExpression, op: string): SmvText => {
        const y = bvToSmv(arg, leaves);
        if (!sameType(x.type, y.type)) {
            throw new SmvTranslationDefect(`${label} needs two words of the same width and signedness, got ${typeText(x.type)} and ${typeText(y.type)}`);
        }
        return { text: `(${x.text} ${op} ${y.text})`, type: x.type };
    };
    const zero = (): SmvText => ({ text: smvWordConstant(width, signed, 0n), type: x.type });
    switch (name) {
        case 'slice': {
            arity(label, args, 2);
            const hi = literalInt(label, 'hi', args[0], 0, width - 1);
            const lo = literalInt(label, 'lo', args[1], 0, hi);
            return { text: `${selectable(x.text)}[${hi}:${lo}]`, type: word(hi - lo + 1, false) };
        }
        case 'bit': {
            arity(label, args, 1);
            const i = literalInt(label, 'i', args[0], 0, width - 1);
            return { text: `${selectable(x.text)}[${i}:${i}]`, type: word(1, false) };
        }
        // `{x, y, ...}`: the receiver in the high bits; unsigned, so every operand is read unsigned.
        case 'concat': {
            if (args.length < 1) throw new SmvTranslationDefect(`${label} expects at least 1 argument, got 0`);
            const parts = [x, ...args.map(a => asWord(label, bvToSmv(a, leaves)))];
            const total = parts.reduce((n, p) => n + p.type.width, 0);
            return { text: `(${parts.map(toUnsigned).join(' :: ')})`, type: word(total, false) };
        }
        case 'replicate': {
            arity(label, args, 1);
            const n = literalInt(label, 'n', args[0], 1, Number.MAX_SAFE_INTEGER);
            return { text: `(${Array.from({ length: n }, () => toUnsigned(x)).join(' :: ')})`, type: word(n * width, false) };
        }
        // nuXmv's `extend` follows the operand's type: a zero extension of a signed word goes through unsigned.
        case 'zext': {
            arity(label, args, 1);
            const k = literalInt(label, 'the width', args[0], width, Number.MAX_SAFE_INTEGER) - width;
            if (k === 0) return x;
            return { text: signed ? `signed(extend(unsigned(${x.text}), ${k}))` : `extend(${x.text}, ${k})`, type: word(width + k, signed) };
        }
        case 'sext': {
            arity(label, args, 1);
            const k = literalInt(label, 'the width', args[0], width, Number.MAX_SAFE_INTEGER) - width;
            if (k === 0) return x;
            return { text: signed ? `extend(${x.text}, ${k})` : `unsigned(extend(signed(${x.text}), ${k}))`, type: word(width + k, signed) };
        }
        // Keeps the low bits; nuXmv's `resize` of a signed word keeps the sign bit instead, hence the cast.
        case 'trunc': {
            arity(label, args, 1);
            const w = literalInt(label, 'the width', args[0], 1, width);
            if (w === width) return x;
            return { text: signed ? `signed(resize(unsigned(${x.text}), ${w}))` : `resize(${x.text}, ${w})`, type: word(w, signed) };
        }
        case 'and': arity(label, args, 1); return pairWith(args[0], '&');
        case 'or': arity(label, args, 1); return pairWith(args[0], '|');
        case 'xor': arity(label, args, 1); return pairWith(args[0], 'xor');
        case 'not': arity(label, args, 0); return { text: `!${selectable(x.text)}`, type: x.type };
        // A shift of the width or more gives 0 (S1), never a nuXmv shift past the width.
        case 'shl': {
            arity(label, args, 1);
            const n = literalInt(label, 'the amount', args[0], 0, Number.MAX_SAFE_INTEGER);
            if (n >= width) return zero();
            return n === 0 ? x : { text: `(${x.text} << ${n})`, type: x.type };
        }
        // Logical whatever the signedness: nuXmv's `>>` is arithmetic on a signed word.
        case 'shr': {
            arity(label, args, 1);
            const n = literalInt(label, 'the amount', args[0], 0, Number.MAX_SAFE_INTEGER);
            if (n >= width) return zero();
            if (n === 0) return x;
            return { text: signed ? `signed(unsigned(${x.text}) >> ${n})` : `(${x.text} >> ${n})`, type: x.type };
        }
        // Copies the top bit whatever the signedness; past w - 1 every bit is the top one already.
        case 'ashr': {
            arity(label, args, 1);
            const k = Math.min(literalInt(label, 'the amount', args[0], 0, Number.MAX_SAFE_INTEGER), width - 1);
            if (k === 0) return x;
            return { text: signed ? `(${x.text} >> ${k})` : `unsigned(signed(${x.text}) >> ${k})`, type: x.type };
        }
        case 'asSigned': arity(label, args, 0); return { text: toSigned(x), type: word(width, true) };
        case 'asUnsigned': arity(label, args, 0); return { text: toUnsigned(x), type: word(width, false) };
        default:
            throw new SmvTranslationDefect(`${label} has no nuXmv translation`);
    }
}

/** Zero-argument methods, readable without parentheses too (S1's dual form). */
const ZERO_ARG = new Set(['not', 'asSigned', 'asUnsigned', 'toNumber', 'toVerilog']);

/** The nuXmv text of `e`, with its type; a `SmvTranslationDefect` when some part has none. */
export function bvToSmv(e: JjelExpression, leaves: SmvLeaves): SmvText {
    const leaf = leaves(e);
    if (leaf) return leaf;
    switch (e.type) {
        case 'Literal':
            if (typeof e.value === 'number' && Number.isInteger(e.value)) return { text: String(e.value), type: INTEGER };
            if (typeof e.value === 'boolean') return { text: e.value ? 'TRUE' : 'FALSE', type: BOOLEAN };
            break;
        case 'FunctionCall':
            if (e.name === 'bits' || e.name === 'sbits') return constant(e.name, e.args);
            break;
        case 'Unary': {
            const x = bvToSmv(e.operand, leaves);
            if (e.operator === '-' && x.type.kind !== 'boolean') return { text: `(-${x.text})`, type: x.type };
            if (e.operator === 'not' && x.type.kind === 'boolean') return { text: `!${selectable(x.text)}`, type: BOOLEAN };
            throw new SmvTranslationDefect(`'${e.operator}' on ${typeText(x.type)} has no nuXmv translation`);
        }
        case 'Binary':
            return binary(e.operator, bvToSmv(e.left, leaves), bvToSmv(e.right, leaves));
        case 'MethodCall':
            return method(bvToSmv(e.object, leaves), e.method, e.args, leaves);
        case 'MemberAccess': {
            const x = bvToSmv(e.object, leaves);
            if (x.type.kind === 'word' && e.property === 'width') return { text: String(x.type.width), type: INTEGER };
            if (x.type.kind === 'word' && e.property === 'signed') return { text: x.type.signed ? 'TRUE' : 'FALSE', type: BOOLEAN };
            if (ZERO_ARG.has(e.property)) return method(x, e.property, [], leaves);
            break;
        }
        default:
            break;
    }
    throw new SmvTranslationDefect(`${e.type} has no nuXmv translation here`);
}
