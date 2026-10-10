/**
 * graphVertexAuthoring — the IR writes of the graphVertex authoring panel (P-2026-10-10-1156, slice S4 of
 * P-2026-10-10-0105; spec addendum 2026-10-10 §2, R-GV-1..R-GV-9).
 *
 * Pure module: no React, no joiner, no store, so the node bench imports it (the panel itself pulls the joiner barrel,
 * which pulls Monaco: CLAUDE.md §5, the `nameLookup.ts` move). The panel calls these functions and nothing else for
 * the `containment` keys, so a test on them tests the panel's write path.
 *
 * One idiom throughout, the one the vertex panel follows (`omitForm`, `withChildFilter`, the padding preset): a
 * default is the ABSENCE of the key, written by rest/spread, never as `key: undefined`; a group whose last key goes
 * away goes away with it. Two exceptions, both because the value is a choice the author sees and not a fallback: the
 * stacking axis is written when the mode becomes `partitions`, and `layout.mode` stays while the layout holds a band
 * or a padding (it is required there).
 *
 * The metamodel checks (whether the channel's last hop is containment, and which membership modes that admits) are
 * here too, as functions of a class lookup the panel builds from the project metamodels: `validateIR` has no
 * metamodel (spec addendum §2.4), so the panel is the only place they can run.
 */

import { parsePathExpr } from '../ir/pathExpr';
import type {
    BadgeSpec, ChannelEdges, ContainmentLayout, ContainmentLayoutMode, Conditional, GraphVertexViewIR, HeaderSide,
    MembershipMode, PartitionAxis, Predicate, ShapeForm,
} from '../ir/irTypes';

export type GraphVertexContainment = GraphVertexViewIR['containment'];

/** Thickness of a new header band, px: the BPMN pool and lane band of the discovery report §G2. */
export const DEFAULT_HEADER_SIZE = 30;

/** The collapsed badge a new custom badge starts from: the Bootstrap Icons glyph of a collection, top right. */
export const DEFAULT_COLLAPSED_BADGE: BadgeSpec = { icon: 'bi-collection', position: 'tr', visible: true };

/** The four membership modes, in the order the panel lists them (spec addendum §6). */
export const MEMBERSHIP_MODES: readonly MembershipMode[] = ['none', 'forbid', 'reference', 'reparent'];

const withContainmentOf = (ir: GraphVertexViewIR, next: GraphVertexContainment): GraphVertexViewIR =>
    ({ ...ir, containment: next });

/** `containment` without `key`, by rest/spread. */
function omitKey<K extends keyof GraphVertexContainment>(c: GraphVertexContainment, key: K): GraphVertexContainment {
    const { [key]: _dropped, ...rest } = c;
    return rest as GraphVertexContainment;
}

/** `containment` with `key` set, or dropped when `value` is undefined. */
function setKey<K extends keyof GraphVertexContainment>(
    c: GraphVertexContainment, key: K, value: GraphVertexContainment[K] | undefined,
): GraphVertexContainment {
    return value === undefined ? omitKey(c, key) : { ...c, [key]: value };
}

// ── Children channel (R-GV-1) ────────────────────────────────────────────────────────────────────────────────────

/** One hop of a channel: a reference and what it takes (`value`, the whole list, or the item at an index). */
export interface ChannelHop {
    feature: string;
    take: 'value' | 'values' | number;
}

/** The hops of a channel; [] for an absent, empty or unparsable one (the composition children). Never throws. */
export function channelHops(expr: string | undefined): ChannelHop[] {
    if (!expr) return [];
    try {
        const out: ChannelHop[] = [];
        for (const s of parsePathExpr(expr).steps) {
            if (!s.feature) return [];
            out.push({ feature: s.feature, take: s.take });
        }
        return out;
    } catch {
        return [];
    }
}

/** One hop as the single-hop PathExpr the PathBuilder reads and writes. */
export function hopExpr(hop: ChannelHop): string {
    const take = hop.take === 'value' ? 'value' : hop.take === 'values' ? 'values' : `values[${hop.take}]`;
    return `$${hop.feature}.${take}`;
}

/** The channel PathExpr of a hop list; undefined for none (the composition children). */
export function channelExpr(hops: readonly ChannelHop[]): string | undefined {
    return hops.length === 0 ? undefined : hops.map(hopExpr).join('.');
}

/** The index of the first hop before the last that reads a whole list, which can never navigate; -1 when none. */
export function wholeListHop(hops: readonly ChannelHop[]): number {
    return hops.slice(0, -1).findIndex(h => h.take === 'values');
}

