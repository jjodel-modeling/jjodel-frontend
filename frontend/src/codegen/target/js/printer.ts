/**
 * printer — the expression and action printer of the JavaScript target profile
 * (R-GEN-6, R-GEN-11, spec 2026-10-10 §6, discovery 2026-10-10 §G.3-§G.4,
 * P-2026-10-10-0950).
 *
 * Prints the JjEL that guards and actions carry as JavaScript over the state
 * object of R-GEN-11 (`JsState`: marking, attributes and derived values keyed
 * by model id). The printed code reads two free names, `state` and `event` (the
 * event instance's id, `null` for ε), and the helpers of `JS_RUNTIME`, which a
 * generated program declares once, before the printed code.
 *
 * ── The subset ───────────────────────────────────────────────────────────────
 *
 * A second walker over the 22 node kinds, with the skeleton of
 * `checkGuardSubset` (`model/simulation/subsetChecker.ts`), whose verdict comes
 * first: an `error` refuses, and so does `T-METHOD`, a builtin with no printed
 * form here. The other not-verifiable codes (`T-DIV`, `T-MOD`, `T-DECIMAL`)
 * are nuXmv's limits, bounded integers; JavaScript has the evaluator's own
 * numbers, so they are printed, `/` and `%` with JjEL's null on zero. Warnings
 * are printed with the behaviour they warn about.
 *
 * Every subexpression that reads neither σ (`.[x]`) nor `event` is folded: it
 * is evaluated once over the frozen M, with `self` the site, as
 * `judgeActionTarget` folds an action's target (`actionEvaluator.ts`), and
 * printed as its constant. A fold that throws prints a throw at its place, so
 * it fires only when the evaluator would reach it; a fold that meets a name M
 * does not have is refused (`P-ABSENT`), conservatively, even where the
 * evaluator might not reach it. What is left depends on the step, and prints
 * only where its JavaScript is exact: operators, conditionals, state reads at
 * elements known at translation, and `exists`, `all`, `any`, `none`, `count`,
 * `sum` over a collection of M, expanded element by element (spec 2026-09-13
 * §5.4, quantifiers over model collections). Anything else over a step value is
 * refused (`P-STEP`). A refusal is always safe: no code is better than code
 * that disagrees with the simulator.
 *
 * ── The semantics the printed code keeps ─────────────────────────────────────
 *
 * - `and` and `or` evaluate both operands (`evaluator.ts`, `evaluateBinary`):
 *   they print as calls, whose arguments JavaScript evaluates in full.
 * - `/` and `%` by zero are null; `+` concatenates when either side is a
 *   string; `==` is structural; ordering puts null first.
 * - `if`, `??`, `implies`, `exists` and `all`/`any` evaluate what the evaluator
 *   evaluates, and stop where it stops.
 * - An element is one frozen object per id (`$E`), so `==` on two elements is
 *   identity, as on the evaluator's handles.
 * - Actions are a parallel assignment (spec 2026-09-13 §5.3): each target is
 *   resolved and each right-hand side evaluated on σ, in order, as
 *   `makeActionOracle` does; only then `$apply` writes `next`. A second write
 *   to one target throws, the core's double assignment.
 * - A bit-vector (R-BV) is a `$BitVector`, built by `$bv(width, signed, bits)`:
 *   the operators take its path when either operand is one, with the
 *   evaluator's defects as throws, and a method no other receiver has prints
 *   as `$bvm` (R-BV-9). The `$bv…` helpers port `builtins/bitvectors.ts`
 *   line by line, messages verbatim; `__tests__/printer.bitvector.test.ts`
 *   runs them against that module.
 *
 * The differential test (`__tests__/printer.differential.test.ts`) runs the
 * printed code against the evaluator on random σ.
 *
 * An element is printed as its id literal, or, when the context carries the
 * program's `$ID` table (`refs`, R-GEN-17), as the expression the table names
 * it by: `$E($ID.door)`, `$read(state, $ID.door, "a")`, and the same in
 * `$tokens`, `$marked` and the writes of `$apply`. The value is the id either
 * way, so the code computes the same.
 *
 * Pure: JjEL and the simulator's pure core.
 */

import { JjelEvaluator, isJjelObject } from '../../../jjel/evaluator';
import type { EvaluationContext, JjelValue } from '../../../jjel/evaluator';
import { isBitVector } from '../../../jjel/evaluator/context';
import type { JjelBitVector } from '../../../jjel/evaluator/context';
import { BITVECTOR_METHOD_NAMES } from '../../../jjel/evaluator/builtins/bitvectors';
import { getCollectionMethod } from '../../../jjel/evaluator/builtins/collections';
import { getDateMethod } from '../../../jjel/evaluator/builtins/dates';
import { getNumberMethod } from '../../../jjel/evaluator/builtins/numbers';
import { getStringMethod } from '../../../jjel/evaluator/builtins/strings';
import type {
    ASTLocation, BinaryOperator, ExistsExpr, JjelAction, JjelExpression, LambdaExpr, MethodCallExpr,
    NullSafeMethodCallExpr, StateAccessExpr,
} from '../../../jjel/types/ast';
import { STATE_RESERVED } from '../../../jjel/stateReserved';
import { describeType, firstAbsence } from '../../../model/jjelTriState';
import { judgeActionTarget } from '../../../model/simulation/actionEvaluator';
import { buildGuardContext } from '../../../model/simulation/guardContext';
import type { SimSnapshot } from '../../../model/simulation/guardContext';
import { checkGuardSubset } from '../../../model/simulation/subsetChecker';
import type { SubsetCode } from '../../../model/simulation/subsetChecker';
import type { CompiledNet, SimState, SimValue } from '../../../model/simulation/netTypes';

