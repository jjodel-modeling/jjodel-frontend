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
    FieldSegment,
    FontFamilyToken,
    FontWeightToken,
    LabelAnchor,
    Literal,
    PathExpr,
    TextStyle,
    Predicate,
    NodeViewIR,
    RowViewIR,
    TextTransformToken,
} from './irTypes';
import type { CSSProperties } from 'react';
import type { ReadCtx } from './irReadCtx';
import { parsePathExpr } from './pathExpr';
import { labelEditsFeature, labelEditsName } from './irLabelEdit';
import { proxyToIdReplacer } from '../../../../model/unproxy';

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
 * WHICH rule wins on one element, as an index — the one thing `CompiledConditional`
 * cannot say, because it returns the resolved `T` and nothing else (slice 5, D8).
 *
 * `null` means "no rule won": the value in force is the `default` (or, for a
 * `{when, then, else}`, the `else`), which the authoring UI words as `otherwise` on
 * an axis and `base` on the border. The three input shapes are discriminated exactly
 * as `compileConditional` above discriminates them, and the rule order is the same
 * first-match-wins — the two must not be able to disagree about who won.
 *
 * `deps` is a throwaway: this runs at authoring time, outside any compile, and feeds
 * no subscription. The two module-scoped sinks `compilePredicate` can write into are
 * `null` here and both their call sites are null-guarded (`:131`, `:198`), so a call
 * from outside a compile pass disturbs nothing.
 *
 * NOT on any render path: nothing in the canvas pipeline calls it.
 */
export function matchIndexOf<T>(c: Conditional<T> | undefined, ctx: ReadCtx, id: string): number | null {
    if (c === undefined) return null;
    if (typeof c !== 'object' || c === null || (!('when' in (c as any)) && !('rules' in (c as any)))) return null;
    const deps = new Set<string>();
    if ('when' in (c as any)) {
        const cc = c as { when: Predicate; then: T; else?: T };
        return compilePredicate(cc.when, deps)(ctx, id) ? 0 : null;
    }
    const cr = c as { rules: { when: Predicate; then: T }[]; default?: T };
    const rules = Array.isArray(cr.rules) ? cr.rules : [];
    for (let i = 0; i < rules.length; i++) {
        if (compilePredicate(rules[i].when, deps)(ctx, id)) return i;
    }
    return null;
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
    if (style.underline !== undefined) out.underline = compileConditional<boolean>(style.underline, false, deps);
    // R-VP-20: two scalar axes, compiled like the others so the render reads one shape. A scalar never
    // reaches the fallback; anything else that does resolves to "no override".
    if (style.letterSpacing !== undefined) out.letterSpacing = compileConditional<number | undefined>(style.letterSpacing, undefined, deps);
    if (style.textTransform !== undefined) out.textTransform = compileConditional<TextTransformToken | ''>(style.textTransform, '', deps);
    return out;
}

/**
 * Closed vocabulary of `TextStyle.textTransform` (R-VP-20). A Record keyed on the union, as
 * LABEL_ANCHORS is; irValidate reads it for the authoring-time rule, the render below for what it emits.
 */
export const TEXT_TRANSFORMS: Record<TextTransformToken, true> = { uppercase: true, lowercase: true, none: true };

/** FontFamilyToken -> design-system CSS var. */
const FONT_FAMILY_VAR: Record<string, string> = { sans: 'var(--font-sans)', mono: 'var(--font-mono)' };
/** FontWeightToken -> numeric CSS weight. */
const FONT_WEIGHT_NUM: Record<string, number> = { normal: 400, medium: 500, semibold: 600, bold: 700 };

