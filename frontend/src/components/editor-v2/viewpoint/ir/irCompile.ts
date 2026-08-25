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
    CompiledCrossPath,
    CompiledFieldCompartment,
    CompiledLabel,
    CompiledTextStyle,
    CompiledPredicate,
    CompiledRowView,
    CompiledView,
    Conditional,
    FontFamilyToken,
    FontWeightToken,
    Literal,
    PathExpr,
    TextStyle,
    Predicate,
    NodeViewIR,
    RowViewIR,
} from './irTypes';
import type { ReadCtx } from './irReadCtx';
import { parsePathExpr } from './pathExpr';

/**
 * Multi-hop cross-object paths collected during a single compileView /
 * compileEdgeView pass (spec v1.2 sez. 9). Module-scoped because compilePath is
 * reached through several nested helpers (compileOperand, compilePredicate,
 * compileTextSource): threading a second accumulator through all of them would
 * touch every signature. Compile is synchronous and non-reentrant (compileView
 * never calls compileView/compileEdgeView), so a fresh array is installed at the
 * start of each top-level compile and harvested at the end; the previous sink is
 * saved/restored defensively.
 */
let crossPathSink: CompiledCrossPath[] | null = null;

function crossPathKey(cp: CompiledCrossPath): string {
    const hops = cp.hops.map(h => `${h.feature}:${String(h.take)}`).join('>');
    return `${hops}#${cp.terminal.feature}:${String(cp.terminal.take)}`;
}

/** Dedupe cross paths harvested from a compile pass (same path in two labels). */
function dedupeCrossPaths(list: CompiledCrossPath[]): CompiledCrossPath[] {
    if (list.length <= 1) return list.slice();
    const seen = new Set<string>();
    const out: CompiledCrossPath[] = [];
    for (const cp of list) {
        const k = crossPathKey(cp);
        if (!seen.has(k)) { seen.add(k); out.push(cp); }
    }
    return out;
}

/**
 * Channels declared during a single compileView / compileEdgeView / compileRowView
 * pass (R-MK-5): non-feature dependencies, named in a closed vocabulary, that the
 * resolvers subscribe to. Module-scoped for exactly the reason crossPathSink is
 * (see the comment above): compilePredicate is reached through several nested
 * helpers — compileOperand, compileConditional (called ~25 times), compileTextSource
 * — and threading a second accumulator through all of them would touch every
 * signature. Compile is synchronous and non-reentrant (compileView never calls
 * compileView/compileEdgeView), so a fresh set is installed at the start of each
 * top-level compile and harvested at the end; the previous sink is saved/restored
 * defensively.
 *
 * Kept separate from `deps` by the constraint of R-MK-5: a channel is never a
 * prefixed pseudo-feature, because irCrossDeps concretizes the feature set into
 * DValue ids and would report the pseudo-feature as unresolved.
 */
let channelSink: Set<string> | null = null;

/**
 * Harvest the channels of the current pass: the array to deposit, or null when the
 * view declares none. Null, not []: a view without `marked` leaves the Compiled*
 * field ABSENT, so its compiled shape is identical to the one produced before this
 * operator existed.
 */