/** What the printer needs to know about the model and the site. */
export interface JsPrintContext {
    /** M, frozen once per run (`freezeSnapshot`). */
    readonly snapshot: SimSnapshot;
    /** The element the guard or the actions are attached to: `self`. */
    readonly site: string;
    /** The places of the compiled net: `.[marked]` and `.[tokens]` are read on them only. */
    readonly places: ReadonlySet<string>;
    /** The declarations by element, for the locality of a target; without them it is not checked. */
    readonly declared?: CompiledNet['declared'];
    /**
     * The expression that names each element in the program, by id: `$ID.<identifier>` of the program's `$ID`
     * table (identifiers.ts `elementIdTable`, R-GEN-17). Without it, or for an id it does not hold, the id literal.
     */
    readonly refs?: ReadonlyMap<string, string>;
}

/**
 * A refusal: the code of the subset checker that refused, or one of the
 * printer's own. `P-STEP`: a construct over a value known only in the step,
 * with no exact JavaScript here. `P-ABSENT`: a name M does not have. `P-CONST`:
 * a value of M with no JavaScript form (a metaclass, a function). `P-TARGET`:
 * an action target that depends on the step. `P-PRESENTATION`: `node.[a] :=`,
 * outside the generated state. `P-SITE`: the site has no handle in M.
 */
export type JsRefusalCode = SubsetCode | 'P-STEP' | 'P-ABSENT' | 'P-CONST' | 'P-TARGET' | 'P-PRESENTATION' | 'P-SITE';

export interface JsRefusal {
    readonly code: JsRefusalCode;
    readonly message: string;
    readonly location?: ASTLocation;
}

export type JsPrintResult =
    | { readonly ok: true; readonly code: string }
    | { readonly ok: false; readonly refusals: readonly JsRefusal[] };

/**
 * σ as the generated program holds it (R-GEN-11): plain records keyed by model
 * id, presentation excluded. `derived` holds the derived semantic values a
 * read falls back to (R-SIM-73).
 */
export interface JsState {
    marking: Record<string, number>;
    attrs: Record<string, Record<string, SimValue>>;
    derived?: Record<string, Record<string, SimValue>>;
}

/** The simulator's σ as a `JsState`. */
export function toJsState(state: SimState): JsState {
    const records = (m: ReadonlyMap<string, ReadonlyMap<string, SimValue>>) =>
        Object.fromEntries([...m].map(([id, attrs]) => [id, Object.fromEntries(attrs)]));
    return {
        marking: Object.fromEntries(state.marking),
        attrs: records(state.attrs),
        ...(state.derived ? { derived: records(state.derived.attrs) } : {}),
    };
}

/**
 * The helpers the printed code calls: JjEL's semantics, ported from
 * `jjel/evaluator/evaluator.ts` and `builtins/collections.ts`. Plain
 * JavaScript, no `export`: a generated module declares it once at its top.
 */
