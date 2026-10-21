/**
 * JjEL Bit-vector Builtins (R-BV, slice S1)
 * Fixed-width two-state vectors: the constructors `bits`/`sbits`, the method
 * table and the operator semantics. Pure and BigInt-only, the one place this
 * semantics lives (R-BV-6). A defect is a `BitVectorDefect`; the evaluator
 * rethrows it as a `JjelEvaluationError` with the same message, because this
 * module cannot import the evaluator.
 */

import { JjelBitVector, JjelValue, isBitVector, isJjelFunction } from '../context';

/** Widest vector a constructor or an operation may build. */
export const BV_MAX_WIDTH = 1024;

export class BitVectorDefect extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'BitVectorDefect';
    }
}

// ============================================
// VALUE
// ============================================

class BitVectorValue implements JjelBitVector {
    readonly __type = 'BitVector' as const;
    readonly width: number;
    readonly signed: boolean;
    readonly bits: bigint;

    constructor(width: number, signed: boolean, bits: bigint) {
        // Every operation wraps its own result; a non-canonical payload here is a bug, not a value.
        if (bits < 0n || (bits >> BigInt(width)) !== 0n) {
            throw new BitVectorDefect(`internal: ${bits} is not a canonical ${width}-bit payload`);
        }
        this.width = width;
        this.signed = signed;
        this.bits = bits;
        Object.freeze(this);
    }

    // Safety nets for a stray String(x) or JSON.stringify(x); the evaluator branches explicitly.
    toString(): string {
        return toVerilog(this);
    }

    toJSON(): string {
        return toVerilog(this);
    }
}

function make(width: number, signed: boolean, bits: bigint): JjelBitVector {
    return new BitVectorValue(width, signed, bits);
}

/** The value the bits stand for: two's complement when signed. */
function valueOf(x: JjelBitVector): bigint {
    return x.signed ? BigInt.asIntN(x.width, x.bits) : x.bits;
}

/** Verilog form, e.g. `8'hff`, `8'sh80`, `16'h0034`: hex, padded to the width. */
export function toVerilog(x: JjelBitVector): string {
    const digits = Math.ceil(x.width / 4);
    return `${x.width}'${x.signed ? 's' : ''}h${x.bits.toString(16).padStart(digits, '0')}`;
}

export function bitVectorsEqual(a: JjelBitVector, b: JjelBitVector): boolean {
    return a.width === b.width && a.signed === b.signed && a.bits === b.bits;
}

// ============================================
// MESSAGES
// ============================================

/** Kind of an operand, for the pair defect: `8-bit unsigned`, `number`, ... */
export function describeOperand(v: JjelValue): string {
    if (isBitVector(v)) return `${v.width}-bit ${v.signed ? 'signed' : 'unsigned'}`;
    if (v === null) return 'null';
    if (Array.isArray(v)) return 'collection';
    if (isJjelFunction(v)) return 'function';
    return typeof v;
}

function show(v: JjelValue): string {
    if (isBitVector(v)) return toVerilog(v);
    if (typeof v === 'string') return `'${v}'`;
    if (v === null || typeof v === 'number' || typeof v === 'boolean') return String(v);
    return describeOperand(v);
}

export function noTruthValue(x: JjelBitVector): BitVectorDefect {
    return new BitVectorDefect(
        `A bit-vector has no truth value: compare it explicitly, e.g. x != ${x.signed ? 'sbits' : 'bits'}(${x.width}, 0)`
    );
}

// ============================================
// CONSTRUCTORS
// ============================================

const DECIMAL = /^-?\d+$/;
const HEX = /^0[xX][0-9a-fA-F]+$/;
const BINARY = /^0[bB][01]+$/;

/**
 * `bits(w, v)` / `sbits(w, v)`. A number or a decimal string is a value and
 * must be in range; a `0x`/`0b` string is a bit pattern and must fit in `w`
 * bits (`sbits` reinterprets it). Never truncates.
 */
