/**
 * Probe of P-2026-11-04-0303 (textual step C discovery). Read-only on the code; moved to docs/discovery/harness/ after
 * its run. Writes its findings to .agent-logs/probe_c_notation.txt at the repo root.
 *
 * (1) Expression notation: the print of today on a boolean-expression metamodel (BOOL, added here, not to the corpus)
 *     and on the SyncRTL models of the RISC-V Briefs (read-only, from the folder in the PROTO environment variable);
 *     the operator annotation as today's resolution and check see it; a probe-local precedence-climbing printer and parser, flat and left-fold,
 *     for the round trip; parentheses as a tree record; the existing diff on nested expression objects in block form.
 * (2) T4b: the messages of today's checks on ambiguous annotations, and the cost of a live preview at 1,000 objects.
 * (3) T5: a Pascal/Ada style record and an indentation stand-in (a pre-pass that writes the braces an INDENT/DEDENT
 *     lexer would emit) on the corpus: round trip, model unchanged across styles, and broken input.
 */
import { describe, it } from 'vitest';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import type { ElementIds, SyntaxAnnotations } from '../annotations';
import { resolveAnnotations } from '../annotations';
import { deriveBaseGrammar } from '../baseGrammar';
import { concreteGrammarEbnf, deriveConcreteGrammar } from '../concreteGrammar';
import type { ConcreteGrammar } from '../concreteGrammar';
import type { TextMetamodel, TextObject } from '../metamodel';
import { classFeatures } from '../metamodel';
import { isApplicableParse, parseText, tokenizeText } from '../parser';
import type { ObjectSpan } from '../printer';
import { printTextModel } from '../printer';
import { checkStyle } from '../styleCheck';
import { CLIKE_STYLE } from '../style';
import type { NotationStyle } from '../style';
import { textualNotation } from '../syntaxRecord';
import { planTextEdit } from '../textDiff';
import { LIBRARY_IDS, LIBRARY_MM, libraryObjects, mutantsOf, probeTokens, tolerantCases } from './tolerantCorpus';
import type { TolerantCase } from './tolerantCorpus';

const OUT: string[] = [];
const log = (...xs: unknown[]): void => { OUT.push(xs.map(x => (typeof x === 'string' ? x : JSON.stringify(x))).join(' ')); };
const flush = (): void => writeFileSync(new URL('../../../../../.agent-logs/probe_c_notation.txt', import.meta.url), OUT.join('\n') + '\n');

// ---------------------------------------------------------------------------------------------------------------------
// Metamodels
// ---------------------------------------------------------------------------------------------------------------------

/** The prototype's local folder, from the environment: the probe names no path of its own. */
const PROTO = process.env.PROTO ?? '';

/** SyncRTL from its Ecore, read-only: classes, features, lower bounds, the one enumeration. */
function syncRtl(): { mm: TextMetamodel; ids: ElementIds } {
    const s = readFileSync(`${PROTO}/metamodels/SyncRTL.ecore`, 'utf8');
    const classes: any[] = [];
    const enumerations: any[] = [];
    const ids = { classes: {} as Record<string, string>, features: {} as Record<string, any>, enums: {} as Record<string, string> };
    const re = /<eClassifiers xsi:type="ecore:(EClass|EEnum)" name="(\w+)"([^>]*?)(\/>|>([\s\S]*?)<\/eClassifiers>)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(s))) {
        const [, kind, name, attrs, , body = ''] = m;
        if (kind === 'EEnum') { enumerations.push({ name, literals: [...body.matchAll(/eLiterals name="(\w+)"/g)].map(x => x[1]) }); ids.enums[`E_${name}`] = name; continue; }
        const supers = /eSuperTypes="([^"]+)"/.exec(attrs)?.[1].split(' ').map(x => x.replace('#//', ''));
        const attributes: any[] = [];
        const references: any[] = [];
        for (const f of body.matchAll(/<eStructuralFeatures xsi:type="ecore:(EAttribute|EReference)" name="(\w+)"([^>]*)>/g)) {
            const [, k, n, a] = f;
            const type = /eType="[^"]*?(\w+)"/.exec(a)![1];
            const many = a.includes('upperBound="-1"');
            const lower = a.includes('lowerBound="1"') ? 1 : 0;
            if (k === 'EAttribute') attributes.push({ name: n, type, many });
            else references.push({ name: n, type, many, containment: a.includes('containment="true"') });
            ids.features[`F_${name}_${n}`] = { owner: name, name: n, lower };
        }
        classes.push({ name, isAbstract: attrs.includes('abstract="true"'), supers, attributes, references });
        ids.classes[`C_${name}`] = name;
    }
    return { mm: { classes, enumerations }, ids };
}

/** A SyncRTL model from its JSON (nested objects): ids `o1`, `o2`, ... in document order. */
function loadSync(path: string): TextObject[] {
    const out: TextObject[] = [];
    let n = 0;
    const walk = (e: any): string => {
        const id = `o${++n}`;
        const slots: Record<string, unknown> = {};
        const o = { id, cls: e.__type, slots };
        out.push(o);
        for (const [k, v] of Object.entries(e)) {
            if (k.startsWith('__') || k === 'className') continue;
            if (Array.isArray(v)) slots[k] = v.map(x => (x && typeof x === 'object' ? walk(x) : x));
            else if (v && typeof v === 'object') slots[k] = walk(v);
            else slots[k] = v;
        }
        return id;
    };
    walk(JSON.parse(readFileSync(path, 'utf8')));
    return out;
}