export const JS_RUNTIME = `// The runtime of the JjEL printer (codegen/target/js/printer.ts): JjEL's semantics in JavaScript.
const $ELEMENTS = new Map();
/** The element with this id: one object per id, so == on elements is identity, as on JjEL's handles. */
function $E(id) {
  if (id === null) return null;
  let e = $ELEMENTS.get(id);
  if (e === undefined) { e = Object.freeze({ $id: id }); $ELEMENTS.set(id, e); }
  return e;
}
function $fail(message) { throw new Error(message); }
function $own(o, k) { return o !== null && o !== undefined && Object.prototype.hasOwnProperty.call(o, k); }
function $set(o, k, v) { Object.defineProperty(o, k, { value: v, writable: true, enumerable: true, configurable: true }); }
function $isObject(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }
function $describe(v) { return v === null ? 'null' : Array.isArray(v) ? 'array(' + v.length + ')' : typeof v; }
// ── Bit-vectors: jjel/evaluator/builtins/bitvectors.ts, ported line by line (R-BV-9), messages verbatim. ──
class $BitVector {
  constructor(width, signed, bits) {
    if (bits < 0n || (bits >> BigInt(width)) !== 0n) throw new Error('internal: ' + bits + ' is not a canonical ' + width + '-bit payload');
    this.__type = 'BitVector';
    this.width = width;
    this.signed = signed;
    this.bits = bits;
    Object.freeze(this);
  }
  toString() { return $bvVerilog(this); }
  toJSON() { return $bvVerilog(this); }
}
const $BV_MAX_WIDTH = 1024;
function $bv(width, signed, bits) { return new $BitVector(width, signed, bits); }
/** A bit-vector as context.ts isBitVector reads one: a structured clone of one is one too. */
function $isBV(v) { return v !== null && typeof v === 'object' && v.__type === 'BitVector' && typeof v.bits === 'bigint'; }
function $bvValue(x) { return x.signed ? BigInt.asIntN(x.width, x.bits) : x.bits; }
function $bvVerilog(x) { return x.width + "'" + (x.signed ? 's' : '') + 'h' + x.bits.toString(16).padStart(Math.ceil(x.width / 4), '0'); }
function $bvOperand(v) {
  if ($isBV(v)) return v.width + '-bit ' + (v.signed ? 'signed' : 'unsigned');
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'collection';
  if (typeof v === 'object' && '__jjelFunction' in v) return 'function';
  return typeof v;
}
function $bvShow(v) {
  if ($isBV(v)) return $bvVerilog(v);
  if (typeof v === 'string') return "'" + v + "'";
  if (v === null || typeof v === 'number' || typeof v === 'boolean') return String(v);
  return $bvOperand(v);
}
function $bvNoTruth(x) { return new Error('A bit-vector has no truth value: compare it explicitly, e.g. x != ' + (x.signed ? 'sbits' : 'bits') + '(' + x.width + ', 0)'); }
function $bvPair(label, a, b) {
  if ($isBV(a) && $isBV(b) && a.width === b.width && a.signed === b.signed) return [a, b];
  throw new Error(label + ' needs two bit-vectors of the same width and signedness, got ' + $bvOperand(a) + ' and ' + $bvOperand(b));
}
function $bvCompare(label, a, b) {
  const [x, y] = $bvPair(label, a, b);
  const vx = $bvValue(x);
  const vy = $bvValue(y);
  return vx < vy ? -1 : vx > vy ? 1 : 0;
}
/** A binary operator with a bit-vector operand; \`+\` with a string is $add's. */
function $bvOp(op, a, b) {
  const label = "'" + op + "'";
  switch (op) {
    case '+': { const [x, y] = $bvPair(label, a, b); return $bv(x.width, x.signed, BigInt.asUintN(x.width, x.bits + y.bits)); }
    case '-': { const [x, y] = $bvPair(label, a, b); return $bv(x.width, x.signed, BigInt.asUintN(x.width, x.bits - y.bits)); }
    case '*': { const [x, y] = $bvPair(label, a, b); return $bv(x.width, x.signed, BigInt.asUintN(x.width, x.bits * y.bits)); }
    case '==': { if (a === null || b === null) return false; const [x, y] = $bvPair(label, a, b); return x.bits === y.bits; }
    case '!=': { if (a === null || b === null) return true; const [x, y] = $bvPair(label, a, b); return x.bits !== y.bits; }
    case '<': return $bvCompare(label, a, b) < 0;
    case '<=': return $bvCompare(label, a, b) <= 0;
    case '>': return $bvCompare(label, a, b) > 0;
    case '>=': return $bvCompare(label, a, b) >= 0;
    case '/':
    case '%':
      throw new Error(label + ' is not defined on bit-vectors yet (R-BV-4)');
    case 'and':
    case 'or':
      throw new Error(label + ' needs booleans, got ' + $bvOperand(a) + ' and ' + $bvOperand(b) + ': a bit-vector has no truth value');
    default:
      throw new Error(label + ' is not defined on bit-vectors');
  }
}
function $bvArity(method, args, n) {
  if (args.length !== n) throw new Error('x.' + method + ' expects ' + n + ' argument' + (n === 1 ? '' : 's') + ', got ' + args.length);
}
function $bvInt(method, name, v, min, max) {
  if (typeof v !== 'number' || !Number.isInteger(v) || v < min || v > max) throw new Error('x.' + method + ': ' + name + ' must be an integer from ' + min + ' to ' + max + ', got ' + $bvShow(v));
  return v;
}
function $bvVector(method, position, v) {
  if (!$isBV(v)) throw new Error('x.' + method + ': argument ' + position + ' must be a bit-vector, got ' + $bvOperand(v));
  return v;
}
function $bvAmount(method, v) {
  if ($isBV(v)) return v.bits;
  if (typeof v === 'number' && Number.isSafeInteger(v) && v >= 0) return BigInt(v);
  throw new Error('x.' + method + ': the amount must be a non-negative integer or a bit-vector, got ' + $bvShow(v));
}
function $bvBitwise(method, x, args, f) {
  $bvArity(method, args, 1);
  const [p, q] = $bvPair('x.' + method, x, args[0]);
  return $bv(p.width, p.signed, BigInt.asUintN(p.width, f(p.bits, q.bits)));
}
const $BV_METHODS = new Map([
  ['slice', (x, args) => {
    $bvArity('slice', args, 2);
    const hi = $bvInt('slice', 'hi', args[0], 0, x.width - 1);
    const lo = $bvInt('slice', 'lo', args[1], 0, hi);
    const w = hi - lo + 1;
    return $bv(w, false, BigInt.asUintN(w, x.bits >> BigInt(lo)));
  }],
  ['bit', (x, args) => {
    $bvArity('bit', args, 1);
    const i = $bvInt('bit', 'i', args[0], 0, x.width - 1);
    return $bv(1, false, (x.bits >> BigInt(i)) & 1n);
  }],
  ['concat', (x, args) => {
    if (args.length < 1) throw new Error('x.concat expects at least 1 argument, got 0');
    let width = x.width;
    let acc = x.bits;
    args.forEach((arg, k) => {
      const y = $bvVector('concat', k + 1, arg);
      width += y.width;
      if (width > $BV_MAX_WIDTH) throw new Error('x.concat: the result would be wider than ' + $BV_MAX_WIDTH + ' bits');
      acc = (acc << BigInt(y.width)) | y.bits;
    });
    return $bv(width, false, acc);
  }],
  ['replicate', (x, args) => {
    $bvArity('replicate', args, 1);
    const n = $bvInt('replicate', 'n', args[0], 1, Math.floor($BV_MAX_WIDTH / x.width));
    let acc = 0n;
    for (let k = 0; k < n; k++) acc = (acc << BigInt(x.width)) | x.bits;
    return $bv(n * x.width, false, acc);
  }],
  ['zext', (x, args) => {
    $bvArity('zext', args, 1);
    const w = $bvInt('zext', 'the width', args[0], x.width, $BV_MAX_WIDTH);
    return $bv(w, x.signed, x.bits);
  }],
  ['sext', (x, args) => {
    $bvArity('sext', args, 1);
    const w = $bvInt('sext', 'the width', args[0], x.width, $BV_MAX_WIDTH);
    return $bv(w, x.signed, BigInt.asUintN(w, BigInt.asIntN(x.width, x.bits)));
  }],
  ['trunc', (x, args) => {
    $bvArity('trunc', args, 1);
    const w = $bvInt('trunc', 'the width', args[0], 1, x.width);
    return $bv(w, x.signed, BigInt.asUintN(w, x.bits));
  }],
  ['and', (x, args) => $bvBitwise('and', x, args, (p, q) => p & q)],
  ['or', (x, args) => $bvBitwise('or', x, args, (p, q) => p | q)],
  ['xor', (x, args) => $bvBitwise('xor', x, args, (p, q) => p ^ q)],
  ['not', (x, args) => {
    $bvArity('not', args, 0);
    return $bv(x.width, x.signed, BigInt.asUintN(x.width, ~x.bits));
  }],
  ['shl', (x, args) => {
    $bvArity('shl', args, 1);
    const n = $bvAmount('shl', args[0]);
    if (n >= BigInt(x.width)) return $bv(x.width, x.signed, 0n);
    return $bv(x.width, x.signed, BigInt.asUintN(x.width, x.bits << n));
  }],
  ['shr', (x, args) => {
    $bvArity('shr', args, 1);
    const n = $bvAmount('shr', args[0]);
    if (n >= BigInt(x.width)) return $bv(x.width, x.signed, 0n);
    return $bv(x.width, x.signed, x.bits >> n);
  }],
  ['ashr', (x, args) => {
    $bvArity('ashr', args, 1);
    const n = $bvAmount('ashr', args[0]);
    const k = n >= BigInt(x.width) ? BigInt(x.width) : n;
    return $bv(x.width, x.signed, BigInt.asUintN(x.width, BigInt.asIntN(x.width, x.bits) >> k));
  }],
  ['asSigned', (x, args) => {
    $bvArity('asSigned', args, 0);
    return $bv(x.width, true, x.bits);
  }],
  ['asUnsigned', (x, args) => {
    $bvArity('asUnsigned', args, 0);
    return $bv(x.width, false, x.bits);
  }],
  ['toNumber', (x, args) => {
    $bvArity('toNumber', args, 0);
    const v = $bvValue(x);
    const max = BigInt(Number.MAX_SAFE_INTEGER);
    if (v > max || v < -max) throw new Error('x.toNumber: ' + $bvVerilog(x) + ' is beyond the safe integers (2^53-1)');
    return Number(v);
  }],
  ['toVerilog', (x, args) => {
    $bvArity('toVerilog', args, 0);
    return $bvVerilog(x);
  }],
]);
function $typeName(v) {
  if (v === null) return 'null';
  if (typeof v === 'boolean') return 'Boolean';
  if (typeof v === 'number') return Number.isInteger(v) ? 'Integer' : 'Double';
  if (typeof v === 'string') return 'String';
  if (Array.isArray(v)) return 'Array';
  if ($isBV(v)) return 'BitVector';
  return 'Object';
}
/**
 * x.m(…) for a bit-vector method no other receiver has (R-BV-9): the evaluator's callMethod on a vector. The
 * arguments come as a thunk, evaluated after the receiver as the evaluator does, and never on a null one.
 */
function $bvm(x, method, args, nullSafe) {
  if (x === null) {
    if (nullSafe) return null;
    throw new Error("Cannot call method '" + method + "' on null");
  }
  const a = args();
  if ($isBV(x)) {
    const m = $BV_METHODS.get(method);
    if (m !== undefined) return m(x, a);
    if (a.length === 0 && (method === 'width' || method === 'signed')) return x[method];
  }
  throw new Error("Unknown method '" + method + "' for type " + $typeName(x));
}
function $truthy(v) {
  if (v === null) return false;
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  if (typeof v === 'string') return v.length > 0;
  if (Array.isArray(v)) return v.length > 0;
  if ($isBV(v)) throw $bvNoTruth(v);
  return true;
}
/** Equality inside arrays and objects (evaluator.ts isEqual): two vectors of another width or signedness are unequal. */
function $same(a, b) {
  if (a === b) return true;
  if (a === null || b === null) return a === b;
  if ($isBV(a) || $isBV(b)) return $isBV(a) && $isBV(b) && a.width === b.width && a.signed === b.signed && a.bits === b.bits;
  if (typeof a !== typeof b) return false;
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((x, i) => $same(x, b[i]));
  if ($isObject(a) && $isObject(b)) {
    const ka = Object.keys(a);
    const kb = Object.keys(b);
    return ka.length === kb.length && ka.every(k => $same(a[k], b[k]));
  }
  return false;
}
/** ==: a bit-vector operand takes its own path (R-BV-3), where a mismatched pair is a defect. */
function $eq(a, b) { return $isBV(a) || $isBV(b) ? $bvOp('==', a, b) : $same(a, b); }
function $ne(a, b) { return $isBV(a) || $isBV(b) ? $bvOp('!=', a, b) : !$same(a, b); }
function $cmp(a, b, op) {
  if ($isBV(a) || $isBV(b)) return $bvCompare("'" + op + "'", a, b);
  if (a === b) return 0;
  if (a === null) return -1;
  if (b === null) return 1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  if (typeof a === 'string' && typeof b === 'string') return a.localeCompare(b);
  if (typeof a === 'boolean' && typeof b === 'boolean') return (a ? 1 : 0) - (b ? 1 : 0);
  return String(a).localeCompare(String(b));
}
function $lt(a, b) { return $cmp(a, b, '<') < 0; }
function $gt(a, b) { return $cmp(a, b, '>') > 0; }
function $le(a, b) { return $cmp(a, b, '<=') <= 0; }
function $ge(a, b) { return $cmp(a, b, '>=') >= 0; }
function $add(a, b) {
  if ($isBV(a) || $isBV(b)) {
    if (typeof a === 'string' || typeof b === 'string') return ($isBV(a) ? $bvVerilog(a) : String(a ?? '')) + ($isBV(b) ? $bvVerilog(b) : String(b ?? ''));
    return $bvOp('+', a, b);
  }
  if (typeof a === 'string' || typeof b === 'string') return String(a ?? '') + String(b ?? '');
  if (typeof a === 'number' && typeof b === 'number') return a + b;
  if (Array.isArray(a) && Array.isArray(b)) return [...a, ...b];
  return null;
}
function $sub(a, b) {
  if ($isBV(a) || $isBV(b)) return $bvOp('-', a, b);
  return typeof a === 'number' && typeof b === 'number' ? a - b : null;
}
function $mul(a, b) {
  if ($isBV(a) || $isBV(b)) return $bvOp('*', a, b);
  if (typeof a === 'number' && typeof b === 'number') return a * b;
  if (typeof a === 'string' && typeof b === 'number') return a.repeat(Math.max(0, Math.floor(b)));
  return null;
}
/** By zero: null, never Infinity. */
function $div(a, b) {
  if ($isBV(a) || $isBV(b)) return $bvOp('/', a, b);
  return typeof a === 'number' && typeof b === 'number' && b !== 0 ? a / b : null;
}
function $mod(a, b) {
  if ($isBV(a) || $isBV(b)) return $bvOp('%', a, b);
  return typeof a === 'number' && typeof b === 'number' && b !== 0 ? a % b : null;
}
function $neg(v) {
  if (typeof v === 'number') return -v;
  if ($isBV(v)) return $bv(v.width, v.signed, BigInt.asUintN(v.width, -v.bits));
  return null;
}
function $not(v) { return !$truthy(v); }
/** Both operands arrive evaluated: JjEL's and/or never short-circuit. */
function $and(a, b) { return $isBV(a) || $isBV(b) ? $bvOp('and', a, b) : $truthy(a) && $truthy(b); }
function $or(a, b) { return $isBV(a) || $isBV(b) ? $bvOp('or', a, b) : $truthy(a) || $truthy(b); }
/** x.[a]: the stored value, then the derived one; neither throws, never a silent null. */
function $read(s, id, a) {
  const own = $own(s.attrs, id) ? s.attrs[id] : undefined;
  let v = $own(own, a) ? own[a] : undefined;
  if (v === undefined || v === null) {
    const d = $own(s.derived, id) ? s.derived[id] : undefined;
    v = $own(d, a) ? d[a] : undefined;
  }
  if (v === undefined) throw new Error("'" + a + "' is not a state attribute of " + id);
  return v;
}
function $tokens(s, id) { return ($own(s.marking, id) ? s.marking[id] : undefined) ?? 0; }
function $marked(s, id) { return $tokens(s, id) !== 0; }
/** count(p) and sum(f) as the builtins: JavaScript truthiness, numbers only. */
function $count(vs) { let c = 0; for (const v of vs) if (v) c++; return c; }
function $sum(vs) { let t = 0; for (const v of vs) if (typeof v === 'number') t += v; return t; }
/** The value of an action: a boolean, a number, a string or a bit-vector (actionEvaluator.ts isSimValue). */
function $value(v) {
  if (typeof v === 'boolean' || typeof v === 'number' || typeof v === 'string' || $isBV(v)) return v;
  throw new Error('the value is ' + $describe(v) + ', not a boolean, a number or a string');
}
/** next: σ's marking and attributes with the writes of one step, all at once; derived values are the core's to rebuild. */
function $apply(s, writes) {
  const seen = new Set();
  for (const [id, a] of writes) {
    const k = id + '\\u0000' + a;
    if (seen.has(k)) throw new Error("'" + a + "' of " + id + ' is assigned twice in one step');
    seen.add(k);
  }
  const next = { marking: { ...s.marking }, attrs: {} };
  for (const id of Object.keys(s.attrs)) $set(next.attrs, id, { ...s.attrs[id] });
  for (const [id, a, v] of writes) {
    if (!$own(next.attrs, id)) $set(next.attrs, id, {});
    $set(next.attrs[id], a, v);
  }
  return next;
}
/** A guard's outcome, as the simulator's evaluateGuard gives it: true, false or a defect. */
function $guard(thunk) {
  let v;
  try { v = thunk(); } catch (e) { return { kind: 'defect', reason: 'exception', detail: String(e && e.message !== undefined ? e.message : e) }; }
  if (v === true) return { kind: 'true' };
  if (v === false) return { kind: 'false' };
  return { kind: 'defect', reason: 'non-boolean', detail: 'the guard returned ' + $describe(v) + ', not a boolean' };
}
`;

