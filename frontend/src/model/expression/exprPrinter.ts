/**
 * exprPrinter — the text of an expression subtree, by the roles of its catalog (R-EXP-2, R-EXP-6, slice S1).
 *
 * `parens: minimal` climbs precedences: an operator wraps only when it binds looser than its context. `parens: always`
 * prints every operand at precedence 0 and wraps every compound. A row of the catalog can override the mode. The sharing
 * pass names the outermost repeated subexpressions (`D1`, `D2`, ...) by their plain text.
 *
 * Pure: it reads the model only through `ExprRead`, and never a store or a proxy.
 */

import { parsePattern } from './exprBinding';
import type { ExprBinding, ExprFormCondition, ExprRole, PatternPart, PatternRole } from './exprBinding';

/** The context of a hole that wants a name or a wrapped compound. */
const ATOM_PRECEDENCE = 100;

export interface ExprRead {
    /** The M2 class of an object. */
    classOf(id: string): string | undefined;
    classNameOf(classId: string): string;
    /** The class and its superclasses, the class first. */
    lineageOf(classId: string): readonly string[];
    values(id: string, featureId: string): readonly unknown[];
    isObject(value: unknown): boolean;
}

/** Texts already printed. `key` is `prec/mode/share`, share being 0 or 1. */
export interface ExprMemo {
    get(id: string, key: string): string | undefined;
    set(id: string, key: string, text: string): void;
}

export interface ExprPrinterOptions {
    memo?: ExprMemo;
    /** Plain text to name, from `computeSharedNames`. */
    shared?: ReadonlyMap<string, string>;
}

export interface ExprPrinter {
    printNode(id: string, prec?: number, mode?: string, share?: boolean): string;
}

const present = (v: unknown): boolean => v !== undefined && v !== null;
const truthy = (v: unknown): boolean => present(v) && v !== '' && v !== false;
const wrap = (text: string, needed: boolean): string => (needed ? `(${text})` : text);

