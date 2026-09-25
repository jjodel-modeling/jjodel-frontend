/**
 * subsetChecker — what a guard may say (step 2, spec §5.4, R-SIM-18).
 *
 * Walks a parsed guard and reports, without evaluating anything, the
 * constructs that make it a defect, the ones that make it risky, and the ones
 * the `.smv` exporter will not translate. Three severities
 * (P-2026-09-24-1520, GO rulings):
 *
 * - `error`: the guard never runs; its arc is never a candidate (R-SIM-17).
 * - `warning`: the guard runs; the construct answers in a way the author may
 *   not expect.
 * - `not-verifiable`: the guard runs and simulates; the exporter will refuse it.
 *
 * ── The eager `and`/`or` (option (a), ruling 1) ──────────────────────────────
 *
 * The evaluator evaluates both operands of `and` and `or`
 * (`jjel/evaluator/evaluator.ts`, `evaluateBinary`), against `jjel/SPEC.md`.
 * So the null-guard idiom `x != null and x.p` throws when `x` is null, and
 * `x == null or x.p` throws where it should be true. The evaluator is not
 * changed here (R-SIM-15: its lane); the checker rejects the idiom and gives
 * the rewrite that short-circuits: `if … then … else false` for `and`,
 * `implies` for `or`. The rewrites keep their meaning if `and`/`or` ever
 * short-circuit. `x != null implies x.p` is NOT the rewrite of the `and` form:
 * it is true on null.
 *
 * ── Scope of the analysis ────────────────────────────────────────────────────
 *
 * Syntactic: no receiver types. A method is flagged by name only when the name
 * belongs to no group that translates (a string method named like a date
 * method, `format`, is left alone). The `not-verifiable` diagnostics are
 * conservative: over a frozen M every construct folds to a constant, and they
 * matter once a guard reads state (`.[x]`, step 3). One gap is declared, not
 * closed: a property read on a string or number is a silent `null`
 * (`self.name.foo == null` is true), and seeing it needs receiver types.
 *
 * Pure: types from JjEL only.
 */

import type { ASTLocation, BinaryExpr, JjelExpression } from '../../jjel/types/ast';
import { STATE_RESERVED } from '../../jjel/stateReserved';

export type SubsetSeverity = 'error' | 'warning' | 'not-verifiable';

export type SubsetCode =
    | 'E-NODE' | 'E-DATA' | 'E-SHADOW' | 'E-EAGER' | 'E-NOELSE' | 'E-FORALL' | 'E-VALUE' | 'E-WITH' | 'E-CALL'
    | 'W-NULLCMP' | 'W-TRUTHY' | 'W-IS'
    | 'T-DECIMAL' | 'T-DIV' | 'T-MOD' | 'T-METHOD';

export interface SubsetDiagnostic {
    readonly code: SubsetCode;
    readonly severity: SubsetSeverity;
    readonly message: string;
    readonly location?: ASTLocation;
}

/** The four roots of R-SIM-18, from the single list (R-SIM-41). Reserved: no local binding may take their names (ruling 5). */
export const GUARD_ROOTS: readonly string[] = STATE_RESERVED.roots;

/**
 * Builtin methods with no translation to nuXmv (discovery 2026-09-13 §7.2):
 * date methods but `format` (also a string method), the non-integer number
 * methods, and the collection methods that build orders, groups or strings.
 */
export const NOT_VERIFIABLE_METHODS: ReadonlySet<string> = new Set([
    // date (35 of 36: `format` is also a string method)
    'year', 'month', 'day', 'hour', 'minute', 'second', 'millisecond', 'dayOfWeek', 'dayOfYear',
    'weekOfYear', 'quarter', 'isLeapYear', 'daysInMonth', 'timestamp', 'toISOString', 'toDateString',
    'toTimeString', 'addDays', 'addMonths', 'addYears', 'addHours', 'addMinutes', 'addSeconds',
    'startOfDay', 'endOfDay', 'startOfMonth', 'endOfMonth', 'startOfYear', 'endOfYear', 'diffDays',
    'diffMonths', 'diffYears', 'isBefore', 'isAfter', 'isSameDay',
    // number
    'sqrt', 'pow', 'exp', 'log', 'log10', 'log2', 'sin', 'cos', 'tan', 'asin', 'acos', 'atan',
    'toFixed', 'toPrecision', 'toExponential', 'toHex', 'toBinary', 'toOctal',
    // collection
    'avg', 'sortBy', 'sortByDescending', 'groupBy', 'distinctBy', 'take', 'skip', 'takeWhile',
    'skipWhile', 'join',
    // string
    'matches',
]);

