/**
 * widgetRenderer - what a `FormSpec.widgets` entry says about the RENDERER, and
 * whether it covers what the metamodel declares.
 *
 * Design handoff: `Instance Node Proposal.dc.html`, Turno 7c.
 *
 *   «La view vince, ma non in silenzio.»
 *
 * ── Why a mapping is needed at all ─────────────────────────────────────────────
 *
 * The two surfaces speak two vocabularies for one question. `FormSpec.widgets`
 * names an EDITOR (`text`, `color`, `number`), because the form's job is to let a
 * value be changed; `RendererKind` names a RENDERING (`truncatedText`, `swatch`,
 * `numberUnit`), because the row's job is to show one. They were never meant to be
 * the same list - the widget vocabulary is a superset of `FieldSegment.editable`'s
 * and predates the renderer library - so the correspondence has to be written down
 * once, here, rather than re-derived at each of the two surfaces that need it.
 *
 * ── What "covers" means ────────────────────────────────────────────────────────
 *
 * A view override is only worth announcing when it CHANGES the answer. If the view
 * declares `color` on a feature the metamodel already declares as a swatch, the two
 * agree: there is no provenance to show, no badge, and the inspector's chip stays
 * `auto`, because nothing about the rendering is the view's doing. The badge, rung 0
 * and the Reset appear only when the widget maps to a DIFFERENT renderer, or to none
 * at all - which is the definition ratified with the design (2026-08-29).
 *
 * Pure module: no React, no Redux. `valueRenderer.ts` is pure too.
 */

import {
    metamodelRenderer,
    type MetamodelRendererVerdict,
    type RendererKind,
    type SlotShape,
} from '../../nodes/valueRenderer';
import type { WidgetKind } from './irTypes';

/**
 * Widget -> the renderer it asks for. Total over `WidgetKind`: every widget names a
 * rendering, even when the two words differ (`text` asks for `truncatedText`, the
 * library's floor and the "plain text" of 7c's footer; `textarea` asks for `code`,
 * which is what the monospace renderer is called here).
 *
 * `reference` and `link` both land on `refPill`: a link IS the pill, drawn as a link.
 *
 * Three renderers have NO widget - `date`, `progress` and `truncatedText`'s siblings
 * `dash`, `collection`, `brokenRef`. A form cannot ask for them, which is correct:
 * `dash`, `collection` and `brokenRef` are states of the value rather than choices,
 * and `date`/`progress` are settled by the declared type and its bounds. They can
 * only ever come from the metamodel side of the comparison.
 */
export const WIDGET_RENDERER: Readonly<Record<WidgetKind, RendererKind>> = {
    text: 'truncatedText',
    textarea: 'code',
    select: 'enumChip',
    checkbox: 'boolean',
    color: 'swatch',
    number: 'numberUnit',
    reference: 'refPill',
    link: 'refPill',
};

/** The renderer a widget asks for; null for a value outside the vocabulary. */
export function rendererForWidget(widget: string | undefined): RendererKind | null {
    if (!widget) return null;
    return WIDGET_RENDERER[widget as WidgetKind] ?? null;
}

/**
 * Does the metamodel say anything about this feature's rendering?
 *
 * True for a `jjodel/renderer=…` declaration and for a type that settles the question
 * on its own (`Color`, `EBoolean`, a date, a number, an enumeration, a reference).
 * False only for the floor - `metamodelRenderer`'s own «no metamodel rule settles
 * this; instances decide by value» - because there is nothing there for a view to
 * cover.
 */
export function metamodelDeclares(verdict: MetamodelRendererVerdict): boolean {
    return verdict.fromDeclaration || verdict.kind !== 'truncatedText';
}

export interface ViewRendererOverride {
    /** The widget the view declared, verbatim. */
    widget: WidgetKind;
    /** The renderer it asks for, or null when the widget is outside the vocabulary. */
    viewRenderer: RendererKind | null;
    /** What the metamodel says, and why. */
    metamodel: MetamodelRendererVerdict;
}

/**
 * The view's override of a metamodel-declared renderer, or null when there is nothing
 * to announce.
 *
 * Null in three cases, and they are three different facts that produce the same
 * silence on purpose: the view declared no widget for this feature; the metamodel
 * declares nothing for it to cover; or the two agree.
 */
export function viewRendererOverride(
    slot: SlotShape,
    widget: string | undefined,
): ViewRendererOverride | null {
    if (!widget || !(widget in WIDGET_RENDERER)) return null;
    const verdict = metamodelRenderer(slot);
    if (!metamodelDeclares(verdict)) return null;
    const viewRenderer = rendererForWidget(widget);
    if (viewRenderer !== null && viewRenderer === verdict.kind) return null;
    return { widget: widget as WidgetKind, viewRenderer, metamodel: verdict };
}

/**
 * The view's ir with one feature's widget entry removed - the Reset of Turno 7c, as a
 * pure function so the canvas inspector performs exactly the write the Form tab does.
 *
 * The pruning rules are `FormAuthoringBody.pruneForm`'s, restated here rather than
 * imported: a canvas node must not depend on the authoring panel, which is the wrong
 * direction for that edge. `__tests__/widgetRenderer.test.ts` asserts the two agree, so
 * the restatement cannot drift silently.
 *
 *  - `widgets` disappears when its last entry does, never stays as `{}`;
 *  - `form` disappears when IT is empty, never stays as `{}`;
 * because the saved IR has no VersionFixer (R-B9) and an empty object left behind is
 * left behind for good.
 *
 * Returns the ir UNCHANGED (same reference) when there is nothing to remove: the caller
 * can then skip the write entirely instead of committing a no-op that costs an undo step.
 */
export function withoutViewWidget<T extends { form?: { widgets?: Record<string, unknown> } }>(
    ir: T,
    featureName: string,
): T {
    const widgets = ir.form?.widgets;
    if (!widgets || widgets[featureName] === undefined) return ir;

    const nextWidgets = { ...widgets };
    delete nextWidgets[featureName];

    const nextForm: Record<string, unknown> = { ...ir.form };
    if (Object.keys(nextWidgets).length === 0) delete nextForm.widgets;
    else nextForm.widgets = nextWidgets;

    const next: Record<string, unknown> = { ...ir };
    if (Object.keys(nextForm).length === 0) delete next.form;
    else next.form = nextForm;
    return next as T;
}