/** A reference of a class, as the metamodel checks read it. */
export interface ChannelReference {
    name: string;
    targetClassId: string;
    targetClassName: string;
    containment: boolean;
    upperBound: number;
}

/** A class, as the metamodel checks read it: its references, own and inherited. */
export interface ChannelClass {
    id: string;
    name: string;
    references: ChannelReference[];
}

/** What the metamodel says about a channel. `null` where the check could not run (a hop that does not resolve). */
export interface ChannelFacts {
    /** Every hop resolved to a reference of the class the previous hop reached. */
    resolved: boolean;
    /** The resolved hops, as far as resolution went: owner class, reference, target class. */
    hops: { owner: string; reference: ChannelReference }[];
    /** The last hop is a containment reference. True for the absent channel (the composition children). */
    terminalContainment: boolean | null;
    /** Every hop is a containment reference. True for the absent channel. */
    composition: boolean | null;
}

/**
 * The metamodel facts of `expr` read from `root` (the view's metaclass), each next class looked up by id.
 * An absent channel is the composition channel by definition (spec addendum §2.1).
 */
export function channelFacts(
    expr: string | undefined,
    root: ChannelClass | null,
    classById: (id: string) => ChannelClass | null,
): ChannelFacts {
    const hops = channelHops(expr);
    if (hops.length === 0) return { resolved: true, hops: [], terminalContainment: true, composition: true };
    const out: ChannelFacts['hops'] = [];
    let owner = root;
    for (let i = 0; i < hops.length; i++) {
        const reference = owner?.references.find(r => r.name === hops[i].feature);
        if (!owner || !reference) return { resolved: false, hops: out, terminalContainment: null, composition: null };
        out.push({ owner: owner.name, reference });
        if (i < hops.length - 1) owner = classById(reference.targetClassId);
    }
    return {
        resolved: true,
        hops: out,
        terminalContainment: out[out.length - 1].reference.containment,
        composition: out.every(h => h.reference.containment),
    };
}

/**
 * The membership modes a channel admits (spec addendum §2.4, §6): `reparent` appends to a containment slot,
 * `reference` edits a plain reference list; `none` and `forbid` touch no slot. All four when the check cannot run.
 */
export function admittedMembershipModes(facts: ChannelFacts): MembershipMode[] {
    if (facts.terminalContainment === null) return [...MEMBERSHIP_MODES];
    return facts.terminalContainment ? ['none', 'forbid', 'reparent'] : ['none', 'forbid', 'reference'];
}

/**
 * The view after a new channel. Empty or undefined drops the key (the composition children). Decision 8 of the
 * discovery report (R-GV-4): picking a channel the metamodel says is not a composition channel (a hop that is not
 * containment) writes `edges: 'hide'`; any other pick leaves `edges` alone, and the author can still change it.
 */
export function withChannel(ir: GraphVertexViewIR, expr: string | undefined, facts?: ChannelFacts): GraphVertexViewIR {
    let c = setKey(ir.containment, 'children', expr ? expr : undefined);
    if (expr && facts?.composition === false) c = { ...c, edges: 'hide' };
    return withContainmentOf(ir, c);
}

/** The view after a new child filter; undefined drops the key (every channel object). */
export function withChildFilter(ir: GraphVertexViewIR, next: Predicate | undefined): GraphVertexViewIR {
    return withContainmentOf(ir, setKey(ir.containment, 'childFilter', next));
}

// ── Layout (R-GV-5) ──────────────────────────────────────────────────────────────────────────────────────────────

/** The layout after an edit, or undefined when what is left is the default (`free`, no band, no padding). */
function normalLayout(layout: ContainmentLayout): ContainmentLayout | undefined {
    const { mode, axis, header, padding } = layout;
    if (mode === 'free' && axis === undefined && header === undefined && padding === undefined) return undefined;
    return layout;
}

const layoutOf = (ir: GraphVertexViewIR): ContainmentLayout => ir.containment.layout ?? { mode: 'free' };

const withLayoutOf = (ir: GraphVertexViewIR, next: ContainmentLayout): GraphVertexViewIR =>
    withContainmentOf(ir, setKey(ir.containment, 'layout', normalLayout(next)));

/**
 * The view after a new layout mode. `partitions` writes the stacking axis when none is declared (the select shows
 * it, so it is a choice and not a fallback); `free` drops the axis, which applies to partitions only.
 */
