import React from 'react';
import { ListEditor, Input, Select, Checkbox, ConditionalEditor, type PathBuilderFeatures } from '../../../ui';
import { FieldSegmentEditor } from './FieldSegmentEditor';
import type { FieldCompartmentSpec, FieldSegment } from '../ir/irTypes';

const SOURCE_OPTIONS = [
    { value: 'attributes', label: 'Attributes' },
    { value: 'references', label: 'References' },
];

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

                return (
                    <>
                        <div className="jj-field">
                            <label className="jj-field-label">Id</label>
                            <Input value={comp.id} onChange={(e) => replace(index, { ...comp, id: e.target.value })} />
                        </div>

                        <div className="jj-field">
                            <label className="jj-field-label">Source</label>
                            <Select
                                options={SOURCE_OPTIONS}
                                value={comp.source.from}
                                onChange={(e) => replace(index, { ...comp, source: { from: e.target.value as 'attributes' | 'references' } })}
                            />
                        </div>

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

                        <div className="jj-field">
                            <label className="jj-field-label">Separator</label>
                            <Checkbox
                                checked={comp.separator === true}
                                onChange={(c) => replace(index, { ...comp, separator: c })}
                                label="row separators"
                            />
                        </div>

                        <div className="jj-field">
                            <label className="jj-field-label">Visible</label>
                            <ConditionalEditor
                                value={comp.visible}
                                onChange={(next) => replace(index, { ...comp, visible: next })}
                                renderValue={(v, onCh) => <Checkbox checked={v} onChange={onCh} label="visible" />}
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
