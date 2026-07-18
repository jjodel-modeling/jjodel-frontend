/**
 * irCompile — compiles a VertexViewIR into a CompiledView once per view.
 *
 * The interpreter never walks the IR tree at render time: PathExprs become
 * accessor closures over ReadCtx, Predicates become boolean closures,
 * Conditionals become value functions. The dependency set (feature names read
 * by the view's PathExprs, self only) is extracted statically for subscription
 * signatures. Cache key: (view id, structural hash of the ir).
 */

import type {
    AnyViewIR,
    CompiledAccessor,
    CompiledBadge,
    CompiledConditional,
    CompiledContainment,
    CompiledFieldCompartment,
    CompiledLabel,
    CompiledPredicate,
    CompiledView,
    Conditional,
    Literal,
    PathExpr,
    Predicate,
    NodeViewIR,
} from './irTypes';
import type { ReadCtx } from './irReadCtx';

/** Constructs forbidden in PathExpr (spec v1.1 §PathExpr). */
const FORBIDDEN_PATH = /\?\.|\?\?|[?:()]/;
/** One step: $feature | value | values | values[N] */
const STEP_RE = /^(\$[A-Za-z_][A-Za-z0-9_]*|value|values(\[\d+\])?)$/;

interface ParsedPath {
    /** [{feature, accessor}] chain; v1 spike evaluates only the first hop (self). */
    steps: { feature?: string; take: 'value' | 'values' | number }[];
    featureNames: string[];
}

function parsePathExpr(expr: PathExpr): ParsedPath {
    if (FORBIDDEN_PATH.test(expr)) {
        throw new Error(`[ir] forbidden construct in PathExpr: ${expr}`);
    }
    const tokens = expr.split('.').map(t => t.trim()).filter(Boolean);
    const steps: ParsedPath['steps'] = [];
    const featureNames: string[] = [];
    let current: { feature?: string; take: 'value' | 'values' | number } | null = null;
    for (const tok of tokens) {
        if (!STEP_RE.test(tok)) throw new Error(`[ir] invalid PathExpr step "${tok}" in ${expr}`);
        if (tok.startsWith('$')) {
            if (current) steps.push(current);
            const feature = tok.slice(1);
            featureNames.push(feature);
            current = { feature, take: 'value' };
        } else if (tok === 'value') {
            if (!current) throw new Error(`[ir] dangling .value in ${expr}`);
            current.take = 'value';
        } else { // values or values[N]
            if (!current) throw new Error(`[ir] dangling .values in ${expr}`);
            const m = tok.match(/^values\[(\d+)\]$/);
            current.take = m ? parseInt(m[1], 10) : 'values';
        }
    }
    if (current) steps.push(current);
    if (steps.length === 0) throw new Error(`[ir] empty PathExpr: ${expr}`);
    return { steps, featureNames };
}

/**
 * Compile a PathExpr into an accessor closure.
 * KNOWN LIMIT (v1.1, to be fixed in spec v1.2 dependency-set work): only
 * single-hop self paths are fully reactive; multi-hop navigation reads the
 * target eagerly but changes on the *navigated* object do not invalidate self.
 */
function compilePath(expr: PathExpr): { fn: CompiledAccessor; featureNames: string[] } {
    const { steps, featureNames } = parsePathExpr(expr);
    const fn: CompiledAccessor = (ctx: ReadCtx, elementId: string) => {
        let currentId = elementId;
        let out: unknown = undefined;
        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            if (!step.feature) return undefined;
            if (step.take === 'values') out = ctx.getValues(currentId, step.feature);
            else if (typeof step.take === 'number') out = ctx.getValues(currentId, step.feature)[step.take];
            else out = ctx.getValue(currentId, step.feature);
            const isLast = i === steps.length - 1;
            if (!isLast) {
                // navigation hop: the value must be a pointer to another element
                if (typeof out !== 'string') return undefined;
                currentId = out;
            }
        }
        return out;
    };
    return { fn, featureNames };
}

function isLiteral(x: PathExpr | Literal): x is Literal {
    return typeof x === 'object' && x !== null && 'kind' in x;
}

function compileOperand(x: PathExpr | Literal, deps: Set<string>): CompiledAccessor {
    if (isLiteral(x)) {
        const v = x.value;
        return () => v;
    }
    const { fn, featureNames } = compilePath(x);
    featureNames.forEach(f => deps.add(f));
    return fn;
}