export function withLayoutMode(ir: GraphVertexViewIR, mode: ContainmentLayoutMode): GraphVertexViewIR {
    const { axis, ...rest } = layoutOf(ir);
    return withLayoutOf(ir, mode === 'partitions'
        ? { ...rest, mode, axis: axis ?? 'vertical' }
        : { ...rest, mode });
}

/** The view after a new stacking axis (partitions only; the panel offers it there alone). */
export function withLayoutAxis(ir: GraphVertexViewIR, axis: PartitionAxis): GraphVertexViewIR {
    return withLayoutOf(ir, { ...layoutOf(ir), axis });
}

/** The view after a new band side; 'none' drops the band. A new band starts at DEFAULT_HEADER_SIZE. */
export function withHeaderSide(ir: GraphVertexViewIR, side: HeaderSide | 'none'): GraphVertexViewIR {
    const { header, ...rest } = layoutOf(ir);
    if (side === 'none') return withLayoutOf(ir, rest);
    return withLayoutOf(ir, { ...rest, header: { side, size: header?.size ?? DEFAULT_HEADER_SIZE } });
}

/** The view after a new band thickness, px. Without a band there is nothing to size: unchanged. */
export function withHeaderSize(ir: GraphVertexViewIR, size: number): GraphVertexViewIR {
    const layout = layoutOf(ir);
    if (!layout.header) return ir;
    return withLayoutOf(ir, { ...layout, header: { ...layout.header, size } });
}

/** The view after a new inner padding, px; 0 or undefined drops the key (absent = 0). */
export function withLayoutPadding(ir: GraphVertexViewIR, padding: number | undefined): GraphVertexViewIR {
    const { padding: _dropped, ...rest } = layoutOf(ir);
    return withLayoutOf(ir, padding === undefined || padding === 0 ? rest : { ...rest, padding });
}

// ── Membership (R-GV-8) ──────────────────────────────────────────────────────────────────────────────────────────

/** The view after a new membership mode; `none` drops the key. `create` survives only on `reference`. */
export function withMembershipMode(ir: GraphVertexViewIR, mode: MembershipMode): GraphVertexViewIR {
    if (mode === 'none') return withContainmentOf(ir, omitKey(ir.containment, 'membership'));
    const create = mode === 'reference' ? ir.containment.membership?.create : undefined;
    return withContainmentOf(ir, { ...ir.containment, membership: create ? { mode, create } : { mode } });
}

/**
 * The view after an edit of the creation owner of a `reference` container (spec addendum §6.1). Both fields empty
 * drop `create`; one empty is written as typed and refused by `validateIR` until the other is set. Unchanged when the
 * mode is not `reference`.
 */
export function withMembershipCreate(
    ir: GraphVertexViewIR, edit: { ownerKind?: string; feature?: string },
): GraphVertexViewIR {
    const membership = ir.containment.membership;
    if (membership?.mode !== 'reference') return ir;
    const ownerKind = edit.ownerKind ?? membership.create?.ownerKind ?? '';
    const feature = edit.feature ?? membership.create?.feature ?? '';
    const next = ownerKind === '' && feature === ''
        ? { mode: membership.mode }
        : { mode: membership.mode, create: { ownerKind, feature } };
    return withContainmentOf(ir, { ...ir.containment, membership: next });
}

// ── Channel edges, collapse (R-GV-4, spec v1.2 §8) ───────────────────────────────────────────────────────────────

/** The view after a new channel-edge choice; `show` drops the key (absent = show). */
export function withChannelEdges(ir: GraphVertexViewIR, edges: ChannelEdges): GraphVertexViewIR {
    return withContainmentOf(ir, setKey(ir.containment, 'edges', edges === 'hide' ? 'hide' : undefined));
}

/** The view after the collapsible toggle; checked drops the key (absent = collapsible). */
export function withCollapsible(ir: GraphVertexViewIR, checked: boolean): GraphVertexViewIR {
    return withContainmentOf(ir, setKey(ir.containment, 'collapsible', checked ? undefined : false));
}

type CollapsedRepresentation = NonNullable<GraphVertexContainment['collapsed']>;

/** The view after an edit of one key of the collapsed representation; undefined drops it, and an empty group goes. */
export function withCollapsedKey<K extends keyof CollapsedRepresentation>(
    ir: GraphVertexViewIR, key: K, value: CollapsedRepresentation[K] | undefined,
): GraphVertexViewIR {
    const current: CollapsedRepresentation = ir.containment.collapsed ?? {};
    const { [key]: _dropped, ...rest } = current;
    const next: CollapsedRepresentation = value === undefined ? rest : { ...rest, [key]: value };
    return withContainmentOf(ir, setKey(ir.containment, 'collapsed', Object.keys(next).length > 0 ? next : undefined));
}