const SEVERITY: Record<SubsetCode, SubsetSeverity> = {
    'E-NODE': 'error', 'E-DATA': 'error', 'E-SHADOW': 'error', 'E-EAGER': 'error', 'E-NOELSE': 'error',
    'E-FORALL': 'error', 'E-VALUE': 'error', 'E-WITH': 'error', 'E-CALL': 'error',
    'W-NULLCMP': 'warning', 'W-TRUTHY': 'warning', 'W-IS': 'warning',
    'T-DECIMAL': 'not-verifiable', 'T-DIV': 'not-verifiable', 'T-MOD': 'not-verifiable', 'T-METHOD': 'not-verifiable',
};

const ORDERING = new Set(['<', '<=', '>', '>=']);
const ARITHMETIC = new Set(['+', '-', '*', '/', '%']);
/** Constructs below `or` in precedence (`jjel/parser/parser.ts` grammar): quoted after `implies`, they need parentheses. */
const LOOSE = new Set(['IfThenElse', 'ForAll', 'Exists', 'WithDo', 'NullCoalesce', 'Implies']);

interface Walk {
    readonly out: SubsetDiagnostic[];
    readonly source?: string;
}

function report(w: Walk, code: SubsetCode, message: string, at: JjelExpression): void {
    w.out.push({ code, severity: SEVERITY[code], message, ...(at.location ? { location: at.location } : {}) });
}

/** The source text of `e`, or `null` when the source or the offsets are missing. */
function textOf(w: Walk, e: JjelExpression): string | null {
    const s = e.location?.start.offset;
    const t = e.location?.end.offset;
    if (w.source === undefined || s === undefined || t === undefined || t < s) return null;
    return w.source.slice(s, t);
}

/** A syntactically non-boolean operand, converted by truthiness where a boolean is expected. */
function nonBoolean(e: JjelExpression): boolean {
    switch (e.type) {
        case 'Literal': return e.dataType !== 'EBoolean';
        case 'ArrayLiteral': case 'ObjectLiteral': case 'ForAll': case 'Lambda': case 'InterpolatedString': return true;
        case 'Binary': return ARITHMETIC.has(e.operator);
        case 'Unary': return e.operator === '-';
        default: return false;
    }
}

function isNullSafe(e: JjelExpression): boolean {
    return e.type === 'NullSafeMemberAccess' || e.type === 'NullSafeMethodCall';
}

function isNullLiteral(e: JjelExpression): boolean {
    return e.type === 'Literal' && e.value === null;
}

/** A navigation path: a name followed by `.p`, `?.p` or a literal `[i]`. */
function isPath(e: JjelExpression): boolean {
    switch (e.type) {
        case 'Identifier': return true;
        case 'MemberAccess': case 'NullSafeMemberAccess': return isPath(e.object);
        case 'IndexAccess': return e.index.type === 'Literal' && isPath(e.object);
        default: return false;
    }
}

function samePath(a: JjelExpression, b: JjelExpression): boolean {
    if (a.type === 'Identifier' && b.type === 'Identifier') return a.name === b.name;
    if ((a.type === 'MemberAccess' && b.type === 'MemberAccess')
        || (a.type === 'NullSafeMemberAccess' && b.type === 'NullSafeMemberAccess')) {
        return a.property === b.property && samePath(a.object, b.object);
    }
    if (a.type === 'IndexAccess' && b.type === 'IndexAccess') {
        return a.index.type === 'Literal' && b.index.type === 'Literal'
            && a.index.value === b.index.value && samePath(a.object, b.object);
    }
    return false;
}