function harvestChannels(): string[] | null {
    return channelSink && channelSink.size > 0 ? Array.from(channelSink) : null;
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
            const isLast = i === steps.length - 1;
            if (!isLast) {
                // navigation hop: resolve the reference to the target element id with
                // draw semantics on both backends (lproxy .value yields a name/proxy,
                // not a pointer). Shared with resolveCrossDeps via ReadCtx.getRef ->
                // navigateRefHop, so render and reactivity navigate identically.
                const nextId = ctx.getRef(currentId, step.feature, step.take);
                if (nextId == null) return undefined;
                currentId = nextId;
                continue;
            }
            // terminal step: read with the active backend (preserves lproxy coercion).
            if (step.take === 'values') out = ctx.getValues(currentId, step.feature);
            else if (typeof step.take === 'number') out = ctx.getValues(currentId, step.feature)[step.take];
            else out = ctx.getValue(currentId, step.feature);
        }
        return out;
    };
    // spec v1.2 sez. 9: a multi-hop path navigates to another object; record the
    // hop chain + terminal feature so the render can register cross-object deps.
    // Single-hop (self) paths produce nothing — already covered by the self
    // subscription. `take` on hops mirrors the accessor above (only 'value' and
    // values[N] navigate; a whole-array 'values' hop dead-ends, same as `fn`).
    if (steps.length >= 2 && steps.every(s => typeof s.feature === 'string') && crossPathSink) {
        const hops = steps.slice(0, -1).map(s => ({ feature: s.feature as string, take: s.take }));
        const term = steps[steps.length - 1];
        crossPathSink.push({ hops, terminal: { feature: term.feature as string, take: term.take } });
    }
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
        case 'marked': {
            // The marking is not a feature: it never enters `deps`, it declares the
            // 'mark' CHANNEL (R-MK-5), which the resolvers gate their invalidation
            // on. Both forms declare it — asking the marking of another element is
            // still the same global signal.
            channelSink?.add('mark');
            if (!p.path) return (ctx, id) => ctx.isMarked(id);
            // Single reference hop only, in v1 (R-MK-10). There is no
            // "PathExpr -> element id" compilation mode — compilePath always reads a
            // VALUE at the terminal step — and building one is outside this slice.
            // Rejected at compile, so validateIR surfaces the reason in the panel
            // instead of the view silently never matching.
            const { steps } = parsePathExpr(p.path);
            const step = steps.length === 1 ? steps[0] : null;
            if (!step || !step.feature) {
                throw new Error('[ir] marked.path supports a single reference hop in v1: ' + p.path);
            }
            const feature = step.feature;
            const take = step.take;
            // The IDENTITY of the target is a feature read, so it belongs in `deps`;
            // its MARKING is carried by the channel. No crossPaths: the hop is
            // navigated with getRef (draw semantics on both backends, `null` on every
            // exhaustion case), never with the value accessor of compilePath — which
            // is the defect isKind's path branch has and this one must not inherit.
            deps.add(feature);
            return (ctx, id) => {
                const target = ctx.getRef(id, feature, take);
                return target !== null && ctx.isMarked(target);
            };
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

/**
 * Compile a TextStyle (ir-1.3 TS1): each authored axis becomes a value function
 * via compileConditional (the same helper as fill/line.color); an absent axis
 * stays undefined so the render emits no override. The '' / 0 fallback marks
 * "no override" when a conditional axis has no matching branch (mirrors the fill
 * '' convention). Predicates inside axis conditionals extend `deps` automatically.
 */
function compileTextStyle(style: TextStyle | undefined, deps: Set<string>): CompiledTextStyle | undefined {
    if (!style) return undefined;
    const out: CompiledTextStyle = {};
    if (style.fontFamily !== undefined) out.fontFamily = compileConditional<FontFamilyToken | ''>(style.fontFamily, '', deps);
    if (style.fontSize !== undefined) out.fontSize = compileConditional<number>(style.fontSize, 0, deps);
    if (style.fontWeight !== undefined) out.fontWeight = compileConditional<FontWeightToken | ''>(style.fontWeight, '', deps);
    if (style.fontStyle !== undefined) out.fontStyle = compileConditional<'normal' | 'italic' | ''>(style.fontStyle, '', deps);
    if (style.color !== undefined) out.color = compileConditional<string>(style.color, '', deps);
    return out;
}

/** Cheap structural hash for the compile cache (djb2 over JSON). Also reused by
 * irDefaults.isMigratedDefaultView for the factory-equality comparison. */
export function irHash(ir: AnyViewIR): string {
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
    const prevSink = crossPathSink;
    crossPathSink = [];
    const prevChannels = channelSink;
    channelSink = new Set<string>();
    const predicate = compilePredicate(ir.predicate, deps);
    const form = compileConditional(ir.shape.form, 'rect' as const, deps);
    const fill = ir.shape.fill !== undefined ? compileConditional(ir.shape.fill, '', deps) : null;
    const border = ir.shape.border ?? null;
    // Marker (asse marker, 2026-08-15): same compile shape as fill — '' means
    // "no marker" when a conditional has no matching branch. Predicates inside
    // the conditional extend `deps` through compileConditional as usual.
    const marker = ir.shape.marker !== undefined ? compileConditional(ir.shape.marker, '', deps) : null;
    // Padding (2026-08-25): a scalar preset like `border`, never Conditional, so it
    // materializes its default here instead of compiling to a value function. The
    // renderer turns anything but 'normal' into an ir-pad--* class (irStyle.ts).
    const padding = ir.shape.padding ?? 'normal';
    // Node-level text style (ir-1.3, cascade root): same per-axis compile as a label
    // style, and compileTextStyle already returns undefined for an absent input and
    // extends `deps` with the predicates of its conditional axes.
    const text = compileTextStyle(ir.shape.text, deps);

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
        const editsName = l.source.from === 'intrinsic'
            && (l.source.prop === 'name' || l.source.prop === 'qualifiedName')
            && l.editable !== false;
        return { position: l.position, text, visible: compileConditional(l.visible, true, deps), editsName, style: compileTextStyle(l.style, deps) };
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
        // children source (Fase R2): compile the optional child filter with the same
        // predicate compiler as the containment childFilter. attributes/references
        // compile exactly as before (no childFilter). Empty rowFormat.segments is fine
        // for children (ignored at render — the format comes from the child's row view).
        ...(fc.source.from === 'children' && fc.source.filter
            ? { childFilter: compilePredicate(fc.source.filter, deps) }
            : {}),
        visible: compileConditional(fc.visible, true, deps),
        separator: fc.separator !== false,
        // Row style (ir-1.3 TS2): compiled for every source kind, `children`
        // included, because it is rendered on the compartment and not on the row
        // (see FieldCompartmentSpec.rowFormat). Predicates inside its conditional
        // axes extend the HOST view's deps, which is the right owner: the
        // compartment is drawn by the host node.
        rowStyle: compileTextStyle(fc.rowFormat.style, deps),
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

    const crossPaths = dedupeCrossPaths(crossPathSink ?? []);
    const channels = harvestChannels();
    crossPathSink = prevSink;
    channelSink = prevChannels;

    const compiled: CompiledView = {
        viewId,
        ir,
        kind: ir.kind,
        containment,
        priority: typeof ir.priority === 'number' ? ir.priority : 0,
        predicate,
        dependencySet: Array.from(deps),
        ...(channels ? { channels } : {}),
        crossPaths,
        form,
        fill,
        border,
        marker,
        padding,
        text,
        labels,
        badges,
        fieldCompartments,
    };
    compileCache.set(key, compiled);
    return compiled;
}

// ---- edge views (Fase 2c) --------------------------------------------------

import type { CompiledEdgeView, EdgeViewIR, TextSource } from './irTypes';
import { CONTAINER_ENDPOINT } from './irTypes';

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
    const prevSink = crossPathSink;
    crossPathSink = [];
    const prevChannels = channelSink;
    channelSink = new Set<string>();
    const predicate = compilePredicate(ir.predicate, deps);
    const e = ir.edge ?? {};
    const compileExpr = (expr: string | undefined): CompiledAccessor | null => {
        if (!expr) return null;
        const { fn, featureNames } = compilePath(expr);
        featureNames.forEach(f => deps.add(f));
        return fn;
    };
    // Container endpoint (R-B13): the reserved token is not a PathExpr, so it never
    // reaches parsePathExpr — which would throw and, through irResolveCore's catch,
    // drop the WHOLE view. This is the permissive render R-B15 requires before the
    // token becomes authorable; every other invalid endpoint keeps throwing as
    // before. The token adds nothing to the dependency set: it is not a feature.
    const sourceIsContainer = e.source === CONTAINER_ENDPOINT;
    const targetIsContainer = e.target === CONTAINER_ENDPOINT;
    const sourceExpr = sourceIsContainer ? null : compileExpr(e.source);
    const targetExpr = targetIsContainer ? null : compileExpr(e.target);
    const compiled: CompiledEdgeView = {
        viewId,
        ir,
        priority: typeof ir.priority === 'number' ? ir.priority : 0,
        predicate,
        dependencySet: [],
        crossPaths: [],
        reference: ir.reference ?? null,
        // A complete endpoint pair, in every combination: each end is either a
        // compiled accessor or the container token (both ends `container` included).
        isObjectAsEdge: !!((sourceExpr || sourceIsContainer) && (targetExpr || targetIsContainer)),
        sourceExpr,
        targetExpr,
        sourceIsContainer,
        targetIsContainer,
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
        persistWaypoints: e.persistWaypoints ?? true,
    };
    compiled.dependencySet = Array.from(deps);
    compiled.crossPaths = dedupeCrossPaths(crossPathSink ?? []);
    const channels = harvestChannels();
    if (channels) compiled.channels = channels;
    crossPathSink = prevSink;
    channelSink = prevChannels;
    edgeCompileCache.set(key, compiled);
    return compiled;
}

