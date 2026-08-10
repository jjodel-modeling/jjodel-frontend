import React from 'react';
import { ListEditor, Input, Select, Toggle, HelpText, ConditionalEditor, forPredicateKind, type PathBuilderFeatures } from '../../../ui';
import { FieldSegmentEditor } from './FieldSegmentEditor';
import type { FieldCompartmentSpec, FieldSegment, Predicate } from '../ir/irTypes';

const SOURCE_OPTIONS = [
    { value: 'attributes', label: 'Attributes' },
    { value: 'references', label: 'References' },
    { value: 'children', label: 'Children (row dispatch)' },
];

/** The source kinds this editor can author in Basic. A persisted source with any
 *  other `from` (a future schema extension, a hand-edited view) is preserved
 *  verbatim: no handler rewrites it. */
const KNOWN_SOURCES: readonly string[] = ['attributes', 'references', 'children'];

// --- pure preserve-verbatim helpers (exported for unit tests) ---
// These encode the whole "what is representable in Basic vs preserved verbatim"
// decision. The render uses them directly, so a test on them tests the real path.

/** True iff `from` is a source this editor can author. Unknown = read-only badge. */
export const isKnownCompartmentSource = (from: string): boolean => KNOWN_SOURCES.includes(from);

export type ChildFilterKind = 'none' | 'basic-iskind' | 'advanced';
/**
 * Classify a `children` source filter for the Basic editor:
 *  - 'none'         → no filter (all containment children);
 *  - 'basic-iskind' → exactly `{op:'isKind', class}` (editable inline);
 *  - 'advanced'     → any other predicate, incl. isKind carrying a `path`
 *                     (read-only chip, preserved verbatim — never rewritten).
 */
export function classifyChildFilter(filter: Predicate | undefined): ChildFilterKind {
    if (filter === undefined) return 'none';
    if (filter.op === 'isKind' && filter.path === undefined) return 'basic-iskind';
    return 'advanced';
}

/**
 * Rebuild a compartment's `source` for an explicit user pick on the source Select.
 * Only ever called from the Select onChange (a deliberate user action), never on
 * mount/re-render — so it never rewrites a source implicitly. Switching to
 * `children` starts with no filter; other fields (id, rowFormat, visible) are kept.
 */
export function withCompartmentSource(comp: FieldCompartmentSpec, from: string): FieldCompartmentSpec {
    if (from === 'children') return { ...comp, source: { from: 'children' } };
    if (from === 'references') return { ...comp, source: { from: 'references' } };
    return { ...comp, source: { from: 'attributes' } };
}

/**
 * Rebuild a `children` compartment's filter. `undefined` drops the `filter` KEY
 * (source becomes the bare `{from:'children'}`), mirroring the rest/spread removal
 * used for the top-level predicate — so an unchecked filter round-trips byte-identical
 * to a children source authored without any filter.
 */
export function withChildFilter(comp: FieldCompartmentSpec, next: Predicate | undefined): FieldCompartmentSpec {
    return { ...comp, source: next === undefined ? { from: 'children' } : { from: 'children', filter: next } };
}

/** Read-only chip for values not representable in Basic (preserved verbatim). Same
 *  visual convention as LabelEntryEditor's CHIP — inline style, no new CSS class. */
const CHIP: React.CSSProperties = {
    display: 'inline-block',
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-tertiary)',
    fontStyle: 'italic',
    padding: '2px 6px',
    border: '1px dashed var(--color-border-primary)',
    borderRadius: 'var(--radius-sm)',
};

/** New compartment default (prompt B2a): attributes source with a single name segment. */
const newCompartment = (): FieldCompartmentSpec => ({
    id: '',
    source: { from: 'attributes' },
    rowFormat: { segments: [{ kind: 'name' }] },
});
/** New segment default (prompt B2a): a blank literal. */
const newSegment = (): FieldSegment => ({ kind: 'literal', text: '' });

export interface FieldCompartmentListEditorProps {
    compartments: FieldCompartmentSpec[];
    /** Feature descriptors for the target metaclass; null = PathBuilder disabled. */
    features: PathBuilderFeatures | null;
    featuresHint?: string;
    /** All project class names — for the `isKind` selector in the conditional editor. */
    classNames: string[];
    onChange: (compartments: FieldCompartmentSpec[]) => void;
}

/**
 * FieldCompartmentListEditor — the `fieldCompartments[]` list. Each compartment
 * carries id, source (attributes|references), a nested reorderable list of row
 * segments (FieldSegmentEditor) and a `separator` flag. `visible`
 * (Conditional<boolean>) is read-only and round-trips verbatim (phase B2b). No
 * hand-rolled id-uniqueness check — structural errors surface through
 * validateIR/compileView like every other IR error.
 */
