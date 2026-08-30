/**
 * instanceTable — the collection table of the instance manager, as data.
 *
 * Turno 11a of the design handoff: «tabella = le righe del nodo in orizzontale
 * (colonne dai widget della precedenza — swatch, mono, toggle)». This module is
 * the "as data" half of that: it turns a `ClassShape` plus an `idlookup` into
 * columns and cells, each cell carrying the renderer the precedence chose. The
 * TSX that paints them decides nothing.
 *
 * ── The classification is NOT re-derived here ──────────────────────────────────
 *
 * `useFormWidgets.ts:9-15` records that its attribute / enum / reference /
 * composition classification is a COPY of `Info.value`'s, deliberate, and asks
 * that a third copy be extracted rather than written. This module is that
 * request obeyed: the classification comes in already made, from `ClassShape`
 * (`jjform/shape.ts`, produced by `shapeAdapter`), and the rendering comes from
 * `valueRenderer.detectValueRenderer`, which is pure and already owns the ladder.
 * Nothing between the two re-decides what a feature is.
 *
 * Pure: `idlookup` in, plain records out. The three modules it imports have zero
 * imports of their own (`irReadCtx`, `valueRenderer`, `rowViewAnnotations`), so
 * the whole chain stays loadable under the node test environment.
 */

import { findFeatureRaw, makeDrawReadCtx } from '../../editor-v2/viewpoint/ir/irReadCtx';
import { readRowViewAnnotations } from '../../editor-v2/nodes/rowViewAnnotations';
import {
    detectValueRenderer,
    type RendererDecision,
    type SlotShape,
} from '../../editor-v2/nodes/valueRenderer';
import type { AttrShape, ClassShape, IncomingRef, MetamodelShape, RefShape } from '../../../jjform';
import { multiplicity, tableFeatures } from '../../../jjform';

type Idlookup = Record<string, any>;

export interface TableColumn {
    key: string;
    /** What the header prints. The feature name; the metamodel's own word. */
    label: string;
    kind: 'attr' | 'ref';
    typeName: string;
    /** `0..1`, `1..*` — shown in the header tooltip, not as a second line. */
    multiplicity: string;
    required: boolean;
    derived: boolean;
    readOnly: boolean;
    many: boolean;
}

export interface TableCell {
    /** One line of text, whatever the renderer. A table cell is one line: the
     *  drawer (`IRForm`) is where a value gets room. */
    text: string;
    decision: RendererDecision;
    /** How many values the slot holds. `> 1` is what the `collection` renderer
     *  reports, and the count is kept separately so the cell can print `+2`
     *  beside the first value rather than only a bare count. */
    count: number;
    broken: boolean;
    /** A REQUIRED feature holding no value at all. Not the same fact as `broken`,
     *  which is a pointer that does not resolve: this is the other half of what
     *  contract section 2 calls a broken ref ("missing id or empty"), and it is
     *  the state a dirty delete leaves behind. Measured 2026-08-30: the core's
     *  delete removes each incoming pointer BY VALUE, so the referrer is left with
     *  an empty slot, and without this flag the cell would print a dash - the
     *  silent emptiness ratified rule 2 of 12d forbids. */
    missingRequired: boolean;
}

export interface TableRow {
    id: string;
    name: string;
    cells: Record<string, TableCell>;
    /** Non-containment incoming pointers only — an owner is not a referrer.
     *  This is the delete preflight of 12d, computed here so the column and the
     *  future dialogue read one number. */
    referencedBy: IncomingRef[];
    /** Everything the search matches against, lowercased once per row rather
     *  than per keystroke. */
    haystack: string;
}

/** Columns of a metaclass: attributes then references, children excluded.
 *  A containment list is not a column — it is a sub-form (Turno 10a). */
export function tableColumns(cls: ClassShape): TableColumn[] {
    return tableFeatures(cls).map((f: AttrShape | RefShape) => ({
        key: f.key,
        label: f.key,
        kind: ('of' in f ? 'ref' : 'attr') as 'attr' | 'ref',
        typeName: 'of' in f ? f.of : f.typeName,
        multiplicity: multiplicity(f),
        required: f.required,
        derived: f.derived,
        readOnly: f.readOnly,
        many: f.many,
    }));
}

/** Display text of one raw slot value, for a table cell.
 *  A reference resolves to the target's NAME; an enum literal to its own name;
 *  anything else prints as it is stored. Returns null for a pointer that does
 *  not resolve — the caller turns that into brokenness, which is a different
 *  fact from an empty value. */