function compilePredicate(p: Predicate | undefined, deps: Set<string>): CompiledPredicate {
    if (!p) return () => true;
    switch (p.op) {
        case 'literal': { const v = p.value; return () => v; }
        case 'and': {
            const parts = p.args.map(a => compilePredicate(a, deps));
            return (ctx, id) => parts.every(f => f(ctx, id));
        }
        case 'or': {
            const parts = p.args.map(a => compilePredicate(a, deps));
            return (ctx, id) => parts.some(f => f(ctx, id));
        }
        case 'not': {
            const inner = compilePredicate(p.arg, deps);
            return (ctx, id) => !inner(ctx, id);
        }
        case 'exists': {
            const acc = compileOperand(p.path, deps);
            return (ctx, id) => { const v = acc(ctx, id); return v !== undefined && v !== null && v !== ''; };
        }
        case 'empty': {
            const { fn, featureNames } = compilePath(p.path);
            featureNames.forEach(f => deps.add(f));
            return (ctx, id) => {
                const v = fn(ctx, id);
                if (Array.isArray(v)) return v.length === 0;
                return v === undefined || v === null || v === '';
            };
        }
        case 'isKind': {
            const cls = p.class;
            if (p.path) {
                const acc = compileOperand(p.path, deps);
                return (ctx, id) => {
                    const target = acc(ctx, id);
                    return typeof target === 'string' ? ctx.isKindOf(target, cls) : false;
                };
            }
            return (ctx, id) => ctx.isKindOf(id, cls);
        }
        default: {
            const { op } = p as any;
            const left = compileOperand((p as any).left, deps);
            const right = compileOperand((p as any).right, deps);
            return (ctx, id) => {
                const l = left(ctx, id) as any;
                const r = right(ctx, id) as any;
                switch (op) {
                    case 'eq': return l === r || String(l) === String(r);
                    case 'neq': return !(l === r || String(l) === String(r));
                    case 'lt': return Number(l) < Number(r);
                    case 'lte': return Number(l) <= Number(r);
                    case 'gt': return Number(l) > Number(r);
                    case 'gte': return Number(l) >= Number(r);
                    default: return false;
                }
            };
        }
    }
}

function compileConditional<T>(c: Conditional<T> | undefined, fallback: T, deps: Set<string>): CompiledConditional<T> {
    if (c === undefined) return () => fallback;
    if (typeof c !== 'object' || c === null || (!('when' in (c as any)) && !('rules' in (c as any)))) {
        const v = c as T;
        return () => v;
    }
    if ('when' in (c as any)) {
        const cc = c as { when: Predicate; then: T; else?: T };
        const pred = compilePredicate(cc.when, deps);
        const elseV = cc.else !== undefined ? cc.else : fallback;
        return (ctx, id) => (pred(ctx, id) ? cc.then : elseV);
    }
    const cr = c as { rules: { when: Predicate; then: T }[]; default?: T };
    const compiled = cr.rules.map(r => ({ pred: compilePredicate(r.when, deps), then: r.then }));
    const defV = cr.default !== undefined ? cr.default : fallback;
    return (ctx, id) => {
        for (const r of compiled) if (r.pred(ctx, id)) return r.then;
        return defV;
    };
}

/** Cheap structural hash for the compile cache (djb2 over JSON). */
function irHash(ir: AnyViewIR): string {
    const s = JSON.stringify(ir);
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
    return String(h);
}

const compileCache = new Map<string, CompiledView>();