function rootName(p: JjelExpression): string | null {
    switch (p.type) {
        case 'Identifier': return p.name;
        case 'MemberAccess': case 'NullSafeMemberAccess': case 'IndexAccess': return rootName(p.object);
        default: return null;
    }
}

function printPath(p: JjelExpression): string {
    switch (p.type) {
        case 'Identifier': return p.name;
        case 'MemberAccess': return `${printPath(p.object)}.${p.property}`;
        case 'NullSafeMemberAccess': return `${printPath(p.object)}?.${p.property}`;
        case 'IndexAccess': return `${printPath(p.object)}[${JSON.stringify(p.index.type === 'Literal' ? p.index.value : null)}]`;
        default: return '…';
    }
}

/** The operands of a chain of the same logical operator, `a and b and c` as [a, b, c]. */
function flatten(e: JjelExpression, op: 'and' | 'or'): JjelExpression[] {
    if (e.type === 'Binary' && e.operator === op) return [...flatten(e.left, op), ...flatten(e.right, op)];
    return [e];
}

/** `P != null` (for `and`) or `P == null` (for `or`), either side: the path P, or null. */
function nullTestedPath(t: JjelExpression, test: '!=' | '=='): JjelExpression | null {
    if (t.type !== 'Binary' || t.operator !== test) return null;
    if (isNullLiteral(t.right) && isPath(t.left)) return t.left;
    if (isNullLiteral(t.left) && isPath(t.right)) return t.right;
    return null;
}

/** The direct subexpressions of `e`, with the names each one binds. */
function children(e: JjelExpression): Array<[JjelExpression, readonly string[]]> {
    switch (e.type) {
        case 'Literal': case 'Identifier': return [];
        case 'Binary': case 'NullCoalesce': case 'Implies': return [[e.left, []], [e.right, []]];
        case 'Unary': return [[e.operand, []]];
        case 'MemberAccess': case 'NullSafeMemberAccess': return [[e.object, []]];
        case 'MethodCall': case 'NullSafeMethodCall': return [[e.object, []], ...e.args.map(a => [a, []] as [JjelExpression, string[]])];
        case 'FunctionCall': return e.args.map(a => [a, []] as [JjelExpression, string[]]);
        case 'IfThenElse': return [[e.condition, []], [e.thenBranch, []], ...(e.elseBranch ? [[e.elseBranch, []] as [JjelExpression, string[]]] : [])];
        case 'IsType': return [[e.expression, []]];
        case 'Lambda': return [[e.body, e.params]];
        case 'ArrayLiteral': return e.elements.map(x => [x, []] as [JjelExpression, string[]]);
        case 'InterpolatedString': return e.parts.flatMap(p => p.kind === 'expression' ? [[p.expr, []] as [JjelExpression, string[]]] : []);
        case 'ForAll': return [[e.collection, []], ...(e.filter ? [[e.filter, [e.variable]] as [JjelExpression, string[]]] : []),
            ...(e.projection ? [[e.projection, [e.variable]] as [JjelExpression, string[]]] : [])];
        case 'Exists': return [[e.collection, []], [e.predicate, [e.variable]]];
        case 'WithDo': return [[e.context, []]];
        case 'IndexAccess': return [[e.object, []], [e.index, []]];
        case 'ObjectLiteral': return e.entries.map(x => [x.value, []] as [JjelExpression, string[]]);
        case 'StateAccess': return [[e.object, []]];
        default: {
            const never: never = e;
            return never;
        }
    }
}

/**
 * `e` navigates through `p` with `.` or a method call, which throw on null.
 * `?.` and `[i]` do not throw and do not count. A scope that rebinds the root
 * name of `p` is not searched: there the name is another variable.
 */