export function makeBitVector(fn: 'bits' | 'sbits', args: JjelValue[]): JjelBitVector {
    const signed = fn === 'sbits';
    if (args.length !== 2) {
        throw new BitVectorDefect(`${fn}(w, v) expects 2 arguments, got ${args.length}`);
    }
    const [w, v] = args;
    if (typeof w !== 'number' || !Number.isInteger(w) || w < 1 || w > BV_MAX_WIDTH) {
        throw new BitVectorDefect(`${fn}: the width must be an integer from 1 to ${BV_MAX_WIDTH}, got ${show(w)}`);
    }
    const W = BigInt(w);

    if (typeof v === 'string' && (HEX.test(v) || BINARY.test(v))) {
        const pattern = BigInt(v);
        if ((pattern >> W) !== 0n) {
            throw new BitVectorDefect(`${fn}(${w}, '${v}'): the pattern does not fit in ${w} bits`);
        }
        return make(w, signed, pattern);
    }

    let value: bigint;
    if (typeof v === 'number' && Number.isSafeInteger(v)) {
        value = BigInt(v);
    } else if (typeof v === 'string' && DECIMAL.test(v)) {
        value = BigInt(v);
    } else {
        throw new BitVectorDefect(
            `${fn}: the value must be a safe integer, or a decimal, 0x or 0b string, got ${show(v)}`
        );
    }

    const low = signed ? -(1n << (W - 1n)) : 0n;
    const high = signed ? (1n << (W - 1n)) : (1n << W);
    if (value < low || value >= high) {
        const range = signed ? `-2^${w - 1} to 2^${w - 1}-1` : `0 to 2^${w}-1`;
        throw new BitVectorDefect(`${fn}(${w}, ${show(v)}): the value does not fit in ${w} ${signed ? 'signed' : 'unsigned'} bits (${range})`);
    }
    return make(w, signed, BigInt.asUintN(w, value));
}

// ============================================
// OPERATORS
// ============================================

/** Equal width and equal signedness, or a defect naming both operands (R-BV-3). */
function pair(label: string, a: JjelValue, b: JjelValue): [JjelBitVector, JjelBitVector] {
    if (isBitVector(a) && isBitVector(b) && a.width === b.width && a.signed === b.signed) {
        return [a, b];
    }
    throw new BitVectorDefect(
        `${label} needs two bit-vectors of the same width and signedness, got ${describeOperand(a)} and ${describeOperand(b)}`
    );
}

/** -1, 0 or 1, following the signedness; a mismatched pair is a defect. */
export function compareBitVectors(label: string, a: JjelValue, b: JjelValue): number {
    const [x, y] = pair(label, a, b);
    const vx = valueOf(x);
    const vy = valueOf(y);
    return vx < vy ? -1 : vx > vy ? 1 : 0;
}

/**
 * A binary operator with at least one bit-vector operand. `+` with a string is
 * not here: it is string concatenation, which the evaluator does.
 */
export function applyBitVectorOperator(op: string, a: JjelValue, b: JjelValue): JjelValue {
    const label = `'${op}'`;
    switch (op) {
        case '+': {
            const [x, y] = pair(label, a, b);
            return make(x.width, x.signed, BigInt.asUintN(x.width, x.bits + y.bits));
        }
        case '-': {
            const [x, y] = pair(label, a, b);
            return make(x.width, x.signed, BigInt.asUintN(x.width, x.bits - y.bits));
        }
        case '*': {
            const [x, y] = pair(label, a, b);
            return make(x.width, x.signed, BigInt.asUintN(x.width, x.bits * y.bits));
        }
        case '==': {
            if (a === null || b === null) return false;
            const [x, y] = pair(label, a, b);
            return x.bits === y.bits;
        }
        case '!=': {
            if (a === null || b === null) return true;
            const [x, y] = pair(label, a, b);
            return x.bits !== y.bits;
        }
        case '<':
            return compareBitVectors(label, a, b) < 0;
        case '<=':
            return compareBitVectors(label, a, b) <= 0;
        case '>':
            return compareBitVectors(label, a, b) > 0;
        case '>=':
            return compareBitVectors(label, a, b) >= 0;
        case '/':
        case '%':
            throw new BitVectorDefect(`${label} is not defined on bit-vectors yet (R-BV-4)`);
        case 'and':
        case 'or':
            throw new BitVectorDefect(
                `${label} needs booleans, got ${describeOperand(a)} and ${describeOperand(b)}: a bit-vector has no truth value`
            );
        default:
            throw new BitVectorDefect(`${label} is not defined on bit-vectors`);
    }
}

