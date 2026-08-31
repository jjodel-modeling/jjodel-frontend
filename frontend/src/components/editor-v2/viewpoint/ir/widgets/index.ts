/**
 * The extended widget registry — name → component, as a data table.
 *
 * FL3 builds the write-side twins; FL1 (`jjform/layout.ts`) decides WHICH one a
 * field gets and says so by NAME, because «a name crosses the module boundary, a
 * component would not». This module is the other end of that boundary: it holds no
 * resolution rule of its own and imports nothing from FL1, so the two halves can be
 * written in parallel and meet in FL4.
 *
 * The keys are `FormWidget`'s spelling, verbatim, so FL4 has nothing to translate.
 * Nine names, six components — three components serve two entries each, and the
 * `widget` prop tells them which (see `widgetProps.ts`).
 *
 * OPEN vocabulary, the same shape as `markerRegistry` and for the same reason: a
 * name outside the table resolves to null and the host renders what it would have
 * rendered before, rather than the form failing over a widget it does not know.
 *
 * ── What is NOT here ──────────────────────────────────────────────────────────
 *
 * `toggle`, `segmented`, `select`, `number`, `text`, `code` and `picker`. Those are
 * the widgets the form already has, dispatched inline by `IRFormField`; this table
 * is the EXTENSION, and merging it with the existing dispatch is FL4's job. In
 * particular the key `textarea` here is the growing prose box of the width map, NOT
 * `WidgetKind`'s `textarea`, which is the fixed 44–56px JjEL expression editor
 * `TextWidget` renders. Two vocabularies, one word: FL4 has to keep them apart.
 *
 * The stylesheet is imported HERE and not by each component, so a host that renders
 * a widget out of this table always gets its look with it.
 */

import type { ComponentType } from 'react';
import type { ExtendedWidgetProps } from './widgetProps';
import ChipInputWidget from './ChipInputWidget';
import ColorWidget from './ColorWidget';
import DateWidget from './DateWidget';
import DurationWidget from './DurationWidget';
import GrowTextWidget from './GrowTextWidget';
import ValidatedTextWidget from './ValidatedTextWidget';
import './formWidgets.scss';

export type { ExtendedWidgetProps, WidgetChip } from './widgetProps';

export interface ExtendedWidgetDef {
    /** The registry key, repeated in the value the way every registry here does, so
     *  an entry passed around alone still knows what it is. */
    readonly id: string;
    /** For the authoring panel's widget table, when it learns these. */
    readonly label: string;
    readonly component: ComponentType<ExtendedWidgetProps>;
}

const def = (id: string, label: string, component: ComponentType<ExtendedWidgetProps>): ExtendedWidgetDef =>
    ({ id, label, component });

export const EXTENDED_WIDGETS: Readonly<Record<string, ExtendedWidgetDef>> = {
    date: def('date', 'Date', DateWidget),
    datetime: def('datetime', 'Date and time', DateWidget),
    duration: def('duration', 'Duration', DurationWidget),
    color: def('color', 'Colour', ColorWidget),
    email: def('email', 'Email', ValidatedTextWidget),
    url: def('url', 'URL', ValidatedTextWidget),
    textarea: def('textarea', 'Multiline text', GrowTextWidget),
    richtext: def('richtext', 'Rich text', GrowTextWidget),
    chips: def('chips', 'Chip input', ChipInputWidget),
};

/** The definition for a name, or null when this table does not cover it. Null is
 *  the answer for `text` and `number` too: they are not missing, they are elsewhere. */
export function extendedWidget(name: string | undefined | null): ExtendedWidgetDef | null {
    if (!name) return null;
    return EXTENDED_WIDGETS[name] ?? null;
}

export { ChipInputWidget, ColorWidget, DateWidget, DurationWidget, GrowTextWidget, ValidatedTextWidget };
