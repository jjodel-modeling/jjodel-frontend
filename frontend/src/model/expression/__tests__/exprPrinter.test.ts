import { describe, expect, it } from 'vitest';
import type { ExprBinding, ExprRole } from '../exprBinding';
import { computeSharedNames, createExprPrinter, type ExprRead } from '../exprPrinter';

type Objects = Record<string, { cls: string; [feature: string]: unknown }>;

function readOf(objects: Objects, supers: Record<string, string[]> = {}): ExprRead {
    return {
        classOf: id => objects[id]?.cls,
        classNameOf: c => c,
        lineageOf: c => [c, ...(supers[c] ?? [])],
        values: (id, f) => {
            const v = objects[id]?.[f];
            if (v === undefined) return [];
            return Array.isArray(v) ? v : [v];
        },
        isObject: v => typeof v === 'string' && Object.prototype.hasOwnProperty.call(objects, v),
    };
}

const bindingOf = (parens: 'always' | 'minimal', roles: ExprRole[], sharing?: ExprBinding['sharing']): ExprBinding => ({
    v: 1, parens, slots: [], roles, ...(sharing ? { sharing } : {}),
});

const ADD: ExprRole = { class: 'Add', role: 'infix', symbol: '+', precedence: 6, assoc: 'left', operands: ['l', 'r'] };
const SUB: ExprRole = { class: 'Sub', role: 'infix', symbol: '-', precedence: 6, assoc: 'left', operands: ['l', 'r'] };
const MUL: ExprRole = { class: 'Mul', role: 'infix', symbol: '*', precedence: 7, assoc: 'left', operands: ['l', 'r'] };
const IMP: ExprRole = { class: 'Imp', role: 'infix', symbol: '->', precedence: 2, assoc: 'right', operands: ['l', 'r'] };
const EQ: ExprRole = { class: 'Eq', role: 'infix', symbol: '==', precedence: 5, assoc: 'none', operands: ['l', 'r'] };
const VAR: ExprRole = { class: 'Var', role: 'reference', attribute: 'n' };
const v = (n: string): { cls: string; n: string } => ({ cls: 'Var', n });

const print = (
    objects: Objects, parens: 'always' | 'minimal', roles: ExprRole[], root = 'root', mode = '',
): string => createExprPrinter(bindingOf(parens, roles), readOf(objects)).printNode(root, 0, mode, false);

describe('infix, by precedence climbing', () => {
    const operands = { a: v('a'), b: v('b'), c: v('c') };
    const roles = [ADD, SUB, MUL, IMP, EQ, VAR];

    it('wraps a lower-precedence operand only', () => {
        const objects: Objects = { ...operands, root: { cls: 'Mul', l: 's', r: 'c' }, s: { cls: 'Add', l: 'a', r: 'b' } };
        expect(print(objects, 'minimal', roles)).toBe('(a + b) * c');
        const flat: Objects = { ...operands, root: { cls: 'Add', l: 'a', r: 'm' }, m: { cls: 'Mul', l: 'b', r: 'c' } };
        expect(print(flat, 'minimal', roles)).toBe('a + b * c');
    });

    it('keeps left associativity on the left and wraps on the right', () => {
        const left: Objects = { ...operands, root: { cls: 'Sub', l: 's', r: 'c' }, s: { cls: 'Sub', l: 'a', r: 'b' } };
        expect(print(left, 'minimal', roles)).toBe('a - b - c');
        const right: Objects = { ...operands, root: { cls: 'Sub', l: 'a', r: 's' }, s: { cls: 'Sub', l: 'b', r: 'c' } };
        expect(print(right, 'minimal', roles)).toBe('a - (b - c)');
    });

    it('keeps right associativity on the right and wraps on the left', () => {
        const right: Objects = { ...operands, root: { cls: 'Imp', l: 'a', r: 's' }, s: { cls: 'Imp', l: 'b', r: 'c' } };
        expect(print(right, 'minimal', roles)).toBe('a -> b -> c');
        const left: Objects = { ...operands, root: { cls: 'Imp', l: 's', r: 'c' }, s: { cls: 'Imp', l: 'a', r: 'b' } };
        expect(print(left, 'minimal', roles)).toBe('(a -> b) -> c');
    });

    it('wraps both sides of a non-associative operator at equal precedence', () => {
        const objects: Objects = { ...operands, root: { cls: 'Eq', l: 's', r: 'c' }, s: { cls: 'Eq', l: 'a', r: 'b' } };
        expect(print(objects, 'minimal', roles)).toBe('(a == b) == c');
    });

    it('always wraps every infix, the root included', () => {
        const objects: Objects = { ...operands, root: { cls: 'Mul', l: 's', r: 'c' }, s: { cls: 'Add', l: 'a', r: 'b' } };
        expect(print(objects, 'always', roles)).toBe('((a + b) * c)');
    });

    it('honours a per-row override against the binding', () => {
        const objects: Objects = { ...operands, root: { cls: 'Mul', l: 's', r: 'c' }, s: { cls: 'Add', l: 'a', r: 'b' } };
        const never: ExprRole = { ...ADD, parens: 'never' };
        expect(print(objects, 'always', [MUL, never, VAR])).toBe('(a + b * c)');
        const always: ExprRole = { ...MUL, parens: 'always' };
        const flat: Objects = { ...operands, root: { cls: 'Add', l: 'a', r: 'm' }, m: { cls: 'Mul', l: 'b', r: 'c' } };
        expect(print(flat, 'minimal', [ADD, always, VAR])).toBe('a + (b * c)');
    });
});