const BINARY: Record<BinaryOperator, string> = {
    '+': '$add', '-': '$sub', '*': '$mul', '/': '$div', '%': '$mod',
    '==': '$eq', '!=': '$ne', '<': '$lt', '>': '$gt', '<=': '$le', '>=': '$ge',
    and: '$and', or: '$or',
};

/** The collection methods that expand over a collection of M, element by element. */
const EXPANDED: ReadonlySet<string> = new Set(['all', 'any', 'none', 'count', 'sum']);

/**
 * The bit-vector methods no string, date, number or collection has (R-BV-9): on any other receiver the evaluator
 * throws, as `$bvm` does. A shared name (`toNumber`) is refused over a step value, its receiver's type unknown.
 */
const BITVECTOR_ONLY: ReadonlySet<string> = new Set([...BITVECTOR_METHOD_NAMES, 'width', 'signed'].filter(m =>
    !getStringMethod(m) && !getDateMethod(m) && !getNumberMethod(m) && !getCollectionMethod(m)));

/** The not-verifiable codes this printer refuses with the errors. */
const REFUSED_NOT_VERIFIABLE: ReadonlySet<SubsetCode> = new Set(['T-METHOD']);

const [MARKED, TOKENS] = STATE_RESERVED.readOnlyAttributes;