/** BOOL: a small boolean-expression metamodel, not hardware. Use refers to an Atom (a cross-reference inside an expression). */
const BOOL_MM: TextMetamodel = {
    classes: [
        { name: 'Sheet', attributes: [{ name: 'name', type: 'EString' }], references: [{ name: 'atoms', type: 'Atom', containment: true, many: true }, { name: 'rules', type: 'Rule', containment: true, many: true }] },
        { name: 'Atom', attributes: [{ name: 'name', type: 'EString' }] },
        { name: 'Rule', attributes: [{ name: 'name', type: 'EString' }], references: [{ name: 'when', type: 'Expr', containment: true }] },
        { name: 'Expr', isAbstract: true },
        { name: 'Use', supers: ['Expr'], references: [{ name: 'atom', type: 'Atom' }] },
        { name: 'Lit', supers: ['Expr'], attributes: [{ name: 'value', type: 'EBoolean' }] },
        { name: 'Not', supers: ['Expr'], references: [{ name: 'op', type: 'Expr', containment: true }] },
        { name: 'And', supers: ['Expr'], references: [{ name: 'ops', type: 'Expr', containment: true, many: true, ordered: true }] },
        { name: 'Or', supers: ['Expr'], references: [{ name: 'ops', type: 'Expr', containment: true, many: true, ordered: true }] },
        { name: 'Imp', supers: ['Expr'], references: [{ name: 'left', type: 'Expr', containment: true }, { name: 'right', type: 'Expr', containment: true }] },
    ],
    enumerations: [],
};
const BOOL_IDS: ElementIds = {
    classes: { C_Sheet: 'Sheet', C_Atom: 'Atom', C_Rule: 'Rule', C_Expr: 'Expr', C_Use: 'Use', C_Lit: 'Lit', C_Not: 'Not', C_And: 'And', C_Or: 'Or', C_Imp: 'Imp' },
    features: {
        F_Sheet_name: { owner: 'Sheet', name: 'name', lower: 1 }, F_Sheet_atoms: { owner: 'Sheet', name: 'atoms' }, F_Sheet_rules: { owner: 'Sheet', name: 'rules' },
        F_Atom_name: { owner: 'Atom', name: 'name', lower: 1 }, F_Rule_name: { owner: 'Rule', name: 'name', lower: 1 }, F_Rule_when: { owner: 'Rule', name: 'when', lower: 1 },
        F_Use_atom: { owner: 'Use', name: 'atom', lower: 1 }, F_Lit_value: { owner: 'Lit', name: 'value', lower: 1 }, F_Not_op: { owner: 'Not', name: 'op', lower: 1 },
        F_And_ops: { owner: 'And', name: 'ops' }, F_Or_ops: { owner: 'Or', name: 'ops' }, F_Imp_left: { owner: 'Imp', name: 'left', lower: 1 }, F_Imp_right: { owner: 'Imp', name: 'right', lower: 1 },
    },
    enums: {},
};

/** The BOOL model: `driver` mirrors the Briefs' dmem_we (`Conj(st, Disj(is_sw))`), and the cases the round trip has to keep. */
function boolObjects(): TextObject[] {
    const os: TextObject[] = [];
    let n = 0;
    const mk = (cls: string, slots: Record<string, unknown>): string => { const id = `x${++n}`; os.push({ id, cls, slots }); return id; };
    const atoms = ['st', 'is_sw', 'ld', 'rdy'].map(a => mk('Atom', { name: a }));
    const [st, sw, ld, rdy] = atoms;
    const use = (a: string): string => mk('Use', { atom: a });
    const rules = [
        ['driver', mk('And', { ops: [use(st), mk('Or', { ops: [use(sw)] })] })],
        ['guard', mk('Or', { ops: [mk('And', { ops: [use(st), use(ld)] }), mk('Not', { op: use(rdy) })] })],
        ['chain', mk('And', { ops: [use(st), use(ld), use(rdy)] })],
        ['nested', mk('And', { ops: [mk('And', { ops: [use(st), use(ld)] }), use(rdy)] })],
        ['impR', mk('Imp', { left: use(st), right: mk('Imp', { left: use(ld), right: use(rdy) }) })],
        ['impL', mk('Imp', { left: mk('Imp', { left: use(st), right: use(ld) }), right: use(rdy) })],
        ['empty', mk('And', { ops: [] })],
        ['lit', mk('Or', { ops: [mk('Lit', { value: true }), mk('Not', { op: mk('Not', { op: use(st) }) })] })],
    ].map(([name, when]) => mk('Rule', { name, when }));
    const sheet: TextObject = { id: 'sheet', cls: 'Sheet', slots: { name: 'core', atoms, rules } };
    return [sheet, ...os];
}

// ---------------------------------------------------------------------------------------------------------------------
// The probe-local expression notation: an operator table, a printer, a precedence-climbing parser
// ---------------------------------------------------------------------------------------------------------------------

type Op =
    | { readonly kind: 'nary'; readonly symbol: string; readonly prec: number; readonly feat: string; readonly call: string }
    | { readonly kind: 'binary'; readonly symbol: string; readonly prec: number; readonly assoc: 'left' | 'right'; readonly left: string; readonly right: string }
    | { readonly kind: 'prefix'; readonly symbol: string; readonly prec: number; readonly feat: string };

interface Notation {
    readonly mm: TextMetamodel;
    readonly ops: Readonly<Record<string, Op>>;
    /** Classes printed as a bare word: the class and how to read and write the word. */
    readonly word: { readonly cls: string; readonly feat: string; readonly ref?: boolean };
    readonly lits?: { readonly cls: string; readonly feat: string };
    /** `flat`: a chain of one n-ary symbol is one object. `fold`: every symbol is binary, left-nested. */
    readonly nary: 'flat' | 'fold';
}

const BOOL_NOTATION: Notation = {
    mm: BOOL_MM,
    ops: {
        Imp: { kind: 'binary', symbol: '->', prec: 1, assoc: 'right', left: 'left', right: 'right' },
        Or: { kind: 'nary', symbol: '|', prec: 2, feat: 'ops', call: 'or' },
        And: { kind: 'nary', symbol: '&', prec: 3, feat: 'ops', call: 'and' },
        Not: { kind: 'prefix', symbol: '!', prec: 9, feat: 'op' },
    },
    word: { cls: 'Use', feat: 'atom', ref: true },
    lits: { cls: 'Lit', feat: 'value' },
    nary: 'flat',
};