describe('the other roles', () => {
    it('nary: bare for one operand, the zero text for none, wrapped by mode', () => {
        const nary: ExprRole = { class: 'And', role: 'nary', symbol: '&', precedence: 4, operands: 'ops' };
        const objects: Objects = { a: v('a'), b: v('b'), root: { cls: 'And', ops: ['a', 'b'] }, one: { cls: 'And', ops: ['a'] }, none: { cls: 'And', ops: [] } };
        expect(print(objects, 'always', [nary, VAR])).toBe('(a & b)');
        expect(print(objects, 'minimal', [nary, VAR])).toBe('a & b');
        expect(print(objects, 'always', [nary, VAR], 'one')).toBe('a');
        expect(print(objects, 'always', [nary, VAR], 'none')).toBe('()');
        expect(print(objects, 'always', [{ ...nary, zero: 'true' } as ExprRole, VAR], 'none')).toBe('true');
    });

    it('unary wraps a compound operand by the mode of the child', () => {
        const neg: ExprRole = { class: 'Neg', role: 'unary', symbol: '!', operand: 'o', precedence: 8 };
        const objects: Objects = { a: v('a'), b: v('b'), root: { cls: 'Neg', o: 's' }, s: { cls: 'Add', l: 'a', r: 'b' }, n: { cls: 'Neg', o: 'a' } };
        expect(print(objects, 'minimal', [neg, ADD, VAR])).toBe('!(a + b)');
        expect(print(objects, 'always', [neg, ADD, VAR])).toBe('!(a + b)');
        expect(print(objects, 'minimal', [neg, VAR], 'n')).toBe('!a');
    });

    it('literal: an attribute, and the boolean form by the type of another feature', () => {
        const lit: ExprRole = { class: 'Lit', role: 'literal', attribute: 'x' };
        const cst: ExprRole = {
            class: 'Const', role: 'literal', attribute: 'value',
            booleanWhen: { feature: 'type', class: 'Bool', true: '1', false: '0', other: 'bool({})' },
        };
        const objects: Objects = {
            b: { cls: 'Bool' }, w: { cls: 'Word' }, l0: { cls: 'Lit', x: 0 }, l1: { cls: 'Lit', x: 1 }, l5: { cls: 'Lit', x: 5 },
            t: { cls: 'Const', value: 'l1', type: 'b' }, f: { cls: 'Const', value: 'l0', type: 'b' }, o: { cls: 'Const', value: 'l5', type: 'b' }, n: { cls: 'Const', value: 'l1', type: 'w' },
        };
        const out = (root: string): string => print(objects, 'always', [lit, cst], root);
        expect(out('l0')).toBe('0');
        expect(out('t')).toBe('true');
        expect(out('f')).toBe('false');
        expect(out('o')).toBe('bool(5)');
        expect(out('n')).toBe('1');
    });

    it('reference with a prefix; call with its arguments', () => {
        const arg: ExprRole = { class: 'Arg', role: 'reference', attribute: 'n', prefix: '$' };
        const call: ExprRole = { class: 'Max', role: 'call', name: 'max', args: ['l', 'r'] };
        const objects: Objects = { a: v('a'), g: { cls: 'Arg', n: 'x' }, root: { cls: 'Max', l: 'a', r: 'g' } };
        expect(print(objects, 'always', [arg, call, VAR])).toBe('max(a, $x)');
    });

    it('conditional: wrapped under always; by precedence under minimal', () => {
        const cond: ExprRole = { class: 'Ite', role: 'conditional', cond: 'c', then: 't', else: 'e', precedence: 1 };
        const objects: Objects = {
            a: v('a'), b: v('b'), c: v('c'), root: { cls: 'Ite', c: 'a', t: 'b', e: 'n' }, n: { cls: 'Ite', c: 'a', t: 'b', e: 'c' },
            add: { cls: 'Add', l: 'root', r: 'c' },
        };
        expect(print(objects, 'always', [cond, VAR])).toBe('(a ? b : (a ? b : c))');
        expect(print(objects, 'minimal', [cond, VAR])).toBe('a ? b : a ? b : c');
        expect(print(objects, 'minimal', [cond, ADD, VAR], 'add')).toBe('(a ? b : a ? b : c) + c');
    });

    it('bracket', () => {
        const bracket: ExprRole = { class: 'Cat', role: 'bracket', open: '{', close: '}', separator: ', ', items: 'ops' };
        const objects: Objects = { a: v('a'), b: v('b'), root: { cls: 'Cat', ops: ['a', 'b'] } };
        expect(print(objects, 'always', [bracket, VAR])).toBe('{a, b}');
    });

    it('an absent operand prints ? and a class with no role <Class>', () => {
        const objects: Objects = { root: { cls: 'Add', l: 'x' }, x: { cls: 'Mystery' } };
        expect(print(objects, 'minimal', [ADD])).toBe('<Mystery> + ?');
    });

    it('a role of a superclass applies through the lineage', () => {
        const objects: Objects = { root: { cls: 'Sub1', n: 'a' } };
        const out = createExprPrinter(bindingOf('always', [{ class: 'Base', role: 'reference', attribute: 'n' }]), readOf(objects, { Sub1: ['Base'] })).printNode('root', 0, '', false);
        expect(out).toBe('a');
    });

    it('cuts a reference cycle instead of overflowing', () => {
        const objects: Objects = { root: { cls: 'Add', l: 'loop', r: 'root' }, loop: { cls: 'Var', n: 'a' } };
        expect(print(objects, 'minimal', [ADD, VAR])).toBe('a + <cycle>');
    });
});