/** Unary `-`: two's complement negation modulo 2^w. */
export function negateBitVector(x: JjelBitVector): JjelBitVector {
    return make(x.width, x.signed, BigInt.asUintN(x.width, -x.bits));
}

// ============================================
// METHODS
// ============================================

type BitVectorMethod = (x: JjelBitVector, args: JjelValue[]) => JjelValue;

function arity(method: string, args: JjelValue[], n: number): void {
    if (args.length !== n) {
        throw new BitVectorDefect(`x.${method} expects ${n} argument${n === 1 ? '' : 's'}, got ${args.length}`);
    }
}

function int(method: string, name: string, v: JjelValue, min: number, max: number): number {
    if (typeof v !== 'number' || !Number.isInteger(v) || v < min || v > max) {
        throw new BitVectorDefect(`x.${method}: ${name} must be an integer from ${min} to ${max}, got ${show(v)}`);
    }
    return v;
}

function vector(method: string, position: number, v: JjelValue): JjelBitVector {
    if (!isBitVector(v)) {
        throw new BitVectorDefect(`x.${method}: argument ${position} must be a bit-vector, got ${describeOperand(v)}`);
    }
    return v;
}

/** A shift amount: a non-negative safe integer, or a vector read unsigned. */
function amount(method: string, v: JjelValue): bigint {
    if (isBitVector(v)) return v.bits;
    if (typeof v === 'number' && Number.isSafeInteger(v) && v >= 0) return BigInt(v);
    throw new BitVectorDefect(`x.${method}: the amount must be a non-negative integer or a bit-vector, got ${show(v)}`);
}

function bitwise(method: string, x: JjelBitVector, args: JjelValue[], f: (p: bigint, q: bigint) => bigint): JjelBitVector {
    arity(method, args, 1);
    const [p, q] = pair(`x.${method}`, x, args[0]);
    return make(p.width, p.signed, BigInt.asUintN(p.width, f(p.bits, q.bits)));
}

