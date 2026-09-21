/**
 * previewInstances — per-instance resolution of the Symbol modal preview strip
 * (slice 5, D8-a and D8-b).
 *
 * The strip shows up to three REAL instances of the view. Each tile needs two things
 * the modal cannot read off the IR alone: the axis values that instance resolves to,
 * and a caption saying WHY it looks that way — which rule won, or that none did.
 *
 * Both are computed here, in a module the node test bench can import: only
 * `irCompile` (types plus `parsePathExpr`), `conditional.ts` and `borderOverrides.ts`,
 * all pure. No React, no Redux, no `joiner` — that barrel pulls Monaco and
 * dereferences `window` at import time, which is why `borderOverrides.ts` exists at
 * all (its header) and why the `IRSectionId` import below is `import type`: erased at
 * compile, it never reaches the bundle. Turning it into a value import would take the
 * whole panel's dependency graph with it.
 *
 * The caption follows the ACTIVE SECTION (D8-a), because that is what the author is
 * looking at: on an axis section with a conditional axis it answers "which rule", on
 * every other section it stays the size caption the strip has shown since D8 wiring.
 * The size caption is handed in already formatted (`captionForBox`), so this module
 * owns the CHOICE and not the formatting of a box it never sees.
 */

import type { Conditional, Predicate, ShapeForm, VertexViewIR } from '../ir/irTypes';
import type { ReadCtx } from '../ir/irReadCtx';
import { matchIndexOf } from '../ir/irCompile';
import { authoredCornerRadius } from '../ir/shapeRegistry';
import { formatPredicate, isConditionalValue, toRules } from '../../../ui/ConditionalEditor/conditional';
import { BORDER_AXES } from './borderOverrides';
import type { IRSectionId } from './irTabs';

/** Caption word for "no rule won" on an axis section. The border says `base` instead. */
export const OTHERWISE_CAPTION = 'otherwise';
/** Caption word for "no OVERRIDES row holds" in the Border section. */
export const BASE_CAPTION = 'base';

/** One instance the strip must draw. */
export interface PreviewInstanceInput {
    /** DObject id of the instance — `idlookup[vertexId].model`, never the vertex id. */
    readonly objectId: string;
    /**
     * The size caption of this tile, already formatted by `captionForBox` against this
     * instance's own box and its own manual/derived source (D8-d). Used verbatim
     * wherever the active section has no rule to report.
     */
    readonly sizeCaption: string;
}

/** The axes one instance resolves to, plus the caption of its tile. */
export interface ResolvedPreviewInstance {
    readonly objectId: string;
    readonly form: ShapeForm;
    readonly fill?: string;
    readonly borderColor?: string;
    readonly borderWidth?: number;
    readonly borderStyle?: 'solid' | 'dashed' | 'dotted' | 'double';
    readonly marker?: string;
    /**
     * The radius this instance draws, px: guarded like the canvas (`authoredCornerRadius`),
     * `undefined` when the axis is absent or resolves to nothing, so the tile keeps the
     * form's base radius. Not a preset axis, so it travels beside the preset.
     */
    readonly cornerRadius?: number;
    readonly caption: string;
}

/**
 * The value a `Conditional<T>` takes on one element: the `then` of the winning rule,
 * the `default` (the `else` of a `{when, then, else}`) when none wins, `undefined`
 * when the axis is absent.
 *
 * Same semantics as `compileConditional`, expressed through the one thing it exports
 * — `matchIndexOf` — so the strip and the canvas resolve by the same rule order
 * rather than by two copies of it. `fallback` is left to the caller: it differs per
 * axis and only `form` has one that is not "no override".
 */
export function resolveConditional<T>(c: Conditional<T> | undefined, ctx: ReadCtx, id: string): T | undefined {
    const rf = toRules(c);
    const i = matchIndexOf(c, ctx, id);
    if (i === null) return rf.default;
    return rf.rules[i]?.then;
}

/**
 * The predicates of the Border OVERRIDES rows, in the row order of
 * `borderOverrideRows`: first seen across color, width, style, de-duplicated by
 * structural equality of `when` (the predicate is plain data, so its JSON is the
 * identity — the same key `borderOverrideRows` groups on).
 *
 * It exists because `BorderOverrideRow` carries `whenText` and not `when`, so the row
 * a caption must evaluate cannot be asked of it. The two derivations are pinned
 * together by an executed test: rendered through `formatPredicate`, this list must
 * equal `borderOverrideRows(border).rows.map(r => r.whenText)`.
 */
export function borderRowPredicates(border: VertexViewIR['shape']['border']): Predicate[] {
    const out: Predicate[] = [];
    const seen = new Set<string>();
    for (const axis of BORDER_AXES) {
        const rules = toRules(border?.[axis] as any).rules ?? [];
        for (const r of rules) {
            const key = JSON.stringify(r.when ?? null);
            if (seen.has(key)) continue;
            seen.add(key);
            out.push(r.when);
        }
    }
    return out;
}