describe('case', () => {
    const CASE: ExprRole = { class: 'Case', role: 'case', arms: 'arms', armClass: 'Arm', cond: 'c', value: 'x', otherwise: 'e' };
    const ARM: ExprRole = {
        class: 'Arm', role: 'pattern', args: { c: 'c', x: 'x' },
        forms: [{ when: [{ mode: 'caseArm' }], text: '{c} -> {x}' }, { text: '{c}: {x}' }],
    };
    const LOOP: ExprRole = { class: 'Loop', role: 'pattern', args: { body: 'body' }, text: '[{body*, }]' };
    const base: Objects = { a: v('a'), b: v('b'), c: v('c'), d: v('d'), arm1: { cls: 'Arm', c: 'a', x: 'b' }, arm2: { cls: 'Arm', c: 'c', x: 'd' } };

    it('prints arms and else with the defaults', () => {
        const objects: Objects = { ...base, root: { cls: 'Case', arms: ['arm1', 'arm2'], e: 'd' } };
        expect(print(objects, 'always', [CASE, ARM, VAR])).toBe('case {\n        a: b\n        c: d\n        else: d }');
    });

    it('prints an arm that is not an Arm in the mode caseArm, which the many hole inherits', () => {
        const objects: Objects = { ...base, loop: { cls: 'Loop', body: ['arm1', 'arm2'] }, root: { cls: 'Case', arms: ['loop'], e: 'd' } };
        expect(print(objects, 'always', [CASE, ARM, LOOP, VAR])).toBe('case {\n        [a -> b, c -> d]\n        else: d }');
    });

    it('prints an Arm with no cond in the mode too', () => {
        const objects: Objects = { ...base, bare: { cls: 'Arm', x: 'b' }, root: { cls: 'Case', arms: ['bare'], e: 'd' } };
        expect(print(objects, 'always', [CASE, ARM, VAR])).toBe('case {\n        ? -> b\n        else: d }');
    });
});