/** Path B, as for guards (`guardEvaluator.ts`): no context at construction, so no builtins. */
const EVALUATOR = new JjelEvaluator();

interface Walk {
    readonly out: JsRefusal[];
    readonly places: ReadonlySet<string>;
    readonly refs?: ReadonlyMap<string, string>;
}

function refuse(w: Walk, code: JsRefusalCode, message: string, at?: { location?: ASTLocation }): void {
    w.out.push({ code, message, ...(at?.location ? { location: at.location } : {}) });
}

function q(s: string): string {
    return JSON.stringify(s);
}

function fail(message: string): string {
    return `$fail(${q(message)})`;
}

/** An element in the printed code: its name in the `$ID` table, else its id literal. */
function ref(refs: ReadonlyMap<string, string> | undefined, id: string): string {
    return refs?.get(id) ?? q(id);
}

function messageOf(error: unknown): string {
    const e: any = error;
    return `${e?.constructor?.name ?? 'Error'}: ${e?.message ?? String(e)}`;
}

/** The subset checker's verdict, as refusals. */
function subsetRefusals(expr: JjelExpression, out: JsRefusal[]): void {
    for (const d of checkGuardSubset(expr)) {
        if (d.severity === 'error' || REFUSED_NOT_VERIFIABLE.has(d.code)) {
            out.push({ code: d.code, message: d.message, ...(d.location ? { location: d.location } : {}) });
        }
    }
}

