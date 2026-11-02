/**
 * Whether the canvas hands React Flow `onlyRenderVisibleElements` (P-2026-11-02-0020).
 *
 * The prop unmounts every node out of view. Two pieces of the IR rendering need the node
 * mounted to be right: a graphVertex container, whose decoration looped under the prop, and
 * a node whose box `useContentDrivenSize` writes from its content (a form with a size
 * supplement, or a view `defaultSize`), whose box went stale or missing off screen after a
 * viewpoint switch. Both measured by the five lanes parked on branch `only-visible-wip`
 * (P-2026-11-01-0040..2335). So the prop is on with no IR viewpoint, and under one only when
 * no view that can draw an object on canvas is of either kind.
 *
 * Conservative on purpose: a view counts when it is a CANDIDATE for the class of an object
 * on canvas (exact, inherited or wildcard, pins honoured as `resolveIRView` honours them),
 * its predicate unevaluated, and a form counts in every branch of its conditional. The
 * answer is then a function of the viewpoint and of the classes on canvas only: a slot edit
 * cannot turn a node content-sized under a prop decided before it.
 */

import { pinAccepts, type IRViewpointIndex, type IndexEntry } from './viewpoint/ir/irResolveCore';
import { classAncestry } from './viewpoint/ir/irReadCtx';
import type { ShapeForm } from './viewpoint/ir/irTypes';
import { getShapeDescriptor, hasSizeSupplement } from './viewpoint/ir/shapeRegistry';
import { authoredDefaultSize } from './nodes/nodeSizing';

/**
 * Every value a `Conditional<ShapeForm>` can resolve to. The three shapes are told apart as
 * `compileConditional` (irCompile.ts) tells them apart, and a missing `else` or `default`
 * is the `'rect'` it falls back to.
 */
export function formsOf(form: unknown): unknown[] {
    if (form === undefined) return ['rect'];
    if (typeof form !== 'object' || form === null || (!('when' in form) && !('rules' in form))) return [form];
    const c = form as { then?: unknown; else?: unknown; rules?: { then?: unknown }[]; default?: unknown };
    if ('when' in form) return [c.then, c.else !== undefined ? c.else : 'rect'];
    const rules = Array.isArray(c.rules) ? c.rules.map(r => r?.then) : [];
    return [...rules, c.default !== undefined ? c.default : 'rect'];
}

/**
 * Whether a node drawn by this view needs to stay mounted: a graphVertex, or a box that
 * `useContentDrivenSize` writes, that is a view `defaultSize` with a usable axis or a form
 * whose sizing carries a supplement (`hasSizeSupplement`), in any branch.
 */
export function viewNeedsMount(compiled: { kind: string; ir: unknown }): boolean {
    if (compiled.kind === 'graphVertex') return true;
    const ir = compiled.ir as { defaultSize?: unknown; shape?: { form?: unknown } } | null | undefined;
    if (authoredDefaultSize(ir?.defaultSize) !== undefined) return true;
    return formsOf(ir?.shape?.form).some(f => hasSizeSupplement(getShapeDescriptor(f as ShapeForm)));
}

/**
 * Whether React Flow may render only the elements in view: true with no IR index, false
 * with a container on canvas or with a candidate view of an object on canvas that needs
 * its node mounted (`viewNeedsMount`).
 */
export function canRenderOnlyVisible(
    index: Pick<IRViewpointIndex, 'byMetaclass' | 'wildcard'> | null,
    idlookup: Record<string, any>,
    objectIds: Iterable<string>,
    containerCount: number,
): boolean {
    if (!index) return true;
    if (containerCount > 0) return false;
    const classIds = new Set<string>();
    for (const objectId of objectIds) {
        const metaclassId = idlookup[objectId]?.instanceof;
        if (typeof metaclassId === 'string') classIds.add(metaclassId);
    }
    const checked = new Set<IndexEntry>();
    const needs = (e: IndexEntry): boolean => {
        if (checked.has(e)) return false;
        checked.add(e);
        return viewNeedsMount(e.compiled);
    };
    for (const classId of classIds) {
        // As resolveIRView: a class missing from the lookup has no candidate, the wildcard included.
        const ancestry = classAncestry(idlookup, classId);
        if (ancestry.length === 0) continue;
        for (const a of ancestry) {
            for (const e of index.byMetaclass.get(a.name) ?? []) {
                if (pinAccepts(e, a.name, a.id) && needs(e)) return false;
            }
        }
        for (const e of index.wildcard) if (needs(e)) return false;
    }
    return true;
}