const syncNotation = (mm: TextMetamodel, nary: 'flat' | 'fold'): Notation => ({
    mm,
    ops: {
        Implies: { kind: 'binary', symbol: '->', prec: 1, assoc: 'right', left: 'left', right: 'right' },
        Disj: { kind: 'nary', symbol: '|', prec: 2, feat: 'ops', call: 'or' },
        Conj: { kind: 'nary', symbol: '&', prec: 3, feat: 'ops', call: 'and' },
        Eq: { kind: 'binary', symbol: '=', prec: 4, assoc: 'left', left: 'left', right: 'right' },
        Le: { kind: 'binary', symbol: '<=', prec: 4, assoc: 'left', left: 'left', right: 'right' },
        Add: { kind: 'binary', symbol: '+', prec: 5, assoc: 'left', left: 'left', right: 'right' },
        Sub: { kind: 'binary', symbol: '-', prec: 5, assoc: 'left', left: 'left', right: 'right' },
        Neg: { kind: 'prefix', symbol: '!', prec: 9, feat: 'op' },
    },
    word: { cls: 'Ref', feat: 'name' },
    nary,
});

const SYMBOLS = ['->', '<=', '&', '|', '=', '+', '-', '!', '(', ')', ',', '[', ']', '_'];

/** Prints an expression; `parens`: object id to the number of extra parentheses the tree kept around it. */
function printExpr(N: Notation, byId: ReadonlyMap<string, TextObject>, id: string, parens: ReadonlyMap<string, number> = new Map(), atomName?: (id: string) => string): string {
    const featuresOf = (cls: string) => classFeatures(N.mm, N.mm.classes.find(c => c.name === cls)!);
    const pr = (eid: unknown, ctx: { prec: number; side: 'L' | 'R' | 'N' | 'P' | 'T'; cls?: string }): string => {
        const o = byId.get(String(eid));
        if (!o) return '_';
        const op = N.ops[o.cls];
        let s: string;
        let needs = false;
        if (op?.kind === 'nary' && (N.nary === 'fold' || (o.slots[op.feat] as unknown[] ?? []).length >= 2)) {
            const xs = (o.slots[op.feat] as unknown[]) ?? [];
            if (N.nary === 'fold' && xs.length < 2) s = `${op.call}(${xs.map(x => pr(x, { prec: 0, side: 'T' })).join(', ')})`;
            else if (N.nary === 'fold') s = xs.map((x, i) => pr(x, { prec: op.prec, side: i === 0 ? 'L' : 'R', cls: o.cls })).join(` ${op.symbol} `);
            else s = xs.map(x => pr(x, { prec: op.prec, side: 'N', cls: o.cls })).join(` ${op.symbol} `);
            // flat: a child of the same precedence is grouped, or the parse would merge it into the chain
            needs = op.prec < ctx.prec || (op.prec === ctx.prec && (N.nary === 'flat' ? ctx.side === 'N' || ctx.side === 'L' || ctx.side === 'R' : ctx.side === 'R' || ctx.cls !== o.cls));
            if (N.nary === 'fold' && xs.length < 2) needs = false;
        } else if (op?.kind === 'nary') {
            const xs = (o.slots[op.feat] as unknown[]) ?? [];
            s = `${op.call}(${xs.map(x => pr(x, { prec: 0, side: 'T' })).join(', ')})`;
        } else if (op?.kind === 'binary') {
            s = `${pr(o.slots[op.left], { prec: op.prec, side: 'L', cls: o.cls })} ${op.symbol} ${pr(o.slots[op.right], { prec: op.prec, side: 'R', cls: o.cls })}`;
            needs = op.prec < ctx.prec || (op.prec === ctx.prec && (ctx.side === 'N' || (op.assoc === 'left' ? ctx.side === 'R' : ctx.side === 'L') || ctx.cls !== o.cls));
        } else if (op?.kind === 'prefix') {
            s = `${op.symbol}${pr(o.slots[op.feat], { prec: op.prec, side: 'P' })}`;
        } else if (o.cls === N.word.cls) {
            const v = o.slots[N.word.feat];
            s = N.word.ref ? (atomName ? atomName(String(v)) : String(v)) : String(v);
        } else if (N.lits && o.cls === N.lits.cls) {
            s = String(o.slots[N.lits.feat]);
        } else {
            const args = featuresOf(o.cls).map(f => {
                const v = o.slots[f.name];
                if (v == null) return '_';
                if (f.kind === 'containment') return f.many ? `[${(v as unknown[]).map(x => pr(x, { prec: 0, side: 'T' })).join(', ')}]` : pr(v, { prec: 0, side: 'T' });
                return Array.isArray(v) ? `[${v.join(', ')}]` : String(v);
            });
            s = `${o.cls}(${args.join(', ')})`;
        }
        const extra = parens.get(o.id) ?? 0;
        if (needs) s = `(${s})`;
        return '('.repeat(extra) + s + ')'.repeat(extra);
    };
    return pr(id, { prec: 0, side: 'T' });
}

interface Parsed { readonly objects: TextObject[]; readonly root: string; readonly parens: Map<string, number>; readonly error?: string }

