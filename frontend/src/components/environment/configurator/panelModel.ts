/**
 * panelModel — the pure rules of the Configurator panel (#187, P-2026-10-14-1100).
 *
 * The panel (`ConfiguratorPanel`) is the end user's surface of an element: a header band, then
 * three sections, Identity / Attributes / Components (#187 task 6). What it decides on data and
 * not on the DOM lives here, so it can be executed under node: the panel itself imports the
 * `joiner` barrel and does not load in the test bench (root CLAUDE.md §5).
 *
 * Nothing here imports the runtime. `orderFields` comes from `formHosts`, which imports types
 * only: the order of the Data Manager's view is applied by the same function the form uses.
 */

import { orderFields } from '../../editor-v2/viewpoint/ir/formHosts';
import type { FormSpec } from '../../editor-v2/viewpoint/ir/irTypes';
import { isRoleWidget, widgetChoicesFor } from '../../../joiner/environmentConfig';

// ── Cardinality (#187 tasks 7 and 8) ────────────────────────────────────────

/** The four labels of #187 task 8, Juri's wording in #166 (2026-10-07), accepted by @tmaog. */
export type CardinalityLabel = 'Optional, single' | 'Required, single' | 'Zero or more values' | 'Required, multiple';

/** The label of a feature's bounds. `upper` -1 is unbounded; a bounded upper above 1 reads as
 *  multiple, its bound being said by the «+ Add» that is disabled once it is reached. */
export function cardinalityLabel(lower: number, upper: number): CardinalityLabel {
    const required = lower >= 1;
    if (upper === 1) return required ? 'Required, single' : 'Optional, single';
    return required ? 'Required, multiple' : 'Zero or more values';
}

/** What a field title prints between parentheses: «derived», or the label, followed on a
 *  multi-valued feature by how many values it holds (@tmaog's «[3]», #166, 2026-10-07). */
export function cardinalityText(f: { lower: number; upper: number; derived?: boolean; count?: number }): string {
    if (f.derived) return 'derived';
    const label = cardinalityLabel(f.lower, f.upper);
    return f.upper !== 1 && typeof f.count === 'number' ? `${label} · ${f.count}` : label;
}

/** The Ecore primitive types, by the name the metamodel spells. */
const ECORE_PRIMITIVES: ReadonlySet<string> = new Set([
    'EString', 'EInt', 'EDouble', 'EBoolean', 'EFloat', 'ELong', 'EShort', 'EChar', 'EDate', 'EByte',
]);

/** The type as a title prints it: a primitive without its Ecore `E` (the mockup's «[String]»,
 *  «[Int]»), every other name as it is. */
export function typeLabel(typeName: string): string {
    return ECORE_PRIMITIVES.has(typeName) ? typeName.slice(1) : typeName;
}

// ── The three sections (#187 tasks 6 and 9) ─────────────────────────────────

/** The section keys, in the order the panel renders them. */
export type SectionKey = 'identity' | 'attributes' | 'components';
export const SECTION_KEYS: readonly SectionKey[] = ['identity', 'attributes', 'components'];

/** The feature that holds the name when the class declares one (root CLAUDE.md §3.12). */
const NAME_KEY = 'name';

export interface PartitionInput {
    name: string;
    isReference: boolean;
    isComposition: boolean;
}

export interface Partition<F> {
    /** The `name` attribute, or null when the class has none (the name is then `DObject.name`). */
    identity: F | null;
    /** Every attribute but the name, in the incoming order. */
    attributes: F[];
    /** References and compositions together (task 9), in the incoming order. */
    components: F[];
}

/** Split described fields into the three sections. Order is kept: the caller has already
 *  applied the view's order. */
export function partitionFields<F extends PartitionInput>(fields: readonly F[]): Partition<F> {
    let identity: F | null = null;
    const attributes: F[] = [];
    const components: F[] = [];
    for (const field of fields) {
        if (field.isReference || field.isComposition) components.push(field);
        else if (field.name === NAME_KEY && identity === null) identity = field;
        else attributes.push(field);
    }
    return { identity, attributes, components };
}