/**
 * The radius a thumbnail draws when the strip's per-instance resolution is not
 * available (the chip and the symbolic preview): the scalar when it is a number, the
 * `otherwise` of the rules when it is conditional, `undefined` (the form's base radius)
 * when the axis is absent or the value is not usable. One expression because `toRules`
 * moves a scalar into `default`, the same idiom the modal uses for the form's fallback.
 * It lives here and not in the modal, which does not load in the node test bench.
 */
export function thumbnailCornerRadius(c: Conditional<number> | undefined): number | undefined {
    return authoredCornerRadius(toRules(c).default);
}

/** True when `when` holds for this element. One rule, so the rule order plays no part. */
function holds(when: Predicate, ctx: ReadCtx, id: string): boolean {
    return matchIndexOf({ rules: [{ when, then: true }] }, ctx, id) === 0;
}

/** The axis a section reports on, or null for a section that reports no rule. */
function axisOfSection(
    shape: VertexViewIR['shape'],
    section: IRSectionId | undefined,
): Conditional<unknown> | undefined | null {
    if (section === 'symbol') return shape.form;
    if (section === 'fill') return shape.fill;
    if (section === 'marker') return shape.marker;
    return null;
}

/**
 * The display name of an instance: its `name` feature through the same `ReadCtx` the
 * axes are resolved with. `#1, #2, #3` in DOM order when it has none — which is the
 * unresolvable case, not "the class declares no `name`": there `getName` still answers
 * the D-layer `DObject.name` (irReadCtx.ts:166-174).
 */
export function instanceLabel(ctx: ReadCtx, objectId: string, index: number): string {
    const name = ctx.getName(objectId);
    return typeof name === 'string' && name !== '' ? name : `#${index + 1}`;
}

/**
 * The caption of one tile (D8-a).
 *
 * - Symbol / Fill / Marker, axis conditional: `<instance> · <winning predicate>`, and
 *   `otherwise` when no rule wins. Symbol reads `otherwise` like the others because
 *   its table closes with the same «Otherwise» row since the shape-axis rules table.
 * - Border, at least one of the three axes conditional: the FIRST OVERRIDES row whose
 *   predicate holds, `base` when none does. First and not last: the rows are the rules
 *   in first-match-wins order, and a caption naming a later row would name a rule the
 *   canvas did not apply.
 * - Everything else — Padding, Sizing, Badges, Text, and an axis section whose axis is
 *   scalar: the size caption, unchanged. Size information where size is the point.
 */
export function captionForInstance(
    shape: VertexViewIR['shape'],
    section: IRSectionId | undefined,
    ctx: ReadCtx,
    input: PreviewInstanceInput,
    index: number,
): string {
    const label = instanceLabel(ctx, input.objectId, index);
    if (section === 'border') {
        const anyConditional = BORDER_AXES.some((a) => isConditionalValue(shape.border?.[a]));
        if (!anyConditional) return input.sizeCaption;
        const winner = borderRowPredicates(shape.border).find((w) => holds(w, ctx, input.objectId));
        return `${label} · ${winner ? formatPredicate(winner) : BASE_CAPTION}`;
    }
    const axis = axisOfSection(shape, section);
    if (axis === null || !isConditionalValue(axis)) return input.sizeCaption;
    const i = matchIndexOf(axis as Conditional<unknown>, ctx, input.objectId);
    const rules = toRules(axis as Conditional<unknown>).rules;
    const text = i === null ? OTHERWISE_CAPTION : formatPredicate(rules[i].when);
    return `${label} · ${text}`;
}

/**
 * The strip, resolved: one entry per instance, in the order it was handed in (DOM
 * order), each carrying the axis values that instance draws with and its caption.
 *
 * `form` falls back to `'rect'` — the same fallback `compileConditional` receives at
 * `irCompile.ts:305`, so a tile never draws a form the canvas would not. The other
 * axes stay `undefined` when they resolve to nothing: absent means "no override", and
 * inventing a value here would paint a border the canvas does not paint.
 */
export function resolvePreviewInstances(
    shape: VertexViewIR['shape'],
    section: IRSectionId | undefined,
    ctx: ReadCtx,
    instances: readonly PreviewInstanceInput[],
): ResolvedPreviewInstance[] {
    return instances.map((input, index) => {
        const id = input.objectId;
        return {
            objectId: id,
            form: resolveConditional<ShapeForm>(shape.form, ctx, id) ?? 'rect',
            fill: resolveConditional<string>(shape.fill, ctx, id),
            borderColor: resolveConditional<string>(shape.border?.color, ctx, id),
            borderWidth: resolveConditional<number>(shape.border?.width, ctx, id),
            borderStyle: resolveConditional<'solid' | 'dashed' | 'dotted' | 'double'>(shape.border?.style, ctx, id),
            marker: resolveConditional<string>(shape.marker, ctx, id),
            cornerRadius: authoredCornerRadius(resolveConditional<number>(shape.cornerRadius, ctx, id)),
            caption: captionForInstance(shape, section, ctx, input, index),
        };
    });
}