/** Whether an expression reads σ (`.[x]`) or names `event`: then its value is known only in the step. */
function dependsOnStep(node: unknown): boolean {
    if (node === null || typeof node !== 'object') return false;
    if (Array.isArray(node)) return node.some(dependsOnStep);
    const e = node as { type?: unknown; name?: unknown };
    if (e.type === 'StateAccess') return true;
    if (e.type === 'Identifier' && e.name === 'event') return true;
    return Object.entries(node).some(([key, child]) => key !== 'location' && dependsOnStep(child));
}

function isElement(v: JjelValue): boolean {
    if (!isJjelObject(v)) return false;
    const id = (v as any).id;
    return typeof id === 'string' && id !== '';
}

function numberLiteral(n: number): string {
    if (Number.isNaN(n)) return 'NaN';
    if (n === Infinity) return 'Infinity';
    if (n === -Infinity) return '(-Infinity)';
    if (Object.is(n, -0)) return '(-0)';
    return n < 0 ? `(${n})` : String(n);
}

/** A bit-vector as the call that rebuilds it in the generated code, e.g. `$bv(8, false, 0xffn)` (R-BV-9). */
export function bitVectorLiteral(v: JjelBitVector): string {
    return `$bv(${v.width}, ${v.signed}, 0x${v.bits.toString(16)}n)`;
}

/** A value of M as a JavaScript constant; `null` when it has no form (a metaclass, a function, an object). */
function constant(v: JjelValue, refs?: ReadonlyMap<string, string>): string | null {
    if (v === null) return 'null';
    if (typeof v === 'boolean') return String(v);
    if (typeof v === 'string') return q(v);
    if (typeof v === 'number') return numberLiteral(v);
    if (isBitVector(v)) return bitVectorLiteral(v);
    if (Array.isArray(v)) {
        const parts = v.map(x => constant(x, refs));
        return parts.includes(null) ? null : `[${parts.join(', ')}]`;
    }
    if (isElement(v)) return `$E(${ref(refs, (v as any).id)})`;
    return null;
}

type Folded = { readonly ok: true; readonly value: JjelValue } | { readonly ok: false; readonly code: string };