function displayValue(
    idlookup: Idlookup,
    raw: unknown,
    feature: AttrShape | RefShape,
    shape: MetamodelShape,
): string | null {
    if (raw == null || raw === '') return '';
    if ('of' in feature) {
        const target = idlookup[String(raw)];
        if (!target) return null;                      // dangling pointer
        return String(target.name ?? target.initialName ?? '');
    }
    if (feature.type === 'enum' && feature.enum) {
        const literals = shape.enums[feature.enum]?.literals ?? [];
        const byId = literals.find(l => l.id === raw);
        if (byId) return byId.name;
        // The XMI importer writes the literal NAME where the editors write its
        // pointer (`useFormWidgets.normalizeEnumValues` reconciles the same two
        // writers). A name that matches a literal passes through as itself; one
        // that matches nothing passes through too — it may be a literal removed
        // from the enum, which is a conformance problem to report, not one to
        // silently rewrite.
        return String(raw);
    }
    return String(raw);
}

/** The `SlotShape` `valueRenderer` reads, built for one (instance, feature).
 *  Exported for the tests, which drive it on plain dictionaries. */
export function slotShapeFor(
    idlookup: Idlookup,
    instanceId: string,
    feature: AttrShape | RefShape,
    shape: MetamodelShape,
): { slot: SlotShape; count: number; broken: boolean } {
    const dValue = findFeatureRaw(idlookup, instanceId, feature.key);
    const rawValues: unknown[] = Array.isArray(dValue?.values) ? dValue.values : [];
    // Holes are values that were cleared in place (`formWrite.clearSlotValue`
    // leaves one rather than shortening the array), and they are not values.
    const filled = rawValues.filter(v => v != null && String(v).trim() !== '');

    const texts: string[] = [];
    let broken = false;
    for (const raw of filled) {
        const t = displayValue(idlookup, raw, feature, shape);
        if (t === null) broken = true;
        else texts.push(t);
    }

    const isRef = 'of' in feature;
    const ann = readRowViewAnnotations(idlookup, feature.id);
    const enumLiteralNames = !isRef && feature.type === 'enum' && feature.enum
        ? (shape.enums[feature.enum]?.literals ?? []).map(l => l.name)
        : undefined;

    const slot: SlotShape = {
        value: texts[0] ?? '',
        values: texts,
        isReference: isRef,
        isMany: feature.many,
        typeName: isRef ? feature.of : feature.typeName,
        enumLiteralNames,
        featureName: feature.key,
        rendererOverride: ann.renderer ?? undefined,
        unit: ann.unit ?? undefined,
        min: ann.min ?? undefined,
        max: ann.max ?? undefined,
        // Brokenness is per SLOT, not per value: one dangling pointer among three
        // still makes the cell say so, because the row's job is to flag that the
        // model needs attention, not to hide it behind two good values.
        isBroken: broken,
    };
    return { slot, count: filled.length, broken };
}

/**
 * One row: every cell of one instance, plus what points at it.
 *
 * `referencedByAll` is passed in rather than computed, because the walk needs the
 * impure adapter (`shapeAdapter.referencedBy`) and this module is pure. Callers
 * that do not care pass `[]`.
 */
export function tableRow(
    idlookup: Idlookup,
    instanceId: string,
    cls: ClassShape,
    shape: MetamodelShape,
    referencedByAll: IncomingRef[] = [],
): TableRow {
    const ctx = makeDrawReadCtx(idlookup);
    const name = ctx.getName(instanceId) ?? '';
    const cells: Record<string, TableCell> = {};
    const bits: string[] = [name];

    for (const feature of tableFeatures(cls)) {
        const { slot, count, broken } = slotShapeFor(idlookup, instanceId, feature, shape);
        const decision = detectValueRenderer(slot);
        const text = slot.values?.join(', ') ?? '';
        cells[feature.key] = {
            text, decision, count, broken,
            // A derived feature is computed, not held: an empty one is not a model
            // the user has to repair, and flagging it would put a warning on every
            // row of a metamodel that declares one.
            missingRequired: feature.required && count === 0 && !broken && !feature.derived,
        };
        if (text) bits.push(text);
    }

    return {
        id: instanceId,
        name,
        cells,
        // An owner is not a referrer: counting containment here would put a 1 on
        // every contained instance in the model and make the column meaningless.
        referencedBy: referencedByAll.filter(r => !r.composition),
        haystack: bits.join('  ').toLowerCase(),
    };
}

/**
 * Filter rows by a free-text query.
 *
 * Matches the instance NAME and every string a cell prints — which is what
 * «Search…» in Turno 11a offers over a collection. Multi-word queries are ANDed
 * across the row, not matched as a phrase: typing two words the user saw in two
 * different columns should find the row.
 */
export function filterRows(rows: TableRow[], query: string): TableRow[] {
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (terms.length === 0) return rows;
    return rows.filter(r => terms.every(t => r.haystack.includes(t)));
}