/** A component is a composition (created only, task 9) or a reference (picked or created).
 *  An aggregation is a reference, as the shape files it (`shape.refs`). */
export function componentKind(ref: { composition: boolean }): 'composition' | 'reference' {
    return ref.composition ? 'composition' : 'reference';
}

/**
 * The components of an instance in the order they render: the instance's own slot order, then
 * the view's `order` (named ones first, R-VP-13). A component the slot order does not name keeps
 * its incoming position after the named ones. Returns a new array.
 */
export function orderComponents<C extends { key: string }>(
    components: readonly C[],
    slotOrder: readonly string[],
    specOrder?: readonly string[],
): C[] {
    const at = new Map(slotOrder.map((k, i) => [k, i]));
    const bySlot = components
        .map((c, i) => ({ c, i, s: at.get(c.key) ?? Number.MAX_SAFE_INTEGER }))
        .sort((a, b) => (a.s - b.s) || (a.i - b.i))
        .map((x) => x.c);
    const spec: FormSpec | undefined = specOrder ? { order: [...specOrder] } : undefined;
    return orderFields(bySlot.map((c) => ({ name: c.key, c })), spec).map((x) => x.c);
}

// ── Folds, remembered per metaclass ────────────────────────────────────────

export const FOLD_PREFIX = 'jjodel.cfgPanel.folds.';

/** The localStorage key of a metaclass's folded sections. */
export function foldKey(classId: string): string {
    return FOLD_PREFIX + classId;
}

function isSectionKey(v: unknown): v is SectionKey {
    return typeof v === 'string' && (SECTION_KEYS as readonly string[]).includes(v);
}

/** The stored folds. Absent, corrupt or foreign input reads as nothing folded: a convenience,
 *  never a reason to break the panel. */
export function parseFolds(raw: string | null | undefined): Set<SectionKey> {
    if (!raw) return new Set();
    try {
        const parsed: unknown = JSON.parse(raw);
        return Array.isArray(parsed) ? new Set(parsed.filter(isSectionKey)) : new Set();
    } catch {
        return new Set();
    }
}

/** The folds as stored, in section order. */
export function serializeFolds(folds: ReadonlySet<SectionKey>): string {
    return JSON.stringify(SECTION_KEYS.filter((k) => folds.has(k)));
}

// ── Create controls ────────────────────────────────────────────────────────

export type ControlState = 'enabled' | 'disabled' | 'hidden';

/**
 * «+ Add <Type>» and «+ New»: hidden when the feature is read-only or the role forbids the create
 * (a disabled control was reported as misleading in the field test of #157, R4); disabled with its
 * reason at the upper bound or on a target that cannot be instantiated (abstract, singleton);
 * enabled otherwise.
 */
export function createControl(c: { writable: boolean; reason: string | null }): { state: ControlState; reason: string | null } {
    if (!c.writable) return { state: 'hidden', reason: null };
    if (c.reason) return { state: 'disabled', reason: c.reason };
    return { state: 'enabled', reason: null };
}

/**
 * Where «+ New» writes the target it creates on a reference slot (R-REF-4): the raw index to set,
 * `'append'`, or null when it is not offered. A multi-valued slot appends below its upper bound;
 * an empty single-valued one sets the index the slot links at; from the picker of a filled single
 * card (`rowIndex`) the new target replaces the row's, which is unlinked and never deleted, when
 * the row may change.
 */
export function newTargetAt(
    ref: { upper: number },
    controls: { link: number | 'append' | null; rows: ReadonlyArray<{ index: number; actions: readonly string[] }> },
    rowIndex?: number,
): number | 'append' | null {
    if (ref.upper !== 1) return controls.link === 'append' ? 'append' : null;
    if (rowIndex === undefined) return typeof controls.link === 'number' ? controls.link : null;
    const row = controls.rows.find((r) => r.index === rowIndex);
    return row && row.actions.includes('change') ? rowIndex : null;
}