export function compileView(viewId: string, ir: NodeViewIR): CompiledView {
    const key = `${viewId}:${irHash(ir)}`;
    const cached = compileCache.get(key);
    if (cached) return cached;

    const deps = new Set<string>();
    const predicate = compilePredicate(ir.predicate, deps);
    const form = compileConditional(ir.shape.form, 'rect' as const, deps);
    const fill = ir.shape.fill !== undefined ? compileConditional(ir.shape.fill, '', deps) : null;
    const border = ir.shape.border ?? null;

    const labels: CompiledLabel[] = (ir.shape.labels ?? []).map(l => {
        let text: CompiledAccessor;
        if (l.source.from === 'path') {
            const { fn, featureNames } = compilePath(l.source.expr);
            featureNames.forEach(f => deps.add(f));
            text = fn;
        } else if (l.source.from === 'intrinsic') {
            const prop = l.source.prop;
            text = (ctx, id) => {
                switch (prop) {
                    case 'name': return ctx.getName(id) ?? '';
                    case 'metaclassName': return ctx.getMetaclassName(id) ?? '';
                    case 'qualifiedName': return `${ctx.getName(id) ?? ''} : ${ctx.getMetaclassName(id) ?? ''}`;
                    default: return '';
                }
            };
        } else {
            const t = l.source.text;
            text = () => t;
        }
        return { position: l.position, text, visible: compileConditional(l.visible, true, deps) };
    });

    const badges: CompiledBadge[] = (ir.shape.badges ?? []).map(b => ({
        icon: compileConditional(b.icon, '', deps),
        position: b.position,
        visible: compileConditional(b.visible, true, deps),
        tooltip: b.tooltip,
    }));

    const fieldCompartments: CompiledFieldCompartment[] = (ir.fieldCompartments ?? []).map(fc => ({
        id: fc.id,
        source: fc.source.from,
        segments: fc.rowFormat.segments,
        visible: compileConditional(fc.visible, true, deps),
        separator: fc.separator !== false,
    }));

    let containment: CompiledContainment | null = null;
    if (ir.kind === 'graphVertex') {
        const c = ir.containment ?? {};
        containment = {
            childFilter: compilePredicate(c.childFilter, deps),
            collapsible: c.collapsible !== false,
            collapsedForm: c.collapsed?.form !== undefined ? compileConditional(c.collapsed.form, 'rounded' as const, deps) : null,
            collapsedFill: c.collapsed?.fill !== undefined ? compileConditional(c.collapsed.fill, '', deps) : null,
            collapsedBadge: c.collapsed?.badge ? {
                icon: compileConditional(c.collapsed.badge.icon, '', deps),
                position: c.collapsed.badge.position,
                visible: compileConditional(c.collapsed.badge.visible, true, deps),
                tooltip: c.collapsed.badge.tooltip,
            } : null,
        };
    }

    const compiled: CompiledView = {
        viewId,
        ir,
        kind: ir.kind,
        containment,
        priority: typeof ir.priority === 'number' ? ir.priority : 0,
        predicate,
        dependencySet: Array.from(deps),
        form,
        fill,
        border,
        labels,
        badges,
        fieldCompartments,
    };
    compileCache.set(key, compiled);
    return compiled;
}

// ---- edge views (Fase 2c) --------------------------------------------------

import type { CompiledEdgeView, EdgeViewIR, TextSource } from './irTypes';

function compileTextSource(src: TextSource | undefined, deps: Set<string>): CompiledAccessor | null {
    if (!src) return null;
    if (src.from === 'path') {
        const { fn, featureNames } = compilePath(src.expr);
        featureNames.forEach(f => deps.add(f));
        return fn;
    }
    if (src.from === 'intrinsic') {
        const prop = src.prop;
        return (ctx, id) => {
            switch (prop) {
                case 'name': return ctx.getName(id) ?? '';
                case 'metaclassName': return ctx.getMetaclassName(id) ?? '';
                case 'qualifiedName': return `${ctx.getName(id) ?? ''} : ${ctx.getMetaclassName(id) ?? ''}`;
                default: return '';
            }
        };
    }
    const t = src.text;
    return () => t;
}

const edgeCompileCache = new Map<string, CompiledEdgeView>();

export function compileEdgeView(viewId: string, ir: EdgeViewIR): CompiledEdgeView {
    const key = `${viewId}:${irHash(ir as never)}`;
    const cached = edgeCompileCache.get(key);
    if (cached) return cached;

    const deps = new Set<string>();
    const predicate = compilePredicate(ir.predicate, deps);
    const e = ir.edge ?? {};
    const compileExpr = (expr: string | undefined): CompiledAccessor | null => {
        if (!expr) return null;
        const { fn, featureNames } = compilePath(expr);
        featureNames.forEach(f => deps.add(f));
        return fn;
    };
    const sourceExpr = compileExpr(e.source);
    const targetExpr = compileExpr(e.target);
    const compiled: CompiledEdgeView = {
        viewId,
        ir,
        priority: typeof ir.priority === 'number' ? ir.priority : 0,
        predicate,
        dependencySet: [],
        reference: ir.reference ?? null,
        isObjectAsEdge: !!(sourceExpr && targetExpr),
        sourceExpr,
        targetExpr,
        lineColor: e.line?.color !== undefined ? compileConditional(e.line.color, '', deps) : null,
        lineWidth: e.line?.width !== undefined ? compileConditional(e.line.width, 1, deps) : null,
        lineStyle: e.line?.style !== undefined ? compileConditional(e.line.style, 'solid' as const, deps) : null,
        terminations: {
            sourceEnd: e.terminations?.sourceEnd ?? 'none',
            targetEnd: e.terminations?.targetEnd ?? 'openArrow',
        },
        routing: e.routing ?? null,
        labelText: compileTextSource(e.labels?.center, deps),
        labelPlacement: e.labels?.placement ?? 'auto',
    };
    compiled.dependencySet = Array.from(deps);
    edgeCompileCache.set(key, compiled);
    return compiled;
}

/** Test/dev helper: drop all cached compilations (e.g. after demo re-install). */
export function clearCompileCache(): void {
    compileCache.clear();
    edgeCompileCache.clear();
}