describe('pattern holes', () => {
    const roleOf = (text: string): ExprRole => ({ class: 'P', role: 'pattern', args: { x: 'x', y: 'y', items: 'items' }, text });
    const out = (text: string, fields: Record<string, unknown>, extra: Objects = {}, mode = ''): string =>
        print({ ...extra, root: { cls: 'P', ...fields } }, 'minimal', [roleOf(text), ADD, VAR], 'root', mode);
    const nested: Objects = { a: v('a'), b: v('b'), s: { cls: 'Add', l: 'a', r: 'b' } };

    it('a plain hole prints a value, an object at precedence 0, and ? when absent', () => {
        expect(out('<{x}>', { x: 7 })).toBe('<7>');
        expect(out('<{x}>', { x: 's' }, nested)).toBe('<a + b>');
        expect(out('<{x}>', {})).toBe('<?>');
    });

    it('an atom hole wraps a compound and leaves a name bare', () => {
        expect(out('{x^}[1:0]', { x: 's' }, nested)).toBe('(a + b)[1:0]');
        expect(out('{x^}[1:0]', { x: 'a' }, nested)).toBe('a[1:0]');
    });

    it('a default hole fills in when the value is missing or empty, and keeps a zero', () => {
        expect(out('{x!none}', {})).toBe('none');
        expect(out('{x!none}', { x: '' })).toBe('none');
        expect(out('{x!none}', { x: 0 })).toBe('0');
    });

    it('a truth hole reads attribute truth', () => {
        expect(out('{x?yes|no}', { x: true })).toBe('yes');
        expect(out('{x?yes|no}', { x: false })).toBe('no');
        expect(out('{x?yes|no}', { x: '' })).toBe('no');
        expect(out('{x?yes|no}', {})).toBe('no');
        expect(out('{x?yes|no}', { x: 0 })).toBe('yes');
    });

    it('a many hole joins the values', () => {
        expect(out('[{items*, }]', { items: ['a', 'b'] }, nested)).toBe('[a, b]');
        expect(out('[{items*, }]', { items: [] })).toBe('[]');
    });

    it('escapes braces', () => {
        expect(out('{{{x}}}', { x: 1 })).toBe('{1}');
    });

    it('a single hole resets the mode, a many hole inherits it', () => {
        const seen: ExprRole = { class: 'Seen', role: 'pattern', args: {}, forms: [{ when: [{ mode: 'm' }], text: 'IN' }, { text: 'OUT' }] };
        const objects: Objects = { s: { cls: 'Seen' }, root: { cls: 'P', x: 's', items: ['s'] } };
        const roles = [roleOf('{x} {items*,}'), seen];
        expect(print(objects, 'minimal', roles, 'root', 'm')).toBe('OUT IN');
    });

    it('takes the first form that holds', () => {
        const role: ExprRole = {
            class: 'P', role: 'pattern', args: { x: 'x', y: 'y' },
            forms: [
                { when: [{ has: 'x' }, { plain: 'x' }, { absent: 'y' }], text: 'plain {x}' },
                { when: [{ has: 'x' }], text: 'listed {x}' },
                { text: 'none' },
            ],
        };
        const of = (fields: Record<string, unknown>): string => print({ root: { cls: 'P', ...fields } }, 'minimal', [role]);
        expect(of({ x: 'one' })).toBe('plain one');
        expect(of({ x: 'one,two' })).toBe('listed one,two');
        expect(of({ x: 'one two' })).toBe('listed one two');
        expect(of({ x: 'one', y: 1 })).toBe('listed one');
        expect(of({})).toBe('none');
    });
});