export function createExprPrinter(binding: ExprBinding, read: ExprRead, options: ExprPrinterOptions = {}): ExprPrinter {
    const { memo, shared } = options;
    const roles = new Map<string, ExprRole>(binding.roles.map(r => [r.class, r]));
    const sharedClasses = new Set(binding.sharing?.classes ?? []);
    const patterns = new Map<string, PatternPart[]>();
    const active = new Set<string>();

    const lineage = (id: string): readonly string[] => {
        const c = read.classOf(id);
        return c === undefined ? [] : read.lineageOf(c);
    };
    const roleOf = (id: string): ExprRole | undefined => {
        for (const c of lineage(id)) {
            const r = roles.get(c);
            if (r) return r;
        }
        return undefined;
    };
    const unbound = (id: string): string => {
        const c = read.classOf(id);
        return `<${c === undefined ? id : read.classNameOf(c)}>`;
    };
    const valuesOf = (id: string, feature: string): unknown[] => read.values(id, feature).filter(present);

    const child = (v: unknown, prec: number, mode: string, share: boolean): string =>
        (read.isObject(v) ? printNode(v as string, prec, mode, share) : String(v));
    const operand = (id: string, feature: string, prec: number, share: boolean): string => {
        const [v] = valuesOf(id, feature);
        return v === undefined ? '?' : child(v, prec, '', share);
    };

    const partsOf = (text: string): PatternPart[] => {
        let parts = patterns.get(text);
        if (!parts) {
            const parsed = parsePattern(text);
            // The decoder refuses a malformed text; a binding built by hand prints it as it is.
            parts = 'error' in parsed ? [{ kind: 'text', text }] : parsed.parts;
            patterns.set(text, parts);
        }
        return parts;
    };

    const holds = (c: ExprFormCondition, id: string, role: PatternRole, mode: string): boolean => {
        if ('mode' in c) return c.mode === mode;
        const [v] = valuesOf(id, role.args['has' in c ? c.has : 'absent' in c ? c.absent : c.plain]);
        if ('has' in c) return truthy(v);
        if ('absent' in c) return !truthy(v);
        return truthy(v) && !/[, ]/.test(String(v));
    };

    const renderPattern = (id: string, role: PatternRole, mode: string, share: boolean): string => {
        const text = role.text ?? role.forms?.find(f => (f.when ?? []).every(c => holds(c, id, role, mode)))?.text;
        if (text === undefined) return unbound(id);
        return partsOf(text).map(part => {
            if (part.kind === 'text') return part.text;
            const values = valuesOf(id, role.args[part.arg]);
            if (part.kind === 'many') return values.map(v => child(v, 0, mode, share)).join(part.separator);
            if (part.kind === 'truth') return truthy(values[0]) ? part.yes : part.no;
            if (part.fallback !== undefined && !truthy(values[0])) return part.fallback;
            if (values.length === 0) return '?';
            return child(values[0], part.atom ? ATOM_PRECEDENCE : 0, '', share);
        }).join('');
    };

    const render = (id: string, role: ExprRole, prec: number, mode: string, share: boolean): string => {
        const always = binding.parens === 'always';
        switch (role.role) {
            case 'infix': {
                const eff = role.parens ?? binding.parens;
                const p = role.precedence;
                const [lc, rc] = eff === 'always' ? [0, 0]
                    : role.assoc === 'left' ? [p, p + 1]
                        : role.assoc === 'right' ? [p + 1, p]
                            : [p + 1, p + 1];
                const text = `${operand(id, role.operands[0], lc, share)} ${role.symbol} ${operand(id, role.operands[1], rc, share)}`;
                return wrap(text, eff === 'always' || (eff === 'minimal' && p < prec));
            }
            case 'nary': {
                const items = valuesOf(id, role.operands);
                if (items.length === 0) return role.zero ?? '()';
                if (items.length === 1) return child(items[0], prec, '', share);
                const text = items.map(v => child(v, always ? 0 : role.precedence + 1, '', share)).join(` ${role.symbol} `);
                return wrap(text, always || role.precedence < prec);
            }
            case 'unary': {
                const p = role.precedence ?? ATOM_PRECEDENCE;
                return wrap(`${role.symbol}${operand(id, role.operand, always ? 0 : p, share)}`, !always && p < prec);
            }
            case 'literal': {
                const text = operand(id, role.attribute, 0, share);
                const w = role.booleanWhen;
                if (!w) return text;
                const [type] = valuesOf(id, w.feature);
                const typeClass = read.isObject(type) ? read.classOf(type as string) : undefined;
                if (typeClass === undefined || !read.lineageOf(typeClass).includes(w.class)) return text;
                if (text === w.true) return 'true';
                if (text === w.false) return 'false';
                return w.other.replace('{}', text);
            }
            case 'reference': {
                const [v] = valuesOf(id, role.attribute);
                return `${role.prefix ?? ''}${v === undefined ? '?' : String(v)}`;
            }
            case 'call': {
                const args = role.args.flatMap(f => {
                    const values = valuesOf(id, f);
                    return values.length === 0 ? ['?'] : values.map(v => child(v, 0, '', share));
                });
                return `${role.name}(${args.join(', ')})`;
            }
            case 'conditional': {
                const p = role.precedence ?? 1;
                const inner = always ? 0 : p + 1;
                const text = `${operand(id, role.cond, inner, share)} ? ${operand(id, role.then, inner, share)} : ${operand(id, role.else, always ? 0 : p, share)}`;
                return wrap(text, always || p < prec);
            }
            case 'case': {
                const indent = role.indent ?? '        ';
                const arrow = role.arrow ?? ': ';
                const lines = valuesOf(id, role.arms).map(arm => {
                    const armId = arm as string;
                    if (valuesOf(armId, role.cond).length === 0) return `${indent}${child(arm, 0, role.armMode ?? 'caseArm', share)}`;
                    return `${indent}${operand(armId, role.cond, 0, share)}${arrow}${operand(armId, role.value, 0, share)}`;
                });
                lines.push(`${indent}${role.elseLabel ?? 'else: '}${operand(id, role.otherwise, 0, share)}`);
                return `${role.open ?? 'case {\n'}${lines.join('\n')}${role.close ?? ' }'}`;
            }
            case 'bracket':
                return `${role.open}${valuesOf(id, role.items).map(v => child(v, 0, '', share)).join(role.separator)}${role.close}`;
            case 'pattern':
                return renderPattern(id, role, mode, share);
        }
    };

    function printNode(id: string, prec = 0, mode = '', share = false): string {
        const key = `${prec}/${mode}/${share ? 1 : 0}`;
        const hit = memo?.get(id, key);
        if (hit !== undefined) return hit;
        if (active.has(id)) return '<cycle>';
        if (share && shared && lineage(id).some(c => sharedClasses.has(c))) {
            const name = shared.get(printNode(id, 0, '', false));
            if (name !== undefined) {
                memo?.set(id, key, name);
                return name;
            }
        }
        active.add(id);
        const role = roleOf(id);
        const text = role ? render(id, role, prec, mode, share) : unbound(id);
        active.delete(id);
        memo?.set(id, key, text);
        return text;
    }

    return { printNode };
}

/**
 * The names of the sharing pass: the plain text of every object of a sharing class, longer than `minLength` and seen at
 * least `minCount` times, longest first (stable), without a text contained in a longer candidate.
 */
export function computeSharedNames(
    binding: ExprBinding,
    read: ExprRead,
    printPlain: (id: string) => string,
    ids: Iterable<string>,
): Map<string, string> {
    const names = new Map<string, string>();
    const sharing = binding.sharing;
    if (!sharing) return names;
    const classes = new Set(sharing.classes);
    const counts = new Map<string, number>();
    for (const id of ids) {
        const c = read.classOf(id);
        if (c === undefined || !read.lineageOf(c).some(x => classes.has(x))) continue;
        const text = printPlain(id);
        counts.set(text, (counts.get(text) ?? 0) + 1);
    }
    const repeated = [...counts]
        .filter(([text, n]) => text.length > sharing.minLength && n >= sharing.minCount)
        .map(([text]) => text)
        .sort((a, b) => b.length - a.length);
    repeated
        .filter((text, i) => !repeated.slice(0, i).some(longer => longer.includes(text)))
        .forEach((text, i) => names.set(text, `${sharing.prefix}${i + 1}`));
    return names;
}