function navigatesThrough(e: JjelExpression, p: JjelExpression, root: string): boolean {
    if ((e.type === 'MemberAccess' || e.type === 'MethodCall') && samePath(e.object, p)) return true;
    for (const [child, binds] of children(e)) {
        if (binds.includes(root)) continue;
        if (navigatesThrough(child, p, root)) return true;
    }
    return false;
}

/** The eager idiom (ruling 1): the path the left operand null-tests and the right one navigates. */
function eagerIdiom(b: BinaryExpr & { operator: 'and' | 'or' }): { path: JjelExpression; alone: boolean } | null {
    const conjuncts = flatten(b.left, b.operator);
    for (const t of conjuncts) {
        const path = nullTestedPath(t, b.operator === 'and' ? '!=' : '==');
        const root = path ? rootName(path) : null;
        if (path && root && navigatesThrough(b.right, path, root)) return { path, alone: conjuncts.length === 1 };
    }
    return null;
}

function eagerMessage(w: Walk, b: BinaryExpr & { operator: 'and' | 'or' }, idiom: { path: JjelExpression; alone: boolean }): string {
    const p = printPath(idiom.path);
    const right = textOf(w, b.right) ?? '…';
    const left = textOf(w, b.left) ?? '…';
    const head = `\`${b.operator}\` evaluates both operands: when ${p} is null the right operand throws, and the guard is a defect.`;
    if (b.operator === 'and') return `${head} Write: if ${left} then ${right} else false`;
    const r = LOOSE.has(b.right.type) ? `(${right})` : right;
    return idiom.alone
        ? `${head} Write: ${p} != null implies ${r}`
        : `${head} Write: not (${left}) implies ${r}`;
}

function checkBinder(w: Walk, name: string, at: JjelExpression): void {
    if (GUARD_ROOTS.includes(name)) {
        report(w, 'E-SHADOW', `'${name}' is a reserved root (${GUARD_ROOTS.join(', ')}): name the local variable otherwise.`, at);
    }
}

function truthy(w: Walk, operand: JjelExpression, where: string, at: JjelExpression): void {
    if (nonBoolean(operand)) {
        report(w, 'W-TRUTHY', `${where} converts a non-boolean operand by truthiness ([] is false, "a" is true): compare it explicitly.`, at);
    }
}