/**
 * Resolve a CompiledTextStyle into an inline style for the current element
 * (ir-1.3 TS1). Only authored axes with a non-empty resolved value are emitted,
 * so an absent axis — or a conditional axis whose branch does not match — inherits
 * the surface's CSS default (irStyle.ts BASE_CSS). An authored axis is always
 * emitted (even when its value equals a CSS default) so it overrides the class rule.
 *
 * Here since P-2026-09-30-0150, moved from IRNodeContent.tsx with its two maps and
 * otherwise unchanged but for the two axes of R-VP-20: the pure irEdgeViews.ts resolves
 * an edge label's style with it, and cannot import the component (the joiner barrel).
 * IRNodeContent re-exports it under the same name, which is where IRRow imports it from.
 */
export function resolveTextStyle(cs: CompiledTextStyle | undefined, ctx: ReadCtx, id: string): CSSProperties | undefined {
    if (!cs) return undefined;
    const s: CSSProperties = {};
    if (cs.fontFamily) { const v = cs.fontFamily(ctx, id); if (v) s.fontFamily = FONT_FAMILY_VAR[v]; }
    if (cs.fontSize) { const v = cs.fontSize(ctx, id); if (v && v > 0) s.fontSize = `${v}px`; }
    if (cs.fontWeight) { const v = cs.fontWeight(ctx, id); if (v) s.fontWeight = FONT_WEIGHT_NUM[v]; }
    if (cs.fontStyle) { const v = cs.fontStyle(ctx, id); if (v) s.fontStyle = v; }
    if (cs.color) { const v = cs.color(ctx, id); if (v) s.color = v; }
    // Underline means the native instance-name underline (UML convention), offset
    // included: the 3px is baked into the axis, not a separate field. Same value as the
    // bare literal in instanceNode.scss (.mm-object__name). Offset authoring: owed to S5.
    if (cs.underline) { const v = cs.underline(ctx, id); if (v) { s.textDecoration = 'underline'; s.textUnderlineOffset = '3px'; } }
    // R-VP-20. Permissive towards what is persisted (R-B9-bis): a spacing that is not a finite
    // number, or a case outside TEXT_TRANSFORMS, emits nothing. Zero is an authored spacing.
    if (cs.letterSpacing) { const v = cs.letterSpacing(ctx, id); if (typeof v === 'number' && Number.isFinite(v)) s.letterSpacing = `${v}em`; }
    if (cs.textTransform) { const v = cs.textTransform(ctx, id); if (typeof v === 'string' && Object.prototype.hasOwnProperty.call(TEXT_TRANSFORMS, v)) s.textTransform = v as TextTransformToken; }
    return Object.keys(s).length ? s : undefined;
}

/**
 * The compiled style of each literal segment of a row format (R-VP-20), by segment index, as a
 * key to spread: empty when no literal declares one, so a compartment without the key compiles
 * to the shape it had.
 */
function segmentStylesOf(segments: FieldSegment[], deps: Set<string>): { segmentStyles?: (CompiledTextStyle | undefined)[] } {
    if (!Array.isArray(segments) || !segments.some(seg => seg?.kind === 'literal' && seg.style !== undefined)) return {};
    return { segmentStyles: segments.map(seg => (seg?.kind === 'literal' ? compileTextStyle(seg.style, deps) : undefined)) };
}

/**
 * Closed vocabulary of `LabelSpec.anchor` (R-VP-15 (1), P-2026-09-29-1245). A Record keyed on
 * the union, as VALID_PREDICATE_OPS is: an anchor added to the type without being added here
 * fails to compile. irValidate reads it for the authoring-time rule (R-B9-bis).
 */
export const LABEL_ANCHORS: Record<LabelAnchor, true> = { n: true, e: true, s: true, w: true };

/** The render side of the anchor: permissive towards what is persisted, so an absent or
 *  unknown anchor draws below ('s') instead of dropping the label (R-B9-bis). */
export function resolveLabelAnchor(anchor: unknown): LabelAnchor {
    return typeof anchor === 'string' && Object.prototype.hasOwnProperty.call(LABEL_ANCHORS, anchor)
        ? anchor as LabelAnchor
        : 's';
}