const METHODS = new Map<string, BitVectorMethod>([
    // Inclusive part-select x[hi:lo], 0 <= lo <= hi < w; unsigned.
    ['slice', (x, args) => {
        arity('slice', args, 2);
        const hi = int('slice', 'hi', args[0], 0, x.width - 1);
        const lo = int('slice', 'lo', args[1], 0, hi);
        const w = hi - lo + 1;
        return make(w, false, BigInt.asUintN(w, x.bits >> BigInt(lo)));
    }],
    ['bit', (x, args) => {
        arity('bit', args, 1);
        const i = int('bit', 'i', args[0], 0, x.width - 1);
        return make(1, false, (x.bits >> BigInt(i)) & 1n);
    }],
    // Verilog {x, y, ...}: the receiver goes in the high bits; unsigned.
    ['concat', (x, args) => {
        if (args.length < 1) {
            throw new BitVectorDefect('x.concat expects at least 1 argument, got 0');
        }
        let width = x.width;
        let acc = x.bits;
        args.forEach((arg, k) => {
            const y = vector('concat', k + 1, arg);
            width += y.width;
            if (width > BV_MAX_WIDTH) {
                throw new BitVectorDefect(`x.concat: the result would be wider than ${BV_MAX_WIDTH} bits`);
            }
            acc = (acc << BigInt(y.width)) | y.bits;
        });
        return make(width, false, acc);
    }],
    // Verilog {n{x}}; unsigned.
    ['replicate', (x, args) => {
        arity('replicate', args, 1);
        const n = int('replicate', 'n', args[0], 1, Math.floor(BV_MAX_WIDTH / x.width));
        let acc = 0n;
        for (let k = 0; k < n; k++) {
            acc = (acc << BigInt(x.width)) | x.bits;
        }
        return make(n * x.width, false, acc);
    }],
    ['zext', (x, args) => {
        arity('zext', args, 1);
        const w = int('zext', 'the width', args[0], x.width, BV_MAX_WIDTH);
        return make(w, x.signed, x.bits);
    }],
    ['sext', (x, args) => {
        arity('sext', args, 1);
        const w = int('sext', 'the width', args[0], x.width, BV_MAX_WIDTH);
        return make(w, x.signed, BigInt.asUintN(w, BigInt.asIntN(x.width, x.bits)));
    }],
    // Keeps the low bits.
    ['trunc', (x, args) => {
        arity('trunc', args, 1);
        const w = int('trunc', 'the width', args[0], 1, x.width);
        return make(w, x.signed, BigInt.asUintN(w, x.bits));
    }],
    ['and', (x, args) => bitwise('and', x, args, (p, q) => p & q)],
    ['or', (x, args) => bitwise('or', x, args, (p, q) => p | q)],
    ['xor', (x, args) => bitwise('xor', x, args, (p, q) => p ^ q)],
    ['not', (x, args) => {
        arity('not', args, 0);
        return make(x.width, x.signed, BigInt.asUintN(x.width, ~x.bits));
    }],
    // A shift of w or more gives 0: never the modulo-32 of JavaScript's <<.
    ['shl', (x, args) => {
        arity('shl', args, 1);
        const n = amount('shl', args[0]);
        if (n >= BigInt(x.width)) return make(x.width, x.signed, 0n);
        return make(x.width, x.signed, BigInt.asUintN(x.width, x.bits << n));
    }],
    ['shr', (x, args) => {
        arity('shr', args, 1);
        const n = amount('shr', args[0]);
        if (n >= BigInt(x.width)) return make(x.width, x.signed, 0n);
        return make(x.width, x.signed, x.bits >> n);
    }],
    // Copies the top bit whatever the signedness; the amount is clamped to w.
    ['ashr', (x, args) => {
        arity('ashr', args, 1);
        const n = amount('ashr', args[0]);
        const k = n >= BigInt(x.width) ? BigInt(x.width) : n;
        return make(x.width, x.signed, BigInt.asUintN(x.width, BigInt.asIntN(x.width, x.bits) >> k));
    }],
    ['asSigned', (x, args) => {
        arity('asSigned', args, 0);
        return make(x.width, true, x.bits);
    }],
    ['asUnsigned', (x, args) => {
        arity('asUnsigned', args, 0);
        return make(x.width, false, x.bits);
    }],
    ['toNumber', (x, args) => {
        arity('toNumber', args, 0);
        const v = valueOf(x);
        const max = BigInt(Number.MAX_SAFE_INTEGER);
        if (v > max || v < -max) {
            throw new BitVectorDefect(`x.toNumber: ${toVerilog(x)} is beyond the safe integers (2^53-1)`);
        }
        return Number(v);
    }],
    ['toVerilog', (x, args) => {
        arity('toVerilog', args, 0);
        return toVerilog(x);
    }],
]);

/** Zero-argument methods, readable without parentheses too (dual form). */
const ZERO_ARG = new Set(['not', 'asSigned', 'asUnsigned', 'toNumber', 'toVerilog']);

export const BITVECTOR_METHOD_NAMES: readonly string[] = [...METHODS.keys()];

export function getBitVectorMethod(name: string): BitVectorMethod | undefined {
    return METHODS.get(name);
}

/** `x.width`, `x.signed`, or a zero-argument method; `undefined` for any other name. */
export function getBitVectorProperty(x: JjelBitVector, name: string): JjelValue | undefined {
    if (name === 'width') return x.width;
    if (name === 'signed') return x.signed;
    if (ZERO_ARG.has(name)) return METHODS.get(name)!(x, []);
    return undefined;
}