/** Convenience for the collapsed shape: '' (the "same as expanded" option) drops the key. */
export function withCollapsedForm(ir: GraphVertexViewIR, form: Conditional<ShapeForm> | ''): GraphVertexViewIR {
    return withCollapsedKey(ir, 'form', form === '' ? undefined : form);
}

// ── Parity keys (R-GV-9) ─────────────────────────────────────────────────────────────────────────────────────────

/** The view after a new `visible`; `true` drops the key (absent = drawn). A Conditional is written as is. */
export function withVisible(ir: GraphVertexViewIR, next: Conditional<boolean> | undefined): GraphVertexViewIR {
    if (next === undefined || next === true) {
        const { visible: _dropped, ...rest } = ir;
        return rest;
    }
    return { ...ir, visible: next };
}

/**
 * The view after the author picks step `i` of the channel in its PathBuilder (`expr`, single-hop; '' clears the
 * step and every step after it). The same reference with another take keeps the steps after it, which still read
 * the same class; another reference drops them. Then `withChannel`, with the metamodel facts of the new path.
 */
export function withChannelStep(
    ir: GraphVertexViewIR, i: number, expr: string,
    root: ChannelClass | null, classById: (id: string) => ChannelClass | null,
): GraphVertexViewIR {
    const hops = channelHops(ir.containment.children);
    const [hop] = channelHops(expr);
    const next = !hop
        ? hops.slice(0, i)
        : [...hops.slice(0, i), hop, ...(hops[i] && hops[i].feature === hop.feature ? hops.slice(i + 1) : [])];
    const e = channelExpr(next);
    return withChannel(ir, e, channelFacts(e, root, classById));
}

/** The view without the last step of its channel; the last step gone, the composition children. */
export function withoutLastChannelStep(
    ir: GraphVertexViewIR, root: ChannelClass | null, classById: (id: string) => ChannelClass | null,
): GraphVertexViewIR {
    const e = channelExpr(channelHops(ir.containment.children).slice(0, -1));
    return withChannel(ir, e, channelFacts(e, root, classById));
}

// ── The reused vertex sections (Shape, Fill, Border, Sizing, General, Labels) ──────────────────────────────────

type Shape = GraphVertexViewIR['shape'];
type BorderAxis = 'color' | 'width' | 'style';

/** The view after a shape edit: the keys of `partial` replace the shape's, the others stay (the vertex `patchShape`). */
export function withShape(ir: GraphVertexViewIR, partial: Partial<Shape>): GraphVertexViewIR {
    return { ...ir, shape: { ...ir.shape, ...partial } };
}

/** The view without `shape.cornerRadius` (the vertex panel's Reset: absent is the form's base radius, not 0). */
export function withoutCornerRadius(ir: GraphVertexViewIR): GraphVertexViewIR {
    const { cornerRadius: _dropped, ...rest } = ir.shape;
    return { ...ir, shape: rest };
}

/** One axis of the border, the other two left as they are (D1); undefined removes it, and an empty border goes. */
export function withBorderAxis(
    ir: GraphVertexViewIR, axis: BorderAxis, next: NonNullable<Shape['border']>[BorderAxis] | undefined,
): GraphVertexViewIR {
    const border: Record<string, unknown> = { ...(ir.shape.border ?? {}) };
    if (next === undefined) delete border[axis];
    else border[axis] = next;
    if (Object.keys(border).length > 0) return withShape(ir, { border: border as Shape['border'] });
    const { border: _dropped, ...rest } = ir.shape;
    return { ...ir, shape: rest };
}

/** One axis of the default size, as typed: empty removes it, and with both gone the key goes (P-2026-09-29-1230). */
export function withDefaultSizeAxis(ir: GraphVertexViewIR, axis: 'width' | 'height', raw: string): GraphVertexViewIR {
    const next: NonNullable<GraphVertexViewIR['defaultSize']> = { ...(ir.defaultSize ?? {}) };
    if (raw.trim() === '') delete next[axis];
    else next[axis] = Math.round(Number(raw));
    if (Object.keys(next).length > 0) return { ...ir, defaultSize: next };
    const { defaultSize: _dropped, ...rest } = ir;
    return rest;
}