/** Precedence climbing over the operator table; `atomOf` resolves a word to an Atom id (BOOL). */
function parseExpr(N: Notation, text: string, atomOf?: (name: string) => string | undefined): Parsed {
    const toks: { k: 'ID' | 'INT' | 'P'; v: string }[] = [];
    for (let i = 0; i < text.length;) {
        if (/\s/.test(text[i])) { i++; continue; }
        const id = /^[A-Za-z_][A-Za-z0-9_]*/.exec(text.slice(i));
        if (id && id[0] !== '_') { toks.push({ k: 'ID', v: id[0] }); i += id[0].length; continue; }
        const num = /^\d+/.exec(text.slice(i));
        if (num) { toks.push({ k: 'INT', v: num[0] }); i += num[0].length; continue; }
        const p = SYMBOLS.find(s => text.startsWith(s, i));
        if (!p) return { objects: [], root: '', parens: new Map(), error: `unexpected ${text[i]} at ${i}` };
        toks.push({ k: 'P', v: p });
        i += p.length;
    }
    toks.push({ k: 'P', v: 'EOF' });
    let p = 0;
    let n = 0;
    const objects: TextObject[] = [];
    const parens = new Map<string, number>();
    const mk = (cls: string, slots: Record<string, unknown>): string => { const id = `p${++n}`; objects.push({ id, cls, slots }); return id; };
    const peek = () => toks[p];
    const eat = (v: string) => { if (peek().v !== v) throw new Error(`expected ${v}, found ${peek().v}`); p++; };
    const infix = new Map(Object.entries(N.ops).filter(([, o]) => o.kind !== 'prefix').map(([cls, o]) => [o.symbol, { cls, o }]));
    const prefix = new Map(Object.entries(N.ops).filter(([, o]) => o.kind === 'prefix').map(([cls, o]) => [o.symbol, { cls, o }]));
    const calls = new Map(Object.entries(N.ops).flatMap(([cls, o]) => (o.kind === 'nary' ? [[o.call, { cls, o }] as const] : [])));
    const featuresOf = (cls: string) => classFeatures(N.mm, N.mm.classes.find(c => c.name === cls)!);

    const expr = (min: number): string => {
        let left = unary();
        for (;;) {
            const t = peek();
            const hit = t.k === 'P' ? infix.get(t.v) : undefined;
            if (!hit || hit.o.prec < min) return left;
            const { cls, o } = hit;
            if (o.kind === 'nary' && N.nary === 'flat') {
                const ops = [left];
                while (peek().k === 'P' && peek().v === o.symbol) { p++; ops.push(expr(o.prec + 1)); }
                left = mk(cls, { [o.feat]: ops });
            } else if (o.kind === 'nary') {
                p++;
                left = mk(cls, { [o.feat]: [left, expr(o.prec + 1)] });
            } else if (o.kind === 'binary') {
                p++;
                const right = expr(o.assoc === 'left' ? o.prec + 1 : o.prec);
                left = mk(cls, { [o.left]: left, [o.right]: right });
            }
        }
    };
    const unary = (): string => {
        const t = peek();
        const pre = t.k === 'P' ? prefix.get(t.v) : undefined;
        if (pre && pre.o.kind === 'prefix') { p++; return mk(pre.cls, { [pre.o.feat]: unary() }); }
        return primary();
    };
    const value = (f: { kind: string; many: boolean }): unknown => {
        const t = peek();
        if (t.v === '_') { p++; return null; }
        if (f.kind === 'containment') {
            if (!f.many) return expr(0);
            eat('[');
            const xs: string[] = [];
            if (peek().v !== ']') { xs.push(expr(0)); while (peek().v === ',') { p++; xs.push(expr(0)); } }
            eat(']');
            return xs;
        }
        p++;
        if (t.k === 'INT') return Number(t.v);
        if (t.v === 'true' || t.v === 'false') return t.v === 'true';
        return t.v;
    };
    const primary = (): string => {
        const t = peek();
        if (t.k === 'P' && t.v === '(') {
            p++;
            const inner = expr(0);
            eat(')');
            parens.set(inner, (parens.get(inner) ?? 0) + 1);
            return inner;
        }
        if (t.k !== 'ID') throw new Error(`expected an operand, found ${t.v}`);
        p++;
        if (peek().v === '(') {
            const call = calls.get(t.v);
            p++;
            if (call && call.o.kind === 'nary') {
                const xs: string[] = [];
                if (peek().v !== ')') { xs.push(expr(0)); while (peek().v === ',') { p++; xs.push(expr(0)); } }
                eat(')');
                return mk(call.cls, { [call.o.feat]: xs });
            }
            const slots: Record<string, unknown> = {};
            featuresOf(t.v).forEach((f, i) => { if (i) eat(','); const v = value(f); if (v !== null) slots[f.name] = v; });
            eat(')');
            return mk(t.v, slots);
        }
        if (N.lits && (t.v === 'true' || t.v === 'false')) return mk(N.lits.cls, { [N.lits.feat]: t.v === 'true' });
        if (N.word.ref) return mk(N.word.cls, { [N.word.feat]: atomOf?.(t.v) ?? `?${t.v}` });
        return mk(N.word.cls, { [N.word.feat]: t.v });
    };
    try {
        const root = expr(0);
        if (peek().v !== 'EOF') throw new Error(`unexpected ${peek().v}`);
        // Parentheses the printer writes anyway are not extra: keep only those beyond the minimal print.
        return { objects, root, parens };
    } catch (e) {
        return { objects, root: '', parens, error: (e as Error).message };
    }
}

/** A structural form of an expression, ids left out: equal iff the two trees are the same model. */
function canon(byId: ReadonlyMap<string, TextObject>, id: unknown, ref: (v: unknown) => string = v => String(v)): string {
    const o = byId.get(String(id));
    if (!o) return '-';
    const keys = Object.keys(o.slots).filter(k => o.slots[k] != null && !(Array.isArray(o.slots[k]) && false)).sort();
    const part = (k: string): string => {
        const v = o.slots[k];
        const one = (x: unknown): string => (typeof x === 'string' && byId.has(x) ? canon(byId, x, ref) : k === 'atom' ? ref(x) : JSON.stringify(x));
        return `${k}=${Array.isArray(v) ? `[${v.map(one).join(',')}]` : one(v)}`;
    };
    return `${o.cls}(${keys.map(part).join(';')})`;
}

/** Spans moved over one replacement, as the editor's decorations carry them (a span inside the replaced text collapses). */
function carry(spans: readonly ObjectSpan[], at: number, oldLen: number, newLen: number): ObjectSpan[] {
    const d = newLen - oldLen;
    const end = at + oldLen;
    const mv = (x: number, isEnd: boolean): number => (x < at ? x : x > end ? x + d : isEnd ? (x === end ? x + d : at) : (x === at ? at : at + newLen));
    return spans.map(s => ({ id: s.id, start: mv(s.start, false), end: mv(s.end, true) }));
}

// ---------------------------------------------------------------------------------------------------------------------
// Styles of T5
// ---------------------------------------------------------------------------------------------------------------------

const PASCAL: NotationStyle = {
    id: 'pascal', name: 'Pascal/Ada', layout: 'free',
    blockOpen: ['begin'], blockClose: ['end', ';'], emptyBlock: ['begin', 'end', ';'],
    assign: [':='], terminator: [';'], list: { open: '(', separator: ',', close: ')' },
    string: { quote: "'", escape: 'double' }, comments: { line: '--', block: ['(*', '*)'] },
    reservedNames: ['begin', 'end'], classCase: 'declared', literalCase: 'declared', indent: 2,
};