// ---- row views (Fase R1) ---------------------------------------------------

const rowCompileCache = new Map<string, CompiledRowView>();

/**
 * Compile a RowViewIR into a CompiledRowView once per view (Fase R1). Inline text
 * only: `template` segments reuse the TextSource compiler (labels/edge labels) and
 * `visible` the conditional compiler — no shape, no containment. A non-array or empty
 * `template` is a structural error (a row must render at least one segment); a
 * forbidden PathExpr in a segment throws through compileTextSource. Both surface via
 * validateIR. Cache key: (view id, structural hash of the ir).
 */
export function compileRowView(viewId: string, ir: RowViewIR): CompiledRowView {
    if (!Array.isArray(ir.template) || ir.template.length === 0) {
        throw new Error('[ir] row view requires a non-empty template');
    }
    const key = `${viewId}:${irHash(ir)}`;
    const cached = rowCompileCache.get(key);
    if (cached) return cached;

    const deps = new Set<string>();
    const prevSink = crossPathSink;
    crossPathSink = [];
    const prevChannels = channelSink;
    channelSink = new Set<string>();
    const predicate = compilePredicate(ir.predicate, deps);
    const template: CompiledAccessor[] = ir.template.map(seg => compileTextSource(seg, deps) ?? (() => ''));
    const visible = compileConditional(ir.visible, true, deps);
    // Row style (ir-1.3 TS2): rendered inline on this row's own `.ir-row`, so it
    // wins over the host compartment and the host node. Its conditional predicates
    // extend THIS view's deps and crossPaths, which useIRRowView already resolves.
    const style = compileTextStyle(ir.style, deps);
    const crossPaths = dedupeCrossPaths(crossPathSink ?? []);
    const channels = harvestChannels();
    crossPathSink = prevSink;
    channelSink = prevChannels;

    const compiled: CompiledRowView = {
        viewId,
        ir,
        kind: 'row',
        priority: typeof ir.priority === 'number' ? ir.priority : 0,
        predicate,
        dependencySet: Array.from(deps),
        ...(channels ? { channels } : {}),
        crossPaths,
        template,
        visible,
        style,
    };
    rowCompileCache.set(key, compiled);
    return compiled;
}

/** Test/dev helper: drop all cached compilations (e.g. after demo re-install). */
export function clearCompileCache(): void {
    compileCache.clear();
    edgeCompileCache.clear();
    rowCompileCache.clear();
}