/** A subexpression evaluated over M: its value, or the code that stands for its failure. */
function foldValue(w: Walk, e: JjelExpression, scope: EvaluationContext): Folded {
    let out: ReturnType<JjelEvaluator['evaluateWithDiagnostics']>;
    try {
        out = EVALUATOR.evaluateWithDiagnostics(e, scope);
    } catch (error) {
        return { ok: false, code: fail(messageOf(error)) };
    }
    const absent = firstAbsence(out.warnings);
    if (absent) {
        const hint = absent.suggestion ? `; maybe '${absent.suggestion}'` : '';
        refuse(w, 'P-ABSENT', `'${absent.identifier}' does not exist in the model${hint}.`, e);
        return { ok: false, code: 'null' };
    }
    return { ok: true, value: out.value };
}

function fold(w: Walk, e: JjelExpression, scope: EvaluationContext): string {
    const v = foldValue(w, e, scope);
    if (!v.ok) return v.code;
    const c = constant(v.value, w.refs);
    if (c === null) {
        refuse(w, 'P-CONST', `This value of the model is ${describeType(v.value)} without an id: it has no form in the generated code.`, e);
        return 'null';
    }
    return c;
}

/** `x.[a]` with `x` known at translation: a read of σ at that element, or the throw the evaluator would raise. */
function stateRead(w: Walk, e: StateAccessExpr, scope: EvaluationContext): string {
    const attr = e.attribute;
    if (dependsOnStep(e.object)) {
        refuse(w, 'P-STEP', `The element of '.[${attr}]' depends on the step: the generated code reads σ at elements known at translation.`, e);
        return 'null';
    }
    const target = foldValue(w, e.object, scope);
    if (!target.ok) return target.code;
    const v = target.value;
    if (!isElement(v)) {
        const got = v === null ? 'null' : Array.isArray(v) ? 'a collection' : typeof v;
        return fail(`'.[${attr}]' needs a model element on its left, got ${got}`);
    }
    const id: string = (v as any).id;
    if (attr === MARKED || attr === TOKENS) {
        if (!w.places.has(id)) return fail(`'${attr}' is not a state attribute of ${(v as any).name ?? id}`);
        return `${attr === MARKED ? '$marked' : '$tokens'}(state, ${ref(w.refs, id)})`;
    }
    return `$read(state, ${ref(w.refs, id)}, ${q(attr)})`;
}

/** `exists x in coll | p` over a collection of M: a disjunction that stops at the first true, as the evaluator's loop. */
function exists(w: Walk, e: ExistsExpr, scope: EvaluationContext): string {
    if (dependsOnStep(e.collection)) {
        refuse(w, 'P-STEP', 'The collection of `exists` depends on the step: it expands only over a collection of the model.', e);
        return 'null';
    }
    const coll = foldValue(w, e.collection, scope);
    if (!coll.ok) return coll.code;
    if (!Array.isArray(coll.value) || coll.value.length === 0) return 'false';
    const parts = coll.value.map(item => `$truthy(${print(w, e.predicate, scope.child({ [e.variable]: item ?? null }))})`);
    return `(${parts.join(' || ')})`;
}

/** The scope of a lambda's body for one element: the first parameter is the element, the others null. */
function bindLambda(scope: EvaluationContext, lambda: LambdaExpr, item: JjelValue): EvaluationContext {
    return scope.child(Object.fromEntries(lambda.params.map((p, i) => [p, i === 0 ? item ?? null : null])));
}

/** all, any, none, count and sum with a lambda, over a collection of M, element by element; a bit-vector method. */
function methodCall(w: Walk, e: MethodCallExpr | NullSafeMethodCallExpr, scope: EvaluationContext): string {
    if (BITVECTOR_ONLY.has(e.method)) {
        const args = e.args.map(a => print(w, a, scope)).join(', ');
        return `$bvm(${print(w, e.object, scope)}, ${q(e.method)}, () => [${args}], ${e.type === 'NullSafeMethodCall'})`;
    }
    if (dependsOnStep(e.object)) {
        refuse(w, 'P-STEP', `'${e.method}' is called on a value known only in the step: it has no translation.`, e);
        return 'null';
    }
    const arg = e.args.length === 1 ? e.args[0] : null;
    const lambda = arg !== null && arg.type === 'Lambda' ? arg : null;
    if (!EXPANDED.has(e.method) || lambda === null) {
        refuse(w, 'P-STEP', `'${e.method}(…)' with an argument that depends on the step has no translation: only all, any, none, count and sum with a lambda expand over a collection of the model.`, e);
        return 'null';
    }
    const receiver = foldValue(w, e.object, scope);
    if (!receiver.ok) return receiver.code;
    const items = receiver.value;
    if (items === null) return e.type === 'NullSafeMethodCall' ? 'null' : fail(`Cannot call method '${e.method}' on null`);
    if (!Array.isArray(items)) {
        refuse(w, 'P-STEP', `'${e.method}' is called on ${describeType(items)}, not on a collection.`, e);
        return 'null';
    }
    const bodies = items.map(item => print(w, lambda.body, bindLambda(scope, lambda, item)));
    switch (e.method) {
        case 'all': return bodies.length === 0 ? 'true' : `(${bodies.map(b => `!!(${b})`).join(' && ')})`;
        case 'any': return bodies.length === 0 ? 'false' : `(${bodies.map(b => `!!(${b})`).join(' || ')})`;
        case 'none': return bodies.length === 0 ? 'true' : `!(${bodies.map(b => `!!(${b})`).join(' || ')})`;
        case 'count': return `$count([${bodies.join(', ')}])`;
        default: return `$sum([${bodies.join(', ')}])`;
    }
}