export const FieldCompartmentListEditor: React.FC<FieldCompartmentListEditorProps> = ({
    compartments,
    features,
    featuresHint,
    classNames,
    onChange,
}) => {
    const replace = (index: number, comp: FieldCompartmentSpec) => {
        const next = [...compartments];
        next[index] = comp;
        onChange(next);
    };
    const remove = (index: number) => {
        const next = [...compartments];
        next.splice(index, 1);
        onChange(next);
    };
    const move = (index: number, delta: number) => {
        const j = index + delta;
        if (j < 0 || j >= compartments.length) return;
        const next = [...compartments];
        [next[index], next[j]] = [next[j], next[index]];
        onChange(next);
    };

    return (
        <ListEditor<FieldCompartmentSpec>
            items={compartments}
            onRemove={remove}
            onMove={move}
            onAdd={() => onChange([...compartments, newCompartment()])}
            addLabel="Add compartment"
            emptyHint="No compartments."
            itemLabel={(c, i) => (c.id ? `Compartment "${c.id}"` : `Compartment #${i + 1}`)}
            renderItem={(comp, index) => {
                const segments = comp.rowFormat.segments;
                const setSegments = (segs: FieldSegment[]) =>
                    replace(index, { ...comp, rowFormat: { ...comp.rowFormat, segments: segs } });

                const removeSegment = (si: number) => {
                    const n = [...segments];
                    n.splice(si, 1);
                    setSegments(n);
                };
                const moveSegment = (si: number, delta: number) => {
                    const j = si + delta;
                    if (j < 0 || j >= segments.length) return;
                    const n = [...segments];
                    [n[si], n[j]] = [n[j], n[si]];
                    setSegments(n);
                };
                const replaceSegment = (si: number, seg: FieldSegment) => {
                    const n = [...segments];
                    n[si] = seg;
                    setSegments(n);
                };

                // --- source (attributes | references | children) ---
                // Runtime string compare (not the union type) so a persisted unknown
                // `from` falls through to the read-only badge instead of being coerced.
                const sourceFrom = comp.source.from as string;
                const isKnownSource = isKnownCompartmentSource(sourceFrom);
                const isSlotSource = sourceFrom === 'attributes' || sourceFrom === 'references';
                // Only fired by an explicit user pick on the Select — never on mount/re-render.
                const changeSource = (from: string) => replace(index, withCompartmentSource(comp, from));

                // --- children filter (isKind Basic case; anything else preserved verbatim) ---
                const childFilter = comp.source.from === 'children' ? comp.source.filter : undefined;
                const childFilterKind = classifyChildFilter(childFilter);
                const isBasicIsKind = childFilterKind === 'basic-iskind';
                const isAdvancedFilter = childFilterKind === 'advanced';
                const setChildFilter = (next: Predicate | undefined) => replace(index, withChildFilter(comp, next));

                return (
                    <>
                        <div className="jj-field">
                            <label className="jj-field-label">Id</label>
                            <Input value={comp.id} onChange={(e) => replace(index, { ...comp, id: e.target.value })} />
                        </div>

                        <div className="jj-field">
                            <label className="jj-field-label">Source</label>
                            {isKnownSource ? (
                                <Select
                                    options={SOURCE_OPTIONS}
                                    value={comp.source.from}
                                    onChange={(e) => changeSource(e.target.value)}
                                />
                            ) : (
                                <span style={CHIP}>{`unsupported source: ${sourceFrom} (preserved)`}</span>
                            )}
                        </div>

                        {comp.source.from === 'children' && (
                            <div className="jj-field">
                                <label className="jj-field-label">Filter by metaclass (isKind)</label>
                                {isAdvancedFilter ? (
                                    <span style={CHIP}>advanced predicate (preserved)</span>
                                ) : (
                                    <>
                                        <Toggle
                                            checked={isBasicIsKind}
                                            onChange={(checked) => setChildFilter(checked ? forPredicateKind('isKind', classNames) : undefined)}
                                            size="xs"
                                        />
                                        {isBasicIsKind && childFilter && childFilter.op === 'isKind' && (
                                            <Select
                                                options={classNames.map((n) => ({ value: n, label: n }))}
                                                value={childFilter.class}
                                                onChange={(e) => setChildFilter({ op: 'isKind', class: e.target.value })}
                                            />
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                        {isSlotSource ? (
                            <div className="jj-field">
                                <label className="jj-field-label">Row segments</label>
                                <ListEditor<FieldSegment>
                                    items={segments}
                                    onRemove={removeSegment}
                                    onMove={moveSegment}
                                    onAdd={() => setSegments([...segments, newSegment()])}
                                    addLabel="Add segment"
                                    emptyHint="No segments."
                                    itemLabel={(seg, si) => `Segment #${si + 1} — ${seg.kind}`}
                                    renderItem={(seg, si) => (
                                        <FieldSegmentEditor segment={seg} onChange={(s) => replaceSegment(si, s)} />
                                    )}
                                />
                            </div>
                        ) : comp.source.from === 'children' ? (
                            <div className="jj-field">
                                <label className="jj-field-label">Row segments</label>
                                <HelpText>Rows are rendered by the row view of each child (dispatch by metaclass); the format is defined in the views of kind "row", not here.</HelpText>
                            </div>
                        ) : null}

                        <div className="jj-field">
                            <label className="jj-field-label">Row separators</label>
                            <Toggle
                                checked={comp.separator === true}
                                onChange={(c) => replace(index, { ...comp, separator: c })}
                                size="xs"
                            />
                        </div>

                        <div className="jj-field">
                            <label className="jj-field-label">Visible</label>
                            <ConditionalEditor
                                value={comp.visible}
                                onChange={(next) => replace(index, { ...comp, visible: next })}
                                renderValue={(v, onCh) => <Toggle checked={v} onChange={onCh} size="xs" />}
                                defaultValue={true}
                                features={features}
                                featuresHint={featuresHint}
                                classNames={classNames}
                            />
                        </div>
                    </>
                );
            }}
        />
    );
};

export default FieldCompartmentListEditor;