/** Cheap structural hash for the compile cache (djb2 over JSON). Also reused by
 * irDefaults.isMigratedDefaultView for the factory-equality comparison. An L object
 * stored in the ir is hashed as its id instead of walked (P-2026-09-29-2121); on an ir
 * without one the string is byte-identical to a plain stringify. */
export function irHash(ir: AnyViewIR): string {
    const s = JSON.stringify(ir, proxyToIdReplacer);
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
    // Border, one compile per axis (slice 2, D1): the same three lines compileEdgeView
    // runs for `line`, with the same fallbacks — '' for the colour (the "no override"
    // convention fill already uses), 1 for the width, 'solid' for the style — which is
    // what a conditional with no matching branch resolves to.
    const borderColor = ir.shape.border?.color !== undefined
        ? compileConditional(ir.shape.border.color, '', deps) : null;
    const borderWidth = ir.shape.border?.width !== undefined
        ? compileConditional(ir.shape.border.width, 1, deps) : null;
    const borderStyle = ir.shape.border?.style !== undefined
        ? compileConditional(ir.shape.border.style, 'solid' as const, deps) : null;
    // Corner radius (asse raggio, ir-1.3 addendum): fallback is `undefined`, not 0 —
    // 0 is a legitimate authored value (square corner) and must stay distinguishable
    // from "no branch matched", or an unresolved conditional would silently render as
    // a sharp corner instead of leaving the shape's own default in place.
    const cornerRadius = ir.shape.cornerRadius !== undefined
        ? compileConditional<number | undefined>(ir.shape.cornerRadius, undefined, deps)
        : null;
    // Marker (asse marker, 2026-08-15): same compile shape as fill — '' means
    // "no marker" when a conditional has no matching branch. Predicates inside
    // the conditional extend `deps` through compileConditional as usual.
    const marker = ir.shape.marker !== undefined ? compileConditional(ir.shape.marker, '', deps) : null;
    // Padding (2026-08-25): a scalar preset like `border`, never Conditional, so it
    // materializes its default here instead of compiling to a value function. The
    // renderer turns anything but 'normal' into an ir-pad--* class (irStyle.ts).
    const padding = ir.shape.padding ?? 'normal';
    // FormSpec (2026-08-26): a passthrough, not a compile. It carries no PathExpr and
    // no Predicate, so there is nothing to turn into an accessor and nothing to add to
    // `deps`, `crossPathSink` or `channelSink` — the three mechanisms a new axis would
    // normally have to feed. `theme` is deliberately NOT defaulted the way `padding` is
    // above: its default depends on the host (plain in the rail, card in the document),
    // so materializing one here would freeze every view on the rail's choice.
    const formSpec = ir.form ?? null;
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
        const editsName = labelEditsName(l);
        const compiled: CompiledLabel = { position: l.position, text, visible: compileConditional(l.visible, true, deps), editsName, style: compileTextStyle(l.style, deps) };
        // Outside label (R-VP-15 (1)): the side is resolved here, once, so the render only
        // reads it. An inside label carries no anchor, even a stray persisted one.
        if (l.position === 'outside') compiled.anchor = resolveLabelAnchor(l.anchor);
        // Path label (R-IRN-41): its feature only when it can edit, so every other label keeps its keys.
        const editsFeature = labelEditsFeature(l);
        if (editsFeature !== null) compiled.editsFeature = editsFeature;
        return compiled;
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
        // R-VP-20: the attributes exclude, copied verbatim and only on its own source (the
        // validator applies the vocabulary, the render only compares names).
        ...(fc.source.from === 'attributes' && Array.isArray(fc.source.exclude) ? { exclude: fc.source.exclude } : {}),
        // Section heading for the form rendering (2026-08-26). Copied verbatim, never
        // defaulted here: the fallback (`id` capitalized) belongs to the form host, and
        // materializing it now would make an authored title indistinguishable from a
        // derived one for any later surface.
        ...(fc.title !== undefined ? { title: fc.title } : {}),
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
        ...segmentStylesOf(fc.rowFormat.segments, deps),
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
        formSpec,
        form,
        fill,
        borderColor,
        borderWidth,
        borderStyle,
        cornerRadius,
        marker,
        padding,
        text,
        labels,
        badges,
        fieldCompartments,
    };
    // Entry mark (R-VP-22): written only when declared in the vocabulary, so a view without it
    // compiles to the key list it had; a value outside it renders as absent (R-B9-bis).
    const entry: unknown = ir.shape.entry;
    if (entry === 'dot' || entry === 'arrow') compiled.entry = entry;
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