/**
 * «Remove from the list» on a reference row, and «(none)» in its picker (R-CFG-7, P-2026-10-20-1123):
 * the unlink of the row, never a delete. A multi-valued row follows its own `remove`, as `jjform/refSlot`
 * rules it. A single-valued row is unlinked whenever the viewer may change it, required ones included:
 * `refSlot` gives `change` exactly when the slot is writable and the value is not locked, and withholds
 * `remove` from a required single (R-REF-3, which the Data Manager keeps). An empty required slot is left
 * to the validation to report.
 */
export function canUnlink(ref: { upper: number }, row: { actions: readonly string[] }): boolean {
    if (row.actions.includes('remove')) return true;
    return ref.upper === 1 && row.actions.includes('change');
}

// ── The role's widget (#186 «Customize element», P-2026-10-17-1053) ─────────

/**
 * How a role's widget renders through the form's own widgets, or null for «what the panel renders
 * without a presentation». The field's descriptor takes `widget`; `cellWidget` replaces the width map's
 * widget name on its cell, so an explicit «input» is not turned into an extended widget; `multiline`
 * is the layout annotation that gives the growing textarea at span 12 (not the JjEL box of
 * `WidgetKind.textarea`); `numberInput` hides the stepper's two buttons (a text field would write the
 * number as a string, measured in the Phase 1 report §4.4); `dropdown` is the panel's own dropdown.
 * A widget the field does not offer (`widgetChoicesFor`) or of the other family than its derived widget
 * is ignored: a presentation written before the metamodel changed still renders.
 */
export interface RoleRendering {
    widget: 'text' | 'number';
    cellWidget?: 'text' | 'number';
    multiline?: true;
    numberInput?: true;
    dropdown?: 'string' | 'number';
}

export function roleRendering(
    widget: unknown,
    f: { typeName: string; isEnum: boolean; isMultivalued: boolean; isReadOnly: boolean; derivedWidget: string },
): RoleRendering | null {
    if (!isRoleWidget(widget) || !widgetChoicesFor(f).includes(widget)) return null;
    const family = widget === 'input' || widget === 'textarea' || widget === 'dropdown' ? 'text' : 'number';
    if (f.derivedWidget !== family) return null;
    switch (widget) {
        case 'input': return { widget: 'text', cellWidget: 'text' };
        case 'textarea': return { widget: 'text', multiline: true };
        case 'dropdown': return { widget: 'text', dropdown: 'string' };
        case 'stepper': return { widget: 'number', cellWidget: 'number' };
        case 'number-input': return { widget: 'number', cellWidget: 'number', numberInput: true };
        case 'number-dropdown': return { widget: 'number', dropdown: 'number' };
        default: return null;
    }
}

// ── Header band ────────────────────────────────────────────────────────────

/** The issues chip: «No issues», or the counts with their plurals. */
export function issuesText(errors: number, warnings: number): string {
    const parts: string[] = [];
    if (errors > 0) parts.push(`${errors} ${errors === 1 ? 'error' : 'errors'}`);
    if (warnings > 0) parts.push(`${warnings} ${warnings === 1 ? 'warning' : 'warnings'}`);
    return parts.length ? parts.join(', ') : 'No issues';
}

/** The save status beside Save, read off `U.isProjectModified`. */
export function saveStatus(projectModified: boolean): 'Unsaved' | 'Saved' {
    return projectModified ? 'Unsaved' : 'Saved';
}

/** One line of an element's key fields (`referenceSummary`), as a card prints it. */
export function summaryLine(items: ReadonlyArray<{ label: string; text: string }>): string {
    return items.map((s) => `${s.label}: ${s.text}`).join(' · ');
}