describe('the sharing pass', () => {
    const sharing = { classes: ['Int'], minLength: 4, minCount: 3, prefix: 'D' };
    const supers = { Add: ['Int'], Var: ['Int'] };
    const add = (l: string, r: string): { cls: string; l: string; r: string } => ({ cls: 'Add', l, r });

    /** Three copies of `aa + bb` inside three copies of `(aa + bb) + cc`, and three of `dd + ee`. */
    const objects: Objects = {
        aa: v('aa'), bb: v('bb'), cc: v('cc'), dd: v('dd'), ee: v('ee'),
        i1: add('aa', 'bb'), i2: add('aa', 'bb'), i3: add('aa', 'bb'),
        o1: add('i1', 'cc'), o2: add('i2', 'cc'), o3: add('i3', 'cc'),
        x1: add('dd', 'ee'), x2: add('dd', 'ee'), x3: add('dd', 'ee'),
        once: add('cc', 'cc'),
    };
    const binding = bindingOf('always', [ADD, VAR], sharing);
    const read = readOf(objects, supers);
    const ids = Object.keys(objects);
    const plain = createExprPrinter(binding, read);
    const shared = computeSharedNames(binding, read, id => plain.printNode(id, 0, '', false), ids);

    it('names the outermost repeated texts, longest first, and drops what they contain', () => {
        expect([...shared]).toEqual([['((aa + bb) + cc)', 'D1'], ['(dd + ee)', 'D2']]);
    });

    it('substitutes at every nested print with sharing on, and never with it off', () => {
        const on = createExprPrinter(binding, read, { shared });
        const wrapped: Objects = { ...objects, top: add('o1', 'x1') };
        const onTop = createExprPrinter(binding, readOf(wrapped, supers), { shared });
        expect(on.printNode('o2', 0, '', true)).toBe('D1');
        expect(onTop.printNode('top', 0, '', true)).toBe('(D1 + D2)');
        expect(on.printNode('o2', 0, '', false)).toBe('((aa + bb) + cc)');
        expect(on.printNode('i1', 0, '', true)).toBe('(aa + bb)');
    });

    it('needs the count and a length strictly above minLength', () => {
        const tight = bindingOf('always', [ADD, VAR], { ...sharing, minLength: 9 });
        expect([...computeSharedNames(tight, read, id => plain.printNode(id, 0, '', false), ids)]).toEqual([['((aa + bb) + cc)', 'D1']]);
        const often = bindingOf('always', [ADD, VAR], { ...sharing, minCount: 4 });
        expect([...computeSharedNames(often, read, id => plain.printNode(id, 0, '', false), ids)]).toEqual([]);
    });

    it('has no names without a sharing record', () => {
        expect([...computeSharedNames(bindingOf('always', [ADD, VAR]), read, id => plain.printNode(id, 0, '', false), ids)]).toEqual([]);
    });

    it('reuses the memo', () => {
        const store = new Map<string, string>();
        const memo = { get: (id: string, key: string) => store.get(`${id}|${key}`), set: (id: string, key: string, t: string) => void store.set(`${id}|${key}`, t) };
        const printer = createExprPrinter(binding, read, { memo });
        expect(printer.printNode('o1', 0, '', false)).toBe('((aa + bb) + cc)');
        store.set('o1|0//0', 'FROM MEMO');
        expect(printer.printNode('o1', 0, '', false)).toBe('FROM MEMO');
    });
});