/**
 * The centre label of an edge view (R-VP-20 (4)): the `template` when it is a non-empty array,
 * else `center`. The template concatenates its segments, as a row view's does, with one rule of
 * its own: a value segment (path, intrinsic) that resolves empty draws nothing and takes with it
 * the literal right before it, its caption (`weight = ` with no weight). Every value empty, the
 * label is what the other literals say, and nothing at all when there are none, which draws no
 * label, as an empty `center` path does; a template of literals only always draws. A template
 * that is not a non-empty array falls back to `center`: the render is permissive, the validator
 * refuses it (R-B9-bis).
 */
function compileLabelText(labels: EdgeViewIR['edge']['labels'], deps: Set<string>): CompiledAccessor | null {
    const template = labels?.template;
    if (!Array.isArray(template) || template.length === 0) return compileTextSource(labels?.center, deps);
    const parts = template.map(seg => ({
        value: seg?.from === 'path' || seg?.from === 'intrinsic',
        text: compileTextSource(seg, deps) ?? (() => ''),
    }));
    return (ctx, id) => {
        const drawn = parts.map(p => { const v = p.text(ctx, id); return v == null ? '' : String(v); });
        let out = '';
        for (let i = 0; i < parts.length; i++) {
            // A literal right before an empty value is its caption: it goes with it.
            if (!parts[i].value && parts[i + 1]?.value && drawn[i + 1] === '') continue;
            out += drawn[i];
        }
        return out;
    };
}

/** The TextSource kinds an end label may take (R-VP-23); anything else renders as absent (R-B9-bis). */
const END_LABEL_SOURCES: Readonly<Record<string, true>> = { path: true, literal: true, intrinsic: true };

/** An end label (R-VP-23): a text source compiled as a centre `center` is, or null when it is not one. */
function compileEndLabel(src: unknown, deps: Set<string>): CompiledAccessor | null {
    if (!src || typeof src !== 'object' || Array.isArray(src)) return null;
    const from = (src as { from?: unknown }).from;
    if (typeof from !== 'string' || !Object.prototype.hasOwnProperty.call(END_LABEL_SOURCES, from)) return null;
    return compileTextSource(src as TextSource, deps);
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
        labelText: compileLabelText(e.labels, deps),
        labelPlacement: e.labels?.placement ?? 'auto',
        persistWaypoints: e.persistWaypoints ?? true,
    };
    // R-VP-22: the arc, the same way: only when declared in the vocabulary.
    const curve: unknown = e.curve;
    if (curve === 'arc') compiled.curve = curve;
    // R-VP-20 (TS3): the label style, compiled only when it is an object, so an edge view without
    // it compiles to the shape it had and irEdgeViews writes no irLabelStyle.
    const labelStyleIR = e.labels?.style;
    if (labelStyleIR && typeof labelStyleIR === 'object' && !Array.isArray(labelStyleIR)) {
        compiled.labelStyle = compileTextStyle(labelStyleIR, deps);
    }
    // R-VP-23: the end labels, each compiled only when it is a text source of the vocabulary, so an
    // edge view without them compiles to the shape it had and irEdgeViews writes no end text.
    const sourceEnd = compileEndLabel(e.labels?.sourceEnd, deps);
    if (sourceEnd) compiled.sourceEndText = sourceEnd;
    const targetEnd = compileEndLabel(e.labels?.targetEnd, deps);
    if (targetEnd) compiled.targetEndText = targetEnd;
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