function walk(w: Walk, e: JjelExpression, bound: ReadonlySet<string>, lambdaAllowed: boolean): void {
    const plain = (x: JjelExpression) => walk(w, x, bound, false);
    const asArg = (x: JjelExpression) => walk(w, x, bound, true);
    const within = (x: JjelExpression, names: readonly string[]) => walk(w, x, new Set([...bound, ...names]), false);

    switch (e.type) {
        case 'Literal':
            if (e.dataType === 'EDouble') report(w, 'T-DECIMAL', 'Not verifiable: a decimal literal has no translation to bounded integers.', e);
            return;
        case 'Identifier':
            if (bound.has(e.name)) return;
            if (e.name === STATE_RESERVED.presentationRoot) report(w, 'E-NODE', '`node` is presentation state: a guard cannot depend on it (R-SIM-18).', e);
            else if (e.name === 'data') report(w, 'E-DATA', '`data` is not a root of guards: use `self`.', e);
            return;
        case 'Binary': {
            if (e.operator === '/') report(w, 'T-DIV', 'Not verifiable: `/` yields decimals.', e);
            if (e.operator === '%') report(w, 'T-MOD', 'Not verifiable: `%` follows JavaScript, not the nuXmv `mod`.', e);
            if (ORDERING.has(e.operator)) {
                for (const side of [e.left, e.right]) {
                    if (isNullSafe(side)) {
                        report(w, 'W-NULLCMP', `\`?.\` gives null when the receiver is null, and null compares below every number: \`${e.operator}\` answers on an absent value. Test the receiver first.`, e);
                        break;
                    }
                }
            }
            if (e.operator === 'and' || e.operator === 'or') {
                const b = e as BinaryExpr & { operator: 'and' | 'or' };
                const idiom = eagerIdiom(b);
                if (idiom) report(w, 'E-EAGER', eagerMessage(w, b, idiom), e);
                truthy(w, e.left, `\`${e.operator}\``, e);
                truthy(w, e.right, `\`${e.operator}\``, e);
            }
            plain(e.left);
            plain(e.right);
            return;
        }
        case 'Unary':
            if (e.operator === 'not') truthy(w, e.operand, '`not`', e);
            plain(e.operand);
            return;
        case 'MemberAccess':
        case 'NullSafeMemberAccess':
            plain(e.object);
            return;
        case 'MethodCall':
        case 'NullSafeMethodCall':
            if (NOT_VERIFIABLE_METHODS.has(e.method)) report(w, 'T-METHOD', `Not verifiable: \`${e.method}\` has no translation to nuXmv.`, e);
            plain(e.object);
            e.args.forEach(asArg);
            return;
        case 'FunctionCall':
            report(w, 'E-CALL', `\`${e.name}(…)\` calls a function, and guards have none: builtins such as now() are not available.`, e);
            e.args.forEach(asArg);
            return;
        case 'IfThenElse':
            if (e.elseBranch === null) report(w, 'E-NOELSE', '`if` without `else` yields null on the false branch, and a guard must be boolean (R-SIM-17): add `else false`.', e);
            truthy(w, e.condition, '`if`', e);
            plain(e.condition);
            plain(e.thenBranch);
            if (e.elseBranch) plain(e.elseBranch);
            return;
        case 'NullCoalesce':
            plain(e.left);
            plain(e.right);
            return;
        case 'IsType':
            report(w, 'W-IS', '`is` is false on model instances: write `self.instanceOf == ' + e.targetType + '`.', e);
            plain(e.expression);
            return;
        case 'Implies':
            truthy(w, e.left, '`implies`', e);
            truthy(w, e.right, '`implies`', e);
            plain(e.left);
            plain(e.right);
            return;
        case 'Lambda':
            if (!lambdaAllowed) report(w, 'E-VALUE', 'A lambda is a function value: it is allowed only as a method argument.', e);
            for (const p of e.params) checkBinder(w, p, e);
            within(e.body, e.params);
            return;
        case 'ArrayLiteral':
            e.elements.forEach(plain);
            return;
        case 'InterpolatedString':
            for (const part of e.parts) if (part.kind === 'expression') plain(part.expr);
            return;
        case 'ForAll':
            checkBinder(w, e.variable, e);
            plain(e.collection);
            if (e.filter) within(e.filter, [e.variable]);
            if (e.projection) within(e.projection, [e.variable]);
            return;
        case 'Exists':
            checkBinder(w, e.variable, e);
            plain(e.collection);
            within(e.predicate, [e.variable]);
            return;
        case 'WithDo':
            // The body is not walked: `with` binds the features of its object as
            // bare names, so no name inside it can be resolved statically.
            report(w, 'E-WITH', '`with … do` binds the features of its object as bare names, which can rebind the roots: navigate with `self.f`.', e);
            plain(e.context);
            return;
        case 'IndexAccess':
            plain(e.object);
            plain(e.index);
            return;
        case 'ObjectLiteral':
            report(w, 'E-VALUE', 'An object literal is never a verdict.', e);
            for (const entry of e.entries) plain(entry.value);
            return;
        case 'StateAccess':
            // Reading state is exportable (R-SIM-30); `node.[x]` is E-NODE through its object.
            plain(e.object);
            return;
        default: {
            const never: never = e;
            return never;
        }
    }
}

/**
 * The diagnostics of a parsed guard, in the order of a pre-order walk. `source`,
 * when given, lets the rewrite of E-EAGER quote the author's text.
 */
export function checkGuardSubset(expr: JjelExpression, source?: string): SubsetDiagnostic[] {
    const w: Walk = { out: [], source };
    if (expr.type === 'ForAll') {
        report(w, 'E-FORALL', '`forall` returns a collection, never a verdict: write `coll.all(x => …)` or `exists x in coll | …`.', expr);
    }
    walk(w, expr, new Set(), false);
    return w.out;
}