function print(w: Walk, e: JjelExpression, scope: EvaluationContext): string {
    if (!dependsOnStep(e)) return fold(w, e, scope);
    const p = (x: JjelExpression) => print(w, x, scope);
    const step = (what: string) => {
        refuse(w, 'P-STEP', `${what} over a value known only in the step has no translation.`, e);
        return 'null';
    };

    switch (e.type) {
        case 'Literal':
            return constant(e.value, w.refs) ?? 'null';
        case 'Identifier':
            // The one name that depends on the step: the event, as an element.
            return '$E(event)';
        case 'Binary':
            return `${BINARY[e.operator]}(${p(e.left)}, ${p(e.right)})`;
        case 'Unary':
            return e.operator === 'not' ? `$not(${p(e.operand)})` : `$neg(${p(e.operand)})`;
        case 'IfThenElse':
            return `($truthy(${p(e.condition)}) ? ${p(e.thenBranch)} : ${e.elseBranch ? p(e.elseBranch) : 'null'})`;
        case 'NullCoalesce':
            return `(${p(e.left)} ?? ${p(e.right)})`;
        case 'Implies':
            return `(!$truthy(${p(e.left)}) || $truthy(${p(e.right)}))`;
        case 'ArrayLiteral':
            return `[${e.elements.map(p).join(', ')}]`;
        case 'StateAccess':
            return stateRead(w, e, scope);
        case 'Exists':
            return exists(w, e, scope);
        case 'MethodCall':
        case 'NullSafeMethodCall':
            return methodCall(w, e, scope);
        case 'MemberAccess':
        case 'NullSafeMemberAccess':
            return step(`'.${e.property}'`);
        case 'IndexAccess':
            return step('An index');
        case 'IsType':
            return step('`is`');
        case 'ForAll':
            return step('A `forall` collection');
        case 'InterpolatedString':
            return step('An interpolated string');
        case 'Lambda':
            return step('A lambda outside all, any, none, count and sum');
        case 'FunctionCall':
        case 'WithDo':
        case 'ObjectLiteral':
            // Refused by the subset checker before the walk (E-CALL, E-WITH, E-VALUE).
            return step(`'${e.type}'`);
        default: {
            const never: never = e;
            return never;
        }
    }
}

/** The fold scope of a site: the guard context over M with `self` the site and no event; `null` without a handle. */
function siteScope(ctx: JsPrintContext): EvaluationContext | null {
    return buildGuardContext(ctx.snapshot, { transitionId: ctx.site }, { event: null });
}

function noSite(ctx: JsPrintContext): JsPrintResult {
    return { ok: false, refusals: [{ code: 'P-SITE', message: `The site '${ctx.site}' has no handle in the model.` }] };
}

/**
 * A guard as a JavaScript expression over `state` and `event` whose value is
 * the evaluator's value. `$guard(() => <code>)` turns it into the simulator's
 * outcome: true, false or a defect.
 */
export function printGuard(expr: JjelExpression, ctx: JsPrintContext): JsPrintResult {
    const out: JsRefusal[] = [];
    subsetRefusals(expr, out);
    if (out.length > 0) return { ok: false, refusals: out };
    const scope = siteScope(ctx);
    if (scope === null) return noSite(ctx);
    const code = print({ out, places: ctx.places, refs: ctx.refs }, expr, scope);
    return out.length > 0 ? { ok: false, refusals: out } : { ok: true, code };
}

/**
 * The actions of one site as the body of a function over `state` and `event`
 * that returns the next state: each target and each value on σ, in order, then
 * every write at once. A target is resolved at translation, as
 * `judgeActionTarget` resolves it; one that names no element prints the throw
 * the run would halt with.
 */
export function printActions(actions: readonly JjelAction[], ctx: JsPrintContext): JsPrintResult {
    const scope = siteScope(ctx);
    if (scope === null) return noSite(ctx);
    const out: JsRefusal[] = [];
    const w: Walk = { out, places: ctx.places, refs: ctx.refs };
    const lines: string[] = [];
    const writes: string[] = [];

    actions.forEach((action, i) => {
        const { target, value } = action;
        const attr = target.attribute;
        if (target.object.type === 'Identifier' && target.object.name === STATE_RESERVED.presentationRoot) {
            refuse(w, 'P-PRESENTATION', `node.[${attr}] assigns presentation, which the generated state does not hold.`, target);
            return;
        }
        const judged = judgeActionTarget({ source: '', action, defect: null }, { element: ctx.site, role: 'transition' }, ctx.snapshot);
        let element: string | null = null;
        if (judged.kind === 'run') {
            refuse(w, 'P-TARGET', `The target of '.[${attr}] :=' depends on the step: the generated code writes at elements known at translation.`, target);
        } else if (judged.kind === 'unresolved') {
            lines.push(`${fail(judged.detail)};`);
        } else if (ctx.declared?.get(judged.target.element)?.get(attr)?.space === 'presentation') {
            lines.push(`${fail(`'${attr}' is a presentation attribute: only node.[${attr}] assigns it`)};`);
        } else {
            element = judged.target.element;
        }

        const before = out.length;
        subsetRefusals(value, out);
        if (out.length > before) return;
        lines.push(`const $v${i} = $value(${print(w, value, scope)});`);
        if (element !== null) writes.push(`[${ref(ctx.refs, element)}, ${q(attr)}, $v${i}]`);
    });

    if (out.length > 0) return { ok: false, refusals: out };
    lines.push(`return $apply(state, [${writes.join(', ')}]);`);
    return { ok: true, code: lines.join('\n') };
}