/** The C-like print with its braces taken out: the text of the indentation style. */
function toIndent(clike: string): string {
    return clike.split('\n').filter(l => l.trim() !== '}').map(l => l.replace(/ \{\}$/, '').replace(/ \{$/, '')).join('\n');
}

/**
 * The stand-in of an INDENT/DEDENT lexer: the braces such a lexer emits, written back into the text. A line opens a
 * block when the next line is deeper; a line whose first word is a class keyword with a block and that opens none gets
 * `{}`; a dedent closes the blocks it leaves; the end of text closes every block. Tabs count as one column, as spaces.
 */
function fromIndent(text: string, classKw: ReadonlySet<string>): string {
    const lines = text.split('\n');
    const depthOf = (l: string): number => l.length - l.trimStart().length;
    const out: string[] = [];
    const stack: number[] = [];
    const nonBlank = lines.map((l, i) => [l, i] as const).filter(([l]) => l.trim() !== '');
    nonBlank.forEach(([l, i], k) => {
        const d = depthOf(l);
        while (stack.length && d <= stack[stack.length - 1]) out.push(' '.repeat(stack.pop()!) + '}');
        const next = nonBlank[k + 1];
        const nd = next ? depthOf(next[0]) : -1;
        if (nd > d) { out.push(`${l} {`); stack.push(d); }
        else if (classKw.has(l.trim().split(/\s/)[0])) out.push(`${l} {}`);
        else out.push(l);
        void i;
    });
    while (stack.length) out.push(' '.repeat(stack.pop()!) + '}');
    return out.join('\n');
}

const classKeywordsOf = (g: ConcreteGrammar): Set<string> => new Set(Object.values(g.objects).flatMap(r => {
    const first = r.body.t === 'seq' ? r.body.items[0] : undefined;
    const last = r.body.t === 'seq' ? r.body.items[r.body.items.length - 1] : undefined;
    return first?.t === 'kw' && last?.t === 'block' ? [first.text] : [];
}));

// ---------------------------------------------------------------------------------------------------------------------

describe('probe P-2026-11-04-0303', () => {
    it('runs', () => {
        const t0 = Date.now();
        const { mm: SYNC, ids: SYNC_IDS } = syncRtl();
        log(`== setup: SyncRTL ${SYNC.classes.length} classes, ${SYNC.enumerations.length} enumeration`);
        const syncFiles = ['out/arb3-syncrtl.json', 'out/arb3_rr-syncrtl.json', 'out/arb3_fixed-syncrtl.json', 'out/scaling-ref/mc_w4_r4-syncrtl.json', 'out/scaling-ref/pf_w4_r4-syncrtl.json', 'out/scaling-ref/mc_w32_r32-syncrtl.json']
            .filter(f => existsSync(`${PROTO}/${f}`));
        const sync = syncFiles.map(f => ({ name: f.replace(/^.*\//, '').replace('-syncrtl.json', ''), objects: loadSync(`${PROTO}/${f}`) }));
        const gSync = deriveConcreteGrammar(deriveBaseGrammar(SYNC), CLIKE_STYLE);
        const exprClasses = new Set(SYNC.classes.filter(c => c.name !== 'Expr' && (c.supers ?? []).includes('Expr')).map(c => c.name));

        // ---------------- (1a) today's print ----------------
        log('\n== (1a) the print of today, C-like, no annotations');
        for (const m of sync) {
            const r = printTextModel(gSync, m.objects);
            const byId = new Map(m.objects.map(o => [o.id, o]));
            const roots = m.objects.flatMap(o => ['driver', 'next', 'expr', 'reset'].flatMap(f => (typeof o.slots[f] === 'string' ? [o.slots[f] as string] : [])));
            const spanOf = new Map(r.spans.map(s => [s.id, s]));
            const exprLines = roots.reduce((acc, id) => { const s = spanOf.get(id)!; return acc + r.text.slice(s.start, s.end).split('\n').length; }, 0);
            const exprs = m.objects.filter(o => exprClasses.has(o.cls)).length;
            const nary = m.objects.filter(o => o.cls === 'Conj' || o.cls === 'Disj');
            const hist: Record<string, number> = {};
            for (const o of nary) { const k = `${o.cls}/${Math.min(((o.slots.ops as unknown[]) ?? []).length, 3)}`; hist[k] = (hist[k] ?? 0) + 1; }
            const same = nary.filter(o => ((o.slots.ops as string[]) ?? []).some(c => byId.get(c)?.cls === o.cls)).length;
            log(`${m.name}: objects ${m.objects.length}, expression objects ${exprs}, roots ${roots.length}, text lines ${r.text.split('\n').length}, chars ${r.text.length}, lines of expressions ${exprLines}; Conj/Disj by arity (3 = 3+) ${JSON.stringify(hist)}; with a same-class child ${same}`);
        }
        const mc = sync.find(m => m.name === 'mc_w4_r4')!;
        {
            const r = printTextModel(gSync, mc.objects);
            const port = mc.objects.find(o => o.cls === 'Port' && o.slots.name === 'dmem_we')!;
            const s = r.spans.find(x => x.id === port.id)!;
            log('-- mc_w4_r4 output dmem_we, as printed today:');
            log(r.text.slice(s.start, s.end));
            const big = sync.find(m => m.name === 'mc_w32_r32') ?? mc;
            const rb = big === mc ? r : printTextModel(gSync, big.objects);
            const instr = big.objects.find(o => o.cls === 'Port' && o.slots.name === 'instr') ?? big.objects.find(o => o.cls === 'Port');
            const si = rb.spans.find(x => x.id === instr!.id)!;
            log(`-- ${big.name} input ${instr!.slots.name}, as printed today:`);
            log(rb.text.slice(si.start, si.end));
        }

        // ---------------- (1b) the operator annotation today ----------------
        log('\n== (1b) BOOL with the operator annotation, as resolution and check see it today');
        const bool = boolObjects();
        const opRecord: SyntaxAnnotations = {
            v: 1,
            classes: {
                C_And: { operator: { symbol: '&', precedence: 3 } }, C_Or: { operator: { symbol: '|', precedence: 2 } },
                C_Imp: { operator: { symbol: '->', precedence: 1, assoc: 'right' } }, C_Not: { operator: { symbol: '!', precedence: 9 } },
                C_Use: { keyword: '', layout: 'line' }, C_Lit: { keyword: '', layout: 'line' },
            },
            features: { F_Use_atom: { keyword: '' }, F_Lit_value: { keyword: '' }, F_Rule_when: { keyword: '' } },
        };
        const nb = textualNotation(BOOL_MM, { record: opRecord, issues: [] }, BOOL_IDS);
        for (const i of nb.issues) log(`issue ${i.level} ${i.where}: ${i.message}`);
        const fb = checkStyle(nb.grammar).filter(f => f.level !== 'ok');
        log(`checkStyle findings (not ok): ${fb.length}`);
        for (const f of fb) log(`  ${f.level} ${f.rule} ${f.where}: ${f.message}`);
        const pb = printTextModel(nb.grammar, bool);
        const rule1 = pb.spans.find(s => s.id === bool.find(o => o.slots.name === 'driver')!.id)!;
        log('-- rule driver, printed with the record (operators stored, not applied):');
        log(pb.text.slice(rule1.start, rule1.end));
        const reparsed = parseText(pb.text, nb.grammar);
        log(`reparse: errors ${reparsed.errors.length}, reprint identical ${printTextModel(nb.grammar, reparsed.objects).text === pb.text}, lines ${pb.text.split('\n').length}`);
        const ebnf = concreteGrammarEbnf(nb.grammar).split('\n').filter(l => /^(And|Use|Expr_|Rule) /.test(l));
        for (const l of ebnf) log(`ebnf ${l}`);
        log(`the real tokenizer on "a -1": ${tokenizeText('a -1', nb.grammar).tokens.map(t => `${t.k}:${t.raw}`).join(' ')}; on "a & b": ${tokenizeText('a & b', nb.grammar).tokens.map(t => `${t.k}:${t.raw}`).join(' ')} errors ${tokenizeText('a & b', nb.grammar).errors.map(e => e.message).join('; ')}`);

        // ---------------- (1c) the probe's expression notation, round trip ----------------
        log('\n== (1c) precedence climbing: round trip on BOOL and SyncRTL');
        {
            const byId = new Map(bool.map(o => [o.id, o]));
            const atomName = (id: string) => String(byId.get(id)?.slots.name);
            const atomOf = (nm: string) => bool.find(o => o.cls === 'Atom' && o.slots.name === nm)?.id;
            for (const nary of ['flat', 'fold'] as const) {
                const N = { ...BOOL_NOTATION, nary };
                for (const r of bool.filter(o => o.cls === 'Rule')) {
                    const text = printExpr(N, byId, String(r.slots.when), new Map(), atomName);
                    const back = parseExpr(N, text, atomOf);
                    const bm = new Map([...bool, ...back.objects].map(o => [o.id, o]));
                    const same = !back.error && canon(byId, r.slots.when) === canon(bm, back.root);
                    const again = back.error ? '' : printExpr(N, bm, back.root, new Map(), atomName);
                    log(`${nary} ${String(r.slots.name).padEnd(7)} ${text.padEnd(34)} model kept ${same}  reprint identical ${again === text}${back.error ? ` error ${back.error}` : ''}${same ? '' : `  parsed as ${canon(bm, back.root, atomName as any).slice(0, 120)}`}`);
                }
            }
            // Redundant parentheses: typed by the user, kept by the tree or not.
            const N = BOOL_NOTATION;
            for (const typed of ['st & (is_sw)', 'st & or(is_sw)', '((st)) | ld', '(st & ld) & rdy', 'st & (ld & rdy)', '!(st)']) {
                const back = parseExpr(N, typed, atomOf);
                const bm = new Map([...bool, ...back.objects].map(o => [o.id, o]));
                const minimal = printExpr(N, bm, back.root, new Map(), atomName);
                const fromTree = printExpr(N, bm, back.root, back.parens, atomName);
                // The tree keeps a parenthesis only beyond those the printer writes anyway.
                const needed = new Map<string, number>();
                for (const [id, k] of back.parens) {
                    const without = printExpr(N, bm, back.root, new Map([...needed, [id, 0]]), atomName);
                    void without;
                    needed.set(id, k);
                }
                const kept = new Map<string, number>();
                for (const [id, k] of back.parens) {
                    const probe = printExpr(N, bm, back.root, new Map([[id, k]]), atomName);
                    const base = printExpr(N, bm, back.root, new Map(), atomName);
                    // extra = parens typed minus those the minimal print has around that object
                    const minimalAround = base.length + 2 * k === probe.length ? 0 : 0;
                    kept.set(id, k - minimalAround);
                }
                const treeExtra = new Map<string, number>();
                for (const [id, k] of back.parens) {
                    const o = bm.get(id)!;
                    const op = N.ops[o.cls];
                    const inner = printExpr(N, bm, id, new Map(), atomName);
                    void op;
                    treeExtra.set(id, Math.max(0, k - (minimal.includes(`(${inner})`) ? 1 : 0)));
                }
                const exact = printExpr(N, bm, back.root, treeExtra, atomName);
                log(`typed ${JSON.stringify(typed).padEnd(20)} model ${canon(bm, back.root, atomName as any).slice(0, 70).padEnd(70)} minimal print ${JSON.stringify(minimal).padEnd(22)} with the tree's parentheses ${JSON.stringify(exact)} (raw count reprint ${JSON.stringify(fromTree)})`);
            }
        }
        for (const nary of ['flat', 'fold'] as const) {
            let roots = 0; let kept = 0; let identical = 0; let errors = 0; let chars = 0; let firstFail = '';
            for (const m of sync) {
                const N = syncNotation(SYNC, nary);
                const byId = new Map(m.objects.map(o => [o.id, o]));
                for (const o of m.objects) {
                    for (const f of ['driver', 'next', 'expr', 'reset']) {
                        const id = o.slots[f];
                        if (typeof id !== 'string') continue;
                        roots++;
                        const text = printExpr(N, byId, id);
                        chars += text.length;
                        const back = parseExpr(N, text);
                        if (back.error) { errors++; if (!firstFail) firstFail = `${m.name} ${o.slots.name}.${f}: ${back.error} in ${text.slice(0, 160)}`; continue; }
                        const bm = new Map(back.objects.map(x => [x.id, x]));
                        if (canon(byId, id) === canon(bm, back.root)) kept++;
                        else if (!firstFail) firstFail = `${m.name} ${o.slots.name}.${f}: ${text.slice(0, 160)}`;
                        if (printExpr(N, bm, back.root) === text) identical++;
                    }
                }
            }
            log(`SyncRTL ${nary}: expression roots ${roots}, model kept ${kept}, reprint identical ${identical}, parse errors ${errors}, chars of all expressions ${chars}${firstFail ? `; first failure: ${firstFail}` : ''}`);
        }
        {
            const N = syncNotation(SYNC, 'flat');
            const byId = new Map(mc.objects.map(o => [o.id, o]));
            const port = mc.objects.find(o => o.cls === 'Port' && o.slots.name === 'dmem_we')!;
            log(`-- mc_w4_r4 dmem_we.driver in the probe's notation: ${printExpr(N, byId, String(port.slots.driver))}`);
            const wire = mc.objects.find(o => o.cls === 'Wire' && o.slots.name === 'mem_addr');
            if (wire) log(`-- mc_w4_r4 wire mem_addr.expr: ${printExpr(N, byId, String(wire.slots.expr))}`);
            const longest = mc.objects.flatMap(o => (o.cls === 'Wire' ? [printExpr(N, byId, String(o.slots.expr))] : [])).sort((a, b) => b.length - a.length)[0];
            log(`-- mc_w4_r4 longest wire expression (${longest.length} chars): ${longest.slice(0, 220)}`);
        }

        // ---------------- (1d) the existing diff on nested expression objects (block form) ----------------
        log('\n== (1d) BOOL in block form: edits inside an expression, through planTextEdit');
        {
            const g = nb.grammar;
            const pr = printTextModel(g, bool);
            const edits: [string, string, string][] = [
                ['retarget a Use', 'when {\n      And {\n        ops {\n          st', 'when {\n      And {\n        ops {\n          ld'],
                ['swap two operands', 'ops {\n          st\n          Or {', 'ops {\n          Or {'],
                ['wrap an operand in Not', 'ops {\n          st\n', 'ops {\n          Not { op { st } }\n'],
                ['And into Or', 'when {\n      And {\n        ops {\n          st', 'when {\n      Or {\n        ops {\n          st'],
                ['delete one operand', 'ops {\n          st\n          Or {', 'ops {\n          Or {'],
            ];
            const at0 = pr.text.indexOf('driver');
            for (const [label, from, to] of edits) {
                const at = pr.text.indexOf(from, at0);
                if (at < 0) { log(`${label}: the text to edit was not found`); continue; }
                let text = pr.text.slice(0, at) + to + pr.text.slice(at + from.length);
                if (label === 'swap two operands') {
                    // move `st` after the Or block of driver
                    const orEnd = text.indexOf('}\n          }\n', at) + '}\n          }\n'.length;
                    text = text.slice(0, orEnd) + '          st\n' + text.slice(orEnd);
                }
                const parsed = parseText(text, g);
                const previous = carry(pr.spans, at, from.length, to.length);
                const plan = planTextEdit({ mm: BOOL_MM, grammar: g, model: bool, parsed, previous, unprinted: [] });
                const ops = (plan.diff?.ops ?? []).map(o => o.op);
                const count: Record<string, number> = {};
                for (const o of ops) count[o] = (count[o] ?? 0) + 1;
                const unc = plan.diff?.match.matches.filter(m => m.uncertain).map(m => m.by) ?? [];
                log(`${label.padEnd(24)} parse errors ${parsed.errors.length}; ops ${JSON.stringify(count)}; uncertain ${JSON.stringify(unc)}; refusals ${JSON.stringify(plan.refusals.map(r => r.code))}; lines ${plan.lines?.length ?? 'null'}`);
            }
        }

        // ---------------- (2) T4b: refusals as the check reports them; preview cost ----------------
        log('\n== (2) T4b: ambiguous annotations, the messages of today');
        const ambiguous: [string, SyntaxAnnotations][] = [
            ['two classes, one keyword', { v: 1, classes: { C_And: { keyword: 'all' }, C_Or: { keyword: 'all' } } }],
            ['two positional containments', { v: 1, features: { F_Imp_left: { keyword: '' }, F_Imp_right: { keyword: '' } } }],
            ['a keyword that is a block token', { v: 1, features: { F_Rule_when: { keyword: 'x' } }, classes: { C_Rule: { keyword: '{' as any } } }],
            ['an operator symbol that is a block token', { v: 1, classes: { C_And: { operator: { symbol: '{', precedence: 1 } } } }],
            ['two operators, one symbol', { v: 1, classes: { C_And: { operator: { symbol: '&', precedence: 1 } }, C_Or: { operator: { symbol: '&', precedence: 2 } } } }],
            ['a one-line class with an optional name', { v: 1, classes: { C_Sheet: { layout: 'line' } } }],
        ];
        for (const [label, rec] of ambiguous) {
            const n = textualNotation(BOOL_MM, { record: rec, issues: [] }, { ...BOOL_IDS, features: { ...BOOL_IDS.features, F_Sheet_name: { owner: 'Sheet', name: 'name', lower: 0 } } });
            const fs = checkStyle(n.grammar).filter(f => f.level !== 'ok');
            log(`${label}:`);
            for (const f of fs) log(`  ${f.level} [${f.rule}] ${f.where}: ${f.message}`);
            if (!fs.length) log('  (no finding)');
        }
        {
            const objects = libraryObjects(900, 99);
            const rec: SyntaxAnnotations = { v: 1, classes: { C_Book: { layout: 'line', name: { keyword: 'titled' } } }, features: { A_Book_genre: { keyword: '' }, R_Book_borrowedBy: { keyword: 'by' } } };
            const times: number[][] = [];
            for (let k = 0; k < 15; k++) {
                const a = performance.now();
                const n = textualNotation(LIBRARY_MM, { record: rec, issues: [] }, LIBRARY_IDS);
                const b = performance.now();
                checkStyle(n.grammar);
                const c = performance.now();
                concreteGrammarEbnf(n.grammar);
                const d = performance.now();
                printTextModel(n.grammar, objects);
                const e = performance.now();
                times.push([b - a, c - b, d - c, e - d, e - a]);
            }
            const med = (i: number): string => [...times.map(t => t[i])].sort((x, y) => x - y)[7].toFixed(2);
            log(`preview at ${objects.length} objects, median of 15 (ms): derive ${med(0)}, check ${med(1)}, ebnf ${med(2)}, print ${med(3)}, total ${med(4)}`);
            const res = resolveAnnotations({ v: 1, classes: { C_X: {} } } as any, LIBRARY_IDS, LIBRARY_MM);
            log(`an unknown class id: ${res.issues.map(i => `${i.level} ${i.where}: ${i.message}`).join('; ')}`);
        }

        // ---------------- (3) T5: styles ----------------
        log('\n== (3) T5: Pascal/Ada and the indentation stand-in on the corpus');
        const plainCases: TolerantCase[] = [
            ...tolerantCases().filter(c => !c.name.includes('annotated') && !c.name.includes('lines')),
            { name: 'bool, plain', mm: BOOL_MM, g: deriveConcreteGrammar(deriveBaseGrammar(BOOL_MM), CLIKE_STYLE), objects: bool },
            { name: 'arb3 SyncRTL, plain', mm: SYNC, g: gSync, objects: sync[0].objects },
        ];
        for (const c of plainCases) {
            const canonOf = (objs: readonly TextObject[]): string => printTextModel(c.g, objs).text;
            const truth = canonOf(c.objects);
            // Pascal
            let gp: ConcreteGrammar | null = null;
            try { gp = deriveConcreteGrammar(deriveBaseGrammar(c.mm), { ...PASCAL, classCase: c.g.style.classCase, literalCase: c.g.style.literalCase }); } catch (e) { log(`${c.name} pascal: derive threw ${(e as Error).message}`); }
            if (gp) {
                const fs = checkStyle(gp).filter(f => f.level === 'error');
                const tp = printTextModel(gp, c.objects).text;
                const rp = parseText(tp, gp);
                const same = rp.errors.length === 0 && canonOf(rp.objects) === truth;
                const again = printTextModel(gp, rp.objects).text === tp;
                log(`${c.name} pascal: check errors ${fs.length}${fs.length ? ` (${fs.map(f => `${f.rule} ${f.where}`).join(', ')})` : ''}; parse errors ${rp.errors.length}${rp.errors.length ? ` first ${rp.errors[0].message} at ${rp.errors[0].line}:${rp.errors[0].col}` : ''}; model unchanged ${same}; reprint byte-identical ${again}; lines ${tp.split('\n').length}`);
                if (c.name === 'library, plain') log(tp.split('\n').slice(0, 9).join('\n'));
                // broken Pascal text
                const toks = probeTokens(tp);
                let silent = 0; let caught = 0; let same0 = 0;
                const muts = [...toks.map(t => tp.slice(0, t.end)), ...toks.map(t => tp.slice(0, t.start) + tp.slice(t.end))];
                for (const m of muts) {
                    const r = parseText(m, gp);
                    if (!isApplicableParse(r)) caught++;
                    else if (canonOf(r.objects) === truth) same0++;
                    else silent++;
                }
                log(`${c.name} pascal mutants ${muts.length}: refused ${caught}, applicable and unchanged ${same0}, applicable and changed ${silent}`);
            }
            // C-like baseline mutants
            {
                const { mutants } = mutantsOf(c);
                let silent = 0; let caught = 0; let same0 = 0;
                for (const m of mutants) {
                    const r = parseText(m.text, c.g);
                    if (!isApplicableParse(r)) caught++;
                    else if (canonOf(r.objects) === truth) same0++;
                    else silent++;
                }
                log(`${c.name} c-like mutants ${mutants.length}: refused ${caught}, applicable and unchanged ${same0}, applicable and changed ${silent}`);
            }
            // Indentation stand-in
            {
                const kws = classKeywordsOf(c.g);
                const ti = toIndent(truth);
                const back = fromIndent(ti, kws);
                const ri = parseText(back, c.g);
                const same = ri.errors.length === 0 && canonOf(ri.objects) === truth;
                const again = toIndent(printTextModel(c.g, ri.objects).text) === ti;
                log(`${c.name} indent: braces restored identical ${back === truth}; parse errors ${ri.errors.length}; model unchanged ${same}; reprint byte-identical ${again}; lines ${ti.split('\n').length} (c-like ${truth.split('\n').length})`);
                const toks = probeTokens(ti);
                const lines = ti.split('\n');
                const muts: { kind: string; text: string }[] = [
                    ...toks.map(t => ({ kind: 'trunc', text: ti.slice(0, t.end) })),
                    ...toks.map(t => ({ kind: 'delete', text: ti.slice(0, t.start) + ti.slice(t.end) })),
                    ...lines.flatMap((l, i) => (l.startsWith('  ') ? [{ kind: 'dedent', text: [...lines.slice(0, i), l.slice(2), ...lines.slice(i + 1)].join('\n') }] : [])),
                    ...lines.map((l, i) => ({ kind: 'indent', text: [...lines.slice(0, i), `  ${l}`, ...lines.slice(i + 1)].join('\n') })),
                ];
                const by: Record<string, [number, number, number]> = {};
                for (const m of muts) {
                    const r = parseText(fromIndent(m.text, kws), c.g);
                    const k = (by[m.kind] ??= [0, 0, 0]);
                    if (!isApplicableParse(r)) k[0]++;
                    else if (canonOf(r.objects) === truth) k[1]++;
                    else k[2]++;
                }
                log(`${c.name} indent mutants ${muts.length} [refused, unchanged, changed]: ${JSON.stringify(by)}`);
            }
            // style switch keeps the model: one model, three prints, three parses
        }
        {
            const c = tolerantCases()[0];
            const truth = printTextModel(c.g, c.objects).text;
            const trunc = truth.split('\n').slice(0, 6).join('\n');
            log('-- library plain, c-like truncated after 6 lines:');
            log(trunc);
            const r = parseText(trunc, c.g);
            log(`c-like: errors ${r.errors.length} (${r.errors[0]?.message}), applicable ${isApplicableParse(r)}`);
            const ti = toIndent(truth).split('\n').slice(0, 6).join('\n');
            const ri = parseText(fromIndent(ti, classKeywordsOf(c.g)), c.g);
            log(`indent, same 6 lines: errors ${ri.errors.length}, applicable ${isApplicableParse(ri)}, objects ${ri.objects.length} of ${c.objects.length}`);
        }
        log(`\nprobe time ${Date.now() - t0} ms`);
        flush();
    }, 600_000);
});
