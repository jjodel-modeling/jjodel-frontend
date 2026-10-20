import React from 'react';

/** One drawn target of a reference slot: its position in the raw `values` array and the pointer. */
export interface InfoReferenceTarget { rawIndex: number; id: string; name: string; cls: string }

/** The slot as `Info.references` collects it; `lv` is the LValue, reduced to what is read here. */
export interface InfoReferenceSlot<LV extends { readonly validTargetsJSX: React.ReactNode }> {
    key: string; name: string; lv: LV; upper: number; lower: number; multi: boolean; targets: InfoReferenceTarget[];
}

export interface InfoReferenceSlotsProps<LV extends { readonly validTargetsJSX: React.ReactNode }> {
    slots: InfoReferenceSlot<LV>[];
    openTarget: (id: string) => void;
    writeAt: (lv: LV, index: number, raw: string) => void;
    appendTarget: (lv: LV, raw: string) => void;
}

/**
 * The body of the «References» section of `Info.references` (#142), moved out of `Info.tsx` so
 * that it is only evaluated when the section is open: `Info.tsx` passes it as the child of its
 * CollapsibleSection, which mounts children only while open. Each slot reads
 * `lv.validTargetsJSX` once — on a large model one read scans every object of the model
 * (discovery_2026-10-20_large_model_click_profile.md §4.3).
 * React only: no joiner import, so the vitest bench can load it.
 */
export function InfoReferenceSlots<LV extends { readonly validTargetsJSX: React.ReactNode }>(props: InfoReferenceSlotsProps<LV>) {
    const { slots, openTarget, writeAt, appendTarget } = props;
    return (<>
                {slots.map(slot => {
                    const isRequiredSingle = slot.upper === 1 && slot.lower >= 1;
                    const belowUpper = slot.upper === -1 || slot.targets.length < slot.upper;
                    // One read per slot, shared by every select of the slot: each read rebuilds the
                    // list from the whole model.
                    const options = slot.lv.validTargetsJSX;
                    return (
                        <div className="jj-ref-slot" key={slot.key}>
                            <div className="jj-ref-slot-head">
                                <span className="jj-ref-slot-name">{slot.name}</span>
                                <span className="jj-ref-slot-mult">[{slot.lower}..{slot.upper === -1 ? '*' : slot.upper}]</span>
                            </div>

                            {slot.targets.map(t => (
                                <div className="jj-slot-value-row jj-ref-row" key={t.rawIndex + ':' + t.id}>
                                    <select
                                        className="jj-slot-value-select"
                                        value={t.id}
                                        onChange={e => writeAt(slot.lv, t.rawIndex, e.target.value)}
                                    >
                                        {/* A single optional ref clears via "-----"; a multivalued
                                            one clears via the «×», so no empty option there. */}
                                        {!slot.multi && !isRequiredSingle && <option value="undefined">-----</option>}
                                        {options}
                                    </select>
                                    <button
                                        type="button"
                                        className="jj-ref-open"
                                        title="Open the referenced element — edits the shared instance"
                                        onClick={() => openTarget(t.id)}
                                    >
                                        <i className="bi bi-box-arrow-in-right" aria-hidden="true" />
                                    </button>
                                    {!isRequiredSingle && (
                                        <button
                                            type="button"
                                            className="jj-slot-value-delete"
                                            title="Remove this reference"
                                            onClick={() => writeAt(slot.lv, t.rawIndex, 'undefined')}
                                        >×</button>
                                    )}
                                </div>
                            ))}

                            {/* Empty single ref: a select to set it. */}
                            {!slot.multi && slot.targets.length === 0 && (
                                <div className="jj-slot-value-row jj-ref-row">
                                    <select
                                        className="jj-slot-value-select"
                                        value="undefined"
                                        onChange={e => writeAt(slot.lv, 0, e.target.value)}
                                    >
                                        <option value="undefined">-----</option>
                                        {options}
                                    </select>
                                </div>
                            )}

                            {/* Multivalued add: append the chosen target. */}
                            {slot.multi && belowUpper && (
                                <div className="jj-slot-value-row jj-ref-row jj-ref-row--add">
                                    <select
                                        className="jj-slot-value-select"
                                        value="undefined"
                                        onChange={e => appendTarget(slot.lv, e.target.value)}
                                    >
                                        <option value="undefined">+ add {slot.name}…</option>
                                        {options}
                                    </select>
                                </div>
                            )}
                        </div>
                    );
                })}
    </>);
}
